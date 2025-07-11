# GLSP Generator - Global Setup Instructions

## Automated Setup (Recommended)

Run the following command from the monorepo root:

```powershell
yarn install:global
```

This will:
1. Build the @glsp/generator package
2. Set up global access via yarn link
3. Install the VSCode extension

## Manual Setup (Alternative)

If the automated setup fails, you can set it up manually:

### Step 1: Build the Generator

```powershell
cd packages/generator
yarn build:no-version
```

### Step 2: Create Global Link

```powershell
# From packages/generator directory
yarn link
```

### Step 3: Install VSCode Extension

```powershell
# From monorepo root
yarn vscode:install
```

Or manually in VSCode:
1. Open VSCode
2. Press `Ctrl+Shift+P` (Command Palette)
3. Type "Install from VSIX"
4. Select `packages/vscode-extension/glsp-generator-tools-1.0.0.vsix`

## Alternative: Direct PowerShell Execution

If you get permission errors with yarn, run the PowerShell script directly:

```powershell
# From monorepo root
powershell -ExecutionPolicy Bypass -File .\scripts\setup-global-access.ps1
```

## Verifying Installation

### Check Generator Access

```powershell
# Should show the GLSP generator help
glsp --help

# Or
glspgen --help
```

### Check VSCode Extension

1. Open VSCode
2. Go to Extensions (Ctrl+Shift+X)
3. Search for "GLSP Generator Tools"
4. Should show as installed

## Usage

After setup, you can:

1. **Use the generator globally**:
   ```powershell
   # From any directory
   glsp generate my-grammar.langium
   ```

2. **Use VSCode context menus**:
   - Right-click any `.langium` file
   - Select GLSP commands from the context menu

## Troubleshooting

### Permission Denied Errors

If you get "permission denied" errors:

1. **Windows Security**: Your system might block PowerShell scripts
   ```powershell
   # Check current execution policy
   Get-ExecutionPolicy
   
   # Temporarily allow scripts (run as Administrator)
   Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process
   ```

2. **Alternative**: Use the manual setup steps above

### Command Not Found

If `glsp` or `glspgen` commands are not found:

1. Check if yarn global bin is in PATH:
   ```powershell
   yarn global bin
   ```

2. Add the output directory to your PATH environment variable

3. Or use the full path:
   ```powershell
   node "$(yarn global bin)\glsp" --help
   ```

### VSCode Extension Not Working

1. Check the Output panel in VSCode (View > Output)
2. Select "GLSP Generator Tools" from the dropdown
3. Look for any error messages

4. Try reinstalling:
   ```powershell
   yarn vscode:uninstall
   yarn vscode:install
   ```

## Development Workflow

When developing the generator:

1. Make changes to the generator code
2. Run `yarn build` in the generator package
3. The global link will automatically use the updated version
4. No need to reinstall or relink

## Uninstalling

To remove the global setup:

```powershell
# Unlink the generator
cd packages/generator
yarn unlink

# Uninstall VSCode extension
cd ../..
yarn vscode:uninstall
```