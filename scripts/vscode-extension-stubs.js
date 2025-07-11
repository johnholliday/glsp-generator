#!/usr/bin/env node

/**
 * Creates stub files for VSCode extension commands
 * Run after migrate-to-monorepo.js
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const commandsDir = path.join(rootDir, 'packages', 'vscode-extension', 'src', 'commands');

const commands = {
  'testVSIX.ts': `import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs-extra';
import { GLSPGenerator } from '@glsp/generator';

export class TestVSIXCommand {
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
            title: "Testing GLSP Extension",
            cancellable: false
        }, async (progress) => {
            try {
                // Step 1: Generate VSIX
                progress.report({ increment: 0, message: "Generating VSIX..." });
                const result = await this.generator.generateExtension(grammarPath, outputDir);
                
                if (!result.success) {
                    throw new Error(result.error || 'Generation failed');
                }
                
                // Step 2: Find the generated VSIX
                progress.report({ increment: 50, message: "Preparing Extension Host..." });
                const vsixFiles = await fs.readdir(outputDir);
                const vsixFile = vsixFiles.find(f => f.endsWith('.vsix'));
                
                if (!vsixFile) {
                    throw new Error('No VSIX file found');
                }
                
                const vsixPath = path.join(outputDir, vsixFile);
                
                // Step 3: Launch Extension Development Host
                progress.report({ increment: 80, message: "Launching Extension Host..." });
                
                // Create a test workspace if it doesn't exist
                const testWorkspace = path.join(outputDir, 'test-workspace');
                await fs.ensureDir(testWorkspace);
                
                // Create a sample file for testing
                const sampleFile = path.join(testWorkspace, 'example.txt');
                await fs.writeFile(sampleFile, 'Test your GLSP extension here!');
                
                // Open new window with the extension
                const extensionDevHost = vscode.Uri.file(testWorkspace);
                await vscode.commands.executeCommand('vscode.openFolder', extensionDevHost, true);
                
                // Note: Auto-installing the VSIX in the new window requires additional setup
                vscode.window.showInformationMessage(
                    \`Extension Host launched! Install the VSIX manually: \${vsixFile}\`,
                    'Copy Path'
                ).then(selection => {
                    if (selection === 'Copy Path') {
                        vscode.env.clipboard.writeText(vsixPath);
                    }
                });
                
            } catch (error: any) {
                vscode.window.showErrorMessage(\`Test failed: \${error.message}\`);
            }
        });
    }
}
`,

  'generateProject.ts': `import * as vscode from 'vscode';
import * as path from 'path';
import { GLSPGenerator } from '@glsp/generator';

export class GenerateProjectCommand {
    constructor(private generator: GLSPGenerator) {}
    
    async execute(uri: vscode.Uri) {
        if (!uri || !uri.fsPath.endsWith('.langium')) {
            vscode.window.showErrorMessage('Please select a .langium file');
            return;
        }
        
        const grammarPath = uri.fsPath;
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
        
        // Ask user for output directory
        const outputDirName = await vscode.window.showInputBox({
            prompt: 'Enter output directory name',
            value: path.basename(grammarPath, '.langium') + '-project',
            validateInput: (value) => {
                if (!value || value.trim() === '') {
                    return 'Directory name cannot be empty';
                }
                return null;
            }
        });
        
        if (!outputDirName) {
            return;
        }
        
        const outputDir = workspaceFolder 
            ? path.join(workspaceFolder.uri.fsPath, outputDirName)
            : path.join(path.dirname(grammarPath), outputDirName);
        
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Generating GLSP Project",
            cancellable: false
        }, async (progress) => {
            try {
                progress.report({ increment: 0, message: "Parsing grammar..." });
                
                // Generate without VSIX packaging
                const result = await this.generator.generateExtension(grammarPath, outputDir, {
                    skipVSIX: true
                });
                
                progress.report({ increment: 100, message: "Complete!" });
                
                if (result.success) {
                    const openProject = await vscode.window.showInformationMessage(
                        \`Project generated at: \${outputDirName}\`,
                        'Open in New Window',
                        'Open Folder'
                    );
                    
                    if (openProject === 'Open in New Window') {
                        await vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(outputDir), true);
                    } else if (openProject === 'Open Folder') {
                        vscode.env.openExternal(vscode.Uri.file(outputDir));
                    }
                } else {
                    vscode.window.showErrorMessage(\`Generation failed: \${result.error}\`);
                }
            } catch (error: any) {
                vscode.window.showErrorMessage(\`Generation failed: \${error.message}\`);
            }
        });
    }
}
`,

  'validateGrammar.ts': `import * as vscode from 'vscode';
import { GLSPGenerator } from '@glsp/generator';

export class ValidateGrammarCommand {
    constructor(private generator: GLSPGenerator) {}
    
    async execute(uri: vscode.Uri) {
        if (!uri || !uri.fsPath.endsWith('.langium')) {
            vscode.window.showErrorMessage('Please select a .langium file');
            return;
        }
        
        const grammarPath = uri.fsPath;
        const diagnosticCollection = vscode.languages.createDiagnosticCollection('glsp-grammar');
        
        try {
            const isValid = await this.generator.validateGrammar(grammarPath);
            
            if (isValid) {
                diagnosticCollection.clear();
                vscode.window.showInformationMessage('Grammar is valid! ✅');
            } else {
                // In a real implementation, we'd parse specific errors
                const diagnostic = new vscode.Diagnostic(
                    new vscode.Range(0, 0, 0, 0),
                    'Grammar validation failed. Check syntax and references.',
                    vscode.DiagnosticSeverity.Error
                );
                
                diagnosticCollection.set(uri, [diagnostic]);
                vscode.window.showErrorMessage('Grammar validation failed. See Problems panel for details.');
            }
        } catch (error: any) {
            const diagnostic = new vscode.Diagnostic(
                new vscode.Range(0, 0, 0, 0),
                \`Validation error: \${error.message}\`,
                vscode.DiagnosticSeverity.Error
            );
            
            diagnosticCollection.set(uri, [diagnostic]);
            vscode.window.showErrorMessage(\`Validation error: \${error.message}\`);
        }
    }
}
`
};

async function createCommandStubs() {
  console.log(chalk.blue('📝 Creating VSCode extension command stubs...'));
  
  if (!await fs.pathExists(commandsDir)) {
    console.log(chalk.yellow('Commands directory not found. Run migrate-to-monorepo.js first.'));
    return;
  }
  
  for (const [filename, content] of Object.entries(commands)) {
    const filePath = path.join(commandsDir, filename);
    await fs.writeFile(filePath, content);
    console.log(chalk.green(`✓ Created ${filename}`));
  }
  
  // Create .vscodeignore for the extension
  const vscodeignore = `.vscode/**
.vscode-test/**
src/**
.gitignore
.yarnrc.yml
.yarn/**
**/*.map
**/*.ts
**/tsconfig.json
`;
  
  const extensionDir = path.join(rootDir, 'packages', 'vscode-extension');
  await fs.writeFile(path.join(extensionDir, '.vscodeignore'), vscodeignore);
  console.log(chalk.green('✓ Created .vscodeignore'));
  
  // Create launch.json for debugging
  const vscodeDir = path.join(extensionDir, '.vscode');
  await fs.ensureDir(vscodeDir);
  
  const launchJson = {
    version: '0.2.0',
    configurations: [
      {
        name: 'Run Extension',
        type: 'extensionHost',
        request: 'launch',
        args: [
          '--extensionDevelopmentPath=${workspaceFolder}'
        ],
        outFiles: [
          '${workspaceFolder}/out/**/*.js'
        ],
        preLaunchTask: '${defaultBuildTask}'
      }
    ]
  };
  
  await fs.writeJson(path.join(vscodeDir, 'launch.json'), launchJson, { spaces: 2 });
  console.log(chalk.green('✓ Created launch.json'));
  
  // Create tasks.json
  const tasksJson = {
    version: '2.0.0',
    tasks: [
      {
        type: 'npm',
        script: 'watch',
        problemMatcher: '$tsc-watch',
        isBackground: true,
        presentation: {
          reveal: 'never'
        },
        group: {
          kind: 'build',
          isDefault: true
        }
      }
    ]
  };
  
  await fs.writeJson(path.join(vscodeDir, 'tasks.json'), tasksJson, { spaces: 2 });
  console.log(chalk.green('✓ Created tasks.json'));
  
  console.log(chalk.green('\n✅ VSCode extension stubs created!'));
}

// Run if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  createCommandStubs().catch(console.error);
}

export { createCommandStubs };