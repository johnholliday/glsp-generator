# VSCode Extension Design for GLSP Generator

## Extension Architecture

### Core Features

1. **Context Menu Integration**
   - Appears when right-clicking `.langium` files
   - Commands grouped under "GLSP Generator" submenu
   - Smart command availability based on context

2. **Command Palette Integration**
   - All commands available via Command Palette (Ctrl+Shift+P)
   - Searchable with "GLSP:" prefix

3. **Status Bar Integration**
   - Shows GLSP generator version
   - Quick access to common commands
   - Generation status indicator

### Commands Design

#### 1. Generate VSIX
```typescript
interface GenerateVSIXOptions {
  grammarPath: string;
  outputDir?: string;  // Default: same as grammar file
  showProgress?: boolean;  // Default: true
  openOutput?: boolean;  // Default: false
}
```

**Workflow:**
1. User right-clicks `.langium` file
2. Selects "GLSP: Generate VSIX"
3. Progress notification appears
4. Generator runs in background
5. Success notification with "Open Folder" action
6. `.vsix` file appears in same directory

#### 2. Test VSIX
```typescript
interface TestVSIXOptions {
  grammarPath: string;
  autoInstall?: boolean;  // Default: true
  newWindow?: boolean;  // Default: true
}
```

**Workflow:**
1. User right-clicks `.langium` file
2. Selects "GLSP: Test VSIX"
3. Generates VSIX (if needed)
4. Launches new VSCode window (Extension Development Host)
5. Auto-installs the VSIX
6. Opens test workspace with example files

#### 3. Generate Project Only
```typescript
interface GenerateProjectOptions {
  grammarPath: string;
  outputDir?: string;
  openInVSCode?: boolean;  // Default: true
}
```

**Workflow:**
1. Generates project without VSIX packaging
2. Useful for development and debugging
3. Opens generated project in VSCode

#### 4. Validate Grammar
```typescript
interface ValidateGrammarOptions {
  grammarPath: string;
  showDiagnostics?: boolean;  // Default: true
}
```

**Workflow:**
1. Validates grammar syntax
2. Shows problems in Problems panel
3. Inline error decorations

### Extension Implementation

#### Extension Entry Point
```typescript
// src/extension.ts
import * as vscode from 'vscode';
import { GLSPGenerator } from '@glsp/generator';
import { CommandManager } from './commands/CommandManager';

export async function activate(context: vscode.ExtensionContext) {
    console.log('GLSP Generator Tools activated');
    
    // Initialize generator with bundled version
    const generator = new GLSPGenerator();
    
    // Register commands
    const commandManager = new CommandManager(generator);
    commandManager.registerCommands(context);
    
    // Status bar
    const statusBar = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Right, 
        100
    );
    statusBar.text = '$(symbol-namespace) GLSP';
    statusBar.tooltip = 'GLSP Generator Tools';
    statusBar.command = 'glsp.showCommands';
    statusBar.show();
    
    context.subscriptions.push(statusBar);
}
```

#### Command Implementation Example
```typescript
// src/commands/GenerateVSIXCommand.ts
export class GenerateVSIXCommand {
    constructor(private generator: GLSPGenerator) {}
    
    async execute(uri: vscode.Uri) {
        const grammarPath = uri.fsPath;
        const outputDir = path.dirname(grammarPath);
        
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Generating GLSP Extension",
            cancellable: false
        }, async (progress) => {
            try {
                progress.report({ increment: 0, message: "Parsing grammar..." });
                
                const result = await this.generator.generateExtension(
                    grammarPath,
                    outputDir
                );
                
                progress.report({ increment: 50, message: "Packaging VSIX..." });
                
                if (result.success) {
                    const vsixPath = path.join(outputDir, `${result.projectName}.vsix`);
                    
                    vscode.window.showInformationMessage(
                        `VSIX generated: ${path.basename(vsixPath)}`,
                        'Open Folder',
                        'Install VSIX'
                    ).then(selection => {
                        if (selection === 'Open Folder') {
                            vscode.commands.executeCommand('revealFileInOS', vscode.Uri.file(outputDir));
                        } else if (selection === 'Install VSIX') {
                            vscode.commands.executeCommand('workbench.extensions.installExtension', vscode.Uri.file(vsixPath));
                        }
                    });
                }
            } catch (error) {
                vscode.window.showErrorMessage(`Generation failed: ${error.message}`);
            }
        });
    }
}
```

### Configuration Settings

```json
// contributes.configuration in package.json
{
  "glsp.generator.outputDirectory": {
    "type": "string",
    "default": "same-as-grammar",
    "enum": ["same-as-grammar", "workspace-root", "custom"],
    "description": "Where to output generated files"
  },
  "glsp.generator.autoOpenOutput": {
    "type": "boolean",
    "default": false,
    "description": "Automatically open output folder after generation"
  },
  "glsp.generator.showNotifications": {
    "type": "boolean", 
    "default": true,
    "description": "Show progress notifications during generation"
  },
  "glsp.testHost.autoInstall": {
    "type": "boolean",
    "default": true,
    "description": "Automatically install VSIX in Extension Development Host"
  }
}
```

### Error Handling & Diagnostics

1. **Grammar Validation Diagnostics**
   - Real-time validation as user types
   - Problems panel integration
   - Quick fixes for common issues

2. **Generation Error Handling**
   - Clear error messages
   - Actionable suggestions
   - Link to documentation

3. **Logging**
   - Output channel for detailed logs
   - Debug mode for troubleshooting

### Testing Strategy

1. **Unit Tests**
   - Test command logic
   - Mock VSCode API
   - Test error scenarios

2. **Integration Tests**
   - Test with real grammar files
   - Verify VSIX generation
   - Test Extension Host launch

3. **Manual Testing Checklist**
   - [ ] Context menu appears for .langium files
   - [ ] Commands work from Command Palette
   - [ ] Progress notifications display correctly
   - [ ] Error handling works properly
   - [ ] Extension Host launches successfully
   - [ ] Generated VSIX installs correctly

### Development Setup

```powershell
# Development workflow
cd packages/vscode-extension
yarn install
yarn watch

# In another terminal
code --extensionDevelopmentPath=. 

# For testing
yarn test
yarn package
```

### Publishing

1. **VSCode Marketplace**
   ```powershell
   vsce publish
   ```

2. **GitHub Releases**
   - Automated via GitHub Actions
   - Attach .vsix file to releases

3. **Open VSX Registry**
   - For VSCodium/Gitpod users
   ```powershell
   ovsx publish
   ```