"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  Flame,
  CheckCircle,
  Clock,
  Trash2,
  ExternalLink,
  Kanban,
} from "lucide-react";
import { useAuthStore } from "@/lib/store";
import { api, type Interview, type UserStats } from "@/lib/api";
import { Navbar } from "@/components/layout/Navbar";

// ─── Helpers ────────────────────────────────────────────────────────────────

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ─── Skeleton Components ─────────────────────────────────────────────────────

function StatCardSkeleton() {
  return (
    <div
      style={{
        background: "#111",
        border: "1px solid #1a1a1a",
        borderRadius: 12,
        padding: "1.25rem 1.5rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
        flex: 1,
        minWidth: 0,
      }}
    >
      <div className="skeleton" style={{ height: 12, width: "60%", borderRadius: 6 }} />
      <div className="skeleton" style={{ height: 28, width: "40%", borderRadius: 6 }} />
      <div className="skeleton" style={{ height: 10, width: "50%", borderRadius: 6 }} />
    </div>
  );
}

function InterviewCardSkeleton() {
  return (
    <div
      style={{
        padding: "1.125rem 1.5rem",
        display: "flex",
        alignItems: "center",
        gap: "1rem",
      }}
    >
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <div className="skeleton" style={{ height: 14, width: "35%", borderRadius: 6 }} />
        <div className="skeleton" style={{ height: 11, width: "20%", borderRadius: 6 }} />
      </div>
      <div className="skeleton" style={{ height: 26, width: 72, borderRadius: 999 }} />
      <div className="skeleton" style={{ height: 32, width: 80, borderRadius: 8 }} />
    </div>
  );
}

// ─── Stat Card ───────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon?: React.ReactNode;
  highlight?: boolean;
}

function StatCard({ label, value, sub, icon, highlight }: StatCardProps) {
  return (
    <div
      style={{
        background: "#111",
        border: `1px solid ${highlight ? "#2a2a2a" : "#1a1a1a"}`,
        borderRadius: 12,
        padding: "1.25rem 1.5rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.375rem",
        flex: 1,
        minWidth: 0,
        transition: "border-color 0.15s",
      }}
    >
      <span
        style={{
          fontSize: "0.72rem",
          fontWeight: 500,
          color: "#555",
          textTransform: "uppercase",
          letterSpacing: "0.07em",
        }}
      >
        {label}
      </span>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
        }}
      >
        {icon && <span style={{ fontSize: "1.1rem" }}>{icon}</span>}
        <span
          style={{
            fontSize: "1.875rem",
            fontWeight: 700,
            color: "#fff",
            letterSpacing: "-0.03em",
            lineHeight: 1,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {value}
        </span>
      </div>
      {sub && (
        <span style={{ fontSize: "0.75rem", color: "#444", marginTop: 2 }}>{sub}</span>
      )}
    </div>
  );
}

// ─── Interview Card ───────────────────────────────────────────────────────────

interface InterviewCardProps {
  interview: Interview;
  isFirst: boolean;
  onDelete: (id: string) => void;
  deleting: boolean;
  onRename: (id: string, newTitle: string) => void;
}

