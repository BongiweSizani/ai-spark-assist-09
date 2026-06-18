import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Mail } from "lucide-react";
import { AIToolShell } from "@/components/ai-tool-shell";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useServerFn } from "@tanstack/react-start";
import { generateEmail } from "@/lib/ai.functions";

export const Route = createFileRoute("/_authenticated/email")({
  head: () => ({ meta: [{ title: "Email Generator — Atlas" }] }),
  component: EmailPage,
});

const TONES = ["Professional", "Friendly", "Persuasive", "Apologetic", "Direct", "Enthusiastic"] as const;

function EmailPage() {
  const fn = useServerFn(generateEmail);
  const [purpose, setPurpose] = useState("");
  const [audience, setAudience] = useState("");
  const [tone, setTone] = useState<(typeof TONES)[number]>("Professional");
  const [keyPoints, setKeyPoints] = useState("");

  return (
    <AIToolShell
      icon={<Mail className="h-5 w-5" />}
      title="Smart Email Generator"
      description="Craft polished emails tailored to your audience and tone."
      canSubmit={purpose.length > 3 && audience.length > 1}
      outputAsMarkdown={false}
      submitLabel="Generate email"
      onSubmit={async () => {
        const res = await fn({ data: { purpose, audience, tone, keyPoints } });
        return res.content;
      }}
      form={
        <>
          <div>
            <Label htmlFor="audience">Audience</Label>
            <Input id="audience" placeholder="e.g. My team lead" value={audience} onChange={(e) => setAudience(e.target.value)} />
          </div>
          <div>
            <Label>Tone</Label>
            <Select value={tone} onValueChange={(v) => setTone(v as (typeof TONES)[number])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TONES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="purpose">Purpose of the email</Label>
            <Textarea id="purpose" rows={3} placeholder="e.g. Request a 1:1 to discuss Q3 priorities" value={purpose} onChange={(e) => setPurpose(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="kp">Key points (optional)</Label>
            <Textarea id="kp" rows={3} placeholder="Bullet points or context to include" value={keyPoints} onChange={(e) => setKeyPoints(e.target.value)} />
          </div>
        </>
      }
    />
  );
}
