# Statemachine GLSP Extension

GLSP extension for Statemachine

## 🚀 Quick Start

### Prerequisites

- **Node.js** 16.x or higher
- **Yarn Classic (1.x)** - **REQUIRED** for Theia compatibility
- **VS Code** or **Theia IDE**

### ⚠️ Important: Yarn Version Requirements

This project **MUST** use Yarn Classic (1.x) for compatibility with the Theia framework. The project is configured to enforce this requirement.

#### Automatic Setup (Recommended)

The project includes a `packageManager` field in `package.json` that automatically uses Yarn 1.22.19:

```bash
# Clone and install - Corepack will automatically use the correct Yarn version
git clone <your-repo>
cd statemachine-glsp-extension
yarn install
```

#### Manual Setup (if needed)

If you encounter Yarn version issues:

```bash
# Enable Corepack (if not already enabled)
corepack enable

# Verify correct Yarn version is being used
yarn --version  # Should show 1.22.19

# If wrong version, force Corepack to use the specified version
corepack use yarn@1.22.19
```

### Installation

```bash
# Install dependencies
yarn install

# Build the extension
yarn build

# Watch for changes during development
yarn watch
```

## 📁 Project Structure

```
statemachine-glsp-extension/
├── src/
│   ├── browser/          # Browser-side code
│   │   └── diagram/      # Diagram-specific browser components
│   ├── common/           # Shared code between browser and server
│   ├── node/             # Node.js specific code
│   └── server/           # Server-side GLSP implementation
│       ├── diagram/      # Diagram configuration
│       ├── handlers/     # Command and action handlers
│       └── model/        # Domain model definitions
├── package.json          # Project configuration with packageManager field
├── .yarnrc              # Yarn Classic configuration
├── yarn.lock            # Dependency lock file
└── tsconfig.json        # TypeScript configuration
```

## 🛠️ Development

### Available Scripts

```bash
# Build the project
yarn build

# Watch for changes and rebuild automatically
yarn watch

# Clean build artifacts
yarn clean

# Run tests (if enabled)
yarn test
```

### Development Workflow

1. **Start the watch mode**: `yarn watch`
2. **Make your changes** to the source files
3. **Test in VS Code/Theia**: The extension will be automatically rebuilt

## 🔧 Configuration

### Yarn Configuration

The project uses a comprehensive `.yarnrc` configuration that:

- Enforces Yarn Classic (1.x) usage
- Prevents automatic upgrades to newer Yarn versions
- Optimizes for Theia extension development
- Ensures consistent dependency resolution

### Package Manager Enforcement

The `package.json` includes:

```json
{
  "packageManager": "yarn@1.22.19",
  "engines": {
    "node": ">=16.0.0",
    "yarn": ">=1.0.0 <2.0.0"
  }
}
```

This ensures:
- Corepack automatically uses the correct Yarn version
- CI/CD environments use the same Yarn version
- Team members can't accidentally use incompatible versions

## 🚀 Deployment

### Building for Production

```bash
# Clean and build
yarn clean && yarn build
```

### VS Code Extension Packaging

```bash
# Install vsce if not already installed
npm install -g vsce

# Package the extension
vsce package
```

### Theia Integration

This extension is designed to work with Theia. To integrate:

1. Build the extension: `yarn build`
2. Add to your Theia application's dependencies
3. Import and configure in your Theia frontend module

## 📖 Domain Model Reference

This section documents the domain model interfaces and types that define the structure of your statemachine diagrams. These interfaces represent the core elements that can be created, modified, and visualized in your GLSP editor.

### Model Interfaces

The following interfaces define the structure of elements in your statemachine diagrams:

| Interface | Description | Properties |
|-----------|-------------|------------|
| **StateMachine** | Represents a StateMachine element in the diagram | `name: string`, `states: State`, `transitions: Transition` |
| **State** | Represents a State element in the diagram | `name: string`, `entryAction: string`, `exitAction: string`, `doAction: string` |
| **Transition** | Represents a Transition element in the diagram | `name: string` _(optional)_, `source: State`, `target: State`, `event: string`, `guard: string`, `effect: string` |

#### Working with the Model

```typescript
// Example: Parsing input text/file using your grammar
import { StatemachineLanguageServices } from '../language/statemachine-module';
import { AstNode } from 'langium';

// Initialize the language services
const services = createStatemachineServices();
const parser = services.Statemachine.parser.LangiumParser;

// Parse input text
const input = `
  // Your DSL code here based on your grammar
  // For example:
  node MyNode "Label"
  edge from MyNode to AnotherNode
`;

const parseResult = parser.parse(input);
if (parseResult.lexerErrors.length === 0 && parseResult.parserErrors.length === 0) {
    const model = parseResult.value; // This is your parsed AST
    
    // Access the model elements based on your grammar structure
    // For example, if your grammar has 'elements' array:
    model.elements?.forEach(element => {
        if (element.$type === 'StateMachine') {
            console.log(`Found statemachine: ${element.name}`);
            // Access properties defined in your interface
            // Access property: element.name
            // Access property: element.states
            // Access property: element.transitions
        }
    });
}

// Example: Converting parsed model to GLSP graph elements
import { GNode, GEdge } from '@eclipse-glsp/graph';

export class StatemachineModelFactory {
    createNode(astNode: AstNode): GNode | undefined {
        if (astNode.$type === 'StateMachine') {
            const node = astNode as StateMachine;
            return {
                id: this.generateId(node),
                type: 'state-machine',
                position: { x: 0, y: 0 },
                size: { width: 100, height: 50 },
                // Map your interface properties to GLSP properties
                label: node.name || 'Unnamed',
                cssClasses: ['statemachine-node']
            };
        }
        return undefined;
    }

    private generateId(node: AstNode): string {
        // Generate unique ID based on your model
        return `${node.$type}_${node.$cstNode?.offset}`;
    }
}
```


### Extending the Model

To add new features to your statemachine editor:

1. **Define new interfaces** in `src/common/model.ts`
2. **Create handlers** in `src/server/handlers/` to manage operations
3. **Add views** in `src/browser/views.tsx` for visual representation
4. **Update the model factory** in `src/server/model-factory.ts`

For detailed implementation guidance, refer to the [GLSP documentation](https://www.eclipse.org/glsp/documentation/).

## 🐛 Troubleshooting

### Yarn Version Issues

**Problem**: Wrong Yarn version being used

**Solution**:
```bash
# Check current version
yarn --version

# If not 1.22.19, enable Corepack and retry
corepack enable
corepack use yarn@1.22.19
yarn --version  # Should now show 1.22.19
```

**Problem**: `packageManager` field not respected

**Solution**:
```bash
# Ensure Corepack is enabled
corepack enable

# Clear any cached versions
corepack cache clean

# Reinstall dependencies
rm -rf node_modules yarn.lock
yarn install
```

### Build Issues

**Problem**: TypeScript compilation errors

**Solution**:
```bash
# Clean and rebuild
yarn clean
yarn build

# Check TypeScript version
yarn tsc --version
```

**Problem**: Missing dependencies

**Solution**:
```bash
# Reinstall all dependencies
rm -rf node_modules
yarn install
```

## 🙏 Acknowledgments

- Built with [Eclipse GLSP](https://www.eclipse.org/glsp/)
- Generated by [GLSP Generator](https://github.com/your-org/glsp-generator)
- Compatible with [Eclipse Theia](https://theia-ide.org/)