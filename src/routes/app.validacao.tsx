import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { CATEGORY_INFO, useEco } from "@/lib/eco-store";
import { Button } from "@/components/ui/button";
import { Empty, Icon, PageHeader, StatusChip, fmtDate } from "@/components/eco/ui";
import { MissionReviewDialog } from "@/components/eco/mission-review";

export const Route = createFileRoute("/app/validacao")({
  head: () => ({ meta: [
    { title: "Validação de missões — Eco School" },
    { name: "description", content: "Aprove ou rejeite evidências enviadas pelos alunos." },
    { property: "og:title", content: "Validação de missões — Eco School" },
    { property: "og:description", content: "Aprove ou rejeite evidências enviadas pelos alunos." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Validation,
});

const SCOPE = ["8A", "8B", "9A"]; // turmas do validador

function Validation() {
  const { state, decide } = useEco();
  const [tab, setTab] = useState<"pend" | "dec">("pend");
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [reviewing, setReviewing] = useState<string | null>(null);
  const reviewSubmission = state.submissions.find((s) => s.id === reviewing);
  const reviewMission = state.missions.find((m) => m.id === reviewSubmission?.missionId);

  const inScope = state.submissions.filter((s) => {
    const st = state.students.find((x) => x.id === s.studentId);
    return st && st.schoolId === state.schools[0]?.id && SCOPE.includes(st.classId) && state.missions.some((m) => m.id === s.missionId && m.requiresEvidence);
  });
  const list = inScope.filter((s) => (tab === "pend" ? s.status === "pendente" : s.status !== "pendente"));

  return (
    <>
      <PageHeader title="Validação" subtitle={`Turmas sob sua responsabilidade: ${SCOPE.join(", ")}`} />
      <div className="mb-4 flex gap-2">
        <Button variant="chip" aria-pressed={tab === "pend"} data-active={tab === "pend"} onClick={() => setTab("pend")} >
          Pendentes <span className="rounded-full bg-primary px-1.5 text-[10px] text-primary-foreground">{inScope.filter((s) => s.status === "pendente").length}</span>
        </Button>
        <Button variant="chip" aria-pressed={tab === "dec"} data-active={tab === "dec"} onClick={() => setTab("dec")} >Decididas</Button>
      </div>

      {list.length === 0 ? (
        <Empty icon="task_alt" title="Tudo em dia!" text="Não há evidências aguardando sua análise." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {list.map((s) => {
            const m = state.missions.find((x) => x.id === s.missionId);
            const st = state.students.find((x) => x.id === s.studentId);
            if (!m || !st) return null;
            return (
              <article key={s.id} className="m3-card flex flex-col gap-3 animate-rise">
                <div className="flex items-center gap-3">
                  <div className="grid size-10 shrink-0 place-items-center rounded-full bg-tertiary-container font-medium text-on-tertiary-container">{st.name[0]}</div>
                  <div className="min-w-0 flex-1">
                    <div className="break-words text-foreground">{st.name} <span className="text-xs text-muted-foreground">· {st.classId}</span></div>
                    <div className="text-xs text-muted-foreground">Enviado {fmtDate(s.at)}</div>
                  </div>
                  <StatusChip status={s.status} />
                </div>
                <div className="rounded-2xl bg-surface-2 p-3">
                  <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-2 text-sm text-foreground"><Icon name={CATEGORY_INFO[m.category].icon} className="!text-lg text-primary" /><span className="min-w-0 break-words">{m.title}</span> <span className="ml-auto text-primary">+{m.points}</span></div>
                  <p className="mt-2 break-words text-sm text-muted-foreground">“{s.note}”</p>
                  {s.photo && <img src={s.photo} alt="Evidência" className="mt-2 max-h-48 rounded-xl object-cover" />}
                </div>
                {s.status === "pendente" && <Button variant="secondary" size="touch" className="rounded-full" onClick={() => setReviewing(s.id)}><Icon name="auto_awesome" />Avaliar com IA</Button>}
                {s.status === "pendente" ? (
                  rejecting === s.id ? (
                    <div className="grid gap-2">
                      <label htmlFor={`reason-${s.id}`} className="text-sm font-medium">Justificativa da rejeição</label>
                      <textarea id={`reason-${s.id}`} autoFocus rows={3} className="m3-field resize-y text-base" value={reason} onChange={(e) => setReason(e.target.value)} />
                      <div className="grid grid-cols-2 gap-2">
                        <Button variant="ghost" size="touch" onClick={() => { setRejecting(null); setReason(""); }} className="rounded-full text-primary">Cancelar</Button>
                        <Button onClick={() => {
                          if (reason.trim().length < 3) { toast.error("Informe a justificativa."); return; }
                          decide(s.id, false, reason.trim()); setRejecting(null); setReason(""); toast("Missão rejeitada");
                        }} variant="destructive" size="touch" className="rounded-full whitespace-normal">Confirmar rejeição</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" size="touch" onClick={() => { setRejecting(s.id); setReason(""); }} className="rounded-full">Rejeitar</Button>
                      <Button onClick={() => { decide(s.id, true); toast.success(`+${s.points} pontos para ${st.name.split(" ")[0]}`); }}
                        size="touch" className="rounded-full"><Icon name="check" className="!text-lg" />Aprovar</Button>
                    </div>
                  )
                ) : (
                  <p className="break-words text-xs text-muted-foreground">Por {s.validator} em {s.decidedAt && fmtDate(s.decidedAt)}{s.reason ? ` · ${s.reason}` : ""}</p>
                )}
              </article>
            );
          })}
        </div>
      )}
      {reviewSubmission && reviewMission && <MissionReviewDialog key={reviewSubmission.id} submission={reviewSubmission} mission={reviewMission} onClose={() => setReviewing(null)} onUseFeedback={(feedback) => { setReason(feedback); setRejecting(reviewSubmission.id); setReviewing(null); }} />}
    </>
  );
}
