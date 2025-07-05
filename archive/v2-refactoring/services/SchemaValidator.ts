/**
 * Schema validator using Zod
 * @module validation/services
 */

import { injectable, inject } from 'inversify';
import { z, ZodError, ZodSchema } from 'zod';
import { TYPES } from '../../infrastructure/di/symbols';
import { ISchemaValidator } from '../../core/interfaces/IValidator';
import { ValidationResult } from '../../core/models';
import { IStructuredLogger } from '../../infrastructure/logging/ILogger';
import { IErrorCollector } from '../../core/interfaces/IValidator';

/**
 * Schema validator implementation using Zod
 * Implements Single Responsibility: Schema-based validation
 */
@injectable()
export class SchemaValidator implements ISchemaValidator {
  /**
   * Pre-defined schemas for common GLSP structures
   */
  private readonly schemas = {
    nodeSchema: z.object({
      id: z.string().min(1, 'Node ID is required'),
      type: z.string().min(1, 'Node type is required'),
      position: z.object({
        x: z.number(),
        y: z.number()
      }).optional(),
      size: z.object({
        width: z.number().positive(),
        height: z.number().positive()
      }).optional(),
      children: z.array(z.string()).optional(),
      properties: z.record(z.any()).optional()
    }),

    edgeSchema: z.object({
      id: z.string().min(1, 'Edge ID is required'),
      type: z.string().min(1, 'Edge type is required'),
      sourceId: z.string().min(1, 'Source ID is required'),
      targetId: z.string().min(1, 'Target ID is required'),
      routingPoints: z.array(z.object({
        x: z.number(),
        y: z.number()
      })).optional(),
      properties: z.record(z.any()).optional()
    }),

    diagramSchema: z.object({
      id: z.string().min(1, 'Diagram ID is required'),
      type: z.literal('graph'),
      nodes: z.array(z.lazy(() => this.schemas.nodeSchema)),
      edges: z.array(z.lazy(() => this.schemas.edgeSchema))
    }),

    extensionConfigSchema: z.object({
      name: z.string().min(1, 'Extension name is required'),
      version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Version must be in semver format'),
      displayName: z.string().optional(),
      description: z.string().optional(),
      publisher: z.string().optional(),
      categories: z.array(z.string()).optional(),
      keywords: z.array(z.string()).optional(),
      engines: z.object({
        vscode: z.string().optional(),
        theia: z.string().optional()
      }).optional(),
      activationEvents: z.array(z.string()).optional(),
      contributes: z.object({
        languages: z.array(z.object({
          id: z.string(),
          extensions: z.array(z.string()),
          aliases: z.array(z.string()).optional(),
          configuration: z.string().optional()
        })).optional(),
        grammars: z.array(z.object({
          language: z.string(),
          scopeName: z.string(),
          path: z.string()
        })).optional(),
        commands: z.array(z.object({
          command: z.string(),
          title: z.string(),
          category: z.string().optional()
        })).optional()
      }).optional()
    })
  };

  constructor(
    @inject(TYPES.IStructuredLogger) private readonly logger: IStructuredLogger,
    @inject(TYPES.IErrorCollector) private readonly errorCollector: IErrorCollector
  ) {
    this.logger.info('SchemaValidator initialized');
  }

  /**
   * Validates data against a schema
   */
  validateSchema(data: any, schema: any): ValidationResult {
    this.errorCollector.clear();

    try {
      // Handle Zod schema
      if (schema instanceof ZodSchema) {
        return this.validateZodSchema(data, schema);
      }

      // Handle string schema names
      if (typeof schema === 'string') {
        const predefinedSchema = this.schemas[schema as keyof typeof this.schemas];
        if (predefinedSchema) {
          return this.validateZodSchema(data, predefinedSchema);
        }
      }

      // Handle plain object schemas (convert to Zod)
      if (typeof schema === 'object' && schema !== null) {
        const zodSchema = this.convertToZodSchema(schema);
        return this.validateZodSchema(data, zodSchema);
      }

      // Invalid schema
      this.errorCollector.addError(
        'INVALID_SCHEMA',
        'Invalid schema provided for validation'
      );
      
    } catch (error) {
      this.logger.error('Schema validation failed', error as Error);
      this.errorCollector.addError(
        'VALIDATION_ERROR',
        `Schema validation failed: ${(error as Error).message}`
      );
    }

    return this.errorCollector.toValidationResult();
  }

  /**
   * Validates a GLSP node structure
   */
  validateNode(node: any): ValidationResult {
    return this.validateSchema(node, this.schemas.nodeSchema);
  }

  /**
   * Validates a GLSP edge structure
   */
  validateEdge(edge: any): ValidationResult {
    return this.validateSchema(edge, this.schemas.edgeSchema);
  }

