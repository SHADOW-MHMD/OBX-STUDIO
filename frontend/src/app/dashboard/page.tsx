"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  Flame,
  Trash2,
  ExternalLink,
  Kanban,
  Search,
  Copy,
  Clock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";
import { useAuthStore } from "@/lib/store";
import { api, type Interview, type UserStats } from "@/lib/api";
import { Navbar } from "@/components/layout/Navbar";
import { useToast } from "@/hooks/useToast";

// ─── Constants ────────────────────────────────────────────────────────────────

const ITEMS_PER_PAGE = 10;
type FilterStatus = "all" | "in_progress" | "completed";

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

function getLast7DaysData(interviews: Interview[]) {
  const days: { day: string; count: number }[] = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const label = d.toLocaleDateString("en-US", { weekday: "short" });
    const dateStr = d.toISOString().slice(0, 10);
    const count = interviews.filter((iv) =>
      iv.created_at.slice(0, 10) === dateStr
    ).length;
    days.push({ day: label, count });
  }
  return days;
}

// ─── Skeleton Components ─────────────────────────────────────────────────────

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

function SidebarSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="skeleton"
          style={{ height: 80, borderRadius: 12 }}
        />
      ))}
      <div className="skeleton" style={{ height: 180, borderRadius: 12 }} />
      <div className="skeleton" style={{ height: 200, borderRadius: 12 }} />
    </div>
  );
}

// ─── Stat Card (sidebar) ─────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon?: React.ReactNode;
}

function StatCard({ label, value, sub, icon }: StatCardProps) {
  return (
    <div
      style={{
        background: "#111",
        border: "1px solid #1a1a1a",
        borderRadius: 12,
        padding: "1rem 1.25rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.25rem",
      }}
    >
      <span
        style={{
          fontSize: "0.7rem",
          fontWeight: 500,
          color: "#555",
          textTransform: "uppercase",
          letterSpacing: "0.07em",
        }}
      >
        {label}
      </span>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        {icon && <span style={{ fontSize: "1rem" }}>{icon}</span>}
        <span
          style={{
            fontSize: "1.75rem",
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
        <span style={{ fontSize: "0.72rem", color: "#444", marginTop: 2 }}>{sub}</span>
      )}
    </div>
  );
}

// ─── Interview Card ───────────────────────────────────────────────────────────

interface InterviewCardProps {
  interview: Interview;
  isFirst: boolean;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onRename: (id: string, newTitle: string) => void;
  deleting: boolean;
  duplicating: boolean;
}

