import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { DeclarationGenerator } from '../declaration-generator.js';
import { ParsedGrammar } from '../../types/grammar.js';
import fs from 'fs-extra';
import path from 'path';

describe('DeclarationGenerator', () => {
  let generator: DeclarationGenerator;
  let testGrammar: ParsedGrammar;
  const outputDir = path.join(process.cwd(), 'test-output-declarations');

  beforeEach(async () => {
    generator = new DeclarationGenerator();
    
    testGrammar = {
      projectName: 'test-project',
      interfaces: [
        {
          name: 'Node',
          properties: [
            { name: 'id', type: 'ID', optional: false, array: false },
            { name: 'name', type: 'string', optional: false, array: false },
            { name: 'tags', type: 'string', optional: true, array: true }
          ],
          superTypes: []
        },
        {
          name: 'Edge',
          properties: [
            { name: 'id', type: 'ID', optional: false, array: false },
            { name: 'sourceId', type: 'string', optional: false, array: false },
            { name: 'targetId', type: 'string', optional: false, array: false },
            { name: 'type', type: 'EdgeType', optional: false, array: false }
          ],
          superTypes: []
        }
      ],
      types: [
        {
          name: 'EdgeType',
          definition: "'solid' | 'dashed' | 'dotted'",
          unionTypes: ['solid', 'dashed', 'dotted']
        }
      ]
    };

    await fs.ensureDir(outputDir);
  });

  afterEach(async () => {
    await fs.remove(outputDir);
  });

  test('should generate TypeScript declarations', async () => {
    await generator.generate(testGrammar, outputDir);
    
    const declarationPath = path.join(outputDir, 'src', 'types', 'test-project-types.d.ts');
    expect(await fs.pathExists(declarationPath)).toBe(true);
    
    const content = await fs.readFile(declarationPath, 'utf-8');
    
    // Check interface declarations
    expect(content).toContain('export interface Node');
    expect(content).toContain('export interface Edge');
    
    // Check type declarations
    expect(content).toContain('export type EdgeType = ');
    expect(content).toContain("'solid' | 'dashed' | 'dotted'");
  });

  test('should generate branded types', async () => {
    await generator.generate(testGrammar, outputDir, {
      generateBrandedTypes: true
    });
    
    const declarationPath = path.join(outputDir, 'src', 'types', 'test-project-types.d.ts');
    const content = await fs.readFile(declarationPath, 'utf-8');
    
    // Check branded type definitions
    expect(content).toContain('export type NodeId = string & { readonly __brand: unique symbol };');
    expect(content).toContain('export type SourceId = string & { readonly __sourceId: unique symbol };');
    expect(content).toContain('export type TargetId = string & { readonly __targetId: unique symbol };');
    
    // Check branded type constructors
    expect(content).toContain('export const NodeId = {');
    expect(content).toContain('create(id: string): NodeId');
    expect(content).toContain('validate(id: unknown): id is NodeId');
  });

  test('should generate namespaces with utility types', async () => {
    await generator.generate(testGrammar, outputDir, {
      generateNamespaces: true
    });
    
    const declarationPath = path.join(outputDir, 'src', 'types', 'test-project-types.d.ts');
    const content = await fs.readFile(declarationPath, 'utf-8');
    
    // Check namespace generation
    expect(content).toContain('export namespace Node {');
    expect(content).toContain('export type Create = Omit<Node, \'id\'> & { id?: NodeId };');
    expect(content).toContain('export type Update = DeepPartial<Omit<Node, \'id\'>>;');
    expect(content).toContain('export type Patch = Partial<Update>;');
  });

  test('should generate utility types', async () => {
    await generator.generate(testGrammar, outputDir, {
      generateUtilityTypes: true
    });
    
    const declarationPath = path.join(outputDir, 'src', 'types', 'test-project-types.d.ts');
    const content = await fs.readFile(declarationPath, 'utf-8');
    
    // Check utility type definitions
    expect(content).toContain('export type DeepPartial<T>');
    expect(content).toContain('export type DeepReadonly<T>');
    expect(content).toContain('export type Diff<T, U>');
    expect(content).toContain('export type Filter<T, U>');
  });

  test('should generate JSDoc comments when enabled', async () => {
    await generator.generate(testGrammar, outputDir, {
      generateJSDoc: true
    });
    
    const declarationPath = path.join(outputDir, 'src', 'types', 'test-project-types.d.ts');
    const content = await fs.readFile(declarationPath, 'utf-8');
    
    // Check JSDoc generation
    expect(content).toContain('/**');
    expect(content).toContain('* Type definitions for test-project');
    expect(content).toContain('* @generated');
    expect(content).toContain('* @module test-project-types');
  });

  test('should handle optional and array properties correctly', async () => {
    await generator.generate(testGrammar, outputDir);
    
    const declarationPath = path.join(outputDir, 'src', 'types', 'test-project-types.d.ts');
    const content = await fs.readFile(declarationPath, 'utf-8');
    
    // Check optional property
    expect(content).toMatch(/tags\?: string\[\];/);
    
    // Check required properties
    expect(content).toMatch(/name: string;/);
    expect(content).toMatch(/sourceId: string;/);
  });

  test('should generate type predicates', async () => {
    await generator.generate(testGrammar, outputDir);
    
    const declarationPath = path.join(outputDir, 'src', 'types', 'test-project-types.d.ts');
    const content = await fs.readFile(declarationPath, 'utf-8');
    
    // Check type predicates
    expect(content).toContain('export function isNode(obj: unknown): obj is Node');
    expect(content).toContain('export function isEdge(obj: unknown): obj is Edge');
  });

  test('should create index file', async () => {
    await generator.generate(testGrammar, outputDir);
    
    const indexPath = path.join(outputDir, 'src', 'types', 'index.ts');
    expect(await fs.pathExists(indexPath)).toBe(true);
    
    const content = await fs.readFile(indexPath, 'utf-8');
    expect(content).toContain("export * from './test-project-types.js';");
    expect(content).toContain("export * from './test-project-validators.js';");
    expect(content).toContain("export * from './test-project-guards.js';");
    expect(content).toContain("export * from './test-project-schemas.js';");
  });
});