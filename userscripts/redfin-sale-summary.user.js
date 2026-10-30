// ==UserScript==
// @name         Redfin Comp Printer
// @namespace    loneoakfund
// @version      2.0.0
// @description  Sale summary box (with unit type) on Redfin home pages, one-page print layout, and a comp collector that prints a summary table page plus one page per comp. Replaces the old "sale summary" userscript.
// @match        https://www.redfin.com/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_addValueChangeListener
// @grant        GM_setClipboard
// @run-at       document-idle
// @downloadURL  https://loftools.thepopcorn.party/userscripts/redfin-sale-summary.user.js
// @updateURL    https://loftools.thepopcorn.party/userscripts/redfin-sale-summary.user.js
// ==/UserScript==

(function () {
  'use strict';

  /* ================================================================== *
   * Settings
   * ================================================================== */
  const CFG = {
    photoMaxHeightIn: 3.0,        // property photo height on the printout
    pageMarginIn: 0.4,            // US Letter page margins
    fitOnePage: true,             // auto-shrink a comp that runs past one page
    expandDescription: false,     // true = print full "About this home" text
    hijackCmdP: true,             // true = Cmd+P on a home page prints the one-page layout
    expandStreetSuffix: true,     // "614 16th St" -> "614 16th Street" in the comp table
    tableTitle: 'Recent Sale Comps',
    outlierMinComps: 3,           // only auto-drop the high $/SF comp when there are at least this many comps
    askSubjectSf: true,           // prompt for subject SF on Print set / Copy table if the box is empty
    removeFromClones: [           // Redfin UI that is useless on paper
      '.DesktopHomeownerConversionUnclaimedContent', // "Is this your home? / I own ..."
      'button', 'iframe', 'script', 'noscript',
    ],
  };

  const KEY = 'tmcCompSet';
  const OPT_KEY = 'tmcOptions';
  const HOME_RE = /\/home\/(\d+)/;

  /* ================================================================== *
   * Storage (shared across tabs)
   * ================================================================== */
  const hasGM = typeof GM_getValue === 'function';
  const gmGet = (k, d) => {
    try { return hasGM ? GM_getValue(k, d) : (JSON.parse(localStorage.getItem(k)) ?? d); } catch (e) { return d; }
  };
  const gmSet = (k, v) => (hasGM ? GM_setValue(k, v) : localStorage.setItem(k, JSON.stringify(v)));
  const load = () => gmGet(KEY, []);
  const save = (v) => gmSet(KEY, v);
  const opts = () => Object.assign({ summaryPage: true, autoOutlier: true, subjectSf: '' }, gmGet(OPT_KEY, {}));
  const setOpt = (k, v) => gmSet(OPT_KEY, Object.assign(opts(), { [k]: v }));

  const propId = () => (location.pathname.match(HOME_RE) || [])[1];
  const isHome = () => !!propId();
  const pageKey = () => location.origin + location.pathname.replace(/\/$/, '');

  /* ================================================================== *
   * Formatting helpers
   * ================================================================== */
  const fmtInt = (n) => (n == null || isNaN(n) ? '' : Math.round(n).toLocaleString('en-US'));
  const fmtMoney = (n, d = 0) => (n == null || isNaN(n) ? '' :
    '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }));
  const fmtDate = (ms, tz, longYear) => {
    if (!ms) return '';
    return new Date(ms).toLocaleDateString('en-US', {
      timeZone: tz || 'America/Los_Angeles', month: 'numeric', day: 'numeric', year: longYear ? 'numeric' : '2-digit',
    });
  };
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const SUFFIX = {
    st: 'Street', ave: 'Avenue', av: 'Avenue', blvd: 'Boulevard', dr: 'Drive', ln: 'Lane', rd: 'Road', ct: 'Court',
    pl: 'Place', cir: 'Circle', ter: 'Terrace', pkwy: 'Parkway', hwy: 'Highway', trl: 'Trail', sq: 'Square',
    aly: 'Alley', cv: 'Cove', pt: 'Point', xing: 'Crossing', lp: 'Loop', mtn: 'Mountain',
  };
  function expandStreet(street) {
    if (!CFG.expandStreetSuffix || !street) return street || '';
    // keep any unit designator ("#4", "Unit 4", "Apt B") on the end
    const m = street.match(/^(.*?)(\s+(?:#|unit\b|apt\b|ste\b|suite\b).*)?$/i);
    const main = m[1];
    const unit = m[2] || '';
    const fixed = main.replace(/\b([A-Za-z]+)\.?$/, (w, s) => SUFFIX[s.toLowerCase()] || w);
    return fixed + unit;
  }

  function unitType(typeName, rawText) {
    const t = (typeName || '').toLowerCase();
    const plexM = (rawText || '').match(/\b(duplex|triplex|fourplex|quadplex|quadruplex)\b/i);
    const plex = plexM && [null, { duplex: 'Duplex', triplex: 'Triplex', fourplex: 'Fourplex', quadplex: 'Fourplex', quadruplex: 'Fourplex' }[plexM[1].toLowerCase()]];
    if (t.includes('single family')) return 'SFR';
    if (t.includes('condo') || t.includes('co-op')) return 'Condo';
    if (t.includes('townhouse')) return 'Townhome';
    if (t.includes('multi-family') && t.includes('2-4')) {
      const units = unitCount(rawText);
      if (units === 2) return 'Duplex';
      if (units === 3) return 'Triplex';
      if (units === 4) return 'Fourplex';
      if (plex) return plex[1];
      return 'Multi 2-4';
    }
    if (t.includes('multi-family')) return 'Multi 5+';
    if (t.includes('land')) return 'Land';
    if (t.includes('mobile') || t.includes('manufactured')) return 'Mobile';
    if (plex) return plex[1];
    return typeName || '';
  }
  function unitCount(rawText) {
    if (!rawText) return null;
    const m = rawText.match(/"amenityName":"(?:Number of Units|# of Units|Total Units|Units)[^"]*"[^\]]*?"amenityValues":\["(\d+)/i) ||
              rawText.match(/(?:Number of Units|# of Units|Total Units)\D{0,40}?(\d+)/i);
    return m ? parseInt(m[1], 10) : null;
  }

  /* ================================================================== *
   * Redfin data (their own JSON endpoints, same origin)
   * ================================================================== */
  const dataCache = {};
  async function fetchJsonText(url) {
    const r = await fetch(url, { credentials: 'include' });
    return (await r.text()).replace(/^\{\}&&/, '');
  }
  async function getHomeData(pid) {
    if (!pid) return null;
    const p = dataCache[pid] || (async () => {
      const above = JSON.parse(await fetchJsonText(`/stingray/api/home/details/aboveTheFold?propertyId=${pid}&accessLevel=1`)).payload;
      let belowText = '';
      try { belowText = await fetchJsonText(`/stingray/api/home/details/belowTheFold?propertyId=${pid}&accessLevel=1`); } catch (e) { /* optional */ }
      const a = above.addressSectionInfo || {};
      let below = {};
      try { below = JSON.parse(belowText).payload || {}; } catch (e) { /* optional */ }
      const pub = (below.publicRecordsInfo && below.publicRecordsInfo.basicInfo) || {};
      const soldEvt = ((below.propertyHistoryInfo && below.propertyHistoryInfo.events) || [])
        .find((e) => /sold/i.test(e.eventDescription || '') && e.eventDate);
      const typeName = (belowText.match(/"propertyTypeName":"([^"]+)"/) || [])[1] || pub.propertyTypeName || '';
      const street = (a.streetAddress && a.streetAddress.assembledAddress) || '';
      const price = (a.priceInfo && a.priceInfo.amount) || (a.latestPriceInfo && a.latestPriceInfo.amount) ||
        (soldEvt && soldEvt.price) || null;
      const sqft = (a.sqFt && a.sqFt.value) || pub.totalSqFt || null;
      const d = {
        pid,
        street,
        fullAddress: [street, a.city, [a.state, a.zip].filter(Boolean).join(' ')].filter(Boolean).join(', '),
        typeName,
        unitType: unitType(typeName, belowText),
        priceLabel: (a.priceInfo && a.priceInfo.label) || 'Price',
        price,
        soldDate: a.soldDate || (soldEvt && soldEvt.eventDate) || null,
        tz: a.soldDateTimeZone || 'America/Los_Angeles',
        sqft,
        lot: a.lotSize || pub.lotSqFt || null,
        beds: a.beds ?? pub.beds ?? null,
        baths: a.baths ?? pub.baths ?? null,
      };
      return d;
    })();
    dataCache[pid] = p;
    p.catch(() => delete dataCache[pid]);
    const d = Object.assign({}, await p);
    // Some sold homes hide beds/baths/sq ft from the data feed but still show them in the page banner
    if (pid === propId()) fillFromBanner(d);
    d.ppsf = d.price && d.sqft ? d.price / d.sqft : null;
    return d;
  }

  function fillFromBanner(d) {
    const stats = document.querySelector('.bp-AddressBannerSectionV2 .HomeMainStatsV2, .bp-AddressBannerSectionV2 .top-stats');
    if (!stats) return;
    const t = stats.innerText.replace(/\s+/g, ' ');
    const num = (re) => { const m = t.match(re); return m ? parseFloat(m[1].replace(/,/g, '')) : null; };
    if (d.beds == null) d.beds = num(/([\d.]+)\s*bd/i);
    if (d.baths == null) d.baths = num(/([\d.]+)\s*ba/i);
    if (!d.sqft) d.sqft = num(/([\d,]+)\s*sq\s*ft/i);
    if (!d.price) d.price = num(/\$([\d,]+)/);
  }

  /* ================================================================== *
   * Sale summary box (replaces the old standalone userscript)
   * ================================================================== */
  const BOX_STYLE = `
        #tm-sale-summary{border:1px solid #d5d5d5;border-radius:12px;padding:14px 18px;margin:12px 0;background:#fff;font-size:15px;line-height:1.35}
        #tm-sale-summary table{border-collapse:collapse;width:100%}
        #tm-sale-summary td{padding:4px 0;vertical-align:top}
        #tm-sale-summary td:first-child{color:#595959;width:140px;white-space:nowrap;padding-right:16px}
        #tm-sale-summary td:last-child{font-weight:600}
        #tm-sale-summary .tm-note{font-weight:400;color:#767676;font-size:13px}`;

  function boxHtml(d) {
    const sold = d.priceLabel.toLowerCase().includes('sold') || d.soldDate;
    const rows = [
      ['Address', esc(d.fullAddress)],
      ['Unit Type', esc(d.unitType) + (d.typeName && d.unitType !== d.typeName ? ` <span class="tm-note">(${esc(d.typeName)})</span>` : '')],
      [sold ? 'Last Sale Price' : 'Price', fmtMoney(d.price)],
      [sold ? 'Last Sale Date' : 'Sale Date', fmtDate(d.soldDate, d.tz, true)],
      ['Square Feet', fmtInt(d.sqft)],
      ['Lot Size', d.lot ? `${fmtInt(d.lot)} SF <span class="tm-note">(${(d.lot / 43560).toFixed(2)} ac)</span>` : ''],
      ['Bed / Bath', `${d.beds ?? '-'} bd / ${d.baths ?? '-'} ba`],
      ['Price / SF', fmtMoney(d.ppsf)],
    ];
    return `<style>${BOX_STYLE}</style><table><tbody>${rows.map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join('')}</tbody></table>`;
  }

  let boxFor = null;
  async function ensureBox() {
    const pid = propId();
    if (!pid) return;
    const banner = document.querySelector('.bp-AddressBannerSectionV2');
    if (!banner) return;
    let box = document.getElementById('tm-sale-summary');
    if (box && box.dataset.tmcPid === pid) return;
    if (boxFor === pid) return; // fetch in flight
    boxFor = pid;
    try {
      const d = await getHomeData(pid);
      if (propId() !== pid) return;
      box = document.getElementById('tm-sale-summary');
      if (!box) {
        box = document.createElement('div');
        box.id = 'tm-sale-summary';
        banner.insertAdjacentElement('afterend', box);
      }
      box.dataset.tmcPid = pid;
      box.innerHTML = boxHtml(d);
    } catch (e) {
      console.warn('[Redfin Comp Printer] summary box failed', e);
    } finally {
      boxFor = null;
    }
  }

  /* ================================================================== *
   * Styles
   * ================================================================== */
  const css = `
  #tmc-print-root { display: none; }
  @media print {
    @page { size: letter; margin: ${CFG.pageMarginIn}in; }
    html, body { height: auto !important; overflow: visible !important; background: #fff !important; }
    body.tmc-active > *:not(#tmc-print-root) { display: none !important; }
    body.tmc-active #tmc-print-root { display: block !important; }
  }
  body.tmc-preview > *:not(#tmc-print-root):not(#tmc-panel) { display: none !important; }
  body.tmc-preview #tmc-print-root {
    display: block !important; width: ${8.5 - 2 * CFG.pageMarginIn}in; margin: 20px auto;
    background: #fff; box-shadow: 0 0 0 ${CFG.pageMarginIn}in #fff, 0 0 0 calc(${CFG.pageMarginIn}in + 1px) #bbb;
  }
  body.tmc-preview { background: #e9e9e9 !important; }
  body.tmc-preview .tmc-page { border-bottom: 2px dashed #f33; padding-bottom: 12px; margin-bottom: 12px; }

  #tmc-print-root { width: 100%; font-size: 14px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .tmc-page { break-after: page; page-break-after: always; }
  .tmc-page:last-child { break-after: auto; page-break-after: auto; }
  .tmc-comp > * { break-inside: avoid; page-break-inside: avoid; }
  .tmc-photo { display: block; margin: 0 auto 10px; max-width: 100%; max-height: ${CFG.photoMaxHeightIn}in;
               width: auto; height: auto; border-radius: 8px; }
  .tmc-sec { width: 100% !important; max-width: none !important; margin: 0 0 10px !important; }
  .tmc-sec .bp-Section, .tmc-sec section { margin: 0 0 8px !important; padding-top: 10px !important; padding-bottom: 10px !important; }
  .tmc-src { font: 10px/1.3 Arial, sans-serif; color: #777; margin-top: 4px; word-break: break-all; }
  ${CFG.expandDescription ? `.tmc-sec .sectionContentContainer { max-height: none !important; overflow: visible !important; }` : ''}

  .tmc-summary h2 { font: 700 18px Arial, sans-serif; margin: 0 0 10px; color: #222; }
  .tmc-table { border-collapse: collapse; width: 100%; font: 11px/1.3 Arial, sans-serif; color: #111; }
  .tmc-table th { font-weight: 700; text-align: center; border-bottom: 1.5px solid #333; padding: 4px 5px; white-space: nowrap; }
  .tmc-table th:first-child, .tmc-table td:first-child { text-align: left; }
  .tmc-table td { text-align: center; padding: 3px 5px; border-bottom: 1px solid #e3e3e3; white-space: nowrap; }
  .tmc-table td.num { text-align: right; }
  .tmc-table tr.tmc-x td { text-decoration: line-through; color: #777; }
  .tmc-table tr.tmc-avg td { border-top: 1.5px solid #333; border-bottom: 0; font-weight: 700; }
  .tmc-table tr.tmc-avg td:first-child { text-align: right; }
  .tmc-table tr.tmc-gap td, .tmc-table tr.tmc-value td { border: 0; }
  .tmc-table tr.tmc-value td { font-weight: 700; text-align: left; padding-top: 6px; }
  .tmc-table tr.tmc-value td.tmc-calc { font-weight: 400; font-style: italic; text-align: center; }
  .tmc-table tr.tmc-value td.tmc-val { color: #c00; border: 2px solid #c00; text-align: right; font-size: 12px; }
  .tmc-note2 { font: 10px Arial, sans-serif; color: #777; margin-top: 6px; }

  #tmc-panel { position: fixed; right: 16px; bottom: 16px; z-index: 2147483647; background: #fff;
    border: 1px solid #ccc; border-radius: 10px; box-shadow: 0 4px 18px rgba(0,0,0,.18);
    font: 13px/1.35 -apple-system, BlinkMacSystemFont, Arial, sans-serif; color: #222; width: 270px; }
  #tmc-panel .tmc-head { display: flex; align-items: center; gap: 8px; padding: 10px 12px; }
  #tmc-panel .tmc-head label { display: flex; align-items: center; gap: 8px; font-weight: 600; cursor: pointer; flex: 1; }
  #tmc-panel input[type=checkbox] { width: 16px; height: 16px; accent-color: #c82021; cursor: pointer; margin: 0; }
  #tmc-panel .tmc-head input[type=checkbox] { width: 18px; height: 18px; }
  #tmc-panel .tmc-toggle { background: none; border: 0; cursor: pointer; font-size: 14px; color: #666; padding: 0 2px; }
  #tmc-panel .tmc-body { border-top: 1px solid #eee; padding: 8px 12px 10px; }
  #tmc-panel.tmc-collapsed .tmc-body { display: none; }
  #tmc-panel ol { margin: 0 0 8px; padding-left: 0; list-style: none; max-height: 200px; overflow: auto; }
  #tmc-panel li { margin: 2px 0; display: flex; align-items: center; gap: 4px; }
  #tmc-panel li .tmc-name { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  #tmc-panel li.tmc-x .tmc-name { text-decoration: line-through; color: #999; }
  #tmc-panel li button { border: 0; background: none; cursor: pointer; color: #888; padding: 0 3px; font-size: 12px; }
  #tmc-panel li button:hover { color: #c82021; }
  #tmc-panel .tmc-row { display: flex; gap: 6px; flex-wrap: wrap; }
  #tmc-panel .tmc-btn { flex: 1; border: 1px solid #c82021; background: #c82021; color: #fff; border-radius: 6px;
    padding: 5px 6px; cursor: pointer; font: 600 12px Arial, sans-serif; white-space: nowrap; }
  #tmc-panel .tmc-btn.tmc-sec-btn { background: #fff; color: #c82021; }
  #tmc-panel .tmc-btn:disabled { opacity: .45; cursor: default; }
  #tmc-panel .tmc-empty { color: #888; margin: 0 0 8px; }
  #tmc-panel .tmc-hint { color: #888; font-size: 11px; margin: 0 0 6px; }
  #tmc-panel .tmc-auto { font-size: 10px; color: #fff; background: #c82021; border-radius: 3px; padding: 0 4px; }
  #tmc-panel .tmc-sf { display: flex; align-items: center; gap: 6px; font-weight: 600; font-size: 12px; margin: 0 0 4px; }
  #tmc-panel .tmc-sf input { flex: 1; min-width: 0; border: 1px solid #ccc; border-radius: 5px; padding: 3px 6px; font: 12px Arial, sans-serif; }
  #tmc-panel .tmc-valline { font-size: 12px; color: #c00; font-weight: 700; margin: 0 0 8px; min-height: 0; }
  #tmc-panel .tmc-valline:empty { display: none; }
  #tmc-panel .tmc-opt { display: flex; align-items: center; gap: 6px; font-size: 12px; margin-top: 8px; cursor: pointer; }
  @media print { #tmc-panel { display: none !important; } }
  `;
  const styleEl = document.createElement('style');
  styleEl.id = 'tmc-style';
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  /* ================================================================== *
   * Capture the pieces of a home page
   * ================================================================== */
  function findParts() {
    const banner = document.querySelector('.bp-AddressBannerSectionV2');
    const top = banner ? banner.closest('.componentSection') || banner : null; // includes the summary box
    const summary = document.querySelector('#tm-sale-summary');
    const about = document.querySelector('#about-this-home-scroll');
    const photo =
      document.querySelector('.InlinePhotoPreviewSection #MBImage img') ||
      document.querySelector('[data-rf-test-id="mediaBrowser"] img') ||
      document.querySelector('.InlinePhotoPreviewSection img');
    return { top, summary, about, photo };
  }

  function sanitize(node) {
    const c = node.cloneNode(true);
    CFG.removeFromClones.forEach((sel) => c.querySelectorAll(sel).forEach((n) => n.remove()));
    // drop Redfin ids (avoid duplicates) but keep tm- ids so the summary box keeps its styling
    [c, ...c.querySelectorAll('[id]')].forEach((n) => { if (n.id && !n.id.startsWith('tm-')) n.removeAttribute('id'); });
    c.querySelectorAll('img').forEach((img) => {
      const src = img.currentSrc || img.src;
      if (src) img.setAttribute('src', new URL(src, location.href).href);
      img.removeAttribute('srcset');
      img.removeAttribute('loading');
    });
    c.querySelectorAll('a[href]').forEach((a) => a.setAttribute('href', new URL(a.getAttribute('href'), location.href).href));
    return c;
  }

  function captureCurrent(data) {
    const p = findParts();
    if (!p.top && !p.about) return null;
    const parts = [];
    if (p.top) parts.push(sanitize(p.top).outerHTML);
    if (p.summary && p.top && !p.top.contains(p.summary)) parts.push(sanitize(p.summary).outerHTML);
    if (p.about) parts.push(sanitize(p.about).outerHTML);
    const addr = (document.title.split('|')[0] || location.pathname).trim();
    return {
      key: pageKey(), pid: propId(), url: location.href.split('#')[0], addr,
      photo: p.photo ? new URL(p.photo.currentSrc || p.photo.src, location.href).href : '',
      parts, data: data || null, exclude: false, savedAt: Date.now(),
    };
  }

  // Fill in table data for any stored comp that is missing it (older saves)
  async function withData(set) {
    let changed = false;
    for (const c of set) {
      if (!c.pid) c.pid = ((c.url || c.key || '').match(HOME_RE) || [])[1]; // saves from v1
      if (!c.data && c.pid) {
        try { c.data = await getHomeData(c.pid); changed = true; } catch (e) { /* leave blank */ }
      }
    }
    if (changed) {
      const cur = load();
      cur.forEach((c) => { const f = set.find((s) => s.key === c.key); if (f && f.data && !c.data) c.data = f.data; });
      save(cur);
    }
    return set;
  }

  /* ================================================================== *
   * Comp table (first page + clipboard)
   * ================================================================== */
  const COLS = ['Address', 'Unit Type', 'Price', 'Date', 'Square Feet', 'Lot', 'Beds', 'Bath', 'Price/SF'];

  // Which comps are struck from the averages.
  // c.override: 'in' | 'out' is your manual choice; otherwise the highest $/SF comp is dropped automatically.
  function exclusions(set, o = opts()) {
    const manual = (c) => c.override || (c.exclude ? 'out' : null); // c.exclude = v2.0 saves
    let autoIdx = -1;
    if (o.autoOutlier) {
      const priced = set.map((c, i) => [i, c.data && c.data.ppsf]).filter(([, p]) => p != null && !isNaN(p));
      if (priced.length >= CFG.outlierMinComps) autoIdx = priced.reduce((m, x) => (x[1] > m[1] ? x : m))[0];
    }
    return set.map((c, i) => {
      const m = manual(c);
      if (m) return { excluded: m === 'out', auto: false, manual: true };
      return { excluded: i === autoIdx, auto: i === autoIdx, manual: false };
    });
  }

  function tableModel(set, o = opts()) {
    const ex = exclusions(set, o);
    const rows = set.map((c, i) => {
      const d = c.data || {};
      return {
        exclude: ex[i].excluded,
        auto: ex[i].auto,
        raw: d,
        cells: [
          expandStreet(d.street || c.addr.split(',')[0]),
          d.unitType || '',
          fmtMoney(d.price),
          fmtDate(d.soldDate, d.tz, false),
          fmtInt(d.sqft),
          fmtInt(d.lot),
          d.beds ?? '',
          d.baths ?? '',
          fmtMoney(d.ppsf, 2),
        ],
      };
    });
    const inc = rows.filter((r) => !r.exclude).map((r) => r.raw);
    const avg = (k) => {
      const v = inc.map((d) => d[k]).filter((x) => x != null && !isNaN(x));
      return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
    };
    const avgPpsf = avg('ppsf');
    const avgRow = ['Average:', '', fmtMoney(avg('price')), '', fmtInt(avg('sqft')), fmtInt(avg('lot')), '', '', fmtMoney(avgPpsf, 2)];
    const sf = parseFloat(String(o.subjectSf || '').replace(/[^\d.]/g, ''));
    let valueRow = null;
    if (sf > 0 && avgPpsf != null) {
      valueRow = ['Value based on Average Sale Comp', '', `${fmtInt(sf)} sf x ${fmtMoney(avgPpsf, 2)}/sf`, '',
        fmtMoney(sf * avgPpsf), '', '', '', ''];
    }
    return { rows, avgRow, valueRow, anyAuto: rows.some((r) => r.auto), anyExcluded: rows.some((r) => r.exclude) };
  }

  const NUM_COLS = new Set([2, 4, 5, 8]);
  function tableHtml(model, forClipboard) {
    const td = (v, i, extra = '') => {
      const style = forClipboard ? ` style="${extra}${NUM_COLS.has(i) ? 'text-align:right;' : i === 0 ? '' : 'text-align:center;'}"` : '';
      return `<td${!forClipboard && NUM_COLS.has(i) ? ' class="num"' : ''}${style}>${esc(v)}</td>`;
    };
    const head = `<tr>${COLS.map((c) => `<th>${c}</th>`).join('')}</tr>`;
    const body = model.rows.map((r) =>
      `<tr${r.exclude ? ' class="tmc-x"' : ''}>${r.cells.map((v, i) => td(v, i, r.exclude ? 'text-decoration:line-through;' : '')).join('')}</tr>`).join('');
    const avg = `<tr class="tmc-avg">${model.avgRow.map((v, i) => td(v, i, 'font-weight:bold;')).join('')}</tr>`;
    let value = '';
    if (model.valueRow) {
      const v = model.valueRow;
      if (forClipboard) {
        // one cell per column so it lands in the same columns as your sheet
        const styles = { 0: 'font-weight:bold;', 2: 'font-style:italic;', 4: 'font-weight:bold;color:#c00;border:2px solid #c00;text-align:right;' };
        value = `<tr>${COLS.map(() => '<td></td>').join('')}</tr>` +
          `<tr>${v.map((x, i) => `<td style="${styles[i] || ''}">${esc(x)}</td>`).join('')}</tr>`;
      } else {
        value = `<tr class="tmc-gap"><td colspan="${COLS.length}">&nbsp;</td></tr>` +
          `<tr class="tmc-value"><td colspan="2">${esc(v[0])}</td>` +
          `<td colspan="2" class="tmc-calc">${esc(v[2])}</td>` +
          `<td class="tmc-val">${esc(v[4])}</td><td colspan="${COLS.length - 5}"></td></tr>`;
      }
    }
    return `<table class="tmc-table">${head}${body}${avg}${value}</table>`;
  }

  function tableTsv(model) {
    const lines = [COLS, ...model.rows.map((r) => r.cells), model.avgRow];
    if (model.valueRow) lines.push([], model.valueRow);
    return lines.map((l) => l.join('\t')).join('\n');
  }

  async function copyTable() {
    const set = await withData(load());
    const model = tableModel(set);
    const html = `<html><body>${tableHtml(model, true)}</body></html>`;
    const tsv = tableTsv(model);
    try {
      await navigator.clipboard.write([new ClipboardItem({
        'text/html': new Blob([html], { type: 'text/html' }),
        'text/plain': new Blob([tsv], { type: 'text/plain' }),
      })]);
    } catch (e) {
      if (typeof GM_setClipboard === 'function') GM_setClipboard(tsv, 'text');
      else await navigator.clipboard.writeText(tsv);
    }
    flash('Table copied. Paste into Excel.');
  }

  /* ================================================================== *
   * Render into the print root
   * ================================================================== */
  function root() {
    let r = document.getElementById('tmc-print-root');
    if (!r) {
      r = document.createElement('div');
      r.id = 'tmc-print-root';
      document.body.appendChild(r);
    }
    return r;
  }

  function render(comps, withSummary) {
    const r = root();
    r.innerHTML = '';
    if (withSummary) {
      const pg = document.createElement('div');
      pg.className = 'tmc-page tmc-summary';
      const model = tableModel(comps);
      pg.innerHTML = `<h2>${esc(CFG.tableTitle)}</h2>${tableHtml(model, false)}` +
        (model.anyExcluded ? `<div class="tmc-note2">Struck-through comps are excluded from the averages` +
          `${model.anyAuto ? ' (highest $/SF comp dropped as an outlier)' : ''}.</div>` : '');
      r.appendChild(pg);
    }
    comps.forEach((c) => {
      const wrap = document.createElement('div');
      wrap.className = 'tmc-page tmc-comp';
      if (c.photo) {
        const img = document.createElement('img');
        img.className = 'tmc-photo';
        img.src = c.photo;
        wrap.appendChild(img);
      }
      c.parts.forEach((html) => {
        const sec = document.createElement('div');
        sec.className = 'tmc-sec';
        sec.innerHTML = html;
        wrap.appendChild(sec);
      });
      const src = document.createElement('div');
      src.className = 'tmc-src';
      src.textContent = c.url;
      wrap.appendChild(src);
      r.appendChild(wrap);
    });
    if (CFG.fitOnePage) fitPages(r);
    return r;
  }

  // Shrink any page taller than one Letter page so each comp lands on exactly one page
  const PAGE_W_PX = (8.5 - 2 * CFG.pageMarginIn) * 96;
  const PAGE_H_PX = (11 - 2 * CFG.pageMarginIn) * 96 - 8;
  function fitPages(r) {
    const prev = r.getAttribute('style') || '';
    r.setAttribute('style', `display:block !important; position:absolute !important; left:-20000px; top:0; width:${PAGE_W_PX}px;`);
    [...r.children].forEach((pg) => {
      pg.style.zoom = '';
      const h = pg.scrollHeight;
      if (h > PAGE_H_PX) pg.style.zoom = String(Math.floor((PAGE_H_PX / h) * 1000) / 1000);
      pg.querySelectorAll('img').forEach((img) => {
        if (!img.complete) img.addEventListener('load', () => fitPages(r), { once: true });
      });
    });
    r.setAttribute('style', prev);
  }

  function imagesReady(el, timeoutMs = 8000) {
    const waits = [...el.querySelectorAll('img')].map((img) =>
      img.complete ? Promise.resolve() : new Promise((res) => {
        img.addEventListener('load', res, { once: true });
        img.addEventListener('error', res, { once: true });
      }));
    return Promise.race([Promise.all(waits), new Promise((res) => setTimeout(res, timeoutMs))]);
  }

  let mode = 'single'; // 'single' | 'set'

  function renderSingle() {
    if (!isHome()) { root().innerHTML = ''; return false; }
    const c = captureCurrent();
    if (!c) return false;
    render([c], false);
    return true;
  }

  async function printWith(comps, withSummary) {
    mode = 'set';
    const r = render(comps, withSummary);
    document.body.classList.add('tmc-active');
    await imagesReady(r);
    fitPages(r);
    window.print();
  }

  window.addEventListener('beforeprint', () => {
    if (mode === 'single' && CFG.hijackCmdP && isHome()) {
      if (renderSingle()) document.body.classList.add('tmc-active');
    }
  });
  window.addEventListener('afterprint', () => {
    mode = 'single';
    if (!CFG.hijackCmdP) document.body.classList.remove('tmc-active');
    renderSingle();
  });

  /* ================================================================== *
   * Floating panel
   * ================================================================== */
  let panel;
  function buildPanel() {
    panel = document.createElement('div');
    panel.id = 'tmc-panel';
    panel.innerHTML = `
      <div class="tmc-head">
        <label><input type="checkbox" id="tmc-check"> <span id="tmc-check-label">Add to print set</span></label>
        <button class="tmc-toggle" id="tmc-toggle" title="Show / hide">&#9662;</button>
      </div>
      <div class="tmc-body">
        <p class="tmc-hint" id="tmc-hint">Unticked comps are struck from the averages.</p>
        <ol id="tmc-list"></ol>
        <label class="tmc-sf">Subject SF <input type="text" inputmode="numeric" id="tmc-subject-sf" placeholder="e.g. 2,910"></label>
        <div class="tmc-valline" id="tmc-valline"></div>
        <p class="tmc-empty" id="tmc-empty">No comps collected yet.</p>
        <div class="tmc-row">
          <button class="tmc-btn" id="tmc-print-set">Print set</button>
          <button class="tmc-btn tmc-sec-btn" id="tmc-print-one">Print this</button>
        </div>
        <div class="tmc-row" style="margin-top:6px">
          <button class="tmc-btn tmc-sec-btn" id="tmc-copy">Copy table</button>
          <button class="tmc-btn tmc-sec-btn" id="tmc-preview">Preview</button>
          <button class="tmc-btn tmc-sec-btn" id="tmc-clear">Clear</button>
        </div>
        <label class="tmc-opt"><input type="checkbox" id="tmc-opt-summary"> Summary table as first page</label>
        <label class="tmc-opt" style="margin-top:4px"><input type="checkbox" id="tmc-opt-outlier"> Auto-drop highest $/SF comp</label>
      </div>`;
    document.body.appendChild(panel);
    if (localStorage.getItem('tmcCollapsed') === '1') panel.classList.add('tmc-collapsed');

    panel.querySelector('#tmc-toggle').onclick = () => {
      panel.classList.toggle('tmc-collapsed');
      localStorage.setItem('tmcCollapsed', panel.classList.contains('tmc-collapsed') ? '1' : '0');
    };

    panel.querySelector('#tmc-check').onchange = async (e) => {
      const checked = e.target.checked;
      if (!checked) { save(load().filter((c) => c.key !== pageKey())); refresh(); return; }
      let data = null;
      try { data = await getHomeData(propId()); } catch (err) { /* table cells will be blank */ }
      await ensureBox();
      const c = captureCurrent(data);
      if (!c) { flash('Page not loaded yet. Try again in a second.'); e.target.checked = false; return; }
      const set = load();
      const i = set.findIndex((s) => s.key === c.key);
      if (i >= 0) { c.override = set[i].override; c.exclude = set[i].exclude; set[i] = c; } else set.push(c);
      save(set);
      refresh();
    };

    panel.querySelector('#tmc-print-set').onclick = async () => {
      const set = await withData(load());
      if (!set.length) return;
      if (opts().summaryPage) askSubjectSf();
      printWith(set, opts().summaryPage);
    };
    panel.querySelector('#tmc-print-one').onclick = () => {
      const c = captureCurrent();
      if (c) printWith([c], false);
    };
    panel.querySelector('#tmc-copy').onclick = () => { askSubjectSf(); copyTable().catch((e) => flash('Copy failed: ' + e.message)); };
    panel.querySelector('#tmc-preview').onclick = async (e) => {
      const on = !document.body.classList.contains('tmc-preview');
      if (on) {
        const set = await withData(load());
        render(set, opts().summaryPage);
        document.body.classList.add('tmc-preview');
        window.scrollTo(0, 0);
      } else {
        document.body.classList.remove('tmc-preview');
        renderSingle();
      }
      e.target.textContent = on ? 'Close' : 'Preview';
    };
    panel.querySelector('#tmc-clear').onclick = () => {
      if (confirm('Remove all comps (and the subject SF) from the print set?')) { setOpt('subjectSf', ''); save([]); refresh(); }
    };
    const optBox = panel.querySelector('#tmc-opt-summary');
    optBox.checked = opts().summaryPage;
    optBox.onchange = () => setOpt('summaryPage', optBox.checked);
    const outBox = panel.querySelector('#tmc-opt-outlier');
    outBox.checked = opts().autoOutlier;
    outBox.onchange = () => { setOpt('autoOutlier', outBox.checked); update(() => {}); };
    const sfBox = panel.querySelector('#tmc-subject-sf');
    sfBox.oninput = () => { setOpt('subjectSf', sfBox.value.trim()); showValue(load()); rerenderPreview(); };
  }

  function askSubjectSf() {
    if (!CFG.askSubjectSf || opts().subjectSf) return;
    const v = prompt('Subject property square feet (for "Value based on Average Sale Comp"). Leave blank to skip.', '');
    if (v && parseFloat(v.replace(/[^\d.]/g, '')) > 0) {
      setOpt('subjectSf', v.trim());
      panel.querySelector('#tmc-subject-sf').value = v.trim();
      showValue(load());
    }
  }

  function showValue(set) {
    const el = panel.querySelector('#tmc-valline');
    const m = tableModel(set);
    el.textContent = m.valueRow ? `${m.valueRow[2]} = ${m.valueRow[4]}` : '';
  }

  function rerenderPreview() {
    if (document.body.classList.contains('tmc-preview')) render(load(), opts().summaryPage);
  }

  function flash(msg) {
    const lbl = panel.querySelector('#tmc-check-label');
    const old = lbl.dataset.text || lbl.textContent;
    lbl.dataset.text = old;
    lbl.textContent = msg;
    clearTimeout(flash.t);
    flash.t = setTimeout(() => { lbl.textContent = old; delete lbl.dataset.text; }, 3000);
  }

  function update(fn) {
    const set = load();
    fn(set);
    save(set);
    refresh();
    rerenderPreview();
  }

  function refresh() {
    if (!panel) return;
    const set = load();
    const home = isHome();
    const chk = panel.querySelector('#tmc-check');
    chk.disabled = !home;
    chk.checked = home && set.some((c) => c.key === pageKey());
    const lbl = panel.querySelector('#tmc-check-label');
    if (!lbl.dataset.text) lbl.textContent = home ? 'Add to print set' : 'Comp set';
    panel.querySelector('#tmc-print-one').disabled = !home;
    // printing reuses Redfin's home page styles, so print from a home page
    panel.querySelector('#tmc-print-set').disabled = !set.length || !home;
    panel.querySelector('#tmc-preview').disabled = !set.length || !home;
    panel.querySelector('#tmc-copy').disabled = !set.length;
    panel.querySelector('#tmc-print-set').textContent = `Print set (${set.length})`;
    panel.querySelector('#tmc-empty').style.display = set.length ? 'none' : '';
    panel.querySelector('#tmc-hint').style.display = set.length ? '' : 'none';

    const sfBox = panel.querySelector('#tmc-subject-sf');
    if (document.activeElement !== sfBox) sfBox.value = opts().subjectSf || '';
    showValue(set);

    const ex = exclusions(set);
    const ol = panel.querySelector('#tmc-list');
    ol.innerHTML = '';
    set.forEach((c, i) => {
      const li = document.createElement('li');
      if (ex[i].excluded) li.className = 'tmc-x';
      const inc = document.createElement('input');
      inc.type = 'checkbox';
      inc.checked = !ex[i].excluded;
      inc.title = ex[i].auto ? 'Auto-dropped as the highest $/SF. Tick to keep it in.' : 'Include in averages';
      inc.onchange = () => update((s) => { s[i].override = inc.checked ? 'in' : 'out'; delete s[i].exclude; });
      const name = document.createElement('span');
      name.className = 'tmc-name';
      name.textContent = (c.data && c.data.street ? expandStreet(c.data.street) : c.addr.split(',')[0]) +
        (c.data && c.data.ppsf ? `  ${fmtMoney(c.data.ppsf)}/sf` : '');
      name.title = c.addr;
      li.append(inc, name);
      if (ex[i].auto) {
        const tag = document.createElement('span');
        tag.className = 'tmc-auto';
        tag.textContent = 'high';
        tag.title = 'Highest $/SF, dropped automatically';
        li.appendChild(tag);
      } else if (ex[i].manual) {
        const reset = document.createElement('button');
        reset.textContent = '↺';
        reset.title = 'Back to automatic';
        reset.onclick = () => update((s) => { delete s[i].override; delete s[i].exclude; });
        li.appendChild(reset);
      }
      [['↑', () => update((s) => { if (i > 0) [s[i - 1], s[i]] = [s[i], s[i - 1]]; }), 'Move up'],
       ['↓', () => update((s) => { if (i < s.length - 1) [s[i + 1], s[i]] = [s[i], s[i + 1]]; }), 'Move down'],
       ['✕', () => update((s) => { s.splice(i, 1); }), 'Remove']]
        .forEach(([t, fn, title]) => {
          const b = document.createElement('button');
          b.textContent = t; b.title = title; b.onclick = fn;
          li.appendChild(b);
        });
      ol.appendChild(li);
    });
  }

  /* ================================================================== *
   * Boot + SPA navigation handling
   * ================================================================== */
  buildPanel();
  refresh();
  if (hasGM && typeof GM_addValueChangeListener === 'function') {
    GM_addValueChangeListener(KEY, (_k, _o, _n, remote) => { if (remote) refresh(); });
  } else {
    window.addEventListener('storage', (e) => { if (e.key === KEY) refresh(); });
  }
  window.addEventListener('focus', refresh);

  let lastHref = '';
  let warmTries = 0;
  setInterval(() => {
    if (location.href !== lastHref) { lastHref = location.href; warmTries = 0; refresh(); }
    if (!isHome()) return;
    ensureBox();
    // keep the one-pager pre-rendered so the photo is already loaded when you hit Cmd+P
    if (CFG.hijackCmdP && mode === 'single' && warmTries < 20 && !document.body.classList.contains('tmc-preview')) {
      warmTries++;
      if (document.getElementById('tm-sale-summary') && renderSingle()) {
        document.body.classList.add('tmc-active');
        if (warmTries > 5) warmTries = 20;
      }
    }
  }, 1000);
})();