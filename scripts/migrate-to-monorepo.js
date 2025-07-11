#!/usr/bin/env node

/**
 * Migration script to convert GLSP Generator to monorepo structure
 * Run with: node scripts/migrate-to-monorepo.js
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log(chalk.blue('🚀 Starting monorepo migration...'));

async function createMonorepoStructure() {
  console.log(chalk.yellow('📁 Creating monorepo structure...'));
  
  // Create packages directory
  const packagesDir = path.join(rootDir, 'packages');
  await fs.ensureDir(packagesDir);
  
  // Create generator package directory
  const generatorDir = path.join(packagesDir, 'generator');
  await fs.ensureDir(generatorDir);
  
  // Create vscode-extension package directory
  const vscodeDir = path.join(packagesDir, 'vscode-extension');
  await fs.ensureDir(vscodeDir);
  
  console.log(chalk.green('✓ Created packages directory structure'));
}

async function moveGeneratorFiles() {
  console.log(chalk.yellow('📦 Moving generator files...'));
  
  const generatorDir = path.join(rootDir, 'packages', 'generator');
  
  // List of directories and files to move
  const itemsToMove = [
    'src',
    'templates',
    'dist',
    '.vscode',
    'package.json',
    'tsconfig.json',
    'vitest.config.ts',
    'CLAUDE.md',
    'TESTPLAN.md',
    'README.md',
    'LICENSE'
  ];
  
  for (const item of itemsToMove) {
    const sourcePath = path.join(rootDir, item);
    const targetPath = path.join(generatorDir, item);
    
    if (await fs.pathExists(sourcePath)) {
      console.log(`  Moving ${item}...`);
      await fs.move(sourcePath, targetPath, { overwrite: true });
    }
  }
  
  console.log(chalk.green('✓ Moved generator files'));
}

async function createRootPackageJson() {
  console.log(chalk.yellow('📝 Creating root package.json...'));
  
  const rootPackageJson = {
    name: '@glsp/monorepo',
    version: '1.0.0',
    private: true,
    workspaces: [
      'packages/*'
    ],
    scripts: {
      'build': 'yarn workspaces foreach -pt run build',
      'test': 'yarn workspaces foreach -pt run test',
      'clean': 'yarn workspaces foreach -p run clean',
      'dev': 'yarn workspace @glsp/generator dev',
      'lint': 'yarn workspaces foreach -p run lint',
      'typecheck': 'yarn workspaces foreach -p run typecheck'
    },
    devDependencies: {
      '@types/node': '^20.0.0',
      'typescript': '^5.0.0',
      'vitest': '^1.0.0'
    },
    packageManager: 'yarn@3.6.3'
  };
  
  await fs.writeJson(path.join(rootDir, 'package.json'), rootPackageJson, { spaces: 2 });
  
  console.log(chalk.green('✓ Created root package.json'));
}

async function updateGeneratorPackageJson() {
  console.log(chalk.yellow('📝 Updating generator package.json...'));
  
  const packageJsonPath = path.join(rootDir, 'packages', 'generator', 'package.json');
  const packageJson = await fs.readJson(packageJsonPath);
  
  // Update package name if needed
  if (!packageJson.name.startsWith('@glsp/')) {
    packageJson.name = '@glsp/generator';
  }
  
  // Ensure it's publishable
  delete packageJson.private;
  
  await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });
  
  console.log(chalk.green('✓ Updated generator package.json'));
}

async function createVSCodeExtension() {
  console.log(chalk.yellow('🔧 Creating VSCode extension package...'));
  
  const vscodeDir = path.join(rootDir, 'packages', 'vscode-extension');
  
  // Create package.json
  const packageJson = {
    name: '@glsp/vscode-extension',
    displayName: 'GLSP Generator Tools',
    description: 'VSCode integration for GLSP Generator',
    version: '1.0.0',
    publisher: 'glsp',
    engines: {
      vscode: '^1.74.0'
    },
    categories: ['Other'],
    activationEvents: [
      'onLanguage:langium',
      'workspaceContains:**/*.langium'
    ],
    main: './out/extension.js',
    contributes: {
      commands: [
        {
          command: 'glsp.generateVSIX',
          title: 'GLSP: Generate VSIX',
          category: 'GLSP'
        },
        {
          command: 'glsp.testVSIX',
          title: 'GLSP: Test VSIX in Extension Host',
          category: 'GLSP'
        },
        {
          command: 'glsp.generateProject',
          title: 'GLSP: Generate Project Only',
          category: 'GLSP'
        },
        {
          command: 'glsp.validateGrammar',
          title: 'GLSP: Validate Grammar',
          category: 'GLSP'
        }
      ],
      menus: {
        'explorer/context': [
          {
            when: 'resourceExtname == .langium',
            command: 'glsp.generateVSIX',
            group: 'glsp@1'
          },
          {
            when: 'resourceExtname == .langium',
            command: 'glsp.testVSIX',
            group: 'glsp@2'
          },
          {
            when: 'resourceExtname == .langium',
            command: 'glsp.generateProject',
            group: 'glsp@3'
          },
          {
            when: 'resourceExtname == .langium',
            command: 'glsp.validateGrammar',
            group: 'glsp@4'
          }
        ]
      },
      configuration: {
        title: 'GLSP Generator',
        properties: {
          'glsp.generator.outputDirectory': {
            type: 'string',
            default: 'same-as-grammar',
            enum: ['same-as-grammar', 'workspace-root', 'custom'],
            description: 'Where to output generated files'
          },
          'glsp.generator.autoOpenOutput': {
            type: 'boolean',
            default: false,
            description: 'Automatically open output folder after generation'
          },
          'glsp.generator.showNotifications': {
            type: 'boolean',
            default: true,
            description: 'Show progress notifications during generation'
          }
        }
      }
    },
    scripts: {
      'vscode:prepublish': 'yarn run compile',
      'compile': 'tsc -p ./',
      'watch': 'tsc -watch -p ./',
      'package': 'vsce package',
      'publish': 'vsce publish'
    },
    dependencies: {
      '@glsp/generator': 'workspace:*'
    },
    devDependencies: {
      '@types/vscode': '^1.74.0',
      '@types/node': '^20.0.0',
      'typescript': '^5.0.0',
      '@vscode/vsce': '^2.0.0'
    }
  };
  
  await fs.writeJson(path.join(vscodeDir, 'package.json'), packageJson, { spaces: 2 });
  
  // Create tsconfig.json
  const tsconfig = {
    compilerOptions: {
      module: 'commonjs',
      target: 'ES2020',
      outDir: 'out',
      lib: ['ES2020'],
      sourceMap: true,
      rootDir: 'src',
      strict: true
    },
    exclude: ['node_modules', '.vscode-test']
  };
  
  await fs.writeJson(path.join(vscodeDir, 'tsconfig.json'), tsconfig, { spaces: 2 });
  
  // Create src directory
  const srcDir = path.join(vscodeDir, 'src');
  await fs.ensureDir(srcDir);
  
  // Create basic extension.ts
  const extensionContent = `import * as vscode from 'vscode';
import { GLSPGenerator } from '@glsp/generator';
import { GenerateVSIXCommand } from './commands/generateVSIX';
import { TestVSIXCommand } from './commands/testVSIX';
import { GenerateProjectCommand } from './commands/generateProject';
import { ValidateGrammarCommand } from './commands/validateGrammar';

export function activate(context: vscode.ExtensionContext) {
    console.log('GLSP Generator Tools is now active!');
    
    const generator = new GLSPGenerator();
    
    // Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand('glsp.generateVSIX', 
            (uri: vscode.Uri) => new GenerateVSIXCommand(generator).execute(uri)
        ),
        vscode.commands.registerCommand('glsp.testVSIX',
            (uri: vscode.Uri) => new TestVSIXCommand(generator).execute(uri)
        ),
        vscode.commands.registerCommand('glsp.generateProject',
            (uri: vscode.Uri) => new GenerateProjectCommand(generator).execute(uri)
        ),
        vscode.commands.registerCommand('glsp.validateGrammar',
            (uri: vscode.Uri) => new ValidateGrammarCommand(generator).execute(uri)
        )
    );
    
    // Status bar item
    const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBar.text = '$(symbol-namespace) GLSP';
    statusBar.tooltip = 'GLSP Generator Tools';
    statusBar.show();
    context.subscriptions.push(statusBar);
}

export function deactivate() {}
`;
  
  await fs.writeFile(path.join(srcDir, 'extension.ts'), extensionContent);
  
  // Create commands directory
  const commandsDir = path.join(srcDir, 'commands');
  await fs.ensureDir(commandsDir);
  
  // Create a sample command
  const generateVSIXCommand = `import * as vscode from 'vscode';
import * as path from 'path';
import { GLSPGenerator } from '@glsp/generator';

export class GenerateVSIXCommand {
    constructor(private generator: GLSPGenerator) {}
    
    async execute(uri: vscode.Uri) {
        if (!uri || !uri.fsPath.endsWith('.langium')) {
            vscode.window.showErrorMessage('Please select a .langium file');
            return;
        }
        
        const grammarPath = uri.fsPath;
        const outputDir = path.dirname(grammarPath);
        
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Generating GLSP Extension",
            cancellable: false
        }, async (progress) => {
            try {
                progress.report({ increment: 0, message: "Parsing grammar..." });
                
                const result = await this.generator.generateExtension(grammarPath, outputDir);
                
                progress.report({ increment: 100, message: "Complete!" });
                
                if (result.success) {
                    const vsixName = \`\${path.basename(grammarPath, '.langium')}-glsp.vsix\`;
                    vscode.window.showInformationMessage(
                        \`Generated VSIX: \${vsixName}\`,
                        'Open Folder'
                    ).then(selection => {
                        if (selection === 'Open Folder') {
                            vscode.env.openExternal(vscode.Uri.file(outputDir));
                        }
                    });
                } else {
                    vscode.window.showErrorMessage(\`Generation failed: \${result.error}\`);
                }
            } catch (error: any) {
                vscode.window.showErrorMessage(\`Generation failed: \${error.message}\`);
            }
        });
    }
}
`;
  
  await fs.writeFile(path.join(commandsDir, 'generateVSIX.ts'), generateVSIXCommand);
  
  // Create README
  const readme = `# GLSP Generator VSCode Extension

This extension provides convenient access to the GLSP Generator directly from VSCode.

## Features

- Right-click any \`.langium\` file to generate GLSP extensions
- Test generated extensions in Extension Development Host
- Validate grammar files
- Generate project structure without packaging

## Usage

1. Open a folder containing \`.langium\` files
2. Right-click on a \`.langium\` file
3. Select one of the GLSP commands from the context menu

## Commands

- **GLSP: Generate VSIX** - Generate a packaged VSIX extension
- **GLSP: Test VSIX** - Generate and test in Extension Development Host
- **GLSP: Generate Project Only** - Generate project without packaging
- **GLSP: Validate Grammar** - Check grammar for errors

## Requirements

- VSCode 1.74.0 or higher
- Node.js 18.x or higher
`;
  
  await fs.writeFile(path.join(vscodeDir, 'README.md'), readme);
  
  console.log(chalk.green('✓ Created VSCode extension structure'));
}

