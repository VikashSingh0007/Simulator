
/**
 * CircuitBreaker - Implements the Circuit Breaker pattern.
 * 
 * States:
 *   CLOSED   → Normal operation. Requests pass through. Failures are counted.
 *   OPEN     → Too many failures. All requests rejected immediately. Timer starts.
 *   HALF_OPEN → After timeout, allows a single probe request to test recovery.
 *
 * This is a critical production pattern used by Netflix Hystrix, resilience4j, etc.
 * It prevents cascading failures by "fast-failing" when a downstream is unhealthy.
 */
export const CB_STATES = {
  CLOSED: 'CLOSED',
  OPEN: 'OPEN',
  HALF_OPEN: 'HALF_OPEN',
};

export class CircuitBreaker {
  constructor(config = {}) {
    this.failureThreshold = config.failureThreshold || 5;     // failures before opening
    this.recoveryTimeMs = config.recoveryTimeMs || 5000;      // time before trying half-open
    this.halfOpenMaxRequests = config.halfOpenMaxRequests || 1; // probes allowed in half-open
    this.monitorWindowMs = config.monitorWindowMs || 10000;    // sliding window for failure count
    
    this.state = CB_STATES.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.halfOpenAttempts = 0;
    this.lastStateChange = 0;
    this.openedAt = 0;
    this.totalTrips = 0;            // how many times it opened
    this.totalRejected = 0;         // requests rejected while open
    this.stateHistory = [];         // for visualization timeline
    this.recentFailures = [];       // timestamps of recent failures
  }

  /**
   * Check if a request should be allowed through.
   * @param {number} currentTime - Current simulation time in ms
   * @returns {{ allowed: boolean, state: string }}
   */
  canExecute(currentTime) {
    switch (this.state) {
      case CB_STATES.CLOSED:
        return { allowed: true, state: this.state };

      case CB_STATES.OPEN:
        // Check if recovery timeout has elapsed
        if (currentTime - this.openedAt >= this.recoveryTimeMs) {
          this._transitionTo(CB_STATES.HALF_OPEN, currentTime);
          this.halfOpenAttempts = 0;
          return { allowed: true, state: this.state };
        }
        this.totalRejected++;
        return { allowed: false, state: this.state };

      case CB_STATES.HALF_OPEN:
        if (this.halfOpenAttempts < this.halfOpenMaxRequests) {
          this.halfOpenAttempts++;
          return { allowed: true, state: this.state };
        }
        this.totalRejected++;
        return { allowed: false, state: this.state };

      default:
        return { allowed: true, state: this.state };
    }
  }

  /**
   * Record a successful request.
   */
  onSuccess(currentTime) {
    this.successCount++;
    switch (this.state) {
      case CB_STATES.HALF_OPEN:
        // Success in half-open → close the circuit
        this._transitionTo(CB_STATES.CLOSED, currentTime);
        this.failureCount = 0;
        this.recentFailures = [];
        break;
      case CB_STATES.CLOSED:
        // Reset failure count on success in closed state
        // (sliding window - remove old failures)
        this.recentFailures = this.recentFailures.filter(
          t => currentTime - t < this.monitorWindowMs
        );
        this.failureCount = this.recentFailures.length;
        break;
    }
  }

  /**
   * Record a failed request.
   */
  onFailure(currentTime) {
    this.failureCount++;
    this.recentFailures.push(currentTime);

    // Sliding window cleanup
    this.recentFailures = this.recentFailures.filter(
      t => currentTime - t < this.monitorWindowMs
    );

    switch (this.state) {
      case CB_STATES.CLOSED:
        if (this.recentFailures.length >= this.failureThreshold) {
          this._transitionTo(CB_STATES.OPEN, currentTime);
          this.openedAt = currentTime;
          this.totalTrips++;
        }
        break;
      case CB_STATES.HALF_OPEN:
        // Failure in half-open → re-open
        this._transitionTo(CB_STATES.OPEN, currentTime);
        this.openedAt = currentTime;
        this.totalTrips++;
        break;
    }
  }

  _transitionTo(newState, currentTime) {
    this.stateHistory.push({
      from: this.state,
      to: newState,
      time: currentTime,
    });
    // Keep history bounded
    if (this.stateHistory.length > 50) {
      this.stateHistory = this.stateHistory.slice(-50);
    }
    this.state = newState;
    this.lastStateChange = currentTime;
  }

  getState() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      totalTrips: this.totalTrips,
      totalRejected: this.totalRejected,
      failureThreshold: this.failureThreshold,
      recoveryTimeMs: this.recoveryTimeMs,
      recentFailures: this.recentFailures.length,
      stateHistory: this.stateHistory.slice(-10),
    };
  }

  reset() {
    this.state = CB_STATES.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.halfOpenAttempts = 0;
    this.openedAt = 0;
    this.totalTrips = 0;
    this.totalRejected = 0;
    this.stateHistory = [];
    this.recentFailures = [];
  }
}
