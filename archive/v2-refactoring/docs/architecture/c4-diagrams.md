# C4 Architecture Diagrams

## Level 1: System Context Diagram

```mermaid
C4Context
    title System Context Diagram for GLSP Generator

    Person(developer, "Developer", "Uses GLSP Generator to create language extensions")
    
    System_Boundary(glsp_boundary, "GLSP Generator") {
        System(glsp_generator, "GLSP Generator", "Generates GLSP-based language extensions from Langium grammar files")
    }
    
    System_Ext(langium, "Langium", "Language engineering framework")
    System_Ext(theia, "Theia IDE", "Cloud & desktop IDE framework")
    System_Ext(vscode, "VS Code", "Visual Studio Code editor")
    System_Ext(npm, "NPM Registry", "Package repository")
    
    Rel(developer, glsp_generator, "Uses", "CLI/API")
    Rel(glsp_generator, langium, "Parses grammars with")
    Rel(glsp_generator, npm, "Fetches dependencies from")
    Rel_Back(theia, glsp_generator, "Integrates generated extensions")
    Rel_Back(vscode, glsp_generator, "Integrates generated extensions")
```

## Level 2: Container Diagram

```mermaid
C4Container
    title Container Diagram for GLSP Generator

    Person(developer, "Developer", "Uses GLSP Generator")
    
    Container_Boundary(glsp_boundary, "GLSP Generator") {
        Container(cli, "CLI Application", "TypeScript, Commander", "Command-line interface for generator")
        Container(core, "Core Engine", "TypeScript", "Orchestrates generation process")
        Container(parser, "Parser Service", "TypeScript, Langium", "Parses and validates grammar files")
        Container(template, "Template Engine", "TypeScript, Handlebars", "Generates code from templates")
        Container(validator, "Validation Service", "TypeScript, Zod", "Validates schemas and rules")
        Container(plugin, "Plugin System", "TypeScript", "Manages extensions and customizations")
        
        ContainerDb(templates, "Template Store", "File System", "Stores Handlebars templates")
        ContainerDb(config, "Configuration", "JSON/YAML", "Stores configuration files")
    }
    
    System_Ext(langium_services, "Langium Services", "Grammar parsing services")
    System_Ext(npm_registry, "NPM Registry", "Package dependencies")
    
    Rel(developer, cli, "Executes commands", "CLI")
    Rel(cli, core, "Invokes", "API")
    Rel(core, parser, "Parses grammar", "Internal API")
    Rel(core, template, "Generates code", "Internal API")
    Rel(core, validator, "Validates", "Internal API")
    Rel(core, plugin, "Loads plugins", "Internal API")
    Rel(parser, langium_services, "Uses", "API")
    Rel(template, templates, "Reads", "File I/O")
    Rel(core, config, "Reads", "File I/O")
    Rel(core, npm_registry, "Fetches", "HTTPS")
```

## Level 3: Component Diagram - Core Engine

```mermaid
C4Component
    title Component Diagram for Core Engine

    Container_Boundary(core_boundary, "Core Engine") {
        Component(orchestrator, "Generation Orchestrator", "TypeScript", "Coordinates the generation workflow")
        Component(config_mgr, "Configuration Manager", "TypeScript", "Manages application configuration")
        Component(plugin_mgr, "Plugin Manager", "TypeScript", "Loads and manages plugins")
        Component(event_bus, "Event Bus", "TypeScript", "Publishes generation events")
        Component(error_handler, "Error Handler", "TypeScript", "Centralizes error handling")
        Component(logger, "Logger Service", "TypeScript, Winston", "Structured logging")
        
        Rel(orchestrator, config_mgr, "Reads config", "Internal")
        Rel(orchestrator, plugin_mgr, "Loads plugins", "Internal")
        Rel(orchestrator, event_bus, "Publishes events", "Internal")
        Rel(orchestrator, error_handler, "Reports errors", "Internal")
        Rel(orchestrator, logger, "Logs activities", "Internal")
        Rel(plugin_mgr, event_bus, "Listens to events", "Internal")
        Rel(error_handler, logger, "Logs errors", "Internal")
    }
    
    Container(parser, "Parser Service", "TypeScript")
    Container(template, "Template Engine", "TypeScript")
    Container(validator, "Validation Service", "TypeScript")
    
    Rel(orchestrator, parser, "Invokes", "API")
    Rel(orchestrator, template, "Invokes", "API")
    Rel(orchestrator, validator, "Invokes", "API")
```

## Level 3: Component Diagram - Parser Service

