import path from 'path';
import {
    IPackageManagerService,
    IFileSystemService,
    ILoggerService,
    ICacheService,
    IMetricsService,
    IEventService,
    ICommandExecutorService
} from '../config/di/interfaces.js';
import { injectable, inject, postConstruct, preDestroy } from 'inversify';
import { TYPES } from '../config/di/types.inversify.js';
import { LogMethod } from '../utils/decorators/log-method.js';

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

/**
 * Template package manager with comprehensive dependency injection support
 */
@injectable()
export class TemplatePackageManager implements IPackageManagerService {
    private packagesDir: string;
    private initialized = false;

    constructor(
        @inject(TYPES.IFileSystemService) private readonly fileSystem: IFileSystemService,
        @inject(TYPES.ILoggerService) private readonly logger: ILoggerService,
        @inject(TYPES.ICacheService) private readonly cache: ICacheService,
        @inject(TYPES.IMetricsService) private readonly metrics: IMetricsService,
        @inject(TYPES.IEventService) private readonly eventService: IEventService,
        @inject(TYPES.ICommandExecutorService) private readonly commandExecutor: ICommandExecutorService
    ) {
        this.logger.debug('TemplatePackageManager constructor called');
        // Store packages in user's home directory or project-specific location
        this.packagesDir = path.join(process.cwd(), 'node_modules');
    }

    @postConstruct()
    private _initialize(): void { // eslint-disable-line @typescript-eslint/no-unused-vars
        this.logger.info('Initializing TemplatePackageManager');

        try {
            this.setupEventListeners();
            this.initialized = true;

            this.logger.info('TemplatePackageManager initialized successfully', {
                packagesDir: this.packagesDir
            });

            this.eventService.emit('package-manager.initialized', { packagesDir: this.packagesDir });
        } catch (error) {
            this.logger.error('Failed to initialize TemplatePackageManager', error as Error);
            throw error;
        }
    }

    @preDestroy()
    private _cleanup(): void { // eslint-disable-line @typescript-eslint/no-unused-vars
        this.logger.info('Cleaning up TemplatePackageManager resources');
        this.initialized = false;
        this.eventService.emit('package-manager.disposed');
    }

    /**
     * Install a template package from npm
     */
    @LogMethod({ logArgs: true, logResult: false, logDuration: true })
    async installPackage(packageName: string, options: InstallOptions = {}): Promise<void> {
        this.ensureInitialized();

        const startTime = performance.now();
        this.metrics.incrementCounter('package-manager.install.attempts', { package: packageName });

        try {
            this.logger.info('Installing template package', { packageName, options });

            // Check if already installed and up to date
            const isInstalled = await this.isPackageInstalled(packageName);
            if (isInstalled && !options.version) {
                this.logger.info('Package already installed', { packageName });
                this.metrics.incrementCounter('package-manager.install.already_installed');
                return;
            }

            const installCmd = this.buildInstallCommand(packageName, options);
            this.logger.debug('Executing install command', { command: installCmd });

            const { stdout: _stdout, stderr } = await this.commandExecutor.execute(installCmd);

            if (stderr && !stderr.includes('npm WARN')) {
                this.logger.warn('Installation warnings', { packageName, warnings: stderr });
            }

            // Verify installation
            const isNowInstalled = await this.isPackageInstalled(packageName);
            if (!isNowInstalled) {
                throw new Error(`Package installation verification failed for ${packageName}`);
            }

            const duration = performance.now() - startTime;
            this.metrics.recordDuration('package-manager.install', duration);
            this.metrics.incrementCounter('package-manager.install.success', { package: packageName });

            this.logger.info('Successfully installed package', {
                packageName,
                duration: Math.round(duration)
            });

            this.eventService.emit('package-manager.package.installed', {
                packageName,
                options,
                duration
            });

            // Clear cache for package lists
            await this.cache.delete('installed-packages');
            await this.cache.delete(`package-info:${packageName}`);

        } catch (error) {
            const duration = performance.now() - startTime;
            this.metrics.recordDuration('package-manager.install.error', duration);
            this.metrics.incrementCounter('package-manager.install.errors', { package: packageName });

            this.logger.error('Failed to install template package', error as Error, { packageName });
            this.eventService.emit('package-manager.package.install-failed', { packageName, error });

            throw new Error(`Failed to install template package '${packageName}': ${error}`);
        }
    }

