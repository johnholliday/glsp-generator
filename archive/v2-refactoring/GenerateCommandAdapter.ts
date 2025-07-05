/**
 * Adapter to bridge existing GenerateCommand with new architecture
 * @module commands/base
 */

import { injectable, inject } from 'inversify';
import { ILogger } from '../../utils/logger/index.js';
import { TYPES } from '../../config/di/types.js';
import { createContainer } from '../../infrastructure/di/container';
import { TYPES as NEW_TYPES } from '../../infrastructure/di/symbols';
import { IGenerator, GenerationConfig } from '../../core/interfaces/IGenerator';
import { IParser } from '../../core/interfaces/IParser';
import { IValidator } from '../../validation/interfaces/IValidator';
import { Container } from 'inversify';
import path from 'path';

/**
 * Options for generation (matching existing interface)
 */
export interface GenerateOptions {
  generateDocs?: boolean;
  docsOptions?: any;
  generateTypeSafety?: boolean;
  typeSafetyOptions?: any;
  generateTests?: boolean;
  testOptions?: any;
  generateCICD?: boolean;
  cicdOptions?: any;
  templateOptions?: any;
  performanceOptions?: any;
}

/**
 * Adapter class that provides backward compatibility
 * for existing code using GLSPGenerator
 */
@injectable()
export class GenerateCommandAdapter {
  private container: Container = createContainer({
    verbose: process.env.DEBUG === 'true',
    enableCache: true,
    enablePlugins: true,
  });

  private generator: IGenerator;
  private validator: IValidator;

  constructor(
    @inject(TYPES.Logger) private logger: ILogger
  ) {
    // Get services from new container
    this.generator = this.container.get<IGenerator>(NEW_TYPES.IGenerator);
    this.validator = this.container.get<IValidator>(NEW_TYPES.IValidator);
  }

  /**
   * Validates a grammar file
   */
  async validateGrammar(grammarPath: string): Promise<boolean> {
    try {
      // Parse the grammar first
      const parser = this.container.get<IParser>(NEW_TYPES.IParser);
      const grammar = await parser.parse(grammarPath);
      
      const result = await this.validator.validate(grammar, {
        strict: false
      });
      return result.isValid;
    } catch (error) {
      this.logger.error('Grammar validation failed', error as Error);
      return false;
    }
  }

  /**
   * Generates a GLSP extension (adapter method)
   */
  async generateExtension(
    grammarPath: string,
    outputDir: string,
    options?: GenerateOptions
  ): Promise<{ extensionDir: string }> {
    try {
      // Convert options to new format
      const config: GenerationConfig = {
        grammarPath: path.resolve(grammarPath),
        outputDir: path.resolve(outputDir),
        options: {
          validate: true,
          templates: this.getTemplatesFromOptions(options),
          force: false,
          dryRun: false,
          plugins: this.getPluginsFromOptions(options),
          // Map additional options
          generateDocs: options?.generateDocs,
          docsOptions: options?.docsOptions,
          generateTypeSafety: options?.generateTypeSafety,
          typeSafetyOptions: options?.typeSafetyOptions,
          generateTests: options?.generateTests,
          testOptions: options?.testOptions,
          generateCICD: options?.generateCICD,
          cicdOptions: options?.cicdOptions,
        }
      };

      // Generate using new architecture
      const result = await this.generator.generate(config);

      if (!result.success) {
        const errorMessages = result.errors?.map(e => e.message).join('\n') || 'Generation failed';
        throw new Error(errorMessages);
      }

      // Return in expected format
      return {
        extensionDir: result.outputDir || outputDir
      };
    } catch (error) {
      this.logger.error('Extension generation failed', error);
      throw error;
    }
  }

  /**
   * Extract templates from options
   */
  private getTemplatesFromOptions(options?: GenerateOptions): string[] {
    const templates: string[] = ['browser', 'server', 'common'];

    // Add additional templates based on options
    if (options?.generateDocs) {
      templates.push('documentation');
    }
    if (options?.generateTypeSafety) {
      templates.push('types');
    }
    if (options?.generateTests) {
      templates.push('tests');
    }
    if (options?.generateCICD) {
      templates.push('cicd');
    }

    return templates;
  }

  /**
   * Extract plugins from options
   */
  private getPluginsFromOptions(options?: GenerateOptions): string[] {
    const plugins: string[] = [];

    // Add plugins based on options
    if (options?.generateDocs) {
      plugins.push('documentation');
    }
    if (options?.generateTypeSafety) {
      plugins.push('type-safety');
    }
    if (options?.generateTests) {
      plugins.push('test-generation');
    }
    if (options?.generateCICD) {
      plugins.push('cicd');
    }

    return plugins;
  }
}

/**
 * Factory function to create a GLSPGenerator-compatible instance
 */
export function createGLSPGeneratorAdapter(logger: ILogger): GenerateCommandAdapter {
  return new GenerateCommandAdapter(logger);
}