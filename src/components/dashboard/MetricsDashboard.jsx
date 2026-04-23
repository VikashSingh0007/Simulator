import React from 'react';
import {
  LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { Activity, Clock, AlertTriangle, HardDrive, ChevronDown, ChevronUp, Settings } from 'lucide-react';
import useMetricsStore from '../../store/useMetricsStore';
import useSimulationStore from '../../store/useSimulationStore';
import { CHART_COLORS } from '../../utils/constants';
import { formatMs } from '../../utils/helpers';

function MetricCard({ icon: Icon, label, value, unit, color, subValue }) {
  return (
    <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-3 min-w-0">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="w-3 h-3 flex-shrink-0" style={{ color }} />
        <span className="text-[10px] text-gray-500 truncate">{label}</span>
      </div>
      <div className="text-lg font-bold font-mono truncate" style={{ color }}>
        {value}
        {unit && <span className="text-xs font-normal text-gray-500 ml-0.5">{unit}</span>}
      </div>
      {subValue && <div className="text-[10px] text-gray-500 mt-0.5">{subValue}</div>}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 shadow-xl">
      <p className="text-[10px] text-gray-400 mb-1">Time: {typeof label === 'number' ? label.toFixed(0) : label}s</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-[11px] font-mono" style={{ color: entry.color }}>
          {entry.name}: {typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}
        </p>
      ))}
    </div>
  );
};

