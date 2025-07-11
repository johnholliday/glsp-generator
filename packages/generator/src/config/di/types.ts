export const TYPES = {
    // Core
    Logger: Symbol.for('Logger'),
    LoggerFactory: Symbol.for('LoggerFactory'),
    PackageInfo: Symbol.for('PackageInfo'),

    // Commands
    Command: Symbol.for('Command'),

    // Service Interfaces
    ILoggerService: Symbol.for('ILoggerService'),
    IGrammarParserService: Symbol.for('IGrammarParserService'),
    ILinterService: Symbol.for('ILinterService'),
    IValidationReporterService: Symbol.for('IValidationReporterService'),
    IDocumentationGeneratorService: Symbol.for('IDocumentationGeneratorService'),
    ITypeSafetyGeneratorService: Symbol.for('ITypeSafetyGeneratorService'),
    ITestGeneratorService: Symbol.for('ITestGeneratorService'),
    ICICDGeneratorService: Symbol.for('ICICDGeneratorService'),
    ITemplateSystemService: Symbol.for('ITemplateSystemService'),
    IPerformanceOptimizerService: Symbol.for('IPerformanceOptimizerService'),
    
    // Services
    GLSPGenerator: Symbol.for('GLSPGenerator'),
    ConfigLoader: Symbol.for('ConfigLoader'),
    LangiumGrammarParser: Symbol.for('LangiumGrammarParser'),
    GrammarLinter: Symbol.for('GrammarLinter'),
    ValidationReporter: Symbol.for('ValidationReporter'),
    DocumentationGenerator: Symbol.for('DocumentationGenerator'),
    TypeSafetyGenerator: Symbol.for('TypeSafetyGenerator'),
    TestGenerator: Symbol.for('TestGenerator'),
    CICDGenerator: Symbol.for('CICDGenerator'),
    TemplateSystem: Symbol.for('TemplateSystem'),
    PerformanceOptimizer: Symbol.for('PerformanceOptimizer'),

    // Performance Services
    PerformanceMonitor: Symbol.for('PerformanceMonitor'),
    MemoryManager: Symbol.for('MemoryManager'),
    SystemInfoService: Symbol.for('SystemInfoService'),
    PerformanceConfig: Symbol.for('PerformanceConfig'),

    // Performance Interfaces
    IPerformanceMonitor: Symbol.for('IPerformanceMonitor'),
    IMemoryManager: Symbol.for('IMemoryManager'),
    ISystemInfoService: Symbol.for('ISystemInfoService'),

    // Template Processing Interfaces
    ITemplateLoader: Symbol.for('ITemplateLoader'),
    ITemplateValidator: Symbol.for('ITemplateValidator'),
    IOutputHandler: Symbol.for('IOutputHandler'),
    IWorkerPool: Symbol.for('IWorkerPool'),
    IParallelTemplateProcessor: Symbol.for('IParallelTemplateProcessor'),
};