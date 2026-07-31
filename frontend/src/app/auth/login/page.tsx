"use client";

import { useState } from "react";
import { Cpu, Loader2 } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const handleGitHub = async () => {
    setLoading(true);
    setError(null);
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
            Authenticate with GitHub to access your Neural Canvas and deploy your startup ideas.
          </p>

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
