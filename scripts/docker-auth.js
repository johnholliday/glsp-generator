#!/usr/bin/env node

/**
 * Docker authentication helper for GitHub Container Registry
 * Usage: node scripts/docker-auth.js
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Check for .env file
const envPath = join(rootDir, '.env');
let githubToken = process.env.GITHUB_TOKEN || process.env.CR_PAT;
let githubUsername = process.env.GITHUB_USERNAME;

// Try to load from .env file
if (existsSync(envPath)) {
  try {
    const envContent = readFileSync(envPath, 'utf-8');
    const lines = envContent.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('GITHUB_TOKEN=')) {
        githubToken = githubToken || trimmed.substring(13);
      } else if (trimmed.startsWith('CR_PAT=')) {
        githubToken = githubToken || trimmed.substring(7);
      } else if (trimmed.startsWith('GITHUB_USERNAME=')) {
        githubUsername = githubUsername || trimmed.substring(16);
      }
    }
  } catch (error) {
    console.warn('Warning: Could not read .env file');
  }
}

// Interactive prompt for missing values
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (prompt) => new Promise((resolve) => {
  rl.question(prompt, resolve);
});

async function authenticate() {
  console.log('🔐 GitHub Container Registry Authentication\n');

  // Get username
  if (!githubUsername) {
    githubUsername = await question('GitHub username: ');
  } else {
    console.log(`Using GitHub username: ${githubUsername}`);
  }

  // Get token
  if (!githubToken) {
    console.log('\nTo create a token:');
    console.log('1. Go to https://github.com/settings/tokens/new');
    console.log('2. Select scopes: write:packages, read:packages');
    console.log('3. Generate and copy the token\n');
    
    githubToken = await question('GitHub Personal Access Token: ');
  } else {
    console.log('Using token from environment variable');
  }

  rl.close();

  // Attempt login
  try {
    console.log('\n🔄 Logging in to ghcr.io...');
    
    // Use echo to pipe the token to docker login
    const command = `echo "${githubToken}" | docker login ghcr.io -u ${githubUsername} --password-stdin`;
    
    execSync(command, { 
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true 
    });
    
    console.log('✅ Successfully authenticated with GitHub Container Registry!');
    console.log('\nYou can now push images:');
    console.log('  yarn docker:push');
    console.log('\nTo logout when done:');
    console.log('  docker logout ghcr.io');
    
  } catch (error) {
    console.error('❌ Authentication failed!');
    console.error('\nPossible issues:');
    console.error('- Invalid token or username');
    console.error('- Token missing required scopes (write:packages, read:packages)');
    console.error('- Docker daemon not running');
    
    if (error.message) {
      console.error('\nError details:', error.message);
    }
    
    process.exit(1);
  }
}

// Run authentication
authenticate().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});