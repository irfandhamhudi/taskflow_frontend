import { Settings2, Trash2, LinkIcon, Check, Settings, ShieldAlert } from 'lucide-react';
import { Button } from "../../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../../ui/popover";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../../ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../../ui/dialog";
import { Label } from "../../ui/label";
import { Textarea } from "../../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";
import EditProjectSheet from '../../projects/edit-project-sheet';
import { useState } from 'react';
import { projectTaskService } from '../../../services/projecTaskAPi';

import type { Project } from "../../../types/project";

interface ProjectSettingsPopoverProps {
  projectDetail: Project | null;
  currentUserRole: string;
  shareUrl: string;
  copied: boolean;
  isDeleting: boolean;
  onCopyLink: () => void;
  onDeleteProject: () => Promise<void>;
  onProjectUpdated?: (updatedProject: Partial<Project>) => void;
}

export default function ProjectSettingsPopover(props: ProjectSettingsPopoverProps) {
  const { projectDetail, currentUserRole, shareUrl, copied, isDeleting, onCopyLink, onDeleteProject, onProjectUpdated } = props;

  const [isRequesting, setIsRequesting] = useState(false);
  const [requestedRole, setRequestedRole] = useState<string>("editor");
  const [requestMessage, setRequestMessage] = useState("");
  const [openRequestDialog, setOpenRequestDialog] = useState(false);

  const handleRequestUpgrade = async () => {
    if (!projectDetail) return;
    setIsRequesting(true);
    try {
      await projectTaskService.requestRoleUpgrade(projectDetail._id, requestedRole, requestMessage);
      setOpenRequestDialog(false);
      setRequestMessage("");
    } catch (error) {
      console.error(error);
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button size="sm" variant="outline" type="button">
          <Settings2 className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2" align="end">
        <div className="space-y-1">
          {projectDetail && currentUserRole !== 'viewer' && (
            <EditProjectSheet
              project={projectDetail}
              currentUserRole={currentUserRole}
              onProjectUpdated={onProjectUpdated}
            >
              <div className="flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-accent rounded cursor-pointer">
                <Settings className="h-4 w-4 text-muted-foreground" />
                <span>Project Settings</span>
              </div>
            </EditProjectSheet>
          )}

          {currentUserRole === 'viewer' && (
            <Dialog open={openRequestDialog} onOpenChange={setOpenRequestDialog}>
              <DialogTrigger asChild>
                <div className="flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-accent rounded cursor-pointer">
                  <ShieldAlert className="h-4 w-4 text-muted-foreground" />
                  <span>Request Full Access</span>
                </div>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Request Access Upgrade</DialogTitle>
                  <DialogDescription>
                    Request a higher role to get full access to this project.
                    The owner will review your request.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4 w-full">
                    <div className="space-y-2">
                      <Label className="block w-full text-muted-foreground text-xs uppercase tracking-wider">Current Role</Label>
                      <div className="px-3 py-2 bg-muted/50 rounded border text-sm font-medium capitalize">
                        {currentUserRole}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role" className="block w-full">Requesting</Label>
                      <Select value={requestedRole} onValueChange={setRequestedRole}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="editor">Editor</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2 w-full">
                    <Label htmlFor="message" className="block w-full">Message (Optional)</Label>
                    <Textarea 
                      id="message" 
                      placeholder="Why do you need full access?" 
                      value={requestMessage}
                      onChange={(e) => setRequestMessage(e.target.value)}
                      className="resize-none w-full"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpenRequestDialog(false)}>Cancel</Button>
                  <Button onClick={handleRequestUpgrade} disabled={isRequesting}>
                    {isRequesting ? "Submitting..." : "Submit Request"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}

          {shareUrl && (
            <div className="flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-accent rounded cursor-pointer" onClick={onCopyLink}>
              <LinkIcon className="h-4 w-4 text-muted-foreground" />
              <span>Copy Share Link</span>
              {copied && <Check className="h-3.5 w-3.5 text-green-600 ml-auto" />}
            </div>
          )}
          {currentUserRole === 'owner' && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <div className="flex items-center gap-3 px-3 py-2.5 text-sm text-destructive hover:bg-destructive/10 rounded cursor-pointer">
                  <Trash2 className="h-4 w-4" />
                  <span>Move to trash</span>
                </div>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Move project to trash?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will move <span className="font-medium">{projectDetail?.name}</span> and all its tasks to the trash bin.
                    You can restore them later or delete them permanently from the trash.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={onDeleteProject} disabled={isDeleting} className="text-white bg-destructive hover:bg-destructive/90 ">
                    {isDeleting ? "Moving..." : "Move to trash"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

