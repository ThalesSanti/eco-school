import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { expect, test, type Page, type TestInfo } from "@playwright/test";

const capturesDir = path.resolve(process.cwd(), "docs", "capturas");
const bunExecutable =
  process.env.BUN_EXECUTABLE ?? (process.platform === "win32" ? "bun.exe" : "bun");

test.beforeAll(async () => {
  await mkdir(capturesDir, { recursive: true });
});

function runBun(args: string[]) {
  return new Promise<{
    status: number | null;
    error: Error | undefined;
    output: string;
    rawOutput: string;
  }>((resolve) => {
    const child = spawn(bunExecutable, args, {
      cwd: process.cwd(),
      windowsHide: true,
      env: { ...process.env, FORCE_COLOR: "0", NO_COLOR: "1" },
    });
    let output = "";
    let settled = false;
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => {
      output += chunk;
    });
    child.stderr.on("data", (chunk: string) => {
      output += chunk;
    });

    const finish = (status: number | null, error?: Error) => {
      if (settled) return;
      settled = true;
      const currentOutput = output.trimEnd();
      resolve({ status, error, output: currentOutput, rawOutput: output });
    };
    child.once("error", (error) => finish(null, error));
    child.once("close", (status) => finish(status));
  });
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character]!;
  });
}

function terminalHtml(command: string, output: string, exitCode: number | null) {
  const normalizedOutput = output.replace(/\r/g, "");
  return `<!doctype html>
    <html lang="pt-BR">
      <head>
        <meta charset="utf-8" />
        <style>
          * { box-sizing: border-box; }
          body { margin: 0; padding: 28px; background: #e8edf1; color: #17212b; font: 15px/1.5 "Segoe UI", sans-serif; }
          main { max-width: 1480px; margin: 0 auto; overflow: hidden; border: 1px solid #c4ccd3; border-radius: 10px; background: #101820; box-shadow: 0 12px 32px #19273424; }
          header { padding: 12px 18px; border-bottom: 1px solid #35414b; background: #f4f6f8; color: #22313d; font-weight: 600; }
          .command { margin: 0; padding: 14px 18px 8px; color: #8ed081; font: 600 15px/1.5 Consolas, "Cascadia Mono", monospace; }
          pre { margin: 0; padding: 8px 18px 16px; overflow: hidden; color: #e9edf1; white-space: pre-wrap; overflow-wrap: anywhere; font: 15px/1.55 Consolas, "Cascadia Mono", monospace; }
          footer { padding: 9px 18px; border-top: 1px solid #35414b; color: #b9c5cf; font: 12px/1.5 "Segoe UI", sans-serif; }
        </style>
      </head>
      <body>
        <main>
          <header>Eco School · saída capturada da execução atual</header>
          <p class="command">&gt; ${escapeHtml(command)}</p>
          <pre data-testid="command-output">${escapeHtml(normalizedOutput)}</pre>
          <footer data-testid="exit-code">Código de saída do processo: ${exitCode ?? "indisponível"}</footer>
        </main>
      </body>
    </html>`;
}

async function renderExecution(
  page: Page,
  testInfo: TestInfo,
  command: string,
  result: ReturnType<typeof runBun>,
  screenshotName: string,
) {
  await testInfo.attach(`${screenshotName}.txt`, {
    body: result.rawOutput || result.error?.message || "",
    contentType: "text/plain; charset=utf-8",
  });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.setContent(terminalHtml(command, result.output, result.status));
  await expect(page.getByTestId("command-output")).toBeVisible();
  await page.locator("main").screenshot({
    path: path.join(capturesDir, screenshotName),
    animations: "disabled",
  });
}

test("captura a saída atual da instalação congelada de dependências", async ({
  page,
}, testInfo) => {
  const command = "bun install --frozen-lockfile";
  const result = await runBun(["install", "--frozen-lockfile"]);
  await renderExecution(page, testInfo, command, result, "instalacao-dependencias.png");

  expect(result.error, result.error?.message).toBeUndefined();
  expect(result.status).toBe(0);
  await expect(page.getByTestId("command-output")).toContainText(/bun install v/);
  await expect(page.getByTestId("exit-code")).toContainText("0");
});

test("captura a saída real da execução atual de bun run test", async ({ page }, testInfo) => {
  test.setTimeout(240_000);
  const command = "bun run test";
  const result = await runBun(["run", "test"]);
  await renderExecution(page, testInfo, command, result, "execucao-testes.png");

  expect(result.error, result.error?.message).toBeUndefined();
  expect(result.status).toBe(0);
  expect(result.output).toMatch(/Test Files\s+\d+ passed/);
  expect(result.output).toMatch(/Tests\s+34 passed \(34\)/);
  await expect(page.getByTestId("command-output")).toContainText(/Tests\s+34 passed \(34\)/);
  await expect(page.getByTestId("exit-code")).toContainText("0");
});

test("captura a aplicação carregada no endereço público de Cloudflare Workers", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("https://eco-school.thalescdn.workers.dev/", {
    timeout: 30000,
  });
  await expect(page).toHaveTitle(/Eco School/);
  await expect(
    page.getByRole("heading", { name: /Escolas.*Sustentáveis.*Conectadas/ }),
  ).toBeVisible();
  await page.screenshot({
    path: path.join(capturesDir, "cloudflare-workers.png"),
    fullPage: true,
    animations: "disabled",
  });
});
