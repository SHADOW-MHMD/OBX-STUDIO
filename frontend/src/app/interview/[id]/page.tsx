'use client';

export const runtime = 'edge';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Send, CheckCircle, Loader2, Maximize2, Minimize2 } from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import { api, type Message } from '@/lib/api';
import { parseSSEStream } from '@/lib/utils';
import { Navbar } from '@/components/layout/Navbar';
import { AudioRecorder } from '@/components/AudioRecorder';
import { NeuralCanvas } from '@/components/canvas/NeuralCanvas';
import { useSupabaseCanvas } from '@/hooks/useSupabaseCanvas';
import { type Node, type Edge } from '@xyflow/react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ParsedAssistantMessage {
  question?: string;
  options?: string[];
  context?: string;
  done?: boolean;
  summary?: string;
  canvas_updates?: Array<{
    action: 'add_node' | 'add_edge';
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
}: {
  msg: ChatMessage;
  inputValue: string;
  onOptionClick: (opt: string) => void;
}) {
  const p = msg.parsed;
  const isRawJsonStream = msg.streaming && (msg.content.trim().startsWith('{') || msg.content.trim().startsWith('```'));
  const question = p?.question ?? (isRawJsonStream ? '' : msg.content);
  const options = p?.options ?? [];
  const isStreaming = msg.streaming;

  const selectedParts = inputValue.split(',').map((s) => s.trim()).filter(Boolean);

  if (isStreaming && !question) {
    return (
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 500, color: '#fff', lineHeight: 1.5 }}>
          <span className="cursor-blink">|</span>
        </h2>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 760, marginBottom: '2.5rem' }} className="animate-fadein">
      <p style={{ fontSize: '1.1rem', fontWeight: 500, color: '#fff', lineHeight: 1.6, marginBottom: options.length > 0 ? '1rem' : 0 }} className={isStreaming ? 'cursor-blink' : undefined}>
        {question}
      </p>

      {options.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {options.map((opt, i) => {
            const isSelected = selectedParts.includes(opt);
            return (
              <button
                key={i}
                onClick={() => onOptionClick(opt)}
                className={isSelected ? "btn-primary" : ""}
                style={!isSelected ? {
                  background: 'transparent',
                  border: '1px solid #333',
                  borderRadius: 6,
                  padding: '6px 12px',
                  fontSize: '0.85rem',
                  color: '#ccc',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                } : {
                  padding: '6px 12px',
                  fontSize: '0.85rem',
                  borderRadius: 6,
                }}
                onMouseEnter={!isSelected ? (e) => {
                  e.currentTarget.style.borderColor = 'var(--theme-accent, #06b6d4)';
                  e.currentTarget.style.color = '#fff';
                  e.currentTarget.style.boxShadow = 'var(--shadow-glow)';
                } : undefined}
                onMouseLeave={!isSelected ? (e) => {
                  e.currentTarget.style.borderColor = '#333';
                  e.currentTarget.style.color = '#ccc';
                  e.currentTarget.style.boxShadow = 'none';
                } : undefined}
              >
                {opt}
              </button>
            );
          })}
        </div>
      )}
      
      {p?.context && <p style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: '#555', fontStyle: 'italic' }}>{p.context}</p>}
    </div>
  );
}

