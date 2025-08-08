// hooks/useSearch.ts
import { useState, useEffect, useCallback } from 'react';
import { coinedPostSearchService } from '../services/searchService';
import { Coin } from '../services/coinService';

interface UseSearchOptions {
  debounceMs?: number;
  minQueryLength?: number;
  maxResults?: number;
  enableSuggestions?: boolean;
}

interface SearchState {
  query: string;
  results: Coin[];
  suggestions: string[];
  recentSearches: string[];
  loading: boolean;
  error: string | null;
  searchTime: number;
  totalFound: number;
  hasResults: boolean;
  isEmpty: boolean;
}

export const useSearch = (options: UseSearchOptions = {}) => {
  const {
    debounceMs = 800, // Increased from 300ms to 800ms for less aggressive querying
    minQueryLength = 3, // Increased from 2 to 3 characters minimum
    maxResults = 20,
    enableSuggestions = true
  } = options;

  const [state, setState] = useState<SearchState>({
    query: '',
    results: [],
    suggestions: [],
    recentSearches: [],
    loading: false,
    error: null,
    searchTime: 0,
    totalFound: 0,
    hasResults: false,
    isEmpty: false
  });

  // Load recent searches on mount
  useEffect(() => {
    const recent = coinedPostSearchService.getRecentSearches();
    setState(prev => ({ ...prev, recentSearches: recent }));
  }, []);

  // Debounced search function - now waits longer before querying
  const debouncedSearch = useCallback(
    debounce(async (searchQuery: string) => {
      // More strict validation before making API calls
      if (searchQuery.length < minQueryLength) {
        setState(prev => ({
          ...prev,
          results: [],
          suggestions: [],
          loading: false,
          error: null,
          isEmpty: false,
          hasResults: false
        }));
        return;
      }

      console.log('🔍 Making search request for:', searchQuery, 'after', debounceMs, 'ms delay');
      setState(prev => ({ ...prev, loading: true, error: null }));

      try {
        // Always get search results
        const searchResult = await coinedPostSearchService.searchCoinedPosts(searchQuery, maxResults);
        
        // Get suggestions if enabled - but only after a complete search
        let searchSuggestions: string[] = [];
        if (enableSuggestions && searchQuery.length >= minQueryLength) {
          searchSuggestions = await coinedPostSearchService.getSearchSuggestions(searchQuery, 5);
        }
        
        // Add to recent searches if we got results
        if (searchResult.coins.length > 0) {
          coinedPostSearchService.addToRecentSearches(searchQuery);
        }

        setState(prev => ({
          ...prev,
          results: searchResult.coins,
          suggestions: searchSuggestions,
          loading: false,
          searchTime: searchResult.searchTime,
          totalFound: searchResult.totalFound,
          hasResults: searchResult.coins.length > 0,
          isEmpty: searchResult.coins.length === 0,
          recentSearches: coinedPostSearchService.getRecentSearches()
        }));

        console.log('✅ Search completed:', {
          query: searchQuery,
          results: searchResult.coins.length,
          time: searchResult.searchTime + 'ms'
        });

      } catch (err) {
        console.error('❌ Search error:', err);
        setState(prev => ({
          ...prev,
          loading: false,
          error: 'Failed to search coined posts. Please try again.',
          results: [],
          suggestions: [],
          hasResults: false,
          isEmpty: true
        }));
      }
    }, debounceMs),
    [minQueryLength, maxResults, debounceMs, enableSuggestions]
  );

  // Effect to trigger search when query changes
  useEffect(() => {
    if (state.query.trim()) {
      // Show typing indicator for queries that are too short
      if (state.query.trim().length < minQueryLength) {
        setState(prev => ({
          ...prev,
          results: [],
          suggestions: [],
          loading: false,
          error: null,
          isEmpty: false,
          hasResults: false
        }));
        return;
      }

      // Only start search for queries that meet minimum length
      console.log('⏳ Starting search timer for:', state.query.trim());
      debouncedSearch(state.query.trim());
    } else {
      // Clear results when query is empty
      setState(prev => ({
        ...prev,
        results: [],
        suggestions: [],
        loading: false,
        error: null,
        isEmpty: false,
        hasResults: false
      }));
    }
  }, [state.query, debouncedSearch, minQueryLength]);

  const setQuery = (newQuery: string) => {
    setState(prev => ({ ...prev, query: newQuery }));
  };

  const clearSearch = () => {
    setState(prev => ({
      ...prev,
      query: '',
      results: [],
      suggestions: [],
      error: null,
      loading: false,
      hasResults: false,
      isEmpty: false
    }));
  };

  const clearCache = () => {
    coinedPostSearchService.clearCache();
  };

  return {
    // State
    ...state,
    
    // Actions
    setQuery,
    clearSearch,
    clearCache,
    
    // Computed properties
    isSearching: state.loading,
    showResults: state.query.length >= minQueryLength && (state.hasResults || state.isEmpty),
    showSuggestions: enableSuggestions && state.suggestions.length > 0 && !state.hasResults,
    showRecentSearches: !state.query && state.recentSearches.length > 0,
    isTyping: state.query.length > 0 && state.query.length < minQueryLength,
    minLengthMessage: `Type at least ${minQueryLength} characters to search...`
  };
};

// Enhanced debounce function with cancel capability
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    // Clear any existing timeout
    clearTimeout(timeout);
    
    // Set new timeout
    timeout = setTimeout(() => {
      console.log('🚀 Debounce timer completed, executing search...');
      func(...args);
    }, wait);
    
    console.log('⏱️ Debounce timer set for', wait, 'ms');
  };
}