import React from 'react';
import { Star, Info } from 'lucide-react';
import { CoinAvatar } from '../common/CoinAvatar';

interface CoinHeaderProps {
  coin: {
    image: string;
    name: string;
    symbol: string;
    rank: number;
    price: number;
    change24h: number;
  };
  isWatchlisted: boolean;
  onToggleWatchlist: () => void;
  formatPrice: (price: number) => string;
}

export const CoinHeader: React.FC<CoinHeaderProps> = ({
  coin,
  isWatchlisted,
  onToggleWatchlist,
  formatPrice
}) => {
  return (
    <div className="space-y-6 md:space-y-0 md:flex md:items-start md:justify-between">
      <div className="flex items-center space-x-4 md:space-x-6">
        <CoinAvatar 
          symbol={coin.symbol} 
          name={coin.name} 
          image={coin.image}
          size="xl"
          className="ring-2 ring-[#272757] shadow-lg"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-3 mb-2 md:mb-3">
            <h1 className="text-2xl md:text-3xl font-bold text-black">
              {coin.name}
            </h1>
            <span className="text-lg md:text-xl text-gray-600 font-semibold uppercase">
              {coin.symbol}
            </span>
            <span className="bg-gray-100 text-gray-600 text-sm px-2 py-1 rounded-lg font-medium border border-[#272757]">
              #{coin.rank}
            </span>
          </div>
          
          <div className="space-y-3 md:space-y-0 md:flex md:items-center md:space-x-6">
            <div className="text-3xl md:text-5xl font-bold font-mono text-black">
              ${formatPrice(coin.price)}
            </div>
            <div className="flex items-center space-x-3">
              <span className={`font-bold font-mono text-lg md:text-xl px-3 py-1 rounded-lg border ${
                coin.change24h >= 0 
                  ? 'text-green-700 bg-green-50 border-green-200' 
                  : 'text-red-700 bg-red-50 border-red-200'
              }`}>
                {coin.change24h >= 0 ? '▲' : '▼'} {Math.abs(coin.change24h).toFixed(2)}%
              </span>
              <span className="text-sm text-gray-500 hidden md:inline">(24h)</span>
              <Info className="w-4 h-4 text-gray-400" />
            </div>
          </div>

          {/* Price Range Bar */}
          <div className="mt-4 md:mt-6 flex items-center space-x-3 md:space-x-4">
            <span className="text-sm font-mono text-gray-500 font-medium">$0.1098</span>
            <div className="flex-1 h-2 md:h-3 bg-gray-200 rounded-full relative max-w-64 md:max-w-md border border-[#272757]">
              <div className="h-full bg-gradient-to-r from-red-400 via-yellow-400 to-green-400 rounded-full"></div>
              <div 
                className="absolute top-0 w-1.5 h-2 md:h-3 bg-[#272757] rounded-full shadow-sm" 
                style={{ left: '70%' }}
              ></div>
            </div>
            <span className="text-sm font-mono text-gray-500 font-medium">$0.1267</span>
            <span className="text-xs text-gray-400 hidden sm:inline">24h Range</span>
          </div>
        </div>
      </div>

      <div className="flex justify-center md:justify-start">
        <button
          onClick={onToggleWatchlist}
          className={`flex items-center space-x-3 px-4 md:px-6 py-2 md:py-3 border rounded-xl font-medium transition-all ${
            isWatchlisted 
              ? 'bg-[#272757] border-[#272757] text-white shadow-md hover:bg-[#3a3a6b]' 
              : 'bg-white border-[#272757] text-black hover:bg-[#272757] hover:text-white'
          }`}
        >
          <Star className={`w-5 h-5 ${isWatchlisted ? 'fill-current' : ''}`} />
          <div className="text-left">
            <div className="text-sm md:text-base">
              {isWatchlisted ? 'Added to Portfolio' : 'Add to Portfolio'}
            </div>
            <div className="text-xs opacity-75 hidden md:block">
              2,109,640 watching
            </div>
          </div>
        </button>
      </div>
    </div>
  );
};
