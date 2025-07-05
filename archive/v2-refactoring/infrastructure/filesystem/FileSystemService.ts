/**
 * File system service implementation
 * @module infrastructure/filesystem
 */

import { injectable } from 'inversify';
import * as fs from 'fs-extra';
import * as path from 'path';
import { globby } from 'globby';

/**
 * File system service interface
 */
export interface IFileSystem {
  readFile(filePath: string): Promise<string>;
  writeFile(filePath: string, content: string): Promise<void>;
  exists(filePath: string): Promise<boolean>;
  isFile(filePath: string): Promise<boolean>;
  ensureDir(dirPath: string): Promise<void>;
  copy(src: string, dest: string): Promise<void>;
  remove(pathToRemove: string): Promise<void>;
  glob(patterns: string[], options?: any): Promise<string[]>;
}

/**
 * File system service implementation using fs-extra
 */
@injectable()
export class FileSystemService implements IFileSystem {
  /**
   * Reads a file as UTF-8 text
   */
  async readFile(filePath: string): Promise<string> {
    return await fs.readFile(filePath, 'utf-8');
  }

  /**
   * Writes content to a file
   */
  async writeFile(filePath: string, content: string): Promise<void> {
    await fs.ensureDir(path.dirname(filePath));
    await fs.writeFile(filePath, content, 'utf-8');
  }

  /**
   * Checks if a path exists
   */
  async exists(filePath: string): Promise<boolean> {
    return await fs.pathExists(filePath);
  }

  /**
   * Checks if a path is a file
   */
  async isFile(filePath: string): Promise<boolean> {
    try {
      const stats = await fs.stat(filePath);
      return stats.isFile();
    } catch {
      return false;
    }
  }

  /**
   * Ensures a directory exists
   */
  async ensureDir(dirPath: string): Promise<void> {
    await fs.ensureDir(dirPath);
  }

  /**
   * Copies files or directories
   */
  async copy(src: string, dest: string): Promise<void> {
    await fs.copy(src, dest);
  }

  /**
   * Removes files or directories
   */
  async remove(pathToRemove: string): Promise<void> {
    await fs.remove(pathToRemove);
  }

  /**
   * Finds files using glob patterns
   */
  async glob(patterns: string[], options?: any): Promise<string[]> {
    const results = await globby(patterns, options);
    // globby returns string[] when not using objectMode
    return results as unknown as string[];
  }
}