import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import {
  scanFile,
  findTemplateFiles,
  prohibitedPatterns,
  packageJsonChecks
} from '../validation/template-validator.js';

describe('validate-templates', () => {
  let tempDir: string;

  beforeEach(async () => {
    // Create a temporary directory for test files
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'validate-templates-test-'));
  });

  afterEach(async () => {
    // Clean up temporary directory
    await fs.remove(tempDir);
  });

  describe('scanFile', () => {
    it('should detect workspace protocol in templates', async () => {
      const testFile = path.join(tempDir, 'test.hbs');
      await fs.writeFile(testFile, `
{
  "dependencies": {
    "@example/package": "workspace:*"
  }
}
      `);

      const { errors, warnings } = await scanFile(testFile);

      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('Workspace protocol');
      expect(errors[0].line).toBe(4);
      expect(warnings).toHaveLength(0);
    });

    it('should detect yarn dlx commands', async () => {
      const testFile = path.join(tempDir, 'test.hbs');
      await fs.writeFile(testFile, `
{
  "scripts": {
    "setup": "yarn dlx @yarnpkg/sdks vscode"
  }
}
      `);

      const { errors, warnings } = await scanFile(testFile);

      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('yarn dlx');
      expect(errors[0].line).toBe(4);
    });

    it('should detect .yarnrc.yml references', async () => {
      const testFile = path.join(tempDir, 'test.hbs');
      await fs.writeFile(testFile, `
# Copy .yarnrc.yml for configuration
      `);

      const { errors, warnings } = await scanFile(testFile);

      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('.yarnrc.yml');
    });

    it('should detect PnP configuration', async () => {
      const testFile = path.join(tempDir, 'test.hbs');
      await fs.writeFile(testFile, `
{
  "installConfig": {
    "pnpMode": "strict"
  }
}
      `);

      const { errors, warnings } = await scanFile(testFile);

      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('PnP configuration');
    });

    it('should detect packageManager field', async () => {
      const testFile = path.join(tempDir, 'test.hbs');
      await fs.writeFile(testFile, `
{
  "packageManager": "yarn@3.2.0"
}
      `);

      const { errors, warnings } = await scanFile(testFile);

      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('packageManager');
    });

    it('should detect multiple issues in one file', async () => {
      const testFile = path.join(tempDir, 'test.hbs');
      await fs.writeFile(testFile, `
{
  "packageManager": "yarn@3.2.0",
  "dependencies": {
    "foo": "workspace:*"
  },
  "scripts": {
    "test": "yarn dlx jest"
  }
}
      `);

      const { errors, warnings } = await scanFile(testFile);

      expect(errors).toHaveLength(3);
      expect(errors.some((e: any) => e.message.includes('packageManager'))).toBe(true);
      expect(errors.some((e: any) => e.message.includes('Workspace protocol'))).toBe(true);
      expect(errors.some((e: any) => e.message.includes('yarn dlx'))).toBe(true);
    });

    it('should warn about yarn workspaces command', async () => {
      const testFile = path.join(tempDir, 'test.hbs');
      await fs.writeFile(testFile, `
{
  "scripts": {
    "test:all": "yarn workspaces run test"
  }
}
      `);

      const { errors, warnings } = await scanFile(testFile);

      expect(errors).toHaveLength(0);
      expect(warnings).toHaveLength(1);
      expect(warnings[0].message).toContain('Yarn workspaces');
    });

    it('should handle clean templates without issues', async () => {
      const testFile = path.join(tempDir, 'clean.hbs');
      await fs.writeFile(testFile, `
{
  "name": "{{name}}",
  "version": "0.1.0",
  "dependencies": {
    "@theia/core": "^1.30.0"
  },
  "scripts": {
    "build": "tsc -b",
    "clean": "rimraf lib"
  }
}
      `);

      const { errors, warnings } = await scanFile(testFile);

      expect(errors).toHaveLength(0);
      expect(warnings).toHaveLength(0);
    });

    it('should apply package.json specific checks', async () => {
      const testFile = path.join(tempDir, 'package.json.hbs');
      await fs.writeFile(testFile, `
{
  "name": "test",
  "workspaces": ["packages/*"]
}
      `);

      const { errors, warnings } = await scanFile(testFile);

      expect(errors).toHaveLength(0);
      expect(warnings).toHaveLength(1);
      expect(warnings[0].message).toContain('Workspaces field found');
    });

    it('should handle file read errors gracefully', async () => {
      const nonExistentFile = path.join(tempDir, 'does-not-exist.hbs');
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

      const { errors, warnings } = await scanFile(nonExistentFile);

      expect(errors).toHaveLength(0);
      expect(warnings).toHaveLength(0);
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('findTemplateFiles', () => {
    it('should find all .hbs files recursively', async () => {
      // Create test structure
      await fs.ensureDir(path.join(tempDir, 'templates'));
      await fs.ensureDir(path.join(tempDir, 'templates', 'browser'));
      await fs.ensureDir(path.join(tempDir, 'templates', 'server'));

      await fs.writeFile(path.join(tempDir, 'templates', 'root.hbs'), '');
      await fs.writeFile(path.join(tempDir, 'templates', 'browser', 'component.hbs'), '');
      await fs.writeFile(path.join(tempDir, 'templates', 'server', 'handler.hbs'), '');
      await fs.writeFile(path.join(tempDir, 'templates', 'not-template.txt'), '');

      const files = await findTemplateFiles(path.join(tempDir, 'templates'));

      expect(files).toHaveLength(3);
      expect(files.some((f: string) => f.endsWith('root.hbs'))).toBe(true);
      expect(files.some((f: string) => f.endsWith('component.hbs'))).toBe(true);
      expect(files.some((f: string) => f.endsWith('handler.hbs'))).toBe(true);
      expect(files.some((f: string) => f.endsWith('not-template.txt'))).toBe(false);
    });

    it('should handle empty directories', async () => {
      await fs.ensureDir(path.join(tempDir, 'empty'));

      const files = await findTemplateFiles(path.join(tempDir, 'empty'));

      expect(files).toHaveLength(0);
    });
  });

  describe('prohibitedPatterns', () => {
    it('should have all required patterns defined', () => {
      const expectedPatterns = [
        'workspace:\\*',  // Escaped asterisk in regex
        '\\.yarnrc\\.yml',  // Escaped dots
        'yarn dlx',
        'pnpMode',
        'packageManager',  // Without colon now
        '\\.pnp\\.cjs',  // Escaped dots
        '\\.pnp\\.mjs'   // Escaped dots
      ];

      expectedPatterns.forEach(pattern => {
        const found = prohibitedPatterns.some((p: any) =>
          p.pattern.source.includes(pattern)
        );
        expect(found).toBe(true);
      });
    });

    it('should have appropriate severity levels', () => {
      // Most patterns should be errors
      const errorPatterns = prohibitedPatterns.filter((p: any) => p.severity === 'error');
      expect(errorPatterns.length).toBeGreaterThan(8);

      // Some patterns may be warnings
      const warningPatterns = prohibitedPatterns.filter((p: any) => p.severity === 'warning');
      expect(warningPatterns.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('packageJsonChecks', () => {
    it('should check for workspaces field', () => {
      const content = '{"workspaces": ["packages/*"]}';
      const hasWorkspaces = packageJsonChecks.some((check: any) =>
        check.check(content) && check.message.includes('Workspaces')
      );
      expect(hasWorkspaces).toBe(true);
    });

    it('should check for resolutions field', () => {
      const content = '{"resolutions": {"foo": "1.0.0"}}';
      const hasResolutions = packageJsonChecks.some((check: any) =>
        check.check(content) && check.message.includes('Resolutions')
      );
      expect(hasResolutions).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle templates with Handlebars expressions', async () => {
      const testFile = path.join(tempDir, 'handlebars.hbs');
      await fs.writeFile(testFile, `
{
  "name": "{{toCamelCase name}}",
  "dependencies": {
    {{#each dependencies}}
    "{{this.name}}": "{{this.version}}"{{#unless @last}},{{/unless}}
    {{/each}}
  }
}
      `);

      const { errors, warnings } = await scanFile(testFile);

      expect(errors).toHaveLength(0);
      expect(warnings).toHaveLength(0);
    });

    it('should detect issues inside Handlebars blocks', async () => {
      const testFile = path.join(tempDir, 'handlebars-with-issue.hbs');
      await fs.writeFile(testFile, `
{
  {{#if useWorkspaces}}
  "dependencies": {
    "package": "workspace:*"
  }
  {{/if}}
}
      `);

      const { errors, warnings } = await scanFile(testFile);

      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('Workspace protocol');
    });

    it('should handle files with only warnings', async () => {
      const testFile = path.join(tempDir, 'warnings-only.hbs');
      await fs.writeFile(testFile, `
{
  "scripts": {
    "test:workspaces": "yarn workspaces foreach run test"
  },
  "resolutions": {
    "foo": "1.0.0"
  }
}
      `);

      const { errors, warnings } = await scanFile(testFile);

      expect(errors).toHaveLength(0);
      expect(warnings.length).toBeGreaterThan(0);
    });
  });
});