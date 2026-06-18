import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ListChecks } from "lucide-react";
import { AIToolShell } from "@/components/ai-tool-shell";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useServerFn } from "@tanstack/react-start";
import { planTasks } from "@/lib/ai.functions";

export const Route = createFileRoute("/_authenticated/planner")({
  head: () => ({ meta: [{ title: "Task Planner — Atlas" }] }),
  component: PlannerPage,
});

const HORIZONS = ["Today", "This week", "This sprint (2 weeks)"] as const;

function PlannerPage() {
  const fn = useServerFn(planTasks);
  const [tasks, setTasks] = useState("");
  const [horizon, setHorizon] = useState<(typeof HORIZONS)[number]>("This week");

  return (
    <AIToolShell
      icon={<ListChecks className="h-5 w-5" />}
      title="AI Task Planner"
      description="Prioritize and schedule your work using the Eisenhower matrix."
      canSubmit={tasks.trim().length > 5}
      submitLabel="Plan my work"
      onSubmit={async () => {
        const res = await fn({ data: { tasks, horizon } });
        return res.content;
      }}
      form={
        <>
          <div>
            <Label>Planning horizon</Label>
            <Select value={horizon} onValueChange={(v) => setHorizon(v as (typeof HORIZONS)[number])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {HORIZONS.map((h) => <SelectItem key={h} value={h}>{h}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="tasks">Tasks (one per line)</Label>
            <Textarea
              id="tasks"
              rows={12}
              placeholder={"Finish Q3 report\nReview PR #482\nPrep board deck\nFollow up with Sarah"}
              value={tasks}
              onChange={(e) => setTasks(e.target.value)}
            />
          </div>
        </>
      }
    />
  );
}
