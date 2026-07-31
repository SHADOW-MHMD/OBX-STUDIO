'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Briefcase, Zap, Megaphone, TerminalSquare } from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import { api } from '@/lib/api';

const PERSONAS = [
  { id: 'pm', name: 'Product Manager', desc: 'Focuses on user needs, feature scoping, and agile roadmaps.', icon: <Briefcase size={24} color="var(--theme-accent, #06b6d4)" /> },
  { id: 'vc', name: 'Harsh VC Investor', desc: 'Asks tough questions about market size, competitors, and monetization.', icon: <Zap size={24} color="var(--theme-accent, #06b6d4)" /> },
  { id: 'marketer', name: 'Marketing Guru', desc: 'Prioritizes growth hacking, positioning, and target audiences.', icon: <Megaphone size={24} color="var(--theme-accent, #06b6d4)" /> },
  { id: 'tech', name: 'Technical Architect', desc: 'Dives deep into tech stack, scalability, and system design.', icon: <TerminalSquare size={24} color="var(--theme-accent, #06b6d4)" /> },
];

export default function NewInterviewPage() {
  const router = useRouter();
  const { user, isLoading } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    if (!user) router.push('/auth/login');
  }, [isLoading, user, router]);

  async function createInterview(personaId: string) {
    if (creating) return;
    setCreating(true);
    try {
      // Create with persona
      const { id } = await api.interview.create(personaId);
      router.push(`/interview/${id}`);
    } catch (err: any) {
      setError(err.message ?? 'Failed to create interview. Please try again.');
      setCreating(false);
    }
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', background: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <p style={{ color: '#ff4444', fontSize: '0.9rem', marginBottom: '1.5rem' }}>{error}</p>
        <Link href="/" className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>← Back Home</Link>
      </div>
    );
  }

  if (creating) {
    return (
      <div style={{ minHeight: '100vh', background: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
        <Loader2 size={32} color="var(--theme-accent, #06b6d4)" className="animate-spin" />
        <p style={{ color: '#888', fontSize: '0.875rem' }}>Spinning up your AI Persona…</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '10vh', paddingBottom: '2rem' }}>
      <div style={{ maxWidth: 800, width: '100%', padding: '0 1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 600, color: '#fff', marginBottom: '0.5rem', textAlign: 'center' }}>
          Choose your AI Persona
        </h1>
        <p style={{ color: '#888', fontSize: '0.95rem', textAlign: 'center', marginBottom: '3rem' }}>
          Who do you want to brainstorm with? The AI will adapt its questions and tone based on this selection.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          {PERSONAS.map(p => (
            <button
              key={p.id}
              onClick={() => createInterview(p.id)}
              style={{
                background: '#0a0a0a',
                border: '1px solid #1a1a1a',
                borderRadius: 12,
                padding: '1.5rem',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = '#333';
                e.currentTarget.style.background = '#111';
                e.currentTarget.style.boxShadow = '0 0 15px rgba(255,255,255,0.05)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = '#1a1a1a';
                e.currentTarget.style.background = '#0a0a0a';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transform = 'none';
              }}
            >
              <div style={{ background: '#111', padding: '0.75rem', borderRadius: 8, display: 'inline-flex' }}>
                {p.icon}
              </div>
              <div>
                <h3 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.375rem' }}>{p.name}</h3>
                <p style={{ color: '#666', fontSize: '0.85rem', lineHeight: 1.5 }}>{p.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
