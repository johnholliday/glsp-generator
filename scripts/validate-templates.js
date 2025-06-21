#!/usr/bin/env node

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Prohibited patterns that indicate Yarn Berry usage
const prohibitedPatterns = [
  {
    pattern: /workspace:\*/g,
    message: 'Workspace protocol is not supported in Yarn 1.22',
    severity: 'error'
  },
  {
    pattern: /\.yarnrc\.yml/g,
    message: 'Berry config file (.yarnrc.yml) reference found',
    severity: 'error'
  },
  {
    pattern: /yarn dlx/g,
    message: 'Berry-specific command "yarn dlx" found (use npx instead)',
    severity: 'error'
  },
  {
    pattern: /pnpMode/g,
    message: 'PnP configuration found',
    severity: 'error'
  },
  {
    pattern: /pnpIgnorePattern/g,
    message: 'PnP specific pattern found',
    severity: 'error'
  },
  {
    pattern: /packageManager:/g,
    message: 'Corepack field "packageManager" found',
    severity: 'error'
  },
  {
    pattern: /nodeLinker:/g,
    message: 'Yarn Berry nodeLinker configuration found',
    severity: 'error'
  },
  {
    pattern: /enableGlobalCache:/g,
    message: 'Yarn Berry cache configuration found',
    severity: 'error'
  },
  {
    pattern: /nmMode:/g,
    message: 'Yarn Berry nmMode configuration found',
    severity: 'error'
  },
  {
    pattern: /\.pnp\.cjs/g,
    message: 'PnP loader reference found',
    severity: 'error'
  },
  {
    pattern: /\.pnp\.mjs/g,
    message: 'PnP ESM loader reference found',
    severity: 'error'
  },
  {
    pattern: /yarn workspaces/g,
    message: 'Yarn workspaces command found (verify compatibility)',
    severity: 'warning'
  }
];

// Additional checks for package.json templates
const packageJsonChecks = [
  {
    check: (content) => content.includes('"workspaces"'),
    message: 'Workspaces field found - ensure it uses Yarn 1.x syntax',
    severity: 'warning'
  },
  {
    check: (content) => content.includes('"resolutions"'),
    message: 'Resolutions field found - verify Yarn 1.x compatibility',
    severity: 'warning'
  }
];

async function scanFile(filePath) {
  const errors = [];
  const warnings = [];
  
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.split('\n');
    
    // Check each prohibited pattern
    prohibitedPatterns.forEach(({ pattern, message, severity }) => {
      lines.forEach((line, index) => {
        const matches = line.match(pattern);
        if (matches) {
          const issue = {
            file: path.relative(path.dirname(__dirname), filePath),
            line: index + 1,
            pattern: pattern.source,
            message,
            context: line.trim()
          };
          
          if (severity === 'error') {
            errors.push(issue);
          } else {
            warnings.push(issue);
          }
        }
      });
    });
    
    // Additional checks for package.json templates
    if (filePath.endsWith('package-json.hbs') || filePath.endsWith('package.json.hbs')) {
      packageJsonChecks.forEach(({ check, message, severity }) => {
        if (check(content)) {
          const issue = {
            file: path.relative(path.dirname(__dirname), filePath),
            line: 0,
            pattern: 'custom check',
            message
          };
          
          if (severity === 'error') {
            errors.push(issue);
          } else {
            warnings.push(issue);
          }
        }
      });
    }
    
  } catch (error) {
    console.error(chalk.red(`Error reading file ${filePath}:`), error.message);
  }
  
  return { errors, warnings };
}

async function findTemplateFiles(dir) {
  const files = [];
  
  async function walk(currentDir) {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      
      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (entry.name.endsWith('.hbs')) {
        files.push(fullPath);
      }
    }
  }
  
  await walk(dir);
  return files;
}

async function validateTemplates() {
  console.log(chalk.blue('🔍 Validating templates for Yarn 1.22 compatibility...\n'));
  
  const templatesDir = path.join(__dirname, '..', 'src', 'templates');
  
  if (!await fs.pathExists(templatesDir)) {
    console.error(chalk.red(`Templates directory not found: ${templatesDir}`));
    process.exit(1);
  }
  
  const templateFiles = await findTemplateFiles(templatesDir);
  console.log(chalk.gray(`Found ${templateFiles.length} template files\n`));
  
  const allErrors = [];
  const allWarnings = [];
  
  for (const file of templateFiles) {
    const { errors, warnings } = await scanFile(file);
    allErrors.push(...errors);
    allWarnings.push(...warnings);
  }
  
  // Generate report
  const report = {
    valid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
    summary: {
      filesScanned: templateFiles.length,
      errorsFound: allErrors.length,
      warningsFound: allWarnings.length
    }
  };
  
  // Display results
  if (allErrors.length > 0) {
    console.log(chalk.red(`\n❌ Found ${allErrors.length} error(s):\n`));
    allErrors.forEach((error, index) => {
      console.log(chalk.red(`${index + 1}. ${error.file}:${error.line}`));
      console.log(chalk.red(`   Pattern: ${error.pattern}`));
      console.log(chalk.red(`   Message: ${error.message}`));
      console.log(chalk.gray(`   Context: ${error.context}`));
      console.log();
    });
  }
  
  if (allWarnings.length > 0) {
    console.log(chalk.yellow(`\n⚠️  Found ${allWarnings.length} warning(s):\n`));
    allWarnings.forEach((warning, index) => {
      console.log(chalk.yellow(`${index + 1}. ${warning.file}:${warning.line}`));
      console.log(chalk.yellow(`   Message: ${warning.message}`));
      if (warning.context) {
        console.log(chalk.gray(`   Context: ${warning.context}`));
      }
      console.log();
    });
  }
  
  if (allErrors.length === 0 && allWarnings.length === 0) {
    console.log(chalk.green('✅ All templates are Yarn 1.22 compatible!\n'));
  }
  
  // Write report to file for CI/CD
  const reportPath = path.join(__dirname, '..', 'validation-report.json');
  await fs.writeJson(reportPath, report, { spaces: 2 });
  console.log(chalk.gray(`Report written to: ${reportPath}\n`));
  
  // Exit with error code if validation failed
  if (!report.valid) {
    process.exit(1);
  }
}

// Export for testing
export { scanFile, findTemplateFiles, prohibitedPatterns, packageJsonChecks };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  validateTemplates().catch(error => {
    console.error(chalk.red('Fatal error:'), error);
    process.exit(1);
  });
}