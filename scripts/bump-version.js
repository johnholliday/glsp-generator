#!/usr/bin/env node

import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";
import chalk from "chalk";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, "..");

async function bumpVersion() {
  try {
    const packageJsonPath = path.join(rootDir, "package.json");
    const packageJson = await fs.readJson(packageJsonPath);

    // Parse current version
    const currentVersion = packageJson.version;
    const [major, minor, patch] = currentVersion.split(".").map(Number);

    // Bump patch version
    const newVersion = `${major}.${minor}.${patch + 1}`;

    // Update package.json
    packageJson.version = newVersion;
    await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });

    console.log(
      chalk.green(`✅ Version bumped from ${currentVersion} to ${newVersion}`)
    );

    // Also update the version in src/cli.ts if it's hardcoded there
    const cliPath = path.join(rootDir, "src", "cli.ts");
    if (await fs.pathExists(cliPath)) {
      let cliContent = await fs.readFile(cliPath, "utf-8");

      // Look for version string patterns and update them
      const versionPatterns = [
        // Pattern: v2.0.0 or version 2.0.0
        /v\d+\.\d+\.\d+/g,
        /version\s+\d+\.\d+\.\d+/g,
        // Pattern: GLSP Generator v2.0.0
        /GLSP\s+Generator\s+v\d+\.\d+\.\d+/g,
        // Pattern: const VERSION = '2.0.0'
        /const\s+VERSION\s*=\s*['"`]\d+\.\d+\.\d+['"`]/g,
      ];

      let updated = false;
      for (const pattern of versionPatterns) {
        const matches = cliContent.match(pattern);
        if (matches) {
          matches.forEach((match) => {
            const updatedMatch = match.replace(/\d+\.\d+\.\d+/, newVersion);
            cliContent = cliContent.replace(match, updatedMatch);
            updated = true;
          });
        }
      }

      if (updated) {
        await fs.writeFile(cliPath, cliContent, "utf-8");
        console.log(chalk.blue(`📝 Updated version references in CLI`));
      }
    }

    // Update version in any other relevant files
    const filesToUpdate = ["README.md", "docs/README.md", "CHANGELOG.md"];

    for (const file of filesToUpdate) {
      const filePath = path.join(rootDir, file);
      if (await fs.pathExists(filePath)) {
        let content = await fs.readFile(filePath, "utf-8");

        // Only update obvious version references, not all occurrences
        const versionLinePattern = /^.*version.*\d+\.\d+\.\d+.*$/gim;
        const matches = content.match(versionLinePattern);

        if (matches) {
          matches.forEach((match) => {
            if (match.includes(currentVersion)) {
              const updatedLine = match.replace(currentVersion, newVersion);
              content = content.replace(match, updatedLine);
            }
          });

          await fs.writeFile(filePath, content, "utf-8");
          console.log(chalk.gray(`  Updated ${file}`));
        }
      }
    }

    return newVersion;
  } catch (error) {
    console.error(chalk.red("❌ Failed to bump version:"), error.message);
    console.error(chalk.red("Full error:"), error);
    console.error(chalk.red("Stack trace:"), error.stack);
    process.exit(1);
  }
}

// Run if called directly
const isMainModule =
  import.meta.url === `file://${process.argv[1]}` ||
  import.meta.url.endsWith(process.argv[1]) ||
  process.argv[1].endsWith("bump-version.js") ||
  process.argv[1].includes("bump-version.js");

if (isMainModule) {
  console.log(chalk.blue("📋 bump-version.js called directly"));
  bumpVersion();
} else {
  console.log(chalk.gray("📋 bump-version.js loaded as module"));
}

export { bumpVersion };
