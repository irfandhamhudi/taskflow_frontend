// components/project/ListView.tsx
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableListRow } from '../projects/sortable-list-row';
import type { Task } from '../../types/index';
import { Button } from '../ui/button';
import { ArchiveRestore } from 'lucide-react';

interface ListViewProps {
  allTasks: Task[];
  onOpenDetail: (taskId: string) => void;
  onOpenEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  isArchiveView?: boolean;         // ← baru
  onUnarchive?: (taskId: string) => void; // ← baru
  currentUserRole: string;
}

export default function ListView({ allTasks, 
  onOpenDetail, 
  onOpenEdit, 
  onDelete,
  isArchiveView = false,
  onUnarchive,
  currentUserRole
}: ListViewProps) {
  return (
    <div className="overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Task</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead className="hidden lg:table-cell">Start Date</TableHead>
            <TableHead className="hidden lg:table-cell">Due Date</TableHead>
            <TableHead className="hidden md:table-cell">Members</TableHead>
            <TableHead className="hidden xl:table-cell">Comments</TableHead>
            <TableHead className="hidden xl:table-cell">Attachments</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-32 text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <SortableContext items={allTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
            {allTasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                  {isArchiveView ? "No archived tasks" : "No tasks yet"}
                </TableCell>
              </TableRow>
            ) : (
              allTasks.map((task) => (
                <SortableListRow
                  key={task.id}
                  task={task}
                  onOpenDetail={onOpenDetail}
                  onOpenEdit={onOpenEdit}
                  onDelete={onDelete}
                  onUnarchive={onUnarchive}
                  currentUserRole={currentUserRole}
                />
              ))
            )}
          </SortableContext>
        </TableBody>
      </Table>
      
      {/* Jika di archive view, tambahkan tombol unarchive di row */}
      {isArchiveView && onUnarchive && allTasks.length > 0 && (
        <div className="mt-6 flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              allTasks.forEach(task => {
                onUnarchive(task._id);
              });
            }}
          >
            <ArchiveRestore className="mr-2 h-4 w-4" />
            Unarchive All
          </Button>
        </div>
      )}
    </div>
  );
}
