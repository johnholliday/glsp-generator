import fs from 'fs-extra';
import path from 'path';
import { ParsedGrammar } from '../types/grammar.js';
import { GLSPConfig } from '../config/types.js';
import { WorkflowGenerator, WorkflowGeneratorOptions } from './workflow-generator.js';
import { ReleaseScriptsGenerator, ReleaseScriptsOptions } from './release-scripts.js';
import { SupportingFilesGenerator, SupportingFilesOptions } from './supporting-files.js';
import chalk from 'chalk';

export interface CICDGeneratorOptions {
    workflows?: WorkflowGeneratorOptions;
    releaseScripts?: ReleaseScriptsOptions;
    supportingFiles?: SupportingFilesOptions;
    generateAll?: boolean;
    platforms?: string[];
    nodeVersions?: string[];
    publishTargets?: ('npm' | 'ovsx')[];
    containerSupport?: boolean;
    monorepoSupport?: boolean;
}

export interface CICDGeneratorResult {
    success: boolean;
    filesGenerated: string[];
    errors?: string[];
}

export class CICDGenerator {
    private workflowGenerator: WorkflowGenerator;
    private releaseScriptsGenerator: ReleaseScriptsGenerator;
    private supportingFilesGenerator: SupportingFilesGenerator;
    
    constructor() {
        this.workflowGenerator = new WorkflowGenerator();
        this.releaseScriptsGenerator = new ReleaseScriptsGenerator();
        this.supportingFilesGenerator = new SupportingFilesGenerator();
    }
    
    async generate(
        grammar: ParsedGrammar,
        config: GLSPConfig,
        outputDir: string,
        options: CICDGeneratorOptions = {}
    ): Promise<CICDGeneratorResult> {
        const errors: string[] = [];
        const allGeneratedFiles: string[] = [];
        
        try {
            console.log(chalk.blue('🚀 Generating CI/CD configuration...'));
            
            // Default options
            const opts = {
                generateAll: true,
                platforms: ['ubuntu-latest', 'windows-latest'],
                nodeVersions: ['16.x', '18.x', '20.x'],
                publishTargets: ['npm', 'ovsx'] as ('npm' | 'ovsx')[],
                containerSupport: true,
                monorepoSupport: false,
                ...options
            };
            
            // Workflow options
            const workflowOpts: WorkflowGeneratorOptions = {
                generateBuildWorkflow: true,
                generateReleaseWorkflow: true,
                generateSecurityWorkflow: true,
                generateDependencyUpdateWorkflow: true,
                generateNightlyWorkflow: true,
                nodeVersions: opts.nodeVersions,
                platforms: opts.platforms,
                includeE2ETests: true,
                includeCoverage: true,
                coverageThreshold: 80,
                publishToNpm: opts.publishTargets.includes('npm'),
                publishToOpenVsx: opts.publishTargets.includes('ovsx'),
                ...(options.workflows || {})
            };
            
            // Release scripts options
            const releaseOpts: ReleaseScriptsOptions = {
                generateVersionScripts: true,
                generateChangelogScripts: true,
                generatePublishScripts: true,
                generateReleaseScript: true,
                conventionalCommits: true,
                semanticRelease: false,
                ...(options.releaseScripts || {})
            };
            
            // Supporting files options
            const supportingOpts: SupportingFilesOptions = {
                generateNpmIgnore: true,
                generateVscodeIgnore: true,
                generateChangelog: true,
                generateContributing: true,
                generateIssueTemplates: true,
                generatePullRequestTemplate: true,
                generateCodeOfConduct: true,
                generateSecurity: true,
                generateDockerfile: opts.containerSupport,
                generateDependabot: true,
                ...(options.supportingFiles || {})
            };
            
            // Generate workflows
            console.log(chalk.gray('  • Generating GitHub Actions workflows...'));
            try {
                const workflowFiles = await this.workflowGenerator.generate(
                    grammar,
                    config,
                    outputDir,
                    workflowOpts
                );
                allGeneratedFiles.push(...workflowFiles);
                console.log(chalk.green(`    ✓ Generated ${workflowFiles.length} workflow files`));
            } catch (error) {
                errors.push(`Failed to generate workflows: ${error}`);
                console.log(chalk.red(`    ✗ Failed to generate workflows`));
            }
            
            // Generate release scripts
            console.log(chalk.gray('  • Generating release scripts...'));
            try {
                const scriptFiles = await this.releaseScriptsGenerator.generate(
                    grammar,
                    config,
                    outputDir,
                    releaseOpts
                );
                allGeneratedFiles.push(...scriptFiles);
                console.log(chalk.green(`    ✓ Generated ${scriptFiles.length} release scripts`));
            } catch (error) {
                errors.push(`Failed to generate release scripts: ${error}`);
                console.log(chalk.red(`    ✗ Failed to generate release scripts`));
            }
            
            // Generate supporting files
            console.log(chalk.gray('  • Generating supporting files...'));
            try {
                const supportingFiles = await this.supportingFilesGenerator.generate(
                    grammar,
                    config,
                    outputDir,
                    supportingOpts
                );
                allGeneratedFiles.push(...supportingFiles);
                console.log(chalk.green(`    ✓ Generated ${supportingFiles.length} supporting files`));
            } catch (error) {
                errors.push(`Failed to generate supporting files: ${error}`);
                console.log(chalk.red(`    ✗ Failed to generate supporting files`));
            }
            
            // Create additional CI/CD specific files
            await this.createAdditionalFiles(outputDir, grammar, opts);
            
            // Generate CI/CD summary
            await this.generateCICDSummary(outputDir, allGeneratedFiles, opts);
            
            return {
                success: errors.length === 0,
                filesGenerated: allGeneratedFiles,
                errors: errors.length > 0 ? errors : undefined
            };
            
        } catch (error) {
            errors.push(`CI/CD generation failed: ${error}`);
            return {
                success: false,
                filesGenerated: allGeneratedFiles,
                errors
            };
        }
    }
    
