"use client";

export const runtime = 'edge';

import { useEffect, useState, use } from "react";
import { useToast } from "@/hooks/useToast";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { downloadMarkdown, downloadPDF } from "@/lib/utils";
import { api, type Output, type OutputType } from "@/lib/api";
import { Navbar } from "@/components/layout/Navbar";
import {
  FileText,
  List,
  Map,
  Code,
  Star,
  Copy,
  Download,
  ExternalLink,
  Loader2,
  Check,
  Kanban,
  Cpu
} from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/lib/store";

const FORMATS = [
  {
    type: "prd" as OutputType,
    title: "PRD",
    desc: "Full Product Requirements Document with user stories and features.",
    icon: FileText,
  },
  {
    type: "summary" as OutputType,
    title: "Summary",
    desc: "Concise bullet points covering what it does and who it's for.",
    icon: List,
  },
  {
    type: "roadmap" as OutputType,
    title: "Roadmap",
    desc: "Phased plan from MVP to v2.0 with key milestones.",
    icon: Map,
  },
  {
    type: "techstack" as OutputType,
    title: "Tech Stack",
    desc: "Recommended architecture, database schema, and deployment plan.",
    icon: Code,
  },
  {
    type: "all" as OutputType,
    title: "All of the above",
    desc: "The ultimate specification combining every output type.",
    icon: Star,
  },
];

