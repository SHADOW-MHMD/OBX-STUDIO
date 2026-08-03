import { useEffect, useCallback, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { api } from '@/lib/api';
import type { Node2D, Link2D } from '@/components/canvas/NeuralCanvas';

export function useSupabaseCanvas(
  interviewId: string | undefined,
  initialNodes: Node2D[],
  initialLinks: Link2D[]
) {
  const [nodes, setNodes] = useState<Node2D[]>(initialNodes || []);
  const [links, setLinks] = useState<Link2D[]>(initialLinks || []);

  const supabase = createClient();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadedRef = useRef(false);

  // ─── Load persisted canvas from D1 on mount ────────────────────────────────
  useEffect(() => {
    if (!interviewId || loadedRef.current) return;
    loadedRef.current = true;

    api.interview
      .get(interviewId)
      .then((data) => {
        const raw = (data.interview as any).canvas_state;
        if (!raw) return;
        try {
          const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
          if (parsed?.nodes?.length) {
            setNodes(parsed.nodes as Node2D[]);
          }
          if (parsed?.edges?.length) {
            setLinks(parsed.edges as Link2D[]);
          } else if (parsed?.links?.length) {
            // backward compat: backend used to store as 'links'
            setLinks(parsed.links as Link2D[]);
          }
        } catch {
          // corrupt canvas_state — ignore, start fresh
        }
      })
      .catch(() => {
        // fail silently — canvas just starts fresh
      });
  }, [interviewId]);

  // ─── Supabase real-time broadcast (for future multi-user collaboration) ────
  useEffect(() => {
    if (!interviewId) return;

    const channel = supabase
      .channel(`canvas-${interviewId}`)
      .on('broadcast', { event: 'graph-update' }, (payload) => {
        // Only apply remote updates — local updates go through updateGraph()
        if (payload.payload?.nodes) setNodes(payload.payload.nodes);
        if (payload.payload?.links) setLinks(payload.payload.links);
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [interviewId, supabase]);

  // ─── Debounced D1 persistence ─────────────────────────────────────────────
  const saveCanvasToDb = useCallback(
    (currentNodes: Node2D[], currentLinks: Link2D[]) => {
      if (!interviewId) return;
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        api.interview
          .saveCanvas(interviewId, currentNodes as any, currentLinks as any)
          .catch(() => {
            // Fail silently
          });
      }, 500);
    },
    [interviewId]
  );

  // ─── updateGraph: mutate state + broadcast + persist ─────────────────────
  const updateGraph = useCallback(
    (newNodes: Node2D[], newLinks: Link2D[]) => {
      setNodes(newNodes);
      setLinks(newLinks);
      saveCanvasToDb(newNodes, newLinks);

      // Broadcast to other tabs/collaborators via Supabase real-time
      channelRef.current?.send({
        type: 'broadcast',
        event: 'graph-update',
        payload: { nodes: newNodes, links: newLinks },
      });
    },
    [saveCanvasToDb]
  );

  return {
    nodes,
    links,
    setNodes,
    setLinks,
    updateGraph,
  };
}
