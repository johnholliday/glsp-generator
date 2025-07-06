import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TempDirectoryManager } from './temp-directory.js';
import fs from 'fs-extra';
import path from 'path';

describe('TempDirectoryManager', () => {
  let manager: TempDirectoryManager;

  beforeEach(() => {
    manager = new TempDirectoryManager();
  });

  afterEach(async () => {
    await manager.cleanupAll();
  });

  it('should create a temporary directory', async () => {
    const tempDir = await manager.createTempDirectory('test-');
    
    expect(tempDir.path).toBeDefined();
    expect(tempDir.path).toContain('test-');
    expect(await fs.pathExists(tempDir.path)).toBe(true);
    
    await tempDir.cleanup();
  });

  it('should cleanup temporary directory', async () => {
    const tempDir = await manager.createTempDirectory();
    const dirPath = tempDir.path;
    
    expect(await fs.pathExists(dirPath)).toBe(true);
    
    await tempDir.cleanup();
    
    expect(await fs.pathExists(dirPath)).toBe(false);
  });

  it('should cleanup all directories', async () => {
    const tempDir1 = await manager.createTempDirectory();
    const tempDir2 = await manager.createTempDirectory();
    
    const dirPath1 = tempDir1.path;
    const dirPath2 = tempDir2.path;
    
    expect(await fs.pathExists(dirPath1)).toBe(true);
    expect(await fs.pathExists(dirPath2)).toBe(true);
    
    await manager.cleanupAll();
    
    expect(await fs.pathExists(dirPath1)).toBe(false);
    expect(await fs.pathExists(dirPath2)).toBe(false);
  });

  it('should copy files to temporary directory', async () => {
    const tempDir = await manager.createTempDirectory();
    
    // Create a test file
    const testFilePath = path.join(process.cwd(), 'test-file.txt');
    await fs.writeFile(testFilePath, 'test content');
    
    try {
      const copiedPath = await manager.copyToTemp(testFilePath, tempDir);
      
      expect(await fs.pathExists(copiedPath)).toBe(true);
      expect(await fs.readFile(copiedPath, 'utf-8')).toBe('test content');
      expect(path.dirname(copiedPath)).toBe(tempDir.path);
    } finally {
      await fs.remove(testFilePath);
      await tempDir.cleanup();
    }
  });

  it('should handle cleanup failures gracefully', async () => {
    const tempDir = await manager.createTempDirectory();
    const dirPath = tempDir.path;
    
    // Remove directory manually to simulate cleanup failure
    await fs.remove(dirPath);
    
    // Cleanup should not throw
    await expect(tempDir.cleanup()).resolves.not.toThrow();
  });

  it('should handle manual cleanup for untracked directories', async () => {
    const tempDir = await manager.createTempDirectory();
    const dirPath = tempDir.path;
    
    // Create a new manager instance that doesn't track this directory
    const newManager = new TempDirectoryManager();
    
    // Should not throw even though directory is not tracked
    await expect(newManager.cleanupDirectory(dirPath)).resolves.not.toThrow();
    
    // Original manager should still be able to clean up
    await tempDir.cleanup();
  });
});