import api from "../utils/api";
import type { DashboardData } from "../types/dashboard";

export const dashboardService = {
  getCurrentUserName: async (): Promise<string> => {
    try {
      const res = await api.get("/auth/me");
      return res.data?.success ? res.data.data?.name?.split(" ")[0] ?? "there" : "there";
    } catch {
      return "there";
    }
  },

  getDashboardData: async (workspaceId?: string): Promise<DashboardData> => {
    const res = await api.get("/dashboard", {
      params: { workspaceId }
    });
    if (!res.data.success) throw new Error(res.data.message || "Failed to load dashboard");
    return res.data.data;
  },
};