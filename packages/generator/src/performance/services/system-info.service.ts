import { injectable } from 'inversify';
import * as os from 'os';
import { ISystemInfoService } from '../interfaces/system-info.interface.js';

/**
 * System information service implementation using Node.js os module
 */
@injectable()
export class SystemInfoService implements ISystemInfoService {
    /**
     * Get total system memory in bytes
     */
    getTotalMemory(): number {
        return os.totalmem();
    }

    /**
     * Get free system memory in bytes
     */
    getFreeMemory(): number {
        return os.freemem();
    }

    /**
     * Get platform information
     */
    getPlatform(): string {
        return os.platform();
    }

    /**
     * Get architecture information
     */
    getArchitecture(): string {
        return os.arch();
    }

    /**
     * Get number of CPU cores
     */
    getCpuCount(): number {
        return os.cpus().length;
    }

    /**
     * Get system uptime in seconds
     */
    getUptime(): number {
        return os.uptime();
    }
}