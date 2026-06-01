import { test, expect } from "@playwright/test";

test("stay golden path: signup -> search -> detail -> book -> voucher", async ({ page }) => {
  test.setTimeout(180_000);

  const email = `e2e-stay-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@example.com`;

  // Sign up (auto-signs in, lands on dashboard)
  await page.goto("/signup");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1500);
  await page.getByLabel("Name").fill("E2E Stay");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("supersecret123");
  await page.getByRole("button", { name: /create account/i }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 });

  // Go straight to a seeded stay search (mock provider, keyless).
  await page.goto("/stays?destination=Barcelona&checkIn=2026-09-15&checkOut=2026-09-18&adults=2&rooms=1");
  await page.waitForLoadState("networkidle");
  const firstDeal = page.getByRole("link", { name: /view deal/i }).first();
  await expect(firstDeal).toBeVisible({ timeout: 30_000 });

  // Open the first hotel.
  await firstDeal.click();
  await expect(page).toHaveURL(/\/stay\//);

  // Reserve -> booking form. (force: the detail page keeps shifting as the map
  // iframe + lazy images load, so wait for the link then click past the
  // stability check rather than for a settled layout that never arrives.)
  const reserve = page.getByRole("link", { name: /^Reserve$/ });
  await reserve.scrollIntoViewIfNeeded();
  await reserve.click({ force: true });
  await expect(page).toHaveURL(/\/book\/stay\//, { timeout: 30_000 });

  // Lead guest + contact + simulated card (new Expedia-style checkout).
  await page.getByLabel("First name").fill("Test");
  await page.getByLabel("Last name").fill("Guest");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Name on card").fill("Test Guest");
  await page.getByPlaceholder("4242 4242 4242 4242").fill("4242 4242 4242 4242");
  await page.getByPlaceholder("MM/YY").fill("12/29");
  await page.getByPlaceholder("123").fill("123");

  // Book now -> waiting screen -> auto-advance to the confirmation slip.
  await page.getByRole("button", { name: /book now/i }).click();
  await expect(page).toHaveURL(/\/stay-processing\//, { timeout: 30_000 });
  await expect(page.getByText(/completing your booking/i)).toBeVisible();
  await expect(page).toHaveURL(/\/stay-booking\//, { timeout: 30_000 });
  await expect(page.getByText(/booking confirmed/i)).toBeVisible();

  // Voucher PDF endpoint responds with a PDF.
  const ref = page.url().split("/stay-booking/")[1];
  const res = await page.request.get(`/api/voucher/${ref}`);
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toContain("application/pdf");
});

test("stay booking requires authentication", async ({ page }) => {
  await page.goto("/book/stay/some-stay-id");
  await expect(page).toHaveURL(/\/login/);
});
