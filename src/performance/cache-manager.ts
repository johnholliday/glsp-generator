import * as fs from 'fs-extra';
import * as path from 'path';
import * as crypto from 'crypto';
import * as zlib from 'zlib';
import { promisify } from 'util';
import { GrammarAST } from '../types/grammar';
import { CompiledTemplate } from '../templates/types';
import {
    CacheEntry,
    CacheStats,
    CacheConfig,
    PerformanceConfig
} from './types';
import { PerformanceMonitor } from './monitor.js';

const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

export interface CacheManager {
    // Grammar cache
    getCachedGrammar(path: string): Promise<GrammarAST | null>;
    cacheGrammar(path: string, ast: GrammarAST): void;

    // Template cache
    getCompiledTemplate(path: string): Promise<CompiledTemplate | null>;
    cacheTemplate(path: string, compiled: CompiledTemplate): void;

    // Dependency graph cache
    getDependencyGraph(grammarPath: string): Map<string, string[]> | null;
    cacheDependencyGraph(grammarPath: string, graph: Map<string, string[]>): void;

    // Invalidation
    invalidateGrammar(path: string): void;
    invalidateTemplate(path: string): void;
    invalidateAll(): void;

    // Persistence
    save(): Promise<void>;
    load(): Promise<void>;

    // Statistics
    getStats(): CacheStats;
    cleanup(): Promise<void>;
}

/**
 * High-performance cache manager with multiple cache types
 */
export class AdvancedCacheManager implements CacheManager {
    private grammarCache = new Map<string, CacheEntry<GrammarAST>>();
    private templateCache = new Map<string, CacheEntry<CompiledTemplate>>();
    private dependencyCache = new Map<string, CacheEntry<Map<string, string[]>>>();
    private stats: CacheStats;
    private monitor: PerformanceMonitor;
    private cacheDir: string;

    constructor(
        private config: CacheConfig = {},
        private perfConfig: PerformanceConfig = {},
        monitor?: PerformanceMonitor
    ) {
        this.monitor = monitor || new PerformanceMonitor();
        this.cacheDir = path.join(process.cwd(), '.glsp-cache');
        this.stats = {
            hits: 0,
            misses: 0,
            evictions: 0,
            totalSize: 0,
            entryCount: 0
        };

        // Set defaults
        this.config = {
            maxSize: 100 * 1024 * 1024, // 100MB
            maxEntries: 1000,
            ttl: 24 * 60 * 60, // 24 hours
            persistToDisk: true,
            compressionEnabled: true,
            ...config
        };

        this.initializeCache();
    }

    private async initializeCache(): Promise<void> {
        if (this.config.persistToDisk) {
            await fs.ensureDir(this.cacheDir);
            await this.load();
        }

        // Setup periodic cleanup
        setInterval(() => {
            this.performMaintenance();
        }, 5 * 60 * 1000); // Every 5 minutes
    }

    /**
     * Get cached grammar AST
     */
    async getCachedGrammar(grammarPath: string): Promise<GrammarAST | null> {
        const endTimer = this.monitor.startOperation('cache-grammar-get');

        try {
            const key = this.generateKey(grammarPath);
            const entry = this.grammarCache.get(key);

            if (!entry) {
                this.stats.misses++;
                return null;
            }

            // Check TTL
            if (this.isExpired(entry)) {
                this.grammarCache.delete(key);
                this.stats.misses++;
                return null;
            }

            // Check file modification time
            if (await this.isFileModified(grammarPath, entry.timestamp)) {
                this.grammarCache.delete(key);
                this.stats.misses++;
                return null;
            }

            entry.hits++;
            entry.lastAccess = Date.now();
            this.stats.hits++;

            return entry.value;
        } finally {
            endTimer();
        }
    }

