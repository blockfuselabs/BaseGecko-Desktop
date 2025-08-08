// components/layout/Layout.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, Settings, Menu, X, TrendingUp, Home, BarChart3, Heart, Briefcase, Flame, Twitter, Github, Mail, ExternalLink, Shield, Zap, MessageCircle, Clock, User } from 'lucide-react';
import { useSearch } from '../../hooks/useSearch';
import { CoinAvatar } from '../common/CoinAvatar';
import { Coin } from '../../services/coinService';
import Logo from "../../assets/images/BaseGecko-logo.svg";

interface SearchDropdownProps {
  query: string;
  results: Coin[];
  suggestions: string[];
  recentSearches: string[];
  loading: boolean;
  isEmpty: boolean;
  showResults: boolean;
  showSuggestions: boolean;
  showRecentSearches: boolean;
  searchTime: number;
  totalFound: number;
  isTyping: boolean;
  minLengthMessage: string;
  onSelectCoin: (coin: Coin) => void;
  onSelectSuggestion: (suggestion: string) => void;
  onSelectRecent: (recent: string) => void;
  onClose: () => void;
}

const SearchDropdown: React.FC<SearchDropdownProps> = ({
  query,
  results,
  suggestions,
  recentSearches,
  loading,
  isEmpty,
  showResults,
  showSuggestions,
  showRecentSearches,
  searchTime,
  totalFound,
  isTyping,
  minLengthMessage,
  onSelectCoin,
  onSelectSuggestion,
  onSelectRecent,
  onClose
}) => {
  if (!query && !showRecentSearches) return null;

  return (
    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg border border-gray-200 shadow-lg z-50 max-h-96 overflow-y-auto">
      {loading && (
        <div className="p-4 text-center text-gray-500">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto mb-2"></div>
          <p className="text-sm">Searching coined posts...</p>
        </div>
      )}

      {isTyping && (
        <div className="p-4 text-center text-gray-500">
          <Search className="w-6 h-6 mx-auto mb-2 text-gray-400" />
          <p className="text-sm">{minLengthMessage}</p>
          <p className="text-xs text-gray-400 mt-1">Keep typing to search coined posts</p>
        </div>
      )}

      {showRecentSearches && !query && (
        <>
          <div className="px-3 py-2 text-xs font-medium text-gray-500 border-b border-gray-100">
            <Clock className="w-3 h-3 inline mr-1" />
            Recent Searches
          </div>
          {recentSearches.map((recent, index) => (
            <button
              key={index}
              onClick={() => onSelectRecent(recent)}
              className="w-full px-3 py-2 text-left hover:bg-gray-50 border-b border-gray-50 last:border-b-0 flex items-center space-x-2"
            >
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-700">{recent}</span>
            </button>
          ))}
        </>
      )}

      {!loading && isEmpty && query && (
        <div className="p-4 text-center text-gray-500">
          <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
          <p className="text-sm font-medium">No coined posts found for "{query}"</p>
          <p className="text-xs mt-1 text-gray-400">
            Try searching by:
            <br />• Coined post name or symbol
            <br />• Creator address (0x...)
            <br />• Part of the token description
          </p>
        </div>
      )}

      {showResults && results.length > 0 && (
        <>
          <div className="px-3 py-2 text-xs font-medium text-gray-500 border-b border-gray-100 flex items-center justify-between">
            <span>
              <Flame className="w-3 h-3 inline mr-1" />
              Coined Posts ({results.length})
            </span>
            {searchTime > 0 && (
              <span className="text-gray-400">
                {searchTime}ms • {totalFound} total
              </span>
            )}
          </div>
          {results.map((coin) => (
            <button
              key={coin.id}
              onClick={() => onSelectCoin(coin)}
              className="w-full px-3 py-3 text-left hover:bg-gray-50 border-b border-gray-50 last:border-b-0 flex items-start space-x-3"
            >
              <CoinAvatar 
                symbol={coin.symbol} 
                name={coin.name} 
                image={coin.image}
                size="sm"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {coin.name}
                  </p>
                  <span className={`text-xs font-medium ${
                    coin.change24h >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {coin.change24h >= 0 ? '+' : ''}{coin.change24h.toFixed(2)}%
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 uppercase font-medium">
                    {coin.symbol}
                  </span>
                  <span className="text-gray-900 font-mono">
                    ${coin.price > 0 ? coin.price.toLocaleString(undefined, { 
                      minimumFractionDigits: 2, 
                      maximumFractionDigits: 8 
                    }) : '0.00'}
                  </span>
                </div>

                {coin.creatorAddress && (
                  <div className="flex items-center mt-1 text-xs text-gray-400">
                    <User className="w-3 h-3 mr-1" />
                    <span className="font-mono">
                      Creator: {coin.creatorAddress.slice(0, 6)}...{coin.creatorAddress.slice(-4)}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between mt-1 text-xs text-gray-500">
                  <span>
                    {coin.holders.toLocaleString()} holders
                  </span>
                  <span>
                    ${(coin.marketCap / 1000000).toFixed(2)}M cap
                  </span>
                </div>
              </div>
            </button>
          ))}
        </>
      )}

      {showSuggestions && suggestions.length > 0 && (
        <>
          <div className="px-3 py-2 text-xs font-medium text-gray-500 border-b border-gray-100">
            <TrendingUp className="w-3 h-3 inline mr-1" />
            Suggestions
          </div>
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => onSelectSuggestion(suggestion)}
              className="w-full px-3 py-2 text-left hover:bg-gray-50 border-b border-gray-50 last:border-b-0 flex items-center space-x-2"
            >
              <Search className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-700">{suggestion}</span>
            </button>
          ))}
        </>
      )}
    </div>
  );
};

// Header Component with Search (SIMPLIFIED - NO STATE CONFLICTS)
interface HeaderProps {
  onCoinSelect?: (coin: Coin) => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Header: React.FC<HeaderProps> = ({ 
  onCoinSelect, 
  activeTab, 
  onTabChange 
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // SINGLE SOURCE OF TRUTH - Only the useSearch hook manages query state
  const {
    query,
    setQuery,
    results,
    suggestions,
    recentSearches,
    loading,
    error,
    clearSearch,
    hasResults,
    isEmpty,
    showResults,
    showSuggestions,
    showRecentSearches,
    searchTime,
    totalFound,
    isTyping,
    minLengthMessage
  } = useSearch({
    debounceMs: 800,      // Wait 800ms after user stops typing
    minQueryLength: 3,    // Require at least 3 characters
    maxResults: 8,
    enableSuggestions: true
  });

  // Close search dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCoinSelect = (coin: Coin) => {
    if (onCoinSelect) {
      onCoinSelect(coin);
    }
    setIsSearchFocused(false);
    clearSearch();
  };

  const handleSuggestionSelect = (suggestion: string) => {
    setQuery(suggestion);
    setIsSearchFocused(true);
  };

  const handleRecentSelect = (recent: string) => {
    setQuery(recent);
    setIsSearchFocused(true);
  };

  const showDropdown = isSearchFocused && (showResults || showSuggestions || showRecentSearches || loading || (isEmpty && query) || isTyping);

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
      <div className="px-4 md:px-6 py-3">
        <div className="flex items-center mx-16 justify-between">
          {/* Logo & Brand */}
          <div className="flex -mx-10 -my-16 gap-2 md:gap-2 items-center -space-x-12">
            <img src={Logo} alt="Base Gecko Logo" className="w-12 md:w-16 lg:w-40" />
            <div className="text-primary-100">
              <h1 className="text-xl font-bold text-[#272757]">BaseGecko</h1>
              <p className="text-xs text-gray-500 hidden md:block">Coined Post Market Tracker</p>
            </div>
          </div>

          {/* Desktop Search Bar - DIRECT CONTROL */}
          <div className="hidden md:flex flex-1 max-w-2xl mx-6" ref={searchRef}>
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search coined posts, symbols, or creator addresses..."
                value={query} // DIRECT FROM HOOK - NO MIDDLEMAN
                onChange={(e) => setQuery(e.target.value)} // DIRECT TO HOOK
                onFocus={() => setIsSearchFocused(true)}
                className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              {query && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              
              {showDropdown && (
                <SearchDropdown
                  query={query}
                  results={results}
                  suggestions={suggestions}
                  recentSearches={recentSearches}
                  loading={loading}
                  isEmpty={isEmpty}
                  showResults={showResults}
                  showSuggestions={showSuggestions}
                  showRecentSearches={showRecentSearches}
                  searchTime={searchTime}
                  totalFound={totalFound}
                  isTyping={isTyping}
                  minLengthMessage={minLengthMessage}
                  onSelectCoin={handleCoinSelect}
                  onSelectSuggestion={handleSuggestionSelect}
                  onSelectRecent={handleRecentSelect}
                  onClose={() => setIsSearchFocused(false)}
                />
              )}
            </div>
          </div>

          {/* Mobile Search Toggle & Actions */}
          <div className="flex items-center space-x-2">
            <button 
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
              onClick={() => setIsSearchExpanded(!isSearchExpanded)}
            >
              <Search className="w-5 h-5 text-gray-600" />
            </button>

            <button className="p-2 hover:bg-gray-100 rounded-lg relative transition-colors">
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            <button 
              className="hidden sm:block p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Settings className="w-5 h-5 text-gray-600" />
            </button>

            <button 
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5 text-gray-600" /> : <Menu className="w-5 h-5 text-gray-600" />}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar - DIRECT CONTROL */}
        {isSearchExpanded && (
          <div className="mt-3 md:hidden">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search coined posts..."
                value={query} // DIRECT FROM HOOK
                onChange={(e) => setQuery(e.target.value)} // DIRECT TO HOOK
                onFocus={() => setIsSearchFocused(true)}
                className="w-full pl-10 pr-10 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                autoFocus
              />
              {query && (
                <button
                  onClick={clearSearch}
                  className="absolute right-8 top-1/2 transform -translate-y-1/2 text-gray-400"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                onClick={() => setIsSearchExpanded(false)}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {/* Mobile Search Dropdown */}
            {showDropdown && (
              <div className="mt-2">
                <SearchDropdown
                  query={query}
                  results={results}
                  suggestions={suggestions}
                  recentSearches={recentSearches}
                  loading={loading}
                  isEmpty={isEmpty}
                  showResults={showResults}
                  showSuggestions={showSuggestions}
                  showRecentSearches={showRecentSearches}
                  searchTime={searchTime}
                  totalFound={totalFound}
                  isTyping={isTyping}
                  minLengthMessage={minLengthMessage}
                  onSelectCoin={handleCoinSelect}
                  onSelectSuggestion={handleSuggestionSelect}
                  onSelectRecent={handleRecentSelect}
                  onClose={() => {
                    setIsSearchFocused(false);
                    setIsSearchExpanded(false);
                  }}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Desktop Navigation */}
      <nav className="hidden md:block border-t mx-16 border-gray-100">
        <div className="px-6">
          <div className="flex space-x-8">
            {[
              { id: 'dashboard', label: 'Coined Post', icon: Home },
              { id: 'watchlist', label: 'Watchlist', icon: Heart },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`flex items-center space-x-2 py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-all ${
                    activeTab === item.id
                      ? 'border-[#272757] text-[#272757]'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <span className="text-red-700 text-sm">{error}</span>
            <button
              onClick={() => {/* Clear error handled by hook */}}
              className="text-red-500 hover:text-red-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

// Modern Mobile Navigation
const MobileNavigation = ({ activeTab, onTabChange }: { activeTab: string; onTabChange: (tab: string) => void }) => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 shadow-lg">
      <div className="flex justify-around">
        {[
          { id: 'dashboard', label: 'Home', icon: Home },
          { id: 'trending', label: 'Trending', icon: Flame },
          { id: 'watchlist', label: 'Watchlist', icon: Heart },
          { id: 'portfolio', label: 'Portfolio', icon: Briefcase },
          { id: 'analytics', label: 'Analytics', icon: BarChart3 }
        ].map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center py-2 px-1 min-w-0 flex-1 ${
                activeTab === item.id
                  ? 'text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="w-6 h-6 mb-1" />
              <span className="text-xs truncate">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

// Minimalistic Modern Footer Component  
const Footer = () => (
  <footer className="bg-white border-t border-gray-100 mt-16">
    <div className="mx-16 px-4 md:px-6 py-8">
      {/* Main Footer Content */}
      <div className="flex flex-col lg:flex-row justify-between items-center space-y-6 lg:space-y-0">
        
        {/* Brand Section */}
        <div className="flex -mx-10 -my-16 gap-2 md:gap-2 items-center -space-x-12">
          <img src={Logo} alt="Base Gecko Logo" className="w-12 md:w-16 lg:w-40" />
          <div className="text-primary-100">
            <h1 className="text-xl font-bold text-[#272757]">BaseGecko</h1>
            <p className="text-xs text-gray-500 hidden md:block">Coined Post Market Tracker</p>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="flex flex-wrap justify-center lg:justify-end items-center gap-6 text-sm">
          <a href="#" className="text-gray-600 hover:text-[#272757] transition-colors font-medium">About</a>
          <a href="#" className="text-gray-600 hover:text-[#272757] transition-colors font-medium">Blog</a>
          <a href="#" className="text-gray-600 hover:text-[#272757] transition-colors font-medium">Support</a>
          <a href="#" className="text-gray-600 hover:text-[#272757] transition-colors font-medium">Privacy</a>
          <a href="#" className="text-gray-600 hover:text-[#272757] transition-colors font-medium">Terms</a>
        </div>

        {/* Social Links */}
        <div className="flex items-center space-x-3">
          <a href="#" className="w-9 h-9 bg-gray-50 hover:bg-gray-100 rounded-lg flex items-center justify-center transition-all group">
            <Twitter className="w-4 h-4 text-gray-600 group-hover:text-[#272757]" />
          </a>
          <a href="#" className="w-9 h-9 bg-gray-50 hover:bg-gray-100 rounded-lg flex items-center justify-center transition-all group">
            <MessageCircle className="w-4 h-4 text-gray-600 group-hover:text-[#272757]" />
          </a>
          <a href="#" className="w-9 h-9 bg-gray-50 hover:bg-gray-100 rounded-lg flex items-center justify-center transition-all group">
            <Github className="w-4 h-4 text-gray-600 group-hover:text-[#272757]" />
          </a>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="mt-8 pt-6 border-t border-gray-100">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-3 md:space-y-0">
          <div className="text-sm text-gray-500">
            © {new Date().getFullYear()} BaseGecko. All rights reserved.
          </div>
          <div className="text-sm text-gray-400">
            Real-time market data
          </div>
        </div>
      </div>
    </div>
  </footer>
);

// SIMPLIFIED Layout Component - NO CONFLICTING STATE
interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onCoinSelect?: (coin: Coin) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange, onCoinSelect }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        onCoinSelect={onCoinSelect}
        activeTab={activeTab}
        onTabChange={onTabChange}
      />
      
      <main className="w-full pb-20 md:pb-0">
        <div className="mx-10 px-4 sm:px-6 py-6">
          {children}
        </div>
      </main>

      <MobileNavigation 
        activeTab={activeTab}
        onTabChange={onTabChange}
      />
      
      <Footer />
    </div>
  );
};