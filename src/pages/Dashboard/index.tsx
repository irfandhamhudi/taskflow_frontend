import { SidebarProvider, SidebarInset } from '../../components/ui/sidebar';
import { AppSidebar } from '../../components/app-sidebar';
import { SiteHeader } from '../../components/site-header';
import { useDashboardData } from '../../hooks/use-dashboardData';
import { useProjectStore } from '../../store/useProjectStore';


import { DashboardHeader } from '../../components/features/dashboard/dashboard-header';
// import { NotificationDropdown } from '../../components/features/dashboard/notification-dropdown';
import { StatsCards } from '../../components/features/dashboard/stast-card';
import { TaskDistribution } from '../../components/features/dashboard/task-distribution';
import { ActiveProjects } from '../../components/features/dashboard/active-project';
import { MyTasksList } from '../../components/features/dashboard/mytask-list';
import { ScheduleMeetings } from '../../components/features/dashboard/schedule-meetings';
import { RecentActivityFeed } from '../../components/features/dashboard/recent-activity';
import { DashboardLoading } from '../../components/features/dashboard/loader/loading';
import { DashboardError } from '../../components/features/dashboard/error/error';
// import { NotificationDropdown } from '../../components/features/dashboard/notification-dropdown';



export default function DashboardPage() {
  const { projects } = useProjectStore();
  const {
    loading,
    error,
    userName,
    dashboardData,
  } = useDashboardData();

  // Notification state removed

  if (loading) {
    return (
      <DashboardLoading />
    );
  }

  if (error || !dashboardData) {
    return (
      <DashboardError message={error || 'Failed to load dashboard data'} />
    );
  }

  const { overview, taskDistribution, projectStats, myTasks, recentActivity } = dashboardData;

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-auto">
            <div className="container mx-auto p-6 sm:p-6 lg:p-8 max-w-[1600px]">
              <DashboardHeader
                userName={userName}
              />

              <StatsCards overview={overview} assignedTasksCount={myTasks.length} />

              <div className="grid gap-4 sm:gap-6 lg:gap-8 grid-cols-1 lg:grid-cols-2 mb-8">
                <TaskDistribution taskDistribution={taskDistribution} />

                <ActiveProjects projects={projects} projectStats={projectStats} />
              </div>

              <div className="grid gap-4 sm:gap-6 lg:gap-8 grid-cols-1 lg:grid-cols-2 mb-8">
                <ScheduleMeetings />
                <RecentActivityFeed activities={recentActivity} />
              </div>

              <div className="mb-8">
                <MyTasksList />
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}