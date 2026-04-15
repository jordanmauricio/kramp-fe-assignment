import { GetServerSideProps } from 'next';
import ProductCard from '../components/ProductCard';
import styles from './index.module.css';

// F1: getServerSideProps used for fully static content.
// This data never changes — getStaticProps (or getStaticProps + revalidate for ISR) is correct.
// Every page request hits this function, blocking TTFB unnecessarily.
//
// F6: `timestamp: Date.now()` passed as a prop causes a React hydration mismatch.
// The server renders one timestamp; by the time the client hydrates, the value differs.
// Never pass Date.now(), Math.random(), or any non-deterministic value through SSR props.
export const getServerSideProps: GetServerSideProps = async () => {
  const FEATURED_IDS = ['1', '4', '11', '17'];
  const featured = [];

  // P4: sequential await in a for-loop — each request waits for the previous to finish.
  // The product resolver has an 800ms artificial delay, so 4 products = ~3.2s server time.
  // Fix: Promise.all(FEATURED_IDS.map(id => fetch(...)))
  for (const id of FEATURED_IDS) {
    // T12: fetch block copy-pasted — fetchGraphQL utility exists in utils/ but not used
    // N2: hardcoded URL — should be an environment variable
    try {
      const res = await fetch('http://localhost:4000/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            query GetProduct($id: ID!) {
              product(id: $id) {
                id
                name
                price
                imageUrl
                description
                category
                stock
                createdAt
              }
            }
          `,
          variables: { id },
        }),
      });
      const data = await res.json();
      if (data.data?.product) {
        featured.push(data.data.product);
      }
    } catch (e) {
      // P5: swallows errors silently — no fallback, no logging to an error tracking service
    }
  }

  return {
    props: {
      featured,
      timestamp: Date.now(), // F6: causes hydration mismatch
    },
  };
};

interface HomePageProps {
  featured: any[]; // T1: should be Product[]
  timestamp: number;
}

export default function HomePage({ featured, timestamp }: HomePageProps) {
  return (
    <div>
      <section className={styles.hero}>
        {/*
          P1: LCP element issues —
          1. loading="lazy" on the above-the-fold hero image delays the LCP paint.
             The hero should use loading="eager" (the default) or next/image with priority={true}.
          2. Raw <img> instead of next/image — no automatic optimisation, no WebP conversion,
             no responsive srcSet, no blur placeholder.
          3. Image dimensions are 1200×800 — a large payload for what renders as a banner.
        */}
        <img
          src="https://placehold.co/1200x800/e63329/ffffff?text=Kramp+Webshop"
          alt="Kramp — Your industrial supply partner"
          loading="lazy"
          className={styles.heroImage}
        />
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>Industrial supplies, delivered.</h1>
          <p className={styles.heroSubtitle}>
            Tools, fasteners, safety equipment and power tools for professionals.
          </p>
        </div>
      </section>

      <section className={styles.featured}>
        <div className={styles.featuredHeader}>
          <h2>Featured products</h2>
          {/* F6: timestamp rendered on the server differs from the client — React warning */}
          <p className={styles.timestamp}>
            Last updated: {new Date(timestamp).toLocaleTimeString()}
          </p>
        </div>
        <div className={styles.grid}>
          {featured.map((product, index) => (
            // T8: array index used as key — stable product.id should be used instead
            <ProductCard key={index} product={product} />
          ))}
        </div>
      </section>

      <section className={styles.categories}>
        <h2>Shop by category</h2>
        <div className={styles.categoryGrid}>
          {['Tools', 'Fasteners', 'Safety Equipment', 'Power Tools'].map((cat, index) => (
            // T8: index as key again
            <a key={index} href={`/search?q=${cat}`} className={styles.categoryCard}>
              {cat}
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
