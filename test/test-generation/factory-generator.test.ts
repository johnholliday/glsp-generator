import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { FactoryGenerator } from '../../src/test-generation/factory-generator';
import { ParsedGrammar } from '../../src/types/grammar';

describe('FactoryGenerator', () => {
    let generator: FactoryGenerator;
    let tempDir: string;
    
    beforeEach(async () => {
        generator = new FactoryGenerator();
        tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'factory-gen-'));
    });
    
    afterEach(async () => {
        await fs.remove(tempDir);
    });
    
    describe('generate', () => {
        test('should generate factories for all interfaces', async () => {
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
                    },
                    {
                        name: 'Edge',
                        superTypes: [],
                        properties: [
                            { name: 'id', type: 'string', optional: false, array: false },
                            { name: 'source', type: 'Node', optional: false, array: false },
                            { name: 'target', type: 'Node', optional: false, array: false }
                        ]
                    }
                ],
                types: []
            };
            
            const files = await generator.generate(mockGrammar, tempDir);
            
            // Should generate factory, builder, and mother for each interface
            expect(files).toContain(path.join(tempDir, 'src/test/test-data/factories/node-factory.ts'));
            expect(files).toContain(path.join(tempDir, 'src/test/test-data/factories/node-builder.ts'));
            expect(files).toContain(path.join(tempDir, 'src/test/test-data/factories/node-mother.ts'));
            expect(files).toContain(path.join(tempDir, 'src/test/test-data/factories/edge-factory.ts'));
            expect(files).toContain(path.join(tempDir, 'src/test/test-data/factories/edge-builder.ts'));
            expect(files).toContain(path.join(tempDir, 'src/test/test-data/factories/edge-mother.ts'));
            
            // Should generate index and utility files
            expect(files).toContain(path.join(tempDir, 'src/test/test-data/factories/index.ts'));
            expect(files).toContain(path.join(tempDir, 'src/test/test-data/factories/test-data-utils.ts'));
            expect(files).toContain(path.join(tempDir, 'src/test/test-data/factories/performance-data.ts'));
        });
        
        test('should generate factory with correct methods', async () => {
            const mockGrammar: ParsedGrammar = {
                projectName: 'TestDSL',
                interfaces: [
                    {
                        name: 'Node',
                        superTypes: [],
                        properties: [
                            { name: 'id', type: 'string', optional: false, array: false },
                            { name: 'name', type: 'string', optional: false, array: false },
                            { name: 'tags', type: 'string', optional: true, array: true }
                        ]
                    }
                ],
                types: []
            };
            
            await generator.generate(mockGrammar, tempDir);
            
            const factoryFile = path.join(tempDir, 'src/test/test-data/factories/node-factory.ts');
            const content = await fs.readFile(factoryFile, 'utf-8');
            
            // Check for expected factory methods
            expect(content).toContain('class NodeFactory');
            expect(content).toContain('static create(overrides?: Partial<Node>): Node');
            expect(content).toContain('static createMany(count: number');
            expect(content).toContain('static createId(): NodeId');
            expect(content).toContain('static createInvalid()');
            expect(content).toContain('static createMinimal()');
            expect(content).toContain('static createComplete()');
            expect(content).toContain('static createForSnapshot()');
            expect(content).toContain('static reset()');
            
            // Check for faker imports
            expect(content).toContain("import * as faker from '@faker-js/faker'");
            expect(content).toContain('faker.lorem.word()');
            
            // Check for array property handling
            expect(content).toContain('static createWithLargeArrays');
        });
        
        test('should generate builder with fluent API', async () => {
            const mockGrammar: ParsedGrammar = {
                projectName: 'TestDSL',
                interfaces: [
                    {
                        name: 'Task',
                        superTypes: [],
                        properties: [
                            { name: 'id', type: 'string', optional: false, array: false },
                            { name: 'title', type: 'string', optional: false, array: false },
                            { name: 'assignees', type: 'string', optional: false, array: true }
                        ]
                    }
                ],
                types: []
            };
            
            await generator.generate(mockGrammar, tempDir);
            
            const builderFile = path.join(tempDir, 'src/test/test-data/factories/task-builder.ts');
            const content = await fs.readFile(builderFile, 'utf-8');
            
            // Check for builder pattern methods
            expect(content).toContain('class TaskBuilder');
            expect(content).toContain('static new(id?: TaskId): TaskBuilder');
            expect(content).toContain('withTitle(value: string): TaskBuilder');
            expect(content).toContain('withAssignees(value: string[]): TaskBuilder');
            expect(content).toContain('addAssignee(item: string): TaskBuilder');
            expect(content).toContain('addAssignees(...items: string[]): TaskBuilder');
            expect(content).toContain('build(): Task');
            expect(content).toContain('buildWithDefaults(): Task');
            expect(content).toContain('copy(): TaskBuilder');
        });
        
        test('should generate mother with semantic methods', async () => {
            const mockGrammar: ParsedGrammar = {
                projectName: 'TestDSL',
                interfaces: [
                    {
                        name: 'User',
                        superTypes: [],
                        properties: [
                            { name: 'id', type: 'string', optional: false, array: false },
                            { name: 'name', type: 'string', optional: false, array: false },
                            { name: 'status', type: 'string', optional: false, array: false },
                            { name: 'createdAt', type: 'string', optional: false, array: false }
                        ]
                    }
                ],
                types: []
            };
            
            await generator.generate(mockGrammar, tempDir);
            
            const motherFile = path.join(tempDir, 'src/test/test-data/factories/user-mother.ts');
            const content = await fs.readFile(motherFile, 'utf-8');
            
            // Check for object mother methods
            expect(content).toContain('class UserMother');
            expect(content).toContain('static simple(): User');
            expect(content).toContain('static complex(): User');
            expect(content).toContain('static active(): User'); // because of status property
            expect(content).toContain('static inactive(): User');
            expect(content).toContain('static withError(): User');
            expect(content).toContain('static named(name: string): User'); // because of name property
            expect(content).toContain('static withLongName(): User');
            expect(content).toContain('static new(): User'); // because of createdAt property
            expect(content).toContain('static old(): User');
            expect(content).toContain('static forScenario(scenario: string): User');
        });
        
        test('should generate edge case methods for different property types', async () => {
            const mockGrammar: ParsedGrammar = {
                projectName: 'TestDSL',
                interfaces: [
                    {
                        name: 'Config',
                        superTypes: [],
                        properties: [
                            { name: 'id', type: 'string', optional: false, array: false },
                            { name: 'value', type: 'string', optional: false, array: false },
                            { name: 'port', type: 'number', optional: false, array: false },
                            { name: 'enabled', type: 'boolean', optional: false, array: false }
                        ]
                    }
                ],
                types: []
            };
            
            await generator.generate(mockGrammar, tempDir);
            
            const factoryFile = path.join(tempDir, 'src/test/test-data/factories/config-factory.ts');
            const content = await fs.readFile(factoryFile, 'utf-8');
            
            // Check for edge case methods
            expect(content).toContain('static createWithEdgeCaseStrings()');
            expect(content).toContain('static createWithEdgeCaseNumbers()');
            expect(content).toContain('Number.MAX_SAFE_INTEGER');
            expect(content).toContain('Number.MIN_SAFE_INTEGER');
            expect(content).toContain('<script>alert("xss")</script>');
        });
        
        test('should respect generation options', async () => {
            const mockGrammar: ParsedGrammar = {
                projectName: 'TestDSL',
                interfaces: [
                    {
                        name: 'Node',
                        superTypes: [],
                        properties: [
                            { name: 'id', type: 'string', optional: false, array: false }
                        ]
                    }
                ],
                types: []
            };
            
            // Generate only factories, not builders or mothers
            const files = await generator.generate(mockGrammar, tempDir, {
                generateModelFactories: true,
                generateBuilders: false,
                generateMothers: false
            });
            
            // Should only generate factory files
            const factoryFiles = files.filter(f => f.includes('-factory.ts'));
            const builderFiles = files.filter(f => f.includes('-builder.ts'));
            const motherFiles = files.filter(f => f.includes('-mother.ts'));
            
            expect(factoryFiles.length).toBeGreaterThan(0);
            expect(builderFiles.length).toBe(0);
            expect(motherFiles.length).toBe(0);
        });
        
        test('should generate test data utilities', async () => {
            const mockGrammar: ParsedGrammar = {
                projectName: 'TestDSL',
                interfaces: [
                    {
                        name: 'Node',
                        superTypes: [],
                        properties: [
                            { name: 'id', type: 'string', optional: false, array: false }
                        ]
                    }
                ],
                types: []
            };
            
            await generator.generate(mockGrammar, tempDir);
            
            const utilsFile = path.join(tempDir, 'src/test/test-data/factories/test-data-utils.ts');
            const content = await fs.readFile(utilsFile, 'utf-8');
            
            // Check for utility functions
            expect(content).toContain('export function createModelGraph');
            expect(content).toContain('export function createScenarioData');
            expect(content).toContain('export function generateMixedData');
            expect(content).toContain('export function resetAllFactories');
        });
        
        test('should generate performance data helpers', async () => {
            const mockGrammar: ParsedGrammar = {
                projectName: 'TestDSL',
                interfaces: [
                    {
                        name: 'Node',
                        superTypes: [],
                        properties: [
                            { name: 'id', type: 'string', optional: false, array: false }
                        ]
                    }
                ],
                types: []
            };
            
            await generator.generate(mockGrammar, tempDir);
            
            const perfFile = path.join(tempDir, 'src/test/test-data/factories/performance-data.ts');
            const content = await fs.readFile(perfFile, 'utf-8');
            
            // Check for performance testing utilities
            expect(content).toContain('export function generateLargeDataset');
            expect(content).toContain('export function generateDeeplyNested');
            expect(content).toContain('export function generateHighlyConnected');
            expect(content).toContain('export function* generateContinuousData');
            expect(content).toContain('export const performanceUtils');
            expect(content).toContain('measureTime');
            expect(content).toContain('benchmark');
        });
    });
});