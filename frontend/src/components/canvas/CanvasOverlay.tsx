'use client';

import React from 'react';
import type { NodeCategory } from './NeuralCanvas';

interface CanvasOverlayProps {
  nodeCount: number;
  linkCount: number;
}

const LEGEND_ITEMS: { category: NodeCategory; color: string; label: string }[] = [
  { category: 'idea',       color: '#22d3ee', label: 'Idea'        },
  { category: 'persona',    color: '#c084fc', label: 'Persona'     },
  { category: 'feature',    color: '#4ade80', label: 'Feature'     },
  { category: 'pain_point', color: '#f87171', label: 'Pain Point'  },
  { category: 'market',     color: '#60a5fa', label: 'Market'      },
  { category: 'competitor', color: '#fbbf24', label: 'Competitor'  },
];

export const CanvasOverlay: React.FC<CanvasOverlayProps> = ({ nodeCount, linkCount }) => {
  return (
    <>
      {/* ── Top-left HUD: node / link count ── */}
      <div
        style={{
          position: 'absolute',
          top: 16,
          left: 16,
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0.375rem 0.875rem',
          background: 'rgba(5, 5, 5, 0.7)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 999,
          pointerEvents: 'none',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.7rem', color: '#aaa', fontFamily: 'monospace' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22d3ee', boxShadow: '0 0 6px #22d3ee', display: 'inline-block' }} />
          {nodeCount} nodes
        </span>
        <span style={{ width: 1, height: 10, background: 'rgba(255,255,255,0.1)' }} />
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.7rem', color: '#aaa', fontFamily: 'monospace' }}>
          <svg width="10" height="10" viewBox="0 0 10 10" style={{ opacity: 0.5 }}>
            <line x1="0" y1="5" x2="10" y2="5" stroke="#aaa" strokeWidth="1.5" />
          </svg>
          {linkCount} connections
        </span>
      </div>

      {/* ── Top-right HUD: interaction hints ── */}
      <div
        style={{
          position: 'absolute',
          top: 16,
          right: 16,
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: '0.2rem',
          pointerEvents: 'none',
        }}
      >
        {[
          { key: 'DRAG',   action: 'pan' },
          { key: 'SCROLL', action: 'zoom' },
          { key: 'CLICK',  action: 'inspect node' },
        ].map(({ key, action }) => (
          <p
            key={key}
            style={{
              fontSize: '0.62rem',
              color: 'rgba(255,255,255,0.2)',
              letterSpacing: '0.06em',
              fontFamily: 'monospace',
              margin: 0,
            }}
          >
            <span style={{ color: 'rgba(255,255,255,0.4)' }}>{key}</span>
            {' '}—{' '}
            {action}
          </p>
        ))}
      </div>

      {/* ── Bottom-left legend ── */}
      <div
        style={{
          position: 'absolute',
          bottom: 16,
          left: 16,
          zIndex: 10,
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.375rem',
          maxWidth: 360,
          pointerEvents: 'none',
        }}
      >
        {LEGEND_ITEMS.map(({ category, color, label }) => (
          <span
            key={category}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
              padding: '2px 8px',
              background: `${color}14`,
              border: `1px solid ${color}44`,
              borderRadius: 999,
              fontSize: '0.62rem',
              color,
              fontWeight: 500,
              letterSpacing: '0.04em',
            }}
          >
            <span
              style={{
                width: 5,
                height: 5,
                borderRadius: '50%',
                background: color,
                boxShadow: `0 0 5px ${color}`,
                flexShrink: 0,
              }}
            />
            {label}
          </span>
        ))}
      </div>
    </>
  );
};

export default CanvasOverlay;
