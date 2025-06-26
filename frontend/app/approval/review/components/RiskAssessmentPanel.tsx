'use client';

import { ApprovalWorkflow } from '../../../../types/approval';

interface RiskAssessmentPanelProps {
  workflow: ApprovalWorkflow;
  customer: any;
  transactionHistory: any[];
}

export const RiskAssessmentPanel = ({ workflow, customer, transactionHistory }: RiskAssessmentPanelProps) => {
  const riskAssessment = workflow.riskAssessment;

  return (
    <div className="p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Risk Assessment</h3>
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 mb-6">
        <div className="text-center p-4 border rounded-lg">
          <dt className="text-sm font-medium text-gray-500">Overall Risk</dt>
          <dd className="mt-1">
            <span className={`inline-flex px-3 py-1 text-lg font-semibold rounded-full ${
              riskAssessment?.overallRisk === 'low' ? 'bg-green-100 text-green-800' :
              riskAssessment?.overallRisk === 'medium' ? 'bg-yellow-100 text-yellow-800' :
              riskAssessment?.overallRisk === 'high' ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {riskAssessment?.overallRisk?.toUpperCase() || 'LOW'}
            </span>
          </dd>
        </div>
        
        <div className="text-center p-4 border rounded-lg">
          <dt className="text-sm font-medium text-gray-500">Risk Score</dt>
          <dd className="mt-1 text-2xl font-bold text-gray-900">
            {riskAssessment?.riskScore || 25}/100
          </dd>
        </div>
        
        <div className="text-center p-4 border rounded-lg">
          <dt className="text-sm font-medium text-gray-500">Compliance Flags</dt>
          <dd className="mt-1 text-2xl font-bold text-gray-900">
            {workflow.complianceFlags?.length || 0}
          </dd>
        </div>
      </div>

      {riskAssessment?.riskFactors && riskAssessment.riskFactors.length > 0 && (
        <div className="mb-6">
          <h4 className="text-md font-medium text-gray-900 mb-3">Risk Factors</h4>
          <div className="space-y-2">
            {riskAssessment.riskFactors.map((factor, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-900">{factor.factor}</span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  factor.severity === 'low' ? 'bg-green-100 text-green-800' :
                  factor.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {factor.severity}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {riskAssessment?.recommendations && riskAssessment.recommendations.length > 0 && (
        <div>
          <h4 className="text-md font-medium text-gray-900 mb-3">Recommendations</h4>
          <ul className="space-y-2">
            {riskAssessment.recommendations.map((recommendation, index) => (
              <li key={index} className="text-sm text-gray-700 flex items-start">
                <svg className="h-4 w-4 text-blue-500 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                {recommendation}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};