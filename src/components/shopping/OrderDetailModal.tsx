import React, { useState, useEffect } from 'react';
import { X, Package, Clock, ShoppingBag } from 'lucide-react';
import { getProductById, updateOrderStatus } from '../../services/shoppingService';
import type { Order } from '../../types/shopping';

interface OrderDetailModalProps {
  order: Order;
  onClose: () => void;
  onRefresh: () => void;
}

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({ order, onClose, onRefresh }) => {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      const currentNow = Date.now();
      setNow(currentNow);
      // 如果倒计时归零，自动更新为已送达
      if (order.status === 'shipping' && currentNow >= order.estimatedDeliveryTime) {
        handleDeliver();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [order.status, order.estimatedDeliveryTime]);

  const handleDeliver = () => {
    updateOrderStatus(order.id, 'delivered', Date.now());
    // 触发全局事件，供主界面发送AI通知
    window.dispatchEvent(new CustomEvent('orderDelivered', { detail: { orderId: order.id } }));
    onRefresh();
    onClose();
  };

  const formatTimeRemaining = (estimatedTime: number) => {
    const diff = estimatedTime - now;
    if (diff <= 0) return '已送达';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    if (days > 0) return `${days}天${hours}小时`;
    if (hours > 0) return `${hours}小时${minutes}分钟`;
    return `${minutes}分钟${seconds}秒`;
  };

  const isShipping = order.status === 'shipping';
  const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="absolute inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      
      <div 
        className="relative w-full max-w-sm bg-[rgba(255,255,255,0.85)] dark:bg-[rgba(40,40,45,0.85)] backdrop-blur-[8px] rounded-[24px] border border-[rgba(255,255,255,0.9)] dark:border-[rgba(255,255,255,0.1)] shadow-none overflow-hidden flex flex-col max-h-[80vh]"
        style={{ animation: 'fadeInZoom 0.2s ease-out' }}
      >
        {/* 头部 */}
        <div className="flex justify-between items-center p-4 border-b border-black/5 dark:border-white/5">
          <h3 className="text-base font-bold text-[#1a1a1a] dark:text-[#f0f0f3] flex items-center gap-2">
            <ShoppingBag size={18} />
            订单详情
          </h3>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-black/5 dark:bg-white/5 text-[#666666] dark:text-[#aaaaaa] hover:text-[#1a1a1a] dark:hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {/* 状态卡片 */}
          <div className="bg-[rgba(255,255,255,0.6)] dark:bg-[rgba(0,0,0,0.2)] rounded-[16px] p-4 mb-4 flex flex-col items-center justify-center gap-2">
            {isShipping ? (
              <>
                <Clock size={32} className="text-[#1a1a1a] dark:text-[#f0f0f3]" />
                <div className="text-sm font-medium text-[#666666] dark:text-[#aaaaaa]">预计送达</div>
                <div className="text-xl font-bold text-[#1a1a1a] dark:text-[#f0f0f3] tabular-nums tracking-tight">
                  {formatTimeRemaining(order.estimatedDeliveryTime)}
                </div>
              </>
            ) : (
              <>
                <Package size={32} className="text-[#1a1a1a] dark:text-[#f0f0f3]" />
                <div className="text-xl font-bold text-[#1a1a1a] dark:text-[#f0f0f3]">已送达</div>
                <div className="text-xs text-[#999999] dark:text-[#aaaaaa]">
                  {new Date(order.estimatedDeliveryTime).toLocaleString()}
                </div>
              </>
            )}
          </div>

          {/* 商品列表 */}
          <div className="bg-[rgba(255,255,255,0.6)] dark:bg-[rgba(0,0,0,0.2)] rounded-[16px] p-4 mb-4">
            <h4 className="text-xs font-bold text-[#999999] dark:text-[#aaaaaa] mb-3 uppercase tracking-wider">商品清单 ({totalItems}件)</h4>
            <div className="space-y-3">
              {order.items.map((item, idx) => {
                const product = getProductById(item.productId);
                if (!product) return null;
                return (
                  <div key={idx} className="flex justify-between items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-[#1a1a1a] dark:text-[#f0f0f3] leading-tight truncate">
                        {product.name}
                      </div>
                      <div className="text-xs text-[#999999] dark:text-[#aaaaaa] mt-0.5">
                        x{item.quantity}
                      </div>
                    </div>
                    <div className="text-sm font-bold text-[#1a1a1a] dark:text-[#f0f0f3]">
                      ¥{(product.price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 pt-3 border-t border-black/5 dark:border-white/5 flex justify-between items-center">
              <span className="text-sm font-medium text-[#666666] dark:text-[#aaaaaa]">实付款</span>
              <span className="text-lg font-bold text-[#1a1a1a] dark:text-[#f0f0f3]">¥{order.totalAmount.toFixed(2)}</span>
            </div>
          </div>
          
          {/* 订单信息 */}
          <div className="bg-[rgba(255,255,255,0.6)] dark:bg-[rgba(0,0,0,0.2)] rounded-[16px] p-4 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-[#999999] dark:text-[#aaaaaa]">订单编号</span>
              <span className="text-[#1a1a1a] dark:text-[#f0f0f3] font-mono">{order.id}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[#999999] dark:text-[#aaaaaa]">创建时间</span>
              <span className="text-[#1a1a1a] dark:text-[#f0f0f3]">
                {new Date(order.createdAt).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[#999999] dark:text-[#aaaaaa]">支付方式</span>
              <span className="text-[#1a1a1a] dark:text-[#f0f0f3]">
                {order.paymentMethod === 'proxy' ? '朋友代付' : '余额支付'}
              </span>
            </div>
          </div>
        </div>

        {/* 底部按钮 */}
        {isShipping && (
          <div className="p-4 pb-8 border-t border-black/5 dark:border-white/5 bg-transparent">
            <button
              onClick={handleDeliver}
              className="w-full py-3 rounded-full bg-[#1a1a1a] dark:bg-white text-white dark:text-[#1a1a1a] font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all shadow-none"
            >
              立刻送到
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
