# Interviewer Guide — Kramp Frontend Assignment

This document is for the interviewer only. The app is a deliberately flawed Next.js webshop. Candidates are asked to review the code and identify issues. Use this guide to score findings, prompt with clues when candidates are stuck, and understand what a correct fix looks like.

---

## How to Use This Guide

Each issue has a **code** (e.g. `T1`, `Ax2`) that matches the inline comments in the source. Issues are grouped by category. Within each category, problems are roughly ordered from easiest to spot to hardest.

**Scoring suggestion**
- Found and named it correctly → 1 pt
- Explained the real-world impact → +1 pt
- Proposed a correct fix → +1 pt

A strong mid-level candidate should find 10–15 issues. A senior candidate should find 20+ and be able to prioritise by impact.

---

## Categories at a Glance

| Code | Category |
|---|---|
| **T** | TypeScript & code quality |
| **R** | React patterns |
| **Ax** | Accessibility |
| **P** | Performance |
| **F** | Next.js / framework misuse |
| **D** | Data fetching & GraphQL |
| **A** | Modern JS / platform APIs |
| **N** | Naming & configuration |

---

## T — TypeScript & Code Quality

### T1 · `any` used throughout
**Files:** `Header.tsx`, `search.tsx`, `product/[id].tsx`, `checkout.tsx`, `_app.tsx`, `ProductCard.tsx`
**What to look for:** `any[]`, `as any`, `React.FC<any>` scattered across nearly every file. CartContext is typed as `any` at the source, which infects all consumers.
**Clue:** _"Start at the CartContext definition — what type does it export, and what does that mean for every component that reads from it?"_
**Fix:** Define a `Cart` type in `src/types/index.ts`. Type `CartContext` with `createContext<CartContextValue | null>(null)`. Remove all `as any` casts.

---

### T2 · `Array.indexOf` instead of `Array.includes`
**File:** `Header.tsx:86`
**What to look for:** `router.pathname.indexOf(path) !== -1` — verbose, not idiomatic, and returns a number rather than a boolean.
**Clue:** _"Is there a more modern method that directly answers 'does this string contain that substring'?"_
**Fix:** `router.pathname.includes(path)`

---

### T3 · `String.substr` (deprecated)
**File:** `Header.tsx:91`
**What to look for:** `query.substr(0, 30)` — `substr` is deprecated and removed in strict mode in some environments.
**Clue:** _"Check MDN — is `substr` still recommended?"_
**Fix:** `query.slice(0, 30)`

---

### T4 · `var` instead of `const`
**Files:** `Header.tsx:13`, `product/[id].tsx:7`
**What to look for:** `var GRAPHQL_URL = '...'` — `var` has function scope and is hoisted. `const` is the correct choice for module-level constants.
**Clue:** _"When was `var` last the right keyword to use?"_
**Fix:** `const GRAPHQL_URL = ...`

---

### T5 · Lodash imported but debounce hook never used
**File:** `Header.tsx:4–8`
**What to look for:** `import _ from 'lodash'` and `import { useDebounce } from '../hooks/useDebounce'` are both at the top of the file, but neither is called anywhere. Meanwhile search fires on every keystroke (see P2).
**Clue:** _"Both a debounce hook and lodash are imported. Look at the search effect — is either one actually used?"_
**Fix:** Delete the unused imports. Apply `useDebounce` to `query` before using it in the search effect.

---

### T6 · Derived state managed with `useEffect`
**Files:** `Header.tsx:24–27`, `search.tsx:62–65`
**What to look for:** A `useEffect` that does nothing but call `setState` to sync one state value to another. This causes an extra render cycle for no reason.
**Clue:** _"The You Might Not Need an Effect React docs page covers this exact pattern. Can `isOpen` or `filteredResults` just be computed inline?"_
**Fix:**
- `Header.tsx`: `const isOpen = results.length > 0 && query.length > 0` — no state or effect needed.
- `search.tsx`: Remove `filteredResults` state entirely. Use `results` directly and derive `grouped` from it.

