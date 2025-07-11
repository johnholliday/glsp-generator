#!/usr/bin/env node
/**
 * Cross-platform script to refresh Docker container, handling conflicts automatically
 */

import { execSync } from 'child_process';
import { setTimeout } from 'timers/promises';

const execCommand = (command, silent = false) => {
    try {
        const output = execSync(command, { 
            encoding: 'utf8',
            stdio: silent ? 'pipe' : 'inherit'
        });
        return { success: true, output };
    } catch (error) {
        return { success: false, error };
    }
};

const checkContainerExists = (name) => {
    const result = execCommand(`docker ps -a --format "{{.Names}}" | grep "^${name}$"`, true);
    return result.success && result.output.trim() === name;
};

const checkContainerRunning = (name) => {
    const result = execCommand(`docker ps --format "{{.Names}}" | grep "^${name}$"`, true);
    return result.success && result.output.trim() === name;
};

const main = async () => {
    console.log('🔄 Refreshing Docker container...');

    // Stop and remove any existing container with the same name
    if (checkContainerExists('glspgen')) {
        console.log('📦 Found existing glspgen container, removing it...');
        execCommand('docker stop glspgen', true);
        execCommand('docker rm glspgen', true);
    }

    // Remove any orphaned containers
    console.log('🧹 Cleaning up orphaned containers...');
    execCommand('docker-compose down --remove-orphans');

    // Build the new image
    console.log('🔨 Building Docker image...');
    const buildResult = execCommand('yarn workspace @glsp/generator docker:build:local');
    if (!buildResult.success) {
        console.error('❌ Failed to build Docker image');
        process.exit(1);
    }

    // Start the container
    console.log('🚀 Starting container...');
    const startResult = execCommand('docker-compose up -d');
    if (!startResult.success) {
        console.error('❌ Failed to start container');
        process.exit(1);
    }

    // Wait a moment for the container to start
    await setTimeout(2000);

    // Check if container is running
    if (checkContainerRunning('glspgen')) {
        console.log('✅ Container \'glspgen\' is running successfully!');
        
        // Test the health endpoint
        console.log('🏥 Testing health endpoint...');
        try {
            const response = await fetch('http://localhost:51620/health');
            if (response.ok) {
                console.log('✅ Health check passed!');
            } else {
                console.log('⚠️  Health check returned non-OK status');
            }
        } catch (error) {
            console.log('⚠️  Health check failed (service may still be starting)');
        }
    } else {
        console.error('❌ Failed to start container');
        process.exit(1);
    }
};

main().catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
});