export function getInterviewSystemPrompt(templateChecklistsJson: string, isHeavyTurn: boolean): string {
  const base = `You are an expert product manager and startup advisor at OBX-STUDIO. Your job is to interview users about their app idea and extract all the information needed to write a comprehensive product specification.

You ask ONE question at a time. Each question must:
1. Be specific, clear, and directly build on previous answers
2. Come with 3-5 multiple choice options that are realistic and diverse
3. Always allow for a free-text answer in addition to the options

Here are the strict coverage checklists you must satisfy for this specific project type:
${templateChecklistsJson}

Rules:
- Start with the big picture (what does the app do, who is it for)
- Then round-robin across the 6 dimensions to ensure all checklist items are met before deepening.
- CRITICAL: If the user gives very short, low-effort, or vague answers, push back gracefully.
- When you have enough information and ALL checklist items are met, respond with ONLY this JSON to signal completion:
{
  "done": true,
  "summary": "2-3 sentence summary of the idea"
}
Do NOT ask redundant questions. Be conversational but sharp.`;

  if (isHeavyTurn) {
    return `${base}

Format EVERY response as valid JSON with this exact shape:
{
  "coverage_evaluation": {
    "problem": { "checklist_items_met": ["item1"], "depth_score": 0, "gaps": ["gap1"] },
    "users": { "checklist_items_met": [], "depth_score": 0, "gaps": [] },
    "features": { "checklist_items_met": [], "depth_score": 0, "gaps": [] },
    "tech": { "checklist_items_met": [], "depth_score": 0, "gaps": [] },
    "monetization": { "checklist_items_met": [], "depth_score": 0, "gaps": [] },
    "constraints": { "checklist_items_met": [], "depth_score": 0, "gaps": [] }
  },
  "question": "Your targeted follow-up question here to fill a specific gap",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "context": "Brief note about why this question matters"
}
Do NOT add any text outside the JSON. Ensure it is perfectly formatted.`;
  }

  return `${base}

Format EVERY response as valid JSON with this exact shape:
{
  "question": "Your question here",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "context": "Brief note about why this question matters"
}
Do NOT add any text outside the JSON. Ensure it is perfectly formatted.`;
}

export const OUTPUT_PROMPTS: Record<string, string> = {
  prd: `Based on the interview, write a comprehensive Product Requirements Document (PRD) in markdown. Include:
# Product Requirements Document
## Executive Summary
## Problem Statement
## Target Users & Personas
## Core Features (with priority: P0/P1/P2)
## User Stories
## Technical Requirements
## Success Metrics
## Out of Scope (MVP)`,

  summary: `Based on the interview, write a concise bullet-point summary of the app idea in markdown. Include:
# App Idea Summary
## What It Does (2-3 sentences)
## Who It's For
## Core Features
## Tech Stack
## MVP Scope`,

  roadmap: `Based on the interview, write a phased roadmap in markdown. Include:
# Product Roadmap
## MVP (Week 1-4)
## v1.0 (Month 2-3)
## v2.0 (Month 4-6)
## Future Vision
Each phase: list features, success criteria, key risks.`,

  techstack: `Based on the interview, write a technical architecture plan in markdown. Include:
# Technical Architecture
## Recommended Stack (with justification)
## System Architecture Diagram (ASCII)
## Database Schema
## API Design
## Deployment Strategy
## Key Technical Risks & Mitigations`,

  all: `Based on the interview, write a COMPLETE specification document in markdown combining ALL sections:
# OBX-STUDIO — Complete App Specification
Then include all of: PRD, Summary, Roadmap (MVP → v2), and Technical Architecture. Make it thorough and production-ready.`,
};

export const TASK_BREAKDOWN_PROMPT = `Based on this app specification, generate a list of concrete development tasks as JSON. 
Return ONLY a JSON array with no other text:
[
  {"title": "Task title", "description": "1-sentence description", "status": "todo"},
  ...
]
Generate 10-20 tasks covering: project setup, auth, core features, UI, testing, deployment. Be specific and actionable.`;
