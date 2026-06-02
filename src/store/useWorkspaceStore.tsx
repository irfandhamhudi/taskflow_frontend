import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../utils/api';

interface Workspace {
  _id: string;
  name: string;
  description?: string;
  icon: string;
  owner: any;
  members: any[];
  isDefault: boolean;
  type: "personal" | "team" | "project" | "client" | "enterprise";
}

interface WorkspaceStore {
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  activeWorkspaceId: string | null;
  loading: boolean;
  hasFetchedWorkspaces: boolean;
  setWorkspaces: (workspaces: Workspace[]) => void;
  setActiveWorkspace: (workspace: Workspace | null) => void;
  fetchWorkspaces: () => Promise<void>;
  createWorkspace: (data: { name: string; description?: string; icon?: string; type?: string }) => Promise<void>;
  updateWorkspace: (id: string, data: { name?: string; description?: string; icon?: string; type?: string }) => Promise<void>;
  deleteWorkspace: (id: string) => Promise<void>;
}

export const useWorkspaceStore = create<WorkspaceStore>()(
  persist(
    (set, get) => ({
      workspaces: [],
      activeWorkspace: null,
      activeWorkspaceId: null,
      loading: false,
      hasFetchedWorkspaces: false,

      setWorkspaces: (workspaces) => set({ workspaces, hasFetchedWorkspaces: true }),

      setActiveWorkspace: (workspace) => set({ 
        activeWorkspace: workspace,
        activeWorkspaceId: workspace?._id || null 
      }),

      fetchWorkspaces: async () => {
        set({ loading: true });
        try {
          const res = await api.get('/workspaces');
          if (res.data.success) {
            const workspaces = res.data.data;
            const { activeWorkspaceId } = get();
            
            // Cari workspace yang aktif berdasarkan ID yang tersimpan, 
            // atau default, atau yang pertama.
            const currentActive = workspaces.find((w: Workspace) => w._id === activeWorkspaceId) || 
                                 workspaces.find((w: Workspace) => w.isDefault) || 
                                 workspaces[0];
            
            const newActiveId = currentActive?._id || null;

            set({ 
              workspaces, 
              hasFetchedWorkspaces: true,
              activeWorkspace: currentActive || null,
              activeWorkspaceId: newActiveId
            });
          }
        } catch (error) {
          console.error('Fetch workspaces error:', error);
          set({ hasFetchedWorkspaces: true }); 
        } finally {
          set({ loading: false });
        }
      },

      createWorkspace: async (data) => {
        try {
          const res = await api.post('/workspaces', data);
          if (res.data.success) {
            const newWorkspace = res.data.data;
            set((state) => ({
              workspaces: [...state.workspaces, newWorkspace],
            }));
            return newWorkspace;
          }
        } catch (error) {
          console.error('Create workspace error:', error);
          throw error;
        }
      },

      updateWorkspace: async (id, data) => {
        try {
          const res = await api.put(`/workspaces/${id}`, data);
          if (res.data.success) {
            const updatedWorkspace = res.data.data;
            set((state) => ({
              workspaces: state.workspaces.map((w) =>
                w._id === id ? updatedWorkspace : w
              ),
              activeWorkspace:
                state.activeWorkspace?._id === id
                  ? updatedWorkspace
                  : state.activeWorkspace,
              activeWorkspaceId: 
                state.activeWorkspaceId === id 
                  ? updatedWorkspace._id 
                  : state.activeWorkspaceId
            }));
          }
        } catch (error) {
          console.error('Update workspace error:', error);
          throw error;
        }
      },

      deleteWorkspace: async (id) => {
        try {
          const res = await api.delete(`/workspaces/${id}`);
          if (res.data.success) {
            const { activeWorkspaceId, workspaces } = get();
            const newWorkspaces = workspaces.filter((w) => w._id !== id);
            
            set({ workspaces: newWorkspaces });

            if (activeWorkspaceId === id) {
              const defaultWs = newWorkspaces.find((w) => w.isDefault) || newWorkspaces[0];
              set({ 
                activeWorkspace: defaultWs || null,
                activeWorkspaceId: defaultWs?._id || null
              });
            }
          }
        } catch (error) {
          console.error('Delete workspace error:', error);
          throw error;
        }
      },
    }),
    {
      name: 'workspace-storage',
      partialize: (state) => ({ activeWorkspaceId: state.activeWorkspaceId }),
    }
  )
);
