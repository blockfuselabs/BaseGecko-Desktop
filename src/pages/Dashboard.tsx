// components/Dashboard.tsx
import React, { useState } from 'react';
import { CoinAvatar } from '../components/common/CoinAvatar';
import { TrendingUp, Flame, Award, Eye, Star, RefreshCw, AlertCircle, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Database, Clock } from 'lucide-react';
import { useDashboardData } from '../hooks/useDashboardData';
import { Coin } from '../services/coinService';

interface DashboardProps {
  onViewCoinDetail: (coinData: any) => void;
}

// Enhanced Pagination Component
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalCoins: number;
  showingStart: number;
  showingEnd: number;
  onPageChange: (page: number) => void;
  onPrevious: () => void;
  onNext: () => void;
  isFirstPage: boolean;
  isLastPage: boolean;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalCoins,
  showingStart,
  showingEnd,
  onPageChange,
  onPrevious,
  onNext,
  isFirstPage,
  isLastPage
}) => {
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between p-5 gap-4 mt-6 pt-6 border-t border-gray-200">
      <div className="text-sm text-gray-700">
        Showing <span className="font-medium">{showingStart}</span> to{' '}
        <span className="font-medium">{showingEnd}</span> of{' '}
        <span className="font-medium">{totalCoins}</span> coined posts
      </div>

      <div className="flex items-center space-x-2">
        <button
          onClick={onPrevious}
          disabled={isFirstPage}
          className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Previous
        </button>

        <div className="hidden sm:flex items-center space-x-1">
          {getPageNumbers().map((page, index) => (
            <React.Fragment key={index}>
              {page === '...' ? (
                <span className="px-3 py-2 text-sm text-gray-500">...</span>
              ) : (
                <button
                  onClick={() => onPageChange(page as number)}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    currentPage === page
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="sm:hidden px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg">
          {currentPage} of {totalPages}
        </div>

        <button
          onClick={onNext}
          disabled={isLastPage}
          className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Next
          <ChevronRight className="w-4 h-4 ml-1" />
        </button>
      </div>
    </div>
  );
};

// Cache Status Component
const CacheStatus: React.FC<{ cacheInfo: any }> = ({ cacheInfo }) => {
  const formatCacheAge = (ageMs: number) => {
    const seconds = Math.floor(ageMs / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ago`;
  };

  return (
    <div className="flex items-center space-x-3 text-xs text-gray-500">
      <div className="flex items-center space-x-1">
        <Database className="w-3 h-3" />
        <span>{cacheInfo.totalCoins} posts cached</span>
      </div>
      <div className="flex items-center space-x-1">
        <Clock className="w-3 h-3" />
        <span>Updated {formatCacheAge(cacheInfo.cacheAge)}</span>
      </div>
      <div className={`w-2 h-2 rounded-full ${cacheInfo.isValid ? 'bg-green-400' : 'bg-red-400'}`}></div>
    </div>
  );
};

export const Dashboard: React.FC<DashboardProps> = ({ onViewCoinDetail }) => {
  const {
    coins,
    marketStats,
    currentPage,
    totalPages,
    totalCoins,
    hasMore,
    goToPage,
    nextPage,
    previousPage,
    sortBy,
    filterBy,
    handleSortChange,
    handleFilterChange,
    loading,
    error,
    clearError,
    refresh,
    cacheInfo,
    isFirstPage,
    isLastPage,
    showingStart,
    showingEnd
  } = useDashboardData({
    autoRefresh: true,
    initialSortBy: 'marketCap',
    initialFilter: 'all'
  });

  const [watchlist, setWatchlist] = useState<string[]>([]);

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

  const handleToggleWatchlist = (coinId: string) => {
    setWatchlist(prev => 
      prev.includes(coinId) 
        ? prev.filter(id => id !== coinId)
        : [...prev, coinId]
    );
  };

  const getSortIcon = (field: string) => {
    if (sortBy !== field) return null;
    return <ChevronDown className="w-4 h-4" />;
  };

  if (error && !coins.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4 bg-gray-50 rounded-xl p-6">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Unable to load coined posts
          </h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => {
              clearError();
              refresh();
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (loading && !coins.length) {
    return (
      <div className="space-y-6 md:space-y-8">
        <div className="animate-pulse bg-gray-200 h-8 w-full max-w-md rounded-lg"></div>
        <div className="animate-pulse bg-gray-200 h-20 md:h-24 w-full rounded-xl"></div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
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
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Coined Posts</h1>
          <p className="text-gray-500">Track the latest coined post trends and statistics</p>
          <CacheStatus cacheInfo={cacheInfo} />
        </div>
        
        <button
          onClick={refresh}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span className="text-sm font-medium">Refresh</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {[
          { id: 'all', label: 'All Posts', icon: <Star className="w-4 h-4" /> },
          { id: 'top', label: 'Top Performers', icon: <Flame className="w-4 h-4" /> },
          { id: 'gainers', label: 'Gainers', icon: <TrendingUp className="w-4 h-4" /> },
          { id: 'losers', label: 'Losers', icon: <TrendingUp className="w-4 h-4 transform rotate-180" /> },
          { id: 'new', label: 'New (7 days)', icon: <Award className="w-4 h-4" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleFilterChange(tab.id as any)}
            disabled={loading}
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
            ${(marketStats.totalMarketCap / 1e9).toFixed(2)}B
          </div>
          <div className="text-sm text-gray-500">From {totalCoins} posts</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-gray-500 text-sm font-medium">24h Volume</div>
          <div className="text-2xl font-bold text-gray-900">
            ${(marketStats.totalVolume / 1e9).toFixed(2)}B
          </div>
          <div className="text-sm text-gray-500">Across all posts</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-gray-500 text-sm font-medium">Page {currentPage}</div>
          <div className="text-2xl font-bold text-gray-900">{coins.length}</div>
          <div className="text-sm text-gray-500">
            of {totalCoins} total posts
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Desktop Table */}
        <div className="hidden md:block">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-4 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div 
                      className="flex items-center space-x-1 cursor-pointer hover:text-gray-700 transition-colors" 
                      onClick={() => handleSortChange('marketCap')}
                    >
                      <span>Coined Post</span>
                      {getSortIcon('marketCap')}
                    </div>
                  </th>
                  <th className="py-4 px-6 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div 
                      className="flex items-center justify-end space-x-1 cursor-pointer hover:text-gray-700 transition-colors" 
                      onClick={() => handleSortChange('marketCap')}
                    >
                      <span>Price & Market Cap</span>
                      {getSortIcon('marketCap')}
                    </div>
                  </th>
                  <th className="py-4 px-6 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div 
                      className="flex items-center justify-end space-x-1 cursor-pointer hover:text-gray-700 transition-colors" 
                      onClick={() => handleSortChange('change')}
                    >
                      <span>24h Change</span>
                      {getSortIcon('change')}
                    </div>
                  </th>
                  <th className="py-4 px-6 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div 
                      className="flex items-center justify-end space-x-1 cursor-pointer hover:text-gray-700 transition-colors" 
                      onClick={() => handleSortChange('volume')}
                    >
                      <span>Volume</span>
                      {getSortIcon('volume')}
                    </div>
                  </th>
                  <th className="py-4 px-6 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div 
                      className="flex items-center justify-end space-x-1 cursor-pointer hover:text-gray-700 transition-colors" 
                      onClick={() => handleSortChange('holders')}
                    >
                      <span>Holders</span>
                      {getSortIcon('holders')}
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
                {coins.map((coin, index) => (
                  <tr 
                    key={coin.id} 
                    className="hover:bg-[#c5c5ff] transition-colors cursor-pointer"
                    onClick={() => handleViewDetails(coin.id)}
                  >
                    <td className="py-4 px-6 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <div className="text-sm text-gray-500 font-medium">
                          #{(currentPage - 1) * 10 + index + 1}
                        </div>
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
                      <div className="text-sm text-gray-500">
                        ${(coin.marketCap / 1e6).toLocaleString(undefined, { maximumFractionDigits: 2 })}M cap
                      </div>
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap text-right">
                      <span className={`px-2 py-1 rounded-full text-sm font-medium ${
                        coin.change24h >= 0 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {coin.change24h >= 0 ? '+' : ''}{coin.change24h.toFixed(2)}%
                      </span>
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap text-right text-gray-900">
                      ${(coin.volume24h / 1e6).toLocaleString(undefined, { maximumFractionDigits: 2 })}M
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap text-right text-gray-900">
                      {coin.holders.toLocaleString()}
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center">
                          <span className="text-indigo-800 text-xs font-bold">
                            {coin.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="text-sm text-gray-900 font-mono">
                          {coin.creatorAddress?.slice(0, 4)}...{coin.creatorAddress?.slice(-4)}
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

        {/* Mobile Cards */}
        <div className="md:hidden">
          <div className="divide-y divide-gray-200">
            {coins.map((coin, index) => (
              <div 
                key={coin.id}
                className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => handleViewDetails(coin.id)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="text-sm text-gray-500 font-medium">
                      #{(currentPage - 1) * 10 + index + 1}
                    </div>
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
                  <div className={`text-sm font-medium px-2 py-1 rounded-full ${
                    coin.change24h >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
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
                    <span className="text-gray-500">Holders</span>
                    <div className="text-gray-900 font-medium">
                      {coin.holders.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalCoins={totalCoins}
          showingStart={showingStart}
          showingEnd={showingEnd}
          onPageChange={goToPage}
          onPrevious={previousPage}
          onNext={nextPage}
          isFirstPage={isFirstPage}
          isLastPage={isLastPage}
        />
      </div>
    </div>
  );
};