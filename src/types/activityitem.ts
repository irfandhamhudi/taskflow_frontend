export interface ActivityItem {
  _id: string;
  user: { name: string; username?: string; profilePicture?: string };
  action: string;
  entityName?: string;
  entityType?: string;
  projectId?: {
    _id: string;
    name: string;
    icon?: string;
    color?: string;
  };
  createdAt: string;
  details?: Record<string, any>;  
}