// hooks/useDashboardData.ts
import { useState, useEffect, useCallback } from 'react';
import { coinDataManager } from '../services/coinDataManager';
import { Coin } from '../services/coinService';

interface DashboardState {
  coins: Coin[];
  loading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  totalCoins: number;
  hasMore: boolean;
  marketStats: {
    totalMarketCap: number;
    totalVolume: number;
    topPerformers: Coin[];
    topGainers: Coin[];
    topLosers: Coin[];
  };
  cacheInfo: {
    hasCachedData: boolean;
    totalCoins: number;
    lastUpdated: number;
    cacheAge: number;
    isValid: boolean;
  };
}

interface UseDashboardOptions {
  coinsPerPage?: number;
  autoRefresh?: boolean;
  initialSortBy?: 'marketCap' | 'volume' | 'change' | 'holders' | 'age';
  initialFilter?: 'all' | 'gainers' | 'losers' | 'new' | 'top';
}

export const useDashboardData = (options: UseDashboardOptions = {}) => {
  const {
    autoRefresh = true,
    initialSortBy = 'marketCap',
    initialFilter = 'all'
  } = options;

  const [state, setState] = useState<DashboardState>({
    coins: [],
    loading: true,
    error: null,
    currentPage: 1,
    totalPages: 0,
    totalCoins: 0,
    hasMore: false,
    marketStats: {
      totalMarketCap: 0,
      totalVolume: 0,
      topPerformers: [],
      topGainers: [],
      topLosers: []
    },
    cacheInfo: {
      hasCachedData: false,
      totalCoins: 0,
      lastUpdated: 0,
      cacheAge: 0,
      isValid: false
    }
  });

  const [sortBy, setSortBy] = useState(initialSortBy);
  const [filterBy, setFilterBy] = useState(initialFilter);

  // Load paginated data
  const loadPage = useCallback(async (
    page: number = 1,
    sort: typeof sortBy = sortBy,
    filter: typeof filterBy = filterBy,
    showLoading = true
  ) => {
    if (showLoading) {
      setState(prev => ({ ...prev, loading: true, error: null }));
    }

    try {
      console.log(`📊 Loading page ${page} with sort: ${sort}, filter: ${filter}`);

      // Get paginated data
      const result = await coinDataManager.getPaginatedCoins(page, sort, filter);
      
      // Get market stats
      const marketStats = await coinDataManager.getMarketStats();
      
      // Get cache info
      const cacheInfo = coinDataManager.getCacheInfo();

      setState(prev => ({
        ...prev,
        coins: result.coins,
        currentPage: result.currentPage,
        totalPages: result.totalPages,
        totalCoins: result.totalCoins,
        hasMore: result.hasMore,
        marketStats,
        cacheInfo,
        loading: false,
        error: null
      }));

      console.log(`✅ Loaded page ${page}: ${result.coins.length} coins`);

    } catch (error) {
      console.error('❌ Failed to load dashboard data:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load data'
      }));
    }
  }, [sortBy, filterBy]);

  // Handle page change
  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= state.totalPages && page !== state.currentPage) {
      loadPage(page, sortBy, filterBy);
    }
  }, [state.totalPages, state.currentPage, sortBy, filterBy, loadPage]);

  // Handle next page
  const nextPage = useCallback(() => {
    if (state.hasMore) {
      goToPage(state.currentPage + 1);
    }
  }, [state.hasMore, state.currentPage, goToPage]);

  // Handle previous page
  const previousPage = useCallback(() => {
    if (state.currentPage > 1) {
      goToPage(state.currentPage - 1);
    }
  }, [state.currentPage, goToPage]);

  // Handle sort change
  const handleSortChange = useCallback((newSortBy: typeof sortBy) => {
    console.log(`🔄 Sort changed to: ${newSortBy}`);
    setSortBy(newSortBy);
    loadPage(1, newSortBy, filterBy); // Reset to page 1 when sorting changes
  }, [filterBy, loadPage]);

  // Handle filter change
  const handleFilterChange = useCallback((newFilterBy: typeof filterBy) => {
    console.log(`🔄 Filter changed to: ${newFilterBy}`);
    setFilterBy(newFilterBy);
    loadPage(1, sortBy, newFilterBy); // Reset to page 1 when filter changes
  }, [sortBy, loadPage]);

  // Manual refresh
  const refresh = useCallback(async () => {
    console.log('🔄 Manual refresh triggered');
    setState(prev => ({ ...prev, loading: true }));
    
    try {
      await coinDataManager.refresh();
      await loadPage(state.currentPage, sortBy, filterBy, false);
      console.log('✅ Manual refresh completed');
    } catch (error) {
      console.error('❌ Manual refresh failed:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to refresh data'
      }));
    }
  }, [state.currentPage, sortBy, filterBy, loadPage]);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Initialize data and auto-refresh
  useEffect(() => {
    loadPage(1, sortBy, filterBy);

    if (autoRefresh) {
      coinDataManager.startAutoRefresh();
      
      // Listen for auto-refresh updates
      const refreshInterval = setInterval(() => {
        const cacheInfo = coinDataManager.getCacheInfo();
        if (cacheInfo.isValid) {
          // Silently update current page without loading indicator
          loadPage(state.currentPage, sortBy, filterBy, false);
        }
      }, 30000); // Check every 30 seconds

      return () => {
        clearInterval(refreshInterval);
        coinDataManager.stopAutoRefresh();
      };
    }

    return () => {
      if (autoRefresh) {
        coinDataManager.stopAutoRefresh();
      }
    };
  }, []); // Only run on mount

  return {
    // Data
    coins: state.coins,
    marketStats: state.marketStats,
    
    // Pagination
    currentPage: state.currentPage,
    totalPages: state.totalPages,
    totalCoins: state.totalCoins,
    hasMore: state.hasMore,
    goToPage,
    nextPage,
    previousPage,
    
    // Sorting & Filtering
    sortBy,
    filterBy,
    handleSortChange,
    handleFilterChange,
    
    // State
    loading: state.loading,
    error: state.error,
    clearError,
    
    // Actions
    refresh,
    
    // Cache info
    cacheInfo: state.cacheInfo,
    
    // Computed properties
    isFirstPage: state.currentPage === 1,
    isLastPage: state.currentPage === state.totalPages,
    showingStart: (state.currentPage - 1) * 10 + 1,
    showingEnd: Math.min(state.currentPage * 10, state.totalCoins),
  };
};