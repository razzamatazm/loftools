import { test, expect } from "@playwright/test";

async function expectFocused(page, selector) {
  await expect(page.locator(selector)).toBeFocused();
}

async function pressTab(page, options) {
  await page.keyboard.press(options?.shift ? "Shift+Tab" : "Tab");
}

async function typeValue(page, selector, value) {
  await page.locator(selector).click();
  await page.locator(selector).pressSequentially(value);
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
});

test("1-4 unit flow tabs from subject sf into the first comp row", async ({ page }) => {
  await page.locator("#one-four-subject-sqft").fill("8500");
  await pressTab(page);
  await expectFocused(page, '[data-sale-price="0"]');

  await page.locator('[data-sale-price="0"]').fill("1250000");
  await pressTab(page);
  await expectFocused(page, '[data-sale-sqft="0"]');

  await page.locator('[data-sale-type="0"][data-sale-type-value="listing"]').click();
  await expect(page.locator("#one-four-listing-discount-field")).toHaveJSProperty("hidden", false);
});

test("commercial flow tabs through shared subject setup and current-rent rows", async ({ page }) => {
  await page.getByRole("button", { name: "Commercial Valuations", exact: true }).click();
  await expect(page.locator("#commercial-current-start-cap")).toHaveValue("5");

  await page.locator("#commercial-subject-sqft").fill("10000");
  await pressTab(page);
  await expectFocused(page, "#commercial-current-start-cap");

  await page.locator("#commercial-current-start-cap").fill("5.5");
  await pressTab(page);
  await expectFocused(page, "#commercial-current-additional-income");

  await page.locator("#commercial-current-additional-income").fill("1000");
  await pressTab(page);
  await expectFocused(page, "#commercial-current-vacancy");

  await page.locator("#commercial-current-vacancy").fill("5");
  await pressTab(page);
  await expectFocused(page, '[data-commercial-current-rent="0"]');

  await pressTab(page);
  await expectFocused(page, '[data-commercial-current-type="0"]');
});

test("apartment flow tabs through rent roll, market rent, and sale sections", async ({ page }) => {
  await page.getByRole("button", { name: "Apartment Valuations", exact: true }).click();
  await expect(page.locator("#apartment-current-start-cap")).toHaveValue("5");

  await pressTab(page);
  await expectFocused(page, "#apartment-current-mode-per-unit");

  await pressTab(page);
  await expectFocused(page, "#apartment-current-mode-grouped");

  await pressTab(page);
  await expectFocused(page, "#apartment-current-start-cap");

  await page.locator("#apartment-current-start-cap").fill("5.25");
  await pressTab(page);
  await expectFocused(page, "#apartment-current-vacancy");

  await page.locator("#apartment-current-vacancy").fill("5");
  await pressTab(page);
  await expectFocused(page, "#apartment-current-expense");

  await page.locator("#apartment-current-expense").fill("20");
  await pressTab(page);
  await expectFocused(page, '[data-apartment-current-type="0"]');

  await page.locator('[data-apartment-current-type="0"]').selectOption("onebed");
  await pressTab(page);
  await expectFocused(page, '[data-apartment-current-rent="0"]');

  await page.locator('[data-apartment-current-rent="0"]').fill("0");
  await expect(page.locator("#apartment-market-vacancy")).toBeVisible();
  await expect(page.locator("#apartment-sale-enable-sf")).toBeVisible();
});

test("apartment rent roll drives unit counts, vacancy fill, subject units, and exposes 4 bed", async ({ page }) => {
  await page.getByRole("button", { name: "Apartment Valuations", exact: true }).click();

  await page.locator('[data-apartment-current-type="0"]').selectOption("onebed");
  await page.locator('[data-apartment-current-rent="0"]').fill("0");

  await expect(page.locator("#apartment-mix-onebed")).toHaveText("1");
  await expect(page.locator("#apartment-sale-subject-units")).toHaveText("1");
  await expect(page.locator('[data-apartment-current-type="0"] option[value="fourbed"]')).toHaveText("4 Bed");

  await page.locator('[data-apartment-market-sample="1"][data-rent-index="0"]').fill("2100");
  await page.locator('[data-apartment-market-sample="1"][data-rent-index="1"]').fill("2200");
  await expect(page.locator("#apartment-current-fill-rows")).toContainText("1 Bed");
  await expect(page.locator("#apartment-current-fill-rows")).toContainText("$2,200");
  await expect(page.locator('#apartment-market-rows tr[data-unit-type="studio"]')).toBeHidden();
  await expect(page.locator('#apartment-market-avg-studio').locator("xpath=ancestor::article[1]")).toBeHidden();
});