    /**
     * Cache grammar AST
     */
    cacheGrammar(grammarPath: string, ast: GrammarAST): void {
        const endTimer = this.monitor.startOperation('cache-grammar-set');

        try {
            const key = this.generateKey(grammarPath);
            const size = this.estimateSize(ast);

            const entry: CacheEntry<GrammarAST> = {
                value: ast,
                timestamp: Date.now(),
                size,
                hits: 0,
                lastAccess: Date.now()
            };

            this.grammarCache.set(key, entry);
            this.updateStats(size);
            this.enforceConstraints();
        } finally {
            endTimer();
        }
    }

    /**
     * Get compiled template from cache
     */
    async getCompiledTemplate(templatePath: string): Promise<CompiledTemplate | null> {
        const endTimer = this.monitor.startOperation('cache-template-get');

        try {
            const key = this.generateKey(templatePath);
            const entry = this.templateCache.get(key);

            if (!entry) {
                this.stats.misses++;
                return null;
            }

            if (this.isExpired(entry)) {
                this.templateCache.delete(key);
                this.stats.misses++;
                return null;
            }

            // Check template file modification
            if (await this.isFileModified(templatePath, entry.timestamp)) {
                this.templateCache.delete(key);
                this.stats.misses++;
                return null;
            }

            entry.hits++;
            entry.lastAccess = Date.now();
            this.stats.hits++;

            return entry.value;
        } finally {
            endTimer();
        }
    }

    /**
     * Cache compiled template
     */
    cacheTemplate(templatePath: string, compiled: CompiledTemplate): void {
        const endTimer = this.monitor.startOperation('cache-template-set');

        try {
            const key = this.generateKey(templatePath);
            const size = this.estimateSize(compiled);

            const entry: CacheEntry<CompiledTemplate> = {
                value: compiled,
                timestamp: Date.now(),
                size,
                hits: 0,
                lastAccess: Date.now()
            };

            this.templateCache.set(key, entry);
            this.updateStats(size);
            this.enforceConstraints();
        } finally {
            endTimer();
        }
    }

    /**
     * Get dependency graph from cache
     */
    getDependencyGraph(grammarPath: string): Map<string, string[]> | null {
        const key = this.generateKey(grammarPath + ':deps');
        const entry = this.dependencyCache.get(key);

        if (!entry || this.isExpired(entry)) {
            this.stats.misses++;
            return null;
        }

        entry.hits++;
        entry.lastAccess = Date.now();
        this.stats.hits++;

        return entry.value;
    }

    /**
     * Cache dependency graph
     */
    cacheDependencyGraph(grammarPath: string, graph: Map<string, string[]>): void {
        const key = this.generateKey(grammarPath + ':deps');
        const size = this.estimateSize(graph);

        const entry: CacheEntry<Map<string, string[]>> = {
            value: graph,
            timestamp: Date.now(),
            size,
            hits: 0,
            lastAccess: Date.now()
        };

        this.dependencyCache.set(key, entry);
        this.updateStats(size);
        this.enforceConstraints();
    }

    /**
     * Invalidate grammar cache entry
     */
    invalidateGrammar(grammarPath: string): void {
        const key = this.generateKey(grammarPath);
        const entry = this.grammarCache.get(key);

        if (entry) {
            this.grammarCache.delete(key);
            this.stats.totalSize -= entry.size;
            this.stats.entryCount--;
        }
    }

    /**
     * Invalidate template cache entry
     */
    invalidateTemplate(templatePath: string): void {
        const key = this.generateKey(templatePath);
        const entry = this.templateCache.get(key);

        if (entry) {
            this.templateCache.delete(key);
            this.stats.totalSize -= entry.size;
            this.stats.entryCount--;
        }
    }

    /**
     * Clear all caches
     */
    invalidateAll(): void {
        this.grammarCache.clear();
        this.templateCache.clear();
        this.dependencyCache.clear();
        this.stats = {
            hits: 0,
            misses: 0,
            evictions: 0,
            totalSize: 0,
            entryCount: 0
        };
    }

