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

async function expectSelectionToMatchValue(page, selector) {
  await expect.poll(async () => page.locator(selector).evaluate((element) => ({
    value: element.value,
    selectionStart: element.selectionStart,
    selectionEnd: element.selectionEnd,
  }))).toEqual(expect.objectContaining({
    selectionStart: 0,
    selectionEnd: await page.locator(selector).evaluate((element) => element.value.length),
  }));
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
});

test("1-4 unit flow tabs from subject sf into the first comp row", async ({ page }) => {
  await page.locator('[data-sale-price="0"]').fill("1250000");
  await pressTab(page);
  await expectFocused(page, '[data-sale-sqft="0"]');

  await page.locator('[data-sale-type="0"][data-sale-type-value="listing"]').click();
  await expect(page.locator("#one-four-listing-discount-field")).toHaveJSProperty("hidden", false);
});

test("1-4 unit comp entry tabs into the next auto-added row", async ({ page }) => {
  await page.locator('[data-sale-price="0"]').fill("1250000");
  await pressTab(page);
  await expectFocused(page, '[data-sale-sqft="0"]');

  await page.locator('[data-sale-sqft="0"]').fill("8500");
  await pressTab(page);
  await expectFocused(page, '[data-sale-price="1"]');
});

test("commercial flow tabs through shared subject setup and current-rent rows", async ({ page }) => {
  await page.getByRole("button", { name: "Commercial Valuations", exact: true }).click();
  await expect(page.locator("#commercial-current-start-cap")).toHaveValue("5");

  await page.locator("#commercial-subject-sqft").fill("10000");
  await pressTab(page);
  await expectFocused(page, "#commercial-current-start-cap");

  await page.locator("#commercial-current-start-cap").fill("5.5");
  await pressTab(page);
  await expectFocused(page, "#commercial-current-vacancy");

  await page.locator("#commercial-current-vacancy").fill("5");
  await pressTab(page);
  await expectFocused(page, '[data-commercial-current-rent="0"]');

  await pressTab(page);
  await expectFocused(page, '[data-commercial-current-sqft="0"]');

  await pressTab(page);
  await expectFocused(page, '[data-commercial-current-vacant="0"]');

  await pressTab(page);
  await expectFocused(page, '[data-commercial-current-type="0"]');
});

test("commercial current rent fills vacant rows from market comps or leaves them vacant", async ({ page }) => {
  await page.getByRole("button", { name: "Commercial Valuations", exact: true }).click();

  await typeValue(page, '[data-commercial-rent-rent="0"]', "2");
  await typeValue(page, '[data-commercial-rent-rent="1"]', "2");
  await typeValue(page, '[data-commercial-rent-rent="2"]', "2");
  await expect(page.locator("#commercial-rent-average")).toContainText("$1.80");

  await page.locator('[data-commercial-current-rent="0"]').fill("5000");
  await page.locator('[data-commercial-current-type="0"]').selectOption("nnn");
  await page.locator('[data-commercial-current-rent="1"]').fill("3000");
  await page.locator('[data-commercial-current-vacant="1"]').check();
  await page.locator('[data-commercial-current-sqft="1"]').fill("1000");

  await expect(page.locator("#commercial-current-summary-1")).toHaveText("$4,500");
  await expect(page.locator("#commercial-current-summary-2")).toHaveText("$1,800");
  await expect(page.locator("#commercial-current-summary-3")).toHaveText("$75,600");
  await expect(page.locator("#commercial-current-summary-4")).toHaveText("$75,600");

  await page.locator("#commercial-current-vacancy").fill("10");
  await page.locator("#commercial-current-vacancy").blur();
  await expect(page.locator("#commercial-current-summary-4")).toHaveText("$68,040");
  await expect(page.locator("#commercial-current-summary-6")).toHaveText("10%");

  await page.locator('[data-commercial-current-fill-method="1"]').selectOption("vacant");
  await expect(page.locator("#commercial-current-summary-2")).toHaveText("-");
  await expect(page.locator("#commercial-current-summary-3")).toHaveText("$54,000");

  await page.locator('[data-commercial-current-fill-method="1"]').selectOption("market");
  await page.locator('[data-commercial-current-sqft="1"]').fill("");
  await expect(page.locator("#commercial-current-summary-2")).toHaveText("-");
  await expect(page.locator("#commercial-current-rows")).toContainText("Needs SF");
});

