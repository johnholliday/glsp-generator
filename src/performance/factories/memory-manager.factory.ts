import { MemoryManager } from '../memory-manager.js';
import { PerformanceMonitor } from '../monitor.js';
import { SystemInfoService } from '../services/system-info.service.js';
// import { PerformanceMonitorAdapter } from '../services/performance-monitor.adapter.js';
import { PerformanceConfig } from '../types.js';

/**
 * Factory function to create MemoryManager instances with backward compatibility
 */
export function createMemoryManager(
    config: PerformanceConfig = {},
    _monitor?: PerformanceMonitor
): MemoryManager {
    const systemInfoService = new SystemInfoService();
    // const _performanceMonitorAdapter = monitor
    //     ? new PerformanceMonitorAdapter(config)
    //     : new PerformanceMonitorAdapter(config);

    return new MemoryManager(
        systemInfoService,
        config
    );
}