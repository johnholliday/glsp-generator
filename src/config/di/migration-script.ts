/**
 * Automated migration script for converting from custom DI to Inversify
 * This script helps automate the conversion process
 */

import * as fs from 'fs-extra';
import * as path from 'path';

export interface MigrationOptions {
    sourceDir: string;
    backupDir?: string;
    dryRun?: boolean;
    verbose?: boolean;
}

export interface MigrationResult {
    filesProcessed: number;
    filesModified: number;
    errors: string[];
    warnings: string[];
}

/**
 * Decorator migration mappings
 */
const DECORATOR_MIGRATIONS = {
    '@Injectable()': '@injectable()',
    '@Injectable': '@injectable',
    '@PostConstruct()': '@postConstruct()',
    '@PostConstruct': '@postConstruct',
    '@PreDestroy()': '@preDestroy()',
    '@PreDestroy': '@preDestroy'
};

/**
 * Import migration mappings
 */
const IMPORT_MIGRATIONS = {
    "from './decorators.js'": "from 'inversify'",
    "from './decorators'": "from 'inversify'",
    "from '../decorators.js'": "from 'inversify'",
    "from '../decorators'": "from 'inversify'"
};

/**
 * Service identifier migration mappings
 */
const SERVICE_ID_MIGRATIONS: Record<string, string> = {
    "'IFileSystemService'": 'TYPES.IFileSystemService',
    "'ILoggerService'": 'TYPES.ILoggerService',
    "'IProgressService'": 'TYPES.IProgressService',
    "'IConfigurationService'": 'TYPES.IConfigurationService',
    "'ICacheService'": 'TYPES.ICacheService',
    "'ICommandExecutorService'": 'TYPES.ICommandExecutorService',
    "'ITemplateService'": 'TYPES.ITemplateService',
    "'IValidationService'": 'TYPES.IValidationService',
    "'IEventService'": 'TYPES.IEventService',
    "'IMetricsService'": 'TYPES.IMetricsService',
    "'IHealthCheckService'": 'TYPES.IHealthCheckService',
    "'IGrammarParserService'": 'TYPES.IGrammarParserService',
    "'ILinterService'": 'TYPES.ILinterService',
    "'ITypeSafetyGeneratorService'": 'TYPES.ITypeSafetyGeneratorService',
    "'ITestGeneratorService'": 'TYPES.ITestGeneratorService',
    "'IPackageManagerService'": 'TYPES.IPackageManagerService'
};

/**
 * Container method migration mappings
 */
const CONTAINER_METHOD_MIGRATIONS = {
    '.resolve<': '.get<',
    '.resolve(': '.get(',
    '.isRegistered(': '.isBound(',
    '.register(': '.bind('
};

/**
 * Main migration class
 */
export class InversifyMigrationScript {
    private options: MigrationOptions;
    private result: MigrationResult;

    constructor(options: MigrationOptions) {
        this.options = {
            backupDir: path.join(options.sourceDir, '.migration-backup'),
            dryRun: false,
            verbose: false,
            ...options
        };

        this.result = {
            filesProcessed: 0,
            filesModified: 0,
            errors: [],
            warnings: []
        };
    }

    /**
     * Run the migration process
     */
    async migrate(): Promise<MigrationResult> {
        try {
            this.log('Starting Inversify migration...');

            // Create backup if not dry run
            if (!this.options.dryRun && this.options.backupDir) {
                await this.createBackup();
            }

            // Process TypeScript files
            await this.processDirectory(this.options.sourceDir);

            this.log(`Migration completed. Processed ${this.result.filesProcessed} files, modified ${this.result.filesModified} files.`);

            if (this.result.errors.length > 0) {
                this.log('Errors encountered:');
                this.result.errors.forEach(error => this.log(`  - ${error}`));
            }

            if (this.result.warnings.length > 0) {
                this.log('Warnings:');
                this.result.warnings.forEach(warning => this.log(`  - ${warning}`));
            }

        } catch (error) {
            this.result.errors.push(`Migration failed: ${error}`);
        }

        return this.result;
    }

