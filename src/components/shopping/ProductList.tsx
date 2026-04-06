import React, { useState, useEffect } from 'react';
import { ArrowLeft, ShoppingCart, Check, Package, Search, RefreshCw, Tag } from 'lucide-react';
import { getAllProducts, fetchDummyProducts, addToCart } from '../../services/shoppingService';
import type { CartItem, Product } from '../../types/shopping';

interface ProductListProps {
  onCartUpdate: (cart: CartItem[]) => void;
  onBack: () => void;
}

export const ProductList: React.FC<ProductListProps> = ({ onCartUpdate, onBack }) => {
  const [addedMap, setAddedMap] = useState<Record<string, boolean>>({});
  const [activeCategory, setActiveCategory] = useState<'shopping' | 'food'>('shopping');
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 初始加载所有本地和硬编码商品
  useEffect(() => {
    loadLocalProducts();
  }, [activeCategory]);

  const loadLocalProducts = () => {
    const all = getAllProducts();
    setProducts(all.filter(p => p.category === activeCategory));
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) {
      loadLocalProducts();
      return;
    }

    setIsLoading(true);
    const dummyProducts = await fetchDummyProducts(searchQuery);
    
    // 合并本地搜索结果和API结果
    const localMatches = getAllProducts().filter(p => 
      p.category === activeCategory && 
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    setProducts([...localMatches, ...dummyProducts]);
    setIsLoading(false);
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    const skip = Math.floor(Math.random() * 100);
    const dummyProducts = await fetchDummyProducts(undefined, skip);
    setProducts(dummyProducts);
    setIsLoading(false);
  };

  const handleAddToCart = (productId: string) => {
    const newCart = addToCart(productId);
    onCartUpdate(newCart);
    setAddedMap(prev => ({ ...prev, [productId]: true }));
    setTimeout(() => {
      setAddedMap(prev => ({ ...prev, [productId]: false }));
    }, 500);
  };

  return (
    <div className="flex flex-col h-full w-full bg-transparent pt-6">
      {/* 顶部区域 */}
      <div className="px-4 pt-2 pb-2 flex flex-col gap-3 relative z-10">
        {/* 第一行：返回按钮与切换条 */}
        <div className="flex items-center justify-between w-full h-10">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-full flex items-center justify-center text-[#1a1a1a] dark:text-[#f0f0f3] active:scale-90 transition-all p-0 bg-transparent shrink-0 -ml-2"
          >
            <ArrowLeft size={20} strokeWidth={2} />
          </button>
          
          <div className="flex-1 flex justify-center">
            <div className="glass-tabs-container w-[160px] h-9 flex items-center">
              <button
                onClick={() => setActiveCategory('shopping')}
                className={`flex-1 h-full text-xs font-bold rounded-full transition-all flex items-center justify-center ${
                  activeCategory === 'shopping' 
                    ? 'glass-tab-active text-gray-900 dark:text-gray-100' 
                    : 'text-gray-500 dark:text-gray-400 bg-transparent'
                }`}
              >
                购物
              </button>
              <button
                onClick={() => setActiveCategory('food')}
                className={`flex-1 h-full text-xs font-bold rounded-full transition-all flex items-center justify-center ${
                  activeCategory === 'food' 
                    ? 'glass-tab-active text-gray-900 dark:text-gray-100' 
                    : 'text-gray-500 dark:text-gray-400 bg-transparent'
                }`}
              >
                外卖
              </button>
            </div>
          </div>
          
          <div className="w-9 h-9 shrink-0"></div> {/* 右侧留空占位，保持居中平衡 */}
        </div>

        {/* 第二行：搜索和换一批 */}
        <div className="flex gap-2 items-center">
          <form onSubmit={handleSearch} className="flex-1">
            <div className="neumorph-input flex items-center w-full !py-2 !px-3 !border-transparent !ring-0 !outline-none shadow-none focus-within:!border-transparent focus-within:!ring-0">
              <Search className="w-4 h-4 text-gray-500 dark:text-gray-400 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索商品..."
                className="w-full bg-transparent border-none outline-none ring-0 focus:ring-0 focus:outline-none pl-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>
          </form>
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="glass-btn-secondary p-2 flex items-center justify-center shrink-0 w-[38px] h-[38px] !px-0"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 商品列表 */}
      <div className="flex-1 overflow-y-auto px-4 pb-32">
        <div className="grid grid-cols-1 gap-4 pb-4">
          {products.map((product) => (
            <div
              key={product.id}
              className="glass-card flex justify-between items-center relative"
            >
              {product.isSecondHand && (
                <div className="absolute top-2 right-2 bg-gray-800/80 text-white text-[10px] px-2 py-0.5 rounded-full z-10 flex items-center gap-1">
                  <Tag size={10} /> 二手
                </div>
              )}
              
              {/* 商品信息（左侧） */}
              <div className="flex flex-col gap-1 flex-1 min-w-0 pr-4 pb-4">
                <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 truncate">{product.name}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-snug">
                  {product.description}
                </p>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-base font-bold text-gray-900 dark:text-gray-100">
                    ¥{product.price.toFixed(0)}
                  </span>
                  {product.originalPrice && (
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 line-through">
                      ¥{product.originalPrice.toFixed(0)}
                    </span>
                  )}
                </div>
              </div>

              {/* 购物车按钮（右侧底部） */}
              <button
                onClick={() => handleAddToCart(product.id)}
                className="cart-add-btn flex items-center justify-center shrink-0 absolute bottom-3 right-3"
              >
                {addedMap[product.id] ? (
                  <Check size={20} strokeWidth={2.5} className="text-[#1a1a1a] dark:text-[#f0f0f3]" />
                ) : (
                  <ShoppingCart size={20} strokeWidth={2} className="text-[#1a1a1a] dark:text-[#f0f0f3]" />
                )}
              </button>
            </div>
          ))}
        </div>
        
        {products.length === 0 && !isLoading && (
          <div className="text-center py-10 opacity-50 text-sm">
            未找到相关商品
          </div>
        )}
      </div>
    </div>
  );
};
