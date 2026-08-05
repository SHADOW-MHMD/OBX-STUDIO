'use client';

export const runtime = 'edge';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Send, CheckCircle, FileText, Zap, MessageSquare, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import { api, type Message } from '@/lib/api';
import { parseSSEStream } from '@/lib/utils';
import { Navbar } from '@/components/layout/Navbar';
import { AudioRecorder } from '@/components/AudioRecorder';
import { NeuralCanvas, type Node2D, type Link2D } from '@/components/canvas/NeuralCanvas';
import { CanvasOverlay } from '@/components/canvas/CanvasOverlay';
import { SpecDocsModal } from '@/components/canvas/SpecDocsModal';
import { PhaseProgress, type InterviewPhase, PHASE_LIST } from '@/components/interview/PhaseProgress';
import { useSupabaseCanvas } from '@/hooks/useSupabaseCanvas';

// ─── Types ────────────────────────────────────────────────────────────────────

type QuestionType = 'assumption_check' | 'feasibility' | 'market' | 'technical' | 'clarification';

interface ParsedAssistantMessage {
  statement?: string | null;
  question?: string;
  question_type?: QuestionType;
  phase?: InterviewPhase;
  options?: string[];
  done?: boolean;
  summary?: string;
  canvas_updates?: Array<any>;
  raw: string;
}

interface ChatMessage {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  parsed?: ParsedAssistantMessage;
  streaming?: boolean;
  isPlainText?: boolean; // non-JSON fallback
}

// ─── Constants ────────────────────────────────────────────────────────────────

const QUESTION_TYPE_META: Record<QuestionType, { label: string; color: string; emoji: string }> = {
  assumption_check: { label: 'Assumption', color: '#f87171', emoji: '🔴' },
  feasibility:      { label: 'Feasibility', color: '#fb923c', emoji: '🟠' },
  market:           { label: 'Market',      color: '#fbbf24', emoji: '🟡' },
  technical:        { label: 'Technical',   color: '#60a5fa', emoji: '🔵' },
  clarification:    { label: 'Clarify',     color: '#a78bfa', emoji: '🟣' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function tryParseJSON(raw: string): ParsedAssistantMessage | null {
  // Strip markdown code fences if model wraps its JSON
  const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  try {
    const parsed = JSON.parse(cleaned);
    if (typeof parsed === 'object' && parsed !== null) return { ...parsed, raw };
  } catch {}
  return null;
}

function toChat(messages: Message[]): ChatMessage[] {
  return messages
    .filter((m) => m.role !== 'system')
    .map((m) => {
      if (m.role === 'assistant') {
        const parsed = tryParseJSON(m.content);
        return {
          id: m.id,
          role: 'assistant' as const,
          content: m.content,
          parsed: parsed ?? undefined,
          isPlainText: !parsed,
        };
      }
      return { id: m.id, role: 'user' as const, content: m.content };
    });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

// Typing indicator dots
function ThinkingDots() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              width: 5,
              height: 5,
              borderRadius: '50%',
              background: '#22d3ee',
              display: 'inline-block',
              animation: `thinkBounce 1.2s ease ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>
      <span style={{ fontSize: '0.7rem', color: '#555', fontStyle: 'italic' }}>AI is thinking…</span>
      <style>{`
        @keyframes thinkBounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// Statement bubble (conversational, grey)
function StatementBubble({ text }: { text: string }) {
  // Render **bold** markdown
  const rendered = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '14px 14px 4px 14px',
        padding: '0.625rem 0.875rem',
        marginBottom: '0.5rem',
        fontSize: '0.875rem',
        color: '#aaa',
        lineHeight: 1.6,
        maxWidth: '92%',
      }}
      dangerouslySetInnerHTML={{ __html: rendered }}
    />
  );
}

