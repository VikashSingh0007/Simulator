import { COMPONENT_TYPES, DEFAULT_CONFIGS, LB_STRATEGIES, CACHE_STRATEGIES } from '../utils/constants.js';

/**
 * URL Shortener Scenario
 * Architecture: Client → API Gateway → Load Balancer → Service 1/2 → Cache (LRU) → Database
 * Read-heavy (90/10), high cache hit rate expected after warmup.
 */
export const urlShortenerScenario = {
  name: 'URL Shortener',
  description: 'Read-heavy URL shortening service with caching. Demonstrates cache effectiveness, LB strategies, and rate limiting.',
  icon: '🔗',
  difficulty: 'Beginner',
  trafficConfig: {
    rps: 200,
    burstFactor: 3,
    burstInterval: 15,
    burstDuration: 3,
    readWriteRatio: 90,
  },
  simulationDuration: 30,
  nodes: [
    {
      id: 'gateway_1',
      type: 'customNode',
      position: { x: 100, y: 250 },
      data: {
        componentType: COMPONENT_TYPES.API_GATEWAY,
        config: {
          ...DEFAULT_CONFIGS[COMPONENT_TYPES.API_GATEWAY],
          label: 'API Gateway',
          maxRPS: 500,
          rateLimitBucketSize: 200,
          rateLimitRefillRate: 100,
        },
        label: 'API Gateway',
      },
    },
    {
      id: 'lb_1',
      type: 'customNode',
      position: { x: 350, y: 250 },
      data: {
        componentType: COMPONENT_TYPES.LOAD_BALANCER,
        config: {
          ...DEFAULT_CONFIGS[COMPONENT_TYPES.LOAD_BALANCER],
          label: 'Load Balancer',
          strategy: LB_STRATEGIES.ROUND_ROBIN,
        },
        label: 'Load Balancer',
      },
    },
    {
      id: 'service_1',
      type: 'customNode',
      position: { x: 600, y: 150 },
      data: {
        componentType: COMPONENT_TYPES.SERVICE,
        config: {
          ...DEFAULT_CONFIGS[COMPONENT_TYPES.SERVICE],
          label: 'URL Service 1',
          threadPoolSize: 16,
          processingTimeMs: 5,
        },
        label: 'URL Service 1',
      },
    },
    {
      id: 'service_2',
      type: 'customNode',
      position: { x: 600, y: 350 },
      data: {
        componentType: COMPONENT_TYPES.SERVICE,
        config: {
          ...DEFAULT_CONFIGS[COMPONENT_TYPES.SERVICE],
          label: 'URL Service 2',
          threadPoolSize: 16,
          processingTimeMs: 5,
        },
        label: 'URL Service 2',
      },
    },
    {
      id: 'cache_1',
      type: 'customNode',
      position: { x: 850, y: 250 },
      data: {
        componentType: COMPONENT_TYPES.CACHE,
        config: {
          ...DEFAULT_CONFIGS[COMPONENT_TYPES.CACHE],
          label: 'Redis Cache',
          strategy: CACHE_STRATEGIES.LRU,
          capacity: 500,
          hitLatencyMs: 1,
        },
        label: 'Redis Cache',
      },
    },
    {
      id: 'db_1',
      type: 'customNode',
      position: { x: 1100, y: 250 },
      data: {
        componentType: COMPONENT_TYPES.DATABASE,
        config: {
          ...DEFAULT_CONFIGS[COMPONENT_TYPES.DATABASE],
          label: 'URL Database',
          maxConnections: 30,
          indexedQueryLatencyMs: 8,
          fullScanLatencyMs: 150,
          indexHitRate: 0.95,
        },
        label: 'URL Database',
      },
    },
  ],
  edges: [
    { id: 'gateway_1-lb_1', source: 'gateway_1', target: 'lb_1' },
    { id: 'lb_1-service_1', source: 'lb_1', target: 'service_1' },
    { id: 'lb_1-service_2', source: 'lb_1', target: 'service_2' },
    { id: 'service_1-cache_1', source: 'service_1', target: 'cache_1' },
    { id: 'service_2-cache_1', source: 'service_2', target: 'cache_1' },
    { id: 'cache_1-db_1', source: 'cache_1', target: 'db_1' },
  ],
};
