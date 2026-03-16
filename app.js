const STORAGE_KEY = "loftools-state-v1";
const leaseCapStep = 0.5;
const leaseCapCount = 5;
const aptRentTypeOptions = [
  { value: "studio", label: "Studio" },
  { value: "onebed", label: "1 Bed" },
  { value: "twobed", label: "2 Bed" },
  { value: "threebed", label: "3 Bed" },
];
const leaseExpenseRates = {
  nnn: 0.1,
  modified: 0.2,
  gross: 0.35,
};

const state = loadState();

const elements = {
  tabs: Array.from(document.querySelectorAll(".tab")),
  panels: Array.from(document.querySelectorAll(".panel")),
  leaseSqft: document.getElementById("lease-sqft"),
  leaseVacancy: document.getElementById("lease-vacancy"),
  leaseStartCap: document.getElementById("lease-start-cap"),
  leaseRows: document.getElementById("lease-rows"),
  leaseAverageRent: document.getElementById("lease-average-rent"),
  leaseMonthlyNoi: document.getElementById("lease-monthly-noi"),
  leaseAnnualNoi: document.getElementById("lease-annual-noi"),
  leaseNoiAfterVacancy: document.getElementById("lease-noi-after-vacancy"),
  leaseCapResults: document.getElementById("lease-cap-results"),
  leaseCopyBtn: document.getElementById("lease-copy-btn"),
  leaseClearBtn: document.getElementById("lease-clear-btn"),
  saleSubjectSqft: document.getElementById("sale-subject-sqft"),
  saleListingDiscount: document.getElementById("sale-listing-discount"),
  saleRows: document.getElementById("sale-rows"),
  saleAveragePsf: document.getElementById("sale-average-psf"),
  saleIndicatedValue: document.getElementById("sale-indicated-value"),
  saleCopyBtn: document.getElementById("sale-copy-btn"),
  saleClearBtn: document.getElementById("sale-clear-btn"),
  saleAddRowBtn: document.getElementById("sale-add-row"),
  aptSaleEnableSf: document.getElementById("apt-sale-enable-sf"),
  aptSaleSubjectUnits: document.getElementById("apt-sale-subject-units"),
  aptSaleSubjectSqft: document.getElementById("apt-sale-subject-sqft"),
  aptSaleSubjectSqftField: document.getElementById("apt-sale-subject-sqft-field"),
  aptSaleRows: document.getElementById("apt-sale-rows"),
  aptSaleSfHeading: document.getElementById("apt-sale-sf-heading"),
  aptSalePsfHeading: document.getElementById("apt-sale-psf-heading"),
  aptSaleSummaryGrid: document.getElementById("apt-sale-summary-grid"),
  aptSaleAverageUnit: document.getElementById("apt-sale-average-unit"),
  aptSaleIndicatedUnit: document.getElementById("apt-sale-indicated-unit"),
  aptSaleAverageSfCard: document.getElementById("apt-sale-average-sf-card"),
  aptSaleAverageSf: document.getElementById("apt-sale-average-sf"),
  aptSaleIndicatedSfCard: document.getElementById("apt-sale-indicated-sf-card"),
  aptSaleIndicatedSf: document.getElementById("apt-sale-indicated-sf"),
  aptSaleCopyBtn: document.getElementById("apt-sale-copy-btn"),
  aptSaleClearBtn: document.getElementById("apt-sale-clear-btn"),
  aptSaleAddRowBtn: document.getElementById("apt-sale-add-row"),
  aptRentStudio: document.getElementById("apt-rent-studio"),
  aptRentOnebed: document.getElementById("apt-rent-onebed"),
  aptRentTwobed: document.getElementById("apt-rent-twobed"),
  aptRentThreebed: document.getElementById("apt-rent-threebed"),
  aptRentVacancy: document.getElementById("apt-rent-vacancy"),
  aptRentExpense: document.getElementById("apt-rent-expense"),
  aptRentStartCap: document.getElementById("apt-rent-start-cap"),
  aptRentRows: document.getElementById("apt-rent-rows"),
  aptRentAvgStudio: document.getElementById("apt-rent-avg-studio"),
  aptRentAvgOnebed: document.getElementById("apt-rent-avg-onebed"),
  aptRentAvgTwobed: document.getElementById("apt-rent-avg-twobed"),
  aptRentAvgThreebed: document.getElementById("apt-rent-avg-threebed"),
  aptRentAnnualGross: document.getElementById("apt-rent-annual-gross"),
  aptRentEffectiveGrossIncome: document.getElementById("apt-rent-effective-gross-income"),
  aptRentAnnualNoi: document.getElementById("apt-rent-annual-noi"),
  aptRentStartCapValue: document.getElementById("apt-rent-start-cap-value"),
  aptRentCapResults: document.getElementById("apt-rent-cap-results"),
  aptRentCopyBtn: document.getElementById("apt-rent-copy-btn"),
  aptRentClearBtn: document.getElementById("apt-rent-clear-btn"),
  currentRentModeButtons: Array.from(document.querySelectorAll("[data-current-rent-mode]")),
  currentRentStartCap: document.getElementById("current-rent-start-cap"),
  currentRentAdditionalIncome: document.getElementById("current-rent-additional-income"),
  currentRentVacancy: document.getElementById("current-rent-vacancy"),
  currentRentExpenseField: document.getElementById("current-rent-expense-field"),
  currentRentExpense: document.getElementById("current-rent-expense"),
  currentRentCommercialTable: document.getElementById("current-rent-commercial-table"),
  currentRentApartmentTable: document.getElementById("current-rent-apartment-table"),
  currentRentCommercialRows: document.getElementById("current-rent-commercial-rows"),
  currentRentApartmentRows: document.getElementById("current-rent-apartment-rows"),
  currentRentCommercialHint: document.getElementById("current-rent-commercial-hint"),
  currentRentApartmentHint: document.getElementById("current-rent-apartment-hint"),
  currentRentSummary1Label: document.getElementById("current-rent-summary-1-label"),
  currentRentSummary1: document.getElementById("current-rent-summary-1"),
  currentRentSummary2Label: document.getElementById("current-rent-summary-2-label"),
  currentRentSummary2: document.getElementById("current-rent-summary-2"),
  currentRentSummary3Label: document.getElementById("current-rent-summary-3-label"),
  currentRentSummary3: document.getElementById("current-rent-summary-3"),
  currentRentSummary4Label: document.getElementById("current-rent-summary-4-label"),
  currentRentSummary4: document.getElementById("current-rent-summary-4"),
  currentRentSummary5Label: document.getElementById("current-rent-summary-5-label"),
  currentRentSummary5: document.getElementById("current-rent-summary-5"),
  currentRentSummary6Label: document.getElementById("current-rent-summary-6-label"),
  currentRentSummary6: document.getElementById("current-rent-summary-6"),
  currentRentSummary7Card: document.getElementById("current-rent-summary-7-card"),
  currentRentSummary7Label: document.getElementById("current-rent-summary-7-label"),
  currentRentSummary7: document.getElementById("current-rent-summary-7"),
  currentRentCapResults: document.getElementById("current-rent-cap-results"),
  currentRentCopyBtn: document.getElementById("current-rent-copy-btn"),
  currentRentClearBtn: document.getElementById("current-rent-clear-btn"),
};

const derived = {
  leaseCopyAmount: null,
  saleCopyAmount: null,
  aptSaleCopyAmount: null,
  aptRentCopyAmount: null,
  currentRentCopyAmount: null,
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
    activeTab: "lease",
    lease: {
      sqft: "",
      vacancy: "5",
      startCap: "",
      selectedCapRate: null,
      rows: [createLeaseRow()],
    },
    sale: {
      subjectSqft: "",
      listingDiscount: "0",
      rows: [createSaleRow()],
    },
    aptSale: {
      enablePerSf: false,
      subjectUnits: "",
      subjectSqft: "",
      rows: [createAptSaleRow()],
    },
    aptRent: {
      mix: {
        studio: "0",
        onebed: "0",
        twobed: "0",
        threebed: "0",
      },
      vacancy: "5",
      expensePercent: "20",
      startCap: "",
      selectedCapRate: null,
      rows: aptRentTypeOptions.map((type) => createAptRentRow(type.value)),
    },
    currentRent: {
      mode: "commercial",
      startCap: "",
      additionalIncome: "",
      vacancy: "",
      selectedCapRate: null,
      commercial: {
        rows: [createCurrentRentCommercialRow()],
      },
      apartment: {
        expensePercent: "20",
        rows: [createCurrentRentApartmentRow()],
      },
    },
  };
}

