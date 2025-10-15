import { test, expect } from "@playwright/test";

test.describe("ダッシュボード", () => {
  test("主要ウィジェットが表示される", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByText("DashboardPage")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1, name: "勤怠管理" })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "メインメニュー" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "今月のサマリー（2025年9月）" })).toBeVisible();
    await expect(page.getByText("週単位のサマリー")).toBeVisible();
  await expect(page.getByText("残業時間")).toBeVisible();
  await expect(page.getByText("休暇")).toBeVisible();
  await expect(page.getByText("自動経費申請")).toBeVisible();
  await expect(page.getByRole("button", { name: "申請ページを開く" })).toBeVisible();
  });

  test("ナビゲーション操作でアクティブ状態が更新される", async ({ page }) => {
    await page.goto("/");

    const timeEntryButton = page.getByRole("button", { name: "時間記録" });
    await timeEntryButton.click();

    await expect(timeEntryButton).toHaveClass(/navButtonActive/);
    await expect(timeEntryButton).toHaveAttribute("aria-pressed", "true");
  });
});
