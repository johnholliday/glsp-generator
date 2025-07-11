# Prompt 017: Improved Developer Commands

## Goal
Create a comprehensive set of developer commands that streamline common workflows, provide better debugging capabilities, and make the development experience more efficient and enjoyable.

## Why
- Developers waste time on repetitive tasks
- No unified way to run all packages in watch mode
- Difficult to quickly test changes end-to-end
- No automated way to clean and reset the project
- Dependency updates are risky without proper testing
- Missing commands for common debugging scenarios

## What
A collection of well-designed developer commands that handle common tasks efficiently, provide clear feedback, and integrate seamlessly with the existing workflow.

### Success Criteria
- [ ] `yarn dev:all` runs all packages in watch mode concurrently
- [ ] `yarn demo` creates a sample grammar and generates output
- [ ] `yarn doctor` diagnoses and fixes common issues
- [ ] `yarn upgrade:safe` updates dependencies with testing
- [ ] `yarn reset` completely cleans and rebuilds project
- [ ] Commands provide clear, colorful output with progress
- [ ] All commands work cross-platform (Windows/Mac/Linux)
- [ ] Commands are discoverable and well-documented

## All Needed Context

### Documentation & References
```yaml
- file: /home/john/projects/utils/glsp-generator/package.json
  why: Current scripts to enhance and integrate with
  
- file: /home/john/projects/utils/glsp-generator/packages/generator/package.json
  why: Package-specific scripts to coordinate
  
- url: https://github.com/open-cli-tools/concurrently
  why: Run multiple commands concurrently with proper output
  
- url: https://github.com/sindresorhus/ora
  why: Elegant terminal spinners for long operations

- url: https://github.com/terkelg/prompts
  why: Interactive command line prompts

- file: /home/john/projects/utils/glsp-generator/CLAUDE.md
  why: Coding standards and conventions to follow
```

### Current Developer Pain Points
```yaml
WORKFLOW_ISSUES:
  - "How do I test my changes?": No quick end-to-end test command
  - "Watch mode is broken": Have to restart multiple terminals
  - "Dependencies outdated": Scared to update, might break
  - "Build is acting weird": No easy way to clean everything
  - "Is my setup correct?": No diagnostic command

DESIRED_WORKFLOWS:
  - Start development: Single command for all watch modes
  - Test changes: Generate sample project instantly
  - Fix issues: Automatic diagnosis and repair
  - Update safely: Test updates before committing
  - Clean slate: Reset everything to fresh state
```

## Implementation Blueprint

### Phase 1: Concurrent Development Mode

CREATE scripts/dev-all.js:
```javascript
#!/usr/bin/env node
import concurrently from 'concurrently';
import chalk from 'chalk';
import { existsSync } from 'fs';
import { join } from 'path';

const rootDir = process.cwd();

// Define all development tasks
const tasks = [
  {
    command: 'yarn workspace @glsp/generator dev',
    name: 'generator',
    prefixColor: 'blue'
  },
  {
    command: 'yarn workspace @glsp/vscode-extension watch',
    name: 'vscode-ext',
    prefixColor: 'magenta'
  }
];

// Add optional tasks
if (existsSync(join(rootDir, 'packages/docs'))) {
  tasks.push({
    command: 'yarn workspace @glsp/docs dev',
    name: 'docs',
    prefixColor: 'green'
  });
}

console.log(chalk.bold.cyan('\n🚀 Starting development mode for all packages...\n'));

// Run all tasks concurrently
const { result } = concurrently(
  tasks,
  {
    prefix: 'name',
    killOthers: ['failure', 'success'],
    restartTries: 3,
    restartDelay: 1000
  }
);

result.then(
  () => console.log(chalk.green('\n✅ All tasks completed successfully')),
  () => console.log(chalk.red('\n❌ One or more tasks failed'))
);

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log(chalk.yellow('\n\n👋 Shutting down development mode...'));
  process.exit();
});
```

### Phase 2: Demo Generator

