# StateMachine Language Ecosystem

A complete development ecosystem for the StateMachine language, featuring:
- VSCode Language Extension with LSP support
- Theia IDE with GLSP diagram editing
- Eclipse Model Server for collaborative editing
- Multi-view editors (text, diagram, split-view)

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18.0.0
- Yarn >= 1.22.0
- VSCode (for extension development)

### Installation

```bash
# Install dependencies
yarn install

# Build all packages
yarn build
```

## 📦 Project Structure

- `statemachine-vscode-extension/` - VSCode Language Extension
- `statemachine-theia-extension/` - Theia IDE with GLSP support
  - `packages/shared-model/` - Shared model definitions
  - `packages/model-server/` - Eclipse Model Server
  - `packages/glsp-extension/` - GLSP diagram editing
  - `packages/dual-view-extension/` - Multi-view editors
  - `applications/browser-app/` - Browser-based Theia
  - `applications/electron-app/` - Desktop Theia

## 🛠️ Development

### Building Components

```bash
# Build all components (recommended)
yarn build:all

# Build specific component types
yarn build:vscode        # VSCode extensions only
yarn build:extensions    # All scoped packages and extensions
yarn build:apps          # Theia applications only

# Package and deploy VSCode extensions
yarn package:vscode      # Create VSIX packages
yarn deploy:vscode       # Deploy to Theia apps
```

### Running Applications

```bash
# Run browser application
yarn start:browser

# Run desktop application
yarn start:electron
```

### Development Workflow

```bash
# Watch mode for development
yarn watch
```

## 🧪 Testing

```bash
# Run all tests
yarn test

# Lint code
yarn lint

# Format code
yarn format
```

## 🐳 Docker Support

```bash
# Build Docker image
docker build -t statemachine-theia .

# Run container
docker run -p 3000:3000 statemachine-theia
```

## 📝 License

MIT