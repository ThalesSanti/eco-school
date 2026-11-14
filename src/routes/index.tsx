import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ROLE_INFO, useEco, type Role } from "@/lib/eco-store";
import { Icon } from "@/components/eco/ui";
import { LogoFull } from "@/components/eco/logo";
import { HOME_FOR } from "@/components/eco/nav";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Eco School — Escolas Sustentáveis e Conectadas" },
      { name: "description", content: "Missões sustentáveis, pontos, ranking e indicadores para alunos, professores e gestores." },
      { property: "og:title", content: "Eco School — Escolas Sustentáveis e Conectadas" },
      { property: "og:description", content: "Missões sustentáveis, pontos, ranking e indicadores para alunos, professores e gestores." },
      { property: "og:image", content: "/eco-school-logo.png" },
    ],
  }),
  component: Index,
});

const TONES: Record<Role, string> = {
  aluno: "bg-primary-container text-on-primary-container",
  professor: "bg-tertiary-container text-on-tertiary-container",
  gestor: "bg-secondary text-secondary-foreground",
  regional: "bg-tertiary-container text-on-tertiary-container",
  admin: "bg-surface-3 text-foreground",
};

const STEPS = [
  { icon: "target", title: "Cumpra missões", text: "Reciclagem, água, energia e horta no dia a dia." },
  { icon: "fact_check", title: "Envie evidências", text: "O professor valida e os pontos são confirmados." },
  { icon: "leaderboard", title: "Suba no ranking", text: "Compare a evolução da turma, da escola e da região." },
];

function Index() {
  const { setRole } = useEco();
  const nav = useNavigate();
  const enter = (r: Role) => {
    setRole(r);
    nav({ to: HOME_FOR[r] });
  };

  return (
    <main className="hero-glow min-h-screen px-4 pb-12 pt-8 sm:px-6 md:py-14">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-center lg:gap-14">
        {/* Apresentação */}
        <section className="animate-rise text-center lg:text-left">
          <div className="mx-auto w-44 overflow-hidden rounded-[2rem] border border-border bg-white shadow-[var(--shadow-card)] sm:w-56 lg:mx-0 lg:w-72">
            <LogoFull className="w-full" />
          </div>
          <h1 className="mt-6 text-3xl font-extrabold leading-tight sm:text-4xl lg:text-5xl">
            Escolas <span className="text-primary">Sustentáveis</span> e <span className="text-tertiary">Conectadas</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground lg:mx-0">
            O Eco School transforma sustentabilidade em uma experiência educacional interativa: alunos cumprem missões
            ambientais, professores validam as evidências e escolas acompanham pontos, ranking e indicadores.
          </p>
          <ul className="mx-auto mt-6 grid max-w-xl gap-3 text-left">
            {STEPS.map((s) => (
              <li key={s.title} className="flex items-start gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-container text-on-primary-container">
                  <Icon name={s.icon} fill className="!text-xl" />
                </span>
                <span className="min-w-0">
                  <span className="block font-semibold text-foreground">{s.title}</span>
                  <span className="block text-sm text-muted-foreground">{s.text}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* Seleção de perfil */}
        <section aria-labelledby="perfis" className="min-w-0">
          <h2 id="perfis" className="text-xl font-bold sm:text-2xl">Escolha um perfil para começar</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Versão de demonstração: os perfis abaixo usam dados fictícios e não exigem senha.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {(Object.keys(ROLE_INFO) as Role[]).map((r, i) => (
              <button
                key={r}
                onClick={() => enter(r)}
                style={{ animationDelay: `${i * 50}ms` }}
                className={cn(
                  "m3-card group flex min-h-24 items-center gap-4 text-left focus-visible:outline-2 focus-visible:outline-ring animate-rise",
                  r === "admin" && "sm:col-span-2",
                )}
              >
                <div className={cn("grid size-12 shrink-0 place-items-center rounded-2xl transition group-hover:scale-105", TONES[r])}>
                  <Icon name={ROLE_INFO[r].icon} fill />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-foreground">{ROLE_INFO[r].label}</div>
                  <div className="text-sm text-muted-foreground">{ROLE_INFO[r].desc}</div>
                  <div className="mt-0.5 truncate text-xs text-muted-foreground/80">{ROLE_INFO[r].person}</div>
                </div>
                <Icon name="arrow_forward" className="text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary" />
              </button>
            ))}
          </div>
          <p className="mt-6 flex items-start gap-2 text-xs text-muted-foreground">
            <Icon name="shield" className="!text-base" />
            <span>Login real com senha e controle de acesso ficam para o próximo sprint.</span>
          </p>
        </section>
      </div>
    </main>
  );
}
