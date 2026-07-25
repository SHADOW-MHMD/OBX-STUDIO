"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Cpu, GitBranch, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const router = useRouter();

  const supabase = createClient();

  const handleGitHub = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "github",
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
  };

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
  };

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/dashboard` },
        });
        if (error) throw error;
        setSent(true);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err.message ?? "Something went wrong");
    } finally {
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
            padding: "2rem",
          }}
        >
          <h1
            style={{
              fontSize: "1.1rem",
              fontWeight: 600,
              marginBottom: "0.375rem",
              color: "#fff",
            }}
          >
            {mode === "signin" ? "Welcome back" : "Create your account"}
          </h1>
          <p style={{ fontSize: "0.85rem", color: "#555", marginBottom: "1.75rem" }}>
            {mode === "signin"
              ? "Sign in to continue building."
              : "Free forever. No credit card needed."}
          </p>

          {sent ? (
            <div
              style={{
                background: "rgba(34,197,94,0.08)",
                border: "1px solid rgba(34,197,94,0.2)",
                borderRadius: 8,
                padding: "1rem",
                color: "#22c55e",
                fontSize: "0.875rem",
                textAlign: "center",
              }}
            >
              Check your email for a confirmation link ✓
            </div>
          ) : (
            <>
              {/* OAuth buttons */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                <button
                  onClick={handleGitHub}
                  className="btn btn-secondary"
                  style={{ width: "100%", justifyContent: "center", padding: "0.625rem" }}
                >
                  <GitBranch size={16} />
                  Continue with GitHub
                </button>
                <button
                  onClick={handleGoogle}
                  className="btn btn-secondary"
                  style={{ width: "100%", justifyContent: "center", padding: "0.625rem" }}
                >
                  <Mail size={16} />
                  Continue with Google
                </button>
              </div>

              {/* Divider */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  margin: "1.25rem 0",
                }}
              >
                <div style={{ flex: 1, height: 1, background: "#1a1a1a" }} />
                <span style={{ fontSize: "0.75rem", color: "#444" }}>or</span>
                <div style={{ flex: 1, height: 1, background: "#1a1a1a" }} />
              </div>

              {/* Email form */}
              <form onSubmit={handleEmail} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <div>
                  <label
                    htmlFor="email"
                    style={{ fontSize: "0.8rem", color: "#666", display: "block", marginBottom: "0.4rem" }}
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    className="input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                  />
                </div>
                <div>
                  <label
                    htmlFor="password"
                    style={{ fontSize: "0.8rem", color: "#666", display: "block", marginBottom: "0.4rem" }}
                  >
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    className="input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={8}
                    autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  />
                </div>

                {error && (
                  <div
                    style={{
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

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                  style={{ width: "100%", justifyContent: "center", padding: "0.625rem", marginTop: "0.25rem" }}
                >
                  {loading
                    ? "..."
                    : mode === "signin"
                    ? "Sign in"
                    : "Create account"}
                </button>
              </form>
            </>
          )}
        </div>

        {/* Toggle mode */}
        {!sent && (
          <p style={{ textAlign: "center", marginTop: "1.25rem", fontSize: "0.85rem", color: "#555" }}>
            {mode === "signin" ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(null); }}
              style={{
                background: "none",
                border: "none",
                color: "#fff",
                cursor: "pointer",
                fontFamily: "inherit",
                fontSize: "inherit",
                padding: 0,
              }}
            >
              {mode === "signin" ? "Sign up" : "Sign in"}
            </button>
          </p>
        )}
      </div>
    </main>
  );
}
