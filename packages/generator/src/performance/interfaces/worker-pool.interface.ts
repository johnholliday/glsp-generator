import { WorkerTask, WorkerResult, ResourcePool } from '../types.js';

/**
 * Interface for worker pool operations with enhanced thread safety
 */
export interface IWorkerPool<T> extends ResourcePool<T> {
    /**
     * Execute a task using the worker pool
     */
    executeTask<TData, TResult>(task: WorkerTask<TData, TResult>): Promise<WorkerResult<TResult>>;

    /**
     * Execute multiple tasks in parallel
     */
    executeTasks<TData, TResult>(tasks: WorkerTask<TData, TResult>[]): Promise<WorkerResult<TResult>[]>;

    /**
     * Get pool statistics
     */
    getStats(): {
        totalWorkers: number;
        activeWorkers: number;
        queuedTasks: number;
        completedTasks: number;
        failedTasks: number;
    };

    /**
     * Health check for workers
     */
    healthCheck(): Promise<boolean>;

    /**
     * Restart unhealthy workers
     */
    restartWorkers(): Promise<void>;
}