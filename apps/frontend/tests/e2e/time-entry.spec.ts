import { test, expect } from "@playwright/test";
import { loginToApp } from "./utils/auth";

test.describe("時間記録", () => {
  test.beforeEach(async ({ page }) => {
    await loginToApp(page);
  });

  test("日次勤怠記録画面が表示される", async ({ page }) => {
    await page.goto("/time-entry");

    await expect(page.getByText("TimeLogsPage")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1, name: "勤怠管理" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "時間記録" })).toBeVisible();
    await expect(page.getByLabel("日付")).toBeVisible();
    await expect(page.getByRole("button", { name: "保存" })).toBeEnabled();
  });

  test("作業項目の追加と削除ができる", async ({ page }) => {
    await page.goto("/time-entry");

    const rows = page.locator("[data-testid='work-row']");
    await expect(rows).toHaveCount(3);

    await page.getByRole("button", { name: "+ 作業項目を追加" }).click();
    await expect(rows).toHaveCount(4);

    const firstRemove = rows.nth(0).getByRole("button", { name: /作業項目 1 を削除/ });
    await firstRemove.click();
    await expect(rows).toHaveCount(3);
  });

  test("休暇設定が切り替わる", async ({ page }) => {
    await page.goto("/time-entry");

  const leaveCheckbox = page.getByLabel("休暇にする");
  await leaveCheckbox.check({ force: true });
    await expect(page.getByLabel("休暇タイプ")).toBeVisible();
    await page.getByLabel("休暇タイプ").selectOption("hourly");
    await expect(page.getByLabel("休暇時間")).toBeVisible();
  });
});