    /**
     * Uninstall a template package
     */
    @LogMethod({ logArgs: true, logResult: false, logDuration: true })
    async uninstallPackage(packageName: string): Promise<void> {
        this.ensureInitialized();

        const startTime = performance.now();
        this.metrics.incrementCounter('package-manager.uninstall.attempts', { package: packageName });

        try {
            this.logger.info('Uninstalling template package', { packageName });

            // Check if package is installed
            const isInstalled = await this.isPackageInstalled(packageName);
            if (!isInstalled) {
                this.logger.warn('Package not installed, skipping uninstall', { packageName });
                this.metrics.incrementCounter('package-manager.uninstall.not_installed');
                return;
            }

            await this.commandExecutor.execute(`npm uninstall ${packageName}`);

            const duration = performance.now() - startTime;
            this.metrics.recordDuration('package-manager.uninstall', duration);
            this.metrics.incrementCounter('package-manager.uninstall.success', { package: packageName });

            this.logger.info('Successfully uninstalled package', {
                packageName,
                duration: Math.round(duration)
            });

            this.eventService.emit('package-manager.package.uninstalled', {
                packageName,
                duration
            });

            // Clear cache
            await this.cache.delete('installed-packages');
            await this.cache.delete(`package-info:${packageName}`);

        } catch (error) {
            const duration = performance.now() - startTime;
            this.metrics.recordDuration('package-manager.uninstall.error', duration);
            this.metrics.incrementCounter('package-manager.uninstall.errors', { package: packageName });

            this.logger.error('Failed to uninstall template package', error as Error, { packageName });
            this.eventService.emit('package-manager.package.uninstall-failed', { packageName, error });

            throw new Error(`Failed to uninstall template package '${packageName}': ${error}`);
        }
    }

    /**
     * List installed template packages
     */
    @LogMethod({ logArgs: false, logResult: false, logDuration: true })
    async listInstalledPackages(): Promise<PackageInfo[]> {
        this.ensureInitialized();

        const startTime = performance.now();
        this.metrics.incrementCounter('package-manager.list.attempts');

        try {
            // Check cache first
            const cached = await this.cache.get<PackageInfo[]>('installed-packages');
            if (cached) {
                this.logger.debug('Returning cached installed packages list');
                this.metrics.incrementCounter('package-manager.list.cache_hits');
                return cached;
            }

            this.logger.debug('Listing installed template packages');
            const packages: PackageInfo[] = [];

            try {
                // Get list of installed packages
                const { stdout } = await this.commandExecutor.execute('npm list --depth=0 --json');
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
                this.logger.warn('Failed to list installed packages', { error });
            }

            // Cache the result
            await this.cache.set('installed-packages', packages, 300000); // 5 minutes TTL

            const duration = performance.now() - startTime;
            this.metrics.recordDuration('package-manager.list', duration);
            this.metrics.incrementCounter('package-manager.list.success');

            this.logger.debug('Listed installed packages successfully', {
                packageCount: packages.length,
                duration: Math.round(duration)
            });

            return packages;

        } catch (error) {
            const duration = performance.now() - startTime;
            this.metrics.recordDuration('package-manager.list.error', duration);
            this.metrics.incrementCounter('package-manager.list.errors');

            this.logger.error('Failed to list installed packages', error as Error);
            throw error;
        }
    }