```mermaid
C4Component
    title Component Diagram for Parser Service

    Container_Boundary(parser_boundary, "Parser Service") {
        Component(grammar_parser, "Grammar Parser", "TypeScript", "Parses Langium grammar files")
        Component(ast_builder, "AST Builder", "TypeScript", "Builds Abstract Syntax Tree")
        Component(type_resolver, "Type Resolver", "TypeScript", "Resolves type references")
        Component(import_resolver, "Import Resolver", "TypeScript", "Resolves grammar imports")
        Component(cache_mgr, "Cache Manager", "TypeScript", "Caches parsed grammars")
        
        Rel(grammar_parser, ast_builder, "Creates AST", "Internal")
        Rel(ast_builder, type_resolver, "Resolves types", "Internal")
        Rel(grammar_parser, import_resolver, "Resolves imports", "Internal")
        Rel(grammar_parser, cache_mgr, "Caches results", "Internal")
    }
    
    System_Ext(langium, "Langium Services", "Grammar services")
    
    Rel(grammar_parser, langium, "Uses", "API")
```

## Level 3: Component Diagram - Template Engine

```mermaid
C4Component
    title Component Diagram for Template Engine

    Container_Boundary(template_boundary, "Template Engine") {
        Component(template_renderer, "Template Renderer", "TypeScript", "Renders templates to code")
        Component(template_loader, "Template Loader", "TypeScript", "Loads template files")
        Component(helper_registry, "Helper Registry", "TypeScript", "Manages template helpers")
        Component(strategy_selector, "Strategy Selector", "TypeScript", "Selects rendering strategy")
        
        Component(browser_strategy, "Browser Strategy", "TypeScript", "Browser-specific rendering")
        Component(server_strategy, "Server Strategy", "TypeScript", "Server-specific rendering")
        Component(common_strategy, "Common Strategy", "TypeScript", "Common code rendering")
        
        Rel(template_renderer, template_loader, "Loads templates", "Internal")
        Rel(template_renderer, helper_registry, "Uses helpers", "Internal")
        Rel(template_renderer, strategy_selector, "Selects strategy", "Internal")
        Rel(strategy_selector, browser_strategy, "Uses", "Internal")
        Rel(strategy_selector, server_strategy, "Uses", "Internal")
        Rel(strategy_selector, common_strategy, "Uses", "Internal")
    }
    
    ContainerDb(templates, "Template Files", "File System")
    
    Rel(template_loader, templates, "Reads", "File I/O")
```

## Level 4: Code Diagram - Generation Orchestrator

```mermaid
classDiagram
    class IOrchestrator {
        <<interface>>
        +generate(config: GenerationConfig): Promise~GenerationResult~
        +validate(grammar: string): Promise~ValidationResult~
    }
    
    class GenerationOrchestrator {
        -parser: IParser
        -validator: IValidator
        -templateEngine: ITemplateEngine
        -logger: ILogger
        -eventBus: IEventBus
        +generate(config: GenerationConfig): Promise~GenerationResult~
        +validate(grammar: string): Promise~ValidationResult~
        -parseGrammar(path: string): Promise~GrammarAST~
        -validateAST(ast: GrammarAST): Promise~ValidationResult~
        -renderTemplates(ast: GrammarAST): Promise~GeneratedFiles~
        -writeFiles(files: GeneratedFiles): Promise~void~
    }
    
    class GenerationConfig {
        +grammarPath: string
        +outputDir: string
        +options: GenerationOptions
        +plugins: string[]
    }
    
    class GenerationResult {
        +success: boolean
        +files: GeneratedFile[]
        +errors: Error[]
        +warnings: Warning[]
    }
    
    class IParser {
        <<interface>>
        +parse(path: string): Promise~GrammarAST~
    }
    
    class IValidator {
        <<interface>>
        +validate(ast: GrammarAST): Promise~ValidationResult~
    }
    
    class ITemplateEngine {
        <<interface>>
        +render(ast: GrammarAST): Promise~GeneratedFiles~
    }
    
    IOrchestrator <|.. GenerationOrchestrator
    GenerationOrchestrator --> IParser
    GenerationOrchestrator --> IValidator
    GenerationOrchestrator --> ITemplateEngine
    GenerationOrchestrator --> GenerationConfig
    GenerationOrchestrator --> GenerationResult
```

## Sequence Diagrams

### Generation Workflow

```mermaid
sequenceDiagram
    participant Developer
    participant CLI
    participant Orchestrator
    participant Parser
    participant Validator
    participant TemplateEngine
    participant FileSystem
    
    Developer->>CLI: generate grammar.langium -o output/
    CLI->>Orchestrator: generate(config)
    
    Orchestrator->>Parser: parse(grammarPath)
    Parser->>Parser: loadGrammarFile()
    Parser->>Parser: buildAST()
    Parser->>Parser: resolveTypes()
    Parser-->>Orchestrator: GrammarAST
    
    Orchestrator->>Validator: validate(ast)
    Validator->>Validator: checkSchema()
    Validator->>Validator: applyRules()
    Validator-->>Orchestrator: ValidationResult
    
    alt Validation Failed
        Orchestrator-->>CLI: GenerationResult(errors)
        CLI-->>Developer: Display errors
    else Validation Passed
        Orchestrator->>TemplateEngine: render(ast)
        TemplateEngine->>TemplateEngine: loadTemplates()
        TemplateEngine->>TemplateEngine: renderWithStrategy()
        TemplateEngine-->>Orchestrator: GeneratedFiles
        
        Orchestrator->>FileSystem: writeFiles(files)
        FileSystem-->>Orchestrator: Success
        
        Orchestrator-->>CLI: GenerationResult(success)
        CLI-->>Developer: Generation complete
    end
```