function InterviewCard({
  interview,
  isFirst,
  onDelete,
  onDuplicate,
  onRename,
  deleting,
  duplicating,
}: InterviewCardProps) {
  const isCompleted = interview.status === "completed";
  const title = interview.title?.trim() || "Untitled idea";
  const { error: toastError } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(title);
  const [savingTitle, setSavingTitle] = useState(false);
  const [hovered, setHovered] = useState(false);

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
      toastError("Failed to rename interview");
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
        transition: "all 0.18s ease",
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
        borderColor: hovered ? "#333" : undefined,
        background: hovered ? "#0d0d0d" : "transparent",
        position: "relative",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Duplicate spinner overlay */}
      {duplicating && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            borderRadius: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2,
          }}
        >
          <div
            style={{
              width: 18,
              height: 18,
              border: "2px solid #333",
              borderTopColor: "#fff",
              borderRadius: "50%",
              animation: "spin 0.7s linear infinite",
            }}
          />
        </div>
      )}

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
            onDoubleClick={() => setIsEditing(true)}
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
              gap: "0.5rem",
              cursor: "default",
            }}
            title="Double-click to rename"
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
                flexShrink: 0,
              }}
              title="Rename"
              onMouseEnter={(e) => (e.currentTarget.style.color = "#888")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#444")}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
              </svg>
            </button>
          </div>
        )}
        <div style={{ fontSize: "0.72rem", color: "#444" }}>
          {formatDate(interview.created_at)}
        </div>
      </div>

      {/* Status badge */}
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.375rem",
          fontSize: "0.7rem",
          fontWeight: 500,
          padding: "3px 10px",
          borderRadius: 999,
          flexShrink: 0,
          background: isCompleted ? "rgba(34,197,94,0.1)" : "rgba(234,179,8,0.1)",
          color: isCompleted ? "#4ade80" : "#facc15",
          border: `1px solid ${isCompleted ? "rgba(74,222,128,0.2)" : "rgba(250,204,21,0.2)"}`,
        }}
      >
        <span
          style={{
            width: 5,
            height: 5,
            borderRadius: "50%",
            background: isCompleted ? "#4ade80" : "#facc15",
            flexShrink: 0,
          }}
        />
        {isCompleted ? "Completed" : "In Progress"}
      </span>

      {/* Actions */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.25rem",
          flexShrink: 0,
        }}
      >
        {/* Resume */}
        <Link
          href={`/interview/${interview.id}`}
          className="btn btn-secondary"
          style={{ padding: "0.35rem 0.65rem", fontSize: "0.78rem", gap: "0.3rem" }}
        >
          <Clock size={12} />
          Resume
        </Link>

        {/* View Output – only if completed */}
        {isCompleted && (
          <Link
            href={`/output/${interview.id}`}
            className="btn btn-ghost"
            style={{ padding: "0.35rem 0.65rem", fontSize: "0.78rem", gap: "0.3rem" }}
            title="View Output"
          >
            <ExternalLink size={12} />
            Output
          </Link>
        )}

        {/* Open Kanban – only if completed */}
        {isCompleted && (
          <Link
            href={`/kanban/${interview.id}`}
            className="btn btn-ghost"
            style={{ padding: "0.35rem 0.65rem", fontSize: "0.78rem", gap: "0.3rem" }}
            title="Open Kanban"
          >
            <Kanban size={12} />
            Kanban
          </Link>
        )}

        {/* Duplicate */}
        <button
          onClick={() => onDuplicate(interview.id)}
          disabled={duplicating || deleting}
          className="btn btn-ghost"
          style={{
            padding: "0.35rem",
            color: "#444",
            transition: "color 0.15s",
          }}
          title="Duplicate"
          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#888")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#444")}
        >
          <Copy size={13} />
        </button>

        {/* Delete */}
        <button
          onClick={() => onDelete(interview.id)}
          disabled={deleting || duplicating}
          className="btn btn-ghost"
          style={{
            padding: "0.35rem",
            color: "#444",
            transition: "color 0.15s",
          }}
          title="Delete"
          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#ff4444")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#444")}
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "3.5rem 1.5rem",
        gap: "0.875rem",
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: 13,
          background: "#111",
          border: "1px solid #1a1a1a",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span style={{ fontSize: "1.4rem" }}>{filtered ? "🔍" : "💡"}</span>
      </div>
      <div>
        <p style={{ fontSize: "0.9rem", fontWeight: 600, color: "#fff", marginBottom: "0.25rem" }}>
          {filtered ? "No matches found" : "No ideas yet"}
        </p>
        <p style={{ fontSize: "0.8rem", color: "#555" }}>
          {filtered
            ? "Try adjusting your search or filter."
            : "Start your first interview to capture and structure your ideas."}
        </p>
      </div>
      {!filtered && (
        <Link
          href="/interview/new"
          className="btn btn-primary"
          style={{ marginTop: "0.25rem", gap: "0.375rem" }}
        >
          <Plus size={14} />
          Start your first interview
        </Link>
      )}
    </div>
  );
}

// ─── Custom Tooltip for BarChart ─────────────────────────────────────────────

function CustomBarTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          background: "#1a1a1a",
          border: "1px solid #2a2a2a",
          borderRadius: 8,
          padding: "6px 10px",
          fontSize: "0.75rem",
          color: "#fff",
        }}
      >
        <div style={{ color: "#888", marginBottom: 2 }}>{label}</div>
        <div style={{ fontWeight: 600 }}>{payload[0].value} interviews</div>
      </div>
    );
  }
  return null;
}

// ─── Custom Tooltip for PieChart ─────────────────────────────────────────────

