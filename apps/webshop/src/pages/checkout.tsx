import { useContext, useState } from 'react';
import Link from 'next/link';
import { CartContext } from './_app';
import styles from './checkout.module.css';

export default function CheckoutPage() {
  const { cart, clearCart } = useContext(CartContext) as any; // T1
  const [confirmed, setConfirmed] = useState(false);

  // P3: synchronous heavy computation on the main thread in the click handler.
  // Iterates the cart array multiple times before any state update.
  // For large carts this blocks interaction → INP regression.
  // Fix: use scheduler.yield() before heavy work, or move computation off the critical path.
  const handlePlaceOrder = () => {
    const items = cart.cart || [];

    // Multiple passes over the same array — could be one reduce
    const subtotals = items.map((item: any) => item.price * item.quantity);
    const total = subtotals.reduce((a: number, b: number) => a + b, 0);
    const tax = subtotals.reduce((a: number, b: number) => a + b * 0.21, 0);
    const shipping = items.reduce(
      (acc: number, item: any) => acc + (item.quantity > 5 ? 0 : 4.95),
      0
    );

    console.log('order total:', total, '| VAT:', tax.toFixed(2), '| shipping:', shipping); // R4

    clearCart();
    setConfirmed(true);
  };

  if (confirmed) {
    return (
      // Ax7: confirmation renders as a plain <div> with no role="alert" or aria-live.
      // Screen readers do not announce this change — the user has no feedback that the order succeeded.
      // Fix: add role="alert" or wrap in an aria-live="assertive" region.
      <div className={styles.confirmation}>
        <h1>Order placed!</h1>
        <p>Thank you for your order. You will receive a confirmation email shortly.</p>
        <Link href="/">Continue shopping</Link>
      </div>
    );
  }

  const items = cart.cart || [];

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <h1 className={styles.heading}>Checkout</h1>

        {items.length === 0 ? (
          <div className={styles.empty}>
            <p>Your cart is empty.</p>
            <Link href="/" className={styles.continueLink}>Continue shopping</Link>
          </div>
        ) : (
          <>
            <div className={styles.items}>
              {items.map((item: any, index: number) => (
                // T8: index as key — stable productId should be used
                <div key={index} className={styles.item}>
                  <span className={styles.itemName}>{item.name}</span>
                  <span className={styles.itemQty}>×{item.quantity}</span>
                  {/* T11: formatPrice utility unused — inline formatting duplicated */}
                  <span className={styles.itemPrice}>
                    €{(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className={styles.summary}>
              {/* T11: total computed inline again — same logic as handlePlaceOrder */}
              <div className={styles.total}>
                <span>Total</span>
                <strong>
                  €{items
                    .reduce((sum: number, item: any) => sum + item.price * item.quantity, 0)
                    .toFixed(2)}
                </strong>
              </div>
            </div>

            <div className={styles.actions}>
              {/*
                Ax2: <div> as the primary action — not a <button>, not in a <form>.
                No keyboard access, no accessible role, no type attribute.
                Fix: <button type="button" onClick={handlePlaceOrder}> inside a <form onSubmit>
              */}
              <div
                className={styles.placeOrderButton}
                onClick={handlePlaceOrder}
              >
                Place order
              </div>
              <Link href="/" className={styles.continueLink}>Continue shopping</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
