'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, LayoutTemplate, Briefcase, ShoppingCart, Lock } from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import { api, type Template } from '@/lib/api';

export default function NewInterviewPage() {
  const router = useRouter();
  const { user, isLoading } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const [rateLimited, setRateLimited] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    // Wait for auth to resolve
    if (isLoading) return;

    // Redirect to login if not authenticated
    if (!user) {
      router.push('/auth/login');
      return;
    }

    let cancelled = false;

    async function loadTemplates() {
      try {
        const data = await api.templates.list();
        if (!cancelled) {
          setTemplates(data);
          setLoadingTemplates(false);
        }
      } catch (err: unknown) {
        if (cancelled) return;
        setError("Failed to load templates.");
        setLoadingTemplates(false);
      }
    }

    loadTemplates();

    return () => {
      cancelled = true;
    };
  }, [isLoading, user, router]);

  async function createInterview(templateId: string) {
    if (creating) return;
    setCreating(true);
    try {
      const { id } = await api.interview.create(templateId);
      router.push(`/interview/${id}`);
    } catch (err: unknown) {
      const status = (err as { status?: number }).status;
      if (status === 429) {
        setRateLimited(true);
      } else {
        setError(
          (err as Error).message ?? 'Failed to create interview. Please try again.'
        );
      }
      setCreating(false);
    }
  }

  // Rate-limited state
  if (rateLimited) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#000',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          textAlign: 'center',
        }}
        className="animate-fadein"
      >
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: '50%',
            background: 'rgba(245,158,11,0.1)',
            border: '1px solid rgba(245,158,11,0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1.5rem',
            fontSize: '1.5rem',
          }}
        >
          ⏳
        </div>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#fff', marginBottom: '0.75rem' }}>
          Daily limit reached
        </h2>
        <p style={{ color: '#888', fontSize: '0.9rem', maxWidth: 360, lineHeight: 1.6, marginBottom: '2rem' }}>
          You have used all 3 interviews for today. Come back tomorrow!
        </p>
        <Link href="/dashboard" className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  // Generic error state
  if (error) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#000',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          textAlign: 'center',
        }}
        className="animate-fadein"
      >
        <p style={{ color: '#ff4444', fontSize: '0.9rem', marginBottom: '1.5rem', maxWidth: 360 }}>
          {error}
        </p>
        <Link href="/dashboard" className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  if (loadingTemplates || creating) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#000',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
        }}
      >
        <Loader2 size={32} color="#555" className="animate-spin" style={{ flexShrink: 0 }} />
        <p style={{ color: '#555', fontSize: '0.875rem', letterSpacing: '-0.01em' }}>
          {creating ? 'Starting your interview…' : 'Loading templates…'}
        </p>
      </div>
    );
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'saas': return <LayoutTemplate size={24} color="#3b82f6" />;
      case 'consumer': return <Briefcase size={24} color="#ec4899" />;
      case 'marketplace': return <ShoppingCart size={24} color="#f59e0b" />;
      case 'internal': return <Lock size={24} color="#10b981" />;
      default: return <LayoutTemplate size={24} color="#555" />;
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '10vh', paddingBottom: '2rem' }}>
      <div style={{ maxWidth: 800, width: '100%', padding: '0 1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 600, color: '#fff', marginBottom: '0.5rem', textAlign: 'center' }}>
          What are you building?
        </h1>
        <p style={{ color: '#888', fontSize: '0.95rem', textAlign: 'center', marginBottom: '3rem' }}>
          Select a template. The AI will customize its interview questions to match your project type.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          {templates.map(template => (
            <button
              key={template.id}
              onClick={() => createInterview(template.id)}
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
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = '#1a1a1a';
                e.currentTarget.style.background = '#0a0a0a';
              }}
            >
              <div style={{ background: '#111', padding: '0.75rem', borderRadius: 8, display: 'inline-flex', width: 'fit-content' }}>
                {getIcon(template.type)}
              </div>
              <div>
                <h3 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                  {template.name} {template.is_fork && <span style={{ fontSize: '0.7rem', background: '#222', padding: '2px 6px', borderRadius: 4, marginLeft: 6 }}>Forked</span>}
                </h3>
                <p style={{ color: '#666', fontSize: '0.85rem', lineHeight: 1.5 }}>
                  {Object.keys(template.checklists).length} dimensions • {Object.values(template.checklists).flat().length} rules
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
