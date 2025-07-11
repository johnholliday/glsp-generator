# Prompt 015: First-Time Setup Automation

## Goal
Create a seamless first-time setup experience that transforms the complex multi-step setup process into a single command that automatically configures the entire development environment, validates the setup, and provides clear feedback on any issues.

## Why
- New developers currently face a steep learning curve with multiple manual steps
- Setup errors are common and time-consuming to debug
- Inconsistent environments lead to "works on my machine" issues
- Manual setup steps are error-prone and often skipped
- Current documentation is scattered across multiple files

## What
A single `yarn setup` command that orchestrates the entire setup process with intelligent error handling, progress indicators, and automatic recovery from common issues.

### Success Criteria
- [ ] Single command completes entire setup in under 5 minutes
- [ ] Zero manual intervention required for happy path
- [ ] Clear error messages with automatic recovery suggestions
- [ ] Works on Windows (PowerShell), macOS, and Linux
- [ ] Validates setup and runs health checks
- [ ] Creates necessary configuration files from templates
- [ ] Idempotent - can be run multiple times safely

## All Needed Context

### Documentation & References
```yaml
- file: /home/john/projects/utils/glsp-generator/docs/SETUP_INSTRUCTIONS.md
  why: Current manual setup process to automate
  
- file: /home/john/projects/utils/glsp-generator/scripts/setup-global-access.js
  why: Existing setup script to integrate
  
- file: /home/john/projects/utils/glsp-generator/scripts/install-vscode-extension.ps1
  why: VS Code extension installation logic
  
- file: /home/john/projects/utils/glsp-generator/package.json
  why: Scripts to coordinate and dependencies to check

- file: /home/john/projects/utils/glsp-generator/packages/generator/package.json
  why: Generator-specific build requirements

- file: /home/john/projects/utils/glsp-generator/CLAUDE.md
  why: Project conventions and requirements to follow
```

### Current Setup Process (Manual)
```bash
# 1. Clone repository
# 2. Install dependencies
yarn install

# 3. Build all packages
yarn build

# 4. Create .env file
cp .env.example .env  # (doesn't exist yet)

# 5. Install VS Code extension
yarn vscode:install

# 6. Setup global CLI access
yarn install:global

# 7. Verify setup
glsp --version
```

### Desired Automated Process
```bash
# Single command
yarn setup

# Output:
# ✅ Checking prerequisites...
# ✅ Installing dependencies...
# ✅ Building packages...
# ✅ Creating configuration...
# ✅ Installing VS Code extension...
# ✅ Setting up global CLI...
# ✅ Running health checks...
# 
# 🎉 Setup complete! You can now:
#    - Use 'glsp' command globally
#    - Right-click .langium files in VS Code
#    - Run 'yarn dev' for development
```

### Known Setup Issues
```yaml
COMMON_ERRORS:
  - "command not found: glsp"
    cause: Global link failed
    solution: Re-run with admin privileges or use npx
    
  - "Cannot find module"
    cause: Build step skipped or failed
    solution: Clean and rebuild
    
  - "VS Code extension not found"
    cause: VS Code not in PATH
    solution: Detect VS Code installation path
    
  - "Permission denied"
    cause: npm global directory permissions
    solution: Use yarn link or change npm prefix
```

## Implementation Blueprint

### Phase 1: Core Setup Orchestrator

