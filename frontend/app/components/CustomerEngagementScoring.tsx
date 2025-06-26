'use client';

import React, { useState, useEffect } from 'react';
import { formatNumber, formatPercentage } from '../../utils/formatters';
import { 
  Target, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Activity,
  Star,
  ArrowUp,
  ArrowDown,
  Eye,
  Filter,
  MoreHorizontal,
  Zap,
  Brain,
  Heart
} from 'lucide-react';

interface EngagementScore {
  customerId: string;
  customerName: string;
  score: number;
  previousScore: number;
  trend: 'up' | 'down' | 'stable';
  segment: 'champion' | 'loyal' | 'potential' | 'at_risk' | 'hibernating';
  factors: {
    transactionFrequency: number;
    transactionVolume: number;
    productUsage: number;
    supportInteraction: number;
    loginActivity: number;
  };
  lastActivity: string;
  recommendations: string[];
}

interface CustomerEngagementScoringProps {
  timeRange?: string;
  maxCustomers?: number;
}

export const CustomerEngagementScoring: React.FC<CustomerEngagementScoringProps> = ({
  timeRange = '30d',
  maxCustomers = 50,
}) => {
  const [scores, setScores] = useState<EngagementScore[]>([]);
  const [selectedSegment, setSelectedSegment] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'score' | 'trend' | 'activity'>('score');
  const [isLoading, setIsLoading] = useState(true);

  // Simulate engagement scoring data
  useEffect(() => {
    setIsLoading(true);
    const generateScores = (): EngagementScore[] => {
      const segments = ['champion', 'loyal', 'potential', 'at_risk', 'hibernating'] as const;
      const trends = ['up', 'down', 'stable'] as const;
      
      return Array.from({ length: maxCustomers }, (_, i) => {
        const score = Math.floor(Math.random() * 100) + 1;
        const previousScore = score + (Math.random() - 0.5) * 20;
        
        const trend: 'up' | 'down' | 'stable' = score > previousScore ? 'up' : score < previousScore ? 'down' : 'stable';
        
        return {
          customerId: `CUST_${String(i + 1).padStart(4, '0')}`,
          customerName: `Customer ${i + 1}`,
          score,
          previousScore,
          trend,
          segment: segments[Math.floor(Math.random() * segments.length)],
          factors: {
            transactionFrequency: Math.floor(Math.random() * 100),
            transactionVolume: Math.floor(Math.random() * 100),
            productUsage: Math.floor(Math.random() * 100),
            supportInteraction: Math.floor(Math.random() * 100),
            loginActivity: Math.floor(Math.random() * 100),
          },
          lastActivity: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
          recommendations: [
            'Increase transaction frequency',
            'Encourage product exploration',
            'Improve support satisfaction'
          ].slice(0, Math.floor(Math.random() * 3) + 1)
        };
      }).sort((a, b) => b.score - a.score);
    };

    setTimeout(() => {
      setScores(generateScores());
      setIsLoading(false);
    }, 1000);
  }, [maxCustomers, timeRange]);

  // Get segment styling
  const getSegmentStyle = (segment: string) => {
    switch (segment) {
      case 'champion':
        return 'bg-green-100 text-green-800';
      case 'loyal':
        return 'bg-blue-100 text-blue-800';
      case 'potential':
        return 'bg-purple-100 text-purple-800';
      case 'at_risk':
        return 'bg-yellow-100 text-yellow-800';
      case 'hibernating':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get score color
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Get trend icon
  const getTrendIcon = (trend: string, scoreDiff: number) => {
    const diff = Math.abs(scoreDiff);
    if (trend === 'up') return <ArrowUp className="w-4 h-4 text-green-600" />;
    if (trend === 'down') return <ArrowDown className="w-4 h-4 text-red-600" />;
    return <div className="w-4 h-4 rounded-full bg-gray-400"></div>;
  };

  // Filter and sort scores
  const filteredScores = scores
    .filter(score => selectedSegment === 'all' || score.segment === selectedSegment)
    .sort((a, b) => {
      switch (sortBy) {
        case 'trend':
          return (b.score - b.previousScore) - (a.score - a.previousScore);
        case 'activity':
          return new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime();
        default:
          return b.score - a.score;
      }
    });

  // Calculate segment statistics
  const segmentStats = {
    champion: scores.filter(s => s.segment === 'champion').length,
    loyal: scores.filter(s => s.segment === 'loyal').length,
    potential: scores.filter(s => s.segment === 'potential').length,
    at_risk: scores.filter(s => s.segment === 'at_risk').length,
    hibernating: scores.filter(s => s.segment === 'hibernating').length,
  };

  if (isLoading) {
    return (
      <div className="customer-engagement-scoring">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="customer-engagement-scoring">
      <div className="bg-white rounded-lg border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Target className="w-6 h-6 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Customer Engagement Scoring
            </h3>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-500">Live Scoring</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center space-x-3">
            <select
              value={selectedSegment}
              onChange={(e) => setSelectedSegment(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Segments</option>
              <option value="champion">Champions</option>
              <option value="loyal">Loyal</option>
              <option value="potential">Potential</option>
              <option value="at_risk">At Risk</option>
              <option value="hibernating">Hibernating</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="score">Sort by Score</option>
              <option value="trend">Sort by Trend</option>
              <option value="activity">Sort by Activity</option>
            </select>

            <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Segment Summary */}
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-5 gap-4 text-center">
            {Object.entries(segmentStats).map(([segment, count]) => (
              <div key={segment} className="cursor-pointer" onClick={() => setSelectedSegment(segment)}>
                <div className="text-lg font-bold text-gray-900">{count}</div>
                <div className="text-xs text-gray-500 capitalize">{segment.replace('_', ' ')}</div>
                <div className={`mt-1 inline-block px-2 py-1 rounded-full text-xs ${getSegmentStyle(segment)}`}>
                  {formatPercentage((count / scores.length) * 100)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Scores List */}
        <div className="max-h-96 overflow-y-auto">
          {filteredScores.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Target className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <div>No customers found for selected segment</div>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredScores.map((customer) => {
                const scoreDiff = customer.score - customer.previousScore;
                return (
                  <div
                    key={customer.customerId}
                    className="p-4 hover:bg-gray-50 transition-colors duration-150"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 flex-1">
                        {/* Score Badge */}
                        <div className="flex-shrink-0">
                          <div className={`w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center border-4 ${
                            customer.score >= 80 ? 'border-green-500' :
                            customer.score >= 60 ? 'border-blue-500' :
                            customer.score >= 40 ? 'border-yellow-500' : 'border-red-500'
                          }`}>
                            <span className={`text-sm font-bold ${getScoreColor(customer.score)}`}>
                              {customer.score}
                            </span>
                          </div>
                        </div>

                        {/* Customer Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-sm font-medium text-gray-900">
                              {customer.customerName}
                            </span>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSegmentStyle(customer.segment)}`}>
                              {customer.segment}
                            </span>
                            {getTrendIcon(customer.trend, scoreDiff)}
                            <span className={`text-xs font-medium ${
                              scoreDiff > 0 ? 'text-green-600' : 
                              scoreDiff < 0 ? 'text-red-600' : 'text-gray-500'
                            }`}>
                              {scoreDiff > 0 ? '+' : ''}{scoreDiff.toFixed(1)}
                            </span>
                          </div>
                          
                          <div className="text-xs text-gray-500 mb-2">
                            ID: {customer.customerId} • Last active: {new Date(customer.lastActivity).toLocaleDateString()}
                          </div>

                          {/* Engagement Factors */}
                          <div className="flex items-center space-x-4 text-xs">
                            <div className="flex items-center space-x-1">
                              <Activity className="w-3 h-3 text-blue-500" />
                              <span>Transactions: {customer.factors.transactionFrequency}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Zap className="w-3 h-3 text-green-500" />
                              <span>Usage: {customer.factors.productUsage}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Heart className="w-3 h-3 text-red-500" />
                              <span>Support: {customer.factors.supportInteraction}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center space-x-2 ml-4">
                        <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                          <Brain className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Recommendations */}
                    {customer.recommendations.length > 0 && (
                      <div className="mt-3 ml-16">
                        <div className="text-xs text-gray-500 mb-1">AI Recommendations:</div>
                        <div className="flex flex-wrap gap-1">
                          {customer.recommendations.map((rec, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full"
                            >
                              {rec}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <Target className="w-4 h-4" />
              <span>Showing {filteredScores.length} of {scores.length} customers</span>
            </div>
            <div>
              Average Score: {formatNumber(scores.reduce((sum, s) => sum + s.score, 0) / scores.length)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerEngagementScoring;