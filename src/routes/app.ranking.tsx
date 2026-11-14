import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useEco } from "@/lib/eco-store";
import { PageHeader } from "@/components/eco/ui";
import { SchoolRanking } from "@/components/eco/school-ranking";
import { StudentRanking } from "@/components/eco/student-ranking";

export const Route = createFileRoute("/app/ranking")({
  head: () => ({ meta: [
    { title: "Ranking — Eco School" },
    { name: "description", content: "Ranking de alunos por escola, turma e região e ranking normalizado de escolas." },
    { property: "og:title", content: "Ranking — Eco School" },
    { property: "og:description", content: "Ranking de alunos por escola, turma e região e ranking normalizado de escolas." },
  ] }),
  component: Ranking,
});

function Ranking() {
  const { state } = useEco();
  const regional = state.role === "regional";
  // O gestor regional mantém o ranking de escolas (com selos e fechamento de ciclo) como visão inicial.
  const [view, setView] = useState<"escolas" | "alunos">("escolas");
  const showSchools = regional && view === "escolas";

  return (
    <>
      <PageHeader
        title={regional ? "Ranking regional" : "Ranking de alunos"}
        subtitle={regional
          ? "Compare escolas pelo score normalizado ou acompanhe os alunos mais engajados"
          : "Quem mais participa das missões sustentáveis — com pontos confirmados"}
      />
      {regional && (
        <div className="eco-segment mb-4" role="group" aria-label="Tipo de ranking regional">
          <button aria-pressed={view === "escolas"} onClick={() => setView("escolas")}>Escolas</button>
          <button aria-pressed={view === "alunos"} onClick={() => setView("alunos")}>Alunos</button>
        </div>
      )}
      {showSchools ? <SchoolRanking /> : <StudentRanking />}
    </>
  );
}