---

### T7 · `totalPrice` is derived state stored in state
**File:** `useCart.ts:16–22`
**What to look for:** `totalPrice` is calculated in a `useEffect` and stored as a separate state variable, causing a guaranteed double-render whenever the cart changes.
**Clue:** _"Can you compute the total without storing it in state at all?"_
**Fix:** `const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)` — computed inline, removed from state.

---

### T8 · Array index used as `key`
**Files:** `index.tsx:103`, `index.tsx:112`, `search.tsx:89`, `checkout.tsx:60`
**What to look for:** `key={index}` on every list render. If items are reordered or filtered, React will match the wrong DOM nodes.
**Clue:** _"What does React use `key` for? What happens if two items swap positions?"_
**Fix:** Use a stable, unique identifier: `key={product.id}` or `key={item.productId}`.

---

### T9 · `getByTestId` instead of semantic queries
**File:** `specs/ProductCard.spec.tsx`
**What to look for:** All three tests use `getByTestId`. This requires `data-testid` attributes on the implementation — coupling the test to internal structure rather than visible behaviour.
**Clue:** _"The Testing Library docs recommend a priority order for queries. Where does `getByTestId` rank?"_
**Fix:** Use `getByRole`, `getByText`, or `getByAltText`. E.g. `getByRole('heading', { name: /heavy duty hammer/i })` or `getByText(/18\.99/)`.

---

### T10 · Weak or meaningless test assertions
**Files:** `specs/index.spec.tsx:17–25`, `specs/ProductCard.spec.tsx:31–35`
**What to look for:** `expect(baseElement).toBeTruthy()` passes as long as the component doesn't throw — it gives no signal about correctness. Similarly `expect(getByTestId('product-card')).toBeTruthy()` only checks the element exists.
**Clue:** _"What would this test tell you if someone deleted the product name from the template? Would it still pass?"_
**Fix:** Assert on visible content: `expect(screen.getByRole('heading', { name: /heavy duty hammer/i })).toBeInTheDocument()`.

---

### T11 · `formatPrice` utility exists but is never used
**Files:** `utils/formatPrice.ts`, `ProductCard.tsx:29`, `product/[id].tsx:121`, `checkout.tsx:66,79`
**What to look for:** Price is formatted as `` `€${price.toFixed(2)}` `` in at least four places. `utils/formatPrice.ts` exists with a proper `Intl.NumberFormat` implementation and is never imported.
**Clue:** _"Search the codebase for `.toFixed(2)`. Now look in the `utils/` folder."_
**Fix:** Import and call `formatPrice(price)` wherever prices are displayed. Delete the inline formatting.

---

### T12 · `fetchGraphQL` utility exists but is never used
**Files:** `utils/fetchGraphQL.ts`, `index.tsx:23`, `search.tsx:32`, `product/[id].tsx:32`, `Header.tsx:40`
**What to look for:** The same ~10-line `fetch` block (with hardcoded `localhost:4000`) is copy-pasted across four files. `utils/fetchGraphQL.ts` is a complete, typed wrapper that reads the URL from an env var — and it is never imported.
**Clue:** _"Count how many times you see `fetch('http://localhost:4000/graphql'` in the codebase."_
**Fix:** Replace every fetch block with `fetchGraphQL<ProductType>(query, variables)`. This also fixes the hardcoded URL (N2) in one place.

---

## R — React Patterns

### R1 · Inline arrow functions as props (no `useCallback`)
**File:** `Header.tsx:134,137,147`
**What to look for:** `onChange={e => setQuery(...)}`, `onClick={e => e.stopPropagation()}`, and the `onSelect` handler are all defined inline. Each creates a new function reference every render, which can cause unnecessary re-renders in memoised children.
**Clue:** _"What reference does `onChange` point to between renders? Does that matter for the `SearchDialog` component?"_
**Fix:** Wrap stable handlers in `useCallback`. For simple setters (`setQuery`), passing the setter directly is fine.

---

