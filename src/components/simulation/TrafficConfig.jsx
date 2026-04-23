import React from 'react';
import { Zap, TrendingUp, Activity, BarChart3 } from 'lucide-react';
import useSimulationStore from '../../store/useSimulationStore';

export default function TrafficConfig({ onClose }) {
  const { trafficConfig, updateTrafficConfig, simulationDuration, setSimulationDuration } = useSimulationStore();

  return (
    <div className="absolute top-16 left-60 z-50 w-72 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-semibold text-white">Traffic Configuration</h3>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-white text-xs">✕</button>
      </div>
      <div className="p-4 space-y-4">
        {/* RPS */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs text-gray-400 flex items-center gap-1">
              <Zap className="w-3 h-3" /> Requests/sec
            </label>
            <span className="text-xs font-mono text-indigo-400">{trafficConfig.rps}</span>
          </div>
          <input
            type="range" min={1} max={1000} value={trafficConfig.rps}
            onChange={(e) => updateTrafficConfig({ rps: parseInt(e.target.value) })}
            className="w-full h-1.5 bg-gray-700 rounded-full appearance-none cursor-pointer accent-indigo-500"
          />
        </div>

        {/* Burst Factor */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs text-gray-400 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Burst Factor
            </label>
            <span className="text-xs font-mono text-amber-400">{trafficConfig.burstFactor}x</span>
          </div>
          <input
            type="range" min={1} max={10} value={trafficConfig.burstFactor}
            onChange={(e) => updateTrafficConfig({ burstFactor: parseInt(e.target.value) })}
            className="w-full h-1.5 bg-gray-700 rounded-full appearance-none cursor-pointer accent-amber-500"
          />
        </div>

        {/* Burst Interval */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs text-gray-400">Burst Interval</label>
            <span className="text-xs font-mono text-gray-300">{trafficConfig.burstInterval}s</span>
          </div>
          <input
            type="range" min={5} max={60} value={trafficConfig.burstInterval}
            onChange={(e) => updateTrafficConfig({ burstInterval: parseInt(e.target.value) })}
            className="w-full h-1.5 bg-gray-700 rounded-full appearance-none cursor-pointer accent-gray-500"
          />
        </div>

        {/* Read/Write Ratio */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs text-gray-400 flex items-center gap-1">
              <BarChart3 className="w-3 h-3" /> Read/Write Ratio
            </label>
            <span className="text-xs font-mono text-cyan-400">
              {trafficConfig.readWriteRatio}% reads
            </span>
          </div>
          <input
            type="range" min={0} max={100} value={trafficConfig.readWriteRatio}
            onChange={(e) => updateTrafficConfig({ readWriteRatio: parseInt(e.target.value) })}
            className="w-full h-1.5 bg-gray-700 rounded-full appearance-none cursor-pointer accent-cyan-500"
          />
          <div className="flex justify-between text-[10px] text-gray-500 mt-1">
            <span>Write Heavy</span>
            <span>Read Heavy</span>
          </div>
        </div>

        {/* Duration */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs text-gray-400">Simulation Duration</label>
            <span className="text-xs font-mono text-gray-300">{simulationDuration}s</span>
          </div>
          <input
            type="range" min={5} max={120} value={simulationDuration}
            onChange={(e) => setSimulationDuration(parseInt(e.target.value))}
            className="w-full h-1.5 bg-gray-700 rounded-full appearance-none cursor-pointer accent-gray-500"
          />
        </div>
      </div>
    </div>
  );
}
