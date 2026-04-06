import React, { useState, useEffect } from 'react';
import { renderInPhoneContainer } from '../../utils/portal';
import { X } from 'lucide-react';
import { giftService, GiftItem, GiftData } from '../../services/giftService';

interface GiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (data: GiftData) => void;
}

export const GiftModal: React.FC<GiftModalProps> = ({ isOpen, onClose, onSend }) => {
  const [gifts, setGifts] = useState<GiftItem[]>([]);
  const [selectedGiftId, setSelectedGiftId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setGifts(giftService.getGiftList());
      setSelectedGiftId(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSend = () => {
    if (!selectedGiftId) return;
    
    const data = giftService.sendGift(selectedGiftId);
    if (data) {
      onSend(data);
      onClose();
    }
  };

  const selectedGift = gifts.find(g => g.id === selectedGiftId);

  const modalContent = (
    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-end justify-center sm:items-center sm:p-4">
      <div className="bg-white/90 backdrop-blur-md w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95">
        {/* Header */}
        <div className="p-4 flex justify-between items-center border-b">
          <h3 className="text-lg font-medium w-full text-center">送礼物</h3>
          <button onClick={onClose} className="absolute right-4 text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {/* Gift Grid */}
        <div className="p-4 grid grid-cols-3 sm:grid-cols-4 gap-4 max-h-[60vh] overflow-y-auto">
          {gifts.map(gift => (
            <div 
              key={gift.id}
              onClick={() => setSelectedGiftId(gift.id)}
              className={`p-3 rounded-xl border-2 flex flex-col items-center justify-center cursor-pointer transition-all
                ${selectedGiftId === gift.id 
                  ? 'border-pink-500 bg-pink-50' 
                  : 'border-transparent hover:bg-gray-50'}`}
            >
              <span className="text-3xl mb-2">{gift.icon}</span>
              <span className="text-sm font-medium text-gray-800">{gift.name}</span>
              <span className="text-xs text-pink-500 mt-1">¥{gift.price}</span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex items-center justify-between bg-gray-50">
          <div className="text-gray-600">
            {selectedGift ? (
              <span>总计: <span className="text-pink-500 font-bold text-lg">¥{selectedGift.price}</span></span>
            ) : (
              <span>请选择礼物</span>
            )}
          </div>
          <button 
            onClick={handleSend}
            className={`px-6 py-2 rounded-full font-medium text-white transition-colors
              ${selectedGift 
                ? 'bg-pink-500 hover:bg-pink-600 active:bg-pink-700' 
                : 'bg-pink-300 cursor-not-allowed'}`}
            disabled={!selectedGift}
          >
            赠送
          </button>
        </div>
      </div>
    </div>
  );

  return renderInPhoneContainer(modalContent);
};
