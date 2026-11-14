// Regras puras do ranking de alunos. Reaproveita studentPoints (RN09) de scoring.ts:
// não existe segunda fórmula de pontuação. Sem efeitos colaterais; coberto por ranking.test.ts.
import { studentPoints } from "./scoring";
import type { EcoState, Student, Submission } from "./eco-store";

export type RankingScope = "escola" | "turma" | "regiao";

export interface RankingFilter {
  scope: RankingScope;
  schoolId?: string | undefined;
  classId?: string | undefined;
  region?: string | undefined;
}

export interface StudentStats {
  subs: Submission[];
  approved: Submission[];
  pending: Submission[];
  days: number;
  confirmed: number;
  attendanceEarned: number;
  pendingPoints: number;
}

/** Estatísticas individuais: só atividades aprovadas contam como pontos confirmados. */
export function computeStudentStats(
  state: Pick<EcoState, "submissions" | "attendance">,
  studentId: string,
): StudentStats {
  const subs = state.submissions.filter((s) => s.studentId === studentId);
  const approved = subs.filter((s) => s.status === "aprovada");
  const pending = subs.filter((s) => s.status === "pendente");
  const days = new Set(approved.map((s) => s.at.slice(0, 10))).size;
  const baseSum = approved.reduce((a, s) => a + s.points, 0);
  const confirmed = studentPoints(
    approved.map((s) => s.points),
    days,
    {
      attendanceEnabled: state.attendance.enabled,
      attendanceBonus: state.attendance.bonus,
      minDays: state.attendance.minDays,
    },
  );
  return {
    subs,
    approved,
    pending,
    days,
    confirmed,
    attendanceEarned: confirmed - baseSum,
    pendingPoints: pending.reduce((a, s) => a + s.points, 0),
  };
}

/** "Ana Souza" -> "Ana S." (privacidade: nunca exibir o sobrenome completo no ranking). */
export function abbreviateName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "Aluno";
  const first = parts[0]!;
  if (parts.length === 1) return first;
  const last = parts[parts.length - 1]!;
  return `${first} ${last.charAt(0).toUpperCase()}.`;
}

export interface RankedStudent {
  rank: number;
  studentId: string;
  displayName: string;
  schoolId: string;
  schoolName: string;
  region: string;
  classId: string;
  points: number;
  approvedCount: number;
  activeDays: number;
  demo: boolean;
}

export interface RankingResult {
  entries: RankedStudent[];
  /** alunos do recorte que ainda não têm nenhuma missão aprovada (não aparecem no ranking) */
  withoutPoints: number;
  /** total de alunos cadastrados no recorte */
  totalInScope: number;
}

function inScope(
  student: Student,
  state: Pick<EcoState, "schools">,
  filter: RankingFilter,
): boolean {
  const school = state.schools.find((x) => x.id === student.schoolId);
  if (!school) return false;
  switch (filter.scope) {
    case "escola":
      return !!filter.schoolId && student.schoolId === filter.schoolId;
    case "turma":
      return (
        !!filter.schoolId && student.schoolId === filter.schoolId && student.classId === filter.classId
      );
    case "regiao":
      return !!filter.region && school.region === filter.region;
  }
}

/**
 * Classifica alunos do recorte. Critério: pontuação confirmada (desc), depois missões
 * aprovadas (desc), depois dias ativos (desc). Empate nos três critérios divide a posição
 * ("1, 2, 2, 4"). Pendentes e rejeitadas nunca contam; alunos sem aprovação não entram.
 */
