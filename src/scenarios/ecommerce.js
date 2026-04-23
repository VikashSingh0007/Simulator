import { COMPONENT_TYPES, DEFAULT_CONFIGS, LB_STRATEGIES, CACHE_STRATEGIES } from '../utils/constants.js';

/**
 * E-Commerce Checkout Scenario
 * Architecture: Gateway → LB → Order Service (with Circuit Breaker) → {Payment Service, Inventory Service} → DB
 * 
 * Demonstrates:
 * - Circuit Breaker pattern (protects against slow/failing Payment service)
 * - Message Queue for async order processing  
 * - Cache stampede avoidance (inventory reads)
 * - Cascading failure potential
 */
export const ecommerceScenario = {
  name: 'E-Commerce Checkout',
  description: 'Order processing pipeline with circuit breaker, message queue, and multiple microservices. Great for learning cascading failure patterns.',
  icon: '🛒',
  difficulty: 'Advanced',
  trafficConfig: {
    rps: 150,
    burstFactor: 5,
    burstInterval: 10,
    burstDuration: 3,
    readWriteRatio: 40, // write-heavy (orders)
  },
  simulationDuration: 30,
  nodes: [
    {
      id: 'ec_gateway',
      type: 'customNode',
      position: { x: 50, y: 250 },
      data: {
        componentType: COMPONENT_TYPES.API_GATEWAY,
        config: {
          ...DEFAULT_CONFIGS[COMPONENT_TYPES.API_GATEWAY],
          label: 'API Gateway',
          rateLimitBucketSize: 300,
          rateLimitRefillRate: 150,
        },
        label: 'API Gateway',
      },
    },
    {
      id: 'ec_lb',
      type: 'customNode',
      position: { x: 280, y: 250 },
      data: {
        componentType: COMPONENT_TYPES.LOAD_BALANCER,
        config: {
          ...DEFAULT_CONFIGS[COMPONENT_TYPES.LOAD_BALANCER],
          label: 'Load Balancer',
          strategy: LB_STRATEGIES.LEAST_CONNECTIONS,
        },
        label: 'Load Balancer',
      },
    },
    {
      id: 'ec_order_svc',
      type: 'customNode',
      position: { x: 510, y: 150 },
      data: {
        componentType: COMPONENT_TYPES.SERVICE,
        config: {
          ...DEFAULT_CONFIGS[COMPONENT_TYPES.SERVICE],
          label: 'Order Service',
          threadPoolSize: 16,
          processingTimeMs: 15,
          circuitBreakerEnabled: true,
          cbFailureThreshold: 5,
          cbRecoveryTimeMs: 4000,
        },
        label: 'Order Service',
      },
    },
    {
      id: 'ec_payment_svc',
      type: 'customNode',
      position: { x: 510, y: 350 },
      data: {
        componentType: COMPONENT_TYPES.SERVICE,
        config: {
          ...DEFAULT_CONFIGS[COMPONENT_TYPES.SERVICE],
          label: 'Payment Service',
          threadPoolSize: 4,  // deliberately small — bottleneck!
          processingTimeMs: 50, // slow — external API call simulation
          failureRate: 0.03, // 3% failure rate (realistic for external APIs)
          circuitBreakerEnabled: true,
          cbFailureThreshold: 3,
          cbRecoveryTimeMs: 6000,
        },
        label: 'Payment Service',
      },
    },
    {
      id: 'ec_inventory_cache',
      type: 'customNode',
      position: { x: 750, y: 150 },
      data: {
        componentType: COMPONENT_TYPES.CACHE,
        config: {
          ...DEFAULT_CONFIGS[COMPONENT_TYPES.CACHE],
          label: 'Inventory Cache',
          strategy: CACHE_STRATEGIES.LFU,
          capacity: 2000,
          hitLatencyMs: 1,
        },
        label: 'Inventory Cache',
      },
    },
    {
      id: 'ec_queue',
      type: 'customNode',
      position: { x: 750, y: 350 },
      data: {
        componentType: COMPONENT_TYPES.MESSAGE_QUEUE,
        config: {
          ...DEFAULT_CONFIGS[COMPONENT_TYPES.MESSAGE_QUEUE],
          label: 'Order Events',
          partitions: 4,
          maxQueueSize: 5000,
        },
        label: 'Order Events',
      },
    },
    {
      id: 'ec_orders_db',
      type: 'customNode',
      position: { x: 990, y: 150 },
      data: {
        componentType: COMPONENT_TYPES.DATABASE,
        config: {
          ...DEFAULT_CONFIGS[COMPONENT_TYPES.DATABASE],
          label: 'Orders DB',
          maxConnections: 40,
          indexedQueryLatencyMs: 5,
          fullScanLatencyMs: 100,
          indexHitRate: 0.9,
        },
        label: 'Orders DB',
      },
    },
    {
      id: 'ec_notif_svc',
      type: 'customNode',
      position: { x: 990, y: 350 },
      data: {
        componentType: COMPONENT_TYPES.SERVICE,
        config: {
          ...DEFAULT_CONFIGS[COMPONENT_TYPES.SERVICE],
          label: 'Notification Svc',
          threadPoolSize: 8,
          processingTimeMs: 10,
        },
        label: 'Notification Svc',
      },
    },
  ],
  edges: [
    { id: 'ec_gateway-ec_lb', source: 'ec_gateway', target: 'ec_lb' },
    { id: 'ec_lb-ec_order_svc', source: 'ec_lb', target: 'ec_order_svc' },
    { id: 'ec_lb-ec_payment_svc', source: 'ec_lb', target: 'ec_payment_svc' },
    { id: 'ec_order_svc-ec_inventory_cache', source: 'ec_order_svc', target: 'ec_inventory_cache' },
    { id: 'ec_payment_svc-ec_queue', source: 'ec_payment_svc', target: 'ec_queue' },
    { id: 'ec_inventory_cache-ec_orders_db', source: 'ec_inventory_cache', target: 'ec_orders_db' },
    { id: 'ec_queue-ec_notif_svc', source: 'ec_queue', target: 'ec_notif_svc' },
  ],
};
