import { useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { useWorkspaceStore } from '../store/useWorkspaceStore';
import { useProjectStore } from '../store/useProjectStore';
import { toast } from 'sonner';

export const useProjectSocket = () => {
  const { socket, joinWorkspace, leaveWorkspace } = useSocket();
  const activeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);
  
  // Use refs for actions to keep them out of the dependency array and avoid re-runs
  const actionsRef = useRef({
    addProject: useProjectStore.getState().addProject,
    updateProject: useProjectStore.getState().updateProject,
    removeProject: useProjectStore.getState().removeProject,
    archiveProject: useProjectStore.getState().archiveProject,
  });

  // Keep refs updated (though Zustand actions are usually stable)
  useEffect(() => {
    actionsRef.current = {
      addProject: useProjectStore.getState().addProject,
      updateProject: useProjectStore.getState().updateProject,
      removeProject: useProjectStore.getState().removeProject,
      archiveProject: useProjectStore.getState().archiveProject,
    };
  });

  useEffect(() => {
    if (!socket || !activeWorkspaceId) return;

    joinWorkspace(activeWorkspaceId);

    const handleProjectCreated = (data: { project: any }) => {
      if (data.project.workspaceId === activeWorkspaceId) {
        actionsRef.current.addProject(data.project);
        toast.success(`New project created: ${data.project.name}`);
      }
    };

    const handleProjectUpdated = (data: { projectId: string; project: any }) => {
      actionsRef.current.updateProject(data.projectId, data.project);
    };

    const handleProjectDeleted = (data: { projectId: string; projectName: string; deletedByName?: string }) => {
      actionsRef.current.removeProject(data.projectId);
      toast.info(`Project "${data.projectName}" deleted by ${data.deletedByName || "someone"}`);
    };

    const handleProjectArchived = (data: { projectId: string; isArchived: boolean }) => {
      actionsRef.current.archiveProject(data.projectId, data.isArchived);
    };

    socket.on("project_created", handleProjectCreated);
    socket.on("project_updated", handleProjectUpdated);
    socket.on("project_deleted", handleProjectDeleted);
    socket.on("project_archived", handleProjectArchived);

    return () => {
      socket.off("project_created", handleProjectCreated);
      socket.off("project_updated", handleProjectUpdated);
      socket.off("project_deleted", handleProjectDeleted);
      socket.off("project_archived", handleProjectArchived);
      leaveWorkspace(activeWorkspaceId);
    };
  }, [socket, activeWorkspaceId, joinWorkspace, leaveWorkspace]); // Minimal dependencies
};