export function rankStudents(
  state: Pick<EcoState, "students" | "submissions" | "schools" | "attendance">,
  filter: RankingFilter,
): RankingResult {
  const scoped = state.students.filter((s) => inScope(s, state, filter));
  const scored = scoped
    .map((s) => {
      const stats = computeStudentStats(state, s.id);
      const school = state.schools.find((x) => x.id === s.schoolId);
      return {
        student: s,
        points: stats.confirmed,
        approvedCount: stats.approved.length,
        activeDays: stats.days,
        schoolName: school?.name ?? "",
        region: school?.region ?? "",
      };
    })
    .filter((x) => x.approvedCount > 0);

  scored.sort(
    (a, b) =>
      b.points - a.points ||
      b.approvedCount - a.approvedCount ||
      b.activeDays - a.activeDays ||
      a.student.name.localeCompare(b.student.name, "pt-BR"),
  );

  const entries: RankedStudent[] = [];
  scored.forEach((x, i) => {
    const prev = scored[i - 1];
    const tied =
      prev &&
      prev.points === x.points &&
      prev.approvedCount === x.approvedCount &&
      prev.activeDays === x.activeDays;
    const rank = tied ? entries[i - 1]!.rank : i + 1;
    entries.push({
      rank,
      studentId: x.student.id,
      displayName: abbreviateName(x.student.name),
      schoolId: x.student.schoolId,
      schoolName: x.schoolName,
      region: x.region,
      classId: x.student.classId,
      points: x.points,
      approvedCount: x.approvedCount,
      activeDays: x.activeDays,
      demo: x.student.demo === true,
    });
  });
  return { entries, withoutPoints: scoped.length - scored.length, totalInScope: scoped.length };
}

/** Sequência de dias consecutivos com missão aprovada, terminando hoje ou ontem. */
export function computeStreak(approvedDayKeys: string[], now: Date = new Date()): number {
  const set = new Set(approvedDayKeys);
  const key = (d: Date) => d.toISOString().slice(0, 10);
  const cursor = new Date(now);
  if (!set.has(key(cursor))) cursor.setUTCDate(cursor.getUTCDate() - 1);
  let streak = 0;
  while (set.has(key(cursor))) {
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}

export interface PeriodComparison {
  missions: number;
  previousMissions: number;
  points: number;
  previousPoints: number;
}

/** Compara os últimos `days` dias com os `days` anteriores (somente aprovadas). */
export function comparePeriods(
  approved: Submission[],
  days = 7,
  now: Date = new Date(),
): PeriodComparison {
  const span = days * 86_400_000;
  const t = now.getTime();
  const cur = approved.filter((s) => {
    const x = new Date(s.at).getTime();
    return x > t - span && x <= t;
  });
  const prev = approved.filter((s) => {
    const x = new Date(s.at).getTime();
    return x > t - 2 * span && x <= t - span;
  });
  const sum = (l: Submission[]) => l.reduce((a, s) => a + s.points, 0);
  return {
    missions: cur.length,
    previousMissions: prev.length,
    points: sum(cur),
    previousPoints: sum(prev),
  };
}

export interface Milestone {
  id: string;
  label: string;
  icon: string;
  earned: boolean;
}

export function milestonesFor(
  stats: Pick<StudentStats, "approved" | "days" | "confirmed">,
  minDays: number,
  rank: number | null,
): Milestone[] {
  return [
    { id: "first", label: "Primeira missão", icon: "flag", earned: stats.approved.length >= 1 },
    {
      id: "days",
      label: `${minDays} dias ativos`,
      icon: "local_fire_department",
      earned: stats.days >= minDays,
    },
    { id: "points", label: "100 pontos", icon: "stars", earned: stats.confirmed >= 100 },
    { id: "top10", label: "Top 10 da escola", icon: "military_tech", earned: rank !== null && rank <= 10 },
  ];
}

export const SCOPE_LABEL: Record<RankingScope, string> = {
  escola: "da sua escola",
  turma: "da sua turma",
  regiao: "da região",
};

/** Mensagem motivacional e positiva; nunca expõe quem está em posições baixas. */
export function motivationalMessage(
  me: RankedStudent | null,
  entries: RankedStudent[],
  scope: RankingScope,
): string {
  if (!me) return "Conclua sua primeira missão aprovada para entrar no ranking. Você consegue!";
  const where = SCOPE_LABEL[scope];
  if (me.rank <= 3) return `Pódio! Você está entre os 3 alunos mais engajados ${where}!`;
  if (me.rank <= 10) return `Você está entre os 10 alunos mais engajados ${where}!`;
  const above = entries.filter((e) => e.rank < me.rank).at(-1);
  if (above) {
    const gap = Math.max(1, above.points - me.points);
    return `Continue participando! Você está evoluindo no ranking — faltam ${gap} pts para a posição ${above.rank}.`;
  }
  return "Continue participando! Você está evoluindo no ranking.";
}
