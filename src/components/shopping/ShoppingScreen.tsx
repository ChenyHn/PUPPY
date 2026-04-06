import React, { useState, useEffect } from 'react';
import { ArrowLeft, ShoppingBag, ShoppingCart, User, PlusSquare } from 'lucide-react';
import { ProductList } from './ProductList';
import { Cart } from './Cart';
import { Profile } from './Profile';
import { SellScreen } from './SellScreen';
import { getCart } from '../../services/shoppingService';
import type { CartItem } from '../../types/shopping';

type ShoppingTab = 'products' | 'cart' | 'sell' | 'profile';

interface ShoppingScreenProps {
  onBack: () => void;
  time: string;
}

export const ShoppingScreen: React.FC<ShoppingScreenProps> = ({ onBack, time }) => {
  const [activeTab, setActiveTab] = useState<ShoppingTab>('products');
  const [cart, setCart] = useState<CartItem[]>(() => getCart());

  const handleCartUpdate = (newCart: CartItem[]) => {
    setCart(newCart);
  };

  useEffect(() => {
    if (activeTab === 'cart') {
      setCart(getCart());
    }
  }, [activeTab]);

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="absolute inset-0 flex flex-col z-50 shopping-bg">
      {/* 返回按钮 - 悬浮在左上角 */}
      <div className="absolute top-2 left-2 z-[60]">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full flex items-center justify-center text-[#1a1a1a] dark:text-[#f0f0f3] active:scale-90 transition-all p-0 bg-transparent"
        >
          <ArrowLeft size={20} strokeWidth={2} />
        </button>
      </div>

      {/* 内容区域 - 填满除导航栏外的所有空间 */}
      <div className="flex-1 overflow-hidden relative">
        {activeTab === 'products' && (
          <ProductList onCartUpdate={handleCartUpdate} />
        )}
        {activeTab === 'cart' && (
          <Cart cart={cart} onCartUpdate={handleCartUpdate} />
        )}
        {activeTab === 'sell' && (
          <SellScreen onBack={() => setActiveTab('products')} onSuccess={() => setActiveTab('products')} />
        )}
        {activeTab === 'profile' && (
          <Profile />
        )}
      </div>

      {/* 底部悬浮毛玻璃标签栏 - 在容器内定位 */}
      <div className="absolute bottom-3 left-3 right-3 glass-nav py-1 px-4 flex justify-between items-center z-50" style={{ height: '52px' }}>
        <button
          onClick={() => setActiveTab('products')}
          className={`flex flex-col items-center justify-center gap-0.5 transition-colors w-12 h-full ${
            activeTab === 'products'
              ? 'text-[#1a1a1a] dark:text-[#f0f0f3]'
              : 'text-[#999999] dark:text-[#aaaaaa]'
          }`}
        >
          <ShoppingBag size={20} strokeWidth={activeTab === 'products' ? 2 : 1.5} />
          <span className="text-[10px] font-bold leading-tight">购物</span>
        </button>

        <button
          onClick={() => setActiveTab('cart')}
          className={`flex flex-col items-center justify-center gap-0.5 transition-colors relative w-12 h-full ${
            activeTab === 'cart'
              ? 'text-[#1a1a1a] dark:text-[#f0f0f3]'
              : 'text-[#999999] dark:text-[#aaaaaa]'
          }`}
        >
          <div className="relative flex items-center justify-center">
            <ShoppingCart size={20} strokeWidth={activeTab === 'cart' ? 2 : 1.5} />
            {cartItemCount > 0 && (
              <div className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 bg-red-500 rounded-full flex items-center justify-center px-1 shadow-sm">
                <span className="text-[9px] font-bold text-white">{cartItemCount > 99 ? '99+' : cartItemCount}</span>
              </div>
            )}
          </div>
          <span className="text-[10px] font-bold leading-tight">购物车</span>
        </button>

        <button
          onClick={() => setActiveTab('sell')}
          className={`flex flex-col items-center justify-center gap-0.5 transition-colors w-12 h-full ${
            activeTab === 'sell'
              ? 'text-[#1a1a1a] dark:text-[#f0f0f3]'
              : 'text-[#999999] dark:text-[#aaaaaa]'
          }`}
        >
          <PlusSquare size={20} strokeWidth={activeTab === 'sell' ? 2 : 1.5} />
          <span className="text-[10px] font-bold leading-tight">出售</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center justify-center gap-0.5 transition-colors w-12 h-full ${
            activeTab === 'profile'
              ? 'text-[#1a1a1a] dark:text-[#f0f0f3]'
              : 'text-[#999999] dark:text-[#aaaaaa]'
          }`}
        >
          <User size={20} strokeWidth={activeTab === 'profile' ? 2 : 1.5} />
          <span className="text-[10px] font-bold leading-tight">我的</span>
        </button>
      </div>
    </div>
  );
};