export default function OutputPage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params);
  const { user, isLoading } = useAuthStore();
  const router = useRouter();
  const [outputs, setOutputs] = useState<Output[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<OutputType | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedForNotion, setCopiedForNotion] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [addingFormat, setAddingFormat] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsMobile(window.innerWidth < 1024);
      const handleResize = () => setIsMobile(window.innerWidth < 1024);
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, []);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/auth/login");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user) {
      api.output.list(params.id).then((data) => {
        setOutputs(data);
        if (data.length > 0) {
          setActiveTab(data[0].id);
        }
        setLoading(false);
      }).catch((e) => {
        console.error(e);
        setLoading(false);
      });
    }
  }, [params.id, user]);

  const handleGenerate = async (type: OutputType) => {
    setGenerating(type);
    try {
      const res = await api.output.generate(params.id, type);
      const newOutput: Output = {
        id: res.id,
        interview_id: params.id,
        type,
        content: res.content,
        created_at: new Date().toISOString()
      };
      setOutputs(prev => [...prev, newOutput]);
      setActiveTab(newOutput.id);
    } catch (e: any) {
      console.error(e);
      alert(`Failed to generate output: ${e.message ?? "Unknown error"}`);
    } finally {
      setGenerating(null);
    }
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyForNotion = () => {
    // Strip HTML-incompatible markdown, clean up for Notion paste
    const notionText = activeOutput?.content
      .replace(/^(#{1,6}) /gm, (_, h) => '#'.repeat(h.length) + ' ') // keep headings
      .replace(/\*\*(.+?)\*\*/g, '**$1**') // bold ok
      .replace(/`{3}[\w]*\n([\s\S]*?)`{3}/g, '```\n$1```') // code blocks ok
      ?? '';
    navigator.clipboard.writeText(notionText);
    setCopiedForNotion(true);
    setTimeout(() => setCopiedForNotion(false), 2000);
    toast('Copied for Notion!', 'success');
  };

  if (isMobile) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem", textAlign: "center", gap: "1.5rem", background: "#000" }}>
        <div style={{ width: 56, height: 56, borderRadius: 14, background: "#111", border: "1px solid #222", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Cpu size={24} color="#fff" />
        </div>
        <div>
          <h1 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.5rem", color: "#fff" }}>OBX-STUDIO</h1>
          <p style={{ color: "#888", fontSize: "0.9rem", maxWidth: 280, lineHeight: 1.6 }}>
            Idea locked in! 🚀 Open this on desktop to view your output and Kanban board.
          </p>
        </div>
      </div>
    );
  }

  if (loading || isLoading) {
    return (
      <div style={{ minHeight: "100vh", background: "#000", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader2 className="animate-spin text-white" />
      </div>
    );
  }

  const activeOutput = outputs.find(o => o.id === activeTab);

  return (
    <div style={{ minHeight: "100vh", background: "#000" }}>
      <Navbar />
      <main style={{ paddingTop: 88, paddingBottom: "4rem", maxWidth: 1000, margin: "0 auto", padding: "88px 1.5rem 4rem" }}>
        {outputs.length === 0 ? (
          <div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "2rem" }}>Choose your output format</h1>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.5rem" }}>
              {FORMATS.map((f) => (
                <div key={f.type} className="card" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <div style={{ padding: "0.5rem", background: "#1a1a1a", borderRadius: 8 }}>
                      <f.icon size={20} color="#fff" />
                    </div>
                    <h3 style={{ fontSize: "1.1rem", fontWeight: 600 }}>{f.title}</h3>
                  </div>
                  <p style={{ color: "#888", fontSize: "0.9rem", flex: 1 }}>{f.desc}</p>
                  <button
                    onClick={() => handleGenerate(f.type)}
                    disabled={generating !== null}
                    className="btn btn-primary"
                    style={{ width: "100%" }}
                  >
                    {generating === f.type ? (
                      <><Loader2 size={16} className="animate-spin" /> Generating...</>
                    ) : (
                      "Generate"
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                {outputs.map(o => (
                  <button
                    key={o.id}
                    onClick={() => setActiveTab(o.id)}
                    className={activeTab === o.id ? "btn btn-primary" : "btn btn-secondary"}
                  >
                    {FORMATS.find(f => f.type === o.type)?.title || o.type.toUpperCase()}
                  </button>
                ))}
                {outputs.length < 5 && (
                  <button
                    onClick={() => setAddingFormat(true)}
                    className="btn btn-ghost"
                  >
                    + Add Format
                  </button>
                )}
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <Link href="/dashboard" className="btn btn-ghost">
                  Back to Dashboard
                </Link>
                <Link href={`/kanban/${params.id}`} className="btn btn-secondary" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Kanban size={16} /> Open Kanban
                </Link>
              </div>
            </div>

            {addingFormat && (
              <div style={{ marginTop: '1rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#fff', margin: 0 }}>Add another format</h3>
                  <button onClick={() => setAddingFormat(false)} className="btn btn-ghost" style={{ fontSize: '0.8rem' }}>✕ Cancel</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
                  {FORMATS.filter(f => !outputs.some(o => o.type === f.type)).map((f) => (
                    <div key={f.type} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ padding: '0.375rem', background: '#1a1a1a', borderRadius: 6 }}>
                          <f.icon size={16} color="#fff" />
                        </div>
                        <h3 style={{ fontSize: '0.95rem', fontWeight: 600 }}>{f.title}</h3>
                      </div>
                      <p style={{ color: '#888', fontSize: '0.8rem', flex: 1 }}>{f.desc}</p>
                      <button
                        onClick={() => { handleGenerate(f.type); setAddingFormat(false); }}
                        disabled={generating !== null}
                        className="btn btn-primary"
                        style={{ width: '100%', fontSize: '0.85rem' }}
                      >
                        {generating === f.type ? (
                          <><Loader2 size={14} className="animate-spin" /> Generating...</>
                        ) : 'Generate'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeOutput && (
              <div className="card" style={{ padding: "2rem" }}>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginBottom: "2rem" }}>
                  <button onClick={() => handleCopy(activeOutput.content)} className="btn btn-secondary">
                    {copied ? <Check size={16} /> : <Copy size={16} />} Copy
                  </button>
                  <button onClick={copyForNotion} className="btn btn-secondary">
                    {copiedForNotion ? <Check size={16} /> : <Copy size={16} />} Copy for Notion
                  </button>
                  <button onClick={() => downloadMarkdown(activeOutput.content, `spec-${activeOutput.type}`)} className="btn btn-secondary">
                    <Download size={16} /> .md
                  </button>
                  <button onClick={() => downloadPDF(activeOutput.content, `spec-${activeOutput.type}`)} className="btn btn-secondary">
                    <Download size={16} /> .pdf
                  </button>
                </div>
                <div className="prose">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {activeOutput.content}
                  </ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
