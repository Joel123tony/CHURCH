let waitPromise = null;
let resolveWait = null;

class BackendStateManager {
  constructor() {
    this.status = 'checking'; // 'checking', 'ready', 'error'
    this.subscribers = new Set();
  }

  setStatus(newStatus) {
    if (this.status === newStatus) return;
    this.status = newStatus;
    
    // Resolve the promise if we transition to ready
    if (newStatus === 'ready' && resolveWait) {
      resolveWait();
      waitPromise = null;
      resolveWait = null;
    }

    // Notify React components
    this.subscribers.forEach(fn => fn(newStatus));
  }

  getStatus() {
    return this.status;
  }

  subscribe(fn) {
    this.subscribers.add(fn);
    return () => {
      this.subscribers.delete(fn);
    };
  }
}

export const backendState = new BackendStateManager();

/**
 * Returns a Promise that resolves when the backend is ready.
 * Axios request interceptors should await this function.
 */
export const waitForBackend = () => {
  if (backendState.getStatus() === 'ready') {
    return Promise.resolve();
  }
  
  if (!waitPromise) {
    waitPromise = new Promise((resolve) => {
      resolveWait = resolve;
    });
  }
  
  return waitPromise;
};
