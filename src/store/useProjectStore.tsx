// src/store/useProjectStore.ts
import { create } from 'zustand';
import type { ActivityItem } from '../types/activityitem';
import type { Project } from '../types/project';

interface ProjectStore {
  projects: Project[];
  recentActivity: ActivityItem[];
  currentProject: Project | null;
  setProjects: (projects: Project[]) => void;
  setCurrentProject: (project: Project | null) => void;
  addProject: (project: Project) => void;
  updateProject: (projectId: string, updates: Partial<Project>) => void;
  archiveProject: (projectId: string, isArchived: boolean) => void;
  removeProject: (projectId: string) => void;
  updateMember: (projectId: string, memberId: string, updates: Partial<{ role: string }>) => void;
  addMember: (projectId: string, member: any) => void;
  removeMember: (projectId: string, memberId: string) => void;
  setRecentActivity: (activities: ActivityItem[]) => void;
  addRecentActivity: (activity: ActivityItem) => void;
  toggleFavorite: (projectId: string, isFavorite: boolean) => void;

}

// utils/sortProjects.ts  (atau langsung di store)
export const sortProjectsByNewest = (projects: Project[]) => {
  return [...projects].sort((a, b) => {
    const dateA = new Date(a.createdAt || 0).getTime();
    const dateB = new Date(b.createdAt || 0).getTime();
    return dateB - dateA; // descending → terbaru di atas
  });
};

export const useProjectStore = create<ProjectStore>((set) => ({
  projects: [],
  currentProject: null,
  recentActivity: [],

  setProjects: (projects) =>
    set({ projects: sortProjectsByNewest(projects) }),

  setCurrentProject: (project) => set({ currentProject: project }),

  addProject: (project) =>
    set((state) => {
      // Prevent duplicates
      if (state.projects.some((p) => p._id === project._id)) {
        return state;
      }
      const newList = [project, ...state.projects];
      return {
        projects: sortProjectsByNewest(newList),
        currentProject:
          state.currentProject?._id === project._id ? project : state.currentProject,
      };
    }),

  updateProject: (projectId, updates) =>
    set((state) => {
      const updatedList = state.projects.map((p) =>
        p._id === projectId ? { ...p, ...updates } : p
      );
      return {
        projects: sortProjectsByNewest(updatedList),
        currentProject:
          state.currentProject?._id === projectId
            ? { ...state.currentProject, ...updates }
            : state.currentProject,
      };
    }),

  archiveProject: (projectId, isArchived) =>
    set((state) => {
      const updated = state.projects.map((p) =>
        p._id === projectId ? { ...p, isArchived } : p
      );
      return {
        projects: sortProjectsByNewest(updated),
        currentProject:
          state.currentProject?._id === projectId
            ? { ...state.currentProject, isArchived }
            : state.currentProject,
      };
    }),

  removeProject: (projectId) =>
    set((state) => {
      const filtered = state.projects.filter((p) => p._id !== projectId);
      return {
        projects: sortProjectsByNewest(filtered),
        currentProject:
          state.currentProject?._id === projectId ? null : state.currentProject,
      };
    }),

  addMember: (projectId, member) =>
    set((state) => {
      const updatedList = state.projects.map((p) =>
        p._id === projectId
          ? { ...p, members: [...p.members, member] }
          : p
      );
      return {
        projects: sortProjectsByNewest(updatedList),
        currentProject:
          state.currentProject?._id === projectId
            ? {
                ...state.currentProject,
                members: [...state.currentProject.members, member],
              }
            : state.currentProject,
      };
    }),

  removeMember: (projectId, memberId) =>
    set((state) => {
      const updatedList = state.projects.map((p) =>
        p._id === projectId
          ? {
              ...p,
              members: p.members.filter((m) => m.user._id !== memberId),
            }
          : p
      );
      return {
        projects: sortProjectsByNewest(updatedList),
        currentProject:
          state.currentProject?._id === projectId
            ? {
                ...state.currentProject,
                members: state.currentProject.members.filter(
                  (m) => m.user._id !== memberId
                ),
              }
            : state.currentProject,
      };
    }),

  updateMember: (projectId, memberId, updates) =>
    set((state) => {
      const updatedList = state.projects.map((p) =>
        p._id === projectId
          ? {
              ...p,
              members: p.members.map((m) =>
                m.user._id === memberId ? { ...m, ...updates } : m
              ),
            }
          : p
      );
      return {
        projects: sortProjectsByNewest(updatedList),
        currentProject:
          state.currentProject?._id === projectId
            ? {
                ...state.currentProject,
                members: state.currentProject.members.map((m) =>
                  m.user._id === memberId ? { ...m, ...updates } : m
                ),
              }
            : state.currentProject,
      };
    }),

  // Action untuk recent activity
  setRecentActivity: (activities) => set({ recentActivity: activities }),

  addRecentActivity: (activity) =>
    set((state) => {
      // Opsional: hindari duplikat berdasarkan _id
      const exists = state.recentActivity.some((a) => a._id === activity._id);
      if (exists) return state;

      return {
        recentActivity: [activity, ...state.recentActivity].slice(0, 50),
      };
    }),
  
  toggleFavorite: (projectId, isFavorite) =>
    set((state) => {
      const updatedList = state.projects.map((p) =>
        p._id === projectId ? { ...p, isFavorite } : p
      );
      return {
        projects: sortProjectsByNewest(updatedList),
        currentProject:
          state.currentProject?._id === projectId
            ? { ...state.currentProject, isFavorite }
            : state.currentProject,
      };
    }),
}));