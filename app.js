const STORAGE_KEY = "loftools-state-v1";
const leaseCapStep = 0.5;
const leaseCapCount = 5;
const aptRentTypeOptions = [
  { value: "studio", label: "Studio" },
  { value: "onebed", label: "1 Bed" },
  { value: "twobed", label: "2 Bed" },
  { value: "threebed", label: "3 Bed" },
  { value: "fourbed", label: "4 Bed" },
];
const leaseExpenseRates = {
  nnn: 0.1,
  modified: 0.2,
  gross: 0.25,
};

const state = loadState();

const elements = {
  tabs: Array.from(document.querySelectorAll(".tab")),
  panels: Array.from(document.querySelectorAll(".panel")),
  oneToFour: {
    subjectSqft: document.getElementById("one-four-subject-sqft"),
    listingDiscountField: document.getElementById("one-four-listing-discount-field"),
    listingDiscount: document.getElementById("one-four-listing-discount"),
    rows: document.getElementById("one-four-sale-rows"),
    averagePsf: document.getElementById("one-four-average-psf"),
    indicatedValue: document.getElementById("one-four-indicated-value"),
    copyBtn: document.getElementById("one-four-copy-btn"),
    clearBtn: document.getElementById("one-four-clear-btn"),
    addRowBtn: document.getElementById("one-four-add-row"),
  },
  commercial: {
    subjectSqft: document.getElementById("commercial-subject-sqft"),
    rent: {
      vacancy: document.getElementById("commercial-rent-vacancy"),
      startCap: document.getElementById("commercial-rent-start-cap"),
      rows: document.getElementById("commercial-rent-rows"),
      average: document.getElementById("commercial-rent-average"),
      monthlyNoi: document.getElementById("commercial-rent-monthly-noi"),
      annualNoi: document.getElementById("commercial-rent-annual-noi"),
      noiAfterVacancy: document.getElementById("commercial-rent-noi-after-vacancy"),
      capResults: document.getElementById("commercial-rent-cap-results"),
      copyBtn: document.getElementById("commercial-rent-copy-btn"),
      clearBtn: document.getElementById("commercial-rent-clear-btn"),
    },
    sale: {
      listingDiscountField: document.getElementById("commercial-sale-listing-discount-field"),
      listingDiscount: document.getElementById("commercial-sale-listing-discount"),
      rows: document.getElementById("commercial-sale-rows"),
      averagePsf: document.getElementById("commercial-sale-average-psf"),
      indicatedValue: document.getElementById("commercial-sale-indicated-value"),
      copyBtn: document.getElementById("commercial-sale-copy-btn"),
      clearBtn: document.getElementById("commercial-sale-clear-btn"),
      addRowBtn: document.getElementById("commercial-sale-add-row"),
    },
    current: {
      startCap: document.getElementById("commercial-current-start-cap"),
      additionalIncome: document.getElementById("commercial-current-additional-income"),
      vacancy: document.getElementById("commercial-current-vacancy"),
      rows: document.getElementById("commercial-current-rows"),
      summary1: document.getElementById("commercial-current-summary-1"),
      summary2: document.getElementById("commercial-current-summary-2"),
      summary3: document.getElementById("commercial-current-summary-3"),
      summary4: document.getElementById("commercial-current-summary-4"),
      summary5: document.getElementById("commercial-current-summary-5"),
      summary6: document.getElementById("commercial-current-summary-6"),
      capResults: document.getElementById("commercial-current-cap-results"),
      copyBtn: document.getElementById("commercial-current-copy-btn"),
      clearBtn: document.getElementById("commercial-current-clear-btn"),
    },
  },
  apartment: {
    current: {
      modePerUnit: document.getElementById("apartment-current-mode-per-unit"),
      modeGrouped: document.getElementById("apartment-current-mode-grouped"),
      startCap: document.getElementById("apartment-current-start-cap"),
      vacancy: document.getElementById("apartment-current-vacancy"),
      expense: document.getElementById("apartment-current-expense"),
      head: document.getElementById("apartment-current-head"),
      rows: document.getElementById("apartment-current-rows"),
      hint: document.getElementById("apartment-current-hint"),
      fillRows: document.getElementById("apartment-current-fill-rows"),
      fillTotal: document.getElementById("apartment-current-fill-total"),
      summary1: document.getElementById("apartment-current-summary-1"),
      summary2: document.getElementById("apartment-current-summary-2"),
      summary3: document.getElementById("apartment-current-summary-3"),
      summary4: document.getElementById("apartment-current-summary-4"),
      summary5: document.getElementById("apartment-current-summary-5"),
      summary6: document.getElementById("apartment-current-summary-6"),
      summary7: document.getElementById("apartment-current-summary-7"),
      capResults: document.getElementById("apartment-current-cap-results"),
      copyBtn: document.getElementById("apartment-current-copy-btn"),
      clearBtn: document.getElementById("apartment-current-clear-btn"),
    },
    market: {
      vacancy: document.getElementById("apartment-market-vacancy"),
      expense: document.getElementById("apartment-market-expense"),
      startCap: document.getElementById("apartment-market-start-cap"),
      rows: document.getElementById("apartment-market-rows"),
      mix: {
        studio: document.getElementById("apartment-mix-studio"),
        onebed: document.getElementById("apartment-mix-onebed"),
        twobed: document.getElementById("apartment-mix-twobed"),
        threebed: document.getElementById("apartment-mix-threebed"),
        fourbed: document.getElementById("apartment-mix-fourbed"),
      },
      averages: {
        studio: document.getElementById("apartment-market-avg-studio"),
        onebed: document.getElementById("apartment-market-avg-onebed"),
        twobed: document.getElementById("apartment-market-avg-twobed"),
        threebed: document.getElementById("apartment-market-avg-threebed"),
        fourbed: document.getElementById("apartment-market-avg-fourbed"),
      },
      annualGross: document.getElementById("apartment-market-annual-gross"),
      effectiveGross: document.getElementById("apartment-market-effective-gross"),
      annualNoi: document.getElementById("apartment-market-annual-noi"),
      startCapValue: document.getElementById("apartment-market-start-cap-value"),
      capResults: document.getElementById("apartment-market-cap-results"),
      copyBtn: document.getElementById("apartment-market-copy-btn"),
      clearBtn: document.getElementById("apartment-market-clear-btn"),
    },
    sale: {
      enableSf: document.getElementById("apartment-sale-enable-sf"),
      subjectUnits: document.getElementById("apartment-sale-subject-units"),
      subjectSqft: document.getElementById("apartment-sale-subject-sqft"),
      subjectSqftField: document.getElementById("apartment-sale-subject-sqft-field"),
      sfHeading: document.getElementById("apartment-sale-sf-heading"),
      psfHeading: document.getElementById("apartment-sale-psf-heading"),
      rows: document.getElementById("apartment-sale-rows"),
      summaryGrid: document.getElementById("apartment-sale-summary-grid"),
      averageUnit: document.getElementById("apartment-sale-average-unit"),
      indicatedUnit: document.getElementById("apartment-sale-indicated-unit"),
      averageSfCard: document.getElementById("apartment-sale-average-sf-card"),
      averageSf: document.getElementById("apartment-sale-average-sf"),
      indicatedSfCard: document.getElementById("apartment-sale-indicated-sf-card"),
      indicatedSf: document.getElementById("apartment-sale-indicated-sf"),
      copyBtn: document.getElementById("apartment-sale-copy-btn"),
      clearBtn: document.getElementById("apartment-sale-clear-btn"),
      addRowBtn: document.getElementById("apartment-sale-add-row"),
    },
  },
};

const derived = {
  oneToFourSaleCopy: null,
  commercialSaleCopy: null,
  commercialRentCopy: null,
  commercialCurrentCopy: null,
  apartmentMarketCopy: null,
  apartmentSaleCopy: null,
  apartmentCurrentCopy: null,
};
let pendingFocusToken = null;
let pendingFocusTimer = null;
let shouldSelectFocusedField = false;
let pendingClickSelectToken = null;

bindStaticEvents();
renderAll();

function loadState() {
  const fallback = createDefaultState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return normalizeState(parsed);
  } catch (error) {
    return fallback;
  }
}

function createDefaultState() {
  return {
    activeTab: "oneToFour",
    oneToFour: {
      sale: createSaleSectionDefaults(),
    },
    commercial: {
      subjectSqft: "",
      rent: {
        vacancy: "5",
        startCap: "5",
        selectedCapRate: null,
        rows: [createLeaseRow()],
      },
      sale: createSaleSectionDefaults(),
      current: {
        startCap: "5",
        additionalIncome: "",
        vacancy: "",
        selectedCapRate: null,
        rows: [createCurrentRentCommercialRow()],
      },
    },
    apartment: {
      current: {
        rentRollMode: "perUnit",
        startCap: "5",
        vacancy: "",
        expensePercent: "30",
        selectedCapRate: null,
        rows: [createApartmentRentRollRow()],
        groupedRows: [createApartmentGroupedRentRollRow()],
      },
      market: {
        vacancy: "5",
        expensePercent: "30",
        startCap: "5",
        selectedCapRate: null,
        rows: aptRentTypeOptions.map((type) => createAptRentRow(type.value)),
      },
      sale: {
        enablePerSf: false,
        subjectSqft: "",
        rows: [createAptSaleRow()],
      },
    },
  };
}

function createSaleSectionDefaults() {
  return {
    subjectSqft: "",
    listingDiscount: "0",
    rows: [createSaleRow()],
  };
}

function normalizeState(input) {
  const fallback = createDefaultState();
  if (input?.oneToFour && input?.commercial && input?.apartment) {
    return normalizeNewShape(input, fallback);
  }
  return normalizeLegacyShape(input, fallback);
}

function normalizeNewShape(input, fallback) {
  return {
    activeTab: normalizeActiveTab(input?.activeTab, fallback.activeTab),
    oneToFour: {
      sale: normalizeSaleSection(input?.oneToFour?.sale, fallback.oneToFour.sale),
    },
    commercial: {
      subjectSqft: String(input?.commercial?.subjectSqft || ""),
      rent: normalizeCommercialRent(input?.commercial?.rent, fallback.commercial.rent),
      sale: normalizeSaleSection(input?.commercial?.sale, fallback.commercial.sale),
      current: normalizeCommercialCurrent(input?.commercial?.current, fallback.commercial.current),
    },
    apartment: {
      current: normalizeApartmentCurrent(input?.apartment?.current, fallback.apartment.current),
      market: normalizeApartmentMarket(input?.apartment?.market, fallback.apartment.market),
      sale: normalizeApartmentSale(input?.apartment?.sale, fallback.apartment.sale),
    },
  };
}

function normalizeLegacyShape(input, fallback) {
  const commercialSale = normalizeSaleSection({
    subjectSqft: input?.sale?.subjectSqft || "",
    listingDiscount: input?.sale?.listingDiscount || fallback.commercial.sale.listingDiscount,
    rows: Array.isArray(input?.sale?.rows) ? input.sale.rows : fallback.commercial.sale.rows,
  }, fallback.commercial.sale);

  return {
    activeTab: normalizeLegacyActiveTab(input?.activeTab),
    oneToFour: {
      sale: normalizeSaleSection({
        subjectSqft: commercialSale.subjectSqft,
        listingDiscount: commercialSale.listingDiscount,
        rows: commercialSale.rows,
      }, fallback.oneToFour.sale),
    },
    commercial: {
      subjectSqft: String(input?.lease?.sqft || input?.sale?.subjectSqft || ""),
      rent: normalizeCommercialRent({
        vacancy: input?.lease?.vacancy,
        startCap: input?.lease?.startCap,
        selectedCapRate: input?.lease?.selectedCapRate,
        rows: input?.lease?.rows,
      }, fallback.commercial.rent),
      sale: commercialSale,
      current: normalizeCommercialCurrent({
        startCap: input?.currentRent?.mode === "commercial" ? input?.currentRent?.startCap : "",
        additionalIncome: input?.currentRent?.mode === "commercial" ? input?.currentRent?.additionalIncome : "",
        vacancy: input?.currentRent?.mode === "commercial" ? input?.currentRent?.vacancy : "",
        selectedCapRate: input?.currentRent?.mode === "commercial" ? input?.currentRent?.selectedCapRate : null,
        rows: input?.currentRent?.mode === "commercial" ? input?.currentRent?.commercial?.rows : null,
      }, fallback.commercial.current),
    },
    apartment: {
      current: normalizeApartmentCurrent({
        startCap: input?.currentRent?.mode === "apartment" ? input?.currentRent?.startCap : "",
        vacancy: input?.currentRent?.mode === "apartment" ? input?.currentRent?.vacancy : "",
        expensePercent: input?.currentRent?.apartment?.expensePercent,
        selectedCapRate: input?.currentRent?.mode === "apartment" ? input?.currentRent?.selectedCapRate : null,
        rows: input?.currentRent?.apartment?.rows,
      }, fallback.apartment.current),
      market: normalizeApartmentMarket(input?.aptRent, fallback.apartment.market),
      sale: normalizeApartmentSale(input?.aptSale, fallback.apartment.sale),
    },
  };
}

function normalizeActiveTab(activeTab, fallback) {
  if (["oneToFour", "commercial", "apartment"].includes(activeTab)) return activeTab;
  return fallback;
}

function normalizeLegacyActiveTab(activeTab) {
  if (activeTab === "sale") return "oneToFour";
  if (activeTab === "rent" || activeTab === "lease" || activeTab === "currentRent") return "commercial";
  if (activeTab === "aptSale" || activeTab === "aptRent") return "apartment";
  return "oneToFour";
}

function normalizeSaleSection(input, fallback) {
  return {
    subjectSqft: String(input?.subjectSqft || ""),
    listingDiscount: String(input?.listingDiscount || fallback.listingDiscount),
    rows: Array.isArray(input?.rows) && input.rows.length
      ? input.rows.map((row) => ({
          sqft: String(row?.sqft || ""),
          price: String(row?.price || ""),
          psf: String(row?.psf || ""),
          listing: row?.listing === true,
          include: row?.include !== false,
          userTouched: row?.userTouched === true,
        }))
      : fallback.rows,
  };
}

function normalizeCommercialRent(input, fallback) {
  return {
    vacancy: String(input?.vacancy || fallback.vacancy),
    startCap: String(input?.startCap ?? fallback.startCap),
    selectedCapRate: Number.isFinite(input?.selectedCapRate) ? input.selectedCapRate : null,
    rows: Array.isArray(input?.rows) && input.rows.length
      ? input.rows.map((row) => ({
          rent: String(row?.rent || ""),
          leaseType: ["nnn", "modified", "gross"].includes(row?.leaseType) ? row.leaseType : "nnn",
          include: row?.include !== false,
          userTouched: row?.userTouched === true,
        }))
      : fallback.rows,
  };
}

function normalizeCommercialCurrent(input, fallback) {
  return {
    startCap: String(input?.startCap ?? fallback.startCap),
    additionalIncome: String(input?.additionalIncome || ""),
    vacancy: String(input?.vacancy || ""),
    selectedCapRate: Number.isFinite(input?.selectedCapRate) ? input.selectedCapRate : null,
    rows: Array.isArray(input?.rows) && input.rows.length
      ? input.rows.map((row) => ({
          rent: String(row?.rent || ""),
          leaseType: ["nnn", "modified", "gross"].includes(row?.leaseType) ? row.leaseType : "nnn",
        }))
      : fallback.rows,
  };
}

