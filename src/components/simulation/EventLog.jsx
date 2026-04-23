import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Terminal, Pause, Play, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import useSimulationStore from '../../store/useSimulationStore';
import useMetricsStore from '../../store/useMetricsStore';

const EVENT_COLORS = {
  success: '#22c55e',
  error: '#ef4444',
  cache_hit: '#fbbf24',
  rate_limit: '#f43f5e',
  circuit_breaker: '#ec4899',
  info: '#94a3b8',
  throughput: '#06b6d4',
};

export default function EventLog({ collapsed, onToggle }) {
  const [logs, setLogs] = useState([]);
  const [paused, setPaused] = useState(false);
  const logRef = useRef(null);
  const prevStatsRef = useRef({});
  const logIdRef = useRef(0);
  const maxLogs = 150;

  const status = useSimulationStore((s) => s.status);
  const componentStats = useSimulationStore((s) => s.componentStats);
  const virtualTime = useSimulationStore((s) => s.virtualTime);
  const latestThroughput = useMetricsStore((s) => s.latestThroughput);
  const latestP50 = useMetricsStore((s) => s.latestP50);
  const latestErrorRate = useMetricsStore((s) => s.latestErrorRate);
  const latestCacheHitRate = useMetricsStore((s) => s.latestCacheHitRate);

  // Generate log entries from stat diffs
  useEffect(() => {
    if (paused || status !== 'running') return;

    const newLogs = [];
    const time = (virtualTime / 1000).toFixed(2);

    for (const [id, stats] of Object.entries(componentStats)) {
      const prev = prevStatsRef.current[id] || {};
      const label = stats.label || id;

      // New failures
      const newFails = (stats.totalFailed || 0) - (prev.totalFailed || 0);
      if (newFails > 0) {
        newLogs.push({
          id: logIdRef.current++,
          time,
          msg: `❌ ${newFails} failed`,
          detail: `@ ${label}`,
          color: EVENT_COLORS.error,
        });
      }

      // Circuit breaker state changes
      const prevCB = prev.circuitBreaker?.state;
      const currCB = stats.circuitBreaker?.state;
      if (currCB && prevCB && currCB !== prevCB) {
        const icon = currCB === 'OPEN' ? '⚡' : currCB === 'CLOSED' ? '✅' : '⏳';
        newLogs.push({
          id: logIdRef.current++,
          time,
          msg: `${icon} Circuit Breaker → ${currCB}`,
          detail: `@ ${label}`,
          color: EVENT_COLORS.circuit_breaker,
        });
      }

      // Cache hit rate changes
      if (stats.cacheState && prev.cacheState) {
        const newHits = (stats.cacheState.hits || 0) - (prev.cacheState?.hits || 0);
        const newMisses = (stats.cacheState.misses || 0) - (prev.cacheState?.misses || 0);
        if (newHits + newMisses > 50 && newHits > 0) {
          newLogs.push({
            id: logIdRef.current++,
            time,
            msg: `💾 Cache: ${newHits} hits, ${newMisses} misses`,
            detail: `rate ${(stats.cacheState.hitRate * 100).toFixed(1)}%`,
            color: EVENT_COLORS.cache_hit,
          });
        }
      }

      // Rate limiter rejections
      if (stats.rateLimiter) {
        const newRejected = (stats.rateLimiter.totalRejected || 0) - (prev.rateLimiter?.totalRejected || 0);
        if (newRejected > 10) {
          newLogs.push({
            id: logIdRef.current++,
            time,
            msg: `🚫 ${newRejected} rate-limited`,
            detail: `@ ${label}`,
            color: EVENT_COLORS.rate_limit,
          });
        }
      }

      // Thread pool saturation
      if (stats.threadPool?.queued > 5 && !(prev.threadPool?.queued > 5)) {
        newLogs.push({
          id: logIdRef.current++,
          time,
          msg: `⚠️ Thread pool queueing`,
          detail: `${stats.threadPool.queued} queued @ ${label}`,
          color: EVENT_COLORS.info,
        });
      }
    }

    // Throughput milestones
    const newProcessed = Object.values(componentStats).reduce((s, c) => s + (c.totalProcessed || 0), 0);
    const prevProcessed = Object.values(prevStatsRef.current).reduce((s, c) => s + (c.totalProcessed || 0), 0);
    const diff = newProcessed - prevProcessed;
    if (diff > 0 && newProcessed % 500 < diff) {
      newLogs.push({
        id: logIdRef.current++,
        time,
        msg: `📊 ${newProcessed.toLocaleString()} requests processed`,
        detail: `${latestThroughput}/s | P50 ${latestP50?.toFixed(1)}ms`,
        color: EVENT_COLORS.throughput,
      });
    }

    if (newLogs.length > 0) {
      setLogs(prev => [...prev, ...newLogs].slice(-maxLogs));
    }

    // Deep copy current stats for next comparison
    prevStatsRef.current = JSON.parse(JSON.stringify(componentStats));
  }, [componentStats, status, paused]);

  // Auto-scroll
  useEffect(() => {
    if (logRef.current && !paused) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs, paused]);

  // Reset on new simulation
  useEffect(() => {
    if (status === 'idle') {
      setLogs([]);
      prevStatsRef.current = {};
      logIdRef.current = 0;
    }
  }, [status]);

  if (collapsed) {
    return (
      <button
        onClick={onToggle}
        className="flex items-center gap-2 px-3 py-1.5 text-[10px] text-gray-400 hover:text-white bg-gray-800/60 rounded-lg border border-gray-700/50 hover:border-gray-600 transition-colors"
      >
        <Terminal className="w-3 h-3" />
        Event Log
        <span className="text-gray-600 font-mono">({logs.length})</span>
        <ChevronUp className="w-3 h-3" />
      </button>
    );
  }

  return (
    <div className="w-80 bg-gray-900/95 border border-gray-800 rounded-xl shadow-2xl flex flex-col overflow-hidden backdrop-blur-xl" style={{ maxHeight: 320 }}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-[11px] font-semibold text-white">Event Log</span>
          <span className="text-[9px] text-gray-500 font-mono">{logs.length}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPaused(!paused)}
            className={`p-1 rounded ${paused ? 'text-amber-400 bg-amber-400/10' : 'text-gray-500 hover:text-white'}`}
            title={paused ? 'Resume' : 'Pause'}
          >
            {paused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
          </button>
          <button
            onClick={() => setLogs([])}
            className="p-1 text-gray-500 hover:text-white rounded"
            title="Clear"
          >
            <Trash2 className="w-3 h-3" />
          </button>
          <button onClick={onToggle} className="p-1 text-gray-500 hover:text-white rounded">
            <ChevronDown className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Log entries */}
      <div ref={logRef} className="flex-1 overflow-y-auto font-mono text-[10px] leading-relaxed">
        {logs.length === 0 ? (
          <div className="flex items-center justify-center h-20 text-gray-600 text-[10px]">
            {status === 'idle' ? '▶ Start a simulation to see events...' : 'Waiting for events...'}
          </div>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className="flex items-start gap-2 px-3 py-0.5 hover:bg-white/[0.02] border-l-2"
              style={{ borderLeftColor: log.color + '60' }}
            >
              <span className="text-gray-600 flex-shrink-0 w-8 text-right">{log.time}s</span>
              <span style={{ color: log.color }}>{log.msg}</span>
              {log.detail && (
                <span className="text-gray-600 truncate">{log.detail}</span>
              )}
            </div>
          ))
        )}
      </div>

      {paused && (
        <div className="px-3 py-1 bg-amber-500/10 border-t border-amber-500/20 text-[9px] text-amber-400 text-center">
          ⏸ Paused
        </div>
      )}
    </div>
  );
}
