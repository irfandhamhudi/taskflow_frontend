import React, { useState, useEffect, useRef } from 'react';
import {
  format,
  addDays,
  subDays,
  eachDayOfInterval,
  isSameDay,
  isToday,
  startOfMonth,
  endOfMonth,
  differenceInDays,
  parseISO,
  isValid
} from 'date-fns';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  AlertCircle,
  Clock,
  User,
  MoreHorizontal
} from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import type { Task, Priority } from '../../types';
import { priorityConfig } from '../../types';
import { cn } from '../../lib/utils';
import api from '../../utils/api';
import { toast } from 'sonner';

interface TimelineViewProps {
  tasks: Task[];
  currentUserRole: string;
  onOpenDetail: (taskId: string) => Promise<void>;
  setTasks?: React.Dispatch<React.SetStateAction<Task[]>>;
}

export default function TimelineView({ tasks, currentUserRole, onOpenDetail, setTasks }: TimelineViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [timelineStart, setTimelineStart] = useState(startOfMonth(new Date()));
  const [timelineEnd, setTimelineEnd] = useState(endOfMonth(new Date()));
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragStartPos, setDragStartPos] = useState<number>(0);
  const [draggedStartOffset, setDraggedStartOffset] = useState<number>(0);
  const [draggedDueOffset, setDraggedDueOffset] = useState<number>(0);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [isResizing, setIsResizing] = useState<'start' | 'due' | null>(null);
  const [showUnscheduled, setShowUnscheduled] = useState(true);

  const gridRef = useRef<HTMLDivElement>(null);
  const scrollTrackRef = useRef<HTMLDivElement>(null);
  const scrollThumbRef = useRef<HTMLDivElement>(null);

  // Sync custom scrollbar track/thumb with grid scroll position
  const updateCustomScrollbar = () => {
    if (!gridRef.current || !scrollTrackRef.current || !scrollThumbRef.current) return;

    const { scrollLeft, scrollWidth, clientWidth } = gridRef.current;
    const trackWidth = scrollTrackRef.current.clientWidth;

    if (scrollWidth <= clientWidth) {
      scrollThumbRef.current.style.display = 'none';
      return;
    }

    scrollThumbRef.current.style.display = 'block';

    // Calculate size and offset
    const thumbWidth = Math.max(30, trackWidth * (clientWidth / scrollWidth));
    const maxScrollLeft = scrollWidth - clientWidth;
    const maxThumbLeft = trackWidth - thumbWidth;

    const ratio = maxScrollLeft > 0 ? scrollLeft / maxScrollLeft : 0;
    const thumbLeft = ratio * maxThumbLeft;

    scrollThumbRef.current.style.width = `${thumbWidth}px`;
    scrollThumbRef.current.style.transform = `translateX(${thumbLeft}px)`;
  };

  useEffect(() => {
    const grid = gridRef.current;
    if (grid) {
      grid.addEventListener('scroll', updateCustomScrollbar);
      updateCustomScrollbar();

      const resizeObserver = new ResizeObserver(() => {
        updateCustomScrollbar();
      });

      resizeObserver.observe(grid);
      if (scrollTrackRef.current) {
        resizeObserver.observe(scrollTrackRef.current);
      }

      return () => {
        grid.removeEventListener('scroll', updateCustomScrollbar);
        resizeObserver.disconnect();
      };
    }
  }, [tasks, currentDate, showUnscheduled]);

  // Stepped smooth scrolling with Left/Right buttons
  const handleScrollStep = (direction: 'left' | 'right') => {
    if (gridRef.current) {
      const step = 160; // scroll by 4 column day widths (40px * 4)
      const targetScroll = gridRef.current.scrollLeft + (direction === 'left' ? -step : step);
      gridRef.current.scrollTo({ left: targetScroll, behavior: 'smooth' });
    }
  };

  // Absolute positioning scroll when clicking track
  const handleTrackClick = (e: React.MouseEvent) => {
    if (e.target === scrollThumbRef.current) return;
    if (!gridRef.current || !scrollTrackRef.current) return;

    const rect = scrollTrackRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const trackWidth = rect.width;

    const { scrollWidth, clientWidth } = gridRef.current;
    const thumbWidth = Math.max(30, trackWidth * (clientWidth / scrollWidth));

    const thumbLeft = clickX - thumbWidth / 2;
    const maxThumbLeft = trackWidth - thumbWidth;

    if (maxThumbLeft <= 0) return;
    const ratio = Math.max(0, Math.min(1, thumbLeft / maxThumbLeft));

    const maxScrollLeft = scrollWidth - clientWidth;
    gridRef.current.scrollLeft = ratio * maxScrollLeft;
  };

  // Drag thumb to scroll grid
  const handleThumbMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const startX = e.pageX;
    const startScrollLeft = gridRef.current?.scrollLeft || 0;
    const { scrollWidth, clientWidth } = gridRef.current || { scrollWidth: 0, clientWidth: 0 };
    const trackWidth = scrollTrackRef.current?.clientWidth || 0;
    const thumbWidth = Math.max(30, trackWidth * (clientWidth / scrollWidth));
    const maxScrollLeft = scrollWidth - clientWidth;
    const maxThumbLeft = trackWidth - thumbWidth;

    if (maxThumbLeft <= 0) return;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.pageX - startX;
      const ratio = deltaX / maxThumbLeft;
      const deltaScroll = ratio * maxScrollLeft;
      if (gridRef.current) {
        gridRef.current.scrollLeft = Math.max(0, Math.min(maxScrollLeft, startScrollLeft + deltaScroll));
      }
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Drag thumb to scroll grid (touch support for mobile)
  const handleThumbTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 0) return;
    e.preventDefault();
    e.stopPropagation();

    const startX = e.touches[0].pageX;
    const startScrollLeft = gridRef.current?.scrollLeft || 0;
    const { scrollWidth, clientWidth } = gridRef.current || { scrollWidth: 0, clientWidth: 0 };
    const trackWidth = scrollTrackRef.current?.clientWidth || 0;
    const thumbWidth = Math.max(30, trackWidth * (clientWidth / scrollWidth));
    const maxScrollLeft = scrollWidth - clientWidth;
    const maxThumbLeft = trackWidth - thumbWidth;

    if (maxThumbLeft <= 0) return;

    const handleTouchMove = (moveEvent: TouchEvent) => {
      if (moveEvent.touches.length === 0) return;
      const deltaX = moveEvent.touches[0].pageX - startX;
      const ratio = deltaX / maxThumbLeft;
      const deltaScroll = ratio * maxScrollLeft;
      if (gridRef.current) {
        gridRef.current.scrollLeft = Math.max(0, Math.min(maxScrollLeft, startScrollLeft + deltaScroll));
      }
    };

    const handleTouchEnd = () => {
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };

    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd);
  };

  // Sync timeline range with currentDate
  useEffect(() => {
    setTimelineStart(startOfMonth(currentDate));
    setTimelineEnd(endOfMonth(currentDate));
  }, [currentDate]);

  const days = eachDayOfInterval({ start: timelineStart, end: timelineEnd });
  const totalDays = days.length;

  const isReadOnly = ['viewer'].includes(currentUserRole);

  // Filter tasks into scheduled and unscheduled
  const scheduledTasks = tasks.filter(t => t.startDate || t.dueDate);
  const unscheduledTasks = tasks.filter(t => !t.startDate && !t.dueDate);

  // Helpers to safely parse and get task dates within range
  const getTaskDates = (task: Task) => {
    let start = task.startDate ? parseISO(task.startDate) : null;
    let due = task.dueDate ? parseISO(task.dueDate) : null;

    if (!start && due) start = due;
    if (start && !due) due = start;

    return { start, due };
  };

  const handlePrevMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Drag and drop interaction handlers
  const handleTaskBarMouseDown = (
    e: React.MouseEvent,
    task: Task,
    resizeMode: 'start' | 'due' | null = null
  ) => {
    if (isReadOnly) return;
    e.preventDefault();
    e.stopPropagation();

    const rect = e.currentTarget.getBoundingClientRect();
    setDraggedTaskId(task._id);
    setIsResizing(resizeMode);
    setDragStartPos(e.clientX);

    const { start, due } = getTaskDates(task);
    if (start && due) {
      setDraggedStartOffset(0);
      setDraggedDueOffset(0);
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!draggedTaskId) return;

      const diffX = e.clientX - dragStartPos;
      // Day width in pixels is roughly 40px (w-10)
      const dayWidth = 40;
      const daysDiff = Math.round(diffX / dayWidth);

      if (isResizing === 'start') {
        setDraggedStartOffset(daysDiff);
      } else if (isResizing === 'due') {
        setDraggedDueOffset(daysDiff);
      } else {
        // Dragging entire bar
        setDraggedStartOffset(daysDiff);
        setDraggedDueOffset(daysDiff);
      }
    };

    const handleMouseUp = async () => {
      if (!draggedTaskId) return;

      const taskId = draggedTaskId;
      const resize = isResizing;

      // Reset states
      setDraggedTaskId(null);
      setIsResizing(null);

      if (draggedStartOffset === 0 && draggedDueOffset === 0) return;

      const task = tasks.find(t => t._id === taskId);
      if (!task) return;

      const { start, due } = getTaskDates(task);
      if (!start || !due) return;

      let newStart = start;
      let newDue = due;

      if (resize === 'start') {
        newStart = addDays(start, draggedStartOffset);
        if (newStart > newDue) newStart = newDue;
      } else if (resize === 'due') {
        newDue = addDays(due, draggedDueOffset);
        if (newDue < newStart) newDue = newStart;
      } else {
        newStart = addDays(start, draggedStartOffset);
        newDue = addDays(due, draggedDueOffset);
      }

      setDraggedStartOffset(0);
      setDraggedDueOffset(0);

      // Perform update API request
      try {
        const res = await api.put(`/tasks/${taskId}`, {
          startDate: newStart.toISOString(),
          dueDate: newDue.toISOString()
        });

        if (res.data.success) {
          toast.success("Task schedule updated successfully");
          if (setTasks) {
            setTasks(prev => prev.map(t => t._id === taskId ? {
              ...t,
              startDate: newStart.toISOString(),
              dueDate: newDue.toISOString()
            } : t));
          }
        } else {
          toast.error(res.data.message || "Failed to update schedule");
        }
      } catch (error: any) {
        console.error("Update task date error:", error);
        toast.error("Error updating schedule: " + (error.response?.data?.message || error.message));
      }
    };

    if (draggedTaskId) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggedTaskId, dragStartPos, isResizing, draggedStartOffset, draggedDueOffset, tasks, setTasks]);

  // Set date for unscheduled tasks
  const handleAssignDate = async (taskId: string, date: Date) => {
    try {
      const start = date;
      const due = addDays(date, 1); // default to 1 day span

      const res = await api.put(`/tasks/${taskId}`, {
        startDate: start.toISOString(),
        dueDate: due.toISOString()
      });

      if (res.data.success) {
        toast.success("Task scheduled successfully");
        if (setTasks) {
          setTasks(prev => prev.map(t => t._id === taskId ? {
            ...t,
            startDate: start.toISOString(),
            dueDate: due.toISOString()
          } : t));
        }
      } else {
        toast.error(res.data.message || "Failed to schedule task");
      }
    } catch (error: any) {
      console.error(error);
      toast.error("Error scheduling task: " + (error.response?.data?.message || error.message));
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (
      target.closest('.cursor-grab') ||
      target.closest('button') ||
      target.closest('input') ||
      target.closest('.sticky')
    ) {
      return;
    }

    setIsMouseDown(true);
    if (gridRef.current) {
      setStartX(e.pageX - gridRef.current.offsetLeft);
      setScrollLeft(gridRef.current.scrollLeft);
    }
  };

  const handleMouseLeave = () => {
    setIsMouseDown(false);
  };

  const handleMouseUp = () => {
    setIsMouseDown(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isMouseDown || !gridRef.current) return;
    e.preventDefault();
    const x = e.pageX - gridRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    gridRef.current.scrollLeft = scrollLeft - walk;
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-320px)] lg:h-[calc(100vh-230px)] overflow-y-auto lg:overflow-hidden">
      {/* Left Sidebar: Unscheduled Tasks */}
      {showUnscheduled && (
        <Card className="w-full lg:w-80 flex flex-col h-[300px] lg:h-full shrink-0 border-border/60 shadow-sm bg-card/60 backdrop-blur-md">
          <div className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <h3 className="font-semibold text-sm">Unscheduled Tasks</h3>
            </div>
            <Badge variant="secondary" className="rounded-full px-2 py-0.5 text-xs font-semibold">
              {unscheduledTasks.length}
            </Badge>
          </div>
          <div className="p-3 flex-1 overflow-y-auto space-y-2.5">
            {unscheduledTasks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-xs">
                All tasks are scheduled!
              </div>
            ) : (
              unscheduledTasks.map(task => (
                <div
                  key={task._id}
                  className="p-3 rounded-lg border bg-background/50 hover:bg-accent/40 transition-all cursor-pointer group shadow-sm flex flex-col gap-2"
                  onClick={() => onOpenDetail(task._id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-semibold leading-tight line-clamp-2">
                      {task.title}
                    </span>
                    <Badge className={cn("text-[9px] px-1.5 py-0.2 rounded-full shrink-0 font-medium", priorityConfig[task.priority].className)}>
                      {priorityConfig[task.priority].label}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between mt-1">
                    <div className="flex -space-x-1 overflow-hidden">
                      {task.assignedTo && task.assignedTo.length > 0 ? (
                        task.assignedTo.map(u => (
                          <TooltipProvider key={u._id}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="h-5 w-5 rounded-full border border-background bg-muted flex items-center justify-center text-[10px] overflow-hidden">
                                  {u.profilePicture ? (
                                    <img src={u.profilePicture} alt={u.name} className="h-full w-full object-cover" />
                                  ) : (
                                    <User className="h-3 w-3" />
                                  )}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>{u.name}</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ))
                      ) : (
                        <span className="text-[10px] text-muted-foreground">Unassigned</span>
                      )}
                    </div>

                    {!isReadOnly && (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 rounded hover:bg-accent opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="p-0 w-auto" align="end" onClick={(e) => e.stopPropagation()}>
                          <Calendar
                            mode="single"
                            onSelect={(date) => date && handleAssignDate(task._id, date)}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      )}

      {/* Right Sidebar: Timeline Gantt Grid */}
      <Card className="flex-1 flex flex-col h-[500px] lg:h-full overflow-hidden border-border/60 shadow-sm bg-card/60 backdrop-blur-md">
        {/* Timeline Header */}
        <div className="p-4 border-b flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <CalendarIcon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Timeline Chart</h3>
              <p className="text-xs text-muted-foreground">Drag to reschedule. Stretch edges to adjust duration.</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-start md:justify-end">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs font-semibold"
              onClick={() => setShowUnscheduled(!showUnscheduled)}
            >
              {showUnscheduled ? "Hide Unscheduled" : "Show Unscheduled"}
            </Button>

            <div className="flex items-center gap-1 bg-background border rounded-lg p-1">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handlePrevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs font-semibold px-2 min-w-[100px] text-center">
                {format(currentDate, 'MMMM yyyy')}
              </span>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={handleToday}>
              Today
            </Button>
          </div>
        </div>

        {/* Timeline Grid Content */}
        <div
          className={cn(
            "flex-1 overflow-auto timeline-scrollbar select-none",
            isMouseDown ? "cursor-grabbing" : "cursor-grab"
          )}
          ref={gridRef}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
        >
          {scheduledTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-16 text-muted-foreground gap-2">
              <AlertCircle className="w-8 h-8 opacity-40 text-primary" />
              <p className="text-sm">No tasks scheduled for this period.</p>
              <p className="text-xs opacity-75">Assign dates to tasks in the sidebar to visualize them here.</p>
            </div>
          ) : (
            <div className="w-fit min-w-full select-none relative">

              {/* Header Days Row */}
              <div className="flex border-b bg-muted/40 sticky top-0 z-20">
                {/* Task Title header column */}
                <div className="w-[120px] sm:w-[180px] md:w-[280px] shrink-0 border-r py-3 px-2 sm:px-4 font-semibold text-xs text-muted-foreground uppercase tracking-wider sticky left-0 bg-card z-30 shadow-[2px_0_5px_rgba(0,0,0,0.02)] truncate">
                  Task Title
                </div>
                {/* Calendar Days */}
                <div className="flex flex-1">
                  {days.map(day => (
                    <div
                      key={day.toString()}
                      className={cn(
                        "w-10 shrink-0 border-r py-2 text-center flex flex-col items-center justify-center text-xs font-semibold",
                        isToday(day) && "bg-primary/10 text-primary",
                        (day.getDay() === 0 || day.getDay() === 6) && "bg-muted/10 text-muted-foreground"
                      )}
                    >
                      <span className="text-[10px] opacity-75 uppercase">{format(day, 'eee')[0]}</span>
                      <span className="text-xs">{format(day, 'd')}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rows Grid */}
              <div className="divide-y relative">
                {scheduledTasks.map(task => {
                  const { start, due } = getTaskDates(task);
                  if (!start || !due) return null;

                  // Calculate margins & widths
                  let totalSpan = differenceInDays(timelineEnd, timelineStart) + 1;

                  // Task bar start index
                  let startDayIdx = differenceInDays(start, timelineStart);
                  let dueDayIdx = differenceInDays(due, timelineStart);

                  // Clip to timeline range for visualization
                  const isStartedBeforeTimeline = startDayIdx < 0;
                  const isFinishedAfterTimeline = dueDayIdx >= totalSpan;

                  const visibleStartIdx = Math.max(0, startDayIdx);
                  const visibleDueIdx = Math.min(totalSpan - 1, dueDayIdx);
                  const activeDaysSpan = Math.max(1, visibleDueIdx - visibleStartIdx + 1);

                  // Width and Left positioning: Day column is 40px width
                  const dayWidth = 40;
                  const leftPos = visibleStartIdx * dayWidth;
                  const barWidth = activeDaysSpan * dayWidth;

                  // Handle offsets during active drag
                  const isCurrentDragged = draggedTaskId === task._id;
                  const startOffset = isCurrentDragged ? draggedStartOffset : 0;
                  const dueOffset = isCurrentDragged ? draggedDueOffset : 0;

                  const renderedLeft = leftPos + (startOffset * dayWidth);
                  const renderedWidth = barWidth + ((dueOffset - startOffset) * dayWidth);

                  // Priority styles
                  const getPriorityBarColor = (priority: Priority) => {
                    switch (priority) {
                      case 'urgent': return 'bg-red-500/20 hover:bg-red-500/35 border-red-500 text-red-700 dark:text-red-300';
                      case 'high': return 'bg-orange-500/20 hover:bg-orange-500/35 border-orange-500 text-orange-700 dark:text-orange-300';
                      case 'medium': return 'bg-yellow-500/20 hover:bg-yellow-500/35 border-yellow-400 text-yellow-700 dark:text-yellow-300';
                      default: return 'bg-blue-500/20 hover:bg-blue-500/35 border-blue-400 text-blue-700 dark:text-blue-300';
                    }
                  };

                  return (
                    <div key={task._id} className="flex group/row hover:bg-accent/10 transition-colors h-12 items-center relative">
                      {/* Left Sticky Task Header */}
                      <div
                        className="w-[120px] sm:w-[180px] md:w-[280px] shrink-0 h-full border-r px-2 sm:px-4 flex items-center justify-between sticky left-0 bg-card z-20 shadow-[2px_0_5px_rgba(0,0,0,0.02)] cursor-pointer after:absolute after:inset-0 after:bg-accent/10 after:opacity-0 group-hover/row:after:opacity-100 after:pointer-events-none"
                        onClick={() => onOpenDetail(task._id)}
                      >
                        <span className="text-xs font-semibold truncate min-w-0 group-hover/row:text-primary transition-colors">
                          {task.title}
                        </span>

                        <div className="flex items-center gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity flex-shrink-0 ml-1 sm:ml-2 hidden sm:flex">
                          <Badge variant="outline" className="text-[9px] px-1 py-0 rounded font-medium text-muted-foreground uppercase bg-background">
                            {task.status}
                          </Badge>
                        </div>
                      </div>

                      {/* Right Grid Row & Bar Area */}
                      <div className="flex-1 h-full relative z-10 overflow-hidden flex items-center">
                        {/* Background lines mapping */}
                        <div className="absolute inset-0 flex pointer-events-none">
                          {days.map((day, i) => (
                            <div
                              key={i}
                              className={cn(
                                "w-10 shrink-0 border-r h-full",
                                isToday(day) && "bg-primary/5",
                                (day.getDay() === 0 || day.getDay() === 6) && "bg-muted/5"
                              )}
                            />
                          ))}
                        </div>

                        {/* Task Gantt Bar */}
                        {((startDayIdx < totalSpan && dueDayIdx >= 0) || isCurrentDragged) && (
                          <div
                            style={{
                              left: `${renderedLeft}px`,
                              width: `${Math.max(20, renderedWidth)}px`
                            }}
                            className={cn(
                              "absolute h-7 rounded border shadow-sm transition-all duration-75 flex items-center justify-between px-2 font-medium text-xs cursor-grab active:cursor-grabbing group/bar",
                              getPriorityBarColor(task.priority),
                              isCurrentDragged && "opacity-90 shadow-md ring-2 ring-primary/40 scale-[1.01]"
                            )}
                            onMouseDown={(e) => handleTaskBarMouseDown(e, task)}
                          >
                            {/* Resize handle left */}
                            {!isReadOnly && (
                              <div
                                className="absolute left-0 top-0 bottom-0 w-1.5 cursor-ew-resize opacity-0 group-hover/bar:opacity-100 bg-foreground/20 hover:bg-foreground/40 rounded-l"
                                onMouseDown={(e) => handleTaskBarMouseDown(e, task, 'start')}
                              />
                            )}

                            {/* Label */}
                            <span className="truncate w-full text-center px-1 font-semibold pointer-events-none">
                              {task.title}
                            </span>

                            {/* Resize handle right */}
                            {!isReadOnly && (
                              <div
                                className="absolute right-0 top-0 bottom-0 w-1.5 cursor-ew-resize opacity-0 group-hover/bar:opacity-100 bg-foreground/20 hover:bg-foreground/40 rounded-r"
                                onMouseDown={(e) => handleTaskBarMouseDown(e, task, 'due')}
                              />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Custom scrollbar controls footer */}
        {scheduledTasks.length > 0 && (
          <div className="px-6 py-3 border-t bg-muted/10 dark:bg-card/40 flex items-center justify-between gap-4 select-none shrink-0">
            {/* Left & Right quick scroll buttons */}
            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7 rounded-md border-border bg-background hover:bg-accent text-foreground transition-colors"
                onClick={() => handleScrollStep('left')}
                title="Scroll Left"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7 rounded-md border-border bg-background hover:bg-accent text-foreground transition-colors"
                onClick={() => handleScrollStep('right')}
                title="Scroll Right"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            {/* Custom scroll track & thumb with padding for mobile touch targets */}
            <div
              ref={scrollTrackRef}
              className="flex-1 py-2.5 cursor-pointer relative flex items-center group/track"
              onClick={handleTrackClick}
            >
              <div className="w-full h-2 bg-muted/40 dark:bg-muted/20 group-hover/track:bg-muted/65 dark:group-hover/track:bg-muted/30 transition-colors rounded-full relative flex items-center">
                <div
                  ref={scrollThumbRef}
                  className="h-1.5 bg-primary/40 hover:bg-primary/65 active:bg-primary/85 transition-all rounded-full absolute cursor-grab active:cursor-grabbing border border-background/20"
                  onMouseDown={handleThumbMouseDown}
                  onTouchStart={handleThumbTouchStart}
                />
              </div>
            </div>

            {/* Navigator Indicator Badge */}
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider bg-background border rounded px-2 py-0.5">
                Timeline Navigator
              </span>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