function normalizeApartmentCurrent(input, fallback) {
  return {
    rentRollMode: input?.rentRollMode === "grouped" ? "grouped" : "perUnit",
    startCap: String(input?.startCap ?? fallback.startCap),
    vacancy: String(input?.vacancy || ""),
    expensePercent: String(input?.expensePercent || fallback.expensePercent),
    selectedCapRate: Number.isFinite(input?.selectedCapRate) ? input.selectedCapRate : null,
    rows: Array.isArray(input?.rows) && input.rows.length
      ? input.rows.map((row) => ({
          type: aptRentTypeOptions.some((type) => type.value === row?.type) ? row.type : "",
          rent: String(row?.rent || ""),
          isVacant: row?.isVacant === true || (row?.isVacant == null && parseLooseNumber(row?.rent || "") === 0),
          fillMethod: row?.fillMethod === "fixed" ? "fixed" : "market",
        }))
      : fallback.rows,
    groupedRows: Array.isArray(input?.groupedRows) && input.groupedRows.length
      ? input.groupedRows.map((row) => ({
          type: aptRentTypeOptions.some((type) => type.value === row?.type) ? row.type : "",
          totalUnits: String(row?.totalUnits || ""),
          occupiedRent: String(row?.occupiedRent || ""),
          vacantUnits: String(row?.vacantUnits || ""),
          fillMethod: row?.fillMethod === "fixed" ? "fixed" : "market",
        }))
      : fallback.groupedRows,
  };
}

function normalizeApartmentMarket(input, fallback) {
  return {
    vacancy: String(input?.vacancy || fallback.vacancy),
    expensePercent: String(input?.expensePercent || fallback.expensePercent),
    startCap: String(input?.startCap ?? fallback.startCap),
    selectedCapRate: Number.isFinite(input?.selectedCapRate) ? input.selectedCapRate : null,
    rows: Array.isArray(input?.rows) && input.rows.length
      ? aptRentTypeOptions.map((type) => {
          const match = input.rows.find((row) => row?.type === type.value);
          return {
            type: type.value,
            include: match?.include !== false,
            userTouched: match?.userTouched === true,
            includeOutlier: match?.includeOutlier === true,
            rents: Array.isArray(match?.rents)
              ? [0, 1, 2, 3].map((index) => String(match.rents[index] || ""))
              : ["", "", "", ""],
          };
        })
      : fallback.rows,
  };
}

function normalizeApartmentSale(input, fallback) {
  return {
    enablePerSf: input?.enablePerSf === true || input?.method === "perSf",
    subjectSqft: String(input?.subjectSqft || ""),
    rows: Array.isArray(input?.rows) && input.rows.length
      ? input.rows.map((row) => ({
          price: String(row?.price || ""),
          units: String(row?.units || ""),
          sqft: String(row?.sqft || ""),
          include: row?.include !== false,
          userTouched: row?.userTouched === true,
        }))
      : fallback.rows,
  };
}

function createLeaseRow() {
  return { rent: "", leaseType: "nnn", include: true, userTouched: false };
}

function createSaleRow() {
  return { sqft: "", price: "", psf: "", listing: false, include: true, userTouched: false };
}

function createAptSaleRow() {
  return { price: "", units: "", sqft: "", include: true, userTouched: false };
}

function createAptRentRow(type) {
  return { type, include: true, userTouched: false, includeOutlier: false, rents: ["", "", "", ""] };
}

function createCurrentRentCommercialRow() {
  return { rent: "", leaseType: "nnn" };
}

function createApartmentRentRollRow() {
  return { type: "", rent: "", isVacant: false, fillMethod: "market" };
}

function createApartmentGroupedRentRollRow() {
  return { type: "", totalUnits: "", occupiedRent: "", vacantUnits: "", fillMethod: "market" };
}

function bindStaticEvents() {
  document.addEventListener("keydown", (event) => {
    shouldSelectFocusedField = event.key === "Tab";
  });
  document.addEventListener("mousedown", (event) => {
    shouldSelectFocusedField = false;
    pendingClickSelectToken = getElementFocusToken(event.target);
  });
  document.addEventListener("focusin", (event) => {
    if (shouldSelectFocusedField) {
      shouldSelectFocusedField = false;
      selectFocusedFieldContents(event.target);
    }
  });
  document.addEventListener("mouseup", (event) => {
    const token = getElementFocusToken(event.target);
    if (!token || token !== pendingClickSelectToken) return;
    pendingClickSelectToken = null;
    if (document.activeElement !== event.target) return;
    selectFocusedFieldContents(event.target);
  });

  elements.tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      state.activeTab = tab.dataset.tab;
      renderAll();
    });
  });

  bindInput(elements.oneToFour.subjectSqft, (value) => {
    state.oneToFour.sale.subjectSqft = value;
    renderOneToFour();
  });
  bindInput(elements.oneToFour.listingDiscount, (value) => {
    state.oneToFour.sale.listingDiscount = value;
    renderOneToFour();
  });
  bindBlurFormatWhole(elements.oneToFour.subjectSqft, () => {
    state.oneToFour.sale.subjectSqft = formatWholeInput(state.oneToFour.sale.subjectSqft);
    renderOneToFour();
  });
  elements.oneToFour.listingDiscount?.addEventListener("blur", () => {
    state.oneToFour.sale.listingDiscount = formatPercentInput(state.oneToFour.sale.listingDiscount, 100);
    renderOneToFour();
  });
  elements.oneToFour.addRowBtn?.addEventListener("click", () => {
    state.oneToFour.sale.rows.push(createSaleRow());
    renderOneToFour();
  });
  elements.oneToFour.copyBtn?.addEventListener("click", () => copyAmount(derived.oneToFourSaleCopy, elements.oneToFour.copyBtn));
  elements.oneToFour.clearBtn?.addEventListener("click", () => clearPageSection("oneToFourSale", elements.oneToFour.clearBtn));

  bindInput(elements.commercial.subjectSqft, (value) => {
    state.commercial.subjectSqft = value;
    renderCommercial();
  });
  bindBlurFormatWhole(elements.commercial.subjectSqft, () => {
    state.commercial.subjectSqft = formatWholeInput(state.commercial.subjectSqft);
    renderCommercial();
  });

  bindInput(elements.commercial.rent.vacancy, (value) => {
    state.commercial.rent.vacancy = value;
    renderCommercial();
  });
  bindInput(elements.commercial.rent.startCap, (value) => {
    state.commercial.rent.startCap = value;
    renderCommercial();
  });
  elements.commercial.rent.vacancy?.addEventListener("blur", () => {
    state.commercial.rent.vacancy = formatPercentInput(state.commercial.rent.vacancy, 100);
    renderCommercial();
  });
  bindBlurCap(elements.commercial.rent.startCap, () => {
    state.commercial.rent.startCap = formatCapInput(state.commercial.rent.startCap);
    renderCommercial();
  });
  elements.commercial.rent.copyBtn?.addEventListener("click", () => copyAmount(derived.commercialRentCopy, elements.commercial.rent.copyBtn));
  elements.commercial.rent.clearBtn?.addEventListener("click", () => clearPageSection("commercialRent", elements.commercial.rent.clearBtn));

  bindInput(elements.commercial.sale.listingDiscount, (value) => {
    state.commercial.sale.listingDiscount = value;
    renderCommercial();
  });
  elements.commercial.sale.listingDiscount?.addEventListener("blur", () => {
    state.commercial.sale.listingDiscount = formatPercentInput(state.commercial.sale.listingDiscount, 100);
    renderCommercial();
  });
  elements.commercial.sale.addRowBtn?.addEventListener("click", () => {
    state.commercial.sale.rows.push(createSaleRow());
    renderCommercial();
  });
  elements.commercial.sale.copyBtn?.addEventListener("click", () => copyAmount(derived.commercialSaleCopy, elements.commercial.sale.copyBtn));
  elements.commercial.sale.clearBtn?.addEventListener("click", () => clearPageSection("commercialSale", elements.commercial.sale.clearBtn));

  bindInput(elements.commercial.current.startCap, (value) => {
    state.commercial.current.startCap = value;
    renderCommercial();
  });
  bindInput(elements.commercial.current.additionalIncome, (value) => {
    state.commercial.current.additionalIncome = value;
    renderCommercial();
  });
  bindInput(elements.commercial.current.vacancy, (value) => {
    state.commercial.current.vacancy = value;
    renderCommercial();
  });
  bindBlurCap(elements.commercial.current.startCap, () => {
    state.commercial.current.startCap = formatCapInput(state.commercial.current.startCap);
    renderCommercial();
  });
  elements.commercial.current.additionalIncome?.addEventListener("blur", () => {
    state.commercial.current.additionalIncome = formatMoneyInput(state.commercial.current.additionalIncome, 0);
    renderCommercial();
  });
  elements.commercial.current.vacancy?.addEventListener("blur", () => {
    state.commercial.current.vacancy = formatPercentInput(state.commercial.current.vacancy, 100);
    renderCommercial();
  });
  elements.commercial.current.copyBtn?.addEventListener("click", () => copyAmount(derived.commercialCurrentCopy, elements.commercial.current.copyBtn));
  elements.commercial.current.clearBtn?.addEventListener("click", () => clearPageSection("commercialCurrent", elements.commercial.current.clearBtn));

  bindInput(elements.apartment.current.startCap, (value) => {
    state.apartment.current.startCap = value;
    renderApartment();
  });
  [elements.apartment.current.modePerUnit, elements.apartment.current.modeGrouped].forEach((button) => {
    button?.addEventListener("click", () => {
      const nextMode = button.dataset.apartmentRollMode;
      if (!["perUnit", "grouped"].includes(nextMode) || state.apartment.current.rentRollMode === nextMode) return;
      state.apartment.current.rentRollMode = nextMode;
      renderApartment();
    });
  });
  bindInput(elements.apartment.current.vacancy, (value) => {
    state.apartment.current.vacancy = value;
    renderApartment();
  });
  bindInput(elements.apartment.current.expense, (value) => {
    state.apartment.current.expensePercent = value;
    renderApartment();
  });
  bindBlurCap(elements.apartment.current.startCap, () => {
    state.apartment.current.startCap = formatCapInput(state.apartment.current.startCap);
    renderApartment();
  });
  elements.apartment.current.vacancy?.addEventListener("blur", () => {
    state.apartment.current.vacancy = formatPercentInput(state.apartment.current.vacancy, 100);
    renderApartment();
  });
  elements.apartment.current.expense?.addEventListener("blur", () => {
    state.apartment.current.expensePercent = formatPercentInput(state.apartment.current.expensePercent, 100);
    renderApartment();
  });
  elements.apartment.current.copyBtn?.addEventListener("click", () => copyAmount(derived.apartmentCurrentCopy, elements.apartment.current.copyBtn));
  elements.apartment.current.clearBtn?.addEventListener("click", () => clearPageSection("apartmentCurrent", elements.apartment.current.clearBtn));

  bindInput(elements.apartment.market.vacancy, (value) => {
    state.apartment.market.vacancy = value;
    renderApartment();
  });
  bindInput(elements.apartment.market.expense, (value) => {
    state.apartment.market.expensePercent = value;
    renderApartment();
  });
  bindInput(elements.apartment.market.startCap, (value) => {
    state.apartment.market.startCap = value;
    renderApartment();
  });
  elements.apartment.market.vacancy?.addEventListener("blur", () => {
    state.apartment.market.vacancy = formatPercentInput(state.apartment.market.vacancy, 100);
    renderApartment();
  });
  elements.apartment.market.expense?.addEventListener("blur", () => {
    state.apartment.market.expensePercent = formatPercentInput(state.apartment.market.expensePercent, 100);
    renderApartment();
  });
  bindBlurCap(elements.apartment.market.startCap, () => {
    state.apartment.market.startCap = formatCapInput(state.apartment.market.startCap);
    renderApartment();
  });
  elements.apartment.market.copyBtn?.addEventListener("click", () => copyAmount(derived.apartmentMarketCopy, elements.apartment.market.copyBtn));
  elements.apartment.market.clearBtn?.addEventListener("click", () => clearPageSection("apartmentMarket", elements.apartment.market.clearBtn));

  elements.apartment.sale.enableSf?.addEventListener("change", () => {
    state.apartment.sale.enablePerSf = elements.apartment.sale.enableSf.checked;
    renderApartment();
  });
  bindInput(elements.apartment.sale.subjectSqft, (value) => {
    state.apartment.sale.subjectSqft = value;
    renderApartment();
  });
  bindBlurFormatWhole(elements.apartment.sale.subjectSqft, () => {
    state.apartment.sale.subjectSqft = formatWholeInput(state.apartment.sale.subjectSqft);
    renderApartment();
  });
  elements.apartment.sale.addRowBtn?.addEventListener("click", () => {
    state.apartment.sale.rows.push(createAptSaleRow());
    renderApartment();
  });
  elements.apartment.sale.copyBtn?.addEventListener("click", () => copyAmount(derived.apartmentSaleCopy, elements.apartment.sale.copyBtn));
  elements.apartment.sale.clearBtn?.addEventListener("click", () => clearPageSection("apartmentSale", elements.apartment.sale.clearBtn));

  bindCopyValueTrigger(elements.oneToFour.indicatedValue, () => derived.oneToFourSaleCopy, elements.oneToFour.copyBtn);
  bindCopyValueTrigger(elements.commercial.sale.indicatedValue, () => derived.commercialSaleCopy, elements.commercial.sale.copyBtn);
  bindCopyValueTrigger(elements.apartment.sale.indicatedUnit, () => calculateApartmentSale(getApartmentUnitMix()).indicatedPerUnit, elements.apartment.sale.copyBtn);
  bindCopyValueTrigger(elements.apartment.sale.indicatedSf, () => calculateApartmentSale(getApartmentUnitMix()).indicatedPerSf, elements.apartment.sale.copyBtn);
}

function bindInput(element, handler) {
  if (!element) return;
  element.addEventListener("input", (event) => handler(event.target.value));
  element.addEventListener("change", (event) => handler(event.target.value));
}

function bindBlurFormatWhole(element, handler) {
  if (!element) return;
  element.addEventListener("blur", handler);
}

function bindBlurCap(element, handler) {
  if (!element) return;
  element.addEventListener("blur", handler);
}

function selectFocusedFieldContents(target) {
  if (!isSelectableField(target)) return;
  window.requestAnimationFrame(() => {
    if (document.activeElement !== target || typeof target.select !== "function") return;
    target.select();
  });
}

function isSelectableField(target) {
  if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) return false;
  if (target.readOnly || target.disabled) return false;
  return ["text", "search", "tel", "url", "email", "password"].includes(target.type);
}

function setControlValue(element, value) {
  if (!element) return;
  if (document.activeElement === element) return;
  if ("value" in element) element.value = value;
  else element.textContent = value;
}

function captureActiveInputState(container) {
  if (!container) return null;
  const active = document.activeElement;
  if (!(active instanceof HTMLElement) || !container.contains(active)) return null;
  const focusKey = active.dataset.focusKey;
  if (!focusKey) return null;
  return {
    key: focusKey,
    selectionStart: typeof active.selectionStart === "number" ? active.selectionStart : null,
    selectionEnd: typeof active.selectionEnd === "number" ? active.selectionEnd : null,
  };
}

function restoreActiveInputState(container, focusState) {
  if (!container || !focusState?.key) return;
  const next = container.querySelector(`[data-focus-key="${focusState.key}"]`);
  if (!(next instanceof HTMLElement)) return;
  next.focus();
  if (typeof next.setSelectionRange === "function" && typeof focusState.selectionStart === "number" && typeof focusState.selectionEnd === "number") {
    next.setSelectionRange(focusState.selectionStart, focusState.selectionEnd);
  }
}

function getElementFocusToken(element) {
  if (!(element instanceof HTMLElement)) return null;
  if (element.dataset.focusKey) return `focus:${element.dataset.focusKey}`;
  if (element.id) return `id:${element.id}`;
  return null;
}

function focusElementByToken(token) {
  if (!token) return false;
  let next = null;
  if (token.startsWith("focus:")) next = document.querySelector(`[data-focus-key="${token.slice(6)}"]`);
  if (token.startsWith("id:")) next = document.getElementById(token.slice(3));
  if (!(next instanceof HTMLElement) || next.offsetParent === null) return false;
  next.focus();
  shouldSelectFocusedField = false;
  selectFocusedFieldContents(next);
  return true;
}

