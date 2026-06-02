'use client';

import { useEffect, useState } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  addDays,
  subDays,
  isWithinInterval,
  isToday
} from 'date-fns';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  MessageSquare, 
  Paperclip, 
  Users
} from 'lucide-react';
import { AppSidebar } from '../../components/app-sidebar';
import { SiteHeader } from '../../components/site-header';
import { SidebarInset, SidebarProvider } from '../../components/ui/sidebar';
import TaskDetailSheet from '../../components/projects/task-detail';
import api from '../../utils/api';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';
import { toast } from 'sonner';
import type { Task } from '../../types';
import { cn } from '../../lib/utils';
import { Separator } from '../../components/ui/separator';
import { CalendarSkeleton } from '../../components/features/calendar/loader/calendar-skeleton';
import { CalendarError } from '../../components/features/calendar/error/error';

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('month');
  
  // Force 'day' view on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setViewMode('day');
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  let viewStart: Date;
  let viewEnd: Date;
  let viewTitle: string;

  if (viewMode === 'month') {
    viewStart = startOfMonth(currentDate);
    viewEnd = endOfMonth(currentDate);
    viewTitle = format(currentDate, 'MMMM yyyy');
  } else if (viewMode === 'week') {
    viewStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    viewEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
    viewTitle = `${format(viewStart, 'd MMM')} - ${format(viewEnd, 'd MMM yyyy')}`;
  } else {
    viewStart = currentDate;
    viewEnd = currentDate;
    // Remove day name in responsive mode
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
    viewTitle = isMobile 
      ? format(currentDate, 'd MMMM yyyy') 
      : format(currentDate, 'EEEE, d MMMM yyyy');
  }

  // Ensure we show the full weeks for the month view to fill the grid nicely
  const calendarStart = viewMode === 'month' ? startOfWeek(viewStart, { weekStartsOn: 1 }) : viewStart;
  const calendarEnd = viewMode === 'month' ? endOfWeek(viewEnd, { weekStartsOn: 1 }) : viewEnd;
  
  const viewDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const { activeWorkspace } = useWorkspaceStore();

  // Fetch tasks
  useEffect(() => {
    const fetchTasks = async () => {
      const workspaceId = activeWorkspace?._id;
      if (!workspaceId) return;
      
      setLoading(true);
      try {
        const res = await api.get('/tasks', { 
          params: { 
            limit: 300,
            workspaceId: workspaceId
          } 
        });
        if (res.data.success) {
          const backendTasks = res.data.data || [];
          const mappedTasks: Task[] = backendTasks.map((t: any) => {
            const totalComments = (t.comments || []).reduce(
              (count: number, c: any) => count + 1 + (c.replies?.length || 0),
              0
            );

            // Handle project field which might be populated
            const projectObj = t.projectId && typeof t.projectId === 'object' ? t.projectId : null;
            const projectId = projectObj ? projectObj._id : t.projectId;
            
            return {
              _id: t._id,
              title: t.title,
              description: t.description,
              projectId: projectId,
              projectName: projectObj?.name,
              projectColor: projectObj?.color,
              dueDate: t.dueDate,
              startDate: t.startDate,
              priority: t.priority || 'medium',
              assignedTo: t.assignedTo || [],
              subtasks: t.subtasks || [],
              comments: t.comments || [],
              attachments: t.attachments || [],
              status: t.status || "todo",
              columnId: t.status || "todo",
              createdBy: t.createdBy,
              commentsCount: totalComments,
              attachmentsCount: (t.attachments || []).length,
              membersCount: (t.assignedTo || []).length,
            };
          });
          setTasks(mappedTasks);
        } else {
          setError(res.data.message || 'Failed to load tasks');
          toast.error('Failed to load tasks');
        }
      } catch (error: any) {
        setError(error.response?.data?.message || error.message || 'Failed to fetch tasks');
        toast.error('Failed to fetch tasks');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [activeWorkspace?._id]);

  const getTasksForDate = (date: Date) => {
    const currentDay = format(date, 'yyyy-MM-dd');

    return tasks.filter((task) => {
      if (!task.startDate && !task.dueDate) return false;

      const taskStart = task.startDate ? new Date(task.startDate) : null;
      const taskDue = task.dueDate ? new Date(task.dueDate) : null;
      const current = new Date(currentDay);

      if (!taskStart && taskDue) return isSameDay(current, taskDue);
      if (taskStart && !taskDue) return isSameDay(current, taskStart);
      if (taskStart && taskDue) {
        // Simple range check
        return isWithinInterval(current, { start: taskStart, end: taskDue }) || 
               isSameDay(current, taskStart) || 
               isSameDay(current, taskDue);
      }
      return false;
    });
  };

  const handlePrev = () => {
    if (viewMode === 'month') setCurrentDate(subMonths(currentDate, 1));
    else if (viewMode === 'week') setCurrentDate(subDays(currentDate, 7));
    else setCurrentDate(subDays(currentDate, 1));
  };

  const handleNext = () => {
    if (viewMode === 'month') setCurrentDate(addMonths(currentDate, 1));
    else if (viewMode === 'week') setCurrentDate(addDays(currentDate, 7));
    else setCurrentDate(addDays(currentDate, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        {loading ? (
          <CalendarSkeleton />
        ) : error ? (
          <CalendarError message={error} />
        ) : (
          <div className="flex flex-1 flex-col overflow-hidden bg-muted/10">
            <div className="flex-1 flex flex-col p-4 md:p-6 lg:p-8 h-full overflow-hidden">
              
              {/* Header Section */}
              <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <CalendarIcon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Calendar</h1>
                    <p className="text-sm text-muted-foreground">Manage your tasks and schedule</p>
                  </div>
                </div>

                <div className="flex items-center gap-1 bg-background p-1.5 rounded-lg border shadow-sm">
                  <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
                    <TabsList className="h-8">
                      <TabsTrigger value="month" className="h-7 text-xs hidden sm:inline-flex">Month</TabsTrigger>
                      <TabsTrigger value="week" className="h-7 text-xs hidden sm:inline-flex">Week</TabsTrigger>
                      <TabsTrigger value="day" className="h-7 text-xs">Day</TabsTrigger>
                    </TabsList>
                  </Tabs>
                  <Separator orientation="vertical" className="h-6 mx-1" />
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={handlePrev}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="h-7 flex items-center justify-center px-4 min-w-[140px] font-medium text-sm">
                      {viewTitle}
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={handleNext}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                  <Separator orientation="vertical" className="h-6 mx-1" />
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={handleToday}>
                      Today
                  </Button>
                </div>
              </div>

              {/* Calendar Grid */}
              <Card className="flex-1 flex flex-col overflow-hidden shadow-sm border-border/60">
                  
                  {/* Days Header */}
                  {(viewMode === 'month' || viewMode === 'week') && (
                    <div className="grid grid-cols-7 border-b bg-muted/40 divide-x divide-border/40">
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                        <div key={day} className="py-3 text-center">
                          <span className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">
                            {day}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Days Grid */}
                  <CardContent className="p-0 flex-1 overflow-y-auto">
                      <div className={cn(
                        "grid h-full", 
                        viewMode === 'day' ? 'grid-cols-1' : 'grid-cols-7',
                        viewMode === 'month' ? 'auto-rows-fr' : ''
                      )}>
                        {viewDays.map((day) => {
                          const tasksOnDay = getTasksForDate(day);
                          const isCurrentDay = isToday(day);
                          const isCurrentMonth = viewMode === 'month' ? day.getMonth() === currentDate.getMonth() : true;
                          
                          return (
                            <div
                              key={day.toString()}
                              className={cn(
                                "min-h-[120px] p-2 border-b border-r border-border/40 flex flex-col gap-2 transition-colors relative group",
                                !isCurrentMonth && "bg-muted/20 text-muted-foreground",
                                isCurrentDay && "bg-primary/5"
                              )}
                            >
                              {/* Day Number */}
                              <div className="flex items-center justify-between mb-1">
                                <div className={cn(
                                  "h-7 w-7 flex items-center justify-center rounded-full text-sm transition-colors",
                                  isCurrentDay 
                                    ? "bg-primary text-primary-foreground font-bold shadow-sm" 
                                    : "font-medium text-muted-foreground group-hover:bg-muted"
                                )}>
                                  {format(day, 'd')}
                                </div>
                                {viewMode !== 'month' && (
                                  <span className="text-xs font-medium text-muted-foreground mr-1 hidden sm:inline">
                                    {format(day, 'EEEE')}
                                  </span>
                                )}
                              </div>

                              {/* Tasks List */}
                              <div className="flex-1 flex flex-col gap-1.5 overflow-y-auto pr-1 customize-scrollbar">
                                {tasksOnDay.map((task) => (
                                  <div
                                    key={task._id}
                                    onClick={() => setSelectedTask(task)}
                                    className="group/task relative bg-card hover:bg-accent/50 p-2 rounded-md border shadow-sm cursor-pointer transition-all hover:shadow-sm hover:scale-[1.01] overflow-hidden"
                                  >
                                    {/* Priority Indicator Strip */}
                                    <div className={cn("absolute left-0 top-0 bottom-0 w-1", getPriorityColor(task.priority))} />
                                    
                                    <div className="pl-2.5">
                                      <h4 className="text-xs font-semibold line-clamp-1 leading-tight mb-1 text-card-foreground">
                                        {task.title}
                                      </h4>
                                      
                                      <div className="flex items-center gap-2 mt-1.5">
                                        {/* Project Name Badge */}
                                        <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full truncate max-w-[80px]">
                                            {task.projectName || "No Project"}
                                        </span>
                                      </div>

                                      {/* Task Metadata Icons */}
                                      <div className="flex items-center gap-3 mt-2 text-muted-foreground">
                                        {(task.commentsCount > 0) && (
                                          <div className="flex items-center gap-0.5 text-[10px]">
                                            <MessageSquare className="w-3 h-3" />
                                            <span>{task.commentsCount}</span>
                                          </div>
                                        )}
                                        {(task.attachmentsCount > 0) && (
                                          <div className="flex items-center gap-0.5 text-[10px]">
                                            <Paperclip className="w-3 h-3" />
                                            <span>{task.attachmentsCount}</span>
                                          </div>
                                        )}
                                        {(task.membersCount > 0) && (
                                          <div className="flex items-center gap-0.5 text-[10px]">
                                            <Users className="w-3 h-3" />
                                            <span>{task.membersCount}</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                  </CardContent>
                </Card>
            </div>
          </div>
        )}

        <TaskDetailSheet
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          setTasks={setTasks}
        />
      </SidebarInset>
    </SidebarProvider>
  );
}
