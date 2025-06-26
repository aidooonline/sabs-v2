'use client';

import React, { useState } from 'react';
import { 
  Calendar,
  Clock,
  Play,
  Pause,
  Trash2,
  Edit3,
  Plus,
  Mail,
  Settings,
  CheckCircle,
  AlertCircle,
  Timer,
  User,
  X
} from 'lucide-react';
import { formatDate } from '../../utils/formatters';
import type { ScheduledReport } from '../../types/reports';

interface ScheduledReportManagerProps {
  scheduledReports: ScheduledReport[];
  onSchedule: (reportId: string, schedule: any) => void;
  onDelete: (mutation: any) => void;
}

export function ScheduledReportManager({ 
  scheduledReports, 
  onSchedule, 
  onDelete 
}: ScheduledReportManagerProps) {
  const [showNewScheduleModal, setShowNewScheduleModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ScheduledReport | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    reportType: 'customer_analytics',
    scheduleType: 'daily',
    hour: 9,
    minute: 0,
    dayOfWeek: 1,
    dayOfMonth: 1,
    timezone: 'Africa/Accra',
    recipients: [''],
    active: true
  });

  const handleAddRecipient = () => {
    setFormData(prev => ({
      ...prev,
      recipients: [...prev.recipients, '']
    }));
  };

  const handleRemoveRecipient = (index: number) => {
    setFormData(prev => ({
      ...prev,
      recipients: prev.recipients.filter((_, i) => i !== index)
    }));
  };

  const handleRecipientChange = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      recipients: prev.recipients.map((email, i) => i === index ? value : email)
    }));
  };

  const handleScheduleSubmit = () => {
    const schedule = {
      type: formData.scheduleType,
      hour: formData.hour,
      minute: formData.minute,
      timezone: formData.timezone,
      ...(formData.scheduleType === 'weekly' && { dayOfWeek: formData.dayOfWeek }),
      ...(formData.scheduleType === 'monthly' && { dayOfMonth: formData.dayOfMonth })
    };

    onSchedule('temp-report-id', {
      name: formData.name,
      schedule,
      recipients: formData.recipients.filter(email => email.trim()),
      active: formData.active
    });

    setShowNewScheduleModal(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      reportType: 'customer_analytics',
      scheduleType: 'daily',
      hour: 9,
      minute: 0,
      dayOfWeek: 1,
      dayOfMonth: 1,
      timezone: 'Africa/Accra',
      recipients: [''],
      active: true
    });
    setEditingSchedule(null);
  };

  const getScheduleDescription = (schedule: ScheduledReport['schedule']) => {
    const time = `${schedule.hour.toString().padStart(2, '0')}:${schedule.minute.toString().padStart(2, '0')}`;
    
    switch (schedule.type) {
      case 'daily':
        return `Daily at ${time}`;
      case 'weekly':
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return `Weekly on ${dayNames[schedule.dayOfWeek || 1]} at ${time}`;
      case 'monthly':
        return `Monthly on day ${schedule.dayOfMonth} at ${time}`;
      case 'quarterly':
        return `Quarterly at ${time}`;
      default:
        return 'Custom schedule';
    }
  };

  const getNextRunStatus = (nextRun: string) => {
    const nextRunDate = new Date(nextRun);
    const now = new Date();
    const diffHours = Math.floor((nextRunDate.getTime() - now.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 0) return 'Overdue';
    if (diffHours < 1) return 'Within 1 hour';
    if (diffHours < 24) return `In ${diffHours} hours`;
    return `In ${Math.floor(diffHours / 24)} days`;
  };

  return (
    <div className="scheduled-report-manager">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Scheduled Reports</h3>
          <p className="text-sm text-gray-600">
            Manage automated report generation and delivery schedules
          </p>
        </div>
        <button
          onClick={() => setShowNewScheduleModal(true)}
          className="btn-primary"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Schedule
        </button>
      </div>

      {/* Scheduled Reports List */}
      <div className="bg-white rounded-lg border border-gray-200">
        {scheduledReports.length === 0 ? (
          <div className="p-8 text-center">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">No Scheduled Reports</h4>
            <p className="text-gray-600 mb-4">
              Set up automated report generation to receive regular insights
            </p>
            <button
              onClick={() => setShowNewScheduleModal(true)}
              className="btn-primary"
            >
              Create First Schedule
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {scheduledReports.map((scheduledReport) => (
              <div key={scheduledReport.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      scheduledReport.active ? 'bg-green-100' : 'bg-gray-100'
                    }`}>
                      {scheduledReport.active ? (
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      ) : (
                        <Pause className="w-6 h-6 text-gray-500" />
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="text-lg font-medium text-gray-900">
                          {scheduledReport.name}
                        </h4>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          scheduledReport.active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {scheduledReport.active ? 'Active' : 'Paused'}
                        </span>
                      </div>

                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>{getScheduleDescription(scheduledReport.schedule)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Timer className="w-4 h-4" />
                            <span>Next: {getNextRunStatus(scheduledReport.nextRun)}</span>
                          </div>
                        </div>

                        {scheduledReport.recipients.length > 0 && (
                          <div className="flex items-center space-x-1">
                            <Mail className="w-4 h-4" />
                            <span>{scheduledReport.recipients.length} recipient(s)</span>
                          </div>
                        )}

                        {scheduledReport.lastRun && (
                          <div className="flex items-center space-x-1">
                            <User className="w-4 h-4" />
                            <span>
                              Last run: {formatDate(scheduledReport.lastRun)} 
                              {scheduledReport.lastStatus && (
                                <span className={`ml-2 ${
                                  scheduledReport.lastStatus === 'success' 
                                    ? 'text-green-600' 
                                    : 'text-red-600'
                                }`}>
                                  ({scheduledReport.lastStatus})
                                </span>
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                      {scheduledReport.active ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </button>
                    <button 
                      onClick={() => onDelete(scheduledReport.id)}
                      className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Schedule Modal */}
      {showNewScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Create Scheduled Report</h3>
              <button
                onClick={() => {
                  setShowNewScheduleModal(false);
                  resetForm();
                }}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Schedule Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Weekly Customer Analytics Report"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Report Type
                  </label>
                  <select
                    value={formData.reportType}
                    onChange={(e) => setFormData(prev => ({ ...prev, reportType: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="customer_analytics">Customer Analytics</option>
                    <option value="transaction_summary">Transaction Summary</option>
                    <option value="financial_performance">Financial Performance</option>
                    <option value="compliance_report">Compliance Report</option>
                    <option value="risk_assessment">Risk Assessment</option>
                  </select>
                </div>
              </div>

              {/* Schedule Configuration */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-900">Schedule Configuration</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Frequency
                    </label>
                    <select
                      value={formData.scheduleType}
                      onChange={(e) => setFormData(prev => ({ ...prev, scheduleType: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hour
                    </label>
                    <select
                      value={formData.hour}
                      onChange={(e) => setFormData(prev => ({ ...prev, hour: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      {Array.from({ length: 24 }, (_, i) => (
                        <option key={i} value={i}>
                          {i.toString().padStart(2, '0')}:00
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Timezone
                    </label>
                    <select
                      value={formData.timezone}
                      onChange={(e) => setFormData(prev => ({ ...prev, timezone: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="Africa/Accra">Ghana (GMT)</option>
                      <option value="UTC">UTC</option>
                      <option value="America/New_York">Eastern Time</option>
                      <option value="Europe/London">London Time</option>
                    </select>
                  </div>
                </div>

                {formData.scheduleType === 'weekly' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Day of Week
                    </label>
                    <select
                      value={formData.dayOfWeek}
                      onChange={(e) => setFormData(prev => ({ ...prev, dayOfWeek: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value={1}>Monday</option>
                      <option value={2}>Tuesday</option>
                      <option value={3}>Wednesday</option>
                      <option value={4}>Thursday</option>
                      <option value={5}>Friday</option>
                      <option value={6}>Saturday</option>
                      <option value={0}>Sunday</option>
                    </select>
                  </div>
                )}

                {formData.scheduleType === 'monthly' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Day of Month
                    </label>
                    <select
                      value={formData.dayOfMonth}
                      onChange={(e) => setFormData(prev => ({ ...prev, dayOfMonth: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      {Array.from({ length: 28 }, (_, i) => (
                        <option key={i + 1} value={i + 1}>
                          Day {i + 1}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Recipients */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-900">Email Recipients</h4>
                  <button
                    onClick={handleAddRecipient}
                    className="btn-secondary"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </button>
                </div>

                <div className="space-y-2">
                  {formData.recipients.map((email, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => handleRecipientChange(index, e.target.value)}
                        placeholder="email@example.com"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                      {formData.recipients.length > 1 && (
                        <button
                          onClick={() => handleRemoveRecipient(index)}
                          className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Start schedule immediately</span>
                </label>

                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => {
                      setShowNewScheduleModal(false);
                      resetForm();
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleScheduleSubmit}
                    disabled={!formData.name || formData.recipients.every(email => !email.trim())}
                    className="btn-primary"
                  >
                    Create Schedule
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}