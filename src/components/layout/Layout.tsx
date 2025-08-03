import React, { useState } from 'react';
import { Search, Bell, Settings, Menu, X, TrendingUp, Home, BarChart3, Heart, Briefcase, Flame, Twitter, Github, Mail, ExternalLink, Shield, Zap, MessageCircle } from 'lucide-react';
import Logo from "../../assets/images/BaseGecko-logo.svg"
import { Link } from 'react-router-dom';


// Modern Header Component
const Header = ({ onSearchChange, searchQuery, activeTab, onTabChange }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

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
       
       
          

          {/* Desktop Search Bar */}
          <div className="hidden md:flex flex-1 max-w-2xl mx-6">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search post or addresses..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
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

        {/* Mobile Search Bar */}
        {isSearchExpanded && (
          <div className="mt-3 md:hidden">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search coins, symbols..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                autoFocus
              />
              <button
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                onClick={() => setIsSearchExpanded(false)}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
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
              // { id: 'trending', label: 'Trending', icon: Flame },
              // { id: 'portfolio', label: 'Portfolio', icon: Briefcase },
              // { id: 'analytics', label: 'Analytics', icon: BarChart3 }
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
    </header>
  );
};

// Modern Mobile Navigation
const MobileNavigation = ({ activeTab, onTabChange }) => {
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
          <a href="#" className="text-gray-600 hover:text-[#272757] transition-colors font-medium">API</a>
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
            Real-time market data • Powered by Web3
          </div>
        </div>
      </div>
    </div>
  </footer>
);

// Modern Main Layout Component
export const Layout = ({ children, activeTab, onTabChange }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchChange = (query) => {
    setSearchQuery(query);
    // You can emit this to parent components or global state
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        onSearchChange={handleSearchChange} 
        searchQuery={searchQuery} 
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