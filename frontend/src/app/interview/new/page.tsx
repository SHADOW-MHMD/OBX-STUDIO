'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import { api } from '@/lib/api';

export default function NewInterviewPage() {
  const router = useRouter();
  const { user, isLoading } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const [rateLimited, setRateLimited] = useState(false);

  useEffect(() => {
    // Wait for auth to resolve
    if (isLoading) return;

    // Redirect to login if not authenticated
    if (!user) {
      router.push('/auth/login');
      return;
    }

    let cancelled = false;

    async function createInterview() {
      try {
        const { id } = await api.interview.create();
        if (!cancelled) {
          router.push(`/interview/${id}`);
        }
      } catch (err: unknown) {
        if (cancelled) return;
        const status = (err as { status?: number }).status;
        if (status === 429) {
          setRateLimited(true);
        } else {
          setError(
            (err as Error).message ?? 'Failed to create interview. Please try again.'
          );
        }
      }
    }

    createInterview();

    return () => {
      cancelled = true;
    };
  }, [isLoading, user, router]);

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
        <h2
          style={{
            fontSize: '1.125rem',
            fontWeight: 600,
            color: '#fff',
            marginBottom: '0.75rem',
            letterSpacing: '-0.02em',
          }}
        >
          Daily limit reached
        </h2>
        <p
          style={{
            color: '#888',
            fontSize: '0.9rem',
            maxWidth: 360,
            lineHeight: 1.6,
            marginBottom: '2rem',
          }}
        >
          You have used all 3 interviews for today. Come back tomorrow!
        </p>
        <Link
          href="/dashboard"
          className="btn btn-secondary"
          style={{ fontSize: '0.85rem' }}
        >
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
        <p
          style={{
            color: '#ff4444',
            fontSize: '0.9rem',
            marginBottom: '1.5rem',
            maxWidth: 360,
          }}
        >
          {error}
        </p>
        <Link
          href="/dashboard"
          className="btn btn-secondary"
          style={{ fontSize: '0.85rem' }}
        >
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  // Loading / creating state
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
      <Loader2
        size={32}
        color="#555"
        className="animate-spin"
        style={{ flexShrink: 0 }}
      />
      <p
        style={{
          color: '#555',
          fontSize: '0.875rem',
          letterSpacing: '-0.01em',
        }}
      >
        Starting your interview…
      </p>
    </div>
  );
}
