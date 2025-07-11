export interface Metric {
    duration: number; // milliseconds
    memoryDelta: number; // bytes
    peakMemory: number; // bytes
    startTime?: number;
    endTime?: number;
}

export interface PerformanceReport {
    totalDuration: number;
    phases: [string, Metric][];
    memoryPeak: number;
    recommendations: string[];
    parallelEfficiency?: number;
}

export interface Phase {
    name: string;
    weight: number; // 0-1, percentage of total work
    description?: string;
}


export interface StreamingOptions {
    chunkSize?: number;
    maxConcurrency?: number;
    bufferSize?: number;
}

export interface ParallelProcessingOptions {
    maxWorkers?: number;
    chunkSize?: number;
    timeout?: number;
    retries?: number;
}

export interface ProgressOptions {
    showETA?: boolean;
    showMemory?: boolean;
    showSpeed?: boolean;
    updateInterval?: number; // ms
}

export interface BenchmarkResult {
    name: string;
    grammarSize: number; // lines
    templateCount: number;
    duration: number; // ms
    peakMemory: number; // bytes
    parallelEfficiency: number;
    timestamp: Date;
}

export interface MemoryUsage {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
    arrayBuffers: number;
}

export interface ResourcePool<T> {
    acquire(): Promise<T>;
    release(resource: T): void;
    size(): number;
    available(): number;
    destroy(): Promise<void>;
}

export interface WorkerTask<T, _R> {
    id: string;
    data: T;
    timeout?: number;
    retries?: number;
    priority?: number;
}

export interface WorkerResult<R> {
    id: string;
    result?: R;
    error?: Error;
    duration: number;
    memoryUsage: MemoryUsage;
}


export interface PerformanceConfig {
    enableParallelProcessing?: boolean;
    enableStreaming?: boolean;
    enableProgressIndicators?: boolean;
    enableMemoryMonitoring?: boolean;
    maxMemoryUsage?: number; // bytes
    gcHints?: boolean;
    profileMode?: boolean;
}

// Export WorkerPool type that was missing
export interface WorkerPool<T> extends ResourcePool<T> {
    // Additional worker-specific methods if needed
}