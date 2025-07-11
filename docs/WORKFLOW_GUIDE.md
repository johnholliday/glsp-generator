# GLSP Generator Workflow Guide

## Overview
This guide describes the ideal development workflow for testing GLSP generated extensions using VSCode context menus.

## Setup (One-time)

### 1. Convert to Monorepo
```powershell
# In the glsp-generator directory
node scripts/migrate-to-monorepo.js
yarn install
yarn build
```

### 2. Install VSCode Extension
```powershell
# Build the VSCode extension
cd packages/vscode-extension
yarn compile
yarn package

# Install the VSIX
code --install-extension glsp-vscode-extension-1.0.0.vsix
```

### 3. Make Generator Globally Accessible (Optional)
```powershell
# Option A: npm link (for development)
cd packages/generator
npm link
# Now 'glsp-gen' command is available globally

# Option B: Global install (after publishing to npm)
npm install -g @glsp/generator
```

## Daily Workflow

### Creating and Testing Grammar Files

1. **Create a Test Project Anywhere**
   ```powershell
   # Create a folder anywhere on your machine
   mkdir C:\MyProjects\test-grammar
   cd C:\MyProjects\test-grammar
   
   # Create a .langium file
   echo "grammar TestGrammar" > my-language.langium
   
   # Open in VSCode
   code .
   ```

2. **Edit Your Grammar**
   ```langium
   grammar MyLanguage
   
   entry Model:
       elements+=Element*;
   
   Element:
       Node | Edge;
   
   Node:
       'node' name=ID 
       'at' x=INT ',' y=INT;
   
   Edge:
       'edge' 'from' source=[Node] 'to' target=[Node];
   
   terminal ID: /[_a-zA-Z][\w_]*/;
   terminal INT: /[0-9]+/;
   ```

3. **Generate VSIX via Context Menu**
   - Right-click on `my-language.langium` in VSCode Explorer
   - Select **"GLSP: Generate VSIX"**
   - Progress notification appears
   - `.vsix` file is created in the same folder

4. **Test VSIX in Extension Host**
   - Right-click on `my-language.langium`
   - Select **"GLSP: Test VSIX in Extension Host"**
   - New VSCode window opens with:
     - Generated VSIX pre-installed
     - Test workspace ready
     - Example files to test your language

### Making Generator Changes

1. **Open Generator Repository**
   ```powershell
   cd C:\path\to\glsp-generator
   code .
   ```

2. **Make Your Changes**
   - Edit templates in `packages/generator/templates/`
   - Modify generator logic in `packages/generator/src/`
   - Add new features

3. **Rebuild Generator**
   ```powershell
   # In the monorepo root
   yarn build
   
   # Or just the generator
   yarn workspace @glsp/generator build
   ```

4. **Test Changes Immediately**
   - Return to your test project VSCode window
   - Right-click `.langium` file again
   - Select **"GLSP: Generate VSIX"**
   - New VSIX reflects your changes!

## Available Context Menu Commands

### 1. GLSP: Generate VSIX
- **What it does**: Generates a packaged `.vsix` file
- **Output**: `<grammar-name>-glsp.vsix` in same directory
- **Use when**: You want to distribute or install the extension

### 2. GLSP: Test VSIX in Extension Host
- **What it does**: 
  - Generates VSIX
  - Opens new VSCode window
  - Auto-installs the extension
  - Creates test workspace
- **Use when**: You want to test the generated extension

### 3. GLSP: Generate Project Only
- **What it does**: 
  - Generates full project structure
  - No VSIX packaging
  - Opens in VSCode
- **Use when**: You want to debug or modify the generated code

### 4. GLSP: Validate Grammar
- **What it does**: 
  - Checks grammar syntax
  - Shows errors in Problems panel
  - Inline error decorations
- **Use when**: You're writing a grammar and want quick validation

## Configuration Options

Access via: **File > Preferences > Settings > Extensions > GLSP Generator**

- **Output Directory**: Where to generate files
  - `same-as-grammar` (default)
  - `workspace-root`
  - `custom`
- **Auto Open Output**: Open folder after generation
- **Show Notifications**: Display progress notifications

## Troubleshooting

### "Command not found" in context menu
- Ensure VSCode extension is installed
- Restart VSCode
- Check file has `.langium` extension

### Generated VSIX won't install
- Check VSCode version compatibility
- Look for errors in Output panel
- Ensure no conflicting extensions

### Changes not reflected
- Rebuild generator: `yarn build`
- Restart VSCode
- Clear VSCode extension cache

### Performance issues
- Large grammars may take time
- Check available memory
- Use "Generate Project Only" for faster iteration

## Advanced Workflows

### Debugging Generated Extensions
1. Use **"GLSP: Generate Project Only"**
2. Open generated project
3. Press F5 to debug
4. Set breakpoints in generated code

### Batch Processing
```powershell
# Process multiple grammars
Get-ChildItem *.langium | ForEach-Object {
    glsp-gen generate $_.FullName -o "./output"
}
```

### CI/CD Integration
```yaml
# GitHub Actions example
- name: Generate VSIX
  run: |
    npm install -g @glsp/generator
    glsp-gen generate grammar.langium
    
- name: Upload VSIX
  uses: actions/upload-artifact@v3
  with:
    name: extension-vsix
    path: '*.vsix'
```

## Tips & Best Practices

1. **Grammar Development**
   - Start simple, add complexity gradually
   - Use "Validate Grammar" frequently
   - Keep test files alongside grammar

2. **Testing**
   - Create example files for your language
   - Test edge cases
   - Use Extension Host for realistic testing

3. **Performance**
   - For large grammars, generate project first
   - Package VSIX only when ready to distribute
   - Use incremental builds when possible

4. **Organization**
   - Keep grammars in version control
   - Document your language with examples
   - Use meaningful grammar names

## Example Project Structure
```
my-dsl-project/
├── grammar/
│   └── my-dsl.langium          # Your grammar definition
├── examples/
│   ├── simple.mydsl            # Example files
│   └── complex.mydsl
├── generated/                  # Generated VSIX appears here
│   └── my-dsl-glsp.vsix
└── README.md                   # Documentation
```

## Next Steps

1. Create your first `.langium` file
2. Right-click → "GLSP: Generate VSIX"
3. Test your generated extension
4. Iterate and improve!