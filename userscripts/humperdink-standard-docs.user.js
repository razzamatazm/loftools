// ==UserScript==
// @name         Humperdink - Standard Docs Button
// @namespace    https://humperdink.loneoakfund.com/
// @version      1.2.0
// @description  Adds a "Standard Docs" button beside Loan Docs that generates the standard Loan Docs templates in one go, either downloaded to this computer or created in Humperdink.
// @match        https://humperdink.loneoakfund.com/Loans/*
// @grant        none
// @run-at       document-idle
// @downloadURL  https://loftools.azurewebsites.net/userscripts/humperdink-standard-docs.user.js
// @updateURL    https://loftools.azurewebsites.net/userscripts/humperdink-standard-docs.user.js
// ==/UserScript==

(function () {
  'use strict';

  // Templates to check, matched case-insensitively against the template list.
  const STANDARD_TEMPLATES = [
    'AGREEMENT.docx',
    'EFT.docx',
    'NOTE-NONREVOLVER.docx',
    'TD.docx',
    'INSTRUCTIONS.docx',
  ];
  const CATEGORY_NAME = 'Loan Docs';
  const LOAN_DOCS_BTN_ID = 'btn_LoanDocsLoanDocs';
  const OUR_BTN_ID = 'btn_LoanDocsStandardDocs';
  const CHOOSER_ID = 'sd-chooser';

  // Where the docs go: 'local' downloads them (the window's "Create Locally"),
  // 'cloud' creates them in Humperdink (the window's "Create in Cloud").
  // Asked on first use; "Save as default" keeps the answer in this browser.
  const MODE_KEY = 'lofStandardDocsMode';
  const MODES = {
    local: { title: 'Download to this computer', detail: 'Word files land in your Downloads folder, like Create Locally.', busy: 'Downloading...' },
    cloud: { title: 'Create in Humperdink', detail: 'Saved to the loan\'s documents, like Create in Cloud.', busy: 'Creating in Humperdink...' },
  };
  const getDefaultMode = () => { try { const m = localStorage.getItem(MODE_KEY); return MODES[m] ? m : null; } catch (e) { return null; } };
  const setDefaultMode = (m) => { try { localStorage.setItem(MODE_KEY, m); } catch (e) { /* private window */ } };

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  async function waitFor(test, timeoutMs = 8000, stepMs = 100) {
    const end = Date.now() + timeoutMs;
    while (Date.now() < end) {
      try {
        if (test()) return true;
      } catch (e) { /* widget not ready yet */ }
      await sleep(stepMs);
    }
    return false;
  }

  function flash(btn, text, ms = 2500) {
    const label = btn.querySelector('.sd-label');
    const original = 'Standard Docs';
    label.textContent = text;
    setTimeout(() => { label.textContent = original; }, ms);
  }

  function buttonTitle() {
    const mode = getDefaultMode();
    return 'New Document with Multi-Docs: ' + STANDARD_TEMPLATES.join(', ') + '\n' +
      (mode ? 'Default: ' + MODES[mode].title + '. Shift-click to choose again.' : 'Asks where the docs should go.');
  }

  // ---------- first-run chooser ----------
  function chooseMode(btn) {
    return new Promise((resolve) => {
      const old = document.getElementById(CHOOSER_ID);
      if (old) old.remove();

      const current = getDefaultMode() || 'local';
      const box = document.createElement('div');
      box.id = CHOOSER_ID;
      const r = btn.getBoundingClientRect();
      box.style.cssText = 'position:fixed;z-index:20001;width:330px;background:#fff;border:1px solid #2a6db0;' +
        'border-radius:4px;box-shadow:0 4px 18px rgba(0,0,0,.25);font-size:13px;color:#333;' +
        'top:' + Math.round(r.bottom + 6) + 'px;left:' + Math.round(Math.max(8, Math.min(r.left, window.innerWidth - 340))) + 'px;';
      const option = (key) =>
        '<label style="display:flex;gap:8px;align-items:flex-start;padding:6px 0;cursor:pointer">' +
        '<input type="radio" name="sd-mode" value="' + key + '"' + (key === current ? ' checked' : '') + ' style="margin-top:3px">' +
        '<span><b>' + MODES[key].title + '</b><br><span style="color:#777;font-size:12px">' + MODES[key].detail + '</span></span></label>';
      const btnCss = 'font-size:12px;padding:4px 10px;border-radius:3px;cursor:pointer;';
      box.innerHTML =
        '<div style="background:#2a6db0;color:#fff;padding:6px 10px;display:flex;justify-content:space-between;align-items:center">' +
        '<b>Standard Docs: where should they go?</b>' +
        '<button data-sd="cancel" style="' + btnCss + 'background:transparent;color:#fff;border:0;font-size:16px;padding:0 4px">×</button></div>' +
        '<div style="padding:6px 12px">' + option('local') + option('cloud') + '</div>' +
        '<div style="padding:6px 12px 10px;display:flex;gap:8px;justify-content:flex-end">' +
        '<button data-sd="once" style="' + btnCss + 'background:#fff;color:#2a6db0;border:1px solid #2a6db0">Just this time</button>' +
        '<button data-sd="save" style="' + btnCss + 'background:#2a6db0;color:#fff;border:1px solid #2a6db0;font-weight:bold">Save as default</button></div>' +
        '<div style="color:#888;font-size:11px;padding:0 12px 8px">Shift-click Standard Docs any time to choose again.</div>';
      document.body.appendChild(box);

      const done = (mode) => {
        box.remove();
        document.removeEventListener('keydown', onKey, true);
        document.removeEventListener('mousedown', onOutside, true);
        resolve(mode);
      };
      const onKey = (e) => { if (e.key === 'Escape') done(null); };
      const onOutside = (e) => { if (!box.contains(e.target) && !btn.contains(e.target)) done(null); };
      document.addEventListener('keydown', onKey, true);
      document.addEventListener('mousedown', onOutside, true);

      box.addEventListener('click', (e) => {
        const action = e.target.getAttribute('data-sd');
        if (!action) return;
        e.preventDefault();
        if (action === 'cancel') return done(null);
        const mode = box.querySelector('input[name="sd-mode"]:checked').value;
        if (action === 'save') {
          setDefaultMode(mode);
          btn.title = buttonTitle();
        }
        done(mode);
      });
    });
  }

  // ---------- generate ----------
  async function generateStandardDocs(btn, mode) {
    const $ = window.jQuery;
    if (!$) return flash(btn, 'jQuery not found');
    if (btn.dataset.busy === '1') return;
    btn.dataset.busy = '1';

    try {
      // Start from a clean window so category and template state are fresh.
      const $win = $('#NewDocumentWindow');
      try {
        if ($win.length && $win.jqxWindow('isOpen')) {
          $win.jqxWindow('close');
          await sleep(400);
        }
      } catch (e) { /* window not created yet */ }

      // Open New Document through the app's own Loan Docs button.
      const loanDocsBtn = document.getElementById(LOAN_DOCS_BTN_ID);
      if (!loanDocsBtn) return flash(btn, 'Loan Docs button missing');
      loanDocsBtn.click();

      const opened = await waitFor(() =>
        $('#NewDocumentWindow').is(':visible') &&
        $('#toggleBtnMultipleDocs').data('toggles') &&
        $('#newDocumentCategory').data('jqxComboBox')
      );
      if (!opened) return flash(btn, 'Window did not open');

      // Make sure the category is Loan Docs.
      const $cat = $('#newDocumentCategory');
      const catItem = ($cat.jqxComboBox('getItems') || [])
        .find((i) => String(i.label).trim().toLowerCase() === CATEGORY_NAME.toLowerCase());
      if (!catItem) return flash(btn, 'Loan Docs category missing');
      if (String($cat.jqxComboBox('val')) !== String(catItem.value)) {
        $cat.jqxComboBox('selectItem', catItem);
        await sleep(300);
      }

      // Turn on Multi-Docs.
      const toggles = $('#toggleBtnMultipleDocs').data('toggles');
      if (!toggles.active) toggles.toggle(true);
      await waitFor(() => $('#toggleBtnMultipleDocs div').hasClass('toggle-on active'), 2000);

      // The template list needs to be rebuilt with checkboxes for multi-select.
      const $tmpl = () => $('#templateName');
      const hasCheckboxList = () =>
        $tmpl().data('jqxComboBox') &&
        $tmpl().jqxComboBox('checkboxes') === true &&
        ($tmpl().jqxComboBox('getItems') || []).length > 0;

      if (!(await waitFor(hasCheckboxList, 1500))) {
        if (typeof window.ReloadTemplatesCombo === 'function') {
          window.ReloadTemplatesCombo(catItem.value);
        }
        if (!(await waitFor(hasCheckboxList, 4000))) {
          return flash(btn, 'Template list not ready');
        }
      }

      // Check the standard templates.
      const wanted = STANDARD_TEMPLATES.map((t) => t.toLowerCase());
      const items = $tmpl().jqxComboBox('getItems');
      const found = new Set();
      $tmpl().jqxComboBox('uncheckAll');
      items.forEach((it) => {
        const label = String(it.label).trim().toLowerCase();
        if (wanted.includes(label)) {
          $tmpl().jqxComboBox('checkItem', it);
          found.add(label);
        }
      });
      // The app's validator also requires a "selected" item, which a manual
      // checkbox click sets. Select the first checked item; checks stay intact.
      const checked = $tmpl().jqxComboBox('getCheckedItems') || [];
      if (checked.length) $tmpl().jqxComboBox('selectIndex', checked[0].index);
      $tmpl().removeClass('errorfield').addClass('grayborder');

      const missing = STANDARD_TEMPLATES.filter((t) => !found.has(t.toLowerCase()));
      if (missing.length) {
        // Leave the window open so templates can be fixed by hand.
        console.warn('[Standard Docs] Templates not found:', missing);
        flash(btn, 'Missing: ' + missing.join(', '), 5000);
        return;
      }

      await sleep(200);
      if (mode === 'cloud') {
        // Same as the window's "Create in Cloud" button; Humperdink then lists the new docs.
        const cloudBtn = document.getElementById('btnDocumnetCreateincloud');
        if (cloudBtn) cloudBtn.click();
        else if (typeof window.CreateDocumentInCloud === 'function') window.CreateDocumentInCloud('sharepoint');
        else return flash(btn, 'Create in Cloud missing');
      } else {
        // Same call as the window's "Create Locally" link; it downloads and closes the window.
        if (typeof window.CreateDocumentInLocal !== 'function') return flash(btn, 'Create Locally missing');
        window.CreateDocumentInLocal('local');
      }
      flash(btn, MODES[mode].busy, 3000);
    } finally {
      btn.dataset.busy = '0';
    }
  }

  function injectButton() {
    if (document.getElementById(OUR_BTN_ID)) return;
    const loanDocsBtn = document.getElementById(LOAN_DOCS_BTN_ID);
    if (!loanDocsBtn) return;

    // Clone for identical styling; cloneNode does not carry over jQuery handlers.
    const btn = loanDocsBtn.cloneNode(true);
    btn.id = OUR_BTN_ID;
    btn.title = buttonTitle();
    btn.innerHTML = '<span class="fa fa-files-o"></span> <span class="sd-label">Standard Docs</span>';
    btn.classList.remove('jqx-fill-state-hover', 'jqx-fill-state-hover-Lending',
      'jqx-fill-state-pressed', 'jqx-fill-state-pressed-Lending');

    btn.addEventListener('mouseenter', () => btn.classList.add('jqx-fill-state-hover', 'jqx-fill-state-hover-Lending'));
    btn.addEventListener('mouseleave', () => btn.classList.remove('jqx-fill-state-hover', 'jqx-fill-state-hover-Lending'));
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (btn.dataset.busy === '1') return;
      let mode = getDefaultMode();
      if (!mode || e.shiftKey) mode = await chooseMode(btn);
      if (mode) generateStandardDocs(btn, mode);
    });

    loanDocsBtn.insertAdjacentElement('afterend', btn);
  }

  // The toolbar is built by the app after load and can be rebuilt, so keep watching.
  injectButton();
  new MutationObserver(injectButton).observe(document.body, { childList: true, subtree: true });
})();
