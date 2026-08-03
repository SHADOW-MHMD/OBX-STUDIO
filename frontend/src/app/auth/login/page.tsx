"use client";

import { useState } from "react";
import { Cpu, Loader2 } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogle = async () => {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  const handleGitHub = async () => {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#000",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
      }}
    >
      <div style={{ width: "100%", maxWidth: 380 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              textDecoration: "none",
              color: "#fff",
              fontWeight: 700,
              fontSize: "1rem",
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Cpu size={16} color="#000" />
            </div>
            OBX-STUDIO
          </Link>
        </div>

        {/* Card */}
        <div
          style={{
            background: "#0a0a0a",
            border: "1px solid #1a1a1a",
            borderRadius: 12,
            padding: "2.5rem 2rem",
            textAlign: "center",
          }}
        >
          <h1
            style={{
              fontSize: "1.25rem",
              fontWeight: 600,
              marginBottom: "0.5rem",
              color: "#fff",
            }}
          >
            Welcome to OBX-STUDIO
          </h1>
          <p style={{ fontSize: "0.85rem", color: "#666", marginBottom: "2rem", lineHeight: 1.5 }}>
            Sign in to access your Neural Canvas and deploy your startup ideas.
          </p>

          {/* Google OAuth button */}
          <button
            onClick={handleGoogle}
            disabled={loading}
            className="btn btn-secondary"
            style={{ width: "100%", justifyContent: "center", padding: "0.75rem", fontSize: "0.95rem", marginBottom: "0" }}
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            Continue with Google
          </button>

          <div style={{ color: "#333", fontSize: "0.75rem", textAlign: "center", margin: "0.75rem 0" }}>or</div>

          {/* GitHub OAuth button */}
          <button
            onClick={handleGitHub}
            disabled={loading}
            className="btn btn-secondary"
            style={{ width: "100%", justifyContent: "center", padding: "0.75rem", fontSize: "0.95rem" }}
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="css-i6dzq1"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
            )}
            Continue with GitHub
          </button>

          {error && (
            <div
              style={{
                marginTop: "1.25rem",
                background: "rgba(255,68,68,0.08)",
                border: "1px solid rgba(255,68,68,0.2)",
                borderRadius: 6,
                padding: "0.625rem 0.75rem",
                fontSize: "0.8rem",
                color: "#ff6666",
              }}
            >
              {error}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
