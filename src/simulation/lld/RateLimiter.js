/**
 * RateLimiter - Token Bucket algorithm implementation.
 * Tokens are refilled continuously. Each request consumes one token.
 */
export class RateLimiter {
  constructor(bucketSize = 100, refillRate = 50) {
    this.bucketSize = bucketSize;
    this.refillRate = refillRate; // tokens per second
    this.tokens = bucketSize;
    this.lastRefillTime = 0;
    this.totalAllowed = 0;
    this.totalRejected = 0;
  }

  /**
   * Try to acquire a token.
   * @param {number} currentTime - Current simulation time (ms)
   * @returns {boolean} Whether the request is allowed
   */
  tryAcquire(currentTime) {
    this._refill(currentTime);

    if (this.tokens >= 1) {
      this.tokens -= 1;
      this.totalAllowed++;
      return true;
    }

    this.totalRejected++;
    return false;
  }

  _refill(currentTime) {
    const elapsed = (currentTime - this.lastRefillTime) / 1000; // convert to seconds
    const newTokens = elapsed * this.refillRate;
    this.tokens = Math.min(this.bucketSize, this.tokens + newTokens);
    this.lastRefillTime = currentTime;
  }

  getState() {
    return {
      bucketSize: this.bucketSize,
      refillRate: this.refillRate,
      currentTokens: Math.floor(this.tokens),
      totalAllowed: this.totalAllowed,
      totalRejected: this.totalRejected,
      rejectionRate: this.totalAllowed + this.totalRejected > 0
        ? this.totalRejected / (this.totalAllowed + this.totalRejected)
        : 0,
    };
  }

  reset() {
    this.tokens = this.bucketSize;
    this.lastRefillTime = 0;
    this.totalAllowed = 0;
    this.totalRejected = 0;
  }
}
