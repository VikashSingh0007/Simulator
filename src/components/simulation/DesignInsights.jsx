import React, { useMemo } from 'react';
import { Lightbulb, AlertTriangle, TrendingUp, Shield, Zap, BookOpen, X, ArrowRight, CheckCircle } from 'lucide-react';
import useDesignStore from '../../store/useDesignStore';
import useSimulationStore from '../../store/useSimulationStore';
import useMetricsStore from '../../store/useMetricsStore';
import { COMPONENT_TYPES } from '../../utils/constants';

const LEARNING_TIPS = {
  [COMPONENT_TYPES.API_GATEWAY]: {
    title: 'API Gateway',
    icon: '🛡️',
    tips: [
      'Rate limiting protects downstream services from traffic spikes',
      'Token bucket algorithm allows controlled bursts while maintaining average rate',
      'API gateways handle cross-cutting concerns: auth, rate limiting, logging, SSL termination',
    ],
    realWorld: 'Used by: AWS API Gateway, Kong, NGINX, Zuul',
  },
  [COMPONENT_TYPES.LOAD_BALANCER]: {
    title: 'Load Balancer',
    icon: '⚖️',
    tips: [
      'Round Robin: Simple but ignores server load differences',
      'Least Connections: Better for varying request durations',
      'Consistent Hashing: Preserves session affinity, great for caching',
    ],
    realWorld: 'Used by: AWS ALB/NLB, HAProxy, NGINX, Envoy',
  },
  [COMPONENT_TYPES.CACHE]: {
    title: 'Cache',
    icon: '💾',
    tips: [
      'LRU evicts least recently used items — good for temporal locality',
      'LFU evicts least frequently used — good for popularity-based access',
      'Cache-aside pattern: App checks cache first, then DB on miss',
      'Watch for: cache stampede, stale data, cold start latency',
    ],
    realWorld: 'Used by: Redis, Memcached, CDNs (CloudFront, Cloudflare)',
  },
  [COMPONENT_TYPES.DATABASE]: {
    title: 'Database',
    icon: '🗄️',
    tips: [
      'Indexes turn O(n) full scans into O(log n) lookups',
      'Connection pools prevent creating new connections per request',
      'Read replicas scale read throughput horizontally',
      'Watch for: N+1 queries, missing indexes, connection exhaustion',
    ],
    realWorld: 'Used by: PostgreSQL, MySQL, MongoDB, DynamoDB',
  },
  [COMPONENT_TYPES.SERVICE]: {
    title: 'Service',
    icon: '⚙️',
    tips: [
      'Thread pools bound concurrency — prevents resource exhaustion',
      'Circuit breakers prevent cascading failures across services',
      'Timeouts + retries with exponential backoff handle transient failures',
      'Watch for: thread pool exhaustion, cascading timeouts',
    ],
    realWorld: 'Pattern: Netflix Hystrix, resilience4j, Polly (.NET)',
  },
  [COMPONENT_TYPES.MESSAGE_QUEUE]: {
    title: 'Message Queue',
    icon: '📨',
    tips: [
      'Decouples producers from consumers — async processing',
      'Partitions enable parallel consumption and ordering guarantees',
      'Dead letter queues capture failed messages for later analysis',
      'Consumer lag = production rate > consumption rate',
    ],
    realWorld: 'Used by: Apache Kafka, RabbitMQ, AWS SQS, Redis Streams',
  },
};