### R3 · God component — `Header` does too much
**File:** `Header.tsx`
**What to look for:** A single 160-line component owns navigation, search state, the dropdown dialog, debounce logic, and cart display. Any change to search behaviour requires touching the navigation component.
**Clue:** _"How many distinct responsibilities can you count in this component?"_
**Fix:** Extract `<SearchBar>` with its own state and effects. The `Header` becomes a layout shell that composes `<SearchBar>` and `<CartIcon>`.

---

### R4 · Leftover `console.log` statements
**Files:** `search.tsx:55`, `product/[id].tsx:57`, `product/[id].tsx:81`, `checkout.tsx:26`
**What to look for:** Debug logs that ship to production: `console.log('search results:', data)`, `console.log('product loaded:', data)`, `console.log('cart total after add:', runningTotal)`, `console.log('order total:', ...)`.
**Clue:** _"Open the browser console on the product page and add something to the cart."_
**Fix:** Remove all `console.log` calls. If order summary logging is needed, use a proper logger or move it server-side.

---

### R7 · Missing `useEffect` dependency — stale results on navigation
**File:** `search.tsx:59`
**What to look for:** `useEffect(() => { ... }, [])` — the dependency array is empty but the effect reads `router.query.q`. If the user navigates from `/search?q=hammer` to `/search?q=bolt`, the effect never re-runs and the old results stay on screen.
**Clue:** _"Try navigating between two different search terms by editing the URL. Do the results update?"_
**Fix:** Add `router.query.q` to the dependency array. Consider also moving to `getServerSideProps` to eliminate the client-side fetch entirely (see F3).

---

## Ax — Accessibility

### Ax1 · Search input has no label
**File:** `Header.tsx:128`
**What to look for:** `<input type="text" placeholder="Search products..."` — no `<label>`, no `aria-label`, no `aria-labelledby`. A screen reader announces this as a generic unlabelled text field.
**Clue:** _"Run an axe or Lighthouse accessibility audit. What does it say about the search field?"_
**Fix:** Add `aria-label="Search products"` to the input, or associate a visually-hidden `<label>`.

---

### Ax2 · Interactive `<div>` elements instead of `<button>`
**Files:** `ProductCard.tsx:32`, `product/[id].tsx:139`, `checkout.tsx:91`
**What to look for:** Three primary call-to-action elements — "View product", "Add to cart", "Place order" — are all `<div onClick={...}>`. They cannot be reached by keyboard (no `Tab` focus), do not respond to `Enter`/`Space`, and are invisible to assistive technology.
**Clue:** _"Try to complete a purchase using only your keyboard. Where do you get stuck?"_
**Fix:** Replace each with `<button type="button" onClick={...}>`. No `tabIndex` or `role` needed — button semantics are built in.

---

### Ax4 · Search combobox has no ARIA state
**File:** `Header.tsx:128–153`
**What to look for:** The search input opens a dropdown (`SearchDialog`) but has no `role="combobox"`, no `aria-expanded`, no `aria-haspopup`, and no `aria-controls` linking it to the result list.
**Clue:** _"A screen reader user types in the search box. How do they know results have appeared?"_
**Fix:** Add `role="combobox" aria-expanded={isOpen} aria-haspopup="listbox" aria-controls="search-results"` to the input. Give the dialog `role="listbox" id="search-results"`.

---

### Ax6 · Images have empty `alt` text
**Files:** `ProductCard.tsx:20`, `product/[id].tsx:113`
**What to look for:** `alt=""` on product images. An empty string marks an image as decorative — screen readers skip it entirely — but these images convey meaningful product information.
**Clue:** _"If a user cannot see the product image, how do they know what the product looks like?"_
**Fix:** `alt={product.name}` (or a more descriptive string). The hero image in `index.tsx` already has good alt text and is correct.

---

### Ax7 · Order confirmation has no `role="alert"`
**File:** `checkout.tsx:36`
**What to look for:** After clicking "Place order", the page replaces its content with a confirmation `<div>`. The change is visual only — a screen reader user who has just submitted an order receives no announcement.
**Clue:** _"After placing an order with a screen reader running, how would you know it succeeded?"_
**Fix:** Add `role="alert"` to the confirmation container. Screen readers will immediately announce its content without requiring focus.

