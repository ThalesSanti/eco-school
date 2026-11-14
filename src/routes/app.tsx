import { createFileRoute, Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { ROLE_INFO, useEco } from "@/lib/eco-store";
import { Icon } from "@/components/eco/ui";
import { LogoMark } from "@/components/eco/logo";
import { NAV } from "@/components/eco/nav";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/app")({
  component: AppLayout,
});

function AppLayout() {
  const { state, ready, setRole, reset } = useEco();
  const nav = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => { if (ready && !state.role) nav({ to: "/" }); }, [ready, state.role, nav]);
  if (!ready || !state.role) return <div className="min-h-screen bg-background" />;

  const items = NAV[state.role];
  const info = ROLE_INFO[state.role];
  const allowed = items.some((i) => pathname.startsWith(i.to));

  return (
    <div className="min-h-screen bg-background md:pl-24">
      {/* Navigation rail (desktop) */}
      <aside className="fixed inset-y-0 left-0 hidden w-24 flex-col items-center gap-3 border-r border-border bg-surface-1 py-5 md:flex">
        <Link to="/" className="mb-4" aria-label="Eco School — início">
          <LogoMark size={52} />
        </Link>
        {items.map((i) => (
          <Link key={i.to} to={i.to} data-active={pathname.startsWith(i.to)} className="nav-pill flex flex-col items-center gap-1 text-xs text-muted-foreground">
            <span className="nav-indicator grid h-8 w-14 place-items-center rounded-full transition"><Icon name={i.icon} /></span>
            {i.label}
          </Link>
        ))}
      </aside>

      {/* Top app bar */}
      <header className="app-topbar sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-background/90 px-4 py-3 backdrop-blur md:px-8">
        <Link to="/" aria-label="Eco School — início" className="shrink-0 md:hidden"><LogoMark size={40} /></Link>
        <div className="min-w-0 flex-1">
          <div className="truncate text-xs text-muted-foreground">{info.label} · {state.period}</div>
          <div className="truncate font-display font-semibold text-foreground">{info.person}</div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
        <Button variant="ghost" onClick={() => { reset(); }} aria-label="Restaurar dados de demonstração" title="Restaurar dados de demonstração" className="size-12 shrink-0 rounded-full p-0 text-muted-foreground">
          <Icon name="restart_alt" />
        </Button>
        <Button variant="outline" onClick={() => { setRole(null); nav({ to: "/" }); }} aria-label="Trocar perfil" title="Trocar perfil" className="size-12 shrink-0 rounded-full p-0 sm:w-auto sm:px-4">
          <Icon name="switch_account" className="!text-lg" /><span className="hidden sm:inline">Trocar perfil</span>
        </Button>
        </div>
      </header>

      <main className="app-main mx-auto min-w-0 max-w-6xl px-4 pb-28 pt-2 md:px-8 md:pb-12">
        {allowed ? <Outlet /> : (
          <div className="m3-card mt-10 text-center">
            <Icon name="lock" className="!text-4xl text-destructive" />
            <p className="mt-2 text-foreground">Seu perfil não tem acesso a esta área.</p>
          </div>
        )}
      </main>

      {/* Bottom navigation (mobile) */}
      <nav aria-label="Navegação principal" className="app-bottomnav fixed inset-x-0 bottom-0 z-20 flex justify-around border-t border-border bg-surface-1/95 pb-4 pt-2 shadow-[0_-6px_18px_-12px_oklch(0.3_0.06_160/0.25)] backdrop-blur md:hidden">
        {items.map((i) => (
          <Link key={i.to} to={i.to} aria-current={pathname.startsWith(i.to) ? "page" : undefined} data-active={pathname.startsWith(i.to)} className="nav-pill flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center gap-1 text-xs text-muted-foreground">
            <span className="nav-indicator grid h-8 w-16 place-items-center rounded-full transition"><Icon name={i.icon} /></span>
            {i.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
