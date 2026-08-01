import React from 'react';
import {
  ReactFlow,
  Controls,
  MiniMap,
  Node,
  Edge,
  NodeTypes,
  ConnectionMode,
  type NodeChange,
  type EdgeChange,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { DocumentNode } from './nodes/DocumentNode';
import { TaskNode } from './nodes/TaskNode';
import { PersonaNode } from './nodes/PersonaNode';

const nodeTypes: NodeTypes = {
  document: DocumentNode,
  task: TaskNode,
  persona: PersonaNode,
};

interface NeuralCanvasProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange?: (changes: NodeChange[]) => void;
  onEdgesChange?: (changes: EdgeChange[]) => void;
}

export const NeuralCanvas: React.FC<NeuralCanvasProps> = ({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
}) => {
  return (
    <div className="w-full h-full bg-[#050505]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange as any}
        onEdgesChange={onEdgesChange as any}
        connectionMode={ConnectionMode.Loose}
        fitView
        className="dark"
        defaultEdgeOptions={{
          animated: true,
          style: { stroke: '#888', strokeWidth: 2 },
          className: 'hover:stroke-blue-400 transition-colors',
        }}
      >
        <Controls className="!bg-[#111] !border-[#333] !fill-gray-300" />
        <MiniMap 
          nodeColor={(node) => {
            switch (node.type) {
              case 'document': return '#64c8ff';
              case 'task': return '#64ff96';
              case 'persona': return '#a855f7';
              default: return '#555';
            }
          }}
          maskColor="rgba(5, 5, 5, 0.7)"
          className="!bg-[#111] !border-[#333]"
        />
      </ReactFlow>
    </div>
  );
};

export default NeuralCanvas;