CREATE scripts/demo.js:
```javascript
#!/usr/bin/env node
import { mkdtempSync, writeFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { execSync } from 'child_process';
import chalk from 'chalk';
import ora from 'ora';
import prompts from 'prompts';

class DemoGenerator {
  async run() {
    console.log(chalk.bold.cyan('\n🎭 GLSP Demo Generator\n'));

    // Select demo type
    const { demoType } = await prompts({
      type: 'select',
      name: 'demoType',
      message: 'Select demo type:',
      choices: [
        { title: 'Simple State Machine', value: 'state-machine' },
        { title: 'Class Diagram', value: 'class-diagram' },
        { title: 'Workflow Engine', value: 'workflow' },
        { title: 'Custom (provide grammar)', value: 'custom' }
      ]
    });

    // Generate demo
    const tempDir = mkdtempSync(join(tmpdir(), 'glsp-demo-'));
    const spinner = ora('Generating demo...').start();

    try {
      // Create grammar file
      const grammarPath = join(tempDir, 'demo.langium');
      const grammarContent = this.getGrammarContent(demoType);
      writeFileSync(grammarPath, grammarContent);

      spinner.text = 'Creating grammar file...';
      console.log(chalk.gray(`\n  Grammar: ${grammarPath}`));

      // Generate VSIX
      spinner.text = 'Generating VSIX package...';
      const outputDir = join(tempDir, 'output');
      execSync(`node ${join(process.cwd(), 'packages/generator/dist/cli.js')} generate ${grammarPath} -o ${outputDir}`, {
        stdio: 'pipe'
      });

      spinner.succeed('Demo generated successfully!');

      // Show results
      console.log(chalk.green('\n✅ Demo files created:'));
      console.log(chalk.gray(`  Grammar: ${grammarPath}`));
      console.log(chalk.gray(`  Output: ${outputDir}`));

      // Ask what to do next
      const { action } = await prompts({
        type: 'select',
        name: 'action',
        message: 'What would you like to do?',
        choices: [
          { title: 'Open in VS Code', value: 'vscode' },
          { title: 'Install VSIX', value: 'install' },
          { title: 'Copy to current directory', value: 'copy' },
          { title: 'Just show the path', value: 'path' }
        ]
      });

      await this.handleAction(action, tempDir, outputDir);

    } catch (error) {
      spinner.fail('Demo generation failed');
      console.error(chalk.red(error.message));
      rmSync(tempDir, { recursive: true, force: true });
      process.exit(1);
    }
  }

  getGrammarContent(type) {
    const grammars = {
      'state-machine': `grammar StateMachine

entry StateMachine:
    'statemachine' name=ID
    states+=State*
    transitions+=Transition*;

State:
    'state' name=ID
    ('entry' ':' entryAction=STRING)?
    ('exit' ':' exitAction=STRING)?;

Transition:
    'transition' name=ID
    'from' source=[State:ID]
    'to' target=[State:ID]
    ('on' event=STRING)?;

terminal ID: /[_a-zA-Z][\\w_]*/;
terminal STRING: /"[^"]*"|'[^']*'/;
hidden terminal WS: /\\s+/;`,

      'class-diagram': `grammar ClassDiagram

entry Model:
    elements+=Element*;

Element:
    Class | Interface | Association;

Class:
    'class' name=ID '{'
        properties+=Property*
        methods+=Method*
    '}';

Property:
    visibility=Visibility? name=ID ':' type=ID;

Method:
    visibility=Visibility? name=ID '(' ')' ':' returnType=ID;

Visibility:
    '+' | '-' | '#';

terminal ID: /[_a-zA-Z][\\w_]*/;
hidden terminal WS: /\\s+/;`
    };

    return grammars[type] || grammars['state-machine'];
  }

  async handleAction(action, tempDir, outputDir) {
    switch (action) {
      case 'vscode':
        execSync(`code ${tempDir}`);
        break;
      case 'install':
        const vsixPath = join(outputDir, 'demo-glsp-extension.vsix');
        execSync(`code --install-extension ${vsixPath}`);
        console.log(chalk.green('✅ Extension installed!'));
        break;
      case 'copy':
        const targetDir = join(process.cwd(), 'demo-output');
        execSync(`cp -r ${outputDir} ${targetDir}`);
        console.log(chalk.green(`✅ Copied to ${targetDir}`));
        break;
      case 'path':
        console.log(chalk.cyan(`\nDemo location: ${tempDir}`));
        break;
    }
  }
}

// Run demo generator
new DemoGenerator().run();
```

### Phase 3: Doctor Command

