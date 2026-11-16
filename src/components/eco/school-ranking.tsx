import { toast } from "sonner";
import { schoolTotals, useEco } from "@/lib/eco-store";
import { engagementFactor, schoolScore, sealFor, SEAL_CRITERIA } from "@/lib/scoring";
import { Icon } from "@/components/eco/ui";
import { cn } from "@/lib/utils";

const SEAL_STYLE: Record<string, string> = {
  Ouro: "text-warning",
  Prata: "text-foreground",
  Bronze: "text-chart-5",
};

export function SchoolRanking() {
  const { state, closeCycle, awardSeal } = useEco();
  const rows = state.schools
    .map((s) => {
      const total = schoolTotals(state, s).totalPoints;
      return {
        s,
        total,
        f: engagementFactor(s.active, s.enrolled),
        score: schoolScore(total, s.active, s.enrolled),
      };
    })
    .sort((a, b) => b.score - a.score);

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Período de referência {state.period} ·{" "}
          {state.cycleClosed ? "ciclo fechado" : "ciclo aberto"}
        </p>
        {!state.cycleClosed && (
          <button
            onClick={() => {
              closeCycle();
              toast.success("Ciclo fechado. Selos liberados.");
            }}
            className="m3-fab"
          >
            <Icon name="lock_clock" />
            Fechar ciclo
          </button>
        )}
      </div>

      <section className="m3-card-hi mb-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2 text-foreground">
          <Icon name="function" className="text-primary" />
          Fórmula utilizada
        </div>
        <p className="mt-2 font-mono text-xs">
          Score = (Σ pontos dos alunos ÷ alunos ativos) × fator de engajamento
        </p>
        <p className="mt-1 text-xs">
          Fator = 1 + 0,4 × (adesão − 0,5), limitado entre 0,8 e 1,2 —{" "}
          <span className="text-warning">proposta a validar pela governança.</span>
        </p>
      </section>

      <div className="grid gap-3">
        {rows.map((r, i) => {
          const suggested = sealFor(r.score);
          const awarded = state.seals.find(
            (x) => x.schoolId === r.s.id && x.period === state.period,
          );
          return (
            <article
              key={r.s.id}
              className="m3-card flex flex-wrap items-center gap-4 animate-rise"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div
                className={cn(
                  "grid size-12 place-items-center rounded-2xl font-display text-xl",
                  i === 0
                    ? "bg-gold text-foreground"
                    : i === 1
                      ? "bg-silver-soft text-foreground"
                      : i === 2
                        ? "bg-bronze-soft text-foreground"
                        : "bg-secondary text-secondary-foreground",
                )}
              >
                {i + 1}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-foreground">{r.s.name}</div>
                <div className="text-xs text-muted-foreground">
                  {r.s.region} · {r.s.active}/{r.s.enrolled} ativos · fator {r.f.toFixed(2)}
                </div>
              </div>
              <div className="text-right">
                <div className="font-display text-2xl text-primary">{r.score.toFixed(1)}</div>
                <div className="text-xs text-muted-foreground">
                  {r.total.toLocaleString("pt-BR")} pts totais
                </div>
              </div>
              <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
                {awarded ? (
                  <span
                    className={cn("flex items-center gap-1 text-sm", SEAL_STYLE[awarded.level])}
                  >
                    <Icon name="workspace_premium" fill />
                    Selo {awarded.level}
                  </span>
                ) : suggested ? (
                  <button
                    disabled={!state.cycleClosed}
                    title={state.cycleClosed ? "" : "Disponível após o fechamento do ciclo"}
                    onClick={() => {
                      awardSeal(r.s.id, suggested, `Score ≥ ${SEAL_CRITERIA[suggested]}`);
                      toast.success(`Selo ${suggested} emitido`);
                    }}
                    className="h-9 rounded-full border border-border px-4 text-sm text-foreground hover:bg-surface-2 disabled:opacity-40"
                  >
                    Emitir selo {suggested}
                  </button>
                ) : (
                  <span className="text-xs text-muted-foreground">Sem critério de selo</span>
                )}
              </div>
            </article>
          );
        })}
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        Critérios: Ouro ≥ {SEAL_CRITERIA.Ouro} · Prata ≥ {SEAL_CRITERIA.Prata} · Bronze ≥{" "}
        {SEAL_CRITERIA.Bronze}. Nenhum dado pessoal de aluno é exibido.
      </p>
    </>
  );
}
