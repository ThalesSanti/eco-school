import { describe, expect, it } from "vitest";
import type { EcoState, Student, Submission } from "./eco-store";
import { demoStudents, demoSubmissions, mergeDemoData, DEMO_STUDENT_DEFS } from "./demo-data";
import {
  abbreviateName,
  comparePeriods,
  computeStreak,
  computeStudentStats,
  milestonesFor,
  motivationalMessage,
  rankStudents,
  type RankedStudent,
} from "./ranking";
import { studentPoints } from "./scoring";

const NOW = new Date("2026-11-14T15:00:00Z");
const attendance = { enabled: true, bonus: 20, minDays: 3 };
const schools = [
  { id: "s1", name: "Escola Um", region: "Jaú", enrolled: 100, active: 50, basePoints: 0 },
  { id: "s2", name: "Escola Dois", region: "Jaú", enrolled: 100, active: 50, basePoints: 0 },
  { id: "s3", name: "Escola Três", region: "Bariri", enrolled: 100, active: 50, basePoints: 0 },
  { id: "s4", name: "Escola Quatro", region: "Itapuí", enrolled: 100, active: 0, basePoints: 0 },
];
const stu = (id: string, name: string, classId: string, schoolId: string): Student => ({
  id,
  name,
  classId,
  schoolId,
});
let n = 0;
const sub = (
  studentId: string,
  day: string,
  points: number,
  status: Submission["status"] = "aprovada",
): Submission => ({
  id: `t${++n}`,
  missionId: "m",
  studentId,
  at: `${day}T12:00:00Z`,
  note: "",
  status,
  points,
});
type S = Pick<EcoState, "students" | "submissions" | "schools" | "attendance">;
const mk = (students: Student[], submissions: Submission[]): S => ({
  students,
  submissions,
  schools,
  attendance,
});

describe("abbreviateName", () => {
  it("abrevia o sobrenome para proteger a privacidade", () => {
    expect(abbreviateName("Ana Souza")).toBe("Ana S.");
    expect(abbreviateName("João Pedro Dias")).toBe("João D.");
    expect(abbreviateName("  Maria  ")).toBe("Maria");
    expect(abbreviateName("")).toBe("Aluno");
  });
});

describe("computeStudentStats", () => {
  it("só conta aprovadas e aplica o bônus de assiduidade de scoring.ts", () => {
    const st = mk(
      [stu("a", "Ana Souza", "8A", "s1")],
      [
        sub("a", "2026-11-10", 30),
        sub("a", "2026-11-11", 25),
        sub("a", "2026-11-12", 35),
        sub("a", "2026-11-13", 40, "pendente"),
        sub("a", "2026-11-13", 20, "rejeitada"),
      ],
    );
    const x = computeStudentStats(st, "a");
    expect(x.days).toBe(3);
    expect(x.confirmed).toBe(
      studentPoints([30, 25, 35], 3, { attendanceEnabled: true, attendanceBonus: 20, minDays: 3 }),
    );
    expect(x.confirmed).toBe(110);
    expect(x.attendanceEarned).toBe(20);
    expect(x.pendingPoints).toBe(40);
  });
  it("sem assiduidade habilitada não há bônus", () => {
    const st = {
      ...mk([stu("a", "Ana", "8A", "s1")], [sub("a", "2026-11-10", 30)]),
      attendance: { ...attendance, enabled: false },
    };
    expect(computeStudentStats(st, "a").confirmed).toBe(30);
  });
});

