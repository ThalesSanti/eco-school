import { describe, expect, it } from "vitest";
import { academicBonus, engagementFactor, isWithinWindow, schoolScore, sealFor, studentPoints, validateRule } from "./scoring";

describe("regras de pontuação", () => {
  it("RN01 bloqueia envio após o prazo", () => {
    const now = new Date("2026-10-20T12:00:00Z");
    expect(isWithinWindow("2026-10-20T11:59:00Z", now)).toBe(false);
    expect(isWithinWindow("2026-10-20T12:30:00Z", now)).toBe(true);
  });

  it("RN09 soma pontos validados e bônus de assiduidade", () => {
    const opts = { attendanceEnabled: true, attendanceBonus: 20, minDays: 3 };
    expect(studentPoints([10, 30], 3, opts)).toBe(60);
    expect(studentPoints([10, 30], 2, opts)).toBe(40);
    expect(studentPoints([10, 30], 5, { ...opts, attendanceEnabled: false })).toBe(40);
  });

  it("RN04 normaliza o score da escola por alunos ativos", () => {
    // 50% de adesão -> fator 1
    expect(schoolScore(10000, 100, 200)).toBe(100);
    expect(engagementFactor(200, 200)).toBe(1.2);
    expect(engagementFactor(0, 200)).toBe(0.8);
  });

  it("RN03 limita o bônus acadêmico ao teto", () => {
    expect(academicBonus(250, { pointsPerTenth: 100, maxBonus: 1 })).toBe(0.2);
    expect(academicBonus(5000, { pointsPerTenth: 100, maxBonus: 0.5 })).toBe(0.5);
    expect(academicBonus(5000, { pointsPerTenth: 100, maxBonus: 3 })).toBe(1);
  });

  it("US05 impede regra acima do teto central", () => {
    expect(validateRule({ pointsPerTenth: 100, maxBonus: 1.5 })).not.toBeNull();
    expect(validateRule({ pointsPerTenth: 100, maxBonus: 1 })).toBeNull();
  });

  it("selos seguem os critérios configurados", () => {
    expect(sealFor(185)).toBe("Ouro");
    expect(sealFor(150)).toBe("Prata");
    expect(sealFor(99)).toBeNull();
  });
});