    /**
     * Search for template packages in npm registry
     */
    @LogMethod({ logArgs: true, logResult: false, logDuration: true })
    async searchPackages(query: string): Promise<PackageInfo[]> {
        this.ensureInitialized();

        const startTime = performance.now();
        this.metrics.incrementCounter('package-manager.search.attempts', { query });

        try {
            // Check cache first
            const cacheKey = `search:${query}`;
            const cached = await this.cache.get<PackageInfo[]>(cacheKey);
            if (cached) {
                this.logger.debug('Returning cached search results', { query });
                this.metrics.incrementCounter('package-manager.search.cache_hits');
                return cached;
            }

            this.logger.debug('Searching for template packages', { query });

            try {
                // Search npm registry for packages with glsp-template keywords
                const searchCmd = `npm search ${query} --json`;
                const { stdout } = await this.commandExecutor.execute(searchCmd);

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

                // Cache the result
                await this.cache.set(cacheKey, packages, 600000); // 10 minutes TTL

                const duration = performance.now() - startTime;
                this.metrics.recordDuration('package-manager.search', duration);
                this.metrics.incrementCounter('package-manager.search.success', { query });

                this.logger.debug('Search completed successfully', {
                    query,
                    resultCount: packages.length,
                    duration: Math.round(duration)
                });

                return packages;

            } catch (error) {
                this.logger.warn('Failed to search packages', { query, error });
                return [];
            }

        } catch (error) {
            const duration = performance.now() - startTime;
            this.metrics.recordDuration('package-manager.search.error', duration);
            this.metrics.incrementCounter('package-manager.search.errors', { query });

            this.logger.error('Package search failed', error as Error, { query });
            return [];
        }
    }

