import { useContext, useEffect, useState } from 'react'; // no useCallback imported — intentional
import { useRouter } from 'next/router';
import Link from 'next/link';
import _ from 'lodash'; // T5: lodash imported but NOT used for debounce — useDebounce hook exists but also unused
import { CartContext } from '../pages/_app';
import { SearchDialog } from './SearchDialog';
import { CartIcon } from './cartIcon';
import { useDebounce } from '../hooks/useDebounce'; // imported but never called below (P2)
import styles from './Header.module.css';

// N2: magic string — should be an environment variable (NEXT_PUBLIC_GRAPHQL_URL)
// T4: var instead of const
var GRAPHQL_URL = 'http://localhost:4000/graphql';

// R3: God component — navigation, search state, dialog, cart display all inline (150+ lines)
export function Header() {
  const router = useRouter();
  const { cart } = useContext(CartContext);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]); // T1: any[]
  const [isOpen, setIsOpen] = useState(false);

  // T6: isOpen is derived state — it should just be `const isOpen = results.length > 0 && query.length > 0`
  // Instead it's managed via a separate useEffect that syncs from results
  useEffect(() => {
    setIsOpen(results.length > 0);
  }, [results]);

  // P2: GraphQL fired on every keystroke — no debounce.
  // useDebounce is imported above and lodash is in package.json, but neither is used here.
  // T12: fetch block copy-pasted — fetchGraphQL utility exists in utils/ but is not imported
  // P5: no .catch() — unhandled rejection if the server is down
  // D1: fetches all product fields (description, stock, createdAt) for a suggestion list that only needs id, name, price, imageUrl
  useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }

    fetch(GRAPHQL_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `
          query Search($q: String!) {
            searchProducts(query: $q) {
              id
              name
              price
              imageUrl
              description
              stock
              createdAt
            }
          }
        `,
        variables: { q: query },
      }),
    })
      .then(res => res.json())
      .then(data => {
        setResults(data.data.searchProducts.slice(0, 5));
      });
  }, [query]); // fires on every single keystroke

  // useEffect for outside-click — leaks an event listener (no cleanup/return)
  // A better approach: use a ref + onBlur on the input, or a native <dialog> element
  useEffect(() => {
    const handleOutsideClick = () => {
      setIsOpen(false);
    };
    document.addEventListener('click', handleOutsideClick);
    // Missing: return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  // A3: manual URL building — should use URLSearchParams
  // R1: inline arrow function — new reference on every render, no useCallback
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && query.trim()) {
      router.push('/search?q=' + encodeURIComponent(query)); // A3
      setIsOpen(false);
    }
  };

  // T2: Array.indexOf instead of Array.includes
  const isActivePage = (path: string) => {
    return router.pathname.indexOf(path) !== -1;
  };

  // T3: String.substr is deprecated — use String.slice instead
  const truncatedQuery = query.substr(0, 30);

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/" className={styles.logo}>
          Kramp
        </Link>

        <nav className={styles.nav}>
          <Link
            href="/"
            className={isActivePage('/') && router.pathname === '/' ? styles.activeLink : styles.navLink}
          >
            Home
          </Link>
          <Link
            href="/search"
            className={isActivePage('/search') ? styles.activeLink : styles.navLink}
          >
            Products
          </Link>
          <Link
            href="/checkout"
            className={isActivePage('/checkout') ? styles.activeLink : styles.navLink}
          >
            Checkout
          </Link>
        </nav>

        <div className={styles.searchWrapper}>
          {/*
            Ax1: input has no associated <label> element and no aria-label attribute.
            Screen readers cannot identify what this field is for.
            Ax4: no aria-expanded, no aria-haspopup, no role="combobox" on the input.
            The dropdown (SearchDialog) is not associated with this control via aria-controls.
          */}
          <input
            type="text"
            value={query}
            placeholder="Search products..."
            className={styles.searchInput}
            // R1: inline arrow functions — new references on every render
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            // Suppress the outside-click handler when interacting with the input
            onClick={e => e.stopPropagation()}
          />
          {/* Show truncated query as a hint — only to demonstrate substr usage (T3) */}
          {truncatedQuery && query.length > 30 && (
            <span className={styles.truncatedHint}>Searching: {truncatedQuery}…</span>
          )}
          {isOpen && (
            <SearchDialog
              results={results}
              // R1: inline arrow — new reference every render
              onSelect={(id: string) => {
                router.push(`/product/${id}`);
                setIsOpen(false);
                setQuery('');
              }}
            />
          )}
        </div>

        <CartIcon count={cart.totalItems} />
      </div>
    </header>
  );
}
