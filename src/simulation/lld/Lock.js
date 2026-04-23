/**
 * Lock - Mutex simulation for shared resource access.
 * Tracks contention, wait times, and potential deadlocks.
 */
export class Lock {
  constructor(name = 'mutex') {
    this.name = name;
    this.isLocked = false;
    this.holder = null;
    this.waitQueue = [];
    this.totalAcquires = 0;
    this.totalContended = 0;
    this.totalWaitTime = 0;
    this.maxWaitTime = 0;
  }

  /**
   * Try to acquire the lock.
   * @param {string} requestId - ID of requesting entity
   * @param {number} currentTime - Current simulation time
   * @returns {{ acquired: boolean, waitTime: number }}
   */
  tryAcquire(requestId, currentTime) {
    if (!this.isLocked) {
      this.isLocked = true;
      this.holder = requestId;
      this.totalAcquires++;
      return { acquired: true, waitTime: 0 };
    }

    // Contention - add to wait queue
    this.totalContended++;
    const waitEntry = { requestId, enqueueTime: currentTime };
    this.waitQueue.push(waitEntry);
    
    // Simulated wait time based on queue position
    const estimatedWait = this.waitQueue.length * 5; // 5ms per waiter
    return { acquired: false, waitTime: estimatedWait };
  }

  /**
   * Release the lock.
   * @returns {{ nextHolder: string|null }}
   */
  release() {
    if (this.waitQueue.length > 0) {
      const next = this.waitQueue.shift();
      this.holder = next.requestId;
      this.totalAcquires++;
      return { nextHolder: next.requestId };
    }

    this.isLocked = false;
    this.holder = null;
    return { nextHolder: null };
  }

  getState() {
    return {
      name: this.name,
      isLocked: this.isLocked,
      holder: this.holder,
      queueLength: this.waitQueue.length,
      totalAcquires: this.totalAcquires,
      totalContended: this.totalContended,
      contentionRate: this.totalAcquires > 0
        ? this.totalContended / (this.totalContended + this.totalAcquires)
        : 0,
    };
  }

  reset() {
    this.isLocked = false;
    this.holder = null;
    this.waitQueue = [];
    this.totalAcquires = 0;
    this.totalContended = 0;
    this.totalWaitTime = 0;
    this.maxWaitTime = 0;
  }
}
