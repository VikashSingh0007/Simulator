import { BaseComponent } from './BaseComponent.js';
import { RateLimiter } from '../lld/RateLimiter.js';
import { EVENT_TYPES, COMPONENT_TYPES } from '../../utils/constants.js';

/**
 * ApiGateway - Entry point for all requests.
 * Applies rate limiting (token bucket) and forwards to downstream.
 */
export class ApiGateway extends BaseComponent {
  constructor(id, config, metricsCollector) {
    super(id, { ...config, type: COMPONENT_TYPES.API_GATEWAY }, metricsCollector);
    this.rateLimiter = new RateLimiter(
      config.rateLimitBucketSize || 100,
      config.rateLimitRefillRate || 50
    );
  }

  _handleRequest(event, currentTime) {
    const latency = this._simulateLatency(this.config.latencyMs || 2);

    // Rate limiting
    if (this.config.rateLimitEnabled) {
      const allowed = this.rateLimiter.tryAcquire(currentTime);
      if (!allowed) {
        this.metrics.record(EVENT_TYPES.RATE_LIMIT_REJECT, {
          componentId: this.id,
          requestId: event.payload.requestId,
          time: currentTime,
        });
        this.activeRequests = Math.max(0, this.activeRequests - 1);
        this.totalFailed++;
        return [{
          type: EVENT_TYPES.REQUEST_FAIL,
          timestamp: currentTime + latency,
          payload: {
            ...event.payload,
            error: 'rate_limited',
            failedAt: this.id,
          },
          source: this.id,
          target: null,
        }];
      }
      this.metrics.record(EVENT_TYPES.RATE_LIMIT_ALLOW, {
        componentId: this.id,
        requestId: event.payload.requestId,
        time: currentTime,
      });
    }

    this.metrics.record(EVENT_TYPES.REQUEST_PROCESS, {
      componentId: this.id,
      componentType: COMPONENT_TYPES.API_GATEWAY,
      requestId: event.payload.requestId,
      latency,
      time: currentTime,
    });

    return this._forwardToNext(event, currentTime, latency);
  }

  getStats() {
    return {
      ...super.getStats(),
      rateLimiter: this.rateLimiter.getState(),
    };
  }
}
