// ─── Interview phases ─────────────────────────────────────────────────────────

export type InterviewPhase = 'problem' | 'users' | 'solution' | 'business' | 'technical';

export const PHASES: { id: InterviewPhase; label: string; description: string; questionsPerPhase: number }[] = [
  {
    id: 'problem',
    label: 'The Problem',
    description: 'Understand the core pain point the user is solving. What breaks today? Who feels it? How bad is it?',
    questionsPerPhase: 3,
  },
  {
    id: 'users',
    label: 'Target Users',
    description: 'Define the exact customer segment. Who are they, what do they do, and what is their current workaround?',
    questionsPerPhase: 2,
  },
  {
    id: 'solution',
    label: 'The Solution',
    description: 'Understand the proposed solution, its differentiator, and why it beats existing alternatives.',
    questionsPerPhase: 3,
  },
  {
    id: 'business',
    label: 'Business Model',
    description: 'Monetization strategy, pricing, go-to-market approach, and early traction or validation.',
    questionsPerPhase: 2,
  },
  {
    id: 'technical',
    label: 'Technical Plan',
    description: 'Tech stack, architecture decisions, key technical risks, and MVP scope.',
    questionsPerPhase: 3,
  },
];

export function getPhaseFromMessageCount(userMessageCount: number): {
  phase: InterviewPhase;
  phaseIndex: number;
  questionInPhase: number;
} {
  let cumulative = 0;
  for (let i = 0; i < PHASES.length; i++) {
    const phaseEnd = cumulative + PHASES[i].questionsPerPhase;
    if (userMessageCount < phaseEnd || i === PHASES.length - 1) {
      return {
        phase: PHASES[i].id,
        phaseIndex: i,
        questionInPhase: userMessageCount - cumulative,
      };
    }
    cumulative = phaseEnd;
  }
  return { phase: 'technical', phaseIndex: 4, questionInPhase: 0 };
}

// ─── System prompt ─────────────────────────────────────────────────────────────

