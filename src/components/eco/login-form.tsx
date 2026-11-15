import { useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ROLE_INFO, useEco, type Role } from "@/lib/eco-store";
import { accountForRole, demoAuthProvider } from "@/lib/demo-auth";
import { HOME_FOR } from "@/components/eco/nav";
import { Icon } from "@/components/eco/ui";
import { LogoFull } from "@/components/eco/logo";
import { cn } from "@/lib/utils";

export function LoginForm({ role, onBack }: { role: Role; onBack: () => void }) {
  const { login, logFailedLogin } = useEco();
  const nav = useNavigate();
  const info = ROLE_INFO[role];
  const staff = role === "admin";
  const demo = accountForRole(role);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError("Informe o usuário e a senha para entrar.");
      return;
    }
    setBusy(true);
    const r = await demoAuthProvider.signIn(username, password, role);
    setBusy(false);
    if (!r.ok) {
      setError(r.message);
      setPassword("");
      logFailedLogin(username, info.label);
      return;
    }
    setError(null);
    login(r.account);
    nav({ to: HOME_FOR[r.account.role] });
  };

  return (
    <main className="hero-glow grid min-h-screen place-items-center px-4 py-8">
      <div className="w-full max-w-md animate-rise">
        <div className="mx-auto w-28 overflow-hidden rounded-3xl border border-border bg-white shadow-[var(--shadow-card)] sm:w-32">
          <LogoFull className="w-full" />
        </div>

        <section className="m3-card mt-5 !p-5 sm:!p-7" aria-labelledby="login-title">
          <div className="flex items-center gap-3">
            <span className={cn("grid size-12 shrink-0 place-items-center rounded-2xl", staff ? "bg-surface-3 text-foreground" : "bg-primary-container text-on-primary-container")}>
              <Icon name={info.icon} fill />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{staff ? "Acesso da equipe" : "Entrar como"}</p>
              <h1 id="login-title" className="truncate text-xl">{info.label}</h1>
            </div>
          </div>

          <form onSubmit={submit} noValidate className="mt-5 grid gap-4">
            <label className="grid gap-1 text-sm font-medium text-foreground">
              Usuário
              <input
                className="m3-field" name="username" autoComplete="username" autoCapitalize="none" autoCorrect="off" spellCheck={false}
                value={username} onChange={(e) => { setUsername(e.target.value); setError(null); }}
                aria-invalid={error ? true : undefined} aria-describedby={error ? "login-error" : undefined}
              />
            </label>
            <label className="grid gap-1 text-sm font-medium text-foreground">
              Senha
              <span className="relative block">
                <input
                  className="m3-field !pr-12" name="password" type={show ? "text" : "password"} autoComplete="current-password"
                  value={password} onChange={(e) => { setPassword(e.target.value); setError(null); }}
                  aria-invalid={error ? true : undefined} aria-describedby={error ? "login-error" : undefined}
                />
                <button
                  type="button" onClick={() => setShow((v) => !v)} aria-pressed={show}
                  aria-label={show ? "Ocultar senha" : "Mostrar senha"}
                  className="absolute right-1 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full text-muted-foreground hover:bg-surface-2"
                >
                  <Icon name={show ? "visibility_off" : "visibility"} className="!text-xl" />
                </button>
              </span>
            </label>

            <div id="login-error" role="alert" aria-live="assertive">
              {error && (
                <p className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                  <Icon name="error" className="!text-lg" />
                  <span>{error}</span>
                </p>
              )}
            </div>

            <button type="submit" disabled={busy} className="m3-fab w-full justify-center disabled:opacity-60">
              <Icon name="login" />{busy ? "Entrando…" : "Entrar"}
            </button>
            <button type="button" onClick={onBack} className="flex min-h-11 items-center justify-center gap-2 rounded-full text-sm font-semibold text-muted-foreground hover:bg-surface-2">
              <Icon name="arrow_back" className="!text-lg" />{staff ? "Voltar ao início" : "Voltar à seleção de perfil"}
            </button>
          </form>
        </section>

        {demo && (
          <section className="m3-card-hi mt-4 !p-4" aria-labelledby="demo-access">
            <div className="flex items-center justify-between gap-2">
              <h2 id="demo-access" className="text-sm font-semibold">Acessos para demonstração</h2>
              <span className="rounded-md border border-border bg-surface-1 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">ambiente demo</span>
            </div>
            <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
              <dt className="text-muted-foreground">Usuário</dt><dd className="font-mono text-foreground">{demo.username}</dd>
              <dt className="text-muted-foreground">Senha</dt><dd className="font-mono text-foreground">{demo.password}</dd>
            </dl>
            <button type="button" onClick={() => { setUsername(demo.username); setPassword(demo.password); setError(null); }} className="m3-chip mt-3 w-full justify-center">
              <Icon name="auto_fix_high" className="!text-base" />Preencher automaticamente
            </button>
            <p className="mt-3 text-xs text-muted-foreground">
              Ambiente de demonstração com dados fictícios. O login é simulado para fins acadêmicos e não oferece segurança real.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}
