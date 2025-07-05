/**
 * Event bus interface for publish/subscribe pattern
 * @module infrastructure/events
 */

/**
 * Event bus interface
 * @interface IEventBus
 * @public
 */
export interface IEventBus {
  /**
   * Subscribes to an event
   * @param event - Event name
   * @param handler - Event handler function
   * @returns Unsubscribe function
   */
  on(event: string, handler: (...args: any[]) => void): () => void;

  /**
   * Subscribes to an event (only triggers once)
   * @param event - Event name
   * @param handler - Event handler function
   * @returns Unsubscribe function
   */
  once(event: string, handler: (...args: any[]) => void): () => void;

  /**
   * Emits an event
   * @param event - Event name
   * @param args - Event arguments
   */
  emit(event: string, ...args: any[]): void;

  /**
   * Removes an event handler
   * @param event - Event name
   * @param handler - Event handler to remove
   */
  off(event: string, handler: (...args: any[]) => void): void;

  /**
   * Removes all handlers for an event
   * @param event - Event name
   */
  removeAllListeners(event?: string): void;
}