# Prompt 016: Developer Environment Configuration

## Goal
Create a robust environment configuration system with validation, type safety, and helpful defaults that ensures all developers work with consistent settings while allowing for local customization.

## Why
- No standardized way to configure environment-specific settings
- Developers manually create .env files without guidance
- Missing configuration leads to runtime errors
- No validation of required environment variables
- Tool version mismatches cause subtle bugs
- No central place to document all configuration options

## What
A comprehensive environment configuration system with .env.example template, validation scripts, and automatic tool version checking that provides clear documentation and helpful error messages.

### Success Criteria
- [ ] .env.example with all configuration options documented
- [ ] Automatic .env creation from template during setup
- [ ] Runtime validation of required environment variables
- [ ] Tool version validation (Node, Yarn, Docker, etc.)
- [ ] Type-safe configuration access in TypeScript
- [ ] Clear error messages for missing/invalid configuration
- [ ] Support for environment-specific overrides

## All Needed Context

### Documentation & References
```yaml
- file: /home/john/projects/utils/glsp-generator/.env
  why: Current environment variables in use
  
- file: /home/john/projects/utils/glsp-generator/packages/generator/src/api-server.ts
  why: How environment variables are currently accessed
  
- file: /home/john/projects/utils/glsp-generator/package.json
  why: Required tool versions (Node, Yarn)
  
- file: /home/john/projects/utils/glsp-generator/.gitignore
  why: Ensure .env is ignored but .env.example is tracked

- url: https://github.com/motdotla/dotenv
  why: Standard .env file handling library

- url: https://github.com/colinhacks/zod
  why: Runtime type validation for environment variables
```

### Current Environment Usage
```typescript
// Currently scattered throughout codebase:
const port = process.env.PORT || process.env.API_PORT || 51620;
const registry = process.env.CONTAINER_REGISTRY || 'ghcr.io';
// No validation, no type safety, no documentation
```

### Desired Configuration System
```typescript
// Type-safe, validated, documented:
import { config } from './config';

const port = config.api.port; // number, validated
const registry = config.docker.registry; // string, with allowed values
```

### Known Configuration Categories
```yaml
API:
  - PORT / API_PORT (number, default: 51620)
  - HOST (string, default: '0.0.0.0')
  - LOG_LEVEL (enum: debug|info|warn|error)

Docker:
  - CONTAINER_REGISTRY (enum: ghcr.io|docker.io)
  - CONTAINER_IMAGE (string)
  - GITHUB_TOKEN (string, optional)
  - GITHUB_USERNAME (string, optional)

Development:
  - NODE_ENV (enum: development|test|production)
  - DEBUG (string, debug namespaces)
  - FORCE_COLOR (boolean, for CLI output)

Paths:
  - WORKSPACE_DIR (string, default: ./workspace)
  - TEMPLATES_DIR (string, default: ./templates)
  - OUTPUT_DIR (string, default: ./output)
```

## Implementation Blueprint

### Phase 1: Environment Template

CREATE .env.example:
```bash
# GLSP Generator Environment Configuration
# Copy this file to .env and update values as needed
# All variables are optional unless marked as REQUIRED

# =============================================================================
# API Server Configuration
# =============================================================================
# Port for the API server
API_PORT=51620

# Host binding (0.0.0.0 for all interfaces, 127.0.0.1 for localhost only)
API_HOST=0.0.0.0

# Logging level: debug, info, warn, error
LOG_LEVEL=info

# =============================================================================
# Docker Configuration
# =============================================================================
# Container registry: ghcr.io or docker.io
CONTAINER_REGISTRY=ghcr.io

# Full container image name
CONTAINER_IMAGE=ghcr.io/johnholliday/glsp-generator

# GitHub authentication for pushing to ghcr.io
# Create a PAT with write:packages scope
# GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
# GITHUB_USERNAME=your-username

# =============================================================================
# Development Settings
# =============================================================================
# Node environment: development, test, production
NODE_ENV=development

# Debug namespaces (e.g., glsp:*, express:*)
# DEBUG=glsp:*

# Force color output in terminals
FORCE_COLOR=1

# =============================================================================
# Path Configuration
# =============================================================================
# Working directory for API server file operations
WORKSPACE_DIR=./workspace

# Template directory (relative to generator package)
TEMPLATES_DIR=./templates

# Default output directory for generated files
OUTPUT_DIR=./output

# =============================================================================
# Feature Flags
# =============================================================================
# Enable experimental features
ENABLE_EXPERIMENTAL=false

# Enable performance profiling
ENABLE_PROFILING=false

# Enable detailed error stacks
ENABLE_DETAILED_ERRORS=true

# =============================================================================
# Tool Requirements (DO NOT EDIT - Used for validation)
# =============================================================================
REQUIRED_NODE_VERSION=18.0.0
REQUIRED_YARN_VERSION=4.0.0
REQUIRED_DOCKER_VERSION=20.10.0
```

