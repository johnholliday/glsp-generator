# StateMachine VSCode Extension

Language support for StateMachine in Visual Studio Code.

## Features

- Syntax highlighting
- Code completion
- Real-time validation
- Go to definition
- Find references
- Hover information
- Code formatting

## Requirements

- VSCode >= 1.75.0

## Development

### Building

```bash
yarn install
yarn run build
```

### Running in Development

1. Open this folder in VSCode
2. Press F5 to launch a new VSCode window with the extension loaded
3. Open a file with the .statemachine extension

### Packaging

```bash
yarn run package
```

This will create a .vsix file that can be installed in VSCode.

### Deployment to Theia

```bash
yarn run deploy
```

This will deploy the extension to the Theia applications in the monorepo.