import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const MODEL = "google/gemini-3-flash-preview";

const Input = z.object({
  projectName: z.string().min(1),
  oneLiner: z.string().min(1),
  audience: z.string().min(1),
  problem: z.string().optional().default(""),
  solution: z.string().optional().default(""),
  notes: z.string().optional().default(""),
  slideCount: z.number().int().min(6).max(12).default(8),
});

const DeckSchema = z.object({
  title: z.string(),
  subtitle: z.string(),
  slides: z
    .array(
      z.object({
        title: z.string(),
        bullets: z.array(z.string()).min(2).max(6),
        speakerNotes: z.string().optional().default(""),
      }),
    )
    .min(4)
    .max(11),
  closing: z.object({
    headline: z.string(),
    cta: z.string(),
  }),
});

async function generateDeckPlan(input: z.infer<typeof Input>) {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("Missing LOVABLE_API_KEY");
  const { generateText } = await import("ai");
  const { createLovableAiGatewayProvider } = await import("./ai-gateway.server");
  const gateway = createLovableAiGatewayProvider(key);

  const system = `You are a senior pitch deck strategist. Produce a compelling, investor/stakeholder-ready slide outline.

Return STRICT JSON only — no prose, no markdown fences. Shape:
{
  "title": string,
  "subtitle": string,
  "slides": [
    { "title": string, "bullets": string[3..5], "speakerNotes": string }
  ],
  "closing": { "headline": string, "cta": string }
}

Rules:
- Total interior slides (between title and closing): ${input.slideCount - 2}.
- Slides MUST follow a strong narrative: Problem → Solution → How it works → Key Features → Market/Impact → Why now → Roadmap → Ask.
- Bullets: punchy, max ~14 words, no trailing periods.
- speakerNotes: 1-2 sentences of presenter guidance.
- Do not invent statistics; keep claims general or qualitative.`;

  const prompt = `Project: ${input.projectName}
One-liner: ${input.oneLiner}
Audience: ${input.audience}
Problem: ${input.problem || "(infer)"}
Solution: ${input.solution || "(infer)"}
Extra context: ${input.notes || "(none)"}`;

  const { text } = await generateText({
    model: gateway(MODEL),
    system,
    prompt,
  });

  // Strip code fences if any
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    // Try to extract first JSON object
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("AI did not return JSON");
    parsed = JSON.parse(match[0]);
  }
  return DeckSchema.parse(parsed);
}

async function buildPptx(plan: z.infer<typeof DeckSchema>, projectName: string) {
  const PptxGenJSMod = await import("pptxgenjs");
  const PptxGenJS = (PptxGenJSMod as any).default ?? PptxGenJSMod;
  const pres = new PptxGenJS();

  pres.layout = "LAYOUT_WIDE"; // 13.33 x 7.5
  pres.title = projectName;

  const COLORS = {
    bgDark: "0B1020",
    bgPanel: "111A33",
    primary: "7C9CFF",
    accent: "9D7BFF",
    text: "F4F6FB",
    muted: "9AA3BD",
  };

  // Title slide
  const t = pres.addSlide();
  t.background = { color: COLORS.bgDark };
  t.addShape(pres.ShapeType.rect, {
    x: 0, y: 6.6, w: 13.33, h: 0.08, fill: { color: COLORS.primary }, line: { color: COLORS.primary },
  });
  t.addText(plan.title, {
    x: 0.7, y: 2.6, w: 12, h: 1.6,
    fontSize: 54, bold: true, color: COLORS.text, fontFace: "Calibri",
  });
  t.addText(plan.subtitle, {
    x: 0.7, y: 4.2, w: 12, h: 0.8,
    fontSize: 22, color: COLORS.primary, fontFace: "Calibri",
  });
  t.addText("AI-generated content may require human review.", {
    x: 0.7, y: 6.9, w: 12, h: 0.4, fontSize: 10, color: COLORS.muted, italic: true,
  });

  // Content slides
  plan.slides.forEach((s, i) => {
    const slide = pres.addSlide();
    slide.background = { color: COLORS.bgDark };

    // Side accent bar
    slide.addShape(pres.ShapeType.rect, {
      x: 0, y: 0, w: 0.25, h: 7.5, fill: { color: COLORS.accent }, line: { color: COLORS.accent },
    });

    // Slide number
    slide.addText(String(i + 1).padStart(2, "0"), {
      x: 0.6, y: 0.35, w: 1, h: 0.4, fontSize: 12, color: COLORS.muted, fontFace: "Calibri",
    });

    // Title
    slide.addText(s.title, {
      x: 0.6, y: 0.8, w: 12, h: 1.0,
      fontSize: 36, bold: true, color: COLORS.text, fontFace: "Calibri",
    });

    // Underline
    slide.addShape(pres.ShapeType.rect, {
      x: 0.6, y: 1.85, w: 0.8, h: 0.06, fill: { color: COLORS.primary }, line: { color: COLORS.primary },
    });

    // Bullets
    slide.addText(
      s.bullets.map((b) => ({ text: b, options: { bullet: { code: "25CF" }, color: COLORS.text } })),
      {
        x: 0.7, y: 2.3, w: 11.9, h: 4.4,
        fontSize: 20, fontFace: "Calibri", paraSpaceAfter: 12, valign: "top",
      },
    );

    // Footer
    slide.addText(projectName, {
      x: 0.6, y: 7.0, w: 8, h: 0.35, fontSize: 10, color: COLORS.muted, fontFace: "Calibri",
    });
    slide.addText("AI-generated · review before sharing", {
      x: 8.5, y: 7.0, w: 4.5, h: 0.35, fontSize: 10, color: COLORS.muted, align: "right", italic: true,
    });

    if (s.speakerNotes) slide.addNotes(s.speakerNotes);
  });

  // Closing
  const c = pres.addSlide();
  c.background = { color: COLORS.bgDark };
  c.addShape(pres.ShapeType.rect, {
    x: 0, y: 0, w: 13.33, h: 0.08, fill: { color: COLORS.accent }, line: { color: COLORS.accent },
  });
  c.addText(plan.closing.headline, {
    x: 0.7, y: 2.6, w: 12, h: 1.6,
    fontSize: 48, bold: true, color: COLORS.text, fontFace: "Calibri",
  });
  c.addText(plan.closing.cta, {
    x: 0.7, y: 4.4, w: 12, h: 0.8,
    fontSize: 22, color: COLORS.primary, fontFace: "Calibri",
  });

  const base64 = (await pres.write({ outputType: "base64" })) as string;
  return base64;
}

export const generatePitchDeck = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data }) => {
    const plan = await generateDeckPlan(data);
    const base64 = await buildPptx(plan, data.projectName);
    const safeName = data.projectName.replace(/[^a-z0-9-_]+/gi, "_").slice(0, 60) || "pitch_deck";
    return {
      filename: `${safeName}_pitch_deck.pptx`,
      base64,
      slideCount: plan.slides.length + 2,
    };
  });
