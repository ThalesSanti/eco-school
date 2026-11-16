import { expect, test, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const capturesDir = path.resolve(process.cwd(), "docs", "capturas");

async function loginWithDemoAccount(
  page: Page,
  role: "aluno" | "professor" | "regional",
  heading: RegExp,
) {
  await page.goto(`/?perfil=${role}`);
  await expect(page.getByRole("heading", { name: heading })).toBeVisible();
  const expectedUsername = {
    aluno: "ana.souza",
    professor: "carlos.lima",
    regional: "diretoria.jau",
  }[role];
  const fillDemoAccount = page.getByRole("button", { name: "Preencher automaticamente" });
  const username = page.locator('input[name="username"]');
  await expect(async () => {
    await fillDemoAccount.click();
    await expect(username).toHaveValue(expectedUsername, { timeout: 250 });
  }).toPass({ timeout: 10_000 });
  await expect(page.locator('input[name="password"]')).toHaveValue("eco2026");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
}

test.beforeAll(async () => {
  await mkdir(capturesDir, { recursive: true });
});

test("captura o formulário de registro de missão demonstrativa", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await loginWithDemoAccount(page, "aluno", /^Aluno$/);
  await expect(page).toHaveURL(/\/app\/missoes(?:\?.*)?$/);

  const mission = page
    .locator("article")
    .filter({ hasText: "Separe o lixo reciclável de casa" })
    .first();
  await expect(mission).toBeVisible();
  await mission.getByRole("button", { name: "Registrar" }).click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByLabel("O que você fez?")).toBeVisible();
  await expect(dialog.getByLabel("Foto da missão")).toBeVisible();
  await page.screenshot({
    path: path.join(capturesDir, "registro-missao-aluno.png"),
    animations: "disabled",
  });
});

test("captura a resposta automática do quiz demonstrativo", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await loginWithDemoAccount(page, "aluno", /^Aluno$/);
  await expect(page).toHaveURL(/\/app\/missoes(?:\?.*)?$/);

  const quiz = page.locator("article").filter({ hasText: "Quiz: o ciclo da água" }).first();
  await expect(quiz).toBeVisible();
  await quiz.getByRole("button", { name: "Responder" }).click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("Qual processo transforma a água líquida em vapor?")).toBeVisible();
  await dialog.getByRole("radio", { name: "Evaporação" }).click();
  await dialog.getByRole("button", { name: "Enviar" }).click();

  await expect(page.getByText("Resposta certa! +15 pontos.", { exact: true })).toBeVisible();
  await expect(page.getByText("1 de 6 missões", { exact: true })).toBeVisible();
  await page.screenshot({
    path: path.join(capturesDir, "resposta-quiz.png"),
    fullPage: true,
    animations: "disabled",
  });
});

test("captura a etapa de justificativa de rejeição sem confirmar uma decisão", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await loginWithDemoAccount(page, "professor", /Professor/);
  await expect(page).toHaveURL(/\/app\/validacao(?:\?.*)?$/);

  const submission = page
    .locator("article")
    .filter({ hasText: "Separei garrafas PET e latas na cozinha." })
    .first();
  await expect(submission).toBeVisible();
  await submission.getByRole("button", { name: "Rejeitar" }).click();
  await expect(submission.getByLabel("Justificativa da rejeição")).toBeVisible();
  await page.screenshot({
    path: path.join(capturesDir, "rejeicao-atividade-professor.png"),
    fullPage: true,
    animations: "disabled",
  });
});

test("captura o ranking visto pelo perfil demonstrativo de professor", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await loginWithDemoAccount(page, "professor", /Professor/);
  await expect(page).toHaveURL(/\/app\/validacao(?:\?.*)?$/);
  await page.getByRole("link", { name: "Ranking", exact: true }).click();

  await expect(page).toHaveURL(/\/app\/ranking(?:\?.*)?$/);
  await expect(page.getByRole("heading", { name: "Ranking de alunos" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Filtros do ranking" })).toBeVisible();
  await page.screenshot({
    path: path.join(capturesDir, "ranking-professor.png"),
    fullPage: true,
    animations: "disabled",
  });
});

test("captura a visão Alunos do ranking regional", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await loginWithDemoAccount(page, "regional", /Gestor Regional/);

  await expect(page).toHaveURL(/\/app\/ranking(?:\?.*)?$/);
  await expect(page.getByRole("heading", { name: "Ranking regional" })).toBeVisible();
  const viewSelector = page.getByRole("group", { name: "Tipo de ranking regional" });
  await viewSelector.getByRole("button", { name: "Alunos" }).click();
  await expect(page.getByRole("region", { name: "Filtros do ranking" })).toBeVisible();
  await page.screenshot({
    path: path.join(capturesDir, "ranking-regional-alunos.png"),
    fullPage: true,
    animations: "disabled",
  });
});
