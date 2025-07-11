import path from 'path';
import fs from 'fs-extra';
import { fileURLToPath } from 'url';

/**
 * Get the CLI's installation root directory by looking for package.json
 * starting from the CLI's location, not the current working directory
 */
export function getProjectRoot(): string {
    // Get the directory of this module file
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    // Start searching from the CLI's installation directory
    let currentDir = __dirname;

    // Search up the directory tree for package.json
    while (currentDir !== path.dirname(currentDir)) {
        if (fs.existsSync(path.join(currentDir, 'package.json'))) {
            return currentDir;
        }
        currentDir = path.dirname(currentDir);
    }

    // Fallback to the CLI's directory if no package.json found
    return __dirname;
}

/**
 * Get the user's current working directory (for user project operations)
 */
export function getUserProjectRoot(): string {
    let currentDir = process.cwd();

    // Search up the directory tree for package.json
    while (currentDir !== path.dirname(currentDir)) {
        if (fs.existsSync(path.join(currentDir, 'package.json'))) {
            return currentDir;
        }
        currentDir = path.dirname(currentDir);
    }

    // Fallback to process.cwd() if no package.json found
    return process.cwd();
}

/**
 * Get the source directory path
 */
export function getSourceDir(): string {
    const projectRoot = getProjectRoot();
    // Check if we're running from compiled dist or source
    if (fs.existsSync(path.join(projectRoot, 'dist', 'generator.js'))) {
        return path.join(projectRoot, 'dist');
    }
    return path.join(projectRoot, 'src');
}

/**
 * Get the templates directory path
 */
export function getTemplatesDir(): string {
    const sourceDir = getSourceDir();
    return path.join(sourceDir, 'templates');
}

/**
 * Get the config schema path
 */
export function getConfigSchemaPath(): string {
    const sourceDir = getSourceDir();
    return path.join(sourceDir, 'config', 'glsprc.schema.json');
}