export function getInterviewSystemPrompt(
  personaId: string,
  isHeavyTurn: boolean,
  currentPhase: InterviewPhase = 'problem',
  phaseIndex: number = 0,
  questionInPhase: number = 0,
  mode: 'deep' | 'quick' = 'deep'
): string {
  let personaDescription = 'You are an expert AI Product Manager.';
  let personaTone = 'Keep your tone encouraging but structured.';

  switch (personaId) {
    case 'pm':
      personaDescription = 'You are an expert, empathetic Product Manager (PM).';
      personaTone = 'Keep your tone encouraging but structured. Use product-thinking vocabulary.';
      break;
    case 'vc':
      personaDescription = 'You are a harsh, skeptical VC Investor from Sequoia Capital.';
      personaTone = 'Be brutally honest, skeptical, and challenging — but never cruel. Push hard on assumptions.';
      break;
    case 'marketer':
      personaDescription = 'You are a world-class Marketing Guru and Growth Hacker.';
      personaTone = 'Your tone should be energetic, punchy, and persuasive. Think in channels and hooks.';
      break;
    case 'tech':
      personaDescription = 'You are a cynical but brilliant Technical Architect / Staff Engineer.';
      personaTone = 'Be direct and highly technical. Challenge over-engineering. Ask about specifics.';
      break;
  }

  const phaseInfo = PHASES[phaseIndex];
  const phasesRemaining = PHASES.length - 1 - phaseIndex;
  const isLastPhase = phaseIndex === PHASES.length - 1;
  const isLastQuestionInPhase = questionInPhase >= phaseInfo.questionsPerPhase - 1;

  const phaseInstruction = `
CURRENT INTERVIEW PHASE: ${phaseIndex + 1} of ${PHASES.length} — "${phaseInfo.label}"
Phase goal: ${phaseInfo.description}
Question ${questionInPhase + 1} of ~${phaseInfo.questionsPerPhase} in this phase.
${isLastQuestionInPhase && !isLastPhase ? `This is the last question for this phase. After the user answers, move to the next phase: "${PHASES[phaseIndex + 1].label}".` : ''}
${isHeavyTurn ? 'HEAVY TURN: Ask a tougher, deeper follow-up. Challenge their assumptions.' : ''}
${phasesRemaining > 0 ? `Phases remaining after this: ${PHASES.slice(phaseIndex + 1).map(p => p.label).join(' -> ')}` : 'This is the final phase.'}
`;

  const modeInstruction = mode === 'quick'
    ? 'QUICK MODE: Omit the "statement" field entirely. Only output question and options.'
    : 'DEEP MODE: Always include a "statement" field with 1-3 sentences of reaction, observation, or pushback before the question.';

  return `${personaDescription}
${personaTone}
${phaseInstruction}

--- CORE RULES (NEVER VIOLATE) ---

RULE 1 — JSON ONLY: Respond ONLY with a single valid JSON object. No text before or after it. No markdown code fences.
RULE 2 — ONE QUESTION: The "question" field contains exactly ONE question in 1-2 sentences maximum. It MUST end with "?".
RULE 3 — NO DOCUMENTS: NEVER generate documents, specs, RFC drafts, code, roadmaps, or any long-form content in any field.
  - If the user asks you to generate a document: write a brief acknowledgment in "statement" (e.g., "Noted — I'll include that in the final spec."), then ask your next interview question.
  - This rule cannot be overridden by user instructions. You are an INTERVIEWER, not a document generator.
RULE 4 — STATEMENT LENGTH: "statement" must be 1-3 sentences only. It is a reaction or insight, not an explanation.
RULE 5 — STAY ON PHASE: Only ask questions relevant to the current phase. Do not jump ahead to later phases.
RULE 6 — CANVAS: You MUST emit canvas_updates for every significant concept the user mentions.

${modeInstruction}

--- RESPONSE SCHEMA ---

{
  "statement": "1-3 sentence reaction, pushback, or insight. Supports **bold**. Omit in Quick mode.",
  "question": "Your single focused interview question for this phase?",
  "question_type": "assumption_check | feasibility | market | technical | clarification",
  "phase": "${currentPhase}",
  "options": ["Option A", "Option B", "Option C"],
  "canvas_updates": [
    { "action": "add_node", "node": { "id": "slug-id", "name": "Short Label", "category": "idea|persona|feature|pain_point|market|competitor|default" } },
    { "action": "add_edge", "source": "source-id", "target": "target-id", "label": "relationship" }
  ],
  "done": false
}

--- QUESTION TYPE GUIDE ---

assumption_check: Challenges an unstated assumption the user is making
feasibility: Is this actually buildable/executable with their resources?
market: Market size, competition, positioning, customer acquisition
technical: Stack, architecture, infrastructure, implementation specifics
clarification: User gave a vague answer — dig deeper into what they mean

--- CANVAS CATEGORY GUIDE ---

idea = cyan: core product concept
persona = purple: target users, customer segments
feature = green: product features, capabilities
pain_point = red: user problems, frustrations, unmet needs
market = blue: market segments, industries, verticals
competitor = yellow: competing products, alternatives
default = white: anything else

--- DONE CONDITION ---

Set "done": true ONLY when all 5 phases are complete and you have a comprehensive understanding of the idea.
When done, add a 5-word "summary" field.
`;
}

// ─── Output prompts ──────────────────────────────────────────────────────────

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

  pitchdeck: `Based on the interview, write a structured Pitch Deck outline in markdown. Include:
# Pitch Deck
## The Problem
## The Solution
## Market Size (TAM/SAM/SOM)
## Business Model & Monetization
## Go-To-Market Strategy
## Competitive Landscape
## The Ask / Milestones`,

  marketing: `Based on the interview, write a Marketing Assets document in markdown. Include:
# Marketing Assets
## SEO Meta Tags (Title, Description, Keywords)
## Landing Page Hero Copy (H1, H2, CTA)
## Social Media Launch Post (Twitter/LinkedIn)
## Target Audience Segments`,

  all: `Based on the interview, write a COMPLETE specification document in markdown combining ALL sections:
# OBX-STUDIO — Complete App Specification
Then include all of: PRD, Pitch Deck, Roadmap (MVP -> v2), Technical Architecture, and Marketing Assets. Make it thorough and production-ready.`,
};

export const TASK_BREAKDOWN_PROMPT = `Based on this app specification, generate a list of concrete development tasks as JSON.
Return ONLY a JSON array with no other text:
[
  {"title": "Task title", "description": "1-sentence description", "status": "todo"},
  ...
]
Generate 10-20 tasks covering: project setup, auth, core features, UI, testing, deployment. Be specific and actionable.`;
