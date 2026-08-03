"use client";

import Link from "next/link";
import { useAuthStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Cpu,
  ArrowRight,
  Zap,
  FileText,
  Kanban,
  Lock,
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
              <span className="animated-gradient-text">idea</span>{" "}
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
