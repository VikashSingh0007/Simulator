import { sortedInsert, percentile } from '../../utils/helpers.js';
import { EVENT_TYPES } from '../../utils/constants.js';

/**
 * MetricsCollector - Observer Pattern for collecting and aggregating metrics.
 * Components emit events; the collector subscribes and produces time-series data.
 */
export class MetricsCollector {
  constructor() {
    this.reset();
  }

  reset() {
    this.latencies = [];
    this.requestTimes = []; // timestamps of completed requests
    this.errors = [];
    this.cacheHits = 0;
    this.cacheMisses = 0;
    this.rateLimitAllowed = 0;
    this.rateLimitRejected = 0;
    this.totalRequests = 0;
    this.totalCompleted = 0;
    this.totalFailed = 0;
    this.componentMetrics = {};
    this.timeSeries = [];
    this.lastSnapshotTime = 0;
    this.requestPaths = []; // Recent request paths for timeline view
    this.queuePublished = 0;
    this.queueConsumed = 0;
    this.threadAcquires = 0;
    this.threadReleases = 0;
    this.dbQueries = 0;
    this.dbIndexedQueries = 0;
    this.dbFullScanQueries = 0;
    this.windowLatencies = []; // Latencies in current time window
    this.windowStartTime = 0;
    this.windowSize = 1000; // 1 second windows
  }

  /**
   * Record a metric event.
   * @param {string} eventType - Type of event from EVENT_TYPES
   * @param {Object} data - Event data
   */
  record(eventType, data) {

    // Initialize component metrics
    if (data.componentId && !this.componentMetrics[data.componentId]) {
      this.componentMetrics[data.componentId] = {
        type: data.componentType || 'unknown',
        processed: 0,
        failed: 0,
        latencies: [],
        lastActivity: 0,
      };
    }

    switch (eventType) {
      case EVENT_TYPES.REQUEST_COMPLETE: {
        this.totalCompleted++;
        sortedInsert(this.latencies, data.latency);
        sortedInsert(this.windowLatencies, data.latency);
        this.requestTimes.push(data.time);
        
        // Store recent paths for timeline
        if (this.requestPaths.length < 100) {
          this.requestPaths.push({
            requestId: data.requestId,
            path: data.path,
            latency: data.latency,
            time: data.time,
            cacheHit: data.cacheHit || false,
          });
        }

        if (data.componentId && this.componentMetrics[data.componentId]) {
          this.componentMetrics[data.componentId].processed++;
          sortedInsert(this.componentMetrics[data.componentId].latencies, data.latency);
          this.componentMetrics[data.componentId].lastActivity = data.time;
        }
        break;
      }

      case EVENT_TYPES.REQUEST_FAIL: {
        this.totalFailed++;
        this.errors.push({
          requestId: data.requestId,
          reason: data.reason,
          componentId: data.componentId,
          time: data.time,
        });
        if (data.componentId && this.componentMetrics[data.componentId]) {
          this.componentMetrics[data.componentId].failed++;
        }
        break;
      }

      case EVENT_TYPES.REQUEST_PROCESS: {
        if (data.componentId && this.componentMetrics[data.componentId]) {
          this.componentMetrics[data.componentId].processed++;
          this.componentMetrics[data.componentId].lastActivity = data.time;
          if (data.latency) {
            sortedInsert(this.componentMetrics[data.componentId].latencies, data.latency);
          }
        }
        break;
      }

      case EVENT_TYPES.CACHE_HIT:
        this.cacheHits++;
        break;
      case EVENT_TYPES.CACHE_MISS:
        this.cacheMisses++;
        break;
      case EVENT_TYPES.RATE_LIMIT_ALLOW:
        this.rateLimitAllowed++;
        break;
      case EVENT_TYPES.RATE_LIMIT_REJECT:
        this.rateLimitRejected++;
        break;
      case EVENT_TYPES.QUEUE_PUBLISH:
        this.queuePublished++;
        break;
      case EVENT_TYPES.QUEUE_CONSUME:
        this.queueConsumed++;
        break;
      case EVENT_TYPES.THREAD_ACQUIRE:
        this.threadAcquires++;
        break;
      case EVENT_TYPES.THREAD_RELEASE:
        this.threadReleases++;
        break;
      case EVENT_TYPES.DB_QUERY:
        this.dbQueries++;
        if (data.queryType === 'indexed') this.dbIndexedQueries++;
        else this.dbFullScanQueries++;
        break;
    }
  }

  /**
   * Generate a snapshot of current metrics for the dashboard.
   * @param {number} currentTime - Current simulation time in ms
   */
  snapshot(currentTime) {
    // Sliding window throughput (last 1 second of simulation time)
    const windowStart = currentTime - 1000;
    const recentRequests = this.requestTimes.filter(t => t >= windowStart);
    const throughput = recentRequests.length;

    // Reset window latencies periodically
    if (currentTime - this.windowStartTime >= this.windowSize) {
      this.windowLatencies = [];
      this.windowStartTime = currentTime;
    }

    const snap = {
      time: currentTime / 1000, // Convert to seconds for chart
      latency: {
        p50: percentile(this.latencies, 50),
        p95: percentile(this.latencies, 95),
        p99: percentile(this.latencies, 99),
        avg: this.latencies.length > 0
          ? this.latencies.reduce((a, b) => a + b, 0) / this.latencies.length
          : 0,
      },
      throughput,
      errorRate: this.totalCompleted + this.totalFailed > 0
        ? this.totalFailed / (this.totalCompleted + this.totalFailed)
        : 0,
      totalCompleted: this.totalCompleted,
      totalFailed: this.totalFailed,
      cache: {
        hits: this.cacheHits,
        misses: this.cacheMisses,
        hitRate: (this.cacheHits + this.cacheMisses) > 0
          ? this.cacheHits / (this.cacheHits + this.cacheMisses)
          : 0,
      },
      rateLimiter: {
        allowed: this.rateLimitAllowed,
        rejected: this.rateLimitRejected,
      },
      queue: {
        published: this.queuePublished,
        consumed: this.queueConsumed,
        lag: this.queuePublished - this.queueConsumed,
      },
      threads: {
        acquires: this.threadAcquires,
        releases: this.threadReleases,
        active: this.threadAcquires - this.threadReleases,
      },
      db: {
        queries: this.dbQueries,
        indexed: this.dbIndexedQueries,
        fullScan: this.dbFullScanQueries,
      },
      recentPaths: this.requestPaths.slice(-20),
    };

    this.timeSeries.push(snap);
    // Keep last 120 data points (2 min at 1/sec)
    if (this.timeSeries.length > 120) {
      this.timeSeries = this.timeSeries.slice(-120);
    }

    return snap;
  }

  getTimeSeries() {
    return this.timeSeries;
  }
}
