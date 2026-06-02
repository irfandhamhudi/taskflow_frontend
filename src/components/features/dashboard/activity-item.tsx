// src/features/dashboard/components/ActivityItem.tsx
import React from 'react';
import type { JSX } from 'react';
import { ArrowRight, ListTodo, MessagesSquare, Paperclip, FilePlusCorner, UserPen, Trash2, Archive as ArchiveIcon, TrendingUp, CalendarClock, CalendarCheck2, Tags, Clock, Video, VideoOff } from 'lucide-react';
import { getActivitySubject, getActivityPreview, shorten } from '../../../utils/activityUtils';
import { formatDate } from '../../../lib/helpers';
import { StatusPriorityChangeBadge } from './status-change';
import type { DashboardData } from '../../../types/dashboard';

type ActivityItemProps = {
  act: DashboardData['recentActivity'][number];
};

const ActivityAvatar = ({ act }: { act: DashboardData['recentActivity'][number] }) => {
  const isCommentRelated = [
    'comment_added', 'reply_added', 'comment_edited', 
    'comment_deleted', 'comment_reaction_added', 'comment_reaction_removed'
  ].includes(act.action);
  const isSubtaskActivity = act.action.includes('subtask');
  const action = act.action;

  let SubIcon = TrendingUp;
  let subIconColor = "text-blue-500";
  let subIconBg = "bg-blue-100 dark:bg-blue-900/80";

  if (isCommentRelated) {
    SubIcon = MessagesSquare;
    subIconColor = "text-green-600 dark:text-green-400";
    subIconBg = "bg-green-100 dark:bg-green-900/80";
  } else if (isSubtaskActivity) {
    SubIcon = ListTodo;
    subIconColor = "text-indigo-600 dark:text-indigo-400";
    subIconBg = "bg-indigo-100 dark:bg-indigo-900/80";
  } else if (action.includes('created') || action === 'file_uploaded') {
    SubIcon = FilePlusCorner;
    subIconColor = "text-emerald-600 dark:text-emerald-400";
    subIconBg = "bg-emerald-100 dark:bg-emerald-900/80";
  } else if (action.includes('deleted') || action.includes('removed')) {
    SubIcon = Trash2;
    subIconColor = "text-red-600 dark:text-red-400";
    subIconBg = "bg-red-100 dark:bg-red-900/80";
  } else if (action.includes('updated') || action.includes('edited')) {
    SubIcon = UserPen;
    subIconColor = "text-amber-600 dark:text-amber-400";
    subIconBg = "bg-amber-100 dark:bg-amber-900/80";
  } else if (action.includes('archived')) {
    SubIcon = ArchiveIcon;
    subIconColor = "text-gray-600 dark:text-gray-400";
    subIconBg = "bg-gray-200 dark:bg-gray-800";
  } else if (action.includes('file') || action === 'attachment') {
    SubIcon = Paperclip;
    subIconColor = "text-cyan-600 dark:text-cyan-400";
    subIconBg = "bg-cyan-100 dark:bg-cyan-900/80";
  } else if (action.includes('meeting')) {
    SubIcon = action === 'meeting_deleted' ? VideoOff : Video;
    subIconColor = "text-purple-600 dark:text-purple-400";
    subIconBg = "bg-purple-100 dark:bg-purple-900/80";
  }

  const user = act.user;
  const initial = user?.name?.charAt(0).toUpperCase() || '?';

  return (
    <div className="relative z-10 shrink-0 mt-1 ml-2">
      <div className="w-10 h-10 rounded-full overflow-hidden border-[3px] border-background bg-secondary flex items-center justify-center shadow-sm">
        {user?.profilePicture ? (
          <img src={user.profilePicture} alt={user?.name || 'User'} className="w-full h-full object-cover" />
        ) : (
          <span className="text-sm font-bold text-foreground/70">{initial}</span>
        )}
      </div>
      <div className={`absolute -bottom-0.5 -right-0.5 w-[20px] h-[20px] rounded-full flex items-center justify-center border-2 border-background ${subIconBg} shadow-sm`}>
        <SubIcon className={`w-3 h-3 ${subIconColor}`} />
      </div>
    </div>
  );
};

