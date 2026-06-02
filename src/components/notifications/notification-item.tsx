import React, { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { 
  Check, 
  Trash2, 
  MessageSquare, 
  PlusCircle, 
  RefreshCw, 
  XCircle, 
  FileText, 
  Copy, 
  UserPlus, 
  Layout, 
  BellRing,
  Video
} from "lucide-react";
import type { Notification, NotificationChange } from "../../types/notification";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";
import { useAuth } from "../../context/AuthContext";
import { 
  ArrowRight, 
  ArrowUpRight, 
  CalendarClock, 
  CalendarCheck2,
  UserPlus2,
  UserMinus2,
  Download
} from "lucide-react";

import { priorityConfig, statusConfig } from "../../types/index";
import { normalizeKey, stripHtml } from "../../utils/activityUtils";
import { formatDate } from "../../lib/helpers";
import { toast } from "sonner";

const downloadFile = async (url: string, fileName: string) => {
  try {
    toast.info("Starting download...");
    const response = await fetch(url);
    if (!response.ok) throw new Error("Network response was not ok");
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
    toast.success("Download complete");
  } catch (error) {
    console.error('Download failed', error);
    // Fallback: open in a new tab if there is a CORS restriction or network issue
    window.open(url, '_blank');
  }
};

import { Checkbox } from "../ui/checkbox";

interface NotificationItemProps {
  notification: Notification;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
  isSelected?: boolean;
  onToggleSelect?: (id: string, selected: boolean) => void;
  showCheckbox?: boolean;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onRead,
  onDelete,
  isSelected = false,
  onToggleSelect,
  showCheckbox = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { user } = useAuth();
  const isSelf = user?._id === notification.sender._id;
  const displayName = isSelf ? "You" : notification.sender.name;

  const formatMessage = (msg: string, name: string) => {
    if (!isSelf) return msg;
    const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedName, 'g');
    return msg.replace(regex, "You");
  };

  const displayMessage = formatMessage(notification.message, notification.sender.name);

  // Function to bold text inside double quotes
  const formatRichMessage = (msg: string) => {
    const parts = msg.split(/("(.*?)")/g);
    return parts.map((part, i) => {
      if (i % 3 === 2) {
        return <strong key={i} className="font-bold text-foreground underline-offset-2 hover:underline decoration-primary/40 text-[13.5px]">{part}</strong>;
      }
      if (i % 3 === 1) return null;
      
      // Highlight mentions: @Name or @Full Name
      const mentionParts = part.split(/(@\w+(?:\s[A-Z]\w*)*)/g);
      return mentionParts.map((mPart, j) => {
        if (mPart.startsWith('@')) {
          return (
            <span key={`${i}-${j}`} className="text-primary font-medium bg-primary/10 px-1 rounded-sm mx-0.5">
              {mPart}
            </span>
          );
        }
        return mPart;
      });
    });
  };

  const getIcon = () => {
    const iconBaseClass = "h-4 w-4 transition-transform duration-300 group-hover:scale-110";
    switch (notification.type) {
      case "TASK_CREATED":
        return {
          icon: <PlusCircle className={`${iconBaseClass} text-emerald-500`} />,
          bg: "bg-emerald-500/10",
          color: "text-emerald-500"
        };
      case "TASK_UPDATED":
        return {
          icon: <RefreshCw className={`${iconBaseClass} text-blue-500`} />,
          bg: "bg-blue-500/10",
          color: "text-blue-500"
        };
      case "TASK_DELETED":
        return {
          icon: <XCircle className={`${iconBaseClass} text-red-500`} />,
          bg: "bg-red-500/10",
          color: "text-red-500"
        };
      case "TASK_COMPLETED":
        return {
          icon: <Check className={`${iconBaseClass} text-emerald-600`} />,
          bg: "bg-emerald-600/10",
          color: "text-emerald-600"
        };
      case "COMMENT_ADDED":
        return {
          icon: <MessageSquare className={`${iconBaseClass} text-indigo-500`} />,
          bg: "bg-indigo-500/10",
          color: "text-indigo-500"
        };
      case "ATTACHMENT_UPLOADED":
        return {
          icon: <FileText className={`${iconBaseClass} text-amber-500`} />,
          bg: "bg-amber-500/10",
          color: "text-amber-500"
        };
      case "PROJECT_CREATED":
        return {
          icon: <Layout className={`${iconBaseClass} text-purple-500`} />,
          bg: "bg-purple-500/10",
          color: "text-purple-500"
        };
      case "PROJECT_JOINED":
        return {
          icon: <UserPlus className={`${iconBaseClass} text-cyan-500`} />,
          bg: "bg-cyan-500/10",
          color: "text-cyan-500"
        };
      case "SHARE_LINK_COPIED":
        return {
          icon: <Copy className={`${iconBaseClass} text-slate-500`} />,
          bg: "bg-slate-500/10",
          color: "text-slate-500"
        };
      case "MEETING_SCHEDULED":
        return {
          icon: <Video className={`${iconBaseClass} text-emerald-500`} />,
          bg: "bg-emerald-500/10",
          color: "text-emerald-500"
        };
      case "MEETING_DELETED":
        return {
          icon: <XCircle className={`${iconBaseClass} text-red-500`} />,
          bg: "bg-red-500/10",
          color: "text-red-500"
        };
      default:
        return {
          icon: <BellRing className={`${iconBaseClass} text-muted-foreground`} />,
          bg: "bg-muted/10",
          color: "text-muted-foreground"
        };
    }
  };

  const { color } = getIcon();

  const handleClick = () => {
    // If selecting, toggle selection
    if (showCheckbox) {
      if (onToggleSelect) onToggleSelect(notification._id, !isSelected);
      return;
    }
    // Normal behavior
    if (!notification.isRead) {
      onRead(notification._id);
    }
  };

  return (
    <div
      className={cn(
        "flex items-start gap-3.5 p-3.5 text-sm transition-all duration-300 hover:bg-muted/40 group relative border-b border-border/40 last:border-0",
        !notification.isRead ? "bg-primary/3" : "",
        isSelected ? "bg-accent/40" : ""
      )}
      onClick={handleClick}
    >
      {showCheckbox && (
        <div 
          className="flex items-center justify-center shrink-0 pt-3 animate-in fade-in slide-in-from-left-2 duration-200"
          onClick={(e) => e.stopPropagation()} 
        >
          <Checkbox 
              checked={isSelected}
              onCheckedChange={(checked) => onToggleSelect && onToggleSelect(notification._id, checked as boolean)}
              className="rounded-full shadow-none w-4 h-4"
          />
        </div>
      )}

      <div className="relative shrink-0 pt-0.5">
        <Avatar className="h-10 w-10 border border-border/40 shadow transition-transform duration-300 group-hover:scale-105">
          <AvatarImage src={notification.sender.profilePicture} />
          <AvatarFallback className="bg-linear-to-br from-primary/5 to-primary/15 text-primary text-xs font-bold">
              {displayName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>

      </div>

      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
        <div className="flex justify-between items-center gap-2">
          <p className="text-sm font-semibold text-foreground/90 tracking-tight truncate">
            {displayName}
          </p>
          <span className={cn(
            "text-[9px] uppercase font-black tracking-widest px-1.5 py-0.5 rounded bg-muted/60 whitespace-nowrap",
            color
          )}>
            {notification.type.split('_').pop()}
          </span>
        </div>
        
        <p className={cn(
          "text-[13px] leading-relaxed wrap-break-word",
          !notification.isRead ? "text-foreground font-medium" : "text-muted-foreground"
        )}>
          {formatRichMessage(displayMessage)}
        </p>

        {/* Interaction Details Area - Similar to Activity Item */}
        {notification.type === "TASK_UPDATED" && (
           <div className="mt-2.5 flex flex-col gap-1.5 animate-in fade-in slide-in-from-top-1 duration-500">
             {notification.details?.changes && notification.details.changes.length > 0 ? (
               <div className="flex flex-col gap-2 p-2 bg-secondary/30 rounded border border-border/20">
                 {notification.details.changes.slice(0, isExpanded ? undefined : 2).map((c: NotificationChange, idx: number) => {
                   const isStatus = c.field === 'status';
                   const isPriority = c.field === 'priority';
                   const isDate = ['startDate', 'dueDate'].includes(c.field);
                    const isReminders = c.field === 'reminders';

                   if (isStatus || isPriority) {
                     const config = isPriority ? priorityConfig : statusConfig;
                     const oldKey = normalizeKey(c.oldValue) as keyof typeof config;
                     const newKey = normalizeKey(c.newValue) as keyof typeof config;
                     
                     return (
                       <div key={idx} className="flex items-center gap-1.5 text-[10px] font-medium">
                         <span className={cn("px-1.5 py-0.5 rounded capitalize", config[oldKey]?.className)}>
                           {config[oldKey]?.label || c.oldValue}
                         </span>
                         <ArrowRight className="h-2.5 w-2.5 text-muted-foreground/50" />
                         <span className={cn("px-1.5 py-0.5 rounded capitalize", config[newKey]?.className)}>
                           {config[newKey]?.label || c.newValue}
                         </span>
                       </div>
                     );
                   }

                   if (isDate) {
                     const Icon = c.field === 'startDate' ? CalendarClock : CalendarCheck2;
                     const iconColor = c.field === 'startDate' ? 'text-amber-600' : 'text-red-600';
                     return (
                       <div key={idx} className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium">
                         <Icon className={`h-3 w-3 ${iconColor}`} />
                         <span>{formatDate(c.oldValue) || "—"}</span>
                         <ArrowRight className="h-2.5 w-2.5 opacity-30" />
                         <span className="text-foreground/80">{formatDate(c.newValue) || "—"}</span>
                       </div>
                     );
                   }

                   if (c.field === 'assignedTo') {
                     return (
                       <div key={idx} className="flex flex-col gap-1.5 py-0.5">
                         {c.addedUsers && c.addedUsers.length > 0 && (
                           <div className="flex items-center gap-2">
                             <UserPlus2 className="h-3 w-3 text-green-500/70" />
                             <div className="flex -space-x-1.5">
                               {c.addedUsers.map((u, i) => (
                                 <Avatar key={i} className="h-5 w-5 border-2 border-background ring-1 ring-border/20">
                                   <AvatarImage src={u.profilePicture} />
                                   <AvatarFallback className="text-[8px] bg-green-500/10 text-green-600 font-bold">
                                     {u.name.charAt(0)}
                                   </AvatarFallback>
                                 </Avatar>
                               ))}
                             </div>
                             <span className="text-[10px] font-medium text-muted-foreground">
                               Added {c.addedUsers.map(u => u.name).join(", ")}
                             </span>
                           </div>
                         )}
                         {c.removedUsers && c.removedUsers.length > 0 && (
                           <div className="flex items-center gap-2">
                             <UserMinus2 className="h-3 w-3 text-red-500/70" />
                             <div className="flex -space-x-1.5 opacity-60">
                               {c.removedUsers.map((u, i) => (
                                 <Avatar key={i} className="h-5 w-5 border-2 border-background ring-1 ring-border/20 grayscale">
                                   <AvatarImage src={u.profilePicture} />
                                   <AvatarFallback className="text-[8px] bg-red-500/10 text-red-600 font-bold">
                                     {u.name.charAt(0)}
                                   </AvatarFallback>
                                 </Avatar>
                               ))}
                             </div>
                             <span className="text-[10px] font-medium text-muted-foreground/60">
                               Removed {c.removedUsers.map(u => u.name).join(", ")}
                             </span>
                           </div>
                         )}
                       </div>
                     );
                    }

                    if (isReminders) {
                      const oldCount = Array.isArray(c.oldValue) ? c.oldValue.length : 0;
                      const newCount = Array.isArray(c.newValue) ? c.newValue.length : 0;
                      return (
                        <div key={idx} className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium">
                          <BellRing className="h-3 w-3 text-primary/70" />
                          <span>{oldCount} reminders</span>
                          <ArrowRight className="h-2.5 w-2.5 opacity-30" />
                          <span className="text-foreground/80">{newCount} reminders</span>
                        </div>
                      );
                    }

                   return (
                     <div key={idx} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        <span className="font-bold capitalize">{c.field}:</span>
                        <span className="truncate max-w-[80px] opacity-60">{stripHtml(String(c.oldValue || "—"))}</span>
                        <ArrowRight className="h-2.5 w-2.5 opacity-30" />
                        <span className="truncate max-w-[80px] text-foreground/80 font-medium">{stripHtml(String(c.newValue || "—"))}</span>
                     </div>
                   );
                 })}
                 {notification.details && notification.details.changes && notification.details.changes.length > 2 && (
                   <button 
                     onClick={(e) => {
                        e.stopPropagation();
                        setIsExpanded(!isExpanded);
                     }}
                     className="text-[10px] text-primary/70 font-bold hover:text-primary transition-colors mt-0.5 px-1 py-0.5 rounded hover:bg-primary/5 flex items-center gap-1 w-fit"
                   >
                     {isExpanded ? (
                       <>Show less</>
                     ) : (
                       <>+{notification.details.changes.length - 2} more changes</>
                     )}
                   </button>
                 )}
               </div>
             ) : (
               <div className="flex items-center gap-2 bg-secondary/80 px-2.5 py-1.5 rounded border border-border/40 group/detail hover:bg-secondary transition-colors">
                  <RefreshCw className="h-3 w-3 text-blue-500 animate-spin-slow" />
                  <span className="text-[11px] font-semibold text-primary/80">View task updates</span>
                  <ArrowUpRight className="h-3 w-3 text-muted-foreground ml-auto opacity-0 group-hover/detail:opacity-100 transition-opacity" />
               </div>
             )}
           </div>
        )}

        {/* File Attachment Details */}
        {notification.type === "ATTACHMENT_UPLOADED" && notification.details?.files && (
           <div className="mt-2.5 flex flex-col gap-1.5 animate-in fade-in slide-in-from-top-1 duration-500">
              <div className="flex flex-col gap-1.5 p-2 bg-secondary/30 rounded border border-border/20">
                {notification.details.files.map((file: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between gap-2 p-1.5 rounded hover:bg-background/50 transition-colors group/file">
                     <div className="flex items-center gap-2 min-w-0">
                        <div className="p-1.5 bg-primary/10 rounded">
                           <FileText className="h-3 w-3 text-primary" />
                        </div>
                        <div className="flex flex-col min-w-0">
                           <span className="text-[11px] font-medium text-foreground truncate max-w-[150px]">{file.name}</span>
                        </div>
                     </div>
                     <Button 
                       variant="ghost" 
                       size="icon" 
                       className="h-6 w-6 opacity-0 group-hover/file:opacity-100 transition-opacity"
                       onClick={(e) => {
                          e.stopPropagation();
                          downloadFile(file.url, file.name);
                       }}
                       title="Download"
                     >
                        <Download className="h-3.5 w-3.5 text-muted-foreground hover:text-primary" />
                     </Button>
                  </div>
                ))}
              </div>
           </div>
        )}
        
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[10px] text-muted-foreground/60 font-semibold flex items-center gap-1.5">
            <span className="flex h-1 w-1 rounded bg-border" />
            {formatDistanceToNow(new Date(notification.createdAt), {
              addSuffix: true,
            })}
          </span>
        </div>
      </div>

       <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 absolute right-3 top-1/2 -translate-y-1/2 translate-x-2 group-hover:translate-x-0 scale-90 group-hover:scale-100">
        {!notification.isRead && (
            <Button
            variant="secondary"
            size="icon"
            className="h-8 w-8 hover:bg-primary/20 hover:text-primary rounded shadow border border-border/40 backdrop-blur-sm"
            onClick={(e) => {
                e.stopPropagation();
                onRead(notification._id);
            }}
            title="Mark as read"
            >
            <Check className="h-4 w-4" />
            </Button>
        )}
        <Button
            variant="secondary"
            size="icon"
            className="h-8 w-8 text-destructive/80 hover:bg-destructive/10 hover:text-destructive rounded shadow border border-border/40 backdrop-blur-sm"
            onClick={(e) => {
                e.stopPropagation();
                onDelete(notification._id);
            }}
            title="Delete"
        >
            <Trash2 className="h-4 w-4" />
        </Button>
       </div>
       
       {!notification.isRead && (
           <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-8 bg-primary rounded-r-full shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
       )}
    </div>
  );
};




