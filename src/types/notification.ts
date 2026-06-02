export interface NotificationChange {
  field: string;
  oldValue: any;
  newValue: any;
  addedUsers?: { id: string; name: string; profilePicture?: string }[];
  removedUsers?: { id: string; name: string; profilePicture?: string }[];
}

export interface NotificationDetails {
  changes?: NotificationChange[];
  taskTitle?: string;
  status?: string;
  priority?: string;
  files?: { name: string; url: string; type: string; size: number }[];
}

export interface Notification {
  _id: string;
  recipient: string;
  sender: {
    _id: string;
    name: string;
    profilePicture?: string;
  };
  type: string;
  message: string;
  relatedId?: string;
  relatedModel?: string;
  link?: string;
  isRead: boolean;
  details?: NotificationDetails;
  createdAt: string;
}
