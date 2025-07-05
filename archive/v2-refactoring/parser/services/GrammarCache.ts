/**
 * Grammar cache implementation for parser performance
 * @module parser/services
 */

import { injectable } from 'inversify';
import { Grammar, LangiumDocument } from 'langium';
import { IParserCache } from '../../core/interfaces';
import * as crypto from 'crypto';
import * as fs from 'fs-extra';

/**
 * Cache entry structure
 */
interface CacheEntry<T> {
  value: T;
  timestamp: number;
  hash: string;
  hits: number;
}

/**
 * Grammar and document cache implementation
 * Implements Single Responsibility: Caching parsed grammars
 */
@injectable()
export class GrammarCache implements IParserCache {
  private readonly grammarCache = new Map<string, CacheEntry<Grammar>>();
  private readonly documentCache = new Map<string, CacheEntry<LangiumDocument>>();
  private readonly maxSize: number = 50;
  private readonly maxAge: number = 3600000; // 1 hour in ms

  /**
   * Gets cached Grammar if available
   */
  get(key: string): Grammar | null {
    const entry = this.grammarCache.get(key);
    
    if (!entry) {
      return null;
    }
    
    // Check if cache is stale
    if (this.isStale(entry)) {
      this.grammarCache.delete(key);
      return null;
    }
    
    // Check if file has changed
    if (this.hasFileChanged(key, entry.hash)) {
      this.grammarCache.delete(key);
      return null;
    }
    
    // Update hit count
    entry.hits++;
    
    return entry.value;
  }

  /**
   * Sets Grammar in cache
   */
  set(key: string, grammar: Grammar): void {
    // Evict if at capacity
    if (this.grammarCache.size >= this.maxSize) {
      this.evictLeastUsed(this.grammarCache);
    }
    
    const hash = this.computeFileHash(key);
    this.grammarCache.set(key, {
      value: grammar,
      timestamp: Date.now(),
      hash,
      hits: 0
    });
  }

  /**
   * Gets cached document if available
   */
  getDocument(key: string): LangiumDocument | null {
    const entry = this.documentCache.get(key);
    
    if (!entry) {
      return null;
    }
    
    // Check if cache is stale
    if (this.isStale(entry)) {
      this.documentCache.delete(key);
      return null;
    }
    
    // Check if file has changed
    if (this.hasFileChanged(key, entry.hash)) {
      this.documentCache.delete(key);
      return null;
    }
    
    // Update hit count
    entry.hits++;
    
    return entry.value;
  }

  /**
   * Sets document in cache
   */
  setDocument(key: string, document: LangiumDocument): void {
    // Evict if at capacity
    if (this.documentCache.size >= this.maxSize) {
      this.evictLeastUsed(this.documentCache);
    }
    
    const hash = this.computeFileHash(key);
    this.documentCache.set(key, {
      value: document,
      timestamp: Date.now(),
      hash,
      hits: 0
    });
  }

  /**
   * Invalidates cache entry
   */
  invalidate(key: string): void {
    this.grammarCache.delete(key);
    this.documentCache.delete(key);
  }

  /**
   * Clears entire cache
   */
  clear(): void {
    this.grammarCache.clear();
    this.documentCache.clear();
  }

  /**
   * Gets cache statistics
   */
  getStats(): {
    grammarCacheSize: number;
    documentCacheSize: number;
    totalHits: number;
    avgHitsPerEntry: number;
  } {
    let totalHits = 0;
    let entryCount = 0;
    
    for (const entry of this.grammarCache.values()) {
      totalHits += entry.hits;
      entryCount++;
    }
    
    for (const entry of this.documentCache.values()) {
      totalHits += entry.hits;
      entryCount++;
    }
    
    return {
      grammarCacheSize: this.grammarCache.size,
      documentCacheSize: this.documentCache.size,
      totalHits,
      avgHitsPerEntry: entryCount > 0 ? totalHits / entryCount : 0
    };
  }

  /**
   * Warms up cache by preloading files
   */
  async warmup(files: string[]): Promise<void> {
    // This would be called by the parser to preload commonly used grammars
    // Implementation would require parser instance
  }

  /**
   * Private helper methods
   */
  private isStale<T>(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.timestamp > this.maxAge;
  }

  private hasFileChanged(filePath: string, cachedHash: string): boolean {
    try {
      const currentHash = this.computeFileHash(filePath);
      return currentHash !== cachedHash;
    } catch {
      // File doesn't exist or can't be read
      return true;
    }
  }

  private computeFileHash(filePath: string): string {
    try {
      if (!fs.existsSync(filePath)) {
        return '';
      }
      
      const content = fs.readFileSync(filePath, 'utf-8');
      return crypto
        .createHash('sha256')
        .update(content)
        .digest('hex')
        .substring(0, 16); // Use first 16 chars for efficiency
    } catch {
      return '';
    }
  }

  private evictLeastUsed<T>(cache: Map<string, CacheEntry<T>>): void {
    let leastUsedKey: string | null = null;
    let leastHits = Infinity;
    
    // Find least used entry
    for (const [key, entry] of cache.entries()) {
      // Prefer evicting stale entries
      if (this.isStale(entry)) {
        cache.delete(key);
        return;
      }
      
      if (entry.hits < leastHits) {
        leastHits = entry.hits;
        leastUsedKey = key;
      }
    }
    
    // Evict least used
    if (leastUsedKey) {
      cache.delete(leastUsedKey);
    }
  }

  /**
   * Exports cache for persistence (optional feature)
   */
  exportCache(): string {
    const data = {
      grammars: Array.from(this.grammarCache.entries()).map(([key, entry]) => ({
        key,
        timestamp: entry.timestamp,
        hash: entry.hash,
        hits: entry.hits
      })),
      documents: Array.from(this.documentCache.entries()).map(([key, entry]) => ({
        key,
        timestamp: entry.timestamp,
        hash: entry.hash,
        hits: entry.hits
      }))
    };
    
    return JSON.stringify(data, null, 2);
  }

  /**
   * Imports cache from persistence (optional feature)
   */
  importCache(data: string): void {
    try {
      const parsed = JSON.parse(data);
      
      // We can't restore the actual Grammar/Document objects from JSON,
      // but we can restore the metadata for cache warming hints
      
      // This would be used to prioritize which files to parse first
      // when the application starts
    } catch {
      // Invalid cache data, ignore
    }
  }
}