function queuePendingFocus(token) {
  pendingFocusToken = token;
  window.clearTimeout(pendingFocusTimer);
  pendingFocusTimer = window.setTimeout(() => {
    const target = pendingFocusToken;
    pendingFocusToken = null;
    if (target) focusElementByToken(target);
  }, 0);
}

function consumePendingFocus() {
  if (!pendingFocusToken) return false;
  const target = pendingFocusToken;
  pendingFocusToken = null;
  window.clearTimeout(pendingFocusTimer);
  return focusElementByToken(target);
}

function bindTabSequence(sequence) {
  const items = sequence.filter((element) => {
    if (!(element instanceof HTMLElement) || element.offsetParent === null) return false;
    if ("disabled" in element && element.disabled) return false;
    if ("readOnly" in element && element.readOnly) return false;
    return true;
  });
  items.forEach((element, index) => {
    element.onkeydown = (event) => {
      if (event.key !== "Tab") return;
      const nextIndex = event.shiftKey ? index - 1 : index + 1;
      if (nextIndex < 0 || nextIndex >= items.length) return;
      const token = getElementFocusToken(items[nextIndex]);
      if (!token) return;
      event.preventDefault();
      queuePendingFocus(token);
      focusElementByToken(token);
    };
  });
}

function bindTabFlows() {
  bindTabSequence([
    ...elements.tabs,
    elements.oneToFour.subjectSqft,
    ...(elements.oneToFour.listingDiscountField?.hidden ? [] : [elements.oneToFour.listingDiscount]),
    ...Array.from(elements.oneToFour.rows.querySelectorAll("[data-sale-price], [data-sale-sqft], [data-sale-psf]")).sort(sortSaleInputs),
  ]);

  bindTabSequence([
    ...elements.tabs,
    elements.commercial.subjectSqft,
    elements.commercial.current.startCap,
    elements.commercial.current.additionalIncome,
    elements.commercial.current.vacancy,
    ...Array.from(elements.commercial.current.rows.querySelectorAll("[data-commercial-current-rent], [data-commercial-current-type]")).sort(sortCurrentCommercialInputs),
    elements.commercial.rent.vacancy,
    elements.commercial.rent.startCap,
    ...Array.from(elements.commercial.rent.rows.querySelectorAll("[data-commercial-rent-rent], [data-commercial-rent-type]")).sort(sortCommercialRentInputs),
    ...(elements.commercial.sale.listingDiscountField?.hidden ? [] : [elements.commercial.sale.listingDiscount]),
    ...Array.from(elements.commercial.sale.rows.querySelectorAll("[data-commercial-sale-price], [data-commercial-sale-sqft], [data-commercial-sale-psf]")).sort(sortCommercialSaleInputs),
  ]);

  bindTabSequence([
    ...elements.tabs,
    elements.apartment.current.modePerUnit,
    elements.apartment.current.modeGrouped,
    elements.apartment.current.startCap,
    elements.apartment.current.vacancy,
    elements.apartment.current.expense,
    ...Array.from(elements.apartment.current.rows.querySelectorAll("[data-apartment-current-type], [data-apartment-current-rent], [data-apartment-current-vacant], [data-apartment-current-fill-method], [data-apartment-grouped-type], [data-apartment-grouped-total-units], [data-apartment-grouped-occupied-rent], [data-apartment-grouped-vacant-units], [data-apartment-grouped-fill-method]")).sort(sortApartmentCurrentInputs),
    elements.apartment.market.vacancy,
    elements.apartment.market.expense,
    elements.apartment.market.startCap,
    ...Array.from(elements.apartment.market.rows.querySelectorAll("[data-apartment-market-sample]")).filter((input) => input.closest("tr")?.offsetParent !== null),
    elements.apartment.sale.enableSf,
    ...(state.apartment.sale.enablePerSf ? [elements.apartment.sale.subjectSqft] : []),
    ...Array.from(elements.apartment.sale.rows.querySelectorAll("[data-apartment-sale-price], [data-apartment-sale-units], [data-apartment-sale-sqft]"))
      .filter((input) => state.apartment.sale.enablePerSf || !input.hasAttribute("data-apartment-sale-sqft"))
      .sort(sortApartmentSaleInputs),
  ]);
}

function sortSaleInputs(left, right) {
  const leftRow = Number(left.getAttribute("data-sale-price") ?? left.getAttribute("data-sale-sqft") ?? left.getAttribute("data-sale-psf"));
  const rightRow = Number(right.getAttribute("data-sale-price") ?? right.getAttribute("data-sale-sqft") ?? right.getAttribute("data-sale-psf"));
  if (leftRow !== rightRow) return leftRow - rightRow;
  return saleFieldOrder(left) - saleFieldOrder(right);
}

function sortCommercialSaleInputs(left, right) {
  const leftRow = Number(left.getAttribute("data-commercial-sale-price") ?? left.getAttribute("data-commercial-sale-sqft") ?? left.getAttribute("data-commercial-sale-psf"));
  const rightRow = Number(right.getAttribute("data-commercial-sale-price") ?? right.getAttribute("data-commercial-sale-sqft") ?? right.getAttribute("data-commercial-sale-psf"));
  if (leftRow !== rightRow) return leftRow - rightRow;
  return commercialSaleFieldOrder(left) - commercialSaleFieldOrder(right);
}

function sortCurrentCommercialInputs(left, right) {
  const leftRow = Number(left.getAttribute("data-commercial-current-rent") ?? left.getAttribute("data-commercial-current-type"));
  const rightRow = Number(right.getAttribute("data-commercial-current-rent") ?? right.getAttribute("data-commercial-current-type"));
  if (leftRow !== rightRow) return leftRow - rightRow;
  return left.hasAttribute("data-commercial-current-rent") ? -1 : 1;
}

function sortCommercialRentInputs(left, right) {
  const leftRow = Number(left.getAttribute("data-commercial-rent-rent") ?? left.getAttribute("data-commercial-rent-type"));
  const rightRow = Number(right.getAttribute("data-commercial-rent-rent") ?? right.getAttribute("data-commercial-rent-type"));
  if (leftRow !== rightRow) return leftRow - rightRow;
  return left.hasAttribute("data-commercial-rent-rent") ? -1 : 1;
}

function sortApartmentCurrentInputs(left, right) {
  const leftRow = Number(
    left.getAttribute("data-apartment-current-type")
    ?? left.getAttribute("data-apartment-current-rent")
    ?? left.getAttribute("data-apartment-current-vacant")
    ?? left.getAttribute("data-apartment-current-fill-method")
    ?? left.getAttribute("data-apartment-grouped-type")
    ?? left.getAttribute("data-apartment-grouped-total-units")
    ?? left.getAttribute("data-apartment-grouped-occupied-rent")
    ?? left.getAttribute("data-apartment-grouped-vacant-units")
    ?? left.getAttribute("data-apartment-grouped-fill-method"),
  );
  const rightRow = Number(
    right.getAttribute("data-apartment-current-type")
    ?? right.getAttribute("data-apartment-current-rent")
    ?? right.getAttribute("data-apartment-current-vacant")
    ?? right.getAttribute("data-apartment-current-fill-method")
    ?? right.getAttribute("data-apartment-grouped-type")
    ?? right.getAttribute("data-apartment-grouped-total-units")
    ?? right.getAttribute("data-apartment-grouped-occupied-rent")
    ?? right.getAttribute("data-apartment-grouped-vacant-units")
    ?? right.getAttribute("data-apartment-grouped-fill-method"),
  );
  if (leftRow !== rightRow) return leftRow - rightRow;
  return apartmentCurrentFieldOrder(left) - apartmentCurrentFieldOrder(right);
}

function sortApartmentSaleInputs(left, right) {
  const leftRow = Number(left.getAttribute("data-apartment-sale-price") ?? left.getAttribute("data-apartment-sale-units") ?? left.getAttribute("data-apartment-sale-sqft"));
  const rightRow = Number(right.getAttribute("data-apartment-sale-price") ?? right.getAttribute("data-apartment-sale-units") ?? right.getAttribute("data-apartment-sale-sqft"));
  if (leftRow !== rightRow) return leftRow - rightRow;
  return apartmentSaleFieldOrder(left) - apartmentSaleFieldOrder(right);
}

function saleFieldOrder(element) {
  if (element.hasAttribute("data-sale-price")) return 0;
  if (element.hasAttribute("data-sale-sqft")) return 1;
  return 2;
}

function commercialSaleFieldOrder(element) {
  if (element.hasAttribute("data-commercial-sale-price")) return 0;
  if (element.hasAttribute("data-commercial-sale-sqft")) return 1;
  return 2;
}

function apartmentSaleFieldOrder(element) {
  if (element.hasAttribute("data-apartment-sale-price")) return 0;
  if (element.hasAttribute("data-apartment-sale-units")) return 1;
  return 2;
}

function apartmentCurrentFieldOrder(element) {
  if (element.hasAttribute("data-apartment-current-type") || element.hasAttribute("data-apartment-grouped-type")) return 0;
  if (element.hasAttribute("data-apartment-current-rent") || element.hasAttribute("data-apartment-grouped-total-units")) return 1;
  if (element.hasAttribute("data-apartment-current-vacant") || element.hasAttribute("data-apartment-grouped-vacant-units")) return 2;
  if (element.hasAttribute("data-apartment-current-fill-method")) return 3;
  if (element.hasAttribute("data-apartment-grouped-occupied-rent")) return 3;
  if (element.hasAttribute("data-apartment-grouped-fill-method")) return 4;
  return 5;
}

function renderAll() {
  renderTabs();
  renderOneToFour();
  renderCommercial();
  renderApartment();
}

function renderTabs() {
  elements.tabs.forEach((tab) => {
    const isActive = tab.dataset.tab === state.activeTab;
    tab.classList.toggle("active", isActive);
    tab.setAttribute("aria-selected", String(isActive));
  });
  elements.panels.forEach((panel) => {
    const isActive = panel.dataset.panel === state.activeTab;
    panel.hidden = !isActive;
    panel.classList.toggle("active", isActive);
  });
}

function renderOneToFour() {
  setControlValue(elements.oneToFour.subjectSqft, state.oneToFour.sale.subjectSqft);
  setControlValue(elements.oneToFour.listingDiscount, state.oneToFour.sale.listingDiscount);
  ensureSaleTrailingEmptyRow(state.oneToFour.sale.rows);
  const calculations = calculateSaleSection(state.oneToFour.sale.rows, state.oneToFour.sale.subjectSqft, state.oneToFour.sale.listingDiscount);
  renderSaleRows({
    tbody: elements.oneToFour.rows,
    rows: state.oneToFour.sale.rows,
    calculations,
    listingField: elements.oneToFour.listingDiscountField,
    priceAttr: "data-sale-price",
    sqftAttr: "data-sale-sqft",
    psfAttr: "data-sale-psf",
    typeAttr: "data-sale-type",
    includeAttr: "data-sale-include",
    removeAttr: "data-sale-remove",
    focusPrefix: "sale",
    onRender: bindOneToFourSaleEvents,
  });
  elements.oneToFour.averagePsf.textContent = calculations.averagePsf === null ? "-" : `${formatCurrency(calculations.averagePsf, 2)} / SF`;
  elements.oneToFour.indicatedValue.textContent = calculations.indicatedValue === null ? "-" : formatCurrency(calculations.indicatedValue, 0);
  elements.oneToFour.indicatedValue.setAttribute("aria-disabled", String(!(Number.isFinite(calculations.indicatedValue) && calculations.indicatedValue > 0)));
  derived.oneToFourSaleCopy = calculations.indicatedValue;
  setCopyButtonState(elements.oneToFour.copyBtn, calculations.indicatedValue);
  bindTabFlows();
  persistState();
}

function renderCommercial() {
  setControlValue(elements.commercial.subjectSqft, state.commercial.subjectSqft);
  renderCommercialCurrent();
  renderCommercialRent();
  renderCommercialSale();
  bindTabFlows();
  persistState();
}

function renderCommercialCurrent() {
  setControlValue(elements.commercial.current.startCap, state.commercial.current.startCap);
  setControlValue(elements.commercial.current.additionalIncome, state.commercial.current.additionalIncome);
  setControlValue(elements.commercial.current.vacancy, state.commercial.current.vacancy);
  ensureCurrentRentCommercialTrailingEmptyRow();
  const calculations = calculateCommercialCurrent();
  const focusState = captureActiveInputState(elements.commercial.current.rows);

  elements.commercial.current.rows.innerHTML = state.commercial.current.rows.map((row, index) => {
    const rowCalc = calculations.rows[index];
    return `
      <tr>
        <td><input class="table-input" type="text" data-focus-key="commercial-current-rent-${index}" data-commercial-current-rent="${index}" value="${escapeHtml(row.rent)}" placeholder="Current monthly rent..." /></td>
        <td>
          <select class="table-select" data-focus-key="commercial-current-type-${index}" data-commercial-current-type="${index}" tabindex="-1">
            <option value="nnn" ${row.leaseType === "nnn" ? "selected" : ""}>NNN</option>
            <option value="modified" ${row.leaseType === "modified" ? "selected" : ""}>Modified</option>
            <option value="gross" ${row.leaseType === "gross" ? "selected" : ""}>Gross</option>
          </select>
        </td>
        <td>${rowCalc?.expenseLabel || "10%"}</td>
        <td>${rowCalc?.adjustedRentLabel || "-"}</td>
        <td>${state.commercial.current.rows.length > 1 ? `<button class="row-remove" type="button" data-commercial-current-remove="${index}" tabindex="-1">Remove</button>` : ""}</td>
      </tr>
    `;
  }).join("");

  bindCommercialCurrentEvents();
  if (!consumePendingFocus()) restoreActiveInputState(elements.commercial.current.rows, focusState);

  elements.commercial.current.summary1.textContent = calculations.baseMonthlyIncome === null ? "-" : formatCurrency(calculations.baseMonthlyIncome, 0);
  elements.commercial.current.summary2.textContent = formatCurrency(calculations.additionalIncome, 0);
  elements.commercial.current.summary3.textContent = calculations.annualGrossIncome === null ? "-" : formatCurrency(calculations.annualGrossIncome, 0);
  elements.commercial.current.summary4.textContent = calculations.annualNoi === null ? "-" : formatCurrency(calculations.annualNoi, 0);
  elements.commercial.current.summary5.textContent = calculations.startCapValue === null ? "-" : formatCurrency(calculations.startCapValue, 0);
  elements.commercial.current.summary6.textContent = calculations.appliedVacancyLabel;
  derived.commercialCurrentCopy = calculations.selectedCapValue;
  setCopyButtonState(elements.commercial.current.copyBtn, calculations.selectedCapValue);
  renderCapResults({
    tbody: elements.commercial.current.capResults,
    startCapRaw: state.commercial.current.startCap,
    selectedCapRate: state.commercial.current.selectedCapRate,
    annualNoiAfterVacancy: calculations.annualNoi,
    onSelect: (capRate) => {
      state.commercial.current.selectedCapRate = capRate;
      renderCommercialCurrent();
    },
    emptyMessage: "Enter a starting cap rate to generate values.",
    copyButton: elements.commercial.current.copyBtn,
    storeSelected: (capRate, value) => {
      state.commercial.current.selectedCapRate = capRate;
      derived.commercialCurrentCopy = value;
      setCopyButtonState(elements.commercial.current.copyBtn, value);
    },
  });
}

