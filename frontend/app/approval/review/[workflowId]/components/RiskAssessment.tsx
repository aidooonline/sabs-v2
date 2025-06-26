'use client';

import React, { useState } from 'react';
import type { ApprovalWorkflow, WorkflowPermissions, RiskAssessment as RiskAssessmentType, RiskLevel } from '../../../../../types/approval';
import { getRiskLevelLabel, getRiskLevelColor } from '../../../../../utils/approvalHelpers';

interface RiskAssessmentProps {
  workflow: ApprovalWorkflow;
  permissions?: WorkflowPermissions;
  refreshKey: number;
}

export const RiskAssessment: React.FC<RiskAssessmentProps> = ({
  workflow,
  permissions,
  refreshKey
}) => {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const riskAssessment = workflow.riskAssessment;

  const getRiskScoreColor = (score: number): string => {
    if (score >= 80) return 'text-red-600 bg-red-50 border-red-200';
    if (score >= 60) return 'text-orange-600 bg-orange-50 border-orange-200';
    if (score >= 40) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-green-600 bg-green-50 border-green-200';
  };

  const getRiskIcon = (level: RiskLevel) => {
    switch (level) {
      case 'critical':
        return (
          <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.098 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'high':
        return (
          <svg className="h-5 w-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'medium':
        return (
          <svg className="h-5 w-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const getComplianceIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return (
          <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'failed':
        return (
          <svg className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="h-4 w-4 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.098 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      default:
        return (
          <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const riskFactorsByLevel = riskAssessment.riskFactors.reduce((acc, factor) => {
    if (!acc[factor.severity]) acc[factor.severity] = [];
    acc[factor.severity].push(factor);
    return acc;
  }, {} as Record<string, typeof riskAssessment.riskFactors>);

  const complianceChecksByStatus = riskAssessment.complianceChecks.reduce((acc, check) => {
    if (!acc[check.status]) acc[check.status] = [];
    acc[check.status].push(check);
    return acc;
  }, {} as Record<string, typeof riskAssessment.complianceChecks>);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Risk Assessment</h3>
          <p className="text-sm text-gray-500 mt-1">
            Comprehensive risk analysis and fraud detection
          </p>
        </div>
        
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          <svg className="-ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {showDetails ? 'Hide Details' : 'Show Details'}
        </button>
      </div>

      {/* Overall Risk Summary */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            {getRiskIcon(riskAssessment.overallRisk)}
            <div>
              <h4 className="text-lg font-medium text-gray-900">
                {getRiskLevelLabel(riskAssessment.overallRisk)}
              </h4>
              <p className="text-sm text-gray-500">Overall Risk Level</p>
            </div>
          </div>
          
          <div className="text-right">
            <div className={`inline-flex items-center px-4 py-2 rounded-lg border ${getRiskScoreColor(riskAssessment.riskScore)}`}>
              <span className="text-2xl font-bold">{riskAssessment.riskScore}</span>
              <span className="text-sm ml-1">/100</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Risk Score</p>
          </div>
        </div>

        {/* Risk Score Breakdown Bar */}
        <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
          <div 
            className={`h-3 rounded-full transition-all duration-500 ${
              riskAssessment.riskScore >= 80 ? 'bg-red-500' :
              riskAssessment.riskScore >= 60 ? 'bg-orange-500' :
              riskAssessment.riskScore >= 40 ? 'bg-yellow-500' : 'bg-green-500'
            }`}
            style={{ width: `${riskAssessment.riskScore}%` }}
          />
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <p className="text-xl font-bold text-red-600">{riskAssessment.fraudIndicators.length}</p>
            <p className="text-sm text-red-700">Fraud Indicators</p>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded-lg">
            <p className="text-xl font-bold text-yellow-600">{riskAssessment.riskFactors.length}</p>
            <p className="text-sm text-yellow-700">Risk Factors</p>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <p className="text-xl font-bold text-blue-600">{riskAssessment.complianceChecks.length}</p>
            <p className="text-sm text-blue-700">Compliance Checks</p>
          </div>
        </div>
      </div>

      {/* Fraud Indicators */}
      {riskAssessment.fraudIndicators.length > 0 && (
        <div className="bg-white border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2 mb-4">
            <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.098 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h4 className="text-md font-medium text-red-800">Fraud Indicators ({riskAssessment.fraudIndicators.length})</h4>
          </div>
          
          <div className="space-y-3">
            {riskAssessment.fraudIndicators.map((indicator, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex-shrink-0 mt-1">
                  {getRiskIcon(indicator.severity)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h5 className="text-sm font-medium text-red-800">{indicator.indicator}</h5>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRiskLevelColor(indicator.severity)}`}>
                      {getRiskLevelLabel(indicator.severity)}
                    </span>
                  </div>
                  <p className="text-sm text-red-700 mt-1">{indicator.description}</p>
                  <div className="mt-2 p-2 bg-red-100 rounded border-l-4 border-red-400">
                    <p className="text-sm text-red-800 font-medium">Recommendation:</p>
                    <p className="text-sm text-red-700">{indicator.recommendation}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Risk Factors */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <button
          onClick={() => setExpandedSection(expandedSection === 'risk-factors' ? null : 'risk-factors')}
          className="w-full flex items-center justify-between p-2 text-left"
        >
          <h4 className="text-md font-medium text-gray-900">Risk Factors ({riskAssessment.riskFactors.length})</h4>
          <svg 
            className={`w-5 h-5 text-gray-500 transition-transform ${expandedSection === 'risk-factors' ? 'rotate-180' : ''}`}
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {expandedSection === 'risk-factors' && (
          <div className="mt-4 space-y-4">
            {Object.entries(riskFactorsByLevel).map(([level, factors]) => (
              <div key={level} className="space-y-2">
                <h5 className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                  {getRiskIcon(level as RiskLevel)}
                  <span>{getRiskLevelLabel(level as RiskLevel)} ({factors.length})</span>
                </h5>
                <div className="grid gap-2">
                  {factors.map((factor, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{factor.factor}</p>
                        <p className="text-sm text-gray-600">{factor.description}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-medium text-gray-900">Weight: {factor.weight}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Compliance Checks */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <button
          onClick={() => setExpandedSection(expandedSection === 'compliance' ? null : 'compliance')}
          className="w-full flex items-center justify-between p-2 text-left"
        >
          <h4 className="text-md font-medium text-gray-900">Compliance Checks ({riskAssessment.complianceChecks.length})</h4>
          <svg 
            className={`w-5 h-5 text-gray-500 transition-transform ${expandedSection === 'compliance' ? 'rotate-180' : ''}`}
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {expandedSection === 'compliance' && (
          <div className="mt-4 space-y-4">
            {Object.entries(complianceChecksByStatus).map(([status, checks]) => (
              <div key={status} className="space-y-2">
                <h5 className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                  {getComplianceIcon(status)}
                  <span className="capitalize">{status} ({checks.length})</span>
                </h5>
                <div className="grid gap-2">
                  {checks.map((check, index) => (
                    <div key={index} className={`p-3 rounded-lg border ${
                      check.status === 'passed' ? 'bg-green-50 border-green-200' :
                      check.status === 'failed' ? 'bg-red-50 border-red-200' :
                      check.status === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                      'bg-gray-50 border-gray-200'
                    }`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{check.checkName}</p>
                          <p className="text-sm text-gray-600">{check.details}</p>
                          {check.regulatoryRequirement && (
                            <p className="text-xs text-gray-500 mt-1">
                              Regulatory: {check.regulatoryRequirement}
                            </p>
                          )}
                        </div>
                        <div className="flex-shrink-0 ml-4">
                          {getComplianceIcon(check.status)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recommendations */}
      {riskAssessment.recommendations.length > 0 && (
        <div className="bg-white border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-4">
            <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <h4 className="text-md font-medium text-blue-800">Recommendations ({riskAssessment.recommendations.length})</h4>
          </div>
          
          <div className="space-y-2">
            {riskAssessment.recommendations.map((recommendation, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex-shrink-0 mt-1">
                  <svg className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-sm text-blue-800">{recommendation}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {showDetails && (
        <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h5 className="text-sm font-medium text-gray-900 mb-3">Risk Assessment Details</h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Assessment Method:</span>
              <span className="ml-2 font-medium">ML-Based Risk Scoring</span>
            </div>
            <div>
              <span className="text-gray-500">Last Updated:</span>
              <span className="ml-2 font-medium">Real-time</span>
            </div>
            <div>
              <span className="text-gray-500">Risk Model Version:</span>
              <span className="ml-2 font-medium">v2.1.3</span>
            </div>
            <div>
              <span className="text-gray-500">Confidence Level:</span>
              <span className="ml-2 font-medium">
                {riskAssessment.riskScore >= 80 ? 'High' : 
                 riskAssessment.riskScore >= 60 ? 'Medium' : 'Low'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};