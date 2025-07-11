import * as tmp from 'tmp';
import fs from 'fs-extra';
import path from 'path';
import { ILogger } from './logger/index.js';

export interface TempDirectoryResult {
  path: string;
  cleanup: () => Promise<void>;
}

export class TempDirectoryManager {
  private tempDirs: Map<string, tmp.DirResult> = new Map();

  constructor(private logger?: ILogger) {}

  async createTempDirectory(prefix: string = 'glsp-gen-'): Promise<TempDirectoryResult> {
    return new Promise((resolve, reject) => {
      tmp.dir({ prefix, unsafeCleanup: true }, (err, dirPath, cleanupCallback) => {
        if (err) {
          reject(err);
          return;
        }

        const dirResult: tmp.DirResult = {
          name: dirPath,
          removeCallback: cleanupCallback
        };

        this.tempDirs.set(dirPath, dirResult);
        this.logger?.debug('Created temporary directory', { path: dirPath });

        resolve({
          path: dirPath,
          cleanup: async () => {
            await this.cleanupDirectory(dirPath);
          }
        });
      });
    });
  }

  async cleanupDirectory(dirPath: string): Promise<void> {
    const dirResult = this.tempDirs.get(dirPath);
    if (!dirResult) {
      // Try to remove manually if not tracked
      try {
        await fs.remove(dirPath);
        this.logger?.debug('Manually removed directory', { path: dirPath });
      } catch (error) {
        this.logger?.warn('Failed to remove directory', { path: dirPath, error });
      }
      return;
    }

    try {
      // The removeCallback might be synchronous, so let's ensure the directory is removed
      dirResult.removeCallback();
      this.tempDirs.delete(dirPath);
      
      // Double-check and force removal if needed
      if (await fs.pathExists(dirPath)) {
        await fs.remove(dirPath);
      }
      
      this.logger?.debug('Cleaned up temporary directory', { path: dirPath });
    } catch (error) {
      this.logger?.error('Failed to cleanup temporary directory', { path: dirPath, error });
      // Try manual removal
      try {
        await fs.remove(dirPath);
        this.tempDirs.delete(dirPath);
        this.logger?.debug('Manually removed directory after cleanup failure', { path: dirPath });
      } catch (manualError) {
        this.logger?.error('Manual cleanup also failed', { path: dirPath, error: manualError });
      }
    }
  }

  async cleanupAll(): Promise<void> {
    const cleanupPromises = Array.from(this.tempDirs.keys()).map(dirPath => 
      this.cleanupDirectory(dirPath)
    );
    await Promise.all(cleanupPromises);
  }

  async copyToTemp(sourcePath: string, tempDirResult: TempDirectoryResult): Promise<string> {
    const destPath = path.join(tempDirResult.path, path.basename(sourcePath));
    await fs.copy(sourcePath, destPath);
    return destPath;
  }
}

// Global instance for process cleanup
const globalManager = new TempDirectoryManager();

// Cleanup on process exit
process.on('exit', () => {
  globalManager.cleanupAll().catch(() => {});
});

process.on('SIGINT', async () => {
  await globalManager.cleanupAll();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await globalManager.cleanupAll();
  process.exit(0);
});

export const tempDirManager = globalManager;