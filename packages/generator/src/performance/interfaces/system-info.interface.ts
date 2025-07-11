/**
 * Interface for system information operations
 */
export interface ISystemInfoService {
    /**
     * Get total system memory in bytes
     */
    getTotalMemory(): number;

    /**
     * Get free system memory in bytes
     */
    getFreeMemory(): number;

    /**
     * Get platform information
     */
    getPlatform(): string;

    /**
     * Get architecture information
     */
    getArchitecture(): string;

    /**
     * Get number of CPU cores
     */
    getCpuCount(): number;

    /**
     * Get system uptime in seconds
     */
    getUptime(): number;
}