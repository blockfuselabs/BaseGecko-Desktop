// services/searchService.ts
import { coinsService, Coin } from './coinService';

interface SearchResult {
  coins: Coin[];
  totalFound: number;
  searchTime: number;
}

class CoinedPostSearchService {
  private searchCache = new Map<string, { result: SearchResult, timestamp: number }>();
  private coinDataCache: { coins: Coin[], timestamp: number } | null = null;
  private readonly CACHE_DURATION = 30000; // 30 seconds
  private readonly COIN_CACHE_DURATION = 8000; // 8 seconds (less than 10-second refresh)

  // Main search function for coined posts
  async searchCoinedPosts(query: string, limit: number = 20): Promise<SearchResult> {
    if (!query.trim()) {
      return { coins: [], totalFound: 0, searchTime: 0 };
    }

    const startTime = Date.now();
    const normalizedQuery = query.toLowerCase().trim();
    
    console.log('🔍 Searching coined posts for:', normalizedQuery);

    // Check cache first
    const cached = this.searchCache.get(normalizedQuery);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      console.log('📋 Using cached search results');
      return cached.result;
    }

    try {
      let results: Coin[] = [];

      // Strategy 1: Try local search first (more reliable with your refresh issue)
      results = await this.localSearchCoinedPosts(normalizedQuery, limit * 2);

      // Strategy 2: If local search returns no results, try the search endpoint
      if (results.length === 0) {
        try {
          console.log('🔄 Local search empty, trying API search endpoint...');
          results = await coinsService.searchCoins(normalizedQuery, limit * 2);
          console.log('✅ Search endpoint returned:', results.length, 'results');
        } catch (error) {
          console.log('❌ Search endpoint failed:', error);
        }
      }

      // Strategy 3: If query looks like an address, try direct lookup
      if (results.length === 0 && this.isValidAddress(normalizedQuery)) {
        console.log('🏠 Trying direct address lookup...');
        const addressResult = await this.searchByAddress(normalizedQuery);
        if (addressResult) {
          results = [addressResult];
        }
      }

      // Filter and sort results
      const filteredResults = this.filterAndSortResults(results, normalizedQuery).slice(0, limit);
      const searchTime = Date.now() - startTime;

      const result: SearchResult = {
        coins: filteredResults,
        totalFound: results.length,
        searchTime
      };

      // Cache the result
      this.searchCache.set(normalizedQuery, {
        result,
        timestamp: Date.now()
      });

      console.log(`🎯 Search completed in ${searchTime}ms, found ${filteredResults.length} results`);
      return result;

    } catch (error) {
      console.error('❌ Search failed:', error);
      return { coins: [], totalFound: 0, searchTime: Date.now() - startTime };
    }
  }

  // Local search through cached coined post data
  private async localSearchCoinedPosts(query: string, limit: number): Promise<Coin[]> {
    try {
      const coins = await this.getCoinedPostsForSearch();
      
      const results = coins.filter(coin => {
        // Search in coined post name
        const nameMatch = coin.name.toLowerCase().includes(query);
        
        // Search in symbol
        const symbolMatch = coin.symbol.toLowerCase().includes(query);
        
        // Search in description (if available)
        const descriptionMatch = coin.description?.toLowerCase().includes(query) || false;
        
        // Search in creator address
        const creatorMatch = coin.creatorAddress?.toLowerCase().includes(query) || false;
        
        // Search in contract address
        const addressMatch = coin.address.toLowerCase().includes(query);

        return nameMatch || symbolMatch || descriptionMatch || creatorMatch || addressMatch;
      });

      console.log('🔍 Local search found:', results.length, 'coined posts');
      return results.slice(0, limit);

    } catch (error) {
      console.error('❌ Local search failed:', error);
      return [];
    }
  }

  // Get coined posts data for searching (with smart caching)
  private async getCoinedPostsForSearch(): Promise<Coin[]> {
    // Use cache if recent
    if (this.coinDataCache && Date.now() - this.coinDataCache.timestamp < this.COIN_CACHE_DURATION) {
      return this.coinDataCache.coins;
    }

    try {
      // Fetch a large dataset of coined posts for comprehensive search
      const coins = await coinsService.getNewCoins({ 
        limit: 200, 
        sortBy: 'marketCap', 
        sortOrder: 'desc' 
      });
      
      this.coinDataCache = {
        coins,
        timestamp: Date.now()
      };

      console.log('📦 Cached', coins.length, 'coined posts for search');
      return coins;

    } catch (error) {
      console.error('❌ Failed to fetch coined posts for search:', error);
      return this.coinDataCache?.coins || [];
    }
  }

  // Search by direct address lookup
  private async searchByAddress(address: string): Promise<Coin | null> {
    try {
      console.log('🏠 Looking up coined post by address:', address);
      const coin = await coinsService.getCoinByAddress(address);
      if (coin) {
        console.log('✅ Found coined post:', coin.name, 'by', coin.creatorAddress);
      }
      return coin;
    } catch (error) {
      console.error('❌ Address lookup failed:', error);
      return null;
    }
  }

  // Filter and sort search results by relevance
  private filterAndSortResults(coins: Coin[], query: string): Coin[] {
    return coins.sort((a, b) => {
      const aScore = this.calculateRelevanceScore(a, query);
      const bScore = this.calculateRelevanceScore(b, query);
      
      // Higher score = more relevant
      if (aScore !== bScore) return bScore - aScore;
      
      // If same relevance, sort by market cap
      return b.marketCap - a.marketCap;
    });
  }

  // Calculate how relevant a coined post is to the search query
  private calculateRelevanceScore(coin: Coin, query: string): number {
    let score = 0;
    const lowerQuery = query.toLowerCase();
    const lowerName = coin.name.toLowerCase();
    const lowerSymbol = coin.symbol.toLowerCase();

    // Exact matches get highest priority
    if (lowerName === lowerQuery) score += 100;
    if (lowerSymbol === lowerQuery) score += 90;

    // Name starts with query
    if (lowerName.startsWith(lowerQuery)) score += 50;
    if (lowerSymbol.startsWith(lowerQuery)) score += 40;

    // Name contains query
    if (lowerName.includes(lowerQuery)) score += 25;
    if (lowerSymbol.includes(lowerQuery)) score += 20;

    // Creator address matches (partial)
    if (coin.creatorAddress?.toLowerCase().includes(lowerQuery)) score += 15;

    // Description contains query
    if (coin.description?.toLowerCase().includes(lowerQuery)) score += 10;

    // Contract address matches (partial)
    if (coin.address.toLowerCase().includes(lowerQuery)) score += 5;

    return score;
  }

  // Check if query looks like a valid Ethereum address
  private isValidAddress(query: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/i.test(query);
  }

  // Get search suggestions for auto-complete
  async getSearchSuggestions(query: string, limit: number = 5): Promise<string[]> {
    if (!query.trim() || query.length < 2) return [];

    try {
      const coins = await this.getCoinedPostsForSearch();
      const suggestions = new Set<string>();
      const normalizedQuery = query.toLowerCase();

      coins.forEach(coin => {
        // Add coined post name suggestions
        if (coin.name.toLowerCase().includes(normalizedQuery) && suggestions.size < limit * 2) {
          suggestions.add(coin.name);
        }
        
        // Add symbol suggestions
        if (coin.symbol.toLowerCase().includes(normalizedQuery) && suggestions.size < limit * 2) {
          suggestions.add(coin.symbol);
        }

        // Add creator-based suggestions (first part of address)
        if (coin.creatorAddress?.toLowerCase().includes(normalizedQuery) && suggestions.size < limit * 2) {
          suggestions.add(`Creator: ${coin.creatorAddress.slice(0, 8)}...`);
        }
      });

      return Array.from(suggestions).slice(0, limit);
    } catch (error) {
      console.error('❌ Failed to get suggestions:', error);
      return [];
    }
  }

  // Clear all caches
  clearCache(): void {
    this.searchCache.clear();
    this.coinDataCache = null;
    console.log('🧹 Search cache cleared');
  }

  // Get recent searches (you can implement this to store in localStorage)
  getRecentSearches(): string[] {
    try {
      const recent = localStorage.getItem('coined_post_recent_searches');
      return recent ? JSON.parse(recent) : [];
    } catch {
      return [];
    }
  }

  // Add to recent searches
  addToRecentSearches(query: string): void {
    try {
      const recent = this.getRecentSearches();
      const updated = [query, ...recent.filter(q => q !== query)].slice(0, 10);
      localStorage.setItem('coined_post_recent_searches', JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to save recent search:', error);
    }
  }
}

export const coinedPostSearchService = new CoinedPostSearchService();