import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs-extra';
import { ILogger } from './logger/index.js';

export interface VsixPackageOptions {
  projectPath: string;
  outputPath?: string;
  yarnPath?: string;
  logger?: ILogger;
}

export interface VsixPackageResult {
  vsixPath: string;
  success: boolean;
  error?: Error;
}

export class VsixPackager {
  constructor(private logger?: ILogger) {}

  async packageExtension(options: VsixPackageOptions): Promise<VsixPackageResult> {
    const { projectPath, outputPath, yarnPath = 'yarn' } = options;

    try {
      // First, ensure the project is built
      await this.runCommand(yarnPath, ['install'], projectPath);
      await this.runCommand(yarnPath, ['build'], projectPath);

      // Get package.json to determine the vsix filename
      const packageJsonPath = path.join(projectPath, 'package.json');
      const packageJson = await fs.readJson(packageJsonPath);
      const vsixFilename = `${packageJson.name}-${packageJson.version}.vsix`;

      // Package the extension using vsce
      await this.runCommand('npx', ['vsce', 'package', '--yarn'], projectPath);

      // Find the generated vsix file
      const generatedVsixPath = path.join(projectPath, vsixFilename);
      
      if (!await fs.pathExists(generatedVsixPath)) {
        // Try to find any .vsix file if the expected name doesn't exist
        const files = await fs.readdir(projectPath);
        const vsixFile = files.find(f => f.endsWith('.vsix'));
        if (!vsixFile) {
          throw new Error('VSIX file not found after packaging');
        }
        const actualVsixPath = path.join(projectPath, vsixFile);
        
        // Move to output path if specified
        const finalVsixPath = outputPath 
          ? path.join(outputPath, vsixFile)
          : actualVsixPath;
        
        if (outputPath && actualVsixPath !== finalVsixPath) {
          await fs.ensureDir(outputPath);
          await fs.move(actualVsixPath, finalVsixPath, { overwrite: true });
        }

        return {
          vsixPath: finalVsixPath,
          success: true
        };
      }

      // Move to output path if specified
      const finalVsixPath = outputPath 
        ? path.join(outputPath, vsixFilename)
        : generatedVsixPath;
      
      if (outputPath && generatedVsixPath !== finalVsixPath) {
        await fs.ensureDir(outputPath);
        await fs.move(generatedVsixPath, finalVsixPath, { overwrite: true });
      }

      return {
        vsixPath: finalVsixPath,
        success: true
      };
    } catch (error) {
      this.logger?.error('Failed to package VSIX', { error });
      return {
        vsixPath: '',
        success: false,
        error: error as Error
      };
    }
  }

  private runCommand(command: string, args: string[], cwd: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.logger?.debug('Running command', { command, args, cwd });
      
      const child = spawn(command, args, {
        cwd,
        shell: true,
        stdio: 'pipe'
      });

      let stdout = '';
      let stderr = '';

      child.stdout?.on('data', (data) => {
        stdout += data.toString();
        this.logger?.debug(data.toString().trim());
      });

      child.stderr?.on('data', (data) => {
        stderr += data.toString();
        this.logger?.debug(data.toString().trim());
      });

      child.on('error', (error) => {
        this.logger?.error('Command failed to start', { command, error });
        reject(error);
      });

      child.on('close', (code) => {
        if (code !== 0) {
          const error = new Error(`Command failed with code ${code}: ${stderr || stdout}`);
          this.logger?.error('Command failed', { command, code, stderr, stdout });
          reject(error);
        } else {
          this.logger?.debug('Command completed successfully', { command });
          resolve();
        }
      });
    });
  }

  async openInVSCode(vsixPath: string, debug: boolean = false): Promise<void> {
    const codeCommand = process.platform === 'win32' ? 'code.cmd' : 'code';
    
    if (debug) {
      // Open extension development host with the VSIX pre-installed
      const args = [
        '--extensionDevelopmentPath', path.dirname(vsixPath),
        '--install-extension', vsixPath
      ];
      await this.runCommand(codeCommand, args, process.cwd());
    } else {
      // Just install the extension
      await this.runCommand(codeCommand, ['--install-extension', vsixPath], process.cwd());
    }
  }

  async openProjectInVSCode(projectPath: string): Promise<void> {
    const codeCommand = process.platform === 'win32' ? 'code.cmd' : 'code';
    await this.runCommand(codeCommand, [projectPath], process.cwd());
  }
}