import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { MissionStatus } from "@/lib/eco-store";

export function Icon({ name, fill, className }: { name: string; fill?: boolean; className?: string }) {
  return <span aria-hidden className={cn("msym", fill && "msym-fill", className)}>{name}</span>;
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3 sm:flex sm:justify-between animate-rise">
      <div className="min-w-0">
        <h1 className="break-words text-2xl font-normal text-foreground sm:text-3xl md:text-4xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Stat({ icon, label, value, hint, tone = "primary" }: { icon: string; label: string; value: ReactNode; hint?: string; tone?: "primary" | "tertiary" | "warning" }) {
  const tones = {
    primary: "bg-primary-container text-on-primary-container",
    tertiary: "bg-tertiary-container text-on-tertiary-container",
    warning: "bg-secondary text-warning",
  };
  return (
    <div className="m3-card flex items-start gap-4 animate-rise">
      <div className={cn("grid size-11 shrink-0 place-items-center rounded-2xl", tones[tone])}><Icon name={icon} fill /></div>
      <div className="min-w-0">
        <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="mt-0.5 font-display text-2xl text-foreground">{value}</div>
        {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
      </div>
    </div>
  );
}

const STATUS: Record<MissionStatus | "pendente" | "aprovada", { label: string; icon: string; cls: string }> = {
  disponivel: { label: "Disponível", icon: "radio_button_unchecked", cls: "text-info border-info/40" },
  enviada: { label: "Enviada", icon: "schedule", cls: "text-warning border-warning/40" },
  pendente: { label: "Pendente", icon: "schedule", cls: "text-warning border-warning/40" },
  validada: { label: "Validada", icon: "check_circle", cls: "text-success border-success/40" },
  aprovada: { label: "Aprovada", icon: "check_circle", cls: "text-success border-success/40" },
  rejeitada: { label: "Rejeitada", icon: "cancel", cls: "text-destructive border-destructive/40" },
  expirada: { label: "Expirada", icon: "timer_off", cls: "text-muted-foreground border-border" },
};
export function StatusChip({ status }: { status: keyof typeof STATUS }) {
  const s = STATUS[status];
  return (
    <span className={cn("inline-flex h-7 shrink-0 items-center gap-1 whitespace-nowrap rounded-lg border px-2 text-xs font-medium", s.cls)}>
      <Icon name={s.icon} className="!text-base" fill />{s.label}
    </span>
  );
}

export function Empty({ icon, title, text }: { icon: string; title: string; text: string }) {
  return (
    <div className="m3-card flex flex-col items-center py-12 text-center">
      <Icon name={icon} className="!text-5xl text-primary" />
      <h3 className="mt-3 text-lg text-foreground">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

export function timeLeft(iso: string) {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return "Encerrada";
  const h = Math.floor(ms / 3600_000);
  const m = Math.floor((ms % 3600_000) / 60_000);
  return h > 0 ? `${h}h ${m}min restantes` : `${m}min restantes`;
}
export const fmtDate = (iso: string) => new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
