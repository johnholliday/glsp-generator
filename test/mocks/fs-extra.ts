import { vi } from 'vitest';

// Mock fs-extra module
export const mockFsExtra = {
  pathExists: vi.fn().mockImplementation(async (path: string) => {
    // Always return true for test files and common paths
    if (path.includes('.langium') || path.includes('test') || path.includes('output')) {
      return true;
    }
    return false;
  }),
  pathExistsSync: vi.fn().mockImplementation((path: string) => {
    // Always return true for test files and common paths
    if (path.includes('.langium') || path.includes('test') || path.includes('output')) {
      return true;
    }
    return false;
  }),
  existsSync: vi.fn().mockImplementation((path: string) => {
    // Always return true for test files and common paths
    if (path.includes('.langium') || path.includes('test') || path.includes('output') || path.includes('package.json')) {
      return true;
    }
    return false;
  }),
  ensureDir: vi.fn().mockResolvedValue(undefined),
  ensureDirSync: vi.fn().mockReturnValue(undefined),
  readdir: vi.fn().mockResolvedValue([]),
  readdirSync: vi.fn().mockReturnValue([]),
  readFile: vi.fn().mockResolvedValue(''),
  readFileSync: vi.fn().mockImplementation((path: string) => {
    if (path.includes('glsprc.schema.json')) {
      return JSON.stringify({ type: 'object', properties: {} });
    }
    if (path.includes('package.json')) {
      return JSON.stringify({ version: '1.0.0' });
    }
    return '';
  }),
  writeFile: vi.fn().mockResolvedValue(undefined),
  writeFileSync: vi.fn().mockReturnValue(undefined),
  readJsonSync: vi.fn().mockReturnValue({}),
  readJson: vi.fn().mockResolvedValue({}),
  writeJson: vi.fn().mockResolvedValue(undefined),
  writeJsonSync: vi.fn().mockReturnValue(undefined),
  stat: vi.fn().mockResolvedValue({ 
    size: 1024,
    isDirectory: () => false,
    isFile: () => true,
    mtime: new Date()
  }),
  statSync: vi.fn().mockReturnValue({ 
    size: 1024,
    isDirectory: () => false,
    isFile: () => true,
    mtime: new Date()
  }),
  remove: vi.fn().mockResolvedValue(undefined),
  removeSync: vi.fn().mockReturnValue(undefined),
  mkdtemp: vi.fn().mockResolvedValue('/tmp/test-'),
  mkdtempSync: vi.fn().mockReturnValue('/tmp/test-'),
  copy: vi.fn().mockResolvedValue(undefined),
  copySync: vi.fn().mockReturnValue(undefined),
  emptyDir: vi.fn().mockResolvedValue(undefined),
  emptyDirSync: vi.fn().mockReturnValue(undefined),
  outputFile: vi.fn().mockResolvedValue(undefined),
  outputFileSync: vi.fn().mockReturnValue(undefined)
};

// Create the full mock object that includes both default and named exports
const fullMock = {
  default: mockFsExtra,
  ...mockFsExtra
};

// Export both named and default
export default fullMock;
