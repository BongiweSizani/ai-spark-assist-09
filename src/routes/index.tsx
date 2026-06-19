import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ArrowRight, Mail, FileText, ListChecks, Search, Sparkles } from "lucide-react";
import heroImage from "@/assets/hero.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Atlas — Your AI Workplace Productivity Assistant" },
      {
        name: "description",
        content:
          "Draft emails, summarize meetings, prioritize tasks, and research smarter with one AI workspace.",
      },
    ],
  }),
  component: Landing,
});

const features = [
  { icon: Mail, title: "Smart Email Generator", desc: "Tone- and audience-aware drafts in seconds." },
  { icon: FileText, title: "Meeting Notes Summarizer", desc: "Key points, decisions, deadlines." },
  { icon: ListChecks, title: "AI Task Planner", desc: "Eisenhower prioritization + schedule." },
  { icon: Search, title: "AI Research Assistant", desc: "Structured insights, fast." },
  { icon: Sparkles, title: "AI Chatbot", desc: "Threaded workplace copilot." },
];

function Landing() {
  return (
    <div className="min-h-screen hero-bg">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground font-bold">A</div>
          <span className="font-display text-lg font-semibold">Atlas</span>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost"><Link to="/auth">Sign in</Link></Button>
          <Button asChild><Link to="/auth">Get started</Link></Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 pt-16 pb-24">
        <section className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
            <Sparkles className="h-3 w-3 text-primary" /> Powered by Lovable AI
          </div>
          <h1 className="mx-auto mt-6 max-w-3xl text-5xl font-bold leading-tight md:text-6xl">
            Your AI <span className="text-gradient">workplace copilot</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
            Atlas helps professionals automate the daily admin grind — emails, meeting notes,
            task planning, and research — all in one calm, focused workspace.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Button asChild size="lg" className="glow">
              <Link to="/auth">Start free <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/dashboard">Open dashboard</Link>
            </Button>
          </div>
          <img
            src={heroImage}
            alt="Atlas AI workspace visual"
            width={1536}
            height={896}
            className="mx-auto mt-12 w-full max-w-5xl rounded-2xl border border-border shadow-2xl"
          />
        </section>

        <section className="mt-24 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="surface rounded-2xl border border-border p-6">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-accent text-primary">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </section>

        <p className="mt-16 text-center text-xs text-muted-foreground">
          AI-generated content may require human review.
        </p>
      </main>
    </div>
  );
}
