import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { CATEGORY_INFO, schoolTotals, useEco, type Category } from "@/lib/eco-store";
import { schoolScore } from "@/lib/scoring";
import { Icon, PageHeader, Stat } from "@/components/eco/ui";

export const Route = createFileRoute("/app/painel")({
  head: () => ({
    meta: [
      { title: "Painel da escola — Eco School" },
      { name: "description", content: "Participação, conclusão e evolução das missões por turma." },
      { property: "og:title", content: "Painel da escola — Eco School" },
      {
        property: "og:description",
        content: "Participação, conclusão e evolução das missões por turma.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { state } = useEco();
  const school = state.schools[0];
  const local = state.submissions.filter(
    (s) => state.students.find((x) => x.id === s.studentId)?.schoolId === school?.id,
  );
  const approved = local.filter((s) => s.status === "aprovada");
  const decided = local.filter((s) => s.status !== "pendente");
  const completion = decided.length ? approved.length / local.length : 0;
  const score = school
    ? schoolScore(schoolTotals(state, school).totalPoints, school.active, school.enrolled)
    : 0;

  const series = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (13 - i));
        const key = d.toISOString().slice(0, 10);
        const n = approved.filter((s) => s.at.slice(0, 10) === key).length;
        // base sintética do restante da escola para visualização
        return {
          day: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
          missoes: 40 + ((i * 37) % 25) + i * 2 + n,
        };
      }),
    [approved],
  );

  const classes = ["8A", "8B", "9A"].map((c) => {
    const ids = state.students
      .filter((s) => s.classId === c && s.schoolId === school?.id)
      .map((s) => s.id);
    const subs = local.filter((s) => ids.includes(s.studentId));
    const ok = subs.filter((s) => s.status === "aprovada");
    const active = new Set(ok.map((s) => s.studentId)).size;
    return {
      c,
      students: ids.length,
      active,
      done: ok.length,
      pts: ok.reduce((a, s) => a + s.points, 0),
    };
  });

  const byCat = (Object.keys(CATEGORY_INFO) as Category[]).map((k) => ({
    k,
    n: approved.filter((s) => {
      const m = state.missions.find((x) => x.id === s.missionId);
      return m
        ? m.category === k
        : (k === "reciclagem" && s.missionId === "h1") ||
            (k === "energia" && s.missionId === "h2") ||
            (k === "horta" && s.missionId === "h4") ||
            (k === "quiz" && s.missionId === "h5");
    }).length,
  }));
  const maxCat = Math.max(1, ...byCat.map((x) => x.n));

  if (!school) return null;

  return (
    <>
      <PageHeader
        title={school.name}
        subtitle="Dados agregados da sua escola · sem exposição individual"
      />
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          icon="group"
          label="Alunos ativos"
          value={school.active}
          hint={`de ${school.enrolled} matriculados`}
        />
        <Stat
          icon="task_alt"
          label="Missões validadas"
          value={approved.length + 1840}
          hint="no período"
          tone="tertiary"
        />
        <Stat
          icon="percent"
          label="Taxa de conclusão"
          value={`${Math.round(completion * 100)}%`}
          hint="validadas / enviadas (amostra)"
          tone="warning"
        />
        <Stat
          icon="speed"
          label="Score normalizado"
          value={score.toFixed(1)}
          hint="pts por aluno ativo × engajamento"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="m3-card lg:col-span-2">
          <h2 className="mb-3 text-lg text-foreground">Evolução de missões validadas (14 dias)</h2>
          <div className="h-56 min-w-0">
            <ResponsiveContainer>
              <AreaChart data={series}>
                <defs>
                  <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="day"
                  tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--surface-1)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    color: "var(--foreground)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="missoes"
                  name="Missões"
                  stroke="var(--primary)"
                  strokeWidth={2}
                  fill="url(#g)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>
        <section className="m3-card">
          <h2 className="mb-3 text-lg text-foreground">Impacto por categoria</h2>
          <ul className="grid gap-3">
            {byCat.map(({ k, n }) => (
              <li key={k}>
                <div className="mb-1 flex items-center gap-2 text-sm text-foreground">
                  <Icon name={CATEGORY_INFO[k].icon} className="!text-lg text-primary" />
                  {CATEGORY_INFO[k].label}
                  <span className="ml-auto text-muted-foreground">{n}</span>
                </div>
                <div className="h-2 rounded-full bg-surface-3">
                  <div
                    className="h-full rounded-full bg-tertiary"
                    style={{ width: `${(n / maxCat) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="m3-card mt-4 overflow-x-auto">
        <h2 className="mb-3 text-lg text-foreground">Por turma</h2>
        <div className="grid gap-3 sm:hidden">
          {classes.map((c) => (
            <article key={c.c} className="border-b border-border pb-4 last:border-0">
              <h3 className="mb-2 font-medium">Turma {c.c}</h3>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-xs text-muted-foreground">Alunos (amostra)</dt>
                  <dd>{c.students}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Ativos</dt>
                  <dd>{c.active}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Missões validadas</dt>
                  <dd>{c.done}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Pontos</dt>
                  <dd className="text-primary">{c.pts}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
        <table className="hidden w-full text-sm sm:table">
          <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="py-2">Turma</th>
              <th>Alunos (amostra)</th>
              <th>Ativos</th>
              <th>Missões validadas</th>
              <th>Pontos</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-foreground">
            {classes.map((c) => (
              <tr key={c.c}>
                <td className="py-3 font-medium">{c.c}</td>
                <td>{c.students}</td>
                <td>{c.active}</td>
                <td>{c.done}</td>
                <td className="text-primary">{c.pts}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
