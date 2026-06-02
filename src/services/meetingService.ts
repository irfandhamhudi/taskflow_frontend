import api from "../utils/api";

export const meetingService = {
  getMeetings: async (workspaceId?: string) => {
    const res = await api.get("/meetings", { params: { workspaceId } });
    if (!res.data.success) throw new Error(res.data.message || "Failed to load meetings");
    return res.data.data;
  },

  createMeeting: async (meetingData: any) => {
    const res = await api.post("/meetings", meetingData);
    if (!res.data.success) throw new Error(res.data.message || "Failed to create meeting");
    return res.data.data;
  },

  getAuthUrl: async (platform: string) => {
    const res = await api.get(`/meetings/auth/${platform}`);
    if (!res.data.success) throw new Error(res.data.message || "Failed to get auth URL");
    return res.data.authUrl;
  },
  
  deleteMeeting: async (id: string) => {
    const res = await api.delete(`/meetings/${id}`);
    if (!res.data.success) throw new Error(res.data.message || "Failed to delete meeting");
    return res.data;
  },
  
  disconnectPlatform: async (platform: string) => {
    const res = await api.delete(`/meetings/disconnect/${platform}`);
    if (!res.data.success) throw new Error(res.data.message || "Failed to disconnect platform");
    return res.data;
  },
};
