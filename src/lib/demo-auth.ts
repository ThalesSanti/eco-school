// AUTENTICAÇÃO SIMULADA (somente demonstração acadêmica).
// As contas e senhas abaixo são fictícias e ficam no código do navegador: NÃO oferecem segurança
// real. Para produção, substitua `demoAuthProvider` por uma implementação que valide no backend
// (por exemplo, Supabase Auth) mantendo a interface `AuthProvider`.
import type { Role } from "./eco-store";

export interface DemoAccount {
  username: string;
  password: string;
  role: Role;
  displayName: string;
  /** aluno vinculado ao registro existente no banco local de demonstração */
  studentId?: string;
}

export const DEMO_PASSWORD = "eco2026";

export const DEMO_ACCOUNTS: DemoAccount[] = [
  { username: "ana.souza", password: DEMO_PASSWORD, role: "aluno", displayName: "Ana Souza", studentId: "st1" },
  { username: "carlos.lima", password: DEMO_PASSWORD, role: "professor", displayName: "Prof. Carlos Lima" },
  { username: "marta.reis", password: DEMO_PASSWORD, role: "gestor", displayName: "Dir. Marta Reis" },
  { username: "diretoria.jau", password: DEMO_PASSWORD, role: "regional", displayName: "Diretoria de Ensino · Jaú" },
  { username: "equipe.ecoschool", password: DEMO_PASSWORD, role: "admin", displayName: "Equipe Eco School" },
];

/** Perfis exibidos na seleção pública. O administrador entra por "Acesso da equipe". */
export const PUBLIC_ROLES: Role[] = ["aluno", "professor", "gestor", "regional"];

export const accountForRole = (role: Role) => DEMO_ACCOUNTS.find((a) => a.role === role);

export type AuthResult =
  | { ok: true; account: DemoAccount }
  | { ok: false; reason: "invalid" | "wrong-profile"; message: string };

export interface AuthProvider {
  signIn(username: string, password: string, selectedRole: Role): Promise<AuthResult>;
}

export function verifyCredentials(username: string, password: string, selectedRole: Role): AuthResult {
  const u = username.trim().toLowerCase();
  const account = DEMO_ACCOUNTS.find((a) => a.username === u);
  if (!account || account.password !== password) {
    return { ok: false, reason: "invalid", message: "Usuário ou senha incorretos. Confira os dados e tente novamente." };
  }
  if (account.role !== selectedRole) {
    return {
      ok: false,
      reason: "wrong-profile",
      message: "Esta conta pertence a outro perfil. Volte e selecione o perfil correto para entrar.",
    };
  }
  return { ok: true, account };
}

export const demoAuthProvider: AuthProvider = {
  signIn: (username, password, selectedRole) => Promise.resolve(verifyCredentials(username, password, selectedRole)),
};
