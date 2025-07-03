import fs from 'fs-extra';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface PackageInfo {
    name: string;
    version: string;
    description?: string;
    author?: string;
    homepage?: string;
    repository?: string;
    installed: boolean;
    installedVersion?: string;
    location?: string;
}

export interface InstallOptions {
    global?: boolean;
    version?: string;
    dev?: boolean;
}

export class TemplatePackageManager {
    private packagesDir: string; // eslint-disable-line @typescript-eslint/no-unused-vars

    constructor() {
        // Store packages in user's home directory or project-specific location
        this.packagesDir = path.join(process.cwd(), 'node_modules');
    }

    /**
     * Install a template package from npm
     */
    async installPackage(packageName: string, options: InstallOptions = {}): Promise<void> {
        try {
            const installCmd = this.buildInstallCommand(packageName, options);
            console.log(`Installing template package: ${packageName}`);

            const { stdout: _stdout, stderr } = await execAsync(installCmd);

            if (stderr && !stderr.includes('npm WARN')) {
                console.warn('Installation warnings:', stderr);
            }

            console.log(`✅ Successfully installed ${packageName}`);

            // Verify installation
            const isInstalled = await this.isPackageInstalled(packageName);
            if (!isInstalled) {
                throw new Error(`Package installation verification failed for ${packageName}`);
            }

        } catch (error) {
            throw new Error(`Failed to install template package '${packageName}': ${error}`);
        }
    }

    /**
     * Uninstall a template package
     */
    async uninstallPackage(packageName: string): Promise<void> {
        try {
            console.log(`Uninstalling template package: ${packageName}`);

            await execAsync(`npm uninstall ${packageName}`);

            console.log(`✅ Successfully uninstalled ${packageName}`);

        } catch (error) {
            throw new Error(`Failed to uninstall template package '${packageName}': ${error}`);
        }
    }

    /**
     * List installed template packages
     */
    async listInstalledPackages(): Promise<PackageInfo[]> {
        const packages: PackageInfo[] = [];

        try {
            // Get list of installed packages
            const { stdout } = await execAsync('npm list --depth=0 --json');
            const npmList = JSON.parse(stdout);

            if (npmList.dependencies) {
                for (const [name, _info] of Object.entries(npmList.dependencies)) {
                    if (await this.isTemplatePackage(name)) {
                        const packageInfo = await this.getPackageInfo(name);
                        if (packageInfo) {
                            packages.push(packageInfo);
                        }
                    }
                }
            }

        } catch (error) {
            console.warn('Failed to list installed packages:', error);
        }

        return packages;
    }

    /**
     * Search for template packages in npm registry
     */
    async searchPackages(query: string): Promise<PackageInfo[]> {
        try {
            // Search npm registry for packages with glsp-template keywords
            const searchCmd = `npm search ${query} --json`;
            const { stdout } = await execAsync(searchCmd);

            const searchResults = JSON.parse(stdout);
            const packages: PackageInfo[] = [];

            for (const result of searchResults) {
                // Filter for template packages
                if (this.looksLikeTemplatePackage(result)) {
                    packages.push({
                        name: result.name,
                        version: result.version,
                        description: result.description,
                        author: result.author?.name || result.author,
                        homepage: result.links?.homepage,
                        repository: result.links?.repository,
                        installed: await this.isPackageInstalled(result.name)
                    });
                }
            }

            return packages;

        } catch (error) {
            console.warn('Failed to search packages:', error);
            return [];
        }
    }

    /**
     * Get detailed information about a package
     */
    async getPackageInfo(packageName: string): Promise<PackageInfo | null> {
        try {
            const isInstalled = await this.isPackageInstalled(packageName);
            let packageInfo: any = {};

            if (isInstalled) {
                // Get local package info
                const packagePath = require.resolve(`${packageName}/package.json`);
                packageInfo = await fs.readJSON(packagePath);
            } else {
                // Get remote package info
                const { stdout } = await execAsync(`npm view ${packageName} --json`);
                packageInfo = JSON.parse(stdout);
            }

            return {
                name: packageInfo.name,
                version: packageInfo.version,
                description: packageInfo.description,
                author: packageInfo.author?.name || packageInfo.author,
                homepage: packageInfo.homepage || packageInfo.repository?.url,
                repository: packageInfo.repository?.url,
                installed: isInstalled,
                installedVersion: isInstalled ? packageInfo.version : undefined,
                location: isInstalled ? path.dirname(require.resolve(`${packageName}/package.json`)) : undefined
            };

        } catch (error) {
            console.warn(`Failed to get package info for ${packageName}:`, error);
            return null;
        }
    }

