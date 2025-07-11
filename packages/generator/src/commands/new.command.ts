import { injectable, inject } from 'inversify';
import { Argv } from 'yargs';
import path from 'path';
import { BaseCommand } from './base/base.command.js';
import { TYPES } from '../config/di/types.js';
import { ILogger } from '../utils/logger/index.js';
import fs from 'fs-extra';
import ora from 'ora';
import prompts from 'prompts';

interface NewArgs {
  name?: string;
  template?: 'basic' | 'advanced' | 'minimal';
  'no-git'?: boolean;
  'no-install'?: boolean;
}

@injectable()
export class NewCommand extends BaseCommand<NewArgs> {
  readonly command = ['new <name>', 'init', 'create'];
  readonly describe = 'Create new DSL project from template';
  readonly aliases = ['init', 'create'];

  constructor(
    @inject(TYPES.Logger) logger: ILogger,
    @inject(TYPES.PackageInfo) private readonly packageInfo: { version: string }
  ) {
    super(logger);
  }

  builder(yargs: Argv): Argv<NewArgs> {
    return yargs
      .positional('n', {
        describe: 'Project name',
        type: 'string'
      })
      .option('template', {
        alias: 't',
        describe: 'Template to use',
        choices: ['basic', 'advanced', 'minimal'] as const,
        default: 'basic'
      })
      .option('no-git', {
        describe: 'Skip git initialization',
        type: 'boolean',
        default: false
      })
      .option('no-install', {
        describe: 'Skip dependency installation',
        type: 'boolean',
        default: false
      })
      .example('$0 new my-dsl', 'Create new project with basic template')
      .example('$0 new my-dsl -t advanced', 'Use advanced template') as Argv<NewArgs>;
  }

