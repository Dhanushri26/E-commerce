export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  discount: number;
  stock: number;
  rating: number;
  reviews: number;
  metal: string;
  stone: string;
  purity: string;
  weight: string;
  category: string;
  collection: string;
  badge: string;
  image: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Order {
  id: string;
  date: string;
  total: number;
  status: string;
  paymentStatus: string;
  items: CartItem[];
}
