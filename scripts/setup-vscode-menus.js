#!/usr/bin/env node

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// This script creates a local VSCode extension to add context menu items for .langium files
async function setupVSCodeMenus() {
  console.log('Setting up VSCode context menus for .langium files...');

  const extensionDir = path.join(projectRoot, '.vscode', 'glsp-generator-menus');
  
  // Create extension directory
  await fs.ensureDir(extensionDir);

  // Create package.json for the extension
  const packageJson = {
    "name": "glsp-generator-menus",
    "displayName": "GLSP Generator Context Menus",
    "description": "Context menu commands for GLSP Generator",
    "version": "0.0.1",
    "engines": {
      "vscode": "^1.74.0"
    },
    "categories": ["Other"],
    "contributes": {
      "menus": {
        "explorer/context": [
          {
            "when": "resourceExtname == .langium",
            "command": "glsp-generator.generateVSIX",
            "group": "glsp-generator@1"
          },
          {
            "when": "resourceExtname == .langium", 
            "command": "glsp-generator.generateDev",
            "group": "glsp-generator@2"
          },
          {
            "when": "resourceExtname == .langium",
            "command": "glsp-generator.generateDebug", 
            "group": "glsp-generator@3"
          },
          {
            "when": "resourceExtname == .langium",
            "command": "glsp-generator.generateProject",
            "group": "glsp-generator@4"
          },
          {
            "when": "resourceExtname == .langium",
            "command": "glsp-generator.validate",
            "group": "glsp-generator@5"
          }
        ],
        "editor/context": [
          {
            "when": "resourceExtname == .langium",
            "command": "glsp-generator.generateVSIX",
            "group": "glsp-generator@1"
          },
          {
            "when": "resourceExtname == .langium",
            "command": "glsp-generator.generateDev",
            "group": "glsp-generator@2"
          },
          {
            "when": "resourceExtname == .langium",
            "command": "glsp-generator.generateDebug",
            "group": "glsp-generator@3"
          },
          {
            "when": "resourceExtname == .langium",
            "command": "glsp-generator.generateProject",
            "group": "glsp-generator@4"
          },
          {
            "when": "resourceExtname == .langium",
            "command": "glsp-generator.validate",
            "group": "glsp-generator@5"
          }
        ]
      },
      "commands": [
        {
          "command": "glsp-generator.generateVSIX",
          "title": "Generate GLSP Extension (VSIX)"
        },
        {
          "command": "glsp-generator.generateDev",
          "title": "Generate GLSP Extension (Dev Mode)"
        },
        {
          "command": "glsp-generator.generateDebug",
          "title": "Generate GLSP Extension (Debug)"
        },
        {
          "command": "glsp-generator.generateProject",
          "title": "Generate GLSP Extension (Project Only)"
        },
        {
          "command": "glsp-generator.validate",
          "title": "Validate Langium Grammar"
        }
      ]
    },
    "main": "./extension.js"
  };

  await fs.writeJson(path.join(extensionDir, 'package.json'), packageJson, { spaces: 2 });

  // Create the extension code
  const extensionCode = `
const vscode = require('vscode');
const { exec } = require('child_process');
const path = require('path');

function activate(context) {
    console.log('GLSP Generator context menus activated');

    // Helper function to run CLI commands
    function runCommand(args, cwd) {
        const cliPath = path.join(context.extensionPath, '..', '..', '..', 'dist', 'cli.js');
        const command = \`node "\${cliPath}" \${args}\`;
        
        const terminal = vscode.window.createTerminal({
            name: 'GLSP Generator',
            cwd: cwd
        });
        terminal.show();
        terminal.sendText(command);
    }

    // Register commands
    const commands = [
        {
            id: 'glsp-generator.generateVSIX',
            handler: (uri) => {
                const outputDir = path.join(vscode.workspace.rootPath, 'generated', path.basename(uri.fsPath, '.langium'));
                runCommand(\`generate "\${uri.fsPath}" "\${outputDir}"\`, vscode.workspace.rootPath);
            }
        },
        {
            id: 'glsp-generator.generateDev',
            handler: (uri) => {
                const outputDir = path.join(vscode.workspace.rootPath, 'generated', path.basename(uri.fsPath, '.langium'));
                runCommand(\`generate "\${uri.fsPath}" "\${outputDir}" --dev\`, vscode.workspace.rootPath);
            }
        },
        {
            id: 'glsp-generator.generateDebug',
            handler: (uri) => {
                const outputDir = path.join(vscode.workspace.rootPath, 'generated', path.basename(uri.fsPath, '.langium'));
                runCommand(\`generate "\${uri.fsPath}" "\${outputDir}" --debug\`, vscode.workspace.rootPath);
            }
        },
        {
            id: 'glsp-generator.generateProject',
            handler: (uri) => {
                const outputDir = path.join(vscode.workspace.rootPath, 'generated', path.basename(uri.fsPath, '.langium'));
                runCommand(\`generate "\${uri.fsPath}" "\${outputDir}" --no-vsix\`, vscode.workspace.rootPath);
            }
        },
        {
            id: 'glsp-generator.validate',
            handler: (uri) => {
                runCommand(\`validate "\${uri.fsPath}"\`, vscode.workspace.rootPath);
            }
        }
    ];

    commands.forEach(cmd => {
        const disposable = vscode.commands.registerCommand(cmd.id, cmd.handler);
        context.subscriptions.push(disposable);
    });
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
};
`;

  await fs.writeFile(path.join(extensionDir, 'extension.js'), extensionCode);

  console.log(`
VSCode context menu extension created!

To use the context menus:
1. Open this project in VSCode
2. Press F5 to open a new VSCode window with the extension loaded
3. Right-click on any .langium file to see the context menu options

Alternatively, use the keyboard shortcuts:
- Ctrl+Shift+G: Generate VSIX
- Ctrl+Shift+D: Generate Dev Mode
- Ctrl+Shift+Alt+D: Generate Debug Mode
- Ctrl+Shift+P: Generate Project Only
- Ctrl+Shift+V: Validate Grammar

The extension files are in: ${extensionDir}
`);
}

setupVSCodeMenus().catch(console.error);