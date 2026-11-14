import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useEco } from "@/lib/eco-store";
import { Icon, PageHeader, fmtDate } from "@/components/eco/ui";

export const Route = createFileRoute("/app/auditoria")({
  head: () => ({ meta: [
    { title: "Auditoria — Eco School" },
    { name: "description", content: "Trilha de eventos críticos: validações, regras, selos e relatórios." },
    { property: "og:title", content: "Auditoria — Eco School" },
    { property: "og:description", content: "Trilha de eventos críticos: validações, regras, selos e relatórios." },
  ] }),
  component: Audit,
});

function Audit() {
  const { state } = useEco();
  const types = Array.from(new Set(state.audit.map((a) => a.action)));
  const [type, setType] = useState("todos");
  const [days, setDays] = useState(30);
  const list = state.audit.filter((a) => (type === "todos" || a.action === type) && new Date(a.at).getTime() >= Date.now() - days * 86400_000);

  return (
    <>
      <PageHeader title="Auditoria" subtitle="Registros somente leitura · ator, ação, data/hora e objeto" />
      <section className="m3-card mb-4 flex flex-wrap gap-3">
        <label className="grid gap-1 text-sm text-muted-foreground">Tipo de evento
          <select className="m3-field" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="todos">Todos</option>{types.map((t) => <option key={t}>{t}</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-sm text-muted-foreground">Período
          <select className="m3-field" value={days} onChange={(e) => setDays(Number(e.target.value))}>
            <option value={1}>Últimas 24h</option><option value={7}>7 dias</option><option value={30}>30 dias</option>
          </select>
        </label>
      </section>
      <section className="m3-card">
        <ul className="divide-y divide-border">
          {list.map((a) => (
            <li key={a.id} className="flex items-start gap-3 py-3">
              <Icon name="history_edu" className="mt-0.5 text-primary" />
              <div className="min-w-0 flex-1">
                <div className="text-foreground">{a.action} <span className="text-muted-foreground">· {a.object}</span></div>
                <div className="text-xs text-muted-foreground">{a.actor} — {a.details}</div>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">{fmtDate(a.at)}</span>
            </li>
          ))}
        </ul>
        {list.length === 0 && <p className="text-sm text-muted-foreground">Nenhum evento encontrado.</p>}
      </section>
    </>
  );
}
