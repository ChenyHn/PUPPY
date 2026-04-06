export interface GiftItem {
  id: string;
  name: string;
  icon: string;
  price: number;
}

export interface GiftData {
  id: string;
  giftId: string;
  senderId: string;
  receiverId: string;
  timestamp: number;
  giftInfo: GiftItem;
}

const PRESET_GIFTS: GiftItem[] = [
  { id: 'rose', name: '玫瑰', icon: '🌹', price: 1 },
  { id: 'chocolate', name: '巧克力', icon: '🍫', price: 5 },
  { id: 'ring', name: '钻戒', icon: '💍', price: 99 },
  { id: 'car', name: '跑车', icon: '🚗', price: 520 },
  { id: 'house', name: '别墅', icon: '🏠', price: 1314 },
  { id: 'rocket', name: '火箭', icon: '🚀', price: 9999 }
];

export const giftService = {
  getGiftList(): GiftItem[] {
    return PRESET_GIFTS;
  },

  sendGift(giftId: string, senderId: string = 'me', receiverId: string = 'ai'): GiftData | null {
    const giftInfo = PRESET_GIFTS.find(g => g.id === giftId);
    if (!giftInfo) return null;

    return {
      id: `gift_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      giftId,
      senderId,
      receiverId,
      timestamp: Date.now(),
      giftInfo
    };
  }
};
