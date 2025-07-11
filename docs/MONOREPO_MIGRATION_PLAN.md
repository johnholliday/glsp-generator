# Monorepo Migration Plan for GLSP Generator

## Overview
Convert the current single-package repository into a monorepo containing:
1. **@glsp/generator** - The core GLSP generator (current codebase)
2. **@glsp/vscode-extension** - VSCode extension for comfortable workflow

## Proposed Structure

```
glsp-generator/                          # Root monorepo
├── packages/
│   ├── generator/                       # Current GLSP generator
│   │   ├── src/                        # Existing source
│   │   ├── templates/                  # Existing templates
│   │   ├── package.json               # @glsp/generator
│   │   └── ...                        # All current files
│   └── vscode-extension/               # New VSCode extension
│       ├── src/
│       │   ├── extension.ts           # Extension entry point
│       │   ├── commands/              # Command implementations
│       │   └── utils/                 # Helper utilities
│       ├── package.json               # @glsp/vscode-extension
│       └── README.md
├── package.json                        # Root workspace config
├── .yarnrc.yml                        # Yarn Berry config
├── yarn.lock                          # Shared lockfile
├── tsconfig.json                      # Root TypeScript config
├── .vscode/                           # Workspace settings
├── docs/                              # Documentation
└── README.md                          # Monorepo README
```

## Migration Steps

### Phase 1: Prepare Current Structure
1. Create `packages/` directory
2. Move all current code to `packages/generator/`
3. Update all import paths and build scripts
4. Test that generator still works from new location

### Phase 2: Setup Monorepo Configuration
1. Create root `package.json` with workspaces configuration
2. Configure Yarn Berry workspaces
3. Setup shared TypeScript configuration
4. Configure shared ESLint/Prettier

### Phase 3: Create VSCode Extension Package
1. Initialize `packages/vscode-extension/`
2. Implement extension with commands:
   - Generate VSIX
   - Test VSIX (with Extension Host)
   - Generate Project Only
   - Open in Dev Mode
   - Validate Grammar
3. Bundle generator as dependency

### Phase 4: Global Access Strategy
1. Create npm link setup for development
2. Add global installation instructions
3. Consider publishing to npm for easier access

## VSCode Extension Features

### Context Menu Commands
```typescript
// Right-click on .langium files
- "GLSP: Generate VSIX" 
- "GLSP: Test VSIX in Extension Host"
- "GLSP: Generate Project Only"
- "GLSP: Validate Grammar"
- "GLSP: Open Documentation"
```

### Extension Implementation Details

#### package.json (vscode-extension)
```json
{
  "name": "@glsp/vscode-extension",
  "displayName": "GLSP Generator Tools",
  "version": "1.0.0",
  "engines": {
    "vscode": "^1.74.0"
  },
  "activationEvents": [
    "onLanguage:langium",
    "workspaceContains:**/*.langium"
  ],
  "contributes": {
    "commands": [
      {
        "command": "glsp.generateVSIX",
        "title": "GLSP: Generate VSIX"
      },
      {
        "command": "glsp.testVSIX",
        "title": "GLSP: Test VSIX in Extension Host"
      }
    ],
    "menus": {
      "explorer/context": [
        {
          "when": "resourceExtname == .langium",
          "command": "glsp.generateVSIX",
          "group": "glsp@1"
        },
        {
          "when": "resourceExtname == .langium",
          "command": "glsp.testVSIX",
          "group": "glsp@2"
        }
      ]
    }
  },
  "dependencies": {
    "@glsp/generator": "workspace:*"
  }
}
```

## Workflow After Migration

### Developer Workflow
1. **Global Setup** (one time):
   ```powershell
   # Clone and build monorepo
   git clone https://github.com/user/glsp-generator
   cd glsp-generator
   yarn install
   yarn build
   
   # Link generator globally
   cd packages/generator
   yarn link
   npm link -g @glsp/generator
   
   # Install VSCode extension
   cd ../vscode-extension
   yarn package
   code --install-extension glsp-vscode-extension-1.0.0.vsix
   ```

2. **Usage in Any Project**:
   - Create `.langium` file anywhere
   - Open folder in VSCode
   - Right-click → "GLSP: Generate VSIX" or "GLSP: Test VSIX"
   - VSIX appears in same folder

3. **Making Generator Changes**:
   ```powershell
   # In generator monorepo
   cd packages/generator
   # Make changes
   yarn build
   # Changes immediately available globally
   ```

## Implementation Timeline

### Week 1: Migration
- [ ] Move current code to packages/generator
- [ ] Setup monorepo configuration
- [ ] Ensure all tests pass in new structure

### Week 2: VSCode Extension
- [ ] Create extension package
- [ ] Implement basic commands
- [ ] Test integration with generator

### Week 3: Polish & Documentation
- [ ] Add progress notifications
- [ ] Error handling and user feedback
- [ ] Documentation and examples

## Benefits

1. **Seamless Workflow**: Right-click any .langium file to generate/test
2. **Global Access**: Generator available from any folder
3. **Live Updates**: Changes to generator immediately reflected
4. **Better Organization**: Clear separation of concerns
5. **Easier Testing**: Test VSCode integration separately

## Risks & Mitigations

1. **Risk**: Breaking existing workflows
   - **Mitigation**: Keep backward compatibility, document migration

2. **Risk**: Complex build process
   - **Mitigation**: Clear scripts, good documentation

3. **Risk**: Version synchronization
   - **Mitigation**: Use workspace protocol, automated versioning

## Alternative Approaches Considered

1. **Separate Repositories**: More complex to maintain version sync
2. **Single Package with CLI**: Less integrated VSCode experience
3. **VSCode Tasks**: Less discoverable, requires setup per project

## Next Steps

1. Review and approve this plan
2. Create feature branch for migration
3. Start Phase 1 implementation
4. Test thoroughly at each phase