import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import ProductCard from '../src/components/ProductCard';

// Mock next/router — ProductCard uses useRouter internally
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
  }),
}));

const mockProduct = {
  id: '1',
  name: 'Heavy Duty Hammer',
  price: 18.99,
  imageUrl: 'https://placehold.co/300x200',
  description: 'A solid 500g steel hammer.',
  category: 'Tools',
  stock: 142,
  createdAt: '2024-01-15T10:00:00.000Z',
};

describe('ProductCard', () => {
  // T9: getByTestId used throughout — requires data-testid attributes on the component.
  // Semantic queries like getByRole('img', { name: /hammer/i }) or getByText('Heavy Duty Hammer')
  // would be more resilient and test user-visible behaviour rather than implementation details.

  it('renders the product card', () => {
    const { getByTestId } = render(<ProductCard product={mockProduct} />);
    // No meaningful assertion — just checks the element exists
    expect(getByTestId('product-card')).toBeTruthy();
  });

  it('displays the correct price', () => {
    const { getByTestId } = render(<ProductCard product={mockProduct} />);
    // T10: tests the exact internal format of the price string.
    // If formatPrice is ever updated or the currency symbol changes, this test breaks.
    // A better test: expect(screen.getByText(/18\.99/)).toBeInTheDocument()
    expect(getByTestId('product-price').innerHTML).toBe('€18.99');
  });

  it('renders the product name', () => {
    const { getByTestId } = render(<ProductCard product={mockProduct} />);
    // T9: getByTestId instead of getByRole('heading') or getByText()
    // Also relies on data-testid="product-card" to find a container — then queries children
    expect(getByTestId('product-card').textContent).toContain('Heavy Duty Hammer');
  });

  // Missing tests (issues a candidate should notice):
  // - No test for image alt text (would catch Ax6)
  // - No test for keyboard accessibility of the "View product" div (would catch Ax2)
  // - No test for what happens when product.price is undefined (would catch T2)
  // - No test for navigation behaviour when card is clicked
  // - No test for screen reader announcements
});
