import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const MODEL = "google/gemini-3-flash-preview";

async function runPrompt(system: string, prompt: string): Promise<string> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("Missing LOVABLE_API_KEY");
  const { generateText } = await import("ai");
  const { createLovableAiGatewayProvider } = await import("./ai-gateway.server");
  const gateway = createLovableAiGatewayProvider(key);
  const { text } = await generateText({
    model: gateway(MODEL),
    system,
    prompt,
  });
  return text;
}

// ---------- Email Generator ----------
const EmailInput = z.object({
  purpose: z.string().min(1),
  audience: z.string().min(1),
  tone: z.enum(["Professional", "Friendly", "Persuasive", "Apologetic", "Direct", "Enthusiastic"]),
  keyPoints: z.string().optional().default(""),
});

export const generateEmail = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => EmailInput.parse(d))
  .handler(async ({ data }) => {
    const system = `You are an expert business communication writer. Produce a complete, ready-to-send email.

Rules:
- Output ONLY the email (Subject + body). No preamble, no explanation.
- Start with "Subject: <subject>" on the first line.
- Use the requested tone consistently.
- Be specific, concise, and professional.
- Use natural paragraphs, not bullet lists unless they aid clarity.
- Sign off with "[Your name]".`;

    const prompt = `Audience: ${data.audience}
Tone: ${data.tone}
Purpose: ${data.purpose}
Key points to include: ${data.keyPoints || "(none specified, infer)"}`;

    return { content: await runPrompt(system, prompt) };
  });

// ---------- Meeting Notes Summarizer ----------
const NotesInput = z.object({ notes: z.string().min(20) });

export const summarizeMeeting = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => NotesInput.parse(d))
  .handler(async ({ data }) => {
    const system = `You are a meeting-notes analyst. Summarize the provided notes into a clean, scannable brief.

Return Markdown with exactly these sections, in this order:
## Executive Summary
2-3 sentence overview.

## Key Discussion Points
- Bullet points of substantive items discussed.

## Decisions
- Concrete decisions made.

## Action Items
- [Owner] Action — Deadline (if mentioned, else "TBD")

## Open Questions
- Unresolved items needing follow-up.

If a section has no content, write "_None identified._" under it.`;
    return { content: await runPrompt(system, data.notes) };
  });

// ---------- Task Planner ----------
const PlannerInput = z.object({
  tasks: z.string().min(5),
  horizon: z.enum(["Today", "This week", "This sprint (2 weeks)"]),
});

export const planTasks = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => PlannerInput.parse(d))
  .handler(async ({ data }) => {
    const system = `You are a productivity coach using the Eisenhower matrix and time-blocking.

Given a raw list of tasks and a planning horizon, return Markdown with:

## Prioritized Plan (${data.horizon})
A short paragraph explaining your prioritization approach.

## P1 — Do First (Urgent + Important)
- Task — estimated time — suggested block

## P2 — Schedule (Important, Not Urgent)
- Task — estimated time — suggested block

## P3 — Delegate / Batch (Urgent, Not Important)
- Task — note

## P4 — Eliminate or Defer
- Task — reason

## Suggested Schedule
A clean time-blocked schedule for the horizon (e.g. Mon 9:00-10:30 — Task X).

Be realistic about cognitive load. Group similar work.`;
    return { content: await runPrompt(system, data.tasks) };
  });

// ---------- Research Assistant ----------
const ResearchInput = z.object({ topic: z.string().min(3) });

export const researchTopic = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => ResearchInput.parse(d))
  .handler(async ({ data }) => {
    const system = `You are a senior research analyst. Produce a structured briefing on the given topic.

Return Markdown with:
## TL;DR
3 sentence bottom-line insight.

## Background
Core context a busy professional needs.

## Key Insights
- 4-6 sharp, non-obvious insights.

## Considerations & Risks
- Trade-offs, caveats, or risks.

## Recommended Next Steps
- 3-5 concrete actions.

## Suggested Further Reading
- Topical search queries or canonical sources (mark clearly that these are suggestions, not verified URLs).

Be objective. If something is uncertain, say so.`;
    return { content: await runPrompt(system, `Topic: ${data.topic}`) };
  });
