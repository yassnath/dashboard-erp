import { expect, Page, test } from "@playwright/test";

async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Masuk" }).click();
  await expect(page).toHaveURL(/\/app/);
}

async function logout(page: Page) {
  await page.getByRole("button", { name: /Citra Staff|Bima Manager|Ayu Org Admin|User/i }).click();
  await page.getByRole("menuitem", { name: "Keluar" }).click();
  await expect(page).toHaveURL(/\/login/);
}

test("ERP workflow: PR -> approval -> PO -> stock receive -> invoice paid", async ({ page }) => {
  await login(page, "staff@solvix.id", "solvix123");

  await page.goto("/app/procurement");
  await page.getByRole("button", { name: /Purchase Request/i }).click();

  const prForm = page.locator("#pr-form");
  await prForm.getByRole("combobox").nth(0).click();
  await page.getByRole("option").first().click();
  await prForm.getByRole("combobox").nth(1).click();
  await page.getByRole("option").first().click();
  await prForm.getByLabel("Qty").fill("5");
  await prForm.getByLabel("Unit Cost").fill("120000");
  await prForm.getByLabel("Note").fill("Automated PR from e2e");
  await page.getByRole("button", { name: /Simpan Draft PR/i }).click();

  await page.getByRole("button", { name: /Submit/i }).first().click();
  await expect(page.getByText(/SUBMITTED/i).first()).toBeVisible();

  await logout(page);

  await login(page, "manager@solvix.id", "solvix123");

  await page.goto("/app/approvals");
  await page.getByRole("button", { name: /Approve/i }).first().click();
  await expect(page.getByText(/Inbox approval kosong|PURCHASE REQUEST/i).first()).toBeVisible();

  await page.goto("/app/procurement");
  await page.getByRole("button", { name: /Buat PO/i }).first().click();

  await page.getByRole("tab", { name: /Purchase Orders/i }).click();
  await page.getByRole("button", { name: /Receive Stock/i }).first().click();
  await expect(page.getByText(/RECEIVED/i).first()).toBeVisible();

  await page.goto("/app/sales");
  await page.getByRole("button", { name: /Invoice/i }).click();

  const invoiceForm = page.locator("#create-invoice-form");
  await invoiceForm.getByRole("combobox").nth(0).click();
  await page.getByRole("option").first().click();
  await invoiceForm.getByRole("combobox").nth(1).click();
  await page.getByRole("option").first().click();
  await invoiceForm.getByLabel("Qty").fill("2");
  await invoiceForm.getByLabel("Harga Satuan").fill("35000");
  await invoiceForm.getByLabel("Deskripsi").fill("Invoice e2e automation");
  await page.getByRole("button", { name: /Simpan Draft/i }).click();

  await page.getByRole("button", { name: /^Issue$/ }).first().click();
  await page.getByRole("button", { name: /^Bayar$/ }).first().click();

  const paymentForm = page.locator("#create-payment-form");
  await paymentForm.getByLabel("Metode").fill("Cash");
  await paymentForm.getByLabel("Jumlah").fill("77777");
  await page.getByRole("button", { name: /Simpan Payment/i }).click();

  await expect(page.getByText(/PAID/i).first()).toBeVisible();
});
