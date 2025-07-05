import fs from 'fs-extra';
import path from 'path';
import Handlebars from 'handlebars';
import { LangiumGrammarParser } from './utils/langium-parser.js';
import { IGrammarParser } from './types/parser-interface.js';
import { GenerationContext, ParsedGrammar } from './types/grammar.js';
import chalk from 'chalk';
import { GLSPConfig } from './config/types.js';
import { DEFAULT_CONFIG } from './config/default-config.js';
import { GrammarLinter } from './validation/linter.js';
import { ValidationReporter } from './validation/reporter.js';
import { ValidationResult } from './validation/types.js';
import { getTemplatesDir } from './utils/paths.js';
import { DocumentationGenerator } from './documentation/documentation-generator.js';
import { DocumentationOptions } from './documentation/types.js';
import { TypeSafetyGenerator, TypeSafetyOptions } from './type-safety/index.js';
import { TestGenerator, TestGeneratorOptions } from './test-generation/index.js';
import { CICDGenerator, CICDGeneratorOptions } from './cicd/index.js';
import { TemplateSystem, TemplateResolver, TemplateOptions } from './templates/index.js';
import { PerformanceOptimizer, PerformanceConfig } from './performance/index.js';
import { parseGrammarToAST } from './performance/grammar-converter.js';

export class GLSPGenerator {
  private parser: IGrammarParser;
  private templates: Map<string, HandlebarsTemplateDelegate> = new Map();
  private config: GLSPConfig;
  private linter: GrammarLinter;
  private reporter: ValidationReporter;
  private documentationGenerator: DocumentationGenerator;
  private typeSafetyGenerator: TypeSafetyGenerator;
  private testGenerator: TestGenerator;
  private cicdGenerator: CICDGenerator;
  private templateSystem: TemplateSystem;
  private templateResolver?: TemplateResolver;
  private performanceOptimizer: PerformanceOptimizer;

  constructor(config?: GLSPConfig, parser?: IGrammarParser) {
    this.parser = parser || new LangiumGrammarParser();
    this.config = config || DEFAULT_CONFIG;
    this.linter = new GrammarLinter(this.config.linter);
    this.reporter = new ValidationReporter();
    this.documentationGenerator = new DocumentationGenerator();
    this.typeSafetyGenerator = new TypeSafetyGenerator();
    this.testGenerator = new TestGenerator();
    this.cicdGenerator = new CICDGenerator();
    this.templateSystem = new TemplateSystem();

    // Initialize performance optimizations (disabled in test environment)
    const isTestEnvironment = this.isTestEnvironment();
    const perfConfig: PerformanceConfig = {
      enableCaching: !isTestEnvironment,
      enableParallelProcessing: !isTestEnvironment,
      enableStreaming: !isTestEnvironment,
      enableProgressIndicators: !isTestEnvironment,
      enableMemoryMonitoring: !isTestEnvironment,
      gcHints: !isTestEnvironment,
      profileMode: false
    };
    this.performanceOptimizer = new PerformanceOptimizer(perfConfig);

    this.registerHandlebarsHelpers();
  }

  /**
   * Detect if running in test environment
   */
  private isTestEnvironment(): boolean {
    return (
      process.env.NODE_ENV === 'test' ||
      process.env.JEST_WORKER_ID !== undefined ||
      process.argv.some(arg => arg.includes('jest')) ||
      typeof global !== 'undefined' && 'expect' in global
    );
  }

