import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { currentRule, useEco, useStudentStats } from "@/lib/eco-store";
import { academicBonus, CENTRAL_BONUS_CAP } from "@/lib/scoring";
import { comparePeriods, computeStreak, milestonesFor, rankStudents } from "@/lib/ranking";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Icon, PageHeader, Stat, StatusChip, fmtDate } from "@/components/eco/ui";

export const Route = createFileRoute("/app/progresso")({
  head: () => ({
    meta: [
      { title: "Meu progresso — Eco School" },
      { name: "description", content: "Pontos, histórico e bônus acadêmico do aluno." },
      { property: "og:title", content: "Meu progresso — Eco School" },
      { property: "og:description", content: "Pontos, histórico e bônus acadêmico do aluno." },
    ],
  }),
  component: Progress,
});

function Progress() {
  const { state } = useEco();
  const stats = useStudentStats(state.currentStudentId);
  const rule = currentRule(state);
  const bonus = academicBonus(stats.confirmed, rule);
  const cap = Math.min(rule.maxBonus, CENTRAL_BONUS_CAP);
  const [range, setRange] = useState<7 | 30>(7);

  // Engajamento: mesmos pontos confirmados do ranking (computeStudentStats), sem fórmula paralela.
  const me = state.students.find((x) => x.id === state.currentStudentId);
  const myEntry = useMemo(
    () =>
      me
        ? (rankStudents(state, { scope: "escola", schoolId: me.schoolId }).entries.find(
            (e) => e.studentId === me.id,
          ) ?? null)
        : null,
    [state, me],
  );
  const streak = useMemo(
    () => computeStreak(stats.approved.map((x) => x.at.slice(0, 10))),
    [stats.approved],
  );
  const week = useMemo(() => comparePeriods(stats.approved, 7), [stats.approved]);
  const marks = milestonesFor(stats, state.attendance.minDays, myEntry?.rank ?? null);
  const trend =
    week.points > week.previousPoints
      ? `+${week.points - week.previousPoints} pts em relação à semana anterior. Ótima evolução!`
      : week.points === week.previousPoints && week.points > 0
        ? "Mesmo ritmo da semana anterior. Continue assim!"
        : week.points === 0
          ? "Complete uma missão hoje para começar uma nova sequência."
          : `Semana anterior: ${week.previousPoints} pts. Dá para retomar o ritmo!`;

  const chart = useMemo(
    () =>
      Array.from({ length: range }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (range - 1 - i));
        const key = d.toISOString().slice(0, 10);
        return {
          day: d.toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: range === 7 ? "short" : "2-digit",
          }),
          pts: stats.approved
            .filter((s) => s.at.slice(0, 10) === key)
            .reduce((a, s) => a + s.points, 0),
        };
      }),
    [stats, range],
  );

  const history = stats.subs.filter(
    (s) => new Date(s.at).getTime() >= Date.now() - range * 86400_000,
  );
  const titleOf = (id: string) =>
    state.missions.find((m) => m.id === id)?.title ?? "Missão anterior";

  return (
    <>
      <PageHeader
        title="Meu progresso"
        subtitle={`Regra vigente: ${rule.pointsPerTenth} pts = 0,1 na nota · teto ${cap.toFixed(1)}`}
      />
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          icon="stars"
          label="Confirmados"
          value={stats.confirmed}
          hint={
            stats.attendanceEarned
              ? `inclui +${stats.attendanceEarned} de assiduidade`
              : `assiduidade: ${stats.days}/${state.attendance.minDays} dias`
          }
        />
        <Stat
          icon="hourglass_top"
          label="Pendentes"
          value={stats.pendingPoints}
          tone="warning"
          hint="aguardando professor"
        />
        <Stat
          icon="workspace_premium"
          label="Bônus acadêmico"
          value={`+${bonus.toFixed(1)}`}
          tone="tertiary"
          hint={`teto ${cap.toFixed(1)}`}
        />
        <Stat
          icon="local_fire_department"
          label="Dias ativos"
          value={stats.days}
          hint="com missão validada"
        />
      </div>

      <section className="m3-card mb-6" aria-labelledby="jornada">
        <h2 id="jornada" className="mb-3 text-lg text-foreground">
          Sua jornada
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-primary-container p-4 text-on-primary-container">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
              <Icon name="local_fire_department" fill className="!text-lg" />
              Sequência
            </div>
            <div className="mt-1 font-display text-3xl font-extrabold">
              {streak} {streak === 1 ? "dia" : "dias"}
            </div>
            <div className="text-xs">
              {streak > 0 ? "seguidos com missão validada" : "valide uma missão para iniciar"}
            </div>
          </div>
          <div className="rounded-2xl bg-tertiary-container p-4 text-on-tertiary-container">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
              <Icon name="date_range" fill className="!text-lg" />
              Últimos 7 dias
            </div>
            <div className="mt-1 font-display text-3xl font-extrabold">
              {week.missions} {week.missions === 1 ? "missão" : "missões"}
            </div>
            <div className="text-xs">{trend}</div>
          </div>
          <Link
            to="/app/ranking"
            className="rounded-2xl bg-secondary p-4 text-secondary-foreground transition hover:shadow-[var(--shadow-elev)]"
          >
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
              <Icon name="leaderboard" fill className="!text-lg" />
              Ranking da escola
            </div>
            <div className="mt-1 font-display text-3xl font-extrabold">
              {myEntry ? `${myEntry.rank}º lugar` : "—"}
            </div>
            <div className="text-xs">
              {myEntry
                ? "Toque para ver o ranking completo"
                : "A primeira missão aprovada coloca você no ranking"}
            </div>
          </Link>
        </div>
        <ul className="mt-4 flex flex-wrap gap-2" aria-label="Marcos de participação">
          {marks.map((m) => (
            <li
              key={m.id}
              className={cn(
                "inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold",
                m.earned
                  ? "border-primary/40 bg-primary-container text-on-primary-container"
                  : "border-dashed border-input text-muted-foreground",
              )}
            >
              <Icon name={m.earned ? m.icon : "lock"} fill={m.earned} className="!text-base" />
              {m.label}
              {m.earned ? "" : " · em breve"}
            </li>
          ))}
        </ul>
      </section>

      <section className="m3-card mb-6">
        <div className="mb-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
          <h2 className="text-lg text-foreground">Evolução</h2>
          <div className="flex gap-2">
            {[7, 30].map((r) => (
              <Button
                variant="chip"
                aria-pressed={range === r}
                key={r}
                data-active={range === r}
                onClick={() => setRange(r as 7 | 30)}
              >
                {r} dias
              </Button>
            ))}
          </div>
        </div>
        <div className="h-48 min-w-0">
          <ResponsiveContainer>
            <BarChart data={chart}>
              <XAxis
                dataKey="day"
                tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: "var(--surface-2)" }}
                contentStyle={{
                  background: "var(--surface-1)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  color: "var(--foreground)",
                }}
              />
              <Bar dataKey="pts" name="Pontos" fill="var(--primary)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="m3-card">
        <h2 className="mb-3 text-lg text-foreground">Histórico</h2>
        <ul className="divide-y divide-border">
          {history.map((s) => (
            <li
              key={s.id}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 py-3 sm:flex"
            >
              <Icon
                name="history"
                className="hidden shrink-0 text-muted-foreground sm:inline-block"
              />
              <div className="min-w-0 flex-1">
                <div className="break-words text-foreground">{titleOf(s.missionId)}</div>
                <div className="break-words text-xs text-muted-foreground">
                  {fmtDate(s.at)}
                  {s.reason ? ` · ${s.reason}` : ""}
                </div>
              </div>
              <span className="text-sm text-foreground">
                {s.status === "rejeitada" ? "—" : `+${s.points}`}
              </span>
              <StatusChip status={s.status} />
            </li>
          ))}
        </ul>
        {history.length === 0 && (
          <p className="text-sm text-muted-foreground">Nada neste período.</p>
        )}
      </section>
    </>
  );
}
