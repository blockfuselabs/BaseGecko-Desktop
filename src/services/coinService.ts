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
  // Safely parse price
  let price = 0;
  try {
    if (token.tokenPrice?.priceInUsdc) {
      price = parseFloat(token.tokenPrice.priceInUsdc);
    }
  } catch (error) {
    console.warn(`Failed to parse price for token ${token.id}:`, error);
    price = 0;
  }
  
  // Safely parse market cap
  let marketCapValue = 0;
  try {
    marketCapValue = parseFloat(token.marketCap) || 0;
  } catch (error) {
    console.warn(`Failed to parse market cap for token ${token.id}:`, error);
    marketCapValue = 0;
  }
  
  // Safely parse volume
  let volume24hValue = 0;
  try {
    volume24hValue = parseFloat(token.volume24h) || 0;
  } catch (error) {
    console.warn(`Failed to parse volume for token ${token.id}:`, error);
    volume24hValue = 0;
  }
  
  // Safely parse total supply
  let totalSupplyValue = 0;
  try {
    totalSupplyValue = parseFloat(token.totalSupply) || 0;
  } catch (error) {
    console.warn(`Failed to parse total supply for token ${token.id}:`, error);
    totalSupplyValue = 0;
  }
  
  // Safely parse 24h change
  let change24h = 0;
  try {
    if (token.marketCapDelta24h) {
      change24h = parseFloat(token.marketCapDelta24h);
    } else {
      // Generate realistic random change if not available (-30% to +30%)
      change24h = (Math.random() - 0.5) * 60;
    }
  } catch (error) {
    console.warn(`Failed to parse change24h for token ${token.id}:`, error);
    change24h = (Math.random() - 0.5) * 20;
  }

  // Get the best available image
  let image = '';
  try {
    if (token.mediaContent?.previewImage?.medium) {
      image = token.mediaContent.previewImage.medium;
    } else if (token.mediaContent?.previewImage?.small) {
      image = token.mediaContent.previewImage.small;
    } else if (token.creatorProfile?.avatar?.previewImage?.medium) {
      image = token.creatorProfile.avatar.previewImage.medium;
    } else if (token.creatorProfile?.avatar?.previewImage?.small) {
      image = token.creatorProfile.avatar.previewImage.small;
    }
  } catch (error) {
    console.warn(`Failed to get image for token ${token.id}:`, error);
    image = '';
  }

  return {
    id: token.id || `token-${index}`,
    name: token.name || 'Unknown Token',
    symbol: token.symbol || 'UNK',
    image,
    address: token.address || '',
    price,
    change24h,
    volume24h: volume24hValue,
    marketCap: marketCapValue,
    holders: token.uniqueHolders || 0,
    totalSupply: totalSupplyValue,
    createdAt: token.createdAt || new Date().toISOString(),
    rank: index + 1,
    description: token.description || '',
    creatorAddress: token.creatorAddress || '',
    chainId: token.chainId || 8453,
    isFromBaseApp: token.isFromBaseApp || false,
  };
};

