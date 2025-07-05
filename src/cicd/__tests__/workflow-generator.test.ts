import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import yaml from 'js-yaml';
import { WorkflowGenerator } from '../workflow-generator.js';
import { ParsedGrammar } from '../../types/grammar.js';
import { GLSPConfig } from '../../config/types.js';
import { DEFAULT_CONFIG } from '../../config/default-config.js';

describe('WorkflowGenerator', () => {
    let generator: WorkflowGenerator;
    let tempDir: string = '';
    
    beforeEach(async () => {
        generator = new WorkflowGenerator();
        tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'workflow-gen-'));
    });
    
    afterEach(async () => {
        await fs.remove(tempDir);
    });
    
    const mockGrammar: ParsedGrammar = {
        projectName: 'TestDSL',
        interfaces: [
            {
                name: 'Node',
                superTypes: [],
                properties: [
                    { name: 'id', type: 'string', optional: false, array: false },
                    { name: 'name', type: 'string', optional: false, array: false }
                ]
            }
        ],
        types: []
    };
    
    describe('generate', () => {
        test('should generate all workflow files by default', async () => {
            const files = await generator.generate(mockGrammar, DEFAULT_CONFIG, tempDir);
            
            expect(files).toContain(path.join(tempDir, '.github/workflows/build.yml'));
            expect(files).toContain(path.join(tempDir, '.github/workflows/release.yml'));
            expect(files).toContain(path.join(tempDir, '.github/workflows/security.yml'));
            expect(files).toContain(path.join(tempDir, '.github/workflows/dependencies.yml'));
            expect(files).toContain(path.join(tempDir, '.github/workflows/nightly.yml'));
            
            // Check all files exist
            for (const file of files) {
                expect(await fs.pathExists(file)).toBe(true);
            }
        });
        
        test('should generate valid YAML files', async () => {
            const files = await generator.generate(mockGrammar, DEFAULT_CONFIG, tempDir);
            
            for (const file of files) {
                const content = await fs.readFile(file, 'utf-8');
                // Should not throw
                const parsed = yaml.load(content);
                expect(parsed).toBeDefined();
            }
        });
        
        test('should respect generation options', async () => {
            const files = await generator.generate(mockGrammar, DEFAULT_CONFIG, tempDir, {
                generateBuildWorkflow: true,
                generateReleaseWorkflow: false,
                generateSecurityWorkflow: false,
                generateDependencyUpdateWorkflow: false,
                generateNightlyWorkflow: false
            });
            
            expect(files).toHaveLength(1);
            expect(files[0]).toContain('build.yml');
        });
        
        test('should include specified platforms in build workflow', async () => {
            await generator.generate(mockGrammar, DEFAULT_CONFIG, tempDir, {
                platforms: ['ubuntu-latest', 'windows-latest', 'macos-latest']
            });
            
            const buildFile = path.join(tempDir, '.github/workflows/build.yml');
            const content = await fs.readFile(buildFile, 'utf-8');
            
            expect(content).toContain('ubuntu-latest');
            expect(content).toContain('windows-latest');
            expect(content).toContain('macos-latest');
        });
        
        test('should include specified Node versions', async () => {
            await generator.generate(mockGrammar, DEFAULT_CONFIG, tempDir, {
                nodeVersions: ['14.x', '16.x', '18.x']
            });
            
            const buildFile = path.join(tempDir, '.github/workflows/build.yml');
            const content = await fs.readFile(buildFile, 'utf-8');
            
            expect(content).toContain('14.x');
            expect(content).toContain('16.x');
            expect(content).toContain('18.x');
        });
        
        test('should conditionally include E2E tests', async () => {
            await generator.generate(mockGrammar, DEFAULT_CONFIG, tempDir, {
                includeE2ETests: false
            });
            
            const buildFile = path.join(tempDir, '.github/workflows/build.yml');
            const content = await fs.readFile(buildFile, 'utf-8');
            
            expect(content).not.toContain('E2E Tests');
            expect(content).not.toContain('playwright');
        });
        
        test('should conditionally include coverage', async () => {
            await generator.generate(mockGrammar, DEFAULT_CONFIG, tempDir, {
                includeCoverage: true,
                coverageThreshold: 90
            });
            
            const buildFile = path.join(tempDir, '.github/workflows/build.yml');
            const content = await fs.readFile(buildFile, 'utf-8');
            
            expect(content).toContain('coverage');
            expect(content).toContain('90');
            expect(content).toContain('codecov');
        });
        
        test('should include npm publishing when enabled', async () => {
            await generator.generate(mockGrammar, DEFAULT_CONFIG, tempDir, {
                publishToNpm: true,
                publishToOpenVsx: false
            });
            
            const releaseFile = path.join(tempDir, '.github/workflows/release.yml');
            const content = await fs.readFile(releaseFile, 'utf-8');
            
            expect(content).toContain('yarn publish');
            expect(content).toContain('NPM_TOKEN');
            expect(content).not.toContain('ovsx publish');
        });
        
        test('should include Open VSX publishing when enabled', async () => {
            await generator.generate(mockGrammar, DEFAULT_CONFIG, tempDir, {
                publishToNpm: false,
                publishToOpenVsx: true
            });
            
            const releaseFile = path.join(tempDir, '.github/workflows/release.yml');
            const content = await fs.readFile(releaseFile, 'utf-8');
            
            expect(content).toContain('ovsx publish');
            expect(content).toContain('OVSX_TOKEN');
            expect(content).not.toContain('npm publish');
        });
        
        test('should include Docker support in release workflow', async () => {
            await generator.generate(mockGrammar, DEFAULT_CONFIG, tempDir);
            
            const releaseFile = path.join(tempDir, '.github/workflows/release.yml');
            const content = await fs.readFile(releaseFile, 'utf-8');
            
            expect(content).toContain('docker build');
            expect(content).toContain('docker push');
            expect(content).toContain('ghcr.io');
        });
        
        test('should generate security workflow with all scanners', async () => {
            await generator.generate(mockGrammar, DEFAULT_CONFIG, tempDir);
            
            const securityFile = path.join(tempDir, '.github/workflows/security.yml');
            const content = await fs.readFile(securityFile, 'utf-8');
            
            // Check for various security tools
            expect(content).toContain('dependency-review-action');
            expect(content).toContain('codeql-action');
            expect(content).toContain('snyk/actions');
            expect(content).toContain('yarn audit');
            expect(content).toContain('trufflesecurity/trufflehog');
        });
        
        test('should use Yarn 1.22 in all workflows', async () => {
            const files = await generator.generate(mockGrammar, DEFAULT_CONFIG, tempDir);
            
            for (const file of files) {
                const content = await fs.readFile(file, 'utf-8');
                if (content.includes('yarn')) {
                    expect(content).toContain('yarn@1.22.19');
                }
            }
        });
    });
});