    /**
     * Save cache to disk
     */
    async save(): Promise<void> {
        if (!this.config.persistToDisk) return;

        const endTimer = this.monitor.startOperation('cache-save');

        try {
            const cacheData = {
                grammar: Array.from(this.grammarCache.entries()),
                template: Array.from(this.templateCache.entries()),
                dependency: Array.from(this.dependencyCache.entries()),
                stats: this.stats,
                timestamp: Date.now()
            };

            let serialized = JSON.stringify(cacheData);

            if (this.config.compressionEnabled) {
                const compressed = await gzip(Buffer.from(serialized));
                await fs.writeFile(path.join(this.cacheDir, 'cache.json.gz'), compressed);
            } else {
                await fs.writeFile(path.join(this.cacheDir, 'cache.json'), serialized);
            }
        } finally {
            endTimer();
        }
    }

    /**
     * Load cache from disk
     */
    async load(): Promise<void> {
        if (!this.config.persistToDisk) return;

        const endTimer = this.monitor.startOperation('cache-load');

        try {
            const compressedPath = path.join(this.cacheDir, 'cache.json.gz');
            const uncompressedPath = path.join(this.cacheDir, 'cache.json');

            let data: string;

            if (await fs.pathExists(compressedPath)) {
                const compressed = await fs.readFile(compressedPath);
                const decompressed = await gunzip(compressed);
                data = decompressed.toString();
            } else if (await fs.pathExists(uncompressedPath)) {
                data = await fs.readFile(uncompressedPath, 'utf-8');
            } else {
                return; // No cache file exists
            }

            const cacheData = JSON.parse(data);

            // Restore caches
            this.grammarCache = new Map(cacheData.grammar || []);
            this.templateCache = new Map(cacheData.template || []);
            this.dependencyCache = new Map(cacheData.dependency || []);
            this.stats = cacheData.stats || this.stats;

            // Clean up expired entries
            await this.cleanupExpired();
        } catch (error) {
            console.warn('Failed to load cache:', error);
            // Continue with empty cache
        } finally {
            endTimer();
        }
    }

    /**
     * Get cache statistics
     */
    getStats(): CacheStats {
        return {
            ...this.stats,
            entryCount: this.grammarCache.size + this.templateCache.size + this.dependencyCache.size
        };
    }

    /**
     * Cleanup resources
     */
    async cleanup(): Promise<void> {
        await this.save();
        this.invalidateAll();
    }

    /**
     * Generate cache key from path
     */
    private generateKey(filePath: string): string {
        return crypto.createHash('sha256').update(filePath).digest('hex');
    }

    /**
     * Check if cache entry is expired
     */
    private isExpired(entry: CacheEntry<any>): boolean {
        if (!this.config.ttl) return false;
        return Date.now() - entry.timestamp > this.config.ttl * 1000;
    }

    /**
     * Check if file has been modified since cache entry
     */
    private async isFileModified(filePath: string, cacheTimestamp: number): Promise<boolean> {
        try {
            const stats = await fs.stat(filePath);
            return stats.mtime.getTime() > cacheTimestamp;
        } catch {
            return true; // File doesn't exist, consider it modified
        }
    }

    /**
     * Estimate memory size of object
     */
    private estimateSize(obj: any): number {
        try {
            return JSON.stringify(obj).length * 2; // Rough estimate
        } catch {
            return 1024; // Default size for non-serializable objects
        }
    }

    /**
     * Update cache statistics
     */
    private updateStats(size: number): void {
        this.stats.totalSize += size;
        this.stats.entryCount++;
    }

    /**
     * Enforce cache size and entry constraints
     */
    private enforceConstraints(): void {
        // Check size constraint
        if (this.config.maxSize && this.stats.totalSize > this.config.maxSize) {
            this.evictBySize();
        }

        // Check entry count constraint
        const totalEntries = this.grammarCache.size + this.templateCache.size + this.dependencyCache.size;
        if (this.config.maxEntries && totalEntries > this.config.maxEntries) {
            this.evictByCount();
        }
    }

