'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  useGetReportsQuery,
  useGetScheduledReportsQuery,
  useCreateReportMutation,
  useScheduleReportMutation,
  useDeleteReportMutation
} from '../../store/api/reportsApi';
import { formatCurrency, formatNumber, formatDate } from '../../utils/formatters';
import { 
  FileText, 
  Download, 
  Calendar, 
  Clock,
  Users,
  TrendingUp,
  BarChart3,
  PieChart,
  Settings,
  Play,
  Pause,
  Trash2,
  Edit3,
  Eye,
  Plus,
  Filter,
  Search,
  RefreshCw,
  Mail,
  Share,
  AlertCircle,
  CheckCircle,
  Timer,
  X
} from 'lucide-react';
import { MetricCard } from '../components/MetricCard';
import { ChartContainer, ChartContainerWithActions } from '../components/ChartContainer';
import { ReportBuilder } from '../components/ReportBuilder';
import { ScheduledReportManager } from '../components/ScheduledReportManager';
import { ReportExportEngine } from '../components/ReportExportEngine';
import type { Report, ScheduledReport, ReportFilters } from '../../types/reports';

export default function AdvancedReportsPage() {
  // State management
  const [activeTab, setActiveTab] = useState<'dashboard' | 'builder' | 'scheduled' | 'templates'>('dashboard');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [filters, setFilters] = useState<ReportFilters>({});
  const [showReportBuilder, setShowReportBuilder] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // API queries
  const {
    data: reports,
    isLoading: reportsLoading,
    refetch: refetchReports
  } = useGetReportsQuery(filters);

  const {
    data: scheduledReports,
    isLoading: scheduledLoading
  } = useGetScheduledReportsQuery();

  const [createReport] = useCreateReportMutation();
  const [scheduleReport] = useScheduleReportMutation();
  const [deleteReport] = useDeleteReportMutation();

  // Handle report generation
  const handleGenerateReport = async (reportType: string, config: any) => {
    setIsGeneratingReport(true);
    try {
      await createReport({
        type: reportType,
        config,
        generatedBy: 'current-user',
        timestamp: new Date().toISOString()
      }).unwrap();
      refetchReports();
    } catch (error) {
      console.error('Failed to generate report:', error);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  // Handle report scheduling
  const handleScheduleReport = async (reportId: string, schedule: any) => {
    try {
      await scheduleReport({
        reportId,
        schedule,
        active: true
      }).unwrap();
    } catch (error) {
      console.error('Failed to schedule report:', error);
    }
  };

  // Computed metrics
  const reportMetrics = useMemo(() => {
    if (!reports) return null;

    return {
      totalReports: reports.length,
      recentReports: reports.filter(r => {
        const reportDate = new Date(r.createdAt);
        const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        return reportDate >= dayAgo;
      }).length,
      scheduledActive: scheduledReports?.filter(sr => sr.active).length || 0,
      totalDownloads: reports.reduce((sum, r) => sum + (r.downloadCount || 0), 0)
    };
  }, [reports, scheduledReports]);

  return (
    <div className="advanced-reports-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div className="mb-4 lg:mb-0">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Advanced Reporting System
            </h1>
            <p className="text-gray-600">
              Automated report generation, scheduling, and export capabilities for comprehensive business insights
            </p>
          </div>

          {/* Action Controls */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowReportBuilder(true)}
              className="btn-primary"
              disabled={isGeneratingReport}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Report
            </button>

            <button
              onClick={() => refetchReports()}
              className="btn-secondary"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>

            <button className="btn-secondary">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total Reports"
            value={reportMetrics?.totalReports || 0}
            formatter={formatNumber}
            trend={12.5}
            icon={FileText}
            color="blue"
            isLoading={reportsLoading}
          />
          <MetricCard
            title="Recent Reports"
            value={reportMetrics?.recentReports || 0}
            formatter={formatNumber}
            trend={8.3}
            icon={TrendingUp}
            color="green"
            isLoading={reportsLoading}
          />
          <MetricCard
            title="Scheduled Active"
            value={reportMetrics?.scheduledActive || 0}
            formatter={formatNumber}
            trend={5.7}
            icon={Calendar}
            color="purple"
            isLoading={scheduledLoading}
          />
          <MetricCard
            title="Total Downloads"
            value={reportMetrics?.totalDownloads || 0}
            formatter={formatNumber}
            trend={15.2}
            icon={Download}
            color="orange"
            isLoading={reportsLoading}
          />
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'dashboard', label: 'Report Dashboard', icon: BarChart3 },
              { id: 'builder', label: 'Report Builder', icon: Settings },
              { id: 'scheduled', label: 'Scheduled Reports', icon: Calendar },
              { id: 'templates', label: 'Templates', icon: FileText },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* Recent Reports */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Recent Reports</h3>
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search reports..."
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                    <Filter className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="divide-y divide-gray-100">
                {reports?.slice(0, 10).map((report) => (
                  <div
                    key={report.id}
                    className="p-4 hover:bg-gray-50 transition-colors duration-150"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          report.status === 'completed' ? 'bg-green-100' : 
                          report.status === 'processing' ? 'bg-yellow-100' : 'bg-red-100'
                        }`}>
                          {report.status === 'completed' ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : report.status === 'processing' ? (
                            <Timer className="w-5 h-5 text-yellow-600" />
                          ) : (
                            <AlertCircle className="w-5 h-5 text-red-600" />
                          )}
                        </div>

                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {report.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {report.type} • Generated {formatDate(report.createdAt)} • {report.size || '0'} KB
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          report.status === 'completed' ? 'bg-green-100 text-green-800' :
                          report.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {report.status}
                        </span>

                        <div className="flex items-center space-x-1">
                          <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                            <Download className="w-4 h-4" />
                          </button>
                          <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                            <Share className="w-4 h-4" />
                          </button>
                          <button className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Report Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartContainer
                title="Report Generation Trends"
                subtitle="Reports generated over time"
                isLoading={reportsLoading}
                icon={TrendingUp}
              >
                <div className="w-full h-64 bg-gray-50 rounded border-2 border-dashed border-gray-200 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-gray-600 font-medium mb-2">Report Trends Chart</div>
                    <div className="text-sm text-gray-500">Report generation analytics</div>
                  </div>
                </div>
              </ChartContainer>

              <ChartContainer
                title="Report Type Distribution"
                subtitle="Distribution by report type"
                isLoading={reportsLoading}
                icon={PieChart}
              >
                <div className="w-full h-64 bg-gray-50 rounded border-2 border-dashed border-gray-200 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-gray-600 font-medium mb-2">Report Types Chart</div>
                    <div className="text-sm text-gray-500">Type distribution analysis</div>
                  </div>
                </div>
              </ChartContainer>
            </div>
          </div>
        )}

        {activeTab === 'builder' && (
          <div className="space-y-8">
            <ReportBuilder
              onGenerate={handleGenerateReport}
              isGenerating={isGeneratingReport}
            />
          </div>
        )}

        {activeTab === 'scheduled' && (
          <div className="space-y-8">
            <ScheduledReportManager
              scheduledReports={scheduledReports || []}
              onSchedule={handleScheduleReport}
              onDelete={deleteReport}
            />
          </div>
        )}

        {activeTab === 'templates' && (
          <div className="space-y-8">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Report Templates</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  {
                    name: 'Customer Analytics Report',
                    description: 'Comprehensive customer behavior and lifecycle analysis',
                    icon: Users,
                    color: 'blue'
                  },
                  {
                    name: 'Transaction Summary Report',
                    description: 'Daily, weekly, and monthly transaction summaries',
                    icon: BarChart3,
                    color: 'green'
                  },
                  {
                    name: 'Financial Performance Report',
                    description: 'Revenue, profit, and financial KPI analysis',
                    icon: TrendingUp,
                    color: 'purple'
                  },
                  {
                    name: 'Compliance Report',
                    description: 'Regulatory compliance and audit trail report',
                    icon: FileText,
                    color: 'orange'
                  },
                  {
                    name: 'Risk Assessment Report',
                    description: 'Customer risk scoring and fraud detection analysis',
                    icon: AlertCircle,
                    color: 'red'
                  },
                  {
                    name: 'Operational Metrics Report',
                    description: 'System performance and operational KPIs',
                    icon: Settings,
                    color: 'gray'
                  }
                ].map((template) => {
                  const Icon = template.icon;
                  return (
                    <div
                      key={template.name}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                    >
                      <div className={`w-12 h-12 rounded-lg mb-4 flex items-center justify-center bg-${template.color}-100`}>
                        <Icon className={`w-6 h-6 text-${template.color}-600`} />
                      </div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">{template.name}</h4>
                      <p className="text-xs text-gray-500 mb-4">{template.description}</p>
                      <button
                        onClick={() => handleGenerateReport(template.name.toLowerCase().replace(/\s+/g, '_'), {})}
                        className="w-full px-3 py-2 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200 transition-colors"
                      >
                        Use Template
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Report Builder Modal */}
        {showReportBuilder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Report Builder</h3>
                <button
                  onClick={() => setShowReportBuilder(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-6">
                <ReportBuilder
                  onGenerate={handleGenerateReport}
                  isGenerating={isGeneratingReport}
                  onClose={() => setShowReportBuilder(false)}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}