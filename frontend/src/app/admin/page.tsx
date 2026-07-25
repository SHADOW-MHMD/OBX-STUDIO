"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import { api, type AdminStats, type AdminUser } from "@/lib/api";
import { Navbar } from "@/components/layout/Navbar";
import {
  Users,
  Activity,
  MessageSquare,
  AlertTriangle,
  TrendingUp,
  Shield,
  RefreshCw,
  ChevronDown,
} from "lucide-react";

function StatCard({
  label,
  value,
  icon: Icon,
  sub,
  color = "#fff",
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  sub?: string;
  color?: string;
}) {
  return (
    <div
      style={{
        background: "#0a0a0a",
        border: "1px solid #1a1a1a",
        borderRadius: 10,
        padding: "1.25rem",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <p style={{ fontSize: "0.75rem", color: "#555", marginBottom: "0.5rem" }}>{label}</p>
          <p style={{ fontSize: "1.75rem", fontWeight: 700, color, letterSpacing: "-0.03em" }}>
            {value}
          </p>
          {sub && <p style={{ fontSize: "0.75rem", color: "#444", marginTop: "0.25rem" }}>{sub}</p>}
        </div>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: "#111",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon size={15} color="#666" />
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const { user, isLoading } = useAuthStore();
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (!user) router.push("/auth/login");
      else if (!user.is_admin) router.push("/dashboard");
    }
  }, [user, isLoading, router]);

  const loadData = async () => {
    try {
      const [s, u] = await Promise.all([api.admin.stats(), api.admin.users()]);
      setStats(s);
      setUsers(u);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user?.is_admin) loadData();
  }, [user]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const toggleAdmin = async (u: AdminUser) => {
    await api.admin.updateUser(u.id, { is_admin: !u.is_admin });
    setUsers((prev) =>
      prev.map((usr) => (usr.id === u.id ? { ...usr, is_admin: !u.is_admin } : usr))
    );
  };

  const changeTier = async (u: AdminUser, tier: "free" | "paid") => {
    await api.admin.updateUser(u.id, { tier });
    setUsers((prev) =>
      prev.map((usr) => (usr.id === u.id ? { ...usr, tier } : usr))
    );
  };

  if (!user?.is_admin) return null;

  const completionRate =
    stats && stats.interviews_started > 0
      ? Math.round((stats.interviews_completed / stats.interviews_started) * 100)
      : 0;

  return (
    <div style={{ minHeight: "100vh", background: "#000" }}>
      <Navbar />
      <main style={{ paddingTop: 88, paddingBottom: "4rem", maxWidth: 1100, margin: "0 auto", padding: "88px 1.5rem 4rem" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "2rem",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
              <Shield size={16} color="#888" />
              <h1 style={{ fontSize: "1.25rem", fontWeight: 700 }}>Admin Panel</h1>
            </div>
            <p style={{ fontSize: "0.85rem", color: "#555" }}>Platform overview and user management</p>
          </div>
          <button
            onClick={handleRefresh}
            className="btn btn-secondary"
            disabled={refreshing}
            style={{ gap: "0.5rem", fontSize: "0.85rem" }}
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem" }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 100, borderRadius: 10 }} />
            ))}
          </div>
        ) : (
          <>
            {/* Stats grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: "1rem",
                marginBottom: "2rem",
              }}
            >
              <StatCard label="Total Users" value={stats?.total_users ?? 0} icon={Users} />
              <StatCard
                label="Active Today"
                value={stats?.active_today ?? 0}
                icon={Activity}
                sub={`${stats?.active_this_week ?? 0} this week`}
              />
              <StatCard
                label="Completion Rate"
                value={`${completionRate}%`}
                icon={TrendingUp}
                sub={`${stats?.interviews_completed ?? 0} / ${stats?.interviews_started ?? 0} interviews`}
                color={completionRate >= 70 ? "#22c55e" : completionRate >= 40 ? "#f59e0b" : "#ff4444"}
              />
              <StatCard
                label="Rate Limit Hits"
                value={stats?.rate_limit_hits ?? 0}
                icon={AlertTriangle}
                sub="Users at daily limit"
                color={stats && stats.rate_limit_hits > 10 ? "#f59e0b" : "#fff"}
              />
            </div>

            {/* Output type popularity */}
            <div className="card" style={{ marginBottom: "2rem" }}>
              <h2 style={{ fontSize: "0.875rem", fontWeight: 600, marginBottom: "1rem", color: "#888" }}>
                POPULAR OUTPUT TYPES
              </h2>
              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                {stats?.output_types.map(({ type, count }) => (
                  <div
                    key={type}
                    style={{
                      background: "#111",
                      border: "1px solid #222",
                      borderRadius: 8,
                      padding: "0.625rem 1rem",
                      fontSize: "0.85rem",
                    }}
                  >
                    <span style={{ color: "#fff", fontWeight: 600 }}>{count}×</span>
                    <span style={{ color: "#555", marginLeft: "0.5rem" }}>{type.toUpperCase()}</span>
                  </div>
                ))}
                {!stats?.output_types.length && (
                  <p style={{ color: "#444", fontSize: "0.85rem" }}>No outputs generated yet.</p>
                )}
              </div>
            </div>

            {/* Users table */}
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid #1a1a1a" }}>
                <h2 style={{ fontSize: "0.875rem", fontWeight: 600, color: "#888" }}>
                  ALL USERS ({users.length})
                </h2>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #1a1a1a" }}>
                      {["User", "Tier", "Today", "Interviews", "Streak", "Last Active", "Admin", ""].map(
                        (h) => (
                          <th
                            key={h}
                            style={{
                              padding: "0.75rem 1rem",
                              textAlign: "left",
                              fontSize: "0.75rem",
                              color: "#555",
                              fontWeight: 500,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {h}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr
                        key={u.id}
                        style={{ borderBottom: "1px solid #0f0f0f" }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = "#050505")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "transparent")
                        }
                      >
                        <td style={{ padding: "0.75rem 1rem" }}>
                          <div style={{ fontSize: "0.85rem", fontWeight: 500 }}>
                            {u.display_name ?? u.email.split("@")[0]}
                          </div>
                          <div style={{ fontSize: "0.75rem", color: "#555" }}>{u.email}</div>
                        </td>
                        <td style={{ padding: "0.75rem 1rem" }}>
                          <select
                            value={u.tier}
                            onChange={(e) => changeTier(u, e.target.value as "free" | "paid")}
                            style={{
                              background: "#111",
                              border: "1px solid #222",
                              borderRadius: 6,
                              padding: "0.25rem 0.5rem",
                              color: "#fff",
                              fontSize: "0.8rem",
                              fontFamily: "inherit",
                              cursor: "pointer",
                            }}
                          >
                            <option value="free">Free</option>
                            <option value="paid">Paid</option>
                          </select>
                        </td>
                        <td
                          style={{
                            padding: "0.75rem 1rem",
                            fontSize: "0.85rem",
                            color: u.interviews_used_today >= u.interviews_limit ? "#ff4444" : "#888",
                          }}
                        >
                          {u.interviews_used_today}/{u.interviews_limit}
                        </td>
                        <td style={{ padding: "0.75rem 1rem", fontSize: "0.85rem", color: "#888" }}>
                          {u.total_interviews}
                        </td>
                        <td style={{ padding: "0.75rem 1rem", fontSize: "0.85rem", color: "#888" }}>
                          {u.streak}🔥
                        </td>
                        <td style={{ padding: "0.75rem 1rem", fontSize: "0.8rem", color: "#555" }}>
                          {u.last_active_date ?? "Never"}
                        </td>
                        <td style={{ padding: "0.75rem 1rem" }}>
                          <button
                            onClick={() => toggleAdmin(u)}
                            style={{
                              background: u.is_admin ? "rgba(34,197,94,0.1)" : "#111",
                              border: `1px solid ${u.is_admin ? "rgba(34,197,94,0.3)" : "#222"}`,
                              borderRadius: 6,
                              padding: "0.25rem 0.6rem",
                              color: u.is_admin ? "#22c55e" : "#555",
                              fontSize: "0.75rem",
                              cursor: "pointer",
                              fontFamily: "inherit",
                            }}
                          >
                            {u.is_admin ? "Admin" : "User"}
                          </button>
                        </td>
                        <td style={{ padding: "0.75rem 1rem" }} />
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!users.length && (
                  <div style={{ padding: "3rem", textAlign: "center", color: "#444", fontSize: "0.875rem" }}>
                    No users yet.
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
