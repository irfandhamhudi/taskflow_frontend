"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Lock, Pencil, UsersRound, Globe } from "lucide-react";

import Picker, { Theme } from "emoji-picker-react";
import { useTheme } from "next-themes";

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "../ui/sheet";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { toast } from "sonner";
import { projectTaskService } from "../../services/projecTaskAPi";
import { formatDistanceToNow } from "date-fns";
import { useSocket } from "../../context/SocketContext";

import type { Project } from "../../types/project";

interface EditProjectSheetProps {
  project: Project;
  currentUserRole?: string;
  trigger?: React.ReactNode;
  onProjectUpdated?: (updatedProject: Partial<Project>) => void;
  children?: React.ReactNode;
}

interface RoleUpgradeRequest {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  requestedRole: string;
  message?: string;
  createdAt: string;
}

export default function EditProjectSheet({
  project,
  currentUserRole = 'editor',
  trigger,
  onProjectUpdated,
  children,
}: EditProjectSheetProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(project.name || "");
  const [description, setDescription] = useState(project.description || "");
  const [icon, setIcon] = useState(project.icon || "📁");
  const [visibility, setVisibility] = useState(project.visibility || "private");
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState<RoleUpgradeRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { socket } = useSocket();
  const { resolvedTheme } = useTheme();

  const fetchRequests = useCallback(async () => {
    setLoadingRequests(true);
    try {
      const data = await projectTaskService.getRoleUpgradeRequests(project._id);
      setRequests(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingRequests(false);
    }
  }, [project._id]);

  // Fetch requests if owner/admin
  useEffect(() => {
    if (open && (currentUserRole === 'owner' || currentUserRole === 'admin')) {
      fetchRequests();
    }
  }, [open, currentUserRole, fetchRequests]);

  // Real-time role requests
  useEffect(() => {
    if (!socket || !open || (currentUserRole !== 'owner' && currentUserRole !== 'admin')) return;

    const handleNewRequest = (data: { projectId: string; request: RoleUpgradeRequest }) => {
      if (data.projectId === project._id) {
        setRequests((prev) => {
          if (prev.some((r) => r._id === data.request._id)) return prev;
          return [data.request, ...prev];
        });
        toast.info(`New access request from ${data.request.user?.name || "a user"}`);
      }
    };

    const handleRequestHandled = (data: { projectId: string; requestId: string }) => {
      if (data.projectId === project._id) {
        setRequests((prev) => prev.filter((r) => r._id !== data.requestId));
      }
    };

    socket.on("role_upgrade_requested", handleNewRequest);
    socket.on("role_request_handled", handleRequestHandled);

    return () => {
      socket.off("role_upgrade_requested", handleNewRequest);
      socket.off("role_request_handled", handleRequestHandled);
    };
  }, [socket, open, currentUserRole, project._id]);

  const handleHandleRequest = async (requestId: string, action: 'approve' | 'reject') => {
    try {
      await projectTaskService.handleRoleUpgradeRequest(project._id, requestId, action);
      setRequests((prev: RoleUpgradeRequest[]) => prev.filter(r => r._id !== requestId));
      
      // Jika approve, mungkin perlu refresh project members atau role
      if (action === 'approve' && onProjectUpdated) {
        // Fetch project terbaru untuk update member list di parent jika diperlukan
        const updated = await projectTaskService.getProject(project._id);
        onProjectUpdated(updated);
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Reset form setiap kali sheet dibuka atau project berubah
  useEffect(() => {
    if (open) {
      setName(project.name || "");
      setDescription(project.description || "");
      setIcon(project.icon || "📁");
      setVisibility(project.visibility || "private");
    }
  }, [open, project, setName, setDescription, setIcon, setVisibility]);

  // Scroll to top when sheet opens or tab changes
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTo({ top: 0, behavior: "instant" });
        }
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [open, activeTab]);

  const handleUpdateProject = async () => {
    if (!name.trim()) {
      toast.error("Project name is required");
      return;
    }

    setLoading(true);

    try {
      const updateData = {
        name: name.trim(),
        description: description.trim() || undefined,
        icon,
        visibility,
      };

      const updatedProject = await projectTaskService.updateProject(
        project._id,
        updateData
      );

      setOpen(false);

      if (onProjectUpdated) {
        onProjectUpdated(updatedProject);
      }

    } catch {
      // handled in service
    } finally {
      setLoading(false);
    }
  };


  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {children || trigger || (
          <Button variant="ghost" size="icon" title="Edit project">
            <Pencil className="h-4 w-4" />
          </Button>
        )}
      </SheetTrigger>

      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto p-0" ref={scrollContainerRef}>
        <SheetHeader className="p-11 pb-4">
          <SheetTitle className="text-2xl font-bold">Project Settings</SheetTitle>
          <SheetDescription>
            Manage your project details and access requests.
          </SheetDescription>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start rounded-none border-b bg-transparent px-11 h-12">
            <TabsTrigger 
              value="details" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none h-12 data-[state=active]:text-primary font-semibold"
            >
              Details
            </TabsTrigger>
            {(currentUserRole === 'owner' || currentUserRole === 'admin') && (
              <TabsTrigger 
                value="requests" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none h-12 data-[state=active]:text-primary font-semibold"
              >
                Requests {requests.length > 0 && <span className="ml-2 rounded bg-primary px-1.5 py-0.5 text-[10px] text-primary-foreground">{requests.length}</span>}
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="details" className="p-11 pt-0 mt-8 space-y-6">
            {/* Project Name */}
            <div className="space-y-2">
              <Label className="text-sm font-medium" htmlFor="name">
                Project Name <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="name"
                placeholder="Enter project name..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                rows={1}
                className="resize-none"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label className="text-sm font-medium" htmlFor="description">
                Description
              </Label>
              <Textarea
                id="description"
                placeholder="Describe this project (optional)..."
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={loading}
              />
            </div>

            {/* Access / Visibility */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Access / Visibility</Label>
              <div className="grid grid-cols-1 gap-3">
                {[
                  { id: 'private', label: 'Private', desc: 'Member only', icon: Lock },
                  { id: 'limited', label: 'Limited', desc: 'Viewable by organization', icon: UsersRound },
                  { id: 'public', label: 'Public', desc: 'Viewable by everyone', icon: Globe },
                ].map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = visibility === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                    onClick={() => setVisibility(opt.id as "private" | "limited" | "public")}
                      className={`flex items-start gap-3 rounded border p-3 text-left transition-all hover:bg-muted/50 ${
                        isSelected ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'bg-transparent'
                      }`}
                    >
                      <Icon className={`h-5 w-5 mt-0.5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                      <div>
                        <p className={`text-sm font-medium ${isSelected ? 'text-primary' : ''}`}>{opt.label}</p>
                        <p className="text-xs text-muted-foreground">{opt.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Project Icon */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Project Icon</Label>
              <div className="flex flex-col items-start gap-4">
                <div className="text-4xl">{icon}</div>
                <Picker
                  onEmojiClick={(emojiData) => setIcon(emojiData.emoji)}
                  theme={resolvedTheme === "dark" ? Theme.DARK : Theme.LIGHT}
                  width="100%"
                  height="350px"
                  previewConfig={{ showPreview: false }}
                  searchPlaceholder="Search emoji..."
                />
              </div>
            </div>

            <div className="pt-6 border-t flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateProject}
                disabled={loading || !name.trim()}
                className="bg-primary/10 text-primary border border-primary/20 hover:bg-primary/15 shadow-none font-semibold"
              >
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="requests" className="p-11 pt-0 mt-8">
            <div className="space-y-4">
              {loadingRequests ? (
                <div className="text-center py-8 text-muted-foreground">Loading requests...</div>
              ) : requests.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No pending requests</div>
              ) : (
                requests.map((req) => (
                  <div key={req._id} className="flex flex-col gap-3 rounded border p-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={req.user?.avatar} />
                        <AvatarFallback>{req.user?.name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{req.user?.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{req.user?.email}</p>
                      </div>
                      <div className="text-right">
                        <div className="inline-flex items-center rounded bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary uppercase">
                          {req.requestedRole}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(req.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    {req.message && (
                      <p className="text-sm text-muted-foreground bg-muted/30 p-2 rounded italic">
                        "{req.message}"
                      </p>
                    )}
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => handleHandleRequest(req._id, 'reject')}
                      >
                        Reject
                      </Button>
                      <Button 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleHandleRequest(req._id, 'approve')}
                      >
                        Approve
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}




