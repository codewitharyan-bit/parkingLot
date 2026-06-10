/**
 * Concurrency utilities for handling simultaneous vehicle operations
 */

/**
 * Semaphore for controlling concurrent access to resources
 */
export class Semaphore {
  private permits: number;
  private waiting: Array<() => void> = [];

  constructor(permits: number) {
    this.permits = permits;
  }

  async acquire(): Promise<void> {
    if (this.permits > 0) {
      this.permits--;
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      this.waiting.push(resolve);
    });
  }

  release(): void {
    this.permits++;
    const next = this.waiting.shift();
    if (next) {
      this.permits--;
      next();
    }
  }
}

/**
 * Mutex (Mutual Exclusion) for ensuring exclusive access
 */
export class Mutex {
  private semaphore: Semaphore;

  constructor() {
    this.semaphore = new Semaphore(1);
  }

  async lock(): Promise<void> {
    await this.semaphore.acquire();
  }

  unlock(): void {
    this.semaphore.release();
  }

  async runExclusive<T>(callback: () => Promise<T>): Promise<T> {
    await this.lock();
    try {
      return await callback();
    } finally {
      this.unlock();
    }
  }
}

/**
 * Read-Write Lock for optimizing concurrent reads
 */
export class ReadWriteLock {
  private readers: number = 0;
  private writers: number = 0;
  private readWaiters: number = 0;
  private writeWaiters: number = 0;
  private readQueue: Array<() => void> = [];
  private writeQueue: Array<() => void> = [];

  async acquireRead(): Promise<void> {
    if (this.writers === 0 && this.writeWaiters === 0) {
      this.readers++;
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      this.readWaiters++;
      this.readQueue.push(() => {
        this.readWaiters--;
        this.readers++;
        resolve();
      });
    });
  }

  releaseRead(): void {
    this.readers--;
    if (this.readers === 0) {
      this.processWriteWaiters();
    }
  }

  async acquireWrite(): Promise<void> {
    if (this.readers === 0 && this.writers === 0) {
      this.writers++;
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      this.writeWaiters++;
      this.writeQueue.push(() => {
        this.writeWaiters--;
        this.writers++;
        resolve();
      });
    });
  }

  releaseWrite(): void {
    this.writers--;
    if (this.writeWaiters > 0) {
      this.processWriteWaiters();
    } else {
      this.processReadWaiters();
    }
  }

  private processWriteWaiters(): void {
    if (this.writeQueue.length > 0) {
      const callback = this.writeQueue.shift();
      callback?.();
    } else {
      this.processReadWaiters();
    }
  }

  private processReadWaiters(): void {
    while (this.readQueue.length > 0) {
      const callback = this.readQueue.shift();
      callback?.();
    }
  }

  async runExclusiveWrite<T>(callback: () => Promise<T>): Promise<T> {
    await this.acquireWrite();
    try {
      return await callback();
    } finally {
      this.releaseWrite();
    }
  }

  async runSharedRead<T>(callback: () => Promise<T>): Promise<T> {
    await this.acquireRead();
    try {
      return await callback();
    } finally {
      this.releaseRead();
    }
  }
}
