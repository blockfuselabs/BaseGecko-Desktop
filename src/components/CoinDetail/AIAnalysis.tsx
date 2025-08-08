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

// Enhanced markdown renderer for AI responses
const renderMarkdown = (text: string): JSX.Element => {
  // First, let's preprocess the text to handle the AI's formatting
  console.log('🔍 Original text:', text);
  
  // Clean up the text and normalize line breaks
  let processedText = text
    .replace(/\r\n/g, '\n') // Normalize line endings
    .replace(/\r/g, '\n')   // Handle old Mac line endings
    .trim();

  // Fix the bold numbered list issue by converting **1.** pattern to proper numbered lists
  processedText = processedText.replace(/\*\*(\d+)\.\*\*/g, '$1.');
  
  console.log('🔧 Processed text:', processedText);

  const lines = processedText.split('\n');
  const elements: JSX.Element[] = [];
  let currentListItems: string[] = [];
  let currentOrderedListItems: string[] = [];
  let inCodeBlock = false;
  let codeBlockContent: string[] = [];

  const flushUnorderedList = () => {
    if (currentListItems.length > 0) {
      elements.push(
        <ul key={`ul-${elements.length}`} className="list-disc list-inside ml-4 mb-3 space-y-1">
          {currentListItems.map((item, idx) => (
            <li key={idx} className="text-sm text-gray-800 leading-relaxed">
              {renderInlineMarkdown(item)}
            </li>
          ))}
        </ul>
      );
      currentListItems = [];
    }
  };

  const flushOrderedList = () => {
    if (currentOrderedListItems.length > 0) {
      console.log('📝 Flushing ordered list with items:', currentOrderedListItems);
      elements.push(
        <div key={`ol-${elements.length}`} className="ml-4 mb-3 space-y-2">
          {currentOrderedListItems.map((item, idx) => (
            <div key={idx} className="flex items-start space-x-3 text-sm text-gray-800 leading-relaxed">
              <span className="font-bold text-indigo-600 min-w-[2rem] flex-shrink-0 mt-0.5">
                {idx + 1}.
              </span>
              <div className="flex-1">
                {renderInlineMarkdown(item)}
              </div>
            </div>
          ))}
        </div>
      );
      currentOrderedListItems = [];
    }
  };

  const flushCodeBlock = () => {
    if (codeBlockContent.length > 0) {
      elements.push(
        <pre key={`code-${elements.length}`} className="bg-gray-900 text-green-400 p-3 rounded-lg text-xs font-mono mb-3 overflow-x-auto">
          <code>{codeBlockContent.join('\n')}</code>
        </pre>
      );
      codeBlockContent = [];
    }
  };

  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    console.log(`📄 Line ${index}: "${trimmedLine}"`);

    // Handle code blocks
    if (trimmedLine === '```' || trimmedLine.startsWith('```')) {
      if (inCodeBlock) {
        flushCodeBlock();
        inCodeBlock = false;
      } else {
        flushUnorderedList();
        flushOrderedList();
        inCodeBlock = true;
      }
      return;
    }

    if (inCodeBlock) {
      codeBlockContent.push(line);
      return;
    }

    // Handle unordered lists (-, *, •)
    const unorderedListMatch = trimmedLine.match(/^[-*•]\s+(.+)/);
    if (unorderedListMatch) {
      console.log('📋 Found unordered list item:', unorderedListMatch[1]);
      flushOrderedList(); // Flush any pending ordered list
      currentListItems.push(unorderedListMatch[1]);
      return;
    }

    // Handle ordered lists - more flexible pattern matching
    const orderedListMatch = trimmedLine.match(/^(\*\*)?\s*(\d+)\.\s*(\*\*)?\s*(.+)/);
    if (orderedListMatch) {
      console.log('🔢 Found ordered list item:', {
        fullMatch: orderedListMatch[0],
        number: orderedListMatch[2],
        content: orderedListMatch[4]
      });
      flushUnorderedList(); // Flush any pending unordered list
      currentOrderedListItems.push(orderedListMatch[4]); // Use the content after the number
      return;
    }

    // Flush any pending lists when we encounter non-list content
    flushUnorderedList();
    flushOrderedList();

    // Handle headers
    if (trimmedLine.startsWith('### ')) {
      elements.push(
        <h4 key={`h4-${elements.length}`} className="text-md font-semibold text-gray-900 mt-4 mb-2">
          {trimmedLine.substring(4)}
        </h4>
      );
      return;
    }

    if (trimmedLine.startsWith('## ')) {
      elements.push(
        <h3 key={`h3-${elements.length}`} className="text-lg font-semibold text-gray-900 mt-4 mb-2">
          {trimmedLine.substring(3)}
        </h3>
      );
      return;
    }

    if (trimmedLine.startsWith('# ')) {
      elements.push(
        <h2 key={`h2-${elements.length}`} className="text-xl font-bold text-gray-900 mt-4 mb-3">
          {trimmedLine.substring(2)}
        </h2>
      );
      return;
    }

    // Handle blockquotes
    if (trimmedLine.startsWith('> ')) {
      elements.push(
        <blockquote key={`quote-${elements.length}`} className="border-l-4 border-indigo-300 pl-4 italic text-gray-700 mb-3">
          {renderInlineMarkdown(trimmedLine.substring(2))}
        </blockquote>
      );
      return;
    }

    // Handle horizontal rules
    if (trimmedLine === '---' || trimmedLine === '***') {
      elements.push(
        <hr key={`hr-${elements.length}`} className="border-gray-300 my-4" />
      );
      return;
    }

    // Handle regular paragraphs
    if (trimmedLine) {
      elements.push(
        <p key={`p-${elements.length}`} className="text-sm text-gray-800 leading-relaxed mb-3">
          {renderInlineMarkdown(trimmedLine)}
        </p>
      );
    } else if (elements.length > 0) {
      // Add spacing for empty lines
      elements.push(
        <div key={`space-${elements.length}`} className="mb-2"></div>
      );
    }
  });

  // Flush any remaining lists or code blocks
  flushUnorderedList();
  flushOrderedList();
  flushCodeBlock();

  console.log('✅ Final elements:', elements.length);
  return <div className="space-y-1">{elements}</div>;
};

