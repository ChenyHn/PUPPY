import type { CartItem, Product } from '../types/shopping';

const CART_KEY = 'shopping_cart';

// 硬编码商品数据 (购物)
export const SHOPPING_PRODUCTS: Product[] = [
  {
    id: 'prod_001',
    name: '简约T恤',
    price: 99.00,
    description: '舒适透气纯棉面料，简约百搭款',
    stock: 50,
    category: 'shopping'
  },
  {
    id: 'prod_002',
    name: '无线耳机',
    price: 299.00,
    description: '高品质蓝牙5.0，主动降噪',
    stock: 30,
    category: 'shopping'
  },
  {
    id: 'prod_003',
    name: '精装笔记本',
    price: 39.00,
    description: '100g优质纸张，180°平摊设计',
    stock: 100,
    category: 'shopping'
  },
  {
    id: 'prod_004',
    name: '保温水杯',
    price: 129.00,
    description: '316不锈钢内胆，12小时持久保温',
    stock: 80,
    category: 'shopping'
  },
  {
    id: 'prod_005',
    name: '帆布背包',
    price: 159.00,
    description: '大容量设计，防泼水面料',
    stock: 40,
    category: 'shopping'
  },
  {
    id: 'prod_006',
    name: '桌面台灯',
    price: 89.00,
    description: 'LED护眼光源，三档色温调节',
    stock: 60,
    category: 'shopping'
  },
];

// 预设外卖商品
export const FOOD_PRODUCTS: Product[] = [
  {
    id: 'food_001',
    name: '经典牛肉汉堡套餐',
    price: 45.00,
    description: '纯正牛肉饼，搭配新鲜生菜和薯条',
    stock: 100,
    category: 'food'
  },
  {
    id: 'food_002',
    name: '招牌芝士披萨',
    price: 68.00,
    description: '12寸手工薄底，香浓马苏里拉芝士',
    stock: 50,
    category: 'food'
  },
  {
    id: 'food_003',
    name: '鲜榨橙汁',
    price: 18.00,
    description: '100%纯果汁，不加水和糖',
    stock: 200,
    category: 'food'
  },
  {
    id: 'food_004',
    name: '麻辣香锅',
    price: 55.00,
    description: '自选荤素搭配，地道川味',
    stock: 80,
    category: 'food'
  }
];

export const PRODUCTS: Product[] = [...SHOPPING_PRODUCTS, ...FOOD_PRODUCTS];

// 获取用户发布的二手商品
export function getLocalProducts(): Product[] {
  try {
    const raw = localStorage.getItem('user_products');
    if (raw) {
      return JSON.parse(raw) as Product[];
    }
  } catch (e) {
    console.error('Failed to read local products:', e);
  }
  return [];
}

// 保存用户发布的二手商品
export function saveLocalProduct(product: Product): void {
  const current = getLocalProducts();
  current.push({
    ...product,
    isSecondHand: true,
    sellerId: 'current_user', // 模拟当前用户
    sellerName: '我',
  });
  localStorage.setItem('user_products', JSON.stringify(current));
}

export function getAllProducts(): Product[] {
  return [...PRODUCTS, ...getLocalProducts()];
}

export function getCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (raw) {
      return JSON.parse(raw) as CartItem[];
    }
  } catch (e) {
    console.error('Failed to read cart:', e);
  }
  return [];
}

export function saveCart(cart: CartItem[]): void {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

export function addToCart(productId: string, quantity: number = 1): CartItem[] {
  const cart = getCart();
  const existing = cart.find(item => item.productId === productId);
  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push({ productId, quantity, selected: true });
  }
  saveCart(cart);
  return cart;
}

export function removeFromCart(productId: string): CartItem[] {
  const cart = getCart().filter(item => item.productId !== productId);
  saveCart(cart);
  return cart;
}

export function updateQuantity(productId: string, delta: number): CartItem[] {
  const cart = getCart();
  const item = cart.find(i => i.productId === productId);
  if (item) {
    item.quantity = Math.max(1, item.quantity + delta);
  }
  saveCart(cart);
  return cart;
}

export function toggleSelect(productId: string): CartItem[] {
  const cart = getCart();
  const item = cart.find(i => i.productId === productId);
  if (item) {
    item.selected = !item.selected;
  }
  saveCart(cart);
  return cart;
}

export function toggleSelectAll(selected: boolean): CartItem[] {
  const cart = getCart();
  cart.forEach(item => { item.selected = selected; });
  saveCart(cart);
  return cart;
}

export function getSelectedTotal(): number {
  const cart = getCart();
  const allProducts = getAllProducts();
  return cart
    .filter(item => item.selected)
    .reduce((total, item) => {
      const product = allProducts.find(p => p.id === item.productId);
      return total + (product ? product.price * item.quantity : 0);
    }, 0);
}

export function getProductById(id: string): Product | undefined {
  const allProducts = getAllProducts();
  return allProducts.find(p => p.id === id);
}

// 从 DummyJSON 获取商品
export async function fetchDummyProducts(query?: string, skip: number = 0): Promise<Product[]> {
  try {
    const url = query 
      ? `https://dummyjson.com/products/search?q=${encodeURIComponent(query)}`
      : `https://dummyjson.com/products?limit=10&skip=${skip}`;
      
    const response = await fetch(url);
    const data = await response.json();
    
    // 映射到我们的 Product 类型
    return data.products.map((p: any) => ({
      id: `dummy_${p.id}`,
      name: p.title,
      price: Math.round(p.price * 7), // 简单转换为人民币
      description: p.description,
      imageUrl: p.thumbnail,
      stock: p.stock,
      category: 'shopping'
    }));
  } catch (e) {
    console.error('Failed to fetch dummy products:', e);
    return [];
  }
}
