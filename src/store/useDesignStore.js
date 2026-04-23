import { create } from 'zustand';
import { DEFAULT_CONFIGS, COMPONENT_TYPES } from '../utils/constants.js';
import { generateId } from '../utils/helpers.js';

/**
 * Design Store - Manages the visual builder state (nodes, edges, component configs).
 */
const useDesignStore = create((set, get) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,

  // Set nodes (for React Flow controlled updates)
  setNodes: (nodes) => set({ nodes }),

  // Set edges
  setEdges: (edges) => set({ edges }),

  // Add a new component node
  addNode: (type, position) => {
    const id = `${type}_${generateId()}`;
    const config = { ...DEFAULT_CONFIGS[type] };
    const newNode = {
      id,
      type: 'customNode',
      position,
      data: {
        componentType: type,
        config,
        label: config.label,
      },
    };
    set((state) => ({
      nodes: [...state.nodes, newNode],
    }));
    return id;
  },

  // Remove a node
  removeNode: (nodeId) => {
    set((state) => ({
      nodes: state.nodes.filter((n) => n.id !== nodeId),
      edges: state.edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
      selectedNodeId: state.selectedNodeId === nodeId ? null : state.selectedNodeId,
    }));
  },

  // Add an edge
  addEdge: (edge) => {
    set((state) => ({
      edges: [...state.edges, { ...edge, id: `${edge.source}-${edge.target}` }],
    }));
  },

  // Remove an edge
  removeEdge: (edgeId) => {
    set((state) => ({
      edges: state.edges.filter((e) => e.id !== edgeId),
    }));
  },

  // Select a node
  selectNode: (nodeId) => set({ selectedNodeId: nodeId }),

  // Update node config
  updateNodeConfig: (nodeId, configUpdate) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              data: {
                ...node.data,
                config: { ...node.data.config, ...configUpdate },
                label: configUpdate.label || node.data.config.label,
              },
            }
          : node
      ),
    }));
  },

  // Get selected node
  getSelectedNode: () => {
    const state = get();
    return state.nodes.find((n) => n.id === state.selectedNodeId) || null;
  },

  // Load a scenario
  loadScenario: (scenario) => {
    set({
      nodes: scenario.nodes,
      edges: scenario.edges,
      selectedNodeId: null,
    });
  },

  // Export design as JSON
  exportDesign: () => {
    const state = get();
    return {
      nodes: state.nodes,
      edges: state.edges,
      version: '1.0',
      exportedAt: new Date().toISOString(),
    };
  },

  // Import design from JSON
  importDesign: (design) => {
    if (design.nodes && design.edges) {
      set({
        nodes: design.nodes,
        edges: design.edges,
        selectedNodeId: null,
      });
    }
  },

  // Clear canvas
  clearDesign: () => {
    set({ nodes: [], edges: [], selectedNodeId: null });
  },
}));

export default useDesignStore;
