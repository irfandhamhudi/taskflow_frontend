// components/projects/ProjectHeader.tsx
// import React from 'react';
// import { Lock, UserRoundPlus, Settings2 } from 'lucide-react';
import type { JSX } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar";
import ProjectMembersPopover from "./project-members";
import ProjectSettingsPopover from "./project-settings";
import { Star } from "lucide-react";
import { Button } from "../../ui/button";

import type { Member, Project } from "../../../types/project";

interface ProjectHeaderProps {
  projectIcon: string;
  projectName: string;
  projectDescription: string;
  visibilityIcon: JSX.Element;
  membersList: Member[];
  currentUserRole: string;
  projectDetail: Project | null;
  shareUrl: string;
  copied: boolean;
  isDeleting: boolean;
  onDeleteProject: () => Promise<void>;
  onUpdateRole: (memberId: string, newRole: string) => Promise<void>;
  onCopyLink: () => void;
  onProjectUpdated?: (updatedProject: Partial<Project>) => void;
  onInviteMember: (email: string, role: "admin" | "editor" | "viewer") => Promise<boolean>;
  onRemoveMember: (memberId: string) => Promise<boolean>;
  onToggleFavorite: () => Promise<void>;
}

export default function ProjectHeader(props: ProjectHeaderProps) {
  const { projectIcon, projectName, projectDescription, visibilityIcon, membersList, currentUserRole, projectDetail, shareUrl, copied, isDeleting, onDeleteProject, onUpdateRole, onCopyLink, onProjectUpdated, onInviteMember, onRemoveMember, onToggleFavorite } = props;
  
  

  return (
    <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
      <div className="flex items-start gap-4">
        <span className="text-4xl shrink-0">{projectIcon}</span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl md:text-3xl font-bold truncate">{projectName}</h1>
            {visibilityIcon}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-yellow-500/10 group"
              onClick={onToggleFavorite}
              title={projectDetail?.isFavorite ? "Remove from favorites" : "Add to favorites"}
            >
              <Star 
                className={`h-5 w-5 transition-all ${
                  projectDetail?.isFavorite 
                    ? "fill-yellow-500 text-yellow-500" 
                    : "text-muted-foreground group-hover:text-yellow-500"
                }`} 
              />
            </Button>
          </div>
          <p className="text-muted-foreground line-clamp-2 md:line-clamp-none text-sm md:text-base">{projectDescription}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
        <div className="flex items-center -space-x-3">
          {membersList.slice(0, 4).map((member: Member) => (
            <Avatar key={member.user._id} className="h-8 w-8 ring-2 ring-background">
              <AvatarImage src={member.user.profilePicture} alt={member.user.name} />
              <AvatarFallback className="text-xs font-medium bg-muted text-muted-foreground">
                {member.user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
              </AvatarFallback>
            </Avatar>
          ))}
          {membersList.length > 4 && (
            <Avatar className="h-8 w-8 ring-2 ring-background">
              <AvatarFallback className="text-sm font-medium text-muted-foreground bg-muted">
                +{membersList.length - 4}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
        <div className="flex items-center gap-2 ml-auto md:ml-0">
          <ProjectMembersPopover
            membersList={membersList}
            currentUserRole={currentUserRole}
            projectDetail={projectDetail}
            onUpdateRole={onUpdateRole}
            onInviteMember={onInviteMember}
            onRemoveMember={onRemoveMember}
          />
          <ProjectSettingsPopover
            projectDetail={projectDetail}
            currentUserRole={currentUserRole}
            shareUrl={shareUrl}
            copied={copied}
            isDeleting={isDeleting}
            onCopyLink={onCopyLink}
            onDeleteProject={onDeleteProject}
            onProjectUpdated={onProjectUpdated}
          />
        </div>
      </div>
    </div>
  );
}