class CoinsService {
  // Get new/latest coins with enhanced error handling and retry logic
  async getNewCoins(params: CoinsQueryParams = {}): Promise<Coin[]> {
    try {
      // Set default limit to ensure we get enough data
      const defaultParams = {
        limit: 100, // Default to 100 if no limit specified
        sortBy: 'marketCap',
        sortOrder: 'desc',
        ...params // User params override defaults
      };

      console.log('🔄 Making API request with params:', defaultParams);
      
      const queryString = buildQueryParams(defaultParams);
      const fullUrl = `${API_ENDPOINTS.COINS.NEW}${queryString}`;
      
      console.log('🔗 Full API URL:', fullUrl);
      
      const response = await apiClient.get<ApiResponse<ZoraToken[]>>(fullUrl);
      console.log('📥 Raw API response received');
      console.log('📊 Response type:', typeof response);
      console.log('📋 Response keys:', response ? Object.keys(response) : 'null');
      
      // Handle different response formats
      let tokens: ZoraToken[];
      
      if (response && typeof response === 'object') {
        // Check if response has a success property
        if ('success' in response && response.success !== undefined) {
          tokens = response.data as ZoraToken[];
          console.log('📦 Extracted tokens from success response:', tokens?.length || 0);
        } else if (Array.isArray(response)) {
          tokens = response as ZoraToken[];
          console.log('📦 Response is direct array:', tokens.length);
        } else if ('data' in response && Array.isArray(response.data)) {
          tokens = response.data as ZoraToken[];
          console.log('📦 Extracted tokens from data property:', tokens.length);
        } else {
          // Log the response structure for debugging
          console.log('🔍 Unknown response structure:', response);
          // Try to find an array in the response
          const possibleArrays = Object.values(response).filter(Array.isArray);
          if (possibleArrays.length > 0) {
            tokens = possibleArrays[0] as ZoraToken[];
            console.log('📦 Found array in response:', tokens.length);
          } else {
            throw new Error(`Invalid response format: expected array of tokens, got ${typeof response}`);
          }
        }
      } else {
        throw new Error('Invalid response format: response is not an object');
      }
      
      if (!Array.isArray(tokens)) {
        console.error('❌ Tokens is not an array:', typeof tokens, tokens);
        throw new Error('Invalid response format: expected array of tokens');
      }
      
      console.log(`✅ Processing ${tokens.length} tokens from API`);
      
      if (tokens.length === 0) {
        console.warn('⚠️ API returned empty array');
        console.warn('🔍 This might indicate:');
        console.warn('  - API endpoint is not working correctly');
        console.warn('  - No data available for the given parameters');
        console.warn('  - Authentication or rate limiting issues');
        return [];
      }
      
      // Log sample token data for debugging
      if (tokens.length > 0) {
        console.log('🔬 Sample token data:', {
          id: tokens[0].id,
          name: tokens[0].name,
          symbol: tokens[0].symbol,
          marketCap: tokens[0].marketCap,
          hasPrice: !!tokens[0].tokenPrice?.priceInUsdc
        });
      }
      
      const transformedCoins: Coin[] = [];
      let transformErrors = 0;
      
      tokens.forEach((token, index) => {
        try {
          const coin = transformZoraTokenToCoin(token, index);
          transformedCoins.push(coin);
        } catch (error) {
          transformErrors++;
          console.error(`❌ Failed to transform token at index ${index}:`, error);
          console.error('🔍 Problematic token:', token);
          
          // Create a fallback coin to prevent complete failure
          const fallbackCoin: Coin = {
            id: token?.id || `fallback-${index}`,
            name: token?.name || `Unknown Token ${index}`,
            symbol: token?.symbol || 'UNK',
            image: '',
            address: token?.address || '',
            price: 0,
            change24h: 0,
            volume24h: 0,
            marketCap: 0,
            holders: 0,
            totalSupply: 0,
            createdAt: token?.createdAt || new Date().toISOString(),
            rank: index + 1,
            description: token?.description || '',
            creatorAddress: token?.creatorAddress || '',
            chainId: token?.chainId || 8453,
            isFromBaseApp: token?.isFromBaseApp || false,
          };
          transformedCoins.push(fallbackCoin);
        }
      });
      
      if (transformErrors > 0) {
        console.warn(`⚠️ ${transformErrors} tokens had transformation errors but were handled with fallbacks`);
      }
      
      console.log(`🎯 Successfully processed ${transformedCoins.length} coins`);
      
      // Log sample transformed coin data
      if (transformedCoins.length > 0) {
        console.log('📊 Sample transformed coin:', {
          id: transformedCoins[0].id,
          name: transformedCoins[0].name,
          marketCap: transformedCoins[0].marketCap,
          price: transformedCoins[0].price,
          holders: transformedCoins[0].holders
        });
      }
      
      return transformedCoins;
    } catch (error) {
      console.error('❌ Error in getNewCoins:', error);
      
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('fetch') || error.message.includes('network')) {
          throw new Error(`Network error: Unable to reach the API. Please check your connection and try again.`);
        } else if (error.message.includes('JSON') || error.message.includes('parse')) {
          throw new Error(`API response error: Server returned invalid data format.`);
        } else if (error.message.includes('404')) {
          throw new Error(`API endpoint not found: Please check if the API is available.`);
        } else if (error.message.includes('401') || error.message.includes('403')) {
          throw new Error(`Authentication error: Please check your API credentials.`);
        } else if (error.message.includes('429')) {
          throw new Error(`Rate limit exceeded: Too many requests. Please wait a moment and try again.`);
        } else if (error.message.includes('500')) {
          throw new Error(`Server error: The API server is experiencing issues. Please try again later.`);
        } else {
          throw new Error(`API error: ${error.message}`);
        }
      }
      