async function createRootFiles() {
  console.log(chalk.yellow('📄 Creating root configuration files...'));
  
  // Update .gitignore
  const gitignore = `node_modules/
dist/
out/
*.log
*.vsix
.vscode-test/
coverage/
.yarn/*
!.yarn/patches
!.yarn/releases
!.yarn/plugins
!.yarn/sdks
!.yarn/versions
.pnp.*
`;
  
  await fs.writeFile(path.join(rootDir, '.gitignore'), gitignore);
  
  // Create root tsconfig.json
  const rootTsConfig = {
    compilerOptions: {
      composite: true,
      declaration: true,
      declarationMap: true,
      module: 'ES2022',
      target: 'ES2022',
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true
    },
    references: [
      { path: './packages/generator' },
      { path: './packages/vscode-extension' }
    ]
  };
  
  await fs.writeJson(path.join(rootDir, 'tsconfig.json'), rootTsConfig, { spaces: 2 });
  
  // Create monorepo README
  const readme = `# GLSP Generator Monorepo

This monorepo contains:
- **@glsp/generator** - Core GLSP generator library
- **@glsp/vscode-extension** - VSCode extension for convenient access

## Development Setup

\`\`\`powershell
# Install dependencies
yarn install

# Build all packages
yarn build

# Run tests
yarn test

# Development mode
yarn dev
\`\`\`

## Package Structure

- \`packages/generator/\` - Core generator implementation
- \`packages/vscode-extension/\` - VSCode integration

See individual package READMEs for more details.
`;
  
  await fs.writeFile(path.join(rootDir, 'README.md'), readme);
  
  console.log(chalk.green('✓ Created root configuration files'));
}

async function main() {
  try {
    await createMonorepoStructure();
    await moveGeneratorFiles();
    await createRootPackageJson();
    await updateGeneratorPackageJson();
    await createVSCodeExtension();
    await createRootFiles();
    
    console.log(chalk.green('\n✅ Monorepo migration complete!'));
    console.log(chalk.blue('\nNext steps:'));
    console.log('1. Run: yarn install');
    console.log('2. Run: yarn build');
    console.log('3. Test the generator: yarn workspace @glsp/generator test');
    console.log('4. Build VSCode extension: yarn workspace @glsp/vscode-extension compile');
    
  } catch (error) {
    console.error(chalk.red('❌ Migration failed:'), error);
    process.exit(1);
  }
}

// Run migration
main();