  async generateExtension(
    grammarFile: string,
    outputDir: string = '.',
    options?: {
      generateDocs?: boolean;
      docsOptions?: DocumentationOptions;
      generateTypeSafety?: boolean;
      typeSafetyOptions?: TypeSafetyOptions;
      generateTests?: boolean;
      testOptions?: TestGeneratorOptions;
      generateCICD?: boolean;
      cicdOptions?: CICDGeneratorOptions;
      templateOptions?: TemplateOptions;
      performanceOptions?: PerformanceConfig;
    }
  ): Promise<{ extensionDir: string }> {
    // Start performance monitoring
    this.performanceOptimizer.startMonitoring();
    const progress = this.performanceOptimizer.getProgress();

    try {
      progress.start();

      // Check file size to determine optimization strategy
      const stats = await fs.stat(grammarFile);
      const shouldOptimize = this.performanceOptimizer.shouldOptimize(stats.size);

      if (shouldOptimize) {
        console.log(chalk.blue('🚀 Large grammar detected, enabling optimizations...'));
      }

      // Phase 1: Parse grammar
      progress.startPhase('Parsing');
      console.log(chalk.blue('🔄 Parsing grammar file...'));

      let grammar;
      if (shouldOptimize && stats.size > 1024 * 1024) { // > 1MB
        // Use streaming parser for large files
        const streamingParser = this.performanceOptimizer.getStreamingParser();
        grammar = await streamingParser.parseFile(grammarFile);
      } else {
        // Check cache first
        const cacheManager = this.performanceOptimizer.getCacheManager();
        // Temporarily disable cache to debug reference issue
        grammar = null; // await cacheManager.getCachedGrammar(grammarFile);

        if (!grammar) {
          const parsedGrammar = await this.parser.parseGrammarFile(grammarFile);
          
          // Debug logging before AST conversion
          const transitionBefore = parsedGrammar.interfaces.find(i => i.name === 'Transition');
          if (transitionBefore) {
            console.log('[DEBUG] Before AST conversion - Transition properties:');
            transitionBefore.properties.forEach(p => {
              console.log(`  ${p.name}: reference=${p.reference}`);
            });
          }
          
          grammar = parseGrammarToAST(parsedGrammar);
          
          // Debug logging after AST conversion
          const transitionAfter = grammar.interfaces.find(i => i.name === 'Transition');
          if (transitionAfter) {
            console.log('[DEBUG] After AST conversion - Transition properties:');
            transitionAfter.properties.forEach(p => {
              console.log(`  ${p.name}: reference=${p.reference}`);
            });
          }
          
          cacheManager.cacheGrammar(grammarFile, grammar);
        } else {
          console.log(chalk.gray('📦 Using cached grammar'));
        }
      }

      // Update progress message based on available data
      if ('rules' in grammar && grammar.rules) {
        progress.completePhase(`Parsed ${grammar.rules.length} rules`);
      } else {
        progress.completePhase(`Parsed ${grammar.interfaces?.length || 0} interfaces and ${grammar.types?.length || 0} types`);
      }

      // Ensure we have a ParsedGrammar for the context
      const parsedGrammar: ParsedGrammar = 'rules' in grammar ? {
        projectName: grammar.projectName,
        interfaces: grammar.interfaces,
        types: grammar.types
      } : grammar;

      const context: GenerationContext = {
        projectName: parsedGrammar.projectName,
        grammar: parsedGrammar,
        outputDir,
        config: this.config
      };

      // Use grammar-based name unless explicitly overridden in config
      const extensionName = this.config.extension.name === 'my-glsp-extension'
        ? `${grammar.projectName}-glsp-extension`
        : this.config.extension.name;
      const extensionDir = path.join(outputDir, extensionName);

      // Phase 2: Setup
      progress.startPhase('Setup');
      console.log(chalk.blue('📁 Creating project structure...'));
      await this.createProjectStructure(extensionDir);

      console.log(chalk.blue('📝 Loading templates...'));
      this.templateResolver = await this.templateSystem.initialize(options?.templateOptions);
      progress.completePhase('Project structure ready');

      // Phase 3: Generation
      progress.startPhase('Generation');
      console.log(chalk.blue('⚡ Generating files...'));
      await this.generateFiles(context, extensionDir, shouldOptimize);
      progress.completePhase(`Generated files in ${extensionDir}`);

      // Phase 4: Additional Features
      if (options?.generateDocs || options?.generateTypeSafety || options?.generateTests || options?.generateCICD) {
        progress.startPhase('Additional Features');

        // Generate documentation if requested
        if (options?.generateDocs) {
          await this.generateDocumentation(grammarFile, extensionDir, options.docsOptions);
        }

        // Generate type safety if requested
        if (options?.generateTypeSafety) {
          await this.generateTypeSafety(grammarFile, extensionDir, options.typeSafetyOptions);
        }

        // Generate tests if requested
        if (options?.generateTests) {
          await this.generateTests(grammarFile, extensionDir, options.testOptions);
        }

        // Generate CI/CD if requested
        if (options?.generateCICD) {
          await this.generateCICD(grammarFile, extensionDir, options.cicdOptions);
        }

        progress.completePhase('Additional features generated');
      }

      progress.complete();

      console.log(chalk.green('✅ Extension generated successfully!'));
      console.log(chalk.yellow(`📍 Location: ${extensionDir}`));
      console.log(chalk.cyan(`📊 Generated ${parsedGrammar.interfaces?.length || 0} interfaces and ${parsedGrammar.types?.length || 0} types`));

      // Show performance recommendations if optimizations are enabled
      const recommendations = this.performanceOptimizer.getOptimizationRecommendations();
      if (recommendations.length > 0) {
        console.log(chalk.blue('\n💡 Performance Recommendations:'));
        recommendations.forEach(rec => console.log(chalk.gray(`  • ${rec}`)));
      }

      return { extensionDir };

    } catch (error) {
      progress.abort(error instanceof Error ? error.message : String(error));
      throw error;
    } finally {
      // Stop monitoring and generate performance report
      await this.performanceOptimizer.stopMonitoring();
    }
  }

