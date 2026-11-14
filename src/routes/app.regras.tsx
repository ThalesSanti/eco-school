import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { currentRule, useEco } from "@/lib/eco-store";
import { academicBonus, CENTRAL_BONUS_CAP, validateRule } from "@/lib/scoring";
import { Icon, PageHeader, fmtDate } from "@/components/eco/ui";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/app/regras")({
  head: () => ({ meta: [
    { title: "Regras de bônus — Eco School" },
    { name: "description", content: "Configure a conversão de pontos em bônus acadêmico dentro do teto." },
    { property: "og:title", content: "Regras de bônus — Eco School" },
    { property: "og:description", content: "Configure a conversão de pontos em bônus acadêmico dentro do teto." },
  ] }),
  component: Rules,
});

function Rules() {
  const { state, saveRule, setAttendance } = useEco();
  const rule = currentRule(state);
  const [ppt, setPpt] = useState(String(rule.pointsPerTenth));
  const [max, setMax] = useState(String(rule.maxBonus));
  const [att, setAtt] = useState(state.attendance);
  const draft = { pointsPerTenth: Number(ppt), maxBonus: Number(max) };
  const err = validateRule(draft);

  const save = () => {
    if (state.cycleClosed) { toast.error("Período encerrado: a regra não pode ser alterada retroativamente."); return; }
    if (err) { toast.error(err); return; }
    saveRule({ period: state.period, ...draft });
    toast.success("Nova versão da regra salva e registrada na auditoria.");
  };

  return (
    <>
      <PageHeader title="Regras de bônus" subtitle={`Período ${state.period} · teto central ${CENTRAL_BONUS_CAP.toFixed(1)} ponto na nota`} />
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="m3-card grid gap-4">
          <h2 className="text-lg text-foreground">Conversão de pontos</h2>
          <label className="grid gap-1 text-sm text-muted-foreground">Pontos para cada 0,1 de bônus
            <input type="number" min={1} className="m3-field" value={ppt} onChange={(e) => setPpt(e.target.value)} />
          </label>
          <label className="grid gap-1 text-sm text-muted-foreground">Teto da escola (máx. {CENTRAL_BONUS_CAP.toFixed(1)})
            <input type="number" step={0.1} min={0} className="m3-field" value={max} onChange={(e) => setMax(e.target.value)} />
          </label>
          {err && <p className="flex items-center gap-2 text-sm text-destructive"><Icon name="error" className="!text-lg" />{err}</p>}
          <div className="rounded-2xl bg-surface-2 p-3 text-sm text-muted-foreground">
            Simulação: 300 pts → <b className="text-primary">+{err ? "—" : academicBonus(300, draft).toFixed(1)}</b> · 1.500 pts → <b className="text-primary">+{err ? "—" : academicBonus(1500, draft).toFixed(1)}</b>
          </div>
          <button onClick={save} disabled={!!err} className="h-11 rounded-full bg-primary text-sm font-medium text-primary-foreground disabled:opacity-40">Salvar nova versão</button>
        </section>

        <section className="m3-card grid content-start gap-4">
          <h2 className="text-lg text-foreground">Bônus de assiduidade</h2>
          <div className="flex items-center justify-between text-foreground">Ativar bônus<Switch checked={att.enabled} onCheckedChange={(v) => setAtt({ ...att, enabled: v })} /></div>
          <label className="grid gap-1 text-sm text-muted-foreground">Pontos extras
            <input type="number" className="m3-field" value={att.bonus} onChange={(e) => setAtt({ ...att, bonus: Number(e.target.value) })} />
          </label>
          <label className="grid gap-1 text-sm text-muted-foreground">Dias ativos mínimos no período
            <input type="number" className="m3-field" value={att.minDays} onChange={(e) => setAtt({ ...att, minDays: Number(e.target.value) })} />
          </label>
          <button onClick={() => { setAttendance(att); toast.success("Assiduidade atualizada."); }} className="h-11 rounded-full border border-border text-sm text-foreground hover:bg-surface-2">Salvar assiduidade</button>
        </section>
      </div>

      <section className="m3-card mt-4">
        <h2 className="mb-3 text-lg text-foreground">Versões da regra</h2>
        <ul className="divide-y divide-border">
          {[...state.rules].reverse().map((r, i) => (
            <li key={r.id} className="flex flex-wrap items-center gap-3 py-3 text-sm">
              <span className="rounded-lg bg-secondary px-2 py-1 text-xs text-secondary-foreground">{r.period}</span>
              <span className="text-foreground">{r.pointsPerTenth} pts = 0,1 · teto {r.maxBonus.toFixed(1)}</span>
              {i === 0 && <span className="text-xs text-primary">vigente</span>}
              <span className="ml-auto text-xs text-muted-foreground">{r.author} · {fmtDate(r.createdAt)}</span>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
