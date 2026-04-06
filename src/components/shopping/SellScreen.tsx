import React, { useState, useRef } from 'react';
import { Camera, Image as ImageIcon, X, ArrowLeft } from 'lucide-react';
import { saveLocalProduct } from '../../services/shoppingService';
import type { Product } from '../../types/shopping';

interface SellScreenProps {
  onBack: () => void;
  onSuccess: () => void;
}

export function SellScreen({ onBack, onSuccess }: SellScreenProps) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'shopping' | 'food'>('shopping');
  const [image, setImage] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price) return;

    const newProduct: Product = {
      id: `local_${Date.now()}`,
      name,
      price: parseFloat(price),
      originalPrice: originalPrice ? parseFloat(originalPrice) : undefined,
      description,
      category,
      stock: 1,
      imageUrl: image || undefined,
    };

    saveLocalProduct(newProduct);
    onSuccess();
  };

  return (
    <div className="flex flex-col h-full w-full bg-transparent relative">
      {/* 顶部标题栏 - 更紧凑 */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2 relative z-10">
        <div className="w-10" />
        <h2 className="text-sm font-bold opacity-80 text-[#1a1a1a] dark:text-[#f0f0f3] absolute left-1/2 -translate-x-1/2">发布闲置</h2>
        <div className="w-10" />
      </div>

      <div className="flex-1 overflow-y-auto px-4" style={{ paddingBottom: '70px' }}>
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* 图片上传 */}
          <div className="glass-card p-0 flex flex-col items-center justify-center min-h-[140px] relative overflow-hidden">
            {image ? (
              <>
                <img src={image} alt="Preview" className="w-full h-full object-cover rounded-[16px] absolute inset-0" />
                <button
                  type="button"
                  onClick={() => setImage(null)}
                  className="absolute top-3 right-3 glass-btn-secondary p-1.5 text-[#1a1a1a] dark:text-[#f0f0f3] z-10"
                >
                  <X className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center text-[#999999] dark:text-[#aaaaaa] w-full h-[140px] justify-center bg-transparent"
              >
                <div className="glass-btn-secondary p-3 mb-2 shadow-none">
                  <Camera className="w-6 h-6" />
                </div>
                <span className="text-xs mt-1">添加图片</span>
              </button>
            )}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />
          </div>

          <div className="glass-card space-y-3">
            <div>
              <label className="block text-[11px] font-bold mb-1.5 opacity-80 text-[#1a1a1a] dark:text-[#f0f0f3]">物品名称</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例如：9新 iPhone 13"
                className="w-full neumorph-input px-3 py-2 text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold mb-1.5 opacity-80 text-[#1a1a1a] dark:text-[#f0f0f3]">描述</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="描述一下物品的成色、使用情况等..."
                className="w-full neumorph-input px-3 py-2 text-sm min-h-[80px] resize-none"
                required
              />
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-[11px] font-bold mb-1.5 opacity-80 text-[#1a1a1a] dark:text-[#f0f0f3]">出售价格</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 opacity-60 text-[#1a1a1a] dark:text-[#f0f0f3] text-sm">¥</span>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full neumorph-input pl-7 pr-3 py-2 text-sm"
                    required
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
              <div className="flex-1">
                <label className="block text-[11px] font-bold mb-1.5 opacity-80 text-[#1a1a1a] dark:text-[#f0f0f3]">原价 (可选)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 opacity-60 text-[#1a1a1a] dark:text-[#f0f0f3] text-sm">¥</span>
                  <input
                    type="number"
                    value={originalPrice}
                    onChange={(e) => setOriginalPrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full neumorph-input pl-7 pr-3 py-2 text-sm"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold mb-1.5 opacity-80 text-[#1a1a1a] dark:text-[#f0f0f3]">分类</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as 'shopping' | 'food')}
                className="w-full neumorph-input px-3 py-2 text-sm appearance-none bg-transparent text-[#1a1a1a] dark:text-[#f0f0f3]"
              >
                <option value="shopping" className="dark:bg-[#1a1a1a]">数码/百货/服饰</option>
                <option value="food" className="dark:bg-[#1a1a1a]">食品/生鲜/餐饮</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="w-full glass-btn-primary py-3 font-bold text-sm mt-4 shadow-sm"
          >
            确认发布
          </button>
        </form>
      </div>
    </div>
  );
}
