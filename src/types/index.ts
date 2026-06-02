export type TaskStatus = 'todo' | 'inprogress' | 'review' | 'done';
export type ViewType = 'board' | 'list' | 'archive' | 'analytics' | 'files' | 'activity' | 'timeline';

export type Priority = 'low' | 'medium' | 'high' | 'urgent';

// Helper guard untuk priority (digunakan saat mapping data dari backend/socket)
export const isValidPriority = (value: string): value is Priority =>
  ['low', 'medium', 'high', 'urgent'].includes(value);

export const columnOrder = ['todo', 'inprogress', 'review', 'done'] as const;

export const columnTitles: Record<string, string> = {
  todo: 'To Do',
  inprogress: 'In Progress',
  review: 'Review',
  done: 'Done',
};

export const statusConfig: Record<string, { label: string; className: string }> = {
  todo: { label: 'ToDo', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  inprogress: { label: 'In Progress', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  review: { label: 'Review', className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' },
  done: { label: 'Done', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
};

export const priorityConfig: Record<Priority, { label: string; className: string }> = {
  low: { label: 'Low Priority', className: 'bg-muted text-muted-foreground' },
  medium: { label: 'Medium Priority', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-blue-400' }, // mismatch colors? fixing to match
  high: { label: 'High Priority', className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' },
  urgent: { label: 'Urgent', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
};

export interface Comment {
  _id: string;
  user: {
    _id: string;
    name: string;
    profilePicture?: string;
  };
  comment: string;
  createdAt: string;
  isEdited?: boolean;
  editedAt?: string;
  reactions?: Array<{
    emoji: string;
    user: {
      _id: string;
      name: string;
    };
  }>;
  replies?: Array<Comment>;
}

// Interface Task (diperbaiki agar match dengan data backend/socket)
export interface Task {
  projectId?: string;
  _id: string;
  id: string; // alias _id untuk dnd-kit
  title: string;
  description?: string;
  status: string;
  columnId: string; // alias status
  priority: Priority;
  tags?: string[];
  startDate?: string;
  dueDate?: string;
  assignedTo?: Array<{
    _id: string;
    name: string;
    email?: string;
    profilePicture?: string;
  }>;
  createdBy?: {
    _id: string;
    name: string;
    email?: string;
    profilePicture?: string;
  };
  subtasks?: Array<{
    _id: string;
    id?: string;
    title: string;
    completed: boolean;
    completedBy?: { _id: string; name: string };
  }>;
  comments?: Comment[];
  attachments?: Array<{
    _id: string;
    fileName: string;
    fileUrl: string;
    fileType: string;
    fileSize: number;
    thumbnailUrl?: string;
    uploadedBy: string | { _id: string; name: string; profilePicture?: string };
    uploadedAt: string | Date;
  }>;
  order?: number;
  dependencies?: string[];
  isArchived?: boolean;
  reminders?: Array<{
    _id: string;
    time: string;
    notified: boolean;
    type: 'system' | 'email';
  }>;
  createdAt?: string;
  updatedAt?: string;
  completedAt?: string;

  // Frontend only (computed)
  membersCount: number;
  commentsCount: number;
  attachmentsCount: number;
  projectName?: string;
  projectColor?: string;
}

export interface Column {
  id: string;
  title: string;
  tasks: Task[];
}