test("legacy local storage normalizes into the new property pages", async ({ page }) => {
  await page.evaluate(() => {
    window.localStorage.setItem("loftools-state-v1", JSON.stringify({
      activeTab: "aptSale",
      aptSale: {
        enablePerSf: true,
        subjectSqft: "9600",
        rows: [{ price: "2400000", units: "12", sqft: "9000", include: true }],
      },
      aptRent: {
        vacancy: "5",
        expensePercent: "20",
        startCap: "5",
        rows: [
          { type: "studio", include: true, includeOutlier: false, rents: ["1200", "", "", ""] },
          { type: "onebed", include: true, includeOutlier: false, rents: ["1500", "", "", ""] },
        ],
      },
      currentRent: {
        mode: "apartment",
        startCap: "5.5",
        vacancy: "5",
        apartment: {
          expensePercent: "20",
          rows: [{ rent: "0" }, { rent: "1800" }],
        },
      },
    }));
  });
  await page.reload();

  await expect(page.getByRole("button", { name: "Apartment Valuations", exact: true })).toHaveAttribute("aria-selected", "true");
  await expect(page.locator("#apartment-sale-subject-sqft")).toHaveValue("9600");
  await expect(page.locator("#apartment-market-start-cap")).toHaveValue("5");
  await expect(page.locator("#apartment-current-start-cap")).toHaveValue("5.5");
});

test("apartment grouped mode derives average occupied rent, fill plan, hidden market types, and subject units", async ({ page }) => {
  await page.getByRole("button", { name: "Apartment Valuations", exact: true }).click();

  await page.locator("#apartment-current-mode-grouped").click();
  await page.locator('[data-apartment-grouped-type="0"]').selectOption("studio");
  await typeValue(page, '[data-apartment-grouped-total-units="0"]', "20");
  await typeValue(page, '[data-apartment-grouped-occupied-rent="0"]', "20000");
  await typeValue(page, '[data-apartment-grouped-vacant-units="0"]', "3");
  await page.locator('[data-apartment-grouped-vacant-units="0"]').blur();

  await expect(page.locator("#apartment-mix-studio")).toHaveText("20");
  await expect(page.locator("#apartment-sale-subject-units")).toHaveText("20");
  await expect(page.locator("#apartment-current-rows")).toContainText("17");
  await expect(page.locator("#apartment-current-rows")).toContainText("$1,176");

  await page.locator('[data-apartment-market-sample="0"][data-rent-index="0"]').fill("1200");
  await page.locator('[data-apartment-market-sample="0"][data-rent-index="1"]').fill("1150");

  await expect(page.locator("#apartment-current-fill-rows")).toContainText("Studio");
  await expect(page.locator("#apartment-current-fill-rows")).toContainText("3");
  await expect(page.locator("#apartment-current-fill-rows")).toContainText("$3,600");
  await expect(page.locator('#apartment-market-rows tr[data-unit-type="onebed"]')).toBeHidden();
  await expect(page.locator('#apartment-market-avg-onebed').locator("xpath=ancestor::article[1]")).toBeHidden();
});

test("apartment mode switching preserves both per-unit and grouped inputs while active mode drives results", async ({ page }) => {
  await page.getByRole("button", { name: "Apartment Valuations", exact: true }).click();

  await page.locator('[data-apartment-current-type="0"]').selectOption("onebed");
  await page.locator('[data-apartment-current-rent="0"]').fill("1800");
  await expect(page.locator("#apartment-sale-subject-units")).toHaveText("1");

  await page.locator("#apartment-current-mode-grouped").click();
  await page.locator('[data-apartment-grouped-type="0"]').selectOption("studio");
  await page.locator('[data-apartment-grouped-total-units="0"]').fill("20");
  await page.locator('[data-apartment-grouped-occupied-rent="0"]').fill("20000");
  await page.locator('[data-apartment-grouped-vacant-units="0"]').fill("3");
  await expect(page.locator("#apartment-sale-subject-units")).toHaveText("20");

  await page.locator("#apartment-current-mode-per-unit").click();
  await expect(page.locator('[data-apartment-current-type="0"]')).toHaveValue("onebed");
  await expect(page.locator('[data-apartment-current-rent="0"]')).toHaveValue("$1,800");
  await expect(page.locator("#apartment-sale-subject-units")).toHaveText("1");

  await page.locator("#apartment-current-mode-grouped").click();
  await expect(page.locator('[data-apartment-grouped-type="0"]')).toHaveValue("studio");
  await expect(page.locator('[data-apartment-grouped-total-units="0"]')).toHaveValue("20");
  await expect(page.locator('[data-apartment-grouped-vacant-units="0"]')).toHaveValue("3");
  await expect(page.locator("#apartment-sale-subject-units")).toHaveText("20");
});

