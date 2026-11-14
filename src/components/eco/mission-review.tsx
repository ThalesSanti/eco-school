import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { reviewMission } from "@/lib/mission-review.functions";
import { CRITERION_LABELS, REVIEW_LABELS, reviewInputSchema, type MissionReview } from "@/lib/mission-review";
import type { Mission, Submission } from "@/lib/eco-store";
import { Icon } from "./ui";

export function MissionReviewDialog({ mission, submission, onClose, onUseFeedback }: { mission: Mission; submission: Submission; onClose: () => void; onUseFeedback: (feedback: string) => void }) {
  const evaluate = useServerFn(reviewMission);
  const [description, setDescription] = useState(submission.note);
  const [photo, setPhoto] = useState(submission.photo ?? "");
  const [result, setResult] = useState<MissionReview | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [signedIn, setSignedIn] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => { void supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session)); }, []);
  const signIn = async () => {
    setBusy(true); setError("");
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { setError("Não foi possível entrar. Confira e-mail e senha."); return; }
      setSignedIn(!!data.session); setPassword("");
    } catch { setError("Não foi possível conectar sua conta."); }
    finally { setBusy(false); }
  };
  const social = async (provider: "google" | "lovable") => {
    setBusy(true); setError("");
    try {
      const response = await lovable.auth.signInWithOAuth(provider, { redirect_uri: window.location.origin });
      if (response.error) { setError("Não foi possível conectar sua conta."); return; }
      if (!response.redirected) { const { data } = await supabase.auth.getSession(); setSignedIn(!!data.session); }
    } catch { setError("Não foi possível conectar sua conta."); }
    finally { setBusy(false); }
  };
  const onFile = (file?: File) => {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 1.5 * 1024 * 1024) { setError("Envie uma foto JPG, PNG ou WebP de até 1,5 MB."); return; }
    const reader = new FileReader();
    reader.onload = () => { setPhoto(String(reader.result)); setResult(null); setError(""); };
    reader.onerror = () => setError("Não foi possível abrir a foto.");
    reader.readAsDataURL(file);
  };
  const analyze = async () => {
    const parsed = reviewInputSchema.safeParse({ title: mission.title, criteria: mission.description, description, photo });
    if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? "Confira a descrição e a foto."); return; }
    setBusy(true); setError(""); setResult(null);
    try {
      const response = await evaluate({ data: parsed.data });
      if (!response.ok) { setError(response.message); return; }
      setResult(response.review);
    } catch { setError("Não foi possível analisar. Confira sua conexão e seu acesso; os campos foram preservados."); }
    finally { setBusy(false); }
  };
  return (
    <Dialog open onOpenChange={(open) => { if (!open && !busy) onClose(); }}>
      <DialogContent className="mission-dialog rounded-3xl bg-surface-3 p-5" onEscapeKeyDown={(e) => busy && e.preventDefault()} onPointerDownOutside={(e) => busy && e.preventDefault()}>
        <DialogHeader className="pr-8 text-left">
          <DialogTitle>Avaliação assistida por IA</DialogTitle>
          <DialogDescription>{mission.title}</DialogDescription>
        </DialogHeader>
        <div className="border-l-2 border-primary pl-3 text-sm"><p className="font-medium">Critérios da missão</p><p className="mt-1 text-muted-foreground">{mission.description}</p></div>
        {!signedIn ? <div className="grid gap-3">
          <p className="text-sm text-muted-foreground">Conecte uma conta autorizada de professor. O perfil de demonstração não concede acesso à IA.</p>
          <label className="grid gap-1 text-sm">E-mail<input type="email" autoComplete="email" className="m3-field text-base" value={email} onChange={(e) => setEmail(e.target.value)} disabled={busy} /></label>
          <label className="grid gap-1 text-sm">Senha<input type="password" autoComplete="current-password" className="m3-field text-base" value={password} onChange={(e) => setPassword(e.target.value)} disabled={busy} /></label>
          <Button size="touch" disabled={busy || !email || !password} onClick={signIn}>Entrar</Button>
          <div className="grid gap-2 sm:grid-cols-2"><Button variant="outline" size="touch" disabled={busy} onClick={() => social("google")}>Continuar com Google</Button><Button variant="outline" size="touch" disabled={busy} onClick={() => social("lovable")}>Continuar com Lovable</Button></div>
        </div> : <>
          <label htmlFor="review-description" className="text-sm font-medium">Descrição da entrega</label>
          <textarea id="review-description" rows={4} maxLength={2000} className="m3-field resize-y text-base" value={description} disabled={busy} onChange={(e) => { setDescription(e.target.value); setResult(null); }} />
          <label className="relative flex min-h-14 cursor-pointer items-center gap-3 rounded-lg border border-dashed border-input p-3 focus-within:ring-2 focus-within:ring-ring">
            <Icon name="add_a_photo" className="shrink-0 text-primary" /><span className="text-sm">{photo ? "Trocar foto" : "Adicionar foto da entrega"}</span>
            <input aria-label="Foto para avaliação" type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} className="absolute inset-0 w-full cursor-pointer opacity-0" onChange={(e) => onFile(e.target.files?.[0])} />
          </label>
          {photo && <img src={photo} alt="Foto para análise da missão" className="max-h-56 w-full rounded-lg object-contain" />}
          <p className="text-xs text-muted-foreground">A descrição e a foto serão enviadas à IA. Evite rostos, nomes e outros dados pessoais.</p>
          <Button size="touch" disabled={busy || !photo || description.trim().length < 5} onClick={analyze}><Icon name={busy ? "hourglass_top" : "auto_awesome"} />{busy ? "Analisando entrega…" : "Analisar entrega"}</Button>
        </>}
        {error && <p role="alert" className="break-words text-sm text-destructive">{error}</p>}
        {result && <div aria-live="polite" className="grid gap-4 border-t border-border pt-4">
          <h3 className="font-medium text-primary">{REVIEW_LABELS[result.recommendation]}</h3>
          <p className="text-sm">{result.summary}</p>
          <ul className="grid gap-3">{result.criteria.map((c, i) => <li key={i} className="border-l-2 border-border pl-3 text-sm"><p className="font-medium">{c.criterion} · {CRITERION_LABELS[c.status]}</p><p className="mt-1 text-muted-foreground">{c.observation}</p></li>)}</ul>
          <label htmlFor="review-feedback" className="text-sm font-medium">Feedback sugerido</label>
          <textarea id="review-feedback" rows={4} className="m3-field resize-y text-base" value={result.feedback} onChange={(e) => setResult({ ...result, feedback: e.target.value })} />
          <p className="text-xs text-muted-foreground">{result.limitations} A decisão final é do professor.</p>
          <div className="grid gap-2 sm:grid-cols-2"><Button variant="outline" size="touch" onClick={async () => { try { await navigator.clipboard.writeText(result.feedback); toast.success("Feedback copiado"); } catch { toast.error("Não foi possível copiar."); } }}>Copiar feedback</Button><Button variant="secondary" size="touch" onClick={() => onUseFeedback(result.feedback)}>Usar na justificativa</Button></div>
        </div>}
        <Button variant="ghost" size="touch" disabled={busy} onClick={onClose}>Fechar</Button>
      </DialogContent>
    </Dialog>
  );
}