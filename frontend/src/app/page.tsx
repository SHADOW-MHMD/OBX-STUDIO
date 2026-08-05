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
  BarChart3,
  Lock,
  Wallet,
  Activity
} from "lucide-react";

/* ─── Data ─── */
const FEATURES = [
  {
    icon: Mic,
    title: "Voice-Native Edge AI",
    desc: "Speak your ideas naturally. Zero-latency transcription powered by Cloudflare Workers AI.",
    size: "col-span-1 md:col-span-2 row-span-1"
  },
  {
    icon: FileCode,
    title: "Agent-Ready Specs",
    desc: "Outputs structured JSON/MD specification documents perfectly formatted for Cursor, v0, and Bolt.",
    size: "col-span-1 row-span-1"
  },
  {
    icon: Key,
    title: "Bring Your Own Key",
    desc: "100% free to host. Just drop in your OpenRouter key and pick any model.",
    size: "col-span-1 row-span-1"
  },
  {
    icon: Network,
    title: "Interactive 2D Canvas",
    desc: "Watch your app idea map itself out in real-time as interconnected nodes, pain points, and features.",
    size: "col-span-1 md:col-span-2 row-span-1"
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
    delay: "delay-0",
  },
  {
    quote: "The VC persona grilled me harder than my actual investor pitch. 10/10 prep tool.",
    name: "Priya S., SaaS Founder",
    delay: "delay-100",
  },
  {
    quote: "I used it before every product review meeting. My specs went from vague to crystal clear.",
    name: "Marcus T., Product Manager",
    delay: "delay-200",
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

/* ─── Components ─── */

function DashboardMockup() {
  return (
    <div className="relative w-full h-[400px] flex items-center justify-center -z-10 perspective-1000">
      {/* Background Glow */}
      <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/10 via-emerald-500/10 to-transparent blur-3xl rounded-full opacity-60"></div>

      {/* Main Glass Panel */}
      <div className="relative z-10 w-[85%] max-w-[450px] bg-[#0c0c0c]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl shadow-black/50 transform rotate-[-2deg] hover:rotate-0 transition-transform duration-700 ease-out">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Activity className="w-5 h-5 text-black" />
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm">Project Analytics</h4>
              <p className="text-gray-400 text-xs">Real-time mapping</p>
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-full px-3 py-1 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs text-gray-300">Live</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-black/40 border border-white/5 rounded-xl p-4">
            <BarChart3 className="w-5 h-5 text-gray-400 mb-2" />
            <p className="text-gray-500 text-xs mb-1">Total Nodes</p>
            <p className="text-white font-medium text-lg">1,204</p>
          </div>
          <div className="bg-black/40 border border-white/5 rounded-xl p-4">
            <Network className="w-5 h-5 text-gray-400 mb-2" />
            <p className="text-gray-500 text-xs mb-1">Connections</p>
            <p className="text-white font-medium text-lg">4,892</p>
          </div>
        </div>

        {/* Progress bars */}
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-xs mb-2">
              <span className="text-gray-400">Spec Completion</span>
              <span className="text-cyan-400">82%</span>
            </div>
            <div className="w-full bg-black/50 h-2 rounded-full overflow-hidden border border-white/5">
              <div className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 w-[82%] rounded-full relative">
                <div className="absolute top-0 right-0 bottom-0 w-8 bg-white/20 blur-sm"></div>
              </div>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs mb-2">
              <span className="text-gray-400">Security Checks</span>
              <span className="text-emerald-400">100%</span>
            </div>
            <div className="w-full bg-black/50 h-2 rounded-full overflow-hidden border border-white/5">
              <div className="h-full bg-emerald-500 w-[100%] rounded-full relative">
                <div className="absolute top-0 right-0 bottom-0 w-8 bg-white/20 blur-sm"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Elements (Background) */}
      <div className="absolute -right-8 bottom-12 w-32 h-32 bg-emerald-500/10 backdrop-blur-2xl border border-emerald-500/20 rounded-2xl shadow-xl transform rotate-12 flex items-center justify-center animate-pulse duration-1000">
         <Lock className="w-8 h-8 text-emerald-400/50" />
      </div>
      <div className="absolute -left-4 top-12 w-24 h-24 bg-cyan-500/10 backdrop-blur-2xl border border-cyan-500/20 rounded-2xl shadow-xl transform -rotate-12 flex items-center justify-center">
         <Wallet className="w-6 h-6 text-cyan-400/50" />
      </div>
    </div>
  );
}

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
    <div className="bg-[#080808]/90 backdrop-blur-xl border border-white/10 rounded-2xl font-mono p-6 max-w-[680px] mx-auto min-h-[220px] shadow-2xl shadow-black">
      {/* Terminal chrome */}
      <div className="flex gap-2 mb-6">
        {["#ff5f57", "#ffbd2e", "#28c841"].map((c) => (
          <div key={c} className="w-3 h-3 rounded-full" style={{ background: c }} />
        ))}
      </div>

      {TERMINAL_LINES.slice(0, visibleCount).map((line, i) => (
        <div
          key={i}
          className="flex items-start gap-4 mb-4 animate-in fade-in slide-in-from-bottom-2 duration-500"
        >
          <span
            className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${line.role === "ai" ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-gray-400"}`}
          />
          <span className="text-sm leading-relaxed">
            <span className={`font-semibold mr-2 ${line.role === "ai" ? "text-emerald-500" : "text-gray-400"}`}>
              {line.role === "ai" ? "AI:" : "You:"}
            </span>
            <span className={line.role === "ai" ? "text-gray-300" : "text-white"}>{line.text}</span>
          </span>
        </div>
      ))}

      {visibleCount < TERMINAL_LINES.length && (
        <div className="flex items-center gap-4">
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${visibleCount % 2 === 0 ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-gray-400"}`}
          />
          <span className="inline-block w-2 h-4 bg-emerald-500 animate-pulse ml-1" />
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
    <main className="min-h-screen bg-[#030303] text-gray-200 selection:bg-emerald-500/30 selection:text-white font-sans overflow-hidden">
      
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-900/10 blur-[120px] rounded-full mix-blend-screen"></div>
        <div className="absolute top-[20%] right-[-10%] w-[30%] h-[50%] bg-cyan-900/10 blur-[120px] rounded-full mix-blend-screen"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]"></div>
      </div>

      {/* ── Header ── */}
      <header className="fixed top-4 left-1/2 -translate-x-1/2 w-[95%] max-w-5xl h-14 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-full flex items-center justify-between px-6 z-50 shadow-xl shadow-black/20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-400 to-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Cpu size={16} className="text-black" />
          </div>
          <span className="font-bold text-sm tracking-tight text-white">OBX-STUDIO</span>
        </div>
        
        {/* Nav Links (Desktop) */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-400">
          <Link href="#" className="hover:text-white transition-colors">Features</Link>
          <Link href="#" className="hover:text-white transition-colors">Pricing</Link>
          <Link href="#" className="hover:text-white transition-colors">Testimonials</Link>
        </nav>

        <div className="flex items-center gap-4">
          <Link href="/auth/login" className="text-sm font-medium text-gray-400 hover:text-white transition-colors hidden sm:block">
            Sign in
          </Link>
          <Link href="/auth/login" className="h-9 px-5 rounded-full bg-white text-black text-sm font-medium flex items-center gap-2 hover:bg-gray-200 transition-colors">
            Get started
            <ArrowRight size={14} />
          </Link>
        </div>
      </header>

      <div className="relative z-10 pt-32 pb-24">
        {/* ── Hero ── */}
        <section className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center mb-32">
          <div className="text-left max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-gray-300 mb-6 backdrop-blur-md">
              <Sparkles size={14} className="text-emerald-400" />
              <span>Open Source & Bring Your Own Key</span>
            </div>
            <h1 className="text-5xl lg:text-7xl font-bold tracking-tighter text-white leading-[1.1] mb-6">
              Transform Your <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Wealth With AI</span>
            </h1>
            <p className="text-lg text-gray-400 leading-relaxed mb-8 max-w-lg">
              Generate agent-ready specs in minutes. OBX-STUDIO grills you with smart AI questions, maps your ideas, and outputs structured PRDs ready for modern AI coders.
            </p>
            
            <div className="flex flex-wrap items-center gap-4">
              <Link href="/auth/login" className="h-12 px-6 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-black text-base font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity shadow-lg shadow-emerald-500/20">
                Get Started For Free
                <ArrowRight size={18} />
              </Link>
              <Link href="#demo" className="h-12 px-6 rounded-full bg-white/5 border border-white/10 text-white text-base font-medium flex items-center gap-2 hover:bg-white/10 transition-colors backdrop-blur-md">
                See How It Works
              </Link>
            </div>
          </div>

          <div className="relative w-full">
            <DashboardMockup />
          </div>
        </section>

        {/* ── Features (Bento Grid) ── */}
        <section className="max-w-7xl mx-auto px-6 mb-32">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-1 h-6 bg-gradient-to-b from-emerald-400 to-cyan-400 rounded-full"></div>
            <h2 className="text-3xl font-bold text-white tracking-tight">Magic Features</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 auto-rows-[250px] gap-4">
            {FEATURES.map((feat, i) => {
              const Icon = feat.icon;
              return (
                <div key={i} className={`group relative bg-[#0a0a0a] border border-white/5 rounded-3xl p-8 overflow-hidden hover:border-white/20 transition-colors ${feat.size}`}>
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-emerald-500/10 transition-colors duration-500"></div>
                  
                  <div className="relative z-10 flex flex-col h-full">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 text-gray-300 group-hover:text-emerald-400 group-hover:scale-110 transition-all duration-300">
                      <Icon size={24} />
                    </div>
                    <div className="mt-auto">
                      <h3 className="text-xl font-bold text-white mb-2">{feat.title}</h3>
                      <p className="text-gray-400 text-sm leading-relaxed">{feat.desc}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Demo Terminal ── */}
        <section id="demo" className="max-w-4xl mx-auto px-6 mb-32 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent blur-3xl -z-10 rounded-full"></div>
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-white tracking-tight mb-4">Secure & Intelligent Check</h2>
            <p className="text-gray-400">Watch the AI extract requirements in real-time.</p>
          </div>
          <TerminalDemo />
        </section>

        {/* ── Testimonials ── */}
        <section className="max-w-7xl mx-auto px-6 mb-32">
          <div className="flex items-center gap-3 mb-10 justify-center">
            <h2 className="text-3xl font-bold text-white tracking-tight text-center">Trusted by Builders</h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-8 hover:border-white/10 transition-colors">
                <div className="text-emerald-400 mb-4 opacity-50">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h4v10h-10z" />
                  </svg>
                </div>
                <p className="text-gray-300 mb-6 leading-relaxed text-sm">
                  {t.quote}
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-gray-800 to-gray-700"></div>
                  <span className="text-gray-400 text-sm font-medium">{t.name}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Pricing ── */}
        <section className="max-w-5xl mx-auto px-6 mb-24">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white tracking-tight mb-4">Start free. Scale when ready.</h2>
            <p className="text-gray-400">Simple pricing for indie hackers and teams.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Free */}
            <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-10 hover:border-white/10 transition-colors">
              <span className="text-sm font-semibold text-emerald-400 tracking-wider uppercase mb-2 block">Free Forever</span>
              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-5xl font-bold text-white">$0</span>
                <span className="text-gray-500">/mo</span>
              </div>
              <ul className="space-y-4 mb-10">
                {FREE_FEATURES.map((f, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-300 text-sm">
                    <Check size={16} className="text-emerald-500" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/auth/login" className="block w-full text-center py-4 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-colors border border-white/10">
                Get Started Free
              </Link>
            </div>

            {/* Pro */}
            <div className="relative bg-gradient-to-b from-[#111] to-[#0a0a0a] border border-emerald-500/20 rounded-3xl p-10 shadow-2xl shadow-emerald-500/5">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full text-xs font-bold text-black uppercase tracking-wider">
                Coming Soon
              </div>
              <span className="text-sm font-semibold text-cyan-400 tracking-wider uppercase mb-2 block">Pro</span>
              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-5xl font-bold text-white">TBD</span>
              </div>
              <ul className="space-y-4 mb-10">
                {PRO_FEATURES.map((f, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-300 text-sm">
                    <Check size={16} className="text-cyan-500" />
                    {f}
                  </li>
                ))}
              </ul>
              <a href="mailto:hello@obx.studio" className="block w-full text-center py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-semibold hover:opacity-90 transition-opacity">
                Join Waitlist
              </a>
            </div>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="max-w-7xl mx-auto px-6 py-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <Cpu size={16} />
            <span>© 2026 OBX-STUDIO</span>
          </div>
          <div className="flex gap-6">
            <a href="https://github.com/SHADOW-MHMD/OBX-STUDIO" className="hover:text-gray-300 transition-colors">Open Source</a>
            <a href="https://status.obx.studio" className="hover:text-gray-300 transition-colors">Status</a>
            <Link href="/terms" className="hover:text-gray-300 transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-gray-300 transition-colors">Privacy</Link>
          </div>
        </footer>

      </div>
    </main>
  );
}
