import { BaseComponent } from './BaseComponent.js';
import { EVENT_TYPES, COMPONENT_TYPES } from '../../utils/constants.js';

/**
 * MessageQueue - Simulates a Kafka-like message queue with topics, partitions,
 * consumer groups, retry logic, and dead letter queue.
 */
export class MessageQueue extends BaseComponent {
  constructor(id, config, metricsCollector) {
    super(id, { ...config, type: COMPONENT_TYPES.MESSAGE_QUEUE }, metricsCollector);
    this.partitions = config.partitions || 3;
    this.maxQueueSize = config.maxQueueSize || 10000;
    this.maxRetries = config.maxRetries || 3;
    
    // Partition queues
    this.queues = Array.from({ length: this.partitions }, () => []);
    this.dlq = []; // Dead letter queue
    this.totalPublished = 0;
    this.totalConsumed = 0;
    this.totalRetries = 0;
    this.totalDLQ = 0;
    this.consumerLag = 0;
    this.partitionAssignmentIndex = 0;
  }

  _handleRequest(event, currentTime) {
    // Publish to queue
    const partition = this._assignPartition(event.payload.key);
    const queue = this.queues[partition];

    // Check queue capacity
    const totalSize = this.queues.reduce((sum, q) => sum + q.length, 0);
    if (totalSize >= this.maxQueueSize) {
      this.metrics.record(EVENT_TYPES.REQUEST_FAIL, {
        componentId: this.id,
        componentType: COMPONENT_TYPES.MESSAGE_QUEUE,
        requestId: event.payload.requestId,
        reason: 'queue_full',
        time: currentTime,
      });
      this.activeRequests = Math.max(0, this.activeRequests - 1);
      this.totalFailed++;
      return this._createFailureEvents(event, currentTime, 'queue_full');
    }

    const publishLatency = this._simulateLatency(this.config.publishLatencyMs || 5);

    // Enqueue message
    queue.push({
      ...event.payload,
      publishTime: currentTime,
      partition,
      retries: event.payload.retries || 0,
    });
    this.totalPublished++;

    this.metrics.record(EVENT_TYPES.QUEUE_PUBLISH, {
      componentId: this.id,
      requestId: event.payload.requestId,
      partition,
      queueDepth: queue.length,
      time: currentTime,
    });

    // Schedule consume event
    const consumeLatency = this._simulateLatency(this.config.consumeLatencyMs || 10);
    const events = [];

    // Create consume event
    if (this.downstreamIds.length > 0) {
      const message = queue.shift();
      this.totalConsumed++;

      const consumeEvent = {
        type: EVENT_TYPES.REQUEST_PROCESS,
        timestamp: currentTime + publishLatency + consumeLatency + this.injectedLatency,
        payload: {
          ...event.payload,
          consumeTime: currentTime + publishLatency + consumeLatency,
          partition,
        },
        source: this.id,
        target: this.downstreamIds[partition % this.downstreamIds.length],
      };
      events.push(consumeEvent);

      this.metrics.record(EVENT_TYPES.QUEUE_CONSUME, {
        componentId: this.id,
        requestId: event.payload.requestId,
        partition,
        lag: currentTime - message.publishTime,
        time: currentTime + publishLatency + consumeLatency,
      });
    }

    // Update consumer lag
    this.consumerLag = this.queues.reduce((sum, q) => sum + q.length, 0);
    
    this.activeRequests = Math.max(0, this.activeRequests - 1);
    this.totalProcessed++;

    return events;
  }

  _assignPartition(key) {
    if (key) {
      // Hash-based partition assignment (deterministic for same key)
      let hash = 0;
      for (let i = 0; i < key.length; i++) {
        hash = ((hash << 5) - hash) + key.charCodeAt(i);
        hash |= 0;
      }
      return Math.abs(hash) % this.partitions;
    }
    // Round-robin
    return this.partitionAssignmentIndex++ % this.partitions;
  }

  getStats() {
    return {
      ...super.getStats(),
      partitions: this.partitions,
      queueDepths: this.queues.map(q => q.length),
      totalQueueDepth: this.queues.reduce((sum, q) => sum + q.length, 0),
      totalPublished: this.totalPublished,
      totalConsumed: this.totalConsumed,
      totalRetries: this.totalRetries,
      totalDLQ: this.totalDLQ,
      dlqSize: this.dlq.length,
      consumerLag: this.consumerLag,
    };
  }
}