### Plugin Loading Sequence

```mermaid
sequenceDiagram
    participant Orchestrator
    participant PluginManager
    participant PluginLoader
    participant Plugin
    participant EventBus
    
    Orchestrator->>PluginManager: loadPlugins(config.plugins)
    
    loop For each plugin
        PluginManager->>PluginLoader: load(pluginName)
        PluginLoader->>PluginLoader: resolvePlugin()
        PluginLoader->>Plugin: new Plugin()
        Plugin->>EventBus: subscribe(events)
        PluginLoader-->>PluginManager: Plugin instance
    end
    
    PluginManager-->>Orchestrator: Loaded plugins
    
    Note over Orchestrator,EventBus: During generation
    
    Orchestrator->>EventBus: emit('generation.started')
    EventBus->>Plugin: onGenerationStarted()
    
    Orchestrator->>EventBus: emit('ast.created', ast)
    EventBus->>Plugin: onASTCreated(ast)
    
    Orchestrator->>EventBus: emit('generation.completed')
    EventBus->>Plugin: onGenerationCompleted()
```

### Error Handling Flow

```mermaid
sequenceDiagram
    participant Component
    participant ErrorHandler
    participant Logger
    participant ErrorCollector
    participant Developer
    
    Component->>Component: Perform operation
    
    alt Operation fails
        Component->>ErrorHandler: handleError(error)
        ErrorHandler->>ErrorHandler: classifyError()
        ErrorHandler->>Logger: logError(error, context)
        Logger->>Logger: structuredLog()
        
        alt Recoverable error
            ErrorHandler->>ErrorCollector: collect(error)
            ErrorHandler->>Component: RecoveryStrategy
            Component->>Component: Continue with recovery
        else Non-recoverable error
            ErrorHandler->>ErrorCollector: collect(error)
            ErrorHandler->>Component: throw EnhancedError
        end
    end
    
    Note over Component,Developer: At end of operation
    
    Component->>ErrorCollector: getErrors()
    ErrorCollector-->>Component: Error[]
    Component->>Developer: Display errors with context
```

## Deployment Architecture

```mermaid
C4Deployment
    title Deployment Diagram for GLSP Generator

    Deployment_Node(dev_machine, "Developer Machine", "Windows/Mac/Linux") {
        Deployment_Node(node_env, "Node.js Runtime", "v18+") {
            Container(glsp_cli, "GLSP Generator CLI", "TypeScript application")
        }
        
        Deployment_Node(file_system, "File System") {
            ContainerDb(templates_fs, "Templates", "Handlebars files")
            ContainerDb(config_fs, "Configuration", "JSON/YAML files")
            ContainerDb(output_fs, "Generated Files", "TypeScript/JSON")
        }
    }
    
    Deployment_Node(npm_cloud, "NPM Registry", "Cloud") {
        Container(npm_packages, "NPM Packages", "Dependencies")
    }
    
    Deployment_Node(ide, "IDE", "Theia/VS Code") {
        Container(extension, "Generated Extension", "GLSP Extension")
    }
    
    Rel(glsp_cli, templates_fs, "Reads", "File I/O")
    Rel(glsp_cli, config_fs, "Reads", "File I/O")
    Rel(glsp_cli, output_fs, "Writes", "File I/O")
    Rel(glsp_cli, npm_packages, "Downloads", "HTTPS")
    Rel(extension, output_fs, "Uses", "File I/O")
```

## Data Flow Diagram

```mermaid
graph TB
    subgraph "Input"
        GrammarFile[Grammar File<br/>.langium]
        ConfigFile[Config File<br/>.glspgenrc]
        Templates[Template Files<br/>.hbs]
    end
    
    subgraph "Processing"
        Parser[Parser<br/>Langium AST]
        Validator[Validator<br/>Schema & Rules]
        Transformer[Transformer<br/>Model Enhancement]
        Renderer[Renderer<br/>Template Engine]
    end
    
    subgraph "Output"
        BrowserCode[Browser Code<br/>TypeScript]
        ServerCode[Server Code<br/>TypeScript]
        CommonCode[Common Code<br/>TypeScript]
        PackageJSON[package.json]
        ConfigFiles[Config Files]
    end
    
    GrammarFile --> Parser
    ConfigFile --> Parser
    Parser --> Validator
    Validator --> Transformer
    Transformer --> Renderer
    Templates --> Renderer
    
    Renderer --> BrowserCode
    Renderer --> ServerCode
    Renderer --> CommonCode
    Renderer --> PackageJSON
    Renderer --> ConfigFiles
    
    style Parser fill:#f9f,stroke:#333,stroke-width:2px
    style Validator fill:#9ff,stroke:#333,stroke-width:2px
    style Transformer fill:#ff9,stroke:#333,stroke-width:2px
    style Renderer fill:#9f9,stroke:#333,stroke-width:2px
```