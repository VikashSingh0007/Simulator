import React from 'react';
import { COMPONENT_TYPES, COMPONENT_COLORS, DEFAULT_CONFIGS } from '../../utils/constants';
import { Shield, GitBranch, Database, MemoryStick, MessageSquare, Server } from 'lucide-react';

const COMPONENT_LIST = [
  { type: COMPONENT_TYPES.API_GATEWAY, icon: Shield, label: 'API Gateway', desc: 'Entry point with rate limiting' },
  { type: COMPONENT_TYPES.LOAD_BALANCER, icon: GitBranch, label: 'Load Balancer', desc: 'Routes traffic to services' },
  { type: COMPONENT_TYPES.SERVICE, icon: Server, label: 'Service', desc: 'Application service with thread pool' },
  { type: COMPONENT_TYPES.CACHE, icon: MemoryStick, label: 'Cache', desc: 'LRU/LFU caching layer' },
  { type: COMPONENT_TYPES.DATABASE, icon: Database, label: 'Database', desc: 'DB with connection pooling' },
  { type: COMPONENT_TYPES.MESSAGE_QUEUE, icon: MessageSquare, label: 'Message Queue', desc: 'Kafka-like message broker' },
];

export default function Sidebar() {
  const onDragStart = (event, componentType) => {
    event.dataTransfer.setData('application/reactflow', componentType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside className="w-56 bg-gray-950 border-r border-gray-800 flex flex-col overflow-hidden">
      <div className="px-3 py-3 border-b border-gray-800">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Components</h2>
        <p className="text-[10px] text-gray-600 mt-0.5">Drag onto canvas</p>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {COMPONENT_LIST.map(({ type, icon: Icon, label, desc }) => {
          const colors = COMPONENT_COLORS[type];
          return (
            <div
              key={type}
              draggable
              onDragStart={(e) => onDragStart(e, type)}
              className="group flex items-center gap-2.5 p-2.5 rounded-lg cursor-grab active:cursor-grabbing transition-all duration-200 hover:bg-gray-800/80 border border-transparent hover:border-gray-700"
              style={{
                '--accent': colors.border,
              }}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
                style={{
                  background: `${colors.border}15`,
                  border: `1px solid ${colors.border}40`,
                }}
              >
                <Icon className="w-4 h-4" style={{ color: colors.accent }} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium text-gray-200 truncate">{label}</div>
                <div className="text-[10px] text-gray-500 truncate">{desc}</div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Help section */}
      <div className="p-3 border-t border-gray-800">
        <div className="bg-gray-800/40 rounded-lg p-3 space-y-2">
          <h3 className="text-[10px] font-semibold text-gray-400 uppercase">Quick Tips</h3>
          <ul className="space-y-1 text-[10px] text-gray-500">
            <li>• Drag components to canvas</li>
            <li>• Connect via handles</li>
            <li>• Click to configure</li>
            <li>• Press ▶ to simulate</li>
          </ul>
        </div>
      </div>
    </aside>
  );
}