const PIE_LABELS = ["To Do", "In Progress", "Done"];
const PIE_COLORS = ["#333", "#555", "#888"];

function CustomPieTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          background: "#1a1a1a",
          border: "1px solid #2a2a2a",
          borderRadius: 8,
          padding: "6px 10px",
          fontSize: "0.75rem",
          color: "#fff",
        }}
      >
        <div style={{ color: "#888", marginBottom: 2 }}>{payload[0].name}</div>
        <div style={{ fontWeight: 600 }}>{payload[0].value}%</div>
      </div>
    );
  }
  return null;
}

// ─── Dashboard Page ──────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuthStore();
  const { success, error: toastError } = useToast();

  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loadingInterviews, setLoadingInterviews] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);

  // Search & filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Auth guard
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.replace("/auth/login");
      } else if (!user.has_key) {
        router.replace("/onboarding");
      }
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

  // Reset page when filter/search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterStatus]);

  // Derived: filtered + searched interviews
  const filteredInterviews = useMemo(() => {
    let list = interviews;
    if (filterStatus !== "all") {
      list = list.filter((iv) => iv.status === filterStatus);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter((iv) =>
        (iv.title ?? "Untitled idea").toLowerCase().includes(q)
      );
    }
    return list;
  }, [interviews, filterStatus, searchQuery]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredInterviews.length / ITEMS_PER_PAGE));
  const paginatedInterviews = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredInterviews.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredInterviews, currentPage]);

  const showingStart = filteredInterviews.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const showingEnd = Math.min(currentPage * ITEMS_PER_PAGE, filteredInterviews.length);

  // 7-day chart data
  const barData = useMemo(() => getLast7DaysData(interviews), [interviews]);

  // Donut chart data
  const pieData = useMemo(() => {
    const inProg = stats?.in_progress ?? 30;
    const done = stats?.completed ?? 25;
    const todo = Math.max(0, (stats?.total_interviews ?? 100) - inProg - done) || 30;
    return [
      { name: "To Do", value: todo },
      { name: "In Progress", value: inProg },
      { name: "Done", value: done },
    ];
  }, [stats]);

  const handleDelete = async (id: string) => {
    if (deletingId) return;
    const confirmed = window.confirm("Delete this interview? This cannot be undone.");
    if (!confirmed) return;

    setDeletingId(id);
    try {
      await api.interview.delete(id);
      setInterviews((prev) => prev.filter((iv) => iv.id !== id));
      const fresh = await api.user.stats();
      setStats(fresh);
    } catch {
      toastError("Failed to delete interview. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleDuplicate = async (id: string) => {
    if (duplicatingId) return;
    setDuplicatingId(id);
    try {
      await api.interview.duplicate(id);
      const [ivList, userStats] = await Promise.all([
        api.interview.list(),
        api.user.stats(),
      ]);
      setInterviews(ivList);
      setStats(userStats);
      success("Interview duplicated");
    } catch {
      toastError("Failed to duplicate interview.");
    } finally {
      setDuplicatingId(null);
    }
  };

  // Show nothing while auth resolves
  if (authLoading || !user) {
    return null;
  }

  const greeting = getGreeting();
  const firstName = user.display_name?.split(" ")[0] ?? user.email.split("@")[0];

  const filterTabs: { label: string; value: FilterStatus }[] = [
    { label: "All", value: "all" },
    { label: "In Progress", value: "in_progress" },
    { label: "Completed", value: "completed" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#000" }}>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
      <Navbar />

      <main style={{ paddingTop: 56 + 32, paddingBottom: "4rem" }}>
        <div className="container" style={{ maxWidth: 1200 }}>

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
              <Link
                href="/interview/new"
                className="btn btn-primary"
                style={{ gap: "0.375rem", fontSize: "0.875rem" }}
              >
                <Plus size={15} />
                New Interview
              </Link>
            </div>
          </div>

          {/* ── Two-column layout ── */}
          <div
            className="animate-fadein"
            style={{
              display: "flex",
              gap: "1.5rem",
              alignItems: "flex-start",
            }}
          >
            {/* ── LEFT: Interview List ── */}
            <div style={{ flex: 1, minWidth: 0 }}>

              {/* Search bar */}
              <div style={{ position: "relative", marginBottom: "0.875rem" }}>
                <Search
                  size={15}
                  style={{
                    position: "absolute",
                    left: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#555",
                    pointerEvents: "none",
                  }}
                />
                <input
                  type="text"
                  placeholder="Search interviews…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: "100%",
                    background: "#111",
                    border: "1px solid #1a1a1a",
                    borderRadius: 10,
                    padding: "0.6rem 0.75rem 0.6rem 2.25rem",
                    fontSize: "0.875rem",
                    color: "#fff",
                    outline: "none",
                    transition: "border-color 0.15s",
                    boxSizing: "border-box",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#333")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "#1a1a1a")}
                />
              </div>

              {/* Filter tabs */}
              <div
                style={{
                  display: "flex",
                  gap: "0.25rem",
                  marginBottom: "1rem",
                }}
              >
                {filterTabs.map((tab) => {
                  const active = filterStatus === tab.value;
                  return (
                    <button
                      key={tab.value}
                      onClick={() => setFilterStatus(tab.value)}
                      style={{
                        padding: "0.35rem 0.85rem",
                        borderRadius: 8,
                        fontSize: "0.8rem",
                        fontWeight: active ? 600 : 400,
                        border: "1px solid transparent",
                        cursor: "pointer",
                        transition: "all 0.15s",
                        background: active ? "#1a1a1a" : "transparent",
                        color: active ? "#fff" : "#555",
                        borderColor: active ? "#2a2a2a" : "transparent",
                      }}
                      onMouseEnter={(e) => {
                        if (!active) e.currentTarget.style.color = "#aaa";
                      }}
                      onMouseLeave={(e) => {
                        if (!active) e.currentTarget.style.color = "#555";
                      }}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* List section header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "0.625rem",
                }}
              >
                <h2
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color: "#555",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  Your Interviews
                </h2>
                {!loadingInterviews && filteredInterviews.length > 0 && (
                  <span style={{ fontSize: "0.72rem", color: "#444" }}>
                    {filteredInterviews.length} result{filteredInterviews.length !== 1 ? "s" : ""}
                  </span>
                )}
              </div>

              {/* Interview cards container */}
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
                        style={{ borderTop: i === 0 ? "none" : "1px solid #171717" }}
                      >
                        <InterviewCardSkeleton />
                      </div>
                    ))}
                  </>
                ) : paginatedInterviews.length === 0 ? (
                  <EmptyState filtered={searchQuery.trim().length > 0 || filterStatus !== "all"} />
                ) : (
                  paginatedInterviews.map((iv, i) => (
                    <InterviewCard
                      key={iv.id}
                      interview={iv}
                      isFirst={i === 0}
                      onDelete={handleDelete}
                      onDuplicate={handleDuplicate}
                      onRename={(id, newTitle) => {
                        setInterviews((prev) =>
                          prev.map((item) =>
                            item.id === id ? { ...item, title: newTitle } : item
                          )
                        );
                      }}
                      deleting={deletingId === iv.id}
                      duplicating={duplicatingId === iv.id}
                    />
                  ))
                )}
              </div>

              {/* Pagination */}
              {!loadingInterviews && filteredInterviews.length > ITEMS_PER_PAGE && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginTop: "1rem",
                    gap: "0.75rem",
                  }}
                >
                  <span style={{ fontSize: "0.75rem", color: "#555" }}>
                    Showing {showingStart}–{showingEnd} of {filteredInterviews.length}
                  </span>
                  <div style={{ display: "flex", gap: "0.375rem" }}>
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="btn btn-ghost"
                      style={{
                        padding: "0.375rem 0.625rem",
                        fontSize: "0.8rem",
                        gap: "0.25rem",
                        opacity: currentPage === 1 ? 0.4 : 1,
                      }}
                    >
                      <ChevronLeft size={14} />
                      Prev
                    </button>
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        padding: "0 0.5rem",
                        fontSize: "0.8rem",
                        color: "#555",
                      }}
                    >
                      {currentPage} / {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="btn btn-ghost"
                      style={{
                        padding: "0.375rem 0.625rem",
                        fontSize: "0.8rem",
                        gap: "0.25rem",
                        opacity: currentPage === totalPages ? 0.4 : 1,
                      }}
                    >
                      Next
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ── RIGHT: Stats Sidebar ── */}
            <div
              style={{
                width: 280,
                flexShrink: 0,
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
              }}
            >
              {loadingStats ? (
                <SidebarSkeleton />
              ) : (
                <>
                  {/* Stat cards */}
                  <StatCard
                    label="Total Interviews"
                    value={stats?.total_interviews ?? 0}
                    sub="All time"
                  />
                  <StatCard
                    label="Today's Interviews"
                    value={stats?.interviews_used_today ?? 0}
                    sub={`of ${stats?.interviews_limit ?? "∞"} limit`}
                  />
                  <StatCard
                    label="Streak"
                    value={stats?.streak ?? 0}
                    icon={<Flame size={16} color="#f59e0b" />}
                    sub={stats?.streak === 1 ? "day" : "days"}
                  />

                  {/* 7-day Bar Chart */}
                  <div
                    style={{
                      background: "#111",
                      border: "1px solid #1a1a1a",
                      borderRadius: 12,
                      padding: "1rem 1.25rem 0.75rem",
                    }}
                  >
                    <p
                      style={{
                        fontSize: "0.7rem",
                        fontWeight: 500,
                        color: "#555",
                        textTransform: "uppercase",
                        letterSpacing: "0.07em",
                        marginBottom: "0.75rem",
                      }}
                    >
                      Last 7 Days
                    </p>
                    <ResponsiveContainer width="100%" height={160}>
                      <BarChart
                        data={barData}
                        margin={{ top: 4, right: 0, left: -28, bottom: 0 }}
                        barCategoryGap="30%"
                      >
                        <XAxis
                          dataKey="day"
                          tick={{ fontSize: 10, fill: "#555" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          allowDecimals={false}
                          tick={{ fontSize: 10, fill: "#555" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip content={<CustomBarTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                        <Bar
                          dataKey="count"
                          fill="#333"
                          radius={[4, 4, 0, 0]}
                          onMouseOver={(_: unknown, index: number, e: React.MouseEvent<SVGElement>) => {
                            const target = e.currentTarget as SVGElement;
                            if (target) target.style.fill = "#fff";
                          }}
                          onMouseOut={(_: unknown, index: number, e: React.MouseEvent<SVGElement>) => {
                            const target = e.currentTarget as SVGElement;
                            if (target) target.style.fill = "#333";
                          }}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Kanban Donut Chart */}
                  <div
                    style={{
                      background: "#111",
                      border: "1px solid #1a1a1a",
                      borderRadius: 12,
                      padding: "1rem 1.25rem 0.875rem",
                    }}
                  >
                    <p
                      style={{
                        fontSize: "0.7rem",
                        fontWeight: 500,
                        color: "#555",
                        textTransform: "uppercase",
                        letterSpacing: "0.07em",
                        marginBottom: "0.75rem",
                      }}
                    >
                      Kanban Breakdown
                    </p>
                    <ResponsiveContainer width="100%" height={140}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={38}
                          outerRadius={58}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {pieData.map((_, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={PIE_COLORS[index % PIE_COLORS.length]}
                              stroke="transparent"
                            />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomPieTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    {/* Legend */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        gap: "0.875rem",
                        marginTop: "0.25rem",
                        flexWrap: "wrap",
                      }}
                    >
                      {pieData.map((entry, index) => (
                        <div
                          key={entry.name}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.3rem",
                            fontSize: "0.68rem",
                            color: "#666",
                          }}
                        >
                          <span
                            style={{
                              width: 7,
                              height: 7,
                              borderRadius: "50%",
                              background: PIE_COLORS[index % PIE_COLORS.length],
                              flexShrink: 0,
                            }}
                          />
                          {entry.name}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
