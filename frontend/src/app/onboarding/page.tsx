"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import { api } from "@/lib/api";
import { Key, Loader2, ArrowRight } from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  const { user, isLoading, fetchUser } = useAuthStore();
  const [key, setKey] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading) {
      if (!user) router.replace("/auth/login");
      else if (user.has_key) router.replace("/dashboard");
    }
  }, [user, isLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim() || submitting) return;

    setSubmitting(true);
    setError(null);
    try {
      await api.user.updateSettings({ openrouter_key: key.trim() });
      await fetchUser(); // Reload user state to get has_key = true
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to save API key. Please try again.");
      setSubmitting(false);
    }
  };

  if (isLoading || (user && user.has_key)) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#000" }}>
        <Loader2 className="animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#000", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <div style={{ maxWidth: 460, width: "100%", background: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: 16, padding: "2rem" }} className="animate-fadein">
        <div style={{ width: 48, height: 48, borderRadius: 12, background: "#111", border: "1px solid #222", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.5rem" }}>
          <Key size={24} color="#f59e0b" />
        </div>
        
        <h1 style={{ fontSize: "1.5rem", fontWeight: 600, color: "#fff", marginBottom: "0.5rem" }}>
          Welcome to OBX-STUDIO
        </h1>
        <p style={{ color: "#888", fontSize: "0.95rem", lineHeight: 1.5, marginBottom: "2rem" }}>
          To start generating product requirements, you need to provide an OpenRouter API Key. We encrypt and securely store your key so you can use the app without limits.
        </p>

        {error && (
          <div style={{ background: "#ff44441a", color: "#ff4444", padding: "0.75rem", borderRadius: 8, fontSize: "0.85rem", marginBottom: "1rem" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.85rem", color: "#888", marginBottom: "0.5rem" }}>OpenRouter API Key</label>
            <input
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="sk-or-v1-..."
              required
              style={{
                width: "100%",
                background: "#000",
                border: "1px solid #222",
                borderRadius: 8,
                padding: "0.75rem 1rem",
                color: "#fff",
                fontSize: "0.95rem",
                outline: "none",
                transition: "border-color 0.15s",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#444")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#222")}
            />
          </div>

          <button
            type="submit"
            disabled={!key.trim() || submitting}
            className="btn btn-primary"
            style={{ width: "100%", padding: "0.875rem", marginTop: "0.5rem", justifyContent: "center" }}
          >
            {submitting ? <Loader2 size={18} className="animate-spin" /> : (
              <>
                Continue to Dashboard
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <p style={{ color: "#555", fontSize: "0.75rem", textAlign: "center", marginTop: "1.5rem" }}>
          Don't have an OpenRouter key? Get one for free at <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer" style={{ color: "#888", textDecoration: "underline" }}>openrouter.ai</a>.
        </p>
      </div>
    </div>
  );
}
