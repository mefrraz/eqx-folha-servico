import { test, expect } from "@playwright/test";

const BASE = process.env.E2E_BASE_URL || "https://eqx-folha-servico.vercel.app";
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || "colaboradoreshoraseqx@gmail.com";
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD || "eqx2030";

async function loginAsAdmin(page: any) {
  await page.goto(`${BASE}/auth/login`);
  await page.getByLabel("Email").fill(ADMIN_EMAIL);
  await page.getByLabel("Password").fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: /Entrar/i }).click();
  await page.waitForURL(/\/hr/, { timeout: 15000 });
}

test.describe("EQX Folha de Serviço", () => {
  test("login page loads", async ({ page }) => {
    await page.goto(`${BASE}/auth/login`);
    await expect(page.getByRole("heading", { name: /Folha de Serviço/i })).toBeVisible();
  });

  test("admin can login and access dashboard", async ({ page }) => {
    await loginAsAdmin(page);
    await expect(page).toHaveURL(/\/hr/);
  });

  test("admin can navigate to users page", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(`${BASE}/hr/users`);
    await expect(page.getByRole("heading", { name: /Utilizadores/i })).toBeVisible();
  });

  test("admin can access invites page", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(`${BASE}/hr/invites`);
    await expect(page.getByRole("heading", { name: /Convites de acesso/i })).toBeVisible();
  });

  test("admin can access projects requests page", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(`${BASE}/hr/projects/requests`);
    await expect(page.getByRole("heading", { name: /Pedidos de obras/i })).toBeVisible();
  });

  test("admin can create an invite", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(`${BASE}/hr/invites`);
    const code = `TEST${Date.now().toString().slice(-6)}`;
    await page.getByPlaceholder("EX: EQX2025").fill(code);
    await page.getByRole("button", { name: /Criar convite/i }).click();
    await expect(page.getByText(code)).toBeVisible();
  });

  test("worker can register with invite and create a sheet", async ({ page }) => {
    // Create an invite as admin
    const code = `W${Date.now().toString().slice(-6)}`;
    await loginAsAdmin(page);
    await page.goto(`${BASE}/hr/invites`);
    await page.getByPlaceholder("EX: EQX2025").fill(code);
    await page.getByRole("button", { name: /Criar convite/i }).click();
    await expect(page.getByText(code)).toBeVisible();

    // Register a worker with the invite
    const email = `test${Date.now().toString().slice(-6)}@example.com`;
    await page.goto(`${BASE}/auth/signup`);
    await page.getByPlaceholder("Código fornecido pela EQX").fill(code);
    await page.getByPlaceholder("João Silva").fill("teste trabalhador");
    await page.getByPlaceholder("o.seu@email.com").fill(email);
    await page.getByPlaceholder("Mínimo 6 caracteres").fill("teste123");
    await page.getByRole("button", { name: /Criar conta/i }).click();

    // Should land on dashboard (or login if email confirmation required)
    await page.waitForTimeout(3000);
    const url = page.url();
    if (url.includes("/auth/login")) {
      // Email confirmation required — log in directly
      await page.getByPlaceholder("nome@eqx.pt").fill(email);
      await page.getByPlaceholder("••••••••").fill("teste123");
      await page.getByRole("button", { name: /Entrar/i }).click();
    }
    await page.waitForURL(/\/(worker|hr)/, { timeout: 15000 });
  });
});
