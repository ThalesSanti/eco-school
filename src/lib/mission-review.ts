import { z } from "zod";

export const reviewInputSchema = z.object({
  title: z.string().trim().min(1).max(200),
  criteria: z.string().trim().min(5).max(2000),
  description: z.string().trim().min(5, "Descreva a entrega com pelo menos 5 caracteres.").max(2000),
  photo: z.string().max(2_100_000).regex(/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/, "Envie uma foto JPG, PNG ou WebP."),
});

export const reviewResultSchema = z.object({
  recommendation: z.enum(["atende", "parcial", "insuficiente"]),
  summary: z.string().min(1).max(1000),
  criteria: z.array(z.object({ criterion: z.string().min(1).max(400), status: z.enum(["atendido", "parcial", "nao_verificavel"]), observation: z.string().min(1).max(600) })).min(1).max(10),
  feedback: z.string().min(1).max(2000),
  limitations: z.string().min(1).max(1000),
});

export type MissionReview = z.infer<typeof reviewResultSchema>;
export const REVIEW_LABELS = { atende: "Atende aos critérios", parcial: "Atende parcialmente", insuficiente: "Evidência insuficiente" };
export const CRITERION_LABELS = { atendido: "Atendido", parcial: "Parcial", nao_verificavel: "Não verificável" };

export function canReviewMissions(roles: { role: string }[] | null) {
  return roles?.some((r) => r.role === "professor" || r.role === "admin") ?? false;
}
