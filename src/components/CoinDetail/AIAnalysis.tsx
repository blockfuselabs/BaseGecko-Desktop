import React, { useState, useEffect, useRef } from 'react';
import { Bot, RefreshCw, AlertCircle, MessageSquare, Send, Loader2 } from 'lucide-react';
import { coinsService } from '../../services/coinService';
import { ApiError } from '../../config/client';
import { ChatMessage } from '../../config/endpoints';

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

interface LocalChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export const AIAnalysis: React.FC<AIAnalysisProps> = ({ coinName, coinAddress, coin }) => {
  const [analysis, setAnalysis] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useRealAI, setUseRealAI] = useState(true);
  const [chatAvailable, setChatAvailable] = useState(true); // Separate state for chat availability
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<LocalChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  // Simple markdown renderer for AI responses
  const renderMarkdown = (text: string): JSX.Element => {
    // Split text by **bold** patterns and render accordingly
    const parts = text.split(/(\*\*.*?\*\*)/g);
    
    return (
      <>
        {parts.map((part, index) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            // Remove ** and make bold
            const boldText = part.slice(2, -2);
            return <strong key={index} className="font-semibold text-gray-900">{boldText}</strong>;
          }
          return <span key={index}>{part}</span>;
        })}
      </>
    );
  };

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
      const initialMessage: LocalChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `I've analyzed ${coinName}. Here's my assessment: ${summary}`,
        timestamp: new Date()
      };
      
      setChatMessages([initialMessage]);
      
      console.log('AI summary loaded successfully');
    } catch (error) {
      console.error('Failed to fetch AI summary:', error);
      
      const errorMessage = error instanceof ApiError ? error.message : 
                         error instanceof Error ? error.message : 
                         'Failed to load AI analysis';
      
      setError(errorMessage);
      setAnalysis(generateFallbackAnalysis());
      setUseRealAI(false);
      // Don't disable chat just because summary failed - chat might still work
      setChatAvailable(!!coinAddress);
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

  const convertToApiFormat = (messages: LocalChatMessage[]): ChatMessage[] => {
    return messages.map(msg => ({
      role: msg.role,
      content: msg.content,
      timestamp: msg.timestamp.toISOString()
    }));
  };

  const handleSendMessage = async (): Promise<void> => {
    if (!userInput.trim() || isSending || !coinAddress) return;

    const newUserMessage: LocalChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: userInput,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, newUserMessage]);
    setUserInput('');
    setIsSending(true);

    try {
      // Convert chat history to API format
      const conversationHistory = convertToApiFormat([...chatMessages, newUserMessage]);
      
      // Call the real AI chat API
      const aiResponse = await coinsService.chatWithAI(
        coinAddress,
        userInput, // This will now be sent as 'userQuestion' to match your API
        conversationHistory
      );
      
      const newAiMessage: LocalChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date()
      };

      setChatMessages(prev => [...prev, newAiMessage]);
    } catch (err) {
      console.error('Error getting AI response:', err);
      
      const errorMessage = err instanceof ApiError ? err.message : 
                          err instanceof Error ? err.message : 
                          'Sorry, I encountered an error. Please try again later.';
      
      setChatMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: errorMessage,
        timestamp: new Date()
      }]);
    } finally {
      setIsSending(false);
    }
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
            onClick={() => {
              console.log('🔘 Chat button clicked!', { 
                showChat, 
                coinAddress: !!coinAddress, 
                chatAvailable,
                useRealAI 
              });
              setShowChat(!showChat);
            }}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              showChat 
                ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
            }`}
            title="Toggle chat interface"
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
              <div className="text-sm text-gray-900 leading-relaxed">
                {renderMarkdown(analysis)}
              </div>
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
          {!coinAddress ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
              <AlertCircle className="w-6 h-6 text-yellow-600 mx-auto mb-2" />
              <p className="text-sm text-yellow-800">
                Chat requires a valid coin address to function properly.
              </p>
            </div>
          ) : (
            <>
              <div className="h-64 overflow-y-auto space-y-3 bg-gray-50 rounded-lg p-3 border border-gray-200">
                {chatMessages.map(message => (
                  <div 
                    key={message.id} 
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-xs md:max-w-md rounded-lg p-3 ${
                      message.role === 'user'
                        ? 'bg-indigo-600 text-white' 
                        : 'bg-white text-black border border-gray-200'
                    }`}>
                      <div className="text-sm">
                        {message.role === 'user' ? (
                          message.content
                        ) : (
                          renderMarkdown(message.content)
                        )}
                      </div>
                      <p className="text-xs opacity-70 mt-1">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
                {isSending && (
                  <div className="flex justify-start">
                    <div className="bg-white text-black border border-gray-200 rounded-lg p-3">
                      <div className="flex items-center space-x-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm">AI is thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
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
                  disabled={isSending || !coinAddress}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!userInput.trim() || isSending || !coinAddress}
                  className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};