CREATE scripts/setup.js:
```javascript
#!/usr/bin/env node
import { execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';
import ora from 'ora';
import prompts from 'prompts';

class SetupOrchestrator {
  constructor() {
    this.rootDir = process.cwd();
    this.steps = [];
    this.errors = [];
  }

  async run() {
    console.log(chalk.bold.blue('\n🚀 GLSP Generator Setup\n'));
    
    // Check if already setup
    if (await this.isAlreadySetup()) {
      const { proceed } = await prompts({
        type: 'confirm',
        name: 'proceed',
        message: 'Setup already completed. Run again?',
        initial: false
      });
      if (!proceed) return;
    }

    // Define setup steps
    this.steps = [
      { name: 'Prerequisites', fn: () => this.checkPrerequisites() },
      { name: 'Dependencies', fn: () => this.installDependencies() },
      { name: 'Build', fn: () => this.buildPackages() },
      { name: 'Configuration', fn: () => this.createConfiguration() },
      { name: 'VS Code Extension', fn: () => this.installVSCodeExtension() },
      { name: 'Global CLI', fn: () => this.setupGlobalCLI() },
      { name: 'Health Check', fn: () => this.runHealthCheck() }
    ];

    // Execute steps
    for (const step of this.steps) {
      await this.executeStep(step);
    }

    // Final report
    this.showFinalReport();
  }

  async executeStep({ name, fn }) {
    const spinner = ora(name).start();
    try {
      await fn();
      spinner.succeed();
    } catch (error) {
      spinner.fail();
      this.errors.push({ step: name, error });
      
      // Try to recover
      const recovered = await this.tryRecover(name, error);
      if (!recovered) {
        this.showError(name, error);
        process.exit(1);
      }
    }
  }

  // Step implementations...
}
```

### Phase 2: Prerequisites Checker

```javascript
async checkPrerequisites() {
  const checks = [
    {
      name: 'Node.js version',
      check: () => {
        const version = process.version;
        const major = parseInt(version.split('.')[0].substring(1));
        if (major < 18) throw new Error(`Node.js 18+ required (found ${version})`);
        return version;
      }
    },
    {
      name: 'Yarn version',
      check: () => {
        const version = execSync('yarn --version', { encoding: 'utf8' }).trim();
        if (!version.startsWith('4.')) throw new Error(`Yarn 4.x required (found ${version})`);
        return version;
      }
    },
    {
      name: 'Git',
      check: () => {
        execSync('git --version', { stdio: 'ignore' });
        return 'installed';
      }
    },
    {
      name: 'VS Code',
      check: () => {
        try {
          execSync('code --version', { stdio: 'ignore' });
          return 'installed';
        } catch {
          // Check common installation paths
          const paths = this.getVSCodePaths();
          for (const path of paths) {
            if (existsSync(path)) return `found at ${path}`;
          }
          throw new Error('VS Code not found');
        }
      }
    }
  ];

  const results = [];
  for (const { name, check } of checks) {
    try {
      const result = check();
      results.push(chalk.green(`  ✓ ${name}: ${result}`));
    } catch (error) {
      throw new Error(`${name}: ${error.message}`);
    }
  }

  console.log(results.join('\n'));
}
```

### Phase 3: Smart Dependency Installation

```javascript
async installDependencies() {
  // Check if dependencies already installed
  if (existsSync(join(this.rootDir, 'node_modules'))) {
    // Verify integrity
    try {
      execSync('yarn install --immutable --check-cache', { stdio: 'ignore' });
      console.log(chalk.gray('  Dependencies up to date'));
      return;
    } catch {
      console.log(chalk.yellow('  Dependencies need update'));
    }
  }

  // Install with progress
  execSync('yarn install', { 
    stdio: 'inherit',
    env: { ...process.env, FORCE_COLOR: '1' }
  });
}
```

### Phase 4: Configuration Management

```javascript
async createConfiguration() {
  const envPath = join(this.rootDir, '.env');
  const envExamplePath = join(this.rootDir, '.env.example');
  
  // Create .env.example if it doesn't exist
  if (!existsSync(envExamplePath)) {
    const defaultEnv = `# GLSP Generator Configuration
# Container Registry
CONTAINER_REGISTRY=ghcr.io
CONTAINER_IMAGE=ghcr.io/johnholliday/glsp-generator
API_PORT=51620

# GitHub Authentication (for pushing Docker images)
# GITHUB_TOKEN=your_token_here
# GITHUB_USERNAME=your_username_here