---

## P — Performance

### P1 · LCP hero image loads lazily
**File:** `index.tsx:79`
**What to look for:** `<img loading="lazy"` on the above-the-fold hero image. Lazy loading defers the browser's image request until the image enters the viewport — but the hero is always in the viewport on load. This delays the Largest Contentful Paint.
**Clue:** _"Lazy loading is a performance optimisation. Is it always an optimisation for every image?"_
**Fix:** Remove `loading="lazy"` (default is `eager`). Better still, replace with `<Image>` from `next/image` with `priority={true}`.

---

### P2 · Search GraphQL request fires on every keystroke
**File:** `Header.tsx:34–64`
**What to look for:** The `useEffect` with `[query]` as dependency runs immediately on every character typed. On a slow connection this produces a new network request per keystroke, races between responses, and hammers the server.
**Clue:** _"Type quickly in the search box and watch the Network tab. How many requests go out for a 5-character word?"_
**Fix:** Apply the already-imported `useDebounce` hook: `const debouncedQuery = useDebounce(query, 300)`. Use `debouncedQuery` in the effect dependency array instead of `query`.

---

### P3 · Synchronous blocking computation in click handlers
**Files:** `product/[id].tsx:70–81`, `checkout.tsx:14–26`
**What to look for:** Both `handleAddToCart` and `handlePlaceOrder` do synchronous loops/reduces over the cart before calling `setState`. On a large cart this blocks the main thread, delaying visual feedback and causing an INP regression.
**Clue:** _"The computation runs before `setState`. Does the UI update before or after this work completes?"_
**Fix:** Call `setState` first to give immediate visual feedback. Move the computation after `await scheduler.yield()`, or move it off the critical path entirely (e.g. log totals server-side).

---

### P4 · Sequential `await` in a loop — 4× slower than parallel
**File:** `index.tsx:18–51`
**What to look for:** `for (const id of FEATURED_IDS) { const res = await fetch(...) }` — each request waits for the previous one to resolve. The GraphQL server has an 800 ms artificial delay per product, so four products take ~3.2 s instead of ~800 ms.
**Clue:** _"The homepage takes over 3 seconds to respond. Look at how the featured products are fetched."_
**Fix:** `const featured = await Promise.all(FEATURED_IDS.map(id => fetchGraphQL(...)))`

---

### P5 · Unhandled promise rejections (no `.catch`)
**Files:** `Header.tsx:60–63`, `search.tsx:53–58`, `product/[id].tsx:55–58`
**What to look for:** Three `fetch(...).then(...).then(...)` chains with no `.catch()` and no `try/catch`. If the server is down, the promise rejects silently — no error state is shown and `isLoading` stays `true` forever.
**Clue:** _"Stop the dev server and load a product page. What does the user see?"_
**Fix:** Add `.catch(err => { setError(err); setIsLoading(false); })`. Render an error message in the UI.

---

### P6 · CartContext value object recreated on every render
**File:** `_app.tsx:21`
**What to look for:** `<CartContext.Provider value={{ cart }}>` — the object literal `{ cart }` is a new reference every time `CustomApp` renders. Every component that calls `useContext(CartContext)` will re-render whenever the parent renders, even if `cart` has not changed.
**Clue:** _"How often does the context `value` prop create a new object? What does React do when context value changes?"_
**Fix:** `const value = useMemo(() => ({ cart }), [cart])` and pass `value` to the Provider. Alternatively, split into `CartStateContext` and `CartDispatchContext`.

---

## F — Next.js / Framework Misuse

### F1 · `getServerSideProps` for static content
**File:** `index.tsx:12–58`
**What to look for:** `getServerSideProps` runs on every request. The featured product list is static data served from a JSON file that never changes at runtime. Using `getStaticProps` would generate the page once at build time — zero per-request server work.
**Clue:** _"How often does the featured product list change? Does it need to be re-fetched on every single page view?"_
**Fix:** Replace `getServerSideProps` with `getStaticProps`. For data that changes occasionally, add `revalidate: 3600` (ISR).

