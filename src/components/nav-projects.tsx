"use client";

import { useState, useEffect, useRef } from "react";
import {
  Plus,
  ChevronDown,
  ChevronUp,
  Lock,
  UsersRound,
  Globe,
  Star,
} from "lucide-react";

import Picker, { Theme } from "emoji-picker-react";
import { useTheme } from "next-themes";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from "../components/ui/sidebar";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetTrigger,
} from "../components/ui/sheet";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../components/ui/collapsible";

import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import api from "../utils/api";
import { useProjectStore, sortProjectsByNewest } from "../store/useProjectStore";
import { useWorkspaceStore } from "../store/useWorkspaceStore";
import { useLocation } from "react-router-dom";
import { ScrollArea } from "../components/ui/scroll-area";

export function NavProjects() {
  const { isMobile, state } = useSidebar();
  const { resolvedTheme } = useTheme();
  const [openCreateSheet, setOpenCreateSheet] = useState(false);
  const [showMore, setShowMore] = useState(false);

  const { projects, addProject, setProjects } = useProjectStore();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("📁");
  const [visibility, setVisibility] = useState<"private" | "limited" | "public">("private");
  const [templateKey, setTemplateKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const { activeWorkspace } = useWorkspaceStore();

  const templates = [
    { id: 'software_development', name: 'Software Development', icon: '💻', desc: 'Agile workflow with Backlog, Doing, Testing, Done.' },
    { id: 'marketing_campaign', name: 'Marketing Campaign', icon: '📣', desc: 'Track ideas, planning, and execution.' },
    { id: 'personal_todo', name: 'Personal TODO', icon: '📝', desc: 'Simple list for your daily tasks.' },
  ];

  const location = useLocation();
  const currentPath = location.pathname;

  const sortedProjects = sortProjectsByNewest(projects);

  const MAX_VISIBLE_PROJECTS = 4;
  const visibleProjects = sortedProjects.slice(0, MAX_VISIBLE_PROJECTS);
  const hiddenProjects = sortedProjects.slice(MAX_VISIBLE_PROJECTS);
  const hasMore = hiddenProjects.length > 0;

  useEffect(() => {
    const fetchProjects = async () => {
      if (!activeWorkspace) return;
      try {
        const res = await api.get("/projects", {
          params: { workspaceId: activeWorkspace._id }
        });
        if (res.data.success) {
          const sorted = sortProjectsByNewest(res.data.data);
          setProjects(sorted);
        }
      } catch (err: unknown) {
        toast.error("Failed to load projects");
        console.error(err);
      }
    };

    fetchProjects();
  }, [setProjects, activeWorkspace]);

  const resetForm = () => {
    setName("");
    setDescription("");
    setIcon("📁");
    setVisibility("private");
    setTemplateKey(null);
  };

  // Scroll to top when sheet opens
  useEffect(() => {
    if (openCreateSheet) {
      const timer = setTimeout(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTo({ top: 0, behavior: "instant" });
        }
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [openCreateSheet]);

  const handleCreateProject = async () => {
    if (!name.trim() && !templateKey) {
      toast.error("Project name is required");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/projects", {
        name: name.trim() || undefined,
        description: description.trim() || undefined,
        icon,
        visibility,
        templateKey: templateKey || undefined,
        workspaceId: activeWorkspace?._id,
      });

      const newProject = response.data.data;
      addProject(newProject);

      toast.success(response.data.message);
      resetForm();
      setOpenCreateSheet(false);
    } catch (error: unknown) {
      let message = "Failed to create project";
      if (error instanceof Error) message = error.message;
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const favoriteProjects = projects.filter(p => p.isFavorite);

  if (favoriteProjects.length === 0) return null;

  return (
    <>
      <SidebarSeparator className="hidden group-data-[collapsible=icon]:block mx-0" />
      <Collapsible defaultOpen={true} className="group/collapsible mb-2 group-data-[collapsible=icon]:-translate-y-10">
      <SidebarGroup>
        <div className="flex items-center justify-between px-3 py-2">
          <SidebarGroupLabel className="cursor-default flex items-center gap-2">
            <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
            Favorites
          </SidebarGroupLabel>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 p-0 opacity-70 hover:opacity-100 data-[state=open]:rotate-180"
            >
              <ChevronDown className="h-4 w-4 transition-transform" />
              <span className="sr-only">Toggle Favorites</span>
            </Button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent className="overflow-hidden">
          <SidebarMenu className="w-full px-2 py-1 gap-3">
            {favoriteProjects.map((project) => {
              const isActive = currentPath === `/projects/${project._id}`;
              return (
                <SidebarMenuItem key={`fav-${project._id}`}>
                  <SidebarMenuButton
                    size="default"
                    tooltip={project.name}
                    className={isActive ? " bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary font-semibold" : "text-sidebar-foreground"}
                    asChild
                  >
                    <Link to={`/projects/${project._id}`}>
                      <div className="flex group-data-[collapsible=icon]:-translate-x-0.5 size-5 items-center justify-center text-lg">
                        {project.icon}
                      </div>
                      <span className="truncate">{project.name}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
    </>
  );
}
