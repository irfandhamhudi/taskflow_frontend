import { Skeleton } from '@/components/ui/skeleton';
import { useState, useEffect } from 'react';
import { Lock, UserRoundPlus, Search, UsersRound, Globe } from 'lucide-react';
import { Button } from "../../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../../ui/popover";
import { Input } from "../../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "../../ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar";
import { cn } from "../../../lib/utils";
import { toast } from 'sonner';
import api from "../../../utils/api";
import { useDebounce } from "../../../hooks/use-debounce";

import type { Member, Project } from "../../../types/project";
import type { User } from "../../../types/user";

interface ProjectMembersPopoverProps {
  membersList: Member[];
  currentUserRole: string;
  projectDetail: Project | null;
  onUpdateRole: (memberId: string, newRole: string) => Promise<void>;
  onInviteMember: (email: string, role: "admin" | "editor" | "viewer") => Promise<boolean>;
  onRemoveMember: (memberId: string) => Promise<boolean>;
}

export default function ProjectMembersPopover(props: ProjectMembersPopoverProps) {
  const { membersList, currentUserRole, projectDetail, onUpdateRole, onInviteMember, onRemoveMember } = props;
  const [inviteEmail, setInviteEmail] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [searchingUsers, setSearchingUsers] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [inviteRole, setInviteRole] = useState<"admin" | "editor" | "viewer">("editor");
  const debouncedEmail = useDebounce(inviteEmail.trim().toLowerCase(), 300);

  useEffect(() => {
    const searchUser = async () => {
      // Search from the first character
      if (!debouncedEmail) {
        setSearchingUsers([]);
        return;
      }

      setIsSearching(true);
      try {
        const response = await api.get(`/auth/search-user?email=${debouncedEmail}`);
        if (response.data.success) {
          // Filter out users who are already in the project members list
          const results = response.data.data.filter((u: User) => 
            !membersList.some(m => m.user?._id === u._id)
          );
          setSearchingUsers(results);
        }
      } catch (error) {
        console.error("Search user failed:", error);
      } finally {
        setIsSearching(false);
      }
    };

    searchUser();
  }, [debouncedEmail, membersList]);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      toast.error("Please enter an email address");
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(inviteEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsInviting(true);
    const success = await onInviteMember(inviteEmail.toLowerCase().trim(), inviteRole);
    setIsInviting(false);
    
    if (success) {
      setInviteEmail("");
      setSearchingUsers([]);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button size="sm" className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/15 shadow-none font-semibold">
          <UserRoundPlus className="mr-2 h-4 w-4" />
          Invite Members
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="end">
        <div className="flex flex-col">
          <div className="flex flex-col gap-3 p-4 border-b">
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <Input 
                  placeholder="Emails..." 
                  className="w-full h-9 text-sm pr-8" 
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
                  disabled={isInviting}
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                  {isSearching ? <Skeleton className="h-4 w-4 rounded-full" /> : <Search className="h-3.5 w-3.5 text-muted-foreground" />}
                </div>

                {searchingUsers.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-background border rounded shadow z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="max-h-48 overflow-y-auto">
                      {searchingUsers.map((user) => (
                        <div 
                          key={user._id}
                          className="flex items-center gap-3 p-2.5 hover:bg-accent cursor-pointer border-b last:border-0 transition-colors"
                          onClick={() => {
                            setInviteEmail(user.email);
                            setSearchingUsers([]);
                          }}
                        >
                          <Avatar className="h-8 w-8 shrink-0">
                            <AvatarImage src={user.profilePicture} />
                            <AvatarFallback className="text-xs">
                              {user.name.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">{user.name}</div>
                            <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                          </div>
                          <div className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium shrink-0">Registered</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Select value={inviteRole} onValueChange={(val: any) => setInviteRole(val)}>
                <SelectTrigger className="h-9 flex-1 text-xs">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin (Full Access)</SelectItem>
                  <SelectItem value="editor">Editor (Can edit tasks)</SelectItem>
                  <SelectItem value="viewer">Viewer (Can view only)</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                size="sm" 
                className="h-9 px-4 bg-primary/10 text-primary border border-primary/20 hover:bg-primary/15 shadow-none font-semibold" 
                onClick={handleInvite}
                disabled={isInviting || !inviteEmail.trim()}
              >
                {isInviting ? <Skeleton className="h-4 w-12 rounded" /> : "Invite"}
              </Button>
            </div>
          </div>
          <div className="p-4 space-y-4 border-b">
            <div className="text-sm font-medium">General access</div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded bg-muted">
                  {projectDetail?.visibility === 'public' ? (
                    <Globe className="h-5 w-5 text-muted-foreground" />
                  ) : projectDetail?.visibility === 'limited' ? (
                    <UsersRound className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <Lock className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <div className="text-sm font-medium capitalize">
                    {projectDetail?.visibility === 'private' ? 'Only those invited' : projectDetail?.visibility || 'Private'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {projectDetail?.visibility === 'public' 
                      ? 'Anyone on the internet with the link can view'
                      : projectDetail?.visibility === 'limited'
                      ? 'Anyone in the organization can view'
                      : `${membersList.length} people`}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="p-4">
            <div className="text-sm font-medium mb-3">People with access</div>
            <div className="max-h-60 overflow-y-auto pr-1 -mr-1">
              <div className="space-y-3">
                {membersList.slice().sort((a, b) => (a.role === "owner" ? -1 : b.role === "owner" ? 1 : 0)).map((member: Member) => {
                  const user = member.user;
                  const isOwner = member.role === "owner";
                  const isCurrentUser = user._id === projectDetail?.owner?._id;
                  const roleLabel = isOwner ? "Owner" : member.role === "admin" ? "Full access" : member.role === "editor" ? "Can edit tasks" : "Can view only";
                  const canEditThisMember = ["owner", "admin"].includes(currentUserRole) && !isOwner && !isCurrentUser;

                  return (
                    <div key={user._id} className="flex items-center justify-between group">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar className="h-9 w-9 shrink-0">
                          <AvatarImage src={user.profilePicture} alt={user.name} />
                          <AvatarFallback className="text-sm font-medium bg-muted text-muted-foreground">
                            {user.name.split(" ").map((n: string) => n[0]?.toUpperCase()).join("").slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">{user.name}</div>
                          <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                        </div>
                      </div>
                      <div className="ml-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {canEditThisMember ? (
                          <>
                            <Select value={member.role} onValueChange={(value: "admin" | "editor" | "viewer") => onUpdateRole(user._id, value)}>
                              <SelectTrigger className="h-8 w-32 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="z-50">
                                {currentUserRole === 'owner' && (
                                  <SelectItem value="admin">Full access (Admin)</SelectItem>
                                )}
                                <SelectItem value="editor">Can edit (Editor)</SelectItem>
                                <SelectItem value="viewer">Can view (Viewer)</SelectItem>
                              </SelectContent>
                            </Select>

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                >
                                  <span className="sr-only">Kick</span>
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Remove member?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to remove <strong>{user.name}</strong> from this project? They will lose access to all tasks and files.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction 
                                    className="bg-destructive hover:bg-destructive/90 text-white"
                                    onClick={() => onRemoveMember(user._id)}
                                  >
                                    Remove
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </>
                        ) : (
                          <span className={cn("text-xs px-3 py-1 rounded select-none", isOwner ? "bg-primary/10 text-primary font-medium" : "bg-muted text-muted-foreground")}>
                            {roleLabel}
                            {isCurrentUser && " (You)"}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