// Question card (structured, colored border + badge)
function QuestionCard({
  msg,
  inputValue,
  onOptionClick,
  isLast,
  onSkip,
  onReask,
  onRegenerate,
}: {
  msg: ChatMessage;
  inputValue: string;
  onOptionClick: (opt: string) => void;
  isLast?: boolean;
  onSkip?: () => void;
  onReask?: () => void;
  onRegenerate?: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const p = msg.parsed;
  const question = p?.question ?? '';
  const options = p?.options ?? [];
  const qType = p?.question_type;
  const qMeta = qType ? QUESTION_TYPE_META[qType] : null;
  const isStreaming = msg.streaming;

  const selectedParts = inputValue.split(',').map((s) => s.trim()).filter(Boolean);

  if (!question && isStreaming) {
    return (
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ height: 2, width: 3, background: '#22d3ee', borderRadius: 1, animation: 'cursorBlink 1s step-start infinite' }} />
        <style>{`@keyframes cursorBlink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }`}</style>
      </div>
    );
  }

  return (
    <div
      style={{
        marginBottom: '1.5rem',
        background: 'rgba(34,211,238,0.03)',
        border: '1px solid rgba(34,211,238,0.15)',
        borderLeft: '3px solid rgba(34,211,238,0.6)',
        borderRadius: '4px 12px 12px 4px',
        padding: '0.75rem 0.875rem',
        position: 'relative',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Question type badge */}
      {qMeta && (
        <div
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            padding: '2px 7px',
            background: `${qMeta.color}18`,
            border: `1px solid ${qMeta.color}44`,
            borderRadius: 999,
            fontSize: '0.6rem',
            color: qMeta.color,
            fontWeight: 600,
            letterSpacing: '0.04em',
          }}
        >
          {qMeta.emoji} {qMeta.label}
        </div>
      )}

      {/* Question text */}
      <p
        style={{
          fontSize: '0.9rem',
          fontWeight: 600,
          color: '#fff',
          lineHeight: 1.55,
          marginBottom: options.length > 0 ? '0.75rem' : 0,
          paddingRight: qMeta ? '5rem' : 0,
        }}
        className={isStreaming ? 'cursor-blink' : undefined}
      >
        {question}
      </p>

      {/* Option pills */}
      {options.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
          {options.map((opt, i) => {
            const isSelected = selectedParts.includes(opt);
            return (
              <button
                key={i}
                onClick={() => onOptionClick(opt)}
                style={{
                  background: isSelected ? 'rgba(34, 211, 238, 0.15)' : 'transparent',
                  border: isSelected ? '1px solid rgba(34, 211, 238, 0.5)' : '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 6,
                  padding: '4px 10px',
                  fontSize: '0.75rem',
                  color: isSelected ? '#22d3ee' : '#888',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    (e.currentTarget).style.borderColor = 'rgba(34, 211, 238, 0.3)';
                    (e.currentTarget).style.color = '#ccc';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    (e.currentTarget).style.borderColor = 'rgba(255,255,255,0.1)';
                    (e.currentTarget).style.color = '#888';
                  }
                }}
              >
                {opt}
              </button>
            );
          })}
        </div>
      )}

      {/* Action buttons on hover */}
      {isLast && !isStreaming && (
        <div
          style={{
            display: 'flex',
            gap: '0.3rem',
            marginTop: '0.625rem',
            opacity: hovered ? 1 : 0,
            transition: 'opacity 0.15s',
          }}
        >
          {[
            { label: 'Skip →', handler: onSkip },
            { label: '↺ Re-ask', handler: onReask },
            { label: '⟳ Regenerate', handler: onRegenerate },
          ].map(({ label, handler }) => (
            <button
              key={label}
              onClick={handler}
              style={{
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#444',
                borderRadius: 6,
                padding: '0.15rem 0.5rem',
                fontSize: '0.65rem',
                cursor: 'pointer',
                transition: 'color 0.15s, border-color 0.15s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget).style.color = '#aaa';
                (e.currentTarget).style.borderColor = 'rgba(255,255,255,0.2)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget).style.color = '#444';
                (e.currentTarget).style.borderColor = 'rgba(255,255,255,0.08)';
              }}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Full assistant message — composes statement + question card or plain text fallback
function AssistantMessage({
  msg,
  inputValue,
  onOptionClick,
  isLast,
  onSkip,
  onReask,
  onRegenerate,
}: {
  msg: ChatMessage;
  inputValue: string;
  onOptionClick: (opt: string) => void;
  isLast?: boolean;
  onSkip?: () => void;
  onReask?: () => void;
  onRegenerate?: () => void;
}) {
  const p = msg.parsed;

  // Non-JSON fallback: render as plain conversational statement
  if (msg.isPlainText || (!p?.question && !msg.streaming)) {
    const displayText = p?.statement ?? msg.content;
    if (!displayText) return null;
    return (
      <div style={{ marginBottom: '1.5rem' }} className="animate-fadein">
        <StatementBubble text={displayText} />
      </div>
    );
  }

  // Streaming but no parsed JSON yet
  if (msg.streaming && !p?.statement && !p?.question) {
    return (
      <div style={{ marginBottom: '1.5rem' }}>
        <ThinkingDots />
      </div>
    );
  }

  return (
    <div style={{ marginBottom: '1.5rem' }} className="animate-fadein">
      {/* Statement bubble */}
      {p?.statement && <StatementBubble text={p.statement} />}

      {/* Question card */}
      {(p?.question || msg.streaming) && (
        <QuestionCard
          msg={msg}
          inputValue={inputValue}
          onOptionClick={onOptionClick}
          isLast={isLast}
          onSkip={onSkip}
          onReask={onReask}
          onRegenerate={onRegenerate}
        />
      )}
    </div>
  );
}

// User message bubble
function UserBubble({ msg }: { msg: ChatMessage }) {
  // Strip special tokens from display
  const displayContent = msg.content
    .replace(/\[SKIP\]|\[REASK\]|\[REGENERATE\]/g, '')
    .replace(/\[Focus:[^\]]+\]/g, '')
    .trim();
  if (!displayContent) return null;
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.25rem' }} className="animate-fadein">
      <p style={{
        fontSize: '0.875rem',
        color: '#bbb',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '14px 14px 4px 14px',
        padding: '0.625rem 0.875rem',
        maxWidth: '85%',
        lineHeight: 1.5,
      }}>
        {displayContent}
      </p>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function InterviewPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const { user, isLoading: authLoading } = useAuthStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isDone, setIsDone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [sending, setSending] = useState(false);
  const [isThinking, setIsThinking] = useState(false); // pre-stream thinking indicator
  const [focusedNode, setFocusedNode] = useState<Node2D | null>(null);
  const [showSpecModal, setShowSpecModal] = useState(false);
  const [mode, setMode] = useState<'deep' | 'quick'>('deep');

  // Derive current phase from messages
  const currentPhase = useMemo<InterviewPhase>(() => {
    const allAssistant = messages.filter((m) => m.role === 'assistant' && m.parsed?.phase);
    if (allAssistant.length === 0) return 'problem';
    const last = allAssistant[allAssistant.length - 1];
    return (last.parsed?.phase as InterviewPhase) ?? 'problem';
  }, [messages]);

  const initialNodes: Node2D[] = [{ id: 'idea', name: 'Your Idea', category: 'idea' }];
  const { nodes, links, updateGraph } = useSupabaseCanvas(id as string, initialNodes, []);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const userMessageCount = useMemo(
    () => messages.filter((m) => m.role === 'user').length,
    [messages]
  );

  useEffect(() => {
    if (authLoading) return;
    if (!user) router.push('/auth/login');
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!id || authLoading || !user) return;
    async function load() {
      try {
        const data = await api.interview.get(id);
        setMessages(toChat(data.messages));
        if (data.interview.status === 'completed') setIsDone(true);
      } catch (err: unknown) {
        setError((err as Error).message ?? 'Failed to load interview.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, authLoading, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = useCallback(async (forcedContent?: string) => {
    let content = forcedContent || inputValue.trim();
    if (!content || sending || isDone) return;

    if (focusedNode) {
      content = `[Focus: ${focusedNode.name}] ${content}`;
      setFocusedNode(null);
    }

    const userMsg: ChatMessage = { id: `user-${Date.now()}`, role: 'user', content };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setSending(true);
    setIsThinking(true);

    const streamId = `assistant-${Date.now()}`;

    try {
      const response = await api.interview.sendMessage(
        id as string,
        content,
        { nodes, edges: links },
        mode
      );
      if (!response.ok) throw new Error('Failed to send message');

      // Start streaming — hide thinking dots
      setIsThinking(false);
      const streamMsg: ChatMessage = { id: streamId, role: 'assistant', content: '', streaming: true };
      setMessages((prev) => [...prev, streamMsg]);

      let accumulated = '';
      await parseSSEStream(
        response,
        (chunk) => {
          accumulated += chunk;
          const parsed = tryParseJSON(accumulated);
          setMessages((prev) =>
            prev.map((m) =>
              m.id === streamId
                ? { ...m, content: accumulated, parsed: parsed ?? undefined, streaming: true }
                : m
            )
          );
        },
        (fullText) => {
          const parsed = tryParseJSON(fullText);
          const isPlainText = !parsed;
          const finalMsg: ChatMessage = {
            id: streamId,
            role: 'assistant',
            content: fullText,
            parsed: parsed ?? undefined,
            streaming: false,
            isPlainText,
          };
          setMessages((prev) => prev.map((m) => (m.id === streamId ? finalMsg : m)));

          if (parsed?.done) setIsDone(true);

          if (parsed?.canvas_updates && Array.isArray(parsed.canvas_updates)) {
            let newNodes = [...nodes];
            let newLinks = [...links];

            parsed.canvas_updates.forEach((update: any) => {
              if (update.action === 'add_node' && update.node) {
                const n = update.node;
                const nodeId = n.id;
                if (nodeId && !newNodes.some((ex) => ex.id === nodeId)) {
                  newNodes.push({
                    id: nodeId,
                    name: n.name || n.label || n.data?.label || nodeId,
                    category: n.category ?? (n.type === 'persona' ? 'persona' : n.type === 'task' ? 'feature' : 'default'),
                  });
                  // Auto-create edge from parent_id (no separate add_edge needed)
                  const parentId = n.parent_id;
                  if (parentId && newNodes.some((ex) => ex.id === parentId)) {
                    const edgeExists = newLinks.some(
                      (l) =>
                        (l.source === parentId || (l.source as any)?.id === parentId) &&
                        (l.target === nodeId || (l.target as any)?.id === nodeId)
                    );
                    if (!edgeExists) newLinks.push({ source: parentId, target: nodeId });
                  } else {
                    // Fallback: if no parent_id given, connect to 'idea' root to prevent isolated floating nodes
                    const rootExists = newLinks.some(
                      (l) =>
                        (l.source === 'idea' || (l.source as any)?.id === 'idea') &&
                        (l.target === nodeId || (l.target as any)?.id === nodeId)
                    );
                    if (!rootExists && nodeId !== 'idea' && newNodes.some(n => n.id === 'idea')) {
                       newLinks.push({ source: 'idea', target: nodeId });
                    }
                  }
                }
              } else if (update.action === 'add_edge') {
                // AI emits: { action: 'add_edge', source: 'a', target: 'b', label: '...' }
                const sid = update.source ?? update.edge?.source;
                const tid = update.target ?? update.edge?.target;
                if (!sid || !tid) return;
                
                // Only create edge if BOTH nodes actually exist in the graph (prevents D3 crash)
                const sourceExists = newNodes.some((n) => n.id === sid);
                const targetExists = newNodes.some((n) => n.id === tid);
                if (!sourceExists || !targetExists) return;

                const exists = newLinks.some(
                  (l) =>
                    (l.source === sid || (l.source as any)?.id === sid) &&
                    (l.target === tid || (l.target as any)?.id === tid)
                );
                if (!exists) newLinks.push({ source: sid, target: tid, label: update.label ?? update.edge?.label });
              } else if (update.action === 'delete_node' && update.node_id) {
                const delId = update.node_id;
                if (delId !== 'idea') { // never delete root
                  newNodes = newNodes.filter((n) => n.id !== delId);
                  newLinks = newLinks.filter(
                    (l) =>
                      (l.source !== delId && (l.source as any)?.id !== delId) &&
                      (l.target !== delId && (l.target as any)?.id !== delId)
                  );
                }
              } else if (update.action === 'delete_edge' && update.source && update.target) {
                newLinks = newLinks.filter(
                  (l) =>
                    !(
                      (l.source === update.source || (l.source as any)?.id === update.source) &&
                      (l.target === update.target || (l.target as any)?.id === update.target)
                    )
                );
              } else if (update.action === 'update_node' && update.node) {
                const updatedNode = update.node;
                const nodeIndex = newNodes.findIndex((n) => n.id === updatedNode.id);
                if (nodeIndex !== -1) {
                  newNodes[nodeIndex] = {
                    ...newNodes[nodeIndex],
                    name: updatedNode.new_label || updatedNode.name || newNodes[nodeIndex].name,
                    category: updatedNode.new_category || updatedNode.category || newNodes[nodeIndex].category,
                    description: updatedNode.description || newNodes[nodeIndex].description
                  };
                }
              }
            });
            updateGraph(newNodes, newLinks);
          }
        }
      );
    } catch (err: unknown) {
      setIsThinking(false);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === streamId
            ? { ...m, content: '⚠️ ' + (err as Error).message, streaming: false, isPlainText: true }
            : m
        )
      );
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }, [inputValue, sending, isDone, id, nodes, links, focusedNode, mode, updateGraph]);

  const handleNodeDelete = useCallback((node: Node2D) => {
    const nodeId = node.id;
    if (nodeId === 'idea') return;
    const newNodes = nodes.filter(n => n.id !== nodeId);
    const newLinks = links.filter(l => 
      (l.source !== nodeId && (l.source as any)?.id !== nodeId) && 
      (l.target !== nodeId && (l.target as any)?.id !== nodeId)
    );
    // Immediately persist to DB
    updateGraph(newNodes, newLinks);
  }, [nodes, links, updateGraph]);

  const handleNodeUpdate = useCallback((nodeId: string, updates: Partial<Node2D>) => {
    const newNodes = nodes.map(n => n.id === nodeId ? { ...n, ...updates } : n);
    // Persist
    updateGraph(newNodes, links);
  }, [nodes, links, updateGraph]);

  const handleOptionClick = useCallback((opt: string) => {
    setInputValue((prev) => {
      const parts = prev.split(',').map((s) => s.trim()).filter(Boolean);
      if (parts.includes(opt)) return parts.filter((p) => p !== opt).join(', ');
      return [...parts, opt].join(', ');
    });
    inputRef.current?.focus();
  }, []);

  const handleSpecGenerate = useCallback(() => {
    setShowSpecModal(false);
    router.push(`/output/${id}`);
  }, [id, router]);

  // ─── Loading / error states ──────────────────────────────────────────────────

  if (authLoading || loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#000' }}>
        <Navbar />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 56px)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: 300 }}>
            {[...Array(3)].map((_, i) => (
              <div key={i} style={{
                height: 48,
                background: 'linear-gradient(90deg, #0d0d0d 25%, #141414 50%, #0d0d0d 75%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.5s infinite',
                borderRadius: 10,
                width: i % 2 === 0 ? '80%' : '55%',
                alignSelf: i % 2 === 0 ? 'flex-start' : 'flex-end',
              }} />
            ))}
            <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', background: '#000' }}>
        <Navbar />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 56px)', gap: '1rem' }}>
          <p style={{ color: '#f87171', fontSize: '0.9rem' }}>{error}</p>
          <Link href="/" style={{ color: '#888', fontSize: '0.85rem' }}>← Back Home</Link>
        </div>
      </div>
    );
  }

  // ─── Main layout ─────────────────────────────────────────────────────────────

  return (
    <div style={{ height: '100vh', background: '#000', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Navbar />

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', paddingTop: 56 }}>

        {/* ── Canvas pane 65% ── */}
        <div style={{ flex: '0 0 65%', position: 'relative', background: '#050505', overflow: 'hidden' }}>
          <NeuralCanvas
            nodes={nodes}
            links={links}
            onNodeClick={(n) => {
              setFocusedNode(n);
              inputRef.current?.focus();
            }}
            onNodeDelete={handleNodeDelete}
            onNodeUpdate={handleNodeUpdate}
          />
          <CanvasOverlay nodeCount={nodes.length} linkCount={links.length} />
        </div>

        {/* ── Divider ── */}
        <div style={{ width: 1, background: 'rgba(255,255,255,0.05)', flexShrink: 0 }} />

        {/* ── AI Panel 35% ── */}
        <div style={{ flex: '0 0 35%', display: 'flex', flexDirection: 'column', background: '#080808', overflow: 'hidden' }}>

          {/* Header */}
          <div style={{
            padding: '0.875rem 1.25rem',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22d3ee', boxShadow: '0 0 8px #22d3ee', display: 'inline-block' }} />
              <h3 style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 600 }}>AI Co-pilot</h3>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {/* Mode toggle */}
              <button
                onClick={() => setMode((m) => m === 'deep' ? 'quick' : 'deep')}
                title={mode === 'deep' ? 'Switch to Quick mode (questions only)' : 'Switch to Deep mode (context + questions)'}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  padding: '0.25rem 0.625rem',
                  background: mode === 'deep' ? 'rgba(34,211,238,0.08)' : 'rgba(251,191,36,0.08)',
                  border: `1px solid ${mode === 'deep' ? 'rgba(34,211,238,0.2)' : 'rgba(251,191,36,0.2)'}`,
                  borderRadius: 8,
                  color: mode === 'deep' ? '#22d3ee' : '#fbbf24',
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {mode === 'deep' ? <><MessageSquare size={10} /> Deep</> : <><Zap size={10} /> Quick</>}
              </button>

              {/* Generate Spec Docs */}
              <button
                onClick={() => setShowSpecModal(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.3rem 0.75rem',
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8,
                  color: '#777',
                  fontSize: '0.72rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'border-color 0.15s, color 0.15s',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget).style.borderColor = 'rgba(34,211,238,0.4)';
                  (e.currentTarget).style.color = '#22d3ee';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget).style.borderColor = 'rgba(255,255,255,0.1)';
                  (e.currentTarget).style.color = '#777';
                }}
              >
                <FileText size={11} />
                Spec Docs
              </button>
            </div>
          </div>

          {/* Phase progress stepper */}
          <PhaseProgress currentPhase={currentPhase} isDone={isDone} />

          {/* Messages */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '1rem 1.25rem 0.5rem',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {messages.map((m, idx) => {
              const isLastAssistant =
                m.role === 'assistant' &&
                messages.slice(idx + 1).every((x) => x.role !== 'assistant');

              return m.role === 'assistant' ? (
                <AssistantMessage
                  key={m.id}
                  msg={m}
                  inputValue={inputValue}
                  onOptionClick={handleOptionClick}
                  isLast={isLastAssistant}
                  onSkip={() => handleSend('[SKIP]')}
                  onReask={() => handleSend('[REASK]')}
                  onRegenerate={() => handleSend('[REGENERATE]')}
                />
              ) : (
                <UserBubble key={m.id} msg={m} />
              );
            })}

            {/* Pre-stream thinking indicator */}
            {isThinking && <ThinkingDots />}

            {/* Done state */}
            {isDone && (
              <div style={{ textAlign: 'center', padding: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.04)', marginTop: '1rem' }}>
                <CheckCircle size={32} color="#4ade80" style={{ margin: '0 auto 0.75rem' }} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff', marginBottom: '0.375rem' }}>Interview Complete!</h3>
                <p style={{ fontSize: '0.8rem', color: '#555', marginBottom: '1rem' }}>Your Neural Canvas is fully mapped.</p>
                <button
                  onClick={() => setShowSpecModal(true)}
                  style={{
                    padding: '0.5rem 1.25rem',
                    background: 'linear-gradient(135deg, rgba(34,211,238,0.2), rgba(74,222,128,0.2))',
                    border: '1px solid rgba(34,211,238,0.4)',
                    borderRadius: 10,
                    color: '#22d3ee',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Generate Spec Docs →
                </button>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid rgba(255,255,255,0.04)', flexShrink: 0 }}>
            {/* Focused node chip */}
            {focusedNode && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: 'rgba(34, 211, 238, 0.08)',
                border: '1px solid rgba(34, 211, 238, 0.2)',
                borderRadius: 999,
                padding: '0.2rem 0.625rem',
                marginBottom: '0.5rem',
                width: 'fit-content',
                fontSize: '0.72rem',
                color: '#22d3ee',
              }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#22d3ee', boxShadow: '0 0 4px #22d3ee', display: 'inline-block' }} />
                <span>Asking about: <strong>{focusedNode.name}</strong></span>
                <button onClick={() => setFocusedNode(null)} style={{ background: 'transparent', border: 'none', color: '#22d3ee', cursor: 'pointer', padding: 0, lineHeight: 1, fontSize: '1rem' }}>×</button>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem' }}>
              <AudioRecorder onTranscription={(text) => handleSend(text)} />
              <div style={{ flex: 1, position: 'relative' }}>
                <textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder={isDone ? 'Interview complete' : sending ? 'AI is responding…' : 'Answer or ask anything…'}
                  disabled={sending || isDone}
                  rows={1}
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 14,
                    padding: '0.625rem 2.5rem 0.625rem 0.875rem',
                    color: '#fff',
                    fontSize: '0.875rem',
                    resize: 'none',
                    outline: 'none',
                    fontFamily: 'inherit',
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(34,211,238,0.25)'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
                />
                <button
                  onClick={() => handleSend()}
                  disabled={!inputValue.trim() || sending || isDone}
                  style={{
                    position: 'absolute',
                    right: 6,
                    bottom: 6,
                    width: 30,
                    height: 30,
                    borderRadius: '50%',
                    background: inputValue.trim() && !sending ? '#22d3ee' : 'rgba(255,255,255,0.06)',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: inputValue.trim() && !sending && !isDone ? 'pointer' : 'not-allowed',
                    transition: 'background 0.15s',
                  }}
                >
                  <Send size={12} color={inputValue.trim() && !sending ? '#000' : '#555'} />
                </button>
              </div>
            </div>

            <p style={{ fontSize: '0.62rem', color: '#2a2a2a', marginTop: '0.35rem', textAlign: 'right' }}>
              Enter to send · Shift+Enter for newline · {mode === 'deep' ? '💬 Deep mode' : '⚡ Quick mode'}
            </p>
          </div>
        </div>
      </div>

      {/* Spec Docs Modal */}
      {showSpecModal && (
        <SpecDocsModal
          messageCount={userMessageCount}
          nodeCount={nodes.length}
          onGenerate={handleSpecGenerate}
          onCancel={() => setShowSpecModal(false)}
        />
      )}
    </div>
  );
}