CREATE scripts/doctor.js:
```javascript
#!/usr/bin/env node
import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';
import ora from 'ora';
import semver from 'semver';

class Doctor {
  constructor() {
    this.issues = [];
    this.fixes = [];
  }

  async run() {
    console.log(chalk.bold.cyan('\n🩺 GLSP Generator Doctor\n'));
    console.log(chalk.gray('Diagnosing your development environment...\n'));

    const checks = [
      { name: 'Node.js version', fn: () => this.checkNode() },
      { name: 'Yarn version', fn: () => this.checkYarn() },
      { name: 'Dependencies', fn: () => this.checkDependencies() },
      { name: 'Build artifacts', fn: () => this.checkBuild() },
      { name: 'Git status', fn: () => this.checkGit() },
      { name: 'Environment config', fn: () => this.checkEnv() },
      { name: 'VS Code extension', fn: () => this.checkVSCode() }
    ];

    // Run all checks
    for (const check of checks) {
      const spinner = ora(check.name).start();
      try {
        const result = await check.fn();
        if (result.ok) {
          spinner.succeed(`${check.name} ${chalk.gray(result.message || '')}`);
        } else {
          spinner.warn(`${check.name} ${chalk.yellow(result.message)}`);
          this.issues.push(result);
        }
      } catch (error) {
        spinner.fail(`${check.name} ${chalk.red(error.message)}`);
        this.issues.push({ check: check.name, error: error.message });
      }
    }

    // Show results
    this.showResults();
  }

  checkNode() {
    const version = process.version;
    const required = '18.0.0';
    
    if (semver.lt(version, required)) {
      return {
        ok: false,
        message: `Found ${version}, need ${required}+`,
        fix: 'Update Node.js from https://nodejs.org'
      };
    }
    
    return { ok: true, message: version };
  }

  checkDependencies() {
    try {
      // Check if node_modules exists
      if (!existsSync('node_modules')) {
        return {
          ok: false,
          message: 'Dependencies not installed',
          fix: 'yarn install'
        };
      }

      // Verify integrity
      execSync('yarn install --immutable --immutable-cache --check-cache', { 
        stdio: 'ignore' 
      });
      
      return { ok: true, message: 'All dependencies installed' };
    } catch {
      return {
        ok: false,
        message: 'Dependencies out of sync',
        fix: 'yarn install'
      };
    }
  }

  checkBuild() {
    const distDirs = [
      'packages/generator/dist',
      'packages/vscode-extension/out'
    ];

    const missing = distDirs.filter(dir => !existsSync(dir));
    
    if (missing.length > 0) {
      return {
        ok: false,
        message: 'Build artifacts missing',
        fix: 'yarn build'
      };
    }

    return { ok: true, message: 'All packages built' };
  }

  async showResults() {
    console.log('');
    
    if (this.issues.length === 0) {
      console.log(chalk.green('✅ Everything looks good!\n'));
      return;
    }

    console.log(chalk.yellow(`\n⚠️  Found ${this.issues.length} issue(s):\n`));
    
    this.issues.forEach((issue, i) => {
      console.log(chalk.yellow(`${i + 1}. ${issue.check || 'Issue'}: ${issue.message}`));
      if (issue.fix) {
        console.log(chalk.gray(`   Fix: ${issue.fix}`));
      }
    });

    // Offer automatic fixes
    console.log('');
    const fixable = this.issues.filter(i => i.fix);
    
    if (fixable.length > 0) {
      const { autofix } = await prompts({
        type: 'confirm',
        name: 'autofix',
        message: 'Attempt automatic fixes?',
        initial: true
      });

      if (autofix) {
        await this.runFixes();
      }
    }
  }

  async runFixes() {
    console.log(chalk.cyan('\n🔧 Running automatic fixes...\n'));
    
    for (const issue of this.issues.filter(i => i.fix)) {
      const spinner = ora(`Fixing: ${issue.fix}`).start();
      try {
        execSync(issue.fix, { stdio: 'ignore' });
        spinner.succeed();
      } catch (error) {
        spinner.fail(`Failed: ${error.message}`);
      }
    }
    
    console.log(chalk.green('\n✅ Fixes complete! Run doctor again to verify.\n'));
  }
}

// Run doctor
new Doctor().run();
```

### Phase 4: Safe Dependency Updater