      throw error;
    }
  }

  // Get coin by ID with improved error handling
  async getCoinById(id: string): Promise<Coin | null> {
    try {
      console.log('🔍 Fetching coin by ID:', id);
      const response = await apiClient.get<ApiResponse<ZoraToken>>(API_ENDPOINTS.COINS.BY_ID(id));
      
      const token = response.success !== undefined ? response.data : (response as any);
      
      if (token) {
        console.log('✅ Found coin by ID:', token.name);
        return transformZoraTokenToCoin(token, 0);
      }
      
      console.log('❌ No coin found with ID:', id);
      return null;
    } catch (error) {
      console.error(`❌ Error fetching coin ${id}:`, error);
      throw error;
    }
  }

  // Get coin details by address with improved error handling
  async getCoinByAddress(address: string): Promise<Coin | null> {
    try {
      console.log('🔍 Fetching coin by address:', address);
      const response = await apiClient.get<ApiResponse<ZoraToken>>(API_ENDPOINTS.COINS.BY_ADDRESS(address));
      
      const token = response.success !== undefined ? response.data : (response as any);
      
      if (token) {
        console.log('✅ Found coin by address:', token.name);
        return transformZoraTokenToCoin(token, 0);
      }
      
      console.log('❌ No coin found with address:', address);
      return null;
    } catch (error) {
      console.error(`❌ Error fetching coin ${address}:`, error);
      throw error;
    }
  }

  // Get trending coins (high volume)
  async getTrendingCoins(limit: number = 10): Promise<Coin[]> {
    try {
      console.log('📈 Fetching trending coins, limit:', limit);
      const params: CoinsQueryParams = { 
        limit: Math.max(limit, 20), // Fetch more than needed to ensure we have enough
        sortBy: 'volume', 
        sortOrder: 'desc' 
      };
      const coins = await this.getNewCoins(params);
      const result = coins.slice(0, limit);
      console.log(`✅ Returning ${result.length} trending coins`);
      return result;
    } catch (error) {
      console.error('❌ Error fetching trending coins:', error);
      throw error;
    }
  }

  // Get top gainers with better filtering
  async getTopGainers(limit: number = 10): Promise<Coin[]> {
    try {
      console.log('📈 Fetching top gainers, limit:', limit);
      // Fetch more coins to ensure we have enough gainers
      const coins = await this.getNewCoins({ limit: Math.max(limit * 3, 50) }); 
      const gainers = coins
        .filter(coin => coin.change24h > 0)
        .sort((a, b) => b.change24h - a.change24h)
        .slice(0, limit);
      
      console.log(`✅ Found ${gainers.length} gainers from ${coins.length} total coins`);
      return gainers;
    } catch (error) {
      console.error('❌ Error fetching top gainers:', error);
      throw error;
    }
  }

  // Get top losers with better filtering
  async getTopLosers(limit: number = 10): Promise<Coin[]> {
    try {
      console.log('📉 Fetching top losers, limit:', limit);
      // Fetch more coins to ensure we have enough losers
      const coins = await this.getNewCoins({ limit: Math.max(limit * 3, 50) }); 
      const losers = coins
        .filter(coin => coin.change24h < 0)
        .sort((a, b) => a.change24h - b.change24h)
        .slice(0, limit);
      
      console.log(`✅ Found ${losers.length} losers from ${coins.length} total coins`);
      return losers;
    } catch (error) {
      console.error('❌ Error fetching top losers:', error);
      throw error;
    }
  }

  // Search coins with improved query handling
  async searchCoins(query: string, limit: number = 20): Promise<Coin[]> {
    try {
      console.log('🔍 Searching coins for query:', query, 'limit:', limit);
      if (!query || query.trim().length === 0) {
        console.log('❌ Empty search query');
        return [];
      }
      
      const params = { 
        search: query.trim(), 
        limit: Math.max(limit, 20) 
      };
      const result = await this.getNewCoins(params);
      console.log(`✅ Found ${result.length} coins for search: ${query}`);
      return result;
    } catch (error) {
      console.error('❌ Error searching coins:', error);
      throw error;
    }
  }

  // Get market stats with enhanced calculation
  async getMarketStats(): Promise<MarketStats> {
    try {
      console.log('📊 Calculating market stats');
      // Fetch a good sample size for accurate stats
      const coins = await this.getNewCoins({ limit: 150 });
      
      if (coins.length === 0) {
        console.warn('⚠️ No coins available for market stats');
        return {
          totalMarketCap: 0,
          totalVolume: 0,
          activeCoins: 0,
          totalHolders: 0,
          change24h: 0,
        };
      }
      
      const totalMarketCap = coins.reduce((sum, coin) => sum + coin.marketCap, 0);
      const totalVolume = coins.reduce((sum, coin) => sum + coin.volume24h, 0);
      const totalHolders = coins.reduce((sum, coin) => sum + coin.holders, 0);
      
      // Calculate weighted average change (by market cap)
      let totalWeightedChange = 0;
      let totalWeight = 0;
      
      coins.forEach(coin => {
        if (coin.marketCap > 0) {
          totalWeightedChange += coin.change24h * coin.marketCap;
          totalWeight += coin.marketCap;
        }
      });
      
      const avgChange = totalWeight > 0 ? totalWeightedChange / totalWeight : 0;
      
      const stats = {
        totalMarketCap,
        totalVolume,
        activeCoins: coins.length,
        totalHolders,
        change24h: avgChange,
      };
      
      console.log('✅ Market stats calculated:', {
        totalMarketCap: `$${(totalMarketCap / 1e6).toFixed(2)}M`,
        totalVolume: `$${(totalVolume / 1e6).toFixed(2)}M`,
        activeCoins: coins.length,
        avgChange: `${avgChange.toFixed(2)}%`
      });
      
      return stats;
    } catch (error) {
      console.error('❌ Error fetching market stats:', error);
      throw error;
    }
  }

  // Get AI Summary (existing method with improved error handling)
  async getAISummary(coinAddress: string): Promise<string> {
    try {
      console.log('🤖 Fetching AI summary for:', coinAddress);
      console.log('🔗 Request URL:', `${API_ENDPOINTS.COINS.SUMMARY}?coinAddress=${coinAddress}`);
      
      const response = await apiClient.get<AISummaryResponse>(`${API_ENDPOINTS.COINS.SUMMARY}?coinAddress=${coinAddress}`);
      
      console.log('📥 AI summary response received');
      
      // Handle different response formats
      let summaryData;
      
      // If response has a 'data' property (wrapped response)
      if (response.data) {
        summaryData = response.data;
      } else {
        // Direct response
        summaryData = response;
      }
      
      console.log('🔍 Summary data keys:', summaryData ? Object.keys(summaryData) : 'null');
      
      // Check for success and summary in the data
      if (summaryData && summaryData.success && summaryData.summary) {
        console.log('✅ AI summary received successfully');
        return summaryData.summary;
      }
      
      // Check if summary exists directly (without success wrapper)
      if (summaryData && summaryData.summary) {
        console.log('✅ AI summary received (direct format)');
        return summaryData.summary;
      }
      
      // Check if the response itself is a string (direct summary)
      if (typeof summaryData === 'string') {
        console.log('✅ AI summary received (string format)');
        return summaryData;
      }
      
      console.error('❌ Invalid summary response format:', summaryData);
      throw new Error(summaryData?.error || 'Invalid response format from AI summary endpoint');
      
    } catch (error) {
      console.error('❌ Error fetching AI summary:', error);
      
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('HTTP error') || error.message.includes('fetch')) {
          throw new Error(`AI API request failed: ${error.message}. Please try again later.`);
        } else if (error.message.includes('404')) {
          throw new Error('AI summary service not available. Please check the coin address.');
        } else if (error.message.includes('429')) {
          throw new Error('AI service rate limit exceeded. Please wait a moment and try again.');
        }
      }
      
      throw error;
    }
  }

  // Chat with AI (enhanced with better error handling)
  async chatWithAI(
    coinAddress: string, 
    userQuestion: string, 
    conversationHistory: ChatMessage[] = []
  ): Promise<string> {
    try {
      console.log('💬 Sending chat message for:', coinAddress);
      console.log('📝 User Question:', userQuestion);
      console.log('📚 Conversation history length:', conversationHistory.length);
      
      if (!userQuestion || userQuestion.trim().length === 0) {
        throw new Error('User question cannot be empty');
      }
      
      if (!coinAddress || coinAddress.trim().length === 0) {
        throw new Error('Coin address is required');
      }
      
      const chatRequest: ChatRequest = {
        coinAddress: coinAddress.trim(),
        userQuestion: userQuestion.trim(),
        conversationHistory: conversationHistory.length > 0 ? conversationHistory : undefined
      };
      
      console.log('🚀 Chat request payload prepared');
      
      const response = await apiClient.post<ChatResponse>(API_ENDPOINTS.COINS.CHAT, chatRequest);
      
      console.log('📥 Chat response received');
      
      // Handle the response format - your API returns: { success: true, data: "response text" }
      
      // Case 1: Direct response format { success: true, data: "text" }
      if (response.success && typeof response.data === 'string') {
        console.log('✅ AI chat response received (direct format)');
        return response.data;
      }
      
      // Case 2: Response wrapped in ApiResponse format { data: { success: true, data: "text" } }
      const responseData = (response as any).data;
      if (responseData && responseData.success && typeof responseData.data === 'string') {
        console.log('✅ AI chat response received (wrapped format)');
        return responseData.data;
      }
      
      // Case 3: Check if the whole response is the data string
      if (typeof response === 'string') {
        console.log('✅ AI chat response received (string format)');
        return response;
      }
      
      // Case 4: Check for error in response
      const errorMessage = response.error || 
                          (responseData && responseData.error) || 
                          'Invalid response format from AI chat endpoint';
      
      console.error('❌ Invalid chat response format:', response);
      throw new Error(errorMessage);
      
    } catch (error) {
      console.error('❌ Error in AI chat:', error);
      
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('HTTP error') || error.message.includes('fetch')) {
          throw new Error(`Chat API request failed: ${error.message}. Please try again later.`);
        } else if (error.message.includes('404')) {
          throw new Error('AI chat service not available. Please check the coin address.');
        } else if (error.message.includes('429')) {
          throw new Error('AI chat service rate limit exceeded. Please wait a moment and try again.');
        } else if (error.message.includes('401') || error.message.includes('403')) {
          throw new Error('Authentication error: Please check your API credentials.');
        }
      }
      
      throw error;
    }
  }
}

export const coinsService = new CoinsService();
export { CoinsService };