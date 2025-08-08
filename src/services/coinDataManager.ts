// services/coinDataManager.ts
import { coinsService, Coin } from './coinService';

interface CoinDataCache {
  coins: Coin[];
  lastUpdated: number;
  totalFetched: number;
  marketStats: {
    totalMarketCap: number;
    totalVolume: number;
    topPerformers: Coin[];
    topGainers: Coin[];
    topLosers: Coin[];
  };
}

interface PaginatedResult {
  coins: Coin[];
  currentPage: number;
  totalPages: number;
  totalCoins: number;
  hasMore: boolean;
}

class CoinDataManager {
  private readonly STORAGE_KEY = 'basegecko_coin_cache';
  private readonly CACHE_DURATION = 30000; // 30 seconds cache
  private readonly REFRESH_INTERVAL = 60000; // Refresh every 60 seconds
  private readonly COINS_PER_PAGE = 10;
  private readonly INITIAL_LOAD_SIZE = 200; // Increased to ensure we get enough data
  
  private cache: CoinDataCache | null = null;
  private refreshTimer: NodeJS.Timeout | null = null;
  private isLoading = false;

  // Load cached data from localStorage
  private loadFromStorage(): CoinDataCache | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return null;

      const parsed: CoinDataCache = JSON.parse(stored);
      
      // Check if cache is still valid
      if (Date.now() - parsed.lastUpdated > this.CACHE_DURATION) {
        console.log('💾 Cache expired, will fetch fresh data');
        return null;
      }

