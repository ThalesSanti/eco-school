import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { type BonusRule, isWithinWindow } from "./scoring";
import { computeStudentStats } from "./ranking";
import type { DemoAccount } from "./demo-auth";
import { demoStudents, demoSubmissions, mergeDemoData } from "./demo-data";

export type Role = "aluno" | "professor" | "gestor" | "regional" | "admin";
export type Category = "reciclagem" | "agua" | "energia" | "horta" | "quiz";
export type SubStatus = "pendente" | "aprovada" | "rejeitada";
export type MissionStatus = "disponivel" | "enviada" | "validada" | "rejeitada" | "expirada";

export interface Mission {
  id: string;
  title: string;
  description: string;
  category: Category;
  points: number;
  requiresEvidence: boolean;
  deadline: string;
  classes: string[];
  quiz?: { question: string; options: string[]; answer: number };
}
export interface Student { id: string; name: string; classId: string; schoolId: string; /** dado fictício de demonstração */ demo?: boolean }
export interface Submission {
  id: string; missionId: string; studentId: string; at: string; note: string; photo?: string | undefined;
  status: SubStatus; validator?: string | undefined; decidedAt?: string | undefined; reason?: string | undefined; points: number;
}
export interface School { id: string; name: string; region: string; enrolled: number; active: number; basePoints: number }
export interface AuditEvent { id: string; at: string; actor: string; action: string; object: string; details: string }
export interface Seal { schoolId: string; level: string; criterion: string; at: string; period: string }

export interface EcoState {
  role: Role | null;
  /** usuário da sessão demonstrativa (null = sessão antiga ou desconectado) */
  username: string | null;
  currentStudentId: string;
  period: string;
  cycleClosed: boolean;
  attendance: { enabled: boolean; bonus: number; minDays: number };
  missions: Mission[];
  students: Student[];
  submissions: Submission[];
  schools: School[];
  rules: BonusRule[];
  audit: AuditEvent[];
  seals: Seal[];
}

export const ROLE_INFO: Record<Role, { label: string; person: string; icon: string; desc: string }> = {
  aluno: { label: "Aluno", person: "Ana Souza · 8º A", icon: "school", desc: "Missões, pontos, evolução e ranking" },
  professor: { label: "Professor / Validador", person: "Prof. Carlos Lima", icon: "fact_check", desc: "Validar evidências e acompanhar turmas" },
  gestor: { label: "Gestor Escolar", person: "Dir. Marta Reis", icon: "monitoring", desc: "Indicadores, rankings, regras e relatórios" },
  regional: { label: "Gestor Regional", person: "Diretoria de Ensino · Jaú", icon: "public", desc: "Ranking de escolas e alunos e selos" },
  admin: { label: "Administrador", person: "TI da Rede", icon: "admin_panel_settings", desc: "Trilha de auditoria" },
};

export const CATEGORY_INFO: Record<Category, { label: string; icon: string }> = {
  reciclagem: { label: "Reciclagem", icon: "recycling" },
  agua: { label: "Água", icon: "water_drop" },
  energia: { label: "Energia", icon: "bolt" },
  horta: { label: "Horta", icon: "potted_plant" },
  quiz: { label: "Quiz", icon: "quiz" },
};

const uid = () => Math.random().toString(36).slice(2, 10);
const hoursFromNow = (h: number) => new Date(Date.now() + h * 3600_000).toISOString();
const daysAgo = (d: number, h = 10) => {
  const x = new Date(); x.setDate(x.getDate() - d); x.setHours(h, 0, 0, 0); return x.toISOString();
};

