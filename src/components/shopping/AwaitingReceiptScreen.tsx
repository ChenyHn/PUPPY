import React, { useState, useEffect } from 'react';
import { ArrowLeft, Package } from 'lucide-react';
import { getOrders, getProductById } from '../../services/shoppingService';
import type { Order } from '../../types/shopping';
import { OrderDetailModal } from './OrderDetailModal';

interface AwaitingReceiptScreenProps {
  onBack: () => void;
}

export const AwaitingReceiptScreen: React.FC<AwaitingReceiptScreenProps> = ({ onBack }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [now, setNow] = useState(Date.now());

  const loadOrders = () => {
    setOrders(getOrders().filter(o => o.status === 'shipping'));
  };

  useEffect(() => {
    loadOrders();
    const interval = setInterval(() => {
      setNow(Date.now());
      loadOrders(); // 刷新列表，以防有订单状态被其他地方修改
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTimeRemaining = (estimatedDeliveryTime: number) => {
    const diff = estimatedDeliveryTime - now;
    if (diff <= 0) return '已送达';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    if (days > 0) return `剩余 ${days}天 ${hours}小时`;
    if (hours > 0) return `剩余 ${hours}小时 ${minutes}分钟`;
    return `剩余 ${minutes}分钟 ${seconds}秒`;
  };

  return (
    <div className="absolute inset-0 flex flex-col z-50 bg-[#F5F5F5] dark:bg-[#121212] overflow-hidden">
      {/* 顶部标题栏 */}
      <div className="flex justify-between items-center px-4 pt-12 pb-4 z-10 bg-[rgba(245,245,245,0.8)] dark:bg-[rgba(18,18,18,0.8)] backdrop-blur-md sticky top-0">
        <button 
          onClick={onBack}
          className="w-8 h-8 shrink-0 flex items-center justify-center text-[#1a1a1a] dark:text-[#f0f0f3] bg-transparent p-0 border-none shadow-none active:scale-90 transition-transform rounded-full hover:bg-black/5 dark:hover:bg-white/5"
        >
          <ArrowLeft size={24} strokeWidth={2} />
        </button>
        <div className="flex-1 flex justify-center items-center h-9">
          <h1 className="text-lg font-bold text-[#1a1a1a] dark:text-[#f0f0f3]">待收货</h1>
        </div>
        <div className="w-8 h-8 shrink-0" /> {/* 占位保持平衡 */}
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-8 custom-scrollbar">
        <div className="space-y-4 pt-2">
          {orders.map(order => {
            const firstProduct = order.items[0] ? getProductById(order.items[0].productId) || { name: '未知商品' } : { name: '未知商品' };
            const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);
            
            return (
              <div 
                key={order.id} 
                className="bg-[rgba(255,255,255,0.7)] dark:bg-[rgba(30,30,35,0.7)] backdrop-blur-[12px] border border-[rgba(255,255,255,0.9)] dark:border-[rgba(255,255,255,0.1)] rounded-[16px] p-4 flex flex-col gap-3 cursor-pointer active:scale-[0.98] transition-all shadow-none"
                onClick={() => setSelectedOrder(order)}
              >
                <div className="flex justify-between items-center pb-3 border-b border-black/5 dark:border-white/5">
                  <span className="text-xs text-[#999999] dark:text-[#aaaaaa] font-medium">订单号: {order.id.slice(0,6)}...</span>
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{formatTimeRemaining(order.estimatedDeliveryTime)}</span>
                </div>
                
                <div className="py-2 flex items-center gap-3">
                   <div className="w-12 h-12 bg-black/5 dark:bg-white/5 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Package size={24} className="text-[#999999] dark:text-[#aaaaaa]" />
                   </div>
                   <div className="flex-1 min-w-0">
                     <div className="text-sm font-bold text-[#1a1a1a] dark:text-[#f0f0f3] truncate">
                        {firstProduct.name}
                     </div>
                     <div className="text-xs text-[#999999] dark:text-[#aaaaaa] mt-1">
                        共 {totalItems} 件商品
                     </div>
                   </div>
                   <div className="text-right">
                     <div className="text-sm font-bold text-[#1a1a1a] dark:text-[#f0f0f3]">
                        ¥{order.totalAmount.toFixed(2)}
                     </div>
                   </div>
                </div>
              </div>
            )
          })}
          
          {orders.length === 0 && (
            <div className="text-center py-20 opacity-50 flex flex-col items-center">
              <Package size={48} className="mb-4 text-[#999999] dark:text-[#aaaaaa]" strokeWidth={1} />
              <p className="text-sm text-[#1a1a1a] dark:text-[#f0f0f3] font-bold">暂无待收货订单</p>
            </div>
          )}
        </div>
      </div>

      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onRefresh={loadOrders}
        />
      )}
    </div>
  );
};
