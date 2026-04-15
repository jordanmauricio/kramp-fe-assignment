# Spec: Kramp Frontend Assignment — Webshop

## Objective

Build a webshop as a **tech assignment** for frontend developer candidates. The finished product is a realistic but intentionally flawed codebase. Candidates review the code and identify performance issues, incorrect framework usage, tooling mistakes, accessibility failures, and data-fetching anti-patterns. The app must be fully functional — issues are quality/correctness problems, not build-breakers.

**Target user (of the app):** A shopper browsing products, searching, and checking out.
**Target user (of the assignment):** A mid-to-senior frontend developer candidate reviewing the codebase.

**Candidate evaluation axes:**
1. **Problem Approach** — Do they prioritise by impact? Do they understand user-facing severity?
2. **Technical Decisions** — Do they know the correct fix, not just that something is wrong?
3. **Production Readiness** — Do they think beyond "it works"? (monitoring, loading states, error handling)
4. **Code Quality** — Maintainability, consistency, duplication, naming

---

## Tech Stack

| Layer | Technology |
|---|---|
| Monorepo | NX 22 |
| Frontend | Next.js 16 (Pages Router), React 19, TypeScript |
| Styling | CSS Modules |
| Component dev | Storybook **6** (outdated version — intentional issue; current is v8) |
| Backend | Node.js + graphql-yoga + Pothos |
| Data | Static JSON files (no DB), artificial latency on some resolvers |
| Testing | Jest 30 + React Testing Library |
| Unjustified deps | `lodash` (debounce only), `uuid` (id gen only), `isomorphic-fetch` (polyfill) |

---

## Commands

```bash
# Development
npm run dev:webshop            # Next.js on http://localhost:3000
npm run dev:server             # GraphQL on http://localhost:4000/graphql
npm run storybook              # Storybook on http://localhost:6006

# Testing
npx nx test webshop
npx nx test webshop --coverage

# Build
npx nx build webshop
npx nx build server
```

---

## Project Structure

```
apps/
  server/
    src/
      data/
        products.json          → 20–30 products across 4 categories
      data.ts                  → Data access — reads JSON, filters in-memory (intentional)
      schema.ts                → Pothos GraphQL schema
      main.ts                  → graphql-yoga server (logs full payload, artificial delay)
  webshop/
    src/
      pages/
        index.tsx              → Homepage (SSR via getServerSideProps — should be static)
        search.tsx             → Search results (?q=query) — client-side fetch, wrong
        product/
          [id].tsx             → PDP — good SSR candidate, done client-side instead
        checkout.tsx           → Checkout / cart summary
        _app.tsx               → App shell (cart state, hydration mismatch source)
        api/
          products.ts          → Next.js API route (exists but unused — candidate should notice)
        styles.css             → Global styles
      components/
        Header.tsx             → God component: nav + search + cart + dialog all inline
        SearchDialog.tsx       → Extracted separately but also has issues
        ProductCard.tsx        → Untyped props, raw <img>, div-as-button
        CartIcon.tsx           → Icon-only div, no aria, no keyboard support
      hooks/
        useCart.ts             → Cart hook — direct state mutation pattern
        useDebounce.ts         → Custom debounce reimplementing what lodash (in deps!) already does
      utils/
        formatPrice.ts         → Exists but is NOT used — formatting duplicated inline instead
        fetchGraphQL.ts        → Copy-pasted into 3 pages instead of imported
      stories/
        ProductCard.stories.ts → CSF v2 format (storiesOf API — outdated)
        Header.stories.ts      → Missing args, no controls
      types/
        index.ts               → Some `any`, some good types — inconsistent
    specs/
      index.spec.tsx           → Smoke test only; uses getByTestId everywhere
      ProductCard.spec.tsx     → Tests implementation detail (checks internal state)
```

---

## Pages & Features

### Homepage `/`
- Global header (all pages)
- Hero section: large unoptimised image (LCP issue), static copy
- Featured products grid: hardcoded IDs, each fetched individually in a loop

### Search (in header)
- Typing fires GraphQL on every keystroke (no debounce — despite `lodash` being installed)
- Dropdown shows up to 5 suggestions; selecting → `/product/[id]`
- Enter → `/search?q=term`
- Outside click closes dialog — implemented with a `useEffect` + event listener instead of native `dialog` element or `onBlur`

### Search Results `/search?q=term`
- Reads `q` from router query client-side (should use `getServerSideProps`)
- Renders list with array index as `key` instead of product ID
- Empty state present but inaccessible (no `role="status"`, no `aria-live`)

