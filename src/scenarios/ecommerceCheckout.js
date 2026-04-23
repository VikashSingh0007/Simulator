import { COMPONENT_TYPES, DEFAULT_CONFIGS, LB_STRATEGIES } from '../utils/constants.js';

/**
 * E-commerce Checkout Scenario
 * Architecture: API Gateway → LB → Order Service → Message Queue → Payment/Inventory Services → Database
 * Write-heavy (30/70 read/write), demonstrates message queue decoupling, locking, backpressure.
 */
export const ecommerceCheckoutScenario = {
  name: 'E-commerce Checkout',
  description: 'Write-heavy checkout flow with message queues. Demonstrates queue decoupling, DB locking contention, and backpressure under load.',
  icon: '🛒',
  difficulty: 'Advanced',
  trafficConfig: {
    rps: 150,
    burstFactor: 5,
    burstInterval: 20,
    burstDuration: 5,
    readWriteRatio: 30,
  },
  simulationDuration: 30,
  nodes: [
    {
      id: 'gw_ecom',
      type: 'customNode',
      position: { x: 50, y: 250 },
      data: {
        componentType: COMPONENT_TYPES.API_GATEWAY,
        config: {
          ...DEFAULT_CONFIGS[COMPONENT_TYPES.API_GATEWAY],
          label: 'Checkout Gateway',
          rateLimitBucketSize: 300,
          rateLimitRefillRate: 150,
        },
        label: 'Checkout Gateway',
      },
    },
    {
      id: 'lb_ecom',
      type: 'customNode',
      position: { x: 280, y: 250 },
      data: {
        componentType: COMPONENT_TYPES.LOAD_BALANCER,
        config: {
          ...DEFAULT_CONFIGS[COMPONENT_TYPES.LOAD_BALANCER],
          label: 'LB',
          strategy: LB_STRATEGIES.LEAST_CONNECTIONS,
        },
        label: 'LB',
      },
    },
    {
      id: 'order_svc',
      type: 'customNode',
      position: { x: 500, y: 250 },
      data: {
        componentType: COMPONENT_TYPES.SERVICE,
        config: {
          ...DEFAULT_CONFIGS[COMPONENT_TYPES.SERVICE],
          label: 'Order Service',
          threadPoolSize: 32,
          threadQueueSize: 128,
          processingTimeMs: 15,
        },
        label: 'Order Service',
      },
    },
    {
      id: 'mq_orders',
      type: 'customNode',
      position: { x: 730, y: 250 },
      data: {
        componentType: COMPONENT_TYPES.MESSAGE_QUEUE,
        config: {
          ...DEFAULT_CONFIGS[COMPONENT_TYPES.MESSAGE_QUEUE],
          label: 'Order Queue',
          partitions: 4,
          maxQueueSize: 5000,
          publishLatencyMs: 3,
          consumeLatencyMs: 8,
        },
        label: 'Order Queue',
      },
    },
    {
      id: 'payment_svc',
      type: 'customNode',
      position: { x: 980, y: 150 },
      data: {
        componentType: COMPONENT_TYPES.SERVICE,
        config: {
          ...DEFAULT_CONFIGS[COMPONENT_TYPES.SERVICE],
          label: 'Payment Service',
          threadPoolSize: 8,
          processingTimeMs: 50,
          failureRate: 0.02,
        },
        label: 'Payment Service',
      },
    },
    {
      id: 'inventory_svc',
      type: 'customNode',
      position: { x: 980, y: 350 },
      data: {
        componentType: COMPONENT_TYPES.SERVICE,
        config: {
          ...DEFAULT_CONFIGS[COMPONENT_TYPES.SERVICE],
          label: 'Inventory Service',
          threadPoolSize: 8,
          processingTimeMs: 25,
        },
        label: 'Inventory Service',
      },
    },
    {
      id: 'db_payments',
      type: 'customNode',
      position: { x: 1220, y: 150 },
      data: {
        componentType: COMPONENT_TYPES.DATABASE,
        config: {
          ...DEFAULT_CONFIGS[COMPONENT_TYPES.DATABASE],
          label: 'Payments DB',
          maxConnections: 20,
          indexedQueryLatencyMs: 15,
          fullScanLatencyMs: 300,
          indexHitRate: 0.85,
        },
        label: 'Payments DB',
      },
    },
    {
      id: 'db_inventory',
      type: 'customNode',
      position: { x: 1220, y: 350 },
      data: {
        componentType: COMPONENT_TYPES.DATABASE,
        config: {
          ...DEFAULT_CONFIGS[COMPONENT_TYPES.DATABASE],
          label: 'Inventory DB',
          maxConnections: 15,
          indexedQueryLatencyMs: 10,
          fullScanLatencyMs: 250,
          indexHitRate: 0.7,
        },
        label: 'Inventory DB',
      },
    },
  ],
  edges: [
    { id: 'gw_ecom-lb_ecom', source: 'gw_ecom', target: 'lb_ecom' },
    { id: 'lb_ecom-order_svc', source: 'lb_ecom', target: 'order_svc' },
    { id: 'order_svc-mq_orders', source: 'order_svc', target: 'mq_orders' },
    { id: 'mq_orders-payment_svc', source: 'mq_orders', target: 'payment_svc' },
    { id: 'mq_orders-inventory_svc', source: 'mq_orders', target: 'inventory_svc' },
    { id: 'payment_svc-db_payments', source: 'payment_svc', target: 'db_payments' },
    { id: 'inventory_svc-db_inventory', source: 'inventory_svc', target: 'db_inventory' },
  ],
};
