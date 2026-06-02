// components/project/SortableTaskCard.tsx
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  MoreVertical,
  ListChevronsUpDown,
  SquarePen,
  Trash2,
  Calendar,
  Users,
  MessageSquare,
  Paperclip,
} from 'lucide-react';

import type { Task, Priority } from '../../types/index';
import { format } from 'date-fns';
import { cn } from '../../lib/utils';

const priorityConfig: Record<Priority, { label: string; className: string }> = {
  low: { label: 'Low Priority', className: 'bg-muted text-muted-foreground' },
  medium: { label: 'Medium Priority', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  high: { label: 'High Priority', className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' },
  urgent: { label: 'Urgent', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
};

export function SortableTaskCard({
  task,
  onOpenDetail,
  onOpenEdit,
  onDelete,
  currentUserRole = 'viewer', // default viewer
}: {
  task: Task;
  onOpenDetail: (taskId: string) => void; // ← sekarang terima ID saja (lebih aman)
  onOpenEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  currentUserRole?: string; // ← TAMBAHKAN PROP INI
}) {
  const isViewer = currentUserRole === 'viewer';
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    setActivatorNodeRef,
  } = useSortable({ id: task.id, disabled: isViewer });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const canEditOrDelete = ['admin', 'editor', 'owner'].includes(currentUserRole);

  const priority = priorityConfig[task.priority];

  // Gunakan commentsCount langsung dari task (sudah diupdate realtime)
  const commentsCount = task.commentsCount ?? 0;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative bg-background transition-shadow rounded",
        isDragging ? "opacity-50 shadow-sm" : "shadow-sm",
        isViewer && "cursor-default" // visual cue: tidak ada cursor grab
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <Badge
            variant="secondary"
            className={`text-xs font-medium px-2.5 py-1 rounded ${priority.className}`}
          >
            {priority.label}
          </Badge>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-50 hover:opacity-100"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="flex items-center text-[13px] cursor-pointer"
                onSelect={() => onOpenDetail(task._id)}
              >
                <ListChevronsUpDown className="h-4 w-4 mr-2" />
                View detail
              </DropdownMenuItem>

              {canEditOrDelete && (
                <>
                  <DropdownMenuItem
                    className="flex items-center text-[13px] cursor-pointer"
                    onSelect={() => onOpenEdit(task)}
                  >
                    <SquarePen className="h-4 w-4 mr-2" />
                    Update task
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onSelect={() => onDelete(task._id)}
                    className="text-destructive flex items-center text-[13px] cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4 mr-2 text-destructive" />
                    Move to trash
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Drag handle area */}
       <div
          {...(isViewer ? {} : { ...attributes, ...listeners })}
          ref={isViewer ? undefined : setActivatorNodeRef}
          className={cn(
            "cursor-grab active:cursor-grabbing",
            isViewer && "cursor-default pointer-events-none" // disable interaksi
          )}
        >
          <h4 className="font-semibold text-[15px] mb-3 line-clamp-2">
            {task.title}
          </h4>

          {(task.startDate || task.dueDate) && (
            <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{task.startDate ? format(new Date(task.startDate), 'MMM d, yyyy') : 'No Date'}</span>
              </div>
              <span>-</span>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{task.dueDate ? format(new Date(task.dueDate), 'MMM d, yyyy') : 'No Date'}</span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-start gap-4 text-xs text-muted-foreground">
            {task.membersCount > 0 && (
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{task.membersCount}</span>
              </div>
            )}

            {/* Gunakan commentsCount yang sudah akurat dari realtime */}
            {commentsCount > 0 && (
              <div className="flex items-center gap-1">
                <MessageSquare className="h-4 w-4" />
                <span>{commentsCount}</span>
              </div>
            )}

            {task.attachmentsCount > 0 && (
              <div className="flex items-center gap-1">
                <Paperclip className="h-4 w-4" />
                <span>{task.attachmentsCount}</span>
              </div>
            )}
          </div>
        </div>
  
      </CardContent>
    </Card>
  );
}

