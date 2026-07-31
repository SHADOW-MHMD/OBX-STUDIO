import { useEffect, useCallback } from 'react';
import { Node, Edge, NodeChange, EdgeChange, applyNodeChanges, applyEdgeChanges, useNodesState, useEdgesState } from '@xyflow/react';
import { createClient } from '@/lib/supabase';

export function useSupabaseCanvas(interviewId: string | undefined, initialNodes: Node[], initialEdges: Edge[]) {
  const [nodes, setNodes] = useNodesState(initialNodes);
  const [edges, setEdges] = useEdgesState(initialEdges);
  const supabase = createClient();

  useEffect(() => {
    if (!interviewId) return;

    // Use a single channel for the entire interview
    const channel = supabase.channel(`canvas-${interviewId}`);

    channel
      .on('broadcast', { event: 'node-changes' }, (payload) => {
        if (payload.payload) {
          setNodes((nds) => applyNodeChanges(payload.payload, nds));
        }
      })
      .on('broadcast', { event: 'edge-changes' }, (payload) => {
        if (payload.payload) {
          setEdges((eds) => applyEdgeChanges(payload.payload, eds));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [interviewId, supabase, setNodes, setEdges]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setNodes((nds) => applyNodeChanges(changes, nds));
      if (!interviewId) return;
      supabase.channel(`canvas-${interviewId}`).send({
        type: 'broadcast',
        event: 'node-changes',
        payload: changes,
      });
    },
    [interviewId, supabase, setNodes]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      setEdges((eds) => applyEdgeChanges(changes, eds));
      if (!interviewId) return;
      supabase.channel(`canvas-${interviewId}`).send({
        type: 'broadcast',
        event: 'edge-changes',
        payload: changes,
      });
    },
    [interviewId, supabase, setEdges]
  );

  return {
    nodes,
    edges,
    setNodes,
    setEdges,
    onNodesChange,
    onEdgesChange,
  };
}
