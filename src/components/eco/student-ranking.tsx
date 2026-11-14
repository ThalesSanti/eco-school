import { useMemo, useState } from "react";
import { useEco, type Role } from "@/lib/eco-store";
import {
  motivationalMessage,
  rankStudents,
  type RankedStudent,
  type RankingScope,
} from "@/lib/ranking";
import { Empty, Icon } from "@/components/eco/ui";
import { cn } from "@/lib/utils";

const SCOPES_BY_ROLE: Partial<Record<Role, RankingScope[]>> = {
  aluno: ["escola", "turma"],
  professor: ["escola", "turma"],
  gestor: ["escola", "turma"],
  regional: ["regiao", "escola", "turma"],
};

const SCOPE_TAB_LABEL = (role: Role, scope: RankingScope) => {
  if (scope === "regiao") return "Região";
  if (role === "aluno") return scope === "escola" ? "Minha escola" : "Minha turma";
  return scope === "escola" ? "Escola" : "Turma";
};

const TIER = {
  1: { label: "1º lugar", border: "border-gold", bg: "bg-gold-soft", bar: "bg-gold", icon: "text-gold", h: "h-28 sm:h-36" },
  2: { label: "2º lugar", border: "border-silver", bg: "bg-silver-soft", bar: "bg-silver", icon: "text-silver", h: "h-20 sm:h-28" },
  3: { label: "3º lugar", border: "border-bronze", bg: "bg-bronze-soft", bar: "bg-bronze", icon: "text-bronze", h: "h-16 sm:h-24" },
} as const;
const tierOf = (rank: number) => TIER[(rank <= 1 ? 1 : rank === 2 ? 2 : 3) as 1 | 2 | 3];

function subtitleFor(e: RankedStudent, scope: RankingScope) {
  if (scope === "regiao") return `${e.schoolName} · ${e.classId}`;
  if (scope === "turma") return `Turma ${e.classId} · ${e.schoolName}`;
  return `Turma ${e.classId}`;
}

function DemoTag({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <span className="rounded-md border border-border bg-surface-2 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
      demo
    </span>
  );
}

