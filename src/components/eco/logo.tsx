import { cn } from "@/lib/utils";

const LOGO_SRC = "/eco-school-logo.png";
const LOGO_ALT = "Eco School — Escolas Sustentáveis e Conectadas";

/** Logo oficial completa (arquivo original, proporção 1:1 preservada, sem alteração de cor). */
export function LogoFull({ className }: { className?: string }) {
  return (
    <img
      src={LOGO_SRC}
      alt={LOGO_ALT}
      width={640}
      height={640}
      decoding="async"
      className={cn("aspect-square h-auto select-none object-contain", className)}
    />
  );
}

/**
 * Emblema (somente a folha) para áreas compactas. É um recorte do MESMO arquivo oficial
 * (sem distorção: quadrado proporcional da região da folha), usado como imagem de fundo.
 */
export function LogoMark({ size = 44, className }: { size?: number; className?: string }) {
  return (
    <span
      role="img"
      aria-label="Eco School"
      className={cn("eco-logo-frame inline-block shrink-0 rounded-2xl", className)}
      style={{
        width: size,
        height: size,
        backgroundImage: `url(${LOGO_SRC})`,
        backgroundRepeat: "no-repeat",
        backgroundSize: `${size * (640 / 260)}px ${size * (640 / 260)}px`,
        backgroundPosition: `${-size * (190 / 260)}px ${-size * (85 / 260)}px`,
      }}
    />
  );
}

/** Marca com texto: emblema + nome, para cabeçalhos. */
export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <LogoMark size={compact ? 36 : 44} />
      <span className="leading-none">
        <span className="font-display text-lg font-extrabold text-primary">ECO</span>{" "}
        <span className="font-display text-lg font-extrabold text-tertiary">SCHOOL</span>
      </span>
    </span>
  );
}