  async handler(args: NewArgs): Promise<void> {
    try {
      this.logger.info('Creating new GLSP project', { name: args.name });

      const projectName = args.name;
      if (!projectName) {
        throw new Error('Project name is required');
      }

      const projectPath = path.join(process.cwd(), projectName);

      // Check if directory exists
      if (await fs.pathExists(projectPath)) {
        this.logger.error('Directory already exists', { path: projectName });
        process.exit(1);
      }

      // Interactive prompts for project details
      const answers = await prompts([
        {
          type: 'text',
          name: 'description',
          message: 'Project description:',
          initial: 'A new GLSP-based domain-specific language'
        },
        {
          type: 'text',
          name: 'author',
          message: 'Author name:',
          initial: ''
        },
        {
          type: 'confirm',
          name: 'typescript',
          message: 'Use TypeScript?',
          initial: true
        },
        {
          type: 'confirm',
          name: 'tests',
          message: 'Include test setup?',
          initial: true
        },
        {
          type: 'confirm',
          name: 'ci',
          message: 'Add CI/CD configuration?',
          initial: true
        }
      ]);

      const spinner = ora('Creating project structure...').start();

      // Create project directory
      await fs.ensureDir(projectPath);

      // Create basic project structure
      const dirs = [
        'src',
        'src/grammar',
        'src/examples',
        'generated',
        'docs'
      ];

      if (answers.tests) {
        dirs.push('test');
      }

      for (const dir of dirs) {
        await fs.ensureDir(path.join(projectPath, dir));
      }

      // Create package.json
      const projectPackageJson: any = {
        name: projectName,
        version: '0.1.0',
        description: answers.description,
        author: answers.author,
        license: 'MIT',
        type: 'module',
        scripts: {
          'generate': 'glsp gen src/grammar/main.langium generated',
          'generate:watch': 'glsp watch src/grammar/main.langium generated',
          'build': 'yarn generate && tsc',
          'dev': 'yarn generate:watch',
          'clean': 'rimraf generated dist'
        },
        devDependencies: {
          'glsp-generator': `^${this.packageInfo.version}`,
          'rimraf': '^5.0.5'
        }
      };

      if (answers.typescript) {
        projectPackageJson.devDependencies['typescript'] = '^5.0.0';
        projectPackageJson.devDependencies['@types/node'] = '^20.0.0';
      }

      if (answers.tests) {
        projectPackageJson.scripts['test'] = 'jest';
        projectPackageJson.devDependencies['jest'] = '^29.5.0';
        projectPackageJson.devDependencies['@types/jest'] = '^29.5.0';
      }

      await fs.writeJson(path.join(projectPath, 'package.json'), projectPackageJson, { spaces: 2 });

      // Create example grammar
      const grammarContent = `// ${projectName} Grammar Definition
grammar ${projectName}

// Define your language elements here
interface Element {
    name: string
}

interface Node extends Element {
    x: number
    y: number
}

interface Edge extends Element {
    source: @Node
    target: @Node
}

// Define union types
type ModelElement = Node | Edge
`;

      await fs.writeFile(
        path.join(projectPath, 'src/grammar/main.langium'),
        grammarContent
      );

      // Create README
      const readmeContent = `# ${projectName}

${answers.description}

## Getting Started

1. Install dependencies:
   \`\`\`bash
   yarn install
   \`\`\`

2. Generate GLSP extension:
   \`\`\`bash
   yarn generate
   \`\`\`

3. Watch for changes:
   \`\`\`bash
   yarn dev
   \`\`\`

## Project Structure

- \`src/grammar/\` - Langium grammar definitions
- \`src/examples/\` - Example models
- \`generated/\` - Generated GLSP extension code
- \`docs/\` - Documentation

## License

${answers.author ? `Copyright (c) ${new Date().getFullYear()} ${answers.author}` : ''}
Licensed under the MIT License.
`;

      await fs.writeFile(path.join(projectPath, 'README.md'), readmeContent);

      // Create .gitignore
      if (!args['no-git']) {
        const gitignoreContent = `node_modules
dist
generated
*.log
.DS_Store
`;
        await fs.writeFile(path.join(projectPath, '.gitignore'), gitignoreContent);
      }

      // Create TypeScript config if needed
      if (answers.typescript) {
        const tsConfig = {
          compilerOptions: {
            target: 'ES2022',
            module: 'ES2022',
            moduleResolution: 'bundler',
            lib: ['ES2022'],
            outDir: './dist',
            rootDir: './src',
            strict: true,
            esModuleInterop: true,
            skipLibCheck: true,
            forceConsistentCasingInFileNames: true
          },
          include: ['src/**/*'],
          exclude: ['node_modules', 'dist', 'generated']
        };
        await fs.writeJson(path.join(projectPath, 'tsconfig.json'), tsConfig, { spaces: 2 });
      }

      spinner.succeed('Project structure created');

      // Initialize git
      if (!args['no-git']) {
        const gitSpinner = ora('Initializing git repository...').start();
        const { execSync } = await import('child_process');

        try {
          execSync('git init', { cwd: projectPath, stdio: 'ignore' });
          execSync('git add .', { cwd: projectPath, stdio: 'ignore' });
          execSync('git commit -m "Initial commit"', { cwd: projectPath, stdio: 'ignore' });
          gitSpinner.succeed('Git repository initialized');
        } catch (error) {
          gitSpinner.warn('Git initialization failed (git might not be installed)');
        }
      }

      // Install dependencies
      if (!args['no-install']) {
        const installSpinner = ora('Installing dependencies...').start();
        const { execSync } = await import('child_process');

        try {
          execSync('yarn install', { cwd: projectPath, stdio: 'ignore' });
          installSpinner.succeed('Dependencies installed');
        } catch (error) {
          installSpinner.warn('Dependency installation failed - run yarn install manually');
        }
      }

      this.logger.info('Project created successfully!');
      this.logger.info(`Location: ${projectPath}`);
      this.logger.info('Next steps:');
      this.logger.info(`  cd ${projectName}`);
      if (args['no-install']) {
        this.logger.info('  yarn install');
      }
      this.logger.info('  yarn generate');
      this.logger.info('  yarn dev');

    } catch (error) {
      this.handleError(error);
    }
  }
}