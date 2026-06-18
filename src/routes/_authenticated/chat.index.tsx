import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listThreads, createThread } from "@/lib/chat-threads.functions";

export const Route = createFileRoute("/_authenticated/chat/")({
  head: () => ({ meta: [{ title: "AI Chat — Atlas" }] }),
  component: ChatIndex,
});

function ChatIndex() {
  const navigate = useNavigate();
  const list = useServerFn(listThreads);
  const create = useServerFn(createThread);

  useEffect(() => {
    (async () => {
      const threads = await list();
      if (threads.length > 0) {
        navigate({ to: "/chat/$threadId", params: { threadId: threads[0].id }, replace: true });
      } else {
        const t = await create({ data: {} });
        navigate({ to: "/chat/$threadId", params: { threadId: t.id }, replace: true });
      }
    })();
  }, [list, create, navigate]);

  return (
    <div className="grid h-[calc(100vh-3.5rem)] place-items-center text-sm text-muted-foreground">
      Loading your conversations…
    </div>
  );
}
