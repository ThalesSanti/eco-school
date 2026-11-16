// Dados FICTÍCIOS de demonstração do ranking de alunos. Nada aqui é resultado real.
// Todo registro é determinístico (sem aleatoriedade) e a pontuação de cada aluno é
// calculada a partir das atividades abaixo, nunca distribuída a partir do total da escola.
import type { Student, Submission } from "./eco-store";

/** Pontos das missões históricas de demonstração (mesmos valores já usados no seed). */
const POINTS: Record<string, number> = { h1: 30, h2: 25, h3: 20, h4: 35, h5: 15 };

type Entry = [missionId: string, daysAgo: number, status?: "aprovada" | "pendente" | "rejeitada"];
interface DemoStudent {
  id: string;
  name: string;
  classId: string;
  schoolId: string;
  entries: Entry[];
}

export const DEMO_STUDENT_DEFS: DemoStudent[] = [
  // EE Prof. Jahu Centro (s1) — complementam os alunos já existentes
  {
    id: "st7",
    name: "Gabriela Nunes",
    classId: "8A",
    schoolId: "s1",
    entries: [
      ["h1", 5],
      ["h4", 3],
      ["h3", 2],
    ],
  },
  {
    id: "st8",
    name: "Henrique Lopes",
    classId: "8B",
    schoolId: "s1",
    entries: [
      ["h2", 6],
      ["h1", 4],
    ],
  },
  {
    id: "st9",
    name: "Isabela Freitas",
    classId: "9A",
    schoolId: "s1",
    entries: [
      ["h4", 5],
      ["h1", 3],
      ["h2", 2],
    ],
  },
  {
    id: "st10",
    name: "João Pedro Dias",
    classId: "9A",
    schoolId: "s1",
    entries: [
      ["h4", 6],
      ["h1", 5],
      ["h2", 4],
      ["h5", 3],
      ["h3", 1],
    ],
  },
  // EE Vila Ribeiro (s2)
  {
    id: "st11",
    name: "Larissa Prado",
    classId: "8A",
    schoolId: "s2",
    entries: [
      ["h4", 6],
      ["h2", 5],
      ["h5", 2],
    ],
  },
  {
    id: "st12",
    name: "Mateus Ribeiro",
    classId: "8A",
    schoolId: "s2",
    entries: [
      ["h4", 4],
      ["h1", 2],
    ],
  },
  {
    id: "st13",
    name: "Natália Cruz",
    classId: "8B",
    schoolId: "s2",
    entries: [
      ["h5", 3],
      ["h2", 2],
      ["h1", 1],
      ["h3", 1, "pendente"],
    ],
  },
  {
    id: "st14",
    name: "Otávio Lima",
    classId: "9A",
    schoolId: "s2",
    entries: [
      ["h5", 5],
      ["h3", 2, "rejeitada"],
    ],
  },
  {
    id: "st15",
    name: "Paula Gomes",
    classId: "9A",
    schoolId: "s2",
    entries: [
      ["h4", 5],
      ["h5", 3],
    ],
  },
  // EE Jardim Pires (s3)
  {
    id: "st16",
    name: "Rafael Torres",
    classId: "8A",
    schoolId: "s3",
    entries: [
      ["h1", 6],
      ["h2", 6],
      ["h4", 4],
    ],
  },
  {
    id: "st17",
    name: "Sofia Barros",
    classId: "8A",
    schoolId: "s3",
    entries: [
      ["h4", 6],
      ["h1", 5],
      ["h2", 3],
      ["h5", 3],
    ],
  },
  {
    id: "st18",
    name: "Tiago Vieira",
    classId: "8B",
    schoolId: "s3",
    entries: [
      ["h3", 4],
      ["h5", 1],
    ],
  },
  {
    id: "st19",
    name: "Valentina Cardoso",
    classId: "9A",
    schoolId: "s3",
    entries: [
      ["h1", 6],
      ["h4", 5],
      ["h2", 3],
    ],
  },
  {
    id: "st20",
    name: "Yuri Matos",
    classId: "9A",
    schoolId: "s3",
    entries: [
      ["h3", 2],
      ["h4", 0, "pendente"],
    ],
  },
  // EE Bariri Norte (s4)
  {
    id: "st21",
    name: "Alice Fonseca",
    classId: "8A",
    schoolId: "s4",
    entries: [
      ["h4", 5],
      ["h1", 4],
      ["h2", 2],
      ["h5", 1],
    ],
  },
  {
    id: "st22",
    name: "Breno Teixeira",
    classId: "8A",
    schoolId: "s4",
    entries: [
      ["h1", 3],
      ["h2", 1],
    ],
  },
  {
    id: "st23",
    name: "Camila Duarte",
    classId: "8B",
    schoolId: "s4",
    entries: [
      ["h4", 6],
      ["h1", 4],
      ["h5", 3],
    ],
  },
  { id: "st24", name: "Davi Moreira", classId: "9A", schoolId: "s4", entries: [["h2", 2]] },
  // EE Itapuí (s5): propositalmente SEM alunos cadastrados, para exercitar o estado vazio.
];

export function demoStudents(): Student[] {
  return DEMO_STUDENT_DEFS.map((d) => ({
    id: d.id,
    name: d.name,
    classId: d.classId,
    schoolId: d.schoolId,
    demo: true,
  }));
}

function atDaysAgo(d: number, hour: number, now: Date): string {
  const x = new Date(now);
  x.setDate(x.getDate() - d);
  x.setHours(hour, 0, 0, 0);
  return x.toISOString();
}

/** Ids determinísticos ("demo-…") permitem mesclar sem duplicar em dados já salvos no navegador. */
export function demoSubmissions(now: Date = new Date()): Submission[] {
  return DEMO_STUDENT_DEFS.flatMap((d) =>
    d.entries.map(([missionId, daysAgo, status = "aprovada"], i): Submission => {
      const at = atDaysAgo(daysAgo, 9 + (i % 6), now);
      return {
        id: `demo-${d.id}-${i}`,
        missionId,
        studentId: d.id,
        at,
        note: "Dado de demonstração",
        status,
        points: POINTS[missionId] ?? 0,
        ...(status !== "pendente"
          ? {
              validator: "Prof. Carlos Lima",
              decidedAt: at,
              ...(status === "rejeitada" ? { reason: "Foto não mostra a ação." } : {}),
            }
          : {}),
      };
    }),
  );
}

/**
 * Dados salvos no navegador antes do ranking de alunos não têm os alunos de demonstração.
 * Acrescenta-os por id (idempotente) sem alterar nenhum registro já salvo.
 */
export function mergeDemoData<T extends { students: Student[]; submissions: Submission[] }>(
  saved: T,
  now: Date = new Date(),
): T {
  const studentIds = new Set(saved.students.map((x) => x.id));
  const subIds = new Set(saved.submissions.map((x) => x.id));
  const newStudents = demoStudents().filter((x) => !studentIds.has(x.id));
  const newSubs = demoSubmissions(now).filter((x) => !subIds.has(x.id));
  if (newStudents.length === 0 && newSubs.length === 0) return saved;
  return {
    ...saved,
    students: [...saved.students, ...newStudents],
    submissions: [...saved.submissions, ...newSubs],
  };
}
