export interface DbUser {
  id: string; // supabase user id (uuid)
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  tier: "free" | "paid";
  interviews_used_today: number;
  interviews_limit: number; // 3 for free
  last_reset_date: string; // ISO date YYYY-MM-DD
  streak: number;
  last_active_date: string | null;
  total_interviews: number;
  total_questions_answered: number;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbInterview {
  id: string;
  user_id: string;
  title: string | null;
  status: "in_progress" | "completed";
  created_at: string;
  updated_at: string;
}

export interface DbMessage {
  id: string;
  interview_id: string;
  role: "system" | "assistant" | "user";
  content: string;
  created_at: string;
}

export interface DbOutput {
  id: string;
  interview_id: string;
  user_id: string;
  type: "prd" | "summary" | "roadmap" | "techstack" | "all";
  content: string; // markdown
  created_at: string;
}

export interface DbKanbanItem {
  id: string;
  interview_id: string;
  user_id: string;
  title: string;
  description: string | null;
  status: "todo" | "in_progress" | "done";
  position: number;
  created_at: string;
  updated_at: string;
}
