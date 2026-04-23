import { create } from 'zustand';
import { SimulationEngine } from '../simulation/engine/SimulationEngine.js';
import { SIM_STATES } from '../utils/constants.js';

// Create a shared engine instance
const engine = new SimulationEngine();

/**
 * Simulation Store - Controls simulation lifecycle and communicates with the engine.
 */
const useSimulationStore = create((set, get) => ({
  status: SIM_STATES.IDLE,
  speed: 1,
  virtualTime: 0,
  eventsProcessed: 0,
  eventQueueSize: 0,
  componentStats: {},
  
  // Traffic configuration
  trafficConfig: {
    rps: 100,
    burstFactor: 1,
    burstInterval: 10,
    burstDuration: 2,
    readWriteRatio: 80,
  },

  simulationDuration: 30, // seconds

  // Initialize simulation
  initSimulation: (nodes, edges) => {
    const state = get();
    engine.initialize({
      nodes,
      edges,
      trafficConfig: state.trafficConfig,
      simulationDuration: state.simulationDuration * 1000,
    });

    // Set up callbacks
    engine.onMetrics = (snapshot) => {
      set({
        virtualTime: snapshot.virtualTime,
        eventsProcessed: snapshot.eventsProcessed,
        eventQueueSize: snapshot.eventQueueSize,
      });
      // Store metrics in metrics store (done via external callback)
      const metricsCallback = get()._metricsCallback;
      if (metricsCallback) metricsCallback(snapshot);

      if (snapshot.completed) {
        set({ status: SIM_STATES.COMPLETED });
      }
    };

    engine.onComponentStats = (stats) => {
      set({ componentStats: stats });
    };
  },

  // Set metrics callback (set by App to connect to metrics store)
  setMetricsCallback: (cb) => set({ _metricsCallback: cb }),

  // Start simulation
  startSimulation: () => {
    engine.start();
    set({ status: SIM_STATES.RUNNING });
  },

  // Pause simulation
  pauseSimulation: () => {
    engine.pause();
    set({ status: SIM_STATES.PAUSED });
  },

  // Resume simulation
  resumeSimulation: () => {
    engine.resume();
    set({ status: SIM_STATES.RUNNING });
  },

  // Stop simulation
  stopSimulation: () => {
    engine.stop();
    set({ status: SIM_STATES.COMPLETED });
  },

  // Reset simulation
  resetSimulation: () => {
    engine.reset();
    set({
      status: SIM_STATES.IDLE,
      virtualTime: 0,
      eventsProcessed: 0,
      eventQueueSize: 0,
      componentStats: {},
    });
  },

  // Set speed
  setSpeed: (speed) => {
    engine.setSpeed(speed);
    set({ speed });
  },

  // Update traffic config
  updateTrafficConfig: (config) => {
    set((state) => ({
      trafficConfig: { ...state.trafficConfig, ...config },
    }));
  },

  setSimulationDuration: (seconds) => {
    set({ simulationDuration: seconds });
  },

  // Inject failure
  injectFailure: (componentId, failureType, value) => {
    engine.injectFailure(componentId, failureType, value);
    // Update component stats immediately
    const stats = {};
    for (const [id, component] of engine.components) {
      stats[id] = component.getStats();
    }
    set({ componentStats: stats });
  },

  // Get engine reference
  getEngine: () => engine,
}));

export default useSimulationStore;