function renderCommercialRent() {
  setControlValue(elements.commercial.rent.vacancy, state.commercial.rent.vacancy);
  setControlValue(elements.commercial.rent.startCap, state.commercial.rent.startCap);
  ensureLeaseTrailingEmptyRow(state.commercial.rent.rows);
  const calculations = calculateCommercialRent();
  const focusState = captureActiveInputState(elements.commercial.rent.rows);

  elements.commercial.rent.rows.innerHTML = state.commercial.rent.rows.map((row, index) => {
    const rowCalc = calculations.rows[index];
    const outlierChip = rowCalc?.isOutlier ? '<span class="chip outlier">High Outlier</span>' : "";
    return `
      <tr class="${rowCalc?.isOutlier ? "is-outlier" : ""}">
        <td><input type="checkbox" data-commercial-rent-include="${index}" tabindex="-1" ${row.include ? "checked" : ""} /></td>
        <td><input class="table-input" type="text" data-focus-key="commercial-rent-rent-${index}" data-commercial-rent-rent="${index}" value="${escapeHtml(row.rent)}" placeholder="Rent / SF..." /></td>
        <td>
          <select class="table-select" data-focus-key="commercial-rent-type-${index}" data-commercial-rent-type="${index}" tabindex="-1">
            <option value="nnn" ${row.leaseType === "nnn" ? "selected" : ""}>NNN</option>
            <option value="modified" ${row.leaseType === "modified" ? "selected" : ""}>Modified</option>
            <option value="gross" ${row.leaseType === "gross" ? "selected" : ""}>Gross</option>
          </select>
        </td>
        <td>${rowCalc?.expenseLabel || "10%"}</td>
        <td><div class="metric-stack"><span>${rowCalc?.adjustedRentLabel || "-"}</span>${outlierChip}</div></td>
        <td>${state.commercial.rent.rows.length > 1 ? `<button class="row-remove" type="button" data-commercial-rent-remove="${index}" tabindex="-1">Remove</button>` : ""}</td>
      </tr>
    `;
  }).join("");

  bindCommercialRentEvents();
  if (!consumePendingFocus()) restoreActiveInputState(elements.commercial.rent.rows, focusState);

  elements.commercial.rent.average.textContent = calculations.averageAdjustedRent === null ? "-" : `${formatCurrency(calculations.averageAdjustedRent, 2)} / SF`;
  elements.commercial.rent.monthlyNoi.textContent = calculations.potentialMonthlyNoi === null ? "-" : formatCurrency(calculations.potentialMonthlyNoi, 0);
  elements.commercial.rent.annualNoi.textContent = calculations.potentialAnnualNoi === null ? "-" : formatCurrency(calculations.potentialAnnualNoi, 0);
  elements.commercial.rent.noiAfterVacancy.textContent = calculations.annualNoiAfterVacancy === null ? "-" : formatCurrency(calculations.annualNoiAfterVacancy, 0);
  derived.commercialRentCopy = calculations.selectedCapValue;
  setCopyButtonState(elements.commercial.rent.copyBtn, calculations.selectedCapValue);
  renderCapResults({
    tbody: elements.commercial.rent.capResults,
    startCapRaw: state.commercial.rent.startCap,
    selectedCapRate: state.commercial.rent.selectedCapRate,
    annualNoiAfterVacancy: calculations.annualNoiAfterVacancy,
    onSelect: (capRate) => {
      state.commercial.rent.selectedCapRate = capRate;
      renderCommercialRent();
    },
    emptyMessage: "Enter a starting cap rate to generate values.",
    copyButton: elements.commercial.rent.copyBtn,
    storeSelected: (capRate, value) => {
      state.commercial.rent.selectedCapRate = capRate;
      derived.commercialRentCopy = value;
      setCopyButtonState(elements.commercial.rent.copyBtn, value);
    },
  });
}

function renderCommercialSale() {
  setControlValue(elements.commercial.sale.listingDiscount, state.commercial.sale.listingDiscount);
  ensureSaleTrailingEmptyRow(state.commercial.sale.rows);
  const calculations = calculateSaleSection(state.commercial.sale.rows, state.commercial.subjectSqft, state.commercial.sale.listingDiscount);
  renderSaleRows({
    tbody: elements.commercial.sale.rows,
    rows: state.commercial.sale.rows,
    calculations,
    listingField: elements.commercial.sale.listingDiscountField,
    priceAttr: "data-commercial-sale-price",
    sqftAttr: "data-commercial-sale-sqft",
    psfAttr: "data-commercial-sale-psf",
    typeAttr: "data-commercial-sale-type",
    includeAttr: "data-commercial-sale-include",
    removeAttr: "data-commercial-sale-remove",
    focusPrefix: "commercial-sale",
    onRender: bindCommercialSaleEvents,
  });
  elements.commercial.sale.averagePsf.textContent = calculations.averagePsf === null ? "-" : `${formatCurrency(calculations.averagePsf, 2)} / SF`;
  elements.commercial.sale.indicatedValue.textContent = calculations.indicatedValue === null ? "-" : formatCurrency(calculations.indicatedValue, 0);
  elements.commercial.sale.indicatedValue.setAttribute("aria-disabled", String(!(Number.isFinite(calculations.indicatedValue) && calculations.indicatedValue > 0)));
  derived.commercialSaleCopy = calculations.indicatedValue;
  setCopyButtonState(elements.commercial.sale.copyBtn, calculations.indicatedValue);
}

function renderApartment() {
  const unitMix = getApartmentUnitMix();
  renderApartmentCurrent(unitMix);
  renderApartmentMarket(unitMix);
  renderApartmentSale(unitMix);
  bindTabFlows();
  persistState();
}

function renderApartmentCurrent(unitMix) {
  const isGroupedMode = state.apartment.current.rentRollMode === "grouped";
  setControlValue(elements.apartment.current.startCap, state.apartment.current.startCap);
  setControlValue(elements.apartment.current.vacancy, state.apartment.current.vacancy);
  setControlValue(elements.apartment.current.expense, state.apartment.current.expensePercent);
  elements.apartment.current.modePerUnit?.classList.toggle("active", !isGroupedMode);
  elements.apartment.current.modePerUnit?.setAttribute("aria-selected", String(!isGroupedMode));
  elements.apartment.current.modeGrouped?.classList.toggle("active", isGroupedMode);
  elements.apartment.current.modeGrouped?.setAttribute("aria-selected", String(isGroupedMode));
  elements.apartment.current.head.innerHTML = isGroupedMode
    ? `
        <tr>
          <th>Unit Type</th>
          <th>Total Units</th>
          <th>Vacant Units</th>
          <th>Occupied Rent</th>
          <th>Fill Method</th>
          <th>Occupied Units</th>
          <th>Avg Occupied Rent</th>
          <th class="action-col"></th>
        </tr>
      `
    : `
        <tr>
          <th>Unit Type</th>
          <th>Rent Amount</th>
          <th class="checkbox-col">Vacant</th>
          <th>Fill Method</th>
          <th>Status</th>
          <th class="action-col"></th>
        </tr>
      `;
  elements.apartment.current.hint.textContent = isGroupedMode
    ? "Enter occupied rent and vacant units by type. Use Fixed Rent when vacant units should fill at the row's implied rent instead of market."
    : "Enter one unit per row. Use Vacant to mark an empty unit, then choose whether it fills from Market Rent or Fixed Rent.";
  if (isGroupedMode) ensureApartmentGroupedRentRollTrailingEmptyRow();
  else ensureApartmentRentRollTrailingEmptyRow();
  const marketCalculations = calculateApartmentMarket(unitMix);
  const calculations = calculateApartmentCurrent(unitMix, marketCalculations.averageByType);
  const focusState = captureActiveInputState(elements.apartment.current.rows);

  elements.apartment.current.rows.innerHTML = isGroupedMode
    ? state.apartment.current.groupedRows.map((row, index) => {
        const rowCalc = calculations.rows[index];
        return `
          <tr>
            <td>
              <select class="table-select" data-focus-key="apartment-grouped-type-${index}" data-apartment-grouped-type="${index}">
                <option value="" ${row.type === "" ? "selected" : ""}>Select type...</option>
                ${aptRentTypeOptions.map((option) => `<option value="${escapeHtml(option.value)}" ${row.type === option.value ? "selected" : ""}>${escapeHtml(option.label)}</option>`).join("")}
              </select>
            </td>
            <td><input class="table-input" type="text" data-focus-key="apartment-grouped-total-units-${index}" data-apartment-grouped-total-units="${index}" value="${escapeHtml(row.totalUnits)}" placeholder="Total units..." /></td>
            <td><input class="table-input" type="text" data-focus-key="apartment-grouped-vacant-units-${index}" data-apartment-grouped-vacant-units="${index}" value="${escapeHtml(row.vacantUnits)}" placeholder="Vacant units..." /></td>
            <td><input class="table-input" type="text" data-focus-key="apartment-grouped-occupied-rent-${index}" data-apartment-grouped-occupied-rent="${index}" value="${escapeHtml(row.occupiedRent)}" placeholder="Occupied rent..." /></td>
            <td>
              <select class="table-select" data-focus-key="apartment-grouped-fill-method-${index}" data-apartment-grouped-fill-method="${index}">
                <option value="market" ${row.fillMethod !== "fixed" ? "selected" : ""}>Market Rent</option>
                <option value="fixed" ${row.fillMethod === "fixed" ? "selected" : ""}>Fixed Rent</option>
              </select>
            </td>
            <td>${rowCalc?.occupiedUnitsLabel || "-"}</td>
            <td><div class="metric-stack"><span>${rowCalc?.averageOccupiedRentLabel || "-"}</span>${rowCalc?.fillLabel ? `<span class="chip">${escapeHtml(rowCalc.fillLabel)}</span>` : ""}</div></td>
            <td>${state.apartment.current.groupedRows.length > 1 ? `<button class="row-remove" type="button" data-apartment-grouped-remove="${index}" tabindex="-1">Remove</button>` : ""}</td>
          </tr>
        `;
      }).join("")
    : state.apartment.current.rows.map((row, index) => {
        const rowCalc = calculations.rows[index];
        return `
          <tr class="${rowCalc?.isVacant ? "is-outlier" : ""}">
            <td>
              <select class="table-select" data-focus-key="apartment-current-type-${index}" data-apartment-current-type="${index}">
                <option value="" ${row.type === "" ? "selected" : ""}>Select type...</option>
                ${aptRentTypeOptions.map((option) => `<option value="${escapeHtml(option.value)}" ${row.type === option.value ? "selected" : ""}>${escapeHtml(option.label)}</option>`).join("")}
              </select>
            </td>
            <td><input class="table-input" type="text" data-focus-key="apartment-current-rent-${index}" data-apartment-current-rent="${index}" value="${escapeHtml(row.rent)}" placeholder="Rent amount..." /></td>
            <td><input type="checkbox" data-focus-key="apartment-current-vacant-${index}" data-apartment-current-vacant="${index}" tabindex="-1" ${row.isVacant ? "checked" : ""} /></td>
            <td>
              <select class="table-select" data-focus-key="apartment-current-fill-method-${index}" data-apartment-current-fill-method="${index}">
                <option value="market" ${row.fillMethod !== "fixed" ? "selected" : ""}>Market Rent</option>
                <option value="fixed" ${row.fillMethod === "fixed" ? "selected" : ""}>Fixed Rent</option>
              </select>
            </td>
            <td><div class="metric-stack"><span>${rowCalc?.statusLabel || "-"}</span>${rowCalc?.fillLabel ? `<span class="chip">${escapeHtml(rowCalc.fillLabel)}</span>` : ""}</div></td>
            <td>${state.apartment.current.rows.length > 1 ? `<button class="row-remove" type="button" data-apartment-current-remove="${index}" tabindex="-1">Remove</button>` : ""}</td>
          </tr>
        `;
      }).join("");

  bindApartmentCurrentEvents();
  if (!consumePendingFocus()) restoreActiveInputState(elements.apartment.current.rows, focusState);

  elements.apartment.current.fillRows.innerHTML = calculations.fillPlanRows.length
    ? calculations.fillPlanRows.map((row) => `
        <tr data-unit-type="${escapeHtml(row.type)}">
          <td>${escapeHtml(getAptRentTypeLabel(row.type))}</td>
          <td>${escapeHtml(String(row.vacantUnits))}</td>
          <td>${escapeHtml(row.sourceLabel)}</td>
          <td>${row.rentUsed === null ? row.missingLabel || "-" : formatCurrency(row.rentUsed, 0)}</td>
          <td>${row.monthlyIncome === null ? "-" : formatCurrency(row.monthlyIncome, 0)}</td>
        </tr>
      `).join("")
    : `<tr><td colspan="5" class="empty-cell">${escapeHtml(isGroupedMode ? "Enter grouped unit counts and vacant units to build the fill plan." : "Mark units vacant to build the fill plan.")}</td></tr>`;
  elements.apartment.current.fillTotal.textContent = calculations.monthlyFillIncome === null ? "-" : formatCurrency(calculations.monthlyFillIncome, 0);

  elements.apartment.current.summary1.textContent = calculations.baseMonthlyIncome === null ? "-" : formatCurrency(calculations.baseMonthlyIncome, 0);
  elements.apartment.current.summary2.textContent = calculations.monthlyFillIncome === null ? "-" : formatCurrency(calculations.monthlyFillIncome, 0);
  elements.apartment.current.summary3.textContent = calculations.annualGrossIncome === null ? "-" : formatCurrency(calculations.annualGrossIncome, 0);
  elements.apartment.current.summary4.textContent = calculations.annualNoi === null ? "-" : formatCurrency(calculations.annualNoi, 0);
  elements.apartment.current.summary5.textContent = calculations.startCapValue === null ? "-" : formatCurrency(calculations.startCapValue, 0);
  elements.apartment.current.summary6.textContent = calculations.appliedVacancyLabel;
  elements.apartment.current.summary7.textContent = calculations.apartmentVacancyLabel;
  derived.apartmentCurrentCopy = calculations.selectedCapValue;
  setCopyButtonState(elements.apartment.current.copyBtn, calculations.selectedCapValue);
  renderApartmentCurrentCapResults(calculations);
}

function renderApartmentMarket(unitMix) {
  setControlValue(elements.apartment.market.vacancy, state.apartment.market.vacancy);
  setControlValue(elements.apartment.market.expense, state.apartment.market.expensePercent);
  setControlValue(elements.apartment.market.startCap, state.apartment.market.startCap);
  Object.entries(unitMix).forEach(([key, count]) => {
    elements.apartment.market.mix[key].textContent = String(count);
    const mixCard = elements.apartment.market.mix[key]?.closest(".summary-card");
    const averageCard = elements.apartment.market.averages[key]?.closest(".summary-card");
    if (mixCard) mixCard.hidden = count === 0;
    if (averageCard) averageCard.hidden = count === 0;
  });
  const calculations = calculateApartmentMarket(unitMix);
  const focusState = captureActiveInputState(elements.apartment.market.rows);

  elements.apartment.market.rows.innerHTML = state.apartment.market.rows.map((row, index) => {
    const rowCalc = calculations.rows[index];
    const outlierButton = rowCalc?.showOutlierToggle
      ? `<button class="mini-toggle ${rowCalc.outlierIncluded ? "" : "active"}" type="button" data-apartment-market-outlier="${index}" tabindex="-1">${rowCalc.outlierIncluded ? "Include Outlier" : "Remove Outlier"}</button>`
      : "";
    return `
      <tr class="${rowCalc?.showOutlierToggle && !rowCalc.outlierIncluded ? "is-outlier" : ""}" data-unit-type="${escapeHtml(row.type)}" ${rowCalc?.hidden ? 'style="display:none;"' : ""}>
        <td><input type="checkbox" data-apartment-market-include="${index}" tabindex="-1" ${row.include ? "checked" : ""} /></td>
        <td>${escapeHtml(getAptRentTypeLabel(row.type))}</td>
        <td>
          <div class="rent-sample-grid">
            ${row.rents.map((value, rentIndex) => `
              <input class="table-input" type="text" data-focus-key="apartment-market-${index}-${rentIndex}" data-apartment-market-sample="${index}" data-rent-index="${rentIndex}" value="${escapeHtml(value)}" placeholder="Rent ${rentIndex + 1}..." />
            `).join("")}
          </div>
        </td>
        <td><div class="metric-stack"><span>${rowCalc?.displayLabel || "-"}</span>${outlierButton}</div></td>
      </tr>
    `;
  }).join("");

  bindApartmentMarketEvents();
  if (!consumePendingFocus()) restoreActiveInputState(elements.apartment.market.rows, focusState);

  Object.entries(elements.apartment.market.averages).forEach(([key, output]) => {
    output.textContent = calculations.averageByType[key] === null ? "-" : formatCurrency(calculations.averageByType[key], 0);
  });
  elements.apartment.market.annualGross.textContent = calculations.annualGrossRent === null ? "-" : formatCurrency(calculations.annualGrossRent, 0);
  elements.apartment.market.effectiveGross.textContent = calculations.effectiveGrossIncome === null ? "-" : formatCurrency(calculations.effectiveGrossIncome, 0);
  elements.apartment.market.annualNoi.textContent = calculations.annualNoi === null ? "-" : formatCurrency(calculations.annualNoi, 0);
  elements.apartment.market.startCapValue.textContent = calculations.startCapValue === null ? "-" : formatCurrency(calculations.startCapValue, 0);
  derived.apartmentMarketCopy = calculations.selectedCapValue;
  setCopyButtonState(elements.apartment.market.copyBtn, calculations.selectedCapValue);
  renderCapResults({
    tbody: elements.apartment.market.capResults,
    startCapRaw: state.apartment.market.startCap,
    selectedCapRate: state.apartment.market.selectedCapRate,
    annualNoiAfterVacancy: calculations.annualNoi,
    onSelect: (capRate) => {
      state.apartment.market.selectedCapRate = capRate;
      renderApartmentMarket(getApartmentUnitMix());
    },
    emptyMessage: "Enter a starting cap rate to generate values.",
    copyButton: elements.apartment.market.copyBtn,
    storeSelected: (capRate, value) => {
      state.apartment.market.selectedCapRate = capRate;
      derived.apartmentMarketCopy = value;
      setCopyButtonState(elements.apartment.market.copyBtn, value);
    },
  });
}

