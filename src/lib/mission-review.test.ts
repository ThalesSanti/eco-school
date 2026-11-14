import { describe, expect, it } from "vitest";
import { reviewInputSchema, reviewResultSchema, canReviewMissions } from "./mission-review";

describe("Avaliação de missões", () => {
  const input = { title: "Coleta seletiva", criteria: "Separe plástico, papel e metal.", description: "Separei garrafas e latas.", photo: "data:image/png;base64,aGVsbG8=" };
  it("permits assigned teachers but not students or missing roles", () => {
    expect(canReviewMissions([{ role: "professor" }])).toBe(true);
    expect(canReviewMissions([{ role: "aluno" }])).toBe(false);
    expect(canReviewMissions(null)).toBe(false);
    expect(canReviewMissions([])).toBe(false);
  });
  it("requires description and photo for the teacher's review", () => {
    expect(reviewInputSchema.safeParse(input).success).toBe(true);
    expect(reviewInputSchema.safeParse({ ...input, photo: "" }).success).toBe(false);
    expect(reviewInputSchema.safeParse({ ...input, description: "" }).success).toBe(false);
  });
  it("does not accept remote image URLs", () => {
    expect(reviewInputSchema.safeParse({ ...input, photo: "https://example.com/image.jpg" }).success).toBe(false);
  });
  it("keeps output advisory with criteria and clear feedback", () => {
    expect(reviewResultSchema.safeParse({ recommendation: "aprovada", summary: "Aprovada", criteria: [], feedback: "", limitations: "" }).success).toBe(false);
  });
});