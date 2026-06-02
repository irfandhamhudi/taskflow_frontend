"use client";

import * as React from "react";
import { ChevronsUpDown, Plus, LayoutGrid } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "../components/ui/sidebar";
import { useWorkspaceStore } from "../store/useWorkspaceStore";
import { useEffect, useState } from "react";
import { WorkspaceDialog } from "./workspace-dialog";
import { Settings, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { IconRenderer } from "./ui/icon-renderer";
import { useAuth } from "../context/AuthContext";

export function WorkspaceSwitcher() {
  const { isMobile } = useSidebar();
  const { 
    workspaces, 
    activeWorkspace, 
    fetchWorkspaces, 
    hasFetchedWorkspaces,
    setActiveWorkspace,
    deleteWorkspace 
  } = useWorkspaceStore();
  const { user } = useAuth();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingWorkspace, setEditingWorkspace] = useState<any>(null);

  useEffect(() => {
    if (!hasFetchedWorkspaces) {
      fetchWorkspaces();
    }
  }, [fetchWorkspaces, hasFetchedWorkspaces]);

  const handleCreateNew = () => {
    setEditingWorkspace(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (workspace: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingWorkspace(workspace);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this workspace? All projects within it will be moved or deleted.")) {
      try {
        await deleteWorkspace(id);
        toast.success("Workspace deleted successfully");
      } catch (error) {
        toast.error("Failed to delete workspace");
      }
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "personal": return "Personal Workspace";
      case "team": return "Team Workspace";
      case "project": return "Project Workspace";
      case "client": return "Client Workspace";
      case "enterprise": return "Enterprise Workspace";
      default: return "Workspace";
    }
  };

  if (!activeWorkspace) return null;

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <div className="flex aspect-square size-8 items-center justify-center rounded bg-primary/10 text-primary border border-primary/20">
                  <IconRenderer name={activeWorkspace.icon} className="size-4.5" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {activeWorkspace.name}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {getTypeLabel(activeWorkspace.type)}
                  </span>
                </div>
                <ChevronsUpDown className="ml-auto" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
              align="start"
              side={isMobile ? "bottom" : "right"}
              sideOffset={4}
            >
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Workspaces
              </DropdownMenuLabel>
              {workspaces.map((workspace) => (
                <DropdownMenuItem
                  key={workspace._id}
                  onClick={() => setActiveWorkspace(workspace)}
                  className="gap-2 p-2 group/item cursor-pointer"
                >
                  <div className="flex size-6 items-center justify-center rounded-sm bg-primary/10 text-primary border border-primary/20">
                    <IconRenderer name={workspace.icon} className="size-3.5" />
                  </div>
                  <span className="flex-1 truncate">{workspace.name}</span>
                  <div className="flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                    {(workspace.owner?._id === user?._id || workspace.owner === user?._id) && (
                      <>
                        <button
                          onClick={(e) => handleEdit(workspace, e)}
                          className="p-1 hover:bg-accent rounded"
                        >
                          <Settings className="size-3 text-muted-foreground" />
                        </button>
                        {!workspace.isDefault && (
                          <button
                            onClick={(e) => handleDelete(workspace._id, e)}
                            className="p-1 hover:bg-destructive/10 hover:text-destructive rounded"
                          >
                            <Trash2 className="size-3" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="gap-2 p-2 cursor-pointer"
                onClick={handleCreateNew}
              >
                <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                  <Plus className="size-4" />
                </div>
                <div className="font-medium text-muted-foreground">Add workspace</div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <WorkspaceDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen} 
        workspace={editingWorkspace}
      />
    </>
  );
}
