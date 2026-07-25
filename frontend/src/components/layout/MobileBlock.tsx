"use client";

import { useEffect, useState } from "react";
import { Cpu } from "lucide-react";

function isMobile(): boolean {
  if (typeof window === "undefined") return false;
  return window.innerWidth < 1024 ||
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
}

/**
 * On mobile: show a polite block screen.
 * Interview flow is allowed on mobile — only Kanban/Export pages block.
 * This component only blocks the full app on very small screens (<640px)
 * where even the chat UI would be unusable.
 */
export function MobileBlock({ children }: { children: React.ReactNode }) {
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    const check = () => setBlocked(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  if (blocked) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
          textAlign: "center",
          gap: "1.5rem",
          background: "#000",
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 14,
            background: "#111",
            border: "1px solid #222",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Cpu size={24} color="#fff" />
        </div>
        <div>
          <h1 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.5rem", color: "#fff" }}>
            OBX-STUDIO
          </h1>
          <p style={{ color: "#888", fontSize: "0.9rem", maxWidth: 280, lineHeight: 1.6 }}>
            We&apos;re in beta. Mobile support is coming soon — open this on your laptop
            to get started.
          </p>
        </div>
        <div
          style={{
            background: "#111",
            border: "1px solid #222",
            borderRadius: 8,
            padding: "0.75rem 1.25rem",
            fontSize: "0.8rem",
            color: "#555",
          }}
        >
          Hint: the desktop version is pretty sick 🖥️
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
