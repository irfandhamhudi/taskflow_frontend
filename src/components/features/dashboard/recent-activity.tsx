// src/features/dashboard/components/RecentActivityFeed.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { ScrollArea } from '../../ui/scroll-area';
import IMG_Recent from '../../../assets/IMG_noRecents.png';
import { ActivityItem } from './activity-item';
import type { DashboardData } from '../../../types/dashboard';

type RecentActivityFeedProps = {
  activities: DashboardData['recentActivity'];
};

export function RecentActivityFeed({ activities }: RecentActivityFeedProps) {
  return (
    <Card className="flex flex-col h-fit border-border/50 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          Recent Activity
        </CardTitle>
        <CardDescription>Latest updates across your projects</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 px-4 sm:px-6 flex flex-col">
        {activities.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center min-h-[300px] sm:min-h-[450px]">
            <img src={IMG_Recent} alt="No activity" className="w-48 h-48 object-cover mb-4 opacity-80" />
            <p className="text-sm text-muted-foreground">No recent activity found.</p>
          </div>
        ) : (
          <ScrollArea className="h-[450px] pr-4 -mr-4">
            <div className="relative space-y-3 pb-4 before:absolute before:left-[27px] before:top-4 before:bottom-4 before:w-[2px] before:bg-border/50">
              {activities.map((act) => (
                <ActivityItem key={act._id} act={act} />
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
