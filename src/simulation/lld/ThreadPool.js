/**
 * ThreadPool - Simulates a fixed-size thread pool with task queue.
 * Tracks: active threads, queued tasks, rejected tasks, context switching.
 */
export class ThreadPool {
  constructor(poolSize = 8, queueSize = 64) {
    this.poolSize = poolSize;
    this.queueSize = queueSize;
    this.activeThreads = 0;
    this.queue = [];
    this.totalExecuted = 0;
    this.totalRejected = 0;
    this.totalQueued = 0;
    this.contextSwitches = 0;
    this.threadStates = new Array(poolSize).fill('idle'); // 'idle', 'busy', 'waiting'
  }

  /**
   * Submit a task to the thread pool.
   * @returns {{ accepted: boolean, queuePosition?: number, immediate: boolean }}
   */
  submit() {
    if (this.activeThreads < this.poolSize) {
      // Direct execution
      this.activeThreads++;
      const threadIdx = this.threadStates.indexOf('idle');
      if (threadIdx >= 0) this.threadStates[threadIdx] = 'busy';
      return { accepted: true, immediate: true, threadIdx };
    }

    if (this.queue.length < this.queueSize) {
      // Queued
      this.queue.push(Date.now());
      this.totalQueued++;
      return { accepted: true, immediate: false, queuePosition: this.queue.length };
    }

    // Rejected (backpressure)
    this.totalRejected++;
    return { accepted: false, immediate: false };
  }

  /**
   * Complete a task, potentially picking up a queued task.
   * @returns {{ nextTask: boolean }}
   */
  complete() {
    this.totalExecuted++;

    if (this.queue.length > 0) {
      // Pick up next queued task
      this.queue.shift();
      this.contextSwitches++;
      return { nextTask: true };
    }

    this.activeThreads = Math.max(0, this.activeThreads - 1);
    const busyIdx = this.threadStates.lastIndexOf('busy');
    if (busyIdx >= 0) this.threadStates[busyIdx] = 'idle';
    return { nextTask: false };
  }

  getState() {
    return {
      poolSize: this.poolSize,
      queueSize: this.queueSize,
      activeThreads: this.activeThreads,
      queueLength: this.queue.length,
      totalExecuted: this.totalExecuted,
      totalRejected: this.totalRejected,
      totalQueued: this.totalQueued,
      contextSwitches: this.contextSwitches,
      utilization: this.activeThreads / this.poolSize,
      threadStates: [...this.threadStates],
    };
  }

  reset() {
    this.activeThreads = 0;
    this.queue = [];
    this.totalExecuted = 0;
    this.totalRejected = 0;
    this.totalQueued = 0;
    this.contextSwitches = 0;
    this.threadStates = new Array(this.poolSize).fill('idle');
  }
}
