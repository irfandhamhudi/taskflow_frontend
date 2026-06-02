import React, { useEffect, useState } from "react";
import {
  Trash2,
  RotateCcw,
  FileText,
  Folder,
  Info,
  RefreshCw,
  MoreVertical
} from "lucide-react";
import trashService from "../../services/trashService";
import type { TrashData, TrashedTask, TrashedProject } from "../../services/trashService";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../../components/ui/alert-dialog";
// import { ScrollArea } from "../../components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";

import { SidebarProvider, SidebarInset } from "../../components/ui/sidebar";
import { AppSidebar } from "../../components/app-sidebar";
import { SiteHeader } from "../../components/site-header";
import { TrashSkeleton } from "./components/trash-skeleton";

const TrashPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<TrashData>({ tasks: [], projects: [] });
  const [activeTab, setActiveTab] = useState("all");

  const fetchTrash = async () => {
    setLoading(true);
    try {
      const trashData = await trashService.getTrashItems();
      setData(trashData);
    } catch (error) {
      toast.error("Failed to fetch trash items");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrash();
  }, []);

  const handleRestoreTask = async (taskId: string) => {
    try {
      await trashService.restoreTask(taskId);
      toast.success("Task restored");
      fetchTrash();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to restore task");
    }
  };

  const handleRestoreProject = async (projectId: string) => {
    try {
      await trashService.restoreProject(projectId);
      toast.success("Project restored");
      fetchTrash();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to restore project");
    }
  };

  const handlePermanentDeleteTask = async (taskId: string) => {
    try {
      await trashService.permanentlyDeleteTask(taskId);
      toast.success("Task deleted permanently");
      fetchTrash();
    } catch (error) {
      toast.error("Failed to delete task");
    }
  };

  const handlePermanentDeleteProject = async (projectId: string) => {
    try {
      await trashService.permanentlyDeleteProject(projectId);
      toast.success("Project deleted permanently");
      fetchTrash();
    } catch (error) {
      toast.error("Failed to delete project");
    }
  };

  const handleEmptyTrash = async () => {
    try {
      await trashService.emptyTrash();
      toast.success("Trash emptied");
      fetchTrash();
    } catch (error) {
      toast.error("Failed to empty trash");
    }
  };

  const isEmpty = data.tasks.length === 0 && data.projects.length === 0;

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col overflow-hidden bg-muted/10">
          <div className="flex-1 overflow-auto">
            <div className="container mx-auto p-6 md:p-6 lg:p-8 max-w-6xl animate-in fade-in duration-500">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                    Trash Bin
                  </h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    Items in trash can be restored or deleted permanently.
                  </p>
                </div>

                {!isEmpty && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="shadow-lg shadow-destructive/20 hover:shadow-destructive/40 transition-all">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Empty Trash
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete all items in your trash.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleEmptyTrash} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          Empty Trash
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>

              {loading ? (
                <TrashSkeleton />
              ) : isEmpty ? (
                <Card className="border-dashed border-2 bg-muted/30 h-[400px] flex flex-col items-center justify-center text-center p-8">
                  <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6 shadow-inner">
                    <Trash2 className="w-10 h-10 text-muted-foreground/50" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Your trash is empty</h3>
                  <p className="text-muted-foreground max-w-sm mb-6">
                    When you delete tasks or projects, they'll appear here for a while before being permanently removed.
                  </p>
                  <Button onClick={fetchTrash} variant="outline" size="sm" className="rounded-full">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                </Card>
              ) : (
                <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
                  <div className="flex items-center justify-between mb-6">
                    <TabsList className="bg-muted/50 p-1 rounded-xl">
                      <TabsTrigger value="all" className="rounded-lg px-6">All Items</TabsTrigger>
                      <TabsTrigger value="projects" className="rounded-lg px-6">Projects ({data.projects.length})</TabsTrigger>
                      <TabsTrigger value="tasks" className="rounded-lg px-6">Tasks ({data.tasks.length})</TabsTrigger>
                    </TabsList>

                    <div className="hidden md:flex items-center text-xs text-muted-foreground bg-muted/30 px-3 py-1 rounded-full border">
                      <Info className="w-3 h-3 mr-1.5" />
                      Items are kept here temporarily
                    </div>
                  </div>

                  <TabsContent value="all" className="mt-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {data.projects.map((project) => (
                        <ProjectTrashCard
                          key={project._id}
                          project={project}
                          onRestore={() => handleRestoreProject(project._id)}
                          onDelete={() => handlePermanentDeleteProject(project._id)}
                        />
                      ))}
                      {data.tasks.map((task) => (
                        <TaskTrashCard
                          key={task._id}
                          task={task}
                          onRestore={() => handleRestoreTask(task._id)}
                          onDelete={() => handlePermanentDeleteTask(task._id)}
                        />
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="projects" className="mt-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {data.projects.map((project) => (
                        <ProjectTrashCard
                          key={project._id}
                          project={project}
                          onRestore={() => handleRestoreProject(project._id)}
                          onDelete={() => handlePermanentDeleteProject(project._id)}
                        />
                      ))}
                      {data.projects.length === 0 && (
                        <div className="col-span-full py-20 text-center text-muted-foreground bg-muted/10 rounded-2xl border border-dashed">
                          No trashed projects found
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="tasks" className="mt-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {data.tasks.map((task) => (
                        <TaskTrashCard
                          key={task._id}
                          task={task}
                          onRestore={() => handleRestoreTask(task._id)}
                          onDelete={() => handlePermanentDeleteTask(task._id)}
                        />
                      ))}
                      {data.tasks.length === 0 && (
                        <div className="col-span-full py-20 text-center text-muted-foreground bg-muted/10 rounded-2xl border border-dashed">
                          No trashed tasks found
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              )}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

