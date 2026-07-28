'use client';

export const runtime = 'edge';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    const code = new URLSearchParams(window.location.search).get('code');

    if (code) {
      // Exchange the OAuth code for a session
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (error) {
          console.error('Auth error:', error.message);
          router.replace('/auth/login?error=' + encodeURIComponent(error.message));
        } else {
          router.replace('/dashboard');
        }
      });
    } else {
      // No code — might be a hash-based session (email magic link, etc.)
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          router.replace('/dashboard');
        } else {
          router.replace('/auth/login');
        }
      });
    }
  }, [router]);

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
