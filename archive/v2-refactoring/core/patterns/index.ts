/**
 * Design patterns module exports
 * @module core/patterns
 */

// Builders
export * from './builders/ConfigurationBuilder';
export * from './builders/TemplateContextBuilder';

// Factories
export * from './factories/ValidationRuleFactory';
export * from './factories/PluginFactory';

// Re-export convenience functions
export { configuration, ConfigurationPresets } from './builders/ConfigurationBuilder';
export { templateContext } from './builders/TemplateContextBuilder';

/**
 * Pattern utilities namespace
 */
export const Patterns = {
  /**
   * Builder functions
   */
  builders: {
    configuration: () => new (require('./builders/ConfigurationBuilder').ConfigurationBuilder)(),
    templateContext: () => new (require('./builders/TemplateContextBuilder').TemplateContextBuilder)(),
  },

  /**
   * Factory instances
   */
  factories: {
    validation: () => new (require('./factories/ValidationRuleFactory').ValidationRuleFactory)(),
    plugin: (logger: any) => new (require('./factories/PluginFactory').PluginFactory)(logger),
  },

  /**
   * Preset configurations
   */
  presets: {
    configuration: require('./builders/ConfigurationBuilder').ConfigurationPresets,
    validation: (factory: any) => new (require('./factories/ValidationRuleFactory').ValidationRulePresets)(factory),
    plugin: (factory: any) => new (require('./factories/PluginFactory').PluginPresets)(factory),
  },
};