function InterviewCard({ interview, isFirst, onDelete, deleting, onRename }: InterviewCardProps) {
  const isCompleted = interview.status === "completed";
  const title = interview.title?.trim() || "Untitled idea";

  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(title);
  const [savingTitle, setSavingTitle] = useState(false);

  const handleSaveTitle = async () => {
    if (!editValue.trim() || editValue.trim() === title) {
      setIsEditing(false);
      setEditValue(title);
      return;
    }
    setSavingTitle(true);
    try {
      await api.interview.rename(interview.id, editValue.trim());
      onRename(interview.id, editValue.trim());
      setIsEditing(false);
    } catch {
      alert("Failed to rename interview");
    } finally {
      setSavingTitle(false);
    }
  };

  return (
    <div
      style={{
        borderTop: isFirst ? "none" : "1px solid #111",
        padding: "1rem 1.5rem",
        display: "flex",
        alignItems: "center",
        gap: "1rem",
        transition: "background 0.1s",
      }}
      onMouseEnter={(e) =>
        ((e.currentTarget as HTMLDivElement).style.background = "#0d0d0d")
      }
      onMouseLeave={(e) =>
        ((e.currentTarget as HTMLDivElement).style.background = "transparent")
      }
    >
      {/* Left: title + date */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {isEditing ? (
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveTitle();
                if (e.key === "Escape") {
                  setIsEditing(false);
                  setEditValue(title);
                }
              }}
              autoFocus
              disabled={savingTitle}
              style={{
                fontSize: "0.875rem",
                fontWeight: 500,
                background: "#000",
                color: "#fff",
                border: "1px solid #333",
                borderRadius: 4,
                padding: "2px 6px",
                outline: "none",
                width: "100%",
                maxWidth: 300,
              }}
            />
            <button
              onClick={handleSaveTitle}
              disabled={savingTitle}
              className="btn btn-primary"
              style={{ padding: "2px 8px", fontSize: "0.75rem", height: "auto" }}
            >
              Save
            </button>
            <button
              onClick={() => {
                setIsEditing(false);
                setEditValue(title);
              }}
              disabled={savingTitle}
              className="btn btn-ghost"
              style={{ padding: "2px 8px", fontSize: "0.75rem", height: "auto" }}
            >
              Cancel
            </button>
          </div>
        ) : (
          <div
            style={{
              fontSize: "0.875rem",
              fontWeight: 500,
              color: "#fff",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              marginBottom: "0.25rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem"
            }}
          >
            {title}
            <button
              onClick={() => setIsEditing(true)}
              style={{
                background: "transparent",
                border: "none",
                color: "#444",
                cursor: "pointer",
                padding: "2px",
                display: "inline-flex",
                alignItems: "center",
              }}
              title="Rename project"
              onMouseEnter={(e) => (e.currentTarget.style.color = "#888")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#444")}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
            </button>
          </div>
        )}
        <div style={{ fontSize: "0.75rem", color: "#444" }}>
          {formatDate(interview.created_at)}
        </div>
      </div>

      {/* Status badge */}
      <span
        className={`badge ${isCompleted ? "badge-success" : "badge-warning"}`}
        style={{ flexShrink: 0 }}
      >
        {isCompleted ? "Completed" : "In progress"}
      </span>

      {/* Actions */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.375rem",
          flexShrink: 0,
        }}
      >
        {/* Resume */}
        <Link
          href={`/interview/${interview.id}`}
          className="btn btn-secondary"
          style={{ padding: "0.375rem 0.75rem", fontSize: "0.8rem", gap: "0.375rem" }}
        >
          <Clock size={13} />
          Resume
        </Link>

        {/* View Output – only if completed */}
        {isCompleted && (
          <Link
            href={`/output/${interview.id}`}
            className="btn btn-ghost"
            style={{ padding: "0.375rem 0.75rem", fontSize: "0.8rem", gap: "0.375rem" }}
            title="View Output"
          >
            <ExternalLink size={13} />
            Output
          </Link>
        )}

        {/* Open Kanban – only if completed */}
        {isCompleted && (
          <Link
            href={`/kanban/${interview.id}`}
            className="btn btn-ghost"
            style={{ padding: "0.375rem 0.75rem", fontSize: "0.8rem", gap: "0.375rem" }}
            title="Open Kanban"
          >
            <Kanban size={13} />
            Kanban
          </Link>
        )}

        {/* Delete */}
        <button
          onClick={() => onDelete(interview.id)}
          disabled={deleting}
          className="btn btn-ghost"
          style={{
            padding: "0.375rem",
            color: "#444",
            transition: "color 0.15s",
          }}
          title="Delete"
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.color = "#ff4444")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.color = "#444")
          }
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "4rem 1.5rem",
        gap: "1rem",
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 14,
          background: "#111",
          border: "1px solid #1a1a1a",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "0.25rem",
        }}
      >
        <span style={{ fontSize: "1.5rem" }}>💡</span>
      </div>
      <div>
        <p
          style={{
            fontSize: "0.9375rem",
            fontWeight: 600,
            color: "#fff",
            marginBottom: "0.375rem",
          }}
        >
          No ideas yet
        </p>
        <p style={{ fontSize: "0.825rem", color: "#555" }}>
          Start your first interview to capture and structure your ideas.
        </p>
      </div>
      <Link
        href="/interview/new"
        className="btn btn-primary"
        style={{ marginTop: "0.5rem", gap: "0.375rem" }}
      >
        <Plus size={15} />
        Start your first interview
      </Link>
    </div>
  );
}