  private async createProjectStructure(extensionDir: string): Promise<void> {
    const directories = [
      'src',
      'src/browser',
      'src/browser/diagram',
      'src/common',
      'src/node',
      'src/server',
      'src/server/diagram',
      'src/server/handlers',
      'src/server/model',
      'src/extension',
      'src/webview',
      'syntaxes',
      'dist',
      'dist/webview'
    ];

    await fs.ensureDir(extensionDir);

    for (const dir of directories) {
      await fs.ensureDir(path.join(extensionDir, dir));
    }
  }

  private async loadTemplates(): Promise<void> {
    // Templates are relative to this file's location
    const templateDir = getTemplatesDir();
    const templateFiles = await fs.readdir(templateDir);

    for (const file of templateFiles) {
      if (file.endsWith('.hbs')) {
        const templateName = path.basename(file, '.hbs');
        const templateContent = await fs.readFile(path.join(templateDir, file), 'utf-8');
        this.templates.set(templateName, Handlebars.compile(templateContent));
      }
    }
  }

  private async generateFiles(context: GenerationContext, extensionDir: string, useOptimizations = false): Promise<void> {
    if (!this.templateResolver) {
      throw new Error('Template resolver not initialized');
    }

    // Use grammar-based name unless explicitly overridden in config
    const extensionName = this.config.extension.name === 'my-glsp-extension'
      ? `${context.projectName}-glsp-extension`
      : this.config.extension.name;

    const templateContext = {
      projectName: context.projectName,
      grammar: context.grammar,
      config: {
        ...context.config,
        extension: {
          ...context.config.extension,
          name: extensionName
        }
      },
      outputDir: extensionDir,
      // Legacy template data format for backward compatibility
      interfaces: context.grammar.interfaces,
      types: context.grammar.types
    };

    // Debug log for reference flag
    const transition = context.grammar.interfaces.find(i => i.name === 'Transition');
    if (transition) {
      console.log('[DEBUG] Transition interface properties in template context:');
      transition.properties.forEach(p => {
        console.log(`  ${p.name}: reference=${p.reference}, type=${p.type}`);
      });
    }

    // Get all templates to generate
    const generationItems = this.templateResolver.resolveTemplates(templateContext);
    const progress = this.performanceOptimizer.getProgress();

    // Temporarily disable parallel processing due to path issues
    // if (useOptimizations && generationItems.length > 10) {
    //   // Use parallel processing for large numbers of templates
    //   await this.generateFilesParallel(generationItems, templateContext, extensionDir, progress);
    // } else {
      // Use sequential generation for smaller sets
      await this.generateFilesSequential(generationItems, templateContext, extensionDir, progress);
    // }
  }

  private async generateFilesSequential(
    generationItems: any[],
    templateContext: any,
    extensionDir: string,
    progress: any
  ): Promise<void> {
    let completed = 0;

    for (const item of generationItems) {
      try {
        const content = item.template.template(templateContext);
        const outputPath = path.join(extensionDir, item.outputPath);

        await fs.ensureDir(path.dirname(outputPath));
        await fs.writeFile(outputPath, content);

        console.log(chalk.green(`✓ Generated ${item.outputPath}`));
        progress.updateProgress(++completed, generationItems.length, item.outputPath);
      } catch (error) {
        console.error(chalk.red(`✗ Failed to generate ${item.outputPath}: ${error}`));
      }
    }
  }

