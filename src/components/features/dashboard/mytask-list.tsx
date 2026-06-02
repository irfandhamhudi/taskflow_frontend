// src/features/dashboard/components/MyTasksList.tsx
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Filter, MoreHorizontal, Link as LinkIcon, FileText, FileSpreadsheet, File, CheckCircle2, Clock } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../../ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { Badge } from '../../ui/badge';
import type { Task } from '../../../types';
import { projectTaskService } from '../../../services/projecTaskAPi';
import { useAuth } from '../../../context/AuthContext';
import { useSocket } from '../../../context/SocketContext';
import { cn } from '../../../lib/utils';
import { useCallback } from 'react';
import { Skeleton } from '../../ui/skeleton';

type MyTasksListProps = {
  tasks?: Task[];
};

const getPriorityColor = (priority: string) => {
  const p = priority?.toLowerCase() || 'medium';
  if (p === 'high' || p === 'urgent') return { bg: 'bg-red-50 dark:bg-red-900/10 border-transparent', text: 'text-red-600 dark:text-red-400', dot: 'bg-red-500' };
  if (p === 'medium') return { bg: 'bg-amber-50 dark:bg-amber-900/10 border-transparent', text: 'text-amber-600 dark:text-amber-400', dot: 'bg-amber-500' };
  return { bg: 'bg-slate-100 dark:bg-slate-800 border-transparent', text: 'text-slate-600 dark:text-slate-400', dot: 'bg-slate-400' };
};

const AttachmentIcon = ({ type, className }: { type: string, className?: string }) => {
  const t = type?.toLowerCase() || '';
  if (t.includes('pdf')) return <FileText className={className} />;
  if (t.includes('csv') || t.includes('xls') || t.includes('spreadsheet')) return <FileSpreadsheet className={className} />;
  if (t.includes('link') || t.includes('url')) return <LinkIcon className={className} />;
  return <File className={className} />;
};

import { useWorkspaceStore } from '../../../store/useWorkspaceStore';