function UserBubble({ msg }: { msg: ChatMessage }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }} className="animate-fadein">
      <p style={{ fontSize: '0.9rem', color: '#aaa', background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: 12, padding: '0.75rem 1rem', maxWidth: 600, lineHeight: 1.5 }}>
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
  const [canvasOpen, setCanvasOpen] = useState(false);

  const { nodes, edges, onNodesChange, onEdgesChange, setNodes } = useSupabaseCanvas(id as string, [
    { id: '1', type: 'persona', position: { x: 250, y: 50 }, data: { label: 'AI Architect' } },
    { id: '2', type: 'document', position: { x: 250, y: 250 }, data: { label: 'Project Canvas', content: 'Extracting details...' } }
  ], [
    { id: 'e1-2', source: '1', target: '2', animated: true }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

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
  }, [messages, canvasOpen]);

  const handleSend = useCallback(async (forcedContent?: string) => {
    const content = forcedContent || inputValue.trim();
    if (!content || sending || isDone) return;

    const userMsg: ChatMessage = { id: `user-${Date.now()}`, role: 'user', content };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setSending(true);

    const streamId = `assistant-${Date.now()}`;
    const streamMsg: ChatMessage = { id: streamId, role: 'assistant', content: '', streaming: true };
    setMessages((prev) => [...prev, streamMsg]);

    try {
      const response = await api.interview.sendMessage(id as string, content, { nodes, edges });
      if (!response.ok) throw new Error("Failed to send message");

      let accumulated = '';
      await parseSSEStream(
        response,
        (chunk) => {
          accumulated += chunk;
          setMessages((prev) => prev.map((m) => m.id === streamId ? { ...m, content: accumulated, streaming: true } : m));
        },
        (fullText) => {
          const parsed = parseInterviewResponseSafely(fullText);
          const finalMsg: ChatMessage = { id: streamId, role: 'assistant', content: fullText, parsed: parsed ? { ...parsed, raw: fullText } : undefined, streaming: false };
          setMessages((prev) => prev.map((m) => (m.id === streamId ? finalMsg : m)));
          if (parsed?.done) {
            setIsDone(true);
            setInterviewStatus('completed');
          }
          if (parsed?.summary) {
            setNodes((prev) => {
              const hasSummaryNode = prev.some((n) => n.id === 'summary-node');
              if (hasSummaryNode) return prev;
              return [
                ...prev,
                {
                  id: 'summary-node',
                  type: 'document',
                  position: { x: 250, y: 450 },
                  data: { label: 'Interview Summary', content: parsed.summary }
                }
              ];
            });
          }
          if (parsed?.canvas_updates && Array.isArray(parsed.canvas_updates)) {
            parsed.canvas_updates.forEach((update: any) => {
              if (update.action === 'add_node' && update.node) {
                setNodes((prev) => {
                  if (prev.some((n) => n.id === update.node.id)) return prev;
                  return [...prev, update.node];
                });
              } else if (update.action === 'add_edge' && update.edge) {
                setEdges((prev) => {
                  if (prev.some((e) => e.id === update.edge.id)) return prev;
                  return [...prev, { ...update.edge, animated: true }];
                });
              }
            });
          }
        }
      );
    } catch (err: unknown) {
      setMessages((prev) => prev.map((m) => m.id === streamId ? { ...m, content: '⚠️ ' + ((err as Error).message), streaming: false } : m));
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }, [inputValue, sending, isDone, id]);

  const handleOptionClick = useCallback((opt: string) => {
    setInputValue((prev) => {
      const parts = prev.split(',').map((s) => s.trim()).filter(Boolean);
      if (parts.includes(opt)) return parts.filter((p) => p !== opt).join(', ');
      return [...parts, opt].join(', ');
    });
    inputRef.current?.focus();
  }, []);

  if (authLoading || loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#000' }}>
        <Navbar />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '0.75rem' }}>
          <Loader2 size={22} color="var(--theme-accent, #06b6d4)" className="animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', background: '#000' }}>
        <Navbar />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '1rem' }}>
          <p style={{ color: '#ff4444', fontSize: '0.9rem' }}>{error}</p>
          <Link href="/" className="btn btn-secondary">← Back Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', background: '#000', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Navbar />

      <div style={{ display: 'flex', flex: 1, paddingTop: 56, height: '100vh', overflow: 'hidden' }}>
        
        {/* Immersive Chat Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', borderRight: canvasOpen ? '1px solid #111' : 'none' }}>
          
          {/* Top Bar for Canvas Toggle */}
          <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 10 }}>
            <button
              onClick={() => setCanvasOpen(!canvasOpen)}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#0a0a0a', border: '1px solid #222' }}
            >
              {canvasOpen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              {canvasOpen ? "Close Canvas" : "Open Canvas"}
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '2rem 1.5rem 8rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: '100%', maxWidth: 800 }}>
              {messages.map((m) => m.role === 'assistant' ? 
                <AssistantBubble key={m.id} msg={m} inputValue={inputValue} onOptionClick={handleOptionClick} /> : 
                <UserBubble key={m.id} msg={m} />
              )}
              {isDone && (
                <div style={{ textAlign: 'center', padding: '2rem', borderTop: '1px solid #111', marginTop: '2rem' }}>
                  <CheckCircle size={36} color="var(--theme-accent, #06b6d4)" style={{ margin: '0 auto 1rem' }} />
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#fff', marginBottom: '0.5rem' }}>Interview Complete!</h3>
                  <p style={{ color: '#888', marginBottom: '1.5rem' }}>The AI has gathered all the requirements. Open the Canvas to see your generated assets.</p>
                  <button onClick={() => setCanvasOpen(true)} className="btn btn-primary">Open Canvas →</button>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Chat Input */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(to top, #000 70%, transparent)', padding: '2rem 1.5rem 1.5rem', display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: '100%', maxWidth: 800, position: 'relative', display: 'flex', alignItems: 'flex-end', gap: '0.75rem' }}>
              <AudioRecorder onTranscription={(text) => handleSend(text)} />
              <div style={{ flex: 1, position: 'relative' }}>
                <textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder="Type your response..."
                  disabled={sending || isDone}
                  rows={1}
                  style={{
                    width: '100%',
                    background: '#0a0a0a',
                    border: '1px solid #222',
                    borderRadius: 24,
                    padding: '1rem 3.5rem 1rem 1.5rem',
                    color: '#fff',
                    fontSize: '0.95rem',
                    resize: 'none',
                    lineHeight: 1.5,
                    outline: 'none',
                    transition: 'border-color 0.15s, box-shadow 0.15s',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'var(--theme-accent, #06b6d4)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-glow)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#222';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
                <button
                  onClick={() => handleSend()}
                  disabled={!inputValue.trim() || sending || isDone}
                  style={{
                    position: 'absolute',
                    right: 8,
                    bottom: 8,
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: inputValue.trim() ? 'var(--theme-accent, #06b6d4)' : '#222',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: inputValue.trim() && !sending && !isDone ? 'pointer' : 'not-allowed',
                    transition: 'all 0.15s',
                  }}
                >
                  <Send size={16} color={inputValue.trim() ? '#000' : '#555'} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Neural Canvas Sidebar */}
        {canvasOpen && (
          <div style={{ width: '50%', minWidth: 600, height: '100%', background: '#050505', display: 'flex', flexDirection: 'column', animation: 'fadein 0.2s ease-out' }}>
            <div style={{ padding: '1rem', borderBottom: '1px solid #222', background: '#0a0a0a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 600 }}>Neural Canvas</h3>
            </div>
            <div style={{ flex: 1 }}>
              <NeuralCanvas 
                nodes={nodes} 
                edges={edges} 
                onNodesChange={onNodesChange} 
                onEdgesChange={onEdgesChange} 
              />
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