CREATE scripts/upgrade-safe.js:
```javascript
#!/usr/bin/env node
import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import chalk from 'chalk';
import ora from 'ora';
import prompts from 'prompts';

class SafeUpgrader {
  async run() {
    console.log(chalk.bold.cyan('\n🔄 Safe Dependency Upgrade\n'));

    // Check for uncommitted changes
    try {
      execSync('git diff --quiet && git diff --cached --quiet');
    } catch {
      console.log(chalk.red('❌ Uncommitted changes detected!'));
      console.log(chalk.yellow('   Commit or stash changes before upgrading.'));
      process.exit(1);
    }

    // Check outdated packages
    const spinner = ora('Checking for updates...').start();
    let outdated;
    
    try {
      const output = execSync('yarn outdated --json', { encoding: 'utf8' });
      outdated = output
        .split('\n')
        .filter(line => line.trim())
        .map(line => JSON.parse(line))
        .filter(item => item.type === 'info');
      spinner.succeed(`Found ${outdated.length} packages to update`);
    } catch (error) {
      spinner.fail('Failed to check updates');
      process.exit(1);
    }

    if (outdated.length === 0) {
      console.log(chalk.green('✅ All dependencies are up to date!'));
      return;
    }

    // Show updates
    console.log('\nAvailable updates:');
    outdated.forEach(pkg => {
      console.log(`  ${pkg.name}: ${pkg.current} → ${pkg.latest}`);
    });

    // Select update strategy
    const { strategy } = await prompts({
      type: 'select',
      name: 'strategy',
      message: 'Update strategy:',
      choices: [
        { title: 'Patch only (safest)', value: 'patch' },
        { title: 'Minor updates', value: 'minor' },
        { title: 'Major updates (risky)', value: 'major' },
        { title: 'Interactive', value: 'interactive' }
      ]
    });

    // Create backup branch
    const backupBranch = `upgrade-backup-${Date.now()}`;
    execSync(`git checkout -b ${backupBranch}`);
    console.log(chalk.gray(`\nCreated backup branch: ${backupBranch}`));

    // Perform upgrade
    await this.performUpgrade(strategy);

    // Run tests
    console.log(chalk.cyan('\n🧪 Running tests...\n'));
    try {
      execSync('yarn test', { stdio: 'inherit' });
      console.log(chalk.green('\n✅ All tests passed!'));
    } catch {
      console.log(chalk.red('\n❌ Tests failed!'));
      const { rollback } = await prompts({
        type: 'confirm',
        name: 'rollback',
        message: 'Rollback changes?',
        initial: true
      });

      if (rollback) {
        execSync('git checkout -');
        execSync(`git branch -D ${backupBranch}`);
        console.log(chalk.yellow('↩️  Rolled back changes'));
        process.exit(1);
      }
    }

    console.log(chalk.green('\n✅ Upgrade complete!'));
  }

  async performUpgrade(strategy) {
    const spinner = ora('Upgrading dependencies...').start();
    
    try {
      switch (strategy) {
        case 'patch':
          execSync('yarn up "*@patch"');
          break;
        case 'minor':
          execSync('yarn up "*@minor"');
          break;
        case 'major':
          execSync('yarn up "*@latest"');
          break;
        case 'interactive':
          spinner.stop();
          execSync('yarn upgrade-interactive', { stdio: 'inherit' });
          break;
      }
      spinner.succeed('Dependencies upgraded');
    } catch (error) {
      spinner.fail('Upgrade failed');
      throw error;
    }
  }
}

// Run upgrader
new SafeUpgrader().run();
```

### Phase 5: Reset Command