      console.log('📦 Loaded', parsed.coins.length, 'coins from localStorage cache');
      return parsed;
    } catch (error) {
      console.error('❌ Failed to load cache from localStorage:', error);
      return null;
    }
  }

  // Save data to localStorage
  private saveToStorage(data: CoinDataCache): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
      console.log('💾 Saved', data.coins.length, 'coins to localStorage');
    } catch (error) {
      console.error('❌ Failed to save cache to localStorage:', error);
      // If localStorage is full, clear it and try again
      try {
        localStorage.clear();
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
        console.log('🧹 Cleared localStorage and saved cache');
      } catch (retryError) {
        console.error('❌ Failed to save even after clearing localStorage:', retryError);
      }
    }
  }

  // Analyze and categorize coins
  private analyzeCoins(coins: Coin[]): CoinDataCache['marketStats'] {
    // Sort by different criteria
    const byMarketCap = [...coins].sort((a, b) => b.marketCap - a.marketCap);
    const byVolume = [...coins].sort((a, b) => b.volume24h - a.volume24h);
    const byGains = [...coins].filter(c => c.change24h > 0).sort((a, b) => b.change24h - a.change24h);
    const byLosses = [...coins].filter(c => c.change24h < 0).sort((a, b) => a.change24h - b.change24h);

    // Calculate market stats
    const totalMarketCap = coins.reduce((sum, coin) => sum + coin.marketCap, 0);
    const totalVolume = coins.reduce((sum, coin) => sum + coin.volume24h, 0);

    // Get top performers (combination of market cap and volume)
    const topPerformers = [...coins]
      .map(coin => ({
        ...coin,
        performanceScore: (coin.marketCap * 0.6) + (coin.volume24h * 0.4)
      }))
      .sort((a, b) => b.performanceScore - a.performanceScore)
      .slice(0, 20)
      .map(({ performanceScore, ...coin }) => coin);

    return {
      totalMarketCap,
      totalVolume,
      topPerformers: topPerformers.slice(0, 10),
      topGainers: byGains.slice(0, 10),
      topLosers: byLosses.slice(0, 10)
    };
  }

  // Fetch fresh data from API with retry logic
  private async fetchFreshData(): Promise<CoinDataCache> {
    console.log('🔄 Fetching fresh coin data...');
    
    try {
      // Try multiple requests to get more data if needed
      let allCoins: Coin[] = [];
      let attempts = 0;
      const maxAttempts = 3;
      
      while (allCoins.length < 100 && attempts < maxAttempts) {
        attempts++;
        console.log(`📡 API attempt ${attempts}: requesting ${this.INITIAL_LOAD_SIZE} coins`);
        
        // Fetch a large batch of coins
        const coins = await coinsService.getNewCoins({
          limit: this.INITIAL_LOAD_SIZE,
          sortBy: 'marketCap',
          sortOrder: 'desc',
          page: attempts // Try different pages if supported
        });

        console.log(`📥 Received ${coins.length} coins from API (attempt ${attempts})`);
        
        // If this is the first attempt or we got new coins, update our collection
        if (attempts === 1) {
          allCoins = coins;
        } else {
          // Merge new coins, avoiding duplicates
          const existingIds = new Set(allCoins.map(c => c.id));
          const newCoins = coins.filter(c => !existingIds.has(c.id));
          allCoins = [...allCoins, ...newCoins];
          console.log(`🔄 Added ${newCoins.length} new coins, total: ${allCoins.length}`);
        }
        
        // If we got fewer coins than requested, probably no more available
        if (coins.length < this.INITIAL_LOAD_SIZE) {
          console.log('📉 API returned fewer coins than requested, stopping attempts');
          break;
        }
      }

      // If we still don't have enough coins, try a different approach
      if (allCoins.length < 50) {
        console.log('⚠️ Low coin count, trying alternative fetch methods...');
        
        // Try getting trending coins
        try {
          const trending = await coinsService.getTrendingCoins(50);
          const existingIds = new Set(allCoins.map(c => c.id));
          const newTrending = trending.filter(c => !existingIds.has(c.id));
          allCoins = [...allCoins, ...newTrending];
          console.log(`📈 Added ${newTrending.length} trending coins`);
        } catch (error) {
          console.log('❌ Failed to fetch trending coins:', error);
        }
      }

      console.log(`✅ Final coin count: ${allCoins.length}`);

      // If we still have very few coins, something might be wrong with the API
      if (allCoins.length < 10) {
        console.warn('⚠️ Very low coin count received from API');
        // You might want to throw an error or use fallback data here
      }

      // Analyze the data
      const marketStats = this.analyzeCoins(allCoins);

      const cacheData: CoinDataCache = {
        coins: allCoins,
        lastUpdated: Date.now(),
        totalFetched: allCoins.length,
        marketStats
      };

      return cacheData;
    } catch (error) {
      console.error('❌ Failed to fetch fresh data:', error);
      throw error;
    }
  }

  // Get all coins with automatic caching
  async getAllCoins(forceRefresh = false): Promise<Coin[]> {
    // Return cached data if available and not forcing refresh
    if (!forceRefresh && this.cache) {
      console.log('📋 Returning cached coins:', this.cache.coins.length);
      return this.cache.coins;
    }

    // Try to load from localStorage first
    if (!forceRefresh) {
      const stored = this.loadFromStorage();
      if (stored) {
        this.cache = stored;
        console.log('💾 Using stored cache with', stored.coins.length, 'coins');
        return stored.coins;
      }
    }

    // Prevent multiple simultaneous fetches
    if (this.isLoading) {
      console.log('⏳ Already loading, waiting...');
      // Wait for current fetch to complete
      while (this.isLoading) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return this.cache?.coins || [];
    }

    this.isLoading = true;

    try {
      // Fetch fresh data
      const freshData = await this.fetchFreshData();
      
      // Update cache
      this.cache = freshData;
      
      // Save to localStorage
      this.saveToStorage(freshData);
      
      console.log('🎉 Successfully loaded', freshData.coins.length, 'coins');
      return freshData.coins;
    } finally {
      this.isLoading = false;
    }
  }

  // Get paginated coins with smart sorting
  async getPaginatedCoins(
    page: number = 1,
    sortBy: 'marketCap' | 'volume' | 'change' | 'holders' | 'age' = 'marketCap',
    filterBy: 'all' | 'gainers' | 'losers' | 'new' | 'top' = 'all'
  ): Promise<PaginatedResult> {
    const allCoins = await this.getAllCoins();
    
    console.log(`🔍 Processing pagination - Total coins available: ${allCoins.length}`);
    
    // Apply filters
    let filteredCoins = [...allCoins];

    switch (filterBy) {
      case 'gainers':
        filteredCoins = allCoins.filter(coin => coin.change24h > 0);
        console.log(`📈 Filtered to ${filteredCoins.length} gainers`);
        break;
      case 'losers':
        filteredCoins = allCoins.filter(coin => coin.change24h < 0);
        console.log(`📉 Filtered to ${filteredCoins.length} losers`);
        break;
      case 'new':
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        filteredCoins = allCoins.filter(coin => new Date(coin.createdAt) > weekAgo);
        console.log(`🆕 Filtered to ${filteredCoins.length} new coins (last 7 days)`);
        break;
      case 'top':
        // Use pre-analyzed top performers for first page, then sort by market cap
        if (page === 1 && this.cache?.marketStats.topPerformers) {
          const topPerformers = this.cache.marketStats.topPerformers;
          console.log(`🏆 Using ${topPerformers.length} top performers for page 1`);
          return {
            coins: topPerformers,
            currentPage: 1,
            totalPages: Math.ceil(allCoins.length / this.COINS_PER_PAGE),
            totalCoins: allCoins.length,
            hasMore: allCoins.length > this.COINS_PER_PAGE
          };
        }
        filteredCoins = allCoins;
        break;
      default:
        filteredCoins = allCoins;
        console.log(`📊 Using all ${filteredCoins.length} coins`);
    }

    // Apply sorting
    filteredCoins.sort((a, b) => {
      switch (sortBy) {
        case 'marketCap':
          return b.marketCap - a.marketCap;
        case 'volume':
          return b.volume24h - a.volume24h;
        case 'change':
          return b.change24h - a.change24h;
        case 'holders':
          return b.holders - a.holders;
        case 'age':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        default:
          return b.marketCap - a.marketCap;
      }
    });

    // For 'all' filter on first page, prioritize top performers
    if (filterBy === 'all' && page === 1 && sortBy === 'marketCap' && this.cache?.marketStats.topPerformers) {
      const topPerformers = this.cache.marketStats.topPerformers;
      const remaining = filteredCoins.filter(coin => 
        !topPerformers.some(top => top.id === coin.id)
      );
      filteredCoins = [...topPerformers, ...remaining];
      console.log(`✨ Prioritized top performers for page 1`);
    }

    // Calculate pagination
    const totalCoins = filteredCoins.length;
    const totalPages = Math.ceil(totalCoins / this.COINS_PER_PAGE);
    const startIndex = (page - 1) * this.COINS_PER_PAGE;
    const endIndex = startIndex + this.COINS_PER_PAGE;
    const paginatedCoins = filteredCoins.slice(startIndex, endIndex);

    console.log(`📄 Page ${page}/${totalPages}: showing ${paginatedCoins.length} coins (${startIndex + 1}-${Math.min(endIndex, totalCoins)} of ${totalCoins}) - filter: ${filterBy}, sort: ${sortBy}`);

    return {
      coins: paginatedCoins,
      currentPage: page,
      totalPages,
      totalCoins,
      hasMore: endIndex < totalCoins
    };
  }

  // Get market statistics
  async getMarketStats() {
    if (!this.cache) {
      await this.getAllCoins();
    }
    return this.cache?.marketStats || {
      totalMarketCap: 0,
      totalVolume: 0,
      topPerformers: [],
      topGainers: [],
      topLosers: []
    };
  }

  // Get trending coins (top performers)
  async getTrendingCoins(limit: number = 10): Promise<Coin[]> {
    const stats = await this.getMarketStats();
    return stats.topPerformers.slice(0, limit);
  }

  // Get top gainers
  async getTopGainers(limit: number = 10): Promise<Coin[]> {
    const stats = await this.getMarketStats();
    return stats.topGainers.slice(0, limit);
  }

  // Get top losers
  async getTopLosers(limit: number = 10): Promise<Coin[]> {
    const stats = await this.getMarketStats();
    return stats.topLosers.slice(0, limit);
  }

  // Start auto-refresh
  startAutoRefresh(): void {
    this.stopAutoRefresh();
    
    this.refreshTimer = setInterval(async () => {
      console.log('🔄 Auto-refresh triggered');
      try {
        await this.getAllCoins(true); // Force refresh
        console.log('✅ Auto-refresh completed');
      } catch (error) {
        console.error('❌ Auto-refresh failed:', error);
      }
    }, this.REFRESH_INTERVAL);

    console.log('⏰ Auto-refresh started (every', this.REFRESH_INTERVAL / 1000, 'seconds)');
  }

  // Stop auto-refresh
  stopAutoRefresh(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
      console.log('⏹️ Auto-refresh stopped');
    }
  }

  // Force refresh data
  async refresh(): Promise<Coin[]> {
    console.log('🔄 Manual refresh triggered');
    return this.getAllCoins(true);
  }

  // Clear cache
  clearCache(): void {
    this.cache = null;
    localStorage.removeItem(this.STORAGE_KEY);
    console.log('🧹 Cache cleared');
  }

  // Get cache info
  getCacheInfo() {
    return {
      hasCachedData: !!this.cache,
      totalCoins: this.cache?.coins.length || 0,
      lastUpdated: this.cache?.lastUpdated || 0,
      cacheAge: this.cache ? Date.now() - this.cache.lastUpdated : 0,
      isValid: this.cache ? (Date.now() - this.cache.lastUpdated) < this.CACHE_DURATION : false
    };
  }
}

// Export singleton instance
export const coinDataManager = new CoinDataManager();

// Additional debugging function
export const debugCoinDataManager = {
  async testFetch() {
    console.log('🧪 Testing coin data fetch...');
    try {
      const coins = await coinDataManager.getAllCoins(true);
      console.log('🎯 Test results:');
      console.log('- Total coins fetched:', coins.length);
      console.log('- First 3 coins:', coins.slice(0, 3).map(c => ({id: c.id, name: c.name, marketCap: c.marketCap})));
      
      // Test pagination
      const page1 = await coinDataManager.getPaginatedCoins(1, 'marketCap', 'all');
      console.log('- Page 1 results:', page1.coins.length, 'coins');
      console.log('- Total pages:', page1.totalPages);
      console.log('- Total coins for pagination:', page1.totalCoins);
      
      return { success: true, totalCoins: coins.length, pagination: page1 };
    } catch (error) {
      console.error('🚨 Test failed:', error);
      return { success: false, error: error.message };
    }
  }
};