function seed(): EcoState {
  const students: Student[] = [
    { id: "st1", name: "Ana Souza", classId: "8A", schoolId: "s1" },
    { id: "st2", name: "Bruno Alves", classId: "8A", schoolId: "s1" },
    { id: "st3", name: "Clara Mendes", classId: "8A", schoolId: "s1" },
    { id: "st4", name: "Diego Rocha", classId: "8B", schoolId: "s1" },
    { id: "st5", name: "Eva Martins", classId: "9A", schoolId: "s1" },
    { id: "st6", name: "Felipe Costa", classId: "9A", schoolId: "s1" },
    ...demoStudents(), // alunos fictícios de demonstração (ranking regional); ver demo-data.ts
  ];
  const all = ["8A", "8B", "9A"];
  const missions: Mission[] = [
    { id: "m1", title: "Separe o lixo reciclável de casa", description: "Separe plástico, papel e metal e fotografe os recipientes.", category: "reciclagem", points: 30, requiresEvidence: true, deadline: hoursFromNow(14), classes: all },
    { id: "m2", title: "Banho de 5 minutos", description: "Cronometre seu banho e registre o tempo gasto.", category: "agua", points: 20, requiresEvidence: true, deadline: hoursFromNow(20), classes: all },
    { id: "m3", title: "Caça aos aparelhos em standby", description: "Desligue da tomada 3 aparelhos que ficam em standby.", category: "energia", points: 25, requiresEvidence: true, deadline: hoursFromNow(9), classes: ["8A", "8B"] },
    { id: "m4", title: "Quiz: o ciclo da água", description: "Responda à pergunta rápida e ganhe pontos na hora.", category: "quiz", points: 15, requiresEvidence: false, deadline: hoursFromNow(22), classes: all,
      quiz: { question: "Qual processo transforma a água líquida em vapor?", options: ["Condensação", "Evaporação", "Precipitação", "Infiltração"], answer: 1 } },
    { id: "m5", title: "Regue a horta da escola", description: "Participe do turno de rega no intervalo.", category: "horta", points: 35, requiresEvidence: true, deadline: hoursFromNow(5), classes: ["8A"] },
    { id: "m6", title: "Mutirão de tampinhas", description: "Traga tampinhas plásticas para o ponto de coleta.", category: "reciclagem", points: 40, requiresEvidence: true, deadline: hoursFromNow(-3), classes: all },
    { id: "m7", title: "Horta vertical na sala 9A", description: "Plantio de temperos em garrafas PET.", category: "horta", points: 40, requiresEvidence: true, deadline: hoursFromNow(18), classes: ["9A"] },
  ];
  const sub = (missionId: string, studentId: string, at: string, status: SubStatus, points: number, note: string): Submission => ({
    id: uid(), missionId, studentId, at, note, status, points,
    ...(status !== "pendente" ? { validator: "Prof. Carlos Lima", decidedAt: at, reason: status === "rejeitada" ? "Foto não mostra a ação." : undefined } : {}),
  });
  const submissions: Submission[] = [
    sub("h1", "st1", daysAgo(6), "aprovada", 30, "Separei os recicláveis"),
    sub("h2", "st1", daysAgo(4), "aprovada", 25, "Desliguei TV e micro-ondas"),
    sub("h3", "st1", daysAgo(3), "rejeitada", 20, "Banho curto"),
    sub("h4", "st1", daysAgo(2), "aprovada", 35, "Reguei a horta"),
    sub("h5", "st1", daysAgo(1), "aprovada", 15, "Quiz energia"),
    sub("h1", "st2", daysAgo(5), "aprovada", 30, "Coleta seletiva"),
    sub("h2", "st3", daysAgo(3), "aprovada", 25, "Standby"),
    sub("h4", "st4", daysAgo(2), "aprovada", 35, "Horta"),
    sub("m1", "st2", hoursFromNow(-2), "pendente", 30, "Separei garrafas PET e latas na cozinha."),
    sub("m3", "st3", hoursFromNow(-1), "pendente", 25, "Tirei da tomada o carregador, TV e videogame."),
    sub("m2", "st4", hoursFromNow(-4), "pendente", 20, "Banho de 4min30s cronometrado."),
    sub("m7", "st5", hoursFromNow(-0.5), "pendente", 40, "Plantamos manjericão e salsa."),
    ...demoSubmissions(),
  ];
  const schools: School[] = [
    { id: "s1", name: "EE Prof. Jahu Centro", region: "Jaú", enrolled: 420, active: 268, basePoints: 38500 },
    { id: "s2", name: "EE Vila Ribeiro", region: "Jaú", enrolled: 180, active: 141, basePoints: 23100 },
    { id: "s3", name: "EE Jardim Pires", region: "Jaú", enrolled: 760, active: 302, basePoints: 41800 },
    { id: "s4", name: "EE Bariri Norte", region: "Bariri", enrolled: 310, active: 220, basePoints: 30900 },
    { id: "s5", name: "EE Itapuí", region: "Itapuí", enrolled: 140, active: 61, basePoints: 6400 },
  ];
  const now = new Date().toISOString();
  return {
    role: null, username: null, currentStudentId: "st1", period: "2026-T4", cycleClosed: false,
    attendance: { enabled: true, bonus: 20, minDays: 3 },
    missions, students, submissions, schools,
    rules: [
      { id: "r0", period: "2026-T3", pointsPerTenth: 150, maxBonus: 0.5, createdAt: daysAgo(90), author: "Dir. Marta Reis" },
      { id: "r1", period: "2026-T4", pointsPerTenth: 100, maxBonus: 1.0, createdAt: daysAgo(20), author: "Dir. Marta Reis" },
    ],
    audit: [{ id: uid(), at: now, actor: "Sistema", action: "Inicialização", object: "Ambiente MVP", details: "Dados de demonstração carregados" }],
    seals: [],
  };
}

