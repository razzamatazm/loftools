// ==UserScript==
// @name         Humperdink: New Loan on Loan Activity
// @namespace    https://humperdink.loneoakfund.com/
// @version      1.0.1
// @description  Adds the sidebar "New Loan" button to the Loan Activity page and opens Humperdink's own New Loan modal there.
// @match        https://humperdink.loneoakfund.com/Loans/Activity/*
// @match        https://humperdink.loneoakfund.com/Loans/Details/*
// @grant        none
// @run-at       document-idle
// @noframes
// @downloadURL  https://loftools.azurewebsites.net/userscripts/humperdink-new-loan.user.js
// @updateURL    https://loftools.azurewebsites.net/userscripts/humperdink-new-loan.user.js
// ==/UserScript==

/*
 * How it works
 * The New Loan modal only exists on loan pages (its scripts, settings and
 * lookup data are rendered there). Rather than rebuild it, this script loads a
 * loan's Details page in an invisible same-origin frame on the Activity page,
 * hides everything in that frame except the modal, and clicks that page's own
 * New Loan button. Create, validation, LOC handling, the contacts prompt and
 * the "Open in new tab" checkbox all run on Humperdink's own code.
 *   - Open in new tab checked: the new loan opens in a new tab, the overlay
 *     closes and the Activity grid refreshes.
 *   - Unchecked: this tab goes to the new loan.
 *   - Cancel / X / Esc: the overlay closes, nothing changes.
 * The frame borrows the first loan in the grid (or the last loan you opened)
 * as its host page. It is only viewed, never edited.
 */

