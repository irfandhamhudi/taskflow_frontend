"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { useWorkspaceStore } from "../store/useWorkspaceStore";
import { toast } from "sonner";
import { Loader2, LayoutGrid, Building2, Rocket, Palette, Laptop, Book, Home, Star, Briefcase, GraduationCap, Heart, Zap } from "lucide-react";
import { IconRenderer } from "./ui/icon-renderer";

const AVAILABLE_ICONS = [
  "Building2",
  "Rocket",
  "Palette",
  "Laptop",
  "Book",
  "Home",
  "Star",
  "Briefcase",
  "GraduationCap",
  "Heart",
  "Zap",
  "LayoutGrid"
];

export function WorkspaceDialog({
  open,
  onOpenChange,
  workspace,
}: WorkspaceDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("Building2");
  const [type, setType] = useState("personal");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { createWorkspace, updateWorkspace } = useWorkspaceStore();

  const isEdit = !!workspace;

  useEffect(() => {
    if (workspace) {
      setName(workspace.name || "");
      setDescription(workspace.description || "");
      setIcon(workspace.icon || "Building2");
      setType(workspace.type || "personal");
    } else {
      setName("");
      setDescription("");
      setIcon("Building2");
      setType("personal");
    }
  }, [workspace, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Workspace name is required");
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEdit) {
        await updateWorkspace(workspace._id, { name, description, icon, type });
        toast.success("Workspace updated successfully");
      } else {
        const newWorkspace = await createWorkspace({ name, description, icon, type });
        if (newWorkspace) {
          useWorkspaceStore.getState().setActiveWorkspace(newWorkspace);
        }
        toast.success("Workspace created successfully");
      }
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEdit ? "Edit Workspace" : "Create Workspace"}</DialogTitle>
            <DialogDescription>
              {isEdit
                ? "Update your workspace details here."
                : "Add a new workspace to organize your projects."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="icon">Workspace Icon</Label>
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                   <div className="size-12 flex items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
                      <IconRenderer name={icon} className="size-6" />
                   </div>
                   <div className="flex-1 text-sm text-muted-foreground">
                      Choose an icon that represents your workspace.
                   </div>
                </div>
                <div className="w-fit grid grid-cols-7 md:grid-cols-8 gap-2 rounded-md bg-muted/5 ">
                  {AVAILABLE_ICONS.map((iconName) => (
                    <button
                      key={iconName}
                      type="button"
                      onClick={() => setIcon(iconName)}
                      className={`size-10 flex items-center justify-center rounded-md border transition-all hover:bg-primary/15 ${
                        icon === iconName 
                          ? "bg-primary/10 border-primary/30 text-primary ring-1 ring-primary/20" 
                          : "bg-background border-border text-muted-foreground"
                      }`}
                    >
                      <IconRenderer name={iconName} className="size-5" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Acme Corp"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="type">Workspace Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger id="type" className="w-full">
                  <SelectValue placeholder="Select workspace type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="personal">Personal Workspace</SelectItem>
                  <SelectItem value="team">Team / Department Workspace</SelectItem>
                  <SelectItem value="project">Project-Based Workspace</SelectItem>
                  <SelectItem value="client">Client / Guest Workspace</SelectItem>
                  <SelectItem value="enterprise">Organization / Enterprise Workspace</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Workspace for all Acme Corp projects"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-primary/10 text-primary border border-primary/20 hover:bg-primary/15 shadow-none font-semibold"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? "Save Changes" : "Create Workspace"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