describe("rankStudents", () => {
  const students = [
    stu("a", "Ana Souza", "8A", "s1"),
    stu("b", "Bruno Alves", "8A", "s1"),
    stu("c", "Clara Mendes", "8B", "s1"),
    stu("d", "Diego Rocha", "8A", "s2"),
    stu("e", "Eva Martins", "9A", "s3"),
    stu("f", "Felipe Costa", "9A", "s1"),
    stu("g", "Gabi Lima", "8A", "s4"),
  ];
  const subs = [
    sub("a", "2026-11-10", 50),
    sub("a", "2026-11-11", 50), // 100 (2 missões, 2 dias)
    sub("b", "2026-11-10", 100), // 100 (1 missão, 1 dia)
    sub("c", "2026-11-10", 30),
    sub("c", "2026-11-11", 30),
    sub("c", "2026-11-12", 30), // 90 + 20 = 110
    sub("d", "2026-11-10", 60),
    sub("d", "2026-11-10", 40), // 100 (2 missões, 1 dia)
    sub("e", "2026-11-10", 10),
    sub("f", "2026-11-10", 99, "pendente"),
    sub("f", "2026-11-11", 99, "rejeitada"), // não conta
  ];
  const state = mk(students, subs);

  it("ordena por pontos, depois missões aprovadas, depois dias ativos", () => {
    const r = rankStudents(state, { scope: "regiao", region: "Jaú" });
    expect(r.entries.map((e) => e.studentId)).toEqual(["c", "a", "d", "b"]);
    expect(r.entries.map((e) => e.points)).toEqual([110, 100, 100, 100]);
  });
  it("dá a mesma posição a quem empata nos três critérios", () => {
    const tied = mk(
      [
        stu("x", "Xavier Lima", "8A", "s1"),
        stu("y", "Yara Lima", "8A", "s1"),
        stu("z", "Zeca Lima", "8A", "s1"),
      ],
      [sub("x", "2026-11-10", 40), sub("y", "2026-11-10", 40), sub("z", "2026-11-10", 10)],
    );
    expect(
      rankStudents(tied, { scope: "escola", schoolId: "s1" }).entries.map((e) => e.rank),
    ).toEqual([1, 1, 3]);
  });
  it("pendentes e rejeitadas não pontuam nem colocam o aluno no ranking", () => {
    const r = rankStudents(state, { scope: "escola", schoolId: "s1" });
    expect(r.entries.some((e) => e.studentId === "f")).toBe(false);
    expect(r.withoutPoints).toBe(1);
    expect(r.totalInScope).toBe(4);
  });
  it("filtro por escola, turma e região altera os resultados", () => {
    const escola = rankStudents(state, { scope: "escola", schoolId: "s1" }).entries.map(
      (e) => e.studentId,
    );
    const turma = rankStudents(state, {
      scope: "turma",
      schoolId: "s1",
      classId: "8A",
    }).entries.map((e) => e.studentId);
    const regiao = rankStudents(state, { scope: "regiao", region: "Jaú" }).entries.map(
      (e) => e.studentId,
    );
    expect(escola).toEqual(["c", "a", "b"]);
    expect(turma).toEqual(["a", "b"]);
    expect(regiao).toContain("d");
    expect(escola).not.toContain("d");
    expect(
      rankStudents(state, { scope: "regiao", region: "Bariri" }).entries.map((e) => e.studentId),
    ).toEqual(["e"]);
  });
  it("recortes sem alunos ou sem pontuação retornam vazio (estado vazio na tela)", () => {
    expect(rankStudents(state, { scope: "regiao", region: "Itapuí" })).toEqual({
      entries: [],
      withoutPoints: 1,
      totalInScope: 1,
    });
    expect(rankStudents(state, { scope: "regiao", region: "Inexistente" }).totalInScope).toBe(0);
    expect(rankStudents(state, { scope: "escola" }).entries).toEqual([]);
  });
  it("expõe somente nome abreviado", () => {
    const r = rankStudents(state, { scope: "regiao", region: "Jaú" });
    for (const e of r.entries) expect(e.displayName).toMatch(/^\S+ \S\.$/);
  });
});

