import { test, expect } from "@playwright/test";

test("golden path: signup → search → book → confirm → dashboard", async ({ page }) => {
  test.setTimeout(120_000);

  const email = `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@example.com`;

  // 1. Sign up (auto-signs in and lands on the dashboard)
  await page.goto("/signup");
  await page.getByLabel("Name").fill("E2E Test");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("supersecret123");
  await page.getByRole("button", { name: /create account/i }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 });

  // 2. Search flights from the home form (defaults LOS -> DXB)
  await page.goto("/");
  await page.locator('input[type="date"]').fill("2026-07-15");
  await page.getByRole("button", { name: /search flights/i }).click();
  await expect(page).toHaveURL(/\/search\?/);

  // 3. Select the first result -> detail -> continue to book
  await page.getByRole("link", { name: /^select$/i }).first().click();
  await expect(page).toHaveURL(/\/flight\//);
  await page.getByRole("link", { name: /continue to book/i }).click();
  await expect(page).toHaveURL(/\/book\//);

  // 4. Traveller + simulated payment
  await page.getByLabel("First name").fill("Test");
  await page.getByLabel("Last name").fill("Traveller");
  await page.getByLabel("Date of birth").fill("1990-05-15");
  await page.getByLabel("Card number").fill("4242424242424242");
  await page.getByLabel("Expiry").fill("12/29");
  await page.getByLabel("CVC").fill("123");
  await page.getByRole("button", { name: /pay .* confirm/i }).click();

  // 5. Confirmation
  await expect(page).toHaveURL(/\/booking\//, { timeout: 30_000 });
  await expect(page.getByText(/booking confirmed/i)).toBeVisible();
  await expect(page.getByText(/TRV-/).first()).toBeVisible();

  // 6. Booking shows on the dashboard
  await page.goto("/dashboard");
  await expect(page.getByText(/TRV-/).first()).toBeVisible();
  await expect(page.getByRole("link", { name: /e-ticket/i }).first()).toBeVisible();
});

test("booking requires authentication", async ({ page }) => {
  await page.goto("/book/some-flight-id");
  await expect(page).toHaveURL(/\/login/);
});