---

### F2 · Product page uses client-side fetch instead of `getStaticProps`
**File:** `product/[id].tsx`
**What to look for:** Product data is loaded in a `useEffect`. This means search engines crawl an empty `<p>Loading...</p>` page, the user sees a loading state before any content, and there is no opportunity for caching or ISR.
**Clue:** _"View the page source of a product page (not DevTools — View Source). What does the crawler see?"_
**Fix:** Export `getStaticProps({ params })` and `getStaticPaths()` with `fallback: 'blocking'`. Remove the `useEffect` fetch entirely.

---

### F3 · Search page reads query param client-side — causes flash of empty state
**File:** `search.tsx`
**What to look for:** `router.query.q` is read inside a `useEffect`. The server renders the page with no results; the query is only available after hydration. Users see "No products found" for a moment before results appear.
**Clue:** _"Navigate to `/search?q=hammer` and watch what happens in the first 500ms."_
**Fix:** Use `getServerSideProps` to read `context.query.q`, perform the GraphQL fetch server-side, and pass `results` as a prop. The page renders with data immediately.

---

### F4 · API proxy route unused — GraphQL URL exposed to browsers
**File:** `src/pages/api/products.ts`
**What to look for:** `apps/webshop/src/pages/api/products.ts` is a Next.js API route that proxies requests to the GraphQL server. It is never called. Instead, all pages call `http://localhost:4000/graphql` directly from the browser — exposing the internal network address to every user.
**Clue:** _"Open the Network tab and look at what URL the search request goes to. Is that a URL that should be public?"_
**Fix:** Route all GraphQL requests through `/api/products`. The internal server address stays server-side only. This also enables adding auth headers, rate limiting, or swapping the backend without frontend changes.

---

### F5 · `localStorage` read during SSR initialisation
**File:** `useCart.ts:8–11`
**What to look for:** `localStorage.getItem('cart')` is called at module level, outside any hook or effect. During server-side rendering there is no `localStorage`. The `typeof window` guard prevents a crash, but the server always renders an empty cart while the client hydrates with the stored cart — causing a hydration mismatch.
**Clue:** _"When does the code at the top of `useCart.ts` run — before or after the component mounts?"_
**Fix:** Initialise state with `[]` and load from `localStorage` inside a `useEffect(() => { ... }, [])` that runs only on the client.

---

### F6 · `Date.now()` passed as a prop causes hydration mismatch
**File:** `index.tsx:56,97`
**What to look for:** `timestamp: Date.now()` is returned from `getServerSideProps`. The server records one timestamp; by the time React hydrates on the client, the value is different, causing a React warning and potential content mismatch.
**Clue:** _"Open the browser console on the homepage. Is there a React hydration warning?"_
**Fix:** Remove `timestamp` from props entirely, or format it as a stable ISO date string (`new Date().toISOString().split('T')[0]`) that does not change within a page load.

---

## D — Data Fetching & GraphQL

### D1 · Over-fetching — unused fields requested from GraphQL
**Files:** `Header.tsx:44–54`, `search.tsx:39–49`, `product/[id].tsx:39–49`
**What to look for:** Every query requests `description`, `stock`, and `createdAt` even when those fields are not rendered. The search suggestion dropdown only needs `id`, `name`, `price`, and `imageUrl`.
**Clue:** _"Look at what the search dropdown actually displays. Now look at what fields the GraphQL query requests."_
**Fix:** Write field-minimal queries. Each query should request only the fields it renders. The GraphQL type system makes this explicit — use it.

---

### D3 · No loading skeleton — CLS on product page
**File:** `product/[id].tsx:93–99`
**What to look for:** `if (!product) return <p>Loading...</p>` — the page jumps from a single line of text to a full layout when the product loads, causing Cumulative Layout Shift.
**Clue:** _"Watch what happens to the page height between 'Loading...' and the product appearing."_
**Fix:** Render a skeleton that reserves the same dimensions as the real content: a grey rectangle for the image, placeholder lines for the name and price.

