import fs from 'fs-extra';
import path from 'path';
import Ajv from 'ajv';
import chalk from 'chalk';
import { GLSPConfig, ConfigOverrides } from './types.js';
import { DEFAULT_CONFIG } from './default-config.js';
import { getConfigSchemaPath } from '../utils/paths.js';

export class ConfigLoader {
    private ajv: Ajv;
    private static CONFIG_FILE_NAME = '.glsprc.json';
    private schema: any;

    constructor() {
        this.ajv = new Ajv({ allErrors: true, useDefaults: true });
        // Load schema synchronously
        this.schema = JSON.parse(fs.readFileSync(getConfigSchemaPath(), 'utf-8'));
    }

    /**
     * Load configuration starting from a directory and searching up
     */
    async loadConfig(startPath?: string, configPath?: string): Promise<GLSPConfig> {
        let config: Partial<GLSPConfig> = {};

        // If explicit config path provided, use it
        if (configPath) {
            config = await this.loadConfigFile(configPath);
        } else {
            // Search for config file starting from startPath
            const foundPath = await this.findConfigFile(startPath || process.cwd());
            if (foundPath) {
                config = await this.loadConfigFile(foundPath);
            }
        }

        // Merge with defaults
        const mergedConfig = this.mergeWithDefaults(config);

        // Validate final config
        this.validateConfig(mergedConfig);

        return mergedConfig;
    }

    /**
     * Find config file by searching up the directory tree
     */
    private async findConfigFile(startPath: string): Promise<string | null> {
        let currentDir = path.resolve(startPath);
        const root = path.parse(currentDir).root;

        while (currentDir !== root) {
            const configPath = path.join(currentDir, ConfigLoader.CONFIG_FILE_NAME);
            if (await fs.pathExists(configPath)) {
                return configPath;
            }
            currentDir = path.dirname(currentDir);
        }

        // Check root directory
        const rootConfig = path.join(root, ConfigLoader.CONFIG_FILE_NAME);
        if (await fs.pathExists(rootConfig)) {
            return rootConfig;
        }

        return null;
    }

    /**
     * Load and parse a config file
     */
    private async loadConfigFile(configPath: string): Promise<Partial<GLSPConfig>> {
        try {
            const content = await fs.readFile(configPath, 'utf-8');
            const config = JSON.parse(content);
            console.log(chalk.green(`✓ Loaded configuration from ${configPath}`));
            return config;
        } catch (error) {
            throw new Error(`Failed to load config file ${configPath}: ${error}`);
        }
    }

    /**
     * Merge configuration with defaults
     */
    private mergeWithDefaults(config: Partial<GLSPConfig>): GLSPConfig {
        return this.deepMerge(DEFAULT_CONFIG, config) as GLSPConfig;
    }

    /**
     * Deep merge two objects
     */
    private deepMerge(target: any, source: any): any {
        const output = { ...target };

        if (this.isObject(target) && this.isObject(source)) {
            Object.keys(source).forEach(key => {
                if (this.isObject(source[key])) {
                    if (!(key in target)) {
                        output[key] = source[key];
                    } else {
                        output[key] = this.deepMerge(target[key], source[key]);
                    }
                } else {
                    output[key] = source[key];
                }
            });
        }

        return output;
    }

    /**
     * Check if value is a plain object
     */
    private isObject(item: any): boolean {
        return item && typeof item === 'object' && !Array.isArray(item);
    }

    /**
     * Validate configuration against schema
     */
    private validateConfig(config: GLSPConfig): void {
        const validate = this.ajv.compile(this.schema);
        const valid = validate(config);

        if (!valid) {
            const errors = validate.errors?.map(err => {
                const path = err.instancePath || 'root';
                return `  - ${path}: ${err.message}`;
            }).join('\n');

            throw new Error(`Configuration validation failed:\n${errors}`);
        }
    }

    /**
     * Apply CLI overrides to configuration
     */
    applyOverrides(config: GLSPConfig, overrides: ConfigOverrides): GLSPConfig {
        const result = { ...config };

        Object.entries(overrides).forEach(([path, value]) => {
            this.setNestedProperty(result, path, value);
        });

        return result;
    }

    /**
     * Set a nested property using dot notation
     */
    private setNestedProperty(obj: any, path: string, value: any): void {
        const keys = path.split('.');
        let current = obj;

        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            if (!(key in current) || !this.isObject(current[key])) {
                current[key] = {};
            }
            current = current[key];
        }

        current[keys[keys.length - 1]] = value;
    }

    /**
     * Create a default config file
     */
    async createDefaultConfig(outputPath: string): Promise<void> {
        const configPath = path.join(outputPath, ConfigLoader.CONFIG_FILE_NAME);

        if (await fs.pathExists(configPath)) {
            throw new Error(`Configuration file already exists at ${configPath}`);
        }

        // Create config with schema reference
        const config = {
            $schema: './node_modules/glsp-generator/src/config/glsprc.schema.json',
            ...DEFAULT_CONFIG
        };

        await fs.writeJson(configPath, config, { spaces: 2 });
        console.log(chalk.green(`✓ Created default configuration at ${configPath}`));
    }

    /**
     * Validate a config file without loading it
     */
    async validateConfigFile(configPath: string): Promise<{ valid: boolean; errors?: string[] }> {
        try {
            const config = await this.loadConfigFile(configPath);
            const mergedConfig = this.mergeWithDefaults(config);
            this.validateConfig(mergedConfig);
            return { valid: true };
        } catch (error) {
            if (error instanceof Error) {
                return {
                    valid: false,
                    errors: error.message.split('\n').filter(line => line.trim())
                };
            }
            return { valid: false, errors: ['Unknown error'] };
        }
    }
}