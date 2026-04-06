import React from 'react';
import { GiftData } from '../../services/giftService';

interface GiftMessageProps {
  data: GiftData;
  isSelf?: boolean;
}

export const GiftMessage: React.FC<GiftMessageProps> = ({ data, isSelf = false }) => {
  return (
    <div className={`bg-gradient-to-r from-pink-50 to-purple-50 p-3 rounded-2xl border border-pink-100 shadow-sm flex items-center gap-3 max-w-[80%] ${isSelf ? 'rounded-tr-none' : 'rounded-tl-none'}`}>
      <div className="text-4xl">
        {data.giftInfo.icon}
      </div>
      <div>
        <div className="text-sm text-gray-500 mb-1">
          {isSelf ? '送出了' : '收到了'}
        </div>
        <div className="font-bold text-gray-800 flex items-center gap-2">
          {data.giftInfo.name}
          <span className="text-xs font-normal text-pink-500 bg-pink-100 px-2 py-0.5 rounded-full">
            ¥{data.giftInfo.price}
          </span>
        </div>
      </div>
    </div>
  );
};
