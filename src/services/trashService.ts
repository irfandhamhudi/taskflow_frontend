import api from "../utils/api";

export interface TrashedTask {
  _id: string;
  title: string;
  deletedAt: string;
  projectId: {
    _id: string;
    name: string;
    color: string;
  };
}

export interface TrashedProject {
  _id: string;
  name: string;
  deletedAt: string;
  icon: string;
}

export interface TrashData {
  tasks: TrashedTask[];
  projects: TrashedProject[];
}

const trashService = {
  getTrashItems: async () => {
    const response = await api.get<{ success: boolean; data: TrashData }>("/trash");
    return response.data.data;
  },

  restoreTask: async (taskId: string) => {
    const response = await api.patch<{ success: boolean; message: string }>(`/trash/tasks/${taskId}/restore`);
    return response.data;
  },

  restoreProject: async (projectId: string) => {
    const response = await api.patch<{ success: boolean; message: string }>(`/trash/projects/${projectId}/restore`);
    return response.data;
  },

  permanentlyDeleteTask: async (taskId: string) => {
    const response = await api.delete<{ success: boolean; message: string }>(`/trash/tasks/${taskId}`);
    return response.data;
  },

  permanentlyDeleteProject: async (projectId: string) => {
    const response = await api.delete<{ success: boolean; message: string }>(`/trash/projects/${projectId}`);
    return response.data;
  },

  emptyTrash: async () => {
    const response = await api.delete<{ success: boolean; message: string }>("/trash/empty");
    return response.data;
  },
};

export default trashService;
