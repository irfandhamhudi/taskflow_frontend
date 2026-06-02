"use client";

import { useState, useRef, useEffect } from "react";
import { Plus, Lock, UsersRound, Globe } from "lucide-react";
import Picker, { Theme } from "emoji-picker-react";
import { useTheme } from "next-themes";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetTrigger,
} from "../ui/sheet";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { toast } from "sonner";
import api from "../../utils/api";
import { useProjectStore } from "../../store/useProjectStore";
import { useWorkspaceStore } from "../../store/useWorkspaceStore";

interface CreateProjectSheetProps {
  children?: React.ReactNode;
}

export function CreateProjectSheet({ children }: CreateProjectSheetProps) {
  const { resolvedTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const { addProject } = useProjectStore();
  const { activeWorkspaceId } = useWorkspaceStore();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("📁");
  const [visibility, setVisibility] = useState<"private" | "limited" | "public">("private");
  const [templateKey, setTemplateKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const templates = [
    { id: 'software_development', name: 'Software Development', icon: '💻', desc: 'Agile workflow with Backlog, Doing, Testing, Done.' },
    { id: 'marketing_campaign', name: 'Marketing Campaign', icon: '📣', desc: 'Track ideas, planning, and execution.' },
    { id: 'personal_todo', name: 'Personal TODO', icon: '📝', desc: 'Simple list for your daily tasks.' },
  ];

  const resetForm = () => {
    setName("");
    setDescription("");
    setIcon("📁");
    setVisibility("private");
    setTemplateKey(null);
  };

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTo({ top: 0, behavior: "instant" });
        }
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [open]);

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
        workspaceId: activeWorkspaceId,
      });

      const newProject = response.data.data;
      addProject(newProject);

      toast.success(response.data.message);
      resetForm();
      setOpen(false);
    } catch (error: unknown) {
      let message = "Failed to create project";
      if (error instanceof Error) message = error.message;
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {children || (
          <Button size="sm" className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/15 shadow-none font-semibold">
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        )}
      </SheetTrigger>

      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto p-11" ref={scrollContainerRef}>
        <SheetHeader className="border-b pb-4">
          <SheetTitle className="text-2xl font-bold">Create New Project</SheetTitle>
          <SheetDescription>
            Fill in the details for your new project. You will automatically become the owner.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-8 space-y-6">
          <div className="space-y-3">
            <Label className="text-sm font-medium">Start from a Template (Optional)</Label>
            <div className="grid grid-cols-1 gap-2">
              {templates.map((t) => {
                const isSelected = templateKey === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        setTemplateKey(null);
                      } else {
                        setTemplateKey(t.id);
                        setIcon(t.icon);
                      }
                    }}
                    className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-all hover:bg-muted/50 ${
                      isSelected ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'bg-transparent border-border'
                    }`}
                  >
                    <span className="text-2xl">{t.icon}</span>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-semibold truncate ${isSelected ? 'text-primary' : ''}`}>{t.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{t.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium" htmlFor="name">
              Project Name <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="name"
              placeholder={templateKey ? "Or use custom name..." : "Enter project name..."}
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              rows={1}
            />
          </div>

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
        </div>

        <SheetFooter className="mt-8 border-t pt-6">
          <div className="w-full flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                resetForm();
                setOpen(false);
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateProject} 
              disabled={loading || (!name.trim() && !templateKey)}
              className="bg-primary/10 text-primary border border-primary/20 hover:bg-primary/15 shadow-none font-semibold"
            >
              {loading ? "Creating..." : "Create Project"}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
