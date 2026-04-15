// A1: CSF v2 format using the deprecated storiesOf() API.
// storiesOf was removed in Storybook 7 and no longer works in Storybook 8.
// The correct format is CSF3 with named exports and a default export `meta` object.
//
// What's missing compared to CSF3:
// - No `args` — props cannot be changed interactively in the Controls panel
// - No `play` functions — no interaction testing
// - No autodocs — no generated documentation page
// - No `argTypes` — no type-aware control generation
//
// Correct CSF3 equivalent would be:
//
// import type { Meta, StoryObj } from '@storybook/react';
// const meta = { component: ProductCard } satisfies Meta<typeof ProductCard>;
// export default meta;
// export const Default: StoryObj<typeof meta> = { args: { product: mockProduct } };

import { storiesOf } from '@storybook/react'; // removed in Storybook 7+
import ProductCard from '../components/ProductCard';

const mockProduct = {
  id: '1',
  name: 'Heavy Duty Hammer',
  price: 18.99,
  imageUrl: 'https://placehold.co/300x200',
  description: 'A solid 500g steel hammer for demanding workshop tasks.',
  category: 'Tools',
  stock: 142,
  createdAt: '2024-01-15T10:00:00.000Z',
};

const expensiveProduct = {
  id: '17',
  name: 'Cordless Drill/Driver 18V',
  price: 119.00,
  imageUrl: 'https://placehold.co/300x200',
  description: '18V brushless cordless drill/driver with 2×2Ah batteries.',
  category: 'Power Tools',
  stock: 62,
  createdAt: '2024-01-18T10:00:00.000Z',
};

storiesOf('ProductCard', module)
  .add('default', () => <ProductCard product={mockProduct} />)
  .add('expensive item', () => <ProductCard product={expensiveProduct} />)
  .add('out of stock', () => <ProductCard product={{ ...mockProduct, stock: 0 }} />);
