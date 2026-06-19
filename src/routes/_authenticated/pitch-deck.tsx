import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Presentation, Download, Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useServerFn } from "@tanstack/react-start";
import { generatePitchDeck } from "@/lib/pitch-deck.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/pitch-deck")({
  head: () => ({ meta: [{ title: "Pitch Deck Generator — Atlas" }] }),
  component: PitchDeckPage,
});

function PitchDeckPage() {
  const fn = useServerFn(generatePitchDeck);
  const [projectName, setProjectName] = useState("");
  const [oneLiner, setOneLiner] = useState("");
  const [audience, setAudience] = useState("Investors");
  const [problem, setProblem] = useState("");
  const [solution, setSolution] = useState("");
  const [notes, setNotes] = useState("");
  const [slideCount, setSlideCount] = useState(8);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ filename: string; base64: string; slideCount: number } | null>(null);

  const canSubmit = projectName.length > 1 && oneLiner.length > 3 && audience.length > 1;

  const download = (filename: string, base64: string) => {
    const bin = atob(base64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const blob = new Blob([bytes], {
      type: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleGo = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fn({
        data: { projectName, oneLiner, audience, problem, solution, notes, slideCount },
      });
      setResult(res);
      download(res.filename, res.base64);
      toast.success("Pitch deck generated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <header className="mb-8 flex items-start gap-4">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-accent text-primary">
          <Presentation className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold">Pitch Deck Generator</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Turn a one-liner into a polished, downloadable .pptx pitch deck.
          </p>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="surface rounded-2xl border border-border p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Input</h2>
          <div className="mt-4 space-y-4">
            <div>
              <Label htmlFor="pn">Project name</Label>
              <Input id="pn" placeholder="e.g. Atlas" value={projectName} onChange={(e) => setProjectName(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="ol">One-liner</Label>
              <Input id="ol" placeholder="What does it do, in one sentence?" value={oneLiner} onChange={(e) => setOneLiner(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="aud">Audience</Label>
              <Input id="aud" placeholder="e.g. Seed investors, internal exec team" value={audience} onChange={(e) => setAudience(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="pb">Problem (optional)</Label>
              <Textarea id="pb" rows={2} value={problem} onChange={(e) => setProblem(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="sol">Solution (optional)</Label>
              <Textarea id="sol" rows={2} value={solution} onChange={(e) => setSolution(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="nt">Extra context (optional)</Label>
              <Textarea id="nt" rows={3} placeholder="Traction, team, market, anything else" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="sc">Slide count: {slideCount}</Label>
              <input
                id="sc"
                type="range"
                min={6}
                max={12}
                value={slideCount}
                onChange={(e) => setSlideCount(Number(e.target.value))}
                className="mt-2 w-full accent-primary"
              />
            </div>
          </div>
          <Button onClick={handleGo} disabled={loading || !canSubmit} className="mt-6 w-full">
            {loading ? (<><Loader2 className="h-4 w-4 animate-spin" /> Generating deck…</>) : "Generate .pptx"}
          </Button>
        </section>

        <section className="surface flex min-h-[400px] flex-col rounded-2xl border border-border p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Output</h2>

          {!result && !loading && (
            <div className="grid flex-1 place-items-center text-center text-sm text-muted-foreground">
              Your generated .pptx will download automatically and appear here.
            </div>
          )}

          {loading && (
            <div className="mt-6 space-y-3">
              <div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
              <div className="h-3 w-full animate-pulse rounded bg-muted" />
              <div className="h-3 w-5/6 animate-pulse rounded bg-muted" />
              <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
              <p className="pt-2 text-xs text-muted-foreground">Drafting narrative, structuring slides, building file…</p>
            </div>
          )}

          {result && (
            <div className="mt-6 flex flex-1 flex-col items-start gap-4">
              <div className="rounded-xl border border-border bg-accent/30 p-4">
                <div className="font-semibold">{result.filename}</div>
                <div className="text-xs text-muted-foreground">{result.slideCount} slides · ready to present</div>
              </div>
              <Button onClick={() => download(result.filename, result.base64)} variant="outline">
                <Download className="h-4 w-4" /> Download again
              </Button>
            </div>
          )}

          <p className="mt-6 border-t border-border pt-3 text-[11px] text-muted-foreground">
            AI-generated content may require human review.
          </p>
        </section>
      </div>
    </div>
  );
}
