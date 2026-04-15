import SchemaBuilder from '@pothos/core';
import { User, Product, getProductById, searchProducts } from './data';

export const builder = new SchemaBuilder<{
  Objects: { Product: Product };
}>({});

// --- Existing User type ---
builder.objectType(User, {
  name: 'User',
  fields: t => ({
    id: t.exposeID('id'),
    firstName: t.exposeString('firstName'),
    lastName: t.exposeString('lastName'),
    fullName: t.string({
      resolve: user => `${user.firstName} ${user.lastName}`,
    }),
  }),
});

// --- Product type (plain object from JSON, not a class) ---
const ProductRef = builder.objectRef<Product>('Product');
ProductRef.implement({
  fields: t => ({
    id: t.exposeID('id'),
    name: t.exposeString('name'),
    description: t.exposeString('description'),
    price: t.exposeFloat('price'),
    category: t.exposeString('category'),
    imageUrl: t.exposeString('imageUrl'),
    stock: t.exposeInt('stock'),
    createdAt: t.exposeString('createdAt'),
  }),
});

builder.queryType({
  fields: t => ({
    // --- Existing user query ---
    user: t.field({
      type: User,
      nullable: true,
      args: {
        id: t.arg.id({ required: true }),
      },
      resolve: (_root, args) => new User(args.id),
    }),

    // --- product(id) — 800ms artificial delay, no error handling ---
    // D3: slow resolver with no skeleton loader on the frontend
    // B4: returns all fields even when only a subset is needed for search suggestions
    product: t.field({
      type: ProductRef,
      nullable: true,
      args: {
        id: t.arg.id({ required: true }),
      },
      resolve: async (_root, args) => {
        // D3: artificial latency — simulates a slow database or remote API
        await new Promise(r => setTimeout(r, 800));
        console.log('product resolver called with id:', args.id);
        return getProductById(args.id) ?? null;
      },
    }),

    // --- searchProducts — no input validation, logs everything ---
    // D4: delegates to O(n) in-memory scan on every request
    // D5: empty string returns the entire catalogue; null would throw
    // B3: logs full args on every keystroke
    searchProducts: t.field({
      type: [ProductRef],
      args: {
        query: t.arg.string({ required: true }),
      },
      resolve: (_root, args) => {
        console.log('searchProducts resolver called with:', args);
        // D5: no guard — empty string returns all 24 products
        return searchProducts(args.query);
      },
    }),

    // --- products(ids) — intentionally not used by the frontend ---
    // P4: homepage calls product() in a sequential loop instead of this batch resolver
    products: t.field({
      type: [ProductRef],
      args: {
        ids: t.arg.idList({ required: true }),
      },
      resolve: async (_root, args) => {
        // P4: each ID incurs full 800ms delay — sequential, not batched
        const results: Product[] = [];
        for (const id of args.ids) {
          await new Promise(r => setTimeout(r, 800));
          const product = getProductById(id);
          if (product) results.push(product);
        }
        return results;
      },
    }),
  }),
});

export const schema = builder.toSchema();