const ProjectTrashCard: React.FC<{
  project: TrashedProject;
  onRestore: () => void;
  onDelete: () => void;
}> = ({ project, onRestore, onDelete }) => (
  <Card className="overflow-hidden group hover:shadow-md transition-all duration-300 border-l-4 border-l-blue-500">
    <CardContent className="p-5">
      <div className="flex justify-between items-start">
        <div className="flex gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-2xl shadow-sm group-hover:scale-110 transition-transform">
            {project.icon || "📁"}
          </div>
          <div>
            <Badge variant="outline" className="mb-1 text-[10px] uppercase tracking-wider font-bold text-blue-600 bg-blue-50 border-blue-200">
              Project
            </Badge>
            <h4 className="font-bold text-lg line-clamp-1">{project.name}</h4>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              Deleted {format(new Date(project.deletedAt), "MMM d, yyyy")}
            </p>
          </div>
        </div>
        <ActionMenu onRestore={onRestore} onDelete={onDelete} name={project.name} />
      </div>
    </CardContent>
  </Card>
);

const TaskTrashCard: React.FC<{
  task: TrashedTask;
  onRestore: () => void;
  onDelete: () => void;
}> = ({ task, onRestore, onDelete }) => (
  <Card className="overflow-hidden group hover:shadow-md transition-all duration-300 border-l-4 border-l-amber-500">
    <CardContent className="p-5">
      <div className="flex justify-between items-start">
        <div className="flex gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
            <FileText className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <Badge variant="outline" className="mb-1 text-[10px] uppercase tracking-wider font-bold text-amber-600 bg-amber-50 border-amber-200">
              Task
            </Badge>
            <h4 className="font-bold text-lg line-clamp-1">{task.title}</h4>
            <div className="flex flex-col gap-1 mt-1">
              <p className="text-[10px] text-muted-foreground flex items-center">
                <Folder className="w-3 h-3 mr-1" />
                {task.projectId?.name || "No Project"}
              </p>
              <p className="text-[10px] text-muted-foreground">
                Deleted {format(new Date(task.deletedAt), "MMM d, yyyy")}
              </p>
            </div>
          </div>
        </div>
        <ActionMenu onRestore={onRestore} onDelete={onDelete} name={task.title} />
      </div>
    </CardContent>
  </Card>
);

const ActionMenu: React.FC<{
  onRestore: () => void;
  onDelete: () => void;
  name: string;
}> = ({ onRestore, onDelete, name }) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted">
        <MoreVertical className="w-4 h-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="w-48 p-1 rounded-xl">
      <DropdownMenuItem onClick={onRestore} className="rounded-lg cursor-pointer">
        <RotateCcw className="w-4 h-4 mr-2 text-green-600" />
        Restore Item
      </DropdownMenuItem>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <div className="flex items-center px-2 py-1.5 text-sm rounded-lg cursor-pointer hover:bg-destructive/10 text-destructive outline-none transition-colors">
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Forever
          </div>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Permanently?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete "<strong>{name}</strong>"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete Forever
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DropdownMenuContent>
  </DropdownMenu>
);

export default TrashPage;
