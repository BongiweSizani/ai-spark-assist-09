import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search } from "lucide-react";
import { AIToolShell } from "@/components/ai-tool-shell";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useServerFn } from "@tanstack/react-start";
import { researchTopic } from "@/lib/ai.functions";

export const Route = createFileRoute("/_authenticated/research")({
  head: () => ({ meta: [{ title: "Research Assistant — Atlas" }] }),
  component: ResearchPage,
});

function ResearchPage() {
  const fn = useServerFn(researchTopic);
  const [topic, setTopic] = useState("");

  return (
    <AIToolShell
      icon={<Search className="h-5 w-5" />}
      title="AI Research Assistant"
      description="Get a structured briefing on any topic in seconds."
      canSubmit={topic.trim().length > 2}
      submitLabel="Research"
      onSubmit={async () => {
        const res = await fn({ data: { topic } });
        return res.content;
      }}
      form={
        <div>
          <Label htmlFor="topic">Topic or question</Label>
          <Input
            id="topic"
            placeholder="e.g. AI agents in customer support"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />
        </div>
      }
    />
  );
}
