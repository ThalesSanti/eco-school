import { describe, expect, it } from "vitest";
import {
  DEMO_ACCOUNTS,
  PUBLIC_ROLES,
  accountForRole,
  demoAuthProvider,
  verifyCredentials,
} from "./demo-auth";

describe("autenticação demonstrativa", () => {
  it("todas as contas fictícias entram no perfil correto", () => {
    const esperado = [
      ["ana.souza", "aluno"],
      ["carlos.lima", "professor"],
      ["marta.reis", "gestor"],
      ["diretoria.jau", "regional"],
      ["equipe.ecoschool", "admin"],
    ] as const;
    for (const [u, role] of esperado) {
      const r = verifyCredentials(u, "eco2026", role);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.account.role).toBe(role);
    }
  });
  it("Ana Souza é vinculada ao registro st1", () => {
    const r = verifyCredentials("ana.souza", "eco2026", "aluno");
    expect(r.ok && r.account.studentId).toBe("st1");
  });
  it("usuário é tolerante a maiúsculas e espaços; senha é exata", () => {
    expect(verifyCredentials("  Ana.Souza ", "eco2026", "aluno").ok).toBe(true);
    expect(verifyCredentials("ana.souza", "ECO2026", "aluno").ok).toBe(false);
  });
  it("credenciais incorretas são recusadas com mensagem amigável", () => {
    const r = verifyCredentials("ana.souza", "errada", "aluno");
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.reason).toBe("invalid");
      expect(r.message).toMatch(/incorretos/);
    }
    expect(verifyCredentials("", "", "aluno").ok).toBe(false);
    expect(verifyCredentials("inexistente", "eco2026", "aluno").ok).toBe(false);
  });
  it("conta de outro perfil não entra no perfil selecionado", () => {
    const r = verifyCredentials("carlos.lima", "eco2026", "aluno");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("wrong-profile");
    expect(verifyCredentials("equipe.ecoschool", "eco2026", "regional").ok).toBe(false);
    expect(verifyCredentials("ana.souza", "eco2026", "admin").ok).toBe(false);
  });
  it("administrador fora da seleção pública, mas com conta própria", () => {
    expect(PUBLIC_ROLES).toEqual(["aluno", "professor", "gestor", "regional"]);
    expect(accountForRole("admin")?.username).toBe("equipe.ecoschool");
    expect(DEMO_ACCOUNTS.length).toBe(5);
    expect(new Set(DEMO_ACCOUNTS.map((a) => a.username)).size).toBe(5);
  });
  it("provider assíncrono segue a mesma regra (ponto de troca por auth real)", async () => {
    expect((await demoAuthProvider.signIn("marta.reis", "eco2026", "gestor")).ok).toBe(true);
    expect((await demoAuthProvider.signIn("marta.reis", "x", "gestor")).ok).toBe(false);
  });
});
