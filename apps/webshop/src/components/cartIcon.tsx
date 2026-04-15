import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import styles from './cartIcon.module.css';

// N1: file is named cartIcon.tsx (camelCase) while other components use PascalCase
// Ax3: outer element is a <div> — not a <button>, not keyboard accessible,
//       no role="button", tab users cannot reach the cart
// Ax5: badge count updates silently — no aria-live region announced to screen readers
// T7:  label is derived state stored in useState + synced via useEffect.
//       It should just be: const label = count > 0 ? `Cart (${count})` : 'Cart'

interface CartIconProps {
  count: number;
}

export function CartIcon({ count }: CartIconProps) {
  const router = useRouter();
  const [label, setLabel] = useState('Cart');

  // T7: useEffect used to sync derived state — this is the "you might not need an effect" pattern
  // The label is purely a function of count and should be computed inline
  useEffect(() => {
    if (count > 0) {
      setLabel(`Cart (${count})`);
    } else {
      setLabel('Cart');
    }
  }, [count]);

  return (
    // Ax3: should be <button> or <Link> — div is not interactive by default
    <div
      onClick={() => router.push('/checkout')}
      className={styles.cartIcon}
    >
      <span className={styles.label}>{label}</span>
      {/* Ax5: count change is not announced — wrap in aria-live="polite" aria-atomic="true" */}
      {count > 0 && (
        <span className={styles.badge}>{count}</span>
      )}
    </div>
  );
}
