// ==UserScript==
// @name         TitlePro247 → Humperdink Property Autofill
// @namespace    loneoakfund
// @version      0.4.2
// @description  Scrape property report on TitlePro247 and autofill the New Property modal in Humperdink.
// @match        https://www.titlepro247.com/Orders/Home/Html/*
// @match        https://humperdink.loneoakfund.com/Loans/Details/*
// @match        https://www.titlepro247.com/v2/ViewOrder/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_setClipboard
// @run-at       document-idle
// @downloadURL  https://loftools.thepopcorn.party/userscripts/titlepro-to-humperdink.user.js
// @updateURL    https://loftools.thepopcorn.party/userscripts/titlepro-to-humperdink.user.js
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
    btn.textContent = msg;
    btn.style.background = ok === 'warn' ? '#a8690c' : (ok ? '#1f8a3b' : '#b3261e');
    btn._lofTimer = setTimeout(() => {
      btn.textContent = btn.dataset.lofLabel;
      btn.style.background = btn.dataset.lofBg;
    }, ms);
  }

  // ------------------------- TitlePro247 side -------------------------

  const txt = el => (el && el.textContent || '').replace(/\s+/g, ' ').trim();

  // All td/th on the page, in document order.
  function allCells() {
    return Array.from(document.querySelectorAll('td, th'));
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
  const NON_ARMS_DESC = /intra.?family|dissolution|gift|quit.?claim|trustee|foreclos|sheriff|tax\s*deed|nominal|correct|re.?record|affidavit|easement/i;

  function transferRecords(recs) {
    return recs
      .filter(g => ('Type of Transaction' in g) || /deed|transfer|grant/i.test(g['Document Type'] || ''))
      .map(g => {
        const type = (g['Type of Transaction'] || '').trim();
        const desc = (g['Document Description'] || '').trim();
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
          armsLength: /arms.?length/i.test(type) && !/non/i.test(type),
          nonArms: /non\s*.?arms/i.test(type) || NON_ARMS_DESC.test(desc),
        };
      });
  }

  // Latest real purchase: most recent priced transfer that is not flagged
  // non arms-length and is not a partial interest. Explicit "Arms-Length
  // Transfer" wins a tie on the same recording date; "Per Assessor" rows
  // (assessor-reported sale price, no recorded deed detail) still qualify,
  // since that is often the only place the true price shows up.
  function pickLatestSale(transfers) {
    return transfers
      .filter(t => t.price > 0 && isMDY(t.recordingDate) && !t.nonArms && !/^y/i.test(t.partialInterest))
      .sort((a, b) =>
        dateKey(b.recordingDate) - dateKey(a.recordingDate) ||
        (b.armsLength - a.armsLength) ||
        (b.price - a.price) ||
        ((+a.txnId || 0) - (+b.txnId || 0))
      );
  }

  function scrapeTitlePro() {
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
      }
    } else {
      purchasePrice = money(lfs.price);
      purchaseDate = lfs.recordingDate || lfs.saleDate;
      saleDate = lfs.saleDate;
      saleType = 'Latest Full Sale block';
      saleArmsLength = null;
      saleSource = 'latest full sale block';
      if (!transfers.length) warnings.push('No transaction history found, used TitlePro\'s Latest Full Sale');
      else warnings.push('No priced arms-length sale in the history, used TitlePro\'s Latest Full Sale');
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

  // Always a fixed button in the bottom right. Anchoring into TitlePro's
  // .NonPrintArea was unreliable, the link landed at the top of the report
  // on some pages and the bottom on others.
  function initTitlePro() {
    if (document.getElementById('lofSendToHumperdink')) return;
    const btn = mkButton('→ Send to Humperdink', function () {
      const payload = scrapeTitlePro();
      if (!payload.address) { flash(btn, 'No data found', false); return; }
      store(payload);
      const warn = payload.saleWarnings && payload.saleWarnings.length;
      flash(btn, sendMessage(payload), warn ? 'warn' : true, 10000);
      if (warn) console.warn('[lof] check before saving:', payload.saleWarnings, payload.saleCandidates);
      console.log('[lof] scraped', payload);
    });
    btn.id = 'lofSendToHumperdink';
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

  function setJqxCombo(comboId, value) {
    if (!value) return false;
    try {
      const $el = window.jQuery && window.jQuery('#' + comboId);
      if (!$el || !$el.length) return false;
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
      const $el = window.jQuery && window.jQuery('#' + widgetId);
      if (!$el || !$el.length) return false;
      const parts = mdY.split('/');
      if (parts.length !== 3) return false;
      const d = new Date(+parts[2], +parts[0] - 1, +parts[1]);
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
    if (setInput('txtPurchasePrice', p.purchasePrice)) wrote.push('purchPrice');
    // Note: the id is txtYearBuild, no trailing "t".
    if (setInput('txtYearBuild', p.yearBuilt)) wrote.push('yearBuilt');
    // The New Property modal has no Bedrooms / Bathrooms / Units field.
    // Those stay in the payload (p.bedrooms, p.bathrooms, p.units) but are not written.
    if (setJqxCombo('propertyTypecombobox', p.propertyType)) wrote.push('propType');
    if (setJqxCombo('lotSizecombobox', 'sqft')) wrote.push('lotUnit');
    if (setJqxDate('datetimeinputPurchaseDate', p.purchaseDate)) wrote.push('purchDate');

    const warn = p.saleWarnings && p.saleWarnings.length;
    if (warn) console.warn('[lof] verify sale figures:', p.saleWarnings, p.saleCandidates);
    // Address is the one field every report has, so it stands in for "the fill worked".
    const ok = wrote.includes('address');
    flash(btn, ok ? 'Imported Successfully' : 'Import Failed', ok, 10000);
    console.log('[lof] wrote', wrote, 'payload:', p);
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
  if (host.endsWith('titlepro247.com')) {
    initTitlePro();
  } else if (host.endsWith('humperdink.loneoakfund.com')) {
    initHumperdink();
  }
})();