function Podium({ entries, myId, scope }: { entries: RankedStudent[]; myId: string | null; scope: RankingScope }) {
  const top = entries.slice(0, 3);
  // Disposição clássica de pódio: 2º, 1º, 3º.
  const slots = [top[1], top[0], top[2]].filter((x): x is RankedStudent => !!x);
  return (
    <section aria-label="Pódio" className="m3-card-hi hero-glow pt-8">
      <ol className="mx-auto flex max-w-xl items-end justify-center gap-2 sm:gap-4">
        {slots.map((e) => {
          const t = tierOf(e.rank);
          const mine = e.studentId === myId;
          return (
            <li key={e.studentId} className="flex min-w-0 flex-1 flex-col items-center text-center">
              <Icon name="workspace_premium" fill className={cn("!text-3xl", t.icon)} />
              <div
                className={cn(
                  "mt-1 grid size-12 place-items-center rounded-full border-2 font-display text-lg font-bold text-foreground sm:size-14",
                  t.border,
                  t.bg,
                  mine && "ring-2 ring-primary ring-offset-2 ring-offset-surface-2",
                )}
                aria-hidden
              >
                {e.displayName.charAt(0)}
              </div>
              <div className="mt-2 w-full truncate text-sm font-semibold text-foreground">
                {e.displayName}
                {mine && <span className="ml-1 text-primary">(você)</span>}
              </div>
              <div className="w-full truncate text-xs text-muted-foreground">{subtitleFor(e, scope)}</div>
              <div className="mt-1 font-display text-lg font-extrabold text-foreground">
                {e.points} <span className="text-xs font-semibold text-muted-foreground">pts</span>
              </div>
              <div className="text-[11px] text-muted-foreground">
                {e.approvedCount} missões · {e.activeDays} dias
              </div>
              <div
                className={cn(
                  "mt-2 grid w-full place-items-start justify-items-center rounded-t-2xl pt-2 font-display text-2xl font-extrabold text-foreground/80",
                  t.bar,
                  t.h,
                )}
              >
                <span aria-label={t.label}>{e.rank}º</span>
              </div>
              <DemoTag show={e.demo} />
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function Row({ e, scope, mine }: { e: RankedStudent; scope: RankingScope; mine: boolean }) {
  return (
    <li
      aria-current={mine ? "true" : undefined}
      className={cn(
        "m3-card flex items-center gap-3 !p-3 sm:!p-4",
        mine && "!border-primary bg-primary-container ring-2 ring-primary/40",
      )}
    >
      <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-secondary font-display text-base font-bold text-secondary-foreground">
        {e.rank}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="truncate font-semibold text-foreground">{e.displayName}</span>
          {mine && <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-primary-foreground">Você</span>}
          <DemoTag show={e.demo} />
        </div>
        <div className="truncate text-xs text-muted-foreground">{subtitleFor(e, scope)}</div>
        <div className="mt-0.5 text-xs text-muted-foreground sm:hidden">
          {e.approvedCount} missões · {e.activeDays} dias ativos
        </div>
      </div>
      <dl className="hidden items-center gap-5 text-right text-xs text-muted-foreground sm:flex">
        <div>
          <dt>Missões</dt>
          <dd className="font-semibold text-foreground">{e.approvedCount}</dd>
        </div>
        <div>
          <dt>Dias ativos</dt>
          <dd className="font-semibold text-foreground">{e.activeDays}</dd>
        </div>
      </dl>
      <div className="text-right">
        <div className="font-display text-xl font-extrabold text-primary">{e.points}</div>
        <div className="text-[11px] text-muted-foreground">pontos</div>
      </div>
    </li>
  );
}

export function StudentRanking() {
  const { state } = useEco();
  const role: Role = state.role ?? "aluno";
  const scopes: RankingScope[] = SCOPES_BY_ROLE[role] ?? ["escola"];
  const me = state.students.find((s) => s.id === state.currentStudentId) ?? null;
  const isStudent = role === "aluno";
  const myId = isStudent ? (me?.id ?? null) : null;

  const [scopeSel, setScopeSel] = useState<RankingScope>(scopes[0] ?? "escola");
  const [regionSel, setRegionSel] = useState("Jaú");
  const [schoolSel, setSchoolSel] = useState(state.schools[0]?.id ?? "");
  const [classSel, setClassSel] = useState("");

  const scope: RankingScope = scopes.includes(scopeSel) ? scopeSel : (scopes[0] ?? "escola");
  const regions = useMemo(() => [...new Set(state.schools.map((s) => s.region))], [state.schools]);
  const region = regions.includes(regionSel) ? regionSel : (regions[0] ?? "");

  // Escola fixa para aluno (a dele), professor e gestor (escola da unidade); regional escolhe.
  const fixedSchoolId = isStudent ? me?.schoolId : role === "regional" ? undefined : state.schools[0]?.id;
  const schoolId = fixedSchoolId ?? (state.schools.some((s) => s.id === schoolSel) ? schoolSel : state.schools[0]?.id);
  const school = state.schools.find((s) => s.id === schoolId);

  const classes = useMemo(
    () => [...new Set(state.students.filter((s) => s.schoolId === schoolId).map((s) => s.classId))].sort(),
    [state.students, schoolId],
  );
  const classId = isStudent ? me?.classId : classes.includes(classSel) ? classSel : classes[0];

  const result = useMemo(
    () => rankStudents(state, { scope, schoolId, classId, region }),
    [state, scope, schoolId, classId, region],
  );
  const mine = myId ? (result.entries.find((e) => e.studentId === myId) ?? null) : null;
  const message = isStudent ? motivationalMessage(mine, result.entries, scope) : null;
  const scopeName =
    scope === "regiao" ? `Região ${region}` : scope === "turma" ? `Turma ${classId ?? "—"} · ${school?.name ?? ""}` : (school?.name ?? "");

  return (
    <div className="grid gap-4">
      {/* Filtros */}
      <section className="m3-card flex flex-wrap items-end gap-3" aria-label="Filtros do ranking">
        <div className="min-w-0">
          <div className="mb-1 text-sm text-muted-foreground">Visualizar por</div>
          <div className="eco-segment" role="group" aria-label="Tipo de ranking">
            {scopes.map((sc) => (
              <button key={sc} aria-pressed={scope === sc} onClick={() => setScopeSel(sc)}>
                {SCOPE_TAB_LABEL(role, sc)}
              </button>
            ))}
          </div>
        </div>
        {scope === "regiao" && (
          <label className="grid min-w-40 gap-1 text-sm text-muted-foreground">
            Região
            <select className="m3-field" value={region} onChange={(e) => setRegionSel(e.target.value)}>
              {regions.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </label>
        )}
        {scope !== "regiao" && role === "regional" && (
          <label className="grid min-w-52 gap-1 text-sm text-muted-foreground">
            Escola
            <select className="m3-field" value={schoolId ?? ""} onChange={(e) => setSchoolSel(e.target.value)}>
              {state.schools.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </label>
        )}
        {scope === "turma" && !isStudent && (
          <label className="grid min-w-32 gap-1 text-sm text-muted-foreground">
            Turma
            <select className="m3-field" value={classId ?? ""} onChange={(e) => setClassSel(e.target.value)} disabled={classes.length === 0}>
              {classes.length === 0 && <option value="">Sem turmas</option>}
              {classes.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>
        )}
      </section>

      {/* Mensagem / resumo pessoal */}
      {isStudent ? (
        <section className="m3-card-hi flex flex-wrap items-center gap-4" aria-live="polite">
          <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground">
            <Icon name={mine && mine.rank <= 3 ? "emoji_events" : "trending_up"} fill className="!text-3xl" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {mine ? `Sua posição: ${mine.rank}º de ${result.entries.length}` : "Sua posição"}
            </div>
            <p className="mt-0.5 font-display text-lg font-bold leading-snug text-foreground">{message}</p>
          </div>
          {mine && (
            <div className="flex gap-4 text-center text-xs text-muted-foreground">
              <div><div className="font-display text-xl font-extrabold text-primary">{mine.points}</div>pontos</div>
              <div><div className="font-display text-xl font-extrabold text-foreground">{mine.approvedCount}</div>missões</div>
              <div><div className="font-display text-xl font-extrabold text-foreground">{mine.activeDays}</div>dias</div>
            </div>
          )}
        </section>
      ) : (
        <section className="m3-card-hi flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <Icon name="groups" className="text-primary" />
          <span className="font-semibold text-foreground">{scopeName}</span>
          <span>· {result.entries.length} {result.entries.length === 1 ? "aluno pontuou" : "alunos pontuaram"}</span>
          {result.withoutPoints > 0 && <span>· {result.withoutPoints} ainda sem missões aprovadas</span>}
        </section>
      )}

      {/* Conteúdo */}
      {result.totalInScope === 0 ? (
        <Empty
          icon="school"
          title="Ainda não há alunos neste recorte"
          text="Não há estudantes cadastrados para esta seleção, então não há dados suficientes para montar o ranking."
        />
      ) : result.entries.length === 0 ? (
        <Empty
          icon="eco"
          title="O ranking começa na primeira missão aprovada"
          text="Há alunos neste recorte, mas nenhuma atividade foi aprovada ainda. Pendentes e rejeitadas não contam pontos."
        />
      ) : (
        <>
          <Podium entries={result.entries} myId={myId} scope={scope} />
          {result.entries.length > 3 && (
            <ol className="grid gap-2" aria-label="Demais posições">
              {result.entries.slice(3).map((e) => (
                <Row key={e.studentId} e={e} scope={scope} mine={e.studentId === myId} />
              ))}
            </ol>
          )}
        </>
      )}

      <p className="flex items-start gap-2 text-xs text-muted-foreground">
        <Icon name="shield" className="!text-base" />
        <span>
          Ordem: pontos confirmados (missões aprovadas + bônus de assiduidade), depois missões aprovadas e dias ativos.
          Atividades pendentes ou rejeitadas não contam. Nomes abreviados para proteger a privacidade. Todos os dados
          desta versão são fictícios de demonstração; os registros marcados como “demo” foram criados apenas para
          exemplificar o ranking entre escolas.
        </span>
      </p>
    </div>
  );
}
