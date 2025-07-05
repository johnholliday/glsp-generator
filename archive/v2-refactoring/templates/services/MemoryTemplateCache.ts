/**
 * In-memory template cache implementation
 * @module templates/services
 */

import { injectable } from 'inversify';
import { ITemplateCache, CompiledTemplate } from '../../core/interfaces';

/**
 * Simple in-memory cache for compiled templates
 * Implements Single Responsibility: Template caching
 */
@injectable()
export class MemoryTemplateCache implements ITemplateCache {
  private readonly cache = new Map<string, CompiledTemplate>();
  private readonly maxSize: number = 100;
  private readonly accessOrder: string[] = [];

  /**
   * Gets cached compiled template
   */
  get(key: string): CompiledTemplate | null {
    const template = this.cache.get(key);
    
    if (template) {
      // Update access order for LRU
      this.updateAccessOrder(key);
      return template;
    }
    
    return null;
  }

  /**
   * Sets compiled template in cache
   */
  set(key: string, template: CompiledTemplate): void {
    // Check if we need to evict
    if (!this.cache.has(key) && this.cache.size >= this.maxSize) {
      this.evictLeastRecentlyUsed();
    }
    
    this.cache.set(key, template);
    this.updateAccessOrder(key);
  }

  /**
   * Clears cache
   */
  clear(): void {
    this.cache.clear();
    this.accessOrder.length = 0;
  }

  /**
   * Gets cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Checks if key exists in cache
   */
  has(key: string): boolean {
    return this.cache.has(key);
  }

  /**
   * Removes specific entry from cache
   */
  delete(key: string): boolean {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
    return this.cache.delete(key);
  }

  /**
   * Private helper methods
   */
  private updateAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
    this.accessOrder.push(key);
  }

  private evictLeastRecentlyUsed(): void {
    if (this.accessOrder.length > 0) {
      const lru = this.accessOrder.shift()!;
      this.cache.delete(lru);
    }
  }
}