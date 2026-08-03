'use client';

export const runtime = 'edge';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Send, CheckCircle, FileText, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import { api, type Message } from '@/lib/api';
import { parseSSEStream } from '@/lib/utils';
import { Navbar } from '@/components/layout/Navbar';
import { AudioRecorder } from '@/components/AudioRecorder';
import { NeuralCanvas, type Node2D, type Link2D } from '@/components/canvas/NeuralCanvas';
import { CanvasOverlay } from '@/components/canvas/CanvasOverlay';
import { SpecDocsModal } from '@/components/canvas/SpecDocsModal';
import { useSupabaseCanvas } from '@/hooks/useSupabaseCanvas';
import { useRouter as useAppRouter } from 'next/navigation';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ParsedAssistantMessage {
  question?: string;
  options?: string[];
  context?: string;
  done?: boolean;
  summary?: string;
  canvas_updates?: Array<{
    action: 'add_node' | 'add_edge' | 'update_node';
    node?: any;
    edge?: any;
  }>;
  raw: string;
}

interface ChatMessage {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  parsed?: ParsedAssistantMessage;
  streaming?: boolean;
}

function parseInterviewResponseSafely(raw: string): ParsedAssistantMessage | null {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function toChat(messages: Message[]): ChatMessage[] {
  return messages
    .filter((m) => m.role !== 'system')
    .map((m) => {
      if (m.role === 'assistant') {
        const parsed = parseInterviewResponseSafely(m.content);
        return {
          id: m.id,
          role: 'assistant' as const,
          content: m.content,
          parsed: parsed ? { ...parsed, raw: m.content } : undefined,
        };
      }
      return { id: m.id, role: 'user' as const, content: m.content };
    });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function AssistantBubble({
  msg,
  inputValue,
  onOptionClick,
  isLast,
  onSkip,
  onReask,
}: {
  msg: ChatMessage;
  inputValue: string;
  onOptionClick: (opt: string) => void;
  isLast?: boolean;
  onSkip?: () => void;
  onReask?: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const p = msg.parsed;
  const isRawJsonStream = msg.streaming && (msg.content.trim().startsWith('{') || msg.content.trim().startsWith('```'));
  const question = p?.question ?? (isRawJsonStream ? '' : msg.content);
  const options = p?.options ?? [];
  const isStreaming = msg.streaming;

  const selectedParts = inputValue.split(',').map((s) => s.trim()).filter(Boolean);

  if (isStreaming && !question) {
    return (
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.05rem', fontWeight: 500, color: '#fff', lineHeight: 1.5 }}>
          <span className="cursor-blink">|</span>
        </h2>
      </div>
    );
  }

  return (
    <div
      style={{ marginBottom: '2rem' }}
      className="animate-fadein"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Left accent border on AI messages */}
      <div style={{ display: 'flex', gap: '0.625rem' }}>
        <div style={{ width: 2, flexShrink: 0, borderRadius: 2, background: 'linear-gradient(180deg, #22d3ee, #c084fc)', opacity: 0.6, alignSelf: 'stretch' }} />
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: '1rem', fontWeight: 500, color: '#fff', lineHeight: 1.6, marginBottom: options.length > 0 ? '0.875rem' : 0 }} className={isStreaming ? 'cursor-blink' : undefined}>
            {question}
          </p>

          {options.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {options.map((opt, i) => {
                const isSelected = selectedParts.includes(opt);
                return (
                  <button
                    key={i}
                    onClick={() => onOptionClick(opt)}
                    style={{
                      background: isSelected ? 'rgba(34, 211, 238, 0.15)' : 'transparent',
                      border: isSelected ? '1px solid rgba(34, 211, 238, 0.5)' : '1px solid #222',
                      borderRadius: 6,
                      padding: '5px 11px',
                      fontSize: '0.78rem',
                      color: isSelected ? '#22d3ee' : '#888',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(34, 211, 238, 0.3)';
                        (e.currentTarget as HTMLButtonElement).style.color = '#ccc';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        (e.currentTarget as HTMLButtonElement).style.borderColor = '#222';
                        (e.currentTarget as HTMLButtonElement).style.color = '#888';
                      }
                    }}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          )}

          {p?.context && (
            <p style={{ marginTop: '0.625rem', fontSize: '0.75rem', color: '#444', fontStyle: 'italic' }}>
              {p.context}
            </p>
          )}

          {isLast && !isStreaming && (
            <div style={{ display: 'flex', gap: '0.375rem', marginTop: '0.625rem', opacity: hovered ? 1 : 0, transition: 'opacity 0.15s' }}>
              {[{ label: 'Skip →', handler: onSkip }, { label: '↺ Re-ask', handler: onReask }].map(({ label, handler }) => (
                <button
                  key={label}
                  onClick={handler}
                  style={{
                    background: 'transparent',
                    border: '1px solid #1a1a1a',
                    color: '#444',
                    borderRadius: 6,
                    padding: '0.2rem 0.5rem',
                    fontSize: '0.7rem',
                    cursor: 'pointer',
                    transition: 'color 0.15s, border-color 0.15s',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#fff'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#444'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#444'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#1a1a1a'; }}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function UserBubble({ msg }: { msg: ChatMessage }) {
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
        {msg.content}
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
  const [interviewStatus, setInterviewStatus] = useState<'in_progress' | 'completed'>('in_progress');
  const [isDone, setIsDone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [sending, setSending] = useState(false);
  const [focusedNode, setFocusedNode] = useState<Node2D | null>(null);
  const [showSpecModal, setShowSpecModal] = useState(false);

  const initialNodes: Node2D[] = [{ id: 'idea', name: 'Your Idea', category: 'idea' }];
  const { nodes, links, setNodes, setLinks, updateGraph } = useSupabaseCanvas(id as string, initialNodes, []);

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
        setInterviewStatus(data.interview.status);
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

    const streamId = `assistant-${Date.now()}`;
    const streamMsg: ChatMessage = { id: streamId, role: 'assistant', content: '', streaming: true };
    setMessages((prev) => [...prev, streamMsg]);

    try {
      const response = await api.interview.sendMessage(id as string, content, { nodes, edges: links });
      if (!response.ok) throw new Error('Failed to send message');

      let accumulated = '';
      await parseSSEStream(
        response,
        (chunk) => {
          accumulated += chunk;
          setMessages((prev) =>
            prev.map((m) => (m.id === streamId ? { ...m, content: accumulated, streaming: true } : m))
          );
        },
        (fullText) => {
          const parsed = parseInterviewResponseSafely(fullText);
          const finalMsg: ChatMessage = {
            id: streamId,
            role: 'assistant',
            content: fullText,
            parsed: parsed ? { ...parsed, raw: fullText } : undefined,
            streaming: false,
          };
          setMessages((prev) => prev.map((m) => (m.id === streamId ? finalMsg : m)));

          if (parsed?.done) {
            setIsDone(true);
            setInterviewStatus('completed');
          }

          if (parsed?.canvas_updates && Array.isArray(parsed.canvas_updates)) {
            let newNodes = [...nodes];
            let newLinks = [...links];

            parsed.canvas_updates.forEach((update: any) => {
              if (update.action === 'add_node' && update.node) {
                const n = update.node;
                const nodeId = n.id;
                if (nodeId && !newNodes.some((existing) => existing.id === nodeId)) {
                  // Support both new format (n.name / n.label) and old format (n.data.label)
                  const nodeName = n.name || n.label || n.data?.label || nodeId;
                  // Support new category field and old type field
                  const nodeCategory = n.category ?? (
                    n.type === 'persona' ? 'persona' :
                    n.type === 'task' ? 'feature' :
                    n.type === 'document' ? 'default' : 'default'
                  );
                  newNodes.push({ id: nodeId, name: nodeName, category: nodeCategory });
                }
              } else if (update.action === 'add_edge' && update.edge) {
                const sid = update.edge.source;
                const tid = update.edge.target;
                if (!sid || !tid) return;
                const alreadyExists = newLinks.some(
                  (l) =>
                    (l.source === sid || (l.source as any)?.id === sid) &&
                    (l.target === tid || (l.target as any)?.id === tid)
                );
                if (!alreadyExists) {
                  newLinks.push({ source: sid, target: tid, label: update.edge.label });
                }
              } else if (update.action === 'update_node' && update.node) {
                newNodes = newNodes.map((n) =>
                  n.id === update.node.id
                    ? {
                        ...n,
                        name: update.node.new_label ?? n.name,
                        category: update.node.new_category ?? n.category,
                      }
                    : n
                );
              }
            });
            updateGraph(newNodes, newLinks);
          }
        }
      );
    } catch (err: unknown) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === streamId ? { ...m, content: '⚠️ ' + (err as Error).message, streaming: false } : m
        )
      );
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }, [inputValue, sending, isDone, id, nodes, links, focusedNode, updateGraph]);

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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
          <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', maxWidth: 480 }}>
            {[...Array(3)].map((_, i) => (
              <div key={i} style={{
                height: 56,
                background: 'linear-gradient(90deg, #0d0d0d 25%, #141414 50%, #0d0d0d 75%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.5s infinite',
                borderRadius: 10,
                width: i % 2 === 0 ? '75%' : '55%',
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
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '1rem' }}>
          <p style={{ color: '#f87171', fontSize: '0.9rem' }}>{error}</p>
          <Link href="/" className="btn btn-secondary">← Back Home</Link>
        </div>
      </div>
    );
  }

  // ─── Main layout ─────────────────────────────────────────────────────────────

  return (
    <div style={{ height: '100vh', background: '#000', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Navbar />

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', paddingTop: 56 }}>

        {/* ── Canvas pane — 65% ── */}
        <div style={{ flex: '0 0 65%', position: 'relative', background: '#050505', overflow: 'hidden' }}>
          <NeuralCanvas
            nodes={nodes}
            links={links}
            onNodeClick={(node) => {
              setFocusedNode(node);
              inputRef.current?.focus();
            }}
          />
          <CanvasOverlay nodeCount={nodes.length} linkCount={links.length} />
        </div>

        {/* ── Vertical divider ── */}
        <div style={{ width: 1, background: 'rgba(255,255,255,0.05)', flexShrink: 0 }} />

        {/* ── AI panel — 35% ── */}
        <div
          style={{
            flex: '0 0 35%',
            display: 'flex',
            flexDirection: 'column',
            background: '#080808',
            overflow: 'hidden',
          }}
        >
          {/* Panel header */}
          <div
            style={{
              padding: '0.875rem 1.25rem',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22d3ee', boxShadow: '0 0 8px #22d3ee', display: 'inline-block' }} />
              <h3 style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 600 }}>AI Co-pilot</h3>
            </div>

            {/* Generate Spec Docs button */}
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
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(34,211,238,0.4)';
                (e.currentTarget as HTMLButtonElement).style.color = '#22d3ee';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.1)';
                (e.currentTarget as HTMLButtonElement).style.color = '#777';
              }}
            >
              <FileText size={11} />
              Generate Spec Docs
            </button>
          </div>

          {/* Messages */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '1.25rem 1.25rem 0.5rem',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {messages.map((m, idx) => {
              const isLastAssistant =
                m.role === 'assistant' && messages.slice(idx + 1).every((x) => x.role !== 'assistant');
              return m.role === 'assistant' ? (
                <AssistantBubble
                  key={m.id}
                  msg={m}
                  inputValue={inputValue}
                  onOptionClick={handleOptionClick}
                  isLast={isLastAssistant}
                  onSkip={() => handleSend('[SKIP]')}
                  onReask={() => handleSend('[REASK]')}
                />
              ) : (
                <UserBubble key={m.id} msg={m} />
              );
            })}

            {isDone && (
              <div style={{ textAlign: 'center', padding: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.04)', marginTop: '1.5rem' }}>
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
          <div
            style={{
              padding: '0.875rem 1.25rem',
              borderTop: '1px solid rgba(255,255,255,0.04)',
              flexShrink: 0,
            }}
          >
            {/* Focused node chip */}
            {focusedNode && (
              <div
                style={{
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
                }}
              >
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#22d3ee', boxShadow: '0 0 4px #22d3ee', display: 'inline-block' }} />
                <span>Asking about: <strong>{focusedNode.name}</strong></span>
                <button
                  onClick={() => setFocusedNode(null)}
                  style={{ background: 'transparent', border: 'none', color: '#22d3ee', cursor: 'pointer', padding: 0, lineHeight: 1, fontSize: '1rem' }}
                >
                  ×
                </button>
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
                  placeholder={isDone ? 'Interview complete' : 'Answer or ask anything...'}
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
                    background: inputValue.trim() ? '#22d3ee' : 'rgba(255,255,255,0.06)',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: inputValue.trim() && !sending && !isDone ? 'pointer' : 'not-allowed',
                    transition: 'background 0.15s',
                  }}
                >
                  <Send size={12} color={inputValue.trim() ? '#000' : '#555'} />
                </button>
              </div>
            </div>

            <p style={{ fontSize: '0.65rem', color: '#333', marginTop: '0.4rem', textAlign: 'right' }}>
              {inputValue.length > 0 ? `${inputValue.length} chars · ` : ''}Enter to send · Shift+Enter for newline
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
