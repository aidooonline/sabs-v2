'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardBody, CardTitle } from '../../components/atoms/Card';
import { Button } from '../../components/atoms/Button';
import { 
  NavigationTabs, 
  ConfirmationDialog, 
  SearchInput, 
  DataList, 
  ActionBar 
} from '../../components/molecules';

export default function ComponentsDemoPage() {
  const [activeTab, setActiveTab] = useState('nav-tabs');
  const [showDialog, setShowDialog] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  // Mock data for demonstrations
  const tabs = [
    { id: 'nav-tabs', label: 'Navigation' },
    { id: 'dialogs', label: 'Dialogs', badge: '2' },
    { id: 'search', label: 'Search' },
    { id: 'data-lists', label: 'Data Lists' },
    { id: 'action-bars', label: 'Action Bars' },
  ];

  const searchSuggestions = [
    { id: '1', label: 'John Doe', description: 'Customer', category: 'People' },
    { id: '2', label: 'Transaction #12345', description: 'Withdrawal', category: 'Transactions' },
    { id: '3', label: 'Agent Settings', description: 'Configuration', category: 'Settings' },
  ];

  const dataItems = [
    {
      id: '1',
      title: 'John Doe',
      subtitle: 'Customer ID: CU001',
      description: 'Active customer since January 2024',
      status: 'active' as const,
      badge: 'VIP',
      actions: [
        { id: 'view', label: 'View', onClick: () => console.log('View customer') },
        { id: 'edit', label: 'Edit', onClick: () => console.log('Edit customer') },
      ]
    },
    {
      id: '2',
      title: 'Jane Smith',
      subtitle: 'Customer ID: CU002',
      description: 'Pending verification',
      status: 'pending' as const,
      actions: [
        { id: 'approve', label: 'Approve', onClick: () => console.log('Approve customer') },
        { id: 'reject', label: 'Reject', variant: 'danger' as const, onClick: () => console.log('Reject customer') },
      ]
    },
    {
      id: '3',
      title: 'Bob Johnson',
      subtitle: 'Customer ID: CU003',
      description: 'Account suspended',
      status: 'error' as const,
      actions: [
        { id: 'reactivate', label: 'Reactivate', onClick: () => console.log('Reactivate customer') },
      ]
    },
  ];

  const actionBarActions = [
    {
      id: 'add',
      label: 'Add Customer',
      icon: <span>➕</span>,
      variant: 'primary' as const,
      onClick: () => console.log('Add customer'),
      shortcut: 'n',
    },
    {
      id: 'import',
      label: 'Import',
      icon: <span>📥</span>,
      onClick: () => console.log('Import data'),
    },
    {
      id: 'export',
      label: 'Export',
      icon: <span>📤</span>,
      onClick: () => console.log('Export data'),
    },
    {
      id: 'refresh',
      label: 'Refresh',
      icon: <span>🔄</span>,
      onClick: () => console.log('Refresh data'),
      shortcut: 'r',
    },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'nav-tabs':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Navigation Tabs - Default Variant</CardTitle>
              </CardHeader>
              <CardBody>
                <NavigationTabs
                  tabs={tabs}
                  activeTab={activeTab}
                  onTabChange={setActiveTab}
                  variant="default"
                />
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Navigation Tabs - Pills Variant</CardTitle>
              </CardHeader>
              <CardBody>
                <NavigationTabs
                  tabs={tabs}
                  activeTab={activeTab}
                  onTabChange={setActiveTab}
                  variant="pills"
                />
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Navigation Tabs - Segment Variant</CardTitle>
              </CardHeader>
              <CardBody>
                <NavigationTabs
                  tabs={tabs}
                  activeTab={activeTab}
                  onTabChange={setActiveTab}
                  variant="segment"
                  fullWidth
                />
              </CardBody>
            </Card>
          </div>
        );

      case 'dialogs':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Confirmation Dialogs</CardTitle>
              </CardHeader>
              <CardBody>
                <div className="space-x-4">
                  <Button onClick={() => setShowDialog(true)}>
                    Show Confirmation Dialog
                  </Button>
                </div>
              </CardBody>
            </Card>
          </div>
        );

      case 'search':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Search Input with Suggestions</CardTitle>
              </CardHeader>
              <CardBody>
                <div className="max-w-md">
                  <SearchInput
                    placeholder="Search customers, transactions..."
                    value={searchValue}
                    onChange={setSearchValue}
                    suggestions={searchSuggestions}
                    onSuggestionSelect={(suggestion) => {
                      console.log('Selected:', suggestion);
                      setSearchValue(suggestion.label);
                    }}
                    showSearchButton
                    clearable
                  />
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Search Input Variants</CardTitle>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Default Variant</label>
                    <SearchInput placeholder="Default search..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Filled Variant</label>
                    <SearchInput placeholder="Filled search..." variant="filled" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Minimal Variant</label>
                    <SearchInput placeholder="Minimal search..." variant="minimal" />
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        );

      case 'data-lists':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Data List - Default</CardTitle>
              </CardHeader>
              <CardBody>
                <DataList
                  items={dataItems}
                  title="Customers"
                  searchable
                  showHeader
                  variant="default"
                />
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Data List - Selectable</CardTitle>
              </CardHeader>
              <CardBody>
                <DataList
                  items={dataItems}
                  title="Select Customers"
                  searchable
                  showHeader
                  selectable
                  selectedItems={selectedItems}
                  onSelectionChange={setSelectedItems}
                  variant="compact"
                />
              </CardBody>
            </Card>
          </div>
        );

      case 'action-bars':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Action Bar - Default</CardTitle>
              </CardHeader>
              <CardBody>
                <ActionBar
                  actions={actionBarActions}
                  variant="default"
                  alignment="left"
                />
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Action Bar - Elevated</CardTitle>
              </CardHeader>
              <CardBody>
                <ActionBar
                  actions={actionBarActions}
                  variant="elevated"
                  alignment="space-between"
                />
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Action Bar - Collapsible</CardTitle>
              </CardHeader>
              <CardBody>
                <ActionBar
                  actions={actionBarActions}
                  variant="bordered"
                  collapsible
                  collapseBreakpoint={640}
                />
              </CardBody>
            </Card>
          </div>
        );

      default:
        return <div>Select a tab to see component demonstrations</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Story 2.2: Molecular Components Demo
          </h1>
          <p className="text-gray-600">
            Interactive demonstrations of the responsive molecular components built in Story 2.2
          </p>
        </div>

        {/* Main Navigation */}
        <Card className="mb-6">
          <CardBody>
            <NavigationTabs
              tabs={tabs}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              variant="pills"
              fullWidth
            />
          </CardBody>
        </Card>

        {/* Content */}
        {renderContent()}

        {/* Confirmation Dialog */}
        <ConfirmationDialog
          isOpen={showDialog}
          onClose={() => setShowDialog(false)}
          onConfirm={() => {
            console.log('Confirmed!');
            setShowDialog(false);
          }}
          title="Delete Customer"
          message="Are you sure you want to delete this customer? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          variant="danger"
        />
      </div>
    </div>
  );
}