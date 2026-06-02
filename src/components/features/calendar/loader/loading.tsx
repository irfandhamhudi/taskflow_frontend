import { CalendarSkeleton } from './calendar-skeleton';
// src/components/features/calendar/loader/loading.tsx
'use client';


import { SidebarProvider, SidebarInset } from '../../../ui/sidebar';
import { AppSidebar } from '../../../app-sidebar';
import { SiteHeader } from '../../../site-header';

export function CalendarLoading() {
  return (
    <SidebarProvider>
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <CalendarSkeleton />
        </SidebarInset>
      </SidebarProvider>
  );
}
