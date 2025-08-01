import React, { useState, useEffect } from 'react';
import { ArrowLeft, TrendingUp, ExternalLink, Copy, Zap, DollarSign, Activity, Users, Clock, Globe, AlertCircle, Star } from 'lucide-react';
import { coinsService, Coin } from '../services/coinService';
import { ApiError } from '../config/client';
import { AIAnalysis } from '../components/CoinDetail/AIAnalysis';

interface CoinDetailProps {
  coinId: string;
  coinImage?: string;
  coinData?: Coin;
  onBack: () => void;
}

interface GeckoTerminalChartProps {
  coin: Coin;
  className?: string;
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

  // Helper function to extract actual coin ID from various formats
  private static extractCoinId(coinId: string): string {
    // If it's base64 encoded, decode it first
    try {
      if (coinId.includes('=') && coinId.length > 20) {
        const decoded = atob(coinId);
        console.log('🔍 Decoded base64 coinId:', decoded);
        
        // Extract contract address from GraphQL format
        const addressMatch = decoded.match(/0x[a-fA-F0-9]{40}/);
        if (addressMatch) {
          console.log('✅ Extracted contract address:', addressMatch[0]);
          return addressMatch[0];
        }
        
        // If no address found, return the decoded string
        return decoded;
      }
    } catch (error) {
      console.log('Not base64 encoded, using as-is');
    }
    
    // Return as-is if not base64 or other processing needed
    return coinId;
  }

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
      
      // Clean up and normalize coin IDs
      const normalizedItems = validItems.map(item => ({
        ...item,
        coinId: this.extractCoinId(item.coinId),
        originalCoinId: item.coinId 
      }));
      
      if (validItems.length !== parsed.length) {
        console.log('Cleaned up invalid watchlist items');
        await this.saveWatchlist(normalizedItems);
      }
      
      return normalizedItems;
    } catch (error) {
      console.error('Failed to load watchlist:', error);
      await this.saveWatchlist([]);
      return [];
    }
  }

  static async saveWatchlist(watchlist: WatchlistItem[]): Promise<void> {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(watchlist));
      console.log("Stored...");
    } catch (error) {
      console.error('Failed to save watchlist:', error);
    }
  }

  static async addToWatchlist(coinId: string): Promise<boolean> {
    try {
      const normalizedCoinId = this.extractCoinId(coinId);
      const watchlist = await this.getWatchlist();
      
      // Check if already exists (using normalized ID)
      if (watchlist.some(item => this.extractCoinId(item.coinId) === normalizedCoinId)) {
        console.log('Coin already in watchlist:', normalizedCoinId);
        return false;
      }
      
      const newItem: WatchlistItem = {
        coinId: normalizedCoinId, // Store the normalized ID
        addedAt: new Date().toISOString(),
      };
      
      await this.saveWatchlist([...watchlist, newItem]);
      console.log('Added to watchlist:', normalizedCoinId);
      return true;
    } catch (error) {
      console.error('Failed to add to watchlist:', error);
      return false;
    }
  }

  static async removeFromWatchlist(coinId: string): Promise<boolean> {
    try {
      const normalizedCoinId = this.extractCoinId(coinId);
      const watchlist = await this.getWatchlist();
      const filtered = watchlist.filter(item => this.extractCoinId(item.coinId) !== normalizedCoinId);
      
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
    const normalizedCoinId = this.extractCoinId(coinId);
    const watchlist = await this.getWatchlist();
    return watchlist.some(item => this.extractCoinId(item.coinId) === normalizedCoinId);
  }
}

