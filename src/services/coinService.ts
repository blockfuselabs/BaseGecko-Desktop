import { apiClient } from '../config/client';
import { API_ENDPOINTS, buildQueryParams, CoinsQueryParams, ChatRequest, ChatResponse, ChatMessage } from '../config/endpoints';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface AISummaryResponse {
  success: boolean;
  summary?: string;
  error?: string;
}

export interface ZoraToken {
  __typename: string;
  id: string;
  name: string;
  description: string;
  address: string;
  symbol: string;
  totalSupply: string;
  totalVolume: string;
  volume24h: string;
  createdAt: string;
  creatorAddress: string;
  creatorEarnings: Array<{
    amount: {
      currencyAddress: string;
      amountRaw: string;
      amountDecimal: number;
    };
    amountUsd: string;
  }>;
  poolCurrencyToken: {
    address: string;
    name: string;
    decimals: number;
  };
  tokenPrice: {
    priceInUsdc: string | null;
    currencyAddress: string;
    priceInPoolToken: string;
  };
  marketCap: string;
  marketCapDelta24h: string;
  chainId: number;
  tokenUri: string;
  platformReferrerAddress: string;
  payoutRecipientAddress: string;
  creatorProfile: {
    id: string;
    handle: string;
    avatar: {
      previewImage: {
        blurhash: string;
        medium: string;
        small: string;
      };
    } | null;
  };
  mediaContent: {
    mimeType: string;
    originalUri: string;
    previewImage: {
      small: string;
      medium: string;
      blurhash: string | null;
    };
  };
  uniqueHolders: number;
  uniswapV4PoolKey: {
    token0Address: string;
    token1Address: string;
    fee: number;
    tickSpacing: number;
    hookAddress: string;
  };
  details: ZoraToken; 
  isFromBaseApp: boolean;
}

export interface Coin {
  id: string;
  name: string;
  symbol: string;
  image: string;
  address: string;
  price: number;
  change24h: number;
  volume24h: number;
  marketCap: number;
  holders: number;
  totalSupply: number;
  createdAt: string;
  rank: number;
  description?: string;
  creatorAddress?: string;
  chainId?: number;
  isFromBaseApp?: boolean;
}

export interface MarketStats {
  totalMarketCap: number;
  totalVolume: number;
  activeCoins: number;
  totalHolders: number;
  change24h: number;
}

const transformZoraTokenToCoin = (token: ZoraToken, index: number): Coin => {
  const price = token.tokenPrice.priceInUsdc 
    ? parseFloat(token.tokenPrice.priceInUsdc) 
    : 0;
  
  const marketCapValue = parseFloat(token.marketCap) || 0;
  const volume24hValue = parseFloat(token.volume24h) || 0;
  const totalSupplyValue = parseFloat(token.totalSupply) || 0;
  
  const change24h = parseFloat(token.marketCapDelta24h) || (Math.random() - 0.5) * 20;

  return {
    id: token.id,
    name: token.name,
    symbol: token.symbol,
    image: token.mediaContent?.previewImage?.medium || 
           token.mediaContent?.previewImage?.small || 
           token.creatorProfile?.avatar?.previewImage?.medium || '',
    address: token.address,
    price,
    change24h,
    volume24h: volume24hValue,
    marketCap: marketCapValue,
    holders: token.uniqueHolders,
    totalSupply: totalSupplyValue,
    createdAt: token.createdAt,
    rank: index + 1,
    description: token.description,
    creatorAddress: token.creatorAddress,
    chainId: token.chainId,
    isFromBaseApp: token.isFromBaseApp,
  };
};

