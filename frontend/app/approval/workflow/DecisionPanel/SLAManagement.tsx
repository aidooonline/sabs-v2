'use client';

import React, { useState, useEffect } from 'react';
import type { ApprovalWorkflow, SLAMetrics, WorkflowPermissions } from '../../../../types/approval';

interface SLAManagementProps {
  workflow: ApprovalWorkflow;
  permissions?: WorkflowPermissions;
  onSLAUpdate: (slaData: SLAUpdateData) => Promise<void>;
  isLoading?: boolean;
}

export interface SLAUpdateData {
  workflowId: string;
  extensionType: 'deadline' | 'stage_timeout' | 'escalation_delay';
  extensionReason: string;
  newDeadline?: string;
  additionalHours: number;
  approverOverride: boolean;
  businessJustification: string;
  impactAssessment: string;
  stakeholderNotification: boolean;
  notificationRecipients: string[];
  priorityAdjustment?: 'increase' | 'decrease' | 'maintain';
  escalationOverride?: boolean;
}

interface SLABreachAlert {
  id: string;
  type: 'warning' | 'breach' | 'critical';
  message: string;
  timeRemaining: number;
  actionRequired: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export const SLAManagement: React.FC<SLAManagementProps> = ({
  workflow,
  permissions,
  onSLAUpdate,
  isLoading = false
}) => {
  const [showExtensionModal, setShowExtensionModal] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [slaAlerts, setSlaAlerts] = useState<SLABreachAlert[]>([]);
  const [extensionData, setExtensionData] = useState<SLAUpdateData>({
    workflowId: workflow.id,
    extensionType: 'deadline',
    extensionReason: '',
    additionalHours: 4,
    approverOverride: false,
    businessJustification: '',
    impactAssessment: '',
    stakeholderNotification: true,
    notificationRecipients: [],
    priorityAdjustment: 'maintain'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [recipientInput, setRecipientInput] = useState('');

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // Calculate SLA metrics
  const calculateSLAMetrics = () => {
    const sla = workflow.slaMetrics;
    const now = currentTime;
    const targetTime = new Date(sla.targetCompletionTime);
    const createdTime = new Date(sla.createdAt);
    
    const totalSLATime = targetTime.getTime() - createdTime.getTime();
    const elapsedTime = now.getTime() - createdTime.getTime();
    const remainingTime = targetTime.getTime() - now.getTime();
    
    const progressPercentage = Math.min(100, Math.max(0, (elapsedTime / totalSLATime) * 100));
    const isOverdue = remainingTime < 0;
    const timeToTarget = Math.abs(remainingTime);
    
    const hoursRemaining = Math.floor(timeToTarget / (1000 * 60 * 60));
    const minutesRemaining = Math.floor((timeToTarget % (1000 * 60 * 60)) / (1000 * 60));
    
    return {
      progressPercentage,
      isOverdue,
      hoursRemaining,
      minutesRemaining,
      slaStatus: sla.slaStatus,
      totalSLAHours: Math.floor(totalSLATime / (1000 * 60 * 60)),
      elapsedHours: Math.floor(elapsedTime / (1000 * 60 * 60))
    };
  };

  const metrics = calculateSLAMetrics();

  // Generate SLA alerts
  useEffect(() => {
    const alerts: SLABreachAlert[] = [];
    
    if (metrics.isOverdue) {
      alerts.push({
        id: 'overdue',
        type: 'breach',
        message: `Workflow is ${metrics.hoursRemaining}h ${metrics.minutesRemaining}m overdue`,
        timeRemaining: -(metrics.hoursRemaining * 60 + metrics.minutesRemaining),
        actionRequired: 'Immediate action required - SLA breach',
        severity: 'critical'
      });
    } else if (metrics.progressPercentage > 90) {
      alerts.push({
        id: 'critical-warning',
        type: 'critical',
        message: `Only ${metrics.hoursRemaining}h ${metrics.minutesRemaining}m remaining`,
        timeRemaining: metrics.hoursRemaining * 60 + metrics.minutesRemaining,
        actionRequired: 'Urgent processing needed',
        severity: 'high'
      });
    } else if (metrics.progressPercentage > 75) {
      alerts.push({
        id: 'warning',
        type: 'warning',
        message: `${metrics.hoursRemaining}h ${metrics.minutesRemaining}m until deadline`,
        timeRemaining: metrics.hoursRemaining * 60 + metrics.minutesRemaining,
        actionRequired: 'Consider prioritizing this workflow',
        severity: 'medium'
      });
    }

    // Check for stage-specific timeouts
    workflow.slaMetrics.escalationTriggers.forEach((trigger, index) => {
      if (!trigger.triggeredAt) {
        alerts.push({
          id: `escalation-${index}`,
          type: 'warning',
          message: `Escalation condition: ${trigger.condition}`,
          timeRemaining: 0,
          actionRequired: `${trigger.action} to ${trigger.targetRole}`,
          severity: 'medium'
        });
      }
    });

    setSlaAlerts(alerts);
  }, [currentTime, workflow, metrics]);

  const canManageSLA = () => {
    return permissions?.canEscalate || permissions?.canOverride;
  };

  const getSLAStatusColor = () => {
    switch (metrics.slaStatus) {
      case 'on_track':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'at_risk':
        return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'breached':
        return 'text-red-700 bg-red-50 border-red-200';
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const getProgressBarColor = () => {
    if (metrics.isOverdue) return 'bg-red-500';
    if (metrics.progressPercentage > 90) return 'bg-red-400';
    if (metrics.progressPercentage > 75) return 'bg-yellow-400';
    return 'bg-green-500';
  };

  const handleInputChange = (field: keyof SLAUpdateData, value: any) => {
    setExtensionData(prev => ({
      ...prev,
      [field]: value
    }));

    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const addRecipient = () => {
    if (recipientInput.trim() && !extensionData.notificationRecipients.includes(recipientInput.trim())) {
      handleInputChange('notificationRecipients', [...extensionData.notificationRecipients, recipientInput.trim()]);
      setRecipientInput('');
    }
  };

  const removeRecipient = (index: number) => {
    const newRecipients = extensionData.notificationRecipients.filter((_, i) => i !== index);
    handleInputChange('notificationRecipients', newRecipients);
  };

  const validateExtension = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!extensionData.extensionReason.trim() || extensionData.extensionReason.length < 50) {
      newErrors.extensionReason = 'Extension reason must be at least 50 characters';
    }

    if (!extensionData.businessJustification.trim() || extensionData.businessJustification.length < 75) {
      newErrors.businessJustification = 'Business justification must be at least 75 characters';
    }

    if (!extensionData.impactAssessment.trim() || extensionData.impactAssessment.length < 50) {
      newErrors.impactAssessment = 'Impact assessment must be at least 50 characters';
    }

    if (extensionData.additionalHours < 1 || extensionData.additionalHours > 168) {
      newErrors.additionalHours = 'Additional hours must be between 1 and 168 (1 week)';
    }

    if (extensionData.stakeholderNotification && extensionData.notificationRecipients.length === 0) {
      newErrors.notificationRecipients = 'At least one notification recipient is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleExtensionSubmit = async () => {
    if (validateExtension()) {
      try {
        await onSLAUpdate(extensionData);
        setShowExtensionModal(false);
        // Reset form
        setExtensionData({
          workflowId: workflow.id,
          extensionType: 'deadline',
          extensionReason: '',
          additionalHours: 4,
          approverOverride: false,
          businessJustification: '',
          impactAssessment: '',
          stakeholderNotification: true,
          notificationRecipients: [],
          priorityAdjustment: 'maintain'
        });
      } catch (error) {
        console.error('SLA extension failed:', error);
      }
    }
  };

  const extensionTypes = [
    {
      value: 'deadline',
      label: 'Deadline Extension',
      description: 'Extend the overall workflow deadline',
      icon: '⏰'
    },
    {
      value: 'stage_timeout',
      label: 'Stage Timeout Extension',
      description: 'Extend timeout for current approval stage',
      icon: '🔄'
    },
    {
      value: 'escalation_delay',
      label: 'Escalation Delay',
      description: 'Delay automatic escalation triggers',
      icon: '⚡'
    }
  ];

  const priorityOptions = [
    { value: 'increase', label: 'Increase Priority', description: 'Due to extension impact' },
    { value: 'maintain', label: 'Maintain Priority', description: 'No priority change needed' },
    { value: 'decrease', label: 'Decrease Priority', description: 'Lower urgency after extension' }
  ];

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h4 className="text-lg font-medium text-gray-900">SLA Management</h4>
            <p className="text-sm text-gray-600 mt-1">
              Track deadlines and manage workflow SLA compliance
            </p>
          </div>
          
          {canManageSLA() && (
            <button
              onClick={() => setShowExtensionModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Manage SLA</span>
            </button>
          )}
        </div>

        {/* SLA Alerts */}
        {slaAlerts.length > 0 && (
          <div className="mb-6 space-y-2">
            {slaAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-3 rounded-lg border ${
                  alert.type === 'breach' ? 'bg-red-50 border-red-200' :
                  alert.type === 'critical' ? 'bg-orange-50 border-orange-200' :
                  'bg-yellow-50 border-yellow-200'
                }`}
              >
                <div className="flex items-start">
                  <div className={`flex-shrink-0 ${
                    alert.type === 'breach' ? 'text-red-600' :
                    alert.type === 'critical' ? 'text-orange-600' :
                    'text-yellow-600'
                  }`}>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h4 className={`text-sm font-medium ${
                      alert.type === 'breach' ? 'text-red-800' :
                      alert.type === 'critical' ? 'text-orange-800' :
                      'text-yellow-800'
                    }`}>
                      {alert.message}
                    </h4>
                    <p className={`text-sm ${
                      alert.type === 'breach' ? 'text-red-700' :
                      alert.type === 'critical' ? 'text-orange-700' :
                      'text-yellow-700'
                    }`}>
                      {alert.actionRequired}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* SLA Progress */}
        <div className="space-y-4">
          {/* Status Badge */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getSLAStatusColor()}`}>
                {metrics.slaStatus.replace('_', ' ').toUpperCase()}
              </span>
              <span className="text-sm text-gray-600">
                Workflow #{workflow.workflowNumber}
              </span>
            </div>
            
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">
                {metrics.isOverdue ? 'OVERDUE' : 'TIME REMAINING'}
              </p>
              <p className={`text-lg font-semibold ${metrics.isOverdue ? 'text-red-600' : 'text-blue-600'}`}>
                {metrics.hoursRemaining}h {metrics.minutesRemaining}m
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">SLA Progress</span>
              <span className="text-sm text-gray-600">
                {Math.round(metrics.progressPercentage)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor()}`}
                style={{ width: `${Math.min(100, metrics.progressPercentage)}%` }}
              />
            </div>
          </div>

          {/* Timeline Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Created</p>
              <p className="text-sm font-medium text-gray-900 mt-1">
                {new Date(workflow.slaMetrics.createdAt).toLocaleString()}
              </p>
            </div>
            
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Target Completion</p>
              <p className="text-sm font-medium text-gray-900 mt-1">
                {new Date(workflow.slaMetrics.targetCompletionTime).toLocaleString()}
              </p>
            </div>
            
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Total SLA Time</p>
              <p className="text-sm font-medium text-gray-900 mt-1">
                {metrics.totalSLAHours}h ({Math.round(metrics.totalSLAHours / 24 * 10) / 10} days)
              </p>
            </div>
          </div>

          {/* Stage Time Tracking */}
          <div className="pt-4 border-t border-gray-200">
            <h5 className="text-sm font-medium text-gray-900 mb-3">Current Stage Progress</h5>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  Stage: <span className="font-medium">{workflow.currentStage.replace('_', ' ')}</span>
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Time in stage: {Math.floor(workflow.slaMetrics.timeInCurrentStage / 60)}h {workflow.slaMetrics.timeInCurrentStage % 60}m
                </p>
              </div>
              
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  Total Processing Time
                </p>
                <p className="text-sm text-gray-600">
                  {Math.floor(workflow.slaMetrics.totalProcessingTime / 60)}h {workflow.slaMetrics.totalProcessingTime % 60}m
                </p>
              </div>
            </div>
          </div>

          {/* Escalation Triggers */}
          {workflow.slaMetrics.escalationTriggers.length > 0 && (
            <div className="pt-4 border-t border-gray-200">
              <h5 className="text-sm font-medium text-gray-900 mb-3">Escalation Triggers</h5>
              <div className="space-y-2">
                {workflow.slaMetrics.escalationTriggers.map((trigger, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div>
                      <p className="text-sm text-gray-900">{trigger.condition}</p>
                      <p className="text-xs text-gray-500">
                        Action: {trigger.action} to {trigger.targetRole}
                      </p>
                    </div>
                    <div className="text-right">
                      {trigger.triggeredAt ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          Triggered
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Active
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SLA Extension Modal */}
      {showExtensionModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-8 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900">
                SLA Extension Request
              </h3>
              <button
                onClick={() => setShowExtensionModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              {/* Extension Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Extension Type <span className="text-red-500">*</span>
                </label>
                <div className="space-y-3">
                  {extensionTypes.map((type) => (
                    <div
                      key={type.value}
                      onClick={() => handleInputChange('extensionType', type.value)}
                      className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                        extensionData.extensionType === type.value
                          ? 'border-blue-300 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-xl">{type.icon}</span>
                        <div>
                          <h4 className="font-medium text-gray-900">{type.label}</h4>
                          <p className="text-sm text-gray-600">{type.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Extension Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Hours <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="168"
                    value={extensionData.additionalHours}
                    onChange={(e) => handleInputChange('additionalHours', parseInt(e.target.value))}
                    className={`block w-full border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                      errors.additionalHours ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.additionalHours && (
                    <span className="text-xs text-red-500">{errors.additionalHours}</span>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority Adjustment
                  </label>
                  <select
                    value={extensionData.priorityAdjustment}
                    onChange={(e) => handleInputChange('priorityAdjustment', e.target.value)}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  >
                    {priorityOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Reason and Justification */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Extension Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={extensionData.extensionReason}
                  onChange={(e) => handleInputChange('extensionReason', e.target.value)}
                  rows={3}
                  className={`block w-full border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                    errors.extensionReason ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Provide detailed reason for SLA extension (minimum 50 characters)..."
                />
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-gray-500">
                    {extensionData.extensionReason.length} / 50 minimum characters
                  </span>
                  {errors.extensionReason && (
                    <span className="text-xs text-red-500">{errors.extensionReason}</span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Justification <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={extensionData.businessJustification}
                  onChange={(e) => handleInputChange('businessJustification', e.target.value)}
                  rows={3}
                  className={`block w-full border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                    errors.businessJustification ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Provide business justification for the extension (minimum 75 characters)..."
                />
                {errors.businessJustification && (
                  <span className="text-xs text-red-500">{errors.businessJustification}</span>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Impact Assessment <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={extensionData.impactAssessment}
                  onChange={(e) => handleInputChange('impactAssessment', e.target.value)}
                  rows={3}
                  className={`block w-full border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                    errors.impactAssessment ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Assess the impact of this extension on business operations..."
                />
                {errors.impactAssessment && (
                  <span className="text-xs text-red-500">{errors.impactAssessment}</span>
                )}
              </div>

              {/* Notification Settings */}
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <input
                    type="checkbox"
                    id="stakeholder-notification"
                    checked={extensionData.stakeholderNotification}
                    onChange={(e) => handleInputChange('stakeholderNotification', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="stakeholder-notification" className="text-sm font-medium text-gray-700">
                    Notify Stakeholders
                  </label>
                </div>

                {extensionData.stakeholderNotification && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notification Recipients <span className="text-red-500">*</span>
                    </label>
                    
                    {extensionData.notificationRecipients.length > 0 && (
                      <div className="space-y-2 mb-3">
                        {extensionData.notificationRecipients.map((recipient, index) => (
                          <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded border">
                            <span className="text-sm text-gray-700">{recipient}</span>
                            <button
                              onClick={() => removeRecipient(index)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex space-x-2">
                      <input
                        type="email"
                        value={recipientInput}
                        onChange={(e) => setRecipientInput(e.target.value)}
                        className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Email address..."
                        onKeyPress={(e) => e.key === 'Enter' && addRecipient()}
                      />
                      <button
                        onClick={addRecipient}
                        disabled={!recipientInput.trim()}
                        className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                      >
                        Add
                      </button>
                    </div>
                    {errors.notificationRecipients && (
                      <span className="text-xs text-red-500">{errors.notificationRecipients}</span>
                    )}
                  </div>
                )}
              </div>

              {/* Override Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="approver-override"
                    checked={extensionData.approverOverride}
                    onChange={(e) => handleInputChange('approverOverride', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="approver-override" className="text-sm text-gray-700">
                    Require Approver Override
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="escalation-override"
                    checked={extensionData.escalationOverride}
                    onChange={(e) => handleInputChange('escalationOverride', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="escalation-override" className="text-sm text-gray-700">
                    Override Escalation Triggers
                  </label>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end space-x-3 mt-8 pt-4 border-t border-gray-200">
              <button
                onClick={() => setShowExtensionModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              
              <button
                onClick={handleExtensionSubmit}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? 'Processing...' : 'Submit Extension Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};