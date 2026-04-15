// D4: getAllProducts() is called on every resolver invocation — no caching, no index
// Each function re-reads and re-parses the full JSON array from disk

// Using require() for JSON — old-school pattern, import would be cleaner
const productsData = require('./data/products.json');

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  stock: number;
  createdAt: string;
}

export class User {
  public firstName: string;
  public lastName: string;
  public id: string;

  constructor(id: string) {
    this.id = id;
    this.firstName = 'John';
    this.lastName = 'Doe';
  }
}

// D4: loads full array on every call — no memoisation, no caching
export function getAllProducts(): Product[] {
  return productsData as Product[];
}

// D4: calls getAllProducts() (full array load) then scans with .find()
export function getProductById(id: string): Product | undefined {
  const all = getAllProducts();
  return all.find(p => p.id === id);
}

// D4: full O(n) scan on every search request — no index
// T2: uses indexOf instead of includes
export function searchProducts(query: string): Product[] {
  const all = getAllProducts();
  return all.filter(p => p.name.toLowerCase().indexOf(query.toLowerCase()) !== -1);
}
