import { useRouter } from 'next/router';
import { useContext, useEffect, useState } from 'react';
import { CartContext } from '../_app';
import styles from './[id].module.css';

// N2: magic string + T4: var instead of const
var GRAPHQL_URL = 'http://localhost:4000/graphql';

// F2: This page is a perfect candidate for getStaticProps + getStaticPaths.
// Product data is static (served from a JSON file). Using client-side fetch means:
// - No SEO — crawlers see an empty loading state
// - Slower perceived load — user sees "Loading..." before any content
// - No ISR possible — can't revalidate in the background
// Fix: getStaticProps({ params }) + getStaticPaths() with fallback: 'blocking'

export default function ProductPage() {
  const router = useRouter();
  const { cart } = useContext(CartContext) as any; // T1: cast to any
  const [product, setProduct] = useState<any>(null); // T1: any

  // D6: `cart` is in the dependency array — this effect re-runs every time the cart changes.
  // Adding a product to cart triggers a full product re-fetch from the server.
  // The cart state is completely unrelated to the product data.
  // Fix: remove `cart` from the dependency array (it should just be [router.query.id]).
  //
  // F2: should be getStaticProps — this entire effect shouldn't exist on this page
  // T12: fetch copy-pasted — fetchGraphQL utility in utils/ is not used
  // P5: no .catch() — network errors are silently swallowed
  useEffect(() => {
    if (!router.query.id) return;

    fetch(GRAPHQL_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        // D1: fetches all fields — stock and createdAt are not needed on this page
        query: `
          query GetProduct($id: ID!) {
            product(id: $id) {
              id
              name
              description
              price
              category
              imageUrl
              stock
              createdAt
            }
          }
        `,
        variables: { id: router.query.id },
      }),
    })
      .then(res => res.json())
      .then(data => {
        console.log('product loaded:', data); // R4: leftover console.log
        setProduct(data.data.product);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart]); // D6: wrong dependency — causes re-fetch on every cart update

  // P3: synchronous work on the main thread in the click handler.
  // The reduce iterates the full cart + new item before updating state.
  // For large carts this blocks input responsiveness (INP regression).
  // Fix: use scheduler.yield() before the heavy computation, or defer with setTimeout(0).
  const handleAddToCart = () => {
    if (!product) return;

    // Simulate expensive synchronous computation before updating state
    const currentItems = [...(cart.cart || []), {
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
    }];
    // Blocking loop — calculates total synchronously on the main thread
    let runningTotal = 0;
    for (let i = 0; i < currentItems.length; i++) {
      runningTotal += currentItems[i].price * currentItems[i].quantity;
    }
    console.log('cart total after add:', runningTotal); // R4

    cart.addToCart({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
    });
  };

  // D3: plain text loading state — no skeleton, no layout reservation.
  // The page jumps from "Loading..." to full content → Cumulative Layout Shift (CLS).
  if (!product) {
    return (
      <div className={styles.page}>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <div className={styles.imageWrapper}>
          {/*
            P3 / Ax6: raw <img> with empty alt attribute.
            - No next/image → no optimisation, no WebP, no responsive sizes
            - alt="" makes this image invisible to screen readers
            - T3: non-null assertion on product — product is guarded above but TS doesn't know
          */}
          <img
            src={product!.imageUrl}
            alt=""
            className={styles.image}
          />
        </div>
        <div className={styles.details}>
          <p className={styles.category}>{product!.category}</p>
          <h1 className={styles.name}>{product!.name}</h1>
          {/* T11: formatPrice utility in utils/ is unused — inline formatting duplicated */}
          <p className={styles.price}>€{product!.price.toFixed(2)}</p>
          <p className={styles.description}>{product!.description}</p>
          {/* D7: toLocaleDateString() produces different output on server vs client (locale/timezone).
              If this page ever moves to SSR, this will cause a hydration mismatch.
              Fix: format dates only on the client inside a useEffect, or use a locale-stable format. */}
          <p className={styles.meta}>
            Listed: {new Date(product!.createdAt).toLocaleDateString()}
            {' · '}
            {product!.stock} in stock
          </p>
          {/*
            Ax2: <div> used as the primary call-to-action.
            - Not focusable by keyboard (no tabIndex, no role="button")
            - No accessible name announced by screen readers
            - No keyboard event handler (Enter/Space)
            Fix: replace with <button type="button">
          */}
          <div
            className={styles.addToCart}
            onClick={handleAddToCart}
          >
            Add to cart
          </div>
        </div>
      </div>
    </div>
  );
}
