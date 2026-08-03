'use client';

import Link from 'next/link';
import { Cpu, ArrowLeft, Tag, Calendar } from 'lucide-react';

const CHANGELOG = [
  {
    version: 'v0.3.0',
    date: '2026-08-02',
    badge: 'Latest',
    changes: [
      'Added Google OAuth login',
      'Interview template selection (2-step creation)',
      'Public share links for outputs',
      'Voice input via Cloudflare Workers AI (Whisper)',
      'Interview duplication',
      'Delete account + export data',
      'Notion-formatted copy button',
      'Skip and Re-ask buttons in interview',
      '5-second undo on kanban task delete',
    ],
  },
  {
    version: 'v0.2.0',
    date: '2026-07-15',
    badge: null,
    changes: [
      'Canvas persistence to D1 database',
      'Real-time canvas broadcast fix',
      'Daily interview limit enforcement',
      'Auth callback robustness improvements',
      'Toast notification system',
      'Kanban autofill deduplication fix',
    ],
  },
  {
    version: 'v0.1.0',
    date: '2026-07-01',
    badge: null,
    changes: [
      'Initial release',
      'AI interview engine with 4 personas',
      'Kanban board with drag-and-drop',
      'Output generation (PRD, Summary, Action Plan)',
      'Canvas mind-map with React Flow',
      'Cloudflare Workers + D1 backend',
    ],
  },
];

export default function ChangelogPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#000', color: '#fff' }}>
      {/* Header */}
      <header style={{ borderBottom: '1px solid #111', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', zIndex: 10 }}>
        <Link
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            textDecoration: 'none',
            color: '#fff',
            fontWeight: 700,
            fontSize: '0.95rem',
          }}
        >
          <div style={{ width: 28, height: 28, borderRadius: 7, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Cpu size={14} color="#000" />
          </div>
          OBX-STUDIO
        </Link>
        <Link
          href="/dashboard"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.375rem',
            color: '#555',
            fontSize: '0.8rem',
            textDecoration: 'none',
            transition: 'color 0.15s ease',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
          onMouseLeave={e => (e.currentTarget.style.color = '#555')}
        >
          <ArrowLeft size={13} />
          Back to dashboard
        </Link>
      </header>

      {/* Page content */}
      <main style={{ maxWidth: 720, margin: '0 auto', padding: '4rem 1.5rem 6rem' }}>
        {/* Page title */}
        <div style={{ marginBottom: '4rem' }}>
          <p style={{ fontSize: '0.75rem', color: '#555', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
            What&apos;s new
          </p>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 700, letterSpacing: '-0.04em', marginBottom: '0.75rem', lineHeight: 1.1 }}>
            Changelog
          </h1>
          <p style={{ color: '#555', fontSize: '0.95rem', lineHeight: 1.6 }}>
            Every update, improvement, and fix to OBX-STUDIO — shipped fast.
          </p>
        </div>

        {/* Timeline */}
        <div style={{ position: 'relative' }}>
          {/* Vertical line */}
          <div style={{ position: 'absolute', left: 0, top: 8, bottom: 0, width: 1, background: 'linear-gradient(to bottom, #222, transparent)' }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '3.5rem' }}>
            {CHANGELOG.map((entry, i) => (
              <div key={entry.version} style={{ paddingLeft: '2rem', position: 'relative' }}>
                {/* Timeline dot */}
                <div style={{ position: 'absolute', left: -5, top: 8, width: 11, height: 11, borderRadius: '50%', background: i === 0 ? '#fff' : '#222', border: i === 0 ? '2px solid #fff' : '1px solid #333', boxShadow: i === 0 ? '0 0 12px rgba(255,255,255,0.3)' : 'none' }} />

                {/* Version header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <Tag size={13} color="#555" />
                    <span style={{ fontSize: '1.1rem', fontWeight: 700, letterSpacing: '-0.02em' }}>{entry.version}</span>
                  </div>
                  {entry.badge && (
                    <span style={{
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: 20,
                      padding: '2px 10px',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      color: '#fff',
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                    }}>
                      {entry.badge}
                    </span>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginLeft: 'auto' }}>
                    <Calendar size={12} color="#444" />
                    <span style={{ fontSize: '0.78rem', color: '#444' }}>{entry.date}</span>
                  </div>
                </div>

                {/* Changes list */}
                <div style={{ background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: 10, padding: '1.25rem 1.5rem' }}>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                    {entry.changes.map((change, idx) => (
                      <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem', fontSize: '0.88rem', lineHeight: 1.55 }}>
                        <span style={{ color: i === 0 ? '#fff' : '#444', marginTop: '0.35em', flexShrink: 0, fontSize: '0.6rem' }}>●</span>
                        <span style={{ color: i === 0 ? '#ccc' : '#666' }}>{change}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer note */}
        <div style={{ marginTop: '4rem', paddingTop: '2rem', borderTop: '1px solid #111', textAlign: 'center' }}>
          <p style={{ color: '#444', fontSize: '0.8rem' }}>
            Built with ☕ and Cloudflare Workers ·{' '}
            <Link href="/dashboard" style={{ color: '#555', textDecoration: 'none' }}>
              Go to Dashboard
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
