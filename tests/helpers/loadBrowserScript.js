'use strict';

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const ROOT = path.join(__dirname, '..', '..');

/**
 * Loads a real HTML page and its (unmodified) browser script into an isolated
 * jsdom sandbox, installing the browser globals jsdom lacks. This lets us test
 * script.js / admin.js exactly as they ship, without refactoring them to be
 * importable.
 *
 * @param {string} htmlFile   e.g. 'index.html'
 * @param {string} scriptFile e.g. 'script.js'
 * @param {object} [opts]
 * @param {Function} [opts.fetch] fetch stub; defaults to always-offline so the
 *   scripts fall back to their localStorage code paths deterministically.
 * @param {Storage} [opts.seedLocalStorage] map of key->value to preseed.
 */
function loadBrowserScript(htmlFile, scriptFile, opts = {}) {
  const html = fs.readFileSync(path.join(ROOT, htmlFile), 'utf8');
  const dom = new JSDOM(html, {
    url: 'http://localhost/',
    // Inline scripts we inject run; the page's own <script src> tags are NOT
    // fetched because `resources` is left unset. This lets top-level `function`
    // declarations in the script attach to `window` (strict-mode `eval` would
    // scope them locally instead).
    runScripts: 'dangerously',
    pretendToBeVisual: true,
  });
  const { window } = dom;

  // --- Polyfills for APIs jsdom does not implement ---
  window.matchMedia = () => ({
    matches: false,
    media: '',
    onchange: null,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent() {
      return false;
    },
  });
  window.IntersectionObserver = class {
    constructor(cb) {
      this.cb = cb;
    }
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  };
  window.HTMLElement.prototype.scrollIntoView = function () {};
  window.scrollTo = () => {};
  window.alert = () => {};
  window.confirm = () => true;
  window.fetch =
    opts.fetch || (() => Promise.reject(new Error('offline-by-default')));

  if (opts.seedLocalStorage) {
    for (const [k, v] of Object.entries(opts.seedLocalStorage)) {
      window.localStorage.setItem(k, v);
    }
  }

  // Execute the real, unmodified script by injecting it as an inline <script>,
  // so its top-level declarations become window globals.
  const code = fs.readFileSync(path.join(ROOT, scriptFile), 'utf8');
  const scriptEl = window.document.createElement('script');
  scriptEl.textContent = code;
  window.document.body.appendChild(scriptEl);

  return { dom, window, document: window.document };
}

module.exports = { loadBrowserScript };