function renderApartmentSale(unitMix) {
  const subjectUnits = Object.values(unitMix).reduce((sum, value) => sum + value, 0);
  if (elements.apartment.sale.enableSf) elements.apartment.sale.enableSf.checked = state.apartment.sale.enablePerSf;
  elements.apartment.sale.subjectUnits.textContent = String(subjectUnits);
  setControlValue(elements.apartment.sale.subjectSqft, state.apartment.sale.subjectSqft);
  elements.apartment.sale.subjectSqftField.hidden = !state.apartment.sale.enablePerSf;
  elements.apartment.sale.sfHeading.hidden = !state.apartment.sale.enablePerSf;
  elements.apartment.sale.psfHeading.hidden = !state.apartment.sale.enablePerSf;
  elements.apartment.sale.summaryGrid.className = `summary-grid ${state.apartment.sale.enablePerSf ? "summary-grid-four" : "summary-grid-two"}`;
  ensureAptSaleTrailingEmptyRow(state.apartment.sale.rows);
  const calculations = calculateApartmentSale(unitMix);
  const focusState = captureActiveInputState(elements.apartment.sale.rows);

  elements.apartment.sale.rows.innerHTML = state.apartment.sale.rows.map((row, index) => {
    const rowCalc = calculations.rows[index];
    const outlierChip = rowCalc?.isOutlier ? '<span class="chip outlier">High Outlier</span>' : "";
    return `
      <tr class="${rowCalc?.isOutlier ? "is-outlier" : ""}">
        <td><input type="checkbox" data-apartment-sale-include="${index}" tabindex="-1" ${row.include ? "checked" : ""} /></td>
        <td><input class="table-input" type="text" data-focus-key="apartment-sale-price-${index}" data-apartment-sale-price="${index}" value="${escapeHtml(row.price)}" placeholder="Purchase Price..." /></td>
        <td><input class="table-input" type="text" data-focus-key="apartment-sale-units-${index}" data-apartment-sale-units="${index}" value="${escapeHtml(row.units)}" placeholder="Units..." /></td>
        <td ${state.apartment.sale.enablePerSf ? "" : 'hidden'}><input class="table-input" type="text" data-focus-key="apartment-sale-sqft-${index}" data-apartment-sale-sqft="${index}" value="${escapeHtml(row.sqft)}" placeholder="SF..." ${state.apartment.sale.enablePerSf ? "" : 'tabindex="-1"'} /></td>
        <td><div class="metric-stack"><span>${rowCalc?.perUnitLabel || "-"}</span>${outlierChip}</div></td>
        <td ${state.apartment.sale.enablePerSf ? "" : 'hidden'}>${rowCalc?.perSfLabel || "-"}</td>
        <td>${state.apartment.sale.rows.length > 1 ? `<button class="row-remove" type="button" data-apartment-sale-remove="${index}" tabindex="-1">Remove</button>` : ""}</td>
      </tr>
    `;
  }).join("");

  bindApartmentSaleEvents();
  if (!consumePendingFocus()) restoreActiveInputState(elements.apartment.sale.rows, focusState);

  elements.apartment.sale.averageUnit.textContent = calculations.averagePerUnit === null ? "-" : formatCurrency(calculations.averagePerUnit, 0);
  elements.apartment.sale.indicatedUnit.textContent = calculations.indicatedPerUnit === null ? "-" : formatCurrency(calculations.indicatedPerUnit, 0);
  elements.apartment.sale.indicatedUnit.setAttribute("aria-disabled", String(!(Number.isFinite(calculations.indicatedPerUnit) && calculations.indicatedPerUnit > 0)));
  elements.apartment.sale.averageSfCard.hidden = !state.apartment.sale.enablePerSf;
  elements.apartment.sale.indicatedSfCard.hidden = !state.apartment.sale.enablePerSf;
  elements.apartment.sale.averageSf.textContent = calculations.averagePerSf === null ? "-" : `${formatCurrency(calculations.averagePerSf, 2)} / SF`;
  elements.apartment.sale.indicatedSf.textContent = calculations.indicatedPerSf === null ? "-" : formatCurrency(calculations.indicatedPerSf, 0);
  elements.apartment.sale.indicatedSf.setAttribute("aria-disabled", String(!(Number.isFinite(calculations.indicatedPerSf) && calculations.indicatedPerSf > 0)));
  derived.apartmentSaleCopy = calculations.indicatedPerUnit;
  setCopyButtonState(elements.apartment.sale.copyBtn, calculations.indicatedPerUnit);
}

function renderSaleRows({
  tbody,
  rows,
  calculations,
  listingField,
  priceAttr,
  sqftAttr,
  psfAttr,
  typeAttr,
  includeAttr,
  removeAttr,
  focusPrefix,
  onRender,
}) {
  const focusState = captureActiveInputState(tbody);
  const hasListingRows = rows.some((row) => row.listing);
  if (listingField) {
    listingField.hidden = !hasListingRows;
    listingField.classList.toggle("attention-glow", hasListingRows);
  }
  tbody.innerHTML = rows.map((row, index) => {
    const rowCalc = calculations.rows[index];
    const listingChip = row.listing && rowCalc?.usedPsf !== null ? '<span class="chip listing">Listing Adj</span>' : "";
    const outlierChip = rowCalc?.isOutlier ? '<span class="chip outlier">High Outlier</span>' : "";
    return `
      <tr class="${rowCalc?.isOutlier ? "is-outlier" : ""}">
        <td><input type="checkbox" ${includeAttr}="${index}" tabindex="-1" ${row.include ? "checked" : ""} /></td>
        <td>
          <div class="sale-toggle">
            <button type="button" class="${row.listing ? "" : "active"}" ${typeAttr}="${index}" data-sale-type-value="sale" tabindex="-1">Sale</button>
            <button type="button" class="${row.listing ? "active" : ""}" ${typeAttr}="${index}" data-sale-type-value="listing" tabindex="-1">Listing</button>
          </div>
        </td>
        <td><input class="table-input" type="text" data-focus-key="${focusPrefix}-price-${index}" ${priceAttr}="${index}" value="${escapeHtml(row.price)}" placeholder="Purchase Price..." ${rowCalc?.lockBasis ? "readonly" : ""} /></td>
        <td><input class="table-input" type="text" data-focus-key="${focusPrefix}-sqft-${index}" ${sqftAttr}="${index}" value="${escapeHtml(row.sqft)}" placeholder="Comp SF..." ${rowCalc?.lockBasis ? "readonly" : ""} /></td>
        <td><input class="table-input" type="text" data-focus-key="${focusPrefix}-psf-${index}" ${psfAttr}="${index}" value="${escapeHtml(row.psf)}" placeholder="$ / SF..." tabindex="-1" ${rowCalc?.lockPsf ? "readonly" : ""} /></td>
        <td><div class="metric-stack"><span>${rowCalc?.usedPsfLabel || "-"}</span>${listingChip}${outlierChip}</div></td>
        <td>${rows.length > 1 ? `<button class="row-remove" type="button" ${removeAttr}="${index}" tabindex="-1">Remove</button>` : ""}</td>
      </tr>
    `;
  }).join("");
  onRender();
  if (!consumePendingFocus()) restoreActiveInputState(tbody, focusState);
}

function calculateSaleSection(rowsState, subjectSqftRaw, listingDiscountRaw) {
  const listingDiscountRate = clampPercent(listingDiscountRaw);
  const rows = rowsState.map((row) => {
    const sqft = parsePositiveWholeNumber(row.sqft);
    const price = parseLooseNumber(row.price);
    const manualPsf = parseLooseNumber(row.psf);
    const computedPsf = price !== null && sqft !== null && sqft > 0 ? price / sqft : null;
    const basePsf = computedPsf ?? manualPsf;
    const usedPsf = basePsf === null ? null : (row.listing ? basePsf * (1 - listingDiscountRate) : basePsf);
    return {
      usedPsf,
      usedPsfLabel: usedPsf === null ? "-" : `${formatCurrency(usedPsf, 2)} / SF`,
      lockPsf: computedPsf !== null,
      lockBasis: manualPsf !== null && computedPsf === null,
      isOutlier: false,
    };
  });

  let outlierIndex = -1;
  let highestMetric = -Infinity;
  rows.forEach((row, index) => {
    if (row.usedPsf === null) return;
    if (row.usedPsf > highestMetric) {
      highestMetric = row.usedPsf;
      outlierIndex = index;
    }
  });

  rows.forEach((row, index) => {
    row.isOutlier = index === outlierIndex;
    const sourceRow = rowsState[index];
    if (!sourceRow) return;
    if (row.isOutlier) {
      if (sourceRow.userTouched !== true) sourceRow.include = false;
    } else if (sourceRow.userTouched !== true) {
      sourceRow.include = true;
    }
  });

  const selectedMetrics = rows
    .map((row, index) => ({ row, source: rowsState[index] }))
    .filter((entry) => entry.source?.include && entry.row.usedPsf !== null)
    .map((entry) => entry.row.usedPsf);
  const averagePsf = selectedMetrics.length ? selectedMetrics.reduce((sum, value) => sum + value, 0) / selectedMetrics.length : null;
  const subjectSqft = parsePositiveWholeNumber(subjectSqftRaw);
  const indicatedValue = averagePsf === null || subjectSqft === null ? null : averagePsf * subjectSqft;
  return { rows, averagePsf, indicatedValue };
}

function calculateCommercialRent() {
  const rows = state.commercial.rent.rows.map((row) => {
    const rentPerSf = parseLooseNumber(row.rent || "");
    const expenseRate = getLeaseExpenseRate(row.leaseType);
    const adjustedRent = rentPerSf === null ? null : rentPerSf * (1 - expenseRate);
    return {
      adjustedRent,
      expenseLabel: `${(expenseRate * 100).toFixed(0)}%`,
      adjustedRentLabel: adjustedRent === null ? "-" : `${formatCurrency(adjustedRent, 2)} / SF`,
      isOutlier: false,
    };
  });

  let outlierIndex = -1;
  let highestAdjustedRent = -Infinity;
  rows.forEach((row, index) => {
    if (row.adjustedRent === null) return;
    if (row.adjustedRent > highestAdjustedRent) {
      highestAdjustedRent = row.adjustedRent;
      outlierIndex = index;
    }
  });

  rows.forEach((row, index) => {
    row.isOutlier = index === outlierIndex;
    const sourceRow = state.commercial.rent.rows[index];
    if (!sourceRow) return;
    if (row.isOutlier) {
      if (sourceRow.userTouched !== true) sourceRow.include = false;
    } else if (sourceRow.userTouched !== true) {
      sourceRow.include = true;
    }
  });

  const selectedAdjustedRents = rows
    .map((row, index) => ({ row, source: state.commercial.rent.rows[index] }))
    .filter((entry) => entry.source?.include && entry.row.adjustedRent !== null)
    .map((entry) => entry.row.adjustedRent);
  const averageAdjustedRent = selectedAdjustedRents.length ? selectedAdjustedRents.reduce((sum, value) => sum + value, 0) / selectedAdjustedRents.length : null;
  const subjectSqft = parsePositiveWholeNumber(state.commercial.subjectSqft);
  const vacancyRate = clampPercent(state.commercial.rent.vacancy);
  const potentialMonthlyNoi = averageAdjustedRent === null || subjectSqft === null ? null : averageAdjustedRent * subjectSqft;
  const potentialAnnualNoi = potentialMonthlyNoi === null ? null : potentialMonthlyNoi * 12;
  const annualNoiAfterVacancy = potentialAnnualNoi === null ? null : potentialAnnualNoi * (1 - vacancyRate);
  const selectedCapValue = calculateSelectedCapValue(state.commercial.rent.startCap, state.commercial.rent.selectedCapRate, annualNoiAfterVacancy, (nextRate) => {
    state.commercial.rent.selectedCapRate = nextRate;
  });

  return { rows, averageAdjustedRent, potentialMonthlyNoi, potentialAnnualNoi, annualNoiAfterVacancy, selectedCapValue };
}

function calculateCommercialCurrent() {
  const additionalIncome = parseLooseNumber(state.commercial.current.additionalIncome);
  const vacancyRate = clampPercent(state.commercial.current.vacancy);
  const rows = state.commercial.current.rows.map((row) => {
    const rent = parseLooseNumber(row.rent);
    const expenseRate = getLeaseExpenseRate(row.leaseType);
    const adjustedRent = rent === null ? null : rent * (1 - expenseRate);
    return {
      adjustedRent,
      expenseLabel: `${(expenseRate * 100).toFixed(0)}%`,
      adjustedRentLabel: adjustedRent === null ? "-" : formatCurrency(adjustedRent, 0),
    };
  });
  const values = rows.map((row) => row.adjustedRent).filter((value) => value !== null);
  const baseMonthlyIncome = values.length ? values.reduce((sum, value) => sum + value, 0) : null;
  const totalAdditionalIncome = additionalIncome ?? 0;
  const monthlyIncomeBeforeVacancy = baseMonthlyIncome === null ? (totalAdditionalIncome > 0 ? totalAdditionalIncome : null) : baseMonthlyIncome + totalAdditionalIncome;
  const annualGrossIncome = monthlyIncomeBeforeVacancy === null ? null : monthlyIncomeBeforeVacancy * 12;
  const annualNoi = annualGrossIncome === null ? null : annualGrossIncome * (1 - vacancyRate);
  const startCapRate = parseLooseNumber(state.commercial.current.startCap);
  const startCapValue = annualNoi === null || startCapRate === null || startCapRate <= 0 ? null : annualNoi / (startCapRate / 100);
  const selectedCapValue = calculateSelectedCapValue(state.commercial.current.startCap, state.commercial.current.selectedCapRate, annualNoi, (nextRate) => {
    state.commercial.current.selectedCapRate = nextRate;
  });

  return {
    rows,
    additionalIncome: totalAdditionalIncome,
    baseMonthlyIncome,
    annualGrossIncome,
    annualNoi,
    startCapValue,
    selectedCapValue,
    appliedVacancyLabel: `${(vacancyRate * 100).toFixed(1).replace(/\.0$/, "")}%`,
  };
}

function getApartmentUnitMix() {
  const mix = Object.fromEntries(aptRentTypeOptions.map((type) => [type.value, 0]));
  if (state.apartment.current.rentRollMode === "grouped") {
    state.apartment.current.groupedRows.forEach((row) => {
      const totalUnits = parsePositiveWholeNumber(row.totalUnits);
      if (!row.type || totalUnits === null) return;
      mix[row.type] += totalUnits;
    });
    return mix;
  }
  state.apartment.current.rows.forEach((row) => {
    if (!row.type) return;
    mix[row.type] += 1;
  });
  return mix;
}

