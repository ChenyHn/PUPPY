import type { CartItem, Product, Order } from '../types/shopping';

const CART_KEY = 'shopping_cart';
const ORDERS_KEY = 'shopping_orders';

// 硬编码商品数据 (商城)
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

export function getOrders(): Order[] {
  try {
    const raw = localStorage.getItem(ORDERS_KEY);
    if (raw) {
      return JSON.parse(raw) as Order[];
    }
  } catch (e) {
    console.error('Failed to read orders:', e);
  }
  return [];
}

export function saveOrders(orders: Order[]): void {
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
}

function calculateEstimatedDeliveryTime(deliveryType: 'food' | 'normal' | 'express'): number {
  const now = Date.now();
  switch (deliveryType) {
    case 'food':
      // 当前时间 + 30~60分钟随机
      const foodMinutes = 30 + Math.floor(Math.random() * 30);
      return now + foodMinutes * 60 * 1000;
    case 'normal':
      // 当前时间 + 1~3天（24~72小时）
      const normalHours = 24 + Math.floor(Math.random() * 48);
      return now + normalHours * 60 * 60 * 1000;
    case 'express':
      // 当前时间 + 2~6小时
      const expressHours = 2 + Math.floor(Math.random() * 4);
      return now + expressHours * 60 * 60 * 1000;
  }
}

export function createOrder(
  items: CartItem[],
  total: number,
  paymentMethod: 'self' | 'proxy',
  proxyContactId?: string,
  deliveryType: 'food' | 'normal' | 'express' = 'normal'
): Order {
  const order: Order = {
    id: `order_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    items,
    totalAmount: total,
    status: 'shipping',
    paymentMethod,
    proxyContactId,
    deliveryType,
    estimatedDeliveryTime: calculateEstimatedDeliveryTime(deliveryType),
    createdAt: Date.now()
  };

  try {
    const orders = getOrders();
    orders.push(order);
    saveOrders(orders);
  } catch (e) {
    console.error('Failed to save order:', e);
  }

  return order;
}

export function updateOrderStatus(orderId: string, status: Order['status'], actualDeliveryTime?: number): Order | undefined {
  const orders = getOrders();
  const order = orders.find(o => o.id === orderId);
  if (order) {
    order.status = status;
    if (actualDeliveryTime) {
      order.actualDeliveryTime = actualDeliveryTime;
    }
    saveOrders(orders);
  }
  return order;
}

export function deliverOrder(orderId: string): Order | undefined {
  const orders = getOrders();
  const order = orders.find(o => o.id === orderId);
  if (order && order.status === 'shipping') {
    order.status = 'delivered';
    order.actualDeliveryTime = Date.now();
    saveOrders(orders);
    
    // 这里可以触发事件或通知，由顶层组件监听并发送 AI 消息
    window.dispatchEvent(new CustomEvent('orderDelivered', { detail: { orderId: order.id } }));
  }
  return order;
}

export function skipDeliveryWait(orderId: string): Order | undefined {
  const orders = getOrders();
  const order = orders.find(o => o.id === orderId);
  if (order && order.status === 'shipping') {
    order.estimatedDeliveryTime = Date.now();
    saveOrders(orders);
  }
  return order;
}

// 使用 AI 生成商品
export async function searchProductsByAI(keyword: string): Promise<Product[]> {
  try {
    const rawConfig = localStorage.getItem('aiphone_api_config');
    if (!rawConfig) {
      throw new Error('API config not found');
    }
    const apiConfig = JSON.parse(rawConfig);
    if (!apiConfig.baseUrl || !apiConfig.apiKey || !apiConfig.selectedModel) {
      throw new Error('API config incomplete');
    }

    const prompt = `用户搜索关键词：“${keyword}”。
请生成4-6个相关商品，每个商品包含：
- name: 商品名称
- description: 简短描述
- price: 价格（数字，单位元）
- category: 类型（"food" 外卖 / "normal" 普通快递 / "express" 顺丰当日达）
返回 JSON 数组，格式：[{"name":"...","description":"...","price":99.9,"category":"food"}]
只返回 JSON，不要其他文字。`;

    let baseUrl = apiConfig.baseUrl;
    if (!/^https?:\/\//i.test(baseUrl)) {
      baseUrl = 'https://' + baseUrl;
    }
    const url = baseUrl.replace(/\/chat\/completions$/, '') + '/chat/completions';

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiConfig.apiKey}`
      },
      body: JSON.stringify({
        model: apiConfig.selectedModel,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    const data = await response.json();
    let content = data.choices[0].message.content;
    
    // 尝试提取 JSON 数组
    const jsonMatch = content.match(/\[.*\]/s);
    if (jsonMatch) {
      content = jsonMatch[0];
    }

    const parsed = JSON.parse(content);
    if (!Array.isArray(parsed)) {
      throw new Error('AI response is not a JSON array');
    }

    return parsed.map((p: any, i: number) => ({
      id: `ai_${Date.now()}_${i}`,
      name: p.name || '未知商品',
      price: typeof p.price === 'number' ? p.price : parseFloat(p.price) || 0,
      description: p.description || '',
      stock: 100,
      category: p.category === 'food' ? 'food' : 'shopping',
    }));
  } catch (e) {
    console.error('Failed to generate products by AI:', e);
    throw e;
  }
}
