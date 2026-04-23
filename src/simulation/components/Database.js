import { BaseComponent } from './BaseComponent.js';
import { Lock } from '../lld/Lock.js';
import { EVENT_TYPES, COMPONENT_TYPES } from '../../utils/constants.js';

/**
 * Database - Simulates a database with connection pooling, indexed vs full scans, and locking.
 */
export class Database extends BaseComponent {
  constructor(id, config, metricsCollector) {
    super(id, { ...config, type: COMPONENT_TYPES.DATABASE }, metricsCollector);
    this.maxConnections = config.maxConnections || 50;
    this.activeConnections = 0;
    this.connectionQueue = [];
    this.queryCount = 0;
    this.indexedQueries = 0;
    this.fullScanQueries = 0;
    this.totalQueryTime = 0;
    this.writeLock = new Lock('db_write_lock');
  }

  _handleRequest(event, currentTime) {
    const isWrite = event.payload.type === 'write';

    // Connection pool check
    if (this.activeConnections >= this.maxConnections) {
      // Queue the request
      this.connectionQueue.push(event);
      this.metrics.record(EVENT_TYPES.REQUEST_ENQUEUE, {
        componentId: this.id,
        requestId: event.payload.requestId,
        queueLength: this.connectionQueue.length,
        time: currentTime,
      });
      
      // Simulate wait time based on queue position
      const waitTime = this.connectionQueue.length * 10;
      if (waitTime > 5000) {
        // Timeout
        this.activeRequests = Math.max(0, this.activeRequests - 1);
        this.totalFailed++;
        return this._createFailureEvents(event, currentTime, 'connection_pool_exhausted');
      }
      return [];
    }

    this.activeConnections++;

    // Determine query type: indexed or full scan
    const useIndex = Math.random() < (this.config.indexHitRate || 0.8);
    const baseLatency = useIndex
      ? (this.config.indexedQueryLatencyMs || 10)
      : (this.config.fullScanLatencyMs || 200);

    let latency = this._simulateLatency(baseLatency);

    if (useIndex) this.indexedQueries++;
    else this.fullScanQueries++;

    // Lock for writes
    let lockWait = 0;
    if (isWrite) {
      const lockResult = this.writeLock.tryAcquire(event.payload.requestId, currentTime);
      if (!lockResult.acquired) {
        lockWait = lockResult.waitTime;
      }
    }

    latency += lockWait;
    this.queryCount++;
    this.totalQueryTime += latency;

    this.metrics.record(EVENT_TYPES.DB_QUERY, {
      componentId: this.id,
      requestId: event.payload.requestId,
      queryType: useIndex ? 'indexed' : 'full_scan',
      isWrite,
      latency,
      lockWait,
      activeConnections: this.activeConnections,
      time: currentTime,
    });

    // Schedule completion
    const self = this;
    setTimeout(() => {
      self.activeConnections = Math.max(0, self.activeConnections - 1);
      if (isWrite) self.writeLock.release();
      // Process queued requests
      if (self.connectionQueue.length > 0) {
        self.connectionQueue.shift();
      }
    }, 0);

    // If request came through a cache miss, fill the cache
    if (event.payload.cacheOnReturn) {
      // The cache would be filled by the engine
    }

    // DB is typically a leaf node - complete the request
    this.activeRequests = Math.max(0, this.activeRequests - 1);
    this.totalProcessed++;

    const endToEndLatency = (currentTime + latency) - event.payload.startTime;
    this.metrics.record(EVENT_TYPES.REQUEST_COMPLETE, {
      componentId: this.id,
      requestId: event.payload.requestId,
      latency: endToEndLatency,
      path: event.payload.path,
      time: currentTime + latency,
    });

    this.metrics.record(EVENT_TYPES.DB_QUERY_COMPLETE, {
      componentId: this.id,
      requestId: event.payload.requestId,
      latency,
      time: currentTime + latency,
    });

    return [];
  }

  getStats() {
    return {
      ...super.getStats(),
      activeConnections: this.activeConnections,
      maxConnections: this.maxConnections,
      queueLength: this.connectionQueue.length,
      queryCount: this.queryCount,
      indexedQueries: this.indexedQueries,
      fullScanQueries: this.fullScanQueries,
      avgQueryTime: this.queryCount > 0 ? this.totalQueryTime / this.queryCount : 0,
      connectionUtilization: this.activeConnections / this.maxConnections,
      writeLock: this.writeLock.getState(),
    };
  }
}
