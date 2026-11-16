import { expect, test, type Page } from "@playwright/test";

const STORAGE_KEY = "eco-school-mvp-v1";
const DEMO_SUBMISSION_NOTE = "Separei garrafas PET e latas na cozinha.";

type StoredSubmission = {
  id: string;
  studentId: string;
  status: "pendente" | "aprovada" | "rejeitada";
  points: number;
  note: string;
};

type StoredAuditEvent = {
  action: string;
  object: string;
  details: string;
};

type StoredState = {
  submissions: StoredSubmission[];
  audit: StoredAuditEvent[];
};

async function loginAsDemoTeacher(page: Page) {
  await page.goto("/?perfil=professor");
  await expect(page.getByRole("heading", { name: /Professor/ })).toBeVisible();
  const fillDemoAccount = page.getByRole("button", { name: "Preencher automaticamente" });
  const username = page.locator('input[name="username"]');
  await expect(async () => {
    await fillDemoAccount.click();
    await expect(username).toHaveValue("carlos.lima", { timeout: 250 });
  }).toPass({ timeout: 10_000 });
  await expect(page.locator('input[name="password"]')).toHaveValue("eco2026");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/\/app\/validacao(?:\?.*)?$/);
  await expect(page.getByRole("heading", { name: "Validação" })).toBeVisible();
}

async function readStoredState(page: Page): Promise<StoredState> {
  return page.evaluate((key) => {
    const raw = localStorage.getItem(key);
    if (!raw) throw new Error("Estado demonstrativo não encontrado no navegador.");
    return JSON.parse(raw) as StoredState;
  }, STORAGE_KEY);
}

function approvedPointsForStudent(state: StoredState, studentId: string) {
  return state.submissions
    .filter((submission) => submission.studentId === studentId && submission.status === "aprovada")
    .reduce((total, submission) => total + submission.points, 0);
}

function findDemoPendingSubmission(state: StoredState) {
  const submission = state.submissions.find(
    (item) => item.status === "pendente" && item.note === DEMO_SUBMISSION_NOTE,
  );
  expect(submission, "entrega demonstrativa pendente deve existir").toBeDefined();
  return submission!;
}

test("professor abre evidência, aprova e confirma pontos, responsável e auditoria", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await loginAsDemoTeacher(page);

  const before = await readStoredState(page);
  const submissionData = findDemoPendingSubmission(before);
  const submission = page.locator("article").filter({ hasText: DEMO_SUBMISSION_NOTE });
  await expect(submission).toBeVisible();
  await expect(submission.getByText(DEMO_SUBMISSION_NOTE)).toBeVisible();
  await expect(submission.getByRole("button", { name: "Aprovar", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /IA/i })).toHaveCount(0);

  const approvedPointsBefore = approvedPointsForStudent(before, submissionData.studentId);
  await submission.getByRole("button", { name: "Aprovar", exact: true }).click();
  await expect
    .poll(async () => {
      const after = await readStoredState(page);
      return after.submissions.find((item) => item.id === submissionData.id)?.status;
    })
    .toBe("aprovada");

  const after = await readStoredState(page);
  expect(approvedPointsForStudent(after, submissionData.studentId)).toBe(
    approvedPointsBefore + submissionData.points,
  );
  expect(after.audit[0]).toMatchObject({
    action: "Validação aprovada",
    details: `+${submissionData.points} pts`,
  });

  await page.getByRole("button", { name: "Decididas" }).click();
  await expect(submission).toBeVisible();
  await expect(submission.getByText(/Prof\. Carlos Lima/)).toBeVisible();
  await expect(submission.getByRole("button", { name: "Aprovar", exact: true })).toHaveCount(0);
});

test("professor exige justificativa, rejeita e registra o motivo sem pontuar", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await loginAsDemoTeacher(page);

  const before = await readStoredState(page);
  const submissionData = findDemoPendingSubmission(before);
  const approvedPointsBefore = approvedPointsForStudent(before, submissionData.studentId);
  const submission = page.locator("article").filter({ hasText: DEMO_SUBMISSION_NOTE });

  await submission.getByRole("button", { name: "Rejeitar", exact: true }).click();
  await expect(submission.getByLabel("Justificativa da rejeição")).toBeVisible();
  await submission.getByRole("button", { name: "Confirmar rejeição" }).click();
  await expect(page.getByText("Informe a justificativa.")).toBeVisible();
  expect(
    (await readStoredState(page)).submissions.find((item) => item.id === submissionData.id)?.status,
  ).toBe("pendente");

  const reason = "A foto não mostra a separação dos recicláveis.";
  await submission.getByLabel("Justificativa da rejeição").fill(reason);
  await submission.getByRole("button", { name: "Confirmar rejeição" }).click();
  await expect
    .poll(async () => {
      const after = await readStoredState(page);
      return after.submissions.find((item) => item.id === submissionData.id)?.status;
    })
    .toBe("rejeitada");

  const after = await readStoredState(page);
  expect(approvedPointsForStudent(after, submissionData.studentId)).toBe(approvedPointsBefore);
  expect(after.audit[0]).toMatchObject({
    action: "Validação rejeitada",
    details: `Motivo: ${reason}`,
  });

  await page.getByRole("button", { name: "Decididas" }).click();
  await expect(submission).toBeVisible();
  await expect(submission.getByText(reason)).toBeVisible();
  await expect(submission.getByText(/Prof\. Carlos Lima/)).toBeVisible();
});

test("página de validação se ajusta às larguras mobile, tablet e desktop", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await loginAsDemoTeacher(page);

  for (const width of [360, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(page.getByRole("heading", { name: "Validação" })).toBeVisible();
    await expect(page.locator("article").filter({ hasText: DEMO_SUBMISSION_NOTE })).toBeVisible();

    const documentWidth = await page.evaluate(() =>
      Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
    );
    expect(documentWidth, `overflow horizontal em ${width}px`).toBeLessThanOrEqual(width);
  }
});
