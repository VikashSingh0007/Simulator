import React from 'react';
import { Skull, Clock, AlertTriangle, RotateCcw, Flame } from 'lucide-react';
import useDesignStore from '../../store/useDesignStore';
import useSimulationStore from '../../store/useSimulationStore';
import { COMPONENT_COLORS } from '../../utils/constants';

export default function FailureInjector({ onClose }) {
  const { nodes } = useDesignStore();
  const { injectFailure, componentStats } = useSimulationStore();

  return (
    <div className="absolute top-16 right-4 z-50 w-80 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-red-400" />
          <h3 className="text-sm font-semibold text-white">Failure Injection</h3>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-white text-xs">✕</button>
      </div>
      <div className="p-3 max-h-[400px] overflow-y-auto">
        {nodes.length === 0 ? (
          <p className="text-xs text-gray-500 text-center py-4">No components to inject failures into</p>
        ) : (
          <div className="space-y-2">
            {nodes.map((node) => {
              const colors = COMPONENT_COLORS[node.data.componentType];
              const stats = componentStats[node.id];
              const isDown = stats?.isDown;

              return (
                <div
                  key={node.id}
                  className="bg-gray-800/50 rounded-lg p-3 border border-gray-700"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium" style={{ color: colors?.text }}>
                      {node.data.config?.label || node.data.label}
                    </span>
                    {isDown && (
                      <span className="text-[10px] text-red-400 bg-red-400/10 px-1.5 py-0.5 rounded">DOWN</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {!isDown ? (
                      <button
                        onClick={() => injectFailure(node.id, 'kill')}
                        className="flex items-center gap-1 px-2 py-1 text-[10px] bg-red-900/30 text-red-400 hover:bg-red-900/50 rounded-md transition-colors"
                      >
                        <Skull className="w-3 h-3" /> Kill
                      </button>
                    ) : (
                      <button
                        onClick={() => injectFailure(node.id, 'revive')}
                        className="flex items-center gap-1 px-2 py-1 text-[10px] bg-emerald-900/30 text-emerald-400 hover:bg-emerald-900/50 rounded-md transition-colors"
                      >
                        <RotateCcw className="w-3 h-3" /> Revive
                      </button>
                    )}
                    <button
                      onClick={() => injectFailure(node.id, 'addLatency', 500)}
                      className="flex items-center gap-1 px-2 py-1 text-[10px] bg-amber-900/30 text-amber-400 hover:bg-amber-900/50 rounded-md transition-colors"
                    >
                      <Clock className="w-3 h-3" /> +500ms
                    </button>
                    <button
                      onClick={() => injectFailure(node.id, 'removeLatency')}
                      className="flex items-center gap-1 px-2 py-1 text-[10px] bg-gray-700/50 text-gray-300 hover:bg-gray-700 rounded-md transition-colors"
                    >
                      <Clock className="w-3 h-3" /> Reset
                    </button>
                    <button
                      onClick={() => injectFailure(node.id, 'setFailureRate', 0.3)}
                      className="flex items-center gap-1 px-2 py-1 text-[10px] bg-orange-900/30 text-orange-400 hover:bg-orange-900/50 rounded-md transition-colors"
                    >
                      <AlertTriangle className="w-3 h-3" /> 30% Fail
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
