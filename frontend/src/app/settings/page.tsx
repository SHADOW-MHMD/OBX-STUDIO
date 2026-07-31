"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import { api } from "@/lib/api";
import { Navbar } from "@/components/layout/Navbar";
import { Settings, Key, Cpu, Loader2, Check, User } from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const { user, isLoading, setUser } = useAuthStore();
  
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("nvidia/nemotron-3-ultra-550b-a55b:free");
  
  const [savingKey, setSavingKey] = useState(false);
  const [savingModel, setSavingModel] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  
  const [displayName, setDisplayName] = useState("");

  useEffect(() => {
    if (!isLoading) {
      if (!user) router.replace("/auth/login");
      else {
        setModel(user.openrouter_model || "nvidia/nemotron-3-ultra-550b-a55b:free");
        setDisplayName(user.display_name || "");
      }
    }
  }, [user, isLoading, router]);

  const handleSaveKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) return;
    setSavingKey(true);
    try {
      await api.user.updateSettings({ openrouter_key: apiKey.trim() });
      const updatedUser = await api.auth.me();
      setUser(updatedUser);
      setApiKey("");
      alert("API Key updated successfully!");
    } catch (err: any) {
      alert(err.message || "Failed to save API key.");
    } finally {
      setSavingKey(false);
    }
  };

  const handleSaveModel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!model.trim()) return;
    setSavingModel(true);
    try {
      await api.user.updateSettings({ openrouter_model: model.trim() });
      const updatedUser = await api.auth.me();
      setUser(updatedUser);
      alert("Model preference updated successfully!");
    } catch (err: any) {
      alert(err.message || "Failed to save model.");
    } finally {
      setSavingModel(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await api.auth.updateProfile({ display_name: displayName.trim() });
      const updatedUser = await api.auth.me();
      setUser(updatedUser);
      alert("Profile updated successfully!");
    } catch (err: any) {
      alert(err.message || "Failed to update profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  if (isLoading || !user) return null;

  return (
    <div style={{ minHeight: "100vh", background: "#000", paddingBottom: "4rem" }}>
      <Navbar />
      
      <main style={{ maxWidth: 800, margin: "0 auto", padding: "calc(56px + 3rem) 1.5rem 0" }} className="animate-fadein">
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "2.5rem" }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "#111", border: "1px solid #222", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Settings size={20} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 600, color: "#fff", letterSpacing: "-0.02em" }}>Settings</h1>
            <p style={{ color: "#888", fontSize: "0.9rem" }}>Manage your account, API keys, and model preferences</p>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          
          {/* Profile Settings */}
          <div style={{ background: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ padding: "1.5rem", borderBottom: "1px solid #1a1a1a", display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <User size={18} color="#aaa" />
              <h2 style={{ fontSize: "1.1rem", fontWeight: 500, color: "#fff" }}>Profile Settings</h2>
            </div>
            <div style={{ padding: "1.5rem" }}>
              <form onSubmit={handleSaveProfile} style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: 400 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", marginBottom: "0.5rem" }}>
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: "50%",
                      background: "#1a1a1a",
                      border: "1px solid #333",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1.5rem",
                      color: "#888",
                    }}
                  >
                    {(user.display_name ?? user.email)[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ color: "#fff", fontSize: "0.9rem", fontWeight: 500, marginBottom: "0.25rem" }}>{user.email}</p>
                    <p style={{ color: "#666", fontSize: "0.8rem" }}>{user.tier.toUpperCase()} TIER</p>
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", color: "#888", marginBottom: "0.5rem" }}>Display Name</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your name"
                    style={{
                      width: "100%",
                      background: "#000",
                      border: "1px solid #222",
                      borderRadius: 8,
                      padding: "0.6rem 1rem",
                      color: "#fff",
                      fontSize: "0.9rem",
                      outline: "none",
                    }}
                  />
                </div>
                
                <button type="submit" className="btn btn-secondary" style={{ width: "fit-content" }} disabled={savingProfile}>
                  {savingProfile ? <Loader2 size={16} className="animate-spin" /> : "Save Profile"}
                </button>
              </form>
            </div>
          </div>

          {/* API Key Settings */}
          <div style={{ background: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ padding: "1.5rem", borderBottom: "1px solid #1a1a1a", display: "flex", alignItems: "center", gap: "0.75rem", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <Key size={18} color="#aaa" />
                <h2 style={{ fontSize: "1.1rem", fontWeight: 500, color: "#fff" }}>OpenRouter API Key</h2>
              </div>
              {user.has_key && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", background: "rgba(16, 185, 129, 0.1)", color: "#10b981", padding: "0.25rem 0.6rem", borderRadius: 999, fontSize: "0.75rem", fontWeight: 500 }}>
                  <Check size={12} /> Key is active
                </div>
              )}
            </div>
            <div style={{ padding: "1.5rem" }}>
              <p style={{ color: "#888", fontSize: "0.9rem", marginBottom: "1.5rem", lineHeight: 1.5 }}>
                Your API key is securely encrypted before being stored in the database. Updating it will replace your old key.
              </p>
              <form onSubmit={handleSaveKey} style={{ display: "flex", alignItems: "flex-end", gap: "1rem", maxWidth: 500 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontSize: "0.85rem", color: "#888", marginBottom: "0.5rem" }}>New API Key</label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={user.has_key ? "sk-or-v1-... (Hidden for security)" : "sk-or-v1-..."}
                    style={{
                      width: "100%",
                      background: "#000",
                      border: "1px solid #222",
                      borderRadius: 8,
                      padding: "0.6rem 1rem",
                      color: "#fff",
                      fontSize: "0.9rem",
                      outline: "none",
                    }}
                  />
                </div>
                <button type="submit" disabled={!apiKey.trim() || savingKey} className="btn btn-secondary">
                  {savingKey ? <Loader2 size={16} className="animate-spin" /> : "Update Key"}
                </button>
              </form>
            </div>
          </div>

          {/* Model Selection */}
          <div style={{ background: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ padding: "1.5rem", borderBottom: "1px solid #1a1a1a", display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <Cpu size={18} color="#aaa" />
              <h2 style={{ fontSize: "1.1rem", fontWeight: 500, color: "#fff" }}>Model Preferences</h2>
            </div>
            <div style={{ padding: "1.5rem" }}>
              <p style={{ color: "#888", fontSize: "0.9rem", marginBottom: "1.5rem", lineHeight: 1.5 }}>
                Select the AI model you want to use for interviews and output generation. This model must be supported by OpenRouter.
              </p>
              <form onSubmit={handleSaveModel} style={{ display: "flex", alignItems: "flex-end", gap: "1rem", maxWidth: 500 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontSize: "0.85rem", color: "#888", marginBottom: "0.5rem" }}>Model ID</label>
                  <input
                    type="text"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="e.g. nvidia/nemotron-3-ultra-550b-a55b:free"
                    style={{
                      width: "100%",
                      background: "#000",
                      border: "1px solid #222",
                      borderRadius: 8,
                      padding: "0.6rem 1rem",
                      color: "#fff",
                      fontSize: "0.9rem",
                      outline: "none",
                    }}
                  />
                </div>
                <button type="submit" disabled={!model.trim() || savingModel} className="btn btn-secondary">
                  {savingModel ? <Loader2 size={16} className="animate-spin" /> : "Save Model"}
                </button>
              </form>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
