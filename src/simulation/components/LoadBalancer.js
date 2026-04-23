import { BaseComponent } from './BaseComponent.js';
import { createLoadBalancerStrategy } from '../strategies/LoadBalancerStrategy.js';
import { EVENT_TYPES, COMPONENT_TYPES } from '../../utils/constants.js';

/**
 * LoadBalancer - Routes requests to downstream services using configurable strategies.
 * Unlike BaseComponent's single-downstream forwarding, LB fans out to multiple targets.
 */
export class LoadBalancer extends BaseComponent {
  constructor(id, config, metricsCollector) {
    super(id, { ...config, type: COMPONENT_TYPES.LOAD_BALANCER }, metricsCollector);
    this.strategy = createLoadBalancerStrategy(config.strategy || 'roundRobin');
    this.activeConnections = {}; // targetId → count
    this.weights = {}; // targetId → weight
  }

  _handleRequest(event, currentTime) {
    const latency = this._simulateLatency(this.config.latencyMs || 1);

    if (this.downstreamIds.length === 0) {
      this.activeRequests = Math.max(0, this.activeRequests - 1);
      return this._createFailureEvents(event, currentTime, 'no_targets');
    }

    // Select target using strategy
    const targetId = this.strategy.select(
      this.downstreamIds,
      event.payload,
      this.weights,
      this.activeConnections
    );

    if (!targetId) {
      this.activeRequests = Math.max(0, this.activeRequests - 1);
      return this._createFailureEvents(event, currentTime, 'no_available_target');
    }

    // Track connections
    this.activeConnections[targetId] = (this.activeConnections[targetId] || 0) + 1;
    this.activeRequests = Math.max(0, this.activeRequests - 1);
    this.totalProcessed++;

    this.metrics.record(EVENT_TYPES.REQUEST_PROCESS, {
      componentId: this.id,
      componentType: COMPONENT_TYPES.LOAD_BALANCER,
      requestId: event.payload.requestId,
      targetId,
      strategy: this.config.strategy,
      latency,
      time: currentTime,
    });

    return [{
      type: EVENT_TYPES.REQUEST_PROCESS,
      timestamp: currentTime + latency + this.injectedLatency,
      payload: {
        ...event.payload,
        lbTarget: targetId,
      },
      source: this.id,
      target: targetId,
    }];
  }

  // Called when a downstream completes processing
  releaseConnection(targetId) {
    if (this.activeConnections[targetId]) {
      this.activeConnections[targetId]--;
    }
  }

  getStats() {
    return {
      ...super.getStats(),
      strategy: this.config.strategy,
      activeConnections: { ...this.activeConnections },
    };
  }
}