---

### D6 · Product re-fetches every time the cart changes
**File:** `product/[id].tsx:60`
**What to look for:** `useEffect(() => { fetch(product) }, [cart])` — the dependency is `cart`, not `router.query.id`. Adding a product to the cart triggers a full product re-fetch from the server.
**Clue:** _"Add an item to the cart on a product page and watch the Network tab."_
**Fix:** Change the dependency to `[router.query.id]`. The product fetch has nothing to do with cart state.

---

### D7 · `toLocaleDateString()` in SSR context — future hydration risk
**File:** `product/[id].tsx:127`
**What to look for:** `new Date(product.createdAt).toLocaleDateString()` — locale and timezone differ between server and client environments, which will cause a hydration mismatch if this page ever moves to SSR.
**Clue:** _"What locale does `toLocaleDateString()` use on a Node.js server vs a browser set to Dutch?"_
**Fix:** Format dates only on the client inside a `useEffect`, or use a locale-stable format like `toISOString().split('T')[0]`.

---

## A — Modern JS / Platform APIs

### A2 · Custom `groupBy` instead of native `Object.groupBy`
**File:** `utils/groupBy.ts`, `search.tsx:68`
**What to look for:** A custom 10-line reduce-based `groupBy` utility is defined and used. `Object.groupBy` has been available natively since Node 21 / Chrome 117 (2023).
**Clue:** _"Is there a native platform API that does what this utility does?"_
**Fix:** `const grouped = Object.groupBy(results, item => item.category)`. Delete `utils/groupBy.ts`.

---

### A3 · Manual URL string concatenation instead of `URLSearchParams`
**File:** `Header.tsx:80`
**What to look for:** `'/search?q=' + encodeURIComponent(query)` — works for a single param but breaks down when multiple query params are needed and is easy to get wrong.
**Clue:** _"What is `URLSearchParams` for?"_
**Fix:** `const params = new URLSearchParams({ q: query }); router.push('/search?' + params)`

---

### A4 · `isomorphic-fetch` polyfill unnecessary
**File:** `_app.tsx:1`
**What to look for:** `import 'isomorphic-fetch'` — this polyfill was needed before Node 18. Next.js 13+ requires Node 18+, which ships `fetch` natively. The import adds dead weight.
**Clue:** _"What Node version does this project require? When was `fetch` added to Node?"_
**Fix:** Delete the import.

---

### A5 · `React` import not needed + `React.FC` anti-pattern
**File:** `ProductCard.tsx:1,8`
**What to look for:** `import React from 'react'` is not required since React 17's new JSX transform. `React.FC` is considered an anti-pattern in React 18+ — it adds no useful typing and previously implicitly added `children` which was a footgun.
**Clue:** _"Does React 17+ require you to import React to use JSX?"_
**Fix:** Remove the `React` import. Type the component as `function ProductCard({ product, onAddToCart }: ProductCardProps)` with an explicit interface.

---

### A6 · `defaultProps` on a function component (removed in React 19)
**File:** `ProductCard.tsx:46`
**What to look for:** `(ProductCard as any).defaultProps = { onAddToCart: () => {} }` — `defaultProps` for function components was deprecated in React 18 and removed in React 19.
**Clue:** _"Is `defaultProps` still supported on function components in React 19?"_
**Fix:** Use a default parameter: `function ProductCard({ product, onAddToCart = () => {} }: ProductCardProps)`.

---

## N — Naming & Configuration

### N2 · Hardcoded localhost URL repeated four times
**Files:** `Header.tsx:13`, `index.tsx:23`, `search.tsx:32`, `product/[id].tsx:7`
**What to look for:** `'http://localhost:4000/graphql'` appears as a magic string in four separate files. Changing the server URL requires four edits. The URL is also exposed to browsers (see F4).
**Clue:** _"How would you change this URL for a staging environment without editing source code?"_
**Fix:** Define `NEXT_PUBLIC_GRAPHQL_URL` in `.env.local`. Use it in one place — the `fetchGraphQL` utility already does this correctly. All call sites should use that utility.