function analyzeDesign(nodes, edges, componentStats, metrics) {
  const insights = [];

  // Check for SPOF (Single Point of Failure)
  const nodeMap = {};
  nodes.forEach(n => { nodeMap[n.id] = n; });
  
  const services = nodes.filter(n => n.data.componentType === COMPONENT_TYPES.SERVICE);
  const caches = nodes.filter(n => n.data.componentType === COMPONENT_TYPES.CACHE);
  const dbs = nodes.filter(n => n.data.componentType === COMPONENT_TYPES.DATABASE);
  const lbs = nodes.filter(n => n.data.componentType === COMPONENT_TYPES.LOAD_BALANCER);
  const queues = nodes.filter(n => n.data.componentType === COMPONENT_TYPES.MESSAGE_QUEUE);

  // No redundancy
  if (services.length === 1) {
    insights.push({
      type: 'warning',
      title: 'Single Point of Failure',
      message: 'Only 1 service instance. If it goes down, the entire system fails. Add a Load Balancer with multiple service replicas.',
      category: 'availability',
    });
  }

  // No cache before DB
  if (dbs.length > 0 && caches.length === 0) {
    insights.push({
      type: 'suggestion',
      title: 'No Caching Layer',
      message: 'Direct DB access without caching increases latency and DB load. Add a Cache (Redis) between services and the database.',
      category: 'performance',
    });
  }

  // No rate limiting
  const gateways = nodes.filter(n => n.data.componentType === COMPONENT_TYPES.API_GATEWAY);
  if (gateways.length === 0 && nodes.length > 0) {
    insights.push({
      type: 'warning',
      title: 'No API Gateway / Rate Limiting',
      message: 'Without rate limiting, a traffic spike can overwhelm your system. Add an API Gateway as the entry point.',
      category: 'reliability',
    });
  }

  // Async processing
  if (queues.length === 0 && services.length > 2) {
    insights.push({
      type: 'suggestion',
      title: 'Consider Async Processing',
      message: 'Complex pipelines benefit from message queues. They decouple services and absorb traffic bursts.',
      category: 'scalability',
    });
  }

  // Bottleneck detection from simulation stats
  if (componentStats && Object.keys(componentStats).length > 0) {
    let maxFailed = { id: null, count: 0 };
    let maxQueued = { id: null, count: 0 };

    for (const [id, stats] of Object.entries(componentStats)) {
      if (stats.totalFailed > maxFailed.count) {
        maxFailed = { id, count: stats.totalFailed, label: stats.label };
      }
      if (stats.threadPool?.queued > maxQueued.count) {
        maxQueued = { id, count: stats.threadPool.queued, label: stats.label };
      }
      // Circuit breaker tripped
      if (stats.circuitBreaker?.state === 'OPEN') {
        insights.push({
          type: 'critical',
          title: `Circuit Breaker OPEN: ${stats.label || id}`,
          message: `Circuit breaker tripped after ${stats.circuitBreaker.totalTrips} trip(s). ${stats.circuitBreaker.totalRejected} requests fast-failed. Check downstream health.`,
          category: 'reliability',
        });
      }
    }

    if (maxFailed.count > 100) {
      insights.push({
        type: 'critical',
        title: `Bottleneck: ${maxFailed.label || maxFailed.id}`,
        message: `${maxFailed.count.toLocaleString()} failed requests. This component is the weakest link. Consider scaling it up or adding circuit breakers.`,
        category: 'performance',
      });
    }

    if (maxQueued.count > 10) {
      insights.push({
        type: 'warning',
        title: `Thread Pool Saturation: ${maxQueued.label || maxQueued.id}`,
        message: `${maxQueued.count} requests queued. Increase thread pool size or add more service instances.`,
        category: 'performance',
      });
    }
  }

  // P99 latency check
  if (metrics.latestP99 > 500) {
    insights.push({
      type: 'warning',
      title: 'High P99 Latency',
      message: `P99 latency is ${metrics.latestP99.toFixed(0)}ms. Aim for <200ms. Check for slow database queries or missing indexes.`,
      category: 'performance',
    });
  }

  // Good design patterns detected
  if (gateways.length > 0 && lbs.length > 0 && caches.length > 0 && services.length >= 2) {
    insights.push({
      type: 'success',
      title: 'Solid Architecture!',
      message: 'Your design includes rate limiting, load balancing, caching, and service redundancy. This covers most availability patterns.',
      category: 'design',
    });
  }

  return insights;
}