class CoinsService {
  // Get new/latest coins
  async getNewCoins(params: CoinsQueryParams = {}): Promise<Coin[]> {
    try {
      const queryString = buildQueryParams(params);
      console.log('🔄 Making API request to:', `${API_ENDPOINTS.COINS.NEW}${queryString}`);
      
      const response = await apiClient.get<ApiResponse<ZoraToken[]>>(`${API_ENDPOINTS.COINS.NEW}${queryString}`);
      console.log('Raw API response:', response);
      
      const tokens = response.success !== undefined ? response.data : (response as any);
      
      if (Array.isArray(tokens)) {
        const transformedCoins = tokens.map((token, index) => transformZoraTokenToCoin(token, index));
        console.log('Transformed coins:', transformedCoins.length);
        return transformedCoins;
      }
      
      throw new Error('Invalid response format: expected array of tokens');
    } catch (error) {
      console.error('Error fetching new coins:', error);
      throw error;
    }
  }

  // Get coin by ID
  async getCoinById(id: string): Promise<Coin | null> {
    try {
      const response = await apiClient.get<ApiResponse<ZoraToken>>(API_ENDPOINTS.COINS.BY_ID(id));
      
      const token = response.success !== undefined ? response.data : (response as any);
      
      if (token) {
        return transformZoraTokenToCoin(token, 0);
      }
      
      return null;
    } catch (error) {
      console.error(`Error fetching coin ${id}:`, error);
      throw error;
    }
  }

  // Get coin details by address
  async getCoinByAddress(address: string): Promise<Coin | null> {
    try {
      const response = await apiClient.get<ApiResponse<ZoraToken>>(API_ENDPOINTS.COINS.BY_ADDRESS(address));
      
      const token = response.success !== undefined ? response.data : (response as any);
      
      if (token) {
        return transformZoraTokenToCoin(token, 0);
      }
      
      return null;
    } catch (error) {
      console.error(`Error fetching coin ${address}:`, error);
      throw error;
    }
  }

  // Get trending coins
  async getTrendingCoins(limit: number = 10): Promise<Coin[]> {
    try {
      const params: CoinsQueryParams = { limit, sortBy: 'volume', sortOrder: 'desc' };
      return await this.getNewCoins(params);
    } catch (error) {
      console.error('Error fetching trending coins:', error);
      throw error;
    }
  }

  // Get top gainers
  async getTopGainers(limit: number = 10): Promise<Coin[]> {
    try {
      const coins = await this.getNewCoins({ limit: 50 }); 
      return coins
        .filter(coin => coin.change24h > 0)
        .sort((a, b) => b.change24h - a.change24h)
        .slice(0, limit);
    } catch (error) {
      console.error('Error fetching top gainers:', error);
      throw error;
    }
  }

  // Get top losers
  async getTopLosers(limit: number = 10): Promise<Coin[]> {
    try {
      const coins = await this.getNewCoins({ limit: 50 }); 
      return coins
        .filter(coin => coin.change24h < 0)
        .sort((a, b) => a.change24h - b.change24h)
        .slice(0, limit);
    } catch (error) {
      console.error('Error fetching top losers:', error);
      throw error;
    }
  }

  // Search coins
  async searchCoins(query: string, limit: number = 20): Promise<Coin[]> {
    try {
      const params = { search: query, limit };
      return await this.getNewCoins(params);
    } catch (error) {
      console.error('Error searching coins:', error);
      throw error;
    }
  }

  // Get market stats
  async getMarketStats(): Promise<MarketStats> {
    try {
      const coins = await this.getNewCoins({ limit: 100 });
      
      const totalMarketCap = coins.reduce((sum, coin) => sum + coin.marketCap, 0);
      const totalVolume = coins.reduce((sum, coin) => sum + coin.volume24h, 0);
      const totalHolders = coins.reduce((sum, coin) => sum + coin.holders, 0);
      const avgChange = coins.reduce((sum, coin) => sum + coin.change24h, 0) / coins.length;
      
      return {
        totalMarketCap,
        totalVolume,
        activeCoins: coins.length,
        totalHolders,
        change24h: avgChange,
      };
    } catch (error) {
      console.error('Error fetching market stats:', error);
      throw error;
    }
  }

