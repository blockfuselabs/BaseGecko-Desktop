import React, { useState, useEffect } from 'react';
import { Star, TrendingUp, TrendingDown, Eye, AlertCircle, RefreshCw, Trash2, Bell, Search, Plus } from 'lucide-react';
import { coinsService, Coin } from '../services/coinService';
import { CoinAvatar } from '../components/common/CoinAvatar';

interface WatchlistProps {
  onViewCoinDetail: (coinData: { coinId: string; coinImage?: string; coinData?: Coin }) => void;
  onNavigateToDashboard?: () => void; 
}

interface WatchlistItem {
  coinId: string;
  addedAt: string;
  alerts?: {
    priceAbove?: number;
    priceBelow?: number;
    volumeChange?: number;
  };
}

class WatchlistStorage {
  private static STORAGE_KEY = 'basegecko_watchlist';

  static async getWatchlist(): Promise<WatchlistItem[]> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      const parsed = stored ? JSON.parse(stored) : [];
      
      if (!Array.isArray(parsed)) {
        console.warn('Invalid watchlist data, resetting...');
        await this.saveWatchlist([]);
        return [];
      }
      
      const validItems = parsed.filter((item: any) => 
        item && 
        typeof item === 'object' && 
        typeof item.coinId === 'string' && 
        typeof item.addedAt === 'string'
      );
      
      if (validItems.length !== parsed.length) {
        console.log('Cleaned up invalid watchlist items');
        await this.saveWatchlist(validItems);
      }
      
      return validItems;
    } catch (error) {
      console.error('Failed to load watchlist:', error);
      await this.saveWatchlist([]);
      return [];
    }
  }

  static async saveWatchlist(watchlist: WatchlistItem[]): Promise<void> {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(watchlist));
    } catch (error) {
      console.error('Failed to save watchlist:', error);
    }
  }

  static async addToWatchlist(coinId: string): Promise<boolean> {
    try {
      const watchlist = await this.getWatchlist();
      
      if (watchlist.some(item => item.coinId === coinId)) {
        return false;
      }
      
      const newItem: WatchlistItem = {
        coinId,
        addedAt: new Date().toISOString(),
      };
      
      await this.saveWatchlist([...watchlist, newItem]);
      return true;
    } catch (error) {
      console.error('Failed to add to watchlist:', error);
      return false;
    }
  }

  static async removeFromWatchlist(coinId: string): Promise<boolean> {
    try {
      const watchlist = await this.getWatchlist();
      const filtered = watchlist.filter(item => item.coinId !== coinId);
      
      if (filtered.length === watchlist.length) {
        return false;
      }
      
      await this.saveWatchlist(filtered);
      return true;
    } catch (error) {
      console.error('Failed to remove from watchlist:', error);
      return false;
    }
  }

  static async isWatchlisted(coinId: string): Promise<boolean> {
    const watchlist = await this.getWatchlist();
    return watchlist.some(item => item.coinId === coinId);
  }

  static async clearWatchlist(): Promise<void> {
    await this.saveWatchlist([]);
  }
}

interface WatchlistCoinCardProps {
  coin: Coin;
  watchlistItem: WatchlistItem;
  onViewDetails: (coinId: string) => void;
  onRemove: (coinId: string) => void;
}