function calculateApartmentMarket(unitMix) {
  const averageByType = Object.fromEntries(aptRentTypeOptions.map((type) => [type.value, null]));
  const rows = state.apartment.market.rows.map((row) => {
    const hasUnits = unitMix[row.type] > 0;
    const rentEntries = row.rents
      .map((value, index) => ({ index, value: parseLooseNumber(value || "") }))
      .filter((entry) => entry.value !== null);

    let outlierIndex = null;
    if (rentEntries.length > 1) {
      let highest = rentEntries[0];
      rentEntries.slice(1).forEach((entry) => {
        if (entry.value > highest.value) highest = entry;
      });
      outlierIndex = highest.index;
    }
    if (outlierIndex === null) row.includeOutlier = false;
    const selectedValues = rentEntries
      .filter((entry) => outlierIndex === null || row.includeOutlier || entry.index !== outlierIndex)
      .map((entry) => entry.value);
    const averageRent = selectedValues.length ? selectedValues.reduce((sum, value) => sum + value, 0) / selectedValues.length : null;
    averageByType[row.type] = row.include ? averageRent : null;

    return {
      hidden: !hasUnits,
      showOutlierToggle: hasUnits && outlierIndex !== null,
      outlierIncluded: row.includeOutlier,
      displayLabel: averageRent === null ? "-" : `${formatCurrency(averageRent, 0)} / mo`,
      averageRent,
    };
  });

  const totalUnits = Object.values(unitMix).reduce((sum, value) => sum + value, 0);
  const annualGrossRent = totalUnits
    ? Object.keys(unitMix).reduce((sum, key) => sum + (averageByType[key] || 0) * unitMix[key] * 12, 0)
    : null;
  const vacancyRate = clampPercent(state.apartment.market.vacancy);
  const expenseRate = clampPercent(state.apartment.market.expensePercent);
  const effectiveGrossIncome = annualGrossRent === null ? null : annualGrossRent * (1 - vacancyRate);
  const annualNoi = effectiveGrossIncome === null ? null : effectiveGrossIncome * (1 - expenseRate);
  const startCapRate = parseLooseNumber(state.apartment.market.startCap);
  const startCapValue = annualNoi === null || startCapRate === null || startCapRate <= 0 ? null : annualNoi / (startCapRate / 100);
  const selectedCapValue = calculateSelectedCapValue(state.apartment.market.startCap, state.apartment.market.selectedCapRate, annualNoi, (nextRate) => {
    state.apartment.market.selectedCapRate = nextRate;
  });

  return { rows, averageByType, annualGrossRent, effectiveGrossIncome, annualNoi, startCapValue, selectedCapValue };
}

function calculateApartmentCurrent(unitMix, marketRentAverages) {
  const vacancyRate = clampPercent(state.apartment.current.vacancy);
  const expenseRate = clampPercent(state.apartment.current.expensePercent);
  let rows;
  let fillPlanRows;
  let baseMonthlyIncome = null;
  let vacantUnits = 0;
  let totalUnits = 0;

  if (state.apartment.current.rentRollMode === "grouped") {
    const marketFillPlanByType = Object.fromEntries(aptRentTypeOptions.map((type) => [type.value, 0]));
    const fixedFillPlanRows = [];
    rows = state.apartment.current.groupedRows.map((row) => {
      const totalUnitsValue = parsePositiveWholeNumber(row.totalUnits);
      const rawVacantUnits = parseLooseNumber(row.vacantUnits);
      const parsedVacantUnits = rawVacantUnits === null ? 0 : Math.max(0, Math.round(rawVacantUnits));
      const vacantCount = totalUnitsValue === null ? parsedVacantUnits : Math.min(parsedVacantUnits, totalUnitsValue);
      const occupiedUnits = totalUnitsValue === null ? null : Math.max(totalUnitsValue - vacantCount, 0);
      const occupiedRent = occupiedUnits === 0 ? 0 : parseLooseNumber(row.occupiedRent);
      const averageOccupiedRent = occupiedUnits && occupiedRent !== null ? occupiedRent / occupiedUnits : null;
      const marketRent = row.type ? marketRentAverages[row.type] ?? null : null;
      const usesFixedRent = row.fillMethod === "fixed";
      if (row.type && totalUnitsValue !== null) {
        totalUnits += totalUnitsValue;
        vacantUnits += vacantCount;
        if (!usesFixedRent) {
          marketFillPlanByType[row.type] += vacantCount;
        } else if (vacantCount > 0) {
          fixedFillPlanRows.push({
            type: row.type,
            vacantUnits: vacantCount,
            sourceLabel: "Fixed Rent",
            rentUsed: averageOccupiedRent,
            monthlyIncome: averageOccupiedRent === null ? null : vacantCount * averageOccupiedRent,
            missingLabel: averageOccupiedRent === null ? "Needs Occupied Avg" : "",
          });
        }
      }
      if (row.type && totalUnitsValue !== null && occupiedRent !== null) baseMonthlyIncome = (baseMonthlyIncome ?? 0) + occupiedRent;
      return {
        type: row.type,
        totalUnits: totalUnitsValue,
        vacantUnits: vacantCount,
        occupiedUnits,
        occupiedRent,
        averageOccupiedRent,
        occupiedUnitsLabel: occupiedUnits === null ? "-" : String(occupiedUnits),
        averageOccupiedRentLabel: averageOccupiedRent === null ? "-" : formatCurrency(averageOccupiedRent, 0),
        fillLabel: row.type && vacantCount > 0
          ? usesFixedRent
            ? averageOccupiedRent === null
              ? "Needs Occupied Avg"
              : `Fill at ${formatCurrency(averageOccupiedRent, 0)}`
            : marketRent === null
              ? "Needs Market Rent"
              : `Fill at ${formatCurrency(marketRent, 0)}`
          : "",
      };
    });
    fillPlanRows = [
      ...aptRentTypeOptions.map((type) => {
        const fillVacantUnits = marketFillPlanByType[type.value];
        const marketRent = marketRentAverages[type.value] ?? null;
        return {
          type: type.value,
          vacantUnits: fillVacantUnits,
          sourceLabel: "Market Rent Avg",
          rentUsed: marketRent,
          monthlyIncome: fillVacantUnits && marketRent !== null ? fillVacantUnits * marketRent : null,
          missingLabel: marketRent === null ? "Needs Market Rent Avg" : "",
        };
      }).filter((row) => row.vacantUnits > 0),
      ...fixedFillPlanRows,
    ];
  } else {
    rows = state.apartment.current.rows.map((row) => {
      const rent = parseLooseNumber(row.rent);
      const isVacant = row.isVacant === true;
      const marketRent = row.type ? marketRentAverages[row.type] ?? null : null;
      const usesFixedRent = row.fillMethod === "fixed";
      if (row.type) {
        totalUnits += 1;
        if (isVacant) vacantUnits += 1;
      }
      return {
        type: row.type,
        rent,
        isVacant,
        marketRent,
        statusLabel: isVacant ? "Vacant" : rent === null ? "-" : formatCurrency(rent, 0),
        fillLabel: isVacant
          ? row.type
            ? usesFixedRent
              ? rent === null
                ? "Needs Fixed Rent"
                : `Fill at ${formatCurrency(rent, 0)}`
              : marketRent === null
                ? "Needs Market Rent"
                : `Fill at ${formatCurrency(marketRent, 0)}`
            : "Select Unit Type"
          : "",
        usesFixedRent,
      };
    });

    fillPlanRows = [
      ...aptRentTypeOptions.map((type) => {
        const fillVacantUnits = rows.filter((row) => row.isVacant && row.type === type.value && !row.usesFixedRent).length;
        const marketRent = marketRentAverages[type.value] ?? null;
        return {
          type: type.value,
          vacantUnits: fillVacantUnits,
          sourceLabel: "Market Rent Avg",
          rentUsed: marketRent,
          monthlyIncome: fillVacantUnits && marketRent !== null ? fillVacantUnits * marketRent : null,
          missingLabel: marketRent === null ? "Needs Market Rent Avg" : "",
        };
      }).filter((row) => row.vacantUnits > 0),
      ...rows
        .filter((row) => row.isVacant && row.type && row.usesFixedRent)
        .map((row) => ({
          type: row.type,
          vacantUnits: 1,
          sourceLabel: "Fixed Rent",
          rentUsed: row.rent,
          monthlyIncome: row.rent === null ? null : row.rent,
          missingLabel: row.rent === null ? "Needs Fixed Rent" : "",
        })),
    ];

    const incomeRows = rows.filter((row) => !row.isVacant && row.rent !== null && row.type);
    baseMonthlyIncome = incomeRows.length ? incomeRows.reduce((sum, row) => sum + row.rent, 0) : null;
  }

  const monthlyFillIncome = fillPlanRows.reduce((sum, row) => sum + (row.monthlyIncome || 0), 0);
  const annualGrossIncomeWithoutFill = baseMonthlyIncome === null ? null : baseMonthlyIncome * 12;
  const effectiveGrossIncomeWithoutFill = annualGrossIncomeWithoutFill === null ? null : annualGrossIncomeWithoutFill * (1 - vacancyRate);
  const annualNoiWithoutFill = effectiveGrossIncomeWithoutFill === null ? null : effectiveGrossIncomeWithoutFill * (1 - expenseRate);
  const monthlyIncomeBeforeVacancy = baseMonthlyIncome === null ? (monthlyFillIncome > 0 ? monthlyFillIncome : null) : baseMonthlyIncome + monthlyFillIncome;
  const annualGrossIncome = monthlyIncomeBeforeVacancy === null ? null : monthlyIncomeBeforeVacancy * 12;
  const effectiveGrossIncome = annualGrossIncome === null ? null : annualGrossIncome * (1 - vacancyRate);
  const annualNoi = effectiveGrossIncome === null ? null : effectiveGrossIncome * (1 - expenseRate);
  const startCapRate = parseLooseNumber(state.apartment.current.startCap);
  const startCapValueWithoutFill = annualNoiWithoutFill === null || startCapRate === null || startCapRate <= 0 ? null : annualNoiWithoutFill / (startCapRate / 100);
  const startCapValue = annualNoi === null || startCapRate === null || startCapRate <= 0 ? null : annualNoi / (startCapRate / 100);
  const selectedCapValue = calculateSelectedCapValue(state.apartment.current.startCap, state.apartment.current.selectedCapRate, annualNoi, (nextRate) => {
    state.apartment.current.selectedCapRate = nextRate;
  });
  const selectedCapValueWithoutFill = annualNoiWithoutFill === null || !Number.isFinite(state.apartment.current.selectedCapRate) || state.apartment.current.selectedCapRate <= 0
    ? null
    : annualNoiWithoutFill / (state.apartment.current.selectedCapRate / 100);

  return {
    rows,
    fillPlanRows,
    monthlyFillIncome,
    baseMonthlyIncome,
    annualGrossIncomeWithoutFill,
    annualNoiWithoutFill,
    startCapValueWithoutFill,
    selectedCapValueWithoutFill,
    annualGrossIncome,
    annualNoi,
    startCapValue,
    selectedCapValue,
    appliedVacancyLabel: `${(vacancyRate * 100).toFixed(1).replace(/\.0$/, "")}%`,
    apartmentVacancyLabel: totalUnits ? `${vacantUnits} / ${totalUnits} (${((vacantUnits / totalUnits) * 100).toFixed(1).replace(/\.0$/, "")}%)` : "-",
  };
}

function renderApartmentCurrentCapResults(calculations) {
  const tbody = elements.apartment.current.capResults;
  tbody.innerHTML = "";
  const startingCap = parseLooseNumber(state.apartment.current.startCap);
  if (startingCap === null || startingCap <= 0) {
    tbody.innerHTML = '<tr><td colspan="3" class="empty-cell">Enter a starting cap rate to generate values.</td></tr>';
    state.apartment.current.selectedCapRate = null;
    derived.apartmentCurrentCopy = null;
    setCopyButtonState(elements.apartment.current.copyBtn, null);
    return;
  }

  const maxCap = startingCap + leaseCapStep * (leaseCapCount - 1);
  const offset = (state.apartment.current.selectedCapRate - startingCap) / leaseCapStep;
  const isValidSelected = Number.isFinite(state.apartment.current.selectedCapRate)
    && state.apartment.current.selectedCapRate >= startingCap
    && state.apartment.current.selectedCapRate <= maxCap
    && Math.abs(offset - Math.round(offset)) < 0.001;
  const resolvedSelected = isValidSelected ? state.apartment.current.selectedCapRate : Number(startingCap.toFixed(2));
  let selectedValueWithFill = null;

  for (let index = 0; index < leaseCapCount; index += 1) {
    const capRate = Number((startingCap + index * leaseCapStep).toFixed(2));
    const impliedValueWithoutFill = calculations.annualNoiWithoutFill === null ? null : calculations.annualNoiWithoutFill / (capRate / 100);
    const impliedValueWithFill = calculations.annualNoi === null ? null : calculations.annualNoi / (capRate / 100);
    const row = document.createElement("tr");
    const isSelected = Math.abs(capRate - resolvedSelected) < 0.001;
    row.className = `cap-row${isSelected ? " is-selected" : ""}`;
    row.innerHTML = `
      <td>${formatCapRateDisplay(capRate)}</td>
      <td>${impliedValueWithoutFill === null ? "-" : formatCurrency(impliedValueWithoutFill, 0)}</td>
      <td>${impliedValueWithFill === null ? "-" : formatCurrency(impliedValueWithFill, 0)}</td>
    `;
    row.tabIndex = 0;
    row.addEventListener("click", () => {
      state.apartment.current.selectedCapRate = capRate;
      renderApartmentCurrent(getApartmentUnitMix());
      copyAmount(impliedValueWithFill, elements.apartment.current.copyBtn, row);
    });
    row.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      state.apartment.current.selectedCapRate = capRate;
      renderApartmentCurrent(getApartmentUnitMix());
      copyAmount(impliedValueWithFill, elements.apartment.current.copyBtn, row);
    });
    if (isSelected) selectedValueWithFill = impliedValueWithFill;
    tbody.appendChild(row);
  }

  state.apartment.current.selectedCapRate = resolvedSelected;
  derived.apartmentCurrentCopy = selectedValueWithFill;
  setCopyButtonState(elements.apartment.current.copyBtn, selectedValueWithFill);
}

function calculateApartmentSale(unitMix) {
  const rows = state.apartment.sale.rows.map((row) => {
    const price = parseLooseNumber(row.price);
    const units = parsePositiveWholeNumber(row.units);
    const sqft = parsePositiveWholeNumber(row.sqft);
    const perUnit = price === null || units === null || units <= 0 ? null : price / units;
    const perSf = price === null || sqft === null || sqft <= 0 ? null : price / sqft;
    return {
      perUnit,
      perSf,
      perUnitLabel: perUnit === null ? "-" : formatCurrency(perUnit, 0),
      perSfLabel: perSf === null ? "-" : `${formatCurrency(perSf, 2)} / SF`,
      isOutlier: false,
    };
  });

  let outlierIndex = -1;
  let highestMetric = -Infinity;
  rows.forEach((row, index) => {
    if (row.perUnit === null) return;
    if (row.perUnit > highestMetric) {
      highestMetric = row.perUnit;
      outlierIndex = index;
    }
  });

  rows.forEach((row, index) => {
    row.isOutlier = index === outlierIndex;
    const sourceRow = state.apartment.sale.rows[index];
    if (!sourceRow) return;
    if (row.isOutlier) {
      if (sourceRow.userTouched !== true) sourceRow.include = false;
    } else if (sourceRow.userTouched !== true) {
      sourceRow.include = true;
    }
  });

  const selectedRows = rows.map((row, index) => ({ row, source: state.apartment.sale.rows[index] })).filter((entry) => entry.source?.include);
  const selectedPerUnit = selectedRows.filter((entry) => entry.row.perUnit !== null).map((entry) => entry.row.perUnit);
  const selectedPerSf = selectedRows.filter((entry) => entry.row.perSf !== null).map((entry) => entry.row.perSf);
  const averagePerUnit = selectedPerUnit.length ? selectedPerUnit.reduce((sum, value) => sum + value, 0) / selectedPerUnit.length : null;
  const averagePerSf = selectedPerSf.length ? selectedPerSf.reduce((sum, value) => sum + value, 0) / selectedPerSf.length : null;
  const subjectUnits = Object.values(unitMix).reduce((sum, value) => sum + value, 0);
  const subjectSqft = parsePositiveWholeNumber(state.apartment.sale.subjectSqft);
  const indicatedPerUnit = averagePerUnit === null || subjectUnits === 0 ? null : averagePerUnit * subjectUnits;
  const indicatedPerSf = averagePerSf === null || subjectSqft === null ? null : averagePerSf * subjectSqft;
  return { rows, averagePerUnit, averagePerSf, indicatedPerUnit, indicatedPerSf };
}

