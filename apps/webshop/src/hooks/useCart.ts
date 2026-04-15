import { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid'; // T4: crypto.randomUUID() is native — uuid package not needed
import { CartItem } from '../types';

// F5: Reading localStorage synchronously here — this runs during SSR on the server
// where localStorage doesn't exist. The typeof window check prevents a crash,
// but the server renders empty cart while the client hydrates with stored cart → mismatch.
const stored: CartItem[] =
  typeof window !== 'undefined'
    ? JSON.parse(localStorage.getItem('cart') || '[]')
    : [];

export function useCart() {
  const [cart, setCart] = useState<CartItem[]>(stored);
  // T7: totalPrice is derived state — should be computed inline, not via useEffect + setState
  const [totalPrice, setTotalPrice] = useState<number>(0);

  // T7: this effect exists purely to sync derived state — remove in favour of inline computation
  useEffect(() => {
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    setTotalPrice(total);
  }, [cart]);

  // Persist to localStorage — effect has no cleanup
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('cart', JSON.stringify(cart));
    }
  }); // Missing dependency array — runs on EVERY render, not just when cart changes

  // R1: addToCart recreated on every render — no useCallback
  const addToCart = (item: Omit<CartItem, 'productId'> & { productId: string }) => {
    // T4: uuidv4() used to stamp each cart entry — crypto.randomUUID() is the native equivalent
    const id = uuidv4();
    console.log('adding to cart, entry id:', id);

    setCart(prev => {
      const existing = prev.find(i => i.productId === item.productId);
      if (existing) {
        return prev.map(i =>
          i.productId === item.productId ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...item }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(i => i.productId !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return { cart, addToCart, removeFromCart, clearCart, totalItems, totalPrice };
}
