import type { Role } from "@/lib/eco-store";

export type AppPath = "/app/missoes" | "/app/progresso" | "/app/validacao" | "/app/painel" | "/app/regras" | "/app/ranking" | "/app/relatorios" | "/app/auditoria";

export const NAV: Record<Role, { to: AppPath; label: string; icon: string }[]> = {
  aluno: [
    { to: "/app/missoes", label: "Missões", icon: "target" },
    { to: "/app/progresso", label: "Progresso", icon: "trending_up" },
    { to: "/app/ranking", label: "Ranking", icon: "leaderboard" },
  ],
  professor: [
    { to: "/app/validacao", label: "Validação", icon: "fact_check" },
    { to: "/app/painel", label: "Turmas", icon: "groups" },
    { to: "/app/ranking", label: "Ranking", icon: "leaderboard" },
  ],
  gestor: [
    { to: "/app/painel", label: "Painel", icon: "monitoring" },
    { to: "/app/ranking", label: "Ranking", icon: "leaderboard" },
    { to: "/app/regras", label: "Regras", icon: "tune" },
    { to: "/app/relatorios", label: "Relatórios", icon: "description" },
  ],
  regional: [
    { to: "/app/ranking", label: "Ranking", icon: "leaderboard" },
    { to: "/app/relatorios", label: "Relatórios", icon: "description" },
  ],
  admin: [
    { to: "/app/auditoria", label: "Auditoria", icon: "policy" },
    { to: "/app/regras", label: "Regras", icon: "tune" },
  ],
};

export const HOME_FOR: Record<Role, AppPath> = {
  aluno: "/app/missoes", professor: "/app/validacao", gestor: "/app/painel", regional: "/app/ranking", admin: "/app/auditoria",
};