test("commercial sale comp entry tabs into the next auto-added row", async ({ page }) => {
  await page.getByRole("button", { name: "Commercial Valuations", exact: true }).click();

  await typeValue(page, '[data-commercial-sale-price="0"]', "2500000");
  await typeValue(page, '[data-commercial-sale-sqft="0"]', "10000");
  await page.locator('[data-commercial-sale-sqft="0"]').press("Tab");
  await expectFocused(page, '[data-commercial-sale-price="1"]');
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

  await page.locator('[data-apartment-current-type="0"]').fill("1");
  await pressTab(page);
  await expectFocused(page, '[data-apartment-current-rent="0"]');

  await page.locator('[data-apartment-current-rent="0"]').fill("0");
  await expect(page.locator("#apartment-market-vacancy")).toBeVisible();
  await expect(page.locator("#apartment-sale-enable-sf")).toBeVisible();
});

test("apartment sale comp entry tabs into the next auto-added row", async ({ page }) => {
  await page.getByRole("button", { name: "Apartment Valuations", exact: true }).click();

  await page.locator('[data-apartment-sale-price="0"]').fill("2400000");
  await pressTab(page);
  await expectFocused(page, '[data-apartment-sale-units="0"]');

  await page.locator('[data-apartment-sale-units="0"]').fill("12");
  await pressTab(page);
  await expectFocused(page, '[data-apartment-sale-price="1"]');
});

test("apartment rent roll drives unit counts, vacancy fill, subject units, and exposes 4 bed", async ({ page }) => {
  await page.getByRole("button", { name: "Apartment Valuations", exact: true }).click();

  await page.locator('[data-apartment-current-type="0"]').fill("1");
  await page.locator('[data-apartment-current-type="0"]').blur();
  await page.locator('[data-apartment-current-rent="0"]').fill("0");

  await expect(page.locator("#apartment-mix-onebed")).toHaveText("1");
  await expect(page.locator("#apartment-sale-subject-units")).toHaveText("1");
  await expect(page.locator('#apartment-unit-type-options option[value="4 Bed"]')).toHaveCount(1);

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
  await page.locator('[data-apartment-grouped-type="0"]').fill("studio");
  await page.locator('[data-apartment-grouped-type="0"]').blur();
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

  await page.locator('[data-apartment-current-type="0"]').fill("1");
  await page.locator('[data-apartment-current-type="0"]').blur();
  await page.locator('[data-apartment-current-rent="0"]').fill("1800");
  await expect(page.locator("#apartment-sale-subject-units")).toHaveText("1");

  await page.locator("#apartment-current-mode-grouped").click();
  await page.locator('[data-apartment-grouped-type="0"]').fill("studio");
  await page.locator('[data-apartment-grouped-type="0"]').blur();
  await page.locator('[data-apartment-grouped-total-units="0"]').fill("20");
  await page.locator('[data-apartment-grouped-occupied-rent="0"]').fill("20000");
  await page.locator('[data-apartment-grouped-vacant-units="0"]').fill("3");
  await expect(page.locator("#apartment-sale-subject-units")).toHaveText("20");

  await page.locator("#apartment-current-mode-per-unit").click();
  await expect(page.locator('[data-apartment-current-type="0"]')).toHaveValue("1 Bed");
  await expect(page.locator('[data-apartment-current-rent="0"]')).toHaveValue("$1,800");
  await expect(page.locator("#apartment-sale-subject-units")).toHaveText("1");

  await page.locator("#apartment-current-mode-grouped").click();
  await expect(page.locator('[data-apartment-grouped-type="0"]')).toHaveValue("Studio");
  await expect(page.locator('[data-apartment-grouped-total-units="0"]')).toHaveValue("20");
  await expect(page.locator('[data-apartment-grouped-vacant-units="0"]')).toHaveValue("3");
  await expect(page.locator("#apartment-sale-subject-units")).toHaveText("20");
});

