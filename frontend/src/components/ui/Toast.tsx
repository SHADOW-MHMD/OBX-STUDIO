"use client";

import { useToastStore, type ToastVariant } from "@/hooks/useToast";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";

const VARIANT_STYLES: Record<ToastVariant, { border: string; icon: React.ReactNode; iconColor: string }> = {
  success: {
    border: "rgba(34,197,94,0.4)",
    icon: <CheckCircle size={15} />,
    iconColor: "#22c55e",
  },
  error: {
    border: "rgba(239,68,68,0.4)",
    icon: <AlertCircle size={15} />,
    iconColor: "#ef4444",
  },
  info: {
    border: "#2a2a2a",
    icon: <Info size={15} />,
    iconColor: "#888",
  },
};

function ToastItem({ id, message, variant }: { id: string; message: string; variant: ToastVariant }) {
  const { removeToast } = useToastStore();
  const { border, icon, iconColor } = VARIANT_STYLES[variant];

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        background: "#111",
        border: `1px solid ${border}`,
        borderRadius: 10,
        padding: "0.75rem 1rem",
        minWidth: 280,
        maxWidth: 420,
        boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
        animation: "slideInRight 0.25s ease",
      }}
    >
      <span style={{ color: iconColor, flexShrink: 0 }}>{icon}</span>
      <p style={{ flex: 1, fontSize: "0.875rem", color: "#fff", lineHeight: 1.4 }}>{message}</p>
      <button
        onClick={() => removeToast(id)}
        style={{
          background: "transparent",
          border: "none",
          color: "#555",
          cursor: "pointer",
          padding: 2,
          display: "flex",
          alignItems: "center",
          flexShrink: 0,
          transition: "color 0.15s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "#555")}
      >
        <X size={14} />
      </button>
    </div>
  );
}

export function Toaster() {
  const { toasts } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "1.5rem",
        right: "1.5rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
        zIndex: 9999,
      }}
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} {...toast} />
      ))}
    </div>
  );
}