    private async createAdditionalFiles(outputDir: string, grammar: ParsedGrammar, options: any): Promise<void> {
        // Create .github directory structure
        const githubDir = path.join(outputDir, '.github');
        await fs.ensureDir(githubDir);
        
        // Create CODEOWNERS file
        const codeownersPath = path.join(githubDir, 'CODEOWNERS');
        const codeownersContent = `# Code Owners for ${grammar.projectName}

# Default owners for everything
* @your-org/maintainers

# CI/CD configuration
/.github/ @your-org/devops
/scripts/ @your-org/devops

# Documentation
/docs/ @your-org/documentation
*.md @your-org/documentation

# Source code
/src/ @your-org/developers
/test/ @your-org/developers
`;
        await fs.writeFile(codeownersPath, codeownersContent);
        
        // Create funding file
        const fundingPath = path.join(githubDir, 'FUNDING.yml');
        const fundingContent = `# These are supported funding model platforms

github: # Replace with up to 4 GitHub Sponsors-enabled usernames
patreon: # Replace with a single Patreon username
open_collective: # Replace with a single Open Collective username
ko_fi: # Replace with a single Ko-fi username
tidelift: # Replace with a single Tidelift platform-name/package-name
community_bridge: # Replace with a single Community Bridge project-name
liberapay: # Replace with a single Liberapay username
issuehunt: # Replace with a single IssueHunt username
otechie: # Replace with a single Otechie username
custom: # Replace with up to 4 custom sponsorship URLs
`;
        await fs.writeFile(fundingPath, fundingContent);
        
        // Create renovate config if not using dependabot
        if (!options.supportingFiles?.generateDependabot) {
            const renovatePath = path.join(outputDir, 'renovate.json');
            const renovateConfig = {
                extends: [
                    "config:base"
                ],
                packageRules: [
                    {
                        matchPackagePatterns: ["@eclipse-glsp/*"],
                        groupName: "GLSP packages"
                    },
                    {
                        matchPackagePatterns: ["@theia/*"],
                        groupName: "Theia packages"
                    }
                ],
                schedule: ["before 3am on Monday"],
                timezone: "UTC",
                labels: ["dependencies"],
                prConcurrentLimit: 3
            };
            await fs.writeJson(renovatePath, renovateConfig, { spaces: 2 });
        }
        
        // Create .editorconfig
        const editorconfigPath = path.join(outputDir, '.editorconfig');
        const editorconfigContent = `# EditorConfig is awesome: https://EditorConfig.org

# top-most EditorConfig file
root = true

# Unix-style newlines with a newline ending every file
[*]
end_of_line = lf
insert_final_newline = true
charset = utf-8

# 4 space indentation
[*.{ts,tsx,js,jsx,json}]
indent_style = space
indent_size = 4

# 2 space indentation for YAML
[*.{yml,yaml}]
indent_style = space
indent_size = 2

# Tab indentation for Makefiles
[Makefile]
indent_style = tab

# Matches the exact files either package.json or .travis.yml
[{package.json,.travis.yml}]
indent_style = space
indent_size = 2
`;
        await fs.writeFile(editorconfigPath, editorconfigContent);
    }
    
