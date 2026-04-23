import React, { useState } from 'react';
import { Play, Pause, Square, RotateCcw, Zap, Download, Upload, BookOpen, Lightbulb } from 'lucide-react';
import useSimulationStore from '../../store/useSimulationStore';
import useDesignStore from '../../store/useDesignStore';
import useMetricsStore from '../../store/useMetricsStore';
import { SIM_STATES, SPEED_PRESETS } from '../../utils/constants';

export default function Header({ onOpenScenarios, onOpenTraffic, onOpenFailure, onOpenInsights }) {
  const { status, speed, setSpeed, startSimulation, pauseSimulation, resumeSimulation, stopSimulation, resetSimulation, initSimulation, setMetricsCallback, virtualTime, eventsProcessed } = useSimulationStore();
  const { nodes, edges, exportDesign, importDesign, clearDesign } = useDesignStore();
  const { addSnapshot, resetMetrics } = useMetricsStore();
  const [importing, setImporting] = useState(false);

  const handleStart = () => {
    if (status === SIM_STATES.IDLE || status === SIM_STATES.COMPLETED) {
      resetMetrics();
      initSimulation(nodes, edges);
      useSimulationStore.getState().setMetricsCallback(addSnapshot);
      startSimulation();
    } else if (status === SIM_STATES.PAUSED) {
      resumeSimulation();
    }
  };

  const handleExport = () => {
    const design = exportDesign();
    const blob = new Blob([JSON.stringify(design, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'system-design.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const design = JSON.parse(ev.target.result);
          importDesign(design);
        } catch (err) {
          console.error('Invalid design file', err);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleReset = () => {
    resetSimulation();
    resetMetrics();
  };

  return (
    <header className="h-14 bg-gray-950 border-b border-gray-800 flex items-center px-4 gap-3 z-50 relative">
      {/* Logo */}
      <div className="flex items-center gap-2 mr-4">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <h1 className="text-sm font-bold text-white tracking-tight hidden sm:block">
          System Design<span className="text-indigo-400"> Simulator</span>
        </h1>
      </div>

      <div className="h-6 w-px bg-gray-700" />

      {/* Scenario & File controls */}
      <button
        onClick={onOpenScenarios}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-300 hover:text-white hover:bg-gray-800 rounded-md transition-colors"
      >
        <BookOpen className="w-3.5 h-3.5" />
        Scenarios
      </button>
      <button
        onClick={handleExport}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-300 hover:text-white hover:bg-gray-800 rounded-md transition-colors"
      >
        <Download className="w-3.5 h-3.5" />
        Export
      </button>
      <button
        onClick={handleImport}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-300 hover:text-white hover:bg-gray-800 rounded-md transition-colors"
      >
        <Upload className="w-3.5 h-3.5" />
        Import
      </button>
      <button
        onClick={onOpenInsights}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-300 hover:text-white hover:bg-gray-800 rounded-md transition-colors"
      >
        <Lightbulb className="w-3.5 h-3.5" />
        Learn
      </button>

      <div className="flex-1" />

      {/* Simulation controls */}
      <div className="flex items-center gap-2">
        {/* Speed selector */}
        <div className="flex items-center gap-1 bg-gray-800/60 rounded-lg px-2 py-1">
          {SPEED_PRESETS.map((preset) => (
            <button
              key={preset.value}
              onClick={() => setSpeed(preset.value)}
              className={`px-2 py-0.5 text-xs rounded font-medium transition-colors ${
                speed === preset.value
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div className="h-6 w-px bg-gray-700" />

        {/* Play/Pause/Stop/Reset */}
        <div className="flex items-center gap-1">
          {(status === SIM_STATES.IDLE || status === SIM_STATES.COMPLETED) && (
            <button
              onClick={handleStart}
              disabled={nodes.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 disabled:text-gray-500 text-white text-xs font-medium rounded-lg transition-colors"
            >
              <Play className="w-3.5 h-3.5" fill="currentColor" />
              Start
            </button>
          )}
          {status === SIM_STATES.RUNNING && (
            <button
              onClick={pauseSimulation}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium rounded-lg transition-colors"
            >
              <Pause className="w-3.5 h-3.5" fill="currentColor" />
              Pause
            </button>
          )}
          {status === SIM_STATES.PAUSED && (
            <button
              onClick={handleStart}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg transition-colors"
            >
              <Play className="w-3.5 h-3.5" fill="currentColor" />
              Resume
            </button>
          )}
          {(status === SIM_STATES.RUNNING || status === SIM_STATES.PAUSED) && (
            <button
              onClick={stopSimulation}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-medium rounded-lg transition-colors"
            >
              <Square className="w-3.5 h-3.5" fill="currentColor" />
              Stop
            </button>
          )}
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 text-gray-400 hover:text-white hover:bg-gray-800 text-xs font-medium rounded-lg transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Status indicator */}
      <div className="h-6 w-px bg-gray-700" />
      <div className="flex items-center gap-3 text-xs text-gray-400">
        <span className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${
            status === SIM_STATES.RUNNING ? 'bg-emerald-400 animate-pulse' :
            status === SIM_STATES.PAUSED ? 'bg-amber-400' :
            status === SIM_STATES.COMPLETED ? 'bg-blue-400' :
            'bg-gray-600'
          }`} />
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
        {status !== SIM_STATES.IDLE && (
          <>
            <span>T: {(virtualTime / 1000).toFixed(1)}s</span>
            <span>Events: {eventsProcessed.toLocaleString()}</span>
          </>
        )}
      </div>
    </header>
  );
}
