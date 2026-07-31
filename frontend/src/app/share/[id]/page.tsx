'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Loader2, Globe, FileText, Lock } from 'lucide-react';
import { NeuralCanvas } from '@/components/canvas/NeuralCanvas';

export const runtime = 'edge';

export default function SharedInterviewPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [title, setTitle] = useState<string>('Shared Workspace');
  const [activeTab, setActiveTab] = useState<'canvas' | 'docs'>('canvas');

  // In a real implementation, we would fetch from a public endpoint like GET /interview/:id/public
  // For now, we simulate a mock load.

  useEffect(() => {
    if (!id) return;
    setTimeout(() => {
      // Simulate loading shared data
      setLoading(false);
    }, 1500);
  }, [id]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
        <Loader2 size={24} color="var(--theme-accent, #06b6d4)" className="animate-spin" />
        <span style={{ fontSize: '0.9rem', color: '#888' }}>Loading shared workspace...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', background: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <Lock size={48} color="#ff4444" style={{ marginBottom: '1rem' }} />
        <p style={{ color: '#ff4444', fontSize: '1.1rem', fontWeight: 500 }}>Access Denied</p>
        <p style={{ color: '#888', marginTop: '0.5rem', fontSize: '0.9rem' }}>This workspace is private or requires authentication.</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#000', display: 'flex', flexDirection: 'column' }} className="animate-fadein">
      {/* Top Navbar */}
      <div style={{ height: 64, borderBottom: '1px solid #111', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1.5rem', background: '#050505' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: '#111', border: '1px solid #222', borderRadius: 8, padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Globe size={18} color="var(--theme-accent, #06b6d4)" />
          </div>
          <div>
            <h1 style={{ color: '#fff', fontSize: '1rem', fontWeight: 600 }}>{title}</h1>
            <p style={{ color: '#666', fontSize: '0.75rem' }}>Public Read-Only Link</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', background: '#0a0a0a', border: '1px solid #222', borderRadius: 8, padding: '4px' }}>
          <button
            onClick={() => setActiveTab('canvas')}
            style={{
              padding: '6px 16px',
              borderRadius: 6,
              fontSize: '0.8rem',
              fontWeight: 500,
              cursor: 'pointer',
              border: 'none',
              background: activeTab === 'canvas' ? '#222' : 'transparent',
              color: activeTab === 'canvas' ? '#fff' : '#888',
              transition: 'all 0.2s',
            }}
          >
            Neural Canvas
          </button>
          <button
            onClick={() => setActiveTab('docs')}
            style={{
              padding: '6px 16px',
              borderRadius: 6,
              fontSize: '0.8rem',
              fontWeight: 500,
              cursor: 'pointer',
              border: 'none',
              background: activeTab === 'docs' ? '#222' : 'transparent',
              color: activeTab === 'docs' ? '#fff' : '#888',
              transition: 'all 0.2s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FileText size={14} /> Documents
            </div>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, position: 'relative' }}>
        {activeTab === 'canvas' && (
          <div style={{ position: 'absolute', inset: 0 }}>
            <NeuralCanvas nodes={[]} edges={[]} />
          </div>
        )}

        {activeTab === 'docs' && (
          <div style={{ padding: '3rem', maxWidth: 800, margin: '0 auto' }}>
            <div style={{ background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: 12, padding: '2rem' }}>
              <h2 style={{ color: '#fff', fontSize: '1.25rem', marginBottom: '1rem', borderBottom: '1px solid #222', paddingBottom: '0.5rem' }}>
                Pitch Deck Outline
              </h2>
              <p style={{ color: '#888', lineHeight: 1.6, fontSize: '0.95rem' }}>
                The AI generated Pitch Deck would render here as parsed Markdown.
                Since this is a simulated read-only view, you can imagine a fully formatted 
                pitch deck ready for investors!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
