// ==UserScript==
// @name         TitlePro247 → Humperdink Property Autofill
// @namespace    loneoakfund
// @version      0.6.0
// @description  Scrape property report on TitlePro247 and autofill the New Property modal in Humperdink.
// @match        https://www.titlepro247.com/Orders/Home/Html/*
// @match        https://humperdink.loneoakfund.com/Loans/Details/*
// @match        https://loneo-qa-lmsapp.6technology.com/Loans/Details/*
// @match        https://beta-lmsapp.loneoakfund.com/Loans/Details/*
// @match        https://www.titlepro247.com/v2/ViewOrder/*
// @match        https://v3.titlepro247.com/v2/ViewOrder/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_setClipboard
// @grant        unsafeWindow
// @run-at       document-idle
// @downloadURL  https://loftools.azurewebsites.net/userscripts/titlepro-to-humperdink.user.js
// @updateURL    https://loftools.azurewebsites.net/userscripts/titlepro-to-humperdink.user.js
// ==/UserScript==

(function () {
  'use strict';

  const STORAGE_KEY = 'lof_titlepro_payload_v1';

  // ------------------------- shared helpers -------------------------

  function store(payload) {
    const json = JSON.stringify(payload);
    try { GM_setValue(STORAGE_KEY, json); } catch (_) {}
    try { localStorage.setItem(STORAGE_KEY, json); } catch (_) {}
    try { GM_setClipboard(json); } catch (_) {}
  }

  function load() {
    let raw = null;
    try { raw = GM_getValue(STORAGE_KEY, null); } catch (_) {}
    if (!raw) { try { raw = localStorage.getItem(STORAGE_KEY); } catch (_) {} }
    if (!raw) return null;
    try { return JSON.parse(raw); } catch (_) { return null; }
  }

  function mkButton(text, onclick) {
    const b = document.createElement('button');
    b.textContent = text;
    Object.assign(b.style, {
      position: 'fixed', right: '16px', bottom: '16px', zIndex: 2147483647,
      background: '#0b66c3', color: '#fff', border: 'none', borderRadius: '6px',
      padding: '10px 14px', fontSize: '13px', fontWeight: '600',
      boxShadow: '0 2px 8px rgba(0,0,0,.25)', cursor: 'pointer',
      maxWidth: '360px', textAlign: 'left', whiteSpace: 'pre-line', lineHeight: '1.4',
    });
    b.addEventListener('click', onclick);
    document.body.appendChild(b);
    return b;
  }

  function flash(btn, msg, ok = true, ms = 2600) {
    // Remember the resting label once, so a second click mid-flash doesn't
    // make the flash message the new resting label.
    if (!btn.dataset.lofLabel) {
      btn.dataset.lofLabel = btn.textContent;
      btn.dataset.lofBg = btn.style.background;
    }
    clearTimeout(btn._lofTimer);
    btn._lofFlashing = true;
    btn.textContent = msg;
    btn.style.background = ok === 'warn' ? '#a8690c' : (ok ? '#1f8a3b' : '#b3261e');
    btn._lofTimer = setTimeout(() => {
      btn._lofFlashing = false;
      btn.textContent = btn.dataset.lofLabel;
      btn.style.background = btn.dataset.lofBg;
    }, ms);
  }

  // ------------------------- TitlePro247 side -------------------------

  const txt = el => (el && el.textContent || '').replace(/\s+/g, ' ').trim();

  // Set while scraping one property out of a batch report, so every lookup
  // below only sees that property's cells.
  let scopeCells = null;

  // All td/th on the page (or in the current property), in document order.
  function allCells() {
    return scopeCells || Array.from(document.querySelectorAll('td, th'));
  }

  // A batch order puts several properties on one page, one after another.
  // Each property gets a "Property Details Report" and a "Transaction History
  // Report", and every report opens with a name header followed by that
  // property's Parcel Number. The reports don't nest cleanly in the DOM, so
  // split on those headers in document order and group the reports by APN.
  function splitProperties() {
    const cells = Array.from(document.querySelectorAll('td, th'));
    const starts = [];
    cells.forEach((c, i) => { if (/ReportNameSectionHeaders_Name/.test(c.className || '')) starts.push(i); });
    if (starts.length < 2) return [];

    const groups = new Map();
    starts.forEach((s, k) => {
      const slice = cells.slice(s, starts[k + 1] != null ? starts[k + 1] : cells.length);
      const field = label => {
        const c = slice.find(x => /fieldlabel/i.test(x.className || '') && txt(x) === label);
        return c ? txt(c.nextElementSibling) : '';
      };
      const apn = field('Parcel Number');
      const address = field('Property Address');
      const key = apn || address || ('report ' + k);
      if (!groups.has(key)) groups.set(key, { apn, address, city: field('City, State & Zip'), cells: [] });
      const g = groups.get(key);
      g.cells.push(...slice);
      if (!g.address) g.address = address;
    });
    return Array.from(groups.values());
  }

  function propertyLabel(p) {
    if (p.address) {
      const city = (p.city.split(',')[0] || '').trim();
      return normalizeAddress(p.address) + (city ? ', ' + titleCase(city) : '');
    }
    return p.apn ? 'APN ' + p.apn : 'Unknown property';
  }

  // Label cells only, when the report uses TitlePro's fieldlabel classes.
  // Falls back to every cell if that class is not present (older report layouts).
  function labelCells() {
    const cells = allCells();
    const tagged = cells.filter(c => /fieldlabel/i.test(c.className || ''));
    return tagged.length >= 10 ? tagged : cells;
  }

  // First non-empty value for a label, anywhere on the page.
  function val(label) {
    const matches = [];
    for (const c of labelCells()) {
      if (txt(c) === label) {
        const n = c.nextElementSibling;
        if (n) matches.push(txt(n));
      }
    }
    return matches.find(Boolean) || '';
  }

  // First non-empty value for a label, restricted to the table that holds a
  // section header matching headerRe. Keeps "Recording Date" in the Latest Full
  // Sale block from being satisfied by a mortgage release further down the page.
  function sectionVal(headerRe, label) {
    const head = allCells().find(c => headerRe.test(txt(c)));
    const scope = head && head.closest('table');
    if (!scope) return '';
    for (const c of scope.querySelectorAll('td, th')) {
      if (txt(c) === label) {
        const v = txt(c.nextElementSibling);
        if (v) return v;
      }
    }
    return '';
  }

  // ---- value normalizers ----

  const money = s => (s || '').replace(/[^\d.]/g, '');
  function num(s) { const n = parseFloat(money(s)); return isNaN(n) ? 0 : n; }
  const isMDY = s => /^\d{1,2}\/\d{1,2}\/\d{4}$/.test((s || '').trim());
  function dateKey(s) {
    const m = (s || '').trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    return m ? (+m[3]) * 10000 + (+m[1]) * 100 + (+m[2]) : 0;
  }
  function toISO(s) {
    const m = (s || '').trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    return m ? `${m[3]}-${String(+m[1]).padStart(2, '0')}-${String(+m[2]).padStart(2, '0')}` : '';
  }
  // Year Built only, per spec. Rejects 0000 / 19 / other junk.
  function yearOnly(s) {
    const m = (s || '').match(/\b(1[5-9]\d{2}|20\d{2})\b/);
    return m ? m[1] : '';
  }

  // ---- transaction history parsing ----

  // The Transaction Details section repeats a block per recorded document.
  // Every block opens with a "Transaction ID" label, so segment on that.
  function parseTransactions() {
    const cells = labelCells();
    const pairs = cells.map(c => ({ label: txt(c), value: c.nextElementSibling ? txt(c.nextElementSibling) : null }));
    const starts = [];
    pairs.forEach((p, i) => { if (p.label === 'Transaction ID' && p.value) starts.push(i); });

    const recs = [];
    for (let k = 0; k < starts.length; k++) {
      const s = starts[k];
      const e = starts[k + 1] != null ? starts[k + 1] : pairs.length;
      const g = {};
      for (let i = s; i < e; i++) {
        const p = pairs[i];
        if (p.label && p.value != null && !(p.label in g)) g[p.label] = p.value;
      }
      recs.push(g);
    }
    return recs;
  }

  // Descriptions that mean "not a real purchase" even when TitlePro leaves
  // Type of Transaction blank.
  const NON_ARMS_DESC = /intra.?family|inter.?spousal|dissolution|gift|quit.?claim|trustee|trust\s*transfer|foreclos|in\s*lieu|sheriff|tax\s*deed|transfer\s*on\s*death|beneficiary\s*deed|nominal|correct|re.?record|affidavit|easement/i;

  // Below this a recorded price is more likely a token consideration than a
  // real purchase, so it is shown for review but never picked on its own.
  const MIN_SALE_PRICE = 50000;

  // TitlePro only says "Arms-Length Transfer" on residential sales. Commercial
  // sales come through as "Non Residential Transfer", and a priced grant or
  // warranty deed is an ordinary sale either way, so neither needs a flag.
  const SALE_TYPE = /(non.?)?residential\s*transfer/i;
  const SALE_DEED = /grant\s*deed|warranty\s*deed|bargain\s*and\s*sale/i;

  function transferRecords(recs) {
    return recs
      .filter(g => ('Type of Transaction' in g) || /deed|transfer|grant/i.test(g['Document Type'] || ''))
      .map(g => {
        const type = (g['Type of Transaction'] || '').trim();
        const desc = (g['Document Description'] || '').trim();
        const nonArms = /non\s*.?arms/i.test(type) || NON_ARMS_DESC.test(desc);
        const armsLength = !nonArms && (
          (/arms.?length/i.test(type) && !/non/i.test(type)) || SALE_TYPE.test(type) || SALE_DEED.test(desc)
        );
        return {
          txnId: g['Transaction ID'] || '',
          recordingDate: (g['Recording Date'] || '').trim(),
          transferDate: (g['Transfer Date'] || '').trim(),
          price: num(g['Sale Price']),
          priceRaw: (g['Sale Price'] || '').trim(),
          docType: (g['Document Type'] || '').trim(),
          type, desc,
          buyer: (g['Buyer 1'] || '').trim(),
          seller: (g['Seller 1'] || '').trim(),
          partialInterest: (g['Partial Interest Transferred'] || '').trim(),
          multiApn: /^y/i.test(g['Multiple APNs on Deed'] || ''),
          armsLength,
          nonArms,
        };
      });
  }

  // Latest real purchase: most recent transfer priced at MIN_SALE_PRICE or
  // more that is not flagged non arms-length and is not a partial interest. Explicit "Arms-Length
  // Transfer" wins a tie on the same recording date; "Per Assessor" rows
  // (assessor-reported sale price, no recorded deed detail) still qualify,
  // since that is often the only place the true price shows up.
  // Why a transfer can't be the purchase, or '' if it can.
  function skipReason(t) {
    if (t.nonArms) return 'Not a market sale';
    if (/^y/i.test(t.partialInterest)) return 'Partial interest';
    if (!t.price) return 'No price';
    if (!isMDY(t.recordingDate)) return 'No recording date';
    if (t.price < MIN_SALE_PRICE) return 'Under $' + MIN_SALE_PRICE.toLocaleString();
    return '';
  }

  function pickLatestSale(transfers) {
    return transfers
      .filter(t => !skipReason(t))
      .sort((a, b) =>
        dateKey(b.recordingDate) - dateKey(a.recordingDate) ||
        (b.armsLength - a.armsLength) ||
        (b.price - a.price) ||
        ((+a.txnId || 0) - (+b.txnId || 0))
      );
  }

  function scrapeTitlePro(cells) {
    scopeCells = cells || null;
    try { return scrapeScoped(); } finally { scopeCells = null; }
  }

  function scrapeScoped() {
    const rawCityStateZip = val('City, State & Zip');     // "VAN NUYS, CA 91406-5318"
    let city = '', state = '', zip = '';
    const m = rawCityStateZip.match(/^(.+?),\s*([A-Z]{2})\s*(\d{5}(?:-\d{4})?)?/);
    if (m) { city = titleCase(m[1]); state = m[2]; zip = (m[3] || '').split('-')[0]; }

    const lotRaw = val('Lot Size (SF/AC)');               // "6,517/.15"
    let lotSqft = '', lotAcres = '';
    if (lotRaw) {
      const parts = lotRaw.split('/').map(s => s.trim());
      lotSqft = (parts[0] || '').replace(/[^\d.]/g, '');
      lotAcres = (parts[1] || '').replace(/[^\d.]/g, '');
    }

    const county = (val('County') || '').replace(/\s*COUNTY\s*$/i, '').trim();
    const propertyUse = val('Property Use');

    // Year Built, scoped to Property Characteristics so a comp or transaction
    // block cannot answer for it. Year Built only, no Effective Year Built.
    const yearBuilt = yearOnly(
      sectionVal(/^property characteristics/i, 'Year Built') || val('Year Built')
    );

    // --- sale / purchase resolution ---

    const LFS = /^latest full sale|^last market sale|^latest sale/i;
    const lfs = {
      price: sectionVal(LFS, 'Sale Price') || val('Sale Price'),
      saleDate: sectionVal(LFS, 'Sale Date') || val('Sale Date'),
      recordingDate: sectionVal(LFS, 'Recording Date') || val('Recording Date'),
      docNum: sectionVal(LFS, 'Recorder Doc #'),
      seller: sectionVal(LFS, 'Primary Owner Name(s)'),
    };

    const transfers = transferRecords(parseTransactions());
    const ranked = pickLatestSale(transfers);
    const best = ranked[0] || null;

    const warnings = [];
    let purchasePrice, purchaseDate, saleDate, saleType, saleSource, saleArmsLength;

    const useBest = best && dateKey(best.recordingDate) >= dateKey(lfs.recordingDate);
    if (useBest) {
      purchasePrice = String(best.price);
      purchaseDate = best.recordingDate;
      saleDate = best.transferDate || best.recordingDate;
      saleType = best.type || best.desc || best.docType;
      saleArmsLength = best.armsLength;
      saleSource = 'transaction history (ID ' + best.txnId + ')';
      if (!best.armsLength) {
        warnings.push('Sale isn\'t marked arms-length (' + (best.type || 'blank') + '), check the purchase date and price');
      }
      if (best.multiApn) warnings.push('Deed covers more than one parcel, price may include them');
      if (dateKey(best.recordingDate) > dateKey(lfs.recordingDate) && lfs.price) {
        warnings.push('Used a newer sale than TitlePro\'s Latest Full Sale (' + lfs.price + ' on ' + lfs.recordingDate + ')');
      } else if (dateKey(best.recordingDate) === dateKey(lfs.recordingDate) && num(lfs.price) && num(lfs.price) !== best.price) {
        warnings.push('TitlePro\'s Latest Full Sale shows ' + lfs.price + ' for the same date, the history shows $' + best.price.toLocaleString());
      }
    } else {
      purchasePrice = money(lfs.price);
      purchaseDate = lfs.recordingDate || lfs.saleDate;
      saleDate = lfs.saleDate;
      saleType = 'Latest Full Sale block';
      saleArmsLength = null;
      saleSource = 'latest full sale block';
      if (!transfers.length) warnings.push('No transaction history found, used TitlePro\'s Latest Full Sale');
      else warnings.push('No arms-length sale of $' + MIN_SALE_PRICE.toLocaleString() + ' or more in the history, used TitlePro\'s Latest Full Sale');
      const lp = num(lfs.price);
      if (lp && lp < MIN_SALE_PRICE) warnings.push('Price is under $' + MIN_SALE_PRICE.toLocaleString() + ', may be a token amount');
    }

    if (!purchaseDate) warnings.push('No purchase date found, enter it by hand');

    const payload = {
      _source: 'titlepro247',
      _url: location.href,
      _scrapedAt: new Date().toISOString(),
      address: normalizeAddress(val('Property Address')),
      city, state, zip,
      county: titleCase(county),
      apn: val('Parcel Number'),
      propertyUseRaw: propertyUse,
      propertyType: mapPropertyType(propertyUse),
      bedrooms: val('Bedrooms'),
      bathrooms: (val('Bathrooms/Partial') || '').split('/')[0].trim(),
      buildingSqft: (val('Living Area (SF)') || '').replace(/[^\d.]/g, ''),
      lotSqft, lotAcres,
      units: val('Units'),
      yearBuilt,

      // Purchase = latest real sale, recording date drives Humperdink's Purchase Date.
      purchasePrice,
      purchaseDate,                       // MM/DD/YYYY
      purchaseDateISO: toISO(purchaseDate),
      saleDate,                           // contract/transfer date when available
      recordingDate: purchaseDate,        // kept for backward compatibility
      saleType,
      saleSource,
      saleArmsLength,
      saleWarnings: warnings,

      // For eyeballing in the console when a deal looks off.
      latestFullSale: lfs,
      saleCandidates: ranked.slice(0, 5).map(t => ({
        id: t.txnId, recorded: t.recordingDate, price: t.priceRaw,
        type: t.type, desc: t.desc, buyer: t.buyer,
      })),

      // Every recorded transfer, newest first, for the confirm window in
      // Humperdink. picked marks the one the rules above chose, if any.
      transfers: transfers
        .slice()
        .sort((a, b) => dateKey(b.recordingDate || b.transferDate) - dateKey(a.recordingDate || a.transferDate))
        .map(t => ({
          id: t.txnId,
          recorded: t.recordingDate,
          transferred: t.transferDate,
          price: t.price,
          type: t.type || t.desc || t.docType,
          buyer: t.buyer,
          seller: t.seller,
          multiApn: t.multiApn,
          skip: skipReason(t),
          picked: useBest && t === best,
        })),

      ownerNames: val('Primary Owner Name(s)'),
    };

    return payload;
  }

  function titleCase(s) {
    if (!s) return '';
    return s.toLowerCase().replace(/\b([a-z])/g, c => c.toUpperCase());
  }

  const DIR_MAP = {
    n:'N.', s:'S.', e:'E.', w:'W.',
    ne:'NE.', nw:'NW.', se:'SE.', sw:'SW.',
    north:'N.', south:'S.', east:'E.', west:'W.',
    northeast:'NE.', northwest:'NW.', southeast:'SE.', southwest:'SW.',
  };

  const SUFFIX_MAP = {
    st:'Street', str:'Street',
    ave:'Avenue', av:'Avenue',
    dr:'Drive', rd:'Road',
    blvd:'Boulevard', bl:'Boulevard', bv:'Boulevard',
    ln:'Lane', ct:'Court', pl:'Place',
    cir:'Circle', circ:'Circle',
    pkwy:'Parkway', hwy:'Highway',
    ter:'Terrace', terr:'Terrace',
    trl:'Trail', tr:'Trail',
    sq:'Square', aly:'Alley',
    xing:'Crossing',
    hts:'Heights', plz:'Plaza',
    cv:'Cove', bnd:'Bend',
    crk:'Creek', spg:'Spring', spgs:'Springs',
    way:'Way', loop:'Loop', row:'Row', run:'Run',
    walk:'Walk', pike:'Pike',
    expy:'Expressway', fwy:'Freeway',
    ctr:'Center', cmn:'Common',
    vw:'View', vis:'Vista',
    grv:'Grove', mdw:'Meadow', mdws:'Meadows',
    pt:'Point', pts:'Points',
    rdg:'Ridge', rdgs:'Ridges',
    cyn:'Canyon', mtn:'Mountain', mtns:'Mountains',
    knl:'Knoll', knls:'Knolls',
    lk:'Lake', lks:'Lakes',
    plns:'Plains', pln:'Plain',
    psge:'Passage',
    is:'Island', isle:'Isle',
    jct:'Junction', jcts:'Junctions',
    cswy:'Causeway',
  };

  function normalizeAddress(raw) {
    if (!raw) return '';
    const parts = titleCase(raw).trim().split(/\s+/);
    if (!parts.length) return '';
    const key = t => t.toLowerCase().replace(/[.,]+$/, '');

    const unitIdx = parts.findIndex(p => /^#/.test(p) || /^(apt|suite|ste|unit|bldg|fl|rm)\.?$/i.test(p));
    const main = unitIdx >= 0 ? parts.slice(0, unitIdx) : parts.slice();
    const unitRaw = unitIdx >= 0 ? parts.slice(unitIdx) : [];

    const unit = [];
    for (let i = 0; i < unitRaw.length; i++) {
      const tok = unitRaw[i];
      if (i === 0 && /^#/.test(tok)) {
        unit.push('Unit');
        const rest = tok.slice(1);
        if (rest) unit.push(rest);
        continue;
      }
      if (i === 0) {
        const k = tok.toLowerCase().replace(/[.,]+$/, '');
        if (k === 'ste' || k === 'suite') { unit.push('Suite'); continue; }
      }
      unit.push(tok);
    }

    let lead = 0;
    while (lead < main.length && /^\d/.test(main[lead])) lead++;

    if (lead < main.length) {
      const k = key(main[lead]);
      if (DIR_MAP[k]) main[lead] = DIR_MAP[k];
    }

    let tail = main.length - 1;
    if (tail > lead) {
      const k = key(main[tail]);
      if (DIR_MAP[k]) { main[tail] = DIR_MAP[k]; tail--; }
    }
    if (tail > lead) {
      const k = key(main[tail]);
      if (SUFFIX_MAP[k]) main[tail] = SUFFIX_MAP[k];
    }

    return [...main, ...unit].join(' ');
  }

  function mapPropertyType(use) {
    if (!use) return '';
    const u = use.toLowerCase();
    if (/single\s*family|sfr/.test(u)) return 'SFR';
    if (/duplex|two\s*famil/.test(u)) return 'Duplex';
    if (/triplex|three\s*famil/.test(u)) return 'Triplex';
    if (/quadruplex|fourplex|four\s*famil/.test(u)) return 'Quadruplex';
    if (/condominium|condo/.test(u)) return 'Condominium Unit';
    if (/apartment|5\+|multi.?family/.test(u)) return 'Apartment';
    if (/vacant|land/.test(u)) return 'Land';
    if (/mixed/.test(u)) return 'Mixed Use';
    if (/retail|store/.test(u)) return 'Retail';
    if (/office/.test(u)) return 'Office';
    if (/industrial|warehouse/.test(u)) return 'Industrial';
    if (/gas|auto/.test(u)) return 'Auto Related/Gas Station';
    if (/hospitality|hotel|motel/.test(u)) return 'Hospitality';
    return '';
  }

  // Purchase date first since it's the field most likely to need a second look.
  // Year built is left out on purpose.
  function sendMessage(payload) {
    const lines = [];
    const date = payload.purchaseDate ? 'Purchased ' + payload.purchaseDate : '';
    const price = payload.purchasePrice ? '$' + Number(payload.purchasePrice).toLocaleString() : '';
    if (date || price) lines.push([date, price].filter(Boolean).join(' for '));
    for (const w of payload.saleWarnings || []) lines.push('• ' + w);
    return 'Ready for HD Import:' + (lines.length ? '\n' + lines.join('\n') : '');
  }

  function sendScraped(btn, cells) {
    const payload = scrapeTitlePro(cells);
    // Land often has no street address, so an APN alone is enough to send.
    if (!payload.address && !payload.apn) { flash(btn, 'No data found', false); return false; }
    store(payload);
    const warn = payload.saleWarnings && payload.saleWarnings.length;
    flash(btn, sendMessage(payload), warn ? 'warn' : true, 10000);
    if (warn) console.warn('[lof] check before saving:', payload.saleWarnings, payload.saleCandidates);
    console.log('[lof] scraped', payload);
    return true;
  }

  const SINGLE_LABEL = '→ Send to Humperdink';
  const PANEL_ID = 'lofPropertyPicker';

  // Batch orders: one row per property. Clicking a row stores that property,
  // same as a single export, and ticks it so you can work down the list.
  function togglePicker(btn, props) {
    const open = document.getElementById(PANEL_ID);
    if (open) { open.remove(); return; }

    const panel = document.createElement('div');
    panel.id = PANEL_ID;
    Object.assign(panel.style, {
      position: 'fixed', right: '16px', zIndex: 2147483647,
      background: '#fff', border: '1px solid #c8d3df', borderRadius: '6px',
      boxShadow: '0 4px 16px rgba(0,0,0,.25)', padding: '10px', width: '340px',
      overflowY: 'auto', font: '13px/1.4 sans-serif', color: '#1a1a1a',
    });

    const head = document.createElement('div');
    head.textContent = props.length + ' properties, click one to send it';
    Object.assign(head.style, { fontWeight: '600', marginBottom: '8px' });
    panel.appendChild(head);

    for (const p of props) {
      const row = document.createElement('button');
      row.type = 'button';
      Object.assign(row.style, {
        display: 'block', width: '100%', textAlign: 'left', margin: '0 0 6px',
        padding: '8px 10px', border: '1px solid #c8d3df', borderRadius: '4px',
        background: p.sent ? '#e6f4ea' : '#f6f9fc', cursor: 'pointer', font: 'inherit', color: 'inherit',
      });
      const name = document.createElement('div');
      name.textContent = (p.sent ? '✓ ' : '') + propertyLabel(p);
      name.style.fontWeight = '600';
      row.appendChild(name);
      if (p.address && p.apn) {
        const sub = document.createElement('div');
        sub.textContent = 'APN ' + p.apn;
        Object.assign(sub.style, { fontSize: '12px', color: '#5a6570' });
        row.appendChild(sub);
      }
      row.addEventListener('click', () => {
        if (!sendScraped(btn, p.cells)) return;
        p.sent = true;
        name.textContent = '✓ ' + propertyLabel(p);
        row.style.background = '#e6f4ea';
      });
      panel.appendChild(row);
    }
    document.body.appendChild(panel);

    // Sit just above the button. The button grows upward while it shows a
    // send message or sale warnings, so follow its height or the panel hides them.
    const place = () => {
      const bottom = 16 + btn.offsetHeight + 8;
      panel.style.bottom = bottom + 'px';
      panel.style.maxHeight = 'calc(100vh - ' + (bottom + 16) + 'px)';
    };
    place();
    const ro = new ResizeObserver(() => {
      if (!panel.isConnected) { ro.disconnect(); return; }
      place();
    });
    ro.observe(btn);
  }

  // The resting label, updated without stomping on a flash in progress.
  function setRestingLabel(btn, text) {
    if (btn.dataset.lofLabel === text) return;
    btn.dataset.lofLabel = text;
    if (!btn._lofFlashing) btn.textContent = text;
  }

  // Always a fixed button in the bottom right. Anchoring into TitlePro's
  // .NonPrintArea was unreliable, the link landed at the top of the report
  // on some pages and the bottom on others.
  function initTitlePro() {
    if (document.getElementById('lofSendToHumperdink')) return;
    let props = [];
    const btn = mkButton(SINGLE_LABEL, function () {
      if (props.length > 1) { togglePicker(btn, props); return; }
      sendScraped(btn, null);
    });
    btn.id = 'lofSendToHumperdink';
    btn.dataset.lofLabel = SINGLE_LABEL;
    btn.dataset.lofBg = btn.style.background;

    // The report renders after the page loads, and the order view can switch
    // orders in place, so recount whenever the page settles.
    let pending = null;
    const recount = () => {
      const found = splitProperties();
      const sameSet = found.length === props.length && found.every((p, i) => p.apn === props[i].apn && p.address === props[i].address);
      if (sameSet) {
        found.forEach((p, i) => { p.sent = props[i].sent; });
      } else {
        const panel = document.getElementById(PANEL_ID);
        if (panel) panel.remove();
      }
      props = found;
      setRestingLabel(btn, props.length > 1 ? 'Multiple properties detected (' + props.length + ')\n→ Choose one to send' : SINGLE_LABEL);
    };
    new MutationObserver(muts => {
      // Ignore our own panel and button churn.
      if (muts.every(m => m.target.closest && m.target.closest('#' + PANEL_ID + ', #lofSendToHumperdink'))) return;
      clearTimeout(pending);
      pending = setTimeout(recount, 400);
    }).observe(document.body, { childList: true, subtree: true });
    recount();
  }

  // ------------------------- Humperdink side -------------------------

  function setInput(id, value) {
    if (value == null || value === '') return false;
    const el = document.getElementById(id);
    if (!el) return false;
    el.value = value;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.dispatchEvent(new Event('blur', { bubbles: true }));
    return true;
  }

  // Humperdink's jqx widgets live on the page's jQuery. With GM_* grants the
  // script runs sandboxed and window.jQuery is undefined, so go through
  // unsafeWindow or the date and combo fills silently do nothing.
  function pageJQuery() {
    const w = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;
    return typeof w.jQuery === 'function' ? w.jQuery : null;
  }

  function setJqxCombo(comboId, value) {
    if (!value) return false;
    try {
      const jq = pageJQuery();
      const $el = jq && jq('#' + comboId);
      if (!$el || !$el.length) { console.warn('[lof] combo not found', comboId); return false; }
      const items = $el.jqxComboBox('getItems') || [];
      const idx = items.findIndex(i => (i.label || '').toLowerCase() === value.toLowerCase());
      if (idx < 0) return false;
      $el.jqxComboBox('selectIndex', idx);
      return true;
    } catch (e) { console.warn('[lof] combo fail', comboId, e); return false; }
  }

  function setJqxDate(widgetId, mdY) {
    if (!mdY) return false;
    try {
      const jq = pageJQuery();
      const $el = jq && jq('#' + widgetId);
      if (!$el || !$el.length) { console.warn('[lof] date widget not found', widgetId); return false; }
      const parts = mdY.split('/');
      if (parts.length !== 3) return false;
      // Build the Date in the page's realm so jqx's instanceof Date check passes.
      const PageDate = (typeof unsafeWindow !== 'undefined' ? unsafeWindow : window).Date;
      const d = new PageDate(+parts[2], +parts[0] - 1, +parts[1]);
      if (isNaN(d)) return false;
      $el.jqxDateTimeInput('setDate', d);
      return true;
    } catch (e) { console.warn('[lof] date fail', widgetId, e); return false; }
  }

  function modalIsOpen() {
    const wins = document.querySelectorAll('.jqx-window');
    for (const w of wins) {
      if (w.offsetParent !== null && w.textContent.includes('New Property')) return w;
    }
    return null;
  }

  function fillHumperdink(p, btn) {
    const modal = modalIsOpen();
    if (!modal) { console.warn('[lof] New Property window not open'); flash(btn, 'Import Failed', false, 10000); return; }

    const wrote = [];
    if (setInput('txtAddress1', p.address)) wrote.push('address');
    if (setInput('txtCity', p.city)) wrote.push('city');
    if (setInput('txtState', p.state)) wrote.push('state');
    if (setInput('txtZip', p.zip)) wrote.push('zip');
    if (setInput('txtCounty', p.county)) wrote.push('county');
    if (setInput('txtPropertyAPN', p.apn)) wrote.push('apn');
    if (setInput('txtBuildingSize', p.buildingSqft)) wrote.push('bldgSqft');
    if (setInput('txtLotSize', p.lotSqft)) wrote.push('lotSqft');
    // Payloads from 0.6.0 on carry the transfer list, and price and date wait
    // for the confirm window. Older stored payloads fill them directly.
    const confirmSale = Array.isArray(p.transfers);
    if (!confirmSale && setInput('txtPurchasePrice', p.purchasePrice)) wrote.push('purchPrice');
    // Note: the id is txtYearBuild, no trailing "t".
    if (setInput('txtYearBuild', p.yearBuilt)) wrote.push('yearBuilt');
    // The New Property modal has no Bedrooms / Bathrooms / Units field.
    // Those stay in the payload (p.bedrooms, p.bathrooms, p.units) but are not written.
    if (setJqxCombo('propertyTypecombobox', p.propertyType)) wrote.push('propType');
    if (setJqxCombo('lotSizecombobox', 'sqft')) wrote.push('lotUnit');
    if (!confirmSale && setJqxDate('datetimeinputPurchaseDate', p.purchaseDate)) wrote.push('purchDate');

    const warn = p.saleWarnings && p.saleWarnings.length;
    if (warn) console.warn('[lof] verify sale figures:', p.saleWarnings, p.saleCandidates);
    // Address stands in for "the fill worked", or the APN for land with no address.
    const ok = wrote.includes('address') || (!p.address && wrote.includes('apn'));
    console.log('[lof] wrote', wrote, 'payload:', p);
    if (!ok) { flash(btn, 'Import Failed', false, 10000); return; }
    if (!confirmSale) { flash(btn, 'Imported Successfully', true, 10000); return; }

    openSaleConfirm(p, sale => {
      if (!sale) { flash(btn, 'Imported, purchase left blank', 'warn', 10000); return; }
      const priceOk = !sale.price || setInput('txtPurchasePrice', sale.price);
      const dateOk = !sale.date || setJqxDate('datetimeinputPurchaseDate', sale.date);
      const done = priceOk && dateOk;
      flash(btn, done ? 'Imported Successfully' : 'Purchase price or date didn\'t fill', done || 'warn', 10000);
    });
  }

  // ---- purchase confirm window ----

  const CONFIRM_ID = 'lofSaleConfirm';

  function h(tag, style, text) {
    const el = document.createElement(tag);
    if (style) Object.assign(el.style, style);
    if (text != null) el.textContent = text;
    return el;
  }

  const fmtMoney = n => (n ? '$' + Number(n).toLocaleString() : '');

  // Lists every transfer on the report, newest first, with the rules' pick
  // preselected. Picking a row loads its price and date into editable boxes,
  // so a row with no price (or the wrong one) can still be the purchase.
  // done(sale) gets {price, date} to write, or null to leave both blank.
  function openSaleConfirm(p, done) {
    const old = document.getElementById(CONFIRM_ID);
    if (old) old.remove();

    const rows = p.transfers.map((t, i) => ({ key: 't' + i, t, price: t.price, date: t.recorded || t.transferred }));
    const lfs = p.latestFullSale || {};
    const lfsPrice = num(lfs.price);
    const lfsDate = lfs.recordingDate || lfs.saleDate || '';
    if (lfsPrice || lfsDate) {
      rows.push({
        key: 'lfs', price: lfsPrice, date: lfsDate,
        t: { recorded: lfsDate, price: lfsPrice, type: 'TitlePro Latest Full Sale summary', buyer: '', seller: '', skip: '' },
      });
    }
    // An acquisition has a contract price but nothing recorded yet, so this
    // row clears both boxes for typing the price in by hand.
    rows.unshift({
      key: 'new', price: 0, date: '',
      t: { recorded: '', price: 0, type: 'New acquisition, no recorded sale yet', buyer: '', seller: '', skip: '' },
    });
    let picked = rows.find(r => r.t.picked);
    if (!picked && p.saleSource === 'latest full sale block') picked = rows.find(r => r.key === 'lfs');

    const overlay = h('div', {
      position: 'fixed', inset: '0', zIndex: 2147483647, background: 'rgba(0,0,0,.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
      font: '13px/1.4 sans-serif', color: '#1a1a1a',
    });
    overlay.id = CONFIRM_ID;
    const panel = h('div', {
      background: '#fff', borderRadius: '8px', boxShadow: '0 8px 32px rgba(0,0,0,.35)',
      width: 'min(920px, 100%)', maxHeight: 'calc(100vh - 32px)', display: 'flex', flexDirection: 'column',
    });
    overlay.appendChild(panel);

    const head = h('div', { padding: '14px 16px 8px' });
    head.appendChild(h('div', { fontSize: '16px', fontWeight: '600' }, 'Confirm the purchase'));
    const where = [p.address, p.city].filter(Boolean).join(', ') || (p.apn ? 'APN ' + p.apn : '');
    if (where) head.appendChild(h('div', { color: '#5a6570' }, where));
    head.appendChild(h('div', { color: '#5a6570', marginTop: '4px' },
      'Every transfer on the TitlePro report, newest first. Pick the purchase, then adjust the price or date if needed.'));
    panel.appendChild(head);

    if (p.saleWarnings && p.saleWarnings.length) {
      const w = h('ul', { margin: '0 16px 8px', padding: '8px 8px 8px 26px', background: '#fff4e0', border: '1px solid #e8c27a', borderRadius: '4px' });
      for (const msg of p.saleWarnings) w.appendChild(h('li', null, msg));
      panel.appendChild(w);
    }

    const wrap = h('div', { overflow: 'auto', margin: '0 16px', border: '1px solid #c8d3df', borderRadius: '4px', flex: '1 1 auto' });
    const table = h('table', { borderCollapse: 'collapse', width: '100%' });
    const thead = h('tr', { background: '#f0f4f8', textAlign: 'left' });
    for (const c of ['', 'Recorded', 'Price', 'Type', 'Buyer', 'Seller', 'Note']) {
      thead.appendChild(h('th', { padding: '6px 8px', fontWeight: '600', whiteSpace: 'nowrap', position: 'sticky', top: '0', background: '#f0f4f8' }, c));
    }
    table.appendChild(thead);

    const priceIn = h('input', { width: '140px', padding: '5px 6px', font: 'inherit' });
    const dateIn = h('input', { width: '110px', padding: '5px 6px', font: 'inherit' });
    dateIn.placeholder = 'MM/DD/YYYY';

    const radios = [];
    const select = r => {
      picked = r;
      for (const x of radios) {
        x.input.checked = x.r === r;
        x.tr.style.background = x.r === r ? '#e3eefb' : '';
      }
      priceIn.value = r.price ? Number(r.price).toLocaleString() : '';
      dateIn.value = r.date || '';
      if (r.key === 'new') priceIn.focus();
    };

    for (const r of rows) {
      const t = r.t;
      const muted = !!t.skip;
      const tr = h('tr', { borderTop: '1px solid #e3e8ee', cursor: 'pointer', color: muted ? '#7a848e' : '' });
      const input = h('input');
      input.type = 'radio';
      input.name = 'lofSalePick';
      const td0 = h('td', { padding: '6px 8px' });
      td0.appendChild(input);
      tr.appendChild(td0);
      const note = [t.skip, t.multiApn ? 'Deed covers more than one parcel' : '', r === picked ? 'Suggested' : '']
        .filter(Boolean).join(', ');
      for (const v of [t.recorded || (t.transferred ? t.transferred + ' (transfer)' : ''), fmtMoney(t.price), t.type, t.buyer, t.seller, note]) {
        tr.appendChild(h('td', { padding: '6px 8px', verticalAlign: 'top' }, v || ''));
      }
      tr.addEventListener('click', () => select(r));
      radios.push({ r, input, tr });
      table.appendChild(tr);
    }
    wrap.appendChild(table);
    panel.appendChild(wrap);

    const foot = h('div', { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px', padding: '12px 16px' });
    const lab = (text, input) => {
      const l = h('label', { display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600' }, text);
      l.appendChild(input);
      return l;
    };
    foot.appendChild(lab('Purchase price $', priceIn));
    foot.appendChild(lab('Purchase date', dateIn));
    const err = h('span', { color: '#b3261e' });
    foot.appendChild(err);
    foot.appendChild(h('span', { flex: '1 1 auto' }));
    const btnStyle = { border: 'none', borderRadius: '4px', padding: '8px 14px', font: 'inherit', fontWeight: '600', cursor: 'pointer' };
    const skipBtn = h('button', Object.assign({ background: '#e3e8ee', color: '#1a1a1a' }, btnStyle), 'Leave blank');
    const useBtn = h('button', Object.assign({ background: '#0b66c3', color: '#fff' }, btnStyle), 'Use this purchase');
    skipBtn.type = useBtn.type = 'button';
    foot.appendChild(skipBtn);
    foot.appendChild(useBtn);
    panel.appendChild(foot);

    const close = sale => { overlay.remove(); done(sale); };
    const confirm = () => {
      const price = money(priceIn.value);
      const date = dateIn.value.trim();
      if (price && !(num(price) > 0)) { err.textContent = 'Price isn\'t a number'; return; }
      if (date && !isMDY(date)) { err.textContent = 'Date must be MM/DD/YYYY'; return; }
      if (!price && !date) { close(null); return; }
      close({ price, date });
    };
    skipBtn.addEventListener('click', () => close(null));
    useBtn.addEventListener('click', confirm);
    // Keep keys inside the window so Humperdink's modal doesn't act on them.
    overlay.addEventListener('keydown', e => {
      e.stopPropagation();
      if (e.key === 'Escape') close(null);
      else if (e.key === 'Enter') { e.preventDefault(); confirm(); }
    });

    document.body.appendChild(overlay);
    if (picked) select(picked);
    else { priceIn.value = p.purchasePrice ? Number(p.purchasePrice).toLocaleString() : ''; dateIn.value = p.purchaseDate || ''; }
    if (document.activeElement !== priceIn) useBtn.focus();
  }

  const PASTE_BTN_ID = 'lofPasteFromTitlePro';

  function findCreateButton(modal) {
    // The modal has a green "Create" button in its footer. Match by visible text.
    const buttons = modal.querySelectorAll('button, input[type="button"], input[type="submit"]');
    for (const b of buttons) {
      const t = (b.value || b.textContent || '').trim();
      if (/^create$/i.test(t)) return b;
    }
    return null;
  }

  function buildPasteButton() {
    const btn = document.createElement('button');
    btn.id = PASTE_BTN_ID;
    btn.type = 'button';
    btn.textContent = '← Paste from TitlePro';
    btn.style.cssText = [
      'background:#0b66c3', 'color:#fff', 'border:none', 'border-radius:4px',
      'padding:8px 14px', 'font-size:13px', 'font-weight:600',
      'cursor:pointer', 'margin-right:8px', 'vertical-align:middle',
    ].join(';');
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      const p = load();
      if (!p) { console.warn('[lof] no payload stored, send from TitlePro first'); flash(btn, 'Import Failed', false, 10000); return; }
      fillHumperdink(p, btn);
    });
    btn.addEventListener('contextmenu', function (e) {
      e.preventDefault();
      const p = load();
      console.log('[lof] current payload:', p);
      flash(btn, p ? 'Payload logged to console' : 'No payload stored', !!p);
    });
    return btn;
  }

  function injectPasteButton() {
    if (document.getElementById(PASTE_BTN_ID)) return true;
    const modal = modalIsOpen();
    if (!modal) return false;
    const createBtn = findCreateButton(modal);
    if (createBtn && createBtn.parentElement) {
      createBtn.parentElement.insertBefore(buildPasteButton(), createBtn);
      return true;
    }
    // Fallback: append to the modal so it at least appears with the modal.
    modal.appendChild(buildPasteButton());
    return true;
  }

  function removePasteButton() {
    const el = document.getElementById(PASTE_BTN_ID);
    if (el) el.remove();
  }

  function initHumperdink() {
    const sync = () => { modalIsOpen() ? injectPasteButton() : removePasteButton(); };
    const obs = new MutationObserver(sync);
    obs.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class'] });
    sync();
  }

  // ------------------------- bootstrap -------------------------

  const host = location.hostname;
  // Humperdink prod, plus its QA and preprod copies.
  const HUMPERDINK_HOSTS = ['humperdink.loneoakfund.com', 'loneo-qa-lmsapp.6technology.com', 'beta-lmsapp.loneoakfund.com'];
  if (host.endsWith('titlepro247.com')) {
    initTitlePro();
  } else if (HUMPERDINK_HOSTS.includes(host)) {
    initHumperdink();
  }
})();
