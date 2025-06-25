'use client';

import React from 'react';

interface NotificationCenterProps {
  // Props will be defined in afternoon session
}

export function NotificationCenter(props: NotificationCenterProps) {
  return (
    <div className="dashboard-card text-center py-12">
      <div className="text-6xl mb-4">🔔</div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        Notification Center
      </h3>
      <p className="text-gray-600 mb-4">
        Real-time notification center will be implemented in the afternoon session (2:00-3:00 PM)
      </p>
      <div className="text-sm text-gray-500">
        Coming up: WebSocket integration for live alerts
      </div>
    </div>
  );
}