// services/projectTaskService.ts
import type { Task } from "../types";
import type { Project } from "../types/project";
import api from "../utils/api";
import { toast } from "sonner";
import axios from "axios";

export const projectTaskService = {
  // ── Project ────────────────────────────────────────────────────────────────
  getProject: async (projectId: string): Promise<Project> => {
    const res = await api.get(`/projects/${projectId}`);
    if (!res.data.success) throw new Error(res.data.message || "Failed to load project");
    return res.data.data;
  },

  getProjects: async (params?: { page?: number; limit?: number; archived?: boolean }) => {
    const res = await api.get("/projects", { params });
    if (!res.data.success) throw new Error(res.data.message || "Failed to load projects");
    return res.data.data;
  },

  /** Update project (name, description, icon, color, tags, settings, dll) */
  updateProject: async (projectId: string, updateData: Partial<{
    name?: string;
    description?: string;
    icon?: string;
    color?: string;
    tags?: string[];
    settings?: Record<string, unknown>;
  }>) => {
    try {
      const res = await api.put(`/projects/${projectId}`, updateData);
      if (res.data.success) {
        toast.success(res.data.message || "Project updated successfully");
        return res.data.data;
      }
      throw new Error(res.data.message || "Failed to update project");
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || "Failed to update project");
      }
      throw error;
    }
  },

  deleteProject: async (projectId: string) => {
    const res = await api.delete(`/projects/${projectId}`);
    if (res.data.success) toast.success(res.data.message || "Project deleted");
    return res.data;
  },

  /** Archive atau unarchive project */
  archiveProject: async (projectId: string, archive: boolean) => {
    try {
      const res = await api.patch(`/projects/${projectId}/archive`, { archive });
      if (res.data.success) {
        toast.success(res.data.message || (archive ? "Project archived" : "Project unarchived"));
        return res.data.data;
      }
      throw new Error(res.data.message);
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || "Failed to update archive status");
      }
      throw error;
    }
  },

  /** Update pengaturan share link */
  updateShareSettings: async (
    projectId: string,
    settings: {
      enableShareLink?: boolean;
      shareRole?: "viewer" | "editor" | "admin";
      regenerate?: boolean;
    }
  ) => {
    try {
      const res = await api.patch(`/projects/${projectId}/share`, settings);
      if (res.data.success) {
        toast.success(res.data.message || "Share settings updated");
        return res.data.data; // { enableShareLink, shareRole, shareUrl }
      }
      throw new Error(res.data.message);
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || "Failed to update share settings");
      }
      throw error;
    }
  },

  /** Join project via share link (token dari query string) */
  joinViaShareLink: async (projectId: string, token: string) => {
    try {
      const res = await api.post(`/projects/${projectId}/join-link`, {}, {
        params: { token }
      });
      if (res.data.success) {
        toast.success(res.data.message || "Successfully joined project");
        return res.data;
      }
      throw new Error(res.data.message);
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || "Failed to join via link");
      }
      throw error;
    }
  },

  /** Track share link copy */
  trackShareLinkCopy: async (projectId: string) => {
    try {
      await api.post(`/projects/${projectId}/share-link-copied`);
    } catch (error) {
      console.error("Failed to track share link copy:", error);
    }
  },

  // ── Members ────────────────────────────────────────────────────────────────
  getProjectMembers: async (projectId: string) => {
    const res = await api.get(`/projects/${projectId}/members`);
    if (!res.data.success) {
      toast.error(res.data.message || "Failed to load members");
      return [];
    }
    return res.data.data;
  },

  updateMemberRole: async (projectId: string, memberId: string, role: "viewer" | "editor" | "admin") => {
    const res = await api.patch(`/projects/${projectId}/members/${memberId}/role`, { role });
    if (res.data.success) toast.success(res.data.message || "Role updated");
    return res.data;
  },

  /** Invite member via email */
  inviteMember: async (projectId: string, email: string, role: "viewer" | "editor" | "admin" = "editor") => {
    try {
      const res = await api.post(`/projects/${projectId}/invite`, { email, role });
      if (res.data.success) {
        return res.data.data;
      }
      throw new Error(res.data.message);
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || "Failed to send invitation");
      }
      throw error;
    }
  },

  /** Remove member dari project */
  removeMember: async (projectId: string, memberId: string) => {
    try {
      const res = await api.delete(`/projects/${projectId}/members/${memberId}`);
      if (res.data.success) {
        toast.success(res.data.message || "Member removed");
        return res.data;
      }
      throw new Error(res.data.message);
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || "Failed to remove member");
      }
      throw error;
    }
  },

  // ── Tasks ──────────────────────────────────────────────────────────────────
  createTask: async (projectId: string, taskData: Partial<Task>) => {
    try {
      const payload = {
        title: taskData.title || "Untitled Task",
        description: taskData.description || "",
        status: taskData.status || "todo",
        priority: taskData.priority || "medium",
        tags: taskData.tags || [],
        assignedTo: taskData.assignedTo || [],
        startDate: taskData.startDate ? new Date(taskData.startDate).toISOString() : undefined,
        dueDate: taskData.dueDate ? new Date(taskData.dueDate).toISOString() : undefined,
        subtasks: taskData.subtasks || [],
        // attachments ditangani terpisah
      };

      const res = await api.post(`/tasks`, { ...payload, projectId });

      if (res.data.success) {
        toast.success(res.data.message || "Task created successfully");
        return res.data.data;
      }
      throw new Error(res.data.message || "Failed to create task");
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || "Failed to create task");
      }
      throw error;
    }
  },

  getTasks: async (projectIdOrParams?: string | { projectId?: string; assignedTo?: string; includeArchived?: boolean; limit?: number }, includeArchivedParam = false) => {
    let params: any = {};
    if (typeof projectIdOrParams === "string") {
      params = { projectId: projectIdOrParams, includeArchived: includeArchivedParam, limit: 500 };
    } else {
      params = { ...projectIdOrParams, limit: projectIdOrParams?.limit || 500 };
    }

    const res = await api.get("/tasks", { params });
    if (!res.data.success) {
      toast.error(res.data.message || "Failed to load tasks");
      return [];
    }
    return res.data.data;
  },

  getTaskDetail: async (taskId: string) => {
    const res = await api.get(`/tasks/${taskId}`);
    if (!res.data.success) throw new Error(res.data.message || "Failed to load task detail");
    return res.data.data;
  },

  updateTaskStatus: async (taskId: string, status: string) => {
    const res = await api.patch(`/tasks/${taskId}/status`, { status });
    if (res.data.success) toast.success(res.data.message);
    return res.data;
  },

  deleteTask: async (taskId: string) => {
    const res = await api.delete(`/tasks/${taskId}`);
    if (res.data.success) toast.success(res.data.message);
    return res.data;
  },

  unarchiveTask: async (taskId: string) => {
    const res = await api.patch(`/tasks/${taskId}/archive`, { archive: false });
    if (res.data.success) toast.success(res.data.message);
    return res.data;
  },

  // Optional: tambahkan jika ada endpoint update task lengkap
  updateTask: async (taskId: string, updates: Partial<Task>) => {
    const res = await api.put(`/tasks/${taskId}`, updates);
    if (res.data.success) toast.success(res.data.message || "Task updated");
    return res.data.data;
  },

  // ── Role Upgrade Requests ──────────────────────────────────────────────────
  requestRoleUpgrade: async (projectId: string, requestedRole: string, message: string) => {
    try {
      const res = await api.post(`/projects/${projectId}/role-upgrade`, { requestedRole, message });
      if (res.data.success) {
        toast.success(res.data.message || "Request submitted successfully");
        return res.data.data;
      }
      throw new Error(res.data.message);
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || "Failed to submit request");
      }
      throw error;
    }
  },

  getRoleUpgradeRequests: async (projectId: string) => {
    try {
      const res = await api.get(`/projects/${projectId}/role-upgrade/requests`);
      if (res.data.success) return res.data.data;
      throw new Error(res.data.message);
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || "Failed to load requests");
      }
      return [];
    }
  },

  handleRoleUpgradeRequest: async (projectId: string, requestId: string, action: 'approve' | 'reject') => {
    try {
      const res = await api.patch(`/projects/${projectId}/role-upgrade/requests/${requestId}`, { action });
      if (res.data.success) {
        toast.success(res.data.message || `Request ${action}ed`);
        return res.data;
      }
      throw new Error(res.data.message);
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || `Failed to ${action} request`);
      }
      throw error;
    }
  },
};