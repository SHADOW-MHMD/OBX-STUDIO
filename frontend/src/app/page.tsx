"use client";

import Link from "next/link";
import { useAuthStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  Cpu,
  ArrowRight,
  Zap,
  FileText,
  Kanban,
  Lock,
  ChevronRight,
  Sparkles,
} from "lucide-react";

const FEATURES = [
  {
    icon: Zap,
    title: "AI Interview Engine",
    desc: "Answers one smart question at a time — like a senior PM extracting your idea from your brain.",
  },
  {
    icon: FileText,
    title: "Instant Spec Docs",
    desc: "Choose your output: full PRD, bullet summary, phased roadmap, or tech architecture plan.",
  },
  {
    icon: Kanban,
    title: "Auto Kanban Board",
    desc: "AI breaks your idea into tasks and populates a drag-and-drop board. Ready to ship.",
  },
  {
    icon: Lock,
    title: "Yours Forever",
    desc: "Sessions saved to your account. Export .md or .pdf. No lock-in.",
  },
];

const STEPS = [
  { n: "01", title: "Sign in", desc: "Sign in with your GitHub account. Takes 1 second." },
  { n: "02", title: "Start an interview", desc: "Tell the AI you have an idea. It takes it from there." },
  { n: "03", title: "Answer the questions", desc: "Type or pick from options. The AI adapts to your answers." },
  { n: "04", title: "Get your spec", desc: "Pick your output format. Download. Start building." },
];

export default function LandingPage() {
  const { user, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) router.replace("/dashboard");
  }, [user, isLoading, router]);

  return (
    <main style={{ minHeight: "100vh", background: "#000", color: "#fff" }}>
      {/* Header */}
      <header
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: 56,
          background: "rgba(0,0,0,0.8)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid #111",
          display: "flex",
          alignItems: "center",
          padding: "0 2rem",
          zIndex: 100,
        }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            width: "100%",
            display: "flex",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flex: 1 }}>
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
            <span style={{ fontWeight: 700, fontSize: "0.9rem", letterSpacing: "-0.01em" }}>
              OBX-STUDIO
            </span>
          </div>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <Link href="/auth/login" className="btn btn-ghost" style={{ fontSize: "0.85rem" }}>
              Sign in
            </Link>
            <Link href="/auth/login" className="btn btn-primary" style={{ fontSize: "0.85rem" }}>
              Get started free
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section
        style={{
          paddingTop: "calc(56px + 6rem)",
          paddingBottom: "6rem",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background grid */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(#111 1px, transparent 1px), linear-gradient(90deg, #111 1px, transparent 1px)",
            backgroundSize: "60px 60px",
            maskImage: "radial-gradient(ellipse 80% 60% at 50% 0%, black 40%, transparent 100%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 80% 60% at 50% 0%, black 40%, transparent 100%)",
          }}
        />

        <div style={{ position: "relative", maxWidth: 720, margin: "0 auto", padding: "0 2rem" }}>
          {/* Badge */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              background: "#0f0f0f",
              border: "1px solid #222",
              borderRadius: 999,
              padding: "0.35rem 0.9rem",
              fontSize: "0.78rem",
              color: "#888",
              marginBottom: "2rem",
            }}
          >
            <Sparkles size={12} color="#fff" />
            <span style={{ color: "#fff" }}>Free while in beta</span>
            <span>·</span>
            <span>3 ideas/day</span>
          </div>

          <h1
            style={{
              fontSize: "clamp(2.5rem, 6vw, 4.5rem)",
              fontWeight: 800,
              letterSpacing: "-0.04em",
              lineHeight: 1.1,
              marginBottom: "1.5rem",
            }}
          >
            Turn your half-baked{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #fff 0%, #888 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              idea
            </span>{" "}
            into a full spec.
          </h1>

          <p
            style={{
              fontSize: "1.15rem",
              color: "#666",
              lineHeight: 1.7,
              marginBottom: "2.5rem",
              maxWidth: 520,
              margin: "0 auto 2.5rem",
            }}
          >
            OBX-STUDIO grills you about your app idea with smart AI questions,
            then generates a PRD, roadmap, and a kanban board — ready to start building.
          </p>

          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
            <Link
              href="/auth/login"
              className="btn btn-primary"
              style={{ padding: "0.75rem 1.5rem", fontSize: "0.95rem", gap: "0.5rem" }}
            >
              Start for free
              <ArrowRight size={16} />
            </Link>
            <a
              href="https://github.com/SHADOW-MHMD/OBX-STUDIO"
              target="_blank"
              rel="noreferrer"
              className="btn btn-secondary"
              >
              Star on GitHub
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: "4rem 2rem", maxWidth: 1100, margin: "0 auto" }}>
        <p
          style={{
            fontSize: "0.75rem",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: "#555",
            textAlign: "center",
            marginBottom: "3rem",
          }}
        >
          What you get
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "1px",
            background: "#1a1a1a",
            border: "1px solid #1a1a1a",
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              style={{
                background: "#000",
                padding: "2rem",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#0a0a0a")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#000")}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: "#111",
                  border: "1px solid #222",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "1rem",
                }}
              >
                <Icon size={16} color="#fff" />
              </div>
              <h3 style={{ fontSize: "0.9rem", fontWeight: 600, marginBottom: "0.5rem" }}>
                {title}
              </h3>
              <p style={{ fontSize: "0.85rem", color: "#555", lineHeight: 1.6 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section style={{ padding: "4rem 2rem", maxWidth: 1100, margin: "0 auto" }}>
        <p
          style={{
            fontSize: "0.75rem",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: "#555",
            textAlign: "center",
            marginBottom: "3rem",
          }}
        >
          How it works
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
          {STEPS.map(({ n, title, desc }, i) => (
            <div
              key={n}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "2rem",
                padding: "1.75rem 0",
                borderBottom: i < STEPS.length - 1 ? "1px solid #111" : "none",
              }}
            >
              <span
                style={{
                  fontSize: "0.75rem",
                  color: "#333",
                  fontVariantNumeric: "tabular-nums",
                  minWidth: 24,
                  paddingTop: 2,
                }}
              >
                {n}
              </span>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.25rem" }}>
                  {title}
                </h3>
                <p style={{ fontSize: "0.875rem", color: "#555" }}>{desc}</p>
              </div>
              <ChevronRight size={16} color="#333" style={{ marginTop: 3 }} />
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section
        style={{
          padding: "6rem 2rem",
          textAlign: "center",
          borderTop: "1px solid #111",
        }}
      >
        <h2
          style={{
            fontSize: "clamp(1.75rem, 4vw, 3rem)",
            fontWeight: 700,
            letterSpacing: "-0.03em",
            marginBottom: "1rem",
          }}
        >
          Stop sitting on your idea.
        </h2>
        <p style={{ color: "#555", marginBottom: "2rem", fontSize: "1rem" }}>
          Takes 10 minutes. Completely free.
        </p>
        <Link
          href="/auth/login"
          className="btn btn-primary"
          style={{ padding: "0.875rem 2rem", fontSize: "1rem" }}
        >
          Get started — it&apos;s free
        </Link>
      </section>

      {/* Footer */}
      <footer
        style={{
          borderTop: "1px solid #111",
          padding: "1.5rem 2rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: "0.8rem",
          color: "#444",
        }}
      >
        <span>© 2025 OBX-STUDIO</span>
        <a
          href="https://github.com/obx-studio"
          style={{ color: "#444", textDecoration: "none" }}
        >
          Open source
        </a>
      </footer>
    </main>
  );
}
