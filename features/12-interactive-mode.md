# Interactive Mode Feature

## Overview
The Interactive Mode feature provides a guided, user-friendly interface for users who are new to GLSP Generator or prefer step-by-step assistance. It uses prompts to collect input and guide users through the generation process.

## Purpose
- Lower barrier to entry for new users
- Provide guided configuration setup
- Offer contextual help and suggestions
- Validate inputs interactively
- Create a wizard-like experience

## Current Implementation

### Components

#### 1. **Interactive Helper** (`src/commands/base/interactive.helper.ts`)
- Prompt management
- Input validation
- File selection
- Confirmation dialogs
- Multi-select options

#### 2. **Command Integration**
- Available in all major commands
- Fallback for missing arguments
- Configuration wizard
- Feature selection menus

#### 3. **Prompt Types**
- Text input
- File selection
- Yes/No confirmation
- Single selection
- Multiple selection
- Password input

### Interactive Flows

#### New Project Wizard
```
🚀 Welcome to GLSP Generator!

Let's create a new GLSP extension for your DSL.

? What's your DSL name? › My Domain Language
? Short name (for packages)? › my-dsl
? Description? › Visual editor for My Domain Language
? Author name? › John Doe
? License? › (Use arrow keys)
❯ MIT
  Apache-2.0
  GPL-3.0
  ISC
  Other

? Select features to include: › (Press space to select)
◉ Documentation
◯ Type Safety
◯ Test Suite
◯ CI/CD Pipeline

? Choose a template: ›
❯ Basic - Simple GLSP extension
  Advanced - Full-featured with examples
  Custom - Start from scratch

Creating your GLSP extension...
✓ Project created at ./my-dsl-glsp
✓ Dependencies installed
✓ Initial build completed

Next steps:
1. cd my-dsl-glsp
2. yarn dev
3. Open http://localhost:3000
```

#### Grammar File Selection
```
? Enter path to grammar file: › 
  💡 Hint: You can drag & drop the file here

? No grammar file found. Would you like to:
❯ Browse for file
  Create sample grammar
  Enter path manually

? Select grammar file: › (Showing .langium files)
❯ ./grammars/statemachine.langium
  ./grammars/workflow.langium
  ./examples/sample.langium
  
? Grammar file selected: statemachine.langium
  ✓ Valid grammar structure
  ✓ 5 interfaces found
  ✓ 2 type aliases found
```

#### Feature Selection
```
? Which features would you like to generate?

📚 Documentation
  ◉ API Reference
  ◉ README
  ◯ Examples
  ◯ Tutorials

🔒 Type Safety
  ◉ TypeScript Declarations
  ◉ Runtime Validation
  ◯ Type Guards
  ◯ Zod Schemas

🧪 Testing
  ◯ Unit Tests
  ◯ Integration Tests
  ◯ E2E Tests
  ◯ Test Utilities

🔧 CI/CD
  ◯ GitHub Actions
  ◯ GitLab CI
  ◯ Docker Support

? Confirm selections? (Y/n) › Yes
```

## Implementation Examples

### Basic Prompts
```typescript
// Text input with validation
const name = await prompts({
  type: 'text',
  name: 'value',
  message: 'Project name?',
  validate: value => {
    if (!value) return 'Name is required'
    if (!/^[a-z0-9-]+$/.test(value)) {
      return 'Use lowercase letters, numbers, and hyphens only'
    }
    return true
  }
})

// File selection with existence check
const file = await prompts({
  type: 'text',
  name: 'value',
  message: 'Grammar file path?',
  validate: async value => {
    const exists = await fs.pathExists(value)
    return exists || 'File not found'
  }
})

// Multi-select with groups
const features = await prompts({
  type: 'multiselect',
  name: 'value',
  message: 'Select features',
  choices: [
    { title: 'Documentation', value: 'docs', selected: true },
    { title: 'Type Safety', value: 'types' },
    { title: 'Tests', value: 'tests' },
    { title: 'CI/CD', value: 'cicd' }
  ]
})
```

