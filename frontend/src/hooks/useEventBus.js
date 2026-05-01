import { useEffect, useRef } from 'react';

// Simple event bus implementation for component communication
class EventBus {
  constructor() {
    this.events = {};
  }

  subscribe(eventName, callback) {
    if (!this.events[eventName]) {
      this.events[eventName] = [];
    }
    this.events[eventName].push(callback);

    // Return unsubscribe function
    return () => {
      this.events[eventName] = this.events[eventName].filter(cb => cb !== callback);
    };
  }

  emit(eventName, data) {
    if (this.events[eventName]) {
      this.events[eventName].forEach(callback => callback(data));
    }
  }

  unsubscribe(eventName, callback) {
    if (this.events[eventName]) {
      this.events[eventName] = this.events[eventName].filter(cb => cb !== callback);
    }
  }

  clear() {
    this.events = {};
  }
}

// Global event bus instance
const globalEventBus = new EventBus();

export const useEventBus = (namespace = 'global') => {
  const eventBusRef = useRef(globalEventBus);

  const subscribe = (eventName, callback) => {
    const fullEventName = namespace ? `${namespace}:${eventName}` : eventName;
    return eventBusRef.current.subscribe(fullEventName, callback);
  };

  const emit = (eventName, data) => {
    const fullEventName = namespace ? `${namespace}:${eventName}` : eventName;
    eventBusRef.current.emit(fullEventName, data);
  };

  const unsubscribe = (eventName, callback) => {
    const fullEventName = namespace ? `${namespace}:${eventName}` : eventName;
    eventBusRef.current.unsubscribe(fullEventName, callback);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Optional: Clear namespace events on unmount
      // This is commented out to allow cross-component communication
      // eventBusRef.current.clear();
    };
  }, []);

  return {
    subscribe,
    emit,
    unsubscribe,
    eventBus: eventBusRef.current
  };
};

export default useEventBus;