const GeckoTerminalChart: React.FC<GeckoTerminalChartProps> = ({ coin, className = "" }) => {
  const [chartLoading, setChartLoading] = useState(true);
  const [poolData, setPoolData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPoolData = async () => {
      if (!coin.address) {
        setError('No contract address available for this token');
        setChartLoading(false);
        return;
      }
      
      setChartLoading(true);
      setError(null);
      
      console.log('🔍 Fetching pool data for token:', coin.address);
      
      try {
        // First try to find pools for this specific token
        const tokenPoolsUrl = `https://api.geckoterminal.com/api/v2/networks/base/tokens/${coin.address}/pools`;
        console.log('📡 API URL:', tokenPoolsUrl);
        
        const poolsResponse = await fetch(tokenPoolsUrl);
        
        if (poolsResponse.ok) {
          const poolsData = await poolsResponse.json();
          console.log('📊 Pools API response:', poolsData);
          
          if (poolsData.data && poolsData.data.length > 0) {
            // Get the most liquid pool (first one should be the best)
            const bestPool = poolsData.data[0];
            setPoolData(bestPool);
            console.log('✅ Found pool:', bestPool.attributes.address);
          } else {
            console.log('❌ No pools found in API response');
            // Fallback: try searching by address
            const searchUrl = `https://api.geckoterminal.com/api/v2/search/pools?query=${coin.address}&network=base`;
            console.log('🔍 Trying search fallback:', searchUrl);
            
            const searchResponse = await fetch(searchUrl);
            if (searchResponse.ok) {
              const searchData = await searchResponse.json();
              console.log('🔍 Search API response:', searchData);
              
              if (searchData.data && searchData.data.length > 0) {
                setPoolData(searchData.data[0]);
                console.log('✅ Found pool via search:', searchData.data[0].attributes.address);
              } else {
                setError('No trading pools found for this token on Base network');
              }
            } else {
              throw new Error(`Search API failed: ${searchResponse.status}`);
            }
          }
        } else {
          const errorText = await poolsResponse.text();
          console.error('❌ API Error:', poolsResponse.status, errorText);
          
          if (poolsResponse.status === 429) {
            setError('Rate limit exceeded. Please wait a moment and try again.');
          } else if (poolsResponse.status === 404) {
            setError('Token not found on GeckoTerminal. This token may not have active trading pools.');
          } else {
            throw new Error(`API request failed: ${poolsResponse.status}`);
          }
        }
      } catch (err) {
        console.error('💥 Error fetching pool data:', err);
        setError(`Unable to load chart data: ${err instanceof Error ? err.message : 'Network error'}`);
      } finally {
        setChartLoading(false);
      }
    };

    fetchPoolData();
  }, [coin.address]);

  if (chartLoading) {
    return (
      <div className={`bg-white rounded-xl border border-gray-200 p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !poolData) {
    return (
      <div className={`bg-white rounded-xl border border-gray-200 p-6 ${className}`}>
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Chart Unavailable</h3>
          <p className="text-gray-600 text-sm mb-4">
            {error || 'Trading chart is not available for this token yet.'}
          </p>
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 mb-4">
            <p className="text-xs text-gray-600">
              Charts are available for tokens with active trading pools on decentralized exchanges.
            </p>
          </div>
          
          {/* Debug info
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200 text-left">
            <p className="text-xs text-blue-800 font-medium mb-1">Debug Info:</p>
            <p className="text-xs text-blue-700">Token: {coin.name} ({coin.symbol})</p>
            <p className="text-xs text-blue-700">Address: {coin.address}</p>
            <p className="text-xs text-blue-700">Network: Base</p>
          </div> */}
          
          {/* External link */}
          <div className="mt-4">
            <a 
              href={`https://www.geckoterminal.com/base/tokens/${coin.address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 text-indigo-600 hover:text-indigo-800 text-sm"
            >
              <span>View on GeckoTerminal</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  const embedUrl = `https://www.geckoterminal.com/base/pools/${poolData.attributes.address}?embed=1&info=0&swaps=0`;
  console.log('🎯 Chart embed URL:', embedUrl);

  return (
    <div className={`bg-white rounded-xl border border-gray-200 overflow-hidden ${className}`}>
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Live Trading Chart</h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Powered by</span>
            <a 
              href={`https://www.geckoterminal.com/base/pools/${poolData.attributes.address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 hover:underline font-medium"
            >
              GeckoTerminal
            </a>
            <ExternalLink className="w-3 h-3 text-indigo-600" />
          </div>
        </div>
      </div>
      <div className="relative">
        <iframe
          src={embedUrl}
          width="100%"
          height="500"
          frameBorder="0"
          allowFullScreen
          title={`${coin.name} Trading Chart`}
          className="w-full"
          onLoad={() => console.log('✅ Chart iframe loaded successfully')}
          onError={() => console.log('❌ Chart iframe failed to load')}
        />
      </div>
    </div>
  );
};

const TradingCard: React.FC<{ coin: Coin }> = ({ coin }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(coin.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
    return num.toFixed(2);
  };

  const formatPrice = (price: number): string => {
    if (price < 0.000001) return price.toFixed(8);
    if (price < 0.01) return price.toFixed(6);
    if (price < 1) return price.toFixed(4);
    return price.toFixed(2);
  };

  const getTokenAge = (): string => {
    const created = new Date(coin.createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - created.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 7) return `${diffDays}d`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w`;
    return `${Math.floor(diffDays / 30)}m`;
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          {coin.image ? (
            <img 
              src={coin.image} 
              alt={coin.name}
              className="w-12 h-12 rounded-full border-2 border-indigo-100"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.nextElementSibling?.classList.remove('hidden');
              }}
            />
          ) : null}
          <div className={`w-12 h-12 rounded-full border-2 border-indigo-100 bg-indigo-600 flex items-center justify-center text-white font-bold ${coin.image ? 'hidden' : ''}`}>
            {coin.symbol.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">{coin.name}</h3>
            <p className="text-sm text-gray-600 uppercase font-medium">{coin.symbol}</p>
          </div>
        </div>
        <a
          href={`https://app.uniswap.org/#/swap?outputCurrency=${coin.address}&chain=base`}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-[#272757] hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
        >
          <Zap className="w-4 h-4" />
          <span>Trade {coin.symbol}</span>
        </a>
      </div>

      <div className="mb-6">
        <div className="flex items-baseline space-x-3 mb-2">
          <span className="text-2xl font-bold text-gray-900 font-mono">
            ${formatPrice(coin.price)}
          </span>
          <span className={`px-2 py-1 rounded-lg text-sm font-medium ${
            coin.change24h >= 0 
              ? 'bg-green-100 text-green-700 border border-green-200' 
              : 'bg-red-100 text-red-700 border border-red-200'
          }`}>
            {coin.change24h >= 0 ? '+' : ''}{coin.change24h.toFixed(2)}%
          </span>
        </div>
        <p className="text-xs text-gray-500">24h Change</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
          <div className="flex items-center space-x-2 mb-1">
            <DollarSign className="w-4 h-4 text-indigo-600" />
            <span className="text-xs text-gray-600 font-medium">Market Cap</span>
          </div>
          <p className="text-sm font-bold text-gray-900">${formatNumber(coin.marketCap)}</p>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
          <div className="flex items-center space-x-2 mb-1">
            <Activity className="w-4 h-4 text-indigo-600" />
            <span className="text-xs text-gray-600 font-medium">24h Volume</span>
          </div>
          <p className="text-sm font-bold text-gray-900">${formatNumber(coin.volume24h)}</p>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
          <div className="flex items-center space-x-2 mb-1">
            <Users className="w-4 h-4 text-indigo-600" />
            <span className="text-xs text-gray-600 font-medium">Holders</span>
          </div>
          <p className="text-sm font-bold text-gray-900">{coin.holders.toLocaleString()}</p>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
          <div className="flex items-center space-x-2 mb-1">
            <Clock className="w-4 h-4 text-indigo-600" />
            <span className="text-xs text-gray-600 font-medium">Age</span>
          </div>
          <p className="text-sm font-bold text-gray-900">{getTokenAge()}</p>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-600 font-medium">Contract Address</span>
          <button 
            onClick={handleCopy}
            className={`p-1 rounded hover:bg-gray-200 transition-colors ${
              copied ? 'text-green-600' : 'text-gray-600'
            }`}
          >
            <Copy className="w-3 h-3" />
          </button>
        </div>
        <code className="text-xs font-mono text-gray-900 break-all">
          {coin.address}
        </code>
        {copied && (
          <p className="text-xs text-green-600 mt-1">Copied!</p>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex space-x-3">
          <a 
            href={`https://basescan.org/token/${coin.address}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-indigo-600 transition-colors"
            title="View on BaseScan"
          >
            <Globe className="w-4 h-4" />
          </a>
          <a 
            href={`https://www.geckoterminal.com/base/tokens/${coin.address}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-indigo-600 transition-colors"
            title="View on GeckoTerminal"
          >
            <TrendingUp className="w-4 h-4" />
          </a>
        </div>
        
        <div className="flex items-center space-x-1 text-xs text-gray-500">
          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
          <span>Live Data</span>
        </div>
      </div>
    </div>
  );
};

const WatchlistButton: React.FC<{ coin: Coin; coinId: string }> = ({ coin, coinId }) => {
  const [isWatchlisted, setIsWatchlisted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkWatchlistStatus = async () => {
      // Use coinId from props as primary identifier
      const coinIdentifier = coinId || coin.id;
      console.log('🔍 Checking watchlist status for:', coinIdentifier);
      const status = await WatchlistStorage.isWatchlisted(coinIdentifier);
      setIsWatchlisted(status);
      console.log('📋 Watchlist status:', status);
    };
    checkWatchlistStatus();
  }, [coin.id, coinId]);

  const handleWatchlistToggle = async () => {
    setLoading(true);
    try {
      // Use the coinId from props as the primary identifier, fallback to coin.id
      const coinIdentifier = coinId || coin.id;
      console.log('🔖 Watchlist toggle for coin:', coinIdentifier, 'Current status:', isWatchlisted);
      
      if (isWatchlisted) {
        const success = await WatchlistStorage.removeFromWatchlist(coinIdentifier);
        if (success) {
          setIsWatchlisted(false);
          console.log('✅ Removed from watchlist:', coinIdentifier);
        }
      } else {
        const success = await WatchlistStorage.addToWatchlist(coinIdentifier);
        if (success) {
          setIsWatchlisted(true);
          console.log('✅ Added to watchlist:', coinIdentifier);
        }
      }
    } catch (error) {
      console.error('Error toggling watchlist:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleWatchlistToggle}
      disabled={loading}
      className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
        isWatchlisted
          ? 'bg-yellow-100 text-yellow-700 border border-yellow-200 hover:bg-yellow-200'
          : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
      } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
      title={isWatchlisted ? 'Remove from watchlist' : 'Add to watchlist'}
    >
      <Star className={`w-4 h-4 ${isWatchlisted ? 'fill-current' : ''}`} />
      <span className="text-sm">
        {loading ? '...' : isWatchlisted ? 'Watching' : 'Watch'}
      </span>
    </button>
  );
};

export const CoinDetail: React.FC<CoinDetailProps> = ({ 
  coinId, 
  coinImage, 
  coinData, 
  onBack 
}) => {
  const [coin, setCoin] = useState<Coin | null>(coinData || null);
  const [loading, setLoading] = useState(!coinData);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCoinData = async () => {
      if (coinData) {
        setCoin(coinData);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const fetchedCoin = await coinsService.getCoinByAddress(coinData.address);
        if (fetchedCoin) {
          setCoin(fetchedCoin);
        } else {
          setError('Coin not found');
        }
      } catch (err) {
        console.error('Error fetching coin:', err);
        setError(err instanceof ApiError ? err.message : 'Failed to load coin data');
      } finally {
        setLoading(false);
      }
    };

    fetchCoinData();
  }, [coinId, coinData]);

  const formatPrice = (price: number): string => {
    if (price < 0.000001) return price.toFixed(8);
    if (price < 0.01) return price.toFixed(6);
    if (price < 1) return price.toFixed(4);
    return price.toFixed(2);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto px-4 py-6 max-w-7xl">
          <div className="space-y-6">
            <div className="animate-pulse bg-gray-200 h-8 w-64 rounded"></div>
            <div className="animate-pulse bg-gray-200 h-32 w-full rounded-xl"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="animate-pulse bg-gray-200 h-96 w-full rounded-xl"></div>
              </div>
              <div className="space-y-6">
                <div className="animate-pulse bg-gray-200 h-96 w-full rounded-xl"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !coin) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto px-4 py-6 max-w-7xl">
          <div className="text-center py-12">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {error || 'Coin not found'}
            </h2>
            <p className="text-gray-600 mb-6">
              {error ? 'Unable to load coin details. Please try again.' : 'The requested coin could not be found.'}
            </p>
            <button 
              onClick={onBack}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              ← Back to Coined Post
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto px-4 py-6">
        <div className="space-y-6">
          <nav className="flex items-center space-x-2 text-sm">
            <button 
              onClick={onBack}
              className="text-indigo-600 hover:text-gray-900 hover:underline flex items-center space-x-1 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Coined Post</span>
            </button>
            <span className="text-gray-400">›</span>
            <span className="text-gray-900 truncate font-medium">{coin.name} Price</span>
          </nav>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between space-y-6 lg:space-y-0">
              <div className="flex items-center space-x-4">
                {coin.image ? (
                  <img 
                    src={coin.image} 
                    alt={coin.name}
                    className="w-16 h-16 rounded-full border-2 border-indigo-100 shadow-lg"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <div className={`w-16 h-16 rounded-full border-2 border-indigo-100 bg-indigo-600 flex items-center justify-center text-white text-xl font-bold shadow-lg ${coin.image ? 'hidden' : ''}`}>
                  {coin.symbol.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <h1 className="text-3xl font-bold text-gray-900">{coin.name}</h1>
                    <span className="text-xl text-gray-600 font-semibold uppercase">{coin.symbol}</span>
                    <span className="bg-gray-100 text-gray-600 text-sm px-2 py-1 rounded-lg font-medium border border-gray-200">
                      #{coin.rank}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-4xl font-bold font-mono text-gray-900">
                      ${formatPrice(coin.price)}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`font-bold font-mono text-lg px-3 py-1 rounded-lg border ${
                        coin.change24h >= 0 
                          ? 'text-green-700 bg-green-50 border-green-200' 
                          : 'text-red-700 bg-red-50 border-red-200'
                      }`}>
                        {coin.change24h >= 0 ? '▲' : '▼'} {Math.abs(coin.change24h).toFixed(2)}%
                      </span>
                      <span className="text-sm text-gray-500">(24h)</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <WatchlistButton coin={coin} coinId={coinId} />
                <a
                  href={`https://app.uniswap.org/#/swap?outputCurrency=${coin.address}&chain=base`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#272757] hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
                >
                  <Zap className="w-4 h-4" />
                  <span>Trade {coin.symbol}</span>
                </a>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <GeckoTerminalChart coin={coin} />
              
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Token Information</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Supply</p>
                    <p className="font-bold text-gray-900">{coin.totalSupply.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Chain</p>
                    <p className="font-bold text-gray-900">Base</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Created</p>
                    <p className="font-bold text-gray-900">
                      {new Date(coin.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Source</p>
                    <p className="font-bold text-gray-900">
                      {coin.isFromBaseApp ? 'Base App' : 'External'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <TradingCard coin={coin} />
              <AIAnalysis 
                coinName={coin.name}
                coinAddress={coin.address}
                coin={{
                  symbol: coin.symbol,
                  price: coin.price,
                  change24h: coin.change24h,
                  marketCap: coin.marketCap,
                  volume24h: coin.volume24h,
                  holders: coin.holders,
                  isFromBaseApp: coin.isFromBaseApp
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};