---

## Issues Missing from the Test Suite

Candidates who look at the tests should notice the following gaps (no fix needed — these are discussion points):

| Missing test | Issue it would catch |
|---|---|
| Image `alt` text assertion | Ax6 — empty alt on product images |
| Keyboard interaction test | Ax2 — `<div>` not reachable by Tab |
| `product.price` as `undefined` | Runtime crash in `product.price.toFixed(2)` when price is missing |
| Navigation after card click | `router.push` called with correct URL |
| Cart count updates after add | Integration between `useCart` and `CartIcon` |

---

## Quick-Reference Cheat Sheet

| ID | File | One-line summary |
|---|---|---|
| T1 | multiple | `any` everywhere — no type safety |
| T2 | Header.tsx | `indexOf` instead of `includes` |
| T3 | Header.tsx | `substr` deprecated — use `slice` |
| T4 | Header.tsx, [id].tsx | `var` instead of `const` |
| T5 | Header.tsx | lodash + debounce hook imported, neither used |
| T6 | Header.tsx, search.tsx | derived state synced with `useEffect` |
| T7 | useCart.ts | `totalPrice` is derived state stored in state |
| T8 | multiple | array index as `key` |
| T9 | ProductCard.spec.tsx | `getByTestId` instead of semantic queries |
| T10 | specs | meaningless assertions |
| T11 | multiple | `formatPrice` utility unused, duplicated inline |
| T12 | multiple | `fetchGraphQL` utility unused, fetch copy-pasted 4× |
| R1 | Header.tsx | inline arrow functions — new references every render |
| R3 | Header.tsx | god component |
| R4 | multiple | leftover `console.log` statements |
| R7 | search.tsx | missing `useEffect` dependency — stale search results |
| Ax1 | Header.tsx | search input has no label |
| Ax2 | ProductCard, [id], checkout | `<div>` used as interactive button |
| Ax4 | Header.tsx | no `aria-expanded` / combobox ARIA on search |
| Ax6 | ProductCard, [id] | `alt=""` on meaningful product images |
| Ax7 | checkout.tsx | order confirmation has no `role="alert"` |
| P1 | index.tsx | hero image lazy-loaded — delays LCP |
| P2 | Header.tsx | search fires on every keystroke — no debounce |
| P3 | [id].tsx, checkout.tsx | blocking computation in click handlers |
| P4 | index.tsx | sequential `await` in loop — 4× slower |
| P5 | multiple | no `.catch()` — silent failures |
| P6 | _app.tsx | context value object recreated every render |
| F1 | index.tsx | `getServerSideProps` for static data |
| F2 | [id].tsx | client-side fetch instead of `getStaticProps` |
| F3 | search.tsx | query param read client-side — flash of empty state |
| F4 | api/products.ts | GraphQL URL exposed to browser; proxy route unused |
| F5 | useCart.ts | `localStorage` read at module level during SSR |
| F6 | index.tsx | `Date.now()` in props — hydration mismatch |
| D1 | multiple | over-fetching unused GraphQL fields |
| D3 | [id].tsx | no loading skeleton — layout shift |
| D6 | [id].tsx | product re-fetches on every cart change |
| D7 | [id].tsx | `toLocaleDateString()` — future hydration risk |
| A2 | utils/groupBy.ts | custom `groupBy` vs native `Object.groupBy` |
| A3 | Header.tsx | manual URL string concatenation |
| A4 | _app.tsx | `isomorphic-fetch` polyfill no longer needed |
| A5 | ProductCard.tsx | redundant `React` import + `React.FC` anti-pattern |
| A6 | ProductCard.tsx | `defaultProps` removed in React 19 |
| N2 | multiple | hardcoded `localhost:4000` URL — should be env var |
