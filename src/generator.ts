import fs from 'fs-extra';
import path from 'path';
import Handlebars from 'handlebars';
import { LangiumGrammarParser } from './utils/langium-parser.js';
import { IGrammarParser } from './types/parser-interface.js';
import { GenerationContext, TemplateData } from './types/grammar.js';
import chalk from 'chalk';
import { GLSPConfig } from './config/types.js';
import { DEFAULT_CONFIG } from './config/default-config.js';
import { GrammarLinter } from './validation/linter.js';
import { ValidationReporter } from './validation/reporter.js';
import { ValidationResult } from './validation/types.js';
import { getTemplatesDir } from './utils/paths.js';
import { DocumentationGenerator } from './documentation/documentation-generator.js';
import { DocumentationOptions } from './documentation/types.js';

export class GLSPGenerator {
  private parser: IGrammarParser;
  private templates: Map<string, HandlebarsTemplateDelegate> = new Map();
  private config: GLSPConfig;
  private linter: GrammarLinter;
  private reporter: ValidationReporter;
  private documentationGenerator: DocumentationGenerator;

  constructor(config?: GLSPConfig, parser?: IGrammarParser) {
    this.parser = parser || new LangiumGrammarParser();
    this.config = config || DEFAULT_CONFIG;
    this.linter = new GrammarLinter(this.config.linter);
    this.reporter = new ValidationReporter();
    this.documentationGenerator = new DocumentationGenerator();
    this.registerHandlebarsHelpers();
  }

  async generateExtension(
    grammarFile: string,
    outputDir: string = '.',
    options?: { generateDocs?: boolean; docsOptions?: DocumentationOptions }
  ): Promise<void> {
    console.log(chalk.blue('🔄 Parsing grammar file...'));
    const grammar = await this.parser.parseGrammarFile(grammarFile);

    const context: GenerationContext = {
      projectName: grammar.projectName,
      grammar,
      outputDir,
      config: this.config
    };

    // Use grammar-based name unless explicitly overridden in config
    const extensionName = this.config.extension.name === 'my-glsp-extension'
      ? `${grammar.projectName}-glsp-extension`
      : this.config.extension.name;
    const extensionDir = path.join(outputDir, extensionName);

    console.log(chalk.blue('📁 Creating project structure...'));
    await this.createProjectStructure(extensionDir);

    console.log(chalk.blue('📝 Loading templates...'));
    await this.loadTemplates();

    console.log(chalk.blue('⚡ Generating files...'));
    await this.generateFiles(context, extensionDir);

    console.log(chalk.green('✅ Extension generated successfully!'));
    console.log(chalk.yellow(`📍 Location: ${extensionDir}`));
    console.log(chalk.cyan(`📊 Generated ${grammar.interfaces.length} interfaces and ${grammar.types.length} types`));

    // Generate documentation if requested
    if (options?.generateDocs) {
      await this.generateDocumentation(grammarFile, extensionDir, options.docsOptions);
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
      'src/server/model'
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

  private async generateFiles(context: GenerationContext, extensionDir: string): Promise<void> {
    // Use grammar-based name unless explicitly overridden in config
    const extensionName = this.config.extension.name === 'my-glsp-extension'
      ? `${context.projectName}-glsp-extension`
      : this.config.extension.name;

    const templateData: TemplateData = {
      projectName: context.projectName,
      interfaces: context.grammar.interfaces,
      types: context.grammar.types,
      config: {
        ...context.config,
        extension: {
          ...context.config.extension,
          name: extensionName
        }
      }
    };

    const fileGenerationMap = [
      {
        template: 'model',
        output: `src/common/${context.projectName}-model.ts`
      },
      {
        template: 'command-contribution',
        output: `src/browser/${context.projectName}-command-contribution.ts`
      },
      {
        template: 'diagram-configuration',
        output: `src/browser/diagram/${context.projectName}-diagram-configuration.ts`
      },
      {
        template: 'server-model',
        output: `src/server/model/${context.projectName}-server-model.ts`
      },
      {
        template: 'create-node-handler',
        output: `src/server/handlers/create-${context.projectName}-node-handler.ts`
      },
      {
        template: 'package-json',
        output: 'package.json'
      },
      {
        template: 'tsconfig',
        output: 'tsconfig.json'
      }
    ];

    for (const { template, output } of fileGenerationMap) {
      const templateFn = this.templates.get(template);
      if (!templateFn) {
        console.warn(chalk.yellow(`⚠️  Template '${template}' not found, skipping...`));
        continue;
      }

      const content = templateFn(templateData);
      const outputPath = path.join(extensionDir, output);

      await fs.ensureDir(path.dirname(outputPath));
      await fs.writeFile(outputPath, content);

      console.log(chalk.green(`✓ Generated ${output}`));
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
}
