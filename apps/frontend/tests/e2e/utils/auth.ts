import { expect, Page } from "@playwright/test";

type CredentialOverrides = {
  email?: string;
  password?: string;
};

export async function loginToApp(page: Page, overrides: CredentialOverrides = {}) {
  const email = overrides.email ?? process.env.E2E_TEST_EMAIL ?? "demo.user@example.com";
  const password = overrides.password ?? process.env.E2E_TEST_PASSWORD ?? "Password1234!";

  await page.goto("/");
  const loginReady = page.getByLabel("メールアドレス").waitFor({ state: "visible" }).then(() => "login");
  const dashboardReady = page
    .waitForURL("**/dashboard", { waitUntil: "domcontentloaded" })
    .then(() => "dashboard")
    .catch(() => "login");

  const first = await Promise.race([loginReady, dashboardReady]);

  if (first === "dashboard") {
    await expect(page.getByText("DashboardPage")).toBeVisible();
    return;
  }

  await page.getByLabel("メールアドレス").fill(email);
  await page.getByLabel("パスワード").fill(password);
  await page.getByRole("button", { name: "ログイン" }).click();

  let nextState: "dashboard" | "error" | "challenge";
  try {
    nextState = await Promise.race([
      page.waitForURL("**/dashboard", { waitUntil: "domcontentloaded", timeout: 60_000 }).then(() => "dashboard" as const),
      page
        .getByText("パスワードの更新が必要です", { exact: false })
        .waitFor({ state: "visible", timeout: 60_000 })
        .then(() => "challenge" as const),
      page.getByRole("alert").waitFor({ state: "visible", timeout: 60_000 }).then(() => "error" as const)
    ]);
  } catch (error) {
    const alertVisible = await page.getByRole("alert").isVisible().catch(() => false);
    if (alertVisible) {
      const message = await page.getByRole("alert").innerText();
      throw new Error(`ログイン失敗: ${message}`);
    }
    throw new Error("ログイン処理が完了しませんでした。");
  }

  if (nextState === "dashboard") {
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByText("DashboardPage")).toBeVisible();
    return;
  }

  if (nextState === "challenge") {
    throw new Error("パスワード更新が必要なアカウントです。テスト用資格情報を確認してください。");
  }

  if (nextState === "error") {
    const messageLocator = page.getByRole("alert");
    const message = await messageLocator.innerText().catch(() => "");
    const fallback = message.trim().length > 0 ? message : (await messageLocator.textContent().catch(() => "")) ?? "";
    const lastAuthError = await page.evaluate(() => (window as typeof window & { __lastAuthError?: string }).__lastAuthError ?? null).catch(() => null);
    const finalMessage = (lastAuthError ?? fallback).trim().length > 0 ? (lastAuthError ?? fallback) : "認証エラー";
    throw new Error(`ログイン失敗: ${finalMessage}`);
  }

  throw new Error("ログイン処理が完了しませんでした。");
}
