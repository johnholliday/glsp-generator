/**
 * Simple event bus implementation
 * @module infrastructure/events
 */

import { injectable } from 'inversify';
import { EventEmitter } from 'events';

/**
 * Event bus interface
 */
export interface IEventBus {
  emit(event: string, ...args: any[]): boolean;
  on(event: string, listener: (...args: any[]) => void): this;
  once(event: string, listener: (...args: any[]) => void): this;
  off(event: string, listener: (...args: any[]) => void): this;
  removeAllListeners(event?: string): this;
}

/**
 * Simple event bus implementation using Node.js EventEmitter
 */
@injectable()
export class SimpleEventBus extends EventEmitter implements IEventBus {
  constructor() {
    super();
    // Increase max listeners to avoid warnings
    this.setMaxListeners(100);
  }

  /**
   * Type-safe emit
   */
  emit(event: string, ...args: any[]): boolean {
    return super.emit(event, ...args);
  }

  /**
   * Type-safe on
   */
  on(event: string, listener: (...args: any[]) => void): this {
    return super.on(event, listener);
  }

  /**
   * Type-safe once
   */
  once(event: string, listener: (...args: any[]) => void): this {
    return super.once(event, listener);
  }

  /**
   * Type-safe off (removeListener)
   */
  off(event: string, listener: (...args: any[]) => void): this {
    return super.off(event, listener);
  }

  /**
   * Remove all listeners
   */
  removeAllListeners(event?: string): this {
    return super.removeAllListeners(event);
  }
}