  /**
   * Validates a complete diagram
   */
  validateDiagram(diagram: any): ValidationResult {
    return this.validateSchema(diagram, this.schemas.diagramSchema);
  }

  /**
   * Validates extension configuration
   */
  validateExtensionConfig(config: any): ValidationResult {
    return this.validateSchema(config, this.schemas.extensionConfigSchema);
  }

  /**
   * Creates a custom schema validator
   */
  createValidator<T>(schema: ZodSchema<T>): (data: unknown) => ValidationResult {
    return (data: unknown) => this.validateSchema(data, schema);
  }

  /**
   * Private helper methods
   */
  private validateZodSchema(data: any, schema: ZodSchema): ValidationResult {
    try {
      schema.parse(data);
      
      // If we get here, validation passed
      this.logger.debug('Schema validation passed');
      return {
        isValid: true,
        errors: [],
        warnings: [],
        info: []
      };
      
    } catch (error) {
      if (error instanceof ZodError) {
        this.processZodError(error);
      } else {
        this.errorCollector.addError(
          'UNKNOWN_ERROR',
          `Unexpected validation error: ${(error as Error).message}`
        );
      }
      
      return this.errorCollector.toValidationResult();
    }
  }

  private processZodError(error: ZodError): void {
    for (const issue of error.issues) {
      const path = issue.path.join('.');
      const location = path ? { property: path } : undefined;
      
      switch (issue.code) {
        case 'invalid_type':
          this.errorCollector.addError(
            'TYPE_MISMATCH',
            `Expected ${issue.expected}, received ${issue.received}${path ? ` at ${path}` : ''}`,
            location
          );
          break;
          
        case 'invalid_literal':
          this.errorCollector.addError(
            'INVALID_VALUE',
            `Invalid literal value${path ? ` at ${path}` : ''}: expected ${JSON.stringify(issue.expected)}`,
            location
          );
          break;
          
        case 'invalid_union':
          this.errorCollector.addError(
            'UNION_MISMATCH',
            `Value does not match any union type${path ? ` at ${path}` : ''}`,
            location
          );
          break;
          
        case 'invalid_enum_value':
          this.errorCollector.addError(
            'INVALID_ENUM',
            `Invalid enum value${path ? ` at ${path}` : ''}: expected one of ${issue.options.join(', ')}`,
            location
          );
          break;
          
        case 'unrecognized_keys':
          this.errorCollector.addWarning(
            'UNKNOWN_PROPERTIES',
            `Unrecognized keys: ${issue.keys.join(', ')}${path ? ` at ${path}` : ''}`,
            location
          );
          break;
          
        case 'too_small':
          if (issue.type === 'string') {
            this.errorCollector.addError(
              'STRING_TOO_SHORT',
              `String must be at least ${issue.minimum} characters${path ? ` at ${path}` : ''}`,
              location
            );
          } else if (issue.type === 'array') {
            this.errorCollector.addError(
              'ARRAY_TOO_SMALL',
              `Array must have at least ${issue.minimum} items${path ? ` at ${path}` : ''}`,
              location
            );
          } else {
            this.errorCollector.addError(
              'VALUE_TOO_SMALL',
              `Value must be at least ${issue.minimum}${path ? ` at ${path}` : ''}`,
              location
            );
          }
          break;
          
        case 'too_big':
          if (issue.type === 'string') {
            this.errorCollector.addError(
              'STRING_TOO_LONG',
              `String must be at most ${issue.maximum} characters${path ? ` at ${path}` : ''}`,
              location
            );
          } else if (issue.type === 'array') {
            this.errorCollector.addError(
              'ARRAY_TOO_BIG',
              `Array must have at most ${issue.maximum} items${path ? ` at ${path}` : ''}`,
              location
            );
          } else {
            this.errorCollector.addError(
              'VALUE_TOO_BIG',
              `Value must be at most ${issue.maximum}${path ? ` at ${path}` : ''}`,
              location
            );
          }
          break;
          
        case 'custom':
          this.errorCollector.addError(
            'CUSTOM_ERROR',
            issue.message || `Custom validation failed${path ? ` at ${path}` : ''}`,
            location
          );
          break;
          
        default:
          this.errorCollector.addError(
            'VALIDATION_ERROR',
            issue.message || `Validation failed${path ? ` at ${path}` : ''}`,
            location
          );
      }
    }
  }

  private convertToZodSchema(schema: any): ZodSchema {
    // Simple conversion for basic schemas
    if (schema.type) {
      switch (schema.type) {
        case 'string':
          return z.string();
        case 'number':
          return z.number();
        case 'boolean':
          return z.boolean();
        case 'object':
          return z.object({});
        case 'array':
          return z.array(z.any());
        default:
          return z.any();
      }
    }
    
    // For complex schemas, return any for now
    return z.any();
  }
}