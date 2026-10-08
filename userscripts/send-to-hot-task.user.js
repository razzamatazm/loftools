// ==UserScript==
// @name         Send to Hot Task
// @namespace    https://github.com/razzamatazm/operation-hot-task
// @version      2.0.0
// @description  Copy a Humperdink loan to the clipboard, then open Hot Task in Teams desktop on a new LOI Check.
// @author       Operation Hot Task
// @match        https://humperdink.loneoakfund.com/Loans/Details/*
// @run-at       document-idle
// @grant        none
// @downloadURL  https://loftools.thepopcorn.party/userscripts/send-to-hot-task.user.js
// @updateURL    https://loftools.thepopcorn.party/userscripts/send-to-hot-task.user.js
// ==/UserScript==

/* See README.md beside this file for install instructions. This file is the
   source of truth; loftools serves a copy of it, and Tampermonkey updates from
   that copy, so raise @version with every change or nobody receives it.

   The payload shape is the contract in packages/shared/src/humperdink.ts —
   `HumperdinkPayload` there, `parseHumperdinkPayload` reads what this writes.
   The constants below are duplicated deliberately: a userscript is a classic
   script pasted into Tampermonkey, so it cannot import from the workspace.
   `scripts/humperdink-import-sim-test.mjs` runs THIS FILE against that parser,
   so the copy can't drift without a test going red.

   ## What travels, and why it is so little (2.0.0)

   The loan name, the link, and the street address of every property on the
   loan. Nothing else: no loan terms, no borrower, no broker.

   It used to carry the terms (#196) and the contacts (#197), and that is
   exactly why it stopped. A note that arrives with the rate, the points and
   the fee already written in reads as though somebody had checked them, and
   somebody checking them is the entire job of an LOI check. Pre-filled figures
   invite a glance where the desk needs a cross-check, so the import now hands
   the checker the loan and the addresses and leaves the rest to be entered by
   hand: the terms copied from the loan committee approval email thread, cross
   referenced against the property profile document, and the borrower and
   broker names typed in.

   None of those three live in Humperdink, which is the other half of the
   reason this stopped scraping them — the loan page was never the source of
   record for the figures an LOI check is checking. The link still rides on the
   task, one click from the note, for everything else.

   The payload version stays at 2. Every field dropped here is optional on the
   wire and the parser skips what isn't there, so a Hot Task that reads v2
   reads this. Hot Task still parses and renders terms and contacts, which is
   what keeps a desk still running 1.10.1 working through the rollout.

   The loan name comes off the page title and the link off the address bar,
   both of which survive Humperdink reshuffling its markup.

   The properties are not in the page's HTML at all — Humperdink fetches them
   after render — so the control waits for them and reads `Loading…` until they
   arrive. */