test("td loi flow tabs from 1st td inputs through 2nd td inputs into blended outputs", async ({ page }) => {
  await page.getByRole("button", { name: "Blended LOI Checker", exact: true }).click();
  await expect(page.locator("#loi-first-loan-amount")).toBeVisible();

  await page.locator("#loi-first-loan-amount").fill("1000000");
  await pressTab(page);
  await expectFocused(page, "#loi-first-interest-rate");

  await page.locator("#loi-first-interest-rate").fill("1");
  await pressTab(page);
  await expectFocused(page, "#loi-first-origination-points");

  await page.locator("#loi-first-origination-points").fill("2");
  await pressTab(page);
  await expectFocused(page, "#loi-first-broker-points");

  await page.locator("#loi-first-broker-points").fill("1");
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
  await expectFocused(page, "#loi-second-broker-points");

  await page.locator("#loi-second-broker-points").fill("0.5");
  await pressTab(page);
  await expectFocused(page, "#loi-blended-loan-amount");
});

test("td loi calculates blended values, syncs fees, clears, and persists", async ({ page }) => {
  await page.getByRole("button", { name: "Blended LOI Checker", exact: true }).click();

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
  await page.getByRole("button", { name: "Blended LOI Checker", exact: true }).click();
  await expect(page.locator("#loi-first-loan-amount")).toHaveValue("$1,000,000");
  await expect(page.locator("#loi-first-interest-rate")).toHaveValue("1");
  await expect(page.locator("#loi-second-origination-fee")).toHaveValue("$10,000");
  await expect(page.locator("#loi-blended-monthly-payment")).toHaveText("$17,500");

  await page.locator("#loi-clear-btn").click();
  await expect(page.locator("#loi-first-loan-amount")).toHaveValue("");
  await expect(page.locator("#loi-blended-interest-rate")).toHaveText("-");
});

test("consumer debt tab renders first question and tabs through visible choices", async ({ page }) => {
  const tab = page.getByRole("button", { name: "Consumer Debt Checker", exact: true });
  await tab.click();
  await expect(page.locator("#consumer-debt-content")).toContainText("Is title held in a pre-existing LLC");

  await tab.focus();
  await pressTab(page);
  await expectFocused(page, '[data-consumer-debt-action="entity-yes"]');

  await pressTab(page);
  await expectFocused(page, '[data-consumer-debt-action="entity-individual"]');
});

test("consumer debt supports commercial, residential personal cash-out, and persistence flows", async ({ page }) => {
  await page.getByRole("button", { name: "Consumer Debt Checker", exact: true }).click();

  await page.getByRole("button", { name: "No - Individual / Trust", exact: true }).click();
  await page.getByRole("button", { name: "Yes", exact: true }).click();
  await page.getByRole("button", { name: "No", exact: true }).click();
  await expect(page.locator("#consumer-debt-content")).toContainText("We can lend. This is a business purpose loan.");

  await page.locator("#consumer-debt-clear-btn").click();
  await expect(page.locator("#consumer-debt-content")).toContainText("Is title held in a pre-existing LLC");

  await page.getByRole("button", { name: "No - Individual / Trust", exact: true }).click();
  await page.getByRole("button", { name: "No", exact: true }).click();
  await page.getByRole("button", { name: "Yes", exact: true }).click();
  await expect(page.locator("#consumer-debt-content")).toContainText("Cash-out for personal use on 1-4 unit properties");

  await page.locator("#consumer-debt-clear-btn").click();
  await page.getByRole("button", { name: "No - New Single-Purpose Entity", exact: true }).click();
  await page.getByRole("button", { name: "No - Manager is individual / family trust", exact: true }).click();
  await page.getByRole("button", { name: "No", exact: true }).click();
  await page.reload();
  await page.getByRole("button", { name: "Consumer Debt Checker", exact: true }).click();
  await expect(page.locator("#consumer-debt-content")).toContainText("Is this loan for cash out for personal use?");

  await page.getByRole("button", { name: "Back", exact: true }).click();
  await expect(page.locator("#consumer-debt-content")).toContainText("Is this a commercial property?");
});