### Phase 2: Configuration Schema & Validation

CREATE packages/generator/src/config/schema.ts:
```typescript
import { z } from 'zod';

// Environment variable schema with defaults and validation
export const envSchema = z.object({
  // API Configuration
  API_PORT: z.string().regex(/^\d+$/).transform(Number).default('51620'),
  API_HOST: z.string().default('0.0.0.0'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  
  // Docker Configuration
  CONTAINER_REGISTRY: z.enum(['ghcr.io', 'docker.io']).default('ghcr.io'),
  CONTAINER_IMAGE: z.string().default('ghcr.io/johnholliday/glsp-generator'),
  GITHUB_TOKEN: z.string().optional(),
  GITHUB_USERNAME: z.string().optional(),
  
  // Development
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DEBUG: z.string().optional(),
  FORCE_COLOR: z.string().transform(val => val === '1' || val === 'true').default('1'),
  
  // Paths
  WORKSPACE_DIR: z.string().default('./workspace'),
  TEMPLATES_DIR: z.string().default('./templates'),
  OUTPUT_DIR: z.string().default('./output'),
  
  // Feature Flags
  ENABLE_EXPERIMENTAL: z.string().transform(val => val === 'true').default('false'),
  ENABLE_PROFILING: z.string().transform(val => val === 'true').default('false'),
  ENABLE_DETAILED_ERRORS: z.string().transform(val => val === 'true').default('true'),
  
  // Tool Requirements
  REQUIRED_NODE_VERSION: z.string().default('18.0.0'),
  REQUIRED_YARN_VERSION: z.string().default('4.0.0'),
  REQUIRED_DOCKER_VERSION: z.string().optional()
});

export type EnvConfig = z.infer<typeof envSchema>;

// Structured config object
export const createConfig = (env: EnvConfig) => ({
  api: {
    port: env.API_PORT,
    host: env.API_HOST,
    logLevel: env.LOG_LEVEL
  },
  docker: {
    registry: env.CONTAINER_REGISTRY,
    image: env.CONTAINER_IMAGE,
    auth: {
      token: env.GITHUB_TOKEN,
      username: env.GITHUB_USERNAME
    }
  },
  development: {
    nodeEnv: env.NODE_ENV,
    debug: env.DEBUG,
    forceColor: env.FORCE_COLOR
  },
  paths: {
    workspace: env.WORKSPACE_DIR,
    templates: env.TEMPLATES_DIR,
    output: env.OUTPUT_DIR
  },
  features: {
    experimental: env.ENABLE_EXPERIMENTAL,
    profiling: env.ENABLE_PROFILING,
    detailedErrors: env.ENABLE_DETAILED_ERRORS
  },
  requirements: {
    node: env.REQUIRED_NODE_VERSION,
    yarn: env.REQUIRED_YARN_VERSION,
    docker: env.REQUIRED_DOCKER_VERSION
  }
});

export type Config = ReturnType<typeof createConfig>;
```

### Phase 3: Configuration Loader

