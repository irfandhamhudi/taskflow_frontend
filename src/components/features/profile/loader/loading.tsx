import { ProfileSkeleton } from './profile-skeleton';
// src/components/features/dashboard/DashboardLoading.tsx
'use client';


import { SidebarProvider, SidebarInset } from '../../../ui/sidebar';
import { AppSidebar } from '../../../app-sidebar';
import { SiteHeader } from '../../../site-header';

export function ProfileLoading() {
  return (
    <SidebarProvider>
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <ProfileSkeleton />
        </SidebarInset>
      </SidebarProvider>
  );
}
