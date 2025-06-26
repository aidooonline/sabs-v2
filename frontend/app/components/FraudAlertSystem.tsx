'use client';

import React, { useState, useEffect } from 'react';
import { formatCurrency, formatRelativeTime } from '../../utils/formatters';
import { 
  Shield, 
  AlertTriangle, 
  Eye, 
  X, 
  Clock,
  TrendingUp,
  User,
  CreditCard,
  MapPin,
  Bell,
  CheckCircle,
  Ban
} from 'lucide-react';

interface FraudAlert {
  id: string;
  type: 'high_risk_transaction' | 'velocity_check' | 'location_anomaly' | 'pattern_match' | 'account_takeover';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  customerName: string;
  customerId: string;
  amount?: number;
  transactionId?: string;
  location?: string;
  riskScore: number;
  timestamp: string;
  status: 'active' | 'investigating' | 'resolved' | 'false_positive';
  assignedTo?: string;
}

interface FraudAlertSystemProps {
  maxAlerts?: number;
  showResolved?: boolean;
}

export const FraudAlertSystem: React.FC<FraudAlertSystemProps> = ({
  maxAlerts = 15,
  showResolved = false,
}) => {
  const [alerts, setAlerts] = useState<FraudAlert[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<FraudAlert | null>(null);
  const [filter, setFilter] = useState<'all' | 'high' | 'critical'>('all');
  const [stats, setStats] = useState({
    active: 0,
    resolved: 0,
    investigating: 0,
    falsePositives: 0,
  });

  // Simulate real-time fraud alerts
  useEffect(() => {
    const generateAlert = (): FraudAlert => {
      const types: FraudAlert['type'][] = [
        'high_risk_transaction',
        'velocity_check',
        'location_anomaly',
        'pattern_match',
        'account_takeover'
      ];
      
      const severities: FraudAlert['severity'][] = ['low', 'medium', 'high', 'critical'];
      const type = types[Math.floor(Math.random() * types.length)];
      const severity = severities[Math.floor(Math.random() * severities.length)];
      
      const alertTemplates = {
        high_risk_transaction: {
          title: 'High Risk Transaction Detected',
          description: 'Large transaction amount detected outside normal patterns',
        },
        velocity_check: {
          title: 'Velocity Check Failed',
          description: 'Multiple transactions in short time period',
        },
        location_anomaly: {
          title: 'Location Anomaly',
          description: 'Transaction from unusual geographic location',
        },
        pattern_match: {
          title: 'Suspicious Pattern Match',
          description: 'Transaction matches known fraud patterns',
        },
        account_takeover: {
          title: 'Potential Account Takeover',
          description: 'Unusual account access patterns detected',
        },
      };

      return {
        id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type,
        severity,
        title: alertTemplates[type].title,
        description: alertTemplates[type].description,
        customerName: `Customer ${Math.floor(Math.random() * 1000)}`,
        customerId: `CUST_${Math.floor(Math.random() * 100000)}`,
        amount: Math.random() > 0.3 ? Math.floor(Math.random() * 50000) + 1000 : undefined,
        transactionId: Math.random() > 0.4 ? `TXN_${Math.floor(Math.random() * 100000)}` : undefined,
        location: Math.random() > 0.5 ? ['Accra', 'Lagos', 'Nairobi', 'Cairo'][Math.floor(Math.random() * 4)] : undefined,
        riskScore: Math.floor(Math.random() * 100) + 1,
        timestamp: new Date().toISOString(),
        status: 'active',
      };
    };

    // Initial alerts
    const initialAlerts = Array.from({ length: 5 }, generateAlert);
    setAlerts(initialAlerts);

    // Real-time alert generation
    const interval = setInterval(() => {
      if (Math.random() > 0.7) { // 30% chance every interval
        const newAlert = generateAlert();
        setAlerts(prev => [newAlert, ...prev.slice(0, maxAlerts - 1)]);
        
        // Update stats
        setStats(prev => ({
          ...prev,
          active: prev.active + 1,
        }));
      }
    }, 8000 + Math.random() * 12000); // Random interval between 8-20 seconds

    return () => clearInterval(interval);
  }, [maxAlerts]);

  // Get severity styling
  const getSeverityStyle = (severity: FraudAlert['severity']) => {
    switch (severity) {
      case 'low':
        return 'text-blue-600 bg-blue-100 border-blue-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'high':
        return 'text-orange-600 bg-orange-100 border-orange-200';
      case 'critical':
        return 'text-red-600 bg-red-100 border-red-200';
    }
  };

  // Get severity icon
  const getSeverityIcon = (severity: FraudAlert['severity']) => {
    switch (severity) {
      case 'low':
        return <Shield className="w-4 h-4 text-blue-600" />;
      case 'medium':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'high':
        return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      case 'critical':
        return <Ban className="w-4 h-4 text-red-600" />;
    }
  };

  // Get status styling
  const getStatusStyle = (status: FraudAlert['status']) => {
    switch (status) {
      case 'active':
        return 'text-red-600 bg-red-100';
      case 'investigating':
        return 'text-yellow-600 bg-yellow-100';
      case 'resolved':
        return 'text-green-600 bg-green-100';
      case 'false_positive':
        return 'text-gray-600 bg-gray-100';
    }
  };

  // Handle alert action
  const handleAlertAction = (alertId: string, action: 'investigate' | 'resolve' | 'false_positive') => {
    setAlerts(prev => 
      prev.map(alert => 
        alert.id === alertId 
          ? { 
              ...alert, 
              status: action === 'investigate' ? 'investigating' : action === 'resolve' ? 'resolved' : 'false_positive',
              assignedTo: action === 'investigate' ? 'Current User' : alert.assignedTo
            }
          : alert
      )
    );

    // Update stats
    setStats(prev => ({
      ...prev,
      active: action !== 'investigate' ? prev.active - 1 : prev.active,
      investigating: action === 'investigate' ? prev.investigating + 1 : prev.investigating,
      resolved: action === 'resolve' ? prev.resolved + 1 : prev.resolved,
      falsePositives: action === 'false_positive' ? prev.falsePositives + 1 : prev.falsePositives,
    }));

    setSelectedAlert(null);
  };

  // Filter alerts
  const filteredAlerts = alerts.filter(alert => {
    if (!showResolved && (alert.status === 'resolved' || alert.status === 'false_positive')) {
      return false;
    }
    
    if (filter === 'all') return true;
    return alert.severity === filter;
  });

  return (
    <div className="fraud-alert-system">
      <div className="bg-white rounded-lg border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Shield className="w-6 h-6 text-red-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Fraud Alert System
            </h3>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-500">Live Monitoring</span>
            </div>
          </div>

          {/* Filter Controls */}
          <div className="flex items-center space-x-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as typeof filter)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="all">All Alerts</option>
              <option value="high">High Risk</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-sm text-gray-600">Active</div>
              <div className="text-lg font-bold text-red-600">{stats.active}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Investigating</div>
              <div className="text-lg font-bold text-yellow-600">{stats.investigating}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Resolved</div>
              <div className="text-lg font-bold text-green-600">{stats.resolved}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">False Positives</div>
              <div className="text-lg font-bold text-gray-600">{stats.falsePositives}</div>
            </div>
          </div>
        </div>

        {/* Alerts List */}
        <div className="max-h-96 overflow-y-auto">
          {filteredAlerts.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Shield className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <div>No fraud alerts at this time</div>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 hover:bg-gray-50 transition-colors duration-150 ${
                    alert.severity === 'critical' ? 'bg-red-50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      {/* Severity Icon */}
                      <div className="flex-shrink-0 mt-1">
                        {getSeverityIcon(alert.severity)}
                      </div>

                      {/* Alert Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getSeverityStyle(alert.severity)}`}>
                            {alert.severity.toUpperCase()}
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusStyle(alert.status)}`}>
                            {alert.status.replace('_', ' ').toUpperCase()}
                          </span>
                          <span className="text-xs text-gray-500">
                            Risk Score: {alert.riskScore}
                          </span>
                        </div>
                        
                        <div className="text-sm font-medium text-gray-900 mb-1">
                          {alert.title}
                        </div>
                        
                        <div className="text-sm text-gray-600 mb-2">
                          {alert.description}
                        </div>
                        
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span className="flex items-center">
                            <User className="w-3 h-3 mr-1" />
                            {alert.customerName}
                          </span>
                          {alert.amount && (
                            <span className="flex items-center">
                              <CreditCard className="w-3 h-3 mr-1" />
                              {formatCurrency(alert.amount)}
                            </span>
                          )}
                          {alert.location && (
                            <span className="flex items-center">
                              <MapPin className="w-3 h-3 mr-1" />
                              {alert.location}
                            </span>
                          )}
                          <span className="flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {formatRelativeTime(alert.timestamp)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => setSelectedAlert(alert)}
                        className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Alert Detail Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                {getSeverityIcon(selectedAlert.severity)}
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedAlert.title}
                </h3>
                <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getSeverityStyle(selectedAlert.severity)}`}>
                  {selectedAlert.severity.toUpperCase()}
                </span>
              </div>
              <button
                onClick={() => setSelectedAlert(null)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Description</h4>
                  <p className="text-sm text-gray-600">{selectedAlert.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Customer</h4>
                    <p className="text-sm text-gray-900">{selectedAlert.customerName}</p>
                    <p className="text-xs text-gray-500">{selectedAlert.customerId}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Risk Score</h4>
                    <p className="text-lg font-bold text-red-600">{selectedAlert.riskScore}/100</p>
                  </div>
                </div>

                {selectedAlert.transactionId && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Transaction</h4>
                    <p className="text-sm text-gray-900">{selectedAlert.transactionId}</p>
                    {selectedAlert.amount && (
                      <p className="text-sm text-gray-600">{formatCurrency(selectedAlert.amount)}</p>
                    )}
                  </div>
                )}

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Timestamp</h4>
                  <p className="text-sm text-gray-600">
                    {new Date(selectedAlert.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            {selectedAlert.status === 'active' && (
              <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={() => handleAlertAction(selectedAlert.id, 'false_positive')}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Mark as False Positive
                </button>
                <button
                  onClick={() => handleAlertAction(selectedAlert.id, 'investigate')}
                  className="px-4 py-2 text-sm font-medium text-yellow-700 bg-yellow-100 border border-yellow-300 rounded-md hover:bg-yellow-200"
                >
                  Investigate
                </button>
                <button
                  onClick={() => handleAlertAction(selectedAlert.id, 'resolve')}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700"
                >
                  Resolve
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FraudAlertSystem;