### Product Detail Page `/product/[id]`
- Fetched client-side despite being static, cacheable data
- "Add to cart" is a `<div onClick>` — not a `<button>`
- No keyboard support, no focus management after add
- Re-fetches product even if it was already in search results (no shared cache)
- Artificial 800ms server delay — no loading skeleton (layout shift, spinner only)

### Checkout `/checkout`
- Cart items listed with price formatted inline (duplicates logic from ProductCard, [id].tsx)
- "Place order" button — synchronous handler blocks main thread calculating totals
- No `aria-live` announcement when order is confirmed

---

## Data Model

### Product (JSON + GraphQL)
```ts
interface Product {
  id: string;
  name: string;
  description: string;
  price: number;       // euros
  category: string;
  imageUrl: string;    // large unoptimised URL (e.g. unsplash, no sizing params)
  stock: number;
  createdAt: string;   // ISO string — misused as Date.now() in one place
}
```

### Cart Item (client-side only)
```ts
interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}
```

### GraphQL Queries
```graphql
query GetProduct($id: ID!) {
  product(id: $id) { id name description price category imageUrl stock createdAt }
}

query SearchProducts($query: String!) {
  # No input validation — empty string returns all products
  searchProducts(query: $query) { id name price imageUrl }
}

query GetFeaturedProducts($ids: [ID!]!) {
  # Intentionally not implemented — each page calls product() in a loop instead
  product(id: $id) { id name price imageUrl }
}
```

---

## Intentional Issues Catalogue

### 1. Performance

| ID | Issue | Correct Fix | Location |
|---|---|---|---|
| P1 | Hero image is a full-resolution JPEG (~2MB), no `width`/`height`, loaded with `<img loading="lazy">` — kills LCP | `next/image` with `priority`, correct sizing | `index.tsx` |
| P2 | Search input fires GraphQL on every `onChange` — `lodash` is in `package.json` but not used for debounce | Use `lodash.debounce` or native `useDebounce` with `AbortController` | `Header.tsx` |
| P3 | "Add to cart" handler runs a synchronous `.reduce()` over the full cart on the main thread before state update | Yield to main with `scheduler.yield()` or `setTimeout(0)` before heavy work | `checkout.tsx`, `useCart.ts` |
| P4 | `Promise.all` not used — featured products fetched sequentially in a `for` loop with `await` inside | `Promise.all(ids.map(...))` | `index.tsx` |
| P5 | Unhandled promise rejection — `.then()` chain with no `.catch()`, no try/catch on async fetch | Proper error handling pattern | `search.tsx` |
| P6 | Cart context value is an object literal created inline — new reference on every render, causes all consumers to re-render | `useMemo` on context value, or split into separate state/dispatch contexts | `_app.tsx` |
| P7 | `isomorphic-fetch` in `package.json` — `fetch` has been globally available in Node 18+ and all modern browsers | Remove the package | `package.json` |

### 2. Tooling

| ID | Issue | Correct Fix | Location |
|---|---|---|---|
| T1 | Storybook stories use old CSF v2 `storiesOf()` API — deprecated since Storybook 6, removed in v8 | Migrate to CSF3 (`export default {}` + named exports) | `stories/*.stories.ts` |
| T2 | `indexOf` used to check array membership (`arr.indexOf(x) !== -1`) | `arr.includes(x)` | `utils/`, `Header.tsx` |
| T3 | `substr()` used for string slicing — deprecated in favour of `slice()` | `str.slice(start, end)` | scattered |
| T4 | `uuid` package used to generate IDs — `crypto.randomUUID()` is native in all modern browsers and Node 16+ | Remove `uuid`, use `crypto.randomUUID()` | `useCart.ts` |
| T5 | `useDebounce.ts` hook reimplements debounce from scratch — yet `lodash` is already a dependency | Either use `lodash.debounce` or remove lodash and use the hook | `hooks/useDebounce.ts` |
| T6 | Multiple `useEffect`s that derive state from state (`setFilteredItems` inside effect watching `items`) — "you might not need an effect" | Compute derived values inline during render | `search.tsx`, `Header.tsx` |
| T7 | `useEffect` used to sync two pieces of state (`useEffect([count]) => setLabel(...)`) | Derive `label` from `count` directly | `CartIcon.tsx` |
| T8 | React list keys are array indexes — breaks reconciliation on reorder/filter | Use stable `product.id` as key; understand `useId()` for generated UI elements | `search.tsx`, `index.tsx` |
| T9 | Tests use `getByTestId` everywhere instead of semantic queries (`getByRole`, `getByLabelText`) | Use accessible queries; `getByTestId` is a last resort | `specs/ProductCard.spec.tsx` |
| T10 | Test asserts on internal implementation (`expect(component.state.isOpen).toBe(true)`) — not user-visible behaviour | Test what the user sees, not internal state | `specs/index.spec.tsx` |
| T11 | `formatPrice` utility exists in `utils/` but is never imported — price formatting is copy-pasted inline across 3 files | Import and use the existing utility | `ProductCard.tsx`, `[id].tsx`, `checkout.tsx` |
| T12 | `fetchGraphQL` utility copy-pasted into each page component instead of being imported from `utils/` | Import from shared util | `index.tsx`, `search.tsx`, `[id].tsx` |

