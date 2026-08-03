'use client';

import React, { useState } from 'react';

interface SpecDocsModalProps {
  messageCount: number;
  nodeCount: number;
  onGenerate: () => void;
  onCancel: () => void;
}

export const SpecDocsModal: React.FC<SpecDocsModalProps> = ({
  messageCount,
  nodeCount,
  onGenerate,
  onCancel,
}) => {
  // Confidence score: scales from 0-100 based on messages answered
  const confidence = Math.min(100, Math.round((messageCount / 15) * 100));
  const isLowConfidence = confidence < 60;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(8px)',
      }}
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#0a0a0a',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 20,
          padding: '2rem',
          width: 420,
          maxWidth: '90vw',
          boxShadow: '0 24px 64px rgba(0,0,0,0.8)',
          animation: 'scaleIn 0.2s ease',
        }}
      >
        <style>{`@keyframes scaleIn { from { opacity:0; transform:scale(0.94); } to { opacity:1; transform:scale(1); } }`}</style>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem' }}>
              Generate Specification Documents
            </h2>
            <p style={{ color: '#555', fontSize: '0.8rem' }}>
              AI will synthesize your entire interview into production-ready docs
            </p>
          </div>
          <button
            onClick={onCancel}
            style={{ background: 'transparent', border: 'none', color: '#555', cursor: 'pointer', fontSize: '1.25rem', lineHeight: 1, padding: '0.25rem' }}
          >
            ×
          </button>
        </div>

        {/* Confidence meter */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#888', fontWeight: 500 }}>AI Confidence</span>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: isLowConfidence ? '#f87171' : confidence >= 80 ? '#4ade80' : '#fbbf24' }}>
              {confidence}%
            </span>
          </div>
          <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 999, overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${confidence}%`,
                borderRadius: 999,
                background: isLowConfidence
                  ? 'linear-gradient(90deg, #f87171, #fb923c)'
                  : confidence >= 80
                  ? 'linear-gradient(90deg, #22d3ee, #4ade80)'
                  : 'linear-gradient(90deg, #fbbf24, #fb923c)',
                transition: 'width 0.6s ease',
                boxShadow: isLowConfidence ? '0 0 8px #f87171' : confidence >= 80 ? '0 0 8px #4ade80' : '0 0 8px #fbbf24',
              }}
            />
          </div>
        </div>

        {/* Low-confidence warning */}
        {isLowConfidence && (
          <div
            style={{
              background: 'rgba(248, 113, 113, 0.08)',
              border: '1px solid rgba(248, 113, 113, 0.2)',
              borderRadius: 10,
              padding: '0.75rem 1rem',
              marginBottom: '1.25rem',
              display: 'flex',
              gap: '0.625rem',
            }}
          >
            <span style={{ fontSize: '0.875rem', flexShrink: 0 }}>⚠️</span>
            <p style={{ fontSize: '0.78rem', color: '#fca5a5', lineHeight: 1.5, margin: 0 }}>
              The AI suggests you need more context before generating reliable spec docs. Consider answering a few more questions for better results.
            </p>
          </div>
        )}

        {/* Stats */}
        <div
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 10,
            padding: '0.875rem 1rem',
            marginBottom: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.4rem',
          }}
        >
          <p style={{ fontSize: '0.72rem', color: '#555', margin: 0, marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Based on
          </p>
          {[
            { icon: '💬', label: `${messageCount} answered questions` },
            { icon: '🕸️', label: `${nodeCount} canvas nodes mapped` },
          ].map(({ icon, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem' }}>{icon}</span>
              <span style={{ fontSize: '0.78rem', color: '#aaa' }}>{label}</span>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: '0.6rem',
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 10,
              color: '#888',
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'border-color 0.15s, color 0.15s',
            }}
            onMouseEnter={(e) => { (e.target as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.25)'; (e.target as HTMLButtonElement).style.color = '#fff'; }}
            onMouseLeave={(e) => { (e.target as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.1)'; (e.target as HTMLButtonElement).style.color = '#888'; }}
          >
            Cancel
          </button>
          <button
            onClick={onGenerate}
            style={{
              flex: 2,
              padding: '0.6rem',
              background: isLowConfidence
                ? 'rgba(248, 113, 113, 0.15)'
                : 'linear-gradient(135deg, rgba(34, 211, 238, 0.2), rgba(74, 222, 128, 0.2))',
              border: isLowConfidence ? '1px solid rgba(248, 113, 113, 0.4)' : '1px solid rgba(34, 211, 238, 0.3)',
              borderRadius: 10,
              color: isLowConfidence ? '#fca5a5' : '#22d3ee',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={(e) => { (e.target as HTMLButtonElement).style.opacity = '0.8'; }}
            onMouseLeave={(e) => { (e.target as HTMLButtonElement).style.opacity = '1'; }}
          >
            {isLowConfidence ? 'Generate Anyway →' : 'Generate Spec Docs →'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SpecDocsModal;
