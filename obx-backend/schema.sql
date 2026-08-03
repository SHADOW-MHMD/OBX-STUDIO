-- OBX-STUDIO D1 Schema (Full, current state)
-- Run: wrangler d1 execute obx-studio-db --file=schema.sql

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY, -- Supabase user UUID
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  tier TEXT NOT NULL DEFAULT 'free',
  interviews_used_today INTEGER NOT NULL DEFAULT 0,
  interviews_limit INTEGER NOT NULL DEFAULT 3,
  last_reset_date TEXT NOT NULL DEFAULT (date('now')),
  streak INTEGER NOT NULL DEFAULT 0,
  last_active_date TEXT,
  total_interviews INTEGER NOT NULL DEFAULT 0,
  total_questions_answered INTEGER NOT NULL DEFAULT 0,
  is_admin INTEGER NOT NULL DEFAULT 0, -- SQLite boolean
  openrouter_key TEXT,
  openrouter_model TEXT DEFAULT 'nvidia/nemotron-ultra-253b-v1:free',
  theme_accent TEXT DEFAULT 'cyan',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS interviews (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT,
  persona TEXT,
  status TEXT NOT NULL DEFAULT 'in_progress', -- 'in_progress' | 'completed'
  canvas_state TEXT, -- JSON { nodes, edges }
  template_id TEXT REFERENCES templates(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_interviews_user_id ON interviews(user_id);
CREATE INDEX IF NOT EXISTS idx_interviews_status ON interviews(status);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  interview_id TEXT NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
  role TEXT NOT NULL, -- 'system' | 'assistant' | 'user'
  content TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_messages_interview_id ON messages(interview_id);

CREATE TABLE IF NOT EXISTS outputs (
  id TEXT PRIMARY KEY,
  interview_id TEXT NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'prd' | 'summary' | 'roadmap' | 'techstack' | 'all'
  content TEXT NOT NULL,
  shared INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_outputs_interview_id ON outputs(interview_id);
CREATE INDEX IF NOT EXISTS idx_outputs_user_id ON outputs(user_id);

CREATE TABLE IF NOT EXISTS kanban_items (
  id TEXT PRIMARY KEY,
  interview_id TEXT NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo', -- 'todo' | 'in_progress' | 'done'
  position INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_kanban_interview_id ON kanban_items(interview_id);
CREATE INDEX IF NOT EXISTS idx_kanban_user_id ON kanban_items(user_id);

CREATE TABLE IF NOT EXISTS templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  owner_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  is_fork INTEGER NOT NULL DEFAULT 0,
  checklists_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_templates_owner_id ON templates(owner_id);

-- Insert the 4 base system templates
-- We use INSERT OR REPLACE to update them if they exist
INSERT OR REPLACE INTO templates (id, name, type, owner_id, is_fork, checklists_json) VALUES 
('system-saas', 'SaaS', 'saas', NULL, 0, '{"problem":["specific_pain_described","frequency_severity_noted","current_workaround_named","willingness_to_pay_indicated"],"users":["target_user_defined","user_segment_size_estimated","decision_maker_identified","user_acquisition_channel_hinted"],"features":["core_value_prop_stated","differentiation_named","mvp_scope_bounded","retention_mechanic_described"],"tech":["tech_stack_preference_stated","scalability_needs_noted","integration_requirements_listed","team_skills_assessed"],"monetization":["pricing_model_proposed","ltv_cac_logic_sketched","payment_infra_mentioned","expansion_revenue_idea"],"constraints":["timeline_stated","budget_range_given","team_size_noted","regulatory_concerns_flagged"]}'),
('system-consumer', 'Consumer App', 'consumer', NULL, 0, '{"problem":["specific_pain_described","frequency_severity_noted","current_workaround_named","emotional_hook_identified"],"users":["target_user_defined","user_segment_size_estimated","behavior_pattern_described","viral_loop_potential"],"features":["core_value_prop_stated","differentiation_named","mvp_scope_bounded","habit_formation_mechanic"],"tech":["tech_stack_preference_stated","platform_targets_listed","offline_needs_noted","privacy_concerns_flagged"],"monetization":["pricing_model_proposed","ltv_cac_logic_sketched","payment_infra_mentioned","network_effects_described"],"constraints":["timeline_stated","budget_range_given","team_size_noted","app_store_policy_awareness"]}'),
('system-marketplace', 'Marketplace', 'marketplace', NULL, 0, '{"problem":["supply_pain_described","demand_pain_described","frequency_severity_noted","current_workaround_named"],"users":["supply_side_defined","demand_side_defined","chicken_egg_strategy_hinted","trust_mechanism_needed"],"features":["core_value_prop_stated","matching_logic_described","mvp_scope_bounded","liquidity_mechanic"],"tech":["tech_stack_preference_stated","real_time_needs_noted","payment_split_requirements","search_discovery_scope"],"monetization":["take_rate_proposed","supply_acquisition_cost","demand_acquisition_cost","network_effects_described"],"constraints":["timeline_stated","budget_range_given","team_size_noted","regulatory_concerns_flagged"]}'),
('system-internal', 'Internal Tool', 'internal', NULL, 0, '{"problem":["specific_pain_described","frequency_severity_noted","current_workaround_named","stakeholder_pain_confirmed"],"users":["internal_user_roles_defined","decision_maker_identified","adoption_barriers_noted","training_needs"],"features":["core_value_prop_stated","integration_points_listed","mvp_scope_bounded","compliance_requirements"],"tech":["tech_stack_preference_stated","existing_infra_constraints","security_requirements","data_migration_scope"],"monetization":["build_vs_buy_rationale","roi_estimate","cost_savings_calculated","maintenance_owner_named"],"constraints":["timeline_stated","budget_range_given","team_size_noted","approval_process_described"]}');
