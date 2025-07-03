import prompts from 'prompts';
import { ILogger } from '../../utils/logger/index.js';

export class InteractiveHelper {
  constructor(private readonly logger: ILogger) {}

  async promptForFile(message: string, validateExists = true): Promise<string> {
    const fs = await import('fs-extra');
    const response = await prompts({
      type: 'text',
      name: 'file',
      message,
      validate: validateExists
        ? async (value: string) => await fs.pathExists(value) || 'File not found'
        : undefined
    });

    if (!response.file) {
      this.logger.warn('No file provided, exiting');
      process.exit(1);
    }

    return response.file;
  }

  async confirm(message: string, initial = false): Promise<boolean> {
    const response = await prompts({
      type: 'confirm',
      name: 'confirm',
      message,
      initial
    });

    return response.confirm ?? false;
  }

  async select<T>(message: string, choices: Array<{ title: string; value: T }>): Promise<T | undefined> {
    const response = await prompts({
      type: 'select',
      name: 'value',
      message,
      choices
    });

    return response.value;
  }
}