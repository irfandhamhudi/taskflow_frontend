import { SidebarProvider, SidebarInset } from '../../components/ui/sidebar';
import { AppSidebar } from '../../components/app-sidebar';
import { SiteHeader } from '../../components/site-header';
import { useProjectStore, sortProjectsByNewest } from '../../store/useProjectStore';
import { ProjectHeader } from './components/project-header';
import { ProjectList } from './components/project-list';
import { ProjectListSkeleton } from './components/project-skeleton';
import { useEffect, useState } from 'react';
import api from '../../utils/api';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';
import { toast } from 'sonner';

export default function ProjectsPage() {
  const { projects, setProjects } = useProjectStore();
  const [isLoading, setIsLoading] = useState(true);

  const { activeWorkspace } = useWorkspaceStore();


  useEffect(() => {
    const fetchProjects = async () => {
      const workspaceId = activeWorkspace?._id;
      if (!workspaceId) return;

      setIsLoading(true);
      try {
        const res = await api.get("/projects", {
          params: { workspaceId: workspaceId }
        });
        if (res.data.success) {
          const sorted = sortProjectsByNewest(res.data.data);
          setProjects(sorted);
        }
      } catch (err: unknown) {
        toast.error("Failed to load projects");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, [setProjects, activeWorkspace?._id]);

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-auto">
            <div className="container mx-auto p-6 md:p-6 lg:p-8">
              <div className="flex flex-col gap-8">
                <ProjectHeader />
                {isLoading ? (
                  <ProjectListSkeleton />
                ) : (
                  <ProjectList projects={projects} />
                )}
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
