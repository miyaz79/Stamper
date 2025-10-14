import { test, expect } from "@playwright/test";

test.describe("Cognito ログイン", () => {
  test("既存ユーザーがログインできる", async ({ page }) => {
    const email = process.env.E2E_TEST_EMAIL;
    const password = process.env.E2E_TEST_PASSWORD;

    test.skip(!email || !password, "E2E_TEST_EMAIL / E2E_TEST_PASSWORD が設定されていません");

    const emailInput = page.locator("#email");
    const passwordInput = page.locator("#password");
    const submitButton = page.getByRole("button", { name: "ログイン" });
    const successStatus = page.getByRole("status");

    await page.goto("/");

    await emailInput.fill(email!);
    await passwordInput.fill(password!);
    await submitButton.click();

    await expect(successStatus).toHaveText(/ログインに成功しました。/);

    await page.waitForLoadState("networkidle");
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });
});
