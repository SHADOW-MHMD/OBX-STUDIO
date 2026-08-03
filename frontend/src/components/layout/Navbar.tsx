"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Cpu, LogOut, Settings, Shield } from "lucide-react";
import { useAuthStore } from "@/lib/store";
import { createClient } from "@/lib/supabase";

export function Navbar() {
  const { user } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  // A10 Fix: Click-outside listener + Escape key
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, []);

  if (!user) return null;

  const nav = [
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
      <div ref={dropdownRef} style={{ position: "relative" }}>
        {/* Avatar trigger */}
        <button
          onClick={() => setDropdownOpen((v) => !v)}
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: dropdownOpen ? "#222" : "#1a1a1a",
            border: `1px solid ${dropdownOpen ? "#444" : "#333"}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "0.85rem",
            color: "#888",
            cursor: "pointer",
            transition: "all 0.15s",
          }}
          aria-label="User menu"
          aria-expanded={dropdownOpen}
        >
          {(user.display_name ?? user.email)[0].toUpperCase()}
        </button>

        {/* Dropdown Menu */}
        {dropdownOpen && (
          <div
            style={{
              position: "absolute",
              right: 0,
              top: "calc(100% + 8px)",
              width: 200,
              borderRadius: 10,
              background: "#111",
              border: "1px solid #222",
              boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
              zIndex: 200,
              animation: "scaleIn 0.15s ease",
              transformOrigin: "top right",
              overflow: "hidden",
            }}
          >
            <div style={{ padding: "0.625rem 1rem", borderBottom: "1px solid #1a1a1a" }}>
              <p style={{ color: "#fff", fontSize: "0.85rem", margin: 0, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {user.display_name || user.email}
              </p>
              <p style={{ color: "#555", fontSize: "0.75rem", margin: 0, marginTop: 2 }}>
                {user.tier.toUpperCase()} TIER
              </p>
            </div>
            <Link
              href="/settings"
              onClick={() => setDropdownOpen(false)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.5rem 1rem",
                color: "#aaa",
                textDecoration: "none",
                fontSize: "0.85rem",
                transition: "color 0.1s, background 0.1s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#fff";
                e.currentTarget.style.background = "#1a1a1a";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "#aaa";
                e.currentTarget.style.background = "transparent";
              }}
            >
              <Settings size={14} />
              Settings
            </Link>
            <button
              onClick={handleSignOut}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.5rem 1rem",
                color: "#ff4444",
                textDecoration: "none",
                fontSize: "0.85rem",
                background: "transparent",
                border: "none",
                width: "100%",
                cursor: "pointer",
                textAlign: "left",
                transition: "background 0.1s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#ff44441a")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <LogOut size={14} />
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
