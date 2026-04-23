import React, { memo, useMemo } from 'react';
import { Handle, Position } from 'reactflow';
import { Shield, GitBranch, Database, MemoryStick, MessageSquare, Server, AlertTriangle, Activity } from 'lucide-react';
import { COMPONENT_TYPES, COMPONENT_COLORS } from '../../../utils/constants';
import useDesignStore from '../../../store/useDesignStore';
import useSimulationStore from '../../../store/useSimulationStore';

const ICONS = {
  [COMPONENT_TYPES.API_GATEWAY]: Shield,
  [COMPONENT_TYPES.LOAD_BALANCER]: GitBranch,
  [COMPONENT_TYPES.CACHE]: MemoryStick,
  [COMPONENT_TYPES.DATABASE]: Database,
  [COMPONENT_TYPES.MESSAGE_QUEUE]: MessageSquare,
  [COMPONENT_TYPES.SERVICE]: Server,
};

// Health heatmap: compute health score 0-1 based on component stats
function getHealthScore(stats) {
  if (!stats) return null; // no simulation running
  if (stats.isDown) return 0;
  
  const total = stats.totalProcessed + stats.totalFailed;
  if (total === 0) return 1;
  
  const failureRate = stats.totalFailed / total;
  
  // Also factor in circuit breaker state
  if (stats.circuitBreaker?.state === 'OPEN') return 0.1;
  if (stats.circuitBreaker?.state === 'HALF_OPEN') return 0.4;
  
  // Thread pool saturation
  if (stats.threadPool) {
    const utilization = stats.threadPool.busyCount / (stats.threadPool.size || 1);
    if (utilization > 0.9) return Math.max(0.2, 1 - failureRate - 0.3);
  }
  
  return Math.max(0, 1 - failureRate * 3);
}

// Health-based border/glow color
function getHealthColor(score) {
  if (score === null) return null; // use default
  if (score >= 0.8) return '#22c55e'; // green
  if (score >= 0.5) return '#f59e0b'; // amber
  if (score >= 0.2) return '#f97316'; // orange
  return '#ef4444'; // red
}

const CB_STATE_BADGE = {
  CLOSED: { label: 'CB: Closed', bg: 'bg-emerald-500/20', text: 'text-emerald-400', ring: 'ring-emerald-500/30' },
  OPEN: { label: 'CB: OPEN', bg: 'bg-red-500/20', text: 'text-red-400', ring: 'ring-red-500/30' },
  HALF_OPEN: { label: 'CB: Half-Open', bg: 'bg-amber-500/20', text: 'text-amber-400', ring: 'ring-amber-500/30' },
};