function normalizeState(input) {
  const fallback = createDefaultState();
  const next = {
    activeTab: ["lease", "sale", "aptSale", "aptRent", "currentRent"].includes(input?.activeTab) ? input.activeTab : fallback.activeTab,
    lease: {
      sqft: String(input?.lease?.sqft || ""),
      vacancy: String(input?.lease?.vacancy || fallback.lease.vacancy),
      startCap: String(input?.lease?.startCap || ""),
      selectedCapRate: Number.isFinite(input?.lease?.selectedCapRate) ? input.lease.selectedCapRate : null,
      rows: Array.isArray(input?.lease?.rows) && input.lease.rows.length
        ? input.lease.rows.map((row) => ({
            rent: String(row?.rent || ""),
            leaseType: ["nnn", "modified", "gross"].includes(row?.leaseType) ? row.leaseType : "nnn",
            include: row?.include !== false,
            userTouched: row?.userTouched === true,
          }))
        : fallback.lease.rows,
    },
    sale: {
      subjectSqft: String(input?.sale?.subjectSqft || ""),
      listingDiscount: String(input?.sale?.listingDiscount || fallback.sale.listingDiscount),
      rows: Array.isArray(input?.sale?.rows) && input.sale.rows.length
        ? input.sale.rows.map((row) => ({
            sqft: String(row?.sqft || ""),
            price: String(row?.price || ""),
            psf: String(row?.psf || ""),
            listing: row?.listing === true,
            include: row?.include !== false,
            userTouched: row?.userTouched === true,
          }))
        : fallback.sale.rows,
    },
    aptSale: {
      enablePerSf: input?.aptSale?.enablePerSf === true || input?.aptSale?.method === "perSf",
      subjectUnits: String(input?.aptSale?.subjectUnits || ""),
      subjectSqft: String(input?.aptSale?.subjectSqft || ""),
      rows: Array.isArray(input?.aptSale?.rows) && input.aptSale.rows.length
        ? input.aptSale.rows.map((row) => ({
            price: String(row?.price || ""),
            units: String(row?.units || ""),
            sqft: String(row?.sqft || ""),
            include: row?.include !== false,
            userTouched: row?.userTouched === true,
          }))
        : fallback.aptSale.rows,
    },
    aptRent: {
      mix: {
        studio: String(input?.aptRent?.mix?.studio ?? fallback.aptRent.mix.studio),
        onebed: String(input?.aptRent?.mix?.onebed ?? fallback.aptRent.mix.onebed),
        twobed: String(input?.aptRent?.mix?.twobed ?? fallback.aptRent.mix.twobed),
        threebed: String(input?.aptRent?.mix?.threebed ?? fallback.aptRent.mix.threebed),
      },
      vacancy: String(input?.aptRent?.vacancy || fallback.aptRent.vacancy),
      expensePercent: String(input?.aptRent?.expensePercent || fallback.aptRent.expensePercent),
      startCap: String(input?.aptRent?.startCap || ""),
      selectedCapRate: Number.isFinite(input?.aptRent?.selectedCapRate) ? input.aptRent.selectedCapRate : null,
      rows: Array.isArray(input?.aptRent?.rows) && input.aptRent.rows.length
        ? aptRentTypeOptions.map((type) => {
            const match = input.aptRent.rows.find((row) => row?.type === type.value);
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
        : fallback.aptRent.rows,
    },
    currentRent: {
      mode: ["commercial", "apartment"].includes(input?.currentRent?.mode) ? input.currentRent.mode : fallback.currentRent.mode,
      startCap: String(input?.currentRent?.startCap || ""),
      additionalIncome: String(input?.currentRent?.additionalIncome || ""),
      vacancy: String(input?.currentRent?.vacancy || ""),
      selectedCapRate: Number.isFinite(input?.currentRent?.selectedCapRate) ? input.currentRent.selectedCapRate : null,
      commercial: {
        rows: Array.isArray(input?.currentRent?.commercial?.rows) && input.currentRent.commercial.rows.length
          ? input.currentRent.commercial.rows.map((row) => ({
              rent: String(row?.rent || ""),
              leaseType: ["nnn", "modified", "gross"].includes(row?.leaseType) ? row.leaseType : "nnn",
            }))
          : fallback.currentRent.commercial.rows,
      },
      apartment: {
        expensePercent: String(input?.currentRent?.apartment?.expensePercent || fallback.currentRent.apartment.expensePercent),
        rows: Array.isArray(input?.currentRent?.apartment?.rows) && input.currentRent.apartment.rows.length
          ? input.currentRent.apartment.rows.map((row) => ({
              rent: String(row?.rent || ""),
            }))
          : fallback.currentRent.apartment.rows,
      },
    },
  };
  return next;
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
  return {
    type,
    include: true,
    userTouched: false,
    includeOutlier: false,
    rents: ["", "", "", ""],
  };
}

function createCurrentRentCommercialRow() {
  return { rent: "", leaseType: "nnn" };
}

function createCurrentRentApartmentRow() {
  return { rent: "" };
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
      renderTabs();
      persistState();
    });
  });

  bindInput(elements.leaseSqft, (value) => {
    state.lease.sqft = value;
    renderLease();
  });
  bindInput(elements.leaseVacancy, (value) => {
    state.lease.vacancy = value;
    renderLease();
  });
  bindInput(elements.leaseStartCap, (value) => {
    state.lease.startCap = value;
    renderLease();
  });
  bindBlurFormatWhole(elements.leaseSqft, () => {
    state.lease.sqft = formatWholeInput(state.lease.sqft);
    renderLease();
  });
  bindBlurCap(elements.leaseStartCap, () => {
    state.lease.startCap = formatCapInput(state.lease.startCap);
    renderLease();
  });
  elements.leaseVacancy?.addEventListener("blur", () => {
    state.lease.vacancy = formatPercentInput(state.lease.vacancy, 100);
    renderLease();
  });

  bindInput(elements.saleSubjectSqft, (value) => {
    state.sale.subjectSqft = value;
    renderSale();
  });
  bindInput(elements.saleListingDiscount, (value) => {
    state.sale.listingDiscount = value;
    renderSale();
  });
  bindBlurFormatWhole(elements.saleSubjectSqft, () => {
    state.sale.subjectSqft = formatWholeInput(state.sale.subjectSqft);
    renderSale();
  });
  elements.saleListingDiscount?.addEventListener("blur", () => {
    state.sale.listingDiscount = formatPercentInput(state.sale.listingDiscount, 100);
    renderSale();
  });
  elements.saleAddRowBtn?.addEventListener("click", () => {
    state.sale.rows.push(createSaleRow());
    renderSale();
  });

  elements.aptSaleEnableSf?.addEventListener("change", () => {
    state.aptSale.enablePerSf = elements.aptSaleEnableSf.checked;
    renderAptSale();
  });
  bindInput(elements.aptSaleSubjectUnits, (value) => {
    state.aptSale.subjectUnits = value;
    renderAptSale();
  });
  bindInput(elements.aptSaleSubjectSqft, (value) => {
    state.aptSale.subjectSqft = value;
    renderAptSale();
  });
  bindBlurFormatWhole(elements.aptSaleSubjectUnits, () => {
    state.aptSale.subjectUnits = formatWholeInput(state.aptSale.subjectUnits);
    renderAptSale();
  });
  bindBlurFormatWhole(elements.aptSaleSubjectSqft, () => {
    state.aptSale.subjectSqft = formatWholeInput(state.aptSale.subjectSqft);
    renderAptSale();
  });
  elements.aptSaleAddRowBtn?.addEventListener("click", () => {
    state.aptSale.rows.push(createAptSaleRow());
    renderAptSale();
  });

  bindInput(elements.aptRentStudio, (value) => {
    state.aptRent.mix.studio = value;
    renderAptRent();
  });
  bindInput(elements.aptRentOnebed, (value) => {
    state.aptRent.mix.onebed = value;
    renderAptRent();
  });
  bindInput(elements.aptRentTwobed, (value) => {
    state.aptRent.mix.twobed = value;
    renderAptRent();
  });
  bindInput(elements.aptRentThreebed, (value) => {
    state.aptRent.mix.threebed = value;
    renderAptRent();
  });
  [elements.aptRentStudio, elements.aptRentOnebed, elements.aptRentTwobed, elements.aptRentThreebed].forEach((input, index) => {
    if (!input) return;
    const keys = ["studio", "onebed", "twobed", "threebed"];
    input.addEventListener("blur", () => {
      const key = keys[index];
      state.aptRent.mix[key] = String(parseNonNegativeWholeNumber(state.aptRent.mix[key] || "0"));
      renderAptRent();
    });
  });
  bindInput(elements.aptRentVacancy, (value) => {
    state.aptRent.vacancy = value;
    renderAptRent();
  });
  bindInput(elements.aptRentExpense, (value) => {
    state.aptRent.expensePercent = value;
    renderAptRent();
  });
  bindInput(elements.aptRentStartCap, (value) => {
    state.aptRent.startCap = value;
    renderAptRent();
  });
  elements.aptRentVacancy?.addEventListener("blur", () => {
    state.aptRent.vacancy = formatPercentInput(state.aptRent.vacancy, 100);
    renderAptRent();
  });
  elements.aptRentExpense?.addEventListener("blur", () => {
    state.aptRent.expensePercent = formatPercentInput(state.aptRent.expensePercent, 100);
    renderAptRent();
  });
  bindBlurCap(elements.aptRentStartCap, () => {
    state.aptRent.startCap = formatCapInput(state.aptRent.startCap);
    renderAptRent();
  });

  elements.currentRentModeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      state.currentRent.mode = button.dataset.currentRentMode;
      renderCurrentRent();
    });
  });
  bindInput(elements.currentRentStartCap, (value) => {
    state.currentRent.startCap = value;
    renderCurrentRent();
  });
  bindInput(elements.currentRentAdditionalIncome, (value) => {
    state.currentRent.additionalIncome = value;
    renderCurrentRent();
  });
  bindInput(elements.currentRentVacancy, (value) => {
    state.currentRent.vacancy = value;
    renderCurrentRent();
  });
  bindInput(elements.currentRentExpense, (value) => {
    state.currentRent.apartment.expensePercent = value;
    renderCurrentRent();
  });
  bindBlurCap(elements.currentRentStartCap, () => {
    state.currentRent.startCap = formatCapInput(state.currentRent.startCap);
    renderCurrentRent();
  });
  elements.currentRentAdditionalIncome?.addEventListener("blur", () => {
    state.currentRent.additionalIncome = formatMoneyInput(state.currentRent.additionalIncome, 0);
    renderCurrentRent();
  });
  elements.currentRentVacancy?.addEventListener("blur", () => {
    state.currentRent.vacancy = formatPercentInput(state.currentRent.vacancy, 100);
    renderCurrentRent();
  });
  elements.currentRentExpense?.addEventListener("blur", () => {
    state.currentRent.apartment.expensePercent = formatPercentInput(state.currentRent.apartment.expensePercent, 100);
    renderCurrentRent();
  });

  elements.leaseCopyBtn?.addEventListener("click", () => copyAmount(derived.leaseCopyAmount, elements.leaseCopyBtn));
  elements.leaseClearBtn?.addEventListener("click", () => clearTabValues("lease", elements.leaseClearBtn));
  elements.saleCopyBtn?.addEventListener("click", () => copyAmount(derived.saleCopyAmount, elements.saleCopyBtn));
  elements.saleClearBtn?.addEventListener("click", () => clearTabValues("sale", elements.saleClearBtn));
  elements.aptSaleCopyBtn?.addEventListener("click", () => copyAmount(derived.aptSaleCopyAmount, elements.aptSaleCopyBtn));
  elements.aptSaleClearBtn?.addEventListener("click", () => clearTabValues("aptSale", elements.aptSaleClearBtn));
  elements.aptRentCopyBtn?.addEventListener("click", () => copyAmount(derived.aptRentCopyAmount, elements.aptRentCopyBtn));
  elements.aptRentClearBtn?.addEventListener("click", () => clearTabValues("aptRent", elements.aptRentClearBtn));
  elements.currentRentCopyBtn?.addEventListener("click", () => copyAmount(derived.currentRentCopyAmount, elements.currentRentCopyBtn));
  elements.currentRentClearBtn?.addEventListener("click", () => clearTabValues("currentRent", elements.currentRentClearBtn));

  bindCopyValueTrigger(elements.saleIndicatedValue, () => derived.saleCopyAmount, elements.saleCopyBtn);
  bindCopyValueTrigger(elements.aptSaleIndicatedUnit, () => calculateAptSale().indicatedPerUnit, elements.aptSaleCopyBtn);
  bindCopyValueTrigger(elements.aptSaleIndicatedSf, () => calculateAptSale().indicatedPerSf, elements.aptSaleCopyBtn);
}