function bindOneToFourSaleEvents() {
  bindSaleEvents({
    tbody: elements.oneToFour.rows,
    rows: state.oneToFour.sale.rows,
    render: renderOneToFour,
    includeAttr: "data-sale-include",
    typeAttr: "data-sale-type",
    priceAttr: "data-sale-price",
    sqftAttr: "data-sale-sqft",
    psfAttr: "data-sale-psf",
    removeAttr: "data-sale-remove",
  });
}

function bindCommercialSaleEvents() {
  bindSaleEvents({
    tbody: elements.commercial.sale.rows,
    rows: state.commercial.sale.rows,
    render: renderCommercialSale,
    includeAttr: "data-commercial-sale-include",
    typeAttr: "data-commercial-sale-type",
    priceAttr: "data-commercial-sale-price",
    sqftAttr: "data-commercial-sale-sqft",
    psfAttr: "data-commercial-sale-psf",
    removeAttr: "data-commercial-sale-remove",
  });
}

function bindSaleEvents({ tbody, rows, render, includeAttr, typeAttr, priceAttr, sqftAttr, psfAttr, removeAttr }) {
  bindRepeatingRows(tbody, {
    removeAttr,
    onRemove: (index) => {
      if (rows.length <= 1) return;
      rows.splice(index, 1);
      render();
    },
  });

  tbody.querySelectorAll(`[${includeAttr}]`).forEach((input) => {
    input.addEventListener("change", () => {
      const row = rows[Number(input.getAttribute(includeAttr))];
      if (!row) return;
      row.include = input.checked;
      row.userTouched = true;
      render();
    });
  });
  tbody.querySelectorAll(`[${typeAttr}]`).forEach((button) => {
    const applyType = () => {
      const row = rows[Number(button.getAttribute(typeAttr))];
      if (!row) return;
      row.listing = button.dataset.saleTypeValue === "listing";
      render();
    };
    button.addEventListener("mousedown", (event) => {
      event.preventDefault();
      applyType();
    });
    button.addEventListener("click", (event) => {
      event.preventDefault();
      applyType();
    });
  });
  tbody.querySelectorAll(`[${sqftAttr}]`).forEach((input) => {
    input.addEventListener("input", () => updateSaleField(rows, Number(input.getAttribute(sqftAttr)), "sqft", input.value, render));
    input.addEventListener("blur", () => {
      const row = rows[Number(input.getAttribute(sqftAttr))];
      if (!row) return;
      row.sqft = formatWholeInput(row.sqft);
      render();
    });
  });
  tbody.querySelectorAll(`[${priceAttr}]`).forEach((input) => {
    input.addEventListener("input", () => updateSaleField(rows, Number(input.getAttribute(priceAttr)), "price", input.value, render));
    input.addEventListener("blur", () => {
      const row = rows[Number(input.getAttribute(priceAttr))];
      if (!row) return;
      row.price = formatMoneyInput(row.price, 0);
      render();
    });
  });
  tbody.querySelectorAll(`[${psfAttr}]`).forEach((input) => {
    input.addEventListener("input", () => updateSaleField(rows, Number(input.getAttribute(psfAttr)), "psf", input.value, render));
    input.addEventListener("blur", () => {
      const row = rows[Number(input.getAttribute(psfAttr))];
      if (!row) return;
      row.psf = formatMoneyInput(row.psf, 2);
      render();
    });
  });
}

function updateSaleField(rows, index, field, value, render) {
  const row = rows[index];
  if (!row) return;
  row[field] = value;
  if (field === "psf" && parseLooseNumber(value) !== null) {
    row.sqft = "";
    row.price = "";
    render();
    return;
  }
  if (field !== "psf" && parseLooseNumber(row.psf) !== null) {
    row.psf = "";
  }
  render();
}

function bindCommercialRentEvents() {
  bindRepeatingRows(elements.commercial.rent.rows, {
    removeAttr: "data-commercial-rent-remove",
    onRemove: (index) => {
      if (state.commercial.rent.rows.length <= 1) return;
      state.commercial.rent.rows.splice(index, 1);
      renderCommercialRent();
    },
  });

  elements.commercial.rent.rows.querySelectorAll("[data-commercial-rent-include]").forEach((input) => {
    input.addEventListener("change", () => {
      const row = state.commercial.rent.rows[Number(input.dataset.commercialRentInclude)];
      if (!row) return;
      row.include = input.checked;
      row.userTouched = true;
      renderCommercialRent();
    });
  });
  elements.commercial.rent.rows.querySelectorAll("[data-commercial-rent-rent]").forEach((input) => {
    input.addEventListener("input", () => {
      const row = state.commercial.rent.rows[Number(input.dataset.commercialRentRent)];
      if (!row) return;
      row.rent = input.value;
      renderCommercialRent();
    });
    input.addEventListener("blur", () => {
      const row = state.commercial.rent.rows[Number(input.dataset.commercialRentRent)];
      if (!row) return;
      row.rent = formatMoneyInput(row.rent, 2);
      renderCommercialRent();
    });
  });
  elements.commercial.rent.rows.querySelectorAll("[data-commercial-rent-type]").forEach((select) => {
    select.addEventListener("change", () => {
      const row = state.commercial.rent.rows[Number(select.dataset.commercialRentType)];
      if (!row) return;
      row.leaseType = select.value;
      renderCommercialRent();
    });
  });
}

function bindCommercialCurrentEvents() {
  bindRepeatingRows(elements.commercial.current.rows, {
    removeAttr: "data-commercial-current-remove",
    onRemove: (index) => {
      if (state.commercial.current.rows.length <= 1) return;
      state.commercial.current.rows.splice(index, 1);
      renderCommercialCurrent();
    },
  });

  elements.commercial.current.rows.querySelectorAll("[data-commercial-current-rent]").forEach((input) => {
    input.addEventListener("input", () => {
      const row = state.commercial.current.rows[Number(input.dataset.commercialCurrentRent)];
      if (!row) return;
      row.rent = input.value;
      renderCommercialCurrent();
    });
    input.addEventListener("blur", () => {
      const row = state.commercial.current.rows[Number(input.dataset.commercialCurrentRent)];
      if (!row) return;
      row.rent = formatMoneyInput(row.rent, 0);
      renderCommercialCurrent();
    });
  });
  elements.commercial.current.rows.querySelectorAll("[data-commercial-current-type]").forEach((select) => {
    select.addEventListener("change", () => {
      const row = state.commercial.current.rows[Number(select.dataset.commercialCurrentType)];
      if (!row) return;
      row.leaseType = select.value;
      renderCommercialCurrent();
    });
  });
}

function bindApartmentCurrentEvents() {
  if (state.apartment.current.rentRollMode === "grouped") {
    bindRepeatingRows(elements.apartment.current.rows, {
      removeAttr: "data-apartment-grouped-remove",
      onRemove: (index) => {
        if (state.apartment.current.groupedRows.length <= 1) return;
        state.apartment.current.groupedRows.splice(index, 1);
        renderApartment();
      },
    });

    elements.apartment.current.rows.querySelectorAll("[data-apartment-grouped-type]").forEach((select) => {
      select.addEventListener("change", () => {
        const row = state.apartment.current.groupedRows[Number(select.dataset.apartmentGroupedType)];
        if (!row) return;
        row.type = select.value;
        renderApartment();
      });
    });
    elements.apartment.current.rows.querySelectorAll("[data-apartment-grouped-fill-method]").forEach((select) => {
      select.addEventListener("change", () => {
        const row = state.apartment.current.groupedRows[Number(select.dataset.apartmentGroupedFillMethod)];
        if (!row) return;
        row.fillMethod = select.value === "fixed" ? "fixed" : "market";
        renderApartment();
      });
    });
    elements.apartment.current.rows.querySelectorAll("[data-apartment-grouped-total-units]").forEach((input) => {
      input.addEventListener("input", () => {
        const row = state.apartment.current.groupedRows[Number(input.dataset.apartmentGroupedTotalUnits)];
        if (!row) return;
        row.totalUnits = input.value;
      });
      input.addEventListener("change", () => {
        const row = state.apartment.current.groupedRows[Number(input.dataset.apartmentGroupedTotalUnits)];
        if (!row) return;
        row.totalUnits = input.value;
        renderApartment();
      });
      input.addEventListener("blur", () => {
        const row = state.apartment.current.groupedRows[Number(input.dataset.apartmentGroupedTotalUnits)];
        if (!row) return;
        row.totalUnits = formatWholeInput(row.totalUnits);
        row.vacantUnits = formatWholeInput(clampGroupedVacantUnits(row.totalUnits, row.vacantUnits));
        renderApartment();
      });
    });
    elements.apartment.current.rows.querySelectorAll("[data-apartment-grouped-occupied-rent]").forEach((input) => {
      input.addEventListener("input", () => {
        const row = state.apartment.current.groupedRows[Number(input.dataset.apartmentGroupedOccupiedRent)];
        if (!row) return;
        row.occupiedRent = input.value;
      });
      input.addEventListener("change", () => {
        const row = state.apartment.current.groupedRows[Number(input.dataset.apartmentGroupedOccupiedRent)];
        if (!row) return;
        row.occupiedRent = input.value;
        renderApartment();
      });
      input.addEventListener("blur", () => {
        const row = state.apartment.current.groupedRows[Number(input.dataset.apartmentGroupedOccupiedRent)];
        if (!row) return;
        const occupiedUnits = getGroupedOccupiedUnits(row);
        row.occupiedRent = occupiedUnits === 0 ? formatMoneyInput("0", 0) : formatMoneyInput(row.occupiedRent, 0);
        renderApartment();
      });
    });
    elements.apartment.current.rows.querySelectorAll("[data-apartment-grouped-vacant-units]").forEach((input) => {
      input.addEventListener("input", () => {
        const row = state.apartment.current.groupedRows[Number(input.dataset.apartmentGroupedVacantUnits)];
        if (!row) return;
        row.vacantUnits = input.value;
      });
      input.addEventListener("change", () => {
        const row = state.apartment.current.groupedRows[Number(input.dataset.apartmentGroupedVacantUnits)];
        if (!row) return;
        row.vacantUnits = input.value;
        renderApartment();
      });
      input.addEventListener("blur", () => {
        const row = state.apartment.current.groupedRows[Number(input.dataset.apartmentGroupedVacantUnits)];
        if (!row) return;
        row.vacantUnits = formatWholeInput(clampGroupedVacantUnits(row.totalUnits, row.vacantUnits));
        renderApartment();
      });
    });
    return;
  }

  bindRepeatingRows(elements.apartment.current.rows, {
    removeAttr: "data-apartment-current-remove",
    onRemove: (index) => {
      if (state.apartment.current.rows.length <= 1) return;
      state.apartment.current.rows.splice(index, 1);
      renderApartment();
    },
  });

  elements.apartment.current.rows.querySelectorAll("[data-apartment-current-type]").forEach((select) => {
    select.addEventListener("change", () => {
      const row = state.apartment.current.rows[Number(select.dataset.apartmentCurrentType)];
      if (!row) return;
      row.type = select.value;
      renderApartment();
    });
  });
  elements.apartment.current.rows.querySelectorAll("[data-apartment-current-vacant]").forEach((input) => {
    input.addEventListener("change", () => {
      const row = state.apartment.current.rows[Number(input.dataset.apartmentCurrentVacant)];
      if (!row) return;
      row.isVacant = input.checked;
      renderApartment();
    });
  });
  elements.apartment.current.rows.querySelectorAll("[data-apartment-current-fill-method]").forEach((select) => {
    select.addEventListener("change", () => {
      const row = state.apartment.current.rows[Number(select.dataset.apartmentCurrentFillMethod)];
      if (!row) return;
      row.fillMethod = select.value === "fixed" ? "fixed" : "market";
      renderApartment();
    });
  });
  elements.apartment.current.rows.querySelectorAll("[data-apartment-current-rent]").forEach((input) => {
    input.addEventListener("input", () => {
      const row = state.apartment.current.rows[Number(input.dataset.apartmentCurrentRent)];
      if (!row) return;
      row.rent = input.value;
      renderApartment();
    });
    input.addEventListener("blur", () => {
      const row = state.apartment.current.rows[Number(input.dataset.apartmentCurrentRent)];
      if (!row) return;
      row.rent = formatMoneyInput(row.rent, 0);
      renderApartment();
    });
  });
}

function bindApartmentMarketEvents() {
  elements.apartment.market.rows.querySelectorAll("[data-apartment-market-include]").forEach((input) => {
    input.addEventListener("change", () => {
      const row = state.apartment.market.rows[Number(input.dataset.apartmentMarketInclude)];
      if (!row) return;
      row.include = input.checked;
      row.userTouched = true;
      renderApartment();
    });
  });
  elements.apartment.market.rows.querySelectorAll("[data-apartment-market-sample]").forEach((input) => {
    input.addEventListener("input", () => {
      const row = state.apartment.market.rows[Number(input.dataset.apartmentMarketSample)];
      if (!row) return;
      row.rents[Number(input.dataset.rentIndex)] = input.value;
      renderApartment();
    });
    input.addEventListener("blur", () => {
      const row = state.apartment.market.rows[Number(input.dataset.apartmentMarketSample)];
      if (!row) return;
      const rentIndex = Number(input.dataset.rentIndex);
      row.rents[rentIndex] = formatMoneyInput(row.rents[rentIndex], 0);
      renderApartment();
    });
  });
  elements.apartment.market.rows.querySelectorAll("[data-apartment-market-outlier]").forEach((button) => {
    button.addEventListener("click", () => {
      const row = state.apartment.market.rows[Number(button.dataset.apartmentMarketOutlier)];
      if (!row) return;
      row.includeOutlier = !row.includeOutlier;
      renderApartment();
    });
  });
}

