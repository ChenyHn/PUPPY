export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  imageUrl?: string;
  stock: number;
  category?: 'shopping' | 'food';
  isSecondHand?: boolean;
  sellerId?: string;
  sellerName?: string;
  originalPrice?: number;
}

export interface CartItem {
  productId: string;
  quantity: number;
  selected: boolean;
}
