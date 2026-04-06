const STORAGE_KEY = "loftools-state-v1";
const leaseCapStep = 0.5;
const leaseCapCount = 5;
const aptRentTypeOptions = [
  { value: "studio", label: "Studio" },
  { value: "onebed", label: "1 Bed" },
  { value: "twobed", label: "2 Bed" },
  { value: "threebed", label: "3 Bed" },
  { value: "fourbed", label: "4 Bed" },
  { value: "fivebed", label: "5 Bed" },
];
const aptRentTypeAliases = {
  studio: "studio",
  s: "studio",
  st: "studio",
  std: "studio",
  "0": "studio",
  "0bed": "studio",
  "0 bed": "studio",
  one: "onebed",
  onebed: "onebed",
  "one bed": "onebed",
  "1": "onebed",
  "1bed": "onebed",
  "1 bed": "onebed",
  two: "twobed",
  twobed: "twobed",
  "two bed": "twobed",
  "2": "twobed",
  "2bed": "twobed",
  "2 bed": "twobed",
  three: "threebed",
  threebed: "threebed",
  "three bed": "threebed",
  "3": "threebed",
  "3bed": "threebed",
  "3 bed": "threebed",
  four: "fourbed",
  fourbed: "fourbed",
  "four bed": "fourbed",
  "4": "fourbed",
  "4bed": "fourbed",
  "4 bed": "fourbed",
  five: "fivebed",
  fivebed: "fivebed",
  "five bed": "fivebed",
  "5": "fivebed",
  "5bed": "fivebed",
  "5 bed": "fivebed",
};
const leaseExpenseRates = {
  nnn: 0.1,
  modified: 0.2,
  gross: 0.25,
};
const consumerDebtOutcomeMatrix = {
  "Commercial Property": {
    Purchase: "We can lend. This is a business purpose loan.",
    "Refinance of Existing Debt": "We can lend. This is a business purpose loan.",
    "Cash Out to Improve Subject Property": "We can lend. This is a business purpose loan.",
    "Cash Out for Business Purpose": "We can lend. This is a business purpose loan.",
    "Cash Out for Personal Use": "We can lend, but a loan on a commercial property for consumer purposes does not require an NMLS license and does require special disclosure forms with attorney assistance.",
  },
  "Rental 1-4 Unit": {
    Purchase: "We can lend. This is a business purpose loan.",
    "Refinance of Existing Debt": "We can lend. This is a business purpose loan.",
    "Cash Out to Improve Subject Property": "We can lend. This is a business purpose loan.",
    "Cash Out for Business Purpose": "We can lend. This is a business purpose loan.",
    "Cash Out for Personal Use": "Pass. Cash-out for personal use on 1-4 unit properties is considered a consumer loan and requires an NMLS license.",
  },
  "Flip 1-4 Unit": {
    Purchase: "flipper-check",
    "Refinance of Existing Debt": "flipper-check",
    "Cash Out to Improve Subject Property": "flipper-check",
    "Cash Out for Business Purpose": "We can lend. This is a business purpose loan.",
    "Cash Out for Personal Use": "Pass. Cash-out for personal use on 1-4 unit properties is considered a consumer loan and requires an NMLS license.",
  },
  "OO SFR or Duplex": {
    Purchase: "Pass. Loans to purchase owner-occupied homes are consumer loans and require an NMLS license.",
    "Refinance of Existing Debt": "Pass. Loans to refinance owner-occupied homes are consumer loans and require an NMLS license.",
    "Cash Out to Improve Subject Property": "Pass. Loans to improve an owner-occupied 1-4 unit property are consumer loans and require an NMLS license.",
    "Cash Out for Business Purpose": "We can lend, but cash-out on an owner-occupied residential property for business purpose is exempt from consumer-loan regulation. Read the owner-occupied lending primary-residence guidelines carefully.",
    "Cash Out for Personal Use": "Pass. Cash-out for personal use on 1-4 unit properties is considered a consumer loan and requires an NMLS license.",
  },
  "OO 3-4 Unit": {
    Purchase: "We can lend. This is a business purpose loan; even if one unit is owner-occupied, the majority of units are rented.",
    "Refinance of Existing Debt": "We can lend. This is a business purpose loan; even if one unit is owner-occupied, the majority of units are rented.",
    "Cash Out to Improve Subject Property": "We can lend. This is a business purpose loan; even if one unit is owner-occupied, the majority of units are rented.",
    "Cash Out for Business Purpose": "We can lend. This is a business purpose loan; even if one unit is owner-occupied, the majority of units are rented.",
    "Cash Out for Personal Use": "Pass. Cash-out for personal use on 1-4 unit properties is considered a consumer loan and requires an NMLS license.",
  },
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
        fivebed: document.getElementById("apartment-mix-fivebed"),
      },
      averages: {
        studio: document.getElementById("apartment-market-avg-studio"),
        onebed: document.getElementById("apartment-market-avg-onebed"),
        twobed: document.getElementById("apartment-market-avg-twobed"),
        threebed: document.getElementById("apartment-market-avg-threebed"),
        fourbed: document.getElementById("apartment-market-avg-fourbed"),
        fivebed: document.getElementById("apartment-market-avg-fivebed"),
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
      listingDiscount: document.getElementById("apartment-sale-listing-discount"),
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
  consumerDebt: {
    backBtn: document.getElementById("consumer-debt-back-btn"),
    clearBtn: document.getElementById("consumer-debt-clear-btn"),
    content: document.getElementById("consumer-debt-content"),
  },
  loi: {
    clearBtn: document.getElementById("loi-clear-btn"),
    first: {
      loanAmount: document.getElementById("loi-first-loan-amount"),
      interestRate: document.getElementById("loi-first-interest-rate"),
      monthlyPayment: document.getElementById("loi-first-monthly-payment"),
      originationPoints: document.getElementById("loi-first-origination-points"),
      originationFeeAmount: document.getElementById("loi-first-origination-fee"),
      brokerPoints: document.getElementById("loi-first-broker-points"),
      brokerFeeAmount: document.getElementById("loi-first-broker-fee"),
    },
    second: {
      loanAmount: document.getElementById("loi-second-loan-amount"),
      interestRate: document.getElementById("loi-second-interest-rate"),
      monthlyPayment: document.getElementById("loi-second-monthly-payment"),
      originationPoints: document.getElementById("loi-second-origination-points"),
      originationFeeAmount: document.getElementById("loi-second-origination-fee"),
      brokerPoints: document.getElementById("loi-second-broker-points"),
      brokerFeeAmount: document.getElementById("loi-second-broker-fee"),
    },
    blended: {
      loanAmount: document.getElementById("loi-blended-loan-amount"),
      interestRate: document.getElementById("loi-blended-interest-rate"),
      originationFee: document.getElementById("loi-blended-origination-fee"),
      originationPoints: document.getElementById("loi-blended-origination-points"),
      monthlyPayment: document.getElementById("loi-blended-monthly-payment"),
    },
  },
  loanDocs: {
    search: document.getElementById("loan-docs-search"),
    scenarios: document.getElementById("loan-docs-scenarios"),
    title: document.getElementById("loan-docs-title"),
    summary: document.getElementById("loan-docs-summary"),
    guidance: document.getElementById("loan-docs-guidance"),
    fields: document.getElementById("loan-docs-fields"),
    inputGrid: document.getElementById("loan-docs-input-grid"),
    targets: document.getElementById("loan-docs-targets"),
    clearBtn: document.getElementById("loan-docs-clear-btn"),
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
        listingDiscount: "0",
        subjectSqft: "",
        rows: [createAptSaleRow()],
      },
    },
    consumerDebt: createConsumerDebtDefaults(),
    loi: {
      first: createLoiLoanDefaults(),
      second: createLoiLoanDefaults(),
    },
    loanDocs: createLoanDocsDefaults(),
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
    consumerDebt: normalizeConsumerDebt(input?.consumerDebt, fallback.consumerDebt),
    loi: {
      first: normalizeLoiLoan(input?.loi?.first, fallback.loi.first),
      second: normalizeLoiLoan(input?.loi?.second, fallback.loi.second),
    },
    loanDocs: normalizeLoanDocs(input?.loanDocs, fallback.loanDocs),
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
    consumerDebt: fallback.consumerDebt,
    loi: {
      first: fallback.loi.first,
      second: fallback.loi.second,
    },
    loanDocs: fallback.loanDocs,
  };
}

function normalizeActiveTab(activeTab, fallback) {
  if (["oneToFour", "commercial", "apartment", "consumerDebt", "loi", "loanDocs"].includes(activeTab)) return activeTab;
  return fallback;
}

function normalizeLegacyActiveTab(activeTab) {
  if (activeTab === "sale") return "oneToFour";
  if (activeTab === "rent" || activeTab === "lease" || activeTab === "currentRent") return "commercial";
  if (activeTab === "aptSale" || activeTab === "aptRent") return "apartment";
  return "oneToFour";
}

function createConsumerDebtDefaults() {
  return {
    step: 0,
    history: [],
    entityChoice: null,
    managerAsked: false,
    managerChoice: null,
    isCommercial: null,
    isPersonalCashOut: null,
    loanPurpose: null,
    inherited: null,
    inheritedOccupied: null,
    inheritedRentalIntent: null,
    propertyChoice: null,
    ownerOcc: null,
    ooConfig: null,
    useChoice: null,
    flipperCheck: null,
  };
}

function normalizeConsumerDebt(input, fallback) {
  const normalizeYesNo = (value) => (value === "Yes" || value === "No" ? value : null);
  const normalizeChoice = (value, allowed) => (allowed.includes(value) ? value : null);
  const history = Array.isArray(input?.history)
    ? input.history.map((value) => Number.parseInt(value, 10)).filter((value) => Number.isFinite(value))
    : fallback.history;

  return {
    step: Number.isFinite(input?.step) ? input.step : fallback.step,
    history,
    entityChoice: normalizeChoice(input?.entityChoice, [
      "Yes",
      "No - Individual / Trust",
      "No - New Single-Purpose Entity",
    ]),
    managerAsked: input?.managerAsked === true,
    managerChoice: normalizeChoice(input?.managerChoice, [
      "Yes",
      "No - Manager is individual / family trust",
    ]),
    isCommercial: typeof input?.isCommercial === "boolean" ? input.isCommercial : null,
    isPersonalCashOut: typeof input?.isPersonalCashOut === "boolean" ? input.isPersonalCashOut : null,
    loanPurpose: normalizeChoice(input?.loanPurpose, [
      "Purchase",
      "Refinance of Existing Debt",
      "Cash Out to Improve Subject Property",
      "Cash Out for Business Purpose",
      "Cash Out for Personal Use",
      "BusinessPurposeAuto",
    ]),
    inherited: normalizeYesNo(input?.inherited),
    inheritedOccupied: normalizeYesNo(input?.inheritedOccupied),
    inheritedRentalIntent: normalizeYesNo(input?.inheritedRentalIntent),
    propertyChoice: normalizeChoice(input?.propertyChoice, ["SFR", "Duplex", "Triplex", "Quadruplex"]),
    ownerOcc: normalizeYesNo(input?.ownerOcc),
    ooConfig: normalizeChoice(input?.ooConfig, ["SFR_Duplex", "MajorityRented", "NotMajority"]),
    useChoice: normalizeChoice(input?.useChoice, ["Rental", "Flip"]),
    flipperCheck: normalizeYesNo(input?.flipperCheck),
  };
}

