import React from 'react';
import { X, ArrowRight } from 'lucide-react';
import useDesignStore from '../../store/useDesignStore';
import useSimulationStore from '../../store/useSimulationStore';
import { urlShortenerScenario } from '../../scenarios/urlShortener';
import { ecommerceCheckoutScenario } from '../../scenarios/ecommerceCheckout';

const SCENARIOS = [urlShortenerScenario, ecommerceCheckoutScenario];

const DIFFICULTY_COLORS = {
  Beginner: 'text-emerald-400 bg-emerald-400/10',
  Advanced: 'text-amber-400 bg-amber-400/10',
};

export default function ScenarioLibrary({ onClose }) {
  const { loadScenario } = useDesignStore();
  const { updateTrafficConfig, setSimulationDuration, resetSimulation } = useSimulationStore();

  const handleLoad = (scenario) => {
    resetSimulation();
    loadScenario(scenario);
    if (scenario.trafficConfig) updateTrafficConfig(scenario.trafficConfig);
    if (scenario.simulationDuration) setSimulationDuration(scenario.simulationDuration);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-700 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Scenario Library</h2>
            <p className="text-xs text-gray-400 mt-0.5">Pre-built system designs to explore and learn from</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scenarios */}
        <div className="p-6 grid gap-4">
          {SCENARIOS.map((scenario) => (
            <div
              key={scenario.name}
              className="group bg-gray-800/50 hover:bg-gray-800 border border-gray-700 hover:border-indigo-500/50 rounded-xl p-5 cursor-pointer transition-all duration-200"
              onClick={() => handleLoad(scenario)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{scenario.icon}</span>
                    <div>
                      <h3 className="text-sm font-semibold text-white group-hover:text-indigo-300 transition-colors">
                        {scenario.name}
                      </h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${DIFFICULTY_COLORS[scenario.difficulty]}`}>
                        {scenario.difficulty}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed mb-3">
                    {scenario.description}
                  </p>
                  <div className="flex flex-wrap gap-2 text-[10px] text-gray-500">
                    <span className="bg-gray-700/50 px-2 py-0.5 rounded">
                      {scenario.nodes.length} components
                    </span>
                    <span className="bg-gray-700/50 px-2 py-0.5 rounded">
                      {scenario.trafficConfig.rps} RPS
                    </span>
                    <span className="bg-gray-700/50 px-2 py-0.5 rounded">
                      {scenario.trafficConfig.readWriteRatio}% reads
                    </span>
                    <span className="bg-gray-700/50 px-2 py-0.5 rounded">
                      {scenario.simulationDuration}s
                    </span>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-600 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all mt-1" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