const KEY = "eco-school-mvp-v1";

export function withDemoData(saved: EcoState): EcoState {
  return mergeDemoData(saved);
}

interface Ctx {
  state: EcoState;
  ready: boolean;
  setRole: (r: Role | null) => void;
  /** Inicia a sessão demonstrativa de uma conta já validada (ver demo-auth.ts). */
  login: (account: DemoAccount) => void;
  /** Registra tentativa recusada na auditoria (sem senha). */
  logFailedLogin: (username: string, roleLabel: string) => void;
  logout: () => void;
  actor: string;
  submitMission: (missionId: string, note: string, photo?: string, quizAnswer?: number) => { ok: boolean; message: string };
  decide: (subId: string, approve: boolean, reason?: string) => void;
  saveRule: (r: Omit<BonusRule, "id" | "createdAt" | "author">) => void;
  setAttendance: (a: EcoState["attendance"]) => void;
  closeCycle: () => void;
  awardSeal: (schoolId: string, level: string, criterion: string) => void;
  logEvent: (action: string, object: string, details: string) => void;
  reset: () => void;
}
const EcoCtx = createContext<Ctx | null>(null);

export function EcoProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<EcoState>(() => seed());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) { const saved = JSON.parse(raw) as EcoState; setState(withDemoData({ ...saved, username: saved.username ?? null })); }
    } catch { /* ignore */ }
    setReady(true);
  }, []);
  useEffect(() => { if (ready) localStorage.setItem(KEY, JSON.stringify(state)); }, [state, ready]);

  const actor = state.role ? ROLE_INFO[state.role].person : "Anônimo";
  const ev = (actorName: string, action: string, object: string, details: string): AuditEvent =>
    ({ id: uid(), at: new Date().toISOString(), actor: actorName, action, object, details });

  const logEvent = useCallback((action: string, object: string, details: string) =>
    setState((s) => ({ ...s, audit: [ev(s.role ? ROLE_INFO[s.role].person : "Anônimo", action, object, details), ...s.audit] })), []);

  const submitMission: Ctx["submitMission"] = (missionId, note, photo, quizAnswer) => {
    const m = state.missions.find((x) => x.id === missionId);
    if (!m) return { ok: false, message: "Missão não encontrada." };
    if (!isWithinWindow(m.deadline)) return { ok: false, message: "Prazo encerrado para esta missão." };
    const dup = state.submissions.some((x) => x.missionId === missionId && x.studentId === state.currentStudentId && x.status !== "rejeitada");
    if (dup) return { ok: false, message: "Você já enviou esta missão neste ciclo." };
    let status: SubStatus = "pendente";
    let message = "Enviada! Aguarde a validação do professor.";
    if (m.quiz) {
      const right = quizAnswer === m.quiz.answer;
      status = right ? "aprovada" : "rejeitada";
      message = right ? `Resposta certa! +${m.points} pontos.` : "Resposta incorreta. Tente outras missões!";
    }
    const s: Submission = { id: uid(), missionId, studentId: state.currentStudentId, at: new Date().toISOString(), note, photo, status, points: m.points,
      ...(m.quiz ? { validator: "Correção automática", decidedAt: new Date().toISOString() } : {}) };
    setState((st) => ({ ...st, submissions: [s, ...st.submissions],
      audit: [ev(actor, m.quiz ? "Quiz respondido" : "Missão enviada", m.title, `status: ${status}`), ...st.audit] }));
    return { ok: status !== "rejeitada", message };
  };

  const decide: Ctx["decide"] = (subId, approve, reason) => {
    setState((st) => {
      const s = st.submissions.find((x) => x.id === subId);
      const m = st.missions.find((x) => x.id === s?.missionId);
      const stu = st.students.find((x) => x.id === s?.studentId);
      return {
        ...st,
        submissions: st.submissions.map((x) => x.id === subId
          ? { ...x, status: approve ? "aprovada" : "rejeitada", validator: actor, decidedAt: new Date().toISOString(), reason } : x),
        audit: [ev(actor, approve ? "Validação aprovada" : "Validação rejeitada", `${m?.title ?? "Missão"} · ${stu?.name ?? ""}`,
          approve ? `+${s?.points} pts` : `Motivo: ${reason}`), ...st.audit],
      };
    });
  };

  const saveRule: Ctx["saveRule"] = (r) => setState((st) => {
    const prev = st.rules.filter((x) => x.period === r.period).at(-1);
    const rule: BonusRule = { ...r, id: uid(), createdAt: new Date().toISOString(), author: actor };
    return { ...st, rules: [...st.rules, rule], audit: [ev(actor, "Regra de bônus alterada", `Período ${r.period}`,
      `antes: ${prev ? `${prev.pointsPerTenth} pts/0,1 · teto ${prev.maxBonus}` : "—"} → depois: ${r.pointsPerTenth} pts/0,1 · teto ${r.maxBonus}`), ...st.audit] };
  });

  const setAttendance: Ctx["setAttendance"] = (a) => setState((st) => ({ ...st, attendance: a,
    audit: [ev(actor, "Assiduidade alterada", "Bônus de assiduidade", `${a.enabled ? "ativo" : "inativo"} · +${a.bonus} pts com ${a.minDays} dias`), ...st.audit] }));

  const closeCycle = () => setState((st) => ({ ...st, cycleClosed: true,
    audit: [ev(actor, "Fechamento de ciclo", `Período ${st.period}`, "Indicadores consolidados"), ...st.audit] }));

  const awardSeal: Ctx["awardSeal"] = (schoolId, level, criterion) => setState((st) => ({
    ...st, seals: [...st.seals.filter((x) => !(x.schoolId === schoolId && x.period === st.period)), { schoolId, level, criterion, at: new Date().toISOString(), period: st.period }],
    audit: [ev(actor, "Selo emitido", st.schools.find((x) => x.id === schoolId)?.name ?? schoolId, `${level} · ${criterion}`), ...st.audit] }));

  const value: Ctx = {
    state, ready, actor, submitMission, decide, saveRule, setAttendance, closeCycle, awardSeal, logEvent,
    setRole: (r) => setState((st) => ({ ...st, role: r, audit: r ? [ev(ROLE_INFO[r].person, "Login", "Sessão", `Perfil ${ROLE_INFO[r].label}`), ...st.audit] : st.audit })),
    login: (account) => setState((st) => ({
      ...st, role: account.role, username: account.username,
      currentStudentId: account.studentId ?? st.currentStudentId,
      audit: [ev(ROLE_INFO[account.role].person, "Login", "Sessão", `Usuário ${account.username} · perfil ${ROLE_INFO[account.role].label}`), ...st.audit],
    })),
    logFailedLogin: (username, roleLabel) => setState((st) => ({
      ...st, audit: [ev("Anônimo", "Login recusado", "Sessão", `Usuário informado: ${username.trim().slice(0, 40) || "(vazio)"} · perfil ${roleLabel}`), ...st.audit],
    })),
    logout: () => setState((st) => ({
      ...st, role: null, username: null,
      audit: st.role ? [ev(ROLE_INFO[st.role].person, "Logout", "Sessão", `Usuário ${st.username ?? "—"}`), ...st.audit] : st.audit,
    })),
    reset: () => { localStorage.removeItem(KEY); setState({ ...seed(), role: state.role, username: state.username }); },
  };
  return <EcoCtx.Provider value={value}>{children}</EcoCtx.Provider>;
}