CREATE packages/generator/src/config/index.ts:
```typescript
import { config as dotenvConfig } from 'dotenv';
import { resolve } from 'path';
import { existsSync } from 'fs';
import chalk from 'chalk';
import { envSchema, createConfig } from './schema.js';

class ConfigurationManager {
  private config: Config | null = null;
  private errors: string[] = [];

  load(): Config {
    if (this.config) return this.config;

    // Load .env file if it exists
    const envPath = resolve(process.cwd(), '.env');
    if (existsSync(envPath)) {
      dotenvConfig({ path: envPath });
    } else if (process.env.NODE_ENV !== 'production') {
      console.warn(chalk.yellow('⚠️  No .env file found. Using defaults.'));
    }

    // Parse and validate environment
    try {
      const parsed = envSchema.parse(process.env);
      this.config = createConfig(parsed);
      return this.config;
    } catch (error) {
      if (error instanceof z.ZodError) {
        this.handleValidationError(error);
      }
      throw error;
    }
  }

  private handleValidationError(error: z.ZodError) {
    console.error(chalk.red('\n❌ Environment Configuration Error\n'));
    
    error.errors.forEach(err => {
      const path = err.path.join('.');
      console.error(chalk.red(`  • ${path}: ${err.message}`));
      
      // Provide helpful suggestions
      if (err.code === 'invalid_enum_value') {
        console.error(chalk.gray(`    Allowed values: ${err.options.join(', ')}`));
      }
    });
    
    console.error(chalk.yellow('\n💡 Create a .env file from .env.example:'));
    console.error(chalk.gray('   cp .env.example .env\n'));
    
    process.exit(1);
  }

  validate(): boolean {
    try {
      this.load();
      return true;
    } catch {
      return false;
    }
  }

  getErrors(): string[] {
    return this.errors;
  }
}

// Singleton instance
const manager = new ConfigurationManager();

// Export configured instance
export const config = manager.load();
export const validateConfig = () => manager.validate();
export const getConfigErrors = () => manager.getErrors();

// Re-export types
export type { Config, EnvConfig } from './schema.js';
```

### Phase 4: Tool Version Validator

CREATE scripts/check-environment.js:
```javascript
#!/usr/bin/env node
import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';
import semver from 'semver';

class EnvironmentChecker {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.loadRequirements();
  }

  loadRequirements() {
    // Load from .env.example or defaults
    const envExamplePath = join(process.cwd(), '.env.example');
    if (existsSync(envExamplePath)) {
      const content = readFileSync(envExamplePath, 'utf8');
      const nodeMatch = content.match(/REQUIRED_NODE_VERSION=(.+)/);
      const yarnMatch = content.match(/REQUIRED_YARN_VERSION=(.+)/);
      
      this.requirements = {
        node: nodeMatch ? nodeMatch[1] : '18.0.0',
        yarn: yarnMatch ? yarnMatch[1] : '4.0.0',
        docker: '20.10.0' // Optional
      };
    }
  }

  check() {
    console.log(chalk.bold('\n🔍 Checking Development Environment\n'));

    this.checkNode();
    this.checkYarn();
    this.checkDocker();
    this.checkVSCode();
    this.checkGit();
    
    this.report();
  }

  checkNode() {
    try {
      const version = process.version.substring(1); // Remove 'v'
      if (semver.lt(version, this.requirements.node)) {
        this.errors.push({
          tool: 'Node.js',
          found: version,
          required: this.requirements.node,
          fix: 'Install Node.js 18+ from https://nodejs.org'
        });
      } else {
        this.success('Node.js', version);
      }
    } catch (error) {
      this.errors.push({
        tool: 'Node.js',
        error: 'Not found',
        fix: 'Install Node.js from https://nodejs.org'
      });
    }
  }

  checkYarn() {
    try {
      const version = execSync('yarn --version', { encoding: 'utf8' }).trim();
      if (!version.startsWith('4.')) {
        this.errors.push({
          tool: 'Yarn',
          found: version,
          required: '4.x',
          fix: 'Run: corepack enable && corepack prepare yarn@stable --activate'
        });
      } else {
        this.success('Yarn', version);
      }
    } catch (error) {
      this.errors.push({
        tool: 'Yarn',
        error: 'Not found',
        fix: 'Run: corepack enable && corepack prepare yarn@stable --activate'
      });
    }
  }

  checkDocker() {
    try {
      const version = execSync('docker --version', { encoding: 'utf8' })
        .match(/Docker version ([0-9.]+)/)?.[1];
      if (version) {
        this.success('Docker', version, true);
      }
    } catch {
      this.warnings.push({
        tool: 'Docker',
        message: 'Not found (optional for Docker workflows)'
      });
    }
  }

  success(tool, version, optional = false) {
    const status = optional ? '(optional)' : '';
    console.log(chalk.green(`  ✓ ${tool}: ${version} ${status}`));
  }

  report() {
    if (this.errors.length > 0) {
      console.log(chalk.red('\n❌ Environment Issues Found:\n'));
      this.errors.forEach(err => {
        console.log(chalk.red(`  • ${err.tool}:`));
        if (err.found) {
          console.log(chalk.gray(`    Found: ${err.found}, Required: ${err.required}`));
        } else {
          console.log(chalk.gray(`    ${err.error}`));
        }
        console.log(chalk.yellow(`    Fix: ${err.fix}`));
      });
      process.exit(1);
    }

    if (this.warnings.length > 0) {
      console.log(chalk.yellow('\n⚠️  Warnings:\n'));
      this.warnings.forEach(warn => {
        console.log(chalk.yellow(`  • ${warn.tool}: ${warn.message}`));
      });
    }

    console.log(chalk.green('\n✅ Environment check passed!\n'));
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  new EnvironmentChecker().check();
}

export { EnvironmentChecker };
```

