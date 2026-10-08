// ==UserScript==
// @name         Humperdink Copy Link: payment link only
// @namespace    loneoakfund
// @version      0.1.0
// @description  Make Humperdink's Copy Link button put just the PayJunction payment URL on the clipboard, without the sentence around it.
// @match        https://humperdink.loneoakfund.com/*
// @run-at       document-start
// @grant        none
// @downloadURL  https://loftools.thepopcorn.party/userscripts/humperdink-copy-link.user.js
// @updateURL    https://loftools.thepopcorn.party/userscripts/humperdink-copy-link.user.js
// ==/UserScript==

/* Humperdink's Copy Link copies a sentence:

     Payment Request link https://www.payjunction.com/trinity/invoice#/l53OV29pSAqOxbQ6sQDP3mQZ.
     The payment notification will be sent to someone@example.com

   Only the URL is wanted. This script doesn't touch the button or Humperdink's
   markup, which it has no stable hold on — it sits on the three ways a page can
   write the clipboard and rewrites the text on its way out:

     - navigator.clipboard.writeText / write (what modern code uses),
     - document.execCommand('copy') with a hidden input or textarea holding the
       sentence (what older code uses),
     - the 'copy' event, in case the page sets the data in a handler.

   Every path runs the same `trim()`, and `trim()` only changes text that looks
   like this sentence: a payment link line with a URL in it. Anything else the
   page copies travels untouched, so an ordinary copy elsewhere in Humperdink
   still behaves. @grant none keeps the script in the page's own context, which
   is the only place patching navigator.clipboard reaches Humperdink's code. */

(function () {
  "use strict";

  /* The sentence, loosely: the words "payment request link" (Humperdink's label
     may gain or lose capitals) followed within a short distance by a URL. The
     URL stops at whitespace, and a trailing sentence period is dropped — the
     real link has no reason to end in one, and this one ends the sentence. */
  var SENTENCE = /payment\s*request\s*link\b/i;
  var URL_IN_TEXT = /\bhttps?:\/\/[^\s<>"']+/;

  function trim(text) {
    if (typeof text !== "string" || !SENTENCE.test(text)) return null;
    var found = text.match(URL_IN_TEXT);
    if (!found) return null;
    var url = found[0].replace(/[.,;)\]]+$/, "");
    return url === text ? null : url;
  }

  /* --- navigator.clipboard --- */

  var clipboard = navigator.clipboard;
  if (clipboard && typeof clipboard.writeText === "function") {
    var writeText = clipboard.writeText.bind(clipboard);
    clipboard.writeText = function (text) {
      return writeText(trim(text) || text);
    };

    /* clipboard.write() carries ClipboardItems rather than a string. Reading one
       back out is async and per-type, so rather than rebuild the item list, pass
       it through and let the text path above cover the common case. A payment
       link copied through write() would need this filled in. */
  }

  /* --- execCommand('copy') over a hidden field --- */

  if (typeof document.execCommand === "function") {
    var execCommand = document.execCommand.bind(document);
    document.execCommand = function (command) {
      if (String(command).toLowerCase() === "copy") {
        var el = document.activeElement;
        var tag = el && el.tagName;
        if (tag === "TEXTAREA" || tag === "INPUT") {
          var trimmed = trim(el.value);
          if (trimmed) {
            /* Replace the field's whole contents and reselect, so the copy takes
               the URL whichever range the page had selected. */
            el.value = trimmed;
            try { el.setSelectionRange(0, trimmed.length); } catch (_) { el.select(); }
          }
        }
      }
      return execCommand.apply(document, arguments);
    };
  }

  /* --- the copy event --- */

  /* Bubble phase on window, which runs after the page's own document-level
     handlers, so whatever they set is what gets rewritten here. A copy the page
     has already cancelled is left alone. */
  window.addEventListener("copy", function (event) {
    var data = event.clipboardData;
    if (!data || event.defaultPrevented) return;
    var trimmed = trim(data.getData("text/plain"));
    if (!trimmed) return;
    data.setData("text/plain", trimmed);
    data.setData("text/html", "");
    event.preventDefault();
  }, false);
})();