(function () {
  "use strict";

  /* Contract — keep in sync with packages/shared/src/humperdink.ts. */
  var PAYLOAD_KIND = "hot-task-humperdink";
  var PAYLOAD_VERSION = 2;
  var TITLE_SUFFIX = " - details";
  var LOAN_DETAILS_PATH = /^\/Loans\/Details\/[^/]+\/?$/i;

  var BUTTON_ID = "hot-task-send-control";
  var IDLE_LABEL = "Export to HT";
  var LOADING_LABEL = "Loading…";
  var MESSAGE_MS = 6000;
  /* How often to check whether Humperdink's properties grid has painted, and
     how long to keep checking before giving up and letting the press report it
     (#197). */
  var POLL_MS = 250;
  var LOAD_CEILING_MS = 20000;

  /* The control lives in the Loan Terms panel header, immediately after the LOI
     button, whose jqx classes it clones so it is indistinguishable from
     Humperdink's own controls. Anchoring to a page element does mean a
     Humperdink reshuffle could take it away, and a missing button is a silent
     failure, so the anchor is watched rather than assumed: if the header has
     not appeared within ANCHOR_CEILING_MS the old floating button is mounted
     instead, and if Humperdink repaints the header later the control is put
     back. */
  var ANCHOR_ID = "btnLOIFile";
  var INLINE_LABEL = "Export to HT";
  /* Font Awesome 4, the version Humperdink ships. Alternatives that read the
     same way: fa-sign-out, fa-external-link, fa-upload, fa-clipboard. */
  var ICON_CLASS = "fa-share-square-o";
  var TOAST_ID = "hot-task-send-message";
  var ANCHOR_CEILING_MS = 8000;

  /* Humperdink titles the page `<LoanName> - Details`. The name is written into
     the page by its own JavaScript after load and has no stable element of its
     own, so the title is the reliable source. */
  function loanNameFromTitle(title) {
    var text = String(title == null ? "" : title).trim();
    if (text.toLowerCase().slice(-TITLE_SUFFIX.length) !== TITLE_SUFFIX) return "";
    return text.slice(0, text.length - TITLE_SUFFIX.length).trim();
  }

  /* Origin + path only, or "" when this isn't a loan details page. Humperdink's
     details URLs are path-only in practice, and dropping any query/hash keeps
     the link stable as the canonical key for a Loan on the Hot Task side
     (ADR-0001) — otherwise a visit that happened to carry a tracking param
     would mint a second loan. The same three gates the Hot Task parser applies
     (parses, http(s), whole path is a details path). */
  function loanUrlFrom(location) {
    try {
      var url = new URL(String(location && location.href ? location.href : ""));
      if (url.protocol !== "https:" && url.protocol !== "http:") return "";
      if (!LOAN_DETAILS_PATH.test(url.pathname)) return "";
      return url.origin + url.pathname;
    } catch (err) {
      return "";
    }
  }

  /* ── The properties grid (#197) ───────────────────────────

     Unlike the loan name and the link, the properties are not in the page's
     server HTML at all: Humperdink fetches them after the page renders and
     paints them into a jqxGrid. So the control cannot simply read them on
     click — it waits for them (see `watchForLoad` below) and only then offers
     to copy.

     The grid is two aligned tables: a header row of `[role=columnheader]`
     cells, and a body of `[role=row]`s whose `[role=gridcell]`s sit in the
     same column order. The address is found by matching the HEADER TEXT and
     then reading the cell at that index. Nothing here counts columns from a
     fixed position: Humperdink's row ids are literally positional
     (`row0PropertiesGrid`), so a scrape built on them points at the wrong row
     the first time somebody adds a property. */

  var PROPERTIES_GRID = {
    what: "the loan's properties",
    columnsId: "columntablePropertiesGrid",
    rowsId: "contenttablePropertiesGrid"
  };

  function normalise(text) {
    return String(text == null ? "" : text).replace(/\s+/g, " ").trim();
  }

  function elementText(el) {
    return el ? normalise(el.textContent) : "";
  }

  /* Humperdink packs a property's whole address into one cell, `<br/>`-split
     into street / city-state-zip / county. #197 wants the street line only. */
  /* Markup's text: tags dropped, and the few entities an address carries
     (`&amp;` above all) turned back into characters. */
  function markupText(markup) {
    return String(markup == null ? "" : markup)
      .replace(/<[^>]*>/g, "")
      .replace(/&(#x?[0-9a-f]+|amp|lt|gt|quot|apos|nbsp);/gi, function (whole, name) {
        var lower = name.toLowerCase();
        if (lower.charAt(0) !== "#") {
          return { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " }[lower];
        }
        var code = lower.charAt(1) === "x" ? parseInt(lower.slice(2), 16) : parseInt(lower.slice(1), 10);
        return isNaN(code) ? whole : String.fromCharCode(code);
      });
  }

  function streetFromMarkup(markup) {
    var head = String(markup == null ? "" : markup).split(/<br\s*\/?>/i)[0];
    return normalise(markupText(head)).replace(/,+$/, "");
  }

  /* The city: the address cell's second line, up to its first comma. */
  function cityFromMarkup(markup) {
    var lines = String(markup == null ? "" : markup).split(/<br\s*\/?>/i);
    return lines.length > 1 ? normalise(markupText(lines[1]).split(",")[0]) : "";
  }

  function streetAddress(cell) {
    if (!cell) return "";
    var markup = cell.innerHTML == null ? "" : String(cell.innerHTML);
    return markup ? streetFromMarkup(markup) : elementText(cell).replace(/,+$/, "");
  }

  function gridRows(doc, grid) {
    var body = doc.getElementById(grid.rowsId);
    if (!body) return null;
    return body.querySelectorAll('[role="row"]');
  }

  /* The index of the column with this header, or -1. */
  function columnIndex(doc, grid, header) {
    var head = doc.getElementById(grid.columnsId);
    if (!head) return -1;
    var columns = head.querySelectorAll('[role="columnheader"]');
    var wanted = normalise(header).toLowerCase();
    for (var i = 0; i < columns.length; i += 1) {
      if (elementText(columns[i]).toLowerCase() === wanted) return i;
    }
    return -1;
  }

  /* The properties grid has painted at least one row.

     An empty grid and a missing one are both "not here yet" while the control
     is waiting, because from in here they look the same: Humperdink builds the
     widget and fills it as its background request lands, and there is no
     positive "loaded, and there are none" signal to read. The wait has a
     ceiling (`LOAD_CEILING_MS`), and past it the press reports whichever of the
     two it actually is — see `readGrid`. */
  function gridSettled(doc) {
    var rows = gridRows(doc, PROPERTIES_GRID);
    return !!(rows && rows.length > 0);
  }

  /* Read a grid, or say what about it couldn't be read.

     Three separate failures, all reported rather than skipped: the grid's
     element is gone, the grid never loaded, or a column this scrape needs isn't
     in its header row. All three mean the note would have a hole in it. */
  function readGrid(doc, grid, headers) {
    var rows = gridRows(doc, grid);
    if (!rows) return { ok: false, error: grid.what + " (this page has no " + grid.rowsId + ")" };
    if (rows.length === 0) return { ok: false, error: grid.what + " (they hadn't finished loading)" };
    var indexes = {};
    var missingColumns = [];
    for (var key in headers) {
      if (!Object.prototype.hasOwnProperty.call(headers, key)) continue;
      var at = columnIndex(doc, grid, headers[key]);
      if (at < 0) missingColumns.push(headers[key]);
      else indexes[key] = at;
    }
    if (missingColumns.length > 0) {
      return { ok: false, error: grid.what + " (no " + missingColumns.join(" or ") + " column)" };
    }
    var read = [];
    for (var i = 0; i < rows.length; i += 1) {
      read.push(rows[i].querySelectorAll('[role="gridcell"]'));
    }
    return { ok: true, rows: read, at: indexes };
  }

  /* Every property on the loan, street and city.

     Address only, by design: the transaction type, the purchase price and the
     release price all travelled until 2.0.0 and all stopped for the same reason
     the terms did. The address is what tells the checker which properties to go
     and look at; the figures are what they are there to read for themselves. */
  function collectProperties(doc) {
    var grid = readGrid(doc, PROPERTIES_GRID, { address: "Address" });
    if (!grid.ok) return grid;
    var properties = [];
    for (var i = 0; i < grid.rows.length; i += 1) {
      var cell = grid.rows[i][grid.at.address];
      var address = streetAddress(cell);
      if (!address) continue;
      var property = { address: address };
      var city = cell && cell.innerHTML ? cityFromMarkup(cell.innerHTML) : "";
      if (city) property.city = city;
      properties.push(property);
    }
    return { ok: true, properties: properties };
  }

  /* Build the payload, or say what's missing. Never returns a partial payload:
     a half-filled create form is worse than no import, because the filer has no
     way to tell which half is wrong. */
  function collect(doc, location) {
    var missing = [];
    var loanName = loanNameFromTitle(doc.title);
    if (!loanName) missing.push('the loan name (the page title should read "<loan> - Details")');
    var loanUrl = loanUrlFrom(location);
    if (!loanUrl) missing.push("the loan details URL");
    var properties = collectProperties(doc);
    if (!properties.ok) missing.push(properties.error);
    if (missing.length > 0) {
      return { ok: false, error: "Couldn't read " + missing.join(" or ") + "." };
    }
    return {
      ok: true,
      payload: {
        kind: PAYLOAD_KIND,
        version: PAYLOAD_VERSION,
        loanName: loanName,
        loanUrl: loanUrl,
        properties: properties.properties
      }
    };
  }

  /* Async clipboard first; `document.execCommand` when it isn't there or is
     refused. Humperdink runs in whatever browser the desk has, and a copy that
     silently no-ops would look identical to a successful one. */
  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      var scratch = document.createElement("textarea");
      scratch.value = text;
      scratch.setAttribute("readonly", "");
      scratch.style.position = "fixed";
      scratch.style.left = "-9999px";
      document.body.appendChild(scratch);
      scratch.select();
      var copied = false;
      try {
        copied = document.execCommand("copy");
      } catch (err) {
        copied = false;
      }
      document.body.removeChild(scratch);
      if (copied) resolve();
      else reject(new Error("copy refused"));
    });
  }

  /* ── Opening Hot Task (#414) ────────────────────────────────

     The loan travels on the clipboard, and only there. Once the copy lands, the
     control opens Hot Task in Teams desktop on a new LOI Check, which fills
     itself from that clipboard where Teams can read it (#415), or waits in its
     paste box for ⌘V (#409). The link that does it carries no loan data at all:
     Teams writes every deep link it receives into its local log.

     So this script does need to know where Hot Task lives, which is one Teams
     app. There is exactly one Hot Task install, and HOT_TASK_APP_ID is the `id`
     in its manifest (teams-app/operation-hot-task-teams/manifest.json). A new
     install means a new id here. The sentinel and entity id are copies of
     HUMPERDINK_ARRIVAL_ID and HOT_TASK_ENTITY_ID in
     packages/shared/src/deep-link.ts, and the link is `humperdinkArrivalLink`
     there, written out by hand because a userscript can't import it.
     `scripts/humperdink-import-sim-test.mjs` goes red if any of the three drift.

     `msteams:`, never Teams' https web link: that form detours through
     Microsoft's "Join conversation" launcher page, and the team uses
     Teams desktop only. It's a navigation rather than a new tab, since Chrome
     hands the protocol to Teams and the loan page stays where it is.

     Every press gets its own link: the sentinel plus a press tag, the time in
     base 36 and then a count of presses on this page. Teams desktop ignores a
     link identical to the page it is already showing, so the same link twice
     left Hot Task on screen and opened nothing. The count is what keeps two
     presses whose copies land in the same millisecond apart; the time keeps
     presses from different page loads apart. The time is always 8 characters
     in base 36 until the year 2059, so the two parts can't run together into
     another press's tag. */
  var HOT_TASK_APP_ID = "bca6db0b-b2b7-423f-8c22-f4348f3a0340";
  var HOT_TASK_ENTITY_ID = "loan-tasks-home";
  var HUMPERDINK_ARRIVAL_ID = "new:humperdink";
  var pressCount = 0;

  function arrivalLink() {
    pressCount += 1;
    var subEntityId = HUMPERDINK_ARRIVAL_ID + ":" + Date.now().toString(36) + pressCount.toString(36);
    return (
      "msteams:/l/entity/" +
      HOT_TASK_APP_ID +
      "/" +
      HOT_TASK_ENTITY_ID +
      "?context=" +
      encodeURIComponent(JSON.stringify({ subEntityId: subEntityId }))
    );
  }

  var COPIED_MESSAGE = "Copied. Opening Hot Task in Teams…";

  /* ── The control ────────────────────────────────────────────

     Humperdink's panel-header buttons are divs carrying jqx classes rather than
     <button>s. The control is a copy of the LOI button itself, icon and name
     swapped, so it sits on the bar exactly where Humperdink's own buttons do and
     a Humperdink restyle carries over on its own. It used to be built by hand
     with tuned margins, which sat a pixel or two off the rest of the bar. If the
     LOI button is ever a shape the swap doesn't recognise (no Font Awesome icon,
     or no name), the hand-built control is the fallback. */
  function createInlineControl(anchor) {
    var el = copyOfButton(anchor) || buildInlineControl(anchor);
    el.id = BUTTON_ID;
    el.setAttribute("role", "button");
    el.style.cursor = "pointer";
    /* jqx paints hover through a class rather than through CSS, so drive it by
       hand or the control is the one dead-looking thing in the bar. */
    el.addEventListener("mouseenter", function () {
      el.classList.add("jqx-fill-state-hover", "jqx-fill-state-hover-Lending");
    });
    el.addEventListener("mouseleave", function () {
      el.classList.remove("jqx-fill-state-hover", "jqx-fill-state-hover-Lending");
    });
    return el;
  }

  function copyOfButton(anchor) {
    if (typeof anchor.cloneNode !== "function") return null;
    var el = anchor.cloneNode(true);
    var icon = el.querySelector(".fa");
    var name = firstWords(el);
    if (!icon || !name) return null;
    /* A copy keeps everything that makes the original the LOI button: its id,
       `name="LOI"`, the `lending-controls-button` marker Humperdink's own code
       finds its buttons by, and any inline handler. Kept, the page would have a
       second LOI button that opens the LOI. Only presentation survives. */
    /* Before the ids go: Humperdink styles the LOI button through `#btnLOIFile`
       as well as through its classes, and the id is the one thing a copy can
       never keep. Without those rules the control rides a little high and
       leaves a gap under it, so each box takes its vertical metrics from what
       its original actually renders with, whatever rule set them. */
    matchVerticalTree(el, anchor);
    var nodes = [el].concat(Array.prototype.slice.call(el.querySelectorAll("*")));
    for (var i = 0; i < nodes.length; i += 1) stripIdentity(nodes[i]);
    /* The LOI button's inline width is sized to "LOI"; "Export to HT" spilled out
       of it. Let the control size to its own name. */
    el.style.removeProperty("width");
    /* Only the resting look travels. A copy taken while LOI was hovered, pressed
       or disabled would otherwise wear that state for good. */
    el.className = String(el.className)
      .split(/\s+/)
      .filter(function (name) {
        return name && !/-(hover|pressed|disabled)(-|$)/.test(name);
      })
      .join(" ");
    el.setAttribute("aria-disabled", "false");
    icon.className = swapIcon(icon.className);
    var label = document.createElement("span");
    label.className = "hot-task-label";
    label.style.whiteSpace = "nowrap";
    name.parentNode.replaceChild(label, name);
    return el;
  }

  /* What holds a header button on the bar's centre line. Vertical only, and
     that is the whole point of the list. 1.9.4 copied every box property and
     1.9.5 took it back out for good reasons: it rewrote LOI's
     `padding-left: 10px !important` as an ordinary declaration, and it could
     capture a header that hadn't painted. The horizontal side needs no help —
     LOI's inline width is dropped just below and its padding is inherited
     untouched — so nothing here reads or writes a left, a right or a width. */
  var RENDERED_VERTICAL = [
    "display", "box-sizing", "vertical-align",
    "height", "min-height", "line-height", "font-size",
    "margin-top", "margin-bottom", "padding-top", "padding-bottom"
  ];
  /* Offsets only travel with `position: relative`; copying an absolute one
     would stack the control on top of the LOI button. */
  var RELATIVE_OFFSETS = ["position", "top", "bottom"];

  /* The original's rendered style, or null when there is nothing worth reading.
     A header that hasn't painted yet measures zero, and a copy of that would be
     a flattened control that never recovers. */
  function renderedStyle(original) {
    if (typeof window.getComputedStyle !== "function") return null;
    var style = window.getComputedStyle(original);
    if (!style) return null;
    return parseFloat(style.getPropertyValue("height")) > 0 ? style : null;
  }

  function matchVertical(copy, original) {
    if (!copy.style || typeof copy.style.setProperty !== "function") return;
    var style = renderedStyle(original);
    if (!style) return;
    var names = style.getPropertyValue("position") === "relative" ? RENDERED_VERTICAL.concat(RELATIVE_OFFSETS) : RENDERED_VERTICAL;
    for (var i = 0; i < names.length; i += 1) {
      var value = style.getPropertyValue(names[i]);
      if (!value) continue;
      /* Never downgrade an `!important` the copy already carries: setting a
         property plainly would drop its priority, which is how the earlier
         version broke LOI's padding. */
      if (typeof copy.style.getPropertyPriority === "function" && copy.style.getPropertyPriority(names[i]) === "important") continue;
      copy.style.setProperty(names[i], value);
    }
  }

  /* The button and every box inside it, each against the original it came from. */
  function matchVerticalTree(copy, original) {
    matchVertical(copy, original);
    var originals = typeof original.querySelectorAll === "function" ? original.querySelectorAll("*") : [];
    var copies = typeof copy.querySelectorAll === "function" ? copy.querySelectorAll("*") : [];
    for (var i = 0; i < copies.length && i < originals.length; i += 1) matchVertical(copies[i], originals[i]);
  }

  var PRESENTATION_ATTRIBUTE = /^(class|style|role|title|aria-.*)$/i;

  function stripIdentity(node) {
    if (typeof node.removeAttribute !== "function") return;
    var identity = [];
    for (var i = 0; i < (node.attributes ? node.attributes.length : 0); i += 1) {
      if (!PRESENTATION_ATTRIBUTE.test(node.attributes[i].name)) identity.push(node.attributes[i].name);
    }
    for (var j = 0; j < identity.length; j += 1) node.removeAttribute(identity[j]);
  }

  /* The first text with something in it: the button's name. */
  function firstWords(node) {
    var children = node.childNodes || [];
    for (var i = 0; i < children.length; i += 1) {
      var child = children[i];
      if (child.nodeType === 3 && child.nodeValue.trim()) return child;
      if (child.nodeType === 1) {
        var found = firstWords(child);
        if (found) return found;
      }
    }
    return null;
  }

  /* Font Awesome's size and width modifiers stay; the glyph is swapped. */
  function swapIcon(className) {
    var kept = String(className)
      .split(/\s+/)
      .filter(function (name) {
        return name && (!/^fa-/.test(name) || /^fa-(lg|fw|[2-5]x)$/.test(name));
      });
    kept.push(ICON_CLASS);
    return kept.join(" ");
  }

  /* The fallback: the LOI button's classes on a hand-built body. */
  function buildInlineControl(anchor) {
    var el = document.createElement("div");
    el.className = anchor.className;
    el.style.cssText = "padding-left:10px !important;padding-right:12px;height:24px;margin-left:6px;cursor:pointer;";
    el.innerHTML =
      '<span class="fa ' + ICON_CLASS + ' fa-lg loanSettings" style="font-size:13px;margin-right:5px;margin-top:2px;"></span>' +
      '<div class="hot-task-label" style="margin-top:3px;white-space:nowrap;"></div>';
    return el;
  }

  /* The fallback, for when the panel header never turns up. */
  function createFloatingControl() {
    var el = document.createElement("button");
    el.id = BUTTON_ID;
    el.type = "button";
    el.style.cssText = [
      "position:fixed",
      "right:16px",
      "bottom:16px",
      "z-index:2147483647",
      "max-width:320px",
      "padding:9px 14px",
      "border:1px solid #1f1f1f",
      "border-radius:6px",
      "background:#1f1f1f",
      "color:#fff",
      "font:600 13px/1.35 system-ui,sans-serif",
      "text-align:left",
      "cursor:pointer",
      "box-shadow:0 2px 8px rgba(0,0,0,0.25)"
    ].join(";");
    return el;
  }

  /* ── Messages ───────────────────────────────────────────────

     The floating button could grow to 320px and hold a whole sentence, and
     those sentences are this control's entire error reporting. A panel header
     button cannot, so rather than trimming them they move into a note pinned
     under the button: same text, same MESSAGE_MS, green edge on success and red
     on failure. */
  function showToast(anchor, message, ok) {
    var toast = document.getElementById(TOAST_ID);
    if (!toast) {
      toast = document.createElement("div");
      toast.id = TOAST_ID;
      document.body.appendChild(toast);
    }
    var box = anchor.getBoundingClientRect();
    toast.textContent = message;
    toast.style.cssText = [
      "position:fixed",
      "top:" + Math.round(box.bottom + 8) + "px",
      "left:" + Math.round(Math.max(8, Math.min(box.left, window.innerWidth - 340))) + "px",
      "z-index:2147483647",
      "max-width:320px",
      "padding:9px 12px",
      "border:1px solid " + (ok ? "#1f8a3b" : "#b3261e"),
      "border-left-width:4px",
      "border-radius:4px",
      "background:#fff",
      "color:#1f1f1f",
      "font:600 12px/1.4 system-ui,sans-serif",
      "box-shadow:0 2px 10px rgba(0,0,0,0.2)"
    ].join(";");
    return toast;
  }

  function hideToast() {
    var toast = document.getElementById(TOAST_ID);
    if (toast) toast.remove();
  }

  function mount() {
    if (document.getElementById(BUTTON_ID)) return;

    var control = null;
    var inline = false;
    /* The properties arrive by background request after the page renders
       (#197), so the control has a waiting state. It watches rather than
       reading on click for a practical reason as well as an honest one: a
       clipboard write has to happen inside the press that asked for it, and a
       press that first waited several seconds for a grid has lost that. */
    var loading = true;
    var resetTimer = 0;

    function setLabel(text) {
      if (!control) return;
      var label = control.querySelector(".hot-task-label");
      if (label) label.textContent = text;
      else control.textContent = text;
    }

    function idleLabel() {
      if (inline) return INLINE_LABEL;
      return loading ? LOADING_LABEL : IDLE_LABEL;
    }

    /* In the bar the label cannot be spent on `Loading…` without the button
       changing width mid-toolbar, so it dims and says why on hover instead. The
       floating fallback keeps the original wording. */
    function refreshIdle() {
      if (!control) return;
      setLabel(idleLabel());
      control.title = loading
        ? "Still loading this loan's properties"
        : "Copy this loan and open a new LOI Check in Hot Task";
      if (inline) control.style.opacity = loading ? "0.65" : "";
    }

    function say(message, ok) {
      if (resetTimer) clearTimeout(resetTimer);
      if (inline) {
        showToast(control, message, !!ok);
        resetTimer = setTimeout(function () {
          hideToast();
          resetTimer = 0;
        }, MESSAGE_MS);
        return;
      }
      setLabel(message);
      resetTimer = setTimeout(function () {
        refreshIdle();
        resetTimer = 0;
      }, MESSAGE_MS);
    }

    function onPress() {
      if (loading) {
        say("Still loading this loan's properties — try again in a moment.", false);
        return;
      }
      var result = collect(document, location);
      if (!result.ok) {
        say(result.error, false);
        return;
      }
      var text = JSON.stringify(result.payload);
      /* Open Hot Task only once the copy has landed, so the LOI Check never
         opens onto a clipboard without the loan on it. Chrome launches an
         external protocol only on a user gesture, and a clipboard write resolves
         well inside the press's activation window, so this still counts as the
         press. The first time, Chrome asks whether to open Teams; ticking Always
         allow makes every later press go straight there. */
      copyText(text).then(
        function () {
          say(COPIED_MESSAGE, true);
          window.location.assign(arrivalLink());
        },
        function () {
          say("Couldn't reach the clipboard. Copy this page's URL by hand.", false);
        }
      );
    }

    /* Put the control in the Loan Terms header, or report that it isn't there
       yet. Never assumed: see the ANCHOR_ID note at the top. */
    function place() {
      if (document.getElementById(BUTTON_ID)) return true;
      var anchor = document.getElementById(ANCHOR_ID);
      if (!anchor || !anchor.closest(".loanpanelheader")) return false;
      control = createInlineControl(anchor);
      control.addEventListener("click", function (event) {
        event.preventDefault();
        /* The control wears LOI's classes, so a Humperdink handler listening
           higher up for presses on its header buttons would otherwise take
           this for one of them. */
        event.stopPropagation();
        onPress();
      });
      anchor.insertAdjacentElement("afterend", control);
      inline = true;
      refreshIdle();
      return true;
    }

    function placeFloating() {
      if (document.getElementById(BUTTON_ID)) return;
      control = createFloatingControl();
      control.addEventListener("click", onPress);
      document.body.appendChild(control);
      inline = false;
      refreshIdle();
    }

    function finishLoading() {
      if (!loading) return;
      loading = false;
      // Don't stamp over a message the filer is mid-read of.
      if (!resetTimer) refreshIdle();
    }

    /* Poll until the properties grid has painted, then let the button offer
       the copy.

       Polling rather than a MutationObserver because the grid is redrawn
       wholesale and the thing being waited for is "rows exist", which is one
       cheap read. The ceiling exists so a grid that never arrives leaves a
       pressable button: pressing it then reports what didn't load, which is
       #197's "reported, not silently omitted". */
    function watchForLoad() {
      if (gridSettled(document)) {
        finishLoading();
        return;
      }
      var waitedMs = 0;
      setTimeout(function tick() {
        waitedMs += POLL_MS;
        if (gridSettled(document) || waitedMs >= LOAD_CEILING_MS) {
          finishLoading();
          return;
        }
        setTimeout(tick, POLL_MS);
      }, POLL_MS);
    }

    /* The header is painted with the rest of the page, so this usually lands
       first time. When it doesn't, keep looking, and take the corner rather
       than nothing if it never shows. */
    if (!place()) {
      var waitedForAnchor = 0;
      var watcher = setInterval(function () {
        waitedForAnchor += POLL_MS;
        if (place()) {
          clearInterval(watcher);
          return;
        }
        if (waitedForAnchor >= ANCHOR_CEILING_MS) {
          clearInterval(watcher);
          placeFloating();
        }
      }, POLL_MS);
    }

    /* Humperdink repaints the panel header on collapse and on loan reload, and
       takes the control with it. Put it back. */
    new MutationObserver(function () {
      if (inline && !document.getElementById(BUTTON_ID)) place();
    }).observe(document.documentElement, { childList: true, subtree: true });

    watchForLoad();
  }

  mount();
})();