test("td loi flow tabs from 1st td inputs through 2nd td inputs into blended outputs", async ({ page }) => {
  await page.getByRole("button", { name: "TD LOI", exact: true }).click();
  await expect(page.locator("#loi-first-loan-amount")).toBeVisible();

  await page.locator("#loi-first-loan-amount").fill("1000000");
  await pressTab(page);
  await expectFocused(page, "#loi-first-interest-rate");

  await page.locator("#loi-first-interest-rate").fill("1");
  await pressTab(page);
  await expectFocused(page, "#loi-first-origination-points");

  await page.locator("#loi-first-origination-points").fill("2");
  await pressTab(page);
  await expectFocused(page, "#loi-first-origination-fee");

  await pressTab(page);
  await expectFocused(page, "#loi-first-broker-points");

  await page.locator("#loi-first-broker-points").fill("1");
  await pressTab(page);
  await expectFocused(page, "#loi-first-broker-fee");

  await pressTab(page);
  await expectFocused(page, "#loi-second-loan-amount");

  await page.locator("#loi-second-loan-amount").fill("500000");
  await pressTab(page);
  await expectFocused(page, "#loi-second-interest-rate");

  await page.locator("#loi-second-interest-rate").fill("1.5");
  await pressTab(page);
  await expectFocused(page, "#loi-second-origination-points");

  await page.locator("#loi-second-origination-points").fill("1");
  await pressTab(page);
  await expectFocused(page, "#loi-second-origination-fee");

  await pressTab(page);
  await expectFocused(page, "#loi-second-broker-points");

  await page.locator("#loi-second-broker-points").fill("0.5");
  await pressTab(page);
  await expectFocused(page, "#loi-second-broker-fee");

  await pressTab(page);
  await expectFocused(page, "#loi-blended-loan-amount");
});

test("td loi calculates blended values, syncs fees, clears, and persists", async ({ page }) => {
  await page.getByRole("button", { name: "TD LOI", exact: true }).click();

  await page.locator("#loi-first-loan-amount").fill("1000000");
  await page.locator("#loi-first-interest-rate").fill("1");
  await page.locator("#loi-first-origination-points").fill("2");
  await page.locator("#loi-first-origination-points").blur();
  await expect(page.locator("#loi-first-origination-fee")).toHaveValue("$20,000");

  await page.locator("#loi-first-broker-points").fill("0.5");
  await page.locator("#loi-first-broker-points").blur();
  await expect(page.locator("#loi-first-broker-fee")).toHaveValue("$5,000");
  await page.locator("#loi-first-interest-rate").blur();

  await page.locator("#loi-second-loan-amount").fill("500000");
  await page.locator("#loi-second-interest-rate").fill("1.5");
  await page.locator("#loi-second-origination-fee").fill("10000");
  await page.locator("#loi-second-origination-fee").blur();
  await expect(page.locator("#loi-second-origination-points")).toHaveValue("2");

  await page.locator("#loi-second-broker-fee").fill("2500");
  await page.locator("#loi-second-broker-fee").blur();
  await expect(page.locator("#loi-second-broker-points")).toHaveValue("0.5");
  await page.locator("#loi-second-interest-rate").blur();

  await expect(page.locator("#loi-blended-loan-amount")).toHaveText("$1,500,000");
  await expect(page.locator("#loi-blended-origination-fee")).toHaveText("$30,000");
  await expect(page.locator("#loi-blended-origination-points")).toHaveText("2.0000%");
  await expect(page.locator("#loi-blended-interest-rate")).toHaveText("1.17%");
  await expect(page.locator("#loi-blended-monthly-payment")).toHaveText("$17,500");
  await expect(page.locator("#loi-first-monthly-payment")).toHaveText("$10,000");
  await expect(page.locator("#loi-second-monthly-payment")).toHaveText("$7,500");

  await page.reload();
  await page.getByRole("button", { name: "TD LOI", exact: true }).click();
  await expect(page.locator("#loi-first-loan-amount")).toHaveValue("$1,000,000");
  await expect(page.locator("#loi-first-interest-rate")).toHaveValue("1");
  await expect(page.locator("#loi-second-origination-fee")).toHaveValue("$10,000");
  await expect(page.locator("#loi-blended-monthly-payment")).toHaveText("$17,500");

  await page.locator("#loi-clear-btn").click();
  await expect(page.locator("#loi-first-loan-amount")).toHaveValue("");
  await expect(page.locator("#loi-blended-interest-rate")).toHaveText("-");
});
