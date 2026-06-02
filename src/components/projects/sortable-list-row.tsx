// components/projects/SortableListRow.tsx
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TableCell, TableRow } from '../ui/table';
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
  Users,
  MessageSquare,
  Paperclip,
  ArchiveRestore,
} from 'lucide-react';
import { format } from 'date-fns';
import type { Task, Priority } from '../../types/index';

const columnTitles: Record<string, string> = {
  todo: 'To Do',
  inprogress: 'In Progress',
  review: 'Review',
  done: 'Done',
};

const priorityConfig: Record<Priority, { label: string; className: string }> = {
  low: { label: 'Low Priority', className: 'bg-muted text-muted-foreground' },
  medium: { label: 'Medium Priority', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  high: { label: 'High Priority', className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' },
  urgent: { label: 'Urgent', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
};

interface SortableListRowProps {
  task: Task;
  onOpenDetail: (taskId: string) => void;
  onOpenEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onUnarchive?: (taskId: string) => void;
  isArchiveView?: boolean;
  currentUserRole?: string; // ← TAMBAHKAN PROP INI
}

export function SortableListRow({
  task,
  onOpenDetail,
  onOpenEdit,
  onDelete,
  onUnarchive,
  isArchiveView = false,
  currentUserRole = 'viewer',
}: SortableListRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    setActivatorNodeRef,
  } = useSortable({ id: task.id, disabled: isArchiveView });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isArchiveView ? 0.7 : 1,
  };

  const priority = priorityConfig[task.priority];
  const statusText = columnTitles[task.columnId] || task.columnId || 'Unknown';
  const commentsCount = task.commentsCount ?? 0;
  const canEditOrDelete = ['admin', 'editor', 'owner'].includes(currentUserRole);

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className={isDragging ? 'opacity-50 bg-muted' : ''}
    >
      {/* Task Title */}
      <TableCell
        className={`font-medium cursor-${isArchiveView ? 'default' : 'grab'} max-w-48`}
        {...(isArchiveView ? {} : { ...attributes, ...listeners })}
        ref={isArchiveView ? undefined : setActivatorNodeRef}
      >
        <div className="truncate">
          {task.title}
          {isArchiveView && (
            <Badge variant="outline" className="ml-2 text-xs">
              Archived
            </Badge>
          )}
        </div>
      </TableCell>

      {/* Priority */}
      <TableCell>
        <Badge
          variant="secondary"
          className={`text-xs font-medium px-2.5 py-1 rounded ${priority.className}`}
        >
          {priority.label}
        </Badge>
      </TableCell>

      {/* Start Date */}
      <TableCell className="text-sm text-muted-foreground hidden lg:table-cell">
        {task.startDate ? format(new Date(task.startDate), 'MMM d, yyyy') : '—'}
      </TableCell>

      {/* Due Date */}
      <TableCell className="text-sm text-muted-foreground hidden lg:table-cell">
        {task.dueDate ? format(new Date(task.dueDate), 'MMM d, yyyy') : '—'}
      </TableCell>

      {/* Members */}
      <TableCell className="hidden md:table-cell">
        {task.membersCount > 0 ? (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{task.membersCount}</span>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        )}
      </TableCell>

      {/* Comments – sekarang konsisten dengan SortableTaskCard */}
      <TableCell className="hidden xl:table-cell">
        {commentsCount > 0 ? (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <MessageSquare className="h-4 w-4" />
            <span>{commentsCount}</span>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        )}
      </TableCell>

      {/* Attachments */}
      <TableCell className="hidden xl:table-cell">
        {task.attachmentsCount > 0 ? (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Paperclip className="h-4 w-4" />
            <span>{task.attachmentsCount}</span>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        )}
      </TableCell>

      {/* Status */}
      <TableCell className="text-sm font-medium">{statusText}</TableCell>

      {/* Actions */}
      <TableCell className="text-right">
        {isArchiveView ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onUnarchive?.(task._id)}
            className="text-primary hover:text-primary/80"
          >
            <ArchiveRestore className="h-4 w-4 mr-1" />
            Unarchive
          </Button>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-60 hover:opacity-100">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onSelect={() => onOpenDetail(task._id)}
                className="flex items-center text-[13px]"
              >
                <ListChevronsUpDown className="h-4 w-4 mr-2 text-muted-foreground" />
                Task detail
              </DropdownMenuItem>

              {canEditOrDelete && (
                <>
                  <DropdownMenuItem
                    onSelect={() => onOpenEdit(task)}
                    className="flex items-center text-[13px]"
                  >
                    <SquarePen className="h-4 w-4 mr-2 text-muted-foreground" />
                    Update task
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onSelect={() => onDelete(task._id)}
                    className="text-destructive flex items-center text-[13px]"
                  >
                    <Trash2 className="h-4 w-4 mr-2 text-destructive" />
                    Delete task
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </TableCell>
    </TableRow>
  );
}
