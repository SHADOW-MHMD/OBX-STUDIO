import { useEffect, useCallback, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { api } from '@/lib/api';
import type { Node3D, Link3D } from '@/components/canvas/NeuralCanvas';

export function useSupabaseCanvas(interviewId: string | undefined, initialNodes: Node3D[], initialLinks: Link3D[]) {
  const [nodes, setNodes] = useState<Node3D[]>(initialNodes || []);
  const [links, setLinks] = useState<Link3D[]>(initialLinks || []);
  
  const supabase = createClient();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!interviewId) return;

    // Subscribe to graph changes
    const channel = supabase.channel(`canvas-${interviewId}`)
      .on('broadcast', { event: 'graph-update' }, (payload) => {
        if (payload.payload) {
          if (payload.payload.nodes) setNodes(payload.payload.nodes);
          if (payload.payload.links) setLinks(payload.payload.links);
        }
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [interviewId, supabase]);

  const saveCanvasToDb = useCallback((currentNodes: Node3D[], currentLinks: Link3D[]) => {
    if (!interviewId) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      // Assuming api.interview.saveCanvas can handle any array format for nodes/edges
      api.interview.saveCanvas(interviewId, currentNodes as any, currentLinks as any).catch(() => {
        // Fail silently
      });
    }, 500);
  }, [interviewId]);

  const updateGraph = useCallback((newNodes: Node3D[], newLinks: Link3D[]) => {
    setNodes(newNodes);
    setLinks(newLinks);
    saveCanvasToDb(newNodes, newLinks);
    
    channelRef.current?.send({
      type: 'broadcast',
      event: 'graph-update',
      payload: { nodes: newNodes, links: newLinks },
    });
  }, [saveCanvasToDb]);

  return {
    nodes,
    links,
    setNodes,
    setLinks,
    updateGraph,
  };
}