    private async generateCICDSummary(
        outputDir: string,
        generatedFiles: string[],
        options: any
    ): Promise<void> {
        const summaryPath = path.join(outputDir, 'CI_CD_SETUP.md');
        
        const summary = `# CI/CD Setup Guide

## Overview
This project is configured with comprehensive CI/CD pipelines using GitHub Actions.

## Workflows

### Build and Test (build.yml)
Runs on every push and pull request:
- Multi-platform testing: ${options.platforms.join(', ')}
- Node versions: ${options.nodeVersions.join(', ')}
- Runs linting, tests, and builds
- Generates code coverage reports
- Runs E2E tests on Ubuntu

### Release (release.yml)
Triggered by version tags (v*):
- Builds production artifacts
- Creates GitHub releases
- Publishes to: ${options.publishTargets.join(', ')}
${options.containerSupport ? '- Builds and pushes Docker images' : ''}

### Security Scanning (security.yml)
Runs on main branch and weekly:
- Dependency vulnerability scanning
- CodeQL analysis
- Snyk security testing
- License compliance checks

### Dependency Updates (dependencies.yml)
Weekly automated updates:
- Updates npm dependencies
- Groups related packages
- Creates PRs with test results
- Security patches applied automatically

### Nightly Builds (nightly.yml)
Daily unstable builds:
- Full test suite execution
- Performance benchmarks
- Bundle size analysis
- Pre-release publishing

## Scripts

### Version Management
\`\`\`bash
# Bump version
yarn version:patch  # 1.0.0 -> 1.0.1
yarn version:minor  # 1.0.0 -> 1.1.0
yarn version:major  # 1.0.0 -> 2.0.0

# Custom version
yarn version 1.2.3
\`\`\`

### Release Process
\`\`\`bash
# Full release (version, changelog, publish)
yarn release:patch
yarn release:minor
yarn release:major

# Individual steps
yarn changelog      # Generate changelog
yarn publish:all    # Publish to all registries
\`\`\`

## Setup Instructions

### 1. GitHub Secrets
Add these secrets to your repository:
- \`NPM_TOKEN\`: npm authentication token
- \`OVSX_TOKEN\`: Open VSX authentication token
- \`CODECOV_TOKEN\`: Codecov.io token
- \`SNYK_TOKEN\`: Snyk authentication token

### 2. Branch Protection
Enable these rules for the main branch:
- Require pull request reviews
- Require status checks (build, tests)
- Require up-to-date branches
- Include administrators

### 3. Enable Features
- GitHub Pages (for documentation)
- Discussions (for community)
- Security alerts
- Dependabot/Renovate

## Monitoring

### Build Status
- Check Actions tab for workflow runs
- Subscribe to failure notifications
- Review security alerts regularly

### Metrics
- Code coverage: Codecov dashboard
- Bundle size: Check build artifacts
- Performance: Review nightly benchmarks

## Troubleshooting

### Common Issues

1. **Build failures on Windows**
   - Check path separators
   - Verify shell commands

2. **Release workflow fails**
   - Ensure version tag matches package.json
   - Check authentication tokens

3. **Security scan failures**
   - Review and update dependencies
   - Check for false positives

## Maintenance

### Regular Tasks
- Review and merge dependency PRs
- Update Node.js versions in workflows
- Rotate authentication tokens
- Review security policies

### Upgrades
- Update action versions quarterly
- Review deprecated features
- Test major dependency updates

## Generated Files

Total CI/CD files generated: ${generatedFiles.length}

### Workflows
${generatedFiles.filter(f => f.includes('.github/workflows')).map(f => `- ${path.basename(f)}`).join('\n')}

### Scripts
${generatedFiles.filter(f => f.includes('/scripts/')).map(f => `- ${path.basename(f)}`).join('\n')}

### Configuration
${generatedFiles.filter(f => !f.includes('.github') && !f.includes('/scripts/')).map(f => `- ${path.basename(f)}`).join('\n')}
`;
        
        await fs.writeFile(summaryPath, summary);
    }
}