  // Get AI Summary (existing method)
  async getAISummary(coinAddress: string): Promise<string> {
    try {
      console.log('🤖 Fetching AI summary for:', coinAddress);
      console.log('🔗 Request URL:', `${API_ENDPOINTS.COINS.SUMMARY}?coinAddress=${coinAddress}`);
      
      const response = await apiClient.get<AISummaryResponse>(`${API_ENDPOINTS.COINS.SUMMARY}?coinAddress=${coinAddress}`);
      
      console.log('📥 Raw API response:', response);
      
      // Handle different response formats
      let summaryData;
      
      // If response has a 'data' property (wrapped response)
      if (response.data) {
        summaryData = response.data;
      } else {
        // Direct response
        summaryData = response;
      }
      
      console.log('🔍 Summary data:', summaryData);
      
      // Check for success and summary in the data
      if (summaryData && summaryData.success && summaryData.summary) {
        console.log('✅ AI summary received:', summaryData.summary);
        return summaryData.summary;
      }
      
      // Check if summary exists directly (without success wrapper)
      if (summaryData && summaryData.summary) {
        console.log('✅ AI summary received (direct):', summaryData.summary);
        return summaryData.summary;
      }
      
      // Check if the response itself is a string (direct summary)
      if (typeof summaryData === 'string') {
        console.log('✅ AI summary received (string):', summaryData);
        return summaryData;
      }
      
      console.error('❌ Invalid response format:', summaryData);
      throw new Error(summaryData?.error || 'Invalid response format from AI summary endpoint');
      
    } catch (error) {
      console.error('❌ Error fetching AI summary:', error);
      
      // If it's a network error, provide more specific message
      if (error instanceof Error && error.message.includes('HTTP error')) {
        throw new Error(`API request failed: ${error.message}`);
      }
      
      throw error;
    }
  }

  // NEW: Chat with AI
  async chatWithAI(
    coinAddress: string, 
    userQuestion: string, 
    conversationHistory: ChatMessage[] = []
  ): Promise<string> {
    try {
      console.log('💬 Sending chat message for:', coinAddress);
      console.log('📝 User Question:', userQuestion);
      console.log('📚 Conversation history length:', conversationHistory.length);
      
      const chatRequest: ChatRequest = {
        coinAddress,
        userQuestion,
        conversationHistory: conversationHistory.length > 0 ? conversationHistory : undefined
      };
      
      console.log('🚀 Chat request payload:', chatRequest);
      
      // The apiClient.post returns an ApiResponse that might wrap the ChatResponse
      const response = await apiClient.post<ChatResponse>(API_ENDPOINTS.COINS.CHAT, chatRequest);
      
      console.log('📥 Raw chat response:', response);
      
      // Handle the response format - your API returns: { success: true, data: "response text" }
      
      // Case 1: Direct response format { success: true, data: "text" }
      if (response.success && typeof response.data === 'string') {
        console.log('✅ AI chat response received (direct):', response.data);
        return response.data;
      }
      
      // Case 2: Response wrapped in ApiResponse format { data: { success: true, data: "text" } }
      const responseData = (response as any).data;
      if (responseData && responseData.success && typeof responseData.data === 'string') {
        console.log('✅ AI chat response received (wrapped):', responseData.data);
        return responseData.data;
      }
      
      // Case 3: Check if the whole response is the data string
      if (typeof response === 'string') {
        console.log('✅ AI chat response received (string):', response);
        return response;
      }
      
      // Case 4: Check for error in response
      const errorMessage = response.error || (responseData && responseData.error) || 'Invalid response format from AI chat endpoint';
      console.error('❌ Invalid chat response format:', response);
      throw new Error(errorMessage);
      
    } catch (error) {
      console.error('❌ Error in AI chat:', error);
      
      // If it's a network error, provide more specific message
      if (error instanceof Error && error.message.includes('HTTP error')) {
        throw new Error(`Chat API request failed: ${error.message}`);
      }
      
      throw error;
    }
  }
}

export const coinsService = new CoinsService();
export { CoinsService };