function CustomNode({ id, data, selected }) {
  const selectNode = useDesignStore((s) => s.selectNode);
  const componentStats = useSimulationStore((s) => s.componentStats);
  const stats = componentStats[id];
  const colors = COMPONENT_COLORS[data.componentType];
  const Icon = ICONS[data.componentType] || Server;
  const isDown = stats?.isDown;

  // Health heatmap
  const healthScore = getHealthScore(stats);
  const healthColor = getHealthColor(healthScore);
  const borderColor = healthColor || (selected ? colors.border : colors.border + '50');
  const glowColor = healthColor || colors.border;

  // Circuit breaker state  
  const cbState = stats?.circuitBreaker;
  const cbBadge = cbState ? CB_STATE_BADGE[cbState.state] : null;

  // Pulse animation for unhealthy nodes
  const shouldPulse = healthScore !== null && healthScore < 0.3;

  return (
    <div
      onClick={() => selectNode(id)}
      className={`relative group transition-all duration-200 ${selected ? 'scale-105' : 'hover:scale-[1.02]'}`}
      style={{ minWidth: 160 }}
    >
      {/* Health glow effect */}
      <div
        className={`absolute -inset-1 rounded-xl transition-opacity duration-300 blur-lg ${
          shouldPulse ? 'animate-pulse opacity-40' :
          selected ? 'opacity-30' : 'opacity-0 group-hover:opacity-15'
        }`}
        style={{ background: glowColor }}
      />

      {/* Node body */}
      <div
        className={`relative rounded-xl overflow-hidden backdrop-blur-xl ${
          isDown ? 'opacity-50 grayscale' : ''
        }`}
        style={{
          background: `linear-gradient(135deg, ${colors.bg}ee, ${colors.bg}dd)`,
          border: `1.5px solid ${borderColor}`,
          boxShadow: selected
            ? `0 0 20px ${glowColor}30`
            : healthColor
            ? `0 0 10px ${healthColor}15`
            : 'none',
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-2 px-3 py-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{
              background: `${colors.border}20`,
              border: `1px solid ${colors.border}30`,
            }}
          >
            <Icon className="w-3.5 h-3.5" style={{ color: colors.accent }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-semibold truncate" style={{ color: colors.text }}>
              {data.config?.label || data.label || 'Component'}
            </div>
            <div className="text-[9px] text-gray-500 capitalize">
              {data.componentType.replace(/([A-Z])/g, ' $1').trim()}
            </div>
          </div>
          {isDown && (
            <AlertTriangle className="w-3.5 h-3.5 text-red-400 animate-pulse flex-shrink-0" />
          )}
          {/* Health indicator dot */}
          {healthScore !== null && !isDown && (
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: healthColor }}
              title={`Health: ${(healthScore * 100).toFixed(0)}%`}
            />
          )}
        </div>

        {/* Circuit Breaker badge */}
        {cbBadge && cbState.state !== 'CLOSED' && (
          <div className="px-3 pb-1">
            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[8px] font-bold ring-1 ${cbBadge.bg} ${cbBadge.text} ${cbBadge.ring}`}>
              <Activity className="w-2.5 h-2.5" />
              {cbBadge.label}
              {cbState.totalTrips > 0 && <span className="text-[7px] opacity-60">({cbState.totalTrips}x)</span>}
            </span>
          </div>
        )}

        {/* Stats bar (only during simulation) */}
        {stats && (
          <div className="px-3 pb-2 space-y-1">
            <div className="flex items-center justify-between text-[9px]">
              <span className="text-gray-500">Processed</span>
              <span className="text-emerald-400 font-mono">{stats.totalProcessed?.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-[9px]">
              <span className="text-gray-500">Failed</span>
              <span className="text-red-400 font-mono">{stats.totalFailed?.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-[9px]">
              <span className="text-gray-500">Active</span>
              <span className="font-mono" style={{ color: colors.accent }}>{stats.activeRequests}</span>
            </div>

            {/* Cache-specific */}
            {stats.cacheState && (
              <div className="flex items-center justify-between text-[9px]">
                <span className="text-gray-500">Hit Rate</span>
                <span className="text-amber-400 font-mono">
                  {(stats.cacheState.hitRate * 100).toFixed(1)}%
                </span>
              </div>
            )}

            {/* Thread pool visualization */}
            {stats.threadPool && (
              <div className="mt-1">
                <div className="flex gap-px">
                  {stats.threadPool.threadStates.slice(0, 8).map((state, i) => (
                    <div
                      key={i}
                      className="h-1.5 flex-1 rounded-sm transition-colors duration-200"
                      style={{
                        background: state === 'busy' ? colors.accent : '#374151',
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Rate limiter bar */}
            {stats.rateLimiter && (
              <div className="mt-1 h-1.5 rounded-full bg-gray-800 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${(stats.rateLimiter.currentTokens / stats.rateLimiter.bucketSize) * 100}%`,
                    background: `linear-gradient(90deg, ${colors.accent}, ${colors.border})`,
                  }}
                />
              </div>
            )}

            {/* Health bar */}
            {healthScore !== null && (
              <div className="mt-1">
                <div className="h-1 rounded-full bg-gray-800 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${healthScore * 100}%`,
                      background: healthColor,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !rounded-full !border-2 !-left-1.5"
        style={{
          background: colors.bg,
          borderColor: borderColor,
        }}
      />

      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !rounded-full !border-2 !-right-1.5"
        style={{
          background: colors.bg,
          borderColor: borderColor,
        }}
      />
    </div>
  );
}

export default memo(CustomNode);
