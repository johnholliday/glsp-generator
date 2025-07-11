# Prompt 019: VS Code Workspace Enhancements

## Goal
Create a comprehensive VS Code workspace configuration that provides an optimal development experience with proper settings, debugging configurations, useful snippets, and recommended extensions.

## Why
- No standardized VS Code configuration for the project
- Developers manually configure settings repeatedly
- Missing debugging configurations for common scenarios
- No code snippets for common patterns
- Inconsistent formatting and linting settings
- Missing workspace-specific tasks and shortcuts

## What
A complete VS Code workspace setup including settings, launch configurations, tasks, snippets, and extension recommendations that provide a consistent and productive development environment.

### Success Criteria
- [ ] Workspace settings for consistent formatting
- [ ] Debug configurations for all common scenarios
- [ ] Code snippets for grammar and template development
- [ ] Recommended extensions properly configured
- [ ] Custom tasks for common operations
- [ ] Keyboard shortcuts for productivity
- [ ] Works for all team members without modification
- [ ] Settings sync across the monorepo structure

## All Needed Context

### Documentation & References
```yaml
- file: /home/john/projects/utils/glsp-generator/.vscode/extensions.json
  why: Current extension recommendations to enhance
  
- file: /home/john/projects/utils/glsp-generator/.vscode/tasks.json
  why: Existing tasks to integrate with
  
- url: https://code.visualstudio.com/docs/editor/workspaces
  why: VS Code workspace configuration documentation

- url: https://code.visualstudio.com/docs/editor/debugging
  why: Debug configuration setup

- file: /home/john/projects/utils/glsp-generator/CLAUDE.md
  why: Project conventions to enforce in settings
```

### Current VS Code Setup
```json
// Minimal current setup
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode"
  ]
}
```

### Desired Workspace Features
```yaml
Settings:
  - Consistent formatting rules
  - TypeScript preferences
  - File associations for .langium
  - Terminal integration
  - Git configuration

Debugging:
  - Debug generator CLI
  - Debug tests with breakpoints
  - Debug VS Code extension
  - Attach to running process
  
Snippets:
  - Langium grammar patterns
  - Handlebars templates
  - Test boilerplate
  - Common code patterns

Tasks:
  - Build all packages
  - Run specific tests
  - Generate from grammar
  - Start development mode
```

## Implementation Blueprint

### Phase 1: Workspace Settings

CREATE .vscode/settings.json:
```json
{
  // Editor Settings
  "editor.formatOnSave": true,
  "editor.formatOnPaste": false,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.organizeImports": true
  },
  "editor.rulers": [100],
  "editor.tabSize": 2,
  "editor.insertSpaces": true,
  "editor.trimAutoWhitespace": true,
  "files.trimTrailingWhitespace": true,
  "files.trimFinalNewlines": true,
  "files.insertFinalNewline": true,
  
  // Language-specific Settings
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "editor.suggest.insertMode": "replace"
  },
  "[javascript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[json]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[langium]": {
    "editor.wordWrap": "on",
    "editor.quickSuggestions": {
      "strings": true
    }
  },
  "[handlebars]": {
    "editor.formatOnSave": false,
    "editor.wordWrap": "on"
  },
  
  // File Associations
  "files.associations": {
    "*.langium": "langium",
    "*.hbs": "handlebars",
    ".env.example": "properties"
  },
  
  // TypeScript Settings
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "typescript.preferences.importModuleSpecifier": "relative",
  "typescript.preferences.quoteStyle": "single",
  "typescript.updateImportsOnFileMove.enabled": "always",
  
  // Terminal Settings
  "terminal.integrated.defaultProfile.windows": "PowerShell",
  "terminal.integrated.env.windows": {
    "FORCE_COLOR": "1"
  },
  "terminal.integrated.env.linux": {
    "FORCE_COLOR": "1"
  },
  "terminal.integrated.env.osx": {
    "FORCE_COLOR": "1"
  },
  
  // Git Settings
  "git.autofetch": true,
  "git.confirmSync": false,
  "git.enableSmartCommit": true,
  "git.postCommitCommand": "push",
  
  // Search Exclusions
  "search.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/coverage": true,
    "**/.yarn": true,
    "**/*.log": true
  },
  
  // File Exclusions
  "files.exclude": {
    "**/.git": true,
    "**/.DS_Store": true,
    "**/Thumbs.db": true,
    "**/*.js": {
      "when": "$(basename).ts"
    },
    "**/*.js.map": true
  },
  
  // Project-specific Settings
  "glsp.generator.outputDirectory": "same-as-grammar",
  "glsp.generator.autoOpenOutput": true,
  "glsp.generator.showNotifications": true,
  
  // Testing
  "vitest.enable": true,
  "vitest.commandLine": "yarn test",
  
  // Peacock Extension (for visual distinction)
  "peacock.color": "#2E7D32",
  "workbench.colorCustomizations": {
    "activityBar.activeBackground": "#2E7D32",
    "activityBar.background": "#2E7D32",
    "titleBar.activeBackground": "#1B5E20",
    "titleBar.inactiveBackground": "#1B5E2099"
  }
}
```

