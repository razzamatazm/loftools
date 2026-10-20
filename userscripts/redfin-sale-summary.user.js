// ==UserScript==
// @name         Redfin Sale Summary
// @namespace    loneoakfund
// @version      1.0.0
// @description  Replaces Redfin's "Claim home" box with a concise sale summary: address, last sale price/date, SF, lot, bd/ba, $/SF.
// @match        https://www.redfin.com/*/home/*
// @run-at       document-idle
// @grant        none
// @downloadURL  https://loftools.thepopcorn.party/userscripts/redfin-sale-summary.user.js
// @updateURL    https://loftools.thepopcorn.party/userscripts/redfin-sale-summary.user.js
// ==/UserScript==

(function () {
  'use strict';

  const BOX_ID = 'tm-sale-summary';
  let cache = { id: null, data: null };

  const fmt$ = (n) => (n == null ? 'n/a' : '$' + Math.round(n).toLocaleString('en-US'));
  const fmtN = (n) => (n == null ? 'n/a' : Math.round(n).toLocaleString('en-US'));
  const fmtDate = (ms) => {
    if (!ms) return 'n/a';
    const d = new Date(ms);
    // Redfin stores sale dates as midnight UTC; read in UTC so the day doesn't shift
    return `${d.getUTCMonth() + 1}/${d.getUTCDate()}/${d.getUTCFullYear()}`;
  };
  const num = (s) => {
    const m = String(s || '').replace(/,/g, '').match(/[\d.]+/);
    return m ? parseFloat(m[0]) : null;
  };

  async function api(kind, id) {
    const r = await fetch(`/stingray/api/home/details/${kind}?propertyId=${id}&accessLevel=1`, { credentials: 'include' });
    return JSON.parse((await r.text()).replace(/^\{\}&&/, '')).payload || {};
  }

  async function getData(id) {
    if (cache.id === id && cache.data) return cache.data;
    const [above, below] = await Promise.all([api('aboveTheFold', id), api('belowTheFold', id)]);
    const a = above.addressSectionInfo || {};
    const events = ((below.propertyHistoryInfo || {}).events || [])
      .filter((e) => /sold/i.test(e.eventDescription || '') && e.price)
      .sort((x, y) => y.eventDate - x.eventDate);
    const sale = events[0] || null;

    // Prefer what the page header shows (MLS figures), fall back to public-record API values
    const domTxt = (sel) => (document.querySelector(sel) || {}).innerText;
    const beds = num(domTxt('[data-rf-test-id="abp-beds"]')) ?? a.beds;
    const baths = num(domTxt('[data-rf-test-id="abp-baths"]')) ?? a.baths;
    const sqft = num(domTxt('[data-rf-test-id="abp-sqFt"]')) ?? (a.sqFt && a.sqFt.value);
    const recSqft = a.sqFt && a.sqFt.value;

    const addr = [
      (a.streetAddress && a.streetAddress.assembledAddress) || '',
      [a.city, [a.state, a.zip].filter(Boolean).join(' ')].filter(Boolean).join(', '),
    ].filter(Boolean).join(', ');

    const data = {
      addr: addr || (document.title.split('|')[0] || '').trim(),
      price: sale ? sale.price : null,
      date: sale ? sale.eventDate : null,
      sqft, recSqft, lot: a.lotSize, beds, baths,
    };
    cache = { id, data };
    return data;
  }

  function render(d) {
    const ppsf = d.price && d.sqft ? d.price / d.sqft : null;
    const acres = d.lot ? (d.lot / 43560).toFixed(2) : null;
    const sqftNote = d.recSqft && d.sqft && Math.round(d.recSqft) !== Math.round(d.sqft)
      ? ` <span class="tm-note">(${fmtN(d.recSqft)} per public record)</span>` : '';
    const rows = [
      ['Address', d.addr],
      ['Last Sale Price', d.price ? fmt$(d.price) : 'No recorded sale'],
      ['Last Sale Date', fmtDate(d.date)],
      ['Square Feet', fmtN(d.sqft) + sqftNote],
      ['Lot Size', d.lot ? `${fmtN(d.lot)} SF <span class="tm-note">(${acres} ac)</span>` : 'n/a'],
      ['Bed / Bath', `${d.beds ?? 'n/a'} bd / ${d.baths ?? 'n/a'} ba`],
      ['Price / SF', ppsf ? fmt$(ppsf) : 'n/a'],
    ];
    const box = document.createElement('div');
    box.id = BOX_ID;
    box.innerHTML = `
      <style>
        #${BOX_ID}{border:1px solid #d5d5d5;border-radius:12px;padding:14px 18px;margin:12px 0;background:#fff;font-size:15px;line-height:1.35}
        #${BOX_ID} table{border-collapse:collapse;width:100%}
        #${BOX_ID} td{padding:4px 0;vertical-align:top}
        #${BOX_ID} td:first-child{color:#595959;width:140px;white-space:nowrap;padding-right:16px}
        #${BOX_ID} td:last-child{font-weight:600}
        #${BOX_ID} .tm-note{font-weight:400;color:#767676;font-size:13px}
      </style>
      <table>${rows.map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join('')}</table>`;
    return box;
  }

  function findSlot() {
    const claim = document.querySelector('.HomeownerToolsSection');
    if (claim) return { el: claim, mode: 'replace' };
    // Active listings etc. without the claim box: insert after the main stats section
    const stats = document.querySelector('[data-rf-test-id="abp-homeinfo-homemainstats"]');
    const sec = stats && (stats.closest('section') || stats.closest('.componentSection'));
    return sec ? { el: sec, mode: 'after' } : null;
  }

  let busy = false;
  async function run() {
    if (busy || document.getElementById(BOX_ID)) return;
    const m = location.pathname.match(/\/home\/(\d+)/);
    if (!m) return;
    const slot = findSlot();
    if (!slot) return;
    busy = true;
    try {
      const box = render(await getData(m[1]));
      if (document.getElementById(BOX_ID)) return;
      const s = findSlot() || slot;
      if (s.mode === 'replace') { s.el.style.display = 'none'; s.el.before(box); }
      else s.el.after(box);
    } catch (e) {
      console.warn('[Redfin Sale Summary]', e);
    } finally {
      busy = false;
    }
  }

  // Redfin re-renders and navigates client-side; keep the box present and fresh
  let lastPath = location.pathname;
  new MutationObserver(() => {
    if (location.pathname !== lastPath) {
      lastPath = location.pathname;
      const old = document.getElementById(BOX_ID);
      if (old) old.remove();
    }
    run();
  }).observe(document.body, { childList: true, subtree: true });
  run();
})();
