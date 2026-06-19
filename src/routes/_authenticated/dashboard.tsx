import { createFileRoute, Link } from "@tanstack/react-router";
import { Mail, FileText, ListChecks, Search, MessageSquare, Presentation, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Atlas" }] }),
  component: Dashboard,
});

const tools = [
  { to: "/email", icon: Mail, title: "Smart Email Generator", desc: "Draft tone-aware emails for any audience." },
  { to: "/notes", icon: FileText, title: "Meeting Notes Summarizer", desc: "Key points, decisions, action items." },
  { to: "/planner", icon: ListChecks, title: "AI Task Planner", desc: "Prioritize and schedule your workload." },
  { to: "/research", icon: Search, title: "AI Research Assistant", desc: "Structured briefings on any topic." },
  { to: "/pitch-deck", icon: Presentation, title: "Pitch Deck Generator", desc: "Turn an idea into a .pptx deck." },
  { to: "/chat", icon: MessageSquare, title: "AI Chat", desc: "Threaded workplace copilot." },
] as const;

function Dashboard() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-10">
        <div className="text-sm text-muted-foreground">Welcome back</div>
        <h1 className="mt-1 text-3xl font-bold">What would you like to automate today?</h1>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((t) => (
          <Link
            key={t.to}
            to={t.to}
            className="surface group rounded-2xl border border-border p-6 transition hover:border-primary/40 hover:glow"
          >
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-accent text-primary">
              <t.icon className="h-5 w-5" />
            </div>
            <h3 className="mt-4 flex items-center justify-between text-lg font-semibold">
              {t.title}
              <ArrowRight className="h-4 w-4 opacity-0 transition group-hover:opacity-100" />
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">{t.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
