// Component types available in the builder
export const COMPONENT_TYPES = {
  API_GATEWAY: 'apiGateway',
  LOAD_BALANCER: 'loadBalancer',
  CACHE: 'cache',
  DATABASE: 'database',
  MESSAGE_QUEUE: 'messageQueue',
  SERVICE: 'service',
};

// Load balancer strategies
export const LB_STRATEGIES = {
  ROUND_ROBIN: 'roundRobin',
  WEIGHTED_ROUND_ROBIN: 'weightedRoundRobin',
  LEAST_CONNECTIONS: 'leastConnections',
  RANDOM: 'random',
};

// Cache eviction strategies
export const CACHE_STRATEGIES = {
  LRU: 'lru',
  LFU: 'lfu',
};

// Simulation states
export const SIM_STATES = {
  IDLE: 'idle',
  RUNNING: 'running',
  PAUSED: 'paused',
  COMPLETED: 'completed',
};

// Event types for simulation
export const EVENT_TYPES = {
  REQUEST_ARRIVE: 'REQUEST_ARRIVE',
  REQUEST_PROCESS: 'REQUEST_PROCESS',
  REQUEST_COMPLETE: 'REQUEST_COMPLETE',
  REQUEST_FAIL: 'REQUEST_FAIL',
  REQUEST_ENQUEUE: 'REQUEST_ENQUEUE',
  REQUEST_DEQUEUE: 'REQUEST_DEQUEUE',
  CACHE_HIT: 'CACHE_HIT',
  CACHE_MISS: 'CACHE_MISS',
  CACHE_EVICT: 'CACHE_EVICT',
  DB_QUERY: 'DB_QUERY',
  DB_QUERY_COMPLETE: 'DB_QUERY_COMPLETE',
  QUEUE_PUBLISH: 'QUEUE_PUBLISH',
  QUEUE_CONSUME: 'QUEUE_CONSUME',
  THREAD_ACQUIRE: 'THREAD_ACQUIRE',
  THREAD_RELEASE: 'THREAD_RELEASE',
  RATE_LIMIT_ALLOW: 'RATE_LIMIT_ALLOW',
  RATE_LIMIT_REJECT: 'RATE_LIMIT_REJECT',
  FAILURE_INJECT: 'FAILURE_INJECT',
  COMPONENT_DOWN: 'COMPONENT_DOWN',
};

// Default configs for each component type
export const DEFAULT_CONFIGS = {
  [COMPONENT_TYPES.API_GATEWAY]: {
    label: 'API Gateway',
    maxRPS: 1000,
    rateLimitEnabled: true,
    rateLimitBucketSize: 100,
    rateLimitRefillRate: 50,
    latencyMs: 2,
    failureRate: 0,
    isDown: false,
  },
  [COMPONENT_TYPES.LOAD_BALANCER]: {
    label: 'Load Balancer',
    strategy: LB_STRATEGIES.ROUND_ROBIN,
    maxConnections: 1000,
    healthCheckIntervalMs: 5000,
    latencyMs: 1,
    failureRate: 0,
    isDown: false,
  },
  [COMPONENT_TYPES.CACHE]: {
    label: 'Cache',
    strategy: CACHE_STRATEGIES.LRU,
    capacity: 1000,
    ttlMs: 60000,
    hitLatencyMs: 2,
    missLatencyMs: 0,
    failureRate: 0,
    isDown: false,
  },
  [COMPONENT_TYPES.DATABASE]: {
    label: 'Database',
    maxConnections: 50,
    indexedQueryLatencyMs: 10,
    fullScanLatencyMs: 200,
    indexHitRate: 0.8,
    tableSize: 1000000,
    readReplicas: 0,
    failureRate: 0,
    isDown: false,
  },
  [COMPONENT_TYPES.MESSAGE_QUEUE]: {
    label: 'Message Queue',
    partitions: 3,
    maxQueueSize: 10000,
    publishLatencyMs: 5,
    consumeLatencyMs: 10,
    maxRetries: 3,
    retryDelayMs: 1000,
    failureRate: 0,
    isDown: false,
  },
  [COMPONENT_TYPES.SERVICE]: {
    label: 'Service',
    instances: 1,
    threadPoolSize: 8,
    threadQueueSize: 64,
    processingTimeMs: 20,
    cpuIntensive: false,
    failureRate: 0,
    isDown: false,
  },
};

// Colors for component types
export const COMPONENT_COLORS = {
  [COMPONENT_TYPES.API_GATEWAY]: { bg: '#0f172a', border: '#6366f1', text: '#a5b4fc', accent: '#818cf8' },
  [COMPONENT_TYPES.LOAD_BALANCER]: { bg: '#0f172a', border: '#8b5cf6', text: '#c4b5fd', accent: '#a78bfa' },
  [COMPONENT_TYPES.CACHE]: { bg: '#0f172a', border: '#f59e0b', text: '#fcd34d', accent: '#fbbf24' },
  [COMPONENT_TYPES.DATABASE]: { bg: '#0f172a', border: '#10b981', text: '#6ee7b7', accent: '#34d399' },
  [COMPONENT_TYPES.MESSAGE_QUEUE]: { bg: '#0f172a', border: '#f43f5e', text: '#fda4af', accent: '#fb7185' },
  [COMPONENT_TYPES.SERVICE]: { bg: '#0f172a', border: '#06b6d4', text: '#67e8f9', accent: '#22d3ee' },
};

// Simulation speed presets
export const SPEED_PRESETS = [
  { label: '0.5x', value: 0.5 },
  { label: '1x', value: 1 },
  { label: '2x', value: 2 },
  { label: '5x', value: 5 },
  { label: '10x', value: 10 },
];

// Chart colors
export const CHART_COLORS = {
  p50: '#22d3ee',
  p95: '#f59e0b',
  p99: '#f43f5e',
  throughput: '#10b981',
  errors: '#ef4444',
  cacheHit: '#22c55e',
  cacheMiss: '#ef4444',
  threadActive: '#8b5cf6',
  threadIdle: '#374151',
  queueDepth: '#f59e0b',
};
