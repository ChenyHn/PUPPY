import React, { useState, useEffect } from 'react';
import { User, Settings, CreditCard, Clock, ChevronRight, Package, Tag, Trash2 } from 'lucide-react';
import { getLocalProducts } from '../../services/shoppingService';
import type { Product } from '../../types/shopping';

export const Profile: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'orders' | 'published'>('orders');
  const [publishedItems, setPublishedItems] = useState<Product[]>([]);

  useEffect(() => {
    loadPublishedItems();
  }, []);

  const loadPublishedItems = () => {
    setPublishedItems(getLocalProducts());
  };

  const handleDeleteItem = (id: string) => {
    if (confirm('确定要删除这个闲置物品吗？')) {
      const items = getLocalProducts().filter(p => p.id !== id);
      localStorage.setItem('user_products', JSON.stringify(items));
      loadPublishedItems();
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-transparent relative">
      {/* 顶部标题栏 - 更紧凑 */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2 relative z-10">
        <div className="w-10" />
        <h2 className="text-sm font-bold opacity-80 text-[#1a1a1a] dark:text-[#f0f0f3] absolute left-1/2 -translate-x-1/2">我的</h2>
        <div className="w-10" />
      </div>

      {/* 头部信息 */}
      <div className="px-5 py-3 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full glass-card p-0 flex items-center justify-center">
          <User size={30} className="text-[#999999] dark:text-[#aaaaaa]" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-[#1a1a1a] dark:text-[#f0f0f3]">PUPPY 用户</h2>
          <p className="text-xs font-medium text-[#999999] dark:text-[#aaaaaa] mt-1">余额: ¥8,888.00</p>
        </div>
      </div>

      {/* 标签切换 */}
      <div className="px-4 mb-4 flex justify-center mt-2">
        <div className="glass-tabs-container flex w-full relative">
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex-1 py-2 text-xs font-bold transition-all flex items-center justify-center gap-1.5 z-10 ${
              activeTab === 'orders' ? 'glass-tab-active text-[#1a1a1a] dark:text-[#f0f0f3]' : 'text-[#999999] dark:text-[#aaaaaa]'
            }`}
          >
            <Package size={14} /> 我的订单
          </button>
          <button
            onClick={() => setActiveTab('published')}
            className={`flex-1 py-2 text-xs font-bold transition-all flex items-center justify-center gap-1.5 z-10 ${
              activeTab === 'published' ? 'glass-tab-active text-[#1a1a1a] dark:text-[#f0f0f3]' : 'text-[#999999] dark:text-[#aaaaaa]'
            }`}
          >
            <Tag size={14} /> 我发布的
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4" style={{ paddingBottom: '70px' }}>
        {activeTab === 'orders' ? (
          <div className="space-y-4">
            {/* 常用功能 */}
            <div className="grid grid-cols-4 gap-3 glass-card py-5">
              {[
                { icon: CreditCard, label: '待付款' },
                { icon: Package, label: '待发货' },
                { icon: Clock, label: '待收货' },
                { icon: Settings, label: '售后' },
              ].map((item, index) => (
                <div key={index} className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-full glass-btn-secondary flex items-center justify-center p-0 shadow-none">
                    <item.icon size={20} className="text-[#666666] dark:text-[#cccccc]" />
                  </div>
                  <span className="text-[10px] font-bold text-[#666666] dark:text-[#cccccc]">{item.label}</span>
                </div>
              ))}
            </div>

            {/* 菜单列表 */}
            <div className="glass-card overflow-hidden p-0 mb-4">
              {[
                '收货地址',
                '我的收藏',
                '浏览历史',
                '客服中心',
                '设置',
              ].map((title, index) => (
                <button
                  key={index}
                  className={`w-full px-4 py-3.5 flex items-center justify-between transition-colors hover:bg-black/5 dark:hover:bg-white/5 bg-transparent ${
                    index !== 4 ? 'border-b border-black/5 dark:border-white/5' : ''
                  }`}
                >
                  <span className="text-sm font-bold text-[#1a1a1a] dark:text-[#f0f0f3] opacity-80">{title}</span>
                  <ChevronRight size={16} className="text-[#999999] dark:text-[#aaaaaa]" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3 pb-4">
            {publishedItems.length === 0 ? (
              <div className="text-center py-16 opacity-50">
                <Tag size={40} className="mx-auto mb-3 text-[#999999] dark:text-[#aaaaaa]" />
                <p className="text-sm text-[#1a1a1a] dark:text-[#f0f0f3] font-bold">还没发布过闲置物品哦</p>
                <p className="text-[11px] mt-1.5 text-[#999999] dark:text-[#aaaaaa]">快去出售页面发布吧</p>
              </div>
            ) : (
              publishedItems.map(item => (
                <div key={item.id} className="glass-card p-3 flex gap-3">
                  <div className="w-16 h-16 rounded-[12px] overflow-hidden bg-[#f0f0f3] dark:bg-[#1a1a1a] flex-shrink-0">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl opacity-50">📦</div>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col justify-between py-0.5">
                    <div>
                      <h4 className="font-bold text-sm text-[#1a1a1a] dark:text-[#f0f0f3] truncate leading-tight">{item.name}</h4>
                      <p className="text-[10px] text-[#999999] dark:text-[#aaaaaa] line-clamp-1 mt-1">{item.description}</p>
                    </div>
                    <div className="flex items-center justify-between mt-auto">
                      <span className="font-bold text-sm text-[#1a1a1a] dark:text-[#f0f0f3] leading-none">¥{item.price.toFixed(2)}</span>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-1 rounded-full text-[#999999] dark:text-[#aaaaaa] hover:text-red-500 transition-colors active:scale-90 bg-transparent"
                      >
                        <Trash2 size={14} strokeWidth={2} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
