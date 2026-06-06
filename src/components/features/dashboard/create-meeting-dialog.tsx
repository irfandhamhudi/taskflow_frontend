import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "../../ui/dialog";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Textarea } from "../../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";
import { meetingService } from "../../../services/meetingService";
import { useProjectStore } from "../../../store/useProjectStore.tsx";
import { toast } from "sonner";
import { Plus, Video, Layout } from "lucide-react";

export function CreateMeetingDialog({ onCreated, user }: { onCreated: () => void, user: any }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { projects } = useProjectStore();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startTime: "",
    endTime: "",
    platform: "",
    projectId: "",
  });

  const isZoomConnected = true; // Zoom is integrated globally at system level
  const isGoogleConnected = !!user?.externalAccounts?.google?.accessToken;

  const handleProjectChange = (projId: string) => {
    const selectedProject = projects.find(p => p._id === projId);
    setFormData({
      ...formData,
      projectId: projId,
      title: selectedProject ? `Meeting: ${selectedProject.name}` : formData.title
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.platform) {
      toast.error("Please select a platform");
      return;
    }

    try {
      setLoading(true);
      await meetingService.createMeeting(formData);
      toast.success("Meeting scheduled successfully");
      setOpen(false);
      onCreated();
      setFormData({ title: "", description: "", startTime: "", endTime: "", platform: "", projectId: "" });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || "An unexpected error occurred";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded bg-primary/10 text-primary border border-primary/20 hover:bg-primary/15 shadow-none font-semibold">
          <Plus className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="w-5 h-5 text-primary" />
            Schedule New Meeting
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="project">Project </Label>
            <Select 
              value={formData.projectId} 
              onValueChange={handleProjectChange}
            >
              <SelectTrigger id="project" className="w-full">
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project._id} value={project._id}>
                    <div className="flex items-center gap-2">
                       <Layout className="w-3 h-3 text-muted-foreground" />
                       {project.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Meeting Title</Label>
            <Input 
              id="title" 
              required 
              placeholder="e.g. Project Sync"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea 
              id="description" 
              placeholder="Meeting agenda..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time</Label>
              <Input 
                id="startTime" 
                type="datetime-local" 
                required 
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">End Time</Label>
              <Input 
                id="endTime" 
                type="datetime-local" 
                required 
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Platform</Label>
            <Select 
              value={formData.platform} 
              onValueChange={(val) => setFormData({ ...formData, platform: val })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select platform" />
              </SelectTrigger>
              <SelectContent>
                {isZoomConnected && <SelectItem value="zoom">Zoom</SelectItem>}
                {isGoogleConnected && <SelectItem value="google_meet">Google Meet</SelectItem>}
                {!isZoomConnected && !isGoogleConnected && <SelectItem value="none" disabled>No platform connected</SelectItem>}
              </SelectContent>
            </Select>
            {!isZoomConnected && !isGoogleConnected && (
              <p className="text-[10px] text-destructive">You must connect Zoom or Google Meet first in your profile.</p>
            )}
          </div>
          <DialogFooter>
            <Button 
              type="submit" 
              disabled={loading || (!isZoomConnected && !isGoogleConnected)} 
              className="w-full bg-primary/10 text-primary border border-primary/20 hover:bg-primary/15 shadow-none font-semibold"
            >
              {loading ? "Scheduling..." : "Schedule Meeting"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