### Phase 2: Debug Configurations

CREATE .vscode/launch.json:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug CLI Generate",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/packages/generator/dist/cli.js",
      "args": [
        "generate",
        "${file}",
        "-o",
        "${workspaceFolder}/output"
      ],
      "cwd": "${workspaceFolder}",
      "console": "integratedTerminal",
      "skipFiles": ["<node_internals>/**"],
      "preLaunchTask": "build",
      "env": {
        "DEBUG": "glsp:*",
        "NODE_ENV": "development"
      }
    },
    {
      "name": "Debug Current Test File",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/vitest/vitest.mjs",
      "args": [
        "run",
        "${file}"
      ],
      "cwd": "${workspaceFolder}",
      "console": "integratedTerminal",
      "skipFiles": ["<node_internals>/**"]
    },
    {
      "name": "Debug All Tests",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/vitest/vitest.mjs",
      "args": ["run"],
      "cwd": "${workspaceFolder}",
      "console": "integratedTerminal",
      "skipFiles": ["<node_internals>/**"]
    },
    {
      "name": "Debug VS Code Extension",
      "type": "extensionHost",
      "request": "launch",
      "runtimeExecutable": "${execPath}",
      "args": [
        "--extensionDevelopmentPath=${workspaceFolder}/packages/vscode-extension"
      ],
      "outFiles": [
        "${workspaceFolder}/packages/vscode-extension/out/**/*.js"
      ],
      "preLaunchTask": "build:extension",
      "env": {
        "DEBUG": "glsp:vscode:*"
      }
    },
    {
      "name": "Attach to Process",
      "type": "node",
      "request": "attach",
      "port": 9229,
      "restart": true,
      "skipFiles": ["<node_internals>/**"]
    },
    {
      "name": "Debug API Server",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/packages/generator/dist/api-server.js",
      "cwd": "${workspaceFolder}",
      "console": "integratedTerminal",
      "skipFiles": ["<node_internals>/**"],
      "env": {
        "API_PORT": "51620",
        "LOG_LEVEL": "debug"
      }
    }
  ],
  "compounds": [
    {
      "name": "Full Stack Debug",
      "configurations": [
        "Debug API Server",
        "Debug VS Code Extension"
      ],
      "stopAll": true
    }
  ]
}
```

### Phase 3: Code Snippets

CREATE .vscode/langium.code-snippets:
```json
{
  "Grammar Entry Rule": {
    "prefix": "entry",
    "body": [
      "entry ${1:Model}:",
      "\t${2:elements}+=${3:Element}*;"
    ],
    "description": "Create an entry rule for Langium grammar"
  },
  "Interface Declaration": {
    "prefix": "interface",
    "body": [
      "interface ${1:Name} {",
      "\t${2:property}: ${3:string}",
      "}"
    ],
    "description": "Create a Langium interface"
  },
  "Rule with Alternatives": {
    "prefix": "rule",
    "body": [
      "${1:Rule}:",
      "\t${2:Alternative1} | ${3:Alternative2};"
    ],
    "description": "Create a rule with alternatives"
  },
  "Terminal Rule": {
    "prefix": "terminal",
    "body": [
      "terminal ${1:ID}: /${2:[_a-zA-Z][\\\\w_]*}/;"
    ],
    "description": "Create a terminal rule"
  },
  "Hidden Terminal": {
    "prefix": "hidden",
    "body": [
      "hidden terminal ${1:WS}: /\\\\s+/;"
    ],
    "description": "Create a hidden terminal rule"
  },
  "Cross Reference": {
    "prefix": "ref",
    "body": [
      "${1:reference}=[${2:Type}:${3:ID}]"
    ],
    "description": "Create a cross-reference"
  }
}
```

CREATE .vscode/typescript.code-snippets:
```json
{
  "Test Suite": {
    "prefix": "test-suite",
    "body": [
      "import { describe, it, expect, beforeEach, afterEach } from 'vitest';",
      "import { ${1:Subject} } from '${2:./subject}';",
      "",
      "describe('${1:Subject}', () => {",
      "\tbeforeEach(() => {",
      "\t\t$0",
      "\t});",
      "",
      "\tit('should ${3:do something}', () => {",
      "\t\texpect(true).toBe(true);",
      "\t});",
      "});"
    ],
    "description": "Create a test suite"
  },
  "Error Class": {
    "prefix": "error-class",
    "body": [
      "export class ${1:Name}Error extends GLSPError {",
      "\tconstructor(${2:message}: string) {",
      "\t\tsuper(${2:message}, {",
      "\t\t\tcode: '${3:E000}',",
      "\t\t\tsuggestion: '${4:Try this}',",
      "\t\t\tlink: 'https://docs.glsp.dev/errors/${3:E000}'",
      "\t\t});",
      "\t}",
      "}"
    ],
    "description": "Create a custom error class"
  },
  "Async Handler": {
    "prefix": "async-handler",
    "body": [
      "async ${1:handle}(${2:param}: ${3:Type}): Promise<${4:Result}> {",
      "\ttry {",
      "\t\t$0",
      "\t} catch (error) {",
      "\t\tawait errorHandler.handle(error);",
      "\t\tthrow error;",
      "\t}",
      "}"
    ],
    "description": "Create an async handler with error handling"
  }
}
```

### Phase 4: Enhanced Tasks

UPDATE .vscode/tasks.json:
```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "build",
      "type": "shell",
      "command": "yarn build",
      "group": {
        "kind": "build",
        "isDefault": true
      },
      "problemMatcher": "$tsc",
      "presentation": {
        "reveal": "always",
        "panel": "dedicated"
      }
    },
    {
      "label": "build:extension",
      "type": "shell",
      "command": "yarn workspace @glsp/vscode-extension compile",
      "problemMatcher": "$tsc"
    },
    {
      "label": "dev:all",
      "type": "shell",
      "command": "yarn dev:all",
      "isBackground": true,
      "problemMatcher": {
        "pattern": {
          "regexp": "^([^:]+):(\\d+):(\\d+):\\s+(error|warning):\\s+(.*)$",
          "file": 1,
          "line": 2,
          "column": 3,
          "severity": 4,
          "message": 5
        },
        "background": {
          "activeOnStart": true,
          "beginsPattern": "Starting development mode",
          "endsPattern": "Watching for changes"
        }
      }
    },
    {
      "label": "test:current",
      "type": "shell",
      "command": "yarn test ${file}",
      "problemMatcher": "$tsc",
      "group": "test"
    },
    {
      "label": "generate:current",
      "type": "shell",
      "command": "node packages/generator/dist/cli.js generate ${file} -o output",
      "problemMatcher": [],
      "presentation": {
        "reveal": "always",
        "panel": "new"
      }
    },
    {
      "label": "clean",
      "type": "shell",
      "command": "yarn clean",
      "problemMatcher": []
    },
    {
      "label": "doctor",
      "type": "shell",
      "command": "yarn doctor",
      "problemMatcher": [],
      "presentation": {
        "reveal": "always",
        "panel": "dedicated",
        "clear": true
      }
    }
  ]
}
```

### Phase 5: Keyboard Shortcuts

CREATE .vscode/keybindings.json:
```json
[
  {
    "key": "ctrl+shift+g",
    "command": "workbench.action.tasks.runTask",
    "args": "generate:current",
    "when": "resourceExtname == .langium"
  },
  {
    "key": "ctrl+shift+t",
    "command": "workbench.action.tasks.runTask",
    "args": "test:current",
    "when": "resourceExtname == .ts"
  },
  {
    "key": "ctrl+shift+d",
    "command": "workbench.action.tasks.runTask",
    "args": "dev:all"
  },
  {
    "key": "ctrl+shift+b",
    "command": "workbench.action.tasks.runTask",
    "args": "build"
  },
  {
    "key": "f5",
    "command": "workbench.action.debug.selectandstart",
    "when": "resourceExtname == .langium"
  }
]
```

### Integration Points

UPDATE .vscode/extensions.json:
```json
{
  "recommendations": [
    // Language Support
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next",
    "langium.langium-vscode",
    
    // Development Tools
    "ZixuanChen.vitest-explorer",
    "streetsidesoftware.code-spell-checker",
    "usernamehw.errorlens",
    "christian-kohler.path-intellisense",
    "aaron-bond.better-comments",
    
    // Git Integration
    "eamodio.gitlens",
    "mhutchie.git-graph",
    
    // Productivity
    "sleistner.vscode-fileutils",
    "alefragnani.Bookmarks",
    "alefragnani.project-manager",
    "johnpapa.vscode-peacock",
    
    // Docker Support
    "ms-azuretools.vscode-docker",
    
    // Documentation
    "yzhang.markdown-all-in-one",
    "bierner.markdown-mermaid"
  ],
  "unwantedRecommendations": [
    "ms-vscode.vscode-typescript-tslint-plugin"
  ]
}
```

CREATE .vscode/launch.code-workspace:
```json
{
  "folders": [
    {
      "name": "🏠 Root",
      "path": ".."
    },
    {
      "name": "📦 Generator",
      "path": "../packages/generator"
    },
    {
      "name": "🧩 VS Code Extension",
      "path": "../packages/vscode-extension"
    }
  ],
  "settings": {
    "files.exclude": {
      "**/node_modules": true,
      "**/dist": true
    }
  },
  "extensions": {
    "recommendations": [
      "langium.langium-vscode"
    ]
  }
}
```

## Validation Loop

### Test Configurations
```bash
# Test build task
code --wait --command workbench.action.tasks.runTask build

# Test debug configurations
code --wait --command workbench.action.debug.selectandstart

# Test snippets
# Create new .langium file and type "entry" to trigger snippet
```

### Verify Settings
```bash
# Check formatting on save
echo "const  x={a:1}" > test.ts
# Open in VS Code, save, should auto-format

# Check terminal colors
code --wait --command workbench.action.terminal.new
yarn dev  # Should show colors
```

## Final Validation Checklist
- [ ] All settings apply without errors
- [ ] Debug configurations work for all scenarios
- [ ] Snippets appear in IntelliSense
- [ ] Tasks run from command palette
- [ ] Keyboard shortcuts work as expected
- [ ] Extensions install automatically
- [ ] Workspace colors help distinguish project
- [ ] Settings sync across monorepo packages

## Success Metrics
- Setup time: < 1 minute for new developers
- Debug success: All configurations work first try
- Productivity: 30% faster common operations
- Consistency: Zero formatting conflicts