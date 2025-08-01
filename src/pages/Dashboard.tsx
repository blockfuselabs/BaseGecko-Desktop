import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CoinAvatar } from '../components/common/CoinAvatar';
import { TrendingUp, Flame, Award, Eye, Star, RefreshCw, AlertCircle, ChevronUp, ChevronDown } from 'lucide-react';
import { useCoins, useTrendingCoins, useTopGainers } from '../hooks/useCoinData';
import { Coin } from '../services/coinService';

interface DashboardProps {
  onViewCoinDetail: (coinData: any) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onViewCoinDetail }) => {
  // Main coins data with disabled auto-refresh
  const {
    coins,
    loading,
    error,
    marketStats,
    hasMore,
    fetchCoins,
    refreshData,
    loadMore,
    clearError
  } = useCoins({
    autoFetch: true,
    initialParams: { limit: 50, sortBy: 'marketCap', sortOrder: 'desc' }, // Increased from 20 to 50
    // Removed refreshInterval to prevent automatic refreshing
  });

  // Trending coins and top gainers (loaded separately without auto-refresh)
  const {
    coins: trendingCoins,
    loading: trendingLoading,
    fetchTrendingCoins
  } = useTrendingCoins();

  const {
    coins: topGainers,
    loading: gainersLoading,
    fetchTopGainers
  } = useTopGainers();

  // Local state
  const [sortBy, setSortBy] = useState('marketCap');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filterBy, setFilterBy] = useState('all');
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [displayCoins, setDisplayCoins] = useState<Coin[]>([]);

  // Refs for infinite scroll
  const tableEndRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Update display coins when filter changes or base coins change
  useEffect(() => {
    let filtered = [...coins];
    
    if (filterBy === 'trending' && trendingCoins.length > 0) {
      filtered = [...trendingCoins];
    } else if (filterBy === 'gainers') {
      filtered = coins.filter(coin => coin.change24h > 0).sort((a, b) => b.change24h - a.change24h);
    } else if (filterBy === 'losers') {
      filtered = coins.filter(coin => coin.change24h < 0).sort((a, b) => a.change24h - b.change24h);
    } else if (filterBy === 'new') {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      filtered = coins.filter(coin => {
        const createdDate = new Date(coin.createdAt);
        return createdDate > weekAgo;
      }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    
    setDisplayCoins(filtered);
  }, [coins, trendingCoins, filterBy]);

  // Load trending data on mount and refresh periodically
  useEffect(() => {
    fetchTrendingCoins(50);
    fetchTopGainers(50);
    
    // Refresh trending and gainers every minute
    const interval = setInterval(() => {
      fetchTrendingCoins(50);
      fetchTopGainers(50);
    }, 60000);
    
    return () => clearInterval(interval);
  }, [fetchTrendingCoins, fetchTopGainers]);

  // Infinite scroll observer
  const lastCoinElementRef = useCallback((node: HTMLElement | null) => {
    if (loading) return;
    if (observerRef.current) observerRef.current.disconnect();
    
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loading) {
        console.log('🔄 Loading more coins via infinite scroll...');
        loadMore();
      }
    }, {
      threshold: 0.1,
      rootMargin: '200px' // Increased from 100px to 200px for earlier loading
    });
    
    if (node) observerRef.current.observe(node);
  }, [loading, hasMore, loadMore]);

  const handleViewDetails = (coinId: string) => {
    let coin = displayCoins.find(c => c.id === coinId);
    if (!coin) coin = trendingCoins.find(c => c.id === coinId);
    if (!coin) coin = topGainers.find(c => c.id === coinId);
    
    if (coin) {
      onViewCoinDetail({
        coinId: coin.id,
        coinImage: coin.image,
        coinData: coin,
      });
    } else {
      onViewCoinDetail({
        coinId: coinId,
        coinImage: undefined,
        coinData: undefined,
      });
    }
  };

  const handleToggleWatchlist = (coinId: string) => {
    setWatchlist(prev => 
      prev.includes(coinId) 
        ? prev.filter(id => id !== coinId)
        : [...prev, coinId]
    );
  };

  // Manual refresh function
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        refreshData(),
        fetchTrendingCoins(5),
        fetchTopGainers(5)
      ]);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSortChange = async (newSortBy: string) => {
    const newOrder = sortBy === newSortBy ? (sortOrder === 'desc' ? 'asc' : 'desc') : 'desc';
    setSortBy(newSortBy);
    setSortOrder(newOrder);
    await fetchCoins({ 
      sortBy: newSortBy as any, 
      sortOrder: newOrder as any,
      filterBy: filterBy === 'all' ? undefined : filterBy as any
    });
  };

  const handleFilterChange = async (newFilterBy: string) => {
    setFilterBy(newFilterBy);
    
    // Load specific data based on filter
    if (newFilterBy === 'trending') {
      if (trendingCoins.length === 0) {
        await fetchTrendingCoins(50);
      }
    } else if (newFilterBy === 'gainers' || newFilterBy === 'losers' || newFilterBy === 'new') {
      // These filters use the main coins data, ensure we have enough data
      if (coins.length < 50) {
        await fetchCoins({ 
          limit: 100,
          sortBy: sortBy as any, 
          sortOrder: sortOrder as any
        });
      }
    } else if (newFilterBy === 'all') {
      // Ensure we have the base coin data
      if (coins.length === 0) {
        await fetchCoins({ 
          limit: 50,
          sortBy: sortBy as any, 
          sortOrder: sortOrder as any
        });
      }
    }
  };

  const totalMarketCap = marketStats?.totalMarketCap || coins.reduce((sum, coin) => sum + coin.marketCap, 0);
  const totalVolume = marketStats?.totalVolume || coins.reduce((sum, coin) => sum + coin.volume24h, 0);
  const gainersCount = coins.filter(coin => coin.change24h > 0).length;
  const marketChange = marketStats?.change24h || (gainersCount / coins.length > 0.5 ? 4.1 : -2.3);

  // Error display
  if (error && !coins.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4 bg-gray-50 rounded-xl p-6">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Unable to load coin data
          </h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => {
              clearError();
              refreshData();
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading && !coins.length) {
    return (
      <div className="space-y-6 md:space-y-8">
        <div className="animate-pulse bg-gray-200 h-8 w-full max-w-md rounded-lg"></div>
        <div className="animate-pulse bg-gray-200 h-20 md:h-24 w-full rounded-xl"></div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="animate-pulse bg-gray-200 h-16 w-full rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6 bg-gray-50">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Live Activities</h1>
          <p className="text-gray-500">Track the latest coined post trends and statistics</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {[
          { id: 'all', label: 'All Coins', icon: <Star className="w-4 h-4" /> },
          { id: 'trending', label: 'Trending', icon: <Flame className="w-4 h-4" /> },
          { id: 'gainers', label: 'Gainers', icon: <TrendingUp className="w-4 h-4" /> },
          { id: 'losers', label: 'Losers', icon: <TrendingUp className="w-4 h-4 transform rotate-180" /> },
          { id: 'new', label: 'New', icon: <Award className="w-4 h-4" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleFilterChange(tab.id)}
            disabled={loading && displayCoins.length === 0}
            className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-lg transition-all disabled:opacity-50 ${
              filterBy === tab.id
                ? 'bg-[#272757] text-white shadow-md'
                : 'bg-white text-gray-700 border border-gray-200 hover:border-indigo-300 hover:text-[#272757] shadow-sm'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Error Banner */}
      {error && coins.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
          <button 
            onClick={clearError} 
            className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100"
          >
            ×
          </button>
        </div>
      )}

  
     

      {/* Market Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-gray-500 text-sm font-medium">Total Market Cap</div>
          <div className="text-2xl font-bold text-gray-900">
            ${(totalMarketCap / 1e9).toFixed(2)}B
          </div>
          <div className={`text-sm ${marketChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {marketChange >= 0 ? '+' : ''}{marketChange.toFixed(2)}% (24h)
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-gray-500 text-sm font-medium">24h Volume</div>
          <div className="text-2xl font-bold text-gray-900">
            ${(totalVolume / 1e9).toFixed(2)}B
          </div>
          <div className="text-sm text-gray-500">Across all coins</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-gray-500 text-sm font-medium">Active Coins</div>
          <div className="text-2xl font-bold text-gray-900">{displayCoins.length}</div>
          <div className="text-sm text-gray-500">
            {gainersCount} gainers ({coins.length > 0 ? ((gainersCount / coins.length) * 100).toFixed(1) : '0'}%)
          </div>
        </div>
      </div>

      {/* Main Table with Infinite Scroll */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Desktop Table */}
        <div className="hidden md:block">
          <div className="max-h-[600px] overflow-y-auto">
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="py-4 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center space-x-1 cursor-pointer" onClick={() => handleSortChange('name')}>
                      <span>Token</span>
                      {sortBy === 'name' && (
                        sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </th>
                  <th className="py-4 px-6 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center justify-end space-x-1 cursor-pointer" onClick={() => handleSortChange('price')}>
                      <span>Price</span>
                      {sortBy === 'price' && (
                        sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </th>
                  <th className="py-4 px-6 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center justify-end space-x-1 cursor-pointer" onClick={() => handleSortChange('createdAt')}>
                      <span>Age</span>
                      {sortBy === 'createdAt' && (
                        sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </th>
                  <th className="py-4 px-6 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center justify-end space-x-1 cursor-pointer" onClick={() => handleSortChange('volume24h')}>
                      <span>Volume</span>
                      {sortBy === 'volume24h' && (
                        sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </th>
                  <th className="py-4 px-6 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center justify-end space-x-1 cursor-pointer" onClick={() => handleSortChange('marketCap')}>
                      <span>Market Cap</span>
                      {sortBy === 'marketCap' && (
                        sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </th>
                  <th className="py-4 px-6 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Creator
                  </th>
                  <th className="py-4 px-6 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Watch
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {displayCoins.map((coin, index) => (
                  <tr 
                    key={coin.id} 
                    ref={index === displayCoins.length - 1 ? lastCoinElementRef : null}
                    className="hover:bg-[#c5c5ff] transition-colors cursor-pointer"
                    onClick={() => handleViewDetails(coin.id)}
                  >
                    <td className="py-4 px-6 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <CoinAvatar 
                          symbol={coin.symbol} 
                          name={coin.name} 
                          image={coin.image}
                          size="md"
                        />
                        <div>
                          <div className="font-medium text-gray-900">{coin.name}</div>
                          <div className="text-sm text-gray-500 uppercase">{coin.symbol}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap text-right">
                      <div className="font-medium text-gray-900">
                        ${coin.price > 0 ? coin.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 }) : '0.00'}
                      </div>
                      <div className={`text-sm ${coin.change24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {coin.change24h >= 0 ? '+' : ''}{coin.change24h.toFixed(2)}%
                      </div>
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap text-right text-gray-900">
                      {(() => {
                        const created = new Date(coin.createdAt);
                        const now = new Date();
                        const diffTime = Math.abs(now.getTime() - created.getTime());
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        
                        if (diffDays < 7) return `${diffDays}d`;
                        if (diffDays < 30) return `${Math.floor(diffDays / 7)}w`;
                        return `${Math.floor(diffDays / 30)}m`;
                      })()}
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap text-right text-gray-900">
                      ${(coin.volume24h / 1e6).toLocaleString(undefined, { maximumFractionDigits: 2 })}M
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap text-right text-gray-900">
                      ${(coin.marketCap / 1e6).toLocaleString(undefined, { maximumFractionDigits: 2 })}M
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center">
                          <span className="text-indigo-800 text-xs font-bold">
                            {coin.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="text-sm text-gray-900 font-mono">
                          {coin.id.slice(0, 4)}...{coin.id.slice(-4)}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap text-right">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleWatchlist(coin.id);
                        }}
                        className={`p-2 rounded-full ${watchlist.includes(coin.id) ? 'text-indigo-600 bg-indigo-50' : 'text-gray-400 hover:text-indigo-600 hover:bg-indigo-50'}`}
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Cards with Infinite Scroll */}
        <div className="md:hidden">
          <div className="max-h-[600px] overflow-y-auto divide-y divide-gray-200">
            {displayCoins.map((coin, index) => (
              <div 
                key={coin.id}
                ref={index === displayCoins.length - 1 ? lastCoinElementRef : null}
                className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => handleViewDetails(coin.id)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <CoinAvatar 
                      symbol={coin.symbol} 
                      name={coin.name} 
                      image={coin.image}
                      size="md"
                    />
                    <div>
                      <div className="font-medium text-gray-900">{coin.name}</div>
                      <div className="text-sm text-gray-500 uppercase">{coin.symbol}</div>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleWatchlist(coin.id);
                    }}
                    className={`p-2 rounded-full ${watchlist.includes(coin.id) ? 'text-indigo-600 bg-indigo-50' : 'text-gray-400 hover:text-indigo-600 hover:bg-indigo-50'}`}
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="flex items-center justify-between mb-2">
                  <div className="text-lg font-medium text-gray-900">
                    ${coin.price > 0 ? coin.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 }) : '0.00'}
                  </div>
                  <div className={`text-sm font-medium ${
                    coin.change24h >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {coin.change24h >= 0 ? '+' : ''}{coin.change24h.toFixed(2)}%
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Market Cap</span>
                    <div className="text-gray-900 font-medium">
                      ${(coin.marketCap / 1e6).toFixed(2)}M
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Volume</span>
                    <div className="text-gray-900 font-medium">
                      ${(coin.volume24h / 1e6).toFixed(2)}M
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Age</span>
                    <div className="text-gray-900 font-medium">
                      {(() => {
                        const created = new Date(coin.createdAt);
                        const now = new Date();
                        const diffTime = Math.abs(now.getTime() - created.getTime());
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        
                        if (diffDays < 7) return `${diffDays}d`;
                        if (diffDays < 30) return `${Math.floor(diffDays / 7)}w`;
                        return `${Math.floor(diffDays / 30)}m`;
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Loading indicator for infinite scroll */}
        {loading && displayCoins.length > 0 && (
          <div className="text-center py-6 border-t border-gray-200">
            <div className="inline-flex items-center space-x-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span className="text-gray-500">Loading more coins...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};