const INSIGHT_STYLES = {
  critical: { bg: 'bg-red-500/10', border: 'border-red-500/30', icon: AlertTriangle, iconColor: 'text-red-400' },
  warning: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', icon: AlertTriangle, iconColor: 'text-amber-400' },
  suggestion: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', icon: Lightbulb, iconColor: 'text-blue-400' },
  success: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', icon: CheckCircle, iconColor: 'text-emerald-400' },
};

export default function DesignInsights({ onClose }) {
  const nodes = useDesignStore((s) => s.nodes);
  const edges = useDesignStore((s) => s.edges);
  const componentStats = useSimulationStore((s) => s.componentStats);
  const selectedNodeId = useDesignStore((s) => s.selectedNodeId);

  // Get metrics as primitives
  const latestP99 = useMetricsStore((s) => s.latestP99);
  const latestThroughput = useMetricsStore((s) => s.latestThroughput);
  const latestErrorRate = useMetricsStore((s) => s.latestErrorRate);

  const metrics = { latestP99, latestThroughput, latestErrorRate };

  const insights = useMemo(
    () => analyzeDesign(nodes, edges, componentStats, metrics),
    [nodes, edges, componentStats, latestP99, latestThroughput, latestErrorRate]
  );

  // Get learning tips for selected component
  const selectedNode = nodes.find(n => n.id === selectedNodeId);
  const learningTip = selectedNode ? LEARNING_TIPS[selectedNode.data.componentType] : null;

  return (
    <div className="absolute right-4 top-4 w-80 bg-gray-900/95 border border-gray-800 rounded-xl shadow-2xl flex flex-col overflow-hidden backdrop-blur-xl" style={{ maxHeight: 'calc(100% - 32px)', zIndex: 50 }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <h3 className="text-xs font-semibold text-white flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-indigo-400" />
          Design Insights & Learning
        </h3>
        <button onClick={onClose} className="p-1 text-gray-500 hover:text-white rounded">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Architecture insights */}
        {insights.length > 0 && (
          <div>
            <h4 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
              <Zap className="w-3 h-3" /> Architecture Analysis
            </h4>
            <div className="space-y-2">
              {insights.map((insight, i) => {
                const style = INSIGHT_STYLES[insight.type];
                const InsightIcon = style.icon;
                return (
                  <div key={i} className={`${style.bg} border ${style.border} rounded-lg p-2.5`}>
                    <div className="flex items-start gap-2">
                      <InsightIcon className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${style.iconColor}`} />
                      <div>
                        <div className="text-[11px] font-semibold text-white">{insight.title}</div>
                        <div className="text-[10px] text-gray-400 mt-0.5 leading-relaxed">{insight.message}</div>
                        <span className="inline-block mt-1 text-[8px] px-1.5 py-0.5 rounded-full bg-gray-800 text-gray-500 uppercase tracking-wider">
                          {insight.category}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Learning tips for selected component */}
        {learningTip && (
          <div>
            <h4 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
              <BookOpen className="w-3 h-3" /> Learn: {learningTip.title}
            </h4>
            <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-lg p-3">
              <div className="text-sm mb-2">{learningTip.icon}</div>
              <ul className="space-y-1.5">
                {learningTip.tips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-[10px] text-gray-300 leading-relaxed">
                    <ArrowRight className="w-2.5 h-2.5 mt-0.5 text-indigo-400 flex-shrink-0" />
                    {tip}
                  </li>
                ))}
              </ul>
              <div className="mt-2 text-[9px] text-gray-500 border-t border-gray-800 pt-1.5">
                {learningTip.realWorld}
              </div>
            </div>
          </div>
        )}

        {/* Quick reference */}
        {!selectedNode && nodes.length === 0 && (
          <div className="text-center py-8">
            <BookOpen className="w-8 h-8 text-gray-700 mx-auto mb-2" />
            <p className="text-[11px] text-gray-500">Load a scenario or add components to see design insights and learning tips</p>
          </div>
        )}
      </div>
    </div>
  );
}