const getChangeIcon = (field: string) => {
  switch (field) {
    case 'startDate': return <CalendarClock className="h-3.5 w-3.5 text-amber-500 shrink-0" />;
    case 'dueDate': return <CalendarCheck2 className="h-3.5 w-3.5 text-red-500 shrink-0" />;
    case 'tags': return <Tags className="h-3.5 w-3.5 text-purple-500 shrink-0" />;
    case 'subtask': return <ListTodo className="h-3.5 w-3.5 text-indigo-500 shrink-0" />;
    case 'comment': return <MessagesSquare className="h-3.5 w-3.5 text-green-500 shrink-0" />;
    case 'file': return <Paperclip className="h-3.5 w-3.5 text-gray-500 shrink-0" />;
    case 'archive': return <ArchiveIcon className="h-3.5 w-3.5 text-gray-500 shrink-0" />;
    case 'reminders': return <Clock className="h-3.5 w-3.5 text-blue-500 shrink-0" />;
    default: return <UserPen className="h-3.5 w-3.5 text-blue-500 shrink-0" />;
  }
};

const ChangeBadge = ({ children }: { children: React.ReactNode }) => (
  <span className="bg-background/80 border border-border/50 px-2 py-0.5 text-foreground rounded text-[11px] font-medium shadow-sm max-w-full truncate">
    {children}
  </span>
);