const WatchlistCoinCard: React.FC<WatchlistCoinCardProps> = ({ 
  coin, 
  watchlistItem, 
  onViewDetails, 
  onRemove 
}) => {
  const formatPrice = (price: number): string => {
    return price < 0.0001 ? price.toFixed(8) : 
           price < 1 ? price.toFixed(6) : 
           price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatNumber = (num: number): string => {
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
    return num.toFixed(0);
  };

  const getDaysAdded = (): string => {
    const added = new Date(watchlistItem.addedAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - added.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 1) return 'Today';
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return `${Math.floor(diffDays / 30)}m ago`;
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-all duration-200 group relative">
      <div className="absolute -top-2 -right-2 bg-indigo-600 text-white p-1 rounded-full">
        <Star className="w-3 h-3" />
      </div>

      <div className="flex items-center justify-between mb-4">
        <div 
          className="flex items-center space-x-3 cursor-pointer"
          onClick={() => onViewDetails(coin.id)}
        >
          <CoinAvatar 
            symbol={coin.symbol} 
            name={coin.name} 
            image={coin.image}
            size="md"
          />
          <div>
            <h3 className="font-semibold text-gray-900">{coin.name}</h3>
            <p className="text-xs text-gray-500 uppercase">{coin.symbol}</p>
          </div>
        </div>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(coin.id);
          }}
          className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
          title="Remove from Watchlist"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="mb-4">
        <div className="flex items-baseline justify-between mb-1">
          <span className="text-xl font-bold text-gray-900">
            ${formatPrice(coin.price)}
          </span>
          <span className={`text-sm font-medium px-2 py-1 rounded ${
            coin.change24h >= 0 
              ? 'bg-green-50 text-green-700' 
              : 'bg-red-50 text-red-700'
          }`}>
            {coin.change24h >= 0 ? '↑' : '↓'} {Math.abs(coin.change24h).toFixed(2)}%
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
        <div>
          <p className="text-xs text-gray-500 mb-1">Market Cap</p>
          <p className="font-medium text-gray-900">${formatNumber(coin.marketCap)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Volume (24h)</p>
          <p className="font-medium text-gray-900">${formatNumber(coin.volume24h)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Holders</p>
          <p className="font-medium text-gray-900">{formatNumber(coin.holders)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Added</p>
          <p className="font-medium text-gray-900">{getDaysAdded()}</p>
        </div>
      </div>

      <button
        onClick={() => onViewDetails(coin.id)}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg font-medium transition-colors text-sm"
      >
        View Analytics
      </button>
    </div>
  );
};

export const Watchlist: React.FC<WatchlistProps> = ({ onViewCoinDetail, onNavigateToDashboard }) => {
  const [watchlistItems, setWatchlistItems] = useState<WatchlistItem[]>([]);
  const [coins, setCoins] = useState<Coin[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'added' | 'price' | 'change' | 'volume' | 'name'>('added');
  const [filterBy, setFilterBy] = useState<'all' | 'gainers' | 'losers'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const loadWatchlistData = async () => {
    try {
      setError(null);
      setLoading(true);
      
      const items = await WatchlistStorage.getWatchlist();
      console.log('Loaded watchlist items:', items);
      setWatchlistItems(items);

      if (items.length === 0) {
        setLoading(false);
        return;
      }

      try {
        
        const coinDetailsPromises = items.map(async (item) => {
          try {
            
            let address = item.coinId;
            if (item.coinId.includes('=') && item.coinId.length > 20) {
              try {
                const decoded = atob(item.coinId);
                const addressMatch = decoded.match(/0x[a-fA-F0-9]{40}/);
                if (addressMatch) {
                  address = addressMatch[0];
                }
              } catch (error) {
                console.warn('Failed to decode base64 coinId:', item.coinId);
              }
            }

            const coinDetails = await coinsService.getCoinByAddress(address);
            if (!coinDetails) {
              console.warn(`No details found for coin with address: ${address}`);
              return null;
            }
            return coinDetails;
          } catch (error) {
            console.error(`Failed to fetch details for coin ${item.coinId}:`, error);
            return null;
          }
        });

        const results = await Promise.all(coinDetailsPromises);
        const validCoins = results.filter((coin): coin is Coin => coin !== null);

        console.log(`Successfully fetched details for ${validCoins.length} out of ${items.length} coins`);
        
        if (validCoins.length === 0) {
          setError('Unable to fetch details for any of your watched coins. They might be delisted or temporarily unavailable.');
        } else if (validCoins.length < items.length) {
          
          const foundAddresses = new Set(validCoins.map(coin => coin.address.toLowerCase()));
          const cleanedItems = items.filter(item => {
            const itemAddress = item.coinId.toLowerCase();
            return foundAddresses.has(itemAddress);
          });
          
          if (cleanedItems.length !== items.length) {
            console.log('🧹 Cleaning up outdated watchlist items');
            await WatchlistStorage.saveWatchlist(cleanedItems);
            setWatchlistItems(cleanedItems);
          }
        }

        setCoins(validCoins);

      } catch (apiError) {
        console.error('Failed to fetch coins from API:', apiError);
        setError(`Failed to load coin data from API: ${apiError instanceof Error ? apiError.message : 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error loading watchlist:', error);
      setError('Failed to load watchlist');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWatchlistData();
    
    const interval = setInterval(() => {
      if (watchlistItems.length > 0 && !loading) {
        loadWatchlistData();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadWatchlistData();
    setRefreshing(false);
  };

  const handleRemoveFromWatchlist = async (coinId: string) => {
    const coin = coins.find(c => c.id === coinId);
    const coinName = coin?.name || coinId;
    
    if (!confirm(`Remove ${coinName} from your watchlist?`)) {
      return;
    }
    
    try {
      const success = await WatchlistStorage.removeFromWatchlist(coinId);
      
      if (success) {
        setWatchlistItems(prev => prev.filter(item => item.coinId !== coinId));
        setCoins(prev => prev.filter(coin => coin.id !== coinId));
      }
    } catch (error) {
      console.error('Failed to remove from watchlist:', error);
      setError('Failed to remove coin from watchlist');
    }
  };

  const handleViewDetails = (coinId: string) => {
    const coin = coins.find(c => c.id === coinId);
    if (coin) {
      onViewCoinDetail({
        coinId: coin.id,
        coinImage: coin.image,
        coinData: coin,
      });
    }
  };

  const handleClearWatchlist = async () => {
    if (!confirm('Clear your entire watchlist? This cannot be undone.')) {
      return;
    }
    
    try {
      await WatchlistStorage.clearWatchlist();
      setWatchlistItems([]);
      setCoins([]);
    } catch (error) {
      console.error('Failed to clear watchlist:', error);
    }
  };

  const handleNavigateToDashboard = () => {
    if (onNavigateToDashboard) {
      onNavigateToDashboard();
    } else {
      console.log('Navigate to dashboard - no callback provided');
    }
  };

  const filteredAndSortedCoins = coins
    .filter(coin => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return coin.name.toLowerCase().includes(query) || 
               coin.symbol.toLowerCase().includes(query);
      }
      
      if (filterBy === 'gainers') return coin.change24h > 0;
      if (filterBy === 'losers') return coin.change24h < 0;
      return true;
    })
    .sort((a, b) => {
      const aItem = watchlistItems.find(item => item.coinId === a.id);
      const bItem = watchlistItems.find(item => item.coinId === b.id);
      
      switch (sortBy) {
        case 'added':
          return new Date(bItem?.addedAt || 0).getTime() - new Date(aItem?.addedAt || 0).getTime();
        case 'price':
          return b.price - a.price;
        case 'change':
          return b.change24h - a.change24h;
        case 'volume':
          return b.volume24h - a.volume24h;
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

  const stats = {
    total: coins.length,
    gainers: coins.filter(coin => coin.change24h > 0).length,
    losers: coins.filter(coin => coin.change24h < 0).length,
    alerts: 0,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <div className=" mx-auto space-y-6">
          <div className="animate-pulse bg-gray-200 h-10 w-64 rounded-lg"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-gray-200 h-24 rounded-xl"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-gray-200 h-64 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">My Watchlist</h1>
            <p className="text-gray-500 mt-1">Track your favorite cryptocurrencies</p>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="text-sm font-medium">Refresh</span>
            </button>
            
            <button 
              onClick={handleNavigateToDashboard}
              className="flex items-center gap-2 bg-[#272757] hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm font-medium">Add Coins</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Star className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Tracked</p>
                <p className="text-xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Gainers</p>
                <p className="text-xl font-bold text-green-600">{stats.gainers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <TrendingDown className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Losers</p>
                <p className="text-xl font-bold text-red-600">{stats.losers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Bell className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Alerts</p>
                <p className="text-xl font-bold text-yellow-600">{stats.alerts}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search coins..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm text-black placeholder-gray-500"
              />
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value as 'all' | 'gainers' | 'losers')}
                className="w-full md:w-auto px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm text-black"
              >
                <option value="all">All Coins</option>
                <option value="gainers">Gainers</option>
                <option value="losers">Losers</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'added' | 'price' | 'change' | 'volume' | 'name')}
                className="w-full md:w-auto px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm text-black"
              >
                <option value="added">Recently Added</option>
                <option value="name">Name</option>
                <option value="price">Price</option>
                <option value="change">24h Change</option>
                <option value="volume">Volume</option>
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-red-700 text-sm font-medium">Watchlist Error</span>
                  <p className="text-red-600 text-sm mt-1">{error}</p>
                  
                  {error.includes('not found') && (
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        onClick={handleClearWatchlist}
                        className="text-xs bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1 rounded border border-red-300 transition-colors"
                      >
                        Clear Watchlist
                      </button>
                      <button
                        onClick={handleRefresh}
                        className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded border border-blue-300 transition-colors"
                      >
                        Retry
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <button 
                onClick={() => setError(null)} 
                className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100 transition-colors"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {filteredAndSortedCoins.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredAndSortedCoins.map((coin) => {
              const watchlistItem = watchlistItems.find(item => {
                // Try multiple ways to match the coin with watchlist item
                const itemIdLower = item.coinId.toLowerCase();
                const coinIdLower = coin.id.toLowerCase();
                const coinAddressLower = coin.address?.toLowerCase();
                
                // Method 1: Direct ID match
                if (item.coinId === coin.id) return true;
                
                // Method 2: Address match
                if (coinAddressLower && itemIdLower === coinAddressLower) return true;
                
                // Method 3: Extract address from base64 coin ID
                try {
                  if (coin.id.includes('=') && coin.id.length > 20) {
                    const decoded = atob(coin.id);
                    const addressMatch = decoded.match(/0x[a-fA-F0-9]{40}/);
                    if (addressMatch && addressMatch[0].toLowerCase() === itemIdLower) return true;
                  }
                } catch (e) {
                  // Ignore decode errors
                }
                
                // Method 4: Extract address from base64 watchlist item
                try {
                  if (item.coinId.includes('=') && item.coinId.length > 20) {
                    const decoded = atob(item.coinId);
                    const addressMatch = decoded.match(/0x[a-fA-F0-9]{40}/);
                    if (addressMatch && coinAddressLower && addressMatch[0].toLowerCase() === coinAddressLower) return true;
                  }
                } catch (e) {
                  // Ignore decode errors
                }
                
                return false;
              });
              
              if (!watchlistItem) {
                console.log('⚠️ No watchlist item found for coin:', {
                  coinId: coin.id,
                  coinName: coin.name,
                  coinAddress: coin.address,
                  watchlistItems: watchlistItems.map(item => ({
                    coinId: item.coinId,
                    addedAt: item.addedAt
                  }))
                });
                return null;
              }
              
              console.log('✅ Rendering coin card:', {
                coinName: coin.name,
                coinId: coin.id,
                coinAddress: coin.address,
                watchlistItemId: watchlistItem.coinId
              });
              
              return (
                <WatchlistCoinCard
                  key={`${coin.id}-${watchlistItem.coinId}`}
                  coin={coin}
                  watchlistItem={watchlistItem}
                  onViewDetails={handleViewDetails}
                  onRemove={handleRemoveFromWatchlist}
                />
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <Star className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {watchlistItems.length === 0 ? 'Your watchlist is empty' : 'No matching coins found'}
            </h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              {watchlistItems.length === 0 
                ? 'Browse the dashboard to add coins to your watchlist'
                : `Found ${coins.length} coins but they don't match your current filters`
              }
            </p>
            
            {watchlistItems.length > 0 && coins.length > 0 && (
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 mb-4">
                <p className="text-[#272757] text-sm font-medium mb-2">Debug Info:</p>
                <p className="text-[#272757] text-xs">
                  Watchlist Items: {watchlistItems.length} | 
                  Found Coins: {coins.length} | 
                  Filtered Coins: {filteredAndSortedCoins.length}
                </p>
                <div className="mt-2 text-left">
                  <p className="text-blue-700 text-xs mb-1">Watchlist IDs:</p>
                  {watchlistItems.map((item, index) => (
                    <p key={index} className="text-blue-600 text-xs font-mono">
                      {item.coinId}
                    </p>
                  ))}
                  <p className="text-blue-700 text-xs mb-1 mt-2">Found Coin IDs:</p>
                  {coins.slice(0, 3).map((coin, index) => (
                    <p key={index} className="text-blue-600 text-xs font-mono">
                      {coin.id} (addr: {coin.address})
                    </p>
                  ))}
                </div>
              </div>
            )}
            
            <button 
              onClick={handleNavigateToDashboard}
              className="bg-[#272757] hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Browse Coins</span>
            </button>
          </div>
        )}

        {watchlistItems.length > 0 && (
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleClearWatchlist}
              className="text-red-600 hover:text-red-800 text-sm px-4 py-2 rounded-lg border border-red-200 hover:bg-red-50 transition-colors inline-flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear Watchlist</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};