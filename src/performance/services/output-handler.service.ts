import { promises as fs } from 'fs';
import path from 'path';
import { injectable, inject } from 'inversify';
import { TYPES } from '../../config/di/types.js';
import { ILogger } from '../../utils/logger/index.js';
import { IOutputHandler } from '../interfaces/output-handler.interface.js';
import { ProcessingResult } from '../parallel-processor.js';

/**
 * Service for handling template processing output
 */
@injectable()
export class OutputHandlerService implements IOutputHandler {
    private stats = {
        totalFiles: 0,
        totalSize: 0,
        successCount: 0,
        errorCount: 0
    };

    constructor(
        @inject(TYPES.Logger) private logger: ILogger
    ) { }

    /**
     * Handle a single processing result
     */
    async handleResult(result: ProcessingResult): Promise<void> {
        this.logger.debug(`Handling output for template: ${result.templateName}`);

        try {
            // Validate the result before processing
            const isValid = await this.validateOutput(result);
            if (!isValid) {
                throw new Error(`Invalid output for template: ${result.templateName}`);
            }

            // Ensure output directory exists
            const outputDir = path.dirname(result.outputPath);
            await fs.mkdir(outputDir, { recursive: true });

            // Write the content to file
            await fs.writeFile(result.outputPath, result.content, 'utf-8');

            // Update statistics
            this.stats.totalFiles++;
            this.stats.totalSize += result.size;
            this.stats.successCount++;

            this.logger.debug(`Output written successfully: ${result.outputPath}`);
        } catch (error) {
            this.stats.errorCount++;
            this.logger.error(`Failed to handle output for template: ${result.templateName}`, error);
            throw new Error(`Failed to handle output: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Handle multiple processing results
     */
    async handleResults(results: ProcessingResult[]): Promise<void> {
        this.logger.debug(`Handling ${results.length} processing results`);

        const handlePromises = results.map(async (result) => {
            try {
                await this.handleResult(result);
            } catch (error) {
                this.logger.error(`Failed to handle result for ${result.templateName}`, error);
                // Continue with other results, don't fail the entire batch
            }
        });

        await Promise.all(handlePromises);
        this.logger.debug(`Batch output handling completed: ${this.stats.successCount} successful, ${this.stats.errorCount} failed`);
    }

    /**
     * Validate output before writing
     */
    async validateOutput(result: ProcessingResult): Promise<boolean> {
        try {
            // Basic validation
            if (!result.templateName || result.templateName.trim() === '') {
                this.logger.warn('Template name is missing or empty');
                return false;
            }

            if (!result.outputPath || result.outputPath.trim() === '') {
                this.logger.warn('Output path is missing or empty');
                return false;
            }

            if (!result.content) {
                this.logger.warn('Output content is missing');
                return false;
            }

            // Validate output path
            if (!this.isValidOutputPath(result.outputPath)) {
                this.logger.warn(`Invalid output path: ${result.outputPath}`);
                return false;
            }

            // Check if content size matches reported size
            const actualSize = Buffer.byteLength(result.content, 'utf-8');
            if (Math.abs(actualSize - result.size) > 100) { // Allow small variance
                this.logger.warn(`Content size mismatch for ${result.templateName}: expected ${result.size}, actual ${actualSize}`);
            }

            // Validate content format (basic checks)
            if (!this.isValidContent(result.content)) {
                this.logger.warn(`Invalid content format for ${result.templateName}`);
                return false;
            }

            return true;
        } catch (error) {
            this.logger.error(`Output validation failed for ${result.templateName}`, error);
            return false;
        }
    }

    /**
     * Get output statistics
     */
    getOutputStats(): {
        totalFiles: number;
        totalSize: number;
        successCount: number;
        errorCount: number;
    } {
        return { ...this.stats };
    }

    /**
     * Cleanup output resources
     */
    async cleanup(): Promise<void> {
        this.logger.debug('Cleaning up output handler resources');

        // Reset statistics
        this.stats = {
            totalFiles: 0,
            totalSize: 0,
            successCount: 0,
            errorCount: 0
        };

        this.logger.debug('Output handler cleanup completed');
    }

    /**
     * Validate output path
     */
    private isValidOutputPath(outputPath: string): boolean {
        try {
            // Check for path traversal attempts
            const normalizedPath = path.normalize(outputPath);
            if (normalizedPath.includes('..')) {
                return false;
            }

            // Check for invalid characters (basic check)
            const invalidChars = /[<>:"|?*]/;
            if (invalidChars.test(path.basename(outputPath))) {
                return false;
            }

            // Check path length (Windows has 260 character limit)
            if (outputPath.length > 250) {
                return false;
            }

            return true;
        } catch {
            return false;
        }
    }

    /**
     * Validate content format
     */
    private isValidContent(content: string): boolean {
        try {
            // Check for null bytes (not allowed in text files)
            if (content.includes('\0')) {
                return false;
            }

            // Check for extremely long lines that might indicate binary content
            const lines = content.split('\n');
            const maxLineLength = 10000; // 10KB per line
            for (const line of lines) {
                if (line.length > maxLineLength) {
                    return false;
                }
            }

            // Check for valid UTF-8 encoding
            try {
                Buffer.from(content, 'utf-8').toString('utf-8');
            } catch {
                return false;
            }

            return true;
        } catch {
            return false;
        }
    }

    /**
     * Create backup of existing file if it exists
     */
    private async _createBackup(_filePath: string): Promise<void> {
        try {
            await fs.access(_filePath);
            const backupPath = `${_filePath}.backup.${Date.now()}`;
            await fs.copyFile(_filePath, backupPath);
            this.logger.debug(`Backup created: ${backupPath}`);
        } catch {
            // File doesn't exist, no backup needed
        }
    }

    /**
     * Ensure output directory structure exists
     */
    private async _ensureDirectoryStructure(_filePath: string): Promise<void> {
        const dir = path.dirname(_filePath);
        try {
            await fs.mkdir(dir, { recursive: true });
        } catch (error) {
            this.logger.error(`Failed to create directory structure: ${dir}`, error);
            throw error;
        }
    }
}