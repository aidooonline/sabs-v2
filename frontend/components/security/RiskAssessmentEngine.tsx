'use client';

import React, { useState, useCallback, useMemo } from 'react';

interface RiskFactor {
  id: string;
  name: string;
  category: 'transaction' | 'user' | 'system' | 'external';
  weight: number; // 0-1
  value: number; // 0-100
  threshold: {
    low: number;
    medium: number;
    high: number;
  };
  description: string;
  dataSource: string;
  lastUpdated: string;
}

interface RiskAssessmentResult {
  id: string;
  workflowId: string;
  userId: string;
  userName: string;
  overallScore: number; // 0-100
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  factors: RiskFactorResult[];
  recommendations: RiskRecommendation[];
  mitigationActions: MitigationAction[];
  assessedAt: string;
  expiresAt: string;
  metadata: {
    transactionAmount: number;
    transactionType: string;
    geolocation: string;
    deviceFingerprint: string;
    sessionRisk: number;
  };
}

interface RiskFactorResult {
  factorId: string;
  factorName: string;
  score: number;
  contribution: number; // percentage contribution to overall score
  status: 'normal' | 'warning' | 'alert' | 'critical';
  evidence: string[];
  trend: 'improving' | 'stable' | 'degrading';
}

interface RiskRecommendation {
  id: string;
  type: 'immediate' | 'preventive' | 'monitoring' | 'escalation';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  description: string;
  action: string;
  estimatedImpact: number; // risk reduction percentage
  implementationCost: 'low' | 'medium' | 'high';
  timeframe: string;
}

interface MitigationAction {
  id: string;
  name: string;
  type: 'automated' | 'manual' | 'approval_required';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  description: string;
  triggeredBy: string[];
  parameters: Record<string, any>;
  executedAt?: string;
  result?: {
    success: boolean;
    message: string;
    riskReduction: number;
  };
}

interface RiskProfile {
  userId: string;
  userName: string;
  baselineRisk: number;
  currentRisk: number;
  riskTrend: 'improving' | 'stable' | 'degrading';
  historicalScores: {
    date: string;
    score: number;
    context: string;
  }[];
  behaviorPatterns: {
    avgTransactionAmount: number;
    preferredTimeSlots: string[];
    commonLocations: string[];
    devicePatterns: string[];
    anomalyFrequency: number;
  };
  riskFactors: {
    persistent: string[];
    temporary: string[];
    mitigated: string[];
  };
}

interface RiskAssessmentEngineProps {
  riskFactors: RiskFactor[];
  assessmentResults: RiskAssessmentResult[];
  riskProfiles: RiskProfile[];
  onRunAssessment?: (workflowId: string) => void;
  onExecuteMitigation?: (actionId: string) => void;
  onUpdateRiskThreshold?: (factorId: string, thresholds: RiskFactor['threshold']) => void;
  canManageRisk?: boolean;
}

