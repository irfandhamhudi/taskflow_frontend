// src/types/project.ts
import type { Task } from "./index";
export interface Member {
  user: {
    _id: string;
    name: string;
    email?: string;
    username?: string;
    profilePicture?: string;
  };
  role: 'owner' | 'admin' | 'editor' | 'viewer';
}

export interface Project {
  _id: string;
  name: string;
  description?: string;
  icon: string;
  color?: string;
  visibility: 'private' | 'limited' | 'public'; // ← diperluas jika perlu
  owner: { _id: string; name: string; username?: string };
  members: Member[]; // ← gunakan interface Member di atas
  isFavorite?: boolean;
  isArchived?: boolean;
  createdAt?: string;
  updatedAt?: string;
  enableShareLink?: boolean;
  shareLinkToken?: string;
  currentUserRole?: 'owner' | 'admin' | 'editor' | 'viewer';
  taskCount?: number;
  completedTaskCount?: number;
  progress?: number;
  userRole?: 'owner' | 'admin' | 'editor' | 'viewer';
  isOwner?: boolean;
  shareUrl?: string;
}

export interface ProjectStats {
  projectName: string;
  totalTasks: number;
  completedTasks: number;
  progress: number;
}

export type ProjectDataState = {
  loading: boolean;
  error: string | null;
  project: Project | null;
  tasks: Task[]; // Task dari file lain
  currentUserRole: Project['userRole'];
  members: Member[];
  shareUrl: string;
};