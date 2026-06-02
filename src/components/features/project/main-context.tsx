// components/projects/MainContent.tsx
import  { useRef, useState, useEffect } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { DragOverlay } from '@dnd-kit/core';
import { Card, CardContent } from "../../ui/card";
import { Badge } from "../../ui/badge";
import { MoreVertical, Calendar, Users, MessageSquare, Paperclip } from 'lucide-react';
import KanbanView from '../../projects/kanban-view';
import ListView from '../../projects/list-view';
import TimelineView from '../../projects/timeline-view';
import ProjectAnalytics from './project-analytics';
import ProjectActivity from './project-activity';
import ProjectFiles from './project-files';
import { type ViewType, type Task, type Column, priorityConfig } from "../../../types/index";
import { toast } from "sonner";
import type { DragEndEvent } from '@dnd-kit/core';
import { useParams } from 'react-router-dom';

interface MainContentProps {
  view: ViewType;
  tasks: Task[];
  columns: Column[];
  currentUserRole: string;
  onOpenDetail: (taskId: string) => Promise<void>;
  onOpenEdit: (task: Task) => void;
  onDeleteTask: (taskId: string) => Promise<void>;
  onUnarchive: (taskId: string) => Promise<void>;
  onDragEnd: (event: DragEndEvent) => Promise<void>;
  setTasks?: React.Dispatch<React.SetStateAction<Task[]>>;
}

export default function MainContent(props: MainContentProps) {
  const { view, tasks, columns, currentUserRole, onOpenDetail, onOpenEdit, onDeleteTask, onUnarchive } = props;
  const { projectId } = useParams<{ projectId: string }>();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overColumnId, setOverColumnId] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || view !== 'board') return;
    const checkScroll = () => {
      setCanScrollLeft(container.scrollLeft > 10);
      setCanScrollRight(container.scrollLeft + container.clientWidth < container.scrollWidth - 10);
    };
    checkScroll();
    container.addEventListener('scroll', checkScroll);
    window.addEventListener('resize', checkScroll);
    return () => {
      container.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [view]);

  const handleScrollLeft = () => scrollContainerRef.current?.scrollBy({ left: -300, behavior: 'smooth' });
  const handleScrollRight = () => scrollContainerRef.current?.scrollBy({ left: 300, behavior: 'smooth' });

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    setOverColumnId(null);
    if (!over || active.id === over.id) return;
    const newStatus = over.id as string;
    if (!['todo', 'inprogress', 'review', 'done'].includes(newStatus)) return toast.error("Invalid column");
    try {
      await props.onDragEnd(event);
    } catch (error: any) {
      toast.error(error.message || "Move failed");
    }
  };

  const allTasks = columns.flatMap(col => col.tasks);
  const activeTask = activeId ? allTasks.find(t => t.id === activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={view === 'board' ? (e) => setActiveId(e.active.id as string) : undefined}
      onDragOver={view === 'board' ? (e) => {
        const { over } = e;
        if (over && columns.some(col => col.id === over.id)) setOverColumnId(over.id as string);
        else setOverColumnId(null);
      } : undefined}
      onDragEnd={view === 'board' ? handleDragEnd : undefined}
      onDragCancel={view === 'board' ? () => { setActiveId(null); setOverColumnId(null); } : undefined}
    >
      {view === 'board' ? (
        <KanbanView
          columns={columns}
          overColumnId={overColumnId}
          onOpenDetail={onOpenDetail}
          onOpenEdit={onOpenEdit}
          onDelete={onDeleteTask}
          scrollContainerRef={scrollContainerRef}
          canScrollLeft={canScrollLeft}
          canScrollRight={canScrollRight}
          onScrollLeft={handleScrollLeft}
          onScrollRight={handleScrollRight}
          currentUserRole={currentUserRole}
        />
      ) : view === 'list' ? (
        <ListView
          allTasks={tasks.filter(t => !t.isArchived)}
          onOpenDetail={onOpenDetail}
          onOpenEdit={onOpenEdit}
          onDelete={onDeleteTask}
          currentUserRole={currentUserRole}
        />
      ) : view === 'timeline' ? (
        <TimelineView
          tasks={tasks.filter(t => !t.isArchived)}
          currentUserRole={currentUserRole}
          onOpenDetail={onOpenDetail}
          setTasks={props.setTasks}
        />
      ) : view === 'analytics' ? (
        <ProjectAnalytics tasks={tasks} />
      ) : view === 'activity' && projectId ? (
        <ProjectActivity projectId={projectId} />
      ) : view === 'files' ? (
        <ProjectFiles tasks={tasks} />
      ) : (
        <ListView
          allTasks={tasks.filter(t => t.isArchived)}
          onOpenDetail={onOpenDetail}
          onOpenEdit={onOpenEdit}
          onDelete={onDeleteTask}
          isArchiveView={true}
          onUnarchive={onUnarchive}
          currentUserRole={currentUserRole}
        />
      )}
      <DragOverlay>
        {activeTask && !activeTask.isArchived && (
          <Card className="cursor-grabbing shadow rotate-3 w-full md:w-80 bg-background">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <Badge variant="secondary" className={`text-xs font-medium px-2.5 py-1 rounded ${priorityConfig[activeTask.priority].className}`}>
                  {priorityConfig[activeTask.priority].label}
                </Badge>
                <MoreVertical className="h-4 w-4 opacity-50" />
              </div>
              <h4 className="font-semibold text-base mb-3">{activeTask.title}</h4>
              {(activeTask.startDate || activeTask.dueDate) && (
                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{activeTask.startDate || 'No Date'}</span>
                  </div>
                  <span>-</span>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{activeTask.dueDate || 'No Date'}</span>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                {activeTask.membersCount > 0 && (
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{activeTask.membersCount}</span>
                  </div>
                )}
                {activeTask.commentsCount > 0 && (
                  <div className="flex items-center gap-1">
                    <MessageSquare className="h-4 w-4" />
                    <span>{activeTask.commentsCount}</span>
                  </div>
                )}
                {activeTask.attachmentsCount > 0 && (
                  <div className="flex items-center gap-1">
                    <Paperclip className="h-4 w-4" />
                    <span>{activeTask.attachmentsCount}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </DragOverlay>
    </DndContext>
  );
}

