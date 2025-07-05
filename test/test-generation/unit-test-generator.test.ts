import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { UnitTestGenerator } from '../../src/test-generation/unit-test-generator';
import { ParsedGrammar } from '../../src/types/grammar';

describe('UnitTestGenerator', () => {
    let generator: UnitTestGenerator;
    let tempDir: string = '';
    
    beforeEach(async () => {
        generator = new UnitTestGenerator();
        // Create a temporary directory for test output
        tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'unit-test-gen-'));
    });
    
    afterEach(async () => {
        // Clean up temp directory
        await fs.remove(tempDir);
    });
    
    describe('generate', () => {
        test('should generate unit tests for interfaces', async () => {
            const mockGrammar: ParsedGrammar = {
                projectName: 'TestDSL',
                interfaces: [
                    {
                        name: 'Node',
                        superTypes: [],
                        properties: [
                            { name: 'id', type: 'string', optional: false, array: false },
                            { name: 'name', type: 'string', optional: false, array: false },
                            { name: 'x', type: 'number', optional: false, array: false },
                            { name: 'y', type: 'number', optional: false, array: false },
                            { name: 'tags', type: 'string', optional: true, array: true }
                        ]
                    },
                    {
                        name: 'Edge',
                        superTypes: [],
                        properties: [
                            { name: 'id', type: 'string', optional: false, array: false },
                            { name: 'source', type: 'Node', optional: false, array: false },
                            { name: 'target', type: 'Node', optional: false, array: false },
                            { name: 'label', type: 'string', optional: true, array: false }
                        ]
                    }
                ],
                types: []
            };
            
            const files = await generator.generate(mockGrammar, tempDir);
            
            // Should generate model tests for each interface
            expect(files).toContain(path.join(tempDir, 'src/test/unit/model/node.test.ts'));
            expect(files).toContain(path.join(tempDir, 'src/test/unit/model/edge.test.ts'));
            
            // Should generate validation tests
            expect(files).toContain(path.join(tempDir, 'src/test/unit/validation/validators.test.ts'));
            
            // Should generate type guard tests
            expect(files).toContain(path.join(tempDir, 'src/test/unit/utils/type-guards.test.ts'));
            
            // Check that all files exist
            for (const file of files) {
                expect(await fs.pathExists(file)).toBe(true);
            }
        });
        
        test('should generate model tests with correct content', async () => {
            const mockGrammar: ParsedGrammar = {
                projectName: 'TestDSL',
                interfaces: [
                    {
                        name: 'Simple',
                        superTypes: [],
                        properties: [
                            { name: 'id', type: 'string', optional: false, array: false },
                            { name: 'value', type: 'number', optional: true, array: false }
                        ]
                    }
                ],
                types: []
            };
            
            await generator.generate(mockGrammar, tempDir);
            
            const testFile = path.join(tempDir, 'src/test/unit/model/simple.test.ts');
            const content = await fs.readFile(testFile, 'utf-8');
            
            // Check for expected test structure
            expect(content).toContain("describe('Simple Model'");
            expect(content).toContain("test('should accept valid Simple'");
            expect(content).toContain("test('should reject Simple without required id'");
            expect(content).toContain("test('should accept Simple without optional value'");
            expect(content).toContain("import { SimpleFactory }");
            expect(content).toContain("validateSimple");
            expect(content).toContain("isSimple");
        });
        
        test('should generate tests for array properties', async () => {
            const mockGrammar: ParsedGrammar = {
                projectName: 'TestDSL',
                interfaces: [
                    {
                        name: 'Container',
                        superTypes: [],
                        properties: [
                            { name: 'id', type: 'string', optional: false, array: false },
                            { name: 'items', type: 'string', optional: false, array: true }
                        ]
                    }
                ],
                types: []
            };
            
            await generator.generate(mockGrammar, tempDir);
            
            const testFile = path.join(tempDir, 'src/test/unit/model/container.test.ts');
            const content = await fs.readFile(testFile, 'utf-8');
            
            // Check for array-specific tests
            expect(content).toContain("test('should validate items as array'");
            expect(content).toContain("test('should accept empty array for items'");
            expect(content).toContain("'not-an-array' as any");
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
            
            // Generate only model tests
            const files = await generator.generate(mockGrammar, tempDir, {
                generateModelTests: true,
                generateValidationTests: false,
                generateTypeGuardTests: false,
                generateFactoryTests: false
            });
            
            // Should only generate model tests
            expect(files).toHaveLength(1);
            expect(files[0]).toContain('model/node.test.ts');
        });
        
        test('should generate performance tests when enabled', async () => {
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
            
            const testFile = path.join(tempDir, 'src/test/unit/model/node.test.ts');
            const content = await fs.readFile(testFile, 'utf-8');
            
            // Check for performance test
            expect(content).toContain("describe('performance'");
            expect(content).toContain("test('validation should be fast for typical objects'");
            expect(content).toContain("performance.now()");
            expect(content).toContain("expect(duration).toBeLessThan");
        });
        
        test('should handle empty grammar', async () => {
            const mockGrammar: ParsedGrammar = {
                projectName: 'EmptyDSL',
                interfaces: [],
                types: []
            };
            
            const files = await generator.generate(mockGrammar, tempDir);
            
            // Should still generate validation test file
            expect(files).toContain(path.join(tempDir, 'src/test/unit/validation/validators.test.ts'));
            
            // Should still generate type guard test file
            expect(files).toContain(path.join(tempDir, 'src/test/unit/utils/type-guards.test.ts'));
        });
        
        test('should generate edge case tests for different types', async () => {
            const mockGrammar: ParsedGrammar = {
                projectName: 'TestDSL',
                interfaces: [
                    {
                        name: 'TypeTest',
                        superTypes: [],
                        properties: [
                            { name: 'stringProp', type: 'string', optional: false, array: false },
                            { name: 'numberProp', type: 'number', optional: false, array: false },
                            { name: 'booleanProp', type: 'boolean', optional: false, array: false }
                        ]
                    }
                ],
                types: []
            };
            
            await generator.generate(mockGrammar, tempDir);
            
            const testFile = path.join(tempDir, 'src/test/unit/model/type-test.test.ts');
            const content = await fs.readFile(testFile, 'utf-8');
            
            // Check for type-specific validation tests
            expect(content).toContain("test('should validate stringProp as string'");
            expect(content).toContain("test('should validate numberProp as number'");
            expect(content).toContain("test('should validate booleanProp as boolean'");
            expect(content).toContain("123 as any"); // number tested against string
            expect(content).toContain("'not-a-number' as any"); // string tested against number
            expect(content).toContain("'not-a-boolean' as any"); // string tested against boolean
        });
    });
});