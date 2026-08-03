const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8787";

async function getToken(): Promise<string | null> {
  // Import lazily to avoid SSR issues
  const { createClient } = await import("./supabase");
  const supabase = createClient();
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw Object.assign(new Error((err as any).error ?? "API error"), {
      status: res.status,
    });
  }
  return res.json();
}

// ---- Auth ----
export const api = {
  auth: {
    me: () => apiFetch<UserProfile>(`/auth/me?_t=${Date.now()}`),
    updateProfile: (body: { display_name?: string; avatar_url?: string }) =>
      apiFetch("/auth/profile", { method: "PATCH", body: JSON.stringify(body) }),
  },

  user: {
    stats: () => apiFetch<UserStats>("/user/stats"),
    updateSettings: (body: { openrouter_key?: string; openrouter_model?: string; theme_accent?: string }) =>
      apiFetch<{ ok: boolean }>("/user/settings", { method: "PATCH", body: JSON.stringify(body) }),
    deleteAccount: () => apiFetch<{ ok: boolean }>("/user", { method: "DELETE" }),
    exportData: async () => {
      const token = await getToken();
      const headers: Record<string, string> = { ...(token ? { Authorization: `Bearer ${token}` } : {}) };
      return fetch(`${BASE}/user/export`, { headers });
    },
  },

  interview: {
    create: (personaId: string, template_id?: string) =>
      apiFetch<{ id: string }>("/interview", {
        method: "POST",
        body: JSON.stringify({ personaId, template_id }),
      }),
    list: () => apiFetch<Interview[]>("/interview"),
    get: (id: string) => apiFetch<InterviewWithMessages>(`/interview/${id}`),
    delete: (id: string) =>
      apiFetch(`/interview/${id}`, { method: "DELETE" }),
    rename: (id: string, title: string) =>
      apiFetch<{ ok: boolean; title: string }>(`/interview/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ title }),
      }),
    duplicate: (id: string) =>
      apiFetch<{ id: string }>(`/interview/${id}/duplicate`, { method: "POST" }),
    saveCanvas: (id: string, nodes: any[], edges: any[]) =>
      apiFetch<{ ok: boolean }>(`/interview/${id}/canvas`, {
        method: 'PATCH',
        body: JSON.stringify({ nodes, edges }),
      }),
    /**
     * Send a user message and get a streaming SSE response back.
     * Returns a ReadableStream.
     */
    sendMessage: async (id: string, content: string, canvasState?: { nodes: any[], links?: any[], edges?: any[] }): Promise<Response> => {
      const token = await getToken();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };
      return fetch(`${BASE}/interview/${id}/message`, {
        method: "POST",
        headers,
        body: JSON.stringify({ content, canvasState }),
      });
    },
  },

  output: {
    generate: (interviewId: string, type: OutputType) =>
      apiFetch<{ id: string; content: string }>(`/output/${interviewId}`, {
        method: "POST",
        body: JSON.stringify({ type }),
      }),
    list: (interviewId: string) =>
      apiFetch<Output[]>(`/output/${interviewId}`),
    share: (outputId: string) =>
      apiFetch<{ ok: boolean; url: string }>(`/output/${outputId}/share`, { method: "POST" }),
    getPublic: (outputId: string) =>
      fetch(`${BASE}/public/share/${outputId}`).then((r) => r.json()),
  },

  kanban: {
    list: (interviewId: string) => apiFetch<KanbanItem[]>(`/kanban/${interviewId}`),
    update: (id: string, body: Partial<KanbanItem>) =>
      apiFetch(`/kanban/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    addItem: (interviewId: string, body: { title: string; description?: string }) =>
      apiFetch<{ id: string }>(`/kanban/${interviewId}/item`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    delete: (id: string) => apiFetch(`/kanban/${id}`, { method: "DELETE" }),
    autofill: (interviewId: string) =>
      apiFetch<{ ok: boolean; count: number }>(`/kanban/${interviewId}/autofill`, {
        method: "POST",
      }),
  },

  admin: {
    stats: () => apiFetch<AdminStats>("/admin/stats"),
    users: (page = 1) => apiFetch<AdminUser[]>(`/admin/users?page=${page}`),
    updateUser: (id: string, body: { is_admin?: boolean; tier?: string; interviews_limit?: number }) =>
      apiFetch(`/admin/users/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  },

  templates: {
    list: () => apiFetch<Template[]>("/templates"),
  }
};

// ---- Types ----
export interface UserProfile {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  tier: "free" | "pro";
  interviews_used_today: number;
  interviews_limit: number;
  streak: number;
  total_interviews: number;
  total_questions_answered: number;
  is_admin: boolean;
  has_key: boolean;
  openrouter_model: string;
  theme_accent: string;
}

export interface UserStats {
  total_interviews: number;
  interviews_used_today: number;
  interviews_limit: number;
  streak: number;
  total_questions_answered: number;
  in_progress: number;
  completed: number;
}

export interface Interview {
  id: string;
  user_id: string;
  title: string | null;
  status: "in_progress" | "completed";
  output_type: string | null;
  output_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  interview_id: string;
  role: "system" | "assistant" | "user";
  content: string;
  created_at: string;
}

export interface InterviewWithMessages {
  interview: Interview;
  messages: Message[];
}

export type OutputType = "prd" | "summary" | "roadmap" | "techstack" | "all";

export interface Output {
  id: string;
  interview_id: string;
  type: OutputType;
  content: string;
  created_at: string;
}

export interface KanbanItem {
  id: string;
  interview_id: string;
  title: string;
  description: string | null;
  status: "todo" | "in_progress" | "done";
  position: number;
  created_at: string;
  updated_at: string;
}

export interface AdminStats {
  total_users: number;
  active_today: number;
  active_this_week: number;
  interviews_started: number;
  interviews_completed: number;
  total_token_usage_today: number;
  output_types: Array<{ type: string; count: number }>;
  rate_limit_hits: number;
}

export interface AdminUser {
  id: string;
  email: string;
  display_name: string | null;
  tier: string;
  interviews_used_today: number;
  interviews_limit: number;
  streak: number;
  total_interviews: number;
  is_admin: boolean;
  created_at: string;
  last_active_date: string | null;
}

export interface Template {
  id: string;
  name: string;
  type: string;
  owner_id: string | null;
  is_fork: boolean;
  checklists: Record<string, string[]>;
  created_at: string;
}