test("consumer debt inherited and flip branches produce expected results", async ({ page }) => {
  await page.getByRole("button", { name: "Consumer Debt Checker", exact: true }).click();

  await page.getByRole("button", { name: "No - Individual / Trust", exact: true }).click();
  await page.getByRole("button", { name: "No", exact: true }).click();
  await page.getByRole("button", { name: "No", exact: true }).click();
  await page.getByRole("button", { name: "Purchase", exact: true }).click();
  await page.getByRole("button", { name: "Yes", exact: true }).click();
  await page.getByRole("button", { name: "Yes", exact: true }).click();
  await expect(page.locator("#consumer-debt-content")).toContainText("not eligible for business purpose lending");

  await page.locator("#consumer-debt-clear-btn").click();
  await page.getByRole("button", { name: "No - Individual / Trust", exact: true }).click();
  await page.getByRole("button", { name: "No", exact: true }).click();
  await page.getByRole("button", { name: "No", exact: true }).click();
  await page.getByRole("button", { name: "Purchase", exact: true }).click();
  await page.getByRole("button", { name: "Yes", exact: true }).click();
  await page.getByRole("button", { name: "No", exact: true }).click();
  await page.getByRole("button", { name: "Yes", exact: true }).click();
  await expect(page.locator("#consumer-debt-content")).toContainText("The property has always been a rental or investment");

  await page.locator("#consumer-debt-clear-btn").click();
  await page.getByRole("button", { name: "No - Individual / Trust", exact: true }).click();
  await page.getByRole("button", { name: "No", exact: true }).click();
  await page.getByRole("button", { name: "No", exact: true }).click();
  await page.getByRole("button", { name: "Purchase", exact: true }).click();
  await page.getByRole("button", { name: "No", exact: true }).click();
  await page.getByRole("button", { name: "SFR", exact: true }).click();
  await page.getByRole("button", { name: "No", exact: true }).click();
  await page.getByRole("button", { name: "Flip", exact: true }).click();
  await page.getByRole("button", { name: "Yes", exact: true }).click();
  await expect(page.locator("#consumer-debt-content")).toContainText("active flipper");

  await page.locator("#consumer-debt-clear-btn").click();
  await page.getByRole("button", { name: "No - Individual / Trust", exact: true }).click();
  await page.getByRole("button", { name: "No", exact: true }).click();
  await page.getByRole("button", { name: "No", exact: true }).click();
  await page.getByRole("button", { name: "Purchase", exact: true }).click();
  await page.getByRole("button", { name: "No", exact: true }).click();
  await page.getByRole("button", { name: "SFR", exact: true }).click();
  await page.getByRole("button", { name: "No", exact: true }).click();
  await page.getByRole("button", { name: "Flip", exact: true }).click();
  await page.getByRole("button", { name: "No", exact: true }).click();
  await expect(page.locator("#consumer-debt-content")).toContainText("first flip ever");
});

test("loan docs populated text inputs and textareas auto-select on keyboard focus and click", async ({ page }) => {
  await page.getByRole("button", { name: "Loan Doc Manual", exact: true }).click();
  await page.getByRole("button", { name: /Reverse 1031/i }).click();

  await page.locator("#loan-doc-field-actual_borrower").fill("Acme Borrower LLC");
  await page.locator("#loan-doc-field-non_recourse_text").fill("Sample non-recourse verbiage.");

  await page.locator("#loan-doc-field-actual_borrower").click();
  await expectSelectionToMatchValue(page, "#loan-doc-field-actual_borrower");

  await page.locator("#loan-docs-search").fill("Reverse 1031");
  await page.locator("#loan-docs-search").focus();
  await page.locator("#loan-docs-search").press("Tab");
  await expectFocused(page, '[data-loan-doc-scenario="reverse-1031"]');

  await pressTab(page);
  await expectFocused(page, "#loan-doc-field-actual_borrower");
  await expectSelectionToMatchValue(page, "#loan-doc-field-actual_borrower");

  await page.locator("#loan-doc-field-actual_borrower").press("Tab");
  await page.locator("#loan-doc-field-actual_borrower_address").press("Tab");
  await page.locator("#loan-doc-field-include_transfer_clause").press("Tab");
  await expectFocused(page, "#loan-doc-field-non_recourse_text");
  await expectSelectionToMatchValue(page, "#loan-doc-field-non_recourse_text");
});
