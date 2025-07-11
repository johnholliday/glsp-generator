#!/usr/bin/env node
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, copyFileSync, mkdirSync, readdirSync } from 'fs';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Build VSIX package
console.log('Building VSIX package...');
try {
  execSync('npm run package', { stdio: 'inherit' });
  console.log("✓ VSIX package built successfully");
} catch (error) {
  console.error("✗ Failed to build VSIX package:", error.message);
  process.exit(1);
}
  

// Find the generated VSIX file using cross-platform approach
console.log("Looking for VSIX files...");
let vsixFiles;
try {
  const files = readdirSync(__dirname);
  vsixFiles = files.filter((file) => file.endsWith(".vsix"));
  console.log(`Found ${ vsixFiles.length } VSIX file(s): `, vsixFiles);
} catch (error) {
  console.error("✗ Failed to read directory:", error.message);
  process.exit(1);
}

if (vsixFiles.length === 0) {
  console.error("✗ No VSIX file found in current directory!");
  console.log("Current directory contents:", readdirSync(__dirname));
  process.exit(1);
}

const vsixFile = vsixFiles[0];
console.log(`✓ Using VSIX file: ${ vsixFile }`);

// Deploy to Theia applications
const rootPath = join(__dirname, "..", "..");
const destinations = [
  join(rootPath, "apps", "browser-app", "plugins"),
  join(rootPath, "apps", "electron-app", "plugins"),
];

console.log(`Deploying to ${ destinations.length } destination(s)...`);

let deploymentCount = 0;
destinations.forEach((dest, index) => {
  try {
    console.log(`[${ index + 1 }/${destinations.length}]Processing: ${ dest } `);

    if (!existsSync(dest)) {
      console.log(`  Creating directory: ${ dest } `);
      mkdirSync(dest, { recursive: true });
    }

    const targetPath = join(dest, vsixFile);
    console.log(`  Copying ${ vsixFile } to: ${ targetPath } `);
    copyFileSync(vsixFile, targetPath);

    if (existsSync(targetPath)) {
      console.log(`  ✓ Successfully deployed to: ${ targetPath } `);
      deploymentCount++;
    } else {
      console.error(`  ✗ Failed to verify deployment to: ${ targetPath } `);
    }
  } catch (error) {
    console.error(`  ✗ Failed to deploy to ${ dest }: `, error.message);
  }
});

if (deploymentCount === destinations.length) {
  console.log(
    `✓ Deployment complete! Successfully deployed to ${ deploymentCount }/${destinations.length} destinations.`
  );
  } else {
  console.error(
    `✗ Partial deployment failure: ${deploymentCount}/${destinations.length} destinations succeeded.`
  );
  process.exit(1);
} 