    /**
     * Check if a package is installed
     */
    async isPackageInstalled(packageName: string): Promise<boolean> {
        try {
            require.resolve(`${packageName}/package.json`);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Check if a package is a template package
     */
    private async isTemplatePackage(packageName: string): Promise<boolean> {
        try {
            const packagePath = require.resolve(`${packageName}/package.json`);
            const packageJson = await fs.readJSON(packagePath);

            // Check for template-related keywords or config
            return !!(
                packageJson.glspTemplates ||
                packageJson.keywords?.includes('glsp-template') ||
                packageJson.keywords?.includes('glsp-generator') ||
                packageName.includes('glsp-template') ||
                packageName.includes('glsp-generator')
            );
        } catch {
            return false;
        }
    }

    /**
     * Check if search result looks like a template package
     */
    private looksLikeTemplatePackage(result: any): boolean {
        const name = result.name || '';
        const keywords = result.keywords || [];
        const description = result.description || '';

        return !!(
            keywords.includes('glsp-template') ||
            keywords.includes('glsp-generator') ||
            name.includes('glsp-template') ||
            name.includes('glsp-generator') ||
            description.toLowerCase().includes('glsp template')
        );
    }

    /**
     * Build npm install command with options
     */
    private buildInstallCommand(packageName: string, options: InstallOptions): string {
        let cmd = 'npm install';

        if (options.global) {
            cmd += ' -g';
        }

        if (options.dev) {
            cmd += ' --save-dev';
        }

        if (options.version) {
            packageName += `@${options.version}`;
        }

        cmd += ` ${packageName}`;

        return cmd;
    }

    /**
     * Validate template package structure
     */
    async validatePackage(packageName: string): Promise<{ valid: boolean; errors: string[] }> {
        const errors: string[] = [];

        try {
            if (!await this.isPackageInstalled(packageName)) {
                errors.push(`Package ${packageName} is not installed`);
                return { valid: false, errors };
            }

            const packagePath = path.dirname(require.resolve(`${packageName}/package.json`));

            // Check for required files
            const requiredFiles = ['package.json'];
            for (const file of requiredFiles) {
                if (!await fs.pathExists(path.join(packagePath, file))) {
                    errors.push(`Missing required file: ${file}`);
                }
            }

            // Check for template directories
            const templatesDir = path.join(packagePath, 'templates');
            if (!await fs.pathExists(templatesDir)) {
                errors.push('Missing templates directory');
            }

            // Check package.json for template metadata
            const packageJson = await fs.readJSON(path.join(packagePath, 'package.json'));
            if (!packageJson.glspTemplates && !this.looksLikeTemplatePackage(packageJson)) {
                errors.push('Package does not appear to be a GLSP template package');
            }

        } catch (error) {
            errors.push(`Validation error: ${error}`);
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Update a package to the latest version
     */
    async updatePackage(packageName: string): Promise<void> {
        try {
            console.log(`Updating template package: ${packageName}`);

            await execAsync(`npm update ${packageName}`);

            console.log(`✅ Successfully updated ${packageName}`);

        } catch (error) {
            throw new Error(`Failed to update template package '${packageName}': ${error}`);
        }
    }

    /**
     * Get package dependencies
     */
    async getPackageDependencies(packageName: string): Promise<string[]> {
        try {
            const packagePath = require.resolve(`${packageName}/package.json`);
            const packageJson = await fs.readJSON(packagePath);

            const dependencies = Object.keys(packageJson.dependencies || {});
            const peerDependencies = Object.keys(packageJson.peerDependencies || {});

            return [...dependencies, ...peerDependencies];

        } catch (error) {
            console.warn(`Failed to get dependencies for ${packageName}:`, error);
            return [];
        }
    }
}