# Development
NODE_ENV=development
LOG_LEVEL=info
`;
    writeFileSync(envExamplePath, defaultEnv);
  }

  // Create .env from .env.example
  if (!existsSync(envPath)) {
    const envContent = readFileSync(envExamplePath, 'utf8');
    writeFileSync(envPath, envContent);
    console.log(chalk.gray('  Created .env file'));
  } else {
    console.log(chalk.gray('  .env file already exists'));
  }

  // Add .env to .gitignore if not already there
  this.updateGitignore();
}
```

### Phase 5: Recovery Mechanisms

```javascript
async tryRecover(step, error) {
  const recoveryStrategies = {
    'Dependencies': async () => {
      console.log(chalk.yellow('\n  Attempting recovery...'));
      // Clear cache and retry
      execSync('yarn cache clean', { stdio: 'ignore' });
      await this.installDependencies();
      return true;
    },
    'Build': async () => {
      console.log(chalk.yellow('\n  Attempting clean build...'));
      // Clean and rebuild
      execSync('yarn clean', { stdio: 'ignore' });
      await this.buildPackages();
      return true;
    },
    'Global CLI': async () => {
      console.log(chalk.yellow('\n  Trying alternative installation...'));
      // Try npm link as fallback
      const generatorPath = join(this.rootDir, 'packages/generator');
      execSync('npm link', { cwd: generatorPath, stdio: 'ignore' });
      return true;
    }
  };

  const strategy = recoveryStrategies[step];
  if (strategy) {
    try {
      return await strategy();
    } catch {
      return false;
    }
  }
  return false;
}
```

### Integration Points

UPDATE package.json:
```json
{
  "scripts": {
    "setup": "node scripts/setup.js",
    "setup:reset": "yarn clean && rm -rf node_modules && yarn setup",
    "postinstall": "echo 'Run \"yarn setup\" to complete setup'"
  }
}
```

CREATE .env.example:
```bash
# GLSP Generator Configuration
# Copy this file to .env and update values as needed

# Container Registry
CONTAINER_REGISTRY=ghcr.io
CONTAINER_IMAGE=ghcr.io/johnholliday/glsp-generator
API_PORT=51620

# GitHub Authentication (optional - for pushing Docker images)
# GITHUB_TOKEN=your_token_here
# GITHUB_USERNAME=your_username_here

# Development
NODE_ENV=development
LOG_LEVEL=info
```

## Validation Loop

### Manual Testing
```bash
# Test fresh setup
rm -rf node_modules packages/*/node_modules
rm -rf packages/*/dist
rm .env
yarn setup

# Test idempotent run
yarn setup

# Test with missing prerequisites
nvm use 16  # Old Node version
yarn setup  # Should fail with clear message
```

### Automated Tests
```javascript
// test/setup.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import { SetupOrchestrator } from '../scripts/setup.js';

describe('Setup Orchestrator', () => {
  it('detects missing prerequisites', async () => {
    const setup = new SetupOrchestrator();
    // Mock old Node version
    process.version = 'v16.0.0';
    
    await expect(setup.checkPrerequisites()).rejects.toThrow('Node.js 18+ required');
  });

  it('creates configuration files', async () => {
    // Test configuration creation
  });

  it('recovers from build failures', async () => {
    // Test recovery mechanisms
  });
});
```

## Final Validation Checklist
- [ ] Fresh clone setup works with single command
- [ ] Handles all common error cases gracefully
- [ ] Works on Windows (PowerShell), macOS, and Linux
- [ ] Idempotent - can run multiple times
- [ ] Clear progress indicators and error messages
- [ ] Automatic recovery from common issues
- [ ] VS Code extension installed and working
- [ ] Global CLI command available
- [ ] All health checks pass

## Success Metrics
- Setup time: < 5 minutes on average connection
- Success rate: > 95% on first attempt
- User intervention: Zero for happy path
- Error clarity: All errors have actionable solutions