import React from 'react';

interface PerformanceMetricsProps {
  coin: {
    change24h: number;
    change7d: number;
  };
}

export const PerformanceMetrics: React.FC<PerformanceMetricsProps> = ({ coin }) => {
  const metrics = [
    { period: '1h', change: -0.5 },
    { period: '24h', change: coin.change24h },
    { period: '7d', change: coin.change7d },
    { period: '14d', change: 6.6 },
    { period: '30d', change: 12.4 },
    { period: '1y', change: 77.6 },
  ];

  return (
    <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
      {metrics.map((metric) => {
        const isPositive = metric.change >= 0;
        return (
          <div key={metric.period} className="text-center">
            <div className="text-xs text-gray-600 mb-1">{metric.period}</div>
            <div className={`text-sm font-medium ${
              isPositive ? 'text-green-600' : 'text-red-600'
            }`}>
              {isPositive ? '▲' : '▼'} {Math.abs(metric.change).toFixed(1)}%
            </div>
          </div>
        );
      })}
    </div>
  );
};