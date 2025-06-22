import path from 'path';
import fs from 'fs-extra';

/**
 * Get the project root directory by looking for package.json
 */
export function getProjectRoot(): string {
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