    /**
     * Create backup of source files
     */
    private async createBackup(): Promise<void> {
        if (!this.options.backupDir) return;

        this.log(`Creating backup in ${this.options.backupDir}...`);

        try {
            await fs.ensureDir(this.options.backupDir);
            await fs.copy(this.options.sourceDir, this.options.backupDir, {
                filter: (src) => {
                    // Only backup TypeScript files
                    return src.endsWith('.ts') || fs.statSync(src).isDirectory();
                }
            });
            this.log('Backup created successfully.');
        } catch (error) {
            throw new Error(`Failed to create backup: ${error}`);
        }
    }

    /**
     * Process all TypeScript files in a directory
     */
    private async processDirectory(dirPath: string): Promise<void> {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dirPath, entry.name);

            if (entry.isDirectory()) {
                // Skip backup and node_modules directories
                if (entry.name === '.migration-backup' || entry.name === 'node_modules') {
                    continue;
                }
                await this.processDirectory(fullPath);
            } else if (entry.isFile() && entry.name.endsWith('.ts')) {
                await this.processFile(fullPath);
            }
        }
    }

    /**
     * Process a single TypeScript file
     */
    private async processFile(filePath: string): Promise<void> {
        try {
            this.result.filesProcessed++;
            this.log(`Processing ${filePath}...`);

            const content = await fs.readFile(filePath, 'utf-8');
            const modifiedContent = this.migrateFileContent(content, filePath);

            if (content !== modifiedContent) {
                this.result.filesModified++;

                if (!this.options.dryRun) {
                    await fs.writeFile(filePath, modifiedContent, 'utf-8');
                    this.log(`  ✓ Modified ${filePath}`);
                } else {
                    this.log(`  ✓ Would modify ${filePath} (dry run)`);
                }
            } else {
                this.log(`  - No changes needed for ${filePath}`);
            }

        } catch (error) {
            this.result.errors.push(`Failed to process ${filePath}: ${error}`);
        }
    }

    /**
     * Migrate the content of a single file
     */
    private migrateFileContent(content: string, _filePath: string): string {
        let modified = content;
        let _hasChanges = false;

        // 1. Migrate imports
        for (const [oldImport, newImport] of Object.entries(IMPORT_MIGRATIONS)) {
            if (modified.includes(oldImport)) {
                modified = modified.replace(new RegExp(oldImport.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newImport);
                _hasChanges = true;
            }
        }

        // 2. Add TYPES import if service identifiers are used
        if (this.needsTypesImport(modified) && !modified.includes("from './types.inversify.js'")) {
            const importMatch = modified.match(/import.*from 'inversify';/);
            if (importMatch) {
                const inversifyImport = importMatch[0];
                const typesImport = "import { TYPES } from './types.inversify.js';";
                modified = modified.replace(inversifyImport, `${inversifyImport}\n${typesImport}`);
                _hasChanges = true;
            }
        }

        // 3. Migrate decorators
        for (const [oldDecorator, newDecorator] of Object.entries(DECORATOR_MIGRATIONS)) {
            if (modified.includes(oldDecorator)) {
                modified = modified.replace(new RegExp(oldDecorator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newDecorator);
                _hasChanges = true;
            }
        }

        // 4. Migrate @Inject decorators with service identifiers
        modified = this.migrateInjectDecorators(modified);

        // 5. Migrate container method calls
        for (const [oldMethod, newMethod] of Object.entries(CONTAINER_METHOD_MIGRATIONS)) {
            if (modified.includes(oldMethod)) {
                modified = modified.replace(new RegExp(oldMethod.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newMethod);
                _hasChanges = true;
            }
        }

        // 6. Migrate service identifiers in container calls
        for (const [oldId, newId] of Object.entries(SERVICE_ID_MIGRATIONS)) {
            if (modified.includes(oldId)) {
                modified = modified.replace(new RegExp(oldId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newId);
                _hasChanges = true;
            }
        }

        return modified;
    }

    /**
     * Migrate @Inject decorators
     */
    private migrateInjectDecorators(content: string): string {
        let modified = content;

        // Pattern to match @Inject('ServiceName')
        const injectPattern = /@Inject\(['"]([^'"]+)['"]\)/g;

        modified = modified.replace(injectPattern, (_match, serviceName) => {
            const typeKey = `'${serviceName}'`;
            if (SERVICE_ID_MIGRATIONS[typeKey]) {
                return `@inject(${SERVICE_ID_MIGRATIONS[typeKey]})`;
            }
            return `@inject(TYPES.${serviceName})`;
        });

        return modified;
    }

    /**
     * Check if file needs TYPES import
     */
    private needsTypesImport(content: string): boolean {
        return Object.values(SERVICE_ID_MIGRATIONS).some(typeId => content.includes(typeId));
    }

    /**
     * Log message if verbose mode is enabled
     */
    private log(message: string): void {
        if (this.options.verbose) {
            console.log(message);
        }
    }
}

/**
 * CLI interface for the migration script
 */
export async function runMigration(options: MigrationOptions): Promise<MigrationResult> {
    const migrator = new InversifyMigrationScript(options);
    return await migrator.migrate();
}

/**
 * Validate migration by checking for common issues
 */
export async function validateMigration(sourceDir: string): Promise<{
    isValid: boolean;
    issues: string[];
    suggestions: string[];
}> {
    const issues: string[] = [];
    const suggestions: string[] = [];

    try {
        // Check for remaining custom decorators
        const files = await findTypeScriptFiles(sourceDir);

        for (const file of files) {
            const content = await fs.readFile(file, 'utf-8');

            // Check for unmigrated decorators
            if (content.includes('@Injectable()') && !content.includes('@injectable()')) {
                issues.push(`${file}: Still contains @Injectable() instead of @injectable()`);
            }

            if (content.includes('@Inject(') && !content.includes('@inject(')) {
                issues.push(`${file}: Still contains @Inject() instead of @inject()`);
            }

            // Check for string service identifiers
            if (content.match(/@inject\(['"][^'"]+['"]\)/)) {
                issues.push(`${file}: Still uses string service identifiers instead of TYPES`);
            }

            // Check for missing imports
            if (content.includes('@injectable') && !content.includes("from 'inversify'")) {
                issues.push(`${file}: Uses Inversify decorators but missing import`);
            }

            if (content.includes('TYPES.') && !content.includes("from './types.inversify.js'")) {
                issues.push(`${file}: Uses TYPES but missing import`);
            }
        }

        // Provide suggestions
        if (issues.length === 0) {
            suggestions.push('Migration appears successful! Consider running tests to verify functionality.');
            suggestions.push('Update any remaining factory patterns to use simplified Inversify approach.');
            suggestions.push('Consider removing custom DI files that are no longer needed.');
        } else {
            suggestions.push('Run the migration script again to fix remaining issues.');
            suggestions.push('Manually review and fix complex decorator patterns.');
            suggestions.push('Update import paths if needed.');
        }

    } catch (error) {
        issues.push(`Validation failed: ${error}`);
    }

    return {
        isValid: issues.length === 0,
        issues,
        suggestions
    };
}

/**
 * Find all TypeScript files in a directory
 */
async function findTypeScriptFiles(dir: string): Promise<string[]> {
    const files: string[] = [];

    async function scan(currentDir: string): Promise<void> {
        const entries = await fs.readdir(currentDir, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(currentDir, entry.name);

            if (entry.isDirectory() && entry.name !== 'node_modules' && !entry.name.startsWith('.')) {
                await scan(fullPath);
            } else if (entry.isFile() && entry.name.endsWith('.ts')) {
                files.push(fullPath);
            }
        }
    }

    await scan(dir);
    return files;
}

/**
 * Example usage
 */
export const MigrationExamples = {
    /**
     * Basic migration
     */
    basic: async () => {
        const result = await runMigration({
            sourceDir: './src',
            verbose: true,
            dryRun: false
        });

        console.log('Migration result:', result);
    },

    /**
     * Dry run migration
     */
    dryRun: async () => {
        const result = await runMigration({
            sourceDir: './src',
            verbose: true,
            dryRun: true
        });

        console.log('Dry run result:', result);
    },

    /**
     * Validate migration
     */
    validate: async () => {
        const validation = await validateMigration('./src');

        if (validation.isValid) {
            console.log('✓ Migration is valid');
        } else {
            console.log('✗ Migration has issues:');
            validation.issues.forEach(issue => console.log(`  - ${issue}`));
        }

        console.log('Suggestions:');
        validation.suggestions.forEach(suggestion => console.log(`  - ${suggestion}`));
    }
};