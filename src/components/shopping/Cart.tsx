import React, { useState, useEffect } from 'react';
import { Minus, Plus, Trash2, ShoppingBag, Tag } from 'lucide-react';
import {
  getCart,
  removeFromCart,
  updateQuantity,
  toggleSelect,
  toggleSelectAll,
  getProductById,
} from '../../services/shoppingService';
import type { CartItem as CartItemType } from '../../types/shopping';

interface CartProps {
  cart: CartItemType[];
  onCartUpdate: (cart: CartItemType[]) => void;
}

export const Cart: React.FC<CartProps> = ({ cart, onCartUpdate }) => {
  const allSelected = cart.length > 0 && cart.every(item => item.selected);

  const selectedTotal = cart
    .filter(item => item.selected)
    .reduce((total, item) => {
      const product = getProductById(item.productId);
      return total + (product ? product.price * item.quantity : 0);
    }, 0);

  const selectedCount = cart.filter(item => item.selected).reduce((sum, item) => sum + item.quantity, 0);

  const handleToggleSelect = (productId: string) => {
    const newCart = toggleSelect(productId);
    onCartUpdate(newCart);
  };

  const handleToggleSelectAll = () => {
    const newCart = toggleSelectAll(!allSelected);
    onCartUpdate(newCart);
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    const newCart = updateQuantity(productId, delta);
    onCartUpdate(newCart);
  };

  const handleRemove = (productId: string) => {
    const newCart = removeFromCart(productId);
    onCartUpdate(newCart);
  };

  const handleCheckout = () => {
    alert('功能开发中，敬请期待！');
  };

  if (cart.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full w-full">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4 glass-card p-0">
          <ShoppingBag size={36} strokeWidth={1} className="text-[#999999] dark:text-[#aaaaaa]" />
        </div>
        <p className="text-sm font-bold text-[#1a1a1a] dark:text-[#f0f0f3]">购物车是空的</p>
        <p className="text-xs text-[#999999] dark:text-[#aaaaaa] mt-1">去商品列表逛逛吧</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full relative">
      {/* 购物车顶部标题 - 更紧凑 */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2 relative z-10">
        <div className="w-10" />
        <h2 className="text-sm font-bold opacity-80 text-[#1a1a1a] dark:text-[#f0f0f3] absolute left-1/2 -translate-x-1/2">购物车</h2>
        <div className="w-10" />
      </div>

      {/* 购物车列表 */}
      <div className="flex-1 overflow-y-auto px-4" style={{ paddingBottom: '130px' }}>
        <div className="flex flex-col gap-3 pt-1">
          {cart.map(item => {
            const product = getProductById(item.productId);
            if (!product) return null;
            return (
              <div
                key={item.productId}
                className="glass-card p-3 flex items-center gap-3 relative"
              >
                {/* 选择框 */}
                <button
                  onClick={() => handleToggleSelect(item.productId)}
                  className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                    item.selected
                      ? 'bg-[#1a1a1a] text-[#f0f0f3] dark:bg-[#f0f0f3] dark:text-[#1a1a1a] border-none'
                      : 'border-[1.5px] border-[#999999] dark:border-[#aaaaaa] bg-transparent'
                  }`}
                >
                  {item.selected && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4L3.5 6.5L9 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>

                {/* 商品图片 */}
                <div className="w-16 h-16 rounded-[12px] bg-[#f0f0f3] dark:bg-[#1a1a1a] flex items-center justify-center flex-shrink-0 overflow-hidden relative">
                  {product.isSecondHand && (
                    <div className="absolute top-0 left-0 bg-[#1a1a1a]/70 text-[#f0f0f3] text-[8px] px-1 py-0.5 rounded-br-[8px] z-10 flex items-center">
                      <Tag size={8} className="mr-0.5" /> 二手
                    </div>
                  )}
                  {product.imageUrl ? (
                     <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl opacity-50">📦</span>
                  )}
                </div>

                {/* 商品信息 */}
                <div className="flex-1 min-w-0 flex flex-col justify-between h-16 py-0.5">
                  <div>
                    <h4 className="text-sm font-bold text-[#1a1a1a] dark:text-[#f0f0f3] truncate pr-6 leading-tight">{product.name}</h4>
                    <div className="text-[10px] text-[#999999] dark:text-[#aaaaaa] mt-0.5 capitalize">{product.category === 'food' ? '外卖' : '购物'}</div>
                  </div>

                  <div className="flex items-center justify-between mt-auto">
                    <p className="text-sm font-bold text-[#1a1a1a] dark:text-[#f0f0f3] leading-none">¥{product.price.toFixed(0)}</p>

                    {/* 数量控制 */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleUpdateQuantity(item.productId, -1)}
                        className="w-6 h-6 rounded-full glass-btn-secondary flex items-center justify-center active:scale-90 transition-all p-0"
                      >
                        <Minus size={12} strokeWidth={2.5} />
                      </button>
                      <span className="text-[13px] font-bold w-5 text-center text-[#1a1a1a] dark:text-[#f0f0f3]">{item.quantity}</span>
                      <button
                        onClick={() => handleUpdateQuantity(item.productId, 1)}
                        className="w-6 h-6 rounded-full glass-btn-secondary flex items-center justify-center active:scale-90 transition-all p-0"
                      >
                        <Plus size={12} strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* 删除 */}
                <button
                  onClick={() => handleRemove(item.productId)}
                  className="absolute top-3 right-3 p-1 rounded-full text-[#999999] dark:text-[#aaaaaa] hover:text-red-500 transition-colors active:scale-90 bg-transparent"
                >
                  <Trash2 size={14} strokeWidth={2} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* 底部结算栏 - 调整高度和位置 */}
      <div className="absolute bottom-[64px] left-4 right-4 glass-checkout-bar py-2.5 px-4 flex items-center justify-between z-20">
        {/* 全选 */}
        <button
          onClick={handleToggleSelectAll}
          className="flex items-center gap-2"
        >
          <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
            allSelected
              ? 'bg-[#1a1a1a] text-[#f0f0f3] dark:bg-[#f0f0f3] dark:text-[#1a1a1a] border-none'
              : 'border-[1.5px] border-[#999999] dark:border-[#aaaaaa] bg-transparent'
          }`}>
            {allSelected && (
              <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                <path d="M1 4L3.5 6.5L9 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </div>
          <span className="text-[11px] font-bold text-[#1a1a1a] dark:text-[#f0f0f3]">全选</span>
        </button>

        {/* 合计 + 结算 */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[10px] text-[#999999] dark:text-[#aaaaaa] mb-0.5">合计金额</div>
            <div className="text-base font-bold leading-none text-[#1a1a1a] dark:text-[#f0f0f3]">¥{selectedTotal.toFixed(2)}</div>
          </div>
          <button
            onClick={handleCheckout}
            disabled={selectedCount === 0}
            className={`px-5 py-2 rounded-full text-[13px] font-bold transition-all active:scale-95 ${
              selectedCount > 0
                ? 'glass-btn-primary'
                : 'glass-btn-secondary opacity-50 cursor-not-allowed shadow-none'
            }`}
          >
            结算{selectedCount > 0 ? `(${selectedCount})` : ''}
          </button>
        </div>
      </div>
    </div>
  );
};
