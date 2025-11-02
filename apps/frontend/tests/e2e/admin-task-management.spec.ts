import { test, expect, type Page } from "@playwright/test";
import { loginToApp } from "./utils/auth";

async function goToTaskManagement(page: Page) {
  await loginToApp(page);
  await page.goto("/admin/task-management");
  await expect(page.getByRole("heading", { level: 1, name: "作業項目管理" })).toBeVisible();
}

test.describe("管理者 作業項目管理", () => {
  test("ツリーへの項目追加", async ({ page }) => {
    await goToTaskManagement(page);

    await expect(page.getByRole("button", { name: /開発部/ })).toHaveAttribute("aria-current", "true");

    await page.getByRole("button", { name: "同階層に追加" }).click();
    await expect(page.getByText("大分類（部署）を追加しました。", { exact: true })).toBeVisible();
    const newDepartment = page.getByRole("button", { name: /大分類（部署）（新規）/ });
    await expect(newDepartment).toBeVisible();
    await expect(newDepartment).toHaveAttribute("aria-current", "true");

    await page.getByRole("button", { name: "下位階層に追加" }).click();
    await expect(page.getByText("中分類（プロジェクト）を追加しました。", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: /中分類（プロジェクト）（新規）/ })).toBeVisible();
  });

  test("フォームからの更新反映", async ({ page }) => {
    await goToTaskManagement(page);

    const projectButton = page.getByRole("button", { name: /社内ツール整備/ });
    await projectButton.click();
    await expect(projectButton).toHaveAttribute("aria-current", "true");

    await page.getByLabel("項目名").fill("社内ツール整備（更新）");
    await page.getByLabel("説明").fill("E2E テストによる更新");
    const orderField = page.getByLabel("表示順");
    await orderField.fill("1");

    await page.getByRole("button", { name: "保存する" }).click();
    await expect(page.getByText("保存しました", { exact: false })).toBeVisible();

    await expect(page.getByRole("button", { name: /社内ツール整備（更新）/ })).toBeVisible();
    await expect(orderField).toHaveValue("1");
    await expect(page.getByLabel("説明")).toHaveValue("E2E テストによる更新");
  });
});
