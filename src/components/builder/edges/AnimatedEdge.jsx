import React, { memo, useMemo } from 'react';
import { getBezierPath, EdgeLabelRenderer } from 'reactflow';
import useSimulationStore from '../../../store/useSimulationStore';

/**
 * AnimatedEdge - Shows flowing particles along the edge to represent request traffic.
 * Particles speed up/slow down based on throughput. Color changes based on health.
 */
function AnimatedEdge({
  id,
  sourceX, sourceY,
  targetX, targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  source,
  target,
}) {
  const status = useSimulationStore((s) => s.status);
  const componentStats = useSimulationStore((s) => s.componentStats);
  
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX, sourceY,
    targetX, targetY,
    sourcePosition, targetPosition,
  });

  // Calculate throughput for this edge
  const sourceStats = componentStats[source];
  const isActive = status === 'running' && sourceStats?.totalProcessed > 0;
  const hasErrors = sourceStats?.totalFailed > 0;
  
  // Determine edge color based on health
  let edgeColor = '#4f46e5'; // default indigo
  let particleColor = '#818cf8';
  
  if (isActive) {
    const total = (sourceStats?.totalProcessed || 0) + (sourceStats?.totalFailed || 0);
    const failRate = total > 0 ? (sourceStats?.totalFailed || 0) / total : 0;
    
    if (failRate > 0.5) {
      edgeColor = '#ef4444';
      particleColor = '#f87171';
    } else if (failRate > 0.1) {
      edgeColor = '#f59e0b';
      particleColor = '#fbbf24';
    } else {
      edgeColor = '#22c55e';
      particleColor = '#4ade80';
    }
  }

  // Compute speed based on throughput
  const animDuration = isActive ? Math.max(0.5, 3 - Math.min(2, (sourceStats?.totalProcessed || 0) / 200)) : 3;

  return (
    <>
      {/* Base edge path */}
      <path
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        fill="none"
        stroke={edgeColor}
        strokeWidth={isActive ? 2.5 : 2}
        strokeOpacity={isActive ? 0.7 : 0.3}
        markerEnd={markerEnd}
      />

      {/* Animated flow particles */}
      {isActive && (
        <>
          {/* Particle 1 */}
          <circle r="3" fill={particleColor} filter="url(#glow)">
            <animateMotion dur={`${animDuration}s`} repeatCount="indefinite" path={edgePath} />
          </circle>
          {/* Particle 2 (offset) */}
          <circle r="2.5" fill={particleColor} opacity="0.7">
            <animateMotion dur={`${animDuration}s`} repeatCount="indefinite" path={edgePath} begin={`${animDuration * 0.33}s`} />
          </circle>
          {/* Particle 3 (offset) */}
          <circle r="2" fill={particleColor} opacity="0.5">
            <animateMotion dur={`${animDuration}s`} repeatCount="indefinite" path={edgePath} begin={`${animDuration * 0.66}s`} />
          </circle>
          
          {/* Glow effect filter */}
          <defs>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="glow" />
              <feMerge>
                <feMergeNode in="glow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
        </>
      )}

      {/* Throughput label on edge */}
      {isActive && sourceStats?.totalProcessed > 10 && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: 'all',
            }}
            className="text-[8px] font-mono px-1.5 py-0.5 rounded-full bg-gray-900/90 border border-gray-700/50 text-gray-400"
          >
            {sourceStats.totalProcessed.toLocaleString()}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

export default memo(AnimatedEdge);
