import { useState, useEffect, useCallback } from 'react';
import { coinsService, Coin, MarketStats } from '../services/coinService';
import { CoinsQueryParams } from '../config/endpoints';
import { ApiError } from '../config/client';

export interface UseCoinsState {
  coins: Coin[];
  loading: boolean;
  error: string | null;
  marketStats: MarketStats | null;
  hasMore: boolean;
}

export interface UseCoinsActions {
  fetchCoins: (params?: CoinsQueryParams) => Promise<void>;
  fetchTrendingCoins: (limit?: number) => Promise<void>;
  fetchTopGainers: (limit?: number) => Promise<void>;
  fetchTopLosers: (limit?: number) => Promise<void>;
  searchCoins: (query: string, limit?: number) => Promise<void>;
  fetchCoinById: (id: string) => Promise<Coin | null>;
  fetchMarketStats: () => Promise<void>;
  refreshData: () => Promise<void>;
  clearError: () => void;
  loadMore: () => Promise<void>;
}

export interface UseCoinsReturn extends UseCoinsState, UseCoinsActions {}

export interface UseCoinsOptions {
  autoFetch?: boolean;
  initialParams?: CoinsQueryParams;
  refreshInterval?: number; 
  persistData?: boolean; // New option to persist data across refreshes
}

export const useCoins = (options: UseCoinsOptions = {}): UseCoinsReturn => {
  const {
    autoFetch = true,
    initialParams = { limit: 50, sortBy: 'marketCap' as const, sortOrder: 'desc' as const }, // Increased default limit
    refreshInterval = 0, // Default to 0 (no auto-refresh)
    persistData = true // Default to persist data
  } = options;

  const [state, setState] = useState<UseCoinsState>({
    coins: [],
    loading: false,
    error: null,
    marketStats: null,
    hasMore: true,
  });

  const [currentParams, setCurrentParams] = useState<CoinsQueryParams>(initialParams);
  const [currentPage, setCurrentPage] = useState(1);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const updateState = useCallback((updates: Partial<UseCoinsState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const clearError = useCallback(() => {
    updateState({ error: null });
  }, [updateState]);

  const handleError = useCallback((error: unknown) => {
    console.error('Coins API Error:', error);
    
    let errorMessage = 'An unexpected error occurred';
    
    if (error instanceof ApiError) {
      errorMessage = error.message;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    updateState({ error: errorMessage, loading: false });
  }, [updateState]);

  // Fetch coins with parameters
  const fetchCoins = useCallback(async (params: CoinsQueryParams = {}) => {
    try {
      updateState({ loading: true, error: null });
      
      const mergedParams = { ...currentParams, ...params };
      setCurrentParams(mergedParams);
      
      console.log('🔄 Fetching coins with params:', mergedParams);
      
      const coins = await coinsService.getNewCoins(mergedParams);
      
      // If this is a filter change or initial load, replace the coins
      // Otherwise, this should be handled by loadMore
      if (isInitialLoad || params.sortBy || params.filterBy || params.search) {
        console.log(`📊 Loaded ${coins.length} coins, hasMore: ${coins.length === (mergedParams.limit || 50)}`);
        updateState({ 
          coins, 
          loading: false,
          hasMore: coins.length === (mergedParams.limit || 50) // Updated default from 20 to 50
        });
        setCurrentPage(1);
        setIsInitialLoad(false);
      }
      
    } catch (error) {
      handleError(error);
    }
  }, [currentParams, updateState, handleError, isInitialLoad]);

  // Fetch trending coins
  const fetchTrendingCoins = useCallback(async (limit: number = 10) => {
    try {
      updateState({ loading: true, error: null });
      
      const coins = await coinsService.getTrendingCoins(limit);
      
      updateState({ coins, loading: false });
    } catch (error) {
      handleError(error);
    }
  }, [updateState, handleError]);

  // Fetch top gainers
  const fetchTopGainers = useCallback(async (limit: number = 10) => {
    try {
      updateState({ loading: true, error: null });
      
      const coins = await coinsService.getTopGainers(limit);
      
      updateState({ coins, loading: false });
    } catch (error) {
      handleError(error);
    }
  }, [updateState, handleError]);

  // Fetch top losers
  const fetchTopLosers = useCallback(async (limit: number = 10) => {
    try {
      updateState({ loading: true, error: null });
      
      const coins = await coinsService.getTopLosers(limit);
      
      updateState({ coins, loading: false });
    } catch (error) {
      handleError(error);
    }
  }, [updateState, handleError]);

  // Search coins
  const searchCoins = useCallback(async (query: string, limit: number = 20) => {
    try {
      updateState({ loading: true, error: null });
      
      const coins = await coinsService.searchCoins(query, limit);
      
      updateState({ coins, loading: false });
    } catch (error) {
      handleError(error);
    }
  }, [updateState, handleError]);

  // Fetch coin by ID
  const fetchCoinById = useCallback(async (id: string): Promise<Coin | null> => {
    try {
      clearError();
      
      const coin = await coinsService.getCoinById(id);
      return coin;
    } catch (error) {
      handleError(error);
      return null;
    }
  }, [clearError, handleError]);

  // Fetch market stats
  const fetchMarketStats = useCallback(async () => {
    try {
      const marketStats = await coinsService.getMarketStats();
      updateState({ marketStats });
    } catch (error) {
      console.error('Error fetching market stats:', error);
      // Don't show error for market stats failure
    }
  }, [updateState]);

  // Refresh data (for feed-like updates, refresh current view without disrupting scroll)
  const refreshData = useCallback(async () => {
    if (persistData) {
      // For feed-like behavior, we refresh the data but try to maintain scroll position
      // by only updating market stats and adding new coins to the top if any
      await fetchMarketStats();
      
      // Optionally refresh the current filter data silently
      try {
        console.log('🔄 Feed refresh: updating data in background');
        const newCoins = await coinsService.getNewCoins({ ...currentParams, limit: 20 });
        
        // Check if we have any truly new coins (by comparing IDs)
        const existingIds = state.coins.map(coin => coin.id);
        const actuallyNewCoins = newCoins.filter(coin => !existingIds.includes(coin.id));
        
        if (actuallyNewCoins.length > 0) {
          console.log(`📊 Found ${actuallyNewCoins.length} new coins, adding to top of feed`);
          updateState({ 
            coins: [...actuallyNewCoins, ...state.coins]
          });
        }
      } catch (error) {
        // Silent fail for background refresh
        console.warn('Background refresh failed:', error);
      }
    } else {
      // Full refresh if persist is disabled
      await Promise.all([
        fetchCoins(currentParams),
        fetchMarketStats()
      ]);
    }
  }, [fetchMarketStats, fetchCoins, currentParams, persistData, state.coins, updateState]);

  // Load more coins (infinite scroll)
  const loadMore = useCallback(async () => {
    if (!state.hasMore || state.loading) return;
    
    try {
      updateState({ loading: true });
      
      const nextPage = currentPage + 1;
      const params = {
        ...currentParams,
        page: nextPage,
        offset: (nextPage - 1) * (currentParams.limit || 50) // Updated default from 20 to 50
      };
      
      console.log('📄 Loading more coins, page:', nextPage, 'offset:', params.offset);
      
      const newCoins = await coinsService.getNewCoins(params);
      
      console.log(`📊 Loaded ${newCoins.length} more coins (page ${nextPage})`);
      
      // Append new coins to existing list
      updateState({ 
        coins: [...state.coins, ...newCoins],
        loading: false,
        hasMore: newCoins.length === (currentParams.limit || 50) // Updated default from 20 to 50
      });
      
      setCurrentPage(nextPage);
      
    } catch (error) {
      handleError(error);
    }
  }, [state.hasMore, state.loading, state.coins, currentPage, currentParams, updateState, handleError]);

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch) {
      fetchCoins(initialParams);
      fetchMarketStats();
    }
  }, [autoFetch]); // Remove dependencies to prevent re-running

  // Set up refresh interval (Twitter-like feed updates)
  useEffect(() => {
    if (refreshInterval && refreshInterval > 0) {
      console.log(`⏱️ Setting up feed refresh every ${refreshInterval/1000} seconds`);
      
      const interval = setInterval(() => {
        if (!state.loading) {
          refreshData();
        }
      }, refreshInterval);

      return () => {
        console.log('🛑 Clearing feed refresh interval');
        clearInterval(interval);
      };
    }
  }, [refreshInterval, refreshData, state.loading]);

  return {
    ...state,
    fetchCoins,
    fetchTrendingCoins,
    fetchTopGainers,
    fetchTopLosers,
    searchCoins,
    fetchCoinById,
    fetchMarketStats,
    refreshData,
    clearError,
    loadMore,
  };
};

// Specialized hooks
export const useTrendingCoins = (limit: number = 10) => {
  return useCoins({
    autoFetch: false, 
    initialParams: { limit, sortBy: 'volume' as const, sortOrder: 'desc' as const },
    persistData: true
  });
};

export const useTopGainers = (limit: number = 10) => {
  return useCoins({
    autoFetch: false,
    initialParams: { limit, filterBy: 'gainers', sortBy: 'change' as const, sortOrder: 'desc' as const },
    persistData: true
  });
};

export const useNewCoins = (limit: number = 20) => {
  return useCoins({
    autoFetch: true,
    initialParams: { limit, sortBy: 'createdAt' as const, sortOrder: 'desc' as const },
    refreshInterval: 0, 
    persistData: true
  });
};