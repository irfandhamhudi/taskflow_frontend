// src/features/dashboard/components/DashboardHeader.tsx
// import { Bell } from 'lucide-react';
// import { Button } from '../../ui/button';

type DashboardHeaderProps = {
  userName: string;
};

export function DashboardHeader({
  userName,
  // unreadCount,
  // onToggle,
  // notificationRef,
}: DashboardHeaderProps) {
  return (
    <div className="mb-8 flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome back, <span className="font-semibold">{userName}</span>! Here's your productivity overview.
        </p>
      </div>

      {/* <div className="relative" ref={notificationRef}>
        <Button
          variant="outline"
          size="icon"
          className="relative"
          onClick={onToggle}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-2 -right-2 h-6 w-6 rounded bg-primary text-xs text-primary-foreground flex items-center justify-center font-bold">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </div> */}
    </div>
  );
}