export function useEco() {
  const c = useContext(EcoCtx);
  if (!c) throw new Error("useEco must be used within EcoProvider");
  return c;
}

/* ---------- derived selectors ---------- */

export function missionStatusFor(state: EcoState, m: Mission, studentId: string): { status: MissionStatus; sub?: Submission | undefined } {
  const subs = state.submissions.filter((s) => s.missionId === m.id && s.studentId === studentId);
  const last = subs[0];
  if (last?.status === "aprovada") return { status: "validada", sub: last };
  if (last?.status === "pendente") return { status: "enviada", sub: last };
  if (!isWithinWindow(m.deadline)) return { status: "expirada", sub: last };
  if (last?.status === "rejeitada") return { status: "rejeitada", sub: last };
  return { status: "disponivel" };
}

export function useStudentStats(studentId: string) {
  const { state } = useEco();
  // Mesma regra do ranking (computeStudentStats em ranking.ts → studentPoints em scoring.ts).
  return useMemo(() => computeStudentStats(state, studentId), [state, studentId]);
}

export function currentRule(state: EcoState) {
  return state.rules.filter((r) => r.period === state.period).at(-1) ?? state.rules.at(-1)!;
}

export function schoolTotals(state: EcoState, school: School) {
  const local = state.submissions.filter((s) => s.status === "aprovada" && state.students.find((x) => x.id === s.studentId)?.schoolId === school.id);
  return { totalPoints: school.basePoints + local.reduce((a, s) => a + s.points, 0) };
}
