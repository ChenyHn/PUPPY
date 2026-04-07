import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, ShoppingBag, User, PlusSquare, Minus, Plus, Trash2, X } from 'lucide-react';
import { ProductList } from './ProductList';
import { Profile } from './Profile';
import { SellScreen } from './SellScreen';
import { CheckoutModal } from './CheckoutModal';
import { AwaitingReceiptScreen } from './AwaitingReceiptScreen';
import { getCart, getProductById, updateQuantity, removeFromCart, createOrder, saveCart } from '../../services/shoppingService';
import type { CartItem } from '../../types/shopping';

type ShoppingTab = 'products' | 'sell' | 'profile' | 'awaitingReceipt';

interface ShoppingScreenProps {
  onBack: () => void;
  time: string;
  contacts?: any[];
  chatHistories?: Record<string, any[]>;
  setChatHistories?: any;
  wallet?: any;
  setWallet?: any;
}

export const ShoppingScreen: React.FC<ShoppingScreenProps> = ({ onBack, time, contacts, chatHistories, setChatHistories, wallet, setWallet }) => {
  const [activeTab, setActiveTab] = useState<ShoppingTab>('products');
  const [cart, setCart] = useState<CartItem[]>(() => getCart());
  const [isCartPanelOpen, setIsCartPanelOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const handleCartUpdate = (newCart: CartItem[]) => {
    setCart(newCart);
  };

  // 点击外部关闭商城车面板
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsCartPanelOpen(false);
      }
    };
    
    if (isCartPanelOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCartPanelOpen]);

  // 面板内的操作
  const handleUpdateQuantity = (productId: string, delta: number) => {
    const newCart = updateQuantity(productId, delta);
    handleCartUpdate(newCart);
  };

  const handleRemove = (productId: string) => {
    const newCart = removeFromCart(productId);
    handleCartUpdate(newCart);
  };

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const handleCheckout = () => {
    setIsCheckoutOpen(true);
    setIsCartPanelOpen(false);
  };

  const cartTotal = cart.reduce((total, item) => {
    const product = getProductById(item.productId);
    return total + (product ? product.price * item.quantity : 0);
  }, 0);

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="absolute inset-0 flex flex-col z-50 shopping-bg">
      {/* 内容区域 - 填满除导航栏外的所有空间 */}
      <div className="flex-1 overflow-hidden relative">
        {activeTab === 'products' && (
          <ProductList onCartUpdate={handleCartUpdate} onBack={onBack} />
        )}
        {activeTab === 'sell' && (
          <SellScreen onBack={onBack} onSuccess={() => setActiveTab('products')} />
        )}
        {activeTab === 'profile' && (
          <Profile onBack={onBack} onAwaitingReceipt={() => setActiveTab('awaitingReceipt')} />
        )}
        {activeTab === 'awaitingReceipt' && (
          <AwaitingReceiptScreen onBack={() => setActiveTab('profile')} />
        )}
      </div>

      {/* 底部悬浮毛玻璃标签栏 */}
      <div className="absolute bottom-4 left-4 right-[88px] bg-[rgba(248,248,250,0.6)] dark:bg-[rgba(30,30,35,0.6)] backdrop-blur-[20px] rounded-2xl shadow-none border border-white/60 dark:border-white/10 py-2 px-4 flex items-center justify-around z-50">
        <button
          onClick={() => { setActiveTab('products'); setIsCartPanelOpen(false); }}
          className={`flex flex-col items-center justify-center gap-1 transition-colors w-12 h-full ${
            activeTab === 'products'
              ? 'text-[#1a1a1a] dark:text-[#f0f0f3]'
              : 'text-[#999999] dark:text-[#aaaaaa]'
          }`}
        >
          <ShoppingBag size={22} strokeWidth={activeTab === 'products' ? 2 : 1.5} />
          <span className="text-[10px] font-bold leading-tight mt-0.5">商品</span>
        </button>

        <button
          onClick={() => { setActiveTab('sell'); setIsCartPanelOpen(false); }}
          className={`flex flex-col items-center justify-center gap-1 transition-colors w-12 h-full ${
            activeTab === 'sell'
              ? 'text-[#1a1a1a] dark:text-[#f0f0f3]'
              : 'text-[#999999] dark:text-[#aaaaaa]'
          }`}
        >
          <PlusSquare size={22} strokeWidth={activeTab === 'sell' ? 2 : 1.5} />
          <span className="text-[10px] font-bold leading-tight mt-0.5">出售</span>
        </button>

        <button
          onClick={() => { setActiveTab('profile'); setIsCartPanelOpen(false); }}
          className={`flex flex-col items-center justify-center gap-1 transition-colors w-12 h-full ${
            activeTab === 'profile'
              ? 'text-[#1a1a1a] dark:text-[#f0f0f3]'
              : 'text-[#999999] dark:text-[#aaaaaa]'
          }`}
        >
          <User size={22} strokeWidth={activeTab === 'profile' ? 2 : 1.5} />
          <span className="text-[10px] font-bold leading-tight mt-0.5">我的</span>
        </button>
      </div>

      {/* 独立的商城车按钮和悬浮面板（右下角） */}
      <div className="absolute bottom-4 right-4 pointer-events-auto z-50" ref={panelRef}>
        {/* 商城车悬浮面板 */}
        {isCartPanelOpen && (
          <div 
            className="absolute bottom-[72px] right-0 w-[300px] z-10 transition-all duration-200 origin-bottom-right bg-[rgba(245,245,245,0.85)] dark:bg-[rgba(30,30,35,0.85)] backdrop-blur-[12px] border border-[rgba(255,255,255,0.9)] dark:border-[rgba(255,255,255,0.2)] rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.1)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
            style={{ animation: 'fadeInZoom 0.2s ease-out' }}
          >
            {/* 尖角指向按钮 */}
            <div className="absolute -bottom-[7px] right-[24px] w-[14px] h-[14px] bg-[rgba(245,245,245,0.85)] dark:bg-[rgba(30,30,35,0.85)] border-r border-b border-[rgba(255,255,255,0.9)] dark:border-[rgba(255,255,255,0.2)] rotate-45 backdrop-blur-[12px] z-0" />
            
            <div className="p-4 flex flex-col max-h-[400px] relative z-10">
              {/* 头部 */}
              <div className="flex justify-between items-center mb-3 pb-2 border-b border-[rgba(0,0,0,0.05)] dark:border-[rgba(255,255,255,0.1)]">
                <h3 className="text-sm font-bold text-[#1a1a1a] dark:text-[#f0f0f3]">商城车</h3>
                <div className="flex items-center gap-3">
                  <button onClick={() => setIsCartPanelOpen(false)} className="text-[#999999] dark:text-[#888888] hover:text-[#1a1a1a] dark:hover:text-white transition-colors bg-transparent p-0">
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* 列表内容 */}
              {cart.length === 0 ? (
                <div className="py-8 flex flex-col items-center justify-center text-[#999999] dark:text-[#aaaaaa]">
                  <ShoppingBag size={32} strokeWidth={1} className="mb-2 opacity-50" />
                  <span className="text-xs">商城车是空的</span>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto space-y-3 pr-1 pb-2 custom-scrollbar">
                  {cart.map(item => {
                    const product = getProductById(item.productId);
                    if (!product) return null;
                    return (
                      <div key={item.productId} className="flex items-center gap-2 group">
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-[#1a1a1a] dark:text-[#f0f0f3] truncate">{product.name}</div>
                          <div className="text-[11px] font-bold text-[#1a1a1a] dark:text-[#f0f0f3] mt-0.5">¥{product.price.toFixed(0)}</div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 bg-[rgba(0,0,0,0.03)] dark:bg-[rgba(255,255,255,0.05)] rounded-full px-1 py-0.5">
                            <button
                              onClick={() => handleUpdateQuantity(item.productId, -1)}
                              className="w-5 h-5 rounded-full flex items-center justify-center text-[#666666] dark:text-[#aaaaaa] hover:bg-[rgba(0,0,0,0.05)] dark:hover:bg-[rgba(255,255,255,0.1)] transition-colors p-0"
                            >
                              <Minus size={10} strokeWidth={2.5} />
                            </button>
                            <span className="text-[11px] font-bold w-4 text-center text-[#1a1a1a] dark:text-[#f0f0f3]">{item.quantity}</span>
                            <button
                              onClick={() => handleUpdateQuantity(item.productId, 1)}
                              className="w-5 h-5 rounded-full flex items-center justify-center text-[#666666] dark:text-[#aaaaaa] hover:bg-[rgba(0,0,0,0.05)] dark:hover:bg-[rgba(255,255,255,0.1)] transition-colors p-0"
                            >
                              <Plus size={10} strokeWidth={2.5} />
                            </button>
                          </div>
                          <button
                            onClick={() => handleRemove(item.productId)}
                            className="p-1 text-[#999999] hover:text-[#1a1a1a] dark:hover:text-[#f0f0f3] transition-colors bg-transparent opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 底部结算 */}
              {cart.length > 0 && (
                <div className="mt-2 pt-3 border-t border-[rgba(0,0,0,0.05)] dark:border-[rgba(255,255,255,0.1)] flex justify-between items-center">
                  <div>
                    <div className="text-[10px] text-[#999999] dark:text-[#aaaaaa]">总计</div>
                    <div className="text-sm font-bold text-[#1a1a1a] dark:text-[#f0f0f3]">¥{cartTotal.toFixed(2)}</div>
                  </div>
                  <button
                    onClick={handleCheckout}
                    className="glass-btn-primary !py-1.5 !px-4 !text-xs"
                  >
                    结算({cartItemCount})
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 商城车悬浮按钮 */}
        <button
          onClick={() => setIsCartPanelOpen(!isCartPanelOpen)}
          className="w-[56px] h-[56px] rounded-full flex items-center justify-center relative z-20 bg-[linear-gradient(145deg,rgba(255,255,255,0.9),rgba(235,235,240,0.8))] dark:bg-[linear-gradient(145deg,rgba(45,45,50,0.9),rgba(30,30,35,0.8))] shadow-[4px_4px_10px_rgba(0,0,0,0.08),-2px_-2px_6px_rgba(255,255,255,0.9)] dark:shadow-[4px_4px_10px_rgba(0,0,0,0.3),-2px_-2px_6px_rgba(255,255,255,0.05)] border-none"
        >
          <ShoppingBag size={24} className="text-[#4b5563] dark:text-[#a1a1aa]" strokeWidth={1.5} />
          {cartItemCount > 0 && (
            <div className="absolute top-0 right-0 min-w-[18px] h-[18px] bg-[#1a1a1a] dark:bg-[#333333] rounded-full flex items-center justify-center px-1 border border-white dark:border-[#2a2a2c]">
              <span className="text-[10px] font-bold text-white">{cartItemCount > 99 ? '99+' : cartItemCount}</span>
            </div>
          )}
        </button>
      </div>

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        totalAmount={cartTotal}
        contacts={contacts || []}
        cart={cart}
        onSuccess={() => {
          setCart([]);
          saveCart([]);
          setIsCartPanelOpen(false);
          setIsCheckoutOpen(false);
          // 可以选择跳转到订单页，这里先留在当前页
        }}
        wallet={wallet}
        setWallet={setWallet}
        setChatHistories={setChatHistories}
      />
    </div>
  );
};
