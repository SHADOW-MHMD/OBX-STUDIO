'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
// Import three for types/colors
import * as THREE from 'three';
// Dynamically import the graph to avoid SSR issues
const ForceGraph3D = dynamic(() => import('react-force-graph-3d'), { ssr: false });
// Cannot use import statement for SpriteText in SSR if it accesses window, but we'll import it dynamically or just use it inside a useEffect/useMemo.
// Actually, it's safer to require it inside the nodeThreeObject callback or dynamically load it.

export interface Node3D {
  id: string;
  name: string;
  group?: number;
  val?: number;
  color?: string;
  x?: number;
  y?: number;
  z?: number;
  vx?: number;
  vy?: number;
  vz?: number;
}

export interface Link3D {
  source: string | Node3D;
  target: string | Node3D;
}

interface NeuralCanvasProps {
  nodes: Node3D[];
  links: Link3D[];
  onNodeClick?: (node: Node3D) => void;
}

export const NeuralCanvas: React.FC<NeuralCanvasProps> = ({
  nodes,
  links,
  onNodeClick,
}) => {
  const fgRef = useRef<any>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const [SpriteText, setSpriteText] = useState<any>(null);

  useEffect(() => {
    // Dynamically import three-spritetext to avoid SSR issues
    import('three-spritetext').then((mod) => {
      setSpriteText(() => mod.default);
    });
  }, []);

  useEffect(() => {
    // Handle resize
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };
    
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const handleNodeClick = useCallback((node: Node3D) => {
    // Aim at node from outside it
    const distance = 40;
    const distRatio = 1 + distance / Math.hypot(node.x || 0, node.y || 0, node.z || 0);
    
    fgRef.current?.cameraPosition(
      { 
        x: (node.x || 0) * distRatio, 
        y: (node.y || 0) * distRatio, 
        z: (node.z || 0) * distRatio 
      }, 
      node, // lookAt ({ x, y, z })
      3000  // ms transition duration
    );

    if (onNodeClick) {
      onNodeClick(node);
    }
  }, [onNodeClick]);

  if (!SpriteText) {
    return <div className="w-full h-full bg-[#050505] flex items-center justify-center text-[#555]">Initializing Neural Canvas...</div>;
  }

  const ForceGraph = ForceGraph3D as any;

  return (
    <div ref={containerRef} className="w-full h-full bg-[#050505] absolute inset-0 overflow-hidden">
      <ForceGraph
        ref={fgRef}
        width={dimensions.width}
        height={dimensions.height}
        graphData={{ nodes, links }}
        nodeLabel="name"
        nodeColor={(node: any) => node.color || '#64c8ff'}
        nodeRelSize={6}
        linkDirectionalParticles={2}
        linkDirectionalParticleSpeed={0.005}
        linkColor={() => 'rgba(255,255,255,0.2)'}
        linkOpacity={0.2}
        linkWidth={1}
        nodeThreeObject={(node: any) => {
          const sprite = new SpriteText(node.name);
          sprite.color = node.color || '#fff';
          sprite.textHeight = 4;
          sprite.backgroundColor = 'rgba(0,0,0,0.5)';
          sprite.padding = 2;
          sprite.borderRadius = 4;
          return sprite;
        }}
        nodeThreeObjectExtend={true} // Extends standard sphere with the text
        onNodeClick={handleNodeClick}
        backgroundColor="#050505"
        showNavInfo={false}
      />
    </div>
  );
};

export default NeuralCanvas;
