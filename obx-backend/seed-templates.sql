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

-- SQLite ADD COLUMN for interviews table (safe to fail if already exists)
ALTER TABLE interviews ADD COLUMN template_id TEXT REFERENCES templates(id);

-- Insert the 4 base system templates
-- We use INSERT OR REPLACE to update them if they exist
INSERT OR REPLACE INTO templates (id, name, type, owner_id, is_fork, checklists_json) VALUES 
('system-saas', 'SaaS', 'saas', NULL, 0, '{"problem":["specific_pain_described","frequency_severity_noted","current_workaround_named","willingness_to_pay_indicated"],"users":["target_user_defined","user_segment_size_estimated","decision_maker_identified","user_acquisition_channel_hinted"],"features":["core_value_prop_stated","differentiation_named","mvp_scope_bounded","retention_mechanic_described"],"tech":["tech_stack_preference_stated","scalability_needs_noted","integration_requirements_listed","team_skills_assessed"],"monetization":["pricing_model_proposed","ltv_cac_logic_sketched","payment_infra_mentioned","expansion_revenue_idea"],"constraints":["timeline_stated","budget_range_given","team_size_noted","regulatory_concerns_flagged"]}'),
('system-consumer', 'Consumer App', 'consumer', NULL, 0, '{"problem":["specific_pain_described","frequency_severity_noted","current_workaround_named","emotional_hook_identified"],"users":["target_user_defined","user_segment_size_estimated","behavior_pattern_described","viral_loop_potential"],"features":["core_value_prop_stated","differentiation_named","mvp_scope_bounded","habit_formation_mechanic"],"tech":["tech_stack_preference_stated","platform_targets_listed","offline_needs_noted","privacy_concerns_flagged"],"monetization":["pricing_model_proposed","ltv_cac_logic_sketched","payment_infra_mentioned","network_effects_described"],"constraints":["timeline_stated","budget_range_given","team_size_noted","app_store_policy_awareness"]}'),
('system-marketplace', 'Marketplace', 'marketplace', NULL, 0, '{"problem":["supply_pain_described","demand_pain_described","frequency_severity_noted","current_workaround_named"],"users":["supply_side_defined","demand_side_defined","chicken_egg_strategy_hinted","trust_mechanism_needed"],"features":["core_value_prop_stated","matching_logic_described","mvp_scope_bounded","liquidity_mechanic"],"tech":["tech_stack_preference_stated","real_time_needs_noted","payment_split_requirements","search_discovery_scope"],"monetization":["take_rate_proposed","supply_acquisition_cost","demand_acquisition_cost","network_effects_described"],"constraints":["timeline_stated","budget_range_given","team_size_noted","regulatory_concerns_flagged"]}'),
('system-internal', 'Internal Tool', 'internal', NULL, 0, '{"problem":["specific_pain_described","frequency_severity_noted","current_workaround_named","stakeholder_pain_confirmed"],"users":["internal_user_roles_defined","decision_maker_identified","adoption_barriers_noted","training_needs"],"features":["core_value_prop_stated","integration_points_listed","mvp_scope_bounded","compliance_requirements"],"tech":["tech_stack_preference_stated","existing_infra_constraints","security_requirements","data_migration_scope"],"monetization":["build_vs_buy_rationale","roi_estimate","cost_savings_calculated","maintenance_owner_named"],"constraints":["timeline_stated","budget_range_given","team_size_noted","approval_process_described"]}');
