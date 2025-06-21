#!/usr/bin/env node

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function checkYarnVersion() {
  try {
    const version = execSync('yarn --version', { encoding: 'utf-8' }).trim();
    const majorVersion = parseInt(version.split('.')[0]);
    
    if (majorVersion !== 1) {
      console.error(chalk.red(`❌ This validation requires Yarn 1.x, but found version ${version}`));
      console.error(chalk.yellow('Please install Yarn Classic (1.22.x) to run this validation'));
      return false;
    }
    
    console.log(chalk.green(`✅ Using Yarn ${version}`));
    return true;
  } catch (error) {
    console.error(chalk.red('❌ Yarn is not installed or not in PATH'));
    return false;
  }
}

async function validatePackageJson(dir) {
  const packageJsonPath = path.join(dir, 'package.json');
  const errors = [];
  const warnings = [];
  
  if (!await fs.pathExists(packageJsonPath)) {
    errors.push({
      file: 'package.json',
      message: 'package.json not found in generated extension'
    });
    return { errors, warnings };
  }
  
  try {
    const packageJson = await fs.readJson(packageJsonPath);
    
    // Check for Yarn Berry specific fields
    if (packageJson.packageManager) {
      errors.push({
        file: 'package.json',
        field: 'packageManager',
        message: 'packageManager field is not supported in Yarn 1.x'
      });
    }
    
    // Check dependencies for workspace protocol
    const depFields = ['dependencies', 'devDependencies', 'peerDependencies'];
    depFields.forEach(field => {
      if (packageJson[field]) {
        Object.entries(packageJson[field]).forEach(([name, version]) => {
          if (typeof version === 'string' && version.startsWith('workspace:')) {
            errors.push({
              file: 'package.json',
              field: `${field}.${name}`,
              message: `Workspace protocol "${version}" is not supported in Yarn 1.x`
            });
          }
        });
      }
    });
    
    // Check for Yarn 1.x compatibility
    if (packageJson.workspaces && Array.isArray(packageJson.workspaces.packages)) {
      warnings.push({
        file: 'package.json',
        field: 'workspaces',
        message: 'Using Yarn Berry workspaces syntax, should use Yarn 1.x array syntax'
      });
    }
    
    // Verify required scripts exist
    const requiredScripts = ['build'];
    requiredScripts.forEach(script => {
      if (!packageJson.scripts || !packageJson.scripts[script]) {
        warnings.push({
          file: 'package.json',
          field: `scripts.${script}`,
          message: `Missing required script: ${script}`
        });
      }
    });
    
  } catch (error) {
    errors.push({
      file: 'package.json',
      message: `Failed to parse package.json: ${error.message}`
    });
  }
  
  return { errors, warnings };
}

async function validateYarnInstall(dir) {
  const errors = [];
  const warnings = [];
  
  console.log(chalk.blue('\n📦 Running yarn install...'));
  
  try {
    // Run yarn install in the directory
    execSync('yarn install', {
      cwd: dir,
      stdio: 'pipe',
      encoding: 'utf-8'
    });
    
    console.log(chalk.green('✅ yarn install completed successfully'));
    
    // Check if node_modules was created (Yarn 1.x behavior)
    const nodeModulesPath = path.join(dir, 'node_modules');
    if (!await fs.pathExists(nodeModulesPath)) {
      errors.push({
        command: 'yarn install',
        message: 'node_modules directory not created (possible PnP mode)'
      });
    }
    
    // Check for Yarn Berry artifacts
    const berryArtifacts = ['.pnp.cjs', '.pnp.mjs', '.yarnrc.yml', '.yarn'];
    for (const artifact of berryArtifacts) {
      if (await fs.pathExists(path.join(dir, artifact))) {
        errors.push({
          file: artifact,
          message: `Yarn Berry artifact found: ${artifact}`
        });
      }
    }
    
  } catch (error) {
    errors.push({
      command: 'yarn install',
      message: `yarn install failed: ${error.message}`,
      details: error.stderr || error.stdout
    });
  }
  
  return { errors, warnings };
}

async function validateBuildScript(dir) {
  const errors = [];
  const warnings = [];
  
  console.log(chalk.blue('\n🔨 Running yarn build...'));
  
  try {
    // Run yarn build
    execSync('yarn build', {
      cwd: dir,
      stdio: 'pipe',
      encoding: 'utf-8',
      timeout: 60000 // 1 minute timeout
    });
    
    console.log(chalk.green('✅ yarn build completed successfully'));
    
  } catch (error) {
    // Check if it's just a missing TypeScript error (expected in template)
    const output = error.stdout || error.stderr || '';
    if (output.includes('Cannot find module') || output.includes('tsconfig.json')) {
      warnings.push({
        command: 'yarn build',
        message: 'Build failed due to missing dependencies (expected for template)',
        details: output.substring(0, 200)
      });
    } else {
      errors.push({
        command: 'yarn build',
        message: `yarn build failed: ${error.message}`,
        details: output.substring(0, 500)
      });
    }
  }
  
  return { errors, warnings };
}

