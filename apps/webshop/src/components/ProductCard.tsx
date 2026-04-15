import React from 'react'; // A5: React import not needed in React 17+ with new JSX transform
import { useRouter } from 'next/router';
import styles from './ProductCard.module.css';

// A5: React.FC is considered an anti-pattern since React 18
//     It no longer implicitly includes `children` in props, and using it adds no value
// T2: props typed as `any` — loses all type safety
const ProductCard: React.FC<any> = ({ product, onAddToCart }) => {
  const router = useRouter();

  return (
    <div
      className={styles.card}
      data-testid="product-card"
    >
      {/* P3: raw <img> instead of next/image — no optimisation, no lazy loading control, no blur placeholder */}
      {/* Ax6: alt is empty string — image is invisible to screen readers */}
      <img
        src={product.imageUrl}
        alt=""
        width="300"
        height="200"
        className={styles.image}
      />
      <div className={styles.body}>
        <h3 className={styles.name}>{product.name}</h3>
        {/* T11: formatPrice utility exists in utils/formatPrice.ts but is not imported or used */}
        {/* Price formatting is duplicated inline across ProductCard, [id].tsx, and checkout.tsx */}
        <p className={styles.price} data-testid="product-price">€{product.price.toFixed(2)}</p>
        {/* Ax2: <div> used as an interactive element — not keyboard accessible, no role */}
        <div
          onClick={() => router.push(`/product/${product.id}`)}
          className={styles.button}
        >
          View product
        </div>
      </div>
    </div>
  );
};

// A6: defaultProps on function components is deprecated and removed in React 19.
// Use default parameter values in the function signature instead: `{ product, onAddToCart = () => {} }`
// The cast to `any` here is itself a smell — it's hiding the fact that React.FC no longer supports defaultProps.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(ProductCard as any).defaultProps = {
  onAddToCart: () => {},
};

export default ProductCard;
