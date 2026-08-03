'use client';

export const runtime = 'edge';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import Link from 'next/link';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    // Listen for the auth state change first — this fires when Supabase
    // detects the session from cookies/URL on page load.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        subscription.unsubscribe();
        router.replace('/dashboard');
      } else if (event === 'SIGNED_OUT') {
        subscription.unsubscribe();
        router.replace('/auth/login');
      } else if (event === 'USER_UPDATED' && !session) {
        // OAuth denied or failed
        subscription.unsubscribe();
        setError('Authentication was denied or cancelled. Please try again.');
      }
      // Ignore INITIAL_SESSION with no session — wait for the real event
    });

    // Fallback: check existing session immediately in case event already fired
    supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (sessionError) {
        setError(sessionError.message);
        subscription.unsubscribe();
        return;
      }
      if (data.session) {
        subscription.unsubscribe();
        router.replace('/dashboard');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  if (error) {
    return (
      <main
        style={{
          minHeight: '100vh',
          background: '#000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: '1.5rem',
          padding: '2rem',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: 12,
            padding: '1.5rem 2rem',
            maxWidth: 400,
          }}
        >
          <p style={{ color: '#ef4444', fontSize: '0.95rem', marginBottom: '1rem' }}>{error}</p>
          <Link href="/auth/login" className="btn btn-secondary" style={{ fontSize: '0.875rem' }}>
            ← Go back to login
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '1rem',
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          border: '2px solid #333',
          borderTop: '2px solid #fff',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <p style={{ color: '#555', fontSize: '0.875rem' }}>Signing you in...</p>
    </main>
  );
}
