// src/features/dashboard/components/StatsCards.tsx
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Folder, ClipboardList, UserCheck, CheckCircle2 } from 'lucide-react';
import type { DashboardData } from '../../../types/dashboard';

type StatsCardsProps = {
  overview: DashboardData['overview'];
  assignedTasksCount?: number;
};

export function StatsCards({ overview, assignedTasksCount = 0 }: StatsCardsProps) {
  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-8">
      <Card className='h-fit border-border/50 shadow-sm'>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-md font-medium">Active Projects</CardTitle>
          <Folder className="h-5 w-5 text-primary" strokeWidth={1.5} />
        </CardHeader>
        <CardContent className="flex flex-row items-end justify-between pt-4">
          <p className="text-md text-muted-foreground pb-1">Projects</p>
          <div className="text-4xl font-semibold tracking-tight">{overview.totalProjects || 0}</div>
        </CardContent>
      </Card>

      <Card className='h-fit border-border/50 shadow-sm'>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-md font-medium">Total Tasks</CardTitle>
          <ClipboardList className="h-5 w-5 text-primary" strokeWidth={1.5} />
        </CardHeader>
        <CardContent className="flex flex-row items-end justify-between pt-4">
          <p className="text-md text-muted-foreground pb-1">Tasks</p>
          <div className="text-4xl font-semibold tracking-tight">{overview.totalTasks || 0}</div>
        </CardContent>
      </Card>

      <Card className='h-fit border-border/50 shadow-sm'>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-md font-medium">My Assigned Tasks</CardTitle>
          <UserCheck className="h-5 w-5 text-primary" strokeWidth={1.5} />
        </CardHeader>
        <CardContent className="flex flex-row items-end justify-between pt-4">
          <p className="text-md text-muted-foreground pb-1">Tasks</p>
          <div className="text-4xl font-semibold tracking-tight">{assignedTasksCount}</div>
        </CardContent>
      </Card>

      <Card className='h-fit border-border/50 shadow-sm'>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-md font-medium">Completed Tasks</CardTitle>
          <CheckCircle2 className="h-5 w-5 text-primary" strokeWidth={1.5} />
        </CardHeader>
        <CardContent className="flex flex-row items-end justify-between pt-4">
          <p className="text-md text-muted-foreground pb-1">Tasks</p>
          <div className="text-4xl font-semibold tracking-tight">{overview.completedTasks || 0}</div>
        </CardContent>
      </Card>
    </div>
  );
}