function bindInput(element, handler) {
  if (!element) return;
  element.addEventListener("input", (event) => {
    handler(event.target.value);
  });
  element.addEventListener("change", (event) => {
    handler(event.target.value);
  });
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
  element.value = value;
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
  if (
    typeof focusState.selectionStart === "number" &&
    typeof focusState.selectionEnd === "number" &&
    typeof next.setSelectionRange === "function"
  ) {
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
  if (token.startsWith("focus:")) {
    next = document.querySelector(`[data-focus-key="${token.slice(6)}"]`);
  } else if (token.startsWith("id:")) {
    next = document.getElementById(token.slice(3));
  }
  if (!(next instanceof HTMLElement)) return false;
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
  const items = sequence.filter((element) => element instanceof HTMLElement && !element.disabled && !element.hidden);
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
    elements.leaseSqft,
    elements.leaseVacancy,
    elements.leaseStartCap,
    ...Array.from(elements.leaseRows.querySelectorAll("[data-lease-rent], [data-lease-type]")).sort((left, right) => {
      const leftRow = Number(left.getAttribute("data-lease-rent") ?? left.getAttribute("data-lease-type"));
      const rightRow = Number(right.getAttribute("data-lease-rent") ?? right.getAttribute("data-lease-type"));
      if (leftRow !== rightRow) return leftRow - rightRow;
      return left.hasAttribute("data-lease-rent") ? -1 : 1;
    }),
  ]);

  bindTabSequence([
    elements.saleSubjectSqft,
    elements.saleListingDiscount,
    ...Array.from(elements.saleRows.querySelectorAll("[data-sale-price], [data-sale-sqft]")).sort((left, right) => {
      const leftRow = Number(left.getAttribute("data-sale-price") ?? left.getAttribute("data-sale-sqft"));
      const rightRow = Number(right.getAttribute("data-sale-price") ?? right.getAttribute("data-sale-sqft"));
      if (leftRow !== rightRow) return leftRow - rightRow;
      return left.hasAttribute("data-sale-price") ? -1 : 1;
    }),
  ]);

  bindTabSequence([
    elements.aptSaleSubjectUnits,
    elements.aptSaleEnableSf,
    ...(state.aptSale.enablePerSf ? [elements.aptSaleSubjectSqft] : []),
    ...Array.from(elements.aptSaleRows.querySelectorAll("[data-apt-sale-price], [data-apt-sale-units], [data-apt-sale-sqft]"))
      .filter((element) => state.aptSale.enablePerSf || !element.hasAttribute("data-apt-sale-sqft"))
      .sort((left, right) => {
      const leftRow = Number(left.getAttribute("data-apt-sale-price") ?? left.getAttribute("data-apt-sale-units") ?? left.getAttribute("data-apt-sale-sqft"));
      const rightRow = Number(right.getAttribute("data-apt-sale-price") ?? right.getAttribute("data-apt-sale-units") ?? right.getAttribute("data-apt-sale-sqft"));
      if (leftRow !== rightRow) return leftRow - rightRow;
      const order = (element) => (
        element.hasAttribute("data-apt-sale-price") ? 0 : element.hasAttribute("data-apt-sale-units") ? 1 : 2
      );
      return order(left) - order(right);
    }),
  ]);

  bindTabSequence([
    elements.aptRentStudio,
    elements.aptRentOnebed,
    elements.aptRentTwobed,
    elements.aptRentThreebed,
    elements.aptRentVacancy,
    elements.aptRentExpense,
    elements.aptRentStartCap,
    ...Array.from(elements.aptRentRows.querySelectorAll("[data-apt-rent-sample]")).filter((input) => input.closest("tr")?.style.display !== "none"),
  ]);

  bindTabSequence([
    ...elements.currentRentModeButtons,
    elements.currentRentStartCap,
    elements.currentRentAdditionalIncome,
    elements.currentRentVacancy,
    ...(state.currentRent.mode === "apartment" ? [elements.currentRentExpense] : []),
    ...Array.from(
      state.currentRent.mode === "commercial"
        ? elements.currentRentCommercialRows.querySelectorAll("[data-current-rent-commercial-rent], [data-current-rent-commercial-type]")
        : elements.currentRentApartmentRows.querySelectorAll("[data-current-rent-apartment-rent]")
    ).sort((left, right) => {
      const leftRow = Number(
        left.getAttribute("data-current-rent-commercial-rent") ??
        left.getAttribute("data-current-rent-commercial-type") ??
        left.getAttribute("data-current-rent-apartment-rent")
      );
      const rightRow = Number(
        right.getAttribute("data-current-rent-commercial-rent") ??
        right.getAttribute("data-current-rent-commercial-type") ??
        right.getAttribute("data-current-rent-apartment-rent")
      );
      if (leftRow !== rightRow) return leftRow - rightRow;
      return left.hasAttribute("data-current-rent-commercial-rent") ? -1 : 1;
    }),
  ]);
}

function renderAll() {
  renderTabs();
  renderLease();
  renderSale();
  renderAptSale();
  renderAptRent();
  renderCurrentRent();
}