### 3. Framework Understanding (Next.js / Pages Router)

| ID | Issue | Correct Fix | Location |
|---|---|---|---|
| F1 | Homepage uses `getServerSideProps` to fetch featured product IDs — this is static data, runs on every request | `getStaticProps` (or `getStaticProps` + `revalidate` for ISR) | `index.tsx` |
| F2 | PDP (`/product/[id]`) fetches data client-side in `useEffect` — ideal candidate for `getStaticProps` + `getStaticPaths` | `getStaticProps` + `getStaticPaths` with fallback | `product/[id].tsx` |
| F3 | Search results page reads `router.query.q` in `useEffect` — causes flash of empty state on load | Can use `getServerSideProps` to read query param and pass as prop | `search.tsx` |
| F4 | A Next.js API route (`/api/products.ts`) exists but is never used — pages call the GraphQL server directly from the client, exposing the backend URL | Use the API route as a proxy; don't expose `localhost:4000` in client code | `pages/api/products.ts` |
| F5 | `_app.tsx` initialises cart from `localStorage` synchronously — causes hydration mismatch because server renders empty cart | Initialise in `useEffect` only (client-side), or use `suppressHydrationWarning` with care | `_app.tsx` |
| F6 | `getServerSideProps` on homepage passes `timestamp: Date.now()` as a prop — server and client values differ, React warns about hydration mismatch | Never pass `Date.now()` or random values through SSR props | `index.tsx` |

### 4. AI Gotchas

| ID | Issue | Correct Fix | Location |
|---|---|---|---|
| A1 | Storybook **6** is installed (`@storybook/react@6.x`) and stories use the CSF v2 `storiesOf()` API — both the version and the story format are outdated; Storybook 8 + CSF3 is current | Upgrade to Storybook 8; migrate stories to CSF3 with `satisfies Meta<typeof Component>` | `package.json`, `stories/` |
| A2 | Custom `groupBy` utility implemented from scratch — `Object.groupBy()` is native in V8 since Node 21 / Chrome 117 | Use `Object.groupBy()` | `utils/` |
| A3 | Custom URL query string builder (`'?q=' + encodeURIComponent(term)`) instead of `URLSearchParams` | `new URLSearchParams({ q: term }).toString()` | `Header.tsx` |
| A4 | `isomorphic-fetch` polyfill — `fetch` is global in Node 18+ and all evergreen browsers | Remove the package | `package.json` |
| A5 | `React.FC` type used on components — considered an anti-pattern since React 18 (removes `children` from implicit props) | Type props explicitly; don't use `React.FC` | multiple components |
| A6 | `defaultProps` on a function component — deprecated and removed in React 19 | Use default parameter values in function signature | `ProductCard.tsx` |

### 5. Data Fetching / Caching / GraphQL

