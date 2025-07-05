/**
 * Unit tests for SchemaValidator
 * @module test/unit/validation
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { z } from 'zod';
import { SchemaValidator } from '../../../src/validation/services/SchemaValidator';
import { IStructuredLogger } from '../../../src/infrastructure/logging/ILogger';
import { MockLogger } from '../../mocks/mock-services';

describe('SchemaValidator', () => {
  let validator: SchemaValidator;
  let mockLogger: IStructuredLogger;

  beforeEach(() => {
    mockLogger = new MockLogger();
    validator = new SchemaValidator(mockLogger);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('validateSchema', () => {
    it('should validate data against Zod schema successfully', async () => {
      // Arrange
      const schema = z.object({
        name: z.string(),
        age: z.number().min(0),
        email: z.string().email(),
      });

      const validData = {
        name: 'John Doe',
        age: 30,
        email: 'john@example.com',
      };

      // Act
      const result = await validator.validateSchema(validData, schema);

      // Assert
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
      expect(result.data).toEqual(validData);
    });

    it('should report validation errors for invalid data', async () => {
      // Arrange
      const schema = z.object({
        name: z.string().min(1),
        age: z.number().positive(),
        email: z.string().email(),
      });

      const invalidData = {
        name: '',
        age: -5,
        email: 'not-an-email',
      };

      // Act
      const result = await validator.validateSchema(invalidData, schema);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(3);
      expect(result.errors[0]).toMatchObject({
        path: ['name'],
        message: expect.stringContaining('at least 1'),
      });
      expect(result.errors[1]).toMatchObject({
        path: ['age'],
        message: expect.stringContaining('positive'),
      });
      expect(result.errors[2]).toMatchObject({
        path: ['email'],
        message: expect.stringContaining('email'),
      });
    });

    it('should handle nested object validation', async () => {
      // Arrange
      const schema = z.object({
        user: z.object({
          profile: z.object({
            firstName: z.string(),
            lastName: z.string(),
          }),
          settings: z.object({
            theme: z.enum(['light', 'dark']),
            notifications: z.boolean(),
          }),
        }),
      });

      const data = {
        user: {
          profile: {
            firstName: 'John',
            lastName: 'Doe',
          },
          settings: {
            theme: 'invalid-theme',
            notifications: 'yes', // Should be boolean
          },
        },
      };

      // Act
      const result = await validator.validateSchema(data, schema);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.errors[0].path).toEqual(['user', 'settings', 'theme']);
      expect(result.errors[1].path).toEqual(['user', 'settings', 'notifications']);
    });

    it('should validate arrays', async () => {
      // Arrange
      const schema = z.object({
        items: z.array(z.object({
          id: z.number(),
          name: z.string(),
        })).min(1),
      });

      const validData = {
        items: [
          { id: 1, name: 'Item 1' },
          { id: 2, name: 'Item 2' },
        ],
      };

      // Act
      const result = await validator.validateSchema(validData, schema);

      // Assert
      expect(result.valid).toBe(true);
      expect(result.data).toEqual(validData);
    });

    it('should handle union types', async () => {
      // Arrange
      const schema = z.object({
        value: z.union([
          z.string(),
          z.number(),
          z.boolean(),
        ]),
      });

      // Test various valid types
      const validCases = [
        { value: 'string' },
        { value: 123 },
        { value: true },
      ];

      for (const data of validCases) {
        const result = await validator.validateSchema(data, schema);
        expect(result.valid).toBe(true);
      }

      // Test invalid type
      const invalidData = { value: { obj: true } };
      const result = await validator.validateSchema(invalidData, schema);
      expect(result.valid).toBe(false);
    });

    it('should transform data when schema includes transformations', async () => {
      // Arrange
      const schema = z.object({
        email: z.string().email().toLowerCase(),
        age: z.string().transform(val => parseInt(val, 10)),
        tags: z.string().transform(val => val.split(',').map(s => s.trim())),
      });

      const inputData = {
        email: 'JOHN@EXAMPLE.COM',
        age: '25',
        tags: 'typescript, nodejs, vitest',
      };

      // Act
      const result = await validator.validateSchema(inputData, schema);

      // Assert
      expect(result.valid).toBe(true);
      expect(result.data).toEqual({
        email: 'john@example.com',
        age: 25,
        tags: ['typescript', 'nodejs', 'vitest'],
      });
    });

    it('should handle optional fields', async () => {
      // Arrange
      const schema = z.object({
        required: z.string(),
        optional: z.string().optional(),
        nullable: z.string().nullable(),
        defaulted: z.string().default('default-value'),
      });

      const data = {
        required: 'value',
        nullable: null,
      };

      // Act
      const result = await validator.validateSchema(data, schema);

      // Assert
      expect(result.valid).toBe(true);
      expect(result.data).toEqual({
        required: 'value',
        nullable: null,
        defaulted: 'default-value',
      });
    });

    it('should validate with custom error messages', async () => {
      // Arrange
      const schema = z.object({
        password: z.string()
          .min(8, 'Password must be at least 8 characters')
          .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
          .regex(/[0-9]/, 'Password must contain at least one number'),
      });

      const data = {
        password: 'short',
      };

      // Act
      const result = await validator.validateSchema(data, schema);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.errors[0].message).toBe('Password must be at least 8 characters');
    });

    it('should handle refinements', async () => {
      // Arrange
      const schema = z.object({
        startDate: z.string(),
        endDate: z.string(),
      }).refine(
        data => new Date(data.endDate) > new Date(data.startDate),
        {
          message: 'End date must be after start date',
          path: ['endDate'],
        }
      );

      const invalidData = {
        startDate: '2024-01-15',
        endDate: '2024-01-10',
      };

      // Act
      const result = await validator.validateSchema(invalidData, schema);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toMatchObject({
        path: ['endDate'],
        message: 'End date must be after start date',
      });
    });

    it('should handle async validation', async () => {
      // Arrange
      const schema = z.object({
        username: z.string().refine(
          async (username) => {
            // Simulate async check (e.g., database lookup)
            await new Promise(resolve => setTimeout(resolve, 10));
            return username !== 'taken';
          },
          { message: 'Username already taken' }
        ),
      });

      const data = { username: 'taken' };

      // Act
      const result = await validator.validateSchema(data, schema);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.errors[0].message).toBe('Username already taken');
    });

    it('should handle schema parsing errors', async () => {
      // Arrange
      const schema = z.object({
        strict: z.string(),
      }).strict(); // Will error on extra properties

      const data = {
        strict: 'value',
        extra: 'not-allowed',
      };

      // Act
      const result = await validator.validateSchema(data, schema);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.errors[0].message).toContain('unrecognized');
    });

    it('should log validation attempts in debug mode', async () => {
      // Arrange
      const schema = z.object({ name: z.string() });
      const data = { name: 'test' };

      // Act
      await validator.validateSchema(data, schema, { debug: true });

      // Assert
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Validating data against schema',
        expect.any(Object)
      );
    });

    it('should handle empty data', async () => {
      // Arrange
      const schema = z.object({
        field: z.string(),
      });

      // Act
      const result = await validator.validateSchema({}, schema);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.errors[0].path).toEqual(['field']);
    });

    it('should validate discriminated unions', async () => {
      // Arrange
      const schema = z.discriminatedUnion('type', [
        z.object({
          type: z.literal('email'),
          email: z.string().email(),
        }),
        z.object({
          type: z.literal('phone'),
          phoneNumber: z.string().regex(/^\d{10}$/),
        }),
      ]);

      // Valid email
      const emailResult = await validator.validateSchema({
        type: 'email',
        email: 'test@example.com',
      }, schema);
      expect(emailResult.valid).toBe(true);

      // Invalid phone
      const phoneResult = await validator.validateSchema({
        type: 'phone',
        phoneNumber: '123', // Too short
      }, schema);
      expect(phoneResult.valid).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle circular references gracefully', async () => {
      // Arrange
      interface Node {
        name: string;
        children?: Node[];
      }

      const schema: z.ZodType<Node> = z.lazy(() =>
        z.object({
          name: z.string(),
          children: z.array(schema).optional(),
        })
      );

      const data: Node = {
        name: 'root',
        children: [
          { name: 'child1' },
          { 
            name: 'child2',
            children: [
              { name: 'grandchild' },
            ],
          },
        ],
      };

      // Act
      const result = await validator.validateSchema(data, schema);

      // Assert
      expect(result.valid).toBe(true);
    });

    it('should handle very large objects efficiently', async () => {
      // Arrange
      const schema = z.object({
        items: z.array(z.object({
          id: z.number(),
          value: z.string(),
        })),
      });

      const largeData = {
        items: Array.from({ length: 1000 }, (_, i) => ({
          id: i,
          value: `item-${i}`,
        })),
      };

      // Act
      const start = Date.now();
      const result = await validator.validateSchema(largeData, schema);
      const duration = Date.now() - start;

      // Assert
      expect(result.valid).toBe(true);
      expect(duration).toBeLessThan(100); // Should be fast
    });
  });
});