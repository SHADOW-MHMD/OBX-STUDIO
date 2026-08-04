'use client';

import React from 'react';
import { Check } from 'lucide-react';

export type InterviewPhase = 'problem' | 'users' | 'solution' | 'business' | 'technical';

export const PHASE_LIST: { id: InterviewPhase; label: string; emoji: string }[] = [
  { id: 'problem',   label: 'The Problem',   emoji: '🔴' },
  { id: 'users',     label: 'Target Users',  emoji: '🟣' },
  { id: 'solution',  label: 'The Solution',  emoji: '🟢' },
  { id: 'business',  label: 'Business',      emoji: '🟡' },
  { id: 'technical', label: 'Technical',     emoji: '🔵' },
];

interface PhaseProgressProps {
  currentPhase: InterviewPhase;
  isDone?: boolean;
}

export const PhaseProgress: React.FC<PhaseProgressProps> = ({ currentPhase, isDone }) => {
  const currentIndex = PHASE_LIST.findIndex((p) => p.id === currentPhase);

  return (
    <div
      style={{
        padding: '0.75rem 1.25rem 0.625rem',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        flexShrink: 0,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
        {PHASE_LIST.map((phase, idx) => {
          const isCompleted = isDone || idx < currentIndex;
          const isActive = !isDone && idx === currentIndex;
          const isUpcoming = !isDone && idx > currentIndex;

          return (
            <div
              key={phase.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.625rem',
                opacity: isUpcoming ? 0.3 : 1,
                transition: 'opacity 0.3s ease',
              }}
            >
              {/* Connector line above (except first) */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 16 }}>
                {idx > 0 && (
                  <div
                    style={{
                      width: 1,
                      height: 6,
                      background: isCompleted ? 'rgba(74, 222, 128, 0.5)' : 'rgba(255,255,255,0.1)',
                      marginBottom: 2,
                      transition: 'background 0.3s ease',
                    }}
                  />
                )}
                {/* Phase dot */}
                <div
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: isCompleted
                      ? 'rgba(74, 222, 128, 0.2)'
                      : isActive
                      ? 'rgba(34, 211, 238, 0.2)'
                      : 'rgba(255,255,255,0.04)',
                    border: isCompleted
                      ? '1.5px solid rgba(74, 222, 128, 0.6)'
                      : isActive
                      ? '1.5px solid rgba(34, 211, 238, 0.8)'
                      : '1.5px solid rgba(255,255,255,0.1)',
                    boxShadow: isActive ? '0 0 8px rgba(34, 211, 238, 0.4)' : 'none',
                    flexShrink: 0,
                    transition: 'all 0.3s ease',
                  }}
                >
                  {isCompleted ? (
                    <Check size={9} color="#4ade80" strokeWidth={2.5} />
                  ) : isActive ? (
                    <div
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: '#22d3ee',
                        boxShadow: '0 0 4px #22d3ee',
                        animation: 'pulseDot 2s ease infinite',
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 4,
                        height: 4,
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.2)',
                      }}
                    />
                  )}
                </div>
              </div>

              {/* Phase label */}
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: isActive ? 600 : 400,
                  color: isCompleted ? '#4ade80' : isActive ? '#22d3ee' : '#666',
                  transition: 'color 0.3s ease',
                  letterSpacing: isActive ? '0.01em' : 0,
                }}
              >
                {phase.emoji} {phase.label}
              </span>

              {isActive && (
                <span
                  style={{
                    marginLeft: 'auto',
                    fontSize: '0.6rem',
                    color: 'rgba(34, 211, 238, 0.5)',
                    letterSpacing: '0.08em',
                    fontFamily: 'monospace',
                  }}
                >
                  ACTIVE
                </span>
              )}
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes pulseDot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.7); }
        }
      `}</style>
    </div>
  );
};

export default PhaseProgress;