function clearTabValues(tabKey, button) {
  const defaults = createDefaultState();
  if (tabKey === "lease") {
    state.lease = defaults.lease;
  } else if (tabKey === "sale") {
    state.sale = defaults.sale;
  } else if (tabKey === "aptSale") {
    state.aptSale = defaults.aptSale;
  } else if (tabKey === "aptRent") {
    state.aptRent = defaults.aptRent;
  } else if (tabKey === "currentRent") {
    state.currentRent = defaults.currentRent;
  } else {
    return;
  }
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

function renderLease() {
  setControlValue(elements.leaseSqft, state.lease.sqft);
  setControlValue(elements.leaseVacancy, state.lease.vacancy);
  setControlValue(elements.leaseStartCap, state.lease.startCap);

  ensureLeaseTrailingEmptyRow();
  const calculations = calculateLease();
  const focusState = captureActiveInputState(elements.leaseRows);

  elements.leaseRows.innerHTML = state.lease.rows.map((row, index) => {
    const rowCalc = calculations.rows[index];
    const outlierChip = rowCalc?.isOutlier ? '<span class="chip outlier">High Outlier</span>' : "";
    return `
      <tr class="${rowCalc?.isOutlier ? "is-outlier" : ""}">
        <td><input type="checkbox" data-lease-include="${index}" tabindex="-1" ${row.include ? "checked" : ""} /></td>
        <td><input class="table-input" type="text" data-focus-key="lease-rent-${index}" data-lease-rent="${index}" value="${escapeHtml(row.rent)}" placeholder="Rent / SF..." /></td>
        <td>
          <select class="table-select" data-focus-key="lease-type-${index}" data-lease-type="${index}" tabindex="-1">
            <option value="nnn" ${row.leaseType === "nnn" ? "selected" : ""}>NNN</option>
            <option value="modified" ${row.leaseType === "modified" ? "selected" : ""}>Modified</option>
            <option value="gross" ${row.leaseType === "gross" ? "selected" : ""}>Gross</option>
          </select>
        </td>
        <td>${rowCalc?.expenseLabel || "10%"}</td>
        <td>
          <div class="metric-stack">
            <span>${rowCalc?.adjustedRentLabel || "-"}</span>
            ${outlierChip}
          </div>
        </td>
        <td>${state.lease.rows.length > 1 ? `<button class="row-remove" type="button" data-lease-remove="${index}" tabindex="-1">Remove</button>` : ""}</td>
      </tr>
    `;
  }).join("");

  bindLeaseRowEvents();
  bindTabFlows();
  if (!consumePendingFocus()) restoreActiveInputState(elements.leaseRows, focusState);
  renderLeaseMetrics(calculations);
}

function renderLeaseMetrics(calculations = calculateLease()) {
  elements.leaseAverageRent.textContent = calculations.averageAdjustedRent === null ? "-" : `${formatCurrency(calculations.averageAdjustedRent, 2)} / SF`;
  elements.leaseMonthlyNoi.textContent = calculations.potentialMonthlyNoi === null ? "-" : formatCurrency(calculations.potentialMonthlyNoi, 0);
  elements.leaseAnnualNoi.textContent = calculations.potentialAnnualNoi === null ? "-" : formatCurrency(calculations.potentialAnnualNoi, 0);
  elements.leaseNoiAfterVacancy.textContent = calculations.annualNoiAfterVacancy === null ? "-" : formatCurrency(calculations.annualNoiAfterVacancy, 0);
  derived.leaseCopyAmount = calculations.selectedCapValue;
  setCopyButtonState(elements.leaseCopyBtn, calculations.selectedCapValue);

  renderCapResults({
    tbody: elements.leaseCapResults,
    startCapRaw: state.lease.startCap,
    selectedCapRate: state.lease.selectedCapRate,
    annualNoiAfterVacancy: calculations.annualNoiAfterVacancy,
    onSelect: (capRate) => {
      state.lease.selectedCapRate = capRate;
      renderLease();
    },
    emptyMessage: "Enter a starting cap rate to generate values.",
    copyButton: elements.leaseCopyBtn,
    storeSelected: (capRate, value) => {
      state.lease.selectedCapRate = capRate;
      derived.leaseCopyAmount = value;
      setCopyButtonState(elements.leaseCopyBtn, value);
    },
  });
  persistState();
}

function calculateLease() {
  const rows = state.lease.rows.map((row) => {
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
    const sourceRow = state.lease.rows[index];
    const isOutlier = index === outlierIndex;
    row.isOutlier = isOutlier;
    if (!sourceRow) return;
    if (isOutlier) {
      if (sourceRow.userTouched !== true) sourceRow.include = false;
    } else if (sourceRow.userTouched !== true) {
      sourceRow.include = true;
    }
  });

  const selectedAdjustedRents = rows
    .map((row, index) => ({ row, source: state.lease.rows[index] }))
    .filter((entry) => entry.source?.include && entry.row.adjustedRent !== null)
    .map((entry) => entry.row.adjustedRent);

  const averageAdjustedRent = selectedAdjustedRents.length
    ? selectedAdjustedRents.reduce((sum, value) => sum + value, 0) / selectedAdjustedRents.length
    : null;
  const squareFootage = parsePositiveWholeNumber(state.lease.sqft);
  const vacancyRate = clampPercent(state.lease.vacancy);
  const potentialMonthlyNoi = averageAdjustedRent === null || squareFootage === null ? null : averageAdjustedRent * squareFootage;
  const potentialAnnualNoi = potentialMonthlyNoi === null ? null : potentialMonthlyNoi * 12;
  const annualNoiAfterVacancy = potentialAnnualNoi === null ? null : potentialAnnualNoi * (1 - vacancyRate);

  const selectedCapValue = calculateSelectedCapValue(state.lease.startCap, state.lease.selectedCapRate, annualNoiAfterVacancy, (nextRate) => {
    state.lease.selectedCapRate = nextRate;
  });

  return {
    rows,
    averageAdjustedRent,
    potentialMonthlyNoi,
    potentialAnnualNoi,
    annualNoiAfterVacancy,
    selectedCapValue,
  };
}

function bindLeaseRowEvents() {
  bindRepeatingRows(elements.leaseRows, {
    removeAttr: "data-lease-remove",
    onRemove: (index) => {
      if (state.lease.rows.length <= 1) return;
      state.lease.rows.splice(index, 1);
      renderLease();
    },
  });

  elements.leaseRows.querySelectorAll("[data-lease-include]").forEach((input) => {
    input.addEventListener("change", () => {
      const index = Number(input.dataset.leaseInclude);
      const row = state.lease.rows[index];
      if (!row) return;
      row.include = input.checked;
      row.userTouched = true;
      renderLease();
    });
  });
  elements.leaseRows.querySelectorAll("[data-lease-rent]").forEach((input) => {
    input.addEventListener("input", () => {
      const index = Number(input.dataset.leaseRent);
      if (!state.lease.rows[index]) return;
      state.lease.rows[index].rent = input.value;
      renderLease();
    });
    input.addEventListener("blur", () => {
      const index = Number(input.dataset.leaseRent);
      if (!state.lease.rows[index]) return;
      state.lease.rows[index].rent = formatMoneyInput(state.lease.rows[index].rent, 2);
      renderLease();
    });
  });
  elements.leaseRows.querySelectorAll("[data-lease-type]").forEach((select) => {
    select.addEventListener("change", () => {
      const index = Number(select.dataset.leaseType);
      if (!state.lease.rows[index]) return;
      state.lease.rows[index].leaseType = select.value;
      renderLease();
    });
  });
}

function ensureLeaseTrailingEmptyRow() {
  if (!state.lease.rows.length) {
    state.lease.rows.push(createLeaseRow());
    return;
  }
  if (state.lease.rows.length === 1 && leaseRowHasData(state.lease.rows[0])) {
    state.lease.rows.push(createLeaseRow());
    return;
  }
  const emptyIndexes = state.lease.rows
    .map((row, index) => ({ row, index }))
    .filter((entry) => !leaseRowHasData(entry.row));
  if (emptyIndexes.length > 1) {
    emptyIndexes.slice(0, -1).reverse().forEach((entry) => state.lease.rows.splice(entry.index, 1));
  }
  const lastRow = state.lease.rows[state.lease.rows.length - 1];
  if (leaseRowHasData(lastRow)) {
    state.lease.rows.push(createLeaseRow());
  }
}

function leaseRowHasData(row) {
  return parseLooseNumber(row?.rent || "") !== null;
}

function renderSale() {
  setControlValue(elements.saleSubjectSqft, state.sale.subjectSqft);
  setControlValue(elements.saleListingDiscount, state.sale.listingDiscount);

  ensureSaleTrailingEmptyRow();
  const calculations = calculateSale();
  const focusState = captureActiveInputState(elements.saleRows);

  elements.saleRows.innerHTML = state.sale.rows.map((row, index) => {
    const rowCalc = calculations.rows[index];
    const listingChip = row.listing && rowCalc?.usedPsf !== null ? '<span class="chip listing">Listing Adj</span>' : "";
    const outlierChip = rowCalc?.isOutlier ? '<span class="chip outlier">High Outlier</span>' : "";
    return `
      <tr class="${rowCalc?.isOutlier ? "is-outlier" : ""}">
        <td><input type="checkbox" data-sale-include="${index}" tabindex="-1" ${row.include ? "checked" : ""} /></td>
        <td>
          <div class="sale-toggle">
            <button type="button" class="${row.listing ? "" : "active"}" data-sale-type="${index}" data-sale-type-value="sale" tabindex="-1">Sale</button>
            <button type="button" class="${row.listing ? "active" : ""}" data-sale-type="${index}" data-sale-type-value="listing" tabindex="-1">Listing</button>
          </div>
        </td>
        <td><input class="table-input" type="text" data-focus-key="sale-price-${index}" data-sale-price="${index}" value="${escapeHtml(row.price)}" placeholder="Purchase Price..." ${rowCalc?.lockBasis ? "readonly" : ""} /></td>
        <td><input class="table-input" type="text" data-focus-key="sale-sqft-${index}" data-sale-sqft="${index}" value="${escapeHtml(row.sqft)}" placeholder="Comp SF..." ${rowCalc?.lockBasis ? "readonly" : ""} /></td>
        <td><input class="table-input" type="text" data-focus-key="sale-psf-${index}" data-sale-psf="${index}" value="${escapeHtml(row.psf)}" placeholder="$ / SF..." tabindex="-1" ${rowCalc?.lockPsf ? "readonly" : ""} /></td>
        <td>
          <div class="metric-stack">
            <span>${rowCalc?.usedPsfLabel || "-"}</span>
            ${listingChip}
            ${outlierChip}
          </div>
        </td>
        <td>${state.sale.rows.length > 1 ? `<button class="row-remove" type="button" data-sale-remove="${index}" tabindex="-1">Remove</button>` : ""}</td>
      </tr>
    `;
  }).join("");

  bindSaleRowEvents();
  bindTabFlows();
  if (!consumePendingFocus()) restoreActiveInputState(elements.saleRows, focusState);
  renderSaleMetrics(calculations);
}

function renderSaleMetrics(calculations = calculateSale()) {
  elements.saleAveragePsf.textContent = calculations.averagePsf === null ? "-" : `${formatCurrency(calculations.averagePsf, 2)} / SF`;
  elements.saleIndicatedValue.textContent = calculations.indicatedValue === null ? "-" : formatCurrency(calculations.indicatedValue, 0);
  elements.saleIndicatedValue.setAttribute("aria-disabled", String(!(Number.isFinite(calculations.indicatedValue) && calculations.indicatedValue > 0)));
  derived.saleCopyAmount = calculations.indicatedValue;
  setCopyButtonState(elements.saleCopyBtn, calculations.indicatedValue);
  persistState();
}

function calculateSale() {
  const listingDiscountRate = clampPercent(state.sale.listingDiscount);
  const rows = state.sale.rows.map((row) => {
    const sqft = parsePositiveWholeNumber(row.sqft);
    const price = parseLooseNumber(row.price);
    const manualPsf = parseLooseNumber(row.psf);
    const computedPsf = price !== null && sqft !== null && sqft > 0 ? price / sqft : null;
    const basePsf = computedPsf ?? manualPsf;
    const usedPsf = basePsf === null ? null : (row.listing ? basePsf * (1 - listingDiscountRate) : basePsf);
    const hasComputedBasis = computedPsf !== null;
    const hasManualPsf = manualPsf !== null;
    return {
      usedPsf,
      usedPsfLabel: usedPsf === null ? "-" : `${formatCurrency(usedPsf, 2)} / SF`,
      lockPsf: hasComputedBasis,
      lockBasis: hasManualPsf && !hasComputedBasis,
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
    const sourceRow = state.sale.rows[index];
    if (!sourceRow) return;
    if (row.isOutlier) {
      if (sourceRow.userTouched !== true) sourceRow.include = false;
    } else if (sourceRow.userTouched !== true) {
      sourceRow.include = true;
    }
  });

  const selectedMetrics = rows
    .map((row, index) => ({ row, source: state.sale.rows[index] }))
    .filter((entry) => entry.source?.include && entry.row.usedPsf !== null)
    .map((entry) => entry.row.usedPsf);

  const averagePsf = selectedMetrics.length
    ? selectedMetrics.reduce((sum, value) => sum + value, 0) / selectedMetrics.length
    : null;
  const subjectSqft = parsePositiveWholeNumber(state.sale.subjectSqft);
  const indicatedValue = averagePsf === null || subjectSqft === null ? null : averagePsf * subjectSqft;
  return { rows, averagePsf, indicatedValue };
}

function bindSaleRowEvents() {
  bindRepeatingRows(elements.saleRows, {
    removeAttr: "data-sale-remove",
    onRemove: (index) => {
      if (state.sale.rows.length <= 1) return;
      state.sale.rows.splice(index, 1);
      renderSale();
    },
  });

  elements.saleRows.querySelectorAll("[data-sale-include]").forEach((input) => {
    input.addEventListener("change", () => {
      const index = Number(input.dataset.saleInclude);
      const row = state.sale.rows[index];
      if (!row) return;
      row.include = input.checked;
      row.userTouched = true;
      renderSale();
    });
  });
  elements.saleRows.querySelectorAll("[data-sale-type]").forEach((button) => {
    button.addEventListener("click", () => {
      const index = Number(button.dataset.saleType);
      const row = state.sale.rows[index];
      if (!row) return;
      row.listing = button.dataset.saleTypeValue === "listing";
      renderSale();
    });
  });
  elements.saleRows.querySelectorAll("[data-sale-sqft]").forEach((input) => {
    input.addEventListener("input", () => updateSaleField(input.dataset.saleSqft, "sqft", input.value));
    input.addEventListener("blur", () => {
      const index = Number(input.dataset.saleSqft);
      if (!state.sale.rows[index]) return;
      state.sale.rows[index].sqft = formatWholeInput(state.sale.rows[index].sqft);
      renderSale();
    });
  });
  elements.saleRows.querySelectorAll("[data-sale-price]").forEach((input) => {
    input.addEventListener("input", () => updateSaleField(input.dataset.salePrice, "price", input.value));
    input.addEventListener("blur", () => {
      const index = Number(input.dataset.salePrice);
      if (!state.sale.rows[index]) return;
      state.sale.rows[index].price = formatMoneyInput(state.sale.rows[index].price, 0);
      renderSale();
    });
  });
  elements.saleRows.querySelectorAll("[data-sale-psf]").forEach((input) => {
    input.addEventListener("input", () => updateSaleField(input.dataset.salePsf, "psf", input.value));
    input.addEventListener("blur", () => {
      const index = Number(input.dataset.salePsf);
      if (!state.sale.rows[index]) return;
      state.sale.rows[index].psf = formatMoneyInput(state.sale.rows[index].psf, 2);
      renderSale();
    });
  });
}

function updateSaleField(indexRaw, field, value) {
  const index = Number(indexRaw);
  const row = state.sale.rows[index];
  if (!row) return;
  row[field] = value;
  if (field === "psf" && parseLooseNumber(value) !== null) {
    row.sqft = "";
    row.price = "";
    renderSale();
    return;
  }
  if (field !== "psf" && parseLooseNumber(row.psf) !== null) {
    row.psf = "";
    renderSale();
    return;
  }
  renderSale();
}

function ensureSaleTrailingEmptyRow() {
  if (!state.sale.rows.length) {
    state.sale.rows.push(createSaleRow());
    return;
  }
  if (state.sale.rows.length === 1 && saleRowHasData(state.sale.rows[0])) {
    state.sale.rows.push(createSaleRow());
    return;
  }
  const emptyIndexes = state.sale.rows
    .map((row, index) => ({ row, index }))
    .filter((entry) => !saleRowHasData(entry.row));
  if (emptyIndexes.length > 1) {
    emptyIndexes.slice(0, -1).reverse().forEach((entry) => state.sale.rows.splice(entry.index, 1));
  }
  const lastRow = state.sale.rows[state.sale.rows.length - 1];
  if (saleRowHasData(lastRow)) state.sale.rows.push(createSaleRow());
}

function saleRowHasData(row) {
  return (
    parseLooseNumber(row?.sqft || "") !== null ||
    parseLooseNumber(row?.price || "") !== null ||
    parseLooseNumber(row?.psf || "") !== null
  );
}

function renderAptSale() {
  if (elements.aptSaleEnableSf) elements.aptSaleEnableSf.checked = state.aptSale.enablePerSf;
  setControlValue(elements.aptSaleSubjectUnits, state.aptSale.subjectUnits);
  setControlValue(elements.aptSaleSubjectSqft, state.aptSale.subjectSqft);
  elements.aptSaleSubjectSqftField.hidden = !state.aptSale.enablePerSf;
  elements.aptSaleSfHeading.hidden = !state.aptSale.enablePerSf;
  elements.aptSalePsfHeading.hidden = !state.aptSale.enablePerSf;
  elements.aptSaleSummaryGrid.className = `summary-grid ${state.aptSale.enablePerSf ? "summary-grid-four" : "summary-grid-two"}`;

  ensureAptSaleTrailingEmptyRow();
  const calculations = calculateAptSale();
  const focusState = captureActiveInputState(elements.aptSaleRows);

  elements.aptSaleRows.innerHTML = state.aptSale.rows.map((row, index) => {
    const rowCalc = calculations.rows[index];
    const outlierChip = rowCalc?.isOutlier ? '<span class="chip outlier">High Outlier</span>' : "";
    return `
      <tr class="${rowCalc?.isOutlier ? "is-outlier" : ""}">
        <td><input type="checkbox" data-apt-sale-include="${index}" tabindex="-1" ${row.include ? "checked" : ""} /></td>
        <td><input class="table-input" type="text" data-focus-key="apt-sale-price-${index}" data-apt-sale-price="${index}" value="${escapeHtml(row.price)}" placeholder="Purchase Price..." /></td>
        <td><input class="table-input" type="text" data-focus-key="apt-sale-units-${index}" data-apt-sale-units="${index}" value="${escapeHtml(row.units)}" placeholder="Units..." /></td>
        <td ${state.aptSale.enablePerSf ? "" : 'hidden'}>
          <input class="table-input" type="text" data-focus-key="apt-sale-sqft-${index}" data-apt-sale-sqft="${index}" value="${escapeHtml(row.sqft)}" placeholder="SF..." ${state.aptSale.enablePerSf ? "" : 'tabindex="-1"'} />
        </td>
        <td>
          <div class="metric-stack">
            <span>${rowCalc?.perUnitLabel || "-"}</span>
            ${outlierChip}
          </div>
        </td>
        <td ${state.aptSale.enablePerSf ? "" : 'hidden'}>${rowCalc?.perSfLabel || "-"}</td>
        <td>${state.aptSale.rows.length > 1 ? `<button class="row-remove" type="button" data-apt-sale-remove="${index}" tabindex="-1">Remove</button>` : ""}</td>
      </tr>
    `;
  }).join("");

  bindAptSaleRowEvents();
  bindTabFlows();
  if (!consumePendingFocus()) restoreActiveInputState(elements.aptSaleRows, focusState);
  renderAptSaleMetrics(calculations);
}

function renderAptSaleMetrics(calculations = calculateAptSale()) {
  elements.aptSaleAverageUnit.textContent = calculations.averagePerUnit === null ? "-" : formatCurrency(calculations.averagePerUnit, 0);
  elements.aptSaleIndicatedUnit.textContent = calculations.indicatedPerUnit === null ? "-" : formatCurrency(calculations.indicatedPerUnit, 0);
  elements.aptSaleIndicatedUnit.setAttribute("aria-disabled", String(!(Number.isFinite(calculations.indicatedPerUnit) && calculations.indicatedPerUnit > 0)));
  elements.aptSaleAverageSfCard.hidden = !state.aptSale.enablePerSf;
  elements.aptSaleIndicatedSfCard.hidden = !state.aptSale.enablePerSf;
  elements.aptSaleAverageSf.textContent = calculations.averagePerSf === null ? "-" : `${formatCurrency(calculations.averagePerSf, 2)} / SF`;
  elements.aptSaleIndicatedSf.textContent = calculations.indicatedPerSf === null ? "-" : formatCurrency(calculations.indicatedPerSf, 0);
  elements.aptSaleIndicatedSf.setAttribute("aria-disabled", String(!(Number.isFinite(calculations.indicatedPerSf) && calculations.indicatedPerSf > 0)));
  derived.aptSaleCopyAmount = calculations.indicatedPerUnit;
  setCopyButtonState(elements.aptSaleCopyBtn, calculations.indicatedPerUnit);
  persistState();
}

function calculateAptSale() {
  const rows = state.aptSale.rows.map((row) => {
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
    const metric = row.perUnit;
    if (metric === null) return;
    if (metric > highestMetric) {
      highestMetric = metric;
      outlierIndex = index;
    }
  });

  rows.forEach((row, index) => {
    row.isOutlier = index === outlierIndex;
    const sourceRow = state.aptSale.rows[index];
    if (!sourceRow) return;
    if (row.isOutlier) {
      if (sourceRow.userTouched !== true) sourceRow.include = false;
    } else if (sourceRow.userTouched !== true) {
      sourceRow.include = true;
    }
  });

  const selectedRows = rows
    .map((row, index) => ({ row, source: state.aptSale.rows[index] }))
    .filter((entry) => entry.source?.include);

  const selectedPerUnit = selectedRows.filter((entry) => entry.row.perUnit !== null).map((entry) => entry.row.perUnit);
  const selectedPerSf = selectedRows.filter((entry) => entry.row.perSf !== null).map((entry) => entry.row.perSf);
  const averagePerUnit = selectedPerUnit.length
    ? selectedPerUnit.reduce((sum, value) => sum + value, 0) / selectedPerUnit.length
    : null;
  const averagePerSf = selectedPerSf.length
    ? selectedPerSf.reduce((sum, value) => sum + value, 0) / selectedPerSf.length
    : null;
  const subjectUnits = parsePositiveWholeNumber(state.aptSale.subjectUnits);
  const subjectSqft = parsePositiveWholeNumber(state.aptSale.subjectSqft);
  const indicatedPerUnit = averagePerUnit === null || subjectUnits === null ? null : averagePerUnit * subjectUnits;
  const indicatedPerSf = averagePerSf === null || subjectSqft === null ? null : averagePerSf * subjectSqft;
  return { rows, averagePerUnit, averagePerSf, indicatedPerUnit, indicatedPerSf };
}

function bindAptSaleRowEvents() {
  bindRepeatingRows(elements.aptSaleRows, {
    removeAttr: "data-apt-sale-remove",
    onRemove: (index) => {
      if (state.aptSale.rows.length <= 1) return;
      state.aptSale.rows.splice(index, 1);
      renderAptSale();
    },
  });

  elements.aptSaleRows.querySelectorAll("[data-apt-sale-include]").forEach((input) => {
    input.addEventListener("change", () => {
      const index = Number(input.dataset.aptSaleInclude);
      const row = state.aptSale.rows[index];
      if (!row) return;
      row.include = input.checked;
      row.userTouched = true;
      renderAptSale();
    });
  });
  elements.aptSaleRows.querySelectorAll("[data-apt-sale-price]").forEach((input) => {
    input.addEventListener("input", () => updateAptSaleField(input.dataset.aptSalePrice, "price", input.value));
    input.addEventListener("blur", () => {
      const index = Number(input.dataset.aptSalePrice);
      if (!state.aptSale.rows[index]) return;
      state.aptSale.rows[index].price = formatMoneyInput(state.aptSale.rows[index].price, 0);
      renderAptSale();
    });
  });
  elements.aptSaleRows.querySelectorAll("[data-apt-sale-units]").forEach((input) => {
    input.addEventListener("input", () => updateAptSaleField(input.dataset.aptSaleUnits, "units", input.value));
    input.addEventListener("blur", () => {
      const index = Number(input.dataset.aptSaleUnits);
      if (!state.aptSale.rows[index]) return;
      state.aptSale.rows[index].units = formatWholeInput(state.aptSale.rows[index].units);
      renderAptSale();
    });
  });
  elements.aptSaleRows.querySelectorAll("[data-apt-sale-sqft]").forEach((input) => {
    input.addEventListener("input", () => updateAptSaleField(input.dataset.aptSaleSqft, "sqft", input.value));
    input.addEventListener("blur", () => {
      const index = Number(input.dataset.aptSaleSqft);
      if (!state.aptSale.rows[index]) return;
      state.aptSale.rows[index].sqft = formatWholeInput(state.aptSale.rows[index].sqft);
      renderAptSale();
    });
  });
}

function updateAptSaleField(indexRaw, field, value) {
  const index = Number(indexRaw);
  const row = state.aptSale.rows[index];
  if (!row) return;
  row[field] = value;
  renderAptSale();
}

function ensureAptSaleTrailingEmptyRow() {
  if (!state.aptSale.rows.length) {
    state.aptSale.rows.push(createAptSaleRow());
    return;
  }
  if (state.aptSale.rows.length === 1 && aptSaleRowHasData(state.aptSale.rows[0])) {
    state.aptSale.rows.push(createAptSaleRow());
    return;
  }
  const emptyIndexes = state.aptSale.rows
    .map((row, index) => ({ row, index }))
    .filter((entry) => !aptSaleRowHasData(entry.row));
  if (emptyIndexes.length > 1) {
    emptyIndexes.slice(0, -1).reverse().forEach((entry) => state.aptSale.rows.splice(entry.index, 1));
  }
  const lastRow = state.aptSale.rows[state.aptSale.rows.length - 1];
  if (aptSaleRowHasData(lastRow)) state.aptSale.rows.push(createAptSaleRow());
}

function aptSaleRowHasData(row) {
  return (
    parseLooseNumber(row?.price || "") !== null ||
    parseLooseNumber(row?.units || "") !== null ||
    parseLooseNumber(row?.sqft || "") !== null
  );
}

function renderAptRent() {
  setControlValue(elements.aptRentStudio, state.aptRent.mix.studio);
  setControlValue(elements.aptRentOnebed, state.aptRent.mix.onebed);
  setControlValue(elements.aptRentTwobed, state.aptRent.mix.twobed);
  setControlValue(elements.aptRentThreebed, state.aptRent.mix.threebed);
  setControlValue(elements.aptRentVacancy, state.aptRent.vacancy);
  setControlValue(elements.aptRentExpense, state.aptRent.expensePercent);
  setControlValue(elements.aptRentStartCap, state.aptRent.startCap);

  const calculations = calculateAptRent();
  const focusState = captureActiveInputState(elements.aptRentRows);

  elements.aptRentRows.innerHTML = state.aptRent.rows.map((row, index) => {
    const rowCalc = calculations.rows[index];
    const outlierButton = rowCalc?.showOutlierToggle
      ? `<button class="mini-toggle ${rowCalc.outlierIncluded ? "" : "active"}" type="button" data-apt-rent-outlier="${index}" tabindex="-1">${rowCalc.outlierIncluded ? "Include Outlier" : "Remove Outlier"}</button>`
      : "";
    return `
      <tr class="${rowCalc?.showOutlierToggle && !rowCalc.outlierIncluded ? "is-outlier" : ""}" ${rowCalc?.hidden ? 'style="display:none;"' : ""}>
        <td><input type="checkbox" data-apt-rent-include="${index}" tabindex="-1" ${row.include ? "checked" : ""} /></td>
        <td>${escapeHtml(getAptRentTypeLabel(row.type))}</td>
        <td>
          <div class="rent-sample-grid">
            ${row.rents.map((value, rentIndex) => `
              <input class="table-input" type="text" data-focus-key="apt-rent-${index}-${rentIndex}" data-apt-rent-sample="${index}" data-rent-index="${rentIndex}" value="${escapeHtml(value)}" placeholder="Rent ${rentIndex + 1}..." />
            `).join("")}
          </div>
        </td>
        <td>
          <div class="metric-stack">
            <span>${rowCalc?.displayLabel || "-"}</span>
            ${outlierButton}
          </div>
        </td>
      </tr>
    `;
  }).join("");

  bindAptRentRowEvents();
  bindTabFlows();
  if (!consumePendingFocus()) restoreActiveInputState(elements.aptRentRows, focusState);
  renderAptRentMetrics(calculations);
}

function renderAptRentMetrics(calculations = calculateAptRent()) {
  elements.aptRentAvgStudio.textContent = calculations.averageByType.studio === null ? "-" : formatCurrency(calculations.averageByType.studio, 0);
  elements.aptRentAvgOnebed.textContent = calculations.averageByType.onebed === null ? "-" : formatCurrency(calculations.averageByType.onebed, 0);
  elements.aptRentAvgTwobed.textContent = calculations.averageByType.twobed === null ? "-" : formatCurrency(calculations.averageByType.twobed, 0);
  elements.aptRentAvgThreebed.textContent = calculations.averageByType.threebed === null ? "-" : formatCurrency(calculations.averageByType.threebed, 0);
  elements.aptRentAnnualGross.textContent = calculations.annualGrossRent === null ? "-" : formatCurrency(calculations.annualGrossRent, 0);
  elements.aptRentEffectiveGrossIncome.textContent = calculations.effectiveGrossIncome === null ? "-" : formatCurrency(calculations.effectiveGrossIncome, 0);
  elements.aptRentAnnualNoi.textContent = calculations.annualNoi === null ? "-" : formatCurrency(calculations.annualNoi, 0);
  elements.aptRentStartCapValue.textContent = calculations.startCapValue === null ? "-" : formatCurrency(calculations.startCapValue, 0);
  derived.aptRentCopyAmount = calculations.selectedCapValue;
  setCopyButtonState(elements.aptRentCopyBtn, calculations.selectedCapValue);

  renderCapResults({
    tbody: elements.aptRentCapResults,
    startCapRaw: state.aptRent.startCap,
    selectedCapRate: state.aptRent.selectedCapRate,
    annualNoiAfterVacancy: calculations.annualNoi,
    onSelect: (capRate) => {
      state.aptRent.selectedCapRate = capRate;
      renderAptRent();
    },
    emptyMessage: "Enter a starting cap rate to generate values.",
    copyButton: elements.aptRentCopyBtn,
    storeSelected: (capRate, value) => {
      state.aptRent.selectedCapRate = capRate;
      derived.aptRentCopyAmount = value;
      setCopyButtonState(elements.aptRentCopyBtn, value);
    },
  });
  persistState();
}

function calculateAptRent() {
  const unitMix = {
    studio: parseNonNegativeWholeNumber(state.aptRent.mix.studio || "0"),
    onebed: parseNonNegativeWholeNumber(state.aptRent.mix.onebed || "0"),
    twobed: parseNonNegativeWholeNumber(state.aptRent.mix.twobed || "0"),
    threebed: parseNonNegativeWholeNumber(state.aptRent.mix.threebed || "0"),
  };

  const averageByType = {
    studio: null,
    onebed: null,
    twobed: null,
    threebed: null,
  };

  const rows = state.aptRent.rows.map((row) => {
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
    const averageRent = hasUnits && selectedValues.length
      ? selectedValues.reduce((sum, value) => sum + value, 0) / selectedValues.length
      : null;
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
    ? Object.keys(unitMix).reduce((sum, key) => {
        const averageRent = averageByType[key] || 0;
        return sum + averageRent * unitMix[key] * 12;
      }, 0)
    : null;
  const vacancyRate = clampPercent(state.aptRent.vacancy);
  const expenseRate = clampPercent(state.aptRent.expensePercent);
  const effectiveGrossIncome = annualGrossRent === null ? null : annualGrossRent * (1 - vacancyRate);
  const annualNoi = effectiveGrossIncome === null ? null : effectiveGrossIncome * (1 - expenseRate);
  const startCapRate = parseLooseNumber(state.aptRent.startCap);
  const startCapValue =
    annualNoi === null || startCapRate === null || startCapRate <= 0
      ? null
      : annualNoi / (startCapRate / 100);
  const selectedCapValue = calculateSelectedCapValue(state.aptRent.startCap, state.aptRent.selectedCapRate, annualNoi, (nextRate) => {
    state.aptRent.selectedCapRate = nextRate;
  });

  return {
    rows,
    averageByType,
    annualGrossRent,
    effectiveGrossIncome,
    annualNoi,
    startCapValue,
    selectedCapValue,
  };
}

function bindAptRentRowEvents() {
  elements.aptRentRows.querySelectorAll("[data-apt-rent-include]").forEach((input) => {
    input.addEventListener("change", () => {
      const index = Number(input.dataset.aptRentInclude);
      const row = state.aptRent.rows[index];
      if (!row) return;
      row.include = input.checked;
      row.userTouched = true;
      renderAptRent();
    });
  });
  elements.aptRentRows.querySelectorAll("[data-apt-rent-sample]").forEach((input) => {
    input.addEventListener("input", () => {
      const rowIndex = Number(input.dataset.aptRentSample);
      const rentIndex = Number(input.dataset.rentIndex);
      const row = state.aptRent.rows[rowIndex];
      if (!row) return;
      row.rents[rentIndex] = input.value;
      renderAptRent();
    });
    input.addEventListener("blur", () => {
      const rowIndex = Number(input.dataset.aptRentSample);
      const rentIndex = Number(input.dataset.rentIndex);
      const row = state.aptRent.rows[rowIndex];
      if (!row) return;
      row.rents[rentIndex] = formatMoneyInput(row.rents[rentIndex], 0);
      renderAptRent();
    });
  });
  elements.aptRentRows.querySelectorAll("[data-apt-rent-outlier]").forEach((button) => {
    button.addEventListener("click", () => {
      const index = Number(button.dataset.aptRentOutlier);
      const row = state.aptRent.rows[index];
      if (!row) return;
      row.includeOutlier = !row.includeOutlier;
      renderAptRent();
    });
  });
}

function renderCurrentRent() {
  const isCommercial = state.currentRent.mode === "commercial";
  const commercialFocusState = captureActiveInputState(elements.currentRentCommercialRows);
  const apartmentFocusState = captureActiveInputState(elements.currentRentApartmentRows);

  if (isCommercial) {
    ensureCurrentRentCommercialTrailingEmptyRow();
  } else {
    ensureCurrentRentApartmentTrailingEmptyRow();
  }
  const calculations = calculateCurrentRent();

  elements.currentRentModeButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.currentRentMode === state.currentRent.mode);
  });
  setControlValue(elements.currentRentStartCap, state.currentRent.startCap);
  setControlValue(elements.currentRentAdditionalIncome, state.currentRent.additionalIncome);
  setControlValue(elements.currentRentVacancy, state.currentRent.vacancy);
  setControlValue(elements.currentRentExpense, state.currentRent.apartment.expensePercent);
  elements.currentRentExpenseField.hidden = isCommercial;
  elements.currentRentCommercialTable.hidden = !isCommercial;
  elements.currentRentApartmentTable.hidden = isCommercial;
  elements.currentRentCommercialHint.hidden = !isCommercial;
  elements.currentRentApartmentHint.hidden = isCommercial;

  if (isCommercial) {
    elements.currentRentCommercialRows.innerHTML = state.currentRent.commercial.rows.map((row, index) => {
      const rowCalc = calculations.commercialRows[index];
      return `
        <tr>
          <td><input class="table-input" type="text" data-focus-key="current-rent-commercial-rent-${index}" data-current-rent-commercial-rent="${index}" value="${escapeHtml(row.rent)}" placeholder="Current monthly rent..." /></td>
          <td>
            <select class="table-select" data-focus-key="current-rent-commercial-type-${index}" data-current-rent-commercial-type="${index}" tabindex="-1">
              <option value="nnn" ${row.leaseType === "nnn" ? "selected" : ""}>NNN</option>
              <option value="modified" ${row.leaseType === "modified" ? "selected" : ""}>Modified</option>
              <option value="gross" ${row.leaseType === "gross" ? "selected" : ""}>Gross</option>
            </select>
          </td>
          <td>${rowCalc?.expenseLabel || "10%"}</td>
          <td>${rowCalc?.adjustedRentLabel || "-"}</td>
          <td>${state.currentRent.commercial.rows.length > 1 ? `<button class="row-remove" type="button" data-current-rent-commercial-remove="${index}" tabindex="-1">Remove</button>` : ""}</td>
        </tr>
      `;
    }).join("");
    bindCurrentRentCommercialRowEvents();
  } else {
    elements.currentRentApartmentRows.innerHTML = state.currentRent.apartment.rows.map((row, index) => {
      const rowCalc = calculations.apartmentRows[index];
      return `
        <tr class="${rowCalc?.isVacant ? "is-outlier" : ""}">
          <td><input class="table-input" type="text" data-focus-key="current-rent-apartment-rent-${index}" data-current-rent-apartment-rent="${index}" value="${escapeHtml(row.rent)}" placeholder="Current monthly rent..." /></td>
          <td>
            <div class="metric-stack">
              <span>${rowCalc?.statusLabel || "-"}</span>
              ${rowCalc?.isVacant ? '<span class="chip outlier">Vacant Unit</span>' : ""}
            </div>
          </td>
          <td>${state.currentRent.apartment.rows.length > 1 ? `<button class="row-remove" type="button" data-current-rent-apartment-remove="${index}" tabindex="-1">Remove</button>` : ""}</td>
        </tr>
      `;
    }).join("");
    bindCurrentRentApartmentRowEvents();
  }

  bindTabFlows();
  if (!consumePendingFocus()) {
    if (isCommercial) {
      restoreActiveInputState(elements.currentRentCommercialRows, commercialFocusState);
    } else {
      restoreActiveInputState(elements.currentRentApartmentRows, apartmentFocusState);
    }
  }
  renderCurrentRentMetrics(calculations);
}

function renderCurrentRentMetrics(calculations = calculateCurrentRent()) {
  const isCommercial = state.currentRent.mode === "commercial";
  const appliedVacancyLabel = state.currentRent.vacancy === "" ? "Optional Vacancy" : "Vacancy Applied";
  if (elements.currentRentSummary7Card) {
    elements.currentRentSummary7Card.hidden = isCommercial;
  }

  if (isCommercial) {
    elements.currentRentSummary1Label.textContent = "Adjusted Monthly Rent";
    elements.currentRentSummary1.textContent = calculations.baseMonthlyIncome === null ? "-" : formatCurrency(calculations.baseMonthlyIncome, 0);
    elements.currentRentSummary2Label.textContent = "Monthly Fill Income";
    elements.currentRentSummary2.textContent = formatCurrency(calculations.additionalIncome, 0);
    elements.currentRentSummary3Label.textContent = "Annual Gross Income";
    elements.currentRentSummary3.textContent = calculations.annualGrossIncome === null ? "-" : formatCurrency(calculations.annualGrossIncome, 0);
    elements.currentRentSummary4Label.textContent = "Annual NOI";
    elements.currentRentSummary4.textContent = calculations.annualNoi === null ? "-" : formatCurrency(calculations.annualNoi, 0);
  } else {
    elements.currentRentSummary1Label.textContent = "Current Monthly Rent";
    elements.currentRentSummary1.textContent = calculations.baseMonthlyIncome === null ? "-" : formatCurrency(calculations.baseMonthlyIncome, 0);
    elements.currentRentSummary2Label.textContent = "Annual Gross Income";
    elements.currentRentSummary2.textContent = calculations.annualGrossIncome === null ? "-" : formatCurrency(calculations.annualGrossIncome, 0);
    elements.currentRentSummary3Label.textContent = "Effective Gross Income";
    elements.currentRentSummary3.textContent = calculations.effectiveGrossIncome === null ? "-" : formatCurrency(calculations.effectiveGrossIncome, 0);
    elements.currentRentSummary4Label.textContent = "Annual NOI After Expenses";
    elements.currentRentSummary4.textContent = calculations.annualNoi === null ? "-" : formatCurrency(calculations.annualNoi, 0);
    elements.currentRentSummary7Label.textContent = "Vacant Units";
    elements.currentRentSummary7.textContent = calculations.apartmentVacancyLabel;
  }

  elements.currentRentSummary5Label.textContent = "Value at Start Cap";
  elements.currentRentSummary5.textContent = calculations.startCapValue === null ? "-" : formatCurrency(calculations.startCapValue, 0);
  elements.currentRentSummary6Label.textContent = appliedVacancyLabel;
  elements.currentRentSummary6.textContent = calculations.appliedVacancyLabel;

  derived.currentRentCopyAmount = calculations.selectedCapValue;
  setCopyButtonState(elements.currentRentCopyBtn, calculations.selectedCapValue);

  renderCapResults({
    tbody: elements.currentRentCapResults,
    startCapRaw: state.currentRent.startCap,
    selectedCapRate: state.currentRent.selectedCapRate,
    annualNoiAfterVacancy: calculations.annualNoi,
    onSelect: (capRate) => {
      state.currentRent.selectedCapRate = capRate;
      renderCurrentRent();
    },
    emptyMessage: "Enter a starting cap rate to generate values.",
    copyButton: elements.currentRentCopyBtn,
    storeSelected: (capRate, value) => {
      state.currentRent.selectedCapRate = capRate;
      derived.currentRentCopyAmount = value;
      setCopyButtonState(elements.currentRentCopyBtn, value);
    },
  });
  persistState();
}

function calculateCurrentRent() {
  const isCommercial = state.currentRent.mode === "commercial";
  const additionalIncome = parseLooseNumber(state.currentRent.additionalIncome);
  const vacancyRate = clampPercent(state.currentRent.vacancy);
  const commercialRows = state.currentRent.commercial.rows.map((row) => {
    const rent = parseLooseNumber(row.rent);
    const expenseRate = getLeaseExpenseRate(row.leaseType);
    const adjustedRent = rent === null ? null : rent * (1 - expenseRate);
    return {
      adjustedRent,
      expenseLabel: `${(expenseRate * 100).toFixed(0)}%`,
      adjustedRentLabel: adjustedRent === null ? "-" : formatCurrency(adjustedRent, 0),
    };
  });
  const apartmentRows = state.currentRent.apartment.rows.map((row) => {
    const rent = parseLooseNumber(row.rent);
    const isVacant = rent === 0;
    return {
      rent,
      isVacant,
      statusLabel: rent === null ? "-" : isVacant ? "$0" : formatCurrency(rent, 0),
    };
  });

  const commercialValues = commercialRows.map((row) => row.adjustedRent).filter((value) => value !== null);
  const apartmentValues = apartmentRows.map((row) => row.rent).filter((value) => value !== null);
  const baseMonthlyIncome = isCommercial
    ? (commercialValues.length ? commercialValues.reduce((sum, value) => sum + value, 0) : null)
    : (apartmentValues.length ? apartmentValues.reduce((sum, value) => sum + value, 0) : null);
  const totalAdditionalIncome = additionalIncome ?? 0;
  const monthlyIncomeBeforeVacancy = baseMonthlyIncome === null ? (totalAdditionalIncome > 0 ? totalAdditionalIncome : null) : baseMonthlyIncome + totalAdditionalIncome;
  const annualGrossIncome = monthlyIncomeBeforeVacancy === null ? null : monthlyIncomeBeforeVacancy * 12;
  const annualIncomeAfterVacancy = annualGrossIncome === null ? null : annualGrossIncome * (1 - vacancyRate);
  const expenseRate = isCommercial ? 0 : clampPercent(state.currentRent.apartment.expensePercent);
  const effectiveGrossIncome = isCommercial ? annualIncomeAfterVacancy : annualIncomeAfterVacancy;
  const annualNoi = effectiveGrossIncome === null ? null : effectiveGrossIncome * (1 - expenseRate);
  const startCapRate = parseLooseNumber(state.currentRent.startCap);
  const startCapValue =
    annualNoi === null || startCapRate === null || startCapRate <= 0
      ? null
      : annualNoi / (startCapRate / 100);
  const totalApartmentRows = apartmentRows.filter((row, index) => currentRentApartmentRowHasData(state.currentRent.apartment.rows[index])).length;
  const vacantApartmentRows = apartmentRows.filter((row, index) => currentRentApartmentRowHasData(state.currentRent.apartment.rows[index]) && row.isVacant).length;
  const apartmentVacancyRate = totalApartmentRows ? vacantApartmentRows / totalApartmentRows : null;
  const selectedCapValue = calculateSelectedCapValue(state.currentRent.startCap, state.currentRent.selectedCapRate, annualNoi, (nextRate) => {
    state.currentRent.selectedCapRate = nextRate;
  });

  return {
    commercialRows,
    apartmentRows,
    additionalIncome: totalAdditionalIncome,
    baseMonthlyIncome,
    monthlyIncomeBeforeVacancy,
    annualGrossIncome,
    effectiveGrossIncome,
    annualNoi,
    startCapValue,
    selectedCapValue,
    appliedVacancyLabel: `${(vacancyRate * 100).toFixed(1).replace(/\.0$/, "")}%`,
    apartmentVacancyLabel:
      apartmentVacancyRate === null
        ? "-"
        : `${vacantApartmentRows} / ${totalApartmentRows} (${(apartmentVacancyRate * 100).toFixed(1).replace(/\.0$/, "")}%)`,
  };
}

function bindCurrentRentCommercialRowEvents() {
  bindRepeatingRows(elements.currentRentCommercialRows, {
    removeAttr: "data-current-rent-commercial-remove",
    onRemove: (index) => {
      if (state.currentRent.commercial.rows.length <= 1) return;
      state.currentRent.commercial.rows.splice(index, 1);
      renderCurrentRent();
    },
  });

  elements.currentRentCommercialRows.querySelectorAll("[data-current-rent-commercial-rent]").forEach((input) => {
    input.addEventListener("input", () => {
      const index = Number(input.dataset.currentRentCommercialRent);
      const row = state.currentRent.commercial.rows[index];
      if (!row) return;
      row.rent = input.value;
      renderCurrentRent();
    });
    input.addEventListener("blur", () => {
      const index = Number(input.dataset.currentRentCommercialRent);
      const row = state.currentRent.commercial.rows[index];
      if (!row) return;
      row.rent = formatMoneyInput(row.rent, 0);
      renderCurrentRent();
    });
  });

  elements.currentRentCommercialRows.querySelectorAll("[data-current-rent-commercial-type]").forEach((select) => {
    select.addEventListener("change", () => {
      const index = Number(select.dataset.currentRentCommercialType);
      const row = state.currentRent.commercial.rows[index];
      if (!row) return;
      row.leaseType = select.value;
      renderCurrentRent();
    });
  });
}

function bindCurrentRentApartmentRowEvents() {
  bindRepeatingRows(elements.currentRentApartmentRows, {
    removeAttr: "data-current-rent-apartment-remove",
    onRemove: (index) => {
      if (state.currentRent.apartment.rows.length <= 1) return;
      state.currentRent.apartment.rows.splice(index, 1);
      renderCurrentRent();
    },
  });

  elements.currentRentApartmentRows.querySelectorAll("[data-current-rent-apartment-rent]").forEach((input) => {
    input.addEventListener("input", () => {
      const index = Number(input.dataset.currentRentApartmentRent);
      const row = state.currentRent.apartment.rows[index];
      if (!row) return;
      row.rent = input.value;
      renderCurrentRent();
    });
    input.addEventListener("blur", () => {
      const index = Number(input.dataset.currentRentApartmentRent);
      const row = state.currentRent.apartment.rows[index];
      if (!row) return;
      row.rent = formatMoneyInput(row.rent, 0);
      renderCurrentRent();
    });
  });
}

function ensureCurrentRentCommercialTrailingEmptyRow() {
  if (!state.currentRent.commercial.rows.length) {
    state.currentRent.commercial.rows.push(createCurrentRentCommercialRow());
    return;
  }
  if (
    state.currentRent.commercial.rows.length === 1 &&
    currentRentCommercialRowHasData(state.currentRent.commercial.rows[0])
  ) {
    state.currentRent.commercial.rows.push(createCurrentRentCommercialRow());
    return;
  }
  const emptyIndexes = state.currentRent.commercial.rows
    .map((row, index) => ({ row, index }))
    .filter((entry) => !currentRentCommercialRowHasData(entry.row));
  if (emptyIndexes.length > 1) {
    emptyIndexes.slice(0, -1).reverse().forEach((entry) => state.currentRent.commercial.rows.splice(entry.index, 1));
  }
  const lastRow = state.currentRent.commercial.rows[state.currentRent.commercial.rows.length - 1];
  if (currentRentCommercialRowHasData(lastRow)) {
    state.currentRent.commercial.rows.push(createCurrentRentCommercialRow());
  }
}

function ensureCurrentRentApartmentTrailingEmptyRow() {
  if (!state.currentRent.apartment.rows.length) {
    state.currentRent.apartment.rows.push(createCurrentRentApartmentRow());
    return;
  }
  if (
    state.currentRent.apartment.rows.length === 1 &&
    currentRentApartmentRowHasData(state.currentRent.apartment.rows[0])
  ) {
    state.currentRent.apartment.rows.push(createCurrentRentApartmentRow());
    return;
  }
  const emptyIndexes = state.currentRent.apartment.rows
    .map((row, index) => ({ row, index }))
    .filter((entry) => !currentRentApartmentRowHasData(entry.row));
  if (emptyIndexes.length > 1) {
    emptyIndexes.slice(0, -1).reverse().forEach((entry) => state.currentRent.apartment.rows.splice(entry.index, 1));
  }
  const lastRow = state.currentRent.apartment.rows[state.currentRent.apartment.rows.length - 1];
  if (currentRentApartmentRowHasData(lastRow)) {
    state.currentRent.apartment.rows.push(createCurrentRentApartmentRow());
  }
}

function currentRentCommercialRowHasData(row) {
  return parseLooseNumber(row?.rent || "") !== null;
}

function currentRentApartmentRowHasData(row) {
  return parseLooseNumber(row?.rent || "") !== null;
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
  const isValidSelected =
    Number.isFinite(selectedCapRate) &&
    selectedCapRate >= startingCap &&
    selectedCapRate <= maxCap &&
    Math.abs(offset - Math.round(offset)) < 0.001;
  const resolvedSelected = isValidSelected ? selectedCapRate : Number(startingCap.toFixed(2));
  let selectedValue = null;

  for (let index = 0; index < leaseCapCount; index += 1) {
    const capRate = Number((startingCap + index * leaseCapStep).toFixed(2));
    const impliedValue = annualNoiAfterVacancy === null ? null : annualNoiAfterVacancy / (capRate / 100);
    const row = document.createElement("tr");
    const isSelected = Math.abs(capRate - resolvedSelected) < 0.001;
    row.className = `cap-row${isSelected ? " is-selected" : ""}`;
    row.innerHTML = `
      <td>${formatCapRateDisplay(capRate)}</td>
      <td>${impliedValue === null ? "-" : formatCurrency(impliedValue, 0)}</td>
    `;
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
  if (startingCap === null || startingCap <= 0 || annualNoiAfterVacancy === null) {
    return null;
  }
  const maxCap = startingCap + leaseCapStep * (leaseCapCount - 1);
  const offset = (selectedCapRate - startingCap) / leaseCapStep;
  const isValidSelected =
    Number.isFinite(selectedCapRate) &&
    selectedCapRate >= startingCap &&
    selectedCapRate <= maxCap &&
    Math.abs(offset - Math.round(offset)) < 0.001;
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
  if (!copied) {
    throw new Error("Clipboard write failed");
  }
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

function flashCopyTarget(target, state) {
  if (!(target instanceof HTMLElement)) return;
  target.dataset.copyState = state;
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

function parseNonNegativeWholeNumber(raw) {
  const parsed = parseLooseNumber(raw);
  if (parsed === null || parsed < 0) return 0;
  return Math.round(parsed);
}

function formatCurrency(value, decimals = 0) {
  const normalized = Number.isFinite(value) ? Math.abs(value) : 0;
  const prefix = value < 0 ? "-" : "";
  return `${prefix}$${normalized.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

function formatClipboardAmount(value) {
  if (!Number.isFinite(value)) return "";
  const rounded = Math.round(value);
  const normalized = Math.abs(rounded);
  const prefix = rounded < 0 ? "-" : "";
  return `${prefix}${normalized.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
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
  return String(value || "").replace(/[&<>"']/g, (match) => {
    const map = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return map[match] || match;
  });
}
