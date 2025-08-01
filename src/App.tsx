import React, { useState } from 'react';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard'; // Changed to named import
import { CoinDetail } from './pages/CoinDetail';
import { Watchlist } from './pages/Watchlist';
import { Settings } from './pages/Settings';
import './styles/globals.css';

type Page = 'dashboard' | 'trending' | 'watchlist' | 'portfolio' | 'analytics' | 'settings' | 'coin-detail';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [selectedCoin, setSelectedCoin] = useState<any>(null);

  const handleTabChange = (tab: string) => {
    setCurrentPage(tab as Page);
    if (tab !== 'coin-detail') {
      setSelectedCoin(null);
    }
  };

  const handleViewCoinDetail = (coinData: any) => {
    console.log('🔄 App.tsx received coinData:', coinData);
    
    setSelectedCoin({
      ...coinData,
      coinImage: coinData.image || coinData.coinImage,
      avatarGenerated: true
    });
    setCurrentPage('coin-detail');
  };

  const handleBackToDashboard = () => {
    setCurrentPage('dashboard');
    setSelectedCoin(null);
  };

  const handleNavigateToDashboard = () => {
    setCurrentPage('dashboard');
    setSelectedCoin(null);
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onViewCoinDetail={handleViewCoinDetail} />;
      
      case 'trending':
        return (
          <div className="space-y-6 md:space-y-8">
            <div>
              <h1 className="text-2xl md:text-4xl font-bold text-[#222928] mb-2">
                Trending Cryptocurrencies
              </h1>
              <p className="text-gray-600">
                The most popular cryptocurrencies by search volume in the last 24 hours
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-[#557e92]/20 rounded-full flex items-center justify-center">
                      <span className="text-[#557e92] font-bold text-sm md:text-base">{i}</span>
                    </div>
                    <div className="animate-pulse bg-gray-200 h-6 md:h-8 w-24 md:w-32 rounded"></div>
                  </div>
                  <div className="animate-pulse bg-gray-200 h-4 md:h-6 w-16 md:w-24 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        );
      
      case 'watchlist':
        return <Watchlist onViewCoinDetail={handleViewCoinDetail} onNavigateToDashboard={handleNavigateToDashboard} />;
      
      case 'portfolio':
        return (
          <div className="space-y-6 md:space-y-8">
            <div>
              <h1 className="text-2xl md:text-4xl font-bold text-[#222928] mb-2">
                Your Portfolio
              </h1>
              <p className="text-gray-600">
                Track your coined post investments and performance
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <div className="text-xs md:text-sm text-gray-500 mb-2">Total Value</div>
                <div className="text-xl md:text-2xl font-bold text-[#222928]">$0.00</div>
                <div className="text-xs md:text-sm text-gray-500">0.00% (24h)</div>
              </div>
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <div className="text-xs md:text-sm text-gray-500 mb-2">Today's P&L</div>
                <div className="text-xl md:text-2xl font-bold text-[#222928]">$0.00</div>
                <div className="text-xs md:text-sm text-gray-500">0.00%</div>
              </div>
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <div className="text-xs md:text-sm text-gray-500 mb-2">Holdings</div>
                <div className="text-xl md:text-2xl font-bold text-[#222928]">0</div>
                <div className="text-xs md:text-sm text-gray-500">coins</div>
              </div>
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <div className="text-xs md:text-sm text-gray-500 mb-2">Best Performer</div>
                <div className="text-xl md:text-2xl font-bold text-[#222928]">--</div>
                <div className="text-xs md:text-sm text-gray-500">--</div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm text-center py-8 md:py-12">
              <h3 className="text-lg md:text-xl font-semibold text-[#222928] mb-4">
                Start Building Your Portfolio
              </h3>
              <p className="text-sm md:text-base text-gray-600 mb-6">
                Add your first cryptocurrency to begin tracking your investments
              </p>
              <button className="bg-[#222928] hover:bg-[#557e92] text-white px-6 py-3 rounded-xl font-medium transition-colors text-sm md:text-base">
                Add Your First Coin
              </button>
            </div>
          </div>
        );
      
      case 'analytics':
        return (
          <div className="space-y-6 md:space-y-8">
            <div>
              <h1 className="text-2xl md:text-4xl font-bold text-[#222928] mb-2">
                Market Analytics
              </h1>
              <p className="text-gray-600">
                Deep insights and analysis of the cryptocurrency market
              </p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <h3 className="text-base md:text-lg font-semibold text-[#222928] mb-4">
                  Market Overview
                </h3>
                <div className="animate-pulse bg-gray-200 h-48 md:h-64 rounded"></div>
              </div>
              
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <h3 className="text-base md:text-lg font-semibold text-[#222928] mb-4">
                  Top Movers
                </h3>
                <div className="animate-pulse bg-gray-200 h-48 md:h-64 rounded"></div>
              </div>
              
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <h3 className="text-base md:text-lg font-semibold text-[#222928] mb-4">
                  Volume Analysis
                </h3>
                <div className="animate-pulse bg-gray-200 h-48 md:h-64 rounded"></div>
              </div>
              
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <h3 className="text-base md:text-lg font-semibold text-[#222928] mb-4">
                  Fear & Greed Index
                </h3>
                <div className="animate-pulse bg-gray-200 h-48 md:h-64 rounded"></div>
              </div>
            </div>
          </div>
        );
      
      case 'settings':
        return <Settings />;
      
      case 'coin-detail':
        if (selectedCoin) {
          console.log('🎨 App.tsx rendering CoinDetail with:', {
            coinId: selectedCoin.coinId || selectedCoin.id,
            hasImage: !!(selectedCoin.image || selectedCoin.coinImage),
            hasCoinData: !!(selectedCoin.coinData || selectedCoin)
          });
          
          return (
            <CoinDetail 
              coinId={selectedCoin.coinId || selectedCoin.id}
              coinImage={selectedCoin.image || selectedCoin.coinImage}
              coinData={selectedCoin.coinData || selectedCoin}
              onBack={handleBackToDashboard}
            />
          );
        }
        return <Dashboard onViewCoinDetail={handleViewCoinDetail} />;
      
      default:
        return <Dashboard onViewCoinDetail={handleViewCoinDetail} />;
    }
  };

  return (
    <Layout 
      activeTab={currentPage} 
      onTabChange={handleTabChange}
    >
      <div className="p-4 md:p-0">
        {renderCurrentPage()}
      </div>
    </Layout>
  );
}

export default App;