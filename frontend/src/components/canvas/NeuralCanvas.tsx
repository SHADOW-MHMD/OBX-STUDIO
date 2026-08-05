'use client';

import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from 'react';
import * as d3 from 'd3';

// ─── Types ────────────────────────────────────────────────────────────────────

export type NodeCategory =
  | 'idea'
  | 'persona'
  | 'feature'
  | 'pain_point'
  | 'market'
  | 'competitor'
  | 'default';

export interface Node2D {
  id: string;
  name: string;
  category?: NodeCategory;
  clusterGroup?: string;
  val?: number;
  color?: string;
  // D3 simulation fields — mutated in place by the physics engine
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
  // Internal animation state (not serialised)
  _spawnFrame?: number;
  _pulseRadius?: number;
  _pulseAlpha?: number;
}

export interface Link2D {
  source: string | Node2D;
  target: string | Node2D;
  label?: string;
}

// Keep backward-compat aliases used by useSupabaseCanvas + interview page
export type Node3D = Node2D;
export type Link3D = Link2D;

interface NeuralCanvasProps {
  nodes: Node2D[];
  links: Link2D[];
  onNodeClick?: (node: Node2D) => void;
  onNodeDelete?: (node: Node2D) => void;
}

// ─── Color palette ────────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<NodeCategory, string> = {
  idea: '#22d3ee',       // vivid cyan
  persona: '#c084fc',    // vivid purple/magenta
  feature: '#4ade80',    // vivid green
  pain_point: '#f87171', // vivid red
  market: '#60a5fa',     // vivid blue
  competitor: '#fbbf24', // vivid amber/yellow
  default: '#e2e8f0',    // soft white
};

function getNodeColor(node: Node2D): string {
  if (node.color) return node.color;
  return CATEGORY_COLORS[node.category ?? 'default'];
}

function getNodeRadius(node: Node2D, connections: number): number {
  if (node.val) return 4 + node.val * 2;
  return 4 + Math.sqrt(connections) * 3;
}

// ─── Canvas renderer ──────────────────────────────────────────────────────────

