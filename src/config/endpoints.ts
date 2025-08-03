export const API_ENDPOINTS = {
  // Coins endpoints
  COINS: {
    NEW: '/coins/new',
    BY_ID: (id: string) => `/coins/${id}`,
    BY_ADDRESS: (address: string) => `/coins/${address}`,
    TRENDING: '/coins/trending',
    TOP_GAINERS: '/coins/gainers',
    TOP_LOSERS: '/coins/losers',
    SEARCH: '/coins/search',
    MARKET_DATA: '/coins/market-data',
    SUMMARY: '/coins/summary', // AI summary endpoint
    CHAT: '/coins/chat', // AI chat endpoint
  },
     
  // Market endpoints
  MARKET: {
    STATS: '/market/stats',
    CAP: '/market/cap',
    VOLUME: '/market/volume',
  },
     
  // User endpoints
  USER: {
    WATCHLIST: '/user/watchlist',
    PORTFOLIO: '/user/portfolio',
  }
} as const;

export const buildQueryParams = (params: Record<string, any>): string => {
  const searchParams = new URLSearchParams();
     
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  });
     
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
};

export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface SortParams {
  sortBy?: 'marketCap' | 'volume' | 'price' | 'change' | 'holders' | 'name' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface FilterParams {
  filterBy?: 'all' | 'gainers' | 'losers' | 'new';
  minMarketCap?: number;
  maxMarketCap?: number;
  minVolume?: number;
  maxVolume?: number;
}

export interface CoinsQueryParams extends PaginationParams, SortParams, FilterParams {
  search?: string;
  chainId?: number;
}

// AI Chat interfaces
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

export interface ChatRequest {
  coinAddress: string;
  userQuestion: string;
  conversationHistory?: ChatMessage[];
}

export interface ChatResponse {
  success: boolean;
  data?: string; 
  error?: string;
  conversationId?: string;
}

export default API_ENDPOINTS;