  private async generateFilesParallel(
    generationItems: any[],
    templateContext: any,
    extensionDir: string,
    progress: any
  ): Promise<void> {
    console.log(chalk.blue('⚡ Using parallel processing for template generation'));

    const parallelProcessor = this.performanceOptimizer.getParallelProcessor();

    // Convert generation items to templates format expected by parallel processor
    const templates = generationItems.map((item, index) => ({
      name: item.templateName,
      path: item.outputPath,
      content: '', // Will be filled during processing
      dependencies: [], // No dependencies for now
      priority: index
    }));

    try {
      const results = await parallelProcessor.processTemplates(templates, {
        projectName: templateContext.projectName,
        grammar: templateContext.grammar,
        config: templateContext.config,
        outputDir: extensionDir
      });

      let completed = 0;
      for (const result of results) {
        const outputPath = path.join(extensionDir, result.outputPath);

        await fs.ensureDir(path.dirname(outputPath));
        await fs.writeFile(outputPath, result.content);

        console.log(chalk.green(`✓ Generated ${result.outputPath} (${result.duration.toFixed(1)}ms)`));
        progress.updateProgress(++completed, results.length, result.outputPath);
      }
    } catch (error) {
      console.error(chalk.red('✗ Parallel processing failed, falling back to sequential'));
      await this.generateFilesSequential(generationItems, templateContext, extensionDir, progress);
    }
  }

