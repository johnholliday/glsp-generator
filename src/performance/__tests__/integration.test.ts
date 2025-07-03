import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { container } from '../../config/di/container.js';
import { TYPES } from '../../config/di/types.js';
import { IParallelTemplateProcessor } from '../interfaces/parallel-template-processor.interface.js';
import { Template, GeneratorContext } from '../parallel-processor.js';

describe('ParallelTemplateProcessor Integration Tests', () => {
    let processor: IParallelTemplateProcessor;

    beforeEach(() => {
        processor = container.get<IParallelTemplateProcessor>(TYPES.IParallelTemplateProcessor);
    });

    afterEach(async () => {
        await processor.cleanup();
    });

    it('should resolve ParallelTemplateProcessor from DI container', () => {
        expect(processor).toBeDefined();
        expect(typeof processor.processTemplates).toBe('function');
        expect(typeof processor.getStats).toBe('function');
        expect(typeof processor.cleanup).toBe('function');
        expect(typeof processor.healthCheck).toBe('function');
    });

    it('should perform health check successfully', async () => {
        const isHealthy = await processor.healthCheck();
        expect(typeof isHealthy).toBe('boolean');
    });

    it('should return processing statistics', () => {
        const stats = processor.getStats();
        expect(stats).toHaveProperty('maxWorkers');
        expect(stats).toHaveProperty('poolSize');
        expect(stats).toHaveProperty('availableWorkers');
        expect(stats).toHaveProperty('memoryUsage');
        expect(typeof stats.maxWorkers).toBe('number');
        expect(typeof stats.poolSize).toBe('number');
        expect(typeof stats.availableWorkers).toBe('number');
        expect(stats.memoryUsage).toHaveProperty('heapUsed');
    });

    it('should handle empty template array', async () => {
        const templates: Template[] = [];
        const context: GeneratorContext = {
            projectName: 'test-project',
            grammar: {},
            config: {},
            outputDir: '/tmp/test-output'
        };

        const results = await processor.processTemplates(templates, context);
        expect(results).toEqual([]);
    });

    it('should validate templates before processing', async () => {
        const invalidTemplates: Template[] = [
            {
                name: '',
                path: '',
                content: '',
                dependencies: [],
                priority: 0
            }
        ];

        const context: GeneratorContext = {
            projectName: 'test-project',
            grammar: {},
            config: {},
            outputDir: '/tmp/test-output'
        };

        await expect(processor.processTemplates(invalidTemplates, context))
            .rejects.toThrow();
    });
});