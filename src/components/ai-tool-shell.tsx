import { useState, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Loader2, Copy, Check } from "lucide-react";
import { toast } from "sonner";

type Props = {
  icon: ReactNode;
  title: string;
  description: string;
  form: ReactNode;
  onSubmit: () => Promise<string>;
  submitLabel?: string;
  canSubmit?: boolean;
  outputAsMarkdown?: boolean;
};

export function AIToolShell({
  icon,
  title,
  description,
  form,
  onSubmit,
  submitLabel = "Generate",
  canSubmit = true,
  outputAsMarkdown = true,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState<string>("");
  const [copied, setCopied] = useState(false);

  const handleGo = async () => {
    setLoading(true);
    setOutput("");
    try {
      const text = await onSubmit();
      setOutput(text);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <header className="mb-8 flex items-start gap-4">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-accent text-primary">
          {icon}
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="surface rounded-2xl border border-border p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Input
          </h2>
          <div className="mt-4 space-y-4">{form}</div>
          <Button onClick={handleGo} disabled={loading || !canSubmit} className="mt-6 w-full">
            {loading ? (<><Loader2 className="h-4 w-4 animate-spin" /> Generating…</>) : submitLabel}
          </Button>
        </section>

        <section className="surface flex min-h-[400px] flex-col rounded-2xl border border-border p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Output
            </h2>
            {output && (
              <Button size="sm" variant="ghost" onClick={handleCopy}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied" : "Copy"}
              </Button>
            )}
          </div>

          {!output && !loading && (
            <div className="grid flex-1 place-items-center text-center text-sm text-muted-foreground">
              Your AI-generated output will appear here.
            </div>
          )}

          {loading && (
            <div className="space-y-3">
              <div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
              <div className="h-3 w-full animate-pulse rounded bg-muted" />
              <div className="h-3 w-5/6 animate-pulse rounded bg-muted" />
              <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
            </div>
          )}

          {output && (
            <article className="prose prose-invert prose-sm max-w-none prose-headings:font-display prose-headings:tracking-tight prose-h2:mt-6 prose-h2:text-base prose-p:text-foreground/90">
              {outputAsMarkdown ? (
                <ReactMarkdown>{output}</ReactMarkdown>
              ) : (
                <pre className="whitespace-pre-wrap font-sans text-sm">{output}</pre>
              )}
            </article>
          )}

          <p className="mt-6 border-t border-border pt-3 text-[11px] text-muted-foreground">
            AI-generated content may require human review.
          </p>
        </section>
      </div>
    </div>
  );
}
