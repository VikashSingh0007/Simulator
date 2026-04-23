import React from 'react';
import { X, Trash2 } from 'lucide-react';
import useDesignStore from '../../store/useDesignStore';
import { COMPONENT_TYPES, LB_STRATEGIES, CACHE_STRATEGIES, COMPONENT_COLORS } from '../../utils/constants';

function SliderField({ label, value, onChange, min, max, step = 1, unit = '' }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <label className="text-[11px] text-gray-400">{label}</label>
        <span className="text-[11px] font-mono text-indigo-400">{value}{unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 bg-gray-700 rounded-full appearance-none cursor-pointer accent-indigo-500"
      />
    </div>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <div>
      <label className="text-[11px] text-gray-400 block mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-gray-800 border border-gray-700 text-gray-200 text-xs rounded-lg px-2 py-1.5 focus:border-indigo-500 focus:outline-none"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

function ToggleField({ label, value, onChange }) {
  return (
    <div className="flex items-center justify-between">
      <label className="text-[11px] text-gray-400">{label}</label>
      <button
        onClick={() => onChange(!value)}
        className={`relative w-8 h-4 rounded-full transition-colors ${value ? 'bg-indigo-600' : 'bg-gray-700'}`}
      >
        <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${value ? 'left-4' : 'left-0.5'}`} />
      </button>
    </div>
  );
}

function InputField({ label, value, onChange, type = 'text' }) {
  return (
    <div>
      <label className="text-[11px] text-gray-400 block mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(type === 'number' ? parseFloat(e.target.value) : e.target.value)}
        className="w-full bg-gray-800 border border-gray-700 text-gray-200 text-xs rounded-lg px-2 py-1.5 focus:border-indigo-500 focus:outline-none"
      />
    </div>
  );
}

export default function ConfigPanel() {
  const { selectedNodeId, nodes, updateNodeConfig, removeNode, selectNode } = useDesignStore();
  const node = nodes.find((n) => n.id === selectedNodeId);

  if (!node) {
    return (
      <aside className="w-64 bg-gray-950 border-l border-gray-800 flex items-center justify-center p-6">
        <p className="text-xs text-gray-500 text-center">
          Select a component to configure its properties
        </p>
      </aside>
    );
  }

  const { componentType, config } = node.data;
  const colors = COMPONENT_COLORS[componentType];

  const update = (key, value) => {
    updateNodeConfig(selectedNodeId, { [key]: value });
  };

  return (
    <aside className="w-64 bg-gray-950 border-l border-gray-800 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-3 py-3 border-b border-gray-800 flex items-center justify-between">
        <div>
          <h3 className="text-xs font-semibold" style={{ color: colors.text }}>
            Configure Component
          </h3>
          <p className="text-[10px] text-gray-500 capitalize mt-0.5">
            {componentType.replace(/([A-Z])/g, ' $1').trim()}
          </p>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => { removeNode(selectedNodeId); }}
            className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-gray-800 rounded-md transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => selectNode(null)}
            className="p-1.5 text-gray-500 hover:text-white hover:bg-gray-800 rounded-md transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Config fields */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Common fields */}
        <InputField label="Label" value={config.label} onChange={(v) => update('label', v)} />
        <SliderField label="Failure Rate" value={config.failureRate || 0} onChange={(v) => update('failureRate', v)} min={0} max={1} step={0.01} />
        <SliderField label="Base Latency" value={config.latencyMs || config.processingTimeMs || 0} onChange={(v) => update(config.processingTimeMs !== undefined ? 'processingTimeMs' : 'latencyMs', v)} min={0} max={500} unit="ms" />

        {/* Type-specific fields */}
        {componentType === COMPONENT_TYPES.API_GATEWAY && (
          <>
            <div className="pt-2 border-t border-gray-800">
              <h4 className="text-[10px] font-semibold text-gray-400 uppercase mb-2">Rate Limiting</h4>
              <div className="space-y-3">
                <ToggleField label="Enabled" value={config.rateLimitEnabled} onChange={(v) => update('rateLimitEnabled', v)} />
                <SliderField label="Bucket Size" value={config.rateLimitBucketSize} onChange={(v) => update('rateLimitBucketSize', v)} min={10} max={1000} />
                <SliderField label="Refill Rate" value={config.rateLimitRefillRate} onChange={(v) => update('rateLimitRefillRate', v)} min={1} max={500} unit="/s" />
              </div>
            </div>
          </>
        )}

        {componentType === COMPONENT_TYPES.LOAD_BALANCER && (
          <div className="pt-2 border-t border-gray-800">
            <h4 className="text-[10px] font-semibold text-gray-400 uppercase mb-2">Strategy</h4>
            <SelectField label="Algorithm" value={config.strategy} onChange={(v) => update('strategy', v)} options={[
              { value: LB_STRATEGIES.ROUND_ROBIN, label: 'Round Robin' },
              { value: LB_STRATEGIES.WEIGHTED_ROUND_ROBIN, label: 'Weighted Round Robin' },
              { value: LB_STRATEGIES.LEAST_CONNECTIONS, label: 'Least Connections' },
              { value: LB_STRATEGIES.RANDOM, label: 'Random' },
            ]} />
            <SliderField label="Max Connections" value={config.maxConnections} onChange={(v) => update('maxConnections', v)} min={10} max={5000} />
          </div>
        )}

        {componentType === COMPONENT_TYPES.CACHE && (
          <div className="pt-2 border-t border-gray-800">
            <h4 className="text-[10px] font-semibold text-gray-400 uppercase mb-2">Cache Config</h4>
            <div className="space-y-3">
              <SelectField label="Eviction Policy" value={config.strategy} onChange={(v) => update('strategy', v)} options={[
                { value: CACHE_STRATEGIES.LRU, label: 'LRU (Least Recently Used)' },
                { value: CACHE_STRATEGIES.LFU, label: 'LFU (Least Frequently Used)' },
              ]} />
              <SliderField label="Capacity" value={config.capacity} onChange={(v) => update('capacity', v)} min={10} max={10000} />
              <SliderField label="Hit Latency" value={config.hitLatencyMs} onChange={(v) => update('hitLatencyMs', v)} min={0} max={20} unit="ms" />
              <SliderField label="TTL" value={config.ttlMs / 1000} onChange={(v) => update('ttlMs', v * 1000)} min={1} max={300} unit="s" />
            </div>
          </div>
        )}

        {componentType === COMPONENT_TYPES.DATABASE && (
          <div className="pt-2 border-t border-gray-800">
            <h4 className="text-[10px] font-semibold text-gray-400 uppercase mb-2">Database Config</h4>
            <div className="space-y-3">
              <SliderField label="Max Connections" value={config.maxConnections} onChange={(v) => update('maxConnections', v)} min={5} max={200} />
              <SliderField label="Indexed Query" value={config.indexedQueryLatencyMs} onChange={(v) => update('indexedQueryLatencyMs', v)} min={1} max={100} unit="ms" />
              <SliderField label="Full Scan" value={config.fullScanLatencyMs} onChange={(v) => update('fullScanLatencyMs', v)} min={50} max={2000} unit="ms" />
              <SliderField label="Index Hit Rate" value={config.indexHitRate} onChange={(v) => update('indexHitRate', v)} min={0} max={1} step={0.05} />
            </div>
          </div>
        )}

        {componentType === COMPONENT_TYPES.MESSAGE_QUEUE && (
          <div className="pt-2 border-t border-gray-800">
            <h4 className="text-[10px] font-semibold text-gray-400 uppercase mb-2">Queue Config</h4>
            <div className="space-y-3">
              <SliderField label="Partitions" value={config.partitions} onChange={(v) => update('partitions', Math.round(v))} min={1} max={16} />
              <SliderField label="Max Queue Size" value={config.maxQueueSize} onChange={(v) => update('maxQueueSize', v)} min={100} max={100000} />
              <SliderField label="Publish Latency" value={config.publishLatencyMs} onChange={(v) => update('publishLatencyMs', v)} min={1} max={50} unit="ms" />
              <SliderField label="Consume Latency" value={config.consumeLatencyMs} onChange={(v) => update('consumeLatencyMs', v)} min={1} max={100} unit="ms" />
              <SliderField label="Max Retries" value={config.maxRetries} onChange={(v) => update('maxRetries', Math.round(v))} min={0} max={10} />
            </div>
          </div>
        )}

        {componentType === COMPONENT_TYPES.SERVICE && (
          <div className="pt-2 border-t border-gray-800">
            <h4 className="text-[10px] font-semibold text-gray-400 uppercase mb-2">Service Config</h4>
            <div className="space-y-3">
              <SliderField label="Thread Pool Size" value={config.threadPoolSize} onChange={(v) => update('threadPoolSize', Math.round(v))} min={1} max={64} />
              <SliderField label="Queue Size" value={config.threadQueueSize} onChange={(v) => update('threadQueueSize', Math.round(v))} min={8} max={512} />
              <SliderField label="Processing Time" value={config.processingTimeMs} onChange={(v) => update('processingTimeMs', v)} min={1} max={500} unit="ms" />
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
