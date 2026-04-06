export interface RedPacketData {
  id: string;
  amount: number;
  message: string;
  senderId: string;
  receiverId: string;
  timestamp: number;
  type?: 'normal' | 'lucky';
}

export const redPacketService = {
  createRedPacket(amount: number, message: string, senderId: string = 'me', receiverId: string = 'ai', type: 'normal' | 'lucky' = 'normal'): RedPacketData {
    return {
      id: `rp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      amount,
      message: message || '恭喜发财，大吉大利',
      senderId,
      receiverId,
      timestamp: Date.now(),
      type
    };
  }
};
