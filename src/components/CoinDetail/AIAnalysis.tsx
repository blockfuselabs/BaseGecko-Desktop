import React, { useState, useEffect, useRef } from 'react';
import { Bot, RefreshCw, AlertCircle, MessageSquare, Send, Loader2 } from 'lucide-react';
import { coinsService } from '../../services/coinService';
import { ApiError } from '../../config/client';

interface AIAnalysisProps {
  coinName: string;
  coinAddress?: string;
  coin?: {
    symbol: string;
    price: number;
    change24h: number;
    marketCap: number;
    volume24h: number;
    holders: number;
    isFromBaseApp?: boolean;
  };
}

interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

export const AIAnalysis: React.FC<AIAnalysisProps> = ({ coinName, coinAddress, coin }) => {
  const [analysis, setAnalysis] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useRealAI, setUseRealAI] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const generateFallbackAnalysis = (): string => {
    if (!coin) {
      return `${coinName} shows potential in the cryptocurrency market. As with all digital assets, it's important to consider market volatility and conduct thorough research before making investment decisions.`;
    }

    const insights = [];
    
    // Price performance analysis
    if (coin.change24h > 10) {
      insights.push(`${coinName} demonstrates strong bullish momentum with a ${coin.change24h.toFixed(1)}% gain in 24 hours`);
    } else if (coin.change24h > 0) {
      insights.push(`${coinName} shows positive price action with a ${coin.change24h.toFixed(1)}% increase`);
    } else if (coin.change24h > -5) {
      insights.push(`${coinName} maintains relative stability with a ${Math.abs(coin.change24h).toFixed(1)}% decline`);
    } else {
      insights.push(`${coinName} faces bearish pressure with a ${Math.abs(coin.change24h).toFixed(1)}% decrease`);
    }

    // Market cap analysis
    if (coin.marketCap > 10000000) {
      insights.push('indicating substantial market presence and investor confidence');
    } else if (coin.marketCap > 1000000) {
      insights.push('showing growing market adoption and community interest');
    } else {
      insights.push('representing an early-stage project with growth potential');
    }

    // Volume analysis
    if (coin.volume24h > 100000) {
      insights.push(`High trading volume of ${(coin.volume24h / 1000).toFixed(0)}K suggests active community engagement`);
    } else {
      insights.push('Trading activity indicates developing market interest');
    }

    // Holder analysis
    if (coin.holders > 1000) {
      insights.push(`With ${coin.holders.toLocaleString()} unique holders, the token shows healthy distribution`);
    } else {
      insights.push(`The ${coin.holders} holder base suggests an emerging community`);
    }

    // Base ecosystem analysis
    if (coin.isFromBaseApp) {
      insights.push('Integration with the Base ecosystem provides technical advantages and network effects');
    }

    // Risk assessment
    insights.push('Risk factors include market volatility typical of cryptocurrency assets and regulatory considerations');

    return insights.join('. ') + '.';
  };

  const fetchAISummary = async (): Promise<void> => {
    if (!coinAddress) {
      console.log('⚠️ No coin address provided, using fallback analysis');
      setAnalysis(generateFallbackAnalysis());
      setUseRealAI(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🤖 Fetching AI summary for:', coinAddress);
      const summary = await coinsService.getAISummary(coinAddress);
      setAnalysis(summary);
      setUseRealAI(true);
      
      // Add initial AI message to chat
      setChatMessages([{
        id: Date.now().toString(),
        content: `I've analyzed ${coinName}. Here's my assessment: ${summary}`,
        isUser: false,
        timestamp: new Date()
      }]);
      
      console.log('AI summary loaded successfully');
    } catch (error) {
      console.error('Failed to fetch AI summary:', error);
      
      const errorMessage = error instanceof ApiError ? error.message : 
                         error instanceof Error ? error.message : 
                         'Failed to load AI analysis';
      
      setError(errorMessage);
      setAnalysis(generateFallbackAnalysis());
      setUseRealAI(false);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshAnalysis = (): void => {
    if (coinAddress && useRealAI) {
      fetchAISummary();
    } else {
      setLoading(true);
      setTimeout(() => {
        setAnalysis(generateFallbackAnalysis());
        setLoading(false);
      }, 1000);
    }
  };

  const handleSendMessage = async (): Promise<void> => {
    if (!userInput.trim() || isSending) return;

    const newUserMessage: ChatMessage = {
      id: Date.now().toString(),
      content: userInput,
      isUser: true,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, newUserMessage]);
    setUserInput('');
    setIsSending(true);

    try {
      // Simulate AI response (replace with actual API call)
      const aiResponse = await simulateAIResponse(userInput);
      
      const newAiMessage: ChatMessage = {
        id: Date.now().toString(),
        content: aiResponse,
        isUser: false,
        timestamp: new Date()
      };

      setChatMessages(prev => [...prev, newAiMessage]);
    } catch (err) {
      console.error('Error getting AI response:', err);
      setChatMessages(prev => [...prev, {
        id: Date.now().toString(),
        content: "Sorry, I encountered an error. Please try again later.",
        isUser: false,
        timestamp: new Date()
      }]);
    } finally {
      setIsSending(false);
    }
  };

  const simulateAIResponse = async (query: string): Promise<string> => {
    // This is a mock function - replace with actual API call to your AI service
    return new Promise(resolve => {
      setTimeout(() => {
        const responses = [
          `Based on my analysis of ${coinName}, ${query.toLowerCase().includes('price') ? 
           'the current price action suggests ' + (coin?.change24h && coin.change24h > 0 ? 
           'a bullish trend.' : 'a consolidation phase.') : 
           'this appears to be a promising asset with strong fundamentals.'}`,
          `Regarding ${query}, ${coinName} shows ${coin?.holders && coin.holders > 1000 ? 
           'healthy community adoption' : 'early-stage growth potential'}.`,
          `My technical analysis indicates ${coinName} is currently ${coin?.change24h && coin.change24h > 0 ? 
           'outperforming the market' : 'experiencing normal market fluctuations'}.`,
          `For ${query}, consider that ${coinName} has ${coin?.volume24h && coin.volume24h > 100000 ? 
           'strong liquidity' : 'developing liquidity'} in the market.`
        ];
        resolve(responses[Math.floor(Math.random() * responses.length)]);
      }, 1500);
    });
  };

  useEffect(() => {
    fetchAISummary();
  }, [coinAddress, coinName]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Bot className="w-5 h-5 text-indigo-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            AI Analysis
          </h3>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowChat(!showChat)}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              showChat 
                ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>{showChat ? 'Hide Chat' : 'Chat with AI'}</span>
          </button>
          <button
            onClick={handleRefreshAnalysis}
            disabled={loading}
            className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 border border-gray-200"
            title="Refresh analysis"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
      
      {error && useRealAI && (
        <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <span className="text-xs text-red-700">{error}</span>
        </div>
      )}
      
      {!showChat ? (
        <div className="space-y-3">
          <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4">
            {loading ? (
              <div className="space-y-2">
                <div className="animate-pulse bg-gray-200 h-4 w-full rounded"></div>
                <div className="animate-pulse bg-gray-200 h-4 w-3/4 rounded"></div>
                <div className="animate-pulse bg-gray-200 h-4 w-1/2 rounded"></div>
              </div>
            ) : (
              <p className="text-sm text-gray-900 leading-relaxed">
                {analysis}
              </p>
            )}
          </div>
          
          {coin && (
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="text-center p-2 bg-gray-100 rounded border border-gray-200">
                <div className="text-gray-600">Volatility</div>
                <div className={`font-semibold ${
                  Math.abs(coin.change24h) > 15 ? 'text-red-600' : 
                  Math.abs(coin.change24h) > 5 ? 'text-yellow-600' : 'text-green-600'
                }`}>
                  {Math.abs(coin.change24h) > 15 ? 'High' : 
                   Math.abs(coin.change24h) > 5 ? 'Medium' : 'Low'}
                </div>
              </div>
              
              <div className="text-center p-2 bg-gray-100 rounded border border-gray-200">
                <div className="text-gray-600">Liquidity</div>
                <div className={`font-semibold ${
                  coin.volume24h > 100000 ? 'text-green-600' : 
                  coin.volume24h > 10000 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {coin.volume24h > 100000 ? 'High' : 
                   coin.volume24h > 10000 ? 'Medium' : 'Low'}
                </div>
              </div>
              
              <div className="text-center p-2 bg-gray-100 rounded border border-gray-200">
                <div className="text-gray-600">Adoption</div>
                <div className={`font-semibold ${
                  coin.holders > 1000 ? 'text-green-600' : 
                  coin.holders > 100 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {coin.holders > 1000 ? 'High' : 
                   coin.holders > 100 ? 'Medium' : 'Low'}
                </div>
              </div>
            </div>
          )}
          
          <p className="text-xs text-gray-600">
            * {useRealAI ? 'AI-powered analysis from advanced language models' : 'Generated analysis based on market data and technical indicators'}. Not financial advice.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="h-64 overflow-y-auto space-y-3">
            {chatMessages.map(message => (
              <div 
                key={message.id} 
                className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-xs md:max-w-md rounded-lg p-3 ${
                  message.isUser 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-gray-100 text-black'
                }`}>
                  <p className="text-sm">{message.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask about this token..."
              className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm text-black placeholder-gray-500"
              disabled={isSending}
            />
            <button
              onClick={handleSendMessage}
              disabled={!userInput.trim() || isSending}
              className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {isSending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};