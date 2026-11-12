// ==UserScript==
// @name         Humperdink - Loan Docs Checker
// @namespace    https://humperdink.loneoakfund.com/
// @version      1.1.2
// @description  Checks (and optionally fills) Loan Docs dates and spelled-out amounts/rates from the closing date, term, amount and rates.
// @match        https://humperdink.loneoakfund.com/Loans/*
// @match        https://loneo-qa-lmsapp.6technology.com/Loans/*
// @match        https://beta-lmsapp.loneoakfund.com/Loans/*
// @grant        none
// @run-at       document-idle
// @downloadURL  https://loftools.azurewebsites.net/userscripts/humperdink-loan-docs-checker.user.js
// @updateURL    https://loftools.azurewebsites.net/userscripts/humperdink-loan-docs-checker.user.js
// ==/UserScript==

(function () {
  'use strict';

  // false: "Check Docs" only reports and offers Fix buttons.
  // true:  also fills every field automatically on load and whenever an input changes.
  const AUTO_FILL = false;

  const BTN_ID = 'btn_LoanDocsCheckDocs';
  const PANEL_ID = 'ldc-panel';
  const FILL_BTN_ID = 'ldc-fill-btn';
  const FILL_POP_ID = 'ldc-fill-pop';
  // Fill mode (beta) is opt-in per browser, switched from the Check Docs panel. Stored in Humperdink's localStorage.
  const FILL_KEY = 'lofLoanDocsFillMode';
  const $ = () => window.jQuery;

  // ---------- number words ----------
  const ONES = ['', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'TEN',
    'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN', 'SEVENTEEN', 'EIGHTEEN', 'NINETEEN'];
  const TENS = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];
  const SCALES = ['', 'THOUSAND', 'MILLION', 'BILLION'];

  function under1000(n) {
    const w = [];
    if (n >= 100) { w.push(ONES[Math.floor(n / 100)], 'HUNDRED'); n %= 100; }
    if (n >= 20) { w.push(TENS[Math.floor(n / 10)]); n %= 10; }
    if (n > 0) w.push(ONES[n]);
    return w.join(' ');
  }

  function intWords(n) {
    n = Math.floor(n);
    if (n === 0) return 'ZERO';
    const parts = [];
    let s = 0;
    while (n > 0) {
      const chunk = n % 1000;
      if (chunk) parts.unshift(under1000(chunk) + (SCALES[s] ? ' ' + SCALES[s] : ''));
      n = Math.floor(n / 1000);
      s++;
    }
    return parts.join(' ');
  }

  // Fraction part in thousandths -> words. Halves, quarters, eighths first, then tenths, hundredths.
  function fracWords(th) {
    if (!th) return '';
    const named = {
      500: 'ONE HALF', 250: 'ONE QUARTER', 750: 'THREE QUARTERS',
      125: 'ONE EIGHTH', 375: 'THREE EIGHTHS', 625: 'FIVE EIGHTHS', 875: 'SEVEN EIGHTHS',
    };
    if (named[th]) return named[th];
    if (th % 100 === 0) { const n = th / 100; return intWords(n) + (n === 1 ? ' TENTH' : ' TENTHS'); }
    if (th % 10 === 0) { const n = th / 10; return intWords(n) + (n === 1 ? ' HUNDREDTH' : ' HUNDREDTHS'); }
    return intWords(th) + (th === 1 ? ' THOUSANDTH' : ' THOUSANDTHS');
  }

  // 9.5 -> "NINE and ONE HALF", 24 -> "TWENTY FOUR", 0.5 -> "ONE HALF"
  function decimalWords(x) {
    const totalTh = Math.round(x * 1000);
    const whole = Math.floor(totalTh / 1000);
    const th = totalTh % 1000;
    const f = fracWords(th);
    if (!f) return intWords(whole);
    if (!whole) return f;
    return intWords(whole) + ' and ' + f;
  }

  const num = (s) => {
    const v = parseFloat(String(s == null ? '' : s).replace(/[^0-9.\-]/g, ''));
    return isNaN(v) ? null : v;
  };

  // ---------- dates ----------
  const eom = (y, m) => new Date(y, m + 1, 0);           // last day of month m (0-based, may overflow)
  const fmt = (d) => d ? (d.getMonth() + 1) + '/' + d.getDate() + '/' + d.getFullYear() : '';
  const sameDay = (a, b) => a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  const today = () => { const t = new Date(); return new Date(t.getFullYear(), t.getMonth(), t.getDate()); };

  function getDate(id) {
    const el = document.getElementById(id);
    if (!el) return undefined;
    try {
      const d = $()(el).jqxDateTimeInput('getDate');
      return d ? new Date(d.getFullYear(), d.getMonth(), d.getDate()) : null;
    } catch (e) { return undefined; }
  }

  function toggleOn(id) {
    const el = document.getElementById(id);
    return !!(el && $()(el).data('toggleActive'));
  }

  const val = (id) => { const el = document.getElementById(id); return el ? el.value : undefined; };
  const visible = (el) => !!(el && (el.offsetWidth || el.offsetHeight || el.getClientRects().length));

  // ---------- build the list of checks ----------
  // Each check: { label, id, kind: 'date'|'text', expected, current, note, soft }
  function buildChecks() {
    const checks = [];
    const errors = [];

    const closing = getDate('txtClosingDate');
    const term = num(val('txtLoanTerm'));

    const addDate = (label, id, expected, opts = {}) => {
      if (!document.getElementById(id)) return;
      checks.push({ label, id, kind: 'date', expected, current: getDate(id), ...opts });
    };
    const addText = (label, id, expected, opts = {}) => {
      if (!id || !document.getElementById(id)) return;
      checks.push({ label, id, kind: 'text', expected, current: (val(id) || '').trim(), ...opts });
    };

    // Dates
    addDate('Original Loan Docs Date', 'txtTOriginalLoanDocsDate', today(),
      { soft: true, note: 'Set to today' });

    let maturity = null;
    if (!closing) errors.push('No Closing Date, so dates cannot be checked.');
    else {
      if (term == null) errors.push('No Loan Term, so Maturity cannot be checked.');
      else {
        const base = closing.getDate() >= 15 ? closing.getMonth() : closing.getMonth() - 1;
        maturity = eom(closing.getFullYear(), base + term);
        addDate('Maturity Date', 'LoandocsDetailsPanelMaturityDate', maturity,
          { note: 'Closing on the ' + ordinal(closing.getDate()) + (closing.getDate() >= 15 ? ' (15th or later): end of closing month' : ' (before 15th): end of prior month') + ' + ' + term + ' mo' });
      }
      addDate('Funding End of Month Date', 'txtFundingEndofMonthDate', eom(closing.getFullYear(), closing.getMonth()));
      addDate('First Payment Date', 'txtFirstPaymentDate', new Date(closing.getFullYear(), closing.getMonth() + 2, 1),
        { note: 'In arrears: 1st of the month after the first full month' });
    }

    // Loan amount spelled out
    const amt = num(val('LoanAmountLoanDocs'));
    if (amt != null) addText('Loan Amount Spelled Out', 'txtLoanAmountSpelledoutLoanDocs', intWords(amt));

    // Interest rate tiers (rows InterestRates0..n, spelled-out textareas in the same order)
    const ratePanel = document.getElementById('loanDocspanel');
    const rateTextareas = ratePanel
      ? [...ratePanel.querySelectorAll('textarea[id^="txtInterestratespelledout"]')].filter((t) => !/_timestamp$/.test(t.id))
      : [];
    for (let i = 0; document.getElementById('InterestRates' + i); i++) {
      const r = num(val('InterestRates' + i));
      const from = val('LoanDocsTerms' + i), to = val('LoanDocsMonths' + i);
      const ta = rateTextareas[i];
      if (r != null && ta) addText('Interest Rate (months ' + from + '-' + to + ')', ta.id, decimalWords(r));
    }

    // Default rate
    const dr = num(val('DefaultInterestRate'));
    if (dr != null) addText('Default Interest Rate Spelled Out', 'DefaultInterestratespelledout', decimalWords(dr));

    // Extensions
    if (toggleOn('toggleExtensionsLoanDocs')) {
      const extPanel = document.getElementById('loanDocsExtensionsPanel');
      const rateTAs = extPanel ? [...extPanel.querySelectorAll('textarea[id^="txtExtensionratespelledout"]')].filter((t) => !/_timestamp$/.test(t.id)) : [];
      const feeTAs = extPanel ? [...extPanel.querySelectorAll('textarea[id^="txtExtensionFeepelledout"]')].filter((t) => !/_timestamp$/.test(t.id)) : [];
      let maxEnd = 0;
      for (let i = 0; document.getElementById('ExtensionRates' + i); i++) {
        const from = val('ExtensionTerms' + i), to = val('ExtensionMonths' + i);
        maxEnd = Math.max(maxEnd, num(to) || 0);
        const r = num(val('ExtensionRates' + i));
        const pts = num(val('ExtensionFee' + i));
        if (r != null && rateTAs[i]) addText('Extension Rate (months ' + from + '-' + to + ')', rateTAs[i].id, decimalWords(r));
        if (pts != null && feeTAs[i]) addText('Extension Fee (months ' + from + '-' + to + ')', feeTAs[i].id, decimalWords(pts));
      }
      if (maturity) {
        if (maxEnd) addDate('Extension Maturity Date', 'txtExtensionMaturityDate', eom(maturity.getFullYear(), maturity.getMonth() + maxEnd),
          { note: 'Maturity + ' + maxEnd + ' mo' });
        addDate('Extension 1st Day', 'txtExtension1stDay', new Date(maturity.getFullYear(), maturity.getMonth() + 1, 1));
        addDate('Extension Notice Date', 'txtExtensionNoticeDate', eom(maturity.getFullYear(), maturity.getMonth() - 1),
          { note: 'End of the month before maturity' });
      }
    }

    checks.forEach((c) => {
      c.ok = c.kind === 'date' ? sameDay(c.current, c.expected) : c.current === c.expected;
      c.expectedText = c.kind === 'date' ? fmt(c.expected) : c.expected;
      c.currentText = c.kind === 'date' ? fmt(c.current) : c.current;
    });
    return { checks, errors };
  }

  // ---------- writing ----------
  function applyCheck(c) {
    const el = document.getElementById(c.id);
    if (!el) return;
    if (c.kind === 'date') {
      $()(el).jqxDateTimeInput('setDate', new Date(c.expected.getTime()));
    } else {
      el.value = c.expected;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true })); // runs the page's inline onchange (updates the loan object)
      try { $()(el).trigger('autosize:update'); } catch (e) { /* no autosize */ }
    }
  }

  // ---------- UI ----------
  // Page CSS suppresses outlines, so use an !important box-shadow ring instead.
  function markField(c) {
    const el = document.getElementById(c.id);
    if (!el) return;
    if (c.ok) {
      el.style.removeProperty('box-shadow');
      el.title = '';
    } else {
      el.style.setProperty('box-shadow', '0 0 0 2px ' + (c.soft ? '#e0a800' : '#d9534f'), 'important');
      el.title = 'Expected: ' + c.expectedText;
    }
  }

  function clearMarks() {
    document.querySelectorAll('[data-ldc-marked]').forEach((el) => {
      el.style.removeProperty('box-shadow');
      el.title = '';
      el.removeAttribute('data-ldc-marked');
    });
  }

  const ordinal = (n) => n + (n % 100 >= 11 && n % 100 <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] || 'th'));

  function esc(s) {
    return String(s).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
  }

  function setButtonLabel(text) {
    const b = document.getElementById(BTN_ID);
    if (b) b.querySelector('.ldc-label').textContent = text;
  }

  function runCheck(showPanel) {
    if (!$() || !document.getElementById('loanDocspanel')) return null;
    clearMarks();
    const result = buildChecks();
    result.checks.forEach((c) => {
      const el = document.getElementById(c.id);
      if (el) el.setAttribute('data-ldc-marked', '1');
      markField(c);
    });
    const bad = result.checks.filter((c) => !c.ok);
    setButtonLabel(bad.length ? 'Check Docs (' + bad.length + ' off)' : 'Check Docs');
    if (showPanel) renderPanel(result);
    else if (document.getElementById(PANEL_ID)) renderPanel(result);
    return result;
  }

  function renderPanel(result) {
    let panel = document.getElementById(PANEL_ID);
    if (!panel) {
      panel = document.createElement('div');
      panel.id = PANEL_ID;
      panel.style.cssText = 'position:fixed;top:110px;right:20px;width:520px;max-height:75vh;overflow:auto;z-index:20000;' +
        'background:#fff;border:1px solid #2a6db0;border-radius:4px;box-shadow:0 4px 18px rgba(0,0,0,.25);font-size:12px;';
      document.body.appendChild(panel);
    }
    const bad = result.checks.filter((c) => !c.ok);
    const hb = 'font-size:11px;padding:2px 8px;margin-left:6px;border:1px solid #fff;border-radius:3px;cursor:pointer;';
    const hbGhost = hb + 'background:transparent;color:#fff;';
    const rows = result.checks.map((c, i) => {
      const status = c.ok ? '<span style="color:#2e7d32">✓</span>'
        : (c.soft ? '<span style="color:#b38600">!</span>' : '<span style="color:#c62828">✗</span>');
      const cur = c.ok ? esc(c.currentText) : '<s style="color:#999">' + esc(c.currentText || '(blank)') + '</s><br><b>' + esc(c.expectedText) + '</b>';
      const fix = c.ok ? '' : '<button data-ldc-fix="' + i + '" style="font-size:11px;padding:1px 6px">Fix</button>';
      const note = c.note ? '<div style="color:#888;font-size:10px">' + esc(c.note) + '</div>' : '';
      return '<tr style="border-top:1px solid #eee"><td style="padding:4px;width:14px;font-weight:bold">' + status + '</td>' +
        '<td style="padding:4px;width:170px"><a href="#" data-ldc-goto="' + i + '">' + esc(c.label) + '</a>' + note + '</td>' +
        '<td style="padding:4px">' + cur + '</td><td style="padding:4px;width:36px">' + fix + '</td></tr>';
    }).join('');
    const errs = result.errors.map((e) => '<div style="color:#b38600;padding:2px 8px">⚠ ' + esc(e) + '</div>').join('');
    panel.innerHTML =
      '<div style="background:#2a6db0;color:#fff;padding:6px 8px;display:flex;justify-content:space-between;align-items:center">' +
      '<b>Loan Docs Check: ' + (bad.length ? bad.length + ' to fix' : 'all good') + '</b>' +
      '<span><button data-ldc-recheck style="' + hbGhost + '">Recheck</button>' +
      '<button data-ldc-close style="' + hbGhost + '">×</button></span></div>' +
      errs + '<table style="width:100%;border-collapse:collapse">' + rows + '</table>' +
      '<div style="color:#888;padding:6px 8px;font-size:10px">Fixes update the page like typing would. Save the loan as usual afterward.</div>' +
      '<label style="display:flex;align-items:center;gap:6px;padding:6px 8px;border-top:1px solid #eee;cursor:pointer;font-weight:normal;margin:0">' +
      '<input type="checkbox" data-ldc-fillmode' + (fillEnabled() ? ' checked' : '') + ' style="margin:0">' +
      'Enable fill mode (beta): adds a Fill button beside Closing Date</label>';

    panel.onchange = (e) => {
      if (e.target.hasAttribute('data-ldc-fillmode')) setFillEnabled(e.target.checked);
    };

    panel.onclick = (e) => {
      const t = e.target;
      if (t.hasAttribute('data-ldc-close')) { panel.remove(); return; }
      if (t.hasAttribute('data-ldc-recheck')) { runCheck(true); return; }
      if (t.hasAttribute('data-ldc-fix')) { applyCheck(result.checks[+t.getAttribute('data-ldc-fix')]); setTimeout(() => runCheck(true), 300); return; }
      if (t.hasAttribute('data-ldc-goto')) {
        e.preventDefault();
        const el = document.getElementById(result.checks[+t.getAttribute('data-ldc-goto')].id);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    };
  }

  // ---------- fill mode (beta) ----------
  function fillEnabled() {
    try { return localStorage.getItem(FILL_KEY) === '1'; } catch (e) { return false; }
  }

  function setFillEnabled(on) {
    try { on ? localStorage.setItem(FILL_KEY, '1') : localStorage.removeItem(FILL_KEY); } catch (e) { /* storage blocked */ }
    syncFillButton();
  }

  // Adds or removes the Fill button beside Closing Date to match the saved setting.
  function syncFillButton() {
    const existing = document.getElementById(FILL_BTN_ID);
    if (!fillEnabled()) {
      if (existing) existing.remove();
      closeFillPopover();
      return;
    }
    if (existing) { updateFillButtonState(); return; }
    const closing = document.getElementById('txtClosingDate');
    if (!closing || !document.getElementById('loanDocspanel')) return;
    // jqxDateTimeInput renders as a block div; make it inline so the button sits beside it, not under it.
    if (getComputedStyle(closing).display === 'block') {
      closing.style.display = 'inline-block';
      closing.style.verticalAlign = 'middle';
    }
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.id = FILL_BTN_ID;
    btn.textContent = 'Fill';
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      document.getElementById(FILL_POP_ID) ? closeFillPopover() : renderFillPopover();
    });
    closing.insertAdjacentElement('afterend', btn);
    // Picking or typing a date fires jqx's valueChanged; enable the button the moment a date lands.
    try { $()(closing).on('valueChanged', () => setTimeout(updateFillButtonState, 0)); } catch (e) { /* no jqx */ }
    updateFillButtonState();
  }

  // Everything Fill writes hangs off Closing Date, so the button stays grayed out until there is one.
  function updateFillButtonState() {
    const btn = document.getElementById(FILL_BTN_ID);
    if (!btn) return;
    const ready = !!getDate('txtClosingDate');
    btn.disabled = !ready;
    btn.title = ready
      ? 'Preview and fill the dates and spelled-out text that follow from Closing Date (beta)'
      : 'Enter a Closing Date first. Every date Fill sets is worked out from it.';
    btn.style.cssText = 'font-size:11px;padding:2px 10px;margin-left:6px;vertical-align:middle;border-radius:3px;font-weight:bold;' +
      (ready ? 'border:1px solid #2a6db0;background:#fff;color:#2a6db0;cursor:pointer;'
        : 'border:1px solid #bbb;background:#f2f2f2;color:#999;cursor:not-allowed;');
    if (!ready) closeFillPopover();
  }

  function closeFillPopover() {
    const pop = document.getElementById(FILL_POP_ID);
    if (pop) pop.remove();
  }

  // Ids the user unticked in the popover; kept across re-renders so a recheck doesn't re-tick them.
  const skipped = new Set();

  function renderFillPopover() {
    const btn = document.getElementById(FILL_BTN_ID);
    if (!btn || !$()) return;
    const result = buildChecks();
    const todo = result.checks.filter((c) => !c.ok);

    let pop = document.getElementById(FILL_POP_ID);
    if (!pop) {
      pop = document.createElement('div');
      pop.id = FILL_POP_ID;
      pop.style.cssText = 'position:absolute;width:440px;max-height:60vh;overflow:auto;z-index:20001;background:#fff;' +
        'border:1px solid #2a6db0;border-radius:4px;box-shadow:0 4px 18px rgba(0,0,0,.25);font-size:12px;';
      document.body.appendChild(pop);
    }
    const r = btn.getBoundingClientRect();
    pop.style.top = (r.bottom + window.scrollY + 4) + 'px';
    pop.style.left = Math.max(8, Math.min(r.left + window.scrollX, window.scrollX + document.documentElement.clientWidth - 448)) + 'px';

    const rows = todo.map((c, i) =>
      '<tr style="border-top:1px solid #eee">' +
      '<td style="padding:4px;width:18px"><input type="checkbox" data-ldc-pick="' + i + '"' + (skipped.has(c.id) ? '' : ' checked') + ' style="margin:0"></td>' +
      '<td style="padding:4px;width:150px">' + esc(c.label) + (c.note ? '<div style="color:#888;font-size:10px">' + esc(c.note) + '</div>' : '') + '</td>' +
      '<td style="padding:4px"><s style="color:#999">' + esc(c.currentText || '(blank)') + '</s><br><b>' + esc(c.expectedText) + '</b></td></tr>'
    ).join('');
    const errs = result.errors.map((e) => '<div style="color:#b38600;padding:2px 8px">⚠ ' + esc(e) + '</div>').join('');
    const picked = todo.filter((c) => !skipped.has(c.id)).length;
    const hb = 'font-size:11px;padding:2px 8px;margin-left:6px;border:1px solid #fff;border-radius:3px;cursor:pointer;';

    pop.innerHTML =
      '<div style="background:#2a6db0;color:#fff;padding:6px 8px;display:flex;justify-content:space-between;align-items:center">' +
      '<b>' + (todo.length ? 'Will fill ' + picked + ' of ' + todo.length : 'Nothing to fill: all match') + '</b>' +
      '<span>' + (todo.length ? '<button data-ldc-dofill' + (picked ? '' : ' disabled') + ' style="' + hb + 'background:#fff;color:#2a6db0;font-weight:bold;">Fill ' + picked + '</button>' : '') +
      '<button data-ldc-popclose style="' + hb + 'background:transparent;color:#fff;">×</button></span></div>' +
      errs + (todo.length ? '<table style="width:100%;border-collapse:collapse">' + rows + '</table>' : '') +
      '<div style="color:#888;padding:6px 8px;font-size:10px">Beta. Untick anything you want left alone. Save the loan as usual afterward.</div>';

    pop.onchange = (e) => {
      const t = e.target;
      if (!t.hasAttribute('data-ldc-pick')) return;
      const c = todo[+t.getAttribute('data-ldc-pick')];
      t.checked ? skipped.delete(c.id) : skipped.add(c.id);
      renderFillPopover();
    };
    pop.onclick = (e) => {
      const t = e.target;
      if (t.hasAttribute('data-ldc-popclose')) { closeFillPopover(); return; }
      if (t.hasAttribute('data-ldc-dofill')) {
        todo.filter((c) => !skipped.has(c.id)).forEach(applyCheck);
        setTimeout(() => { runCheck(false); renderFillPopover(); }, 300);
      }
    };
  }

  // Close the popover on a click outside it or Escape.
  document.addEventListener('mousedown', (e) => {
    const pop = document.getElementById(FILL_POP_ID);
    if (pop && !pop.contains(e.target) && e.target.id !== FILL_BTN_ID) closeFillPopover();
  }, true);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeFillPopover(); });

  function autoFill() {
    const r = runCheck(false);
    if (!r) return;
    const bad = r.checks.filter((c) => !c.ok);
    if (!bad.length) return;
    bad.forEach(applyCheck);
    setTimeout(() => runCheck(false), 300);
  }

  // ---------- wiring ----------
  let debounce = null;
  const schedule = () => {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      if (AUTO_FILL) autoFill();
      else if (document.getElementById(PANEL_ID) || document.querySelector('[data-ldc-marked]')) runCheck(false);
      updateFillButtonState();
      if (document.getElementById(FILL_POP_ID)) renderFillPopover();
    }, 500);
  };

  // Inputs that drive the calculations. Re-check (or re-fill) when they change.
  const DRIVERS = /^(txtClosingDate|txtLoanTerm|LoanAmountLoanDocs|InterestRates\d+|LoanDocsTerms\d+|LoanDocsMonths\d+|DefaultInterestRate|ExtensionTerms\d+|ExtensionMonths\d+|ExtensionRates\d+|ExtensionFee\d+|toggleExtensionsLoanDocs)$/;
  function onDriverEvent(e) {
    let el = e.target;
    while (el && el !== document.body) {
      if (el.id && DRIVERS.test(el.id)) { schedule(); return; }
      el = el.parentElement;
    }
  }

  function injectButton() {
    syncFillButton();
    if (document.getElementById(BTN_ID)) return;
    const anchor = document.getElementById('btn_LoanDocsStandardDocs') || document.getElementById('btn_LoanDocsLoanDocs');
    if (!anchor) return;
    const btn = document.getElementById('btn_LoanDocsLoanDocs').cloneNode(true);
    btn.id = BTN_ID;
    btn.title = 'Check Loan Docs dates and spelled-out text';
    btn.innerHTML = '<span class="fa fa-check-square-o"></span> <span class="ldc-label">Check Docs</span>';
    btn.classList.remove('jqx-fill-state-hover', 'jqx-fill-state-hover-Lending', 'jqx-fill-state-pressed', 'jqx-fill-state-pressed-Lending');
    btn.addEventListener('mouseenter', () => btn.classList.add('jqx-fill-state-hover', 'jqx-fill-state-hover-Lending'));
    btn.addEventListener('mouseleave', () => btn.classList.remove('jqx-fill-state-hover', 'jqx-fill-state-hover-Lending'));
    btn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); runCheck(true); });
    anchor.insertAdjacentElement('afterend', btn);

    if (AUTO_FILL) setTimeout(autoFill, 1500);
  }

  document.addEventListener('change', onDriverEvent, true);
  document.addEventListener('focusout', onDriverEvent, true);
  document.addEventListener('click', onDriverEvent, true); // toggles and calendar picks
  injectButton();
  new MutationObserver(injectButton).observe(document.body, { childList: true, subtree: true });

  // Exposed for quick testing from the console.
  window.__loanDocsChecker = { buildChecks, runCheck, decimalWords, intWords, setFillEnabled };
})();
