import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { groupBy } from '../utils/groupBy'; // A2: custom groupBy instead of native Object.groupBy
import ProductCard from '../components/ProductCard';
import styles from './search.module.css';

// F3: The search query is read from router.query inside a useEffect.
// This causes a flash of empty state on every navigation to this page —
// the server renders with no data, the client mounts, then the effect fires.
// Fix: use getServerSideProps to read the query param server-side and pass as a prop.

export default function SearchPage() {
  const router = useRouter();
  const [results, setResults] = useState<any[]>([]); // T1: any[]
  // T6: filteredResults is derived state — it mirrors results exactly.
  // Should just be: const grouped = groupBy(results, 'category') — no intermediate state needed.
  const [filteredResults, setFilteredResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // R7: missing dependency — router.query.q is not in the dependency array.
  // If the user navigates from /search?q=hammer to /search?q=bolt,
  // this effect won't re-run and stale results are shown.
  useEffect(() => {
    const q = router.query.q as string;
    if (!q) return;

    setIsLoading(true);

    // T12: copy-pasted fetch — fetchGraphQL utility exists in utils/ but not imported
    // N2: hardcoded URL
    // P5: no .catch() — unhandled rejection
    fetch('http://localhost:4000/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `
          query SearchProducts($q: String!) {
            searchProducts(query: $q) {
              id
              name
              price
              imageUrl
              category
              description
              stock
              createdAt
            }
          }
        `,
        variables: { q },
      }),
    })
      .then(res => res.json())
      .then(data => {
        console.log('search results:', data); // R4: leftover console.log
        setResults(data.data.searchProducts);
        setIsLoading(false);
      });
  }, []); // R7: missing [router.query.q] — stale results on navigation

  // T6: useEffect that syncs state to state — "you might not need an effect"
  // filteredResults is always identical to results; just use results directly
  useEffect(() => {
    setFilteredResults(results);
  }, [results]);

  // A2: custom groupBy instead of native Object.groupBy(results, item => item.category)
  const grouped = groupBy(filteredResults, 'category');

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <h1 className={styles.heading}>
          {router.query.q ? `Results for "${router.query.q}"` : 'All products'}
        </h1>

        {isLoading && <p>Loading...</p>}

        {!isLoading && !filteredResults.length && (
          // No role="status" or aria-live — not announced to screen readers
          <p className={styles.empty}>No products found.</p>
        )}

        {Object.keys(grouped).map(category => (
          <section key={category} className={styles.category}>
            <h2 className={styles.categoryTitle}>{category}</h2>
            <div className={styles.grid}>
              {grouped[category].map((product, index) => (
                // T8: array index as key
                <ProductCard key={index} product={product} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
