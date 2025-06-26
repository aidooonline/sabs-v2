'use client';

import React from 'react';
import type { Account } from '../../../types/customer';

interface CustomerTransactionHistoryProps {
  customerId: string;
  accounts: Account[];
}

export const CustomerTransactionHistory: React.FC<CustomerTransactionHistoryProps> = ({
  customerId,
  accounts,
}) => {
  return (
    <div className="customer-transaction-history p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Transaction History</h3>
      <div className="text-center py-8">
        <div className="text-gray-500">Transaction history will be displayed here</div>
        <div className="text-sm text-gray-400 mt-2">Customer ID: {customerId}</div>
      </div>
    </div>
  );
};