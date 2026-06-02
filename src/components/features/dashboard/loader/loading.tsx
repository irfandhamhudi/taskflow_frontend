import { DashboardSkeleton } from './dashboard-skeleton';
// src/components/features/dashboard/DashboardLoading.tsx
// eslint-disable-next-line @typescript-eslint/no-unused-expressions
'use client';


import { SidebarProvider, SidebarInset } from '../../../ui/sidebar';
import { AppSidebar } from '../../../app-sidebar';
import { SiteHeader } from '../../../site-header';

export function DashboardLoading() {
  return (
    <SidebarProvider>
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <DashboardSkeleton />
        </SidebarInset>
      </SidebarProvider>
  );
}
