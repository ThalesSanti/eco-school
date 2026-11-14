// Pure business rules for Eco School (RN01–RN10). Keep side-effect free and tested.

export const CENTRAL_BONUS_CAP = 1.0; // teto central (pontos na nota) definido pela governança

export interface BonusRule {
  id: string;
  period: string;
  pointsPerTenth: number; // quantos pontos valem 0,1 de bônus
  maxBonus: number; // teto da escola/rede, <= CENTRAL_BONUS_CAP
  createdAt: string;
  author: string;
}

/** RN01: só é possível enviar dentro da janela (antes do prazo). */
export function isWithinWindow(deadlineIso: string, now: Date = new Date()): boolean {
  return now.getTime() <= new Date(deadlineIso).getTime();
}

/** RN09: P_aluno = Σ pontos validados + bônus de assiduidade (se habilitado). */
export function studentPoints(
  validatedPoints: number[],
  distinctActiveDays: number,
  opts: { attendanceEnabled: boolean; attendanceBonus: number; minDays: number },
): number {
  const base = validatedPoints.reduce((a, b) => a + b, 0);
  const bonus = opts.attendanceEnabled && distinctActiveDays >= opts.minDays ? opts.attendanceBonus : 0;
  return base + bonus;
}

/**
 * Fator de engajamento (HIPÓTESE a validar com a governança):
 * 1 + 0,4 × (adesão − 0,5), limitado a [0,8 ; 1,2].
 */
export function engagementFactor(activeStudents: number, enrolled: number): number {
  if (enrolled <= 0) return 1;
  const adhesion = activeStudents / enrolled;
  const f = 1 + 0.4 * (adhesion - 0.5);
  return Math.min(1.2, Math.max(0.8, f));
}

/** RN04: P_escola = (Σ P_alunos / N_ativos) × fator de engajamento. */
export function schoolScore(totalPoints: number, activeStudents: number, enrolled: number): number {
  if (activeStudents <= 0) return 0;
  return (totalPoints / activeStudents) * engagementFactor(activeStudents, enrolled);
}

/** RN03: conversão proporcional, limitada ao teto da regra e ao teto central. */
export function academicBonus(points: number, rule: Pick<BonusRule, "pointsPerTenth" | "maxBonus">): number {
  if (rule.pointsPerTenth <= 0) return 0;
  const raw = Math.floor(points / rule.pointsPerTenth) / 10;
  const cap = Math.min(rule.maxBonus, CENTRAL_BONUS_CAP);
  return Math.min(raw, cap);
}

/** US05: regra não pode exceder o teto central. */
export function validateRule(rule: Pick<BonusRule, "pointsPerTenth" | "maxBonus">): string | null {
  if (!(rule.pointsPerTenth > 0)) return "Informe quantos pontos valem 0,1 de bônus.";
  if (rule.maxBonus < 0) return "O teto não pode ser negativo.";
  if (rule.maxBonus > CENTRAL_BONUS_CAP)
    return `O teto não pode ultrapassar o teto central de ${CENTRAL_BONUS_CAP.toFixed(1)}.`;
  return null;
}

export type SealLevel = "Ouro" | "Prata" | "Bronze" | null;
/** Critérios de selo (configuração do MVP). */
export const SEAL_CRITERIA = { Ouro: 180, Prata: 140, Bronze: 100 } as const;
export function sealFor(score: number): SealLevel {
  if (score >= SEAL_CRITERIA.Ouro) return "Ouro";
  if (score >= SEAL_CRITERIA.Prata) return "Prata";
  if (score >= SEAL_CRITERIA.Bronze) return "Bronze";
  return null;
}
