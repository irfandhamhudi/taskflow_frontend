import type { Priority } from "./index";

export interface DashboardData {
  overview: {
    totalProjects: number;
    totalTasks: number;
    completedTasks: number;
    overdueTasks: number;
    urgentTasks: number;
    tasksDueToday: number;
  };
  taskDistribution: {
    byStatus: {
      todo: number;
      inprogress: number;
      review: number;
      done: number;
    };
    byPriority: {
      low: number;
      medium: number;
      high: number;
      urgent: number;
    };
  };
  projects: Array<{
    projectName: string;
    projectIcon?: string;
    totalTasks: number;
    completedTasks: number;
    progress: number;
  }>;
  myTasks: Array<{
    _id: string;
    title: string;
    projectId: { _id: string; name: string; icon?: string } | null;
    dueDate: string | null;
    startDate?: string | null;
    status: string;
    priority: Priority;
    progress: number;
    assignees: Array<{ _id: string; name: string; profilePicture?: string }>;
    attachments: Array<{ _id: string; fileName: string; fileType: string; fileUrl: string }>;
  }>;
  recentActivity: Array<{
    _id: string;
    user: { name: string, profilePicture?: string; _id: string } | null;
    action: string;
    projectId?: { name: string; icon?: string };
    createdAt: string;
    entityName?: string;
    details?: Record<string, any>;
  }>;
  projectStats: Array<{
    projectId: string;
    projectName: string;
    projectIcon?: string;
    totalTasks: number;
    completedTasks: number;
    progress: number;
  }>;
  todayTasks: Array<{
    _id: string;
    title: string;
    projectId: { _id: string; name: string; icon?: string } | null;
    dueDate: string | null;
    status: string;
    priority: Priority;
  }>;
}