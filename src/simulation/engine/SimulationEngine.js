import { EventQueue } from './EventQueue.js';
import { SimulationClock } from './SimulationClock.js';
import { TrafficGenerator } from './TrafficGenerator.js';
import { MetricsCollector } from '../metrics/MetricsCollector.js';
import { ComponentFactory } from '../components/ComponentFactory.js';
import { EVENT_TYPES } from '../../utils/constants.js';

/**
 * SimulationEngine - Core discrete event simulation engine.
 * Processes events in virtual time order using a priority queue.
 * Runs in a Web Worker for non-blocking execution.
 */
export class SimulationEngine {
  constructor() {
    this.eventQueue = new EventQueue();
    this.clock = new SimulationClock();
    this.trafficGenerator = new TrafficGenerator();
    this.metricsCollector = new MetricsCollector();
    this.components = new Map(); // id → component instance
    this.edges = []; // { source, target }
    this.isRunning = false;
    this.isPaused = false;
    this.speed = 1;
    this.maxEventsPerTick = 500;
    this.simulationDuration = 30000; // Default 30s of virtual time
    this.entryComponentId = null;
    this.eventsProcessed = 0;
    this.onMetrics = null; // Callback for metrics updates
    this.onComponentStats = null; // Callback for component stats
    this.tickInterval = null;
  }

  /**
   * Initialize the simulation with a design (nodes + edges).
   */
  initialize(design) {
    this.reset();

    const { nodes, edges, trafficConfig } = design;

    // Create component instances
    for (const node of nodes) {
      const component = ComponentFactory.create(
        node.id,
        node.data.componentType,
        node.data.config,
        this.metricsCollector
      );
      this.components.set(node.id, component);
    }

    // Wire up edges (set downstream IDs)
    this.edges = edges;
    for (const edge of edges) {
      const sourceComponent = this.components.get(edge.source);
      if (sourceComponent) {
        sourceComponent.downstreamIds.push(edge.target);
      }
    }

    // Find entry component (node with no incoming edges, or API Gateway type)
    const nodesWithIncoming = new Set(edges.map(e => e.target));
    for (const node of nodes) {
      if (!nodesWithIncoming.has(node.id)) {
        this.entryComponentId = node.id;
        break;
      }
    }

    // Configure traffic generator
    if (trafficConfig) {
      this.trafficGenerator.updateConfig(trafficConfig);
    }

    if (design.simulationDuration) {
      this.simulationDuration = design.simulationDuration;
    }
  }

  /**
   * Start the simulation.
   */
  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.isPaused = false;

    // Generate initial batch of traffic events
    if (this.entryComponentId) {
      const events = this.trafficGenerator.generateEvents(
        this.clock.now,
        Math.min(2000, this.simulationDuration), // Generate 2s ahead
        this.entryComponentId
      );
      for (const event of events) {
        this.eventQueue.enqueue(event);
      }
    }

    this._run();
  }

  /**
   * Main simulation loop.
   * Processes events in batches to avoid blocking.
   */
  _run() {
    if (!this.isRunning || this.isPaused) return;

    const startRealTime = Date.now();
    let eventsThisTick = 0;

    // Process events
    while (!this.eventQueue.isEmpty() && eventsThisTick < this.maxEventsPerTick) {
      const event = this.eventQueue.peek();
      
      // Check if simulation is over
      if (event.timestamp > this.simulationDuration) {
        this.stop();
        return;
      }

      this.eventQueue.dequeue();
      this.clock.setTime(event.timestamp);

      // Route event to target component
      if (event.target && this.components.has(event.target)) {
        const component = this.components.get(event.target);
        const newEvents = component.process(event, this.clock.now);
        
        for (const newEvent of newEvents) {
          this.eventQueue.enqueue(newEvent);
        }
      } else if (event.type === EVENT_TYPES.REQUEST_FAIL) {
        // Failed request already recorded by the component
        // No need to record again
      }

      this.eventsProcessed++;
      eventsThisTick++;
    }

    // Generate more traffic if needed
    if (this.entryComponentId) {
      const generatedUpTo = this.clock.now + 2000;
      if (generatedUpTo < this.simulationDuration) {
        const events = this.trafficGenerator.generateEvents(
          this.clock.now,
          1000, // Generate 1 second of traffic
          this.entryComponentId
        );
        for (const event of events) {
          this.eventQueue.enqueue(event);
        }
      }
    }

    // Emit metrics snapshot
    if (this.onMetrics) {
      const snapshot = this.metricsCollector.snapshot(this.clock.now);
      snapshot.eventsProcessed = this.eventsProcessed;
      snapshot.virtualTime = this.clock.now;
      snapshot.eventQueueSize = this.eventQueue.size;
      this.onMetrics(snapshot);
    }

    // Emit component stats
    if (this.onComponentStats) {
      const stats = {};
      for (const [id, component] of this.components) {
        stats[id] = component.getStats();
      }
      this.onComponentStats(stats);
    }

    // Schedule next tick adjusted for speed
    if (this.isRunning && !this.isPaused) {
      const tickDelay = Math.max(16, 100 / this.speed); // 60fps max, scale with speed
      this.tickInterval = setTimeout(() => this._run(), tickDelay);
    }
  }

  pause() {
    this.isPaused = true;
    if (this.tickInterval) {
      clearTimeout(this.tickInterval);
      this.tickInterval = null;
    }
  }

  resume() {
    if (!this.isRunning) return;
    this.isPaused = false;
    this._run();
  }

  stop() {
    this.isRunning = false;
    this.isPaused = false;
    if (this.tickInterval) {
      clearTimeout(this.tickInterval);
      this.tickInterval = null;
    }

    // Final metrics snapshot
    if (this.onMetrics) {
      const snapshot = this.metricsCollector.snapshot(this.clock.now);
      snapshot.eventsProcessed = this.eventsProcessed;
      snapshot.virtualTime = this.clock.now;
      snapshot.eventQueueSize = this.eventQueue.size;
      snapshot.completed = true;
      this.onMetrics(snapshot);
    }
  }

  reset() {
    this.stop();
    this.eventQueue.clear();
    this.clock.reset();
    this.metricsCollector.reset();
    this.components.clear();
    this.edges = [];
    this.eventsProcessed = 0;
    this.entryComponentId = null;
  }

  setSpeed(speed) {
    this.speed = speed;
    this.clock.setSpeed(speed);
    this.maxEventsPerTick = Math.floor(500 * speed);
  }

  /**
   * Inject a failure into a component.
   */
  injectFailure(componentId, failureType, value) {
    const component = this.components.get(componentId);
    if (!component) return;

    switch (failureType) {
      case 'kill':
        component.setDown(true);
        break;
      case 'revive':
        component.setDown(false);
        break;
      case 'addLatency':
        component.setInjectedLatency(value || 500);
        break;
      case 'removeLatency':
        component.setInjectedLatency(0);
        break;
      case 'setFailureRate':
        component.updateConfig({ failureRate: value || 0.1 });
        break;
    }
  }

  getState() {
    return {
      isRunning: this.isRunning,
      isPaused: this.isPaused,
      virtualTime: this.clock.now,
      eventsProcessed: this.eventsProcessed,
      eventQueueSize: this.eventQueue.size,
      speed: this.speed,
    };
  }
}
