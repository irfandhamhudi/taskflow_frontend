// components/project/KanbanColumn.tsx
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Badge } from '../ui/badge';
import { SortableTaskCard } from './sortable-task-card';
import type { Column, Task } from '../../types/index';

export function KanbanColumn({
  column,
  isOver,
  onOpenDetail,
  onOpenEdit,
  onDelete,
  currentUserRole,
}: {
  column: Column;
  isOver: boolean;
  onOpenDetail: (taskId: string) => void;
  onOpenEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  currentUserRole: string;
}) {
  const { setNodeRef } = useDroppable({ id: column.id });

  return (
    <div
      ref={setNodeRef}
      className={`border-2 border-dashed bg-muted rounded flex flex-col w-full md:w-80 md:shrink-0 transition-all md:snap-center ${isOver ? 'border-muted-foreground' : ''
        }`}
    >
      <div className="flex items-center justify-between p-4">
        <h3 className="font-semibold text-base">{column.title}</h3>
        <Badge variant="secondary">{column.tasks.length}</Badge>
      </div>
      <div
        className={`flex-1 overflow-y-auto pl-4 pb-4 ${column.tasks.length >= 2 ? 'max-h-[400px] pr-2' : 'pr-4'
          }`}
      >
        <SortableContext items={column.tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-3">
            {column.tasks.map(task => (
              <SortableTaskCard
                key={task.id}
                task={task}
                onOpenDetail={onOpenDetail}
                onOpenEdit={onOpenEdit}
                onDelete={onDelete}
                currentUserRole={currentUserRole}

              />
            ))}
          </div>
        </SortableContext>
      </div>
    </div>
  );
}

