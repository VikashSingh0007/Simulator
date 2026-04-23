import { generateId, gaussianRandom, clamp } from '../../utils/helpers.js';
import { EVENT_TYPES } from '../../utils/constants.js';

/**
 * BaseComponent - Abstract base class for all simulated components.
 * Implements the Chain of Responsibility pattern for request flow.
 */
export class BaseComponent {
  constructor(id, config, metricsCollector) {
    this.id = id;
    this.config = { ...config };
    this.metrics = metricsCollector;
    this.downstreamIds = []; // component IDs this connects to
    this.activeRequests = 0;
    this.totalProcessed = 0;
    this.totalFailed = 0;
    this.isDown = config.isDown || false;
    this.injectedLatency = 0;
  }

  /**
   * Process an incoming event and return new events to schedule.
   * @param {Object} event - The incoming event
   * @param {number} currentTime - Current simulation time
   * @returns {Array} New events to schedule
   */
  process(event, currentTime) {
    // Check if component is down
    if (this.isDown) {
      this.totalFailed++;
      this.metrics.record(EVENT_TYPES.REQUEST_FAIL, {
        componentId: this.id,
        componentType: this.config.type,
        requestId: event.payload.requestId,
        reason: 'component_down',
        time: currentTime,
      });
      return this._createFailureEvents(event, currentTime, 'component_down');
    }

    // Check random failure rate
    if (this.config.failureRate > 0 && Math.random() < this.config.failureRate) {
      this.totalFailed++;
      this.metrics.record(EVENT_TYPES.REQUEST_FAIL, {
        componentId: this.id,
        componentType: this.config.type,
        requestId: event.payload.requestId,
        reason: 'random_failure',
        time: currentTime,
      });
      return this._createFailureEvents(event, currentTime, 'random_failure');
    }

    // Track path
    event.payload.path = [...(event.payload.path || []), this.id];
    this.activeRequests++;
    
    return this._handleRequest(event, currentTime);
  }

  /**
   * Override in subclass to handle the request.
   * @abstract
   */
  _handleRequest(event, currentTime) {
    throw new Error('_handleRequest must be implemented by subclass');
  }

  /**
   * Create events to forward request to next component(s).
   */
  _forwardToNext(event, currentTime, latency = 0) {
    this.activeRequests = Math.max(0, this.activeRequests - 1);
    this.totalProcessed++;

    const totalLatency = latency + this.injectedLatency;

    if (this.downstreamIds.length === 0) {
      // End of chain - request complete
      const endToEndLatency = (currentTime + totalLatency) - event.payload.startTime;
      this.metrics.record(EVENT_TYPES.REQUEST_COMPLETE, {
        componentId: this.id,
        requestId: event.payload.requestId,
        latency: endToEndLatency,
        path: event.payload.path,
        time: currentTime + totalLatency,
      });
      return [];
    }

    // Forward to downstream (first downstream for simple chain)
    const targetId = this.downstreamIds[0];
    return [{
      type: EVENT_TYPES.REQUEST_PROCESS,
      timestamp: currentTime + totalLatency,
      payload: { ...event.payload },
      source: this.id,
      target: targetId,
    }];
  }

  _createFailureEvents(event, currentTime, reason) {
    this.activeRequests = Math.max(0, this.activeRequests - 1);
    return [{
      type: EVENT_TYPES.REQUEST_FAIL,
      timestamp: currentTime + 1,
      payload: {
        ...event.payload,
        error: reason,
        failedAt: this.id,
      },
      source: this.id,
      target: null,
    }];
  }

  /**
   * Simulate latency with jitter (Gaussian).
   */
  _simulateLatency(baseMs, jitterFactor = 0.2) {
    const latency = gaussianRandom(baseMs, baseMs * jitterFactor);
    return clamp(latency, baseMs * 0.5, baseMs * 3);
  }

  setDown(isDown) {
    this.isDown = isDown;
  }

  setInjectedLatency(ms) {
    this.injectedLatency = ms;
  }

  updateConfig(newConfig) {
    Object.assign(this.config, newConfig);
  }

  getStats() {
    return {
      id: this.id,
      type: this.config.type,
      label: this.config.label,
      activeRequests: this.activeRequests,
      totalProcessed: this.totalProcessed,
      totalFailed: this.totalFailed,
      isDown: this.isDown,
    };
  }
}