function normalizeLoiLoan(input, fallback) {
  const migratedInterestRate = Array.isArray(input?.ratePeriods)
    ? input.ratePeriods.find((period) => parseLooseNumber(period?.monthlyRatePercent) !== null)?.monthlyRatePercent
    : null;

  return {
    loanAmount: String(input?.loanAmount || ""),
    interestRate: String(input?.interestRate ?? migratedInterestRate ?? fallback.interestRate),
    originationPoints: String(input?.originationPoints || ""),
    originationFeeAmount: String(input?.originationFeeAmount || ""),
    brokerPoints: String(input?.brokerPoints || ""),
    brokerFeeAmount: String(input?.brokerFeeAmount || ""),
    originationFeeSource: input?.originationFeeSource === "amount" || input?.feeSource === "amount" ? "amount" : "points",
    brokerFeeSource: input?.brokerFeeSource === "amount" ? "amount" : "points",
  };
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
              ? [0, 1, 2, 3, 4].map((index) => String(match.rents[index] || ""))
              : ["", "", "", "", ""],
          };
        })
      : fallback.rows,
  };
}

function normalizeApartmentSale(input, fallback) {
  return {
    enablePerSf: input?.enablePerSf === true || input?.method === "perSf",
    listingDiscount: String(input?.listingDiscount || fallback.listingDiscount),
    subjectSqft: String(input?.subjectSqft || ""),
    rows: Array.isArray(input?.rows) && input.rows.length
      ? input.rows.map((row) => ({
        price: String(row?.price || ""),
        units: String(row?.units || ""),
        sqft: String(row?.sqft || ""),
        listing: row?.listing === true,
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
  return { price: "", units: "", sqft: "", listing: false, include: true, userTouched: false };
}

function createAptRentRow(type) {
  return { type, include: true, userTouched: false, includeOutlier: false, rents: ["", "", "", "", ""] };
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

function createLoiLoanDefaults() {
  return {
    loanAmount: "",
    interestRate: "",
    originationPoints: "",
    originationFeeAmount: "",
    brokerPoints: "",
    brokerFeeAmount: "",
    originationFeeSource: "points",
    brokerFeeSource: "points",
  };
}

function createLoanDocsDefaults() {
  const firstScenario = LOAN_DOC_SCENARIOS[0]?.id || "";
  return {
    searchQuery: "",
    selectedScenarioId: firstScenario,
    selectedTargetId: null,
    expandedTargets: {},
    inputs: Object.fromEntries(LOAN_DOC_SCENARIOS.map((scenario) => [
      scenario.id,
      Object.fromEntries((scenario.fields || []).map((field) => [field.id, field.defaultValue ?? (field.type === "checkbox" ? false : "")])),
    ])),
  };
}

function normalizeLoanDocs(input, fallback) {
  const inputs = { ...fallback.inputs };
  if (input?.inputs && typeof input.inputs === "object") {
    Object.keys(inputs).forEach((scenarioId) => {
      const scenario = getLoanDocScenarioById(scenarioId);
      const rawScenarioInputs = input.inputs?.[scenarioId];
      if (!scenario || !rawScenarioInputs || typeof rawScenarioInputs !== "object") return;
      scenario.fields.forEach((field) => {
        const rawValue = rawScenarioInputs[field.id];
        inputs[scenarioId][field.id] = field.type === "checkbox" ? rawValue === true : String(rawValue ?? inputs[scenarioId][field.id] ?? "");
      });
    });
  }

  const expandedTargets = {};
  if (input?.expandedTargets && typeof input.expandedTargets === "object") {
    Object.entries(input.expandedTargets).forEach(([key, value]) => {
      expandedTargets[key] = value === true;
    });
  }

  const selectedScenarioId = getLoanDocScenarioById(input?.selectedScenarioId) ? input.selectedScenarioId : fallback.selectedScenarioId;
  return {
    searchQuery: String(input?.searchQuery || ""),
    selectedScenarioId,
    selectedTargetId: typeof input?.selectedTargetId === "string" ? input.selectedTargetId : null,
    expandedTargets,
    inputs,
  };
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
  bindInput(elements.apartment.sale.listingDiscount, (value) => {
    state.apartment.sale.listingDiscount = value;
    renderApartment();
  });
  elements.apartment.sale.listingDiscount?.addEventListener("blur", () => {
    state.apartment.sale.listingDiscount = formatPercentInput(state.apartment.sale.listingDiscount, 100);
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

  elements.consumerDebt.backBtn?.addEventListener("click", () => consumerDebtGoBack());
  elements.consumerDebt.clearBtn?.addEventListener("click", () => clearPageSection("consumerDebt", elements.consumerDebt.clearBtn));

  bindLoiLoanFieldEvents("first");
  bindLoiLoanFieldEvents("second");
  elements.loi.clearBtn?.addEventListener("click", () => clearPageSection("loi", elements.loi.clearBtn));

  bindInput(elements.loanDocs.search, (value) => {
    state.loanDocs.searchQuery = value;
    renderLoanDocs();
  });
  elements.loanDocs.clearBtn?.addEventListener("click", () => clearPageSection("loanDocs", elements.loanDocs.clearBtn));

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
  shouldSelectFocusedField = true;
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
  const activeTabButton = elements.tabs.find((tab) => tab.dataset.tab === state.activeTab);

  if (state.activeTab === "oneToFour") {
  bindTabSequence([
      activeTabButton,
      elements.oneToFour.subjectSqft,
      elements.oneToFour.listingDiscount,
      ...Array.from(elements.oneToFour.rows.querySelectorAll("[data-sale-price], [data-sale-sqft], [data-sale-psf]")).sort(sortSaleInputs),
    ]);
    return;
  }

  if (state.activeTab === "commercial") {
    bindTabSequence([
      activeTabButton,
      elements.commercial.subjectSqft,
      elements.commercial.current.startCap,
      elements.commercial.current.additionalIncome,
      elements.commercial.current.vacancy,
      ...Array.from(elements.commercial.current.rows.querySelectorAll("[data-commercial-current-rent], [data-commercial-current-type]")).sort(sortCurrentCommercialInputs),
      elements.commercial.rent.vacancy,
      elements.commercial.rent.startCap,
      ...Array.from(elements.commercial.rent.rows.querySelectorAll("[data-commercial-rent-rent], [data-commercial-rent-type]")).sort(sortCommercialRentInputs),
      elements.commercial.sale.listingDiscount,
      ...Array.from(elements.commercial.sale.rows.querySelectorAll("[data-commercial-sale-price], [data-commercial-sale-sqft], [data-commercial-sale-psf]")).sort(sortCommercialSaleInputs),
    ]);
    return;
  }

  if (state.activeTab === "apartment") {
    bindTabSequence([
      activeTabButton,
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
      elements.apartment.sale.listingDiscount,
      ...(state.apartment.sale.enablePerSf ? [elements.apartment.sale.subjectSqft] : []),
      ...Array.from(elements.apartment.sale.rows.querySelectorAll("[data-apartment-sale-price], [data-apartment-sale-units], [data-apartment-sale-sqft]"))
        .filter((input) => state.apartment.sale.enablePerSf || !input.hasAttribute("data-apartment-sale-sqft"))
        .sort(sortApartmentSaleInputs),
    ]);
    return;
  }

  if (state.activeTab === "consumerDebt") {
    bindTabSequence([
      activeTabButton,
      ...(elements.consumerDebt.backBtn?.hidden ? [] : [elements.consumerDebt.backBtn]),
      ...(elements.consumerDebt.clearBtn ? [elements.consumerDebt.clearBtn] : []),
      ...Array.from(elements.consumerDebt.content.querySelectorAll("[data-consumer-debt-answer]")),
    ]);
    return;
  }

  if (state.activeTab === "loanDocs") {
    bindTabSequence([
      activeTabButton,
      elements.loanDocs.search,
      ...Array.from(elements.loanDocs.scenarios.querySelectorAll("[data-loan-doc-scenario]")),
      ...Array.from(elements.loanDocs.inputGrid.querySelectorAll("[data-loan-doc-field]")),
      ...Array.from(elements.loanDocs.targets.querySelectorAll("[data-loan-doc-toggle], [data-loan-doc-copy]")),
    ]);
    return;
  }

  bindTabSequence([
    activeTabButton,
    elements.loi.first.loanAmount,
    elements.loi.first.interestRate,
    elements.loi.first.originationPoints,
    ...(shouldIncludeLoiFeeAmountInTabFlow(state.loi.first, "origination") ? [elements.loi.first.originationFeeAmount] : []),
    elements.loi.first.brokerPoints,
    ...(shouldIncludeLoiFeeAmountInTabFlow(state.loi.first, "broker") ? [elements.loi.first.brokerFeeAmount] : []),
    elements.loi.second.loanAmount,
    elements.loi.second.interestRate,
    elements.loi.second.originationPoints,
    ...(shouldIncludeLoiFeeAmountInTabFlow(state.loi.second, "origination") ? [elements.loi.second.originationFeeAmount] : []),
    elements.loi.second.brokerPoints,
    ...(shouldIncludeLoiFeeAmountInTabFlow(state.loi.second, "broker") ? [elements.loi.second.brokerFeeAmount] : []),
    ...Array.from(document.querySelectorAll("[data-loi-blended-output]")).sort(sortLoiOutputs),
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

function sortLoiOutputs(left, right) {
  const leftOutput = Number(left.getAttribute("data-loi-blended-output"));
  const rightOutput = Number(right.getAttribute("data-loi-blended-output"));
  return leftOutput - rightOutput;
}

function shouldIncludeLoiFeeAmountInTabFlow(loanState, feeType) {
  const isOrigination = feeType === "origination";
  const pointsKey = isOrigination ? "originationPoints" : "brokerPoints";
  const sourceKey = isOrigination ? "originationFeeSource" : "brokerFeeSource";
  return loanState[sourceKey] === "amount" || parseLooseNumber(loanState[pointsKey]) === null;
}

function renderAll() {
  renderTabs();
  renderOneToFour();
  renderCommercial();
  renderApartment();
  renderConsumerDebt();
  renderLoi();
  renderLoanDocs();
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

function renderLoanDocs() {
  const scenario = getSelectedLoanDocScenario();
  const visibleScenarios = getVisibleLoanDocScenarios();
  const inputFocusState = captureActiveInputState(elements.loanDocs.inputGrid);

  setControlValue(elements.loanDocs.search, state.loanDocs.searchQuery);
  elements.loanDocs.scenarios.innerHTML = visibleScenarios.length
    ? visibleScenarios.map((entry) => {
        const isActive = entry.id === state.loanDocs.selectedScenarioId;
        return `
          <button class="loan-docs-scenario-chip ${isActive ? "active" : ""}" type="button" data-loan-doc-scenario="${escapeHtml(entry.id)}" aria-pressed="${isActive ? "true" : "false"}">
            <strong>${escapeHtml(entry.label)}</strong>
            <span>${escapeHtml(entry.summary)}</span>
          </button>
        `;
      }).join("")
    : `<div class="empty-cell loan-docs-empty-state">No scenarios match the current search.</div>`;

  if (!scenario) {
    elements.loanDocs.title.textContent = "No Scenario Selected";
    elements.loanDocs.summary.textContent = "Select a scenario to generate mapped loan-doc language.";
    elements.loanDocs.guidance.hidden = true;
    elements.loanDocs.fields.hidden = true;
    elements.loanDocs.targets.innerHTML = "";
    bindLoanDocsEvents();
    bindTabFlows();
    persistState();
    return;
  }

  const scenarioInputs = getLoanDocInputs(scenario.id);
  const activeTargets = getLoanDocTargetsForScenario(scenario, scenarioInputs);
  const groupedTargets = groupLoanDocTargetsByDocument(activeTargets);

  elements.loanDocs.title.textContent = scenario.label;
  elements.loanDocs.summary.textContent = scenario.summary;
  elements.loanDocs.guidance.hidden = !scenario.guidance;
  elements.loanDocs.guidance.textContent = scenario.guidance || "";
  const visibleFields = getVisibleLoanDocFields(scenario, scenarioInputs);
  elements.loanDocs.fields.hidden = !visibleFields.length;
  elements.loanDocs.inputGrid.innerHTML = visibleFields.map((field) => renderLoanDocField(field, scenarioInputs[field.id])).join("");
  if (!consumePendingFocus()) restoreActiveInputState(elements.loanDocs.inputGrid, inputFocusState);
  renderLoanDocsTargetsSection(scenario, scenarioInputs, activeTargets, groupedTargets);
  bindLoanDocsEvents();
  bindTabFlows();
  persistState();
}

function renderLoanDocsTargetsSection(scenario, scenarioInputs, activeTargets = null, groupedTargets = null) {
  const resolvedTargets = activeTargets || getLoanDocTargetsForScenario(scenario, scenarioInputs);
  const resolvedGroupedTargets = groupedTargets || groupLoanDocTargetsByDocument(resolvedTargets);
  elements.loanDocs.targets.innerHTML = resolvedTargets.length
    ? Object.entries(resolvedGroupedTargets).map(([documentKey, targets]) => renderLoanDocDocumentGroup(documentKey, targets)).join("")
    : `<div class="empty-cell loan-docs-empty-state">This scenario has no visible targets with the current inputs.</div>`;
  bindLoanDocsTargetEvents();
}

function renderLoanDocField(field, value) {
  const fieldId = `loan-doc-field-${field.id}`;
  if (field.type === "select") {
    return `
      <label class="field">
        <span>${escapeHtml(field.label)}</span>
        <select id="${fieldId}" data-loan-doc-field="${escapeHtml(field.id)}">
          ${(field.options || []).map((option) => `<option value="${escapeHtml(option.value)}" ${String(value) === String(option.value) ? "selected" : ""}>${escapeHtml(option.label)}</option>`).join("")}
        </select>
      </label>
    `;
  }
  if (field.type === "textarea") {
    return `
      <label class="field field-full-width">
        <span>${escapeHtml(field.label)}</span>
        <textarea id="${fieldId}" data-loan-doc-field="${escapeHtml(field.id)}" rows="5" placeholder="${escapeHtml(field.placeholder || "")}">${escapeHtml(value || "")}</textarea>
      </label>
    `;
  }
  if (field.type === "checkbox") {
    return `
      <label class="field loan-doc-checkbox-field">
        <span>${escapeHtml(field.label)}</span>
        <label class="check-row">
          <input id="${fieldId}" type="checkbox" data-loan-doc-field="${escapeHtml(field.id)}" ${value === true ? "checked" : ""} />
          <span>Enabled</span>
        </label>
      </label>
    `;
  }
  return `
    <label class="field ${field.type === "text" ? "" : ""}">
      <span>${escapeHtml(field.label)}</span>
      <input
        id="${fieldId}"
        type="text"
        inputmode="${getLoanDocFieldInputMode(field)}"
        data-loan-doc-field="${escapeHtml(field.id)}"
        value="${escapeHtml(value || "")}"
        placeholder="${escapeHtml(getLoanDocFieldPlaceholder(field))}"
      />
    </label>
  `;
}

function renderLoanDocDocumentGroup(documentKey, targets) {
  return `
    <section class="loan-doc-group">
      <div class="loan-doc-group-head">
        <h3>${escapeHtml(getLoanDocDocumentLabel(documentKey))}</h3>
      </div>
      <div class="loan-doc-target-list">
        ${targets.map((target) => renderLoanDocTarget(target)).join("")}
      </div>
    </section>
  `;
}

function renderLoanDocTarget(target) {
  const isActive = state.loanDocs.selectedTargetId === target.id;
  const copyPreview = getLoanDocCopyText(target);
  const showsCustomCopyPreview = copyPreview && copyPreview !== stripLeadingSectionMarker(target.renderedText || "");
  return `
    <article class="loan-doc-target-card ${isActive ? "is-active" : ""}">
      <div class="loan-doc-target-head">
        <div>
          <strong>${escapeHtml(target.section)}</strong>
          <span>${escapeHtml(target.mode)}</span>
        </div>
      </div>
      <div class="loan-doc-target-body">
        <div class="loan-doc-target-text loan-doc-rich-text">${formatLoanDocRichTextHtml(target.renderedRichText || target.renderedText || "")}</div>
        ${showsCustomCopyPreview ? `
          <div class="loan-doc-copy-preview">
            <span>Copied text</span>
            <div class="loan-doc-copy-preview-text loan-doc-rich-text">${formatLoanDocRichTextHtml(target.renderedCopyRichText || copyPreview)}</div>
          </div>
        ` : ""}
        <div class="loan-doc-target-actions">
          <button class="secondary-btn" type="button" data-loan-doc-copy="${escapeHtml(target.id)}">Copy Block</button>
        </div>
      </div>
    </article>
  `;
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
              <input
                class="table-input"
                type="text"
                list="apartment-unit-type-options"
                data-focus-key="apartment-grouped-type-${index}"
                data-apartment-grouped-type="${index}"
                value="${escapeHtml(getAptRentTypeInputValue(row.type))}"
                placeholder="Type s, 1, 2, 3, 4, 5..."
              />
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
              <input
                class="table-input"
                type="text"
                list="apartment-unit-type-options"
                data-focus-key="apartment-current-type-${index}"
                data-apartment-current-type="${index}"
                value="${escapeHtml(getAptRentTypeInputValue(row.type))}"
                placeholder="Type s, 1, 2, 3, 4, 5..."
              />
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
  setControlValue(elements.apartment.sale.listingDiscount, state.apartment.sale.listingDiscount);
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
    const listingChip = row.listing && (rowCalc?.perUnit !== null || rowCalc?.perSf !== null) ? '<span class="chip listing">Listing Adj</span>' : "";
    const outlierChip = rowCalc?.isOutlier ? '<span class="chip outlier">High Outlier</span>' : "";
    return `
      <tr class="${rowCalc?.isOutlier ? "is-outlier" : ""}">
        <td><input type="checkbox" data-apartment-sale-include="${index}" tabindex="-1" ${row.include ? "checked" : ""} /></td>
        <td>
          <div class="sale-toggle">
            <button type="button" class="${row.listing ? "" : "active"}" data-apartment-sale-type="${index}" data-sale-type-value="sale" tabindex="-1">Sale</button>
            <button type="button" class="${row.listing ? "active" : ""}" data-apartment-sale-type="${index}" data-sale-type-value="listing" tabindex="-1">Listing</button>
          </div>
        </td>
        <td><input class="table-input" type="text" data-focus-key="apartment-sale-price-${index}" data-apartment-sale-price="${index}" value="${escapeHtml(row.price)}" placeholder="Purchase Price..." /></td>
        <td><input class="table-input" type="text" data-focus-key="apartment-sale-units-${index}" data-apartment-sale-units="${index}" value="${escapeHtml(row.units)}" placeholder="Units..." /></td>
        <td ${state.apartment.sale.enablePerSf ? "" : 'hidden'}><input class="table-input" type="text" data-focus-key="apartment-sale-sqft-${index}" data-apartment-sale-sqft="${index}" value="${escapeHtml(row.sqft)}" placeholder="SF..." ${state.apartment.sale.enablePerSf ? "" : 'tabindex="-1"'} /></td>
        <td><div class="metric-stack"><span>${rowCalc?.perUnitLabel || "-"}</span>${listingChip}${outlierChip}</div></td>
        <td ${state.apartment.sale.enablePerSf ? "" : 'hidden'}><div class="metric-stack"><span>${rowCalc?.perSfLabel || "-"}</span></div></td>
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

function renderConsumerDebt() {
  const container = elements.consumerDebt.content;
  if (!container) return;

  const view = getConsumerDebtView();
  if (view?.redirectStep !== undefined) {
    consumerDebtAdvanceStep(view.redirectStep);
    return;
  }

  const historyItems = getConsumerDebtHistoryItems();
  const showNav = state.consumerDebt.step > 0;
  if (elements.consumerDebt.backBtn) elements.consumerDebt.backBtn.hidden = !showNav;
  if (elements.consumerDebt.clearBtn) elements.consumerDebt.clearBtn.disabled = !showNav;

  container.innerHTML = `
    <section class="consumer-debt-flow">
      <section class="consumer-debt-stage-card">
        ${view.type === "result" ? `
          <div class="consumer-debt-result-card" data-status="${escapeHtml(view.status)}">
            <div class="consumer-debt-result-hero">
              <h3 class="consumer-debt-result-headline">${escapeHtml(getConsumerDebtResultHeadline(view.status))}</h3>
            </div>
            <p class="consumer-debt-result-text">${escapeHtml(view.text)}</p>
          </div>
          ${historyItems.length ? `
            <div class="consumer-debt-history-list consumer-debt-history-list-inline">
              ${renderConsumerDebtHistory(historyItems)}
            </div>
          ` : ""}
        ` : `
          <div class="consumer-debt-question-card">
            <h3 class="consumer-debt-question">${escapeHtml(view.question)}</h3>
            ${view.note ? `
              <div class="consumer-debt-note">
                <span class="consumer-debt-note-mark">i</span>
                <div>${view.note}</div>
              </div>
            ` : ""}
            <div class="consumer-debt-options ${view.layout === "grid" ? "consumer-debt-options-grid" : ""}">
              ${view.options.map((option, index) => `
                <button class="consumer-debt-answer" type="button" data-focus-key="consumer-debt-answer-${index}" data-consumer-debt-answer data-consumer-debt-action="${escapeHtml(option.action)}">${escapeHtml(option.label)}</button>
              `).join("")}
            </div>
            ${historyItems.length ? `
              <div class="consumer-debt-history-list consumer-debt-history-list-inline">
                ${renderConsumerDebtHistory(historyItems)}
              </div>
            ` : ""}
          </div>
        `}
      </section>
    </section>
  `;

  bindConsumerDebtEvents();
  bindTabFlows();
  persistState();
}

function renderConsumerDebtHistory(items) {
  const visibleItems = items.slice(-4);
  const hiddenCount = items.length - visibleItems.length;
  const bubbles = [];

  if (hiddenCount > 0) {
    bubbles.push(`
      <div class="consumer-debt-history-item consumer-debt-history-more">
        <div class="consumer-debt-history-marker"></div>
        <div class="consumer-debt-history-copy">+${hiddenCount} earlier answer${hiddenCount === 1 ? "" : "s"}</div>
      </div>
    `);
  }

  visibleItems.forEach(([question, answer]) => {
    bubbles.push(`
      <div class="consumer-debt-history-item">
        <div class="consumer-debt-history-marker"></div>
        <div class="consumer-debt-history-copy">
          <span>${escapeHtml(question)}</span>
          <strong>${escapeHtml(answer)}</strong>
        </div>
      </div>
    `);
  });

  return bubbles.join("");
}

function getConsumerDebtView() {
  switch (state.consumerDebt.step) {
    case 0:
      return {
        type: "question",
        question: "Is title held in a pre-existing LLC, corporation, LP, or GP that owns other assets?",
        options: [
          { label: "Yes", action: "entity-yes" },
          { label: "No - Individual / Trust", action: "entity-individual" },
          { label: "No - New Single-Purpose Entity", action: "entity-spe" },
        ],
      };
    case 1:
      return {
        type: "question",
        question: "Is manager of the holding entity a pre-existing LLC, corporation, LP, or GP that owns other entities?",
        options: [
          { label: "Yes", action: "manager-yes" },
          { label: "No - Manager is individual / family trust", action: "manager-no" },
        ],
      };
    case 2:
      return {
        type: "question",
        question: "Is this a commercial property? Not a 1-4 unit residential property.",
        options: [
          { label: "Yes", action: "commercial-yes" },
          { label: "No", action: "commercial-no" },
        ],
      };
    case 3:
      return {
        type: "question",
        question: "Is this loan for cash out for personal use?",
        note: "<strong>Example:</strong> Buying a personal home or car, paying off personal credit card or student loan debt, or covering personal legal fees.",
        options: [
          { label: "Yes", action: "personal-cashout-yes" },
          { label: "No", action: "personal-cashout-no" },
        ],
      };
    case 4:
      return {
        type: "question",
        question: "Select the loan purpose:",
        note: "<strong>Cash Out for Business Purpose</strong> includes uses such as investing into the borrower's business, purchasing a commercial property, or paying off company debt.",
        options: [
          { label: "Purchase", action: "purpose-purchase" },
          { label: "Refinance of Existing Debt", action: "purpose-refinance" },
          { label: "Cash Out to Improve Subject Property", action: "purpose-improve" },
          { label: "Cash Out for Business Purpose", action: "purpose-business" },
        ],
      };
    case 5:
      return {
        type: "question",
        question: "Was this property inherited?",
        options: [
          { label: "Yes", action: "inherited-yes" },
          { label: "No", action: "inherited-no" },
        ],
      };
    case 6:
      return {
        type: "question",
        question: "Was the property previously occupied by the deceased, or will the borrower or a family member live there?",
        options: [
          { label: "Yes", action: "inherited-occupied-yes" },
          { label: "No", action: "inherited-occupied-no" },
        ],
      };
    case 7:
      return {
        type: "question",
        question: "Select the property type:",
        layout: "grid",
        options: [
          { label: "SFR", action: "property-sfr" },
          { label: "Duplex", action: "property-duplex" },
          { label: "Triplex", action: "property-triplex" },
          { label: "Quadruplex", action: "property-quadruplex" },
        ],
      };
    case 8:
      return {
        type: "result",
        status: "pass",
        text: "Pass. The property was previously occupied by the deceased, or it will be used as a primary or secondary residence by the borrower or family member. This is not eligible for business purpose lending.",
      };
    case 9:
      return {
        type: "question",
        question: "Has the property always been a rental or investment, and does the borrower plan to rent or sell?",
        options: [
          { label: "Yes", action: "inherited-rental-yes" },
          { label: "No", action: "inherited-rental-no" },
        ],
      };
    case 10:
      return {
        type: "question",
        question: "Will it be owner-occupied?",
        options: [
          { label: "Yes", action: "owner-occ-yes" },
          { label: "No", action: "owner-occ-no" },
        ],
      };
    case 11:
      return {
        type: "result",
        status: "approve",
        text: "We can lend. The property has always been a rental or investment and the borrower plans to rent or sell.",
      };
    case 12:
      return {
        type: "result",
        status: "pass",
        text: "Pass. The property has not always been a rental or investment, or the borrower does not plan to rent or sell.",
      };
    case 13:
      return {
        type: "question",
        question: "Does the borrower rent the majority of the units to 3rd party tenants?",
        options: [
          { label: "Yes", action: "majority-rented-yes" },
          { label: "No", action: "majority-rented-no" },
        ],
      };
    case 14:
      return {
        type: "question",
        question: "Will it be a rental or a flip?",
        options: [
          { label: "Rental", action: "use-rental" },
          { label: "Flip", action: "use-flip" },
        ],
      };
    case 15:
      return {
        type: "question",
        question: "Is the borrower in the business of real estate and/or an active flipper?",
        note: "When trying to determine whether a borrower is in the business of real estate, ask what their primary occupation is and how many real estate transactions they complete in a year.",
        options: [
          { label: "Yes", action: "flipper-yes" },
          { label: "No", action: "flipper-no" },
        ],
      };
    case 16:
      return {
        type: "result",
        status: "approve",
        text: "We can lend. The borrower is in the business of real estate or is an active flipper.",
      };
    case 17:
      return {
        type: "result",
        status: "pass",
        text: "Pass if this is the borrower's first flip ever, or first in a while. If they are not in the business of flipping, it is considered a personal investment.",
      };
    case 18:
      return {
        type: "result",
        status: "approve",
        text: "We can lend. This is a business purpose loan.",
      };
    case 19:
      return {
        type: "result",
        status: "pass",
        text: "Pass. This is not a business purpose loan unless the majority of units are rented to 3rd parties.",
      };
    case 20:
    default:
      return getConsumerDebtResult();
  }
}

function bindConsumerDebtEvents() {
  elements.consumerDebt.content.querySelectorAll("[data-consumer-debt-action]").forEach((button) => {
    button.addEventListener("click", () => handleConsumerDebtAction(button.dataset.consumerDebtAction));
  });
}

function renderLoi() {
  renderLoiLoan("first");
  renderLoiLoan("second");
  renderLoiBlended();
  bindTabFlows();
  persistState();
}

function renderLoiLoan(loanKey) {
  const loanState = state.loi[loanKey];
  const loanElements = elements.loi[loanKey];
  syncLoiFeeFields(loanState, "origination");
  syncLoiFeeFields(loanState, "broker");
  setControlValue(loanElements.loanAmount, loanState.loanAmount);
  setControlValue(loanElements.interestRate, loanState.interestRate);
  setControlValue(loanElements.originationPoints, loanState.originationPoints);
  setControlValue(loanElements.originationFeeAmount, loanState.originationFeeAmount);
  setControlValue(loanElements.brokerPoints, loanState.brokerPoints);
  setControlValue(loanElements.brokerFeeAmount, loanState.brokerFeeAmount);
  const calculations = calculateLoiLoan(loanState);
  loanElements.monthlyPayment.textContent = calculations.monthlyPaymentLabel;
}

function renderLoiBlended() {
  const calculations = calculateBlendedLoi();
  elements.loi.blended.loanAmount.textContent = calculations.combinedLoanAmount === null ? "-" : formatCurrency(calculations.combinedLoanAmount, 0);
  elements.loi.blended.interestRate.textContent = calculations.blendedRate === null ? "-" : formatPercentDisplay(calculations.blendedRate, 2);
  elements.loi.blended.originationFee.textContent = calculations.totalOriginationFee === null ? "-" : formatCurrency(calculations.totalOriginationFee, 0);
  elements.loi.blended.originationPoints.textContent = calculations.blendedOriginationPoints === null ? "-" : formatPercentDisplay(calculations.blendedOriginationPoints, 4);
  elements.loi.blended.monthlyPayment.textContent = calculations.totalMonthlyPayment === null ? "-" : formatCurrency(calculations.totalMonthlyPayment, 0);
}

function bindLoanDocsEvents() {
  elements.loanDocs.scenarios.querySelectorAll("[data-loan-doc-scenario]").forEach((button) => {
    button.addEventListener("click", () => {
      state.loanDocs.selectedScenarioId = button.getAttribute("data-loan-doc-scenario");
      state.loanDocs.selectedTargetId = null;
      renderLoanDocs();
    });
  });

  elements.loanDocs.inputGrid.querySelectorAll("[data-loan-doc-field]").forEach((input) => {
    const scenario = getSelectedLoanDocScenario();
    if (!scenario) return;
    const fieldId = input.getAttribute("data-loan-doc-field");
    if (!fieldId) return;
    const field = getLoanDocFieldById(scenario, fieldId);
    input.addEventListener("input", () => {
      state.loanDocs.inputs[scenario.id][fieldId] = input instanceof HTMLInputElement && input.type === "checkbox" ? input.checked : input.value;
      if (input instanceof HTMLSelectElement || (input instanceof HTMLInputElement && input.type === "checkbox")) {
        renderLoanDocs();
        return;
      }
      renderLoanDocsTargetsSection(scenario, getLoanDocInputs(scenario.id));
      persistState();
    });
    if (input instanceof HTMLSelectElement || (input instanceof HTMLInputElement && input.type === "checkbox")) {
      input.addEventListener("change", () => {
        const nextValue = input instanceof HTMLInputElement && input.type === "checkbox"
          ? input.checked
          : normalizeLoanDocFieldValue(field, input.value);
        state.loanDocs.inputs[scenario.id][fieldId] = nextValue;
        renderLoanDocs();
      });
    }
    if (input instanceof HTMLInputElement && field?.type === "text") {
      input.addEventListener("blur", () => {
        const formattedValue = normalizeLoanDocFieldValue(field, input.value);
        state.loanDocs.inputs[scenario.id][fieldId] = formattedValue;
        input.value = formattedValue;
        renderLoanDocsTargetsSection(scenario, getLoanDocInputs(scenario.id));
        persistState();
      });
    }
  });

  bindLoanDocsTargetEvents();
}

function bindLoanDocsTargetEvents() {
  elements.loanDocs.targets.querySelectorAll("[data-loan-doc-copy]").forEach((button) => {
    button.addEventListener("click", () => {
      const targetId = button.getAttribute("data-loan-doc-copy");
      const scenario = getSelectedLoanDocScenario();
      if (!scenario || !targetId) return;
      const target = getLoanDocTargetsForScenario(scenario, getLoanDocInputs(scenario.id)).find((entry) => entry.id === targetId);
      if (!target) return;
      state.loanDocs.selectedTargetId = targetId;
      copyLoanDocText(
        getLoanDocCopyText(target),
        button,
        button.closest(".loan-doc-target-card"),
        getLoanDocCopyHtml(target),
      );
    });
  });
}

function renderSaleRows({
  tbody,
  rows,
  calculations,
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
  const listingDiscountRate = clampPercent(state.apartment.sale.listingDiscount);
  const rows = state.apartment.sale.rows.map((row) => {
    const price = parseLooseNumber(row.price);
    const units = parsePositiveWholeNumber(row.units);
    const sqft = parsePositiveWholeNumber(row.sqft);
    const basePerUnit = price === null || units === null || units <= 0 ? null : price / units;
    const basePerSf = price === null || sqft === null || sqft <= 0 ? null : price / sqft;
    const perUnit = basePerUnit === null ? null : (row.listing ? basePerUnit * (1 - listingDiscountRate) : basePerUnit);
    const perSf = basePerSf === null ? null : (row.listing ? basePerSf * (1 - listingDiscountRate) : basePerSf);
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
  const outlierMetricKey = state.apartment.sale.enablePerSf ? "perSf" : "perUnit";
  rows.forEach((row, index) => {
    const metric = row[outlierMetricKey];
    if (metric === null) return;
    if (metric > highestMetric) {
      highestMetric = metric;
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

function calculateLoiLoan(loanState) {
  const loanAmount = parseLooseNumber(loanState.loanAmount);
  const interestRate = parseLooseNumber(loanState.interestRate);
  const originationFeeAmount = parseLooseNumber(loanState.originationFeeAmount);
  const brokerFeeAmount = parseLooseNumber(loanState.brokerFeeAmount);
  const monthlyPayment = loanAmount === null || interestRate === null ? null : loanAmount * (interestRate / 100);

  return {
    loanAmount,
    interestRate,
    originationFeeAmount,
    brokerFeeAmount,
    monthlyPayment,
    monthlyPaymentLabel: monthlyPayment === null ? "-" : formatCurrency(monthlyPayment, 0),
  };
}

function calculateBlendedLoi() {
  const first = calculateLoiLoan(state.loi.first);
  const second = calculateLoiLoan(state.loi.second);
  const combinedLoanAmount = sumNullable([first.loanAmount, second.loanAmount]);
  const totalOriginationFee = sumNullable([first.originationFeeAmount, second.originationFeeAmount]);
  const totalMonthlyPayment = sumNullable([first.monthlyPayment, second.monthlyPayment]);
  const blendedOriginationPoints = combinedLoanAmount === null || combinedLoanAmount <= 0 || totalOriginationFee === null
    ? null
    : (totalOriginationFee / combinedLoanAmount) * 100;
  const blendedRate = combinedLoanAmount === null || combinedLoanAmount <= 0 || totalMonthlyPayment === null
    ? null
    : (totalMonthlyPayment / combinedLoanAmount) * 100;

  return {
    combinedLoanAmount,
    totalOriginationFee,
    totalMonthlyPayment,
    blendedRate,
    blendedOriginationPoints,
  };
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

    elements.apartment.current.rows.querySelectorAll("[data-apartment-grouped-type]").forEach((input) => {
      const commitType = () => {
        const row = state.apartment.current.groupedRows[Number(input.dataset.apartmentGroupedType)];
        if (!row) return;
        row.type = normalizeAptRentTypeInput(input.value);
        renderApartment();
      };
      input.addEventListener("change", commitType);
      input.addEventListener("blur", commitType);
      input.addEventListener("keydown", (event) => {
        if (event.key !== "Enter") return;
        event.preventDefault();
        commitType();
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

  elements.apartment.current.rows.querySelectorAll("[data-apartment-current-type]").forEach((input) => {
    const commitType = () => {
      const row = state.apartment.current.rows[Number(input.dataset.apartmentCurrentType)];
      if (!row) return;
      row.type = normalizeAptRentTypeInput(input.value);
      renderApartment();
    };
    input.addEventListener("change", commitType);
    input.addEventListener("blur", commitType);
    input.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      commitType();
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
      const parsedRent = parseLooseNumber(row.rent);
      if (parsedRent === 0) row.isVacant = true;
      renderApartment();
    });
    input.addEventListener("blur", () => {
      const row = state.apartment.current.rows[Number(input.dataset.apartmentCurrentRent)];
      if (!row) return;
      const parsedRent = parseLooseNumber(row.rent);
      if (parsedRent === 0) row.isVacant = true;
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
  elements.apartment.sale.rows.querySelectorAll("[data-apartment-sale-type]").forEach((button) => {
    const applyType = () => {
      const row = state.apartment.sale.rows[Number(button.dataset.apartmentSaleType)];
      if (!row) return;
      row.listing = button.dataset.saleTypeValue === "listing";
      renderApartment();
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

function handleConsumerDebtAction(action) {
  switch (action) {
    case "entity-yes":
      state.consumerDebt.entityChoice = "Yes";
      state.consumerDebt.managerAsked = false;
      state.consumerDebt.managerChoice = null;
      consumerDebtAdvanceStep(20);
      return;
    case "entity-individual":
      state.consumerDebt.entityChoice = "No - Individual / Trust";
      state.consumerDebt.managerAsked = false;
      state.consumerDebt.managerChoice = null;
      consumerDebtAdvanceStep(2);
      return;
    case "entity-spe":
      state.consumerDebt.entityChoice = "No - New Single-Purpose Entity";
      state.consumerDebt.managerAsked = true;
      state.consumerDebt.managerChoice = null;
      consumerDebtAdvanceStep(1);
      return;
    case "manager-yes":
      state.consumerDebt.managerChoice = "Yes";
      consumerDebtAdvanceStep(20);
      return;
    case "manager-no":
      state.consumerDebt.managerChoice = "No - Manager is individual / family trust";
      consumerDebtAdvanceStep(2);
      return;
    case "commercial-yes":
      state.consumerDebt.isCommercial = true;
      consumerDebtAdvanceStep(3);
      return;
    case "commercial-no":
      state.consumerDebt.isCommercial = false;
      consumerDebtAdvanceStep(3);
      return;
    case "personal-cashout-yes":
      state.consumerDebt.isPersonalCashOut = true;
      state.consumerDebt.loanPurpose = "Cash Out for Personal Use";
      consumerDebtAdvanceStep(20);
      return;
    case "personal-cashout-no":
      state.consumerDebt.isPersonalCashOut = false;
      if (
        (state.consumerDebt.entityChoice === "No - Individual / Trust" && state.consumerDebt.isCommercial)
        || (
          state.consumerDebt.entityChoice === "No - New Single-Purpose Entity"
          && state.consumerDebt.managerChoice === "No - Manager is individual / family trust"
          && state.consumerDebt.isCommercial
        )
      ) {
        state.consumerDebt.loanPurpose = "BusinessPurposeAuto";
        consumerDebtAdvanceStep(20);
        return;
      }
      consumerDebtAdvanceStep(4);
      return;
    case "purpose-purchase":
      state.consumerDebt.loanPurpose = "Purchase";
      consumerDebtAdvanceStep(5);
      return;
    case "purpose-refinance":
      state.consumerDebt.loanPurpose = "Refinance of Existing Debt";
      consumerDebtAdvanceStep(5);
      return;
    case "purpose-improve":
      state.consumerDebt.loanPurpose = "Cash Out to Improve Subject Property";
      consumerDebtAdvanceStep(5);
      return;
    case "purpose-business":
      state.consumerDebt.loanPurpose = "Cash Out for Business Purpose";
      consumerDebtAdvanceStep(5);
      return;
    case "inherited-yes":
      state.consumerDebt.inherited = "Yes";
      state.consumerDebt.inheritedOccupied = null;
      state.consumerDebt.inheritedRentalIntent = null;
      consumerDebtAdvanceStep(6);
      return;
    case "inherited-no":
      state.consumerDebt.inherited = "No";
      state.consumerDebt.inheritedOccupied = null;
      state.consumerDebt.inheritedRentalIntent = null;
      consumerDebtAdvanceStep(7);
      return;
    case "inherited-occupied-yes":
      state.consumerDebt.inheritedOccupied = "Yes";
      consumerDebtAdvanceStep(8);
      return;
    case "inherited-occupied-no":
      state.consumerDebt.inheritedOccupied = "No";
      consumerDebtAdvanceStep(9);
      return;
    case "inherited-rental-yes":
      state.consumerDebt.inheritedRentalIntent = "Yes";
      consumerDebtAdvanceStep(11);
      return;
    case "inherited-rental-no":
      state.consumerDebt.inheritedRentalIntent = "No";
      consumerDebtAdvanceStep(12);
      return;
    case "property-sfr":
      state.consumerDebt.propertyChoice = "SFR";
      consumerDebtAdvanceStep(10);
      return;
    case "property-duplex":
      state.consumerDebt.propertyChoice = "Duplex";
      consumerDebtAdvanceStep(10);
      return;
    case "property-triplex":
      state.consumerDebt.propertyChoice = "Triplex";
      consumerDebtAdvanceStep(10);
      return;
    case "property-quadruplex":
      state.consumerDebt.propertyChoice = "Quadruplex";
      consumerDebtAdvanceStep(10);
      return;
    case "owner-occ-yes":
      state.consumerDebt.ownerOcc = "Yes";
      state.consumerDebt.useChoice = null;
      if (["SFR", "Duplex"].includes(state.consumerDebt.propertyChoice)) {
        state.consumerDebt.ooConfig = "SFR_Duplex";
        consumerDebtAdvanceStep(20);
        return;
      }
      state.consumerDebt.ooConfig = null;
      consumerDebtAdvanceStep(13);
      return;
    case "owner-occ-no":
      state.consumerDebt.ownerOcc = "No";
      state.consumerDebt.ooConfig = null;
      consumerDebtAdvanceStep(14);
      return;
    case "majority-rented-yes":
      state.consumerDebt.ooConfig = "MajorityRented";
      consumerDebtAdvanceStep(18);
      return;
    case "majority-rented-no":
      state.consumerDebt.ooConfig = "NotMajority";
      consumerDebtAdvanceStep(19);
      return;
    case "use-rental":
      state.consumerDebt.useChoice = "Rental";
      consumerDebtAdvanceStep(20);
      return;
    case "use-flip":
      state.consumerDebt.useChoice = "Flip";
      consumerDebtAdvanceStep(15);
      return;
    case "flipper-yes":
      state.consumerDebt.flipperCheck = "Yes";
      consumerDebtAdvanceStep(16);
      return;
    case "flipper-no":
      state.consumerDebt.flipperCheck = "No";
      consumerDebtAdvanceStep(17);
      return;
    default:
      return;
  }
}

function consumerDebtAdvanceStep(nextStep) {
  state.consumerDebt.history.push(state.consumerDebt.step);
  resetConsumerDebtBranch(nextStep);
  state.consumerDebt.step = nextStep;
  renderConsumerDebt();
}

function consumerDebtGoBack() {
  if (!state.consumerDebt.history.length) return;
  const previousStep = state.consumerDebt.history.pop();
  resetConsumerDebtBranch(previousStep);
  state.consumerDebt.step = previousStep;
  renderConsumerDebt();
}

function resetConsumerDebtBranch(step) {
  const section = state.consumerDebt;
  const clearFromCommercial = () => {
    section.isCommercial = null;
    section.isPersonalCashOut = null;
    section.loanPurpose = null;
    section.inherited = null;
    section.inheritedOccupied = null;
    section.inheritedRentalIntent = null;
    section.propertyChoice = null;
    section.ownerOcc = null;
    section.ooConfig = null;
    section.useChoice = null;
    section.flipperCheck = null;
  };

  switch (step) {
    case 0:
      state.consumerDebt = createConsumerDebtDefaults();
      return;
    case 1:
      section.managerChoice = null;
      clearFromCommercial();
      return;
    case 2:
      clearFromCommercial();
      return;
    case 3:
      section.isPersonalCashOut = null;
      section.loanPurpose = null;
      section.inherited = null;
      section.inheritedOccupied = null;
      section.inheritedRentalIntent = null;
      section.propertyChoice = null;
      section.ownerOcc = null;
      section.ooConfig = null;
      section.useChoice = null;
      section.flipperCheck = null;
      return;
    case 4:
      section.loanPurpose = null;
      section.inherited = null;
      section.inheritedOccupied = null;
      section.inheritedRentalIntent = null;
      section.propertyChoice = null;
      section.ownerOcc = null;
      section.ooConfig = null;
      section.useChoice = null;
      section.flipperCheck = null;
      return;
    case 5:
      section.inherited = null;
      section.inheritedOccupied = null;
      section.inheritedRentalIntent = null;
      section.propertyChoice = null;
      section.ownerOcc = null;
      section.ooConfig = null;
      section.useChoice = null;
      section.flipperCheck = null;
      return;
    case 6:
      section.inheritedOccupied = null;
      section.inheritedRentalIntent = null;
      return;
    case 7:
      section.propertyChoice = null;
      section.ownerOcc = null;
      section.ooConfig = null;
      section.useChoice = null;
      section.flipperCheck = null;
      return;
    case 8:
      section.inheritedOccupied = "Yes";
      section.inheritedRentalIntent = null;
      return;
    case 9:
      section.inheritedRentalIntent = null;
      return;
    case 10:
      section.ownerOcc = null;
      section.ooConfig = null;
      section.useChoice = null;
      section.flipperCheck = null;
      return;
    case 11:
      section.inheritedRentalIntent = "Yes";
      return;
    case 12:
      section.inheritedRentalIntent = "No";
      return;
    case 13:
      section.ooConfig = null;
      return;
    case 14:
      section.useChoice = null;
      section.flipperCheck = null;
      return;
    case 15:
      section.flipperCheck = null;
      return;
    default:
      return;
  }
}

function bindLoiLoanFieldEvents(loanKey) {
  const loanElements = elements.loi[loanKey];
  const getLoanState = () => state.loi[loanKey];

  bindInput(loanElements.loanAmount, (value) => {
    const loanState = getLoanState();
    loanState.loanAmount = value;
    syncLoiFeeFields(loanState, "origination");
    syncLoiFeeFields(loanState, "broker");
    renderLoi();
  });
  bindInput(loanElements.interestRate, (value) => {
    const loanState = getLoanState();
    loanState.interestRate = value;
    renderLoi();
  });
  bindInput(loanElements.originationPoints, (value) => {
    const loanState = getLoanState();
    loanState.originationPoints = value;
    loanState.originationFeeSource = "points";
    syncLoiFeeFields(loanState, "origination");
    renderLoi();
  });
  bindInput(loanElements.originationFeeAmount, (value) => {
    const loanState = getLoanState();
    loanState.originationFeeAmount = value;
    loanState.originationFeeSource = "amount";
    syncLoiFeeFields(loanState, "origination");
    renderLoi();
  });
  bindInput(loanElements.brokerPoints, (value) => {
    const loanState = getLoanState();
    loanState.brokerPoints = value;
    loanState.brokerFeeSource = "points";
    syncLoiFeeFields(loanState, "broker");
    renderLoi();
  });
  bindInput(loanElements.brokerFeeAmount, (value) => {
    const loanState = getLoanState();
    loanState.brokerFeeAmount = value;
    loanState.brokerFeeSource = "amount";
    syncLoiFeeFields(loanState, "broker");
    renderLoi();
  });

  bindBlurFormatWhole(loanElements.loanAmount, () => {
    const loanState = getLoanState();
    loanState.loanAmount = formatMoneyInput(loanState.loanAmount, 0);
    syncLoiFeeFields(loanState, "origination");
    syncLoiFeeFields(loanState, "broker");
    renderLoi();
  });
  loanElements.interestRate?.addEventListener("blur", () => {
    const loanState = getLoanState();
    loanState.interestRate = formatDecimalInput(loanState.interestRate, 2);
    renderLoi();
  });
  loanElements.originationPoints?.addEventListener("blur", () => {
    const loanState = getLoanState();
    loanState.originationPoints = formatDecimalInput(loanState.originationPoints, 4);
    loanState.originationFeeSource = "points";
    syncLoiFeeFields(loanState, "origination");
    renderLoi();
  });
  loanElements.originationFeeAmount?.addEventListener("blur", () => {
    const loanState = getLoanState();
    loanState.originationFeeAmount = formatMoneyInput(loanState.originationFeeAmount, 0);
    loanState.originationFeeSource = "amount";
    syncLoiFeeFields(loanState, "origination");
    renderLoi();
  });
  loanElements.brokerPoints?.addEventListener("blur", () => {
    const loanState = getLoanState();
    loanState.brokerPoints = formatDecimalInput(loanState.brokerPoints, 4);
    loanState.brokerFeeSource = "points";
    syncLoiFeeFields(loanState, "broker");
    renderLoi();
  });
  loanElements.brokerFeeAmount?.addEventListener("blur", () => {
    const loanState = getLoanState();
    loanState.brokerFeeAmount = formatMoneyInput(loanState.brokerFeeAmount, 0);
    loanState.brokerFeeSource = "amount";
    syncLoiFeeFields(loanState, "broker");
    renderLoi();
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

function syncLoiFeeFields(loanState, feeType) {
  const isOrigination = feeType === "origination";
  const pointsKey = isOrigination ? "originationPoints" : "brokerPoints";
  const amountKey = isOrigination ? "originationFeeAmount" : "brokerFeeAmount";
  const sourceKey = isOrigination ? "originationFeeSource" : "brokerFeeSource";
  const loanAmount = parseLooseNumber(loanState.loanAmount);
  if (loanState[sourceKey] === "amount") {
    const feeAmount = parseLooseNumber(loanState[amountKey]);
    loanState[pointsKey] = feeAmount === null || loanAmount === null || loanAmount <= 0
      ? ""
      : formatDecimalInput((feeAmount / loanAmount) * 100, 4);
    return;
  }

  const points = parseLooseNumber(loanState[pointsKey]);
  loanState[amountKey] = points === null || loanAmount === null || loanAmount <= 0
    ? ""
    : formatMoneyInput(loanAmount * (points / 100), 0);
}

function getConsumerDebtHistoryItems() {
  const items = [];
  const consumerDebt = state.consumerDebt;
  const history = consumerDebt.history;

  if (history.length > 0 && consumerDebt.entityChoice) {
    items.push(["Held in a pre-existing entity?", consumerDebt.entityChoice]);
  }
  if (history.includes(1) && consumerDebt.managerAsked && consumerDebt.managerChoice) {
    items.push(["Manager entity?", consumerDebt.managerChoice]);
  }
  if (history.includes(2) && consumerDebt.isCommercial !== null) {
    items.push(["Commercial property?", consumerDebt.isCommercial ? "Yes" : "No"]);
  }
  if (history.includes(3) && consumerDebt.isPersonalCashOut !== null) {
    items.push(["Cash out for personal use?", consumerDebt.isPersonalCashOut ? "Yes" : "No"]);
  }
  if (history.includes(4) && consumerDebt.loanPurpose && consumerDebt.loanPurpose !== "BusinessPurposeAuto") {
    items.push(["Loan purpose:", consumerDebt.loanPurpose]);
  }
  if (history.includes(5) && consumerDebt.inherited !== null) {
    items.push(["Inherited?", consumerDebt.inherited]);
  }
  if (history.includes(6) && consumerDebt.inherited === "Yes" && consumerDebt.inheritedOccupied !== null) {
    items.push(["Borrower or family occupancy?", consumerDebt.inheritedOccupied]);
  }
  if (history.includes(9) && consumerDebt.inherited === "Yes" && consumerDebt.inheritedOccupied === "No" && consumerDebt.inheritedRentalIntent !== null) {
    items.push(["Always rental or investment?", consumerDebt.inheritedRentalIntent]);
  }
  if (history.includes(7) && consumerDebt.inherited === "No" && consumerDebt.propertyChoice) {
    items.push(["Property type:", consumerDebt.propertyChoice]);
  }
  if (history.includes(10) && consumerDebt.inherited === "No" && consumerDebt.propertyChoice && consumerDebt.ownerOcc !== null) {
    items.push(["Owner-occupied?", consumerDebt.ownerOcc]);
  }
  if (history.includes(13) && consumerDebt.ownerOcc === "Yes" && consumerDebt.ooConfig) {
    items.push(["Majority rented to 3rd parties?", consumerDebt.ooConfig === "MajorityRented" ? "Yes" : "No"]);
  }
  if (history.includes(14) && consumerDebt.ownerOcc === "No" && consumerDebt.useChoice) {
    items.push(["Rental or flip?", consumerDebt.useChoice]);
  }
  if (history.includes(15) && consumerDebt.flipperCheck !== null) {
    items.push(["Borrower in real estate business?", consumerDebt.flipperCheck]);
  }

  return items;
}

function getConsumerDebtResult() {
  const consumerDebt = state.consumerDebt;

  if (consumerDebt.entityChoice === "Yes" || consumerDebt.managerChoice === "Yes") {
    return {
      type: "result",
      status: "approve",
      text: "We can lend. Loans to bona-fide entities are exempt from consumer-loan regulations, regardless of scenario.",
    };
  }

  if (consumerDebt.loanPurpose === "BusinessPurposeAuto") {
    return {
      type: "result",
      status: "approve",
      text: "We can lend. This is a business purpose loan.",
    };
  }

  if (consumerDebt.isPersonalCashOut) {
    if (consumerDebt.isCommercial) {
      return {
        type: "result",
        status: "caution",
        text: "We can lend, but a loan on a commercial property for consumer purposes does not require an NMLS license and does require special disclosure forms with attorney assistance.",
      };
    }
    return {
      type: "result",
      status: "pass",
      text: "Pass. Cash-out for personal use on 1-4 unit properties is considered a consumer loan and requires an NMLS license.",
    };
  }

  if (consumerDebt.isCommercial && consumerDebt.isPersonalCashOut === false) {
    return {
      type: "result",
      status: "approve",
      text: "We can lend. This is a business purpose loan.",
    };
  }

  const matrixKey = getConsumerDebtMatrixKey();
  const matrixValue = matrixKey && consumerDebt.loanPurpose ? consumerDebtOutcomeMatrix[matrixKey]?.[consumerDebt.loanPurpose] : null;
  if (matrixValue === "flipper-check") {
    if (consumerDebt.flipperCheck === null) return { redirectStep: 15 };
    return consumerDebt.flipperCheck === "Yes"
      ? {
          type: "result",
          status: "approve",
          text: "We can lend. The borrower is in the business of real estate or is an active flipper.",
        }
      : {
          type: "result",
          status: "pass",
          text: "Pass if this is the borrower's first flip ever, or first in a while. If they are not in the business of flipping, it is considered a personal investment.",
        };
  }

  if (!matrixValue) {
    return {
      type: "result",
      status: "pass",
      text: "Complete the decision path to determine eligibility.",
    };
  }

  return {
    type: "result",
    status: classifyConsumerDebtResultStatus(matrixValue),
    text: matrixValue,
  };
}

function getConsumerDebtMatrixKey() {
  const consumerDebt = state.consumerDebt;
  if (consumerDebt.isCommercial) return "Commercial Property";
  if (consumerDebt.ownerOcc === "No") {
    return consumerDebt.useChoice === "Flip" ? "Flip 1-4 Unit" : "Rental 1-4 Unit";
  }
  if (consumerDebt.ooConfig === "SFR_Duplex" || ["SFR", "Duplex"].includes(consumerDebt.propertyChoice)) {
    return "OO SFR or Duplex";
  }
  if (["Triplex", "Quadruplex"].includes(consumerDebt.propertyChoice) && consumerDebt.ownerOcc === "Yes") {
    return "OO 3-4 Unit";
  }
  return "OO 3-4 Unit";
}

function classifyConsumerDebtResultStatus(text) {
  if (text.includes("but")) return "caution";
  if (text.startsWith("Pass")) return "pass";
  return "approve";
}

function getConsumerDebtResultHeadline(status) {
  if (status === "approve") return "Eligible";
  if (status === "caution") return "Eligible With Caution";
  return "Pass";
}

function getLoanDocScenarioById(id) {
  return LOAN_DOC_SCENARIOS.find((scenario) => scenario.id === id) || null;
}

function getSelectedLoanDocScenario() {
  return getLoanDocScenarioById(state.loanDocs.selectedScenarioId) || LOAN_DOC_SCENARIOS[0] || null;
}

function getLoanDocInputs(scenarioId) {
  const fallbackInputs = createLoanDocsDefaults().inputs[scenarioId] || {};
  return state.loanDocs.inputs[scenarioId] || fallbackInputs;
}

function getLoanDocFieldById(scenario, fieldId) {
  return (scenario?.fields || []).find((field) => field.id === fieldId) || null;
}

function getVisibleLoanDocFields(scenario, inputs) {
  return (scenario?.fields || []).filter((field) => loanDocTargetMatchesConditions(field, inputs));
}

function getVisibleLoanDocScenarios() {
  const query = state.loanDocs.searchQuery.trim().toLowerCase();
  if (!query) return LOAN_DOC_SCENARIOS;
  return LOAN_DOC_SCENARIOS.filter((scenario) => {
    const haystack = [
      scenario.label,
      scenario.summary,
      scenario.guidance,
      ...(scenario.targets || []).flatMap((target) => [target.document, target.section, target.mode, target.template]),
    ].join(" ").toLowerCase();
    return haystack.includes(query);
  });
}

function getLoanDocTargetsForScenario(scenario, inputs) {
  return (scenario.targets || [])
    .filter((target) => loanDocTargetMatchesConditions(target, inputs))
    .map((target) => ({
      ...target,
      renderedText: renderLoanDocTemplate(target.template || "", scenario, inputs),
      renderedCopyText: renderLoanDocTemplate(target.copyTemplate || target.template || "", scenario, inputs),
      renderedRichText: renderLoanDocRichTemplate(target.richTemplate || target.template || "", scenario, inputs),
      renderedCopyRichText: renderLoanDocRichTemplate(
        stripLeadingSectionMarker(target.richCopyTemplate || target.richTemplate || target.copyTemplate || target.template || ""),
        scenario,
        inputs,
      ),
    }));
}

function loanDocTargetMatchesConditions(target, inputs) {
  if (!Array.isArray(target.conditions) || !target.conditions.length) return true;
  return target.conditions.every((condition) => {
    const currentValue = inputs?.[condition.field];
    if (Object.prototype.hasOwnProperty.call(condition, "equals")) return currentValue === condition.equals;
    if (Object.prototype.hasOwnProperty.call(condition, "notEquals")) return currentValue !== condition.notEquals;
    return true;
  });
}

function renderLoanDocTemplate(template, scenario, inputs) {
  return String(template).replace(/\{\{([^}]+)\}\}/g, (_, token) => {
    const key = String(token).trim();
    const value = resolveLoanDocTemplateValue(key, scenario, inputs);
    if (value === true) return "Yes";
    if (value === false || value == null || value === "") return `[${key.replace(/_/g, " ")}]`;
    const field = getLoanDocFieldById(scenario, key);
    return normalizeLoanDocFieldValue(field, value);
  });
}

function renderLoanDocRichTemplate(template, scenario, inputs) {
  const parts = String(template).split(/(\{\{[^}]+\}\}|\*\*)/g);
  let html = "";
  let isBold = false;

  parts.forEach((part) => {
    if (!part) return;
    if (part === "**") {
      html += isBold ? "</strong>" : "<strong>";
      isBold = !isBold;
      return;
    }
    const tokenMatch = part.match(/^\{\{([^}]+)\}\}$/);
    if (tokenMatch) {
      html += escapeHtml(getLoanDocResolvedTemplateValue(tokenMatch[1], scenario, inputs));
      return;
    }
    html += escapeHtml(part);
  });

  if (isBold) html += "</strong>";
  return html.replace(/\r\n?/g, "\n").trim();
}

function getLoanDocResolvedTemplateValue(token, scenario, inputs) {
  const key = String(token).trim();
  const value = resolveLoanDocTemplateValue(key, scenario, inputs);
  if (value === true) return "Yes";
  if (value === false || value == null || value === "") return `[${key.replace(/_/g, " ")}]`;
  const field = getLoanDocFieldById(scenario, key);
  return normalizeLoanDocFieldValue(field, value);
}

function formatLoanDocRichTextHtml(content) {
  const normalized = String(content || "").replace(/\r\n?/g, "\n").trim();
  if (!normalized) return "";
  return normalized
    .split("\n")
    .map((line) => formatLoanDocRichTextLine(line))
    .join("");
}

function formatLoanDocRichTextLine(line) {
  const trimmed = String(line || "").trim();
  if (!trimmed) return '<div class="loan-doc-line-spacer" aria-hidden="true"></div>';
  const lineClass = getLoanDocRichTextLineClass(trimmed);
  return `<p class="loan-doc-line ${lineClass}">${trimmed}</p>`;
}

function getLoanDocRichTextLineClass(line) {
  const plain = String(line || "").replace(/<[^>]+>/g, "").trim();
  if (!plain) return "";
  if (/^\d+\.\s/.test(plain)) return "loan-doc-line-section";
  if (/^\([a-z]\)\s/i.test(plain)) return "loan-doc-line-alpha";
  if (/^\(([ivxlcdm]+)\)\s/i.test(plain)) return "loan-doc-line-roman";
  if (/^[•*-]\s/.test(plain)) return "loan-doc-line-bullet";
  if (/^[A-Z][A-Z\s]+:$/.test(plain)) return "loan-doc-line-label";
  if (/^By[_\s]/.test(plain)) return "loan-doc-line-signature";
  return "loan-doc-line-body";
}

function formatLoanDocClipboardFragment(content) {
  const normalized = String(content || "").replace(/\r\n?/g, "\n").trim();
  if (!normalized) return "";
  return normalized
    .split("\n")
    .filter((line) => line.trim())
    .join("<br>");
}

function resolveLoanDocTemplateValue(key, scenario, inputs) {
  if (Object.prototype.hasOwnProperty.call(inputs || {}, key)) return inputs[key];
  if (key.endsWith("_words")) {
    const baseKey = key.slice(0, -6);
    const field = getLoanDocFieldById(scenario, baseKey);
    const baseValue = inputs?.[baseKey];
    if (isLoanDocPercentField(field)) return formatLoanDocPercentWords(baseValue);
  }
  return inputs?.[key];
}

function isLoanDocMoneyField(field) {
  if (!field || field.type !== "text") return false;
  return String(field.placeholder || "").includes("$");
}

function isLoanDocPercentField(field) {
  return field?.type === "text" && field?.format === "percent";
}

function isLoanDocDateField(field) {
  return field?.type === "text" && field?.format === "date";
}

function getLoanDocFieldInputMode(field) {
  return isLoanDocMoneyField(field) || isLoanDocPercentField(field) ? "decimal" : "text";
}

function getLoanDocFieldPlaceholder(field) {
  if (!field) return "";
  if (isLoanDocMoneyField(field)) return "$0.00";
  if (isLoanDocPercentField(field)) return "0.00%";
  if (isLoanDocDateField(field)) return "January 1, 2027";
  return field.placeholder || "";
}

function normalizeLoanDocFieldValue(field, rawValue) {
  if (!field) return String(rawValue ?? "");
  if (isLoanDocMoneyField(field)) return formatMoneyInput(rawValue, 2);
  if (isLoanDocPercentField(field)) return formatLoanDocPercentInput(rawValue);
  if (isLoanDocDateField(field)) return formatLoanDocDateInput(rawValue);
  return String(rawValue ?? "");
}

function groupLoanDocTargetsByDocument(targets) {
  return targets.reduce((groups, target) => {
    const documentKey = target.document || "agreement";
    if (!groups[documentKey]) groups[documentKey] = [];
    groups[documentKey].push(target);
    return groups;
  }, {});
}

function getLoanDocDocumentLabel(documentKey) {
  const labels = {
    agreement: "Agreement",
    instructions: "Escrow Instructions",
    note: "Note",
    td: "Deed of Trust",
    eft: "EFT",
  };
  return labels[documentKey] || documentKey;
}

function getLoanDocCopyText(target) {
  return stripLeadingSectionMarker(target?.renderedCopyText || target?.renderedText || "");
}

function getLoanDocCopyHtml(target) {
  if (target?.richCopy === false) return "";
  return formatLoanDocClipboardFragment(target?.renderedCopyRichText || getLoanDocCopyText(target));
}

function stripLeadingSectionMarker(text) {
  return String(text)
    .split("\n")
    .map((line) => line
      .replace(/^\s*\d+(?:\.\d+)*\.?\s+/, "")
      .replace(/^\s*\(([A-Za-z0-9ivxIVX]+)\)\s+/, ""))
    .join("\n");
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
  if (sectionKey === "consumerDebt") state.consumerDebt = defaults.consumerDebt;
  if (sectionKey === "loi") state.loi = defaults.loi;
  if (sectionKey === "loanDocs") state.loanDocs = defaults.loanDocs;
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

async function copyLoanDocText(text, button, target, html) {
  if (!String(text || "").trim()) {
    flashButton(button, "No Text");
    flashCopyTarget(target, "no-value");
    return;
  }
  try {
    if (html && canCopyRichTextToClipboard()) {
      await copyRichTextToClipboard(text, html);
    } else {
      await copyTextToClipboard(text);
    }
    flashButton(button, "Copied");
    flashCopyTarget(target, "copied");
  } catch (error) {
    flashButton(button, "Copy Failed");
    flashCopyTarget(target, "copy-failed");
  }
}

function canCopyRichTextToClipboard() {
  return Boolean(
    navigator.clipboard
      && typeof navigator.clipboard.write === "function"
      && typeof ClipboardItem !== "undefined",
  );
}

async function copyRichTextToClipboard(text, html) {
  const item = new ClipboardItem({
    "text/plain": new Blob([text], { type: "text/plain" }),
    "text/html": new Blob([buildLoanDocClipboardHtml(html)], { type: "text/html" }),
  });
  await navigator.clipboard.write([item]);
}

function buildLoanDocClipboardHtml(content) {
  return [
    "<!DOCTYPE html>",
    "<html>",
    "<head>",
    '<meta charset="utf-8">',
    "</head>",
    '<body style="font-family:\'Times New Roman\', Times, serif; font-size:12pt; line-height:1.35;">',
    "<!--StartFragment-->",
    content,
    "<!--EndFragment-->",
    "</body>",
    "</html>",
  ].join("");
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

function getAptRentTypeInputValue(typeValue) {
  const match = aptRentTypeOptions.find((type) => type.value === typeValue);
  return match ? match.label : "";
}

function normalizeAptRentTypeInput(rawValue) {
  const normalized = String(rawValue || "").trim().toLowerCase().replace(/[-_]+/g, " ");
  if (!normalized) return "";
  return aptRentTypeAliases[normalized] || "";
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

function formatLoanDocPercentInput(raw) {
  const parsed = parseLooseNumber(raw);
  if (parsed === null) return "";
  return `${parsed.toFixed(2)}%`;
}

function formatLoanDocPercentWords(raw) {
  const parsed = parseLooseNumber(raw);
  if (parsed === null) return "";
  const normalized = Math.abs(parsed);
  const whole = Math.trunc(normalized);
  const hundredths = Math.round((normalized - whole) * 100);
  const prefix = parsed < 0 ? "NEGATIVE " : "";
  if (hundredths === 0) return `${prefix}${numberToWordsUpper(whole)}`;

  const fractionalWords = getLoanDocFractionWords(hundredths);
  if (whole === 0) return `${prefix}${fractionalWords}`;
  return `${prefix}${numberToWordsUpper(whole)} and ${fractionalWords}`;
}

function getLoanDocFractionWords(hundredths) {
  if (hundredths === 50) return "ONE HALF";
  if (hundredths === 25) return "ONE QUARTER";
  if (hundredths === 75) return "THREE QUARTERS";
  if (hundredths % 10 === 0) {
    const tenths = hundredths / 10;
    return `${numberToWordsUpper(tenths)} TENTHS`;
  }
  return `${numberToWordsUpper(hundredths)} HUNDREDTHS`;
}

function numberToWordsUpper(value) {
  return numberToWords(value).toUpperCase();
}

function numberToWords(value) {
  const ones = [
    "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine",
    "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen",
    "seventeen", "eighteen", "nineteen",
  ];
  const tens = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
  const scales = [
    { value: 1000000000, label: "billion" },
    { value: 1000000, label: "million" },
    { value: 1000, label: "thousand" },
    { value: 100, label: "hundred" },
  ];

  const integer = Math.trunc(Math.abs(Number(value) || 0));
  if (integer < 20) return ones[integer];
  if (integer < 100) {
    const tenValue = Math.trunc(integer / 10);
    const rest = integer % 10;
    return rest ? `${tens[tenValue]}-${ones[rest]}` : tens[tenValue];
  }

  for (const scale of scales) {
    if (integer < scale.value) continue;
    const lead = Math.trunc(integer / scale.value);
    const rest = integer % scale.value;
    const leadWords = `${numberToWords(lead)} ${scale.label}`;
    return rest ? `${leadWords} ${numberToWords(rest)}` : leadWords;
  }

  return String(integer);
}

function formatLoanDocDateInput(raw) {
  const parsedDate = parseLoanDocDate(raw);
  if (!parsedDate) return String(raw || "").trim();
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(parsedDate);
}

function parseLoanDocDate(raw) {
  const value = String(raw || "").trim();
  if (!value) return null;

  const isoMatch = value.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoMatch) return buildUtcDate(Number(isoMatch[1]), Number(isoMatch[2]), Number(isoMatch[3]));

  const slashMatch = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (slashMatch) {
    const year = Number(slashMatch[3].length === 2 ? `20${slashMatch[3]}` : slashMatch[3]);
    return buildUtcDate(year, Number(slashMatch[1]), Number(slashMatch[2]));
  }

  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return null;
  const candidate = new Date(parsed);
  return buildUtcDate(candidate.getUTCFullYear(), candidate.getUTCMonth() + 1, candidate.getUTCDate());
}

function buildUtcDate(year, month, day) {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return null;
  const candidate = new Date(Date.UTC(year, month - 1, day));
  if (
    candidate.getUTCFullYear() !== year
    || candidate.getUTCMonth() !== month - 1
    || candidate.getUTCDate() !== day
  ) return null;
  return candidate;
}

function formatDecimalInput(raw, maxDecimals = 3) {
  const parsed = Number.isFinite(raw) ? raw : parseLooseNumber(raw);
  if (parsed === null || !Number.isFinite(parsed)) return "";
  return parsed.toFixed(maxDecimals).replace(/\.?0+$/, "");
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

function formatPercentDisplay(value, maxDecimals = 3) {
  if (!Number.isFinite(value)) return "-";
  return `${value.toFixed(maxDecimals)}%`;
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

function sumNullable(values) {
  const parsedValues = values.filter((value) => Number.isFinite(value));
  return parsedValues.length ? parsedValues.reduce((sum, value) => sum + value, 0) : null;
}

function getBlendedMonthsLabel(firstMonths, secondMonths) {
  if (firstMonths === null && secondMonths === null) return "-";
  if (firstMonths === null) return `${secondMonths}`;
  if (secondMonths === null) return `${firstMonths}`;
  if (firstMonths === secondMonths) return `${firstMonths}`;
  return `${firstMonths} / ${secondMonths}`;
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
