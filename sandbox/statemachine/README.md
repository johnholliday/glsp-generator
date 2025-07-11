# GLSP Extension Debug Sandbox

This directory contains a complete sandbox environment for debugging GLSP extensions generated from Langium grammars.

## Overview

The sandbox provides:
- A sample state machine Langium grammar
- A PowerShell debug script for automated generation and debugging
- Support for watch mode to regenerate on template changes
- Automatic VSCode launch with debug configuration

## Prerequisites

1. **Build the GLSP Generator**
   ```powershell
   # From project root
   cd ../..
   yarn install
   yarn build
   ```

2. **Required Software**
   - Node.js (v14+)
   - VSCode with the `code` command in PATH (optional)
   - PowerShell Core (pwsh) or Windows PowerShell

## Quick Start

1. **Basic Generation and Debug**
   ```powershell
   .\debug.ps1
   ```
   This will:
   - Clean the output directory
   - Generate the GLSP extension
   - Launch VSCode with the generated code

2. **Watch Mode**
   ```powershell
   .\debug.ps1 -Watch
   ```
   Automatically regenerates when:
   - The grammar file changes
   - Any template file changes

3. **Generation Only**
   ```powershell
   .\debug.ps1 -NoLaunch
   ```
   Generates without launching VSCode

## Script Options

| Parameter | Description | Default |
|-----------|-------------|---------|
| `-Watch` | Enable watch mode for auto-regeneration | `$false` |
| `-NoLaunch` | Skip VSCode launch after generation | `$false` |
| `-Clean` | Clean output directory before generation | `$true` |

## Directory Structure

```
example-statemachine/
├── statemachine.langium    # Example grammar definition
├── debug.ps1              # PowerShell debug script
├── .gitignore            # Ignores output/ directory
├── README.md             # This file
└── output/               # Generated extension (git-ignored)
    ├── browser/          # Client-side code
    ├── common/           # Shared types and protocols
    ├── server/           # Server-side code
    ├── package.json      # Yarn 1.22 compatible
    └── .vscode/          # Debug launch configuration
```

## Workflow

### 1. Development Workflow

```powershell
# Start watch mode
.\debug.ps1 -Watch

# In another terminal, edit templates or grammar
# Changes are automatically detected and regenerated
```

### 2. Testing Workflow

```powershell
# Generate extension
.\debug.ps1 -NoLaunch

# Navigate to output
cd output

# Install dependencies (uses Yarn 1.22)
yarn install

# Build the extension
yarn build

# Run tests if available
yarn test
```

### 3. Debugging Workflow

The script automatically creates a VSCode debug configuration:

```json
{
    "type": "node",
    "request": "launch",
    "name": "Debug GLSP Server",
    "program": "${workspaceFolder}/server/server-module.js"
}
```

To debug:
1. Set breakpoints in the generated TypeScript files
2. Press F5 in VSCode to start debugging
3. The GLSP server will start with debugging enabled

## Grammar Example

The included `statemachine.langium` demonstrates:
- Interface definitions (State, Transition)
- Cross-references (source/target states)
- Optional properties
- String literals for actions
- Comment support

Example state machine:
```
statemachine TrafficLight {
    state Red {
        entry: "turnOnRedLight()"
        exit: "turnOffRedLight()"
    }
    
    state Yellow {
        entry: "turnOnYellowLight()"
        exit: "turnOffYellowLight()"
    }
    
    state Green {
        entry: "turnOnGreenLight()"
        exit: "turnOffGreenLight()"
    }
    
    transition RedToGreen {
        from: Red
        to: Green
        on: "timer.expired"
    }
    
    transition GreenToYellow {
        from: Green
        to: Yellow
        on: "timer.expired"
    }
    
    transition YellowToRed {
        from: Yellow
        to: Red
        on: "timer.expired"
    }
}
```

## Troubleshooting

### Generation Fails
- Check that the GLSP generator is built: `yarn build` in project root
- Verify the grammar syntax is valid
- Check console output for specific errors

### VSCode Doesn't Launch
- Ensure `code` command is in PATH
- On Windows: Install "Shell Command: Install 'code' command in PATH" from VSCode
- Alternatively, manually open the `output/` directory in VSCode

### Watch Mode Issues
- Some editors may not trigger file change events properly
- Try saving the file explicitly (Ctrl+S)
- Check that you have permissions to watch the directories

### Cross-Platform Usage
While the script is PowerShell-based, it works on:
- Windows PowerShell
- PowerShell Core on Linux/macOS
- WSL with PowerShell Core installed

For bash users, you can invoke it with:
```bash
pwsh ./debug.ps1
```

## Extending the Sandbox

1. **Modify the Grammar**
   Edit `statemachine.langium` to test different language constructs

2. **Add Test Cases**
   Create additional `.langium` files and modify the script to test them

3. **Custom Debug Configurations**
   Edit the generated `.vscode/launch.json` for specific debugging needs

4. **Template Testing**
   The watch mode is particularly useful for template development:
   - Edit templates in `../../templates/`
   - See changes reflected immediately in the output

## Tips

1. **Use Watch Mode for Template Development**
   ```powershell
   # Terminal 1: Watch mode
   .\debug.ps1 -Watch
   
   # Terminal 2: Edit templates
   code ../../templates/browser/
   ```

2. **Validate Before Generation**
   ```powershell
   # From project root
   node dist/cli.js validate sandbox/example-statemachine/statemachine.langium
   ```

3. **Compare Generated Output**
   Keep a reference generation to compare changes:
   ```powershell
   # Generate reference
   .\debug.ps1 -NoLaunch
   Copy-Item -Recurse output output-reference
   
   # After changes, use diff tools to compare
   ```

4. **Debug Specific Files**
   Set breakpoints in the generated TypeScript before it's compiled:
   - Open `output/server/*.ts` files
   - Set breakpoints
   - Run build and debug

## Related Documentation

- [Main CLAUDE.md](../../CLAUDE.md) - Project guidelines
- [GLSP Generator README](../../README.md) - Generator documentation
- [Langium Documentation](https://langium.org/) - Grammar syntax reference