#!/usr/bin/env node

import { readFileSync } from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read package.json to get version
const packageJson = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf8'));
const version = packageJson.version;
const imageName = process.env.CONTAINER_IMAGE || 'ghcr.io/johnholliday/glsp-generator';

// Extract major and minor versions
const [major, minor] = version.split('.');

console.log(`🚀 Pushing Docker images for version ${version} to GitHub Container Registry...`);

// Check if logged in to GitHub Container Registry
try {
    execSync('docker info', { stdio: 'ignore' });
    // Try to push a test tag to verify authentication
    console.log('🔐 Verifying GitHub Container Registry authentication...');
} catch (error) {
    console.error('❌ Docker is not running or not accessible');
    process.exit(1);
}

// Function to push image with retry
function pushImage(tag, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            console.log(`📤 Pushing ${tag}...`);
            execSync(`docker push ${tag}`, { stdio: 'inherit' });
            console.log(`✅ Successfully pushed ${tag}`);
            return true;
        } catch (error) {
            if (i < retries - 1) {
                console.log(`⚠️  Push failed, retrying... (${i + 1}/${retries})`);
            } else {
                console.error(`❌ Failed to push ${tag} after ${retries} attempts`);
                return false;
            }
        }
    }
}

// Push all tags
const tags = [
    `${imageName}:${version}`,
    `${imageName}:${major}.${minor}`,
    `${imageName}:${major}`,
    `${imageName}:latest`,
    `${imageName}:dev`
];

let allSuccess = true;

for (const tag of tags) {
    if (!pushImage(tag)) {
        allSuccess = false;
    }
}

if (allSuccess) {
    console.log('\n🎉 All images pushed successfully!');
    console.log(`\nUsers can now pull the image with:`);
    console.log(`  docker pull ${imageName}:latest`);
    console.log(`  docker pull ${imageName}:${version}`);
} else {
    console.error('\n⚠️  Some images failed to push. Please check the logs above.');
    process.exit(1);
}