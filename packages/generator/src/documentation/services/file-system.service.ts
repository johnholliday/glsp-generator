import fs from 'fs-extra';
import { injectable } from 'inversify';
import { IFileSystemService } from '../interfaces.js';

/**
 * File system service implementation using fs-extra
 */
@injectable()
export class FileSystemService implements IFileSystemService {

    async ensureDir(dirPath: string): Promise<void> {
        await fs.ensureDir(dirPath);
    }

    async writeFile(filePath: string, content: string): Promise<void> {
        await fs.writeFile(filePath, content, 'utf-8');
    }

    async exists(filePath: string): Promise<boolean> {
        return fs.pathExists(filePath);
    }

    async readFile(filePath: string): Promise<string> {
        return fs.readFile(filePath, 'utf-8');
    }
}