    /**
     * Get detailed information about a package
     */
    @LogMethod({ logArgs: true, logResult: false, logDuration: true })
    async getPackageInfo(packageName: string): Promise<PackageInfo | null> {
        this.ensureInitialized();

        const startTime = performance.now();
        this.metrics.incrementCounter('package-manager.info.attempts', { package: packageName });

        try {
            // Check cache first
            const cacheKey = `package-info:${packageName}`;
            const cached = await this.cache.get<PackageInfo>(cacheKey);
            if (cached) {
                this.logger.debug('Returning cached package info', { packageName });
                this.metrics.incrementCounter('package-manager.info.cache_hits');
                return cached;
            }

            this.logger.debug('Getting package information', { packageName });

            try {
                const isInstalled = await this.isPackageInstalled(packageName);
                let packageInfo: any = {};

                if (isInstalled) {
                    // Get local package info
                    const packagePath = require.resolve(`${packageName}/package.json`);
                    packageInfo = await this.fileSystem.readJSON(packagePath);
                } else {
                    // Get remote package info
                    const { stdout } = await this.commandExecutor.execute(`npm view ${packageName} --json`);
                    packageInfo = JSON.parse(stdout);
                }

                const result: PackageInfo = {
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

                // Cache the result
                await this.cache.set(cacheKey, result, 600000); // 10 minutes TTL

                const duration = performance.now() - startTime;
                this.metrics.recordDuration('package-manager.info', duration);
                this.metrics.incrementCounter('package-manager.info.success', { package: packageName });

                this.logger.debug('Package info retrieved successfully', {
                    packageName,
                    installed: isInstalled,
                    duration: Math.round(duration)
                });

                return result;

            } catch (error) {
                this.logger.warn('Failed to get package info', { packageName, error });
                return null;
            }

        } catch (error) {
            const duration = performance.now() - startTime;
            this.metrics.recordDuration('package-manager.info.error', duration);
            this.metrics.incrementCounter('package-manager.info.errors', { package: packageName });

            this.logger.error('Failed to get package info', error as Error, { packageName });
            return null;
        }
    }

    /**
     * Check if a package is installed
     */
    @LogMethod({ logArgs: true, logResult: true, logDuration: true })
    async isPackageInstalled(packageName: string): Promise<boolean> {
        this.ensureInitialized();

        try {
            require.resolve(`${packageName}/package.json`);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Validate template package structure
     */
    @LogMethod({ logArgs: true, logResult: false, logDuration: true })
    async validatePackage(packageName: string): Promise<{ valid: boolean; errors: string[] }> {
        this.ensureInitialized();

        const startTime = performance.now();
        this.metrics.incrementCounter('package-manager.validate.attempts', { package: packageName });

        const errors: string[] = [];

        try {
            this.logger.debug('Validating package structure', { packageName });

            if (!await this.isPackageInstalled(packageName)) {
                errors.push(`Package ${packageName} is not installed`);
                return { valid: false, errors };
            }

            const packagePath = path.dirname(require.resolve(`${packageName}/package.json`));

            // Check for required files
            const requiredFiles = ['package.json'];
            for (const file of requiredFiles) {
                if (!await this.fileSystem.pathExists(path.join(packagePath, file))) {
                    errors.push(`Missing required file: ${file}`);
                }
            }

            // Check for template directories
            const templatesDir = path.join(packagePath, 'templates');
            if (!await this.fileSystem.pathExists(templatesDir)) {
                errors.push('Missing templates directory');
            }

            // Check package.json for template metadata
            const packageJson = await this.fileSystem.readJSON(path.join(packagePath, 'package.json'));
            if (!packageJson.glspTemplates && !this.looksLikeTemplatePackage(packageJson)) {
                errors.push('Package does not appear to be a GLSP template package');
            }

            const duration = performance.now() - startTime;
            this.metrics.recordDuration('package-manager.validate', duration);

            if (errors.length === 0) {
                this.metrics.incrementCounter('package-manager.validate.success', { package: packageName });
                this.logger.debug('Package validation successful', {
                    packageName,
                    duration: Math.round(duration)
                });
            } else {
                this.metrics.incrementCounter('package-manager.validate.failed', { package: packageName });
                this.logger.warn('Package validation failed', {
                    packageName,
                    errorCount: errors.length,
                    duration: Math.round(duration)
                });
            }

        } catch (error) {
            const duration = performance.now() - startTime;
            this.metrics.recordDuration('package-manager.validate.error', duration);
            this.metrics.incrementCounter('package-manager.validate.errors', { package: packageName });

            errors.push(`Validation error: ${error}`);
            this.logger.error('Package validation error', error as Error, { packageName });
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Update a package to the latest version
     */
    @LogMethod({ logArgs: true, logResult: false, logDuration: true })
    async updatePackage(packageName: string): Promise<void> {
        this.ensureInitialized();

        const startTime = performance.now();
        this.metrics.incrementCounter('package-manager.update.attempts', { package: packageName });

        try {
            this.logger.info('Updating template package', { packageName });

            await this.commandExecutor.execute(`npm update ${packageName}`);

            const duration = performance.now() - startTime;
            this.metrics.recordDuration('package-manager.update', duration);
            this.metrics.incrementCounter('package-manager.update.success', { package: packageName });

            this.logger.info('Successfully updated package', {
                packageName,
                duration: Math.round(duration)
            });

            this.eventService.emit('package-manager.package.updated', {
                packageName,
                duration
            });

            // Clear cache
            await this.cache.delete('installed-packages');
            await this.cache.delete(`package-info:${packageName}`);

        } catch (error) {
            const duration = performance.now() - startTime;
            this.metrics.recordDuration('package-manager.update.error', duration);
            this.metrics.incrementCounter('package-manager.update.errors', { package: packageName });

            this.logger.error('Failed to update template package', error as Error, { packageName });
            this.eventService.emit('package-manager.package.update-failed', { packageName, error });

            throw new Error(`Failed to update template package '${packageName}': ${error}`);
        }
    }

    /**
     * Get package dependencies
     */
    @LogMethod({ logArgs: true, logResult: false, logDuration: true })
    async getPackageDependencies(packageName: string): Promise<string[]> {
        this.ensureInitialized();

        try {
            this.logger.debug('Getting package dependencies', { packageName });

            const packagePath = require.resolve(`${packageName}/package.json`);
            const packageJson = await this.fileSystem.readJSON(packagePath);

            const dependencies = Object.keys(packageJson.dependencies || {});
            const peerDependencies = Object.keys(packageJson.peerDependencies || {});

            const allDependencies = [...dependencies, ...peerDependencies];

            this.logger.debug('Retrieved package dependencies', {
                packageName,
                dependencyCount: allDependencies.length
            });

            return allDependencies;

        } catch (error) {
            this.logger.warn('Failed to get dependencies', { packageName, error });
            return [];
        }
    }

    private ensureInitialized(): void {
        if (!this.initialized) {
            throw new Error('TemplatePackageManager not initialized. Call initialize() first.');
        }
    }

    private setupEventListeners(): void {
        // Listen for configuration changes that might affect package management
        this.eventService.on('config.changed', (data) => {
            if (data?.section === 'package-manager') {
                this.logger.debug('Package manager configuration changed, clearing cache');
                this.cache.clear();
            }
        });
    }

    /**
     * Check if a package is a template package
     */
    private async isTemplatePackage(packageName: string): Promise<boolean> {
        try {
            const packagePath = require.resolve(`${packageName}/package.json`);
            const packageJson = await this.fileSystem.readJSON(packagePath);

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
}