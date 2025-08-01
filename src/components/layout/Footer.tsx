import React from 'react';
import { TrendingUp, Twitter, Github, Mail, ExternalLink, Shield, Zap, BarChart2, MessageCircle } from 'lucide-react';

interface AdCardProps {
  title: string;
  subtitle: string;
  buttonText: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  href?: string;
}

const AdCard: React.FC<AdCardProps> = ({ title, subtitle, buttonText, icon: Icon, gradient, href = "#" }) => (
  <div className={`relative overflow-hidden rounded-xl p-5 text-white ${gradient} hover:shadow-lg transition-shadow`}>
    <div className="relative z-10">
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
          <Icon className="w-5 h-5" />
        </div>
        <a href={href} target="_blank" rel="noopener noreferrer">
          <ExternalLink className="w-4 h-4 opacity-70 hover:opacity-100 transition-opacity" />
        </a>
      </div>
      <h3 className="text-lg font-bold mb-2">{title}</h3>
      <p className="text-sm opacity-90 mb-4">{subtitle}</p>
      <a 
        href={href} 
        target="_blank" 
        rel="noopener noreferrer"
        className="inline-block bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 py-2 rounded-lg text-sm font-medium transition-all"
      >
        {buttonText}
      </a>
    </div>
    <div className="absolute top-0 right-0 w-28 h-28 bg-white/10 rounded-full -translate-y-12 translate-x-12"></div>
    <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/10 rounded-full translate-y-10 -translate-x-10"></div>
  </div>
);

export const Footer: React.FC = () => (
  <footer className="bg-gray-900 border-t border-gray-800 mt-16">
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-12">
      {/* Advertisement Section */}
      <div className="mb-12">
        <h3 className="text-lg font-semibold text-gray-200 mb-6">Sponsored</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <AdCard
            title="Secure Your Crypto"
            subtitle="Military-grade hardware wallet protection"
            buttonText="Shop Now"
            icon={Shield}
            gradient="bg-gradient-to-br from-indigo-600 to-indigo-800"
            href="https://example.com"
          />
          <AdCard
            title="DeFi Revolution"
            subtitle="Earn up to 20% APY on your crypto"
            buttonText="Start Earning"
            icon={Zap}
            gradient="bg-gradient-to-br from-purple-600 to-purple-800"
            href="https://example.com"
          />
          <AdCard
            title="Advanced Trading"
            subtitle="Professional tools for serious traders"
            buttonText="Get Started"
            icon={BarChart2}
            gradient="bg-gradient-to-br from-blue-600 to-blue-800"
            href="https://example.com"
          />
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
        {/* Company Info */}
        <div>
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-bold text-white">CoinedPost</h3>
          </div>
          <p className="text-gray-400 text-sm mb-4">
            The most comprehensive cryptocurrency market intelligence platform for tracking coined posts.
          </p>
          <div className="flex space-x-3">
            <a 
              href="https://twitter.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-8 h-8 bg-gray-800 hover:bg-indigo-600 rounded-lg flex items-center justify-center transition-all text-gray-300 hover:text-white"
            >
              <Twitter className="w-4 h-4" />
            </a>
            <a 
              href="https://discord.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-8 h-8 bg-gray-800 hover:bg-indigo-600 rounded-lg flex items-center justify-center transition-all text-gray-300 hover:text-white"
            >
              <MessageCircle className="w-4 h-4" />
            </a>
            <a 
              href="https://github.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-8 h-8 bg-gray-800 hover:bg-indigo-600 rounded-lg flex items-center justify-center transition-all text-gray-300 hover:text-white"
            >
              <Github className="w-4 h-4" />
            </a>
            <a 
              href="mailto:contact@example.com" 
              className="w-8 h-8 bg-gray-800 hover:bg-indigo-600 rounded-lg flex items-center justify-center transition-all text-gray-300 hover:text-white"
            >
              <Mail className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Products */}
        <div>
          <h4 className="font-semibold text-white mb-4">Products</h4>
          <ul className="space-y-3 text-sm text-gray-400">
            {['Market Data', 'Portfolio Tracker', 'Price Alerts', 'API Access', 'Mobile App'].map((item) => (
              <li key={item}>
                <a href="#" className="hover:text-indigo-400 transition-colors">{item}</a>
              </li>
            ))}
          </ul>
        </div>

        {/* Resources */}
        <div>
          <h4 className="font-semibold text-white mb-4">Resources</h4>
          <ul className="space-y-3 text-sm text-gray-400">
            {['Blog', 'Learning Center', 'Market Analysis', 'Research Reports', 'Documentation'].map((item) => (
              <li key={item}>
                <a href="#" className="hover:text-indigo-400 transition-colors">{item}</a>
              </li>
            ))}
          </ul>
        </div>

        {/* Support */}
        <div>
          <h4 className="font-semibold text-white mb-4">Support</h4>
          <ul className="space-y-3 text-sm text-gray-400">
            {['Help Center', 'Contact Us', 'Status Page', 'Bug Reports', 'Feature Requests'].map((item) => (
              <li key={item}>
                <a href="#" className="hover:text-indigo-400 transition-colors">{item}</a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
        <div className="text-sm text-gray-500 mb-4 md:mb-0">
          © {new Date().getFullYear()} CoinedPost. All rights reserved.
        </div>
        <div className="flex space-x-6 text-sm text-gray-500">
          {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map((item) => (
            <a 
              key={item} 
              href="#" 
              className="hover:text-indigo-400 transition-colors"
            >
              {item}
            </a>
          ))}
        </div>
      </div>
    </div>
  </footer>
);