"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Cpu, LayoutDashboard, LogOut, Settings, Shield } from "lucide-react";
import { useAuthStore } from "@/lib/store";
import { createClient } from "@/lib/supabase";

export function Navbar() {
  const { user } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  if (!user) return null;

  const nav = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    ...(user.is_admin ? [{ href: "/admin", icon: Shield, label: "Admin" }] : []),
  ];

  return (
    <header
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: 56,
        background: "rgba(0,0,0,0.85)",
        backdropFilter: "blur(16px)",
        borderBottom: "1px solid #1a1a1a",
        display: "flex",
        alignItems: "center",
        padding: "0 1.5rem",
        gap: "1rem",
        zIndex: 100,
      }}
    >
      {/* Logo */}
      <Link
        href="/dashboard"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          textDecoration: "none",
          color: "#fff",
          fontWeight: 700,
          fontSize: "0.9rem",
          letterSpacing: "-0.01em",
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 7,
            background: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Cpu size={14} color="#000" />
        </div>
        OBX-STUDIO
      </Link>

      {/* Divider */}
      <div style={{ width: 1, height: 20, background: "#222", marginLeft: 4 }} />

      {/* Nav links */}
      <nav style={{ display: "flex", alignItems: "center", gap: "0.25rem", flex: 1 }}>
        {nav.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.375rem",
              padding: "0.375rem 0.75rem",
              borderRadius: 6,
              fontSize: "0.8rem",
              fontWeight: 500,
              textDecoration: "none",
              color: pathname.startsWith(href) ? "#fff" : "#666",
              background: pathname.startsWith(href) ? "#1a1a1a" : "transparent",
              transition: "all 0.15s",
            }}
          >
            <Icon size={14} />
            {label}
          </Link>
        ))}
      </nav>

      {/* User section */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        {/* Token usage pill */}
        <div
          style={{
            background: "#111",
            border: "1px solid #222",
            borderRadius: 999,
            padding: "0.25rem 0.75rem",
            fontSize: "0.75rem",
            color: user.interviews_used_today >= user.interviews_limit ? "#ff4444" : "#888",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {user.interviews_used_today}/{user.interviews_limit} today
        </div>

        {/* Avatar */}
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: "#1a1a1a",
            border: "1px solid #333",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "0.75rem",
            color: "#888",
          }}
        >
          {(user.display_name ?? user.email)[0].toUpperCase()}
        </div>

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          className="btn btn-ghost"
          style={{ padding: "0.375rem", color: "#555" }}
          title="Sign out"
        >
          <LogOut size={15} />
        </button>
      </div>
    </header>
  );
}