| ID | Issue | Correct Fix | Location |
|---|---|---|---|
| D1 | PDP fetches full product object (including `description`, `stock`, `createdAt`) in the search suggestion query — over-fetching causes slower TTFB for autocomplete | Request only `id`, `name`, `imageUrl` in the search query | `schema.ts`, `Header.tsx` |
| D2 | After navigating from search results to PDP, the same product data is re-fetched from the server — no shared cache | Cache responses (SWR, React Query, or manual `useRef` cache); reuse data already in memory | `product/[id].tsx` |
| D3 | GraphQL server has an artificial 800ms delay on `product()` resolver — client shows a spinner but the page has no layout skeleton, causing severe CLS | Add skeleton loaders matching final layout dimensions | `product/[id].tsx` |
| D4 | `searchProducts` resolver loads all products from JSON, then filters with `Array.filter()` in JS on every request — O(n) per keystroke | At minimum, note this is a linear scan; correct fix is an index or DB query | `schema.ts` / `data.ts` |
| D5 | No validation on `query` arg — empty string returns the entire catalogue; `null` throws a runtime error | Guard with `if (!query?.trim()) return []` | `schema.ts` |
| D6 | After cart is updated, the PDP re-fetches the product from the server (a `useEffect` depends on `cart`) — the cart is unrelated to the product data | Remove incorrect dependency from `useEffect` dep array | `product/[id].tsx` |
| D7 | `createdAt` field rendered directly from server response as `new Date(product.createdAt).toLocaleDateString()` — produces different output on server vs client (locale/timezone), hydration mismatch | Format dates only on the client, or normalise to a locale-independent format in SSR | `product/[id].tsx` |

### 6. Accessibility

| ID | Issue | Correct Fix | Location |
|---|---|---|---|
| Ax1 | Search input has no `<label>` and no `aria-label` or `aria-labelledby` | Add visible label or `aria-label="Search products"` | `Header.tsx` |
| Ax2 | "Add to cart" is a `<div onClick={...}>` — not keyboard accessible, not announced as interactive | Replace with `<button type="button">` | `ProductCard.tsx`, `[id].tsx` |
| Ax3 | Cart icon (`CartIcon.tsx`) is a `<div>` with an `onClick` — no `role`, no `aria-label`, no keyboard support | `<button aria-label="Shopping cart, {n} items">` with `<Link>` | `CartIcon.tsx` |
| Ax4 | Search dropdown has no `role="listbox"`, options have no `role="option"`, trigger has no `aria-expanded` / `aria-haspopup` | Implement ARIA combobox pattern; or use native `<dialog>` | `SearchDialog.tsx` |
| Ax5 | Cart badge count updates are not announced to screen readers — number changes silently in DOM | Wrap badge in `<span aria-live="polite" aria-atomic="true">` | `CartIcon.tsx` |
| Ax6 | Product images in the grid have `alt=""` (empty) or no `alt` attribute at all | Descriptive `alt` text from product name | `ProductCard.tsx` |
| Ax7 | "Place order" confirmation message rendered with `useState` — no `role="alert"` or `aria-live`, not announced | `role="alert"` or `aria-live="assertive"` on the confirmation container | `checkout.tsx` |

---

## Code Style (Intentionally Inconsistent)

Baseline example — deliberately mixes patterns:

```tsx
// product/[id].tsx — exhibits F2, P3, T2, Ax2, D7, T12
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { CartItem } from '../types'; // sometimes used, sometimes `any`

var GRAPHQL_URL = 'http://localhost:4000/graphql'; // should be env var; var not const

export default function ProductPage() {
  const router = useRouter();
  const [product, setProduct] = useState<any>(null); // T1-adjacent: any
  const [cart, setCart] = useState<CartItem[]>([]);

  // F2: should be getStaticProps
  useEffect(() => {
    // T12: copy-pasted fetch utility
    fetch(GRAPHQL_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `query GetProduct($id: ID!) {
          product(id: $id) { id name description price category imageUrl stock createdAt }
        }`, // D1: fetches createdAt, stock — not needed here
        variables: { id: router.query.id },
      }),
    })
      .then(res => res.json()) // P5: no .catch()
      .then(data => {
        console.log('product', data); // leftover debug log
        setProduct(data.data.product);
      });
  }, [cart]); // D6: cart in deps causes re-fetch on add-to-cart

  const handleAddToCart = () => {
    // P3: synchronous heavy work on main thread
    const newCart = [...cart, { productId: product.id, name: product.name, price: product.price, quantity: 1 }];
    const total = newCart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    console.log('new total', total);
    setCart(newCart);
  };

  if (!product) return <div>Loading...</div>; // D3: no skeleton

  return (
    <div>
      <img src={product.imageUrl} alt="" /> {/* Ax6, P1: raw img, empty alt */}
      <h1>{product.name}</h1>
      <p>€{product.price.toFixed(2)}</p> {/* T11: duplicates formatPrice */}
      {/* D7: hydration mismatch risk */}
      <small>Added: {new Date(product.createdAt).toLocaleDateString()}</small>
      {/* Ax2: div as interactive element */}
      <div onClick={handleAddToCart} style={{ cursor: 'pointer', background: '#e63329', color: 'white', padding: '12px' }}>
        Add to cart
      </div>
    </div>
  );
}
```

