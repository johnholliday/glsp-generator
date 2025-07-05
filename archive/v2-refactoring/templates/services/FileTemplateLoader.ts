/**
 * File-based template loader implementation
 * @module templates/services
 */

import { injectable, inject } from 'inversify';
import * as path from 'path';
import * as fs from 'fs-extra';
import { globby } from 'globby';
import { CONFIG_TOKEN } from '../../infrastructure/di/symbols';
import { ITemplateLoader } from '../../core/interfaces';
import { TemplateError } from '../../infrastructure/errors/ErrorHierarchy';

/**
 * Loads templates from the file system
 * Implements Single Responsibility: Template file loading
 */
@injectable()
export class FileTemplateLoader implements ITemplateLoader {
  private readonly templateCache = new Map<string, string>();
  private templateList: string[] | null = null;

  constructor(
    @inject(CONFIG_TOKEN.TEMPLATE_DIR) private readonly templateDir: string
  ) {
    // Ensure template directory exists
    this.ensureTemplateDirectory();
  }

  /**
   * Loads a template by name
   */
  async loadTemplate(name: string): Promise<string> {
    // Check cache first
    const cached = this.templateCache.get(name);
    if (cached) {
      return cached;
    }

    try {
      const templatePath = this.resolveTemplatePath(name);
      const content = await fs.readFile(templatePath, 'utf-8');
      
      // Cache the loaded template
      this.templateCache.set(name, content);
      
      return content;
    } catch (error) {
      throw new TemplateError(
        `Failed to load template '${name}': ${(error as Error).message}`,
        name,
        error as Error
      );
    }
  }

  /**
   * Lists available templates
   */
  async listTemplates(category?: string): Promise<string[]> {
    // Use cached list if available and no category filter
    if (!category && this.templateList) {
      return this.templateList;
    }

    try {
      const pattern = category 
        ? `${category}/**/*.hbs`
        : '**/*.hbs';
      
      const files = await globby(pattern, {
        cwd: this.templateDir,
        ignore: ['**/node_modules/**', '**/dist/**']
      });

      // Normalize paths and remove extensions
      const templates = files.map(file => 
        file.replace(/\\/g, '/').replace(/\.hbs$/, '')
      );

      // Cache the full list
      if (!category) {
        this.templateList = templates;
      }

      return templates;
    } catch (error) {
      throw new TemplateError(
        `Failed to list templates: ${(error as Error).message}`,
        'list',
        error as Error
      );
    }
  }

  /**
   * Checks if a template exists
   */
  async templateExists(name: string): Promise<boolean> {
    try {
      const templatePath = this.resolveTemplatePath(name);
      return await fs.pathExists(templatePath);
    } catch {
      return false;
    }
  }

  /**
   * Clears the template cache
   */
  clearCache(): void {
    this.templateCache.clear();
    this.templateList = null;
  }

  /**
   * Preloads templates for better performance
   */
  async preloadTemplates(templates?: string[]): Promise<void> {
    const templatesToLoad = templates || await this.listTemplates();
    
    await Promise.all(
      templatesToLoad.map(template => 
        this.loadTemplate(template).catch(() => {
          // Ignore errors during preload
        })
      )
    );
  }

  /**
   * Private helper methods
   */
  private resolveTemplatePath(name: string): string {
    // Handle different naming conventions
    let templateName = name;
    
    // Add .hbs extension if not present
    if (!templateName.endsWith('.hbs')) {
      templateName += '.hbs';
    }
    
    // Try direct path first
    let templatePath = path.join(this.templateDir, templateName);
    
    // If not found and doesn't have a directory, try common locations
    if (!fs.existsSync(templatePath) && !name.includes('/')) {
      const commonLocations = ['common', 'browser', 'server', 'root'];
      
      for (const location of commonLocations) {
        const candidatePath = path.join(this.templateDir, location, templateName);
        if (fs.existsSync(candidatePath)) {
          templatePath = candidatePath;
          break;
        }
      }
    }
    
    return templatePath;
  }

  private ensureTemplateDirectory(): void {
    if (!this.templateDir) {
      throw new Error('Template directory not configured');
    }

    // Use default template directory if the configured one doesn't exist
    if (!fs.existsSync(this.templateDir)) {
      // Try to find templates relative to the module
      const possiblePaths = [
        path.join(__dirname, '../../templates'),
        path.join(__dirname, '../../../templates'),
        path.join(process.cwd(), 'templates'),
        path.join(process.cwd(), 'src/templates')
      ];

      for (const candidatePath of possiblePaths) {
        if (fs.existsSync(candidatePath)) {
          // Update the template directory
          (this as any).templateDir = candidatePath;
          return;
        }
      }

      throw new Error(`Template directory not found: ${this.templateDir}`);
    }
  }
}