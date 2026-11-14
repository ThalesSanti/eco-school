import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { CATEGORY_INFO, missionStatusFor, useEco, useStudentStats, type Mission, type MissionStatus } from "@/lib/eco-store";
import { Icon, PageHeader, StatusChip, timeLeft } from "@/components/eco/ui";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/missoes")({
  head: () => ({ meta: [
    { title: "Missões do dia — Eco School" },
    { name: "description", content: "Veja e registre suas missões ambientais do dia." },
    { property: "og:title", content: "Missões do dia — Eco School" },
    { property: "og:description", content: "Veja e registre suas missões ambientais do dia." },
  ] }),
  component: Missions,
});

const FILTERS: { key: "todas" | MissionStatus; label: string }[] = [
  { key: "todas", label: "Todas" }, { key: "disponivel", label: "Disponíveis" }, { key: "enviada", label: "Enviadas" },
  { key: "validada", label: "Validadas" }, { key: "rejeitada", label: "Rejeitadas" }, { key: "expirada", label: "Expiradas" },
];

function Missions() {
  const { state } = useEco();
  const me = state.students.find((s) => s.id === state.currentStudentId) ?? state.students[0];
  const stats = useStudentStats(state.currentStudentId);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("todas");
  const [open, setOpen] = useState<Mission | null>(null);

  const list = useMemo(() => state.missions
    .filter((m) => me && m.classes.includes(me.classId))
    .map((m) => ({ m, ...missionStatusFor(state, m, state.currentStudentId) })), [state, me]);
  const shown = list.filter((x) => filter === "todas" || x.status === filter);
  const done = list.filter((x) => x.status === "validada" || x.status === "enviada").length;

  if (!me) return null;

  return (
    <>
      <PageHeader title={`Olá, ${me.name.split(" ")[0]}!`} subtitle="Suas missões sustentáveis de hoje" />

      <section className="m3-card-hi hero-glow mb-6 grid gap-4 sm:grid-cols-3 animate-rise">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Pontos confirmados</div>
          <div className="font-display text-4xl text-primary">{stats.confirmed}</div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Aguardando validação</div>
          <div className="font-display text-4xl text-warning">{stats.pendingPoints}</div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Progresso de hoje</div>
          <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-surface-3">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(done / Math.max(1, list.length)) * 100}%` }} />
          </div>
          <div className="mt-1 text-sm text-muted-foreground">{done} de {list.length} missões</div>
        </div>
      </section>

      <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {FILTERS.map((f) => (
          <Button variant="chip" aria-pressed={filter === f.key} key={f.key} data-active={filter === f.key} onClick={() => setFilter(f.key)} className="shrink-0">
            {filter === f.key && <Icon name="check" className="!text-base" />}{f.label}
          </Button>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {shown.map(({ m, status, sub }, i) => {
          const cat = CATEGORY_INFO[m.category];
          const actionable = status === "disponivel" || status === "rejeitada";
          return (
            <article key={m.id} style={{ animationDelay: `${i * 40}ms` }} className={cn("m3-card flex flex-col gap-3 animate-rise", status === "expirada" && "opacity-60")}>
              <div className="flex items-start gap-3">
                <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-secondary text-primary"><Icon name={cat.icon} fill /></div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-muted-foreground">{cat.label}{!m.requiresEvidence && " · correção automática"}</div>
                  <h3 className="font-medium text-foreground">{m.title}</h3>
                </div>
                <div className="shrink-0 rounded-full bg-primary-container px-3 py-1 text-sm font-medium text-on-primary-container">+{m.points}</div>
              </div>
              <p className="text-sm text-muted-foreground">{m.description}</p>
              {status === "rejeitada" && sub?.reason && (
                <p className="rounded-xl bg-destructive/10 px-3 py-2 text-xs text-destructive">Motivo: {sub.reason} — você pode reenviar.</p>
              )}
              <div className="mt-auto grid gap-3 sm:flex sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusChip status={status} />
                  <span className="flex items-center gap-1 text-xs text-muted-foreground"><Icon name="timer" className="!text-base" />{timeLeft(m.deadline)}</span>
                </div>
                {actionable && (
                  <Button onClick={() => setOpen(m)} size="touch" className="w-full rounded-full sm:w-auto">
                    {m.quiz ? "Responder" : status === "rejeitada" ? "Reenviar" : "Registrar"}
                  </Button>
                )}
              </div>
            </article>
          );
        })}
      </div>
      {shown.length === 0 && <p className="py-10 text-center text-muted-foreground">Nenhuma missão neste filtro.</p>}

      <SubmitDialog mission={open} onClose={() => setOpen(null)} />
    </>
  );
}

function SubmitDialog({ mission, onClose }: { mission: Mission | null; onClose: () => void }) {
  const { submitMission } = useEco();
  const [note, setNote] = useState("");
  const [photo, setPhoto] = useState<string>();
  const [answer, setAnswer] = useState<number>();

  const close = () => { setNote(""); setPhoto(undefined); setAnswer(undefined); onClose(); };
  const onFile = (f?: File) => {
    if (!f) return;
    if (f.size > 1.5 * 1024 * 1024) { toast.error("Foto muito grande (máx. 1,5 MB)."); return; }
    const r = new FileReader(); r.onload = () => setPhoto(String(r.result)); r.readAsDataURL(f);
  };
  const send = () => {
    if (!mission) return;
    if (mission.quiz && answer === undefined) { toast.error("Escolha uma resposta."); return; }
    if (!mission.quiz && note.trim().length < 5) { toast.error("Descreva brevemente o que você fez."); return; }
    const res = submitMission(mission.id, note.trim(), photo, answer);
    (res.ok ? toast.success : toast.error)(res.message);
    close();
  };

  return (
    <Dialog open={!!mission} onOpenChange={(o) => !o && close()}>
      <DialogContent className="mission-dialog rounded-3xl border-none bg-surface-3 p-5">
        {mission && (
          <>
            <DialogHeader className="pr-8 text-left">
              <DialogTitle className="font-display text-2xl font-normal">{mission.title}</DialogTitle>
              <DialogDescription>{mission.quiz ? mission.quiz.question : "Conte o que você fez e, se puder, envie uma foto como evidência."}</DialogDescription>
            </DialogHeader>
            {mission.quiz ? (
              <div role="radiogroup" aria-label="Resposta do quiz" className="grid gap-2">
                {mission.quiz.options.map((o, i) => (
                  <Button variant="outline" size="touch" role="radio" aria-checked={answer === i} key={o} onClick={() => setAnswer(i)} data-active={answer === i}
                    className="justify-start whitespace-normal rounded-2xl text-left data-[active=true]:border-primary data-[active=true]:bg-primary-container">
                    <Icon name={answer === i ? "radio_button_checked" : "radio_button_unchecked"} className="text-primary" />{o}
                  </Button>
                ))}
              </div>
            ) : (
              <div className="grid gap-3">
                <label htmlFor="mission-note" className="text-sm font-medium">O que você fez?</label>
                <textarea id="mission-note" rows={4} className="m3-field min-h-28 resize-y" placeholder="Ex.: separei as garrafas PET e latas…" value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} />
                <label className="relative flex min-h-12 cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-input p-3 text-sm text-muted-foreground hover:bg-surface-2 focus-within:ring-2 focus-within:ring-ring">
                  {photo ? <img src={photo} alt="Evidência" className="size-14 rounded-xl object-cover" /> : <Icon name="add_a_photo" className="text-primary" />}
                  {photo ? "Trocar foto" : mission.requiresEvidence ? "Adicionar foto (recomendado)" : "Adicionar foto (opcional)"}
                  <input aria-label="Foto da missão" type="file" accept="image/*" className="absolute inset-0 w-full cursor-pointer opacity-0" onChange={(e) => onFile(e.target.files?.[0])} />
                </label>
              </div>
            )}
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Button variant="ghost" size="touch" onClick={close} className="rounded-full text-primary">Cancelar</Button>
              <Button size="touch" onClick={send} className="rounded-full">Enviar</Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
