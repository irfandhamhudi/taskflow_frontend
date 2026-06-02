import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../ui/card";
import { ScrollArea } from "../../ui/scroll-area";
import api from "../../../utils/api";
import { ActivityItem } from "../dashboard/activity-item";
import { toast } from "sonner";
import IMG_Recent from "../../../assets/IMG_noRecents.png";

interface ProjectActivityProps {
  projectId: string;
}

export default function ProjectActivity({ projectId }: ProjectActivityProps) {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/activity-logs/project/${projectId}`);
        if (res.data.success) {
          setActivities(res.data.data);
        }
      } catch (err: any) {
        toast.error("Failed to load project activity");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchActivities();
    }
  }, [projectId]);

  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardHeader className="px-0 pt-0">
        <CardTitle>Project Activity</CardTitle>
        <CardDescription>Track all changes and updates in this project.</CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <ScrollArea className="h-[calc(100vh-250px)]">
          <div className="space-y-4 pr-4">
            {loading ? (
              <div className="flex items-center justify-center h-40">
                <p className="text-sm text-muted-foreground">Loading activity logs...</p>
              </div>
            ) : activities.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-96">
                <img src={IMG_Recent} alt="No activity" className="w-56 h-56 object-cover opacity-50" />
                <p className="text-sm text-muted-foreground text-center">No recent activity for this project</p>
              </div>
            ) : (
              activities.map((act) => (
                <ActivityItem key={act._id} act={act} />
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
