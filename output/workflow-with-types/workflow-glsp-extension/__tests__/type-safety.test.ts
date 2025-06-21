/**
 * Type safety test examples for workflow
 * @generated
 */

import { describe, test, expect } from '@jest/globals';
import { Workflow, Task, Flow, Parameter } from '../src/types/workflow-types';
import { validators } from '../src/types/workflow-validators';
import { isWorkflow, isTask, isFlow, isParameter } from '../src/types/workflow-guards';
import { WorkflowSchema, TaskSchema, FlowSchema, ParameterSchema } from '../src/types/workflow-schemas';
import { workflowFactory, taskFactory, flowFactory, parameterFactory } from '../src/types/workflow-utilities';

describe('Type Safety Tests', () => {

    describe('Workflow', () => {
        test('should validate valid Workflow', () => {
            const validWorkflow = workflowFactory.create();
            
            // Test type guard
            expect(isWorkflow(validWorkflow)).toBe(true);
            
            // Test validator
            const validationResult = validators.isWorkflow(validWorkflow);
            expect(validationResult.valid).toBe(true);
            
            // Test Zod schema
            const zodResult = WorkflowSchema.safeParse(validWorkflow);
            expect(zodResult.success).toBe(true);
        });
        
        test('should reject invalid Workflow', () => {
            const invalidWorkflow = { invalidProp: 'test' };
            
            // Test type guard
            expect(isWorkflow(invalidWorkflow)).toBe(false);
            
            // Test validator
            const validationResult = validators.isWorkflow(invalidWorkflow);
            expect(validationResult.valid).toBe(false);
            expect(validationResult.errors).toBeDefined();
            expect(validationResult.errors!.length).toBeGreaterThan(0);
            
            // Test Zod schema
            const zodResult = WorkflowSchema.safeParse(invalidWorkflow);
            expect(zodResult.success).toBe(false);
        });
        
        test('should create valid Workflow with factory', () => {
            const created = workflowFactory.create({
                name: 'test-value'
            });
            
            expect(isWorkflow(created)).toBe(true);
            expect(created.id).toBeDefined();
        });
    });


    describe('Task', () => {
        test('should validate valid Task', () => {
            const validTask = taskFactory.create();
            
            // Test type guard
            expect(isTask(validTask)).toBe(true);
            
            // Test validator
            const validationResult = validators.isTask(validTask);
            expect(validationResult.valid).toBe(true);
            
            // Test Zod schema
            const zodResult = TaskSchema.safeParse(validTask);
            expect(zodResult.success).toBe(true);
        });
        
        test('should reject invalid Task', () => {
            const invalidTask = { invalidProp: 'test' };
            
            // Test type guard
            expect(isTask(invalidTask)).toBe(false);
            
            // Test validator
            const validationResult = validators.isTask(invalidTask);
            expect(validationResult.valid).toBe(false);
            expect(validationResult.errors).toBeDefined();
            expect(validationResult.errors!.length).toBeGreaterThan(0);
            
            // Test Zod schema
            const zodResult = TaskSchema.safeParse(invalidTask);
            expect(zodResult.success).toBe(false);
        });
        
        test('should create valid Task with factory', () => {
            const created = taskFactory.create({
                id: 'test-value'
            });
            
            expect(isTask(created)).toBe(true);
            expect(created.id).toBeDefined();
        });
    });


    describe('Flow', () => {
        test('should validate valid Flow', () => {
            const validFlow = flowFactory.create();
            
            // Test type guard
            expect(isFlow(validFlow)).toBe(true);
            
            // Test validator
            const validationResult = validators.isFlow(validFlow);
            expect(validationResult.valid).toBe(true);
            
            // Test Zod schema
            const zodResult = FlowSchema.safeParse(validFlow);
            expect(zodResult.success).toBe(true);
        });
        
        test('should reject invalid Flow', () => {
            const invalidFlow = { invalidProp: 'test' };
            
            // Test type guard
            expect(isFlow(invalidFlow)).toBe(false);
            
            // Test validator
            const validationResult = validators.isFlow(invalidFlow);
            expect(validationResult.valid).toBe(false);
            expect(validationResult.errors).toBeDefined();
            expect(validationResult.errors!.length).toBeGreaterThan(0);
            
            // Test Zod schema
            const zodResult = FlowSchema.safeParse(invalidFlow);
            expect(zodResult.success).toBe(false);
        });
        
        test('should create valid Flow with factory', () => {
            const created = flowFactory.create({
                from: true
            });
            
            expect(isFlow(created)).toBe(true);
            expect(created.id).toBeDefined();
        });
    });


    describe('Parameter', () => {
        test('should validate valid Parameter', () => {
            const validParameter = parameterFactory.create();
            
            // Test type guard
            expect(isParameter(validParameter)).toBe(true);
            
            // Test validator
            const validationResult = validators.isParameter(validParameter);
            expect(validationResult.valid).toBe(true);
            
            // Test Zod schema
            const zodResult = ParameterSchema.safeParse(validParameter);
            expect(zodResult.success).toBe(true);
        });
        
        test('should reject invalid Parameter', () => {
            const invalidParameter = { invalidProp: 'test' };
            
            // Test type guard
            expect(isParameter(invalidParameter)).toBe(false);
            
            // Test validator
            const validationResult = validators.isParameter(invalidParameter);
            expect(validationResult.valid).toBe(false);
            expect(validationResult.errors).toBeDefined();
            expect(validationResult.errors!.length).toBeGreaterThan(0);
            
            // Test Zod schema
            const zodResult = ParameterSchema.safeParse(invalidParameter);
            expect(zodResult.success).toBe(false);
        });
        
        test('should create valid Parameter with factory', () => {
            const created = parameterFactory.create({
                name: 'test-value'
            });
            
            expect(isParameter(created)).toBe(true);
            expect(created.id).toBeDefined();
        });
    });

});