    /**
     * Evict entries to meet size constraint
     */
    private evictBySize(): void {
        const allEntries = [
            ...Array.from(this.grammarCache.entries()).map(([k, v]) => ({ key: k, entry: v, cache: 'grammar' })),
            ...Array.from(this.templateCache.entries()).map(([k, v]) => ({ key: k, entry: v, cache: 'template' })),
            ...Array.from(this.dependencyCache.entries()).map(([k, v]) => ({ key: k, entry: v, cache: 'dependency' }))
        ];

        // Sort by last access time (LRU)
        allEntries.sort((a, b) => a.entry.lastAccess - b.entry.lastAccess);

        let targetSize = this.config.maxSize! * 0.8; // Reduce to 80% of max
        let currentSize = this.stats.totalSize;

        for (const item of allEntries) {
            if (currentSize <= targetSize) break;

            this.evictEntry(item.key, item.cache);
            currentSize -= item.entry.size;
            this.stats.evictions++;
        }
    }

    /**
     * Evict entries to meet count constraint
     */
    private evictByCount(): void {
        const targetCount = Math.floor(this.config.maxEntries! * 0.8); // Reduce to 80% of max
        const currentCount = this.grammarCache.size + this.templateCache.size + this.dependencyCache.size;
        const toEvict = currentCount - targetCount;

        const allEntries = [
            ...Array.from(this.grammarCache.entries()).map(([k, v]) => ({ key: k, entry: v, cache: 'grammar' })),
            ...Array.from(this.templateCache.entries()).map(([k, v]) => ({ key: k, entry: v, cache: 'template' })),
            ...Array.from(this.dependencyCache.entries()).map(([k, v]) => ({ key: k, entry: v, cache: 'dependency' }))
        ];

        // Sort by hit count and last access (LFU + LRU)
        allEntries.sort((a, b) => {
            if (a.entry.hits !== b.entry.hits) {
                return a.entry.hits - b.entry.hits; // Lower hit count first
            }
            return a.entry.lastAccess - b.entry.lastAccess; // Older access first
        });

        for (let i = 0; i < toEvict && i < allEntries.length; i++) {
            const item = allEntries[i];
            this.evictEntry(item.key, item.cache);
            this.stats.evictions++;
        }
    }

    /**
     * Evict a specific cache entry
     */
    private evictEntry(key: string, cacheType: string): void {
        let entry: CacheEntry<any> | undefined;

        switch (cacheType) {
            case 'grammar':
                entry = this.grammarCache.get(key);
                this.grammarCache.delete(key);
                break;
            case 'template':
                entry = this.templateCache.get(key);
                this.templateCache.delete(key);
                break;
            case 'dependency':
                entry = this.dependencyCache.get(key);
                this.dependencyCache.delete(key);
                break;
        }

        if (entry) {
            this.stats.totalSize -= entry.size;
            this.stats.entryCount--;
        }
    }

    /**
     * Perform periodic maintenance
     */
    private async performMaintenance(): Promise<void> {
        await this.cleanupExpired();

        if (this.config.persistToDisk) {
            await this.save();
        }

        // Suggest GC if enabled
        if (this.perfConfig.gcHints && global.gc) {
            global.gc();
        }
    }

    /**
     * Remove expired entries
     */
    private async cleanupExpired(): Promise<void> {
        const now = Date.now();
        const ttl = this.config.ttl! * 1000;

        // Cleanup grammar cache
        for (const [key, entry] of this.grammarCache.entries()) {
            if (now - entry.timestamp > ttl) {
                this.grammarCache.delete(key);
                this.stats.totalSize -= entry.size;
                this.stats.entryCount--;
            }
        }

        // Cleanup template cache
        for (const [key, entry] of this.templateCache.entries()) {
            if (now - entry.timestamp > ttl) {
                this.templateCache.delete(key);
                this.stats.totalSize -= entry.size;
                this.stats.entryCount--;
            }
        }

        // Cleanup dependency cache
        for (const [key, entry] of this.dependencyCache.entries()) {
            if (now - entry.timestamp > ttl) {
                this.dependencyCache.delete(key);
                this.stats.totalSize -= entry.size;
                this.stats.entryCount--;
            }
        }
    }
}