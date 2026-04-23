import { create } from 'zustand';

/**
 * Metrics Store - Stores time-series metrics data for the dashboard.
 */
const useMetricsStore = create((set, get) => ({
  currentSnapshot: null,
  timeSeries: [],
  requestPaths: [],
  
  // Cached latest values to avoid infinite re-renders
  latestP50: 0,
  latestP95: 0,
  latestP99: 0,
  latestAvg: 0,
  latestThroughput: 0,
  latestErrorRate: 0,
  latestCacheHitRate: 0,
  latestCacheHits: 0,
  latestCacheMisses: 0,
  latestTotalCompleted: 0,
  latestTotalFailed: 0,

  // Update with a new snapshot from the simulation engine
  addSnapshot: (snapshot) => {
    set((state) => {
      const newTimeSeries = [...state.timeSeries, {
        time: snapshot.time,
        p50: snapshot.latency.p50,
        p95: snapshot.latency.p95,
        p99: snapshot.latency.p99,
        avg: snapshot.latency.avg,
        throughput: snapshot.throughput,
        errorRate: snapshot.errorRate * 100,
        cacheHitRate: snapshot.cache.hitRate * 100,
        cacheHits: snapshot.cache.hits,
        cacheMisses: snapshot.cache.misses,
        queueLag: snapshot.queue.lag,
        threadActive: snapshot.threads.active,
      }].slice(-120);

      return {
        currentSnapshot: snapshot,
        timeSeries: newTimeSeries,
        requestPaths: snapshot.recentPaths || state.requestPaths,
        latestP50: snapshot.latency.p50,
        latestP95: snapshot.latency.p95,
        latestP99: snapshot.latency.p99,
        latestAvg: snapshot.latency.avg,
        latestThroughput: snapshot.throughput,
        latestErrorRate: snapshot.errorRate * 100,
        latestCacheHitRate: snapshot.cache.hitRate * 100,
        latestCacheHits: snapshot.cache.hits,
        latestCacheMisses: snapshot.cache.misses,
        latestTotalCompleted: snapshot.totalCompleted,
        latestTotalFailed: snapshot.totalFailed,
      };
    });
  },

  // Reset metrics
  resetMetrics: () => {
    set({
      currentSnapshot: null,
      timeSeries: [],
      requestPaths: [],
      latestP50: 0, latestP95: 0, latestP99: 0, latestAvg: 0,
      latestThroughput: 0, latestErrorRate: 0,
      latestCacheHitRate: 0, latestCacheHits: 0, latestCacheMisses: 0,
      latestTotalCompleted: 0, latestTotalFailed: 0,
    });
  },
}));

export default useMetricsStore;
