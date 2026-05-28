import { test, expect } from "@playwright/test";

test("golden path: signup -> wizard -> confirm -> track", async ({ page }) => {
  test.setTimeout(180_000);

  const email = `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@example.com`;

  // Sign up (auto-signs in and lands on the dashboard)
  await page.goto("/signup");
  await page.getByLabel("Name").fill("E2E Test");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("supersecret123");
  await page.getByRole("button", { name: /create account/i }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 });

  // Search flights from the home form (LOS -> DXB default)
  await page.goto("/");
  await page.locator('input[type="date"]').fill("2026-09-15");
  await page.getByRole("button", { name: /search flights/i }).click();
  await expect(page).toHaveURL(/\/search\?/);

  // Pick the first result -> opens fare modal
  await page.getByRole("button", { name: /^select$/i }).first().click();
  const modal = page.getByTestId("fare-modal");
  await expect(modal).toBeVisible();

  // Pick the Standard (Most popular) fare card -> /book wizard at review step
  await modal.getByRole("button", { name: /^select$/i }).nth(1).click();
  await expect(page).toHaveURL(/\/book\//);
  await expect(page).toHaveURL(/step=review/);

  // Review trip -> Next: Checkout
  await page.getByRole("button", { name: /Next: Checkout/i }).click();
  await expect(page).toHaveURL(/step=travellers/);

  // Travellers form
  await page.getByLabel("First name").fill("Test");
  await page.getByLabel("Surname").fill("Traveller");
  await page.getByLabel("Passport number").fill("AB12345");
  await page.getByLabel("Date of birth day").selectOption("15");
  await page.getByLabel("Date of birth month").selectOption("5");
  await page.getByLabel("Date of birth year").selectOption("1990");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Phone number").fill("8012345678");

  // Next: Payment
  await page.getByRole("button", { name: /Next: Payment/i }).click();
  await expect(page).toHaveURL(/step=payment/);

  // Payment form (simulated)
  await page.getByLabel("Name on card").fill("Test Traveller");
  await page.getByLabel("Debit/Credit card number").fill("4242 4242 4242 4242");
  await page.getByLabel("Expiry date").fill("12/29");
  await page.getByLabel("Security code").fill("123");
  await page.getByLabel("Billing address 1").fill("123 Main St");
  await page.getByLabel("Postal code").fill("100001");
  await page.getByLabel("City").fill("Lagos");

  // Next: Review
  await page.getByRole("button", { name: /Next: Review/i }).click();
  await expect(page).toHaveURL(/step=confirm/);

  // Buy now -> confirmation
  await page.getByRole("button", { name: /Buy now/i }).click();
  await expect(page).toHaveURL(/\/booking\//, { timeout: 30_000 });
  await expect(page.getByText(/booking confirmed/i)).toBeVisible();

  const refText = (await page.getByText(/TRV-/).first().textContent()) ?? "";
  const refMatch = refText.match(/TRV-[A-Z0-9]+/);
  expect(refMatch).not.toBeNull();
  const ref = refMatch![0];

  // Track lookup (public)
  await page.goto(`/track?ref=${ref}`);
  await expect(page.getByText("Confirmed").first()).toBeVisible({ timeout: 15_000 });
});

test("booking requires authentication", async ({ page }) => {
  await page.goto("/book/some-flight-id");
  await expect(page).toHaveURL(/\/login/);
});
