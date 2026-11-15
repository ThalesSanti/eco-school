import { describe, expect, it } from "vitest";
import { HOME_FOR, NAV, canAccess } from "./nav";

describe("navegação por perfil", () => {
  it("aluno, professor, gestor escolar e regional acessam o Ranking", () => {
    for (const role of ["aluno", "professor", "gestor", "regional"] as const) {
      expect(NAV[role].some((i) => i.to === "/app/ranking")).toBe(true);
    }
  });
  it("administrador mantém somente as funções administrativas", () => {
    expect(NAV.admin.map((i) => i.to)).toEqual(["/app/auditoria", "/app/regras"]);
  });
  it("preserva as páginas iniciais e os itens existentes de cada perfil", () => {
    expect(HOME_FOR.regional).toBe("/app/ranking");
    expect(NAV.aluno.map((i) => i.to)).toEqual(expect.arrayContaining(["/app/missoes", "/app/progresso"]));
    expect(NAV.professor.map((i) => i.to)).toEqual(expect.arrayContaining(["/app/validacao", "/app/painel"]));
    expect(NAV.gestor.map((i) => i.to)).toEqual(expect.arrayContaining(["/app/painel", "/app/regras", "/app/relatorios"]));
    expect(NAV.regional.map((i) => i.to)).toContain("/app/relatorios");
  });

  it("bloqueia páginas de outros perfis acessadas pela URL", () => {
    expect(canAccess("aluno", "/app/missoes")).toBe(true);
    expect(canAccess("aluno", "/app/validacao")).toBe(false);
    expect(canAccess("aluno", "/app/auditoria")).toBe(false);
    expect(canAccess("professor", "/app/relatorios")).toBe(false);
    expect(canAccess("gestor", "/app/auditoria")).toBe(false);
    expect(canAccess("admin", "/app/auditoria")).toBe(true);
    expect(canAccess("admin", "/app/missoes")).toBe(false);
    expect(canAccess("regional", "/app")).toBe(false);
    expect(canAccess(null, "/app/ranking")).toBe(false);
  });
});