export const RiskAssessmentEngine: React.FC<RiskAssessmentEngineProps> = ({
  riskFactors,
  assessmentResults,
  riskProfiles,
  onRunAssessment,
  onExecuteMitigation,
  onUpdateRiskThreshold,
  canManageRisk = false
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'assessments' | 'profiles' | 'factors'>('dashboard');
  const [selectedAssessment, setSelectedAssessment] = useState<RiskAssessmentResult | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<RiskProfile | null>(null);
  const [filterRiskLevel, setFilterRiskLevel] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<string>('24h');

  // Calculate risk distribution
  const riskDistribution = useMemo(() => {
    const distribution = { low: 0, medium: 0, high: 0, critical: 0 };
    assessmentResults.forEach(result => {
      distribution[result.riskLevel]++;
    });
    return distribution;
  }, [assessmentResults]);

  // Filter assessments
  const filteredAssessments = useMemo(() => {
    return assessmentResults.filter(result => {
      if (filterRiskLevel !== 'all' && result.riskLevel !== filterRiskLevel) return false;
      
      const assessmentDate = new Date(result.assessedAt);
      const now = new Date();
      const hoursDiff = (now.getTime() - assessmentDate.getTime()) / (1000 * 60 * 60);
      
      switch (timeRange) {
        case '1h': return hoursDiff <= 1;
        case '24h': return hoursDiff <= 24;
        case '7d': return hoursDiff <= 168;
        case '30d': return hoursDiff <= 720;
        default: return true;
      }
    });
  }, [assessmentResults, filterRiskLevel, timeRange]);

  // Get risk level color
  const getRiskLevelColor = useCallback((level: string) => {
    switch (level) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  }, []);

  // Get priority color
  const getPriorityColor = useCallback((priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  }, []);

  // Get trend icon and color
  const getTrendIndicator = useCallback((trend: string) => {
    switch (trend) {
      case 'improving':
        return { icon: '↗', color: 'text-green-600', bg: 'bg-green-100' };
      case 'degrading':
        return { icon: '↘', color: 'text-red-600', bg: 'bg-red-100' };
      case 'stable':
        return { icon: '→', color: 'text-gray-600', bg: 'bg-gray-100' };
      default:
        return { icon: '?', color: 'text-gray-600', bg: 'bg-gray-100' };
    }
  }, []);

  // Calculate average risk score
  const averageRiskScore = useMemo(() => {
    if (assessmentResults.length === 0) return 0;
    return Math.round(
      assessmentResults.reduce((sum, result) => sum + result.overallScore, 0) / 
      assessmentResults.length
    );
  }, [assessmentResults]);

  // Get high-risk factors
  const highRiskFactors = useMemo(() => {
    return riskFactors.filter(factor => factor.value >= factor.threshold.high);
  }, [riskFactors]);

  // Handle run assessment
  const handleRunAssessment = useCallback((workflowId: string) => {
    if (onRunAssessment) {
      onRunAssessment(workflowId);
    }
  }, [onRunAssessment]);

  // Handle execute mitigation
  const handleExecuteMitigation = useCallback((actionId: string) => {
    if (onExecuteMitigation) {
      onExecuteMitigation(actionId);
    }
  }, [onExecuteMitigation]);

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Risk Assessment Engine</h2>
            <p className="text-sm text-gray-600 mt-1">
              Comprehensive risk analysis and threat detection for approval workflows
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <div className="text-sm text-gray-600">Average Risk Score</div>
              <div className={`text-2xl font-bold ${averageRiskScore >= 70 ? 'text-red-600' : averageRiskScore >= 40 ? 'text-yellow-600' : 'text-green-600'}`}>
                {averageRiskScore}/100
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`py-2 px-6 border-b-2 font-medium text-sm ${
              activeTab === 'dashboard'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('assessments')}
            className={`py-2 px-6 border-b-2 font-medium text-sm ${
              activeTab === 'assessments'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Assessments ({assessmentResults.length})
          </button>
          <button
            onClick={() => setActiveTab('profiles')}
            className={`py-2 px-6 border-b-2 font-medium text-sm ${
              activeTab === 'profiles'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Risk Profiles ({riskProfiles.length})
          </button>
          <button
            onClick={() => setActiveTab('factors')}
            className={`py-2 px-6 border-b-2 font-medium text-sm ${
              activeTab === 'factors'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Risk Factors ({highRiskFactors.length} alerts)
          </button>
        </nav>
      </div>

      <div className="p-6">
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div>
            {/* Risk Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <div className="p-2 bg-red-500 rounded-md">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Critical Risk</p>
                    <p className="text-2xl font-semibold text-gray-900">{riskDistribution.critical}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <div className="p-2 bg-orange-500 rounded-md">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">High Risk</p>
                    <p className="text-2xl font-semibold text-gray-900">{riskDistribution.high}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-500 rounded-md">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Medium Risk</p>
                    <p className="text-2xl font-semibold text-gray-900">{riskDistribution.medium}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <div className="p-2 bg-green-500 rounded-md">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Low Risk</p>
                    <p className="text-2xl font-semibold text-gray-900">{riskDistribution.low}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* High-Risk Factors Alert */}
            {highRiskFactors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-red-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <div>
                    <h4 className="text-sm font-medium text-red-800">High-Risk Factors Detected</h4>
                    <p className="text-sm text-red-700 mt-1">
                      {highRiskFactors.length} risk factors are above critical thresholds and require immediate attention.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Recent High-Risk Assessments */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Recent High-Risk Assessments</h3>
              <div className="space-y-3">
                {assessmentResults
                  .filter(result => result.riskLevel === 'critical' || result.riskLevel === 'high')
                  .slice(0, 5)
                  .map(result => (
                    <div key={result.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <span className="font-medium text-gray-900">{result.userName}</span>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRiskLevelColor(result.riskLevel)}`}>
                              {result.riskLevel}
                            </span>
                            <span className="text-sm text-gray-500">Score: {result.overallScore}/100</span>
                          </div>
                          <div className="mt-1 text-sm text-gray-600">
                            ₵{result.metadata.transactionAmount.toLocaleString()} {result.metadata.transactionType}
                          </div>
                          <div className="mt-1 text-xs text-gray-500">
                            {new Date(result.assessedAt).toLocaleString()} • {result.recommendations.length} recommendations
                          </div>
                        </div>
                        <button
                          onClick={() => setSelectedAssessment(result)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Risk Factor Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Risk Factors by Category</h4>
                <div className="space-y-2">
                  {Object.entries(
                    riskFactors.reduce((acc, factor) => {
                      acc[factor.category] = (acc[factor.category] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>)
                  ).map(([category, count]) => (
                    <div key={category} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 capitalize">{category}</span>
                      <span className="text-sm font-medium text-gray-900">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Active Mitigation Actions</h4>
                <div className="space-y-2">
                  {assessmentResults
                    .flatMap(result => result.mitigationActions)
                    .filter(action => action.status === 'in_progress' || action.status === 'pending')
                    .slice(0, 5)
                    .map(action => (
                      <div key={action.id} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{action.name}</span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          action.status === 'in_progress' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {action.status.replace('_', ' ')}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Assessments Tab */}
        {activeTab === 'assessments' && (
          <div>
            {/* Filters */}
            <div className="flex items-center space-x-4 mb-6">
              <select
                value={filterRiskLevel}
                onChange={(e) => setFilterRiskLevel(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Risk Levels</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="1h">Last Hour</option>
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="all">All Time</option>
              </select>
            </div>

            {/* Assessments List */}
            <div className="space-y-4">
              {filteredAssessments.map(assessment => (
                <div key={assessment.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <span className="font-medium text-gray-900">{assessment.userName}</span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRiskLevelColor(assessment.riskLevel)}`}>
                          {assessment.riskLevel}
                        </span>
                        <div className="flex items-center space-x-1">
                          <span className="text-sm font-medium text-gray-900">{assessment.overallScore}/100</span>
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                assessment.overallScore >= 70 ? 'bg-red-500' : 
                                assessment.overallScore >= 40 ? 'bg-yellow-500' : 'bg-green-500'
                              }`}
                              style={{ width: `${assessment.overallScore}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-2 text-sm text-gray-600">
                        ₵{assessment.metadata.transactionAmount.toLocaleString()} {assessment.metadata.transactionType}
                        • {assessment.metadata.geolocation}
                      </div>
                      
                      <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                        <span>{new Date(assessment.assessedAt).toLocaleString()}</span>
                        <span>{assessment.factors.length} factors analyzed</span>
                        <span>{assessment.recommendations.length} recommendations</span>
                        {assessment.mitigationActions.length > 0 && (
                          <span>{assessment.mitigationActions.length} mitigations</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setSelectedAssessment(assessment)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        View Details
                      </button>
                      {canManageRisk && (
                        <button
                          onClick={() => handleRunAssessment(assessment.workflowId)}
                          className="text-green-600 hover:text-green-800 text-sm"
                        >
                          Re-assess
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Risk Profiles Tab */}
        {activeTab === 'profiles' && (
          <div>
            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-900">User Risk Profiles</h3>
              <p className="text-sm text-gray-600">Historical risk analysis and behavioral patterns</p>
            </div>
            
            <div className="space-y-4">
              {riskProfiles.map(profile => {
                const trendIndicator = getTrendIndicator(profile.riskTrend);
                
                return (
                  <div key={profile.userId} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <span className="font-medium text-gray-900">{profile.userName}</span>
                          <div className="flex items-center space-x-1">
                            <span className="text-sm font-medium text-gray-900">Risk: {profile.currentRisk}/100</span>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${trendIndicator.bg} ${trendIndicator.color}`}>
                              {trendIndicator.icon} {profile.riskTrend}
                            </span>
                          </div>
                        </div>
                        
                        <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Avg Transaction:</span>
                            <div>₵{profile.behaviorPatterns.avgTransactionAmount.toLocaleString()}</div>
                          </div>
                          <div>
                            <span className="font-medium">Anomaly Rate:</span>
                            <div>{(profile.behaviorPatterns.anomalyFrequency * 100).toFixed(1)}%</div>
                          </div>
                          <div>
                            <span className="font-medium">Active Risks:</span>
                            <div>{profile.riskFactors.persistent.length + profile.riskFactors.temporary.length}</div>
                          </div>
                          <div>
                            <span className="font-medium">Assessments:</span>
                            <div>{profile.historicalScores.length}</div>
                          </div>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => setSelectedProfile(profile)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        View Profile
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Risk Factors Tab */}
        {activeTab === 'factors' && (
          <div>
            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-900">Risk Factors Configuration</h3>
              <p className="text-sm text-gray-600">Monitor and configure risk assessment parameters</p>
            </div>
            
            <div className="space-y-4">
              {riskFactors.map(factor => (
                <div key={factor.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <span className="font-medium text-gray-900">{factor.name}</span>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                          {factor.category}
                        </span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          factor.value >= factor.threshold.high ? 'bg-red-100 text-red-800' :
                          factor.value >= factor.threshold.medium ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {factor.value}/100
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 mt-1">{factor.description}</p>
                      
                      <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                        <span>Weight: {(factor.weight * 100).toFixed(0)}%</span>
                        <span>Source: {factor.dataSource}</span>
                        <span>Updated: {new Date(factor.lastUpdated).toLocaleDateString()}</span>
                      </div>
                      
                      <div className="mt-3">
                        <div className="flex items-center space-x-2 text-xs">
                          <span className="text-gray-600">Thresholds:</span>
                          <span className="text-green-600">Low: {factor.threshold.low}</span>
                          <span className="text-yellow-600">Medium: {factor.threshold.medium}</span>
                          <span className="text-red-600">High: {factor.threshold.high}</span>
                        </div>
                        <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              factor.value >= factor.threshold.high ? 'bg-red-500' :
                              factor.value >= factor.threshold.medium ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${factor.value}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Assessment Details Modal */}
      {selectedAssessment && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-4 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white mb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Risk Assessment Details</h3>
              <button
                onClick={() => setSelectedAssessment(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Assessment Summary */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">User</label>
                  <p className="text-sm text-gray-900">{selectedAssessment.userName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Overall Risk Score</label>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900">{selectedAssessment.overallScore}/100</span>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRiskLevelColor(selectedAssessment.riskLevel)}`}>
                      {selectedAssessment.riskLevel}
                    </span>
                  </div>
                </div>
              </div>

              {/* Risk Factors */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Risk Factor Analysis</h4>
                <div className="space-y-3">
                  {selectedAssessment.factors.map(factor => (
                    <div key={factor.factorId} className="border border-gray-200 rounded p-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900">{factor.factorName}</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">{factor.score}/100</span>
                          <span className="text-xs text-gray-500">({factor.contribution}% impact)</span>
                        </div>
                      </div>
                      {factor.evidence.length > 0 && (
                        <div className="mt-2">
                          <span className="text-xs font-medium text-gray-700">Evidence:</span>
                          <ul className="mt-1 text-xs text-gray-600 list-disc list-inside">
                            {factor.evidence.map((evidence, index) => (
                              <li key={index}>{evidence}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendations */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Recommendations</h4>
                <div className="space-y-3">
                  {selectedAssessment.recommendations.map(rec => (
                    <div key={rec.id} className="border border-gray-200 rounded p-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900">{rec.title}</span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(rec.priority)}`}>
                          {rec.priority}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{rec.description}</p>
                      <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                        <span>Impact: -{rec.estimatedImpact}% risk</span>
                        <span>Cost: {rec.implementationCost}</span>
                        <span>Timeframe: {rec.timeframe}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mitigation Actions */}
              {selectedAssessment.mitigationActions.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Mitigation Actions</h4>
                  <div className="space-y-3">
                    {selectedAssessment.mitigationActions.map(action => (
                      <div key={action.id} className="border border-gray-200 rounded p-3">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-900">{action.name}</span>
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              action.status === 'completed' ? 'bg-green-100 text-green-800' :
                              action.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                              action.status === 'failed' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {action.status.replace('_', ' ')}
                            </span>
                            {canManageRisk && action.status === 'pending' && (
                              <button
                                onClick={() => handleExecuteMitigation(action.id)}
                                className="text-blue-600 hover:text-blue-800 text-xs"
                              >
                                Execute
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{action.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};