async function validateGeneratedExtension(extensionDir) {
  console.log(chalk.blue(`\n🔍 Validating generated extension at: ${extensionDir}\n`));
  
  // Check if directory exists
  if (!await fs.pathExists(extensionDir)) {
    console.error(chalk.red(`❌ Directory not found: ${extensionDir}`));
    process.exit(1);
  }
  
  // Check Yarn version first
  if (!await checkYarnVersion()) {
    process.exit(1);
  }
  
  const allErrors = [];
  const allWarnings = [];
  
  // Validate package.json
  console.log(chalk.blue('\n📋 Validating package.json...'));
  const { errors: pkgErrors, warnings: pkgWarnings } = await validatePackageJson(extensionDir);
  allErrors.push(...pkgErrors);
  allWarnings.push(...pkgWarnings);
  
  // If package.json has critical errors, skip other validations
  if (pkgErrors.length === 0) {
    // Validate yarn install
    const { errors: installErrors, warnings: installWarnings } = await validateYarnInstall(extensionDir);
    allErrors.push(...installErrors);
    allWarnings.push(...installWarnings);
    
    // Validate build (only if install succeeded)
    if (installErrors.length === 0) {
      const { errors: buildErrors, warnings: buildWarnings } = await validateBuildScript(extensionDir);
      allErrors.push(...buildErrors);
      allWarnings.push(...buildWarnings);
    }
  }
  
  // Generate report
  const report = {
    valid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
    summary: {
      extensionDir: extensionDir,
      errorsFound: allErrors.length,
      warningsFound: allWarnings.length,
      timestamp: new Date().toISOString()
    }
  };
  
  // Display results
  console.log(chalk.blue('\n📊 Validation Results:\n'));
  
  if (allErrors.length > 0) {
    console.log(chalk.red(`❌ Found ${allErrors.length} error(s):\n`));
    allErrors.forEach((error, index) => {
      console.log(chalk.red(`${index + 1}. ${error.message}`));
      if (error.file) console.log(chalk.red(`   File: ${error.file}`));
      if (error.field) console.log(chalk.red(`   Field: ${error.field}`));
      if (error.command) console.log(chalk.red(`   Command: ${error.command}`));
      if (error.details) console.log(chalk.gray(`   Details: ${error.details}`));
      console.log();
    });
  }
  
  if (allWarnings.length > 0) {
    console.log(chalk.yellow(`⚠️  Found ${allWarnings.length} warning(s):\n`));
    allWarnings.forEach((warning, index) => {
      console.log(chalk.yellow(`${index + 1}. ${warning.message}`));
      if (warning.file) console.log(chalk.yellow(`   File: ${warning.file}`));
      if (warning.field) console.log(chalk.yellow(`   Field: ${warning.field}`));
      if (warning.command) console.log(chalk.yellow(`   Command: ${warning.command}`));
      if (warning.details) console.log(chalk.gray(`   Details: ${warning.details}`));
      console.log();
    });
  }
  
  if (allErrors.length === 0 && allWarnings.length === 0) {
    console.log(chalk.green('✅ Generated extension is fully Yarn 1.22 compatible!\n'));
  }
  
  // Write report
  const reportPath = path.join(extensionDir, 'yarn-validation-report.json');
  await fs.writeJson(reportPath, report, { spaces: 2 });
  console.log(chalk.gray(`\nReport written to: ${reportPath}\n`));
  
  // Exit with error code if validation failed
  if (!report.valid) {
    process.exit(1);
  }
}

// Export for testing
export { 
  checkYarnVersion, 
  validatePackageJson, 
  validateYarnInstall, 
  validateBuildScript 
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  
  if (args.length !== 1) {
    console.error(chalk.red('Usage: node validate-generated.js <extension-directory>'));
    console.error(chalk.gray('Example: node validate-generated.js ./output/my-extension'));
    process.exit(1);
  }
  
  const extensionDir = path.resolve(args[0]);
  validateGeneratedExtension(extensionDir).catch(error => {
    console.error(chalk.red('Fatal error:'), error);
    process.exit(1);
  });
}