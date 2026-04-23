import React, { useCallback, useRef, useMemo, useEffect, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  MarkerType,
  ReactFlowProvider,
  applyNodeChanges,
  applyEdgeChanges,
} from 'reactflow';
import 'reactflow/dist/style.css';
import CustomNode from './nodes/CustomNode';
import AnimatedEdge from './edges/AnimatedEdge';
import useDesignStore from '../../store/useDesignStore';
import { COMPONENT_COLORS } from '../../utils/constants';

const nodeTypes = { customNode: CustomNode };
const edgeTypes = { animated: AnimatedEdge };

const defaultEdgeOptions = {
  animated: true,
  style: { stroke: '#4f46e5', strokeWidth: 2 },
  markerEnd: { type: MarkerType.ArrowClosed, color: '#4f46e5', width: 15, height: 15 },
};

function CanvasInner() {
  const reactFlowWrapper = useRef(null);
  const rfInstance = useRef(null);
  const { nodes: storeNodes, edges: storeEdges, setNodes, setEdges, addNode, addEdge: addStoreEdge } = useDesignStore();
  
  // Use local state synced with store — this is the pattern React Flow recommends
  const [rfNodes, setRfNodes] = useState(storeNodes);
  const [rfEdges, setRfEdges] = useState(storeEdges);

  // Sync store → local when store changes (e.g., scenario load)
  useEffect(() => {
    setRfNodes(storeNodes);
    setRfEdges(storeEdges);
    // Auto fit after scenario load
    if (storeNodes.length > 0 && rfInstance.current) {
      setTimeout(() => rfInstance.current.fitView({ padding: 0.3, duration: 300 }), 100);
      setTimeout(() => rfInstance.current.fitView({ padding: 0.3, duration: 300 }), 500);
    }
  }, [storeNodes, storeEdges]);

  const onInit = useCallback((instance) => {
    rfInstance.current = instance;
    if (storeNodes.length > 0) {
      setTimeout(() => instance.fitView({ padding: 0.3, duration: 300 }), 200);
    }
  }, [storeNodes.length]);

  const onNodesChange = useCallback(
    (changes) => {
      setRfNodes((nds) => {
        const updated = applyNodeChanges(changes, nds);
        // Sync position changes back to store
        const posChanges = changes.filter((c) => c.type === 'position' && c.dragging === false);
        if (posChanges.length > 0) {
          setNodes(updated);
        }
        // Sync removals
        const removals = changes.filter((c) => c.type === 'remove');
        if (removals.length > 0) {
          setNodes(updated);
        }
        return updated;
      });
    },
    [setNodes]
  );

  const onEdgesChange = useCallback(
    (changes) => {
      setRfEdges((eds) => {
        const updated = applyEdgeChanges(changes, eds);
        const removals = changes.filter((c) => c.type === 'remove');
        if (removals.length > 0) {
          setEdges(updated);
        }
        return updated;
      });
    },
    [setEdges]
  );

  const onConnect = useCallback(
    (connection) => {
      const newEdge = {
        ...connection,
        id: `${connection.source}-${connection.target}`,
        animated: true,
        style: { stroke: '#4f46e5', strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#4f46e5', width: 15, height: 15 },
      };
      addStoreEdge(newEdge);
    },
    [addStoreEdge]
  );

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      const componentType = event.dataTransfer.getData('application/reactflow');
      if (!componentType) return;

      const bounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = {
        x: event.clientX - bounds.left - 80,
        y: event.clientY - bounds.top - 30,
      };

      addNode(componentType, position);
    },
    [addNode]
  );

  const styledEdges = useMemo(() =>
    rfEdges.map((e) => ({
      ...e,
      type: 'animated',
      animated: false, // we handle animation in AnimatedEdge
      style: e.style || { stroke: '#4f46e5', strokeWidth: 2 },
      markerEnd: e.markerEnd || { type: MarkerType.ArrowClosed, color: '#4f46e5', width: 15, height: 15 },
    })),
    [rfEdges]
  );

  return (
    <div ref={reactFlowWrapper} className="flex-1 h-full">
      <ReactFlow
        nodes={rfNodes}
        edges={styledEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onInit={onInit}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        snapToGrid
        snapGrid={[15, 15]}
        className="bg-gray-950"
        deleteKeyCode="Delete"
        multiSelectionKeyCode="Shift"
      >
        <Background color="#1e293b" gap={20} size={1} variant="dots" />
        <Controls
          className="!bg-gray-800 !border-gray-700 !rounded-lg !shadow-xl [&>button]:!bg-gray-800 [&>button]:!border-gray-700 [&>button]:!text-gray-300 [&>button:hover]:!bg-gray-700"
        />
        <MiniMap
          nodeColor={(node) => {
            const colors = COMPONENT_COLORS[node.data?.componentType];
            return colors?.border || '#4f46e5';
          }}
          className="!bg-gray-900 !border-gray-700 !rounded-lg"
          maskColor="rgba(0,0,0,0.7)"
        />
      </ReactFlow>
    </div>
  );
}

export default function Canvas() {
  return (
    <ReactFlowProvider>
      <CanvasInner />
    </ReactFlowProvider>
  );
}