### Advanced Interactions
```typescript
// Conditional prompts
const questions = [
  {
    type: 'select',
    name: 'framework',
    message: 'Test framework?',
    choices: [
      { title: 'Vitest', value: 'vitest' },
      { title: 'Jest', value: 'jest' },
      { title: 'Mocha', value: 'mocha' }
    ]
  },
  {
    type: prev => prev === 'jest' ? 'confirm' : null,
    name: 'typescript',
    message: 'Use TypeScript for tests?'
  }
]

// Progress indication
const spinner = ora('Generating files...').start()
try {
  await generator.generate(grammar, output)
  spinner.succeed('Generation complete!')
} catch (error) {
  spinner.fail('Generation failed')
}

// Auto-suggestion
const projectName = await prompts({
  type: 'autocomplete',
  name: 'value',
  message: 'Select existing project',
  choices: await getExistingProjects(),
  suggest: async (input, choices) => {
    return choices.filter(c => 
      c.title.toLowerCase().includes(input.toLowerCase())
    )
  }
})
```

## Usage Patterns

### CLI Integration
```bash
# Triggers interactive mode when args missing
glsp-generator generate

# Force interactive mode
glsp-generator generate --interactive

# Skip prompts with defaults
glsp-generator generate --yes

# Use saved answers
glsp-generator generate --use-defaults
```

### Configuration Wizard
```typescript
// First-time setup
class ConfigWizard {
  async run() {
    console.log(chalk.blue('Welcome to GLSP Generator Setup!\n'))
    
    const config = await this.collectConfig()
    await this.validateConfig(config)
    await this.saveConfig(config)
    
    console.log(chalk.green('✓ Configuration saved to .glsprc.json'))
  }
  
  private async collectConfig() {
    return {
      extension: await this.promptExtensionInfo(),
      features: await this.promptFeatures(),
      styling: await this.promptStyling(),
      advanced: await this.promptAdvanced()
    }
  }
}
```

### Smart Defaults
```typescript
// Infer from context
const defaults = {
  projectName: path.basename(process.cwd()),
  author: await getGitUser(),
  license: await detectLicense(),
  packageManager: await detectPackageManager()
}

// Pre-fill prompts
const name = await prompts({
  type: 'text',
  name: 'value',
  message: 'Project name?',
  initial: defaults.projectName
})
```

## User Experience Features

### Help System
```
? Project name? › my-dsl (Press Tab for help)

─────────────────────────────────────
Project Name Help

The project name is used for:
• Package name in package.json
• Default output directory
• Extension identifier

Requirements:
• Lowercase letters, numbers, hyphens
• No spaces or special characters
• Should be unique on npm

Examples:
• my-dsl-editor
• statemachine-glsp
• workflow-visual
─────────────────────────────────────
```

### Input History
```typescript
// Save and reuse previous inputs
const history = new InputHistory('.glsp-history.json')

const name = await prompts({
  type: 'text',
  name: 'value',
  message: 'Grammar file?',
  initial: history.get('grammarFile'),
  onState: state => {
    if (state.submitted) {
      history.set('grammarFile', state.value)
    }
  }
})
```

### Validation Feedback
```
? Email address? › not-an-email
  ⚠️  Please enter a valid email address

? Grammar file? › ./grammar.txt
  ❌ File must have .langium extension

? Port number? › 80
  ⚠️  Port 80 requires admin privileges. Use 3000?
```

## Best Practices
1. **Progressive Disclosure**: Show advanced options only when needed
2. **Smart Defaults**: Pre-fill with sensible values
3. **Clear Messaging**: Use simple, jargon-free language
4. **Validation Feedback**: Immediate, helpful error messages
5. **Escape Hatches**: Allow users to exit gracefully

## Configuration
```json
{
  "interactive": {
    "enabled": true,
    "saveHistory": true,
    "historyFile": ".glsp-history.json",
    "defaults": {
      "useLastValues": true,
      "configFile": ".glsp-defaults.json"
    },
    "ui": {
      "colors": true,
      "emoji": true,
      "animations": true
    }
  }
}
```

## Future Enhancements
1. **GUI Mode**: Electron-based visual interface
2. **Web Interface**: Browser-based configuration
3. **Voice Commands**: Accessibility improvements
4. **AI Assistance**: Smart suggestions
5. **Template Gallery**: Browse and preview templates

## Dependencies
- `prompts`: Interactive prompts
- `ora`: Elegant spinners
- `chalk`: Terminal styling
- `inquirer`: Alternative prompt library
- `boxen`: Terminal boxes

## Testing
- Prompt flow tests
- Validation logic tests
- History persistence tests
- Error handling tests
- Accessibility tests

## Related Features
- [CLI Interface](./03-cli-interface.md)
- [Configuration System](./04-configuration.md)
- [Template Management](./13-template-management.md)