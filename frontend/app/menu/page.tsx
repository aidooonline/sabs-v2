'use client';

import React, { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useUI } from '../../hooks/useUI';
import { DashboardTemplate } from '../../components/templates/DashboardTemplate';
import { defaultMenuItems } from '../../constants/menuItems';

// Dynamic import to avoid SSR issues
const MainMenu = dynamic(
  () => import('../../components/organisms/MainMenu').then(mod => ({ default: mod.MainMenu })),
  { ssr: false }
);

export default function MenuPage() {
  const { updatePageTitle, updateBreadcrumbs } = useUI();

  // Set page metadata
  useEffect(() => {
    updatePageTitle('Main Menu');
    updateBreadcrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Menu' },
    ]);
  }, [updatePageTitle, updateBreadcrumbs]);

  return (
    <DashboardTemplate title="Main Menu">
      <div className="max-w-6xl mx-auto">
        <MainMenu 
          items={defaultMenuItems}
          searchPlaceholder="Search menu items..."
        />
      </div>
    </DashboardTemplate>
  );
}