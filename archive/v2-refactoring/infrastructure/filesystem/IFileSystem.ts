/**
 * File system interface for abstracted file operations
 * @module infrastructure/filesystem
 */

/**
 * File system interface
 * @interface IFileSystem
 * @public
 */
export interface IFileSystem {
  /**
   * Reads a file
   * @param path - File path
   * @param encoding - File encoding
   * @returns File content
   */
  readFile(path: string, encoding?: BufferEncoding): Promise<string>;

  /**
   * Writes a file
   * @param path - File path
   * @param content - File content
   * @param encoding - File encoding
   */
  writeFile(path: string, content: string, encoding?: BufferEncoding): Promise<void>;

  /**
   * Checks if a path exists
   * @param path - Path to check
   * @returns True if exists
   */
  exists(path: string): Promise<boolean>;

  /**
   * Creates a directory
   * @param path - Directory path
   * @param recursive - Create parent directories if needed
   */
  mkdir(path: string, recursive?: boolean): Promise<void>;

  /**
   * Removes a file or directory
   * @param path - Path to remove
   * @param recursive - Remove recursively
   */
  remove(path: string, recursive?: boolean): Promise<void>;

  /**
   * Lists directory contents
   * @param path - Directory path
   * @returns Array of file/directory names
   */
  readdir(path: string): Promise<string[]>;

  /**
   * Gets file/directory stats
   * @param path - Path to stat
   * @returns File stats
   */
  stat(path: string): Promise<any>;

  /**
   * Copies a file or directory
   * @param source - Source path
   * @param destination - Destination path
   * @param recursive - Copy recursively
   */
  copy(source: string, destination: string, recursive?: boolean): Promise<void>;

  /**
   * Ensures a directory exists
   * @param path - Directory path
   */
  ensureDir(path: string): Promise<void>;

  /**
   * Finds files using glob patterns
   * @param patterns - Glob patterns
   * @param options - Glob options
   * @returns Array of matched file paths
   */
  glob(patterns: string | string[], options?: any): Promise<string[]>;
}