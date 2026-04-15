# Interviewer One-Pager — Kramp Frontend Assignment

Use this during the interview. Full detail (clues, fixes, file locations) is in `INTERVIEWER_GUIDE.md`.

---

## What You're Looking For

The app has **40 intentional issues** across 8 categories. A strong candidate will not find them all — that's expected. Score on depth of explanation and ability to prioritise, not just count.

| Level | Findings | Signal |
|---|---|---|
| Junior | 5–10 (mostly surface) | Spots obvious smells, may not know the fix |
| Mid | 10–20 | Names the problem, explains impact, proposes fix |
| Senior | 20+ | Prioritises by user/business impact, spots systemic patterns |

---

## The Eight Categories

**T — TypeScript & code quality** · `any` everywhere, `var`, deprecated APIs, index as `key`, unused utilities (`formatPrice`, `fetchGraphQL`), weak tests

**R — React patterns** · Missing `useEffect` deps, derived state stored in state, `console.log` left in, god component, inline arrow functions

**Ax — Accessibility** · Three `<div>` buttons, two empty `alt` attributes, unlabelled search input, no combobox ARIA, no `role="alert"` on confirmation

**P — Performance** · Hero image lazy-loaded (hurts LCP), search fires on every keystroke (no debounce), sequential `await` in a loop (4× slower), blocking main-thread computation, no `.catch()` handlers

**F — Next.js misuse** · Static page using `getServerSideProps`, product page using client-side fetch, `localStorage` read during SSR, `Date.now()` in props (hydration mismatch), internal GraphQL URL exposed to browser

**D — Data fetching** · Over-fetching unused GraphQL fields, product re-fetches on every cart change, no loading skeleton (CLS), date formatting that will break in SSR

**A — Modern JS** · Custom `groupBy` instead of native `Object.groupBy`, manual URL string concatenation, unnecessary `isomorphic-fetch` polyfill, `React.FC` anti-pattern, `defaultProps` removed in React 19

**N — Configuration** · `http://localhost:4000/graphql` hardcoded in four files; `fetchGraphQL` utility already reads from env var and is never used

---

## High-Priority Bugs (Discuss if Time Is Short)

These have the biggest real-world impact and are the best signal of seniority.

| # | ID | Where | Impact |
|---|---|---|---|
| 1 | **Ax2** | ProductCard, product page, checkout | Three primary CTAs unreachable by keyboard — broken for all keyboard and AT users |
| 2 | **P4** | `index.tsx` | Sequential fetches: homepage takes ~3.2 s instead of ~800 ms |
| 3 | **F1 / F2** | `index.tsx`, `product/[id].tsx` | Wrong data-fetching strategy — SSR for static data, client fetch for SEO-critical product pages |
| 4 | **P2** | `Header.tsx` | Search hits server on every keystroke — debounce hook is imported and never called |
| 5 | **T12** | 4 files | `fetchGraphQL` utility unused; same raw fetch block copy-pasted with hardcoded localhost URL |
| 6 | **R7** | `search.tsx` | Missing dependency — navigating between searches shows stale results |
| 7 | **D6** | `product/[id].tsx` | Product data re-fetches every time the cart changes |
| 8 | **F4** | `api/products.ts` | Proxy route exists but is unused — internal GraphQL server address is sent to every browser |
| 9 | **Ax6** | ProductCard, product page | `alt=""` on product images — invisible to screen readers |
| 10 | **T11** | 4 files | `formatPrice` utility unused; price formatted inline with `toFixed` in four places |

---

## Good Discussion Questions

- _"You've found several bugs. Which three would you fix first, and why?"_ — tests prioritisation
- _"The search makes a network request on every keystroke. Walk me through your fix."_ — tests knowledge of debounce and hooks
- _"What's wrong with using `getServerSideProps` on the homepage?"_ — tests Next.js rendering model understanding
- _"There are three `<div onClick>` elements. What's the problem, and what does the fix look like?"_ — tests accessibility depth
- _"You see `useEffect(() => { setX(y) }, [y])` — what's happening and why is it a problem?"_ — tests React hooks understanding

---

## Scoring Card

```
Category          Found  Notes
───────────────────────────────
TypeScript (T)    /12
React (R)          /4
Accessibility (Ax) /5
Performance (P)    /6
Next.js (F)        /6
Data / GraphQL (D) /4
Modern JS (A)      /5
Config (N)         /1
───────────────────────────────
Total             /43

Prioritisation:  poor / ok / strong
Communication:   poor / ok / strong
Fix quality:     poor / ok / strong
```
