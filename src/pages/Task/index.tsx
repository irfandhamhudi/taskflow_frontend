'use client';


import { Lock, UsersRound, Globe } from 'lucide-react';
import { useProjectMainData } from '../../hooks/use-ProjectMain';
import ProjectHeader from '../../components/features/project/project-header';
import ProjectToolbar from '../../components/features/project/project-toolbar';
import MainContent from '../../components/features/project/main-context';
import TaskDetailSheet from '../../components/projects/task-detail';
import EditTaskSheet from '../../components/projects/edit-task-sheet';
import { SidebarProvider, SidebarInset } from '../../components/ui/sidebar';
import { AppSidebar } from '../../components/app-sidebar';
import { SiteHeader } from '../../components/site-header';


export default function ProjectPage() {
  const data = useProjectMainData();

  const getVisibilityIcon = () => {
    switch (data.projectDetail?.visibility) {
      case 'public':
        return <Globe className="w-6 h-6 text-muted-foreground" title="Public" />;
      case 'limited':
        return <UsersRound className="w-6 h-6 text-muted-foreground" title="Limited" />;
      default:
        return <Lock className="w-6 h-6 text-muted-foreground" title="Private" />;
    }
  };

  const visibilityIcon = getVisibilityIcon();

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset className="overflow-x-hidden">
        <SiteHeader />
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex flex-1 flex-col gap-6 p-4 md:gap-8 md:p-10 overflow-hidden">
            <ProjectHeader 
              projectIcon={data.projectIcon} 
              projectName={data.projectName} 
              projectDescription={data.projectDescription} 
              visibilityIcon={visibilityIcon} 
              membersList={data.membersList} 
              currentUserRole={data.currentUserRole} 
              projectDetail={data.projectDetail} 
              shareUrl={data.shareUrl} 
              copied={data.copied} 
              isDeleting={data.isDeleting} 
              onDeleteProject={data.handleDeleteProject} 
              onUpdateRole={data.handleUpdateRole} 
              onCopyLink={data.handleCopyLink}
              onProjectUpdated={data.handleProjectUpdatedFromSheet} 
              onInviteMember={data.handleInviteMember}
              onRemoveMember={data.handleRemoveMember}
              onToggleFavorite={data.handleToggleFavorite}
            />
            <ProjectToolbar 
              view={data.view} 
              onViewChange={data.setView} 
              isCreateOpen={data.isCreateOpen} 
              onCreateOpenChange={data.setIsCreateOpen} 
              currentUserRole={data.currentUserRole} 
              projectId={data.projectId!}
              onCreateTask={data.handleCreateTask} // ← kirim handler baru

            />
            <MainContent 
              view={data.view} 
              tasks={data.tasks} 
              columns={data.columns} 
              currentUserRole={data.currentUserRole} 
              onOpenDetail={data.handleOpenDetail} 
              onOpenEdit={(task) => data.setEditingTask(task)} 
              onDeleteTask={data.handleDeleteTask} 
              onUnarchive={data.handleUnarchive} 
              onDragEnd={data.handleDragEnd} 
              setTasks={data.setTasks}
            />
          </div>
        </div>
        <TaskDetailSheet 
          task={data.selectedTask} 
          onClose={data.handleCloseDetail} 
          setTasks={data.setTasks} // ← harus setTasks (benar) 
        />
        <EditTaskSheet 
          task={data.editingTask} 
          onClose={() => data.setEditingTask(null)} 
          setTasks={data.setTasks} // ← harus setTasks
          projectId={data.projectId} 
          usersRole={data.currentUserRole}
           
        />
      </SidebarInset>
    </SidebarProvider>
  );
}
