import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import ReactMarkdown from "react-markdown";
import {
  listThreads,
  createThread,
  deleteThread,
  getThreadMessages,
} from "@/lib/chat-threads.functions";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, SendHorizonal, Loader2, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/chat/$threadId")({
  head: () => ({ meta: [{ title: "AI Chat — Atlas" }] }),
  component: ChatThreadPage,
});

function ChatThreadPage() {
  const { threadId } = useParams({ from: "/_authenticated/chat/$threadId" });
  const navigate = useNavigate();
  const qc = useQueryClient();
  const listFn = useServerFn(listThreads);
  const createFn = useServerFn(createThread);
  const deleteFn = useServerFn(deleteThread);
  const getMessages = useServerFn(getThreadMessages);

  const threadsQuery = useQuery({ queryKey: ["chat-threads"], queryFn: () => listFn() });
  const messagesQuery = useQuery({
    queryKey: ["chat-messages", threadId],
    queryFn: () => getMessages({ data: { threadId } }),
  });

  const [token, setToken] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setToken(data.session?.access_token ?? null));
  }, []);

  if (!token || messagesQuery.isLoading) {
    return (
      <div className="grid h-[calc(100vh-3.5rem)] place-items-center text-sm text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  return (
    <ChatLayout
      key={threadId}
      threadId={threadId}
      token={token}
      initialMessages={(messagesQuery.data ?? []) as unknown as UIMessage[]}
      threads={threadsQuery.data ?? []}
      onNewThread={async () => {
        const t = await createFn({ data: {} });
        await qc.invalidateQueries({ queryKey: ["chat-threads"] });
        navigate({ to: "/chat/$threadId", params: { threadId: t.id } });
      }}
      onDeleteThread={async (id) => {
        await deleteFn({ data: { id } });
        await qc.invalidateQueries({ queryKey: ["chat-threads"] });
        if (id === threadId) {
          const remaining = (threadsQuery.data ?? []).filter((t) => t.id !== id);
          if (remaining[0]) {
            navigate({ to: "/chat/$threadId", params: { threadId: remaining[0].id } });
          } else {
            navigate({ to: "/chat" });
          }
        }
      }}
      onMessageSaved={() => qc.invalidateQueries({ queryKey: ["chat-threads"] })}
    />
  );
}

type Thread = { id: string; title: string; updated_at: string };

function ChatLayout({
  threadId,
  token,
  initialMessages,
  threads,
  onNewThread,
  onDeleteThread,
  onMessageSaved,
}: {
  threadId: string;
  token: string;
  initialMessages: UIMessage[];
  threads: Thread[];
  onNewThread: () => void;
  onDeleteThread: (id: string) => void;
  onMessageSaved: () => void;
}) {
  const transport = useRef(
    new DefaultChatTransport({
      api: "/api/chat",
      headers: { Authorization: `Bearer ${token}` },
    }),
  ).current;

  const { messages, sendMessage, status, error } = useChat({
    id: threadId,
    messages: initialMessages,
    transport,
    onError: (e) => toast.error(e.message),
    onFinish: () => onMessageSaved(),
  });

  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, [threadId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  const busy = status === "submitted" || status === "streaming";

  const submit = async () => {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    await sendMessage({ text });
  };

  return (
    <div className="grid h-[calc(100vh-3.5rem)] grid-cols-[260px_1fr]">
      {/* Thread list */}
      <aside className="flex min-h-0 flex-col border-r border-border bg-sidebar/40">
        <div className="p-3">
          <Button onClick={onNewThread} className="w-full" size="sm">
            <Plus className="h-4 w-4" /> New chat
          </Button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
          {threads.length === 0 && (
            <div className="px-2 text-xs text-muted-foreground">No conversations yet.</div>
          )}
          {threads.map((t) => {
            const active = t.id === threadId;
            return (
              <div
                key={t.id}
                className={cn(
                  "group mb-1 flex items-center gap-1 rounded-md px-2 py-1.5 text-sm",
                  active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "hover:bg-sidebar-accent/60",
                )}
              >
                <Link
                  to="/chat/$threadId"
                  params={{ threadId: t.id }}
                  className="flex min-w-0 flex-1 items-center gap-2"
                >
                  <MessageSquare className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate">{t.title || "New chat"}</span>
                </Link>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    onDeleteThread(t.id);
                  }}
                  className="opacity-0 transition group-hover:opacity-100"
                  aria-label="Delete chat"
                >
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                </button>
              </div>
            );
          })}
        </div>
      </aside>

      {/* Conversation */}
      <section className="flex min-h-0 flex-col">
        <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-3xl px-6 py-8">
            {messages.length === 0 && (
              <div className="rounded-2xl border border-border surface p-8 text-center">
                <h2 className="font-display text-xl font-semibold">How can Atlas help?</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Ask anything about your work — drafting, planning, summarizing, research.
                </p>
              </div>
            )}
            <div className="space-y-6">
              {messages.map((m) => {
                const text = m.parts
                  .map((p) => (p.type === "text" ? p.text : ""))
                  .join("");
                if (m.role === "user") {
                  return (
                    <div key={m.id} className="flex justify-end">
                      <div className="max-w-[80%] rounded-2xl bg-primary px-4 py-2.5 text-primary-foreground">
                        <div className="whitespace-pre-wrap text-sm">{text}</div>
                      </div>
                    </div>
                  );
                }
                return (
                  <div key={m.id} className="text-sm leading-relaxed text-foreground/90">
                    <div className="mb-1 text-[11px] uppercase tracking-wide text-muted-foreground">
                      Atlas
                    </div>
                    <article className="space-y-3 [&_h2]:mt-4 [&_h2]:font-display [&_h2]:text-base [&_h2]:font-semibold [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_a]:text-primary [&_a]:underline">
                      <ReactMarkdown>{text}</ReactMarkdown>
                    </article>
                  </div>
                );
              })}
              {status === "submitted" && (
                <div className="text-sm text-muted-foreground">
                  <div className="mb-1 text-[11px] uppercase tracking-wide">Atlas</div>
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Thinking…
                  </span>
                </div>
              )}
              {error && <div className="text-sm text-destructive">{error.message}</div>}
            </div>
          </div>
        </div>

        <div className="border-t border-border bg-background/80 p-4 backdrop-blur">
          <div className="mx-auto flex max-w-3xl items-end gap-2">
            <Textarea
              ref={inputRef}
              rows={1}
              placeholder="Message Atlas…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              }}
              className="max-h-40 min-h-[44px] resize-none"
            />
            <Button onClick={submit} disabled={busy || !input.trim()} size="icon" className="shrink-0">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendHorizonal className="h-4 w-4" />}
            </Button>
          </div>
          <p className="mx-auto mt-2 max-w-3xl text-center text-[11px] text-muted-foreground">
            AI-generated content may require human review.
          </p>
        </div>
      </section>
    </div>
  );
}