CREATE scripts/reset.js:
```javascript
#!/usr/bin/env node
import { rmSync, existsSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';
import chalk from 'chalk';
import ora from 'ora';
import prompts from 'prompts';

class ProjectReset {
  async run() {
    console.log(chalk.bold.red('\n🔄 Project Reset\n'));
    console.log(chalk.yellow('This will remove all build artifacts and dependencies.\n'));

    const { confirm } = await prompts({
      type: 'confirm',
      name: 'confirm',
      message: 'Are you sure you want to reset the project?',
      initial: false
    });

    if (!confirm) {
      console.log(chalk.gray('\nReset cancelled.'));
      return;
    }

    const items = [
      { path: 'node_modules', desc: 'Root dependencies' },
      { path: 'packages/*/node_modules', desc: 'Package dependencies' },
      { path: 'packages/*/dist', desc: 'Build output' },
      { path: 'packages/vscode-extension/out', desc: 'VS Code extension' },
      { path: '.yarn/cache', desc: 'Yarn cache' },
      { path: '.yarn/install-state.gz', desc: 'Install state' },
      { path: 'coverage', desc: 'Coverage reports' },
      { path: '*.log', desc: 'Log files' }
    ];

    console.log(chalk.cyan('\nCleaning...\n'));

    for (const item of items) {
      const spinner = ora(item.desc).start();
      try {
        const paths = this.glob(item.path);
        paths.forEach(path => {
          if (existsSync(path)) {
            rmSync(path, { recursive: true, force: true });
          }
        });
        spinner.succeed();
      } catch (error) {
        spinner.fail(`Failed: ${error.message}`);
      }
    }

    const { rebuild } = await prompts({
      type: 'confirm',
      name: 'rebuild',
      message: 'Rebuild project?',
      initial: true
    });

    if (rebuild) {
      console.log(chalk.cyan('\n🔨 Rebuilding project...\n'));
      
      const buildSteps = [
        { cmd: 'yarn install', desc: 'Installing dependencies' },
        { cmd: 'yarn build', desc: 'Building packages' }
      ];

      for (const step of buildSteps) {
        const spinner = ora(step.desc).start();
        try {
          execSync(step.cmd, { stdio: 'ignore' });
          spinner.succeed();
        } catch (error) {
          spinner.fail(`Failed: ${error.message}`);
          process.exit(1);
        }
      }

      console.log(chalk.green('\n✅ Project reset and rebuilt successfully!\n'));
    } else {
      console.log(chalk.green('\n✅ Project reset complete!\n'));
      console.log(chalk.gray('Run "yarn install" when ready to rebuild.\n'));
    }
  }

  glob(pattern) {
    // Simple glob implementation for cross-platform
    if (pattern.includes('*')) {
      const parts = pattern.split('/');
      // Handle packages/*/dist pattern
      if (parts[0] === 'packages' && parts[1] === '*') {
        const packages = ['generator', 'vscode-extension'];
        return packages.map(pkg => join('packages', pkg, ...parts.slice(2)));
      }
    }
    return [pattern];
  }
}

// Run reset
new ProjectReset().run();
```

### Integration Points

UPDATE package.json:
```json
{
  "scripts": {
    "dev:all": "node scripts/dev-all.js",
    "demo": "node scripts/demo.js",
    "doctor": "node scripts/doctor.js",
    "upgrade:safe": "node scripts/upgrade-safe.js",
    "reset": "node scripts/reset.js",
    "reset:hard": "yarn reset && yarn setup"
  }
}
```

UPDATE README.md development section:
```markdown
### Developer Commands

```bash
# Run all packages in watch mode
yarn dev:all

# Create and test a demo grammar
yarn demo

# Diagnose and fix common issues
yarn doctor

# Safely upgrade dependencies with testing
yarn upgrade:safe

# Reset project to clean state
yarn reset
```
```

## Validation Loop

### Test Each Command
```bash
# Test concurrent dev mode
yarn dev:all
# Should start both generator and VS Code extension watch

# Test demo generator
yarn demo
# Should show interactive menu and generate demo

# Test doctor command
rm -rf node_modules
yarn doctor
# Should detect missing dependencies and offer to fix

# Test safe upgrade
yarn upgrade:safe
# Should check for updates and run tests

# Test reset
yarn reset
# Should clean everything and offer to rebuild
```

### Integration Test
```bash
# Full developer workflow
yarn reset          # Start clean
yarn setup          # Initial setup
yarn dev:all        # Start development
yarn demo           # Generate test case
yarn doctor         # Verify health
yarn upgrade:safe   # Update dependencies
```

## Final Validation Checklist
- [ ] All commands work on Windows, macOS, and Linux
- [ ] Commands provide clear, colorful output
- [ ] Progress indicators for long operations
- [ ] Error messages are helpful and actionable
- [ ] Interactive prompts guide users
- [ ] Commands integrate with existing workflow
- [ ] No duplicate functionality
- [ ] Commands are discoverable via yarn run

## Success Metrics
- Developer efficiency: 50% reduction in common task time
- Error recovery: 90% of issues fixed automatically
- Command adoption: Used by all team members
- Cross-platform: Zero platform-specific issues