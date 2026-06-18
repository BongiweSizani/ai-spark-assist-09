import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { FileText } from "lucide-react";
import { AIToolShell } from "@/components/ai-tool-shell";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useServerFn } from "@tanstack/react-start";
import { summarizeMeeting } from "@/lib/ai.functions";

export const Route = createFileRoute("/_authenticated/notes")({
  head: () => ({ meta: [{ title: "Meeting Notes Summarizer — Atlas" }] }),
  component: NotesPage,
});

function NotesPage() {
  const fn = useServerFn(summarizeMeeting);
  const [notes, setNotes] = useState("");

  return (
    <AIToolShell
      icon={<FileText className="h-5 w-5" />}
      title="Meeting Notes Summarizer"
      description="Turn raw notes into a structured brief with decisions, actions, and deadlines."
      canSubmit={notes.trim().length > 20}
      submitLabel="Summarize"
      onSubmit={async () => {
        const res = await fn({ data: { notes } });
        return res.content;
      }}
      form={
        <div>
          <Label htmlFor="notes">Raw meeting notes</Label>
          <Textarea
            id="notes"
            rows={16}
            placeholder="Paste your meeting transcript or rough notes here…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      }
    />
  );
}
