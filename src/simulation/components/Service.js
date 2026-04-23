import { BaseComponent } from './BaseComponent.js';
import { ThreadPool } from '../lld/ThreadPool.js';
import { CircuitBreaker } from '../lld/CircuitBreaker.js';
import { EVENT_TYPES, COMPONENT_TYPES } from '../../utils/constants.js';

/**
 * Service - Generic service with thread pool + circuit breaker.
 * Simulates concurrency, queueing, backpressure, and cascading failure protection.
 */
export class Service extends BaseComponent {
  constructor(id, config, metricsCollector) {
    super(id, { ...config, type: COMPONENT_TYPES.SERVICE }, metricsCollector);
    this.threadPool = new ThreadPool(
      config.threadPoolSize || 8,
      config.threadQueueSize || 64
    );
    this.instances = config.instances || 1;

    // Circuit breaker wraps calls to downstream
    this.circuitBreaker = new CircuitBreaker({
      failureThreshold: config.cbFailureThreshold || 5,
      recoveryTimeMs: config.cbRecoveryTimeMs || 5000,
      halfOpenMaxRequests: config.cbHalfOpenMax || 1,
      monitorWindowMs: config.cbMonitorWindow || 10000,
    });
    this.cbEnabled = config.circuitBreakerEnabled !== false; // enabled by default
  }

  _handleRequest(event, currentTime) {
    // Check circuit breaker before processing
    if (this.cbEnabled) {
      const cbResult = this.circuitBreaker.canExecute(currentTime);
      if (!cbResult.allowed) {
        this.metrics.record(EVENT_TYPES.REQUEST_FAIL, {
          componentId: this.id,
          componentType: COMPONENT_TYPES.SERVICE,
          requestId: event.payload.requestId,
          reason: `circuit_breaker_${cbResult.state.toLowerCase()}`,
          time: currentTime,
        });
        this.activeRequests = Math.max(0, this.activeRequests - 1);
        this.totalFailed++;
        return this._createFailureEvents(event, currentTime, `circuit_breaker_${cbResult.state.toLowerCase()}`);
      }
    }

    // Try to submit to thread pool
    const result = this.threadPool.submit();

    if (!result.accepted) {
      if (this.cbEnabled) this.circuitBreaker.onFailure(currentTime);
      this.metrics.record(EVENT_TYPES.REQUEST_FAIL, {
        componentId: this.id,
        componentType: COMPONENT_TYPES.SERVICE,
        requestId: event.payload.requestId,
        reason: 'thread_pool_exhausted',
        time: currentTime,
      });
      this.activeRequests = Math.max(0, this.activeRequests - 1);
      this.totalFailed++;
      return this._createFailureEvents(event, currentTime, 'thread_pool_exhausted');
    }

    let processingTime = this._simulateLatency(this.config.processingTimeMs || 20);

    if (!result.immediate) {
      processingTime += result.queuePosition * 5;
    }

    this.metrics.record(EVENT_TYPES.THREAD_ACQUIRE, {
      componentId: this.id,
      requestId: event.payload.requestId,
      immediate: result.immediate,
      queuePosition: result.queuePosition,
      time: currentTime,
    });

    this.metrics.record(EVENT_TYPES.REQUEST_PROCESS, {
      componentId: this.id,
      componentType: COMPONENT_TYPES.SERVICE,
      requestId: event.payload.requestId,
      latency: processingTime,
      threadPoolState: this.threadPool.getState(),
      time: currentTime,
    });

    this.threadPool.complete();

    this.metrics.record(EVENT_TYPES.THREAD_RELEASE, {
      componentId: this.id,
      requestId: event.payload.requestId,
      time: currentTime + processingTime,
    });

    // Record success for circuit breaker
    if (this.cbEnabled) this.circuitBreaker.onSuccess(currentTime);

    return this._forwardToNext(event, currentTime, processingTime);
  }

  getStats() {
    return {
      ...super.getStats(),
      threadPool: this.threadPool.getState(),
      instances: this.instances,
      circuitBreaker: this.cbEnabled ? this.circuitBreaker.getState() : null,
    };
  }
}
