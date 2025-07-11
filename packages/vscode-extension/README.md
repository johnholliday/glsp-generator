# GLSP Generator VSCode Extension

This extension provides convenient access to the GLSP Generator directly from VSCode.

## Features

- Right-click any `.langium` file to generate GLSP extensions
- Test generated extensions in Extension Development Host
- Validate grammar files
- Generate project structure without packaging

## Usage

1. Open a folder containing `.langium` files
2. Right-click on a `.langium` file
3. Select one of the GLSP commands from the context menu

## Commands

- **GLSP: Generate VSIX** - Generate a packaged VSIX extension
- **GLSP: Test VSIX** - Generate and test in Extension Development Host
- **GLSP: Generate Project Only** - Generate project without packaging
- **GLSP: Validate Grammar** - Check grammar for errors

## Requirements

- VSCode 1.74.0 or higher
- Node.js 18.x or higher