export function MyTasksList({ tasks: initialTasks }: MyTasksListProps) {
  const { user } = useAuth();
  const { socket } = useSocket();
  const { activeWorkspace } = useWorkspaceStore();
  const [tasks, setTasks] = useState<Task[]>(initialTasks || []);
  const [isLoading, setIsLoading] = useState(!initialTasks);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    if (!user?._id || !activeWorkspace) return;
    
    // Don't show loading on background refreshes if we already have data
    if (tasks.length === 0) setIsLoading(true);
    
    try {
      const data = await projectTaskService.getTasks({ 
        limit: 5,
        includeArchived: false,
        workspaceId: activeWorkspace._id
      });
      setTasks(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to load tasks");
    } finally {
      setIsLoading(false);
    }
  }, [user?._id, activeWorkspace?._id, tasks.length]);

  useEffect(() => {
    fetchTasks();
  }, [user?._id, activeWorkspace?._id, fetchTasks]); // re-fetch when workspace changes

  useEffect(() => {
    if (!socket) return;

    const handleUpdate = () => {
      console.log('🔄 Task list update triggered via socket');
      fetchTasks();
    };

    socket.on('task_list_updated', handleUpdate);
    socket.on('task_created', handleUpdate);
    socket.on('task_updated', handleUpdate);
    socket.on('task_deleted', handleUpdate);

    return () => {
      socket.off('task_list_updated', handleUpdate);
      socket.off('task_created', handleUpdate);
      socket.off('task_updated', handleUpdate);
      socket.off('task_deleted', handleUpdate);
    };
  }, [socket, fetchTasks]);

  const getStatusProgress = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'todo': return 25;
      case 'inprogress': return 50;
      case 'review': return 75;
      case 'done': return 100;
      default: return 0;
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress <= 25) return 'bg-slate-400';
    if (progress <= 50) return 'bg-amber-500';
    if (progress <= 75) return 'bg-blue-500';
    return 'bg-emerald-500';
  };

  return (
    <Card className="w-full border-border/50 shadow-sm overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between py-4 px-6 bg-muted/5 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary/70" />
          <CardTitle className="text-lg font-bold tracking-tight">Recent Tasks</CardTitle>
        </div>
        {/* <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 gap-1.5 rounded-md text-muted-foreground shadow-sm hover:bg-background">
            <Filter className="h-3.5 w-3.5" />
            Filter
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8 rounded-md text-muted-foreground shadow-sm hover:bg-background">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div> */}
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/10">
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="font-semibold text-muted-foreground whitespace-nowrap h-11 px-6">Task Details</TableHead>
                <TableHead className="font-semibold text-muted-foreground whitespace-nowrap h-11 px-4">Timeline</TableHead>
                <TableHead className="font-semibold text-muted-foreground whitespace-nowrap h-11 px-4">Status & Progress</TableHead>
                <TableHead className="font-semibold text-muted-foreground whitespace-nowrap h-11 px-4">Assignee</TableHead>
                <TableHead className="font-semibold text-muted-foreground whitespace-nowrap h-11 px-4 text-right">Attachments</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i} className="border-border/40">
                    <TableCell className="px-6 py-4">
                      <div className="flex flex-col gap-1.5">
                        <Skeleton className="h-5 w-[150px]" />
                        <Skeleton className="h-3 w-[100px]" />
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-4">
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                    <TableCell className="px-4 py-4">
                      <div className="space-y-2">
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-2 w-full rounded-full" />
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-4">
                      <Skeleton className="h-8 w-8 rounded-full" />
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <Skeleton className="h-8 w-24 rounded-lg ml-auto" />
                    </TableCell>
                  </TableRow>
                ))
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-40 text-center text-destructive p-8">
                    <div className="flex flex-col items-center gap-2">
                      <p className="font-semibold text-lg">Error Loading Data</p>
                      <p className="text-sm opacity-80 max-w-md">{error}</p>
                      <Button variant="outline" size="sm" className="mt-4" onClick={() => window.location.reload()}>Retry</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : tasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-40 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2 opacity-60">
                      <CheckCircle2 className="h-10 w-10 mb-2" />
                      <p className="text-sm font-medium">No tasks found. You're all caught up!</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                tasks.map(task => {
                  const startDate = task.startDate ? new Date(task.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '-';
                  const dueDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '-';
                  const priorityStyle = getPriorityColor(task.priority);
                  const progress = getStatusProgress(task.status);
                  const mainAttachment = task.attachments && task.attachments.length > 0 ? task.attachments[0] : null;
                  
                  const projectObj = typeof task.projectId === 'object' ? (task.projectId as any) : null;
                  const projectName = projectObj?.name || '-';
                  const projectIcon = projectObj?.icon || '📁';

                  return (
                    <TableRow key={task._id} className="border-border/40 hover:bg-muted/30 group transition-colors">
                      <TableCell className="px-6 py-4">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[14px] text-foreground group-hover:text-primary transition-colors">{task.title}</span>
                            <Badge variant="outline" className={cn("text-[10px] h-5 px-1.5 font-bold uppercase", priorityStyle.bg, priorityStyle.text)}>
                              {task.priority}
                            </Badge>
                          </div>
                          {projectName !== '-' && (
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <span className="text-[12px] opacity-80">{projectIcon}</span>
                              <span className="text-[11px] font-bold uppercase tracking-widest">{projectName}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell className="px-4 py-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[11px] font-bold text-muted-foreground/60 uppercase whitespace-nowrap">Due Date</span>
                          <span className="text-[13px] font-semibold text-foreground/80 whitespace-nowrap">{dueDate}</span>
                        </div>
                      </TableCell>
                      
                      <TableCell className="px-4 py-4 min-w-[160px]">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                            <span className={cn(
                              "text-[11px] font-bold uppercase tracking-tight px-1.5 py-0.5 rounded",
                              task.status === 'done' ? "bg-emerald-500/10 text-emerald-600" : "bg-primary/5 text-primary/70"
                            )}>
                              {task.status === 'inprogress' ? 'In Progress' : task.status}
                            </span>
                            <span className="text-[12px] font-bold text-muted-foreground">{progress}%</span>
                          </div>
                          <div className="h-2 w-full bg-secondary/50 rounded-full overflow-hidden shadow-inner">
                            <div 
                              className={cn("h-full rounded-full transition-all duration-500 ease-out", getProgressColor(progress))} 
                              style={{ width: `${progress}%` }} 
                            />
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell className="px-4 py-4">
                        <div className="flex -space-x-2">
                          {task.assignedTo && task.assignedTo.length > 0 ? (
                            task.assignedTo.slice(0, 3).map(user => (
                              <Avatar key={user._id} className="w-8 h-8 border-2 border-background shadow-sm hover:z-10 transition-all cursor-pointer">
                                <AvatarImage src={user.profilePicture} />
                                <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-bold">{user.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground italic">Unassigned</span>
                          )}
                          {task.assignedTo && task.assignedTo.length > 3 && (
                            <div className="w-8 h-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                              +{task.assignedTo.length - 3}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell className="px-6 py-4 text-right">
                        {mainAttachment ? (
                          <div className="flex items-center justify-end">
                            <a 
                              href={mainAttachment.fileUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 bg-background border border-border/60 hover:border-primary/40 hover:bg-primary/5 rounded px-2.5 py-1.5 transition-all group/file shadow-sm"
                            >
                              <AttachmentIcon type={mainAttachment.fileType} className="h-4 w-4 text-muted-foreground group-hover/file:text-primary transition-colors" />
                              <span className="text-[11px] font-semibold text-muted-foreground group-hover/file:text-primary transition-colors max-w-[100px] truncate">
                                {mainAttachment.fileName}
                              </span>
                              {task.attachments.length > 1 && (
                                <Badge variant="secondary" className="h-4 min-w-4 p-0 flex items-center justify-center text-[9px] font-black bg-primary/10 text-primary">
                                  +{task.attachments.length - 1}
                                </Badge>
                              )}
                            </a>
                          </div>
                        ) : (
                          <span className="text-[12px] text-muted-foreground/30 font-medium">No files</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      <div className="py-3 px-6 bg-muted/5 border-t border-border/50 flex justify-between items-center">
        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest">Showing latest 5 tasks</p>
        {/* <Button variant="ghost" size="sm" className="text-[11px] font-bold uppercase tracking-widest hover:text-primary h-7 px-2">View All Tasks</Button> */}
      </div>
    </Card>
  );
}