---

## Storybook Issues (Outdated Version + CSF v2 Format)

Storybook 6 is installed. Stories use the `storiesOf` API that was removed in Storybook 8. A candidate should catch **both** — the package version and the story format.

```ts
// components/ProductCard.stories.ts — A1
// @storybook/react is pinned to ^6.5.0 in package.json
import { storiesOf } from '@storybook/react'; // storiesOf removed in Storybook 7+
import { ProductCard } from './ProductCard';

storiesOf('ProductCard', module)
  .add('default', () => <ProductCard id="1" />)
  .add('out of stock', () => <ProductCard id="2" outOfStock />);
// No args, no controls, no play functions, no autodocs — none of the CSF3 features
```

The correct fix is a two-step upgrade: install Storybook 8 and migrate stories to CSF3:

```ts
// Correct CSF3 format (for reference — not in the codebase)
import type { Meta, StoryObj } from '@storybook/react';
import { ProductCard } from './ProductCard';

const meta = {
  component: ProductCard,
} satisfies Meta<typeof ProductCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { id: '1' } };
export const OutOfStock: Story = { args: { id: '2', outOfStock: true } };
```

---

## Testing Issues

```tsx
// specs/ProductCard.spec.tsx — T9, T10
it('adds item to cart', () => {
  const { getByTestId } = render(<ProductCard id="1" />);
  fireEvent.click(getByTestId('add-to-cart-btn')); // T9: testId over role
  // T10: tests internal state, not user-visible outcome
  expect(getByTestId('cart-count').textContent).toBe('1');
});
// No assertion on what the user actually sees or experiences
// No test for keyboard interaction (Ax2 would be caught here)
```

---

## GraphQL Server Issues

```ts
// schema.ts — D4, D5, B3
builder.queryField('searchProducts', t =>
  t.field({
    type: [Product],
    args: { query: t.arg.string({ required: true }) },
    resolve: async (_root, args) => {
      console.log('search request:', args); // B3: logs every request
      // D4: full scan on every keystroke
      const all = await getAllProducts();
      // D5: empty string returns everything
      return all.filter(p =>
        p.name.indexOf(args.query) !== -1 // T2: indexOf instead of includes
      );
    },
  })
);
```

Artificial delay in product resolver:
```ts
resolve: async (_root, args) => {
  await new Promise(r => setTimeout(r, 800)); // D3: artificial slowness, no UX mitigation
  return getProductById(args.id);
}
```

---

## Unjustified Dependencies

| Package | In `package.json` | Justification | What to do |
|---|---|---|---|
| `lodash` | Yes | Used only in one `_.debounce` call — but `useDebounce.ts` reimplements it anyway | Remove lodash; keep the hook — or vice versa |
| `uuid` | Yes | Used in `useCart.ts` for cart item IDs | Remove; use `crypto.randomUUID()` |
| `isomorphic-fetch` | Yes | Was needed in Node <18; project uses Node 20+ | Remove entirely |

---

## Success Criteria

- [ ] All four pages render without runtime errors in the browser
- [ ] Search dialog opens, suggestions appear, navigation works
- [ ] Add-to-cart updates the header badge
- [ ] Checkout shows correct cart summary
- [ ] GraphQL server returns data from JSON files (with artificial delay on product resolver)
- [ ] Storybook starts and displays stories (in old CSF v2 format)
- [ ] All catalogued issues (P1–P7, T1–T12, F1–F6, A1–A6, D1–D7, Ax1–Ax7) are present in the codebase
- [ ] `nx build webshop` succeeds — no TypeScript compile errors (issues are quality/runtime, not type errors)
- [ ] No real security vulnerabilities introduced

---

## Confirmed Decisions

| Decision | Resolution |
|---|---|
| Product images | `https://placehold.co/1200x800` — large dimensions, no compression. Makes LCP measurably bad without external CDN dependency. |
| Categories | Tools, Fasteners, Safety Equipment, Power Tools |
| Cart persistence | `localStorage` — read synchronously in `_app.tsx` to trigger hydration mismatch (F5). Server renders empty cart; client hydrates with stored cart. |
| Storybook | Install `@storybook/react@6.x` (outdated version is itself the issue, not just the story format). Both the version and the `storiesOf` API format must be caught and upgraded. |
| Assignment brief | Provided separately by the hiring team — not part of this codebase. |
