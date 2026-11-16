import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { schoolTotals, useEco } from "@/lib/eco-store";
import { schoolScore } from "@/lib/scoring";
import { Icon, PageHeader, fmtDate } from "@/components/eco/ui";

export const Route = createFileRoute("/app/relatorios")({
  head: () => ({
    meta: [
      { title: "Relatórios — Eco School" },
      {
        name: "description",
        content: "Gere e exporte relatórios agregados por período e unidade.",
      },
      { property: "og:title", content: "Relatórios — Eco School" },
      {
        property: "og:description",
        content: "Gere e exporte relatórios agregados por período e unidade.",
      },
    ],
  }),
  component: Reports,
});

function Reports() {
  const { state, logEvent } = useEco();
  const [period, setPeriod] = useState("ciclo");
  const [unit, setUnit] = useState(state.role === "gestor" ? state.schools[0]!.id : "todas");
  const [generated, setGenerated] = useState<string | null>(null);

  const schools = unit === "todas" ? state.schools : state.schools.filter((s) => s.id === unit);
  const scale = period === "7" ? 0.12 : period === "30" ? 0.45 : 1;
  const rows = schools.map((s) => {
    const total = Math.round(schoolTotals(state, s).totalPoints * scale);
    return {
      escola: s.name,
      regiao: s.region,
      matriculados: s.enrolled,
      ativos: s.active,
      adesao: `${Math.round((s.active / s.enrolled) * 100)}%`,
      pontos: total,
      score: schoolScore(total, s.active, s.enrolled).toFixed(1),
    };
  });

  const generate = () => {
    const at = new Date().toISOString();
    setGenerated(at);
    logEvent(
      "Relatório gerado",
      unit === "todas" ? "Todas as escolas" : schools[0]!.name,
      `período: ${period}`,
    );
    toast.success("Relatório gerado");
  };
  const exportCsv = () => {
    const head = [
      "Escola",
      "Região",
      "Matriculados",
      "Ativos",
      "Adesão",
      "Pontos",
      "Score normalizado",
    ];
    const lines = [head, ...rows.map((r) => Object.values(r))].map((l) =>
      l.map((v) => `"${v}"`).join(";"),
    );
    lines.push(`"Gerado em";"${new Date(generated ?? Date.now()).toLocaleString("pt-BR")}"`);
    const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `eco-school-relatorio-${period}.csv`;
    a.click();
    logEvent("Relatório exportado", "CSV", `${rows.length} linhas`);
  };

  return (
    <>
      <PageHeader
        title="Relatórios"
        subtitle="Somente dados agregados — sem informações pessoais"
      />
      <section className="m3-card mb-4 flex flex-wrap items-end gap-3">
        <label className="grid gap-1 text-sm text-muted-foreground">
          Período
          <select className="m3-field" value={period} onChange={(e) => setPeriod(e.target.value)}>
            <option value="7">Últimos 7 dias</option>
            <option value="30">Últimos 30 dias</option>
            <option value="ciclo">Ciclo {state.period}</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm text-muted-foreground">
          Unidade
          <select
            className="m3-field"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            disabled={state.role === "gestor"}
          >
            {state.role !== "gestor" && <option value="todas">Todas as escolas</option>}
            {state.schools.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <button
          onClick={generate}
          className="flex h-12 items-center gap-2 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground"
        >
          <Icon name="play_arrow" />
          Gerar
        </button>
      </section>

      {generated && (
        <section className="m3-card animate-rise overflow-x-auto">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="text-sm text-muted-foreground">Gerado em {fmtDate(generated)}</div>
            <button
              onClick={exportCsv}
              className="flex h-10 items-center gap-2 rounded-full border border-border px-4 text-sm text-foreground hover:bg-surface-2"
            >
              <Icon name="download" />
              Exportar CSV
            </button>
          </div>
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="py-2">Escola</th>
                <th>Região</th>
                <th>Ativos</th>
                <th>Adesão</th>
                <th>Pontos</th>
                <th>Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-foreground">
              {rows.map((r) => (
                <tr key={r.escola}>
                  <td className="py-3">{r.escola}</td>
                  <td>{r.regiao}</td>
                  <td>
                    {r.ativos}/{r.matriculados}
                  </td>
                  <td>{r.adesao}</td>
                  <td>{r.pontos.toLocaleString("pt-BR")}</td>
                  <td className="text-primary">{r.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </>
  );
}
