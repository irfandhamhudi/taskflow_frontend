// src/components/features/calendar/error/error.tsx
'use client';

import { SidebarProvider, SidebarInset } from '../../../ui/sidebar';
import { AppSidebar } from '../../../app-sidebar';
import { SiteHeader } from '../../../site-header';

type CalendarErrorProps = {
  message: string;
};

export function CalendarError({ message }: CalendarErrorProps) {
  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex h-full items-center justify-center min-h-[calc(100vh-64px)]">
          <div className="text-center max-w-md p-6 bg-destructive/10 rounded border border-destructive/30">
            <h2 className="text-2xl font-bold text-destructive mb-4">Oops!</h2>
            <p className="text-destructive mb-2">{message}</p>
            <p className="text-sm text-muted-foreground">
              Please try refreshing the page or contact support if the problem persists.
            </p>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