  private registerHandlebarsHelpers(): void {
    // Helper for converting strings to lowercase
    Handlebars.registerHelper('toLowerCase', (str: string) =>
      str ? str.toLowerCase() : ''
    );

    // Helper for converting strings to PascalCase
    Handlebars.registerHelper('toPascalCase', (str: string) => {
      if (!str) return '';
      return str
        .split(/[-_\s]+/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join('');
    });

    // Helper for converting strings to camelCase
    Handlebars.registerHelper('toCamelCase', (str: string) => {
      if (!str) return '';
      const pascal = Handlebars.helpers.toPascalCase(str);
      return pascal.charAt(0).toLowerCase() + pascal.slice(1);
    });

    // Helper for checking if array has elements
    Handlebars.registerHelper('hasElements', (arr: any[]) => arr && arr.length > 0);

    // Helper for joining array elements
    Handlebars.registerHelper('join', (arr: any[], separator: string) =>
      arr ? arr.join(separator) : ''
    );

    // Helper for indentation
    Handlebars.registerHelper('indent', (count: number) => '    '.repeat(count));

    // Helper for generating TypeScript property type
    Handlebars.registerHelper('tsType', (type: string, optional: boolean, array: boolean) => {
      let tsType = type;
      if (array) tsType += '[]';
      if (optional) tsType += ' | undefined';
      return tsType;
    });

    // Helper for equality comparison
    Handlebars.registerHelper('eq', (a: any, b: any) => a === b);

    // Helper for inequality comparison
    Handlebars.registerHelper('neq', (a: any, b: any) => a !== b);

    // Helper for logical NOT
    Handlebars.registerHelper('not', (value: any) => !value);

    // Helper for logical AND
    Handlebars.registerHelper('and', (...args: any[]) => {
      // Remove the last argument (Handlebars options object)
      const values = args.slice(0, -1);
      return values.every(v => v);
    });

    // Helper for logical OR
    Handlebars.registerHelper('or', (...args: any[]) => {
      // Remove the last argument (Handlebars options object)
      const values = args.slice(0, -1);
      return values.some(v => v);
    });

    // Helper for unless (inverse of if)
    Handlebars.registerHelper('unless', function (this: any, conditional: any, options: any) {
      if (!conditional) {
        return options.fn(this);
      }
      return options.inverse(this);
    });

    // Helper for pluralizing words
    Handlebars.registerHelper('pluralize', (str: string) => {
      if (!str) return '';
      
      // Handle common irregular plurals
      const irregulars: Record<string, string> = {
        'State': 'States',
        'state': 'states',
        'Transition': 'Transitions',
        'transition': 'transitions',
        'Property': 'Properties',
        'property': 'properties'
      };
      
      if (irregulars[str]) return irregulars[str];
      
      // Simple pluralization rules
      if (str.endsWith('y')) {
        return str.slice(0, -1) + 'ies';
      } else if (str.endsWith('s') || str.endsWith('x') || str.endsWith('ch') || str.endsWith('sh')) {
        return str + 'es';
      } else {
        return str + 's';
      }
    });
  }

  async validateGrammar(grammarFile: string, options?: {
    generateReport?: boolean;
    reportPath?: string;
    reportFormat?: 'markdown' | 'html';
  }): Promise<boolean> {
    const grammarContent = await fs.readFile(grammarFile, 'utf-8');

    // Parse AST
    let ast: any;
    try {
      ast = await this.parser.parseGrammar(grammarContent);
    } catch (error) {
      console.error(chalk.red(`Failed to parse grammar: ${error}`));
      return false;
    }

    // Run linter
    const result = await this.linter.lintGrammar(grammarFile, grammarContent, ast);

    // Display results
    const formatted = this.linter.formatResults(result, grammarFile, grammarContent.split('\n'));
    console.log(formatted);

    // Generate report if requested
    if (options?.generateReport && options.reportPath) {
      if (options.reportFormat === 'html') {
        await this.reporter.generateHtmlReport(result, grammarFile, options.reportPath);
        console.log(chalk.blue(`📄 HTML report generated: ${options.reportPath}`));
      } else {
        await this.reporter.generateMarkdownReport(result, grammarFile, options.reportPath);
        console.log(chalk.blue(`📄 Markdown report generated: ${options.reportPath}`));
      }
    }

    return result.valid;
  }

  async validateWithDetails(grammarFile: string): Promise<ValidationResult> {
    const grammarContent = await fs.readFile(grammarFile, 'utf-8');
    const ast = await this.parser.parseGrammar(grammarContent);
    return await this.linter.lintGrammar(grammarFile, grammarContent, ast);
  }

  async generateDocumentation(
    grammarFile: string,
    outputDir: string = '.',
    options?: DocumentationOptions
  ): Promise<void> {
    console.log(chalk.blue('📚 Generating documentation...'));

    // Parse grammar
    const grammar = await this.parser.parseGrammarFile(grammarFile);

    // Generate documentation
    const result = await this.documentationGenerator.generate(
      grammar,
      this.config,
      outputDir,
      options
    );

    if (result.success) {
      console.log(chalk.green('✅ Documentation generated successfully!'));
      console.log(chalk.gray(`   Files generated: ${result.filesGenerated.length}`));
    } else {
      console.error(chalk.red('❌ Some documentation generation failed:'));
      result.errors?.forEach(error => console.error(chalk.red(`   - ${error}`)));
    }
  }

  async generateTypeSafety(
    grammarFile: string,
    outputDir: string = '.',
    options?: TypeSafetyOptions
  ): Promise<void> {
    console.log(chalk.blue('🔒 Generating type safety features...'));

    // Parse grammar
    const grammar = await this.parser.parseGrammarFile(grammarFile);

    // Generate type safety
    const result = await this.typeSafetyGenerator.generate(
      grammar,
      this.config,
      outputDir,
      options
    );

    if (result.success) {
      console.log(chalk.green('✅ Type safety features generated successfully!'));
      console.log(chalk.gray(`   Files generated: ${result.filesGenerated.length}`));
    } else {
      console.error(chalk.red('❌ Some type safety generation failed:'));
      result.errors?.forEach(error => console.error(chalk.red(`   - ${error}`)));
    }
  }

  async generateTests(
    grammarFile: string,
    outputDir: string = '.',
    options?: TestGeneratorOptions
  ): Promise<void> {
    console.log(chalk.blue('🧪 Generating test infrastructure...'));

    // Parse grammar
    const grammar = await this.parser.parseGrammarFile(grammarFile);

    // Generate tests
    const result = await this.testGenerator.generate(
      grammar,
      this.config,
      outputDir,
      options
    );

    if (result.success) {
      console.log(chalk.green('✅ Test infrastructure generated successfully!'));
      console.log(chalk.gray(`   Files generated: ${result.filesGenerated.length}`));
    } else {
      console.error(chalk.red('❌ Some test generation failed:'));
      result.errors?.forEach(error => console.error(chalk.red(`   - ${error}`)));
    }
  }

  async generateCICD(
    grammarFile: string,
    outputDir: string = '.',
    options?: CICDGeneratorOptions
  ): Promise<void> {
    console.log(chalk.blue('🚀 Generating CI/CD configuration...'));

    // Parse grammar
    const grammar = await this.parser.parseGrammarFile(grammarFile);

    // Generate CI/CD
    const result = await this.cicdGenerator.generate(
      grammar,
      this.config,
      outputDir,
      options
    );

    if (result.success) {
      console.log(chalk.green('✅ CI/CD configuration generated successfully!'));
      console.log(chalk.gray(`   Files generated: ${result.filesGenerated.length}`));
    } else {
      console.error(chalk.red('❌ Some CI/CD generation failed:'));
      result.errors?.forEach(error => console.error(chalk.red(`   - ${error}`)));
    }
  }
}
