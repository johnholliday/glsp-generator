import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { VsixPackager } from './vsix-packager.js';
import * as child_process from 'child_process';
import fs from 'fs-extra';
import path from 'path';

vi.mock('child_process');
vi.mock('fs-extra');

describe('VsixPackager', () => {
  let packager: VsixPackager;
  let mockSpawn: Mock;

  beforeEach(() => {
    packager = new VsixPackager();
    mockSpawn = vi.mocked(child_process.spawn);
    vi.clearAllMocks();
  });

  it('should package extension successfully', async () => {
    const mockPackageJson = {
      name: 'test-extension',
      version: '1.0.0'
    };

    vi.mocked(fs.readJson).mockResolvedValue(mockPackageJson);
    vi.mocked(fs.pathExists).mockResolvedValue(true);
    vi.mocked(fs.ensureDir).mockResolvedValue(undefined);
    vi.mocked(fs.move).mockResolvedValue(undefined);

    // Mock successful command execution
    mockSpawn.mockImplementation(() => {
      const mockChild = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn((event, callback) => {
          if (event === 'close') {
            callback(0);
          }
        })
      };
      return mockChild as any;
    });

    const result = await packager.packageExtension({
      projectPath: '/test/project',
      outputPath: '/test/output'
    });

    expect(result.success).toBe(true);
    expect(result.vsixPath).toBe('/test/output/test-extension-1.0.0.vsix');
    expect(mockSpawn).toHaveBeenCalledTimes(3); // install, build, package
  });

  it('should handle packaging failure', async () => {
    const mockPackageJson = {
      name: 'test-extension',
      version: '1.0.0'
    };

    vi.mocked(fs.readJson).mockResolvedValue(mockPackageJson);

    // Mock failed command execution
    mockSpawn.mockImplementation(() => {
      const mockChild = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn((event, callback) => {
          if (event === 'data') {
            callback(Buffer.from('Error message'));
          }
        }) },
        on: vi.fn((event, callback) => {
          if (event === 'close') {
            callback(1);
          }
        })
      };
      return mockChild as any;
    });

    const result = await packager.packageExtension({
      projectPath: '/test/project'
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should find vsix file with different name', async () => {
    const mockPackageJson = {
      name: 'test-extension',
      version: '1.0.0'
    };

    vi.mocked(fs.readJson).mockResolvedValue(mockPackageJson);
    vi.mocked(fs.pathExists).mockImplementation(async (filePath) => {
      // Expected file doesn't exist
      if (filePath === path.join('/test/project', 'test-extension-1.0.0.vsix')) {
        return false;
      }
      return true;
    });
    vi.mocked(fs.readdir).mockResolvedValue(['different-name.vsix'] as any);
    vi.mocked(fs.move).mockResolvedValue(undefined);

    // Mock successful command execution
    mockSpawn.mockImplementation(() => {
      const mockChild = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn((event, callback) => {
          if (event === 'close') {
            callback(0);
          }
        })
      };
      return mockChild as any;
    });

    const result = await packager.packageExtension({
      projectPath: '/test/project'
    });

    expect(result.success).toBe(true);
    expect(result.vsixPath).toBe('/test/project/different-name.vsix');
  });

  it('should open in VSCode', async () => {
    mockSpawn.mockImplementation(() => {
      const mockChild = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn((event, callback) => {
          if (event === 'close') {
            callback(0);
          }
        })
      };
      return mockChild as any;
    });

    await packager.openInVSCode('/test/extension.vsix', false);

    const expectedCommand = process.platform === 'win32' ? 'code.cmd' : 'code';
    expect(mockSpawn).toHaveBeenCalledWith(
      expectedCommand,
      ['--install-extension', '/test/extension.vsix'],
      expect.objectContaining({ shell: true })
    );
  });

  it('should open in VSCode debug mode', async () => {
    mockSpawn.mockImplementation(() => {
      const mockChild = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn((event, callback) => {
          if (event === 'close') {
            callback(0);
          }
        })
      };
      return mockChild as any;
    });

    await packager.openInVSCode('/test/extension.vsix', true);

    const expectedCommand = process.platform === 'win32' ? 'code.cmd' : 'code';
    expect(mockSpawn).toHaveBeenCalledWith(
      expectedCommand,
      [
        '--extensionDevelopmentPath', path.dirname('/test/extension.vsix'),
        '--install-extension', '/test/extension.vsix'
      ],
      expect.objectContaining({ shell: true })
    );
  });

  it('should open project in VSCode', async () => {
    mockSpawn.mockImplementation(() => {
      const mockChild = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn((event, callback) => {
          if (event === 'close') {
            callback(0);
          }
        })
      };
      return mockChild as any;
    });

    await packager.openProjectInVSCode('/test/project');

    const expectedCommand = process.platform === 'win32' ? 'code.cmd' : 'code';
    expect(mockSpawn).toHaveBeenCalledWith(
      expectedCommand,
      ['/test/project'],
      expect.objectContaining({ shell: true })
    );
  });
});