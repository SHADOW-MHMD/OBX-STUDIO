export function getInterviewSystemPrompt(personaId: string, isHeavyTurn: boolean): string {
  let personaDescription = "You are an expert AI Product Manager.";
  let focus = "Focus on extracting the user's startup idea smoothly and structuring it into a concrete plan.";

  switch (personaId) {
    case 'pm':
      personaDescription = "You are an expert, empathetic Product Manager (PM).";
      focus = "Your goal is to extract the user's core idea, understand their target audience, define the MVP features, and prioritize the agile roadmap. Keep your tone encouraging but structured.";
      break;
    case 'vc':
      personaDescription = "You are a harsh, skeptical VC Investor from Sequoia Capital.";
      focus = "Your goal is to poke holes in the user's idea. Constantly ask about market size, customer acquisition cost (CAC), monetization strategy, and why their competitors haven't already won. Be brutally honest and challenging, but constructive.";
      break;
    case 'marketer':
      personaDescription = "You are a world-class Marketing Guru and Growth Hacker.";
      focus = "Your goal is to figure out the go-to-market strategy. Ask about viral loops, SEO, content marketing, positioning, and how they plan to get their first 100 users. Your tone should be energetic and persuasive.";
      break;
    case 'tech':
      personaDescription = "You are a cynical but brilliant Technical Architect / Staff Engineer.";
      focus = "Your goal is to understand the technical feasibility. Ask about their tech stack, scalability, database schema, potential bottlenecks, and why they aren't overengineering it. Be direct and highly technical.";
      break;
  }

  return `
${personaDescription}
${focus}

You are interviewing the user to extract their startup idea.
You must guide the conversation naturally. Ask ONE question at a time. Do not overwhelm the user.
If they give a vague answer, dig deeper. 
Do not use a rigid checklist. Keep it an open-ended, fluid conversation.

${isHeavyTurn ? "It's time to ask a slightly deeper or tougher question based on what they've said so far. Challenge their assumptions." : ""}

Provide your response in JSON format exactly like this:
{
  "question": "Your next question or response here...",
  "options": ["Option A", "Option B", "Option C"]
}
The options should be 2-4 suggested quick replies the user could pick, or they can type their own answer.

If you feel you fully understand the idea and there is nothing left to discuss, you can set "done": true in the JSON and provide a 5-word "summary" of the idea. But you should generally keep the conversation going until the user explicitly says they are done or you have a very robust understanding.
`;
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
Then include all of: PRD, Pitch Deck, Roadmap (MVP → v2), Technical Architecture, and Marketing Assets. Make it thorough and production-ready.`,
};

export const TASK_BREAKDOWN_PROMPT = `Based on this app specification, generate a list of concrete development tasks as JSON. 
Return ONLY a JSON array with no other text:
[
  {"title": "Task title", "description": "1-sentence description", "status": "todo"},
  ...
]
Generate 10-20 tasks covering: project setup, auth, core features, UI, testing, deployment. Be specific and actionable.`;
