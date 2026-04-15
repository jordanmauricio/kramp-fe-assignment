// Deliberately inconsistent — some types are well-defined, some use any

export interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  description: string;
  category: string;
  stock: number;
  createdAt: string;
}

// CartItem is typed correctly but used inconsistently across files
export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

// T1: SearchResult should be Pick<Product, 'id' | 'name' | 'price' | 'imageUrl'>
// Using any instead — loses all type safety for search results
export type SearchResult = any;

// Dead code: this type alias is never referenced anywhere in the codebase
export type ProductCategory = 'Tools' | 'Fasteners' | 'Safety Equipment' | 'Power Tools';