export function ActivityItem({ act }: ActivityItemProps) {
  const subject = getActivitySubject(act);
  const preview = getActivityPreview(act);

  const changeDetails = act.action === 'task_updated' && act.details?.changes
    ? act.details.changes.map((c: any, idx: number) => {
        let displayText: JSX.Element | null = null;
        const icon = getChangeIcon(c.field);

        switch (c.field) {
          case 'startDate':
          case 'dueDate': {
            const oldVal = formatDate(c.oldValue) || '—';
            const newVal = formatDate(c.newValue) || '—';
            displayText = (
              <span className="flex items-center gap-1.5 min-w-0">
                {icon}
                <span className="font-medium text-[11px] uppercase tracking-wider text-muted-foreground mr-1">{c.field.replace('Date', ' Date')}:</span>
                <ChangeBadge>{oldVal}</ChangeBadge>
                <ArrowRight className="w-3 h-3 text-muted-foreground/60 shrink-0" />
                <ChangeBadge>{newVal}</ChangeBadge>
              </span>
            );
            break;
          }

          case 'subtask':
          case 'comment':
          case 'title':
          case 'description': {
            const oldVal = shorten(c.oldValue || '—', 35);
            const newVal = shorten(c.newValue || '—', 35);
            displayText = (
              <span className="flex items-center gap-1.5 flex-wrap min-w-0">
                {icon}
                <span className="font-medium text-[11px] uppercase tracking-wider text-muted-foreground mr-1">{c.field}:</span>
                <ChangeBadge>{oldVal}</ChangeBadge>
                <ArrowRight className="w-3 h-3 text-muted-foreground/60 shrink-0" />
                <ChangeBadge>{newVal}</ChangeBadge>
              </span>
            );
            break;
          }

          case 'tags': {
            const oldTags = Array.isArray(c.oldValue) && c.oldValue.length > 0 ? c.oldValue.join(', ') : '—';
            const newTags = Array.isArray(c.newValue) && c.newValue.length > 0 ? c.newValue.join(', ') : '—';
            displayText = (
              <span className="flex items-center gap-1.5 flex-wrap min-w-0">
                {icon}
                <span className="font-medium text-[11px] uppercase tracking-wider text-muted-foreground mr-1">Tags:</span>
                <ChangeBadge>{oldTags}</ChangeBadge>
                <ArrowRight className="w-3 h-3 text-muted-foreground/60 shrink-0" />
                <ChangeBadge>{newTags}</ChangeBadge>
              </span>
            );
            break;
          }

          case 'assignedTo': {
            const addedUsers = (c.addedUsers || []).length > 0 ? c.addedUsers : (c.addedUserNames || []).map((name: string) => ({ name }));
            const removedUsers = (c.removedUsers || []).length > 0 ? c.removedUsers : (c.removedUserNames || []).map((name: string) => ({ name }));

            const renderUserWithName = (user: { name: string; profilePicture?: string }) => (
              <div className="flex items-center gap-1.5 bg-background border border-border/50 shadow-sm rounded-full pl-1 pr-2 py-0.5">
                {user.profilePicture ? (
                  <img src={user.profilePicture} alt={user.name} className="w-4 h-4 rounded-full object-cover" onError={(e) => (e.currentTarget as HTMLImageElement).style.display = 'none'} />
                ) : (
                  <div className="w-4 h-4 rounded-full bg-secondary flex items-center justify-center text-[8px] font-medium text-foreground">
                    {user.name?.charAt(0).toUpperCase() || '?'}
                  </div>
                )}
                <span className="text-[10px] font-medium truncate max-w-[80px]">{user.name}</span>
              </div>
            );

            if (addedUsers.length > 0 && removedUsers.length === 0) {
              displayText = (
                <span className="flex items-center gap-1.5 flex-wrap min-w-0">
                  {icon}
                  <span className="text-[10px] font-medium bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400 px-1.5 py-0.5 rounded-sm">Assigned</span>
                  {addedUsers.slice(0, 2).map((user: any, i: number) => (
                    <React.Fragment key={i}>{renderUserWithName(user)}</React.Fragment>
                  ))}
                  {addedUsers.length > 2 && <span className="text-[10px] text-muted-foreground">+{addedUsers.length - 2} more</span>}
                </span>
              );
            } else if (removedUsers.length > 0 && addedUsers.length === 0) {
              displayText = (
                <span className="flex items-center gap-1.5 flex-wrap min-w-0">
                  {icon}
                  <span className="text-[10px] font-medium bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400 px-1.5 py-0.5 rounded-sm">Removed</span>
                  {removedUsers.slice(0, 2).map((user: any, i: number) => (
                    <React.Fragment key={i}>{renderUserWithName(user)}</React.Fragment>
                  ))}
                  {removedUsers.length > 2 && <span className="text-[10px] text-muted-foreground">+{removedUsers.length - 2} more</span>}
                </span>
              );
            } else {
               displayText = (
                <span className="flex items-center gap-1.5 min-w-0">
                  {icon}
                  <span className="text-[11px] text-muted-foreground">Assignees changed (+{addedUsers.length}, -{removedUsers.length})</span>
                </span>
              );
            }
            break;
          }
          case 'reminders': {
            const oldCount = Array.isArray(c.oldValue) ? c.oldValue.length : 0;
            const newCount = Array.isArray(c.newValue) ? c.newValue.length : 0;
            displayText = (
              <span className="flex items-center gap-1.5 flex-wrap min-w-0">
                {icon}
                <span className="font-medium text-[11px] uppercase tracking-wider text-muted-foreground mr-1">Reminders:</span>
                <ChangeBadge>{oldCount} reminders</ChangeBadge>
                <ArrowRight className="w-3 h-3 text-muted-foreground/60 shrink-0" />
                <ChangeBadge>{newCount} reminders</ChangeBadge>
              </span>
            );
            break;
          }
          case 'status':
          case 'priority':
            displayText = null;
            break;

          default: {
            const oldVal = shorten(String(c.oldValue ?? '—'), 30);
            const newVal = shorten(String(c.newValue ?? '—'), 30);
            displayText = (
              <span className="flex items-center gap-1.5 flex-wrap min-w-0">
                {icon}
                <span className="font-medium text-[11px] uppercase tracking-wider text-muted-foreground mr-1">{c.field}:</span>
                <ChangeBadge>{oldVal}</ChangeBadge>
                <ArrowRight className="w-3 h-3 text-muted-foreground/60 shrink-0" />
                <ChangeBadge>{newVal}</ChangeBadge>
              </span>
            );
          }
        }

        if (!displayText) return null;

        return (
          <div key={`${c.field}-${idx}`} className="flex items-center mt-1.5 w-full">
            {displayText}
          </div>
        );
      })
    : [];

  return (
    <div className="flex items-start gap-3.5 group relative hover:bg-accent/40 p-2.5 rounded transition-all duration-200 border border-transparent hover:border-border/60">
      <ActivityAvatar act={act} />

      <div className="flex-1 space-y-1.5 min-w-0 pt-1.5">
        <div className="flex items-start justify-between gap-2">
          <p
            className="text-sm text-foreground leading-snug wrap-break-word pr-2 [&>strong]:font-semibold [&>strong]:text-foreground"
            dangerouslySetInnerHTML={{ __html: subject }}
          />
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground/70 shrink-0 whitespace-nowrap pt-0.5">
            <Clock className="w-3 h-3" />
            {new Date(act.createdAt).toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        </div>

        {act.details && ['project_created', 'project_updated', 'project_deleted'].includes(act.action) && (
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            <div className="flex items-center gap-1.5 bg-secondary/60 border border-border/40 px-2.5 py-1 rounded shadow-sm">
              <span className="text-base drop-shadow-sm">
                {act.details.icon || act.projectId?.icon || '📂'}
              </span>
              <span className="font-medium">
                {act.entityName || act.projectId?.name || act.details.name || 'Project'}
              </span>
            </div>
            {act.action === 'project_updated' && act.details.changedFields?.length > 0 && (
              <div className="text-[10px] bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 px-2 py-1 rounded font-medium border border-green-200 dark:border-green-800">
                Updated: {act.details.changedFields.join(', ')}
              </div>
            )}
          </div>
        )}

        {act.details && act.entityType === 'meeting' && (
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            <div className="flex items-center gap-1.5 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800/40 px-2.5 py-1 rounded shadow-sm">
              <Video className="h-3 w-3 text-purple-600 dark:text-purple-400" />
              <span className="font-medium text-purple-700 dark:text-purple-300">
                {act.details.meetingType === 'zoom' ? 'Zoom Meeting' : 'Google Meet'}
              </span>
            </div>
            {act.details.joinUrl && act.action !== 'meeting_deleted' && (
              <a 
                href={act.details.joinUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[10px] bg-primary/10 text-primary hover:bg-primary/20 px-2 py-1 rounded font-semibold transition-colors border border-primary/20"
              >
                Join Now
              </a>
            )}
          </div>
        )}

        {changeDetails && changeDetails.some(Boolean) && (
          <div className="mt-2.5 flex flex-col gap-1 bg-secondary/30 rounded p-2.5 border border-border/40">
            {changeDetails}
          </div>
        )}

        {(preview || act.action === 'task_status_changed' || act.action === 'task_priority_changed') && (
          <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs">
            <StatusPriorityChangeBadge act={act} />
            
            {preview && (
              <div className="flex items-start gap-2 w-full mt-1.5">
                <div className="bg-secondary/40 border border-border/40 px-3 py-2.5 text-foreground rounded text-[13px] font-normal max-w-full leading-relaxed overflow-hidden shadow-sm relative">
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary/40 rounded-l"></div>
                  <div
                    className="line-clamp-3 prose prose-xs dark:prose-invert max-w-none text-muted-foreground"
                    dangerouslySetInnerHTML={{
                      __html: preview.replace(
                        /@(\w+(?:\s[A-Z]\w*)*)/g,
                        '<span class="text-primary font-medium bg-primary/10 px-1 rounded-sm">@$1</span>'
                      )
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}



