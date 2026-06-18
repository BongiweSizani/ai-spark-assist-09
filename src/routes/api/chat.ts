import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import type { Database } from "@/integrations/supabase/types";

const SYSTEM_PROMPT = `You are "Atlas", an AI workplace productivity assistant for professionals.

Style:
- Clear, concise, and professional. Use Markdown when it improves readability.
- Prefer structured answers (short paragraphs, bullets, tables) for complex topics.
- When asked to draft (emails, briefs, plans), produce the artifact directly without preamble.
- If you don't know something, say so plainly.
- All output may require human review before use.`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const authHeader = request.headers.get("authorization");
        const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
        if (!token) return new Response("Unauthorized", { status: 401 });

        const url = process.env.SUPABASE_URL;
        const publishable = process.env.SUPABASE_PUBLISHABLE_KEY;
        const apiKey = process.env.LOVABLE_API_KEY;
        if (!url || !publishable) return new Response("Backend not configured", { status: 500 });
        if (!apiKey) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const supabase = createClient<Database>(url, publishable, {
          global: { headers: { Authorization: `Bearer ${token}` } },
          auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
        });
        const { data: userData, error: userErr } = await supabase.auth.getUser(token);
        if (userErr || !userData.user) return new Response("Unauthorized", { status: 401 });
        const userId = userData.user.id;

        const body = (await request.json()) as { messages?: UIMessage[]; id?: string };
        const messages = body.messages ?? [];
        const threadId = body.id;
        if (!Array.isArray(messages) || !threadId) {
          return new Response("Bad request", { status: 400 });
        }

        // Verify thread ownership
        const { data: thread, error: threadErr } = await supabase
          .from("chat_threads")
          .select("id,user_id,title")
          .eq("id", threadId)
          .maybeSingle();
        if (threadErr || !thread || thread.user_id !== userId) {
          return new Response("Forbidden", { status: 403 });
        }

        // Persist the latest user message (last in array, if role user)
        const last = messages[messages.length - 1];
        if (last && last.role === "user") {
          await supabase.from("chat_messages").insert({
            thread_id: threadId,
            user_id: userId,
            role: "user",
            parts: last.parts as unknown as Database["public"]["Tables"]["chat_messages"]["Insert"]["parts"],
          });

          // Auto-title on first user message
          if (thread.title === "New chat") {
            const text = last.parts
              .map((p) => (p.type === "text" ? p.text : ""))
              .join(" ")
              .trim()
              .slice(0, 60);
            if (text) {
              await supabase.from("chat_threads").update({ title: text }).eq("id", threadId);
            }
          }
        }

        const gateway = createLovableAiGatewayProvider(apiKey);
        const result = streamText({
          model: gateway("google/gemini-3-flash-preview"),
          system: SYSTEM_PROMPT,
          messages: await convertToModelMessages(messages),
        });

        return result.toUIMessageStreamResponse({
          originalMessages: messages,
          onFinish: async ({ messages: finalMessages }) => {
            const assistant = finalMessages[finalMessages.length - 1];
            if (assistant && assistant.role === "assistant") {
              await supabase.from("chat_messages").insert({
                thread_id: threadId,
                user_id: userId,
                role: "assistant",
                parts: assistant.parts as unknown as Database["public"]["Tables"]["chat_messages"]["Insert"]["parts"],
              });
            }
          },
        });
      },
    },
  },
});
