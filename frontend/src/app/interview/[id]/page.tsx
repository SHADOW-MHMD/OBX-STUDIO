'use client';

export const runtime = 'edge';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Send, ArrowLeft, CheckCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import { api, type Message } from '@/lib/api';
import { parseSSEStream, parseInterviewResponse } from '@/lib/utils';
import { Navbar } from '@/components/layout/Navbar';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ParsedAssistantMessage {
  question?: string;
  options?: string[];
  context?: string;
  done?: boolean;
  summary?: string;
  raw: string;
}

interface ChatMessage {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  parsed?: ParsedAssistantMessage;
  streaming?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toChat(messages: Message[]): ChatMessage[] {
  return messages
    .filter((m) => m.role !== 'system')
    .map((m) => {
      if (m.role === 'assistant') {
        const parsed = parseInterviewResponse(m.content);
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
  onOptionClick,
}: {
  msg: ChatMessage;
  onOptionClick: (opt: string) => void;
}) {
  const p = msg.parsed;
  const question = p?.question ?? msg.content;
  const options = p?.options ?? [];
  const isStreaming = msg.streaming;

  return (
    <div
      style={{ maxWidth: 680, marginBottom: '2rem' }}
      className="animate-fadein"
    >
      {/* Question text */}
      <p
        style={{
          fontSize: '1.05rem',
          fontWeight: 600,
          color: '#fff',
          lineHeight: 1.65,
          letterSpacing: '-0.01em',
          marginBottom: options.length > 0 ? '1rem' : 0,
        }}
        className={isStreaming ? 'cursor-blink' : undefined}
      >
        {question}
      </p>

      {/* Option chips */}
      {options.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {options.map((opt, i) => (
            <button
              key={i}
              onClick={() => onOptionClick(opt)}
              style={{
                background: 'transparent',
                border: '1px solid #222',
                borderRadius: 6,
                padding: '6px 12px',
                fontSize: '0.8rem',
                color: '#ccc',
                cursor: 'pointer',
                transition: 'all 0.15s',
                fontFamily: 'inherit',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = '#444';
                (e.currentTarget as HTMLButtonElement).style.background = '#111';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = '#222';
                (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
              }}
            >
              {opt}
            </button>
          ))}
        </div>
      )}

      {/* Context hint */}
      {p?.context && (
        <p
          style={{
            marginTop: '0.75rem',
            fontSize: '0.78rem',
            color: '#555',
            lineHeight: 1.5,
          }}
        >
          {p.context}
        </p>
      )}
    </div>
  );
}

function UserBubble({ msg }: { msg: ChatMessage }) {
  return (
    <div
      style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.25rem' }}
      className="animate-fadein"
    >
      <p
        style={{
          fontSize: '0.825rem',
          color: '#888',
          background: '#0d0d0d',
          border: '1px solid #1a1a1a',
          borderRadius: 8,
          padding: '0.5rem 0.875rem',
          maxWidth: 480,
          lineHeight: 1.5,
        }}
      >
        {msg.content}
      </p>
    </div>
  );
}

function InterviewCompleteBanner({ interviewId }: { interviewId: string }) {
  return (
    <div
      style={{
        background: 'rgba(34,197,94,0.06)',
        border: '1px solid rgba(34,197,94,0.2)',
        borderRadius: 12,
        padding: '1.25rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        marginBottom: '1.5rem',
        flexWrap: 'wrap',
      }}
      className="animate-fadein"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
        <CheckCircle size={18} color="#22c55e" />
        <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#22c55e' }}>
          Interview complete!
        </span>
      </div>
      <Link
        href={`/output/${interviewId}`}
        className="btn btn-primary"
        style={{ fontSize: '0.8rem', padding: '0.4rem 0.875rem' }}
      >
        View Output →
      </Link>
    </div>
  );
}

function DoneBanner({ interviewId }: { interviewId: string }) {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: '2rem 1rem',
        borderTop: '1px solid #111',
        marginTop: '1rem',
      }}
      className="animate-fadein"
    >
      <CheckCircle size={36} color="#22c55e" style={{ margin: '0 auto 1rem' }} />
      <h3
        style={{
          fontSize: '1.1rem',
          fontWeight: 600,
          color: '#fff',
          marginBottom: '0.5rem',
        }}
      >
        Interview complete!
      </h3>
      <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '1.5rem' }}>
        Your answers have been recorded. Generate your output now.
      </p>
      <Link
        href={`/output/${interviewId}`}
        className="btn btn-primary"
        style={{ fontSize: '0.875rem' }}
      >
        Generate Output →
      </Link>
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function Sidebar({
  title,
  status,
  messageCount,
  interviewId,
}: {
  title: string | null;
  status: 'in_progress' | 'completed';
  messageCount: number;
  interviewId: string;
}) {
  // Rough progress: assume ~10 questions max
  const questionCount = Math.ceil(messageCount / 2);
  const maxQuestions = 10;
  const progress = Math.min((questionCount / maxQuestions) * 100, 100);

  return (
    <aside
      style={{
        width: 260,
        flexShrink: 0,
        borderRight: '1px solid #111',
        display: 'flex',
        flexDirection: 'column',
        padding: '1.25rem',
        gap: '1.25rem',
        background: '#000',
        overflowY: 'auto',
      }}
    >
      {/* Back link */}
      <Link
        href="/dashboard"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.375rem',
          fontSize: '0.78rem',
          color: '#555',
          textDecoration: 'none',
          transition: 'color 0.15s',
        }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = '#aaa')}
        onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = '#555')}
      >
        <ArrowLeft size={12} />
        Dashboard
      </Link>

      {/* Divider */}
      <div style={{ height: 1, background: '#111' }} />

      {/* Interview title */}
      <div>
        <p style={{ fontSize: '0.68rem', color: '#444', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.375rem' }}>
          Session
        </p>
        <p
          style={{
            fontSize: '0.85rem',
            fontWeight: 500,
            color: '#ccc',
            lineHeight: 1.4,
            wordBreak: 'break-word',
          }}
        >
          {title ?? 'Untitled interview'}
        </p>
      </div>

      {/* Status badge */}
      <div>
        <p style={{ fontSize: '0.68rem', color: '#444', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.375rem' }}>
          Status
        </p>
        <span
          className={status === 'completed' ? 'badge badge-success' : 'badge badge-warning'}
        >
          {status === 'completed' ? 'Completed' : 'In progress'}
        </span>
      </div>

      {/* Progress */}
      <div>
        <p style={{ fontSize: '0.68rem', color: '#444', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
          Progress
        </p>
        <div
          style={{
            height: 3,
            background: '#1a1a1a',
            borderRadius: 99,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${progress}%`,
              background: status === 'completed' ? '#22c55e' : '#555',
              borderRadius: 99,
              transition: 'width 0.5s ease',
            }}
          />
        </div>
        <p style={{ fontSize: '0.72rem', color: '#555', marginTop: '0.375rem' }}>
          ~{questionCount} question{questionCount !== 1 ? 's' : ''} answered
        </p>
      </div>

      {/* Output link if completed */}
      {status === 'completed' && (
        <Link
          href={`/output/${interviewId}`}
          className="btn btn-primary"
          style={{ fontSize: '0.78rem', padding: '0.5rem 0.75rem', width: '100%', justifyContent: 'center' }}
        >
          View Output →
        </Link>
      )}
    </aside>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function InterviewPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const { user, isLoading: authLoading } = useAuthStore();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [interviewTitle, setInterviewTitle] = useState<string | null>(null);
  const [interviewStatus, setInterviewStatus] = useState<'in_progress' | 'completed'>('in_progress');
  const [isDone, setIsDone] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [inputValue, setInputValue] = useState('');
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // ── Auth guard ──────────────────────────────────────────────────────
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/auth/login');
    }
  }, [authLoading, user, router]);

  // ── Load interview ──────────────────────────────────────────────────
  useEffect(() => {
    if (!id || authLoading || !user) return;

    async function load() {
      try {
        const data = await api.interview.get(id);
        setInterviewTitle(data.interview.title);
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

  // ── Auto-scroll ─────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Send message ────────────────────────────────────────────────────
  const handleSend = useCallback(async () => {
    const content = inputValue.trim();
    if (!content || sending || isDone) return;

    // Optimistic user message
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setSending(true);

    // Placeholder streaming assistant message
    const streamId = `assistant-${Date.now()}`;
    const streamMsg: ChatMessage = {
      id: streamId,
      role: 'assistant',
      content: '',
      streaming: true,
    };
    setMessages((prev) => [...prev, streamMsg]);

    try {
      const response = await api.interview.sendMessage(id, content);

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error((errBody as { error?: string }).error ?? 'Failed to send message');
      }

      let accumulated = '';

      await parseSSEStream(
        response,
        (chunk) => {
          accumulated += chunk;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === streamId
                ? { ...m, content: accumulated, streaming: true }
                : m
            )
          );
        },
        (fullText) => {
          const parsed = parseInterviewResponse(fullText);
          const finalMsg: ChatMessage = {
            id: streamId,
            role: 'assistant',
            content: fullText,
            parsed: parsed ? { ...parsed, raw: fullText } : undefined,
            streaming: false,
          };
          setMessages((prev) =>
            prev.map((m) => (m.id === streamId ? finalMsg : m))
          );
          if (parsed?.done) {
            setIsDone(true);
            setInterviewStatus('completed');
          }
        }
      );
    } catch (err: unknown) {
      // Replace streaming placeholder with error note
      setMessages((prev) =>
        prev.map((m) =>
          m.id === streamId
            ? {
                ...m,
                content: '⚠️ ' + ((err as Error).message ?? 'Something went wrong. Please try again.'),
                streaming: false,
              }
            : m
        )
      );
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }, [inputValue, sending, isDone, id]);

  // ── Option chip click ────────────────────────────────────────────────
  const handleOptionClick = useCallback((opt: string) => {
    setInputValue(opt);
    inputRef.current?.focus();
  }, []);

  // ── Keyboard submit ──────────────────────────────────────────────────
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── Loading skeleton ─────────────────────────────────────────────────
  if (authLoading || loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#000' }}>
        <Navbar />
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            gap: '0.75rem',
          }}
        >
          <Loader2 size={22} color="#333" className="animate-spin" />
          <span style={{ fontSize: '0.85rem', color: '#444' }}>Loading interview…</span>
        </div>
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────
  if (error) {
    return (
      <div style={{ minHeight: '100vh', background: '#000' }}>
        <Navbar />
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            gap: '1rem',
            padding: '2rem',
            textAlign: 'center',
          }}
          className="animate-fadein"
        >
          <p style={{ color: '#ff4444', fontSize: '0.9rem' }}>{error}</p>
          <Link href="/dashboard" className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // ── Main chat UI ──────────────────────────────────────────────────────
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#000',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Navbar />

      {/* Body: sidebar + main */}
      <div
        style={{
          display: 'flex',
          flex: 1,
          paddingTop: 56, // navbar height
          height: '100vh',
          overflow: 'hidden',
        }}
      >
        {/* Sidebar */}
        <Sidebar
          title={interviewTitle}
          status={interviewStatus}
          messageCount={messages.length}
          interviewId={id}
        />

        {/* Chat area */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Completed banner */}
          {interviewStatus === 'completed' && (
            <div style={{ padding: '1rem 1.5rem 0' }}>
              <InterviewCompleteBanner interviewId={id} />
            </div>
          )}

          {/* Messages scroll area */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '24px',
            }}
          >
            {messages.length === 0 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  color: '#333',
                  fontSize: '0.85rem',
                }}
              >
                Waiting for the interview to begin…
              </div>
            )}

            {messages.map((msg) =>
              msg.role === 'assistant' ? (
                <AssistantBubble
                  key={msg.id}
                  msg={msg}
                  onOptionClick={handleOptionClick}
                />
              ) : (
                <UserBubble key={msg.id} msg={msg} />
              )
            )}

            {/* Done banner inside chat */}
            {isDone && !loading && <DoneBanner interviewId={id} />}

            {/* Scroll anchor */}
            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          {!isDone && (
            <div
              style={{
                borderTop: '1px solid #111',
                padding: '16px',
                background: '#000',
                display: 'flex',
                gap: '0.75rem',
                alignItems: 'flex-end',
              }}
            >
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your answer… (Enter to send, Shift+Enter for newline)"
                disabled={sending}
                rows={1}
                style={{
                  flex: 1,
                  background: '#0a0a0a',
                  border: '1px solid #1a1a1a',
                  borderRadius: 8,
                  padding: '0.625rem 0.875rem',
                  color: '#fff',
                  fontSize: '0.875rem',
                  fontFamily: 'inherit',
                  resize: 'none',
                  lineHeight: 1.5,
                  outline: 'none',
                  transition: 'border-color 0.15s, box-shadow 0.15s',
                  maxHeight: 120,
                  overflowY: 'auto',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#333';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(255,255,255,0.04)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#1a1a1a';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                onInput={(e) => {
                  // Auto-grow
                  const el = e.currentTarget;
                  el.style.height = 'auto';
                  el.style.height = Math.min(el.scrollHeight, 120) + 'px';
                }}
              />
              <button
                onClick={handleSend}
                disabled={sending || !inputValue.trim()}
                className="btn btn-primary"
                style={{
                  padding: '0.625rem 1rem',
                  flexShrink: 0,
                  alignSelf: 'flex-end',
                }}
                aria-label="Send message"
              >
                {sending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Send size={16} />
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