export const NeuralCanvas: React.FC<NeuralCanvasProps> = ({
  nodes,
  links,
  onNodeClick,
  onNodeDelete,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const simRef = useRef<d3.Simulation<Node2D, Link2D> | null>(null);
  const transformRef = useRef<d3.ZoomTransform>(d3.zoomIdentity);
  const rafRef = useRef<number>(0);
  const hoveredNodeRef = useRef<Node2D | null>(null);
  const selectedNodeRef = useRef<Node2D | null>(null);
  const spawnQueueRef = useRef<Set<string>>(new Set());
  const frameRef = useRef(0);

  const [selectedNode, setSelectedNode] = useState<Node2D | null>(null);
  const [popoverPos, setPopoverPos] = useState<{ x: number; y: number } | null>(null);
  const [dimensions, setDimensions] = useState({ w: 0, h: 0 });

  // Build connection-count map for sizing
  const connectionCount = useMemo(() => {
    const counts: Record<string, number> = {};
    nodes.forEach((n) => { counts[n.id] = 0; });
    links.forEach((l) => {
      const sid = typeof l.source === 'string' ? l.source : l.source.id;
      const tid = typeof l.target === 'string' ? l.target : l.target.id;
      counts[sid] = (counts[sid] ?? 0) + 1;
      counts[tid] = (counts[tid] ?? 0) + 1;
    });
    return counts;
  }, [nodes, links]);

  // Orphan node ids (connected to nothing, excluding root 'idea')
  const orphanIds = useMemo(() => {
    const connected = new Set<string>();
    links.forEach((l) => {
      connected.add(typeof l.source === 'string' ? l.source : l.source.id);
      connected.add(typeof l.target === 'string' ? l.target : l.target.id);
    });
    return new Set(nodes.filter((n) => n.id !== 'idea' && !connected.has(n.id)).map((n) => n.id));
  }, [nodes, links]);

  // Connected node ids for dimming on select
  const connectedToSelected = useMemo(() => {
    if (!selectedNode) return null;
    const ids = new Set<string>([selectedNode.id]);
    links.forEach((l) => {
      const sid = typeof l.source === 'string' ? l.source : l.source.id;
      const tid = typeof l.target === 'string' ? l.target : l.target.id;
      if (sid === selectedNode.id) ids.add(tid);
      if (tid === selectedNode.id) ids.add(sid);
    });
    return ids;
  }, [selectedNode, links]);

  // Maintain resize observer
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setDimensions({ w: width, h: height });
      if (canvasRef.current) {
        canvasRef.current.width = width;
        canvasRef.current.height = height;
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ─── D3 simulation ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (dimensions.w === 0) return;

    const existingNodes = simRef.current?.nodes() ?? [];
    const existingMap = new Map(existingNodes.map((n) => [n.id, n]));

    // Merge: keep positions of existing nodes, mark new ones for spawn animation
    const mergedNodes: Node2D[] = nodes.map((n) => {
      const existing = existingMap.get(n.id);
      if (existing) {
        return { ...n, x: existing.x, y: existing.y, vx: existing.vx, vy: existing.vy };
      }
      // New node — mark for spawn
      spawnQueueRef.current.add(n.id);
      return {
        ...n,
        x: dimensions.w / 2 + (Math.random() - 0.5) * 60,
        y: dimensions.h / 2 + (Math.random() - 0.5) * 60,
        _spawnFrame: 0,
        _pulseRadius: 0,
        _pulseAlpha: 1,
      };
    });

    if (simRef.current) {
      simRef.current.stop();
    }

    const sim = d3
      .forceSimulation<Node2D>(mergedNodes)
      .force('charge', d3.forceManyBody<Node2D>().strength(-220))
      .force('center', d3.forceCenter(dimensions.w / 2, dimensions.h / 2).strength(0.03))
      // Add a weak radial force pulling everything towards center so orphans don't drift away
      .force('radial', d3.forceRadial(100, dimensions.w / 2, dimensions.h / 2).strength(0.05))
      .force(
        'link',
        d3
          .forceLink<Node2D, Link2D>(links as any)
          .id((d) => d.id)
          .distance(90)
          .strength(0.4)
      )
      .force('collide', d3.forceCollide<Node2D>().radius((d) => getNodeRadius(d, connectionCount[d.id] ?? 0) + 8))
      .alphaDecay(0.015)
      .velocityDecay(0.4);

    simRef.current = sim;

    return () => {
      sim.stop();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, links, dimensions]);

  // ─── Render loop ─────────────────────────────────────────────────────────────

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    function draw() {
      rafRef.current = requestAnimationFrame(draw);
      frameRef.current++;

      const sim = simRef.current;
      const transform = transformRef.current;
      const { width, height } = canvas!;
      const k = transform.k;
      const showLabels = k > 1.3;

      ctx!.clearRect(0, 0, width, height);

      // Dark background (filled by CSS)
      ctx!.save();
      ctx!.translate(transform.x, transform.y);
      ctx!.scale(k, k);

      const simNodes = sim?.nodes() ?? [];
      const simLinks = (sim?.force('link') as d3.ForceLink<Node2D, Link2D>)?.links() ?? [];

      // ── Draw edges ──
      simLinks.forEach((l: any) => {
        const s: Node2D = l.source;
        const t: Node2D = l.target;
        if (s.x == null || t.x == null) return;

        const srcColor = getNodeColor(s);

        // Dim if something is selected and this edge is not connected
        const isConnected = connectedToSelected
          ? (connectedToSelected.has(s.id) && connectedToSelected.has(t.id))
          : true;

        const alpha = isConnected ? 0.45 : 0.07;

        ctx!.beginPath();
        ctx!.moveTo(s.x!, s.y!);
        ctx!.lineTo(t.x!, t.y!);
        ctx!.strokeStyle = srcColor;
        ctx!.lineWidth = 1.2;
        ctx!.globalAlpha = alpha;
        ctx!.shadowBlur = isConnected ? 10 : 0;
        ctx!.shadowColor = srcColor;
        ctx!.stroke();
        ctx!.shadowBlur = 0;
        ctx!.globalAlpha = 1;

        // Directional particle along edge
        if (isConnected) {
          const t_pos = ((frameRef.current * 0.004) % 1);
          const px = s.x! + (t.x! - s.x!) * t_pos;
          const py = s.y! + (t.y! - s.y!) * t_pos;
          ctx!.beginPath();
          ctx!.arc(px, py, 1.5, 0, Math.PI * 2);
          ctx!.fillStyle = srcColor;
          ctx!.globalAlpha = 0.8;
          ctx!.fill();
          ctx!.globalAlpha = 1;
        }
      });

      // ── Draw nodes ──
      simNodes.forEach((node) => {
        if (node.x == null) return;
        const color = getNodeColor(node);
        const conns = connectionCount[node.id] ?? 0;
        const r = getNodeRadius(node, conns);
        const isHovered = hoveredNodeRef.current?.id === node.id;
        const isSelected = selectedNodeRef.current?.id === node.id;
        const isDimmed = connectedToSelected && !connectedToSelected.has(node.id);

        // Spawn animation
        let scaleMultiplier = 1;
        if (node._spawnFrame !== undefined && node._spawnFrame < 40) {
          node._spawnFrame!++;
          scaleMultiplier = node._spawnFrame / 40; // ease-in from 0 → 1

          // Expanding pulse ring
          if (node._pulseRadius !== undefined) {
            node._pulseRadius! += 1.5;
            node._pulseAlpha! = Math.max(0, 1 - node._pulseRadius! / 40);
            if (node._pulseAlpha! > 0) {
              ctx!.beginPath();
              ctx!.arc(node.x!, node.y!, node._pulseRadius!, 0, Math.PI * 2);
              ctx!.strokeStyle = color;
              ctx!.lineWidth = 1.5;
              ctx!.globalAlpha = node._pulseAlpha! * (isDimmed ? 0.1 : 1);
              ctx!.shadowBlur = 20;
              ctx!.shadowColor = color;
              ctx!.stroke();
              ctx!.shadowBlur = 0;
              ctx!.globalAlpha = 1;
            }
          }
          if (node._spawnFrame >= 40) {
            spawnQueueRef.current.delete(node.id);
            delete node._spawnFrame;
            delete node._pulseRadius;
            delete node._pulseAlpha;
          }
        }

        const displayR = r * scaleMultiplier;
        const baseAlpha = isDimmed ? 0.15 : 1;

        // Outer glow
        const grad = ctx!.createRadialGradient(node.x!, node.y!, 0, node.x!, node.y!, displayR * 2.8);
        grad.addColorStop(0, color + '44');
        grad.addColorStop(1, color + '00');
        ctx!.beginPath();
        ctx!.arc(node.x!, node.y!, displayR * 2.8, 0, Math.PI * 2);
        ctx!.fillStyle = grad;
        ctx!.globalAlpha = baseAlpha * (isHovered || isSelected ? 1.5 : 0.8);
        ctx!.fill();
        ctx!.globalAlpha = 1;

        // Core circle
        ctx!.beginPath();
        ctx!.arc(node.x!, node.y!, displayR, 0, Math.PI * 2);
        ctx!.fillStyle = color;
        ctx!.globalAlpha = baseAlpha;
        ctx!.shadowBlur = isHovered || isSelected ? 20 : 8;
        ctx!.shadowColor = color;
        ctx!.fill();
        ctx!.shadowBlur = 0;
        ctx!.globalAlpha = 1;

        // Selection / hover halo ring
        if (isSelected || isHovered) {
          const ringRadius = displayR + (isSelected ? 4 : 2.5);
          ctx!.beginPath();
          ctx!.arc(node.x!, node.y!, ringRadius, 0, Math.PI * 2);
          ctx!.strokeStyle = color;
          ctx!.lineWidth = isSelected ? 2 : 1;
          ctx!.globalAlpha = isSelected ? 0.9 : 0.5;
          ctx!.shadowBlur = 15;
          ctx!.shadowColor = color;
          ctx!.stroke();
          ctx!.shadowBlur = 0;
          ctx!.globalAlpha = 1;
        }

        // Idle pulse ring (slow breathing for root node)
        if (node.category === 'idea' && !isDimmed) {
          const pulseR = displayR + 3 + Math.sin(frameRef.current * 0.04) * 2;
          ctx!.beginPath();
          ctx!.arc(node.x!, node.y!, pulseR, 0, Math.PI * 2);
          ctx!.strokeStyle = color;
          ctx!.lineWidth = 0.8;
          ctx!.globalAlpha = 0.3 + Math.sin(frameRef.current * 0.04) * 0.1;
          ctx!.stroke();
          ctx!.globalAlpha = 1;
        }

        // Orphan alert: soft pulsing red ring for disconnected nodes
        if (orphanIds.has(node.id) && !isDimmed) {
          const orphanPulse = displayR + 5 + Math.sin(frameRef.current * 0.025) * 2.5;
          ctx!.beginPath();
          ctx!.arc(node.x!, node.y!, orphanPulse, 0, Math.PI * 2);
          ctx!.strokeStyle = '#f87171';
          ctx!.lineWidth = 1.2;
          ctx!.globalAlpha = 0.25 + Math.sin(frameRef.current * 0.025) * 0.15;
          ctx!.shadowBlur = 8;
          ctx!.shadowColor = '#f87171';
          ctx!.stroke();
          ctx!.shadowBlur = 0;
          ctx!.globalAlpha = 1;
        }

        // Labels (only when zoomed in)
        if (showLabels) {
          ctx!.globalAlpha = isDimmed ? 0.15 : Math.min(1, (k - 1.3) * 3);
          ctx!.font = `${Math.max(9, 11 / k)}px Inter, system-ui, sans-serif`;
          ctx!.fillStyle = '#fff';
          ctx!.textAlign = 'center';
          ctx!.textBaseline = 'top';
          ctx!.shadowBlur = 6;
          ctx!.shadowColor = '#000';
          ctx!.fillText(node.name, node.x!, node.y! + displayR + 3);
          ctx!.shadowBlur = 0;
          ctx!.globalAlpha = 1;
        }
      });

      ctx!.restore();
    }

    draw();
    return () => cancelAnimationFrame(rafRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dimensions, connectionCount, connectedToSelected, orphanIds]);

  // ─── D3 Zoom ────────────────────────────────────────────────────────────────

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || dimensions.w === 0) return;

    const zoom = d3
      .zoom<HTMLCanvasElement, unknown>()
      .scaleExtent([0.05, 10])
      .on('zoom', (event) => {
        transformRef.current = event.transform;
      });

    d3.select(canvas).call(zoom);
    return () => { d3.select(canvas).on('.zoom', null); };
  }, [dimensions]);

  // ─── Mouse interaction ───────────────────────────────────────────────────────

  const getNodeAtPoint = useCallback(
    (canvasX: number, canvasY: number): Node2D | null => {
      const transform = transformRef.current;
      const [worldX, worldY] = transform.invert([canvasX, canvasY]);
      const simNodes = simRef.current?.nodes() ?? [];
      for (const node of simNodes) {
        if (node.x == null) continue;
        const conns = connectionCount[node.id] ?? 0;
        const r = getNodeRadius(node, conns) + 6;
        const dx = (node.x ?? 0) - worldX;
        const dy = (node.y ?? 0) - worldY;
        if (dx * dx + dy * dy <= r * r) return node;
      }
      return null;
    },
    [connectionCount]
  );

  const worldToScreen = useCallback((wx: number, wy: number) => {
    const t = transformRef.current;
    return [t.applyX(wx), t.applyY(wy)] as [number, number];
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const rect = canvasRef.current!.getBoundingClientRect();
      const node = getNodeAtPoint(e.clientX - rect.left, e.clientY - rect.top);
      hoveredNodeRef.current = node;
      canvasRef.current!.style.cursor = node ? 'pointer' : 'grab';
    },
    [getNodeAtPoint]
  );

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const rect = canvasRef.current!.getBoundingClientRect();
      const node = getNodeAtPoint(e.clientX - rect.left, e.clientY - rect.top);

      if (node) {
        selectedNodeRef.current = node;
        setSelectedNode(node);
        const [sx, sy] = worldToScreen(node.x ?? 0, node.y ?? 0);
        setPopoverPos({ x: sx, y: sy });

        // Smooth zoom toward node
        const canvas = canvasRef.current!;
        const transform = transformRef.current;
        const targetK = Math.max(transform.k, 2.5);
        const targetX = canvas.width / 2 - (node.x ?? 0) * targetK;
        const targetY = canvas.height / 2 - (node.y ?? 0) * targetK;
        const targetTransform = d3.zoomIdentity.translate(targetX, targetY).scale(targetK);

        d3.select(canvas)
          .transition()
          .duration(700)
          .ease(d3.easeCubicOut)
          .call(
            (d3.zoom<HTMLCanvasElement, unknown>() as any).transform,
            targetTransform
          );

        if (onNodeClick) onNodeClick(node);
      } else {
        // Click on empty — deselect
        selectedNodeRef.current = null;
        setSelectedNode(null);
        setPopoverPos(null);
      }
    },
    [getNodeAtPoint, worldToScreen, onNodeClick]
  );

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      selectedNodeRef.current = null;
      setSelectedNode(null);
      setPopoverPos(null);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Update popover position on every frame (node might move during simulation)
  useEffect(() => {
    if (!selectedNode || !popoverPos) return;
    const interval = setInterval(() => {
      const node = simRef.current?.nodes().find((n) => n.id === selectedNode.id);
      if (node?.x != null) {
        const [sx, sy] = worldToScreen(node.x, node.y ?? 0);
        setPopoverPos({ x: sx, y: sy });
      }
    }, 50);
    return () => clearInterval(interval);
  }, [selectedNode, popoverPos, worldToScreen]);

  // Find connected nodes for popover list
  const connectedNodeNames = useMemo(() => {
    if (!selectedNode) return [];
    const names: string[] = [];
    const simLinks = (simRef.current?.force('link') as d3.ForceLink<Node2D, Link2D>)?.links() ?? [];
    simLinks.forEach((l: any) => {
      if (l.source.id === selectedNode.id && l.target.name) names.push(l.target.name);
      if (l.target.id === selectedNode.id && l.source.name) names.push(l.source.name);
    });
    return names;
  }, [selectedNode, links]); // eslint-disable-line react-hooks/exhaustive-deps

  // Smart popover positioning
  const popoverStyle = useMemo((): React.CSSProperties => {
    if (!popoverPos || !containerRef.current) return { display: 'none' };
    const { w, h } = dimensions;
    const popW = 240;
    const popH = 220; // taller now for delete button
    let left = popoverPos.x + 16;
    let top = popoverPos.y - popH / 2;

    // Flip if too close to right edge
    if (left + popW > w - 20) left = popoverPos.x - popW - 16;
    // Clamp vertical
    top = Math.max(16, Math.min(top, h - popH - 16));

    return { position: 'absolute', left, top, zIndex: 30, width: popW };
  }, [popoverPos, dimensions]);

  return (
    <div
      ref={containerRef}
      style={{ position: 'absolute', inset: 0, background: '#050505', overflow: 'hidden' }}
    >
      <canvas
        ref={canvasRef}
        width={dimensions.w}
        height={dimensions.h}
        style={{ display: 'block', cursor: 'grab' }}
        onMouseMove={handleMouseMove}
        onClick={handleClick}
      />

      {/* Node Popover */}
      {selectedNode && popoverPos && (
        <div style={popoverStyle}>
          <div
            style={{
              background: 'rgba(8, 8, 10, 0.92)',
              backdropFilter: 'blur(16px)',
              border: `1px solid ${getNodeColor(selectedNode)}44`,
              borderRadius: 14,
              padding: '0.875rem 1rem',
              boxShadow: `0 8px 32px rgba(0,0,0,0.6), 0 0 20px ${getNodeColor(selectedNode)}22`,
            }}
          >
            {/* Category badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: getNodeColor(selectedNode),
                  boxShadow: `0 0 6px ${getNodeColor(selectedNode)}`,
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: '0.65rem', color: getNodeColor(selectedNode), fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {selectedNode.category ?? 'default'}
              </span>
            </div>

            {/* Node name */}
            <p style={{ color: '#fff', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.5rem', lineHeight: 1.3 }}>
              {selectedNode.name}
            </p>

            {/* Connected nodes */}
            {connectedNodeNames.length > 0 && (
              <div style={{ marginBottom: '0.625rem' }}>
                <p style={{ fontSize: '0.65rem', color: '#555', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Connected to
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                  {connectedNodeNames.slice(0, 5).map((name, i) => (
                    <span key={i} style={{ fontSize: '0.7rem', color: '#aaa', background: 'rgba(255,255,255,0.06)', borderRadius: 4, padding: '1px 6px' }}>
                      {name}
                    </span>
                  ))}
                  {connectedNodeNames.length > 5 && (
                    <span style={{ fontSize: '0.7rem', color: '#555' }}>+{connectedNodeNames.length - 5} more</span>
                  )}
                </div>
              </div>
            )}

            {/* Ask AI button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onNodeClick) onNodeClick(selectedNode);
                setSelectedNode(null);
                setPopoverPos(null);
                selectedNodeRef.current = null;
              }}
              style={{
                width: '100%',
                padding: '0.4rem 0',
                background: `${getNodeColor(selectedNode)}18`,
                border: `1px solid ${getNodeColor(selectedNode)}44`,
                borderRadius: 8,
                color: getNodeColor(selectedNode),
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background 0.15s',
                marginBottom: '0.35rem',
              }}
              onMouseEnter={(e) => { (e.target as HTMLButtonElement).style.background = `${getNodeColor(selectedNode)}30`; }}
              onMouseLeave={(e) => { (e.target as HTMLButtonElement).style.background = `${getNodeColor(selectedNode)}18`; }}
            >
              Ask AI about this →
            </button>

            {/* Delete node button */}
            {selectedNode.id !== 'idea' && onNodeDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onNodeDelete(selectedNode);
                  setSelectedNode(null);
                  setPopoverPos(null);
                  selectedNodeRef.current = null;
                }}
                style={{
                  width: '100%',
                  padding: '0.35rem 0',
                  background: 'rgba(248,113,113,0.06)',
                  border: '1px solid rgba(248,113,113,0.2)',
                  borderRadius: 8,
                  color: '#f87171',
                  fontSize: '0.72rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => { (e.target as HTMLButtonElement).style.background = 'rgba(248,113,113,0.14)'; }}
                onMouseLeave={(e) => { (e.target as HTMLButtonElement).style.background = 'rgba(248,113,113,0.06)'; }}
              >
                🗑 Remove node
              </button>
            )}

            {/* Close */}
            <button
              onClick={() => { setSelectedNode(null); setPopoverPos(null); selectedNodeRef.current = null; }}
              style={{
                position: 'absolute',
                top: 6,
                right: 8,
                background: 'transparent',
                border: 'none',
                color: '#555',
                cursor: 'pointer',
                fontSize: '1rem',
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NeuralCanvas;