describe("dados de demonstração", () => {
  const base = { students: [stu("st1", "Ana Souza", "8A", "s1")], submissions: [] as Submission[] };
  it("são determinísticos, marcados como demo e sem alunos para a escola vazia", () => {
    expect(demoSubmissions(NOW)).toEqual(demoSubmissions(NOW));
    expect(demoStudents().every((s) => s.demo === true)).toBe(true);
    expect(new Set(DEMO_STUDENT_DEFS.map((d) => d.id)).size).toBe(DEMO_STUDENT_DEFS.length);
    expect(DEMO_STUDENT_DEFS.some((d) => d.schoolId === "s5")).toBe(false);
  });
  it("a pontuação vem das atividades de cada aluno, não do total da escola", () => {
    const state = mk(demoStudents(), demoSubmissions(NOW));
    const r = rankStudents(
      {
        ...state,
        schools: [
          { ...schools[0]!, id: "s1" },
          { ...schools[1]!, id: "s2" },
          { ...schools[2]!, id: "s3" },
          { ...schools[3]!, id: "s4" },
        ],
      },
      { scope: "escola", schoolId: "s2" },
    );
    for (const e of r.entries) {
      const own = computeStudentStats(state, e.studentId);
      expect(e.points).toBe(own.confirmed);
    }
  });
  it("mesclar dados antigos é idempotente e preserva os registros existentes", () => {
    const once = mergeDemoData(base, NOW);
    const twice = mergeDemoData(once, NOW);
    expect(once.students[0]).toEqual(base.students[0]);
    expect(once.students.length).toBe(1 + DEMO_STUDENT_DEFS.length);
    expect(twice).toBe(once);
  });
});

describe("engajamento", () => {
  it("sequência de dias consecutivos termina hoje ou ontem", () => {
    expect(computeStreak(["2026-11-14", "2026-11-13", "2026-11-12", "2026-11-10"], NOW)).toBe(3);
    expect(computeStreak(["2026-11-13", "2026-11-12"], NOW)).toBe(2);
    expect(computeStreak(["2026-11-10"], NOW)).toBe(0);
    expect(computeStreak([], NOW)).toBe(0);
  });
  it("compara os últimos 7 dias com os 7 anteriores", () => {
    const approved = [
      sub("a", "2026-11-13", 30),
      sub("a", "2026-11-12", 20),
      sub("a", "2026-11-05", 25),
    ];
    expect(comparePeriods(approved, 7, NOW)).toEqual({
      missions: 2,
      previousMissions: 1,
      points: 50,
      previousPoints: 25,
    });
  });
  it("marcos refletem a participação", () => {
    const m = milestonesFor(
      { approved: [sub("a", "2026-11-13", 30)], days: 1, confirmed: 30 },
      3,
      12,
    );
    expect(m.filter((x) => x.earned).map((x) => x.id)).toEqual(["first"]);
    expect(
      milestonesFor({ approved: [], days: 5, confirmed: 120 }, 3, 4)
        .filter((x) => x.earned)
        .map((x) => x.id),
    ).toEqual(["days", "points", "top10"]);
  });
});

describe("motivationalMessage", () => {
  const e = (rank: number, points: number): RankedStudent => ({
    rank,
    studentId: `s${rank}`,
    displayName: "A B.",
    schoolId: "s1",
    schoolName: "E",
    region: "Jaú",
    classId: "8A",
    points,
    approvedCount: 1,
    activeDays: 1,
    demo: false,
  });
  it("mensagens positivas por faixa de posição", () => {
    const all = [e(1, 100), e(2, 90), e(11, 10), e(12, 5)];
    expect(motivationalMessage(null, all, "escola")).toMatch(/primeira missão/);
    expect(motivationalMessage(all[0]!, all, "escola")).toMatch(/Pódio/);
    expect(motivationalMessage(e(8, 50), all, "escola")).toBe(
      "Você está entre os 10 alunos mais engajados da sua escola!",
    );
    expect(motivationalMessage(all[3]!, all, "turma")).toMatch(
      /^Continue participando! Você está evoluindo no ranking/,
    );
    expect(motivationalMessage(all[3]!, all, "turma")).toMatch(/faltam 5 pts para a posição 11/);
  });
});
