// T11: This utility exists but is never imported anywhere.
// Instead, price formatting is duplicated inline across ProductCard, [id].tsx, and checkout.tsx
// as `€${product.price.toFixed(2)}`

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
  }).format(price);
}