### Integration Points

UPDATE .gitignore:
```gitignore
# Environment files
.env
.env.local
.env.*.local
!.env.example
```

UPDATE package.json:
```json
{
  "scripts": {
    "check:env": "node scripts/check-environment.js",
    "config:validate": "tsx packages/generator/src/config/validate.ts",
    "predev": "yarn check:env",
    "prebuild": "yarn check:env"
  }
}
```

CREATE packages/generator/src/config/validate.ts:
```typescript
// Standalone validation script
import { validateConfig, getConfigErrors } from './index.js';

if (!validateConfig()) {
  console.error('Configuration validation failed:');
  getConfigErrors().forEach(err => console.error(`  - ${err}`));
  process.exit(1);
}

console.log('✅ Configuration is valid');
```

## Validation Loop

### Level 1: Environment Check
```bash
# Check all tools
yarn check:env

# Should output:
# ✓ Node.js: 20.11.0
# ✓ Yarn: 4.1.0
# ✓ Docker: 24.0.7 (optional)
# ✓ VS Code: 1.85.0
# ✓ Git: 2.43.0
```

### Level 2: Configuration Validation
```bash
# Validate configuration
yarn config:validate

# Test with missing required var
unset API_PORT
yarn config:validate  # Should fail with helpful error

# Test with invalid value
API_PORT=abc yarn config:validate  # Should fail with validation error
```

### Level 3: Integration Test
```typescript
// test/config.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { config, validateConfig } from '../src/config';

describe('Configuration', () => {
  beforeEach(() => {
    // Reset environment
    process.env = { ...process.env };
  });

  it('loads default values', () => {
    expect(config.api.port).toBe(51620);
    expect(config.docker.registry).toBe('ghcr.io');
  });

  it('validates required environment variables', () => {
    process.env.API_PORT = 'invalid';
    expect(() => validateConfig()).toThrow();
  });

  it('transforms boolean values correctly', () => {
    process.env.ENABLE_EXPERIMENTAL = 'true';
    const cfg = validateConfig();
    expect(cfg.features.experimental).toBe(true);
  });
});
```

## Final Validation Checklist
- [ ] .env.example contains all configuration options
- [ ] Each option is well documented with examples
- [ ] Type-safe configuration access throughout codebase
- [ ] Runtime validation catches all invalid configurations
- [ ] Clear error messages with fix suggestions
- [ ] Tool version checking works on all platforms
- [ ] Integration with setup process
- [ ] No secrets in .env.example

## Success Metrics
- Configuration errors: 100% have actionable fix instructions
- Tool mismatches: Detected before runtime errors occur
- Setup time: < 30 seconds to validate entire environment
- Developer confusion: Zero questions about configuration