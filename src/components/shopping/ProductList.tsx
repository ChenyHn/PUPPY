import React, { useState, useEffect } from 'react';
import { ShoppingCart, Check, Package, Search, RefreshCw, Tag } from 'lucide-react';
import { getAllProducts, fetchDummyProducts, addToCart } from '../../services/shoppingService';
import type { CartItem, Product } from '../../types/shopping';

// 商品占位图颜色
const PLACEHOLDER_COLORS = [
  'from-rose-100 to-rose-200 dark:from-rose-900/30 dark:to-rose-800/30',
  'from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30',
  'from-amber-100 to-amber-200 dark:from-amber-900/30 dark:to-amber-800/30',
  'from-emerald-100 to-emerald-200 dark:from-emerald-900/30 dark:to-emerald-800/30',
  'from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-800/30',
  'from-cyan-100 to-cyan-200 dark:from-cyan-900/30 dark:to-cyan-800/30',
];

const PLACEHOLDER_ICONS = ['👕', '🎧', '📓', '🥤', '🎒', '💡'];

interface ProductListProps {
  onCartUpdate: (cart: CartItem[]) => void;
}

export const ProductList: React.FC<ProductListProps> = ({ onCartUpdate }) => {
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
    }, 1200);
  };

  return (
    <div className="flex flex-col h-full w-full bg-transparent">
      {/* 顶部区域：紧凑排列，避免多余留白 */}
      <div className="px-4 pt-2 pb-2 flex flex-col gap-2 relative z-10">
        {/* 第一行：分类切换，水平居中 */}
        <div className="flex items-center justify-center w-full mt-1">
          <div className="glass-tabs-container flex w-[180px]">
            <button
              onClick={() => setActiveCategory('shopping')}
              className={`flex-1 py-1.5 text-xs font-bold transition-all z-10 ${
                activeCategory === 'shopping' ? 'glass-tab-active' : 'opacity-60 text-[#1a1a1a] dark:text-[#f0f0f3]'
              }`}
            >
              购物
            </button>
            <button
              onClick={() => setActiveCategory('food')}
              className={`flex-1 py-1.5 text-xs font-bold transition-all z-10 ${
                activeCategory === 'food' ? 'glass-tab-active' : 'opacity-60 text-[#1a1a1a] dark:text-[#f0f0f3]'
              }`}
            >
              外卖
            </button>
          </div>
        </div>

        {/* 第二行：搜索和换一批 */}
        <div className="flex gap-2">
          <form onSubmit={handleSearch} className="flex-1 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索商品..."
              className="w-full neumorph-input pl-9 pr-3 py-1.5 text-sm"
            />
            <Search className="absolute left-3 top-2.5 w-4 h-4 opacity-50" />
          </form>
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="glass-btn-secondary px-3 py-1.5 flex items-center justify-center gap-1 min-w-fit"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="text-xs">换一批</span>
          </button>
        </div>
      </div>

      {/* 商品列表 */}
      <div className="flex-1 overflow-y-auto px-4" style={{ paddingBottom: '70px' }}>
        <div className="grid grid-cols-2 gap-3 pb-4">
          {products.map((product, index) => (
            <div
              key={product.id}
              className="glass-card overflow-hidden flex flex-col relative p-0"
            >
              {product.isSecondHand && (
                <div className="absolute top-2 left-2 bg-[#1a1a1a]/70 text-[#f0f0f3] text-[10px] px-2 py-0.5 rounded-full backdrop-blur-md z-10 flex items-center gap-1">
                  <Tag size={10} /> 二手
                </div>
              )}
              
              {/* 商品图片 */}
              <div className={`aspect-square w-full relative overflow-hidden rounded-t-[16px] ${!product.imageUrl ? `bg-gradient-to-br ${PLACEHOLDER_COLORS[index % PLACEHOLDER_COLORS.length]}` : ''}`}>
                {product.imageUrl ? (
                  <img 
                    src={product.imageUrl} 
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl">
                    {PLACEHOLDER_ICONS[index % PLACEHOLDER_ICONS.length]}
                  </div>
                )}
                {/* 光泽叠加层 */}
                <div
                  className="absolute inset-0 pointer-events-none rounded-[inherit]"
                  style={{
                    background: 'radial-gradient(ellipse at 30% 30%, rgba(255,255,255,0.4) 0%, transparent 60%)',
                  }}
                />
              </div>

              {/* 商品信息 */}
              <div className="p-2 flex flex-col gap-1 flex-1">
                <h3 className="text-sm font-bold text-[#1a1a1a] dark:text-[#f0f0f3] truncate leading-tight">{product.name}</h3>
                <p className="text-[10px] text-[#999999] dark:text-[#aaaaaa] line-clamp-2 leading-snug min-h-[28px]">
                  {product.description}
                </p>
                <div className="flex items-center justify-between mt-auto pt-1">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-[#1a1a1a] dark:text-[#f0f0f3] leading-none">
                      ¥{product.price.toFixed(0)}
                    </span>
                    {product.originalPrice && (
                      <span className="text-[9px] text-[#999999] dark:text-[#aaaaaa] line-through mt-0.5">
                        ¥{product.originalPrice.toFixed(0)}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleAddToCart(product.id)}
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-all active:scale-90 ${
                      addedMap[product.id]
                        ? 'glass-btn-primary p-0'
                        : 'glass-btn-secondary p-0'
                    }`}
                  >
                    {addedMap[product.id] ? (
                      <Check size={14} strokeWidth={2.5} />
                    ) : (
                      <ShoppingCart size={14} strokeWidth={2} />
                    )}
                  </button>
                </div>
              </div>
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
