import { expect, test, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const capturesDir = path.resolve(process.cwd(), "docs", "capturas");

async function loginWithDemoAccount(
  page: Page,
  role: "admin" | "aluno",
  heading: string,
  username: string,
) {
  await page.goto(`/?perfil=${role}`);
  await expect(page.getByRole("heading", { name: heading })).toBeVisible();
  const fillDemoAccount = page.getByRole("button", { name: "Preencher automaticamente" });
  const usernameInput = page.locator('input[name="username"]');
  await expect(async () => {
    await fillDemoAccount.click();
    await expect(usernameInput).toHaveValue(username, { timeout: 250 });
  }).toPass({ timeout: 10_000 });
  await expect(page.locator('input[name="password"]')).toHaveValue("eco2026");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
}

test.beforeAll(async () => {
  await mkdir(capturesDir, { recursive: true });
});

test("captura a auditoria usando o perfil demonstrativo de administrador", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await loginWithDemoAccount(page, "admin", "Administrador", "equipe.ecoschool");

  await expect(page).toHaveURL(/\/app\/auditoria(?:\?.*)?$/);
  await expect(page.getByRole("heading", { name: "Auditoria", exact: true })).toBeVisible();
  await expect(
    page
      .getByRole("listitem")
      .filter({ hasText: /Login.*Sessão/ })
      .first(),
  ).toBeVisible();
  await page.screenshot({
    path: path.join(capturesDir, "auditoria-administrador.png"),
    fullPage: true,
    animations: "disabled",
  });
});

test("captura o app do aluno em celular e verifica quatro larguras", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await loginWithDemoAccount(page, "aluno", "Aluno", "ana.souza");

  await expect(page).toHaveURL(/\/app\/missoes(?:\?.*)?$/);
  const studentHeading = page.getByRole("heading", { name: /Ana/ });
  await expect(studentHeading).toBeVisible();

  for (const width of [360, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    await expect(studentHeading).toBeVisible();

    const documentWidth = await page.evaluate(() =>
      Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
    );
    expect(documentWidth, `overflow horizontal em ${width}px`).toBeLessThanOrEqual(width);

    if (width === 390) {
      await expect(page.getByRole("navigation", { name: "Navegação principal" })).toBeVisible();
      await page.screenshot({
        path: path.join(capturesDir, "aplicativo-mobile.png"),
        animations: "disabled",
      });
    } else {
      await page.screenshot({
        path: testInfo.outputPath(`aplicativo-mobile-${width}px.png`),
        animations: "disabled",
      });
    }
  }
});
