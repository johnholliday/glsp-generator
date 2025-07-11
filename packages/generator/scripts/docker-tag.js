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

console.log(`📦 Tagging Docker images for version ${version}...`);

// Tag with specific version
execSync(`docker tag ${imageName}:latest ${imageName}:${version}`, { stdio: 'inherit' });
console.log(`✅ Tagged ${imageName}:${version}`);

// Tag with major.minor
execSync(`docker tag ${imageName}:latest ${imageName}:${major}.${minor}`, { stdio: 'inherit' });
console.log(`✅ Tagged ${imageName}:${major}.${minor}`);

// Tag with major
execSync(`docker tag ${imageName}:latest ${imageName}:${major}`, { stdio: 'inherit' });
console.log(`✅ Tagged ${imageName}:${major}`);

// Tag dev version
execSync(`docker tag ${imageName}:latest ${imageName}:dev`, { stdio: 'inherit' });
console.log(`✅ Tagged ${imageName}:dev`);

console.log('\n🏷️  All tags created successfully!');
console.log('\nNext step: Run "yarn docker:push" to publish to registry');