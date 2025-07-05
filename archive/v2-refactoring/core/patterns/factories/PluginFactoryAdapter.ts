/**
 * Adapter to convert between plugin formats
 * @module core/patterns/factories
 */

import { IGeneratorPlugin, PluginHook, GenerationPhase, IEventDrivenGenerator } from '../../interfaces/IGenerator';

/**
 * Plugin with object-based hooks (used by factory)
 */
export interface FactoryPlugin {
  name: string;
  version: string;
  description?: string;
  metadata?: any;
  hooks?: {
    beforeGenerate?: (context: any) => Promise<void>;
    afterGenerate?: (context: any) => Promise<void>;
    beforeParse?: (context: any) => Promise<void>;
    afterParse?: (context: any) => Promise<void>;
    beforeValidation?: (context: any) => Promise<void>;
    afterValidation?: (context: any) => Promise<void>;
    beforeTemplateRender?: (context: any) => Promise<void>;
    afterTemplateRender?: (context: any) => Promise<void>;
  };
  configure?: (config: any) => Promise<void>;
  validate?: () => Promise<any>;
}

/**
 * Converts a factory plugin to IGeneratorPlugin format
 */
export function adaptFactoryPlugin(factoryPlugin: FactoryPlugin): IGeneratorPlugin {
  const hooks: PluginHook[] = [];

  // Map object-based hooks to array format
  if (factoryPlugin.hooks) {
    const hookMapping: Record<string, GenerationPhase> = {
      beforeGenerate: GenerationPhase.BeforeGeneration,
      afterGenerate: GenerationPhase.AfterGeneration,
      beforeParse: GenerationPhase.BeforeParsing,
      afterParse: GenerationPhase.AfterParsing,
      beforeValidation: GenerationPhase.BeforeValidation,
      afterValidation: GenerationPhase.AfterValidation,
      beforeTemplateRender: GenerationPhase.BeforeWrite,
      afterTemplateRender: GenerationPhase.AfterWrite,
    };

    for (const [hookName, handler] of Object.entries(factoryPlugin.hooks)) {
      if (handler && hookMapping[hookName]) {
        hooks.push({
          phase: hookMapping[hookName],
          handler: handler as (context: any) => Promise<void>,
        });
      }
    }
  }

  return {
    name: factoryPlugin.name,
    version: factoryPlugin.version,
    description: factoryPlugin.description,
    hooks,

    async initialize(generator: IEventDrivenGenerator): Promise<void> {
      // Register hooks with the generator
      for (const hook of hooks) {
        generator.on(hook.phase, hook.handler);
      }
    },

    async dispose(): Promise<void> {
      // Cleanup if needed
    },
  };
}