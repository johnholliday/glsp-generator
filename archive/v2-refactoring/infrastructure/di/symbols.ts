/**
 * Dependency injection symbols for InversifyJS
 * @module infrastructure/di
 */

/**
 * DI container symbols
 */
export const TYPES = {
  // Core interfaces
  IGenerator: Symbol.for('IGenerator'),
  IValidationGenerator: Symbol.for('IValidationGenerator'),
  IConfigurableGenerator: Symbol.for('IConfigurableGenerator'),
  IEventDrivenGenerator: Symbol.for('IEventDrivenGenerator'),
  IPluginEnabledGenerator: Symbol.for('IPluginEnabledGenerator'),
  
  // Parser interfaces
  IParser: Symbol.for('IParser'),
  IContentParser: Symbol.for('IContentParser'),
  IParserCache: Symbol.for('IParserCache'),
  IParserDiagnostics: Symbol.for('IParserDiagnostics'),
  
  // Validator interfaces
  IValidator: Symbol.for('IValidator'),
  ISchemaValidator: Symbol.for('ISchemaValidator'),
  IRuleValidator: Symbol.for('IRuleValidator'),
  IValidationRuleFactory: Symbol.for('IValidationRuleFactory'),
  IErrorCollector: Symbol.for('IErrorCollector'),
  IAsyncValidator: Symbol.for('IAsyncValidator'),
  
  // Template interfaces
  ITemplateEngine: Symbol.for('ITemplateEngine'),
  ITemplateLoader: Symbol.for('ITemplateLoader'),
  ITemplateRenderer: Symbol.for('ITemplateRenderer'),
  IHelperRegistry: Symbol.for('IHelperRegistry'),
  ITemplateStrategy: Symbol.for('ITemplateStrategy'),
  ITemplateCache: Symbol.for('ITemplateCache'),
  
  // Infrastructure interfaces
  ILogger: Symbol.for('ILogger'),
  IStructuredLogger: Symbol.for('IStructuredLogger'),
  IPerformanceLogger: Symbol.for('IPerformanceLogger'),
  ILoggerFactory: Symbol.for('ILoggerFactory'),
  IErrorHandler: Symbol.for('IErrorHandler'),
  IConfigProvider: Symbol.for('IConfigProvider'),
  IEventBus: Symbol.for('IEventBus'),
  IFileSystem: Symbol.for('IFileSystem'),
  
  // Service implementations
  GenerationOrchestrator: Symbol.for('GenerationOrchestrator'),
  ConfigurationManager: Symbol.for('ConfigurationManager'),
  PluginManager: Symbol.for('PluginManager'),
  
  // Parser implementations
  LangiumGrammarParser: Symbol.for('LangiumGrammarParser'),
  ParserCache: Symbol.for('ParserCache'),
  
  // Template implementations
  HandlebarsEngine: Symbol.for('HandlebarsEngine'),
  FileTemplateLoader: Symbol.for('FileTemplateLoader'),
  HelperRegistry: Symbol.for('HelperRegistry'),
  BrowserStrategy: Symbol.for('BrowserStrategy'),
  ServerStrategy: Symbol.for('ServerStrategy'),
  CommonStrategy: Symbol.for('CommonStrategy'),
  
  // Validation implementations
  SchemaValidator: Symbol.for('SchemaValidator'),
  RuleEngine: Symbol.for('RuleEngine'),
  ErrorCollector: Symbol.for('ErrorCollector'),
  
  // Infrastructure implementations
  StructuredLogger: Symbol.for('StructuredLogger'),
  ErrorHandler: Symbol.for('ErrorHandler'),
  EventBus: Symbol.for('EventBus'),
  FileSystemService: Symbol.for('FileSystemService'),
  
  // Factory symbols
  LoggerFactory: Symbol.for('Factory<ILogger>'),
  ValidatorFactory: Symbol.for('Factory<IValidator>'),
  StrategyFactory: Symbol.for('Factory<ITemplateStrategy>'),
  
  // Configuration symbols
  Config: Symbol.for('Config'),
  DefaultConfig: Symbol.for('DefaultConfig'),
  
  // Plugin symbols
  PluginLoader: Symbol.for('PluginLoader'),
  PluginRegistry: Symbol.for('PluginRegistry'),
};

/**
 * Service identifiers for named bindings
 */
export const SERVICE_IDENTIFIER = {
  // Template strategies
  BROWSER_STRATEGY: 'browser',
  SERVER_STRATEGY: 'server',
  COMMON_STRATEGY: 'common',
  
  // Validation rules
  NAMING_RULES: 'naming',
  STRUCTURE_RULES: 'structure',
  REFERENCE_RULES: 'reference',
  
  // Log outputs
  CONSOLE_OUTPUT: 'console',
  FILE_OUTPUT: 'file',
  
  // Parser types
  LANGIUM_PARSER: 'langium',
  
  // Config providers
  FILE_CONFIG: 'file',
  ENV_CONFIG: 'env',
};

/**
 * Metadata keys for decorators
 */
export const METADATA_KEY = {
  // Plugin metadata
  PLUGIN_NAME: 'plugin:name',
  PLUGIN_VERSION: 'plugin:version',
  PLUGIN_DEPENDENCIES: 'plugin:dependencies',
  
  // Service metadata
  SERVICE_NAME: 'service:name',
  SERVICE_VERSION: 'service:version',
  
  // Validation metadata
  RULE_NAME: 'rule:name',
  RULE_SEVERITY: 'rule:severity',
  
  // Template metadata
  TEMPLATE_NAME: 'template:name',
  TEMPLATE_CATEGORY: 'template:category',
};

/**
 * Injection tokens for configuration values
 */
export const CONFIG_TOKEN = {
  // Paths
  TEMPLATE_DIR: Symbol.for('config:templateDir'),
  OUTPUT_DIR: Symbol.for('config:outputDir'),
  PLUGIN_DIR: Symbol.for('config:pluginDir'),
  
  // Options
  VERBOSE: Symbol.for('config:verbose'),
  DRY_RUN: Symbol.for('config:dryRun'),
  STRICT_MODE: Symbol.for('config:strictMode'),
  
  // Limits
  MAX_FILE_SIZE: Symbol.for('config:maxFileSize'),
  TIMEOUT: Symbol.for('config:timeout'),
  
  // Features
  ENABLE_CACHE: Symbol.for('config:enableCache'),
  ENABLE_PLUGINS: Symbol.for('config:enablePlugins'),
  ENABLE_METRICS: Symbol.for('config:enableMetrics'),
};