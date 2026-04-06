import React from 'react';
import { MapPin, ExternalLink } from 'lucide-react';
import { LocationData } from '../../services/locationService';

interface LocationMessageProps {
  data: LocationData;
  isSelf: boolean;
}

export function LocationMessage({ data, isSelf }: LocationMessageProps) {
  if (!data) return null;

  return (
    <div 
      className={`p-4 rounded-2xl text-sm relative select-text flex flex-col gap-2 max-w-[240px]
        ${isSelf ? 'bg-zinc-800 text-white rounded-tr-none dark:bg-zinc-800 dark:text-zinc-100' : 'bg-white dark:bg-[#1c1c1e] text-zinc-700 dark:text-zinc-200 rounded-tl-none shadow'}`}
    >
      <div className="flex items-center gap-2 font-bold mb-1">
        <MapPin size={16} className={isSelf ? 'text-zinc-300' : 'text-zinc-500'} />
        <span>[位置]</span>
        {data.type === 'virtual' && (
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isSelf ? 'bg-white/20' : 'bg-zinc-100 dark:bg-zinc-800'}`}>虚拟</span>
        )}
      </div>
      
      <div className="whitespace-pre-wrap break-words">{data.name}</div>
      
      {data.type === 'real' && data.mapUrl && (
        <a 
          href={data.mapUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs mt-1 transition-colors
            ${isSelf ? 'bg-white/10 hover:bg-white/20' : 'bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-700'}`}
          onClick={(e) => e.stopPropagation()}
        >
          <span>查看地图</span>
          <ExternalLink size={12} />
        </a>
      )}
    </div>
  );
}
