'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Briefcase, Zap, Megaphone, TerminalSquare, ArrowLeft, FileText, Smartphone, Store, Wrench, PenLine } from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import { api } from '@/lib/api';

const PERSONAS = [
  { id: 'pm', name: 'Product Manager', desc: 'Focuses on user needs, feature scoping, and agile roadmaps.', icon: <Briefcase size={24} color="var(--theme-accent, #06b6d4)" /> },
  { id: 'vc', name: 'Harsh VC Investor', desc: 'Asks tough questions about market size, competitors, and monetization.', icon: <Zap size={24} color="var(--theme-accent, #06b6d4)" /> },
  { id: 'marketer', name: 'Marketing Guru', desc: 'Prioritizes growth hacking, positioning, and target audiences.', icon: <Megaphone size={24} color="var(--theme-accent, #06b6d4)" /> },
  { id: 'tech', name: 'Technical Architect', desc: 'Dives deep into tech stack, scalability, and system design.', icon: <TerminalSquare size={24} color="var(--theme-accent, #06b6d4)" /> },
];

const TEMPLATES = [
  { id: 'saas', name: 'SaaS Product', desc: 'B2B software with subscription model', icon: <FileText size={22} color="var(--theme-accent, #06b6d4)" /> },
  { id: 'consumer', name: 'Consumer App', desc: 'Direct-to-consumer mobile or web app', icon: <Smartphone size={22} color="var(--theme-accent, #06b6d4)" /> },
  { id: 'marketplace', name: 'Marketplace', desc: 'Two-sided marketplace connecting buyers and sellers', icon: <Store size={22} color="var(--theme-accent, #06b6d4)" /> },
  { id: 'internal', name: 'Internal Tool', desc: 'Internal tooling or developer productivity', icon: <Wrench size={22} color="var(--theme-accent, #06b6d4)" /> },
  { id: null, name: 'Start Blank', desc: 'No template, just free-form interview', icon: <PenLine size={22} color="#666" /> },
] as const;

const cardStyle: React.CSSProperties = {
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
  width: '100%',
};

export default function NewInterviewPage() {
  const router = useRouter();
  const { user, isLoading } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedPersona, setSelectedPersona] = useState<string | null>(null);

  useEffect(() => {
    if (isLoading) return;
    if (!user) router.push('/auth/login');
  }, [isLoading, user, router]);

  async function createInterview(personaId: string, templateId?: string | null) {
    if (creating) return;
    setCreating(true);
    try {
      const { id } = await api.interview.create(personaId, templateId ?? undefined);
      router.push(`/interview/${id}`);
    } catch (err: any) {
      setError(err.message ?? 'Failed to create interview. Please try again.');
      setCreating(false);
    }
  }

  const handlePersonaClick = (personaId: string) => {
    setSelectedPersona(personaId);
    setStep(2);
  };

  const handleTemplateClick = (templateId: string | null) => {
    if (!selectedPersona) return;
    createInterview(selectedPersona, templateId);
  };

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

  const selectedPersonaName = PERSONAS.find(p => p.id === selectedPersona)?.name;

  return (
    <div style={{ minHeight: '100vh', background: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '8vh', paddingBottom: '2rem' }}>
      <div style={{ maxWidth: 800, width: '100%', padding: '0 1.5rem' }}>

        {/* Progress indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '3rem', justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, color: '#000', flexShrink: 0 }}>
              {step > 1 ? '✓' : '1'}
            </div>
            <span style={{ fontSize: '0.8rem', color: step === 1 ? '#fff' : '#555', whiteSpace: 'nowrap' }}>Choose persona</span>
          </div>
          <div style={{ width: 40, height: 1, background: step > 1 ? '#444' : '#1a1a1a', flexShrink: 0 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <div style={{ width: 22, height: 22, borderRadius: '50%', background: step === 2 ? '#fff' : '#1a1a1a', border: step === 2 ? 'none' : '1px solid #333', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, color: step === 2 ? '#000' : '#555', flexShrink: 0 }}>
              2
            </div>
            <span style={{ fontSize: '0.8rem', color: step === 2 ? '#fff' : '#555', whiteSpace: 'nowrap' }}>Choose template</span>
          </div>
        </div>

        {/* Step 1: Persona selection */}
        {step === 1 && (
          <>
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
                  onClick={() => handlePersonaClick(p.id)}
                  style={cardStyle}
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
          </>
        )}

        {/* Step 2: Template selection */}
        {step === 2 && (
          <>
            <button
              onClick={() => setStep(1)}
              style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.85rem', marginBottom: '2rem', padding: 0, fontFamily: 'inherit' }}
            >
              <ArrowLeft size={14} /> Back
            </button>

            <h1 style={{ fontSize: '1.75rem', fontWeight: 600, color: '#fff', marginBottom: '0.5rem', textAlign: 'center' }}>
              Choose a Template
            </h1>
            <p style={{ color: '#888', fontSize: '0.95rem', textAlign: 'center', marginBottom: '3rem' }}>
              Interviewing as <span style={{ color: '#fff', fontWeight: 600 }}>{selectedPersonaName}</span>. Pick a context to tailor your interview.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {TEMPLATES.map(t => (
                <button
                  key={String(t.id)}
                  onClick={() => handleTemplateClick(t.id)}
                  style={{ ...cardStyle, flexDirection: 'row', alignItems: 'center', gap: '1.25rem', padding: '1.25rem 1.5rem' }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = '#333';
                    e.currentTarget.style.background = '#111';
                    e.currentTarget.style.boxShadow = '0 0 15px rgba(255,255,255,0.05)';
                    e.currentTarget.style.transform = 'translateX(2px)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = '#1a1a1a';
                    e.currentTarget.style.background = '#0a0a0a';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.transform = 'none';
                  }}
                >
                  <div style={{ background: '#111', padding: '0.625rem', borderRadius: 8, display: 'inline-flex', flexShrink: 0 }}>
                    {t.icon}
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <h3 style={{ color: '#fff', fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem' }}>{t.name}</h3>
                    <p style={{ color: '#555', fontSize: '0.85rem', lineHeight: 1.5 }}>{t.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
