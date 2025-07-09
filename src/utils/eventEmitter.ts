// Simple browser-compatible event emitter
export class EventEmitter {
  private events: { [key: string]: Function[] } = {};

  on(event: string, callback: Function) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
    return this;
  }

  off(event: string, callback: Function) {
    if (!this.events[event]) return this;
    this.events[event] = this.events[event].filter(cb => cb !== callback);
    return this;
  }

  emit(event: string, data?: any) {
  console.log(`[EventEmitter] Emitting ${event} with data:`, data);
  if (!this.events[event]) {
    console.log(`[EventEmitter] No listeners for ${event}`);
    return this;
  }
  console.log(`[EventEmitter] Found ${this.events[event].length} listeners for ${event}`);
   
    const errors: Error[] = [];
    this.events[event].forEach(callback => {
      try {
        // Ensure data is an object with default values
        const safeData = data && typeof data === 'object' ? data : {
          players: [],
          status: 'waiting',
          mode: 'single'
        };
        callback(safeData);
      } catch (error) {
        errors.push(error instanceof Error ? error : new Error(String(error)));
      }
    });

    // Log errors but don't throw to prevent event chain from breaking
    if (errors.length > 0) {
      console.error(`Errors in event handlers for "${event}":`, errors);
    }

    return this;
  }

  once(event: string, callback: Function) {
    const onceCallback = (...args: any[]) => {
      this.off(event, onceCallback);
      try {
        callback.apply(this, args);
      } catch (error) {
        console.error(`Error in once event handler for "${event}":`, 
          error instanceof Error ? error : new Error(String(error))
        );
      }
    };
    return this.on(event, onceCallback);
  }

  removeAllListeners(event?: string) {
    if (event) {
      this.events[event] = [];
    } else {
      this.events = {};
    }
    return this;
  }
}