function bindApartmentSaleEvents() {
  bindRepeatingRows(elements.apartment.sale.rows, {
    removeAttr: "data-apartment-sale-remove",
    onRemove: (index) => {
      if (state.apartment.sale.rows.length <= 1) return;
      state.apartment.sale.rows.splice(index, 1);
      renderApartment();
    },
  });

  elements.apartment.sale.rows.querySelectorAll("[data-apartment-sale-include]").forEach((input) => {
    input.addEventListener("change", () => {
      const row = state.apartment.sale.rows[Number(input.dataset.apartmentSaleInclude)];
      if (!row) return;
      row.include = input.checked;
      row.userTouched = true;
      renderApartment();
    });
  });
  elements.apartment.sale.rows.querySelectorAll("[data-apartment-sale-price]").forEach((input) => {
    input.addEventListener("input", () => {
      const row = state.apartment.sale.rows[Number(input.dataset.apartmentSalePrice)];
      if (!row) return;
      row.price = input.value;
      renderApartment();
    });
    input.addEventListener("blur", () => {
      const row = state.apartment.sale.rows[Number(input.dataset.apartmentSalePrice)];
      if (!row) return;
      row.price = formatMoneyInput(row.price, 0);
      renderApartment();
    });
  });
  elements.apartment.sale.rows.querySelectorAll("[data-apartment-sale-units]").forEach((input) => {
    input.addEventListener("input", () => {
      const row = state.apartment.sale.rows[Number(input.dataset.apartmentSaleUnits)];
      if (!row) return;
      row.units = input.value;
      renderApartment();
    });
    input.addEventListener("blur", () => {
      const row = state.apartment.sale.rows[Number(input.dataset.apartmentSaleUnits)];
      if (!row) return;
      row.units = formatWholeInput(row.units);
      renderApartment();
    });
  });
  elements.apartment.sale.rows.querySelectorAll("[data-apartment-sale-sqft]").forEach((input) => {
    input.addEventListener("input", () => {
      const row = state.apartment.sale.rows[Number(input.dataset.apartmentSaleSqft)];
      if (!row) return;
      row.sqft = input.value;
      renderApartment();
    });
    input.addEventListener("blur", () => {
      const row = state.apartment.sale.rows[Number(input.dataset.apartmentSaleSqft)];
      if (!row) return;
      row.sqft = formatWholeInput(row.sqft);
      renderApartment();
    });
  });
}

function ensureLeaseTrailingEmptyRow(rows) {
  if (!rows.length) {
    rows.push(createLeaseRow());
    return;
  }
  if (rows.length === 1 && leaseRowHasData(rows[0])) {
    rows.push(createLeaseRow());
    return;
  }
  const emptyIndexes = rows.map((row, index) => ({ row, index })).filter((entry) => !leaseRowHasData(entry.row));
  if (emptyIndexes.length > 1) emptyIndexes.slice(0, -1).reverse().forEach((entry) => rows.splice(entry.index, 1));
  const lastRow = rows[rows.length - 1];
  if (leaseRowHasData(lastRow)) rows.push(createLeaseRow());
}

function ensureSaleTrailingEmptyRow(rows) {
  if (!rows.length) {
    rows.push(createSaleRow());
    return;
  }
  if (rows.length === 1 && saleRowHasData(rows[0])) {
    rows.push(createSaleRow());
    return;
  }
  const emptyIndexes = rows.map((row, index) => ({ row, index })).filter((entry) => !saleRowHasData(entry.row));
  if (emptyIndexes.length > 1) emptyIndexes.slice(0, -1).reverse().forEach((entry) => rows.splice(entry.index, 1));
  const lastRow = rows[rows.length - 1];
  if (saleRowHasData(lastRow)) rows.push(createSaleRow());
}

function ensureAptSaleTrailingEmptyRow(rows) {
  if (!rows.length) {
    rows.push(createAptSaleRow());
    return;
  }
  if (rows.length === 1 && aptSaleRowHasData(rows[0])) {
    rows.push(createAptSaleRow());
    return;
  }
  const emptyIndexes = rows.map((row, index) => ({ row, index })).filter((entry) => !aptSaleRowHasData(entry.row));
  if (emptyIndexes.length > 1) emptyIndexes.slice(0, -1).reverse().forEach((entry) => rows.splice(entry.index, 1));
  const lastRow = rows[rows.length - 1];
  if (aptSaleRowHasData(lastRow)) rows.push(createAptSaleRow());
}

function ensureCurrentRentCommercialTrailingEmptyRow() {
  const rows = state.commercial.current.rows;
  if (!rows.length) {
    rows.push(createCurrentRentCommercialRow());
    return;
  }
  if (rows.length === 1 && currentRentCommercialRowHasData(rows[0])) {
    rows.push(createCurrentRentCommercialRow());
    return;
  }
  const emptyIndexes = rows.map((row, index) => ({ row, index })).filter((entry) => !currentRentCommercialRowHasData(entry.row));
  if (emptyIndexes.length > 1) emptyIndexes.slice(0, -1).reverse().forEach((entry) => rows.splice(entry.index, 1));
  const lastRow = rows[rows.length - 1];
  if (currentRentCommercialRowHasData(lastRow)) rows.push(createCurrentRentCommercialRow());
}

function ensureApartmentRentRollTrailingEmptyRow() {
  const rows = state.apartment.current.rows;
  if (!rows.length) {
    rows.push(createApartmentRentRollRow());
    return;
  }
  if (rows.length === 1 && apartmentRentRollRowHasData(rows[0])) {
    rows.push(createApartmentRentRollRow());
    return;
  }
  const emptyIndexes = rows.map((row, index) => ({ row, index })).filter((entry) => !apartmentRentRollRowHasData(entry.row));
  if (emptyIndexes.length > 1) emptyIndexes.slice(0, -1).reverse().forEach((entry) => rows.splice(entry.index, 1));
  const lastRow = rows[rows.length - 1];
  if (apartmentRentRollRowHasData(lastRow)) rows.push(createApartmentRentRollRow());
}

function ensureApartmentGroupedRentRollTrailingEmptyRow() {
  const rows = state.apartment.current.groupedRows;
  if (!rows.length) {
    rows.push(createApartmentGroupedRentRollRow());
    return;
  }
  if (rows.length === 1 && apartmentGroupedRentRollRowHasData(rows[0])) {
    rows.push(createApartmentGroupedRentRollRow());
    return;
  }
  const emptyIndexes = rows.map((row, index) => ({ row, index })).filter((entry) => !apartmentGroupedRentRollRowHasData(entry.row));
  if (emptyIndexes.length > 1) emptyIndexes.slice(0, -1).reverse().forEach((entry) => rows.splice(entry.index, 1));
  const lastRow = rows[rows.length - 1];
  if (apartmentGroupedRentRollRowHasData(lastRow)) rows.push(createApartmentGroupedRentRollRow());
}

function leaseRowHasData(row) {
  return parseLooseNumber(row?.rent || "") !== null;
}

function saleRowHasData(row) {
  return parseLooseNumber(row?.sqft || "") !== null || parseLooseNumber(row?.price || "") !== null || parseLooseNumber(row?.psf || "") !== null;
}

function aptSaleRowHasData(row) {
  return parseLooseNumber(row?.price || "") !== null || parseLooseNumber(row?.units || "") !== null || parseLooseNumber(row?.sqft || "") !== null;
}

function currentRentCommercialRowHasData(row) {
  return parseLooseNumber(row?.rent || "") !== null;
}

function apartmentRentRollRowHasData(row) {
  return String(row?.type || "").trim() !== ""
    || parseLooseNumber(row?.rent || "") !== null
    || row?.isVacant === true
    || row?.fillMethod === "fixed";
}

function apartmentGroupedRentRollRowHasData(row) {
  return String(row?.type || "").trim() !== ""
    || parseLooseNumber(row?.totalUnits || "") !== null
    || parseLooseNumber(row?.occupiedRent || "") !== null
    || parseLooseNumber(row?.vacantUnits || "") !== null
    || row?.fillMethod === "fixed";
}

function clampGroupedVacantUnits(totalUnitsRaw, vacantUnitsRaw) {
  const totalUnits = parsePositiveWholeNumber(totalUnitsRaw);
  const vacantUnits = parseLooseNumber(vacantUnitsRaw);
  if (vacantUnits === null) return "";
  const roundedVacantUnits = Math.max(0, Math.round(vacantUnits));
  if (totalUnits === null) return String(roundedVacantUnits);
  return String(Math.min(totalUnits, roundedVacantUnits));
}

function getGroupedOccupiedUnits(row) {
  const totalUnits = parsePositiveWholeNumber(row?.totalUnits);
  if (totalUnits === null) return null;
  const vacantUnits = parseLooseNumber(row?.vacantUnits);
  const roundedVacantUnits = vacantUnits === null ? 0 : Math.max(0, Math.round(vacantUnits));
  return Math.max(totalUnits - Math.min(totalUnits, roundedVacantUnits), 0);
}

function clearPageSection(sectionKey, button) {
  const defaults = createDefaultState();
  if (sectionKey === "oneToFourSale") state.oneToFour.sale = defaults.oneToFour.sale;
  if (sectionKey === "commercialRent") state.commercial.rent = defaults.commercial.rent;
  if (sectionKey === "commercialSale") state.commercial.sale = defaults.commercial.sale;
  if (sectionKey === "commercialCurrent") state.commercial.current = defaults.commercial.current;
  if (sectionKey === "apartmentCurrent") state.apartment.current = defaults.apartment.current;
  if (sectionKey === "apartmentMarket") state.apartment.market = defaults.apartment.market;
  if (sectionKey === "apartmentSale") state.apartment.sale = defaults.apartment.sale;
  renderAll();
  flashButton(button, "Cleared");
}

function bindCopyValueTrigger(element, getAmount, feedbackButton) {
  if (!element) return;
  const handler = () => copyAmount(getAmount(), feedbackButton, element);
  element.addEventListener("click", handler);
  element.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    handler();
  });
}

function renderCapResults({ tbody, startCapRaw, selectedCapRate, annualNoiAfterVacancy, onSelect, emptyMessage, storeSelected, copyButton }) {
  tbody.innerHTML = "";
  const startingCap = parseLooseNumber(startCapRaw);
  if (startingCap === null || startingCap <= 0) {
    tbody.innerHTML = `<tr><td colspan="2" class="empty-cell">${escapeHtml(emptyMessage)}</td></tr>`;
    storeSelected(null, null);
    return;
  }

  const maxCap = startingCap + leaseCapStep * (leaseCapCount - 1);
  const offset = (selectedCapRate - startingCap) / leaseCapStep;
  const isValidSelected = Number.isFinite(selectedCapRate) && selectedCapRate >= startingCap && selectedCapRate <= maxCap && Math.abs(offset - Math.round(offset)) < 0.001;
  const resolvedSelected = isValidSelected ? selectedCapRate : Number(startingCap.toFixed(2));
  let selectedValue = null;

  for (let index = 0; index < leaseCapCount; index += 1) {
    const capRate = Number((startingCap + index * leaseCapStep).toFixed(2));
    const impliedValue = annualNoiAfterVacancy === null ? null : annualNoiAfterVacancy / (capRate / 100);
    const row = document.createElement("tr");
    const isSelected = Math.abs(capRate - resolvedSelected) < 0.001;
    row.className = `cap-row${isSelected ? " is-selected" : ""}`;
    row.innerHTML = `<td>${formatCapRateDisplay(capRate)}</td><td>${impliedValue === null ? "-" : formatCurrency(impliedValue, 0)}</td>`;
    row.tabIndex = 0;
    row.addEventListener("click", () => {
      onSelect(capRate);
      copyAmount(impliedValue, copyButton, row);
    });
    row.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      onSelect(capRate);
      copyAmount(impliedValue, copyButton, row);
    });
    if (isSelected) selectedValue = impliedValue;
    tbody.appendChild(row);
  }
  storeSelected(resolvedSelected, selectedValue);
}

function calculateSelectedCapValue(startCapRaw, selectedCapRate, annualNoiAfterVacancy, setSelected) {
  const startingCap = parseLooseNumber(startCapRaw);
  if (startingCap === null || startingCap <= 0 || annualNoiAfterVacancy === null) return null;
  const maxCap = startingCap + leaseCapStep * (leaseCapCount - 1);
  const offset = (selectedCapRate - startingCap) / leaseCapStep;
  const isValidSelected = Number.isFinite(selectedCapRate) && selectedCapRate >= startingCap && selectedCapRate <= maxCap && Math.abs(offset - Math.round(offset)) < 0.001;
  const resolvedSelected = isValidSelected ? selectedCapRate : Number(startingCap.toFixed(2));
  setSelected(resolvedSelected);
  return annualNoiAfterVacancy / (resolvedSelected / 100);
}

function setCopyButtonState(button, amount) {
  if (!button) return;
  button.disabled = !(Number.isFinite(amount) && amount > 0);
}

async function copyAmount(amount, button, target) {
  if (!(Number.isFinite(amount) && amount > 0)) {
    flashButton(button, "No Value");
    flashCopyTarget(target, "no-value");
    return;
  }
  try {
    await copyTextToClipboard(formatClipboardAmount(amount));
    flashButton(button, "Copied");
    flashCopyTarget(target, "copied");
  } catch (error) {
    flashButton(button, "Copy Failed");
    flashCopyTarget(target, "copy-failed");
  }
}

async function copyTextToClipboard(text) {
  if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
    await navigator.clipboard.writeText(text);
    return;
  }
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "absolute";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  document.body.removeChild(textarea);
  if (!copied) throw new Error("Clipboard write failed");
}

function flashButton(button, text) {
  if (!button) return;
  const original = button.dataset.originalLabel || button.textContent;
  button.dataset.originalLabel = original;
  button.textContent = text;
  window.clearTimeout(button._flashTimer);
  button._flashTimer = window.setTimeout(() => {
    button.textContent = original;
  }, 1400);
}

function flashCopyTarget(target, stateName) {
  if (!(target instanceof HTMLElement)) return;
  target.dataset.copyState = stateName;
  window.clearTimeout(target._copyStateTimer);
  target._copyStateTimer = window.setTimeout(() => {
    delete target.dataset.copyState;
  }, 1400);
}

function bindRepeatingRows(container, { removeAttr, onRemove }) {
  container.querySelectorAll(`[${removeAttr}]`).forEach((button) => {
    button.addEventListener("click", () => onRemove(Number(button.getAttribute(removeAttr))));
  });
}

function getAptRentTypeLabel(typeValue) {
  const match = aptRentTypeOptions.find((type) => type.value === typeValue);
  return match ? match.label : "Unit";
}

function getLeaseExpenseRate(leaseType) {
  const key = String(leaseType || "nnn").trim().toLowerCase();
  return leaseExpenseRates[key] ?? leaseExpenseRates.nnn;
}

function parseLooseNumber(raw) {
  if (raw === null || raw === undefined || raw === "") return null;
  const cleaned = String(raw).replace(/[^0-9.-]/g, "");
  if (!cleaned || cleaned === "-" || cleaned === "." || cleaned === "-.") return null;
  const parsed = Number.parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function parsePositiveWholeNumber(raw) {
  const parsed = parseLooseNumber(raw);
  if (parsed === null || parsed <= 0) return null;
  return Math.round(parsed);
}

function formatCurrency(value, decimals = 0) {
  const normalized = Number.isFinite(value) ? Math.abs(value) : 0;
  const prefix = value < 0 ? "-" : "";
  return `${prefix}$${normalized.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
}

function formatClipboardAmount(value) {
  if (!Number.isFinite(value)) return "";
  const rounded = Math.round(value);
  const normalized = Math.abs(rounded);
  const prefix = rounded < 0 ? "-" : "";
  return `${prefix}${normalized.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatMoneyInput(raw, decimals = 0) {
  const parsed = parseLooseNumber(raw);
  if (parsed === null) return "";
  return formatCurrency(parsed, decimals);
}

function formatWholeInput(raw) {
  const parsed = parsePositiveWholeNumber(raw);
  return parsed === null ? "" : parsed.toLocaleString("en-US");
}

function formatPercentInput(raw, max) {
  const parsed = parseLooseNumber(raw);
  if (parsed === null) return "0";
  const clamped = Math.max(0, Math.min(max, parsed));
  return clamped.toFixed(1).replace(/\.0$/, "");
}

function formatCapInput(raw) {
  const parsed = parseLooseNumber(raw);
  if (parsed === null || parsed <= 0) return "";
  return (Math.round(parsed * 2) / 2).toFixed(1);
}

function formatCapRateDisplay(value) {
  const decimals = Number.isInteger(value * 10) ? 1 : 2;
  return `${value.toFixed(decimals)}%`;
}

function clampPercent(raw) {
  const parsed = parseLooseNumber(raw);
  if (parsed === null) return 0;
  return Math.max(0, Math.min(100, parsed)) / 100;
}

function persistState() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    // Ignore local storage failures so the tool still works in restricted environments.
  }
}

function escapeHtml(value) {
  return String(value || "").replace(/[&<>"']/g, (match) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[match] || match));
}