(function () {
  'use strict';

  const HOST_KEY = 'hdNewLoanHostPath';
  const path = location.pathname;

  // On Details pages: just remember this loan as a fallback host.
  if (/^\/Loans\/Details\//i.test(path)) {
    try { localStorage.setItem(HOST_KEY, path); } catch (e) { /* ignore */ }
    return;
  }

  // Loan Activity page from here on.
  const BTN_ID = 'hdNewLoanCommand';
  const OVERLAY_ID = 'hdNewLoanOverlay';
  const READY_TIMEOUT_MS = 30000;

  const css = document.createElement('style');
  css.textContent = `
    #${OVERLAY_ID}{position:fixed;inset:0;z-index:2147483000;background:rgba(0,0,0,.25)}
    #${OVERLAY_ID} .hd-nl-spin{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
      background:#fff;border-radius:6px;padding:14px 22px;font:14px/1.4 inherit;color:#333;
      box-shadow:0 4px 18px rgba(0,0,0,.25);display:flex;gap:10px;align-items:center}
    #${OVERLAY_ID} iframe{position:absolute;inset:0;width:100%;height:100%;border:0;
      background:transparent;opacity:0;transition:opacity .12s}
    #${OVERLAY_ID}.hd-ready iframe{opacity:1}
    #${OVERLAY_ID}.hd-ready .hd-nl-spin{display:none}
  `;
  document.head.appendChild(css);

  // CSS put inside the frame: hide the host loan page, show only jqx windows/popups.
  const FRAME_CSS = `
    html,body{background:transparent!important;overflow:hidden!important}
    body *{visibility:hidden!important}
    .jqx-window,.jqx-window *,.jqx-window-modal,
    .jqx-popup,.jqx-popup *,.jqx-listbox,.jqx-listbox *,
    .jqx-calendar,.jqx-calendar *,.jqx-tooltip,.jqx-tooltip *{visibility:visible!important}
  `;

  // ---------- sidebar button ----------
  function addButton() {
    if (document.getElementById(BTN_ID)) return;
    const loans = document.getElementById('LoansCommand');
    const li = loans && loans.closest('li');
    if (!li) return;
    const newLi = document.createElement('li');
    newLi.innerHTML =
      `<a href="#" id="${BTN_ID}" title="New Loan">` +
      `<span class="fa fa-plus-circle fa-3x"></span>` +
      `<div class="link-text">New Loan</div></a>`;
    li.insertAdjacentElement('afterend', newLi);
    newLi.querySelector('a').addEventListener('click', (e) => {
      e.preventDefault();
      openNewLoan();
    });
  }
  addButton();
  setInterval(addButton, 1500); // survive any sidebar re-render

  // ---------- host page ----------
  function pickHostPath() {
    const a = document.querySelector('a.gotolinktext[href*="/Loans/Details/"]') ||
              document.querySelector('a[href*="/Loans/Details/"]');
    if (a) return new URL(a.href, location.origin).pathname;
    try { return localStorage.getItem(HOST_KEY); } catch (e) { return null; }
  }

  // ---------- main flow ----------
  function openNewLoan() {
    if (document.getElementById(OVERLAY_ID)) return;

    const hostPath = pickHostPath();
    if (!hostPath) {
      alert('New Loan: no loan found to borrow the form from. Open any loan once, then try again.');
      return;
    }

    const overlay = document.createElement('div');
    overlay.id = OVERLAY_ID;
    overlay.innerHTML =
      `<div class="hd-nl-spin"><span class="fa fa-spinner fa-spin"></span>Opening New Loan...</div>`;
    const frame = document.createElement('iframe');
    frame.setAttribute('allowtransparency', 'true');
    overlay.appendChild(frame);
    document.body.appendChild(overlay);

    let firstLoadDone = false;
    let created = false;
    let finished = false;
    let watchTimer = null;
    let readyTimer = null;

    const onKey = (e) => {
      if (e.key === 'Escape' && !overlay.classList.contains('hd-ready')) finish(false);
    };
    document.addEventListener('keydown', onKey);

    function finish(reloadGrid) {
      if (finished) return;
      finished = true;
      clearInterval(watchTimer);
      clearInterval(readyTimer);
      document.removeEventListener('keydown', onKey);
      overlay.remove();
      if (reloadGrid) location.reload();
    }

    function fail(msg) {
      finish(false);
      alert('New Loan: ' + msg);
    }

    frame.addEventListener('load', () => {
      let w;
      try { w = frame.contentWindow; void w.location.pathname; } catch (e) { return fail('could not open the form.'); }

      if (firstLoadDone) {
        // Frame moved on: Humperdink sent it to the new loan (new tab unchecked).
        const p = w.location.pathname;
        if (p !== hostPath && /^\/Loans\/(Details|CurrentDraw)\//i.test(p)) {
          location.href = w.location.href.replace(/#.*$/, '');
        } else {
          finish(created);
        }
        return;
      }
      firstLoadDone = true;

      // Hide the host loan right away.
      const st = w.document.createElement('style');
      st.textContent = FRAME_CSS;
      w.document.head.appendChild(st);

      // Wait until the host page has wired up its sidebar and New Loan code.
      const t0 = Date.now();
      readyTimer = setInterval(() => {
        if (finished) return clearInterval(readyTimer);
        const $ = w.jQuery;
        const li = w.document.getElementById('sidebar_KSidebar3');
        const wired = $ && li && $._data(li, 'events') && $._data(li, 'events').click &&
                      typeof w.openNewLoanWindow === 'function';
        if (wired) {
          clearInterval(readyTimer);
          launch(w);
        } else if (Date.now() - t0 > READY_TIMEOUT_MS) {
          fail('the form did not load in time.');
        }
      }, 200);
    });

    function launch(w) {
      const $ = w.jQuery;
      const d = w.document;

      // Note a successful create (fires after Humperdink's own success handler).
      $(d).ajaxSuccess((ev, xhr, opts, data) => {
        const body = data || xhr.responseJSON;
        if (String(opts.type).toUpperCase() === 'POST' && /\/loans\/?$/i.test(opts.url || '') &&
            body && body.status && body.status.code === 'SUC-LOA-0002-PO') {
          created = true;
        }
      });

      // Click the host page's real New Loan button.
      d.querySelector('#sidebar_KSidebar3 a').click();

      const isVisible = (el) => {
        if (!el) return false;
        const cs = w.getComputedStyle(el);
        return cs.display !== 'none' && cs.visibility !== 'hidden' && el.offsetWidth > 0;
      };
      const anyWindowOpen = () =>
        Array.from(d.querySelectorAll('.jqx-window')).some(isVisible);

      // Wait for the modal, then reveal; afterwards watch for it to go away.
      let shown = false;
      let quietTicks = 0;
      const t0 = Date.now();
      watchTimer = setInterval(() => {
        if (finished) return clearInterval(watchTimer);
        let modal;
        try { modal = d.getElementById('NewLoanModal'); } catch (e) { return; } // frame navigating

        if (!shown) {
          if (isVisible(modal)) {
            shown = true;
            overlay.classList.add('hd-ready');
            const input = d.getElementById('txtloanname');
            if (input) input.focus();
          } else if (Date.now() - t0 > READY_TIMEOUT_MS) {
            fail('the New Loan window did not open.');
          }
          return;
        }

        // Shown already: close the overlay once no Humperdink window is open
        // (covers Cancel, X, Esc, and the follow-up contacts/address prompts).
        if (anyWindowOpen()) { quietTicks = 0; return; }
        quietTicks++;
        if (quietTicks < 3) return; // ~0.9s grace so a same-tab redirect can start

        const cbox = d.getElementById('NewLoanNewTabCbox');
        if (created && cbox && !cbox.checked) {
          // Same-tab redirect expected; the frame load handler takes it from here.
          if (quietTicks > 40) finish(true); // safety net (~12s)
          return;
        }
        finish(created);
      }, 300);
    }

    frame.src = hostPath + '#hd-newloan';
  }
})();