export default function MetricsDashboard({ collapsed, onToggle, onOpenTraffic, onOpenFailure }) {
  const timeSeries = useMetricsStore((s) => s.timeSeries);
  const p50 = useMetricsStore((s) => s.latestP50);
  const p95 = useMetricsStore((s) => s.latestP95);
  const p99 = useMetricsStore((s) => s.latestP99);
  const throughput = useMetricsStore((s) => s.latestThroughput);
  const errorRate = useMetricsStore((s) => s.latestErrorRate);
  const cacheHitRate = useMetricsStore((s) => s.latestCacheHitRate);
  const cacheHits = useMetricsStore((s) => s.latestCacheHits);
  const cacheMisses = useMetricsStore((s) => s.latestCacheMisses);
  const totalCompleted = useMetricsStore((s) => s.latestTotalCompleted);
  const totalFailed = useMetricsStore((s) => s.latestTotalFailed);
  const status = useSimulationStore((s) => s.status);

  if (collapsed) {
    return (
      <div
        onClick={onToggle}
        className="h-10 bg-gray-900/95 border-t border-gray-800 flex items-center justify-between px-4 cursor-pointer hover:bg-gray-800/80 transition-colors"
      >
        <div className="flex items-center gap-4 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <Activity className="w-3 h-3 text-indigo-400" /> Metrics Dashboard
          </span>
          {status !== 'idle' && (
            <>
              <span>P50: <span className="text-cyan-400 font-mono">{formatMs(p50)}</span></span>
              <span>P99: <span className="text-red-400 font-mono">{formatMs(p99)}</span></span>
              <span>Throughput: <span className="text-emerald-400 font-mono">{throughput}/s</span></span>
              <span>Errors: <span className="text-red-400 font-mono">{errorRate.toFixed(1)}%</span></span>
            </>
          )}
        </div>
        <ChevronUp className="w-4 h-4 text-gray-500" />
      </div>
    );
  }

  return (
    <div className="bg-gray-900/95 border-t border-gray-800 flex flex-col overflow-hidden" style={{ height: 340 }}>
      {/* Dashboard Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800 flex-shrink-0">
        <div className="flex items-center gap-3">
          <h3 className="text-xs font-semibold text-white flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-indigo-400" />
            Metrics Dashboard
          </h3>
          <button
            onClick={onOpenTraffic}
            className="text-[10px] text-gray-400 hover:text-white px-2 py-0.5 rounded hover:bg-gray-800 transition-colors flex items-center gap-1"
          >
            <Settings className="w-3 h-3" /> Traffic
          </button>
          <button
            onClick={onOpenFailure}
            className="text-[10px] text-gray-400 hover:text-red-400 px-2 py-0.5 rounded hover:bg-gray-800 transition-colors flex items-center gap-1"
          >
            <AlertTriangle className="w-3 h-3" /> Inject Failure
          </button>
        </div>
        <button onClick={onToggle} className="p-1 text-gray-500 hover:text-white rounded transition-colors">
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-hidden p-3">
        {/* Metric cards row */}
        <div className="grid grid-cols-6 gap-2 mb-3">
          <MetricCard icon={Clock} label="P50 Latency" value={formatMs(p50)} color={CHART_COLORS.p50} />
          <MetricCard icon={Clock} label="P95 Latency" value={formatMs(p95)} color={CHART_COLORS.p95} />
          <MetricCard icon={Clock} label="P99 Latency" value={formatMs(p99)} color={CHART_COLORS.p99} />
          <MetricCard icon={Activity} label="Throughput" value={throughput} unit="/s" color={CHART_COLORS.throughput} />
          <MetricCard icon={AlertTriangle} label="Error Rate" value={errorRate.toFixed(1)} unit="%" color={CHART_COLORS.errors} subValue={`${totalFailed} / ${totalCompleted + totalFailed}`} />
          <MetricCard icon={HardDrive} label="Cache Hit" value={cacheHitRate.toFixed(1)} unit="%" color={CHART_COLORS.cacheHit} subValue={`${cacheHits}h / ${cacheMisses}m`} />
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-3 gap-3 h-44">
          {/* Latency Chart */}
          <div className="bg-gray-800/30 rounded-lg border border-gray-700/30 p-2">
            <h4 className="text-[10px] text-gray-400 font-medium mb-1">Latency Distribution</h4>
            {timeSeries.length > 0 ? (
              <ResponsiveContainer width="100%" height="85%">
                <LineChart data={timeSeries} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="time" tick={{ fontSize: 9, fill: '#6b7280' }} tickFormatter={(v) => `${Number(v).toFixed(0)}s`} />
                  <YAxis tick={{ fontSize: 9, fill: '#6b7280' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="p50" stroke={CHART_COLORS.p50} dot={false} strokeWidth={1.5} name="P50" />
                  <Line type="monotone" dataKey="p95" stroke={CHART_COLORS.p95} dot={false} strokeWidth={1.5} name="P95" />
                  <Line type="monotone" dataKey="p99" stroke={CHART_COLORS.p99} dot={false} strokeWidth={1.5} name="P99" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-[10px] text-gray-600">No data yet</div>
            )}
          </div>

          {/* Throughput Chart */}
          <div className="bg-gray-800/30 rounded-lg border border-gray-700/30 p-2">
            <h4 className="text-[10px] text-gray-400 font-medium mb-1">Throughput & Errors</h4>
            {timeSeries.length > 0 ? (
              <ResponsiveContainer width="100%" height="85%">
                <AreaChart data={timeSeries} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="time" tick={{ fontSize: 9, fill: '#6b7280' }} tickFormatter={(v) => `${Number(v).toFixed(0)}s`} />
                  <YAxis tick={{ fontSize: 9, fill: '#6b7280' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="throughput" stroke={CHART_COLORS.throughput} fill={CHART_COLORS.throughput + '20'} strokeWidth={1.5} name="Throughput" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-[10px] text-gray-600">No data yet</div>
            )}
          </div>

          {/* Cache & Queue Chart */}
          <div className="bg-gray-800/30 rounded-lg border border-gray-700/30 p-2">
            <h4 className="text-[10px] text-gray-400 font-medium mb-1">Cache Hit Rate</h4>
            {timeSeries.length > 0 ? (
              <ResponsiveContainer width="100%" height="85%">
                <LineChart data={timeSeries} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="time" tick={{ fontSize: 9, fill: '#6b7280' }} tickFormatter={(v) => `${Number(v).toFixed(0)}s`} />
                  <YAxis tick={{ fontSize: 9, fill: '#6b7280' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="cacheHitRate" stroke={CHART_COLORS.cacheHit} dot={false} strokeWidth={1.5} name="Cache Hit %" />
                  <Line type="monotone" dataKey="queueLag" stroke={CHART_COLORS.queueDepth} dot={false} strokeWidth={1.5} name="Queue Lag" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-[10px] text-gray-600">No data yet</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
