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

export interface Order {
  id: string;
  items: CartItem[];
  totalAmount: number;
  paymentMethod: 'self' | 'proxy';
  proxyContactId?: string;      // 代付联系人ID
  status: 'pending' | 'shipping' | 'delivered';
  deliveryType: 'food' | 'normal' | 'express';
  estimatedDeliveryTime: number; // 预计送达时间戳
  actualDeliveryTime?: number;
  createdAt: number;
}
