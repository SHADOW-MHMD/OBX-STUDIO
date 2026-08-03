"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/useToast";
import { Navbar } from "@/components/layout/Navbar";
import { Settings, Key, Cpu, Loader2, Check, User } from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const { user, isLoading, setUser } = useAuthStore();
  
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("nvidia/nemotron-3-ultra-550b-a55b:free");
  const [themeAccent, setThemeAccent] = useState("cyan");
  
  const [savingKey, setSavingKey] = useState(false);
  const [savingModel, setSavingModel] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const [displayName, setDisplayName] = useState("");

  const { toast } = useToast();

  useEffect(() => {
    if (!isLoading) {
      if (!user) router.replace("/auth/login");
      else {
        setModel(user.openrouter_model || "nvidia/nemotron-3-ultra-550b-a55b:free");
        setDisplayName(user.display_name || "");
        setThemeAccent(user.theme_accent || "cyan");
      }
    }
  }, [user, isLoading, router]);

  const handleSaveKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) return;
    if (apiKey && !apiKey.startsWith('sk-or-v1-')) {
      toast('OpenRouter key must start with sk-or-v1-', 'error');
      return;
    }
    setSavingKey(true);
    try {
      await api.user.updateSettings({ openrouter_key: apiKey.trim() });
      const updatedUser = await api.auth.me();
      setUser(updatedUser);
      setApiKey("");
      toast('API Key updated successfully!', 'success');
    } catch (err: any) {
      toast(err.message || 'Failed to save API key.', 'error');
    } finally {
      setSavingKey(false);
    }
  };

  const handleSaveModel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!model.trim()) return;
    const modelPattern = /^[\w-]+\/[\w.-]+(:[\-\w]+)?$/;
    if (model && !modelPattern.test(model)) {
      toast('Model ID should be in format: provider/model-name', 'error');
      return;
    }
    setSavingModel(true);
    try {
      await api.user.updateSettings({ openrouter_model: model.trim() });
      const updatedUser = await api.auth.me();
      setUser(updatedUser);
      toast('Model preference updated successfully!', 'success');
    } catch (err: any) {
      toast(err.message || 'Failed to save model.', 'error');
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
      toast('Profile updated successfully!', 'success');
    } catch (err: any) {
      toast(err.message || 'Failed to update profile.', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveTheme = async (color: string) => {
    setThemeAccent(color);
    const colorMap: Record<string, string> = { cyan: "#06b6d4", violet: "#8b5cf6", orange: "#f97316" };
    const hex = colorMap[color] || color;
    document.documentElement.style.setProperty("--theme-accent", hex);
    document.documentElement.style.setProperty("--theme-accent-dim", `color-mix(in srgb, ${hex} 15%, transparent)`);
    try {
      await api.user.updateSettings({ theme_accent: color });
      const updatedUser = await api.auth.me();
      setUser(updatedUser);
    } catch (err: any) {
      toast(err.message || 'Failed to update theme.', 'error');
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await api.user.deleteAccount();
      router.push('/');
    } catch {
      toast('Failed to delete account', 'error');
      setIsDeleting(false);
    }
  };

  const handleExport = async () => {
    try {
      const res = await api.user.exportData();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'obx-studio-export.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast('Export downloaded!', 'success');
    } catch {
      toast('Export failed', 'error');
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

          {/* Theme Accent Selection */}
          <div style={{ background: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ padding: "1.5rem", borderBottom: "1px solid #1a1a1a", display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <div style={{ width: 18, height: 18, borderRadius: "50%", background: "var(--theme-accent)" }}></div>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 500, color: "#fff" }}>Theme Accent</h2>
            </div>
            <div style={{ padding: "1.5rem" }}>
              <p style={{ color: "#888", fontSize: "0.9rem", marginBottom: "1.5rem", lineHeight: 1.5 }}>
                Select your preferred accent color. This will be applied across the entire app.
              </p>
              
              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                {[
                  { id: "cyan", name: "Cyan", hex: "#06b6d4" },
                  { id: "violet", name: "Violet", hex: "#8b5cf6" },
                  { id: "orange", name: "Orange", hex: "#f97316" }
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handleSaveTheme(t.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      background: themeAccent === t.id ? "#1a1a1a" : "#000",
                      border: `1px solid ${themeAccent === t.id ? t.hex : "#222"}`,
                      borderRadius: 8,
                      padding: "0.75rem 1.25rem",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      color: "#fff",
                      boxShadow: themeAccent === t.id ? `0 0 0 1px ${t.hex}33, 0 4px 12px ${t.hex}22` : "none"
                    }}
                  >
                    <div style={{ width: 16, height: 16, borderRadius: "50%", background: t.hex }}></div>
                    <span style={{ fontSize: "0.9rem", fontWeight: 500 }}>{t.name}</span>
                    {themeAccent === t.id && <Check size={16} color={t.hex} style={{ marginLeft: "0.5rem" }} />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Export Data */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: 12, padding: '1.5rem' }}>
            <div>
              <h3 style={{ color: '#fff', fontSize: '1rem', fontWeight: 500, margin: 0, marginBottom: '0.25rem' }}>Export My Data</h3>
              <p style={{ color: '#666', fontSize: '0.85rem', margin: 0 }}>Download all your interviews and outputs as JSON.</p>
            </div>
            <button onClick={handleExport} className="btn btn-secondary" style={{ whiteSpace: 'nowrap' }}>Export Data</button>
          </div>

          {/* Danger Zone */}
          <div style={{ border: '1px solid #2a1a1a', borderRadius: 12, padding: '1.5rem', marginTop: '0.5rem' }}>
            <h3 style={{ color: '#ef4444', margin: 0, marginBottom: '0.5rem', fontSize: '1rem' }}>Danger Zone</h3>
            <p style={{ color: '#555', fontSize: '0.875rem', margin: 0, marginBottom: '1rem' }}>
              Permanently delete your account and all data. This cannot be undone.
            </p>
            <button onClick={() => setDeleteModalOpen(true)} style={{ background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', padding: '0.5rem 1rem', borderRadius: 8, cursor: 'pointer', fontSize: '0.875rem' }}>
              Delete Account
            </button>
          </div>

        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#111', border: '1px solid #222', borderRadius: 16, padding: '2rem', maxWidth: 400, width: '90%' }}>
            <h3 style={{ color: '#fff', margin: 0, marginBottom: '0.5rem' }}>Delete account?</h3>
            <p style={{ color: '#888', fontSize: '0.875rem', marginBottom: '1.5rem' }}>Type DELETE to confirm. This will permanently remove all your data.</p>
            <input
              value={deleteConfirm}
              onChange={e => setDeleteConfirm(e.target.value)}
              placeholder="Type DELETE"
              style={{ width: '100%', padding: '0.75rem', background: '#0a0a0a', border: '1px solid #333', borderRadius: 8, color: '#fff', marginBottom: '1rem', boxSizing: 'border-box' }}
            />
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => { setDeleteModalOpen(false); setDeleteConfirm(''); }} style={{ flex: 1, padding: '0.625rem', background: '#1a1a1a', border: '1px solid #333', borderRadius: 8, color: '#fff', cursor: 'pointer' }}>Cancel</button>
              <button
                disabled={deleteConfirm !== 'DELETE' || isDeleting}
                onClick={handleDeleteAccount}
                style={{ flex: 1, padding: '0.625rem', background: deleteConfirm === 'DELETE' ? '#ef4444' : '#1a1a1a', border: 'none', borderRadius: 8, color: '#fff', cursor: deleteConfirm === 'DELETE' ? 'pointer' : 'not-allowed', opacity: isDeleting ? 0.7 : 1 }}
              >{isDeleting ? 'Deleting...' : 'Delete Account'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
