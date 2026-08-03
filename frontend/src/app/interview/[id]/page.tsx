'use client';

export const runtime = 'edge';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Send, CheckCircle, Maximize2, Minimize2, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import { api, type Message } from '@/lib/api';
import { parseSSEStream } from '@/lib/utils';
import { Navbar } from '@/components/layout/Navbar';
import { AudioRecorder } from '@/components/AudioRecorder';
import { NeuralCanvas, type Node3D, type Link3D } from '@/components/canvas/NeuralCanvas';
import { useSupabaseCanvas } from '@/hooks/useSupabaseCanvas';

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
        <h2 style={{ fontSize: '1.125rem', fontWeight: 500, color: '#fff', lineHeight: 1.5 }}>
          <span className="cursor-blink">|</span>
        </h2>
      </div>
    );
  }

  return (
    <div
      style={{ maxWidth: 760, marginBottom: '2.5rem' }}
      className="animate-fadein"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <p style={{ fontSize: '1.05rem', fontWeight: 500, color: '#fff', lineHeight: 1.6, marginBottom: options.length > 0 ? '1rem' : 0 }} className={isStreaming ? 'cursor-blink' : undefined}>
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

      {isLast && !isStreaming && (
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', opacity: hovered ? 1 : 0, transition: 'opacity 0.15s' }}>
          <button
            onClick={onSkip}
            style={{
              background: 'transparent',
              border: '1px solid #333',
              color: '#555',
              borderRadius: 6,
              padding: '0.25rem 0.625rem',
              fontSize: '0.75rem',
              cursor: 'pointer',
              transition: 'color 0.15s, border-color 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#555'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#555'; e.currentTarget.style.borderColor = '#333'; }}
          >
            Skip →
          </button>
          <button
            onClick={onReask}
            style={{
              background: 'transparent',
              border: '1px solid #333',
              color: '#555',
              borderRadius: 6,
              padding: '0.25rem 0.625rem',
              fontSize: '0.75rem',
              cursor: 'pointer',
              transition: 'color 0.15s, border-color 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#555'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#555'; e.currentTarget.style.borderColor = '#333'; }}
          >
            ↺ Re-ask
          </button>
        </div>
      )}
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
  const [chatOpen, setChatOpen] = useState(true);
  const [focusedNode, setFocusedNode] = useState<Node3D | null>(null);

  const { nodes, links, setNodes, setLinks, updateGraph } = useSupabaseCanvas(id as string, [
    { id: 'start', name: 'Start', group: 1, color: '#64c8ff' }
  ], []);

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
  }, [messages, chatOpen]);

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
      const response = await api.interview.sendMessage(id as string, content, { nodes, links });
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
          if (parsed?.canvas_updates && Array.isArray(parsed.canvas_updates)) {
            let newNodes = [...nodes];
            let newLinks = [...links];
            
            parsed.canvas_updates.forEach((update: any) => {
              if (update.action === 'add_node' && update.node) {
                if (!newNodes.some((n) => n.id === update.node.id)) {
                  newNodes.push({
                    id: update.node.id,
                    name: update.node.label || update.node.name || 'Unknown',
                    color: update.node.type === 'persona' ? '#a855f7' : '#64ff96',
                    group: 2
                  });
                }
              } else if (update.action === 'add_edge' && update.edge) {
                if (!newLinks.some((l) => (l.source === update.edge.source || (l.source as any).id === update.edge.source) && (l.target === update.edge.target || (l.target as any).id === update.edge.target))) {
                  newLinks.push({
                    source: update.edge.source,
                    target: update.edge.target
                  });
                }
              }
            });
            updateGraph(newNodes, newLinks);
          }
        }
      );
    } catch (err: unknown) {
      setMessages((prev) => prev.map((m) => m.id === streamId ? { ...m, content: '⚠️ ' + ((err as Error).message), streaming: false } : m));
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

  if (authLoading || loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#000' }}>
        <Navbar />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
          <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', maxWidth: 760 }}>
            {[...Array(3)].map((_, i) => (
              <div key={i} style={{
                height: 60,
                background: 'linear-gradient(90deg, #111 25%, #1a1a1a 50%, #111 75%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.5s infinite',
                borderRadius: 12,
                width: i % 2 === 0 ? '70%' : '50%',
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
          <p style={{ color: '#ff4444', fontSize: '0.9rem' }}>{error}</p>
          <Link href="/" className="btn btn-secondary">← Back Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', background: '#000', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Navbar />

      <div style={{ position: 'relative', flex: 1, paddingTop: 56, height: '100vh', overflow: 'hidden' }}>
        
        {/* Full-screen 3D Canvas */}
        <div style={{ position: 'absolute', inset: 0 }}>
           <NeuralCanvas 
              nodes={nodes} 
              links={links} 
              onNodeClick={(node) => {
                setFocusedNode(node);
                if (!chatOpen) setChatOpen(true);
              }} 
            />
        </div>

        {/* Toggle Chat Button (when closed) */}
        {!chatOpen && (
          <button
            onClick={() => setChatOpen(true)}
            style={{
              position: 'absolute',
              top: 24,
              left: 24,
              zIndex: 10,
              background: 'rgba(10, 10, 10, 0.8)',
              backdropFilter: 'blur(12px)',
              border: '1px solid #333',
              borderRadius: '50%',
              width: 48,
              height: 48,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#fff',
              boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
            }}
          >
            <MessageSquare size={20} />
          </button>
        )}

        {/* Glassmorphic Chat Sidebar */}
        {chatOpen && (
          <div
            style={{
              position: 'absolute',
              top: 16,
              left: 16,
              bottom: 16,
              width: '400px',
              maxWidth: '90%',
              background: 'rgba(10, 10, 10, 0.6)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 24,
              display: 'flex',
              flexDirection: 'column',
              zIndex: 20,
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 600 }}>AI Co-pilot</h3>
              <button
                onClick={() => setChatOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer' }}
              >
                <Minimize2 size={16} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
              {messages.map((m, idx) => {
                const isLastAssistant = m.role === 'assistant' &&
                  messages.slice(idx + 1).every((x) => x.role !== 'assistant');
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
                <div style={{ textAlign: 'center', padding: '2rem', borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '2rem' }}>
                  <CheckCircle size={36} color="var(--theme-accent, #06b6d4)" style={{ margin: '0 auto 1rem' }} />
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#fff', marginBottom: '0.5rem' }}>Interview Complete!</h3>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div style={{ padding: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.2)' }}>
              <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                
                {focusedNode && (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem', 
                    background: 'rgba(100, 200, 255, 0.1)', 
                    border: '1px solid rgba(100, 200, 255, 0.2)', 
                    padding: '0.25rem 0.75rem', 
                    borderRadius: 999, 
                    width: 'fit-content',
                    fontSize: '0.75rem',
                    color: '#64c8ff'
                  }}>
                    <span>Focusing on: <strong>{focusedNode.name}</strong></span>
                    <button onClick={() => setFocusedNode(null)} style={{ background: 'transparent', border: 'none', color: '#64c8ff', cursor: 'pointer', padding: 0 }}>&times;</button>
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem' }}>
                  <AudioRecorder onTranscription={(text) => handleSend(text)} />
                  <div style={{ flex: 1, position: 'relative' }}>
                    <textarea
                      ref={inputRef}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                      placeholder="Talk to AI..."
                      disabled={sending || isDone}
                      rows={1}
                      style={{
                        width: '100%',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 20,
                        padding: '0.75rem 2.5rem 0.75rem 1rem',
                        color: '#fff',
                        fontSize: '0.9rem',
                        resize: 'none',
                        outline: 'none',
                      }}
                    />
                    <button
                      onClick={() => handleSend()}
                      disabled={!inputValue.trim() || sending || isDone}
                      style={{
                        position: 'absolute',
                        right: 6,
                        bottom: 6,
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        background: inputValue.trim() ? 'var(--theme-accent, #06b6d4)' : 'rgba(255,255,255,0.1)',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: inputValue.trim() && !sending && !isDone ? 'pointer' : 'not-allowed',
                      }}
                    >
                      <Send size={14} color={inputValue.trim() ? '#000' : '#888'} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
