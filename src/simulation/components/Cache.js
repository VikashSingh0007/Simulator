import { BaseComponent } from './BaseComponent.js';
import { createCacheStrategy } from '../strategies/CacheStrategy.js';
import { EVENT_TYPES, COMPONENT_TYPES } from '../../utils/constants.js';

/**
 * Cache - Simulates a caching layer with real LRU/LFU eviction.
 * Cache hit → fast response. Cache miss → forward to downstream (e.g., DB).
 */
export class Cache extends BaseComponent {
  constructor(id, config, metricsCollector) {
    super(id, { ...config, type: COMPONENT_TYPES.CACHE }, metricsCollector);
    this.cache = createCacheStrategy(config.strategy || 'lru', config.capacity || 1000);
  }

  _handleRequest(event, currentTime) {
    const key = event.payload.key;
    const isWrite = event.payload.type === 'write';

    if (isWrite) {
      // Writes always go through to downstream, but update cache
      this.cache.put(key, { time: currentTime });
      const latency = this._simulateLatency(this.config.hitLatencyMs || 2);

      this.metrics.record(EVENT_TYPES.REQUEST_PROCESS, {
        componentId: this.id,
        componentType: COMPONENT_TYPES.CACHE,
        requestId: event.payload.requestId,
        operation: 'write',
        time: currentTime,
      });

      return this._forwardToNext(event, currentTime, latency);
    }

    // Read - check cache
    const cached = this.cache.get(key);

    if (cached !== null) {
      // Cache HIT
      const latency = this._simulateLatency(this.config.hitLatencyMs || 2);
      
      this.metrics.record(EVENT_TYPES.CACHE_HIT, {
        componentId: this.id,
        requestId: event.payload.requestId,
        key,
        time: currentTime,
      });

      this.activeRequests = Math.max(0, this.activeRequests - 1);
      this.totalProcessed++;

      // Complete the request right here (no need to go to DB)
      const endToEndLatency = (currentTime + latency) - event.payload.startTime;
      this.metrics.record(EVENT_TYPES.REQUEST_COMPLETE, {
        componentId: this.id,
        requestId: event.payload.requestId,
        latency: endToEndLatency,
        path: event.payload.path,
        time: currentTime + latency,
        cacheHit: true,
      });

      return [];
    }

    // Cache MISS - forward to downstream
    this.metrics.record(EVENT_TYPES.CACHE_MISS, {
      componentId: this.id,
      requestId: event.payload.requestId,
      key,
      time: currentTime,
    });

    // After downstream processes, we'll cache the result
    // Attach a flag so we know to cache on the way back
    event.payload.cacheOnReturn = true;
    event.payload.cacheComponentId = this.id;

    const latency = this._simulateLatency(this.config.missLatencyMs || 0);
    return this._forwardToNext(event, currentTime, latency);
  }

  // Called to fill cache after a miss followed by DB read
  fillCache(key, value) {
    const evicted = this.cache.put(key, value);
    if (evicted) {
      this.metrics.record(EVENT_TYPES.CACHE_EVICT, {
        componentId: this.id,
        evictedKey: evicted,
      });
    }
  }

  getStats() {
    return {
      ...super.getStats(),
      cacheState: this.cache.getState(),
    };
  }
}
