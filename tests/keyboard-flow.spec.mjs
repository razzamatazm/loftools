import { test, expect } from "@playwright/test";

async function expectFocused(page, selector) {
  await expect(page.locator(selector)).toBeFocused();
}

async function pressTab(page, options) {
  await page.keyboard.press(options?.shift ? "Shift+Tab" : "Tab");
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
});

test("lease tab flow reaches first rent, lease type, and next rent row", async ({ page }) => {
  await page.locator("#lease-sqft").fill("10000");
  await pressTab(page);
  await expectFocused(page, "#lease-vacancy");

  await page.locator("#lease-vacancy").fill("7");
  await pressTab(page);
  await expectFocused(page, "#lease-start-cap");

  await page.locator("#lease-start-cap").fill("6");
  await pressTab(page);
  await expectFocused(page, '[data-lease-rent="0"]');

  await page.locator('[data-lease-rent="0"]').type("12.5");
  await expectFocused(page, '[data-lease-rent="0"]');
  await expect(page.locator('[data-lease-rent="0"]')).toHaveValue("12.5");

  await pressTab(page);
  await expectFocused(page, '[data-lease-type="0"]');

  await pressTab(page);
  await expectFocused(page, '[data-lease-rent="1"]');
});

test("sale comps tab flow follows subject fields then purchase price and comp sf rows", async ({ page }) => {
  await page.getByRole("button", { name: "Sale Comps", exact: true }).click();

  await page.locator("#sale-subject-sqft").fill("8500");
  await pressTab(page);
  await expectFocused(page, "#sale-listing-discount");

  await page.locator("#sale-listing-discount").fill("10");
  await pressTab(page);
  await expectFocused(page, '[data-sale-price="0"]');

  await page.locator('[data-sale-price="0"]').type("1250000");
  await expectFocused(page, '[data-sale-price="0"]');
  await expect(page.locator('[data-sale-price="0"]')).toHaveValue("1250000");

  await pressTab(page);
  await expectFocused(page, '[data-sale-sqft="0"]');

  await page.locator('[data-sale-sqft="0"]').type("5000");
  await expectFocused(page, '[data-sale-sqft="0"]');
  await expect(page.locator('[data-sale-sqft="0"]')).toHaveValue("5000");

  await pressTab(page);
  await expectFocused(page, '[data-sale-price="1"]');
});

test("apt sale comps skip sf inputs when $ / SF valuation is off", async ({ page }) => {
  await page.getByRole("button", { name: "Apt Sale Comps", exact: true }).click();

  await expect(page.locator("#apt-sale-subject-sqft-field")).toHaveJSProperty("hidden", true);
  await expect(page.locator("#apt-sale-average-sf-card")).toHaveJSProperty("hidden", true);

  await page.locator("#apt-sale-subject-units").fill("12");
  await pressTab(page);
  await expectFocused(page, "#apt-sale-enable-sf");

  await pressTab(page);
  await expectFocused(page, '[data-apt-sale-price="0"]');

  await page.locator('[data-apt-sale-price="0"]').fill("2400000");
  await page.locator('[data-apt-sale-units="0"]').fill("12");
  await page.locator('[data-apt-sale-units="0"]').focus();
  await pressTab(page);
  await expectFocused(page, '[data-apt-sale-price="1"]');
});

test("apt sale comps show sf inputs and both summaries when $ / SF valuation is on", async ({ page }) => {
  await page.getByRole("button", { name: "Apt Sale Comps", exact: true }).click();

  await page.locator('label[for="apt-sale-enable-sf"]').click();
  await expect(page.locator("#apt-sale-subject-sqft-field")).toHaveJSProperty("hidden", false);
  await expect(page.locator("#apt-sale-average-sf-card")).toHaveJSProperty("hidden", false);

  await page.locator("#apt-sale-subject-units").fill("12");
  await pressTab(page);
  await expectFocused(page, "#apt-sale-enable-sf");

  await pressTab(page);
  await expectFocused(page, "#apt-sale-subject-sqft");

  await page.locator("#apt-sale-subject-sqft").fill("9600");
  await pressTab(page);
  await expectFocused(page, '[data-apt-sale-price="0"]');

  await pressTab(page);
  await expectFocused(page, '[data-apt-sale-units="0"]');

  await pressTab(page);
  await expectFocused(page, '[data-apt-sale-sqft="0"]');
});

test("apt rent comps tab through config inputs and visible rent samples without losing focus", async ({ page }) => {
  await page.getByRole("button", { name: "Apt Rent Comps", exact: true }).click();

  await page.locator("#apt-rent-studio").fill("2");
  await pressTab(page);
  await expectFocused(page, "#apt-rent-onebed");

  await page.locator("#apt-rent-onebed").fill("1");
  await page.locator("#apt-rent-twobed").fill("0");
  await page.locator("#apt-rent-threebed").fill("0");

  await page.locator("#apt-rent-vacancy").focus();
  await page.locator("#apt-rent-vacancy").fill("5");
  await pressTab(page);
  await expectFocused(page, "#apt-rent-expense");

  await page.locator("#apt-rent-expense").fill("20");
  await pressTab(page);
  await expectFocused(page, "#apt-rent-start-cap");

  await page.locator("#apt-rent-start-cap").fill("5.5");
  await pressTab(page);
  await expectFocused(page, '[data-apt-rent-sample="0"][data-rent-index="0"]');

  await page.locator('[data-apt-rent-sample="0"][data-rent-index="0"]').type("1500");
  await expectFocused(page, '[data-apt-rent-sample="0"][data-rent-index="0"]');

  await pressTab(page);
  await expectFocused(page, '[data-apt-rent-sample="0"][data-rent-index="1"]');
});
