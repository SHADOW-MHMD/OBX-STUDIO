"use client";

import Link from "next/link";
import { useAuthStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Cpu,
  ArrowRight,
  FileCode,
  Mic,
  Key,
  Network,
  MessageSquareWarning,
  Code,
  ChevronRight,
  Sparkles,
  Check,
} from "lucide-react";

/* ─── CSS-in-JS keyframes injected once ─── */
const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; }

  @keyframes gradientShift {
    0%, 100% { background-position: 0% 50%; }
    50%       { background-position: 100% 50%; }
  }

  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  @keyframes blink {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0; }
  }

  .animated-gradient-text {
    background: linear-gradient(135deg, #fff 0%, #888 40%, #fff 70%, #aaa 100%);
    background-size: 200% 200%;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: gradientShift 4s ease infinite;
  }

  .fade-in-up {
    opacity: 0;
    animation: fadeInUp 0.6s ease forwards;
  }

  .cursor {
    display: inline-block;
    width: 2px;
    height: 1em;
    background: #22c55e;
    vertical-align: text-bottom;
    animation: blink 0.9s step-end infinite;
    margin-left: 2px;
  }

  .feature-card:hover { background: #0a0a0a !important; }
  .pricing-card:hover { transform: translateY(-2px); }
  .pricing-card { transition: transform 0.2s ease, box-shadow 0.2s ease; }
  .testimonial-card:hover { border-color: #2a2a2a !important; }
  .testimonial-card { transition: border-color 0.2s ease; }

  .footer-link {
    color: #444;
    text-decoration: none;
    transition: color 0.15s;
  }
  .footer-link:hover { color: #888; }
`;

/* ─── Data ─── */
const FEATURES = [
  {
    icon: Mic,
    title: "Voice-Native Edge AI",
    desc: "Speak your ideas naturally. Zero-latency transcription powered by Cloudflare Workers AI (Whisper).",
  },
  {
    icon: FileCode,
    title: "Agent-Ready Specs",
    desc: "Outputs structured JSON/MD specification documents perfectly formatted for Cursor, v0, and Bolt.",
  },
  {
    icon: Key,
    title: "Bring Your Own Key",
    desc: "100% free to host. Just drop in your OpenRouter key and pick any model (like Nemotron or Claude 3.5 Sonnet).",
  },
  {
    icon: Network,
    title: "Interactive 2D Canvas",
    desc: "Watch your app idea map itself out in real-time as interconnected nodes, pain points, and features.",
  },
  {
    icon: MessageSquareWarning,
    title: "AI Pushback & Interview",
    desc: "The AI acts like a Senior Staff Engineer, finding holes in your architecture before you ever write code.",
  },
  {
    icon: Code,
    title: "100% Open Source",
    desc: "Deploy the entire stack yourself on Cloudflare Pages and Workers. No vendor lock-in.",
  },
];

const STEPS = [
  { n: "01", title: "Sign in", desc: "Sign in with your GitHub account. Takes 1 second." },
  { n: "02", title: "Start an interview", desc: "Tell the AI you have an idea. It takes it from there." },
  { n: "03", title: "Answer the questions", desc: "Type or pick from options. The AI adapts to your answers." },
  { n: "04", title: "Get your spec", desc: "Pick your output format. Download. Start building." },
];

const TESTIMONIALS = [
  {
    quote: "Finally, I can turn my 2am shower thoughts into a full PRD without losing half the ideas.",
    name: "Alex K., Indie Hacker",
    delay: "0ms",
  },
  {
    quote: "The VC persona grilled me harder than my actual investor pitch. 10/10 prep tool.",
    name: "Priya S., SaaS Founder",
    delay: "120ms",
  },
  {
    quote: "I used it before every product review meeting. My specs went from vague to crystal clear.",
    name: "Marcus T., Product Manager",
    delay: "240ms",
  },
];

const TERMINAL_LINES = [
  { role: "ai",   text: "What problem does your product solve?" },
  { role: "user", text: "It helps developers organize their product ideas before building." },
  { role: "ai",   text: "Who is your target user — indie hackers or enterprise teams?" },
  { role: "user", text: "Indie hackers primarily, but enterprise is on the roadmap." },
];

const FREE_FEATURES  = ["3 interviews/day", "All AI personas", "Kanban board", "Export to Markdown"];
const PRO_FEATURES   = ["Unlimited interviews", "Custom AI model", "Priority support", "Team workspaces"];

/* ─── Terminal Demo Component ─── */
function TerminalDemo() {
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    if (visibleCount >= TERMINAL_LINES.length) return;
    const id = setInterval(() => {
      setVisibleCount((c) => {
        if (c >= TERMINAL_LINES.length) {
          clearInterval(id);
          return c;
        }
        return c + 1;
      });
    }, 1200);
    return () => clearInterval(id);
  }, [visibleCount]);

  return (
    <div
      style={{
        background: "#080808",
        border: "1px solid #1a1a1a",
        borderRadius: 12,
        fontFamily: "monospace",
        padding: "1.5rem",
        maxWidth: 680,
        margin: "0 auto",
        minHeight: 180,
      }}
    >
      {/* Terminal chrome */}
      <div style={{ display: "flex", gap: 6, marginBottom: "1.25rem" }}>
        {["#ff5f57", "#ffbd2e", "#28c841"].map((c) => (
          <div key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />
        ))}
      </div>

      {TERMINAL_LINES.slice(0, visibleCount).map((line, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "0.75rem",
            marginBottom: "0.85rem",
            animation: "fadeInUp 0.35s ease forwards",
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: line.role === "ai" ? "#22c55e" : "#fff",
              marginTop: 5,
              flexShrink: 0,
            }}
          />
          <span style={{ fontSize: "0.85rem", lineHeight: 1.6 }}>
            <span
              style={{
                color: line.role === "ai" ? "#22c55e" : "#888",
                fontWeight: 600,
                marginRight: 6,
              }}
            >
              {line.role === "ai" ? "AI:" : "You:"}
            </span>
            <span style={{ color: line.role === "ai" ? "#ccc" : "#fff" }}>{line.text}</span>
          </span>
        </div>
      ))}

      {visibleCount < TERMINAL_LINES.length && (
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: visibleCount % 2 === 0 ? "#22c55e" : "#fff",
              flexShrink: 0,
            }}
          />
          <span className="cursor" />
        </div>
      )}
    </div>
  );
}

/* ─── Page ─── */
export default function LandingPage() {
  const { user, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) router.replace("/dashboard");
  }, [user, isLoading, router]);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: GLOBAL_STYLES }} />

      <main style={{ minHeight: "100vh", background: "#000", color: "#fff" }}>

        {/* ── Header ── */}
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

        {/* ── Hero ── */}
        <section
          style={{
            paddingTop: "calc(56px + 4rem)",
            paddingBottom: "6rem",
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
              maskImage: "radial-gradient(ellipse 90% 90% at 50% 0%, black 40%, transparent 100%)",
              WebkitMaskImage:
                "radial-gradient(ellipse 90% 90% at 50% 0%, black 40%, transparent 100%)",
            }}
          />

          <div
            style={{
              position: "relative",
              maxWidth: 1200,
              margin: "0 auto",
              padding: "0 2rem",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: "4rem",
              alignItems: "center",
            }}
          >
            {/* Left side: Copy & CTAs */}
            <div className="fade-in-up" style={{ textAlign: "left" }}>
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
                <span style={{ color: "#fff" }}>Open Source & BYOK</span>
              </div>

              <h1
                style={{
                  fontSize: "clamp(2.5rem, 5vw, 4rem)",
                  fontWeight: 800,
                  letterSpacing: "-0.04em",
                  lineHeight: 1.1,
                  marginBottom: "1.5rem",
                }}
              >
                Plan apps like a{" "}
                <span className="animated-gradient-text">Senior Engineer</span>.
              </h1>

              <p
                style={{
                  fontSize: "1.15rem",
                  color: "#888",
                  lineHeight: 1.6,
                  marginBottom: "2.5rem",
                  maxWidth: 500,
                }}
              >
                Generate agent-ready specs in minutes. OBX-STUDIO grills you with smart AI questions, maps your ideas to a Neural Canvas, and outputs structured PRDs ready for Cursor, v0, and Bolt.
              </p>

              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
                <Link
                  href="/auth/login"
                  className="btn btn-primary"
                  style={{ padding: "0.75rem 1.5rem", fontSize: "0.95rem", gap: "0.5rem" }}
                >
                  Start Planning (Free)
                  <ArrowRight size={16} />
                </Link>
                <Link
                  href="/auth/login"
                  className="btn btn-secondary"
                  style={{ padding: "0.75rem 1.5rem", fontSize: "0.95rem" }}
                >
                  Bring Your Own Key
                </Link>
                <a
                  href="#demo"
                  style={{
                    padding: "0.75rem 1.5rem",
                    fontSize: "0.95rem",
                    color: "#aaa",
                    border: "1px solid #333",
                    borderRadius: 8,
                    textDecoration: "none",
                    background: "rgba(255,255,255,0.03)",
                    transition: "all 0.15s ease"
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "#fff"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.color = "#aaa"; }}
                >
                  View Demo
                </a>
              </div>
            </div>

            {/* Right side: Neural Canvas SVG Preview */}
            <div
              className="fade-in-up"
              style={{
                position: "relative",
                width: "100%",
                height: 400,
                animationDelay: "150ms",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "radial-gradient(circle at center, rgba(34, 197, 94, 0.08) 0%, transparent 70%)",
                  filter: "blur(40px)",
                  zIndex: 0,
                }}
              />
              <svg width="100%" height="100%" viewBox="0 0 500 400" style={{ overflow: 'visible', zIndex: 1 }}>
                <defs>
                  <linearGradient id="edgeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.4" />
                  </linearGradient>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                
                {/* Edges */}
                <line x1="250" y1="200" x2="120" y2="100" stroke="url(#edgeGradient)" strokeWidth="2" />
                <line x1="250" y1="200" x2="380" y2="100" stroke="url(#edgeGradient)" strokeWidth="2" />
                <line x1="250" y1="200" x2="150" y2="300" stroke="url(#edgeGradient)" strokeWidth="2" />
                <line x1="250" y1="200" x2="350" y2="300" stroke="url(#edgeGradient)" strokeWidth="2" />
                
                <line x1="120" y1="100" x2="80" y2="160" stroke="#333" strokeWidth="1.5" strokeDasharray="4 4" />
                <line x1="380" y1="100" x2="420" y2="160" stroke="#333" strokeWidth="1.5" strokeDasharray="4 4" />

                {/* Nodes */}
                {/* Idea Node (Center) */}
                <circle cx="250" cy="200" r="8" fill="#fff" filter="url(#glow)" />
                <rect x="215" y="215" width="70" height="26" rx="6" fill="#000" stroke="#fff" strokeWidth="1" />
                <text x="250" y="232" fill="#fff" fontSize="12" fontWeight="600" textAnchor="middle">Idea</text>

                {/* Persona Node */}
                <circle cx="120" cy="100" r="6" fill="#3b82f6" filter="url(#glow)" />
                <rect x="85" y="65" width="70" height="22" rx="4" fill="#000" stroke="#3b82f6" strokeWidth="1" />
                <text x="120" y="80" fill="#3b82f6" fontSize="10" fontWeight="600" textAnchor="middle">Persona</text>

                {/* Feature Node 1 */}
                <circle cx="380" cy="100" r="6" fill="#22c55e" filter="url(#glow)" />
                <rect x="345" y="65" width="70" height="22" rx="4" fill="#000" stroke="#22c55e" strokeWidth="1" />
                <text x="380" y="80" fill="#22c55e" fontSize="10" fontWeight="600" textAnchor="middle">Auth</text>

                {/* Feature Node 2 */}
                <circle cx="150" cy="300" r="6" fill="#22c55e" filter="url(#glow)" />
                <rect x="115" y="315" width="70" height="22" rx="4" fill="#000" stroke="#22c55e" strokeWidth="1" />
                <text x="150" y="330" fill="#22c55e" fontSize="10" fontWeight="600" textAnchor="middle">Database</text>

                {/* Market Node */}
                <circle cx="350" cy="300" r="6" fill="#eab308" filter="url(#glow)" />
                <rect x="315" y="315" width="70" height="22" rx="4" fill="#000" stroke="#eab308" strokeWidth="1" />
                <text x="350" y="330" fill="#eab308" fontSize="10" fontWeight="600" textAnchor="middle">SaaS</text>

                {/* Sub-nodes */}
                <circle cx="80" cy="160" r="4" fill="#a855f7" />
                <circle cx="420" cy="160" r="4" fill="#a855f7" />
              </svg>
            </div>
          </div>
        </section>

        {/* ── Features ── */}
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
                className="feature-card"
                style={{
                  background: "#000",
                  padding: "2rem",
                  transition: "background 0.15s",
                }}
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

        {/* ── Demo Terminal ── */}
        <section id="demo" style={{ padding: "5rem 2rem", maxWidth: 1100, margin: "0 auto" }}>
          <p
            style={{
              fontSize: "0.75rem",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "#555",
              textAlign: "center",
              marginBottom: "1rem",
            }}
          >
            See it in action
          </p>
          <h2
            style={{
              fontSize: "clamp(1.5rem, 3vw, 2.25rem)",
              fontWeight: 700,
              letterSpacing: "-0.03em",
              textAlign: "center",
              marginBottom: "2.5rem",
            }}
          >
            Watch an AI interview unfold
          </h2>
          <TerminalDemo />
        </section>

        {/* ── Testimonials ── */}
        <section style={{ padding: "5rem 2rem", maxWidth: 1100, margin: "0 auto" }}>
          <p
            style={{
              fontSize: "0.75rem",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "#555",
              textAlign: "center",
              marginBottom: "1rem",
            }}
          >
            Trusted by builders
          </p>
          <h2
            style={{
              fontSize: "clamp(1.5rem, 3vw, 2.25rem)",
              fontWeight: 700,
              letterSpacing: "-0.03em",
              textAlign: "center",
              marginBottom: "3rem",
            }}
          >
            What people are saying
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "1rem",
            }}
          >
            {TESTIMONIALS.map(({ quote, name, delay }) => (
              <div
                key={name}
                className="testimonial-card fade-in-up"
                style={{
                  background: "#080808",
                  border: "1px solid #1a1a1a",
                  borderRadius: 12,
                  padding: "1.5rem",
                  animationDelay: delay,
                }}
              >
                {/* Quote mark */}
                <div style={{ fontSize: "2rem", color: "#222", lineHeight: 1, marginBottom: "0.75rem" }}>
                  &ldquo;
                </div>
                <p style={{ fontSize: "0.9rem", color: "#ccc", lineHeight: 1.7, marginBottom: "1.25rem" }}>
                  {quote}
                </p>
                <p style={{ fontSize: "0.85rem", color: "#555" }}>— {name}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Pricing ── */}
        <section style={{ padding: "5rem 2rem", maxWidth: 1100, margin: "0 auto" }}>
          <p
            style={{
              fontSize: "0.75rem",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "#555",
              textAlign: "center",
              marginBottom: "1rem",
            }}
          >
            Simple pricing
          </p>
          <h2
            style={{
              fontSize: "clamp(1.5rem, 3vw, 2.25rem)",
              fontWeight: 700,
              letterSpacing: "-0.03em",
              textAlign: "center",
              marginBottom: "3rem",
            }}
          >
            Start free. Scale when ready.
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "1rem",
              maxWidth: 720,
              margin: "0 auto",
            }}
          >
            {/* Free tier */}
            <div
              className="pricing-card"
              style={{
                background: "#080808",
                border: "1px solid #1a1a1a",
                borderRadius: 16,
                padding: "2rem",
              }}
            >
              <p style={{ fontSize: "0.75rem", color: "#555", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.5rem" }}>
                Free forever
              </p>
              <div style={{ fontSize: "2.5rem", fontWeight: 800, letterSpacing: "-0.04em", marginBottom: "0.25rem" }}>
                $0
              </div>
              <p style={{ fontSize: "0.85rem", color: "#555", marginBottom: "1.75rem" }}>
                No credit card required
              </p>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.65rem", marginBottom: "2rem" }}>
                {FREE_FEATURES.map((f) => (
                  <li key={f} style={{ display: "flex", alignItems: "center", gap: "0.6rem", fontSize: "0.875rem", color: "#ccc" }}>
                    <Check size={14} color="#22c55e" strokeWidth={2.5} />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/auth/login"
                className="btn btn-secondary"
                style={{ display: "block", textAlign: "center", padding: "0.75rem 1rem" }}
              >
                Get started free
              </Link>
            </div>

            {/* Pro card */}
            <div
              className="pricing-card"
              style={{
                background: "#0a0a0a",
                border: "1px solid #333",
                borderRadius: 16,
                padding: "2rem",
                position: "relative",
              }}
            >
              {/* Coming soon badge */}
              <div
                style={{
                  position: "absolute",
                  top: "1.25rem",
                  right: "1.25rem",
                  background: "#111",
                  border: "1px solid #2a2a2a",
                  borderRadius: 999,
                  padding: "0.2rem 0.65rem",
                  fontSize: "0.7rem",
                  color: "#666",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}
              >
                Coming Soon
              </div>
              <p style={{ fontSize: "0.75rem", color: "#888", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.5rem" }}>
                Pro
              </p>
              <div style={{ fontSize: "2.5rem", fontWeight: 800, letterSpacing: "-0.04em", marginBottom: "0.25rem" }}>
                TBD
              </div>
              <p style={{ fontSize: "0.85rem", color: "#555", marginBottom: "1.75rem" }}>
                Early-bird pricing for waitlist
              </p>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.65rem", marginBottom: "2rem" }}>
                {PRO_FEATURES.map((f) => (
                  <li key={f} style={{ display: "flex", alignItems: "center", gap: "0.6rem", fontSize: "0.875rem", color: "#ccc" }}>
                    <Check size={14} color="#888" strokeWidth={2.5} />
                    {f}
                  </li>
                ))}
              </ul>
              <a
                href="mailto:hello@obx.studio"
                className="btn btn-primary"
                style={{ display: "block", textAlign: "center", padding: "0.75rem 1rem", textDecoration: "none" }}
              >
                Join waitlist
              </a>
            </div>
          </div>
        </section>

        {/* ── How it works ── */}
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

        {/* ── CTA ── */}
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

        {/* ── Footer ── */}
        <footer
          style={{
            borderTop: "1px solid #111",
            padding: "1.5rem 2rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "0.75rem",
            fontSize: "0.8rem",
            color: "#444",
            maxWidth: 1100,
            margin: "0 auto",
          }}
        >
          <span>© 2025 OBX-STUDIO</span>
          <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
            <a
              href="https://github.com/SHADOW-MHMD/OBX-STUDIO"
              target="_blank"
              rel="noreferrer"
              className="footer-link"
            >
              Open source
            </a>
            <a href="https://status.obx.studio" target="_blank" rel="noreferrer" className="footer-link">
              Status
            </a>
            <Link href="/terms" className="footer-link">
              Terms
            </Link>
            <Link href="/privacy" className="footer-link">
              Privacy
            </Link>
          </div>
        </footer>

      </main>
    </>
  );
}
