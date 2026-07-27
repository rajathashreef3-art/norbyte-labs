# Tests

Run the suite:

```bash
npm test              # run all tests
npm run test:coverage # run with a coverage report
```

## Layout

| File | Covers |
|------|--------|
| `server.test.js` | Express API in `server.js` — tracking & pitches CRUD, validation, file download (incl. path-traversal defense), fallback routing. Driven with Supertest. |
| `client-public.test.js` | `script.js` (public site) — theme init, localStorage seeding, `performTrackingLookup` rendering and step math. |
| `client-admin.test.js` | `admin.js` (admin console) — auth gate, pitch→project conversion, records-table search filter. |
| `security-regression.test.js` | Output-escaping tripwires (see below). |
| `helpers/loadBrowserScript.js` | Loads a real HTML page + its unmodified browser script into an isolated jsdom sandbox. |

## How the browser tests work

`script.js` and `admin.js` are **not modified** for testing. `loadBrowserScript`
loads the real `index.html` / `admin.html` into a jsdom instance, polyfills the
browser APIs jsdom lacks (`matchMedia`, `IntersectionObserver`, `scrollIntoView`,
`fetch`, `alert`, `confirm`), injects the script as an inline `<script>` so its
top-level `function` declarations become `window` globals, and then exercises it
through the DOM.

**Coverage caveat:** because the browser files run inside the jsdom sandbox
rather than through Jest's module pipeline, Istanbul reports `script.js` and
`admin.js` as 0% even though they are genuinely exercised. The measurable number
is `server.js` (~94%). Instrumenting the browser files would require a
build/transform step or refactoring them to be importable.

## `test.failing` tripwires

`security-regression.test.js` uses `test.failing` for known unescaped
`innerHTML` sinks. Those cases assert the *desired* (escaped) behavior, which
does not hold yet — so Jest reports them green today and flips them **red** the
moment someone adds escaping. When that happens, convert them to normal `test`.
