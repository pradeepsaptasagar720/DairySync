// EventBus for Real-Time Cross-Component Communication
// Implements publish-subscribe pattern for system-wide event handling

class EventBus {
  constructor() {
    this.listeners = new Map();
    this.eventHistory = [];
    this.maxHistorySize = 100;
    this.isDebugMode = process.env.NODE_ENV === 'development';
  }

  /**
   * Subscribe to an event type
   * @param {string} eventType - The event type to listen for
   * @param {function} callback - The callback function to execute
   * @param {object} options - Optional configuration
   * @returns {function} Unsubscribe function
   */
  subscribe(eventType, callback, options = {}) {
    if (typeof eventType !== 'string' || typeof callback !== 'function') {
      throw new Error('EventBus.subscribe: eventType must be string and callback must be function');
    }

    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }

    const listenerInfo = {
      callback,
      id: this.generateListenerId(),
      priority: options.priority || 1,
      once: options.once || false,
      component: options.component || 'unknown'
    };

    this.listeners.get(eventType).add(listenerInfo);

    if (this.isDebugMode) {
      console.log(`[EventBus] Subscribed to ${eventType}`, { 
        listenerId: listenerInfo.id,
        component: listenerInfo.component 
      });
    }

    // Return unsubscribe function
    return () => this.unsubscribe(eventType, listenerInfo);
  }

  /**
   * Emit an event to all subscribers
   * @param {string} eventType - The event type to emit
   * @param {any} data - The data to send with the event
   * @param {object} options - Optional configuration
   */
  emit(eventType, data = null, options = {}) {
    if (typeof eventType !== 'string') {
      throw new Error('EventBus.emit: eventType must be string');
    }

    const eventInfo = {
      type: eventType,
      data,
      timestamp: new Date(),
      source: options.source || 'unknown',
      id: this.generateEventId()
    };

    // Add to history
    this.addToHistory(eventInfo);

    if (this.isDebugMode) {
      console.log(`[EventBus] Emitting ${eventType}`, { 
        eventId: eventInfo.id,
        data: eventInfo.data,
        source: eventInfo.source 
      });
    }

    // Get listeners for this event type
    const listeners = this.listeners.get(eventType);
    if (!listeners || listeners.size === 0) {
      if (this.isDebugMode) {
        console.warn(`[EventBus] No listeners for event ${eventType}`);
      }
      return;
    }

    // Sort listeners by priority (higher priority first)
    const sortedListeners = Array.from(listeners).sort((a, b) => b.priority - a.priority);

    // Execute callbacks
    sortedListeners.forEach(listenerInfo => {
      try {
        listenerInfo.callback(eventInfo.data, eventInfo);
        
        // Remove one-time listeners
        if (listenerInfo.once) {
          listeners.delete(listenerInfo);
        }
      } catch (error) {
        console.error(`[EventBus] Error in listener for ${eventType}:`, error);
        
        // Emit error event (but prevent infinite loops)
        if (eventType !== 'system_error') {
          this.emit('system_error', {
            originalEvent: eventType,
            error: error.message,
            listenerComponent: listenerInfo.component
          });
        }
      }
    });
  }

  /**
   * Unsubscribe from an event
   * @param {string} eventType - The event type
   * @param {object} listenerInfo - The listener info object
   */
  unsubscribe(eventType, listenerInfo) {
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      listeners.delete(listenerInfo);
      
      if (this.isDebugMode) {
        console.log(`[EventBus] Unsubscribed from ${eventType}`, { 
          listenerId: listenerInfo.id,
          component: listenerInfo.component 
        });
      }

      // Clean up empty listener sets
      if (listeners.size === 0) {
        this.listeners.delete(eventType);
      }
    }
  }

  /**
   * Subscribe to an event only once
   * @param {string} eventType - The event type to listen for
   * @param {function} callback - The callback function to execute
   * @param {object} options - Optional configuration
   * @returns {function} Unsubscribe function
   */
  once(eventType, callback, options = {}) {
    return this.subscribe(eventType, callback, { ...options, once: true });
  }

  /**
   * Remove all listeners for an event type
   * @param {string} eventType - The event type to clear
   */
  removeAllListeners(eventType) {
    if (eventType) {
      this.listeners.delete(eventType);
      if (this.isDebugMode) {
        console.log(`[EventBus] Removed all listeners for ${eventType}`);
      }
    } else {
      this.listeners.clear();
      if (this.isDebugMode) {
        console.log('[EventBus] Removed all listeners');
      }
    }
  }

  /**
   * Get the number of listeners for an event type
   * @param {string} eventType - The event type
   * @returns {number} Number of listeners
   */
  getListenerCount(eventType) {
    const listeners = this.listeners.get(eventType);
    return listeners ? listeners.size : 0;
  }

  /**
   * Get all registered event types
   * @returns {string[]} Array of event types
   */
  getEventTypes() {
    return Array.from(this.listeners.keys());
  }

  /**
   * Get event history
   * @param {number} limit - Maximum number of events to return
   * @returns {object[]} Array of event objects
   */
  getEventHistory(limit = 50) {
    return this.eventHistory.slice(-limit);
  }

  /**
   * Clear event history
   */
  clearHistory() {
    this.eventHistory = [];
    if (this.isDebugMode) {
      console.log('[EventBus] Event history cleared');
    }
  }

  /**
   * Add event to history
   * @private
   */
  addToHistory(eventInfo) {
    this.eventHistory.push(eventInfo);
    
    // Maintain history size limit
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory = this.eventHistory.slice(-this.maxHistorySize);
    }
  }

  /**
   * Generate unique listener ID
   * @private
   */
  generateListenerId() {
    return `listener_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Generate unique event ID
   * @private
   */
  generateEventId() {
    return `event_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Enable or disable debug mode
   * @param {boolean} enabled - Whether to enable debug mode
   */
  setDebugMode(enabled) {
    this.isDebugMode = enabled;
    console.log(`[EventBus] Debug mode ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Get debug information
   * @returns {object} Debug information
   */
  getDebugInfo() {
    const listenerCounts = {};
    this.listeners.forEach((listeners, eventType) => {
      listenerCounts[eventType] = listeners.size;
    });

    return {
      totalEventTypes: this.listeners.size,
      listenerCounts,
      historySize: this.eventHistory.length,
      isDebugMode: this.isDebugMode
    };
  }
}

// Create singleton instance
const eventBus = new EventBus();

export default eventBus;