// Enhanced inline markdown renderer
const renderInlineMarkdown = (text: string): JSX.Element => {
  // Handle inline code first
  text = text.replace(/`([^`]+)`/g, '<code class="bg-gray-200 text-gray-800 px-1 rounded text-xs font-mono">$1</code>');
  
  // Handle bold text
  text = text.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>');
  
  // Handle italic text
  text = text.replace(/\*([^*]+)\*/g, '<em class="italic">$1</em>');
  
  // Handle strikethrough
  text = text.replace(/~~([^~]+)~~/g, '<del class="line-through text-gray-500">$1</del>');
  
  // Handle links
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-indigo-600 hover:text-indigo-800 underline">$1</a>');
  
  // Handle highlight/mark
  text = text.replace(/==([^=]+)==/g, '<mark class="bg-yellow-200 px-1 rounded">$1</mark>');

  return <span dangerouslySetInnerHTML={{ __html: text }} />;
};

// Simple fallback renderer for basic formatting
const renderSimpleMarkdown = (text: string): JSX.Element => {
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

export const AIAnalysis: React.FC<AIAnalysisProps> = ({ coinName, coinAddress, coin }) => {
  const [analysis, setAnalysis] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useRealAI, setUseRealAI] = useState(true);
  const [chatAvailable, setChatAvailable] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<LocalChatMessage[]>([]);
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
      const initialMessage: LocalChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `I've analyzed ${coinName}. Here's my assessment:\n\n${summary}`,
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
        userInput,
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
                {/* Use simple renderer for analysis panel */}
                {renderSimpleMarkdown(analysis)}
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
              <div className="h-80 overflow-y-auto space-y-4 bg-gray-50 rounded-lg p-4 border border-gray-200">
                {chatMessages.map(message => (
                  <div 
                    key={message.id} 
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-xs md:max-w-md rounded-lg p-4 ${
                      message.role === 'user'
                        ? 'bg-indigo-600 text-white' 
                        : 'bg-white text-black border border-gray-200 shadow-sm'
                    }`}>
                      <div className="text-sm">
                        {message.role === 'user' ? (
                          message.content
                        ) : (
                          /* Use enhanced renderer for chat messages */
                          renderMarkdown(message.content)
                        )}
                      </div>
                      <p className={`text-xs mt-2 ${
                        message.role === 'user' ? 'text-indigo-200' : 'text-gray-500'
                      }`}>
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
                {isSending && (
                  <div className="flex justify-start">
                    <div className="bg-white text-black border border-gray-200 rounded-lg p-4 shadow-sm">
                      <div className="flex items-center space-x-2">
                        <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                        <span className="text-sm text-gray-600">AI is thinking...</span>
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
                  className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm text-black placeholder-gray-500"
                  disabled={isSending || !coinAddress}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!userInput.trim() || isSending || !coinAddress}
                  className="p-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
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