// ─── Dashboard Page ──────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuthStore();

  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loadingInterviews, setLoadingInterviews] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Auth guard
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/auth/login");
    }
  }, [user, authLoading, router]);

  const loadData = useCallback(async () => {
    try {
      const [ivList, userStats] = await Promise.all([
        api.interview.list(),
        api.user.stats(),
      ]);
      setInterviews(ivList);
      setStats(userStats);
    } catch {
      // fail silently — user sees empty state
    } finally {
      setLoadingInterviews(false);
      setLoadingStats(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, loadData]);

  const handleDelete = async (id: string) => {
    if (deletingId) return;
    const confirmed = window.confirm(
      "Delete this interview? This cannot be undone."
    );
    if (!confirmed) return;

    setDeletingId(id);
    try {
      await api.interview.delete(id);
      setInterviews((prev) => prev.filter((iv) => iv.id !== id));
      const fresh = await api.user.stats();
      setStats(fresh);
    } catch {
      alert("Failed to delete interview. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  // Show nothing while auth resolves
  if (authLoading || !user) {
    return null;
  }

  const greeting = getGreeting();
  const firstName = user.display_name?.split(" ")[0] ?? user.email.split("@")[0];

  return (
    <div style={{ minHeight: "100vh", background: "#000" }}>
      <Navbar />

      {/* Main content — offset by navbar height (56px) + top padding (32px) */}
      <main
        style={{
          paddingTop: 56 + 32,
          paddingBottom: "4rem",
        }}
      >
        <div className="container" style={{ maxWidth: 1100 }}>
          {/* ── Header ── */}
          <div
            className="animate-fadein"
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: "1rem",
              marginBottom: "2rem",
              flexWrap: "wrap",
            }}
          >
            <div>
              <h1
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  color: "#fff",
                  letterSpacing: "-0.03em",
                  marginBottom: "0.25rem",
                }}
              >
                {greeting},{" "}
                <span style={{ color: "#fff" }}>{firstName}</span>
              </h1>
              <p style={{ fontSize: "0.875rem", color: "#555" }}>
                What will you build today?
              </p>
            </div>

            <div style={{ display: "flex", gap: "0.75rem", flexShrink: 0 }}>
              <button
                onClick={() => {
                  const currentKey = localStorage.getItem("openrouter_api_key") || "";
                  const key = window.prompt("Enter your OpenRouter API Key for BYOK (leave blank to remove):", currentKey);
                  if (key !== null) {
                    if (key.trim() === "") {
                      localStorage.removeItem("openrouter_api_key");
                      localStorage.removeItem("openrouter_model");
                      alert("BYOK settings removed. App will now use default backend limits.");
                    } else {
                      localStorage.setItem("openrouter_api_key", key.trim());
                      
                      const currentModel = localStorage.getItem("openrouter_model") || "nvidia/nemotron-3-ultra-550b-a55b:free";
                      const model = window.prompt("Enter the OpenRouter Model ID you want to use:", currentModel);
                      if (model && model.trim() !== "") {
                        localStorage.setItem("openrouter_model", model.trim());
                      }
                      
                      alert("BYOK settings saved! They will be used for all future LLM requests.");
                    }
                  }
                }}
                className="btn btn-ghost"
                style={{ gap: "0.375rem", fontSize: "0.875rem" }}
              >
                BYOK Settings
              </button>
              <Link
                href="/interview/new"
                className="btn btn-primary"
                style={{ gap: "0.375rem", fontSize: "0.875rem" }}
              >
                <Plus size={15} />
                Start New Interview
              </Link>
            </div>
          </div>

          {/* ── Stat Cards ── */}
          <div
            className="animate-fadein"
            style={{
              display: "flex",
              gap: "0.75rem",
              marginBottom: "2rem",
              flexWrap: "wrap",
            }}
          >
            {loadingStats ? (
              <>
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
              </>
            ) : (
              <>
                <StatCard
                  label="Total Interviews"
                  value={stats?.total_interviews ?? 0}
                  sub="All time"
                />
                <StatCard
                  label="Used Today"
                  value={`${stats?.interviews_used_today ?? 0}/${stats?.interviews_limit ?? 3}`}
                  sub={
                    (stats?.interviews_used_today ?? 0) >= (stats?.interviews_limit ?? 3)
                      ? "Limit reached"
                      : `${(stats?.interviews_limit ?? 3) - (stats?.interviews_used_today ?? 0)} remaining`
                  }
                  highlight={
                    (stats?.interviews_used_today ?? 0) >= (stats?.interviews_limit ?? 3)
                  }
                />
                <StatCard
                  label="Streak"
                  value={stats?.streak ?? 0}
                  icon={<Flame size={18} color="#f59e0b" />}
                  sub={stats?.streak === 1 ? "day" : "days"}
                />
                <StatCard
                  label="In Progress"
                  value={stats?.in_progress ?? 0}
                  sub="Active sessions"
                />
                <StatCard
                  label="Completed"
                  value={stats?.completed ?? 0}
                  sub="Finished interviews"
                />
              </>
            )}
          </div>

          {/* ── Interview List ── */}
          <div className="animate-fadein">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "0.875rem",
              }}
            >
              <h2
                style={{
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  color: "#555",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                Your Interviews
              </h2>
              {!loadingInterviews && interviews.length > 0 && (
                <span style={{ fontSize: "0.75rem", color: "#444" }}>
                  {interviews.length} total
                </span>
              )}
            </div>

            <div
              style={{
                background: "#111",
                border: "1px solid #1a1a1a",
                borderRadius: 12,
                overflow: "hidden",
              }}
            >
              {loadingInterviews ? (
                <>
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      style={{
                        borderTop: i === 0 ? "none" : "1px solid #171717",
                      }}
                    >
                      <InterviewCardSkeleton />
                    </div>
                  ))}
                </>
              ) : interviews.length === 0 ? (
                <EmptyState />
              ) : (
                interviews.map((iv, i) => (
                  <InterviewCard
                    key={iv.id}
                    interview={iv}
                    isFirst={i === 0}
                    onDelete={handleDelete}
                    deleting={deletingId === iv.id}
                    onRename={(id, newTitle) => {
                      setInterviews((prev) =>
                        prev.map((item) =>
                          item.id === id ? { ...item, title: newTitle } : item
                        )
                      );
                    }}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
