// hooks/useProjectMainData.ts
import { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useSocket } from "../context/SocketContext";
import { projectTaskService } from "../services/projecTaskAPi";
import type { Task, Column, ViewType, TaskStatus, Priority, Comment } from "../types/index";
import type { Project, Member } from "../types/project";
import type { User } from "../types/user";
import { toast } from "sonner";
import api from "../utils/api";
import axios from "axios";
import { useProjectStore } from "../store/useProjectStore";
import type { DragEndEvent } from '@dnd-kit/core'; // ← ADD THIS LINE
   // ← ADD THIS LINE
export function useProjectMainData() {
  type BackendTask = {
    _id: string;
    title: string;
    description?: string;
    status: string;
    priority: string;
    tags?: string[];
    createdAt: string;
    updatedAt: string;
    completedAt?: string;
    createdBy: { _id: string; name: string; profilePicture?: string };
    assignedTo?: Array<{ _id: string; name: string; profilePicture?: string }>;
    subtasks?: Array<{ _id: string; title: string; completed: boolean }>;
    comments?: Array<{
      _id: string;
      text: string;
      user: { _id: string; name: string; profilePicture?: string };
      replies?: Array<{
        _id: string;
        text: string;
        user: { _id: string; name: string; profilePicture?: string };
      }>;
    }>;
    attachments?: Array<{ _id: string; fileName: string; fileUrl: string; fileType: string; fileSize: number; uploadedBy: string | { _id: string; name: string }; uploadedAt: string }>;
    order?: number;
    isArchived?: boolean;
    startDate?: string;
    dueDate?: string;
    reminders?: Array<{ time: string; notified: boolean; type: 'system' | 'email' }>;
  };
  const { projectId, taskId } = useParams<{ projectId: string; taskId?: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { socket, joinProject, leaveProject } = useSocket();

  // Project states
  const [projectDetail, setProjectDetail] = useState<Project | null>(null);
  const [projectName, setProjectName] = useState("Loading...");
  const [projectDescription, setProjectDescription] = useState("");
  const [projectIcon, setProjectIcon] = useState("📁");
  const [shareUrl, setShareUrl] = useState("");
  const [membersList, setMembersList] = useState<Member[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<"owner" | "admin" | "editor" | "viewer">("viewer");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [copied, setCopied] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [overColumnId, setOverColumnId] = useState<string | null>(null);

  // Group tasks into columns
  const [tasks, setTasks] = useState<Task[]>([]);
  const [columns, setColumns] = useState<Column[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  
  // Group tasks into columns
  useEffect(() => {
    const activeTasks = tasks.filter((task) => !task.isArchived);
    const grouped: Record<TaskStatus, Column> = {
      todo: { id: "todo", title: "To Do", tasks: [] },
      inprogress: { id: "inprogress", title: "In Progress", tasks: [] },
      review: { id: "review", title: "Review", tasks: [] },
      done: { id: "done", title: "Done", tasks: [] },
    };
    activeTasks.forEach((task) => {
      const status = (task.status as TaskStatus) || "todo";
      grouped[status].tasks.push(task);
    });
    Object.values(grouped).forEach((col) => col.tasks.sort((a, b) => (a.order || 0) - (b.order || 0)));
    setColumns(Object.values(grouped));
  }, [tasks]);

  // Deep link handler
  useEffect(() => {
    if (!isDataLoaded) return;

    const finalTaskId = taskId || searchParams.get('taskId');
    
    if (finalTaskId) {
      if (tasks.length > 0) {
        const taskToOpen = tasks.find(t => t._id === finalTaskId);
        if (taskToOpen) {
          setSelectedTask(taskToOpen);
        } else {
          // Task not found in this project
          navigate('/404', { replace: true });
        }
      } else {
        // Data loaded but no tasks? If taskId was provided, it's a 404
        navigate('/404', { replace: true });
      }
    }
  }, [isDataLoaded, taskId, searchParams, tasks, navigate]);

  // UI states
  const [view, setView] = useState<ViewType>((searchParams.get('view') as ViewType) || "board");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Sync view with URL searchParams
  useEffect(() => {
    const viewFromUrl = searchParams.get('view') as ViewType;
    if (viewFromUrl && ['board', 'list', 'archive', 'analytics', 'files'].includes(viewFromUrl)) {
      setView(viewFromUrl);
    }
  }, [searchParams]);

  // Sync state to URL when setView is called
  const handleSetView = (newView: ViewType) => {
    setView(newView);
    setSearchParams(prev => {
      prev.set('view', newView);
      return prev;
    });
  };

  // Fetch current user
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const res = await api.get("/auth/me");
        setCurrentUser(res.data.data || res.data);
      } catch {
        console.error("Failed to fetch current user");
      }
    };
    fetchCurrentUser();
  }, []);

  // Fetch project and tasks
  useEffect(() => {
    if (!projectId) {
      toast.error("Invalid project ID");
      return;
    }

    const loadData = async () => {
      try {
        const proj = await projectTaskService.getProject(projectId);
        setProjectDetail(proj);
        setProjectName(proj.name || "Untitled Project");
        setProjectDescription(proj.description || "No description");
        setProjectIcon(proj.icon || "📁");
        if (proj.enableShareLink && proj.shareLinkToken) {
          setShareUrl(`${window.location.origin}/projects/join-link/${projectId}?token=${proj.shareLinkToken}`);
        }
        setMembersList(proj.members || []);
        setCurrentUserRole(
          proj.isOwner ? "owner" : proj.userRole || "viewer"
        );

        const backendTasks = await projectTaskService.getTasks(projectId);
        const mappedTasks: Task[] = backendTasks.map((t: BackendTask) => {
          const totalComments = (t.comments || []).reduce(
            (count: number, comment: { replies?: unknown[] }) => count + 1 + (comment.replies?.length || 0),
            0
          );
          return {
            _id: t._id,
            id: t._id,
            title: t.title || "Untitled",
            description: t.description,
            status: t.status || "todo",
            columnId: t.status || "todo",
            createdBy: t.createdBy,
            priority: (t.priority as Priority) || "medium",
            tags: t.tags || [],
            startDate: t.startDate,
            dueDate: t.dueDate,
            assignedTo: t.assignedTo || [],
            subtasks: t.subtasks || [],
            comments: (t.comments || []).map(c => ({
              _id: c._id,
              user: c.user,
              comment: c.text,
              replies: (c.replies || []).map(r => ({
                _id: r._id,
                user: r.user,
                reply: r.text
              }))
            })),
            attachments: t.attachments || [],
            reminders: t.reminders || [],
            order: t.order ?? 0,
            isArchived: t.isArchived ?? false,
            createdAt: t.createdAt,
            updatedAt: t.updatedAt,
            completedAt: t.completedAt,
            membersCount: (t.assignedTo || []).length,
            commentsCount: totalComments,
            attachmentsCount: (t.attachments || []).length,
          };
        });
        setTasks(mappedTasks);
        setIsDataLoaded(true);
      } catch (error: unknown) {
        setIsDataLoaded(true);
        if (axios.isAxiosError(error)) {
          const message = error.response?.data?.message || "Failed to load data";
          toast.error(message);
          
          if (error.response?.status === 403) {
            navigate("/dashboard");
          } else if (error.response?.status === 401) {
            navigate("/login");
          }
        } else {
          toast.error("An unexpected error occurred");
        }
      }
    };
    loadData();
  }, [projectId, navigate]);

  // Group tasks into columns
  useEffect(() => {
    const activeTasks = tasks.filter((task) => !task.isArchived);
    const grouped: Record<TaskStatus, Column> = {
      todo: { id: "todo", title: "To Do", tasks: [] },
      inprogress: { id: "inprogress", title: "In Progress", tasks: [] },
      review: { id: "review", title: "Review", tasks: [] },
      done: { id: "done", title: "Done", tasks: [] },
    };
    activeTasks.forEach((task) => {
      const status = (task.status as TaskStatus) || "todo";
      grouped[status].tasks.push(task);
    });
    Object.values(grouped).forEach((col) => col.tasks.sort((a, b) => (a.order || 0) - (b.order || 0)));
    setColumns(Object.values(grouped));
  }, [tasks]);

  const handleProjectUpdatedFromSheet = (updatedProject: Partial<Project>) => {
    setProjectDetail((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        ...updatedProject,
      };
    });

    if (updatedProject.name) {
      setProjectName(updatedProject.name);
    }
    if (updatedProject.description !== undefined) {
      setProjectDescription(updatedProject.description);
    }
    if (updatedProject.icon) {
      setProjectIcon(updatedProject.icon);
    }
  };

  const handleToggleFavorite = async () => {
    if (!projectId) return;
    try {
      const response = await api.patch(`/projects/${projectId}/favorite`);
      if (response.data.success) {
        const isFavorite = response.data.isFavorite;
        setProjectDetail((prev) => (prev ? { ...prev, isFavorite } : null));
        
        // Sync with sidebar store
        useProjectStore.getState().toggleFavorite(projectId, isFavorite);
        
        toast.success(response.data.message);
      }
    } catch (error) {
      console.error("Toggle favorite error:", error);
      toast.error("Failed to update favorite status");
    }
  };

  interface BaseSocketData {
    projectId: string;
  }

  interface TaskSocketData extends BaseSocketData {
    task: BackendTask;
  }

  interface CommentSocketData extends BaseSocketData {
    taskId: string;
    commentCount: number;
    parentCommentId?: string;
  }

  // Socket setup
  useEffect(() => {
    if (!socket || !projectId || !currentUser?._id) return;
    joinProject(projectId);

    const mapSocketTask = (socketTask: BackendTask): Task => {
      const totalComments = (socketTask.comments || []).reduce(
        (count: number, comment: { replies?: unknown[] }) => count + 1 + (comment.replies?.length || 0),
        0
      );

      return {
        _id: socketTask._id,
        id: socketTask._id,
        title: socketTask.title,
        description: socketTask.description,
        status: socketTask.status || "todo",
        columnId: socketTask.status || "todo",
        createdBy: socketTask.createdBy,
        priority: (socketTask.priority as Priority) || "medium",
        tags: socketTask.tags || [],
        startDate: socketTask.startDate,
        dueDate: socketTask.dueDate,
        assignedTo: socketTask.assignedTo || [],
        subtasks: socketTask.subtasks || [],
        comments: (socketTask.comments || []).map(c => ({
          _id: c._id,
          user: c.user,
          comment: c.text,
          replies: (c.replies || []).map(r => ({
            _id: r._id,
            user: r.user,
            comment: r.text
          })) as Comment[]
        })),
        attachments: socketTask.attachments || [],
        reminders: socketTask.reminders || [],
        order: socketTask.order ?? 0,
        isArchived: socketTask.isArchived ?? false,
        createdAt: socketTask.createdAt,
        updatedAt: socketTask.updatedAt,
        completedAt: socketTask.completedAt,
        membersCount: (socketTask.assignedTo || []).length,
        commentsCount: totalComments,
        attachmentsCount: (socketTask.attachments || []).length,
      };
    };

    const handleMemberRoleUpdated = (data: { projectId: string; memberId: string; newRole: Member['role']; message?: string }) => {
      if (data.projectId !== projectId) return;
      if (currentUser && data.memberId === currentUser._id) {
        setCurrentUserRole(data.newRole);
        toast.success(data.message || `Access updated to ${data.newRole}`);
      }
      setMembersList((prev) => prev.map((m) => m.user._id === data.memberId ? { ...m, role: data.newRole } : m));
    };

    const handleTaskCreated = (data: TaskSocketData) => {
      console.log('✨ Socket: task_created received', data);
      if (data.projectId !== projectId) return;
      const newTask = mapSocketTask(data.task);
      setTasks(prev => {
        // Prevent duplicate
        if (prev.some(t => t._id === newTask._id)) return prev;
        return [newTask, ...prev];
      });
      toast.info(`New task "${newTask.title}" assigned!`);
    };

    const handleTaskUpdated = (data: TaskSocketData & { changes?: any[] }) => {
      console.log('🔄 Socket: task_updated received start', data);
      if (data.projectId !== projectId) return;
      const updatedTask = mapSocketTask(data.task);

      // Toast Logic for Assignment Changes
      if (data.changes && Array.isArray(data.changes)) {
        data.changes.forEach((change: any) => {
          if (change.field === 'assignedTo') {
            // Added users
            if (change.addedUsers && Array.isArray(change.addedUsers)) {
              change.addedUsers.forEach((u: { name: string; id: string }) => {
                // Jangan toast jika user sendiri yang di-assign (sudah dicover handleTaskCreated jika gain access)
                // ATAU biarkan saja agar konsisten, tapi user minta "assigned user".
                // Kita filter currentUser agar tidak spam ke diri sendiri? 
                // Opsional, tapi biasanya "You were assigned" lebih baik dari "User X assigned User Y" jika Y == Me.
                // Tapi socket task_created sudah toast "Ns ew task assigned!".
                // Mari kita toast untuk orang lain.
                if (u.id !== currentUser?._id) {
                   toast.success(`${u.name} was assigned to "${updatedTask.title}"`);
                }
              });
            }
            // Removed users
            if (change.removedUsers && Array.isArray(change.removedUsers)) {
              change.removedUsers.forEach((u: { name: string; id: string }) => {
                // Jika user sendiri yang di-unassign, sudah dicover handleTaskDeleted
                 if (u.id !== currentUser?._id) {
                   toast.info(`${u.name} was unassigned from "${updatedTask.title}"`);
                 }
              });
            }
          }
        });
      }
      
      setTasks(prev => {
        const index = prev.findIndex(t => t._id === updatedTask._id);
        if (index === -1) {
          // Task not found, add it (fallback for when task_created isn't sent/received)
          console.log('➕ Task not found in list, adding via task_updated');
          return [updatedTask, ...prev];
        }
        // Task found, update it
        const newTasks = [...prev];
        newTasks[index] = updatedTask;
        return newTasks;
      });

      // Also update selectedTask if it's the one currently open
      setSelectedTask(prev => {
        if (!prev || prev._id !== updatedTask._id) return prev;
        
        console.log('🔄 Updating selectedTask', updatedTask.assignedTo);
        
        // Merge to preserve rich data (comments, attachments) that might be missing/unpopulated in socket update
        return {
          ...prev,
          title: updatedTask.title,
          description: updatedTask.description,
          status: updatedTask.status,
          priority: updatedTask.priority,
          startDate: updatedTask.startDate,
          dueDate: updatedTask.dueDate,
          assignedTo: updatedTask.assignedTo, // This is fully populated in updateTask controller
          reminders: updatedTask.reminders,
          tags: updatedTask.tags,
          isArchived: updatedTask.isArchived,
          // Do NOT overwrite comments/attachments/subtasks unless you are sure socket has them populated.
          // Usually separate events handle those, or updateTask doesn't populate them deeply.
        };
      });
      
      // Also update editingTask if it's being edited
      setEditingTask(prev => {
        if (!prev || prev._id !== updatedTask._id) return prev;
        return {
          ...prev,
          ...updatedTask
        };
      });
    };

    const handleTaskStatusUpdated = (data: TaskSocketData) => {
      if (data.projectId !== projectId) return;
      const updatedTask = mapSocketTask(data.task);
      setTasks(prev => prev.map(t => t._id === updatedTask._id ? updatedTask : t));
    };

    const handleTaskDeleted = (data: { projectId: string; taskId: string; reason?: string }) => {
      console.log('🗑️ Socket: task_deleted received', data); // ← Added log
      if (data.projectId !== projectId) return;
      setTasks(prev => prev.filter(t => t._id !== data.taskId));
      if (selectedTask?._id === data.taskId) setSelectedTask(null);
      if (editingTask?._id === data.taskId) setEditingTask(null);

      if (data.reason === "unassigned") {
        toast.info("You have been unassigned from this task.");
      }
    };

    const handleTaskArchived = (data: { projectId: string; taskId: string; isArchived: boolean }) => {
      if (data.projectId !== projectId) return;
      setTasks(prev => prev.map(t => t._id === data.taskId ? { ...t, isArchived: data.isArchived } : t));
    };

    const handleFileUploaded = (data: {
      projectId: string;
      taskId?: string;
      files: unknown[];           // array file objects
      uploadedBy: string | { _id: string; name: string };
    }) => {
      if (data.projectId !== projectId) return;
  
      // Jika ada taskId → update attachments task tersebut
      if (data.taskId) {
        setTasks(prev =>
          prev.map(task =>
            task._id === data.taskId
              ? {
                ...task,
                attachments: [
                  ...(task.attachments || []),
                ...data.files.map((f: unknown) => {
                  const file = f as {
                    _id: string;
                    fileName: string;
                    fileUrl: string;
                    fileType: string;
                    fileSize: number;
                    thumbnailUrl?: string;
                    uploadedBy: string | { _id: string; name: string };
                  };
                  return {
                    _id: file._id,
                    fileName: file.fileName,
                    fileUrl: file.fileUrl,
                    fileType: file.fileType,
                    fileSize: file.fileSize,
                    thumbnailUrl: file.thumbnailUrl,
                    uploadedBy: file.uploadedBy,
                    uploadedAt: new Date().toISOString(),
                  };
                }),
                ],
                attachmentsCount: (task.attachments?.length || 0) + data.files.length,
              }
            : task
        )
      );
    }

    toast.success(`${data.files.length} file(s) uploaded successfully`);
  };

  const handleFileReplaced = (data: {
    projectId: string;
    taskId?: string;
    files: unknown[];
    replacedFileIds: string[];
    uploadedBy: string | { _id: string; name: string };
  }) => {
    if (data.projectId !== projectId) return;

    if (data.taskId) {
      setTasks(prev =>
        prev.map(task =>
          task._id === data.taskId
            ? {
                ...task,
                attachments: (task.attachments || []).map((att) => {
                  const replacedIndex = data.replacedFileIds.indexOf(att._id);
                  const newFile = replacedIndex !== -1 ? (data.files[replacedIndex] as {
                    fileName: string;
                    fileUrl: string;
                    fileType: string;
                    fileSize: number;
                    thumbnailUrl?: string;
                    uploadedBy: string | { _id: string; name: string };
                  }) : null;
                  return newFile && data.replacedFileIds.includes(att._id)
                    ? {
                        ...att,
                        fileName: newFile.fileName,
                        fileUrl: newFile.fileUrl,
                        fileType: newFile.fileType,
                        fileSize: newFile.fileSize,
                        thumbnailUrl: newFile.thumbnailUrl,
                        uploadedBy: newFile.uploadedBy,
                        uploadedAt: new Date().toISOString(),
                      }
                    : att;
                }),
              }
            : task
        )
      );
    }

    toast.info("File(s) replaced successfully");
  };

  const handleFileDeleted = (data: {
    projectId: string;
    taskId?: string;
    fileId: string;
    fileName: string;
    deletedBy: string;
  }) => {
    if (data.projectId !== projectId) return;

    if (data.taskId) {
      setTasks(prev =>
        prev.map(task =>
          task._id === data.taskId
            ? {
                ...task,
                attachments: (task.attachments || []).filter(
                  att => att._id !== data.fileId
                ),
                attachmentsCount: Math.max(0, (task.attachments?.length || 1) - 1),
              }
            : task
        )
      );
    }

    toast.info(`File "${data.fileName}" deleted successfully`);
  };

    const handleSubtaskAdded = (data: { taskId: string; subtask: { _id: string; title: string; completed: boolean }; projectId: string }) => {
      if (data.projectId !== projectId) return;
      setTasks(prev => prev.map(t => 
        t._id === data.taskId 
          ? { ...t, subtasks: [...(t.subtasks || []), data.subtask] } 
          : t
      ));
    };

    const handleSubtaskDeleted = (data: { taskId: string; subtaskId: string; projectId: string }) => {
      if (data.projectId !== projectId) return;
      setTasks(prev => prev.map(t => 
        t._id === data.taskId 
          ? { ...t, subtasks: (t.subtasks || []).filter((s) => s._id !== data.subtaskId) } 
          : t
      ));
    };

    const handleSubtaskToggled = (data: { taskId: string; subtaskId: string; completed: boolean; subtask: { _id: string; title: string; completed: boolean }; projectId: string }) => {
      if (data.projectId !== projectId) return;
      setTasks(prev => prev.map(t => 
        t._id === data.taskId 
          ? { 
              ...t, 
              subtasks: (t.subtasks || []).map((s) => 
                s._id === data.subtaskId ? { ...s, ...data.subtask } : s
              ) 
            } 
          : t
      ));
    };

    const handleCommentEdited = (data: { taskId: string; commentId: string; comment: { text: string; editedAt?: string } }) => {
      setTasks(prev => prev.map(t => {
        if (t._id !== data.taskId) return t;
        
        const updateComments = (comments: Comment[]): Comment[] => {
          return comments.map(c => {
            if (c._id === data.commentId) return { 
              ...c, 
              comment: data.comment.text, 
              isEdited: true, 
              editedAt: data.comment.editedAt 
            };
            if (c.replies) return { ...c, replies: updateComments(c.replies) };
            return c;
          });
        };

        return { ...t, comments: updateComments(t.comments || []) };
      }));
    };

    const handleCommentReactionUpdated = (data: { taskId: string; commentId: string; reactions: Comment['reactions'] }) => {
      setTasks(prev => prev.map(t => {
        if (t._id !== data.taskId) return t;

        const updateReactions = (comments: Comment[]): Comment[] => {
          return comments.map(c => {
            if (c._id === data.commentId) return { ...c, reactions: data.reactions };
            if (c.replies) return { ...c, replies: updateReactions(c.replies) };
            return c;
          });
        };

        return { ...t, comments: updateReactions(t.comments || []) };
      }));
    };

  // ── BARU: Project level events ─────────────────────────────────

  const handleProjectUpdated = (data: {
    projectId: string;
    updatedBy: string;
    updatedByName?: string;
    changes?: Record<string, unknown>;
    project?: Partial<Project>;           // optional – kalau backend kirim full project
  }) => {
    if (data.projectId !== projectId) return;

    // Update state lokal sesuai field yang berubah
    setProjectDetail((prev) => {
      if (!prev) return prev;
      return { ...prev, ...data.project, ...(data.changes as Partial<Project>) };
    });

    // Update field individual yang sering dipakai di UI
    if (data.project?.name)        setProjectName(data.project.name);
    if (data.project?.description) setProjectDescription(data.project.description);
    if (data.project?.icon)        setProjectIcon(data.project.icon);

    // Toast dengan nama user
  if (data.updatedBy !== currentUser?._id) {
    let updaterName = data.updatedByName;

    // Fallback ke membersList jika nama tidak dikirim backend
    if (!updaterName) {
      const member = membersList.find(m => m.user?._id === data.updatedBy);
      updaterName = member?.user?.name || "another user";
    }

    toast.success(`Project updated by ${updaterName}`);
  }
  };

  const handleProjectDeleted = (data: {
    projectId: string;
    deletedBy: string;
    deletedByName?: string;
    projectName?: string;
  }) => {
    if (data.projectId !== projectId) return;

    // Tampilkan pesan → redirect ke list
    toast.warning(
      `Project "${data.projectName || projectName}" has been deleted by ${data.deletedByName || "someone"}`
    );

    // Delay sedikit biar user sempat baca toast
    setTimeout(() => {
      navigate("/projects");
    }, 2200);
  };

  const handleProjectArchived = (data: {
    projectId: string;
    isArchived: boolean;
    updatedBy: string;
  }) => {
    if (data.projectId !== projectId) return;

    // Update state (bisa ditambahkan field isArchived di projectDetail)
    setProjectDetail((prev: Project | null) => {
      if (!prev) return null;
      return {
        ...prev,
        isArchived: data.isArchived,
      };
    });

    const action = data.isArchived ? "archived" : "unarchived";
    toast.info(`This project has been ${action}`);

    // Optional: kalau di-archive → mungkin redirect atau disable UI
    if (data.isArchived && data.updatedBy !== currentUser._id) {
      setTimeout(() => {
        navigate("/projects");
      }, 3000);
    }
  };

    const handleCommentUpdated = (data: CommentSocketData) => {
      if (data.projectId !== projectId) return;
      setTasks(prev => prev.map(t => t._id === data.taskId ? { ...t, commentsCount: data.commentCount } : t));
    };

    const handleUserDeleted = (data: { userId: string, message?: string }) => {
      // If current user is deleted, logout
      if (currentUser && data.userId === currentUser._id) {
        toast.error("Your account has been deleted.");
        setTimeout(() => {
          navigate("/login");
        }, 3000);
        return;
      }

      // If another user is deleted, remove them from members list and tasks
      setMembersList((prev) => prev.filter((m) => m.user._id !== data.userId));
      setTasks((prev) => prev.map(task => ({
        ...task,
        assignedTo: (task.assignedTo || []).filter(u => u._id !== data.userId)
      })));

      if (data.message) {
        toast.info(data.message);
      }
    };

    const handleMemberRemoved = (data: { memberId: string, projectId: string }) => {
      if (data.projectId !== projectId) return;

      // If current user is removed, redirect to dashboard
      if (currentUser && data.memberId === currentUser._id) {
        toast.error("You have been removed from this project.");
        navigate("/projects");
        return;
      }

      // Update members list
      setMembersList((prev) => prev.filter((m) => m.user._id !== data.memberId));

      // Unassign from tasks
      setTasks((prev) => prev.map(task => ({
        ...task,
        assignedTo: (task.assignedTo || []).filter(u => u._id !== data.memberId)
      })));
    };

    const handleMemberJoined = (data: { projectId: string; member: Member }) => {
      if (data.projectId !== projectId || !data.member) return;
      
      setMembersList((prev) => {
        // Prevent duplicates and ensure member.user exists
        if (!data.member.user?._id) return prev;
        if (prev.some(m => m.user?._id === data.member.user?._id)) return prev;
        return [...prev, data.member];
      });

      if (data.member.user?._id && data.member.user?._id !== currentUser?._id) {
        toast.success(`${data.member.user?.name || 'New member'} joined the project!`);
      }
    };
    
    const handleRoleUpgradeRejected = (data: { projectId: string; message: string }) => {
      if (data.projectId === projectId) {
        toast.error(data.message);
      }
    };

    socket.on('member_role_updated', handleMemberRoleUpdated);
    socket.on('task_created', handleTaskCreated);
    socket.on('task_updated', handleTaskUpdated);
    socket.on('task_status_updated', handleTaskStatusUpdated);
    socket.on('task_deleted', handleTaskDeleted);
    socket.on('task_archived', handleTaskArchived);
    // Daftarkan listener
    socket.on("file_uploaded", handleFileUploaded);
    socket.on("file_replaced", handleFileReplaced);
    socket.on("file_deleted", handleFileDeleted);
    socket.on("project_updated",   handleProjectUpdated);
    socket.on("project_deleted",   handleProjectDeleted);
    socket.on("project_archived",  handleProjectArchived);
    socket.on("comment_added",     handleCommentUpdated);
    socket.on("comment_deleted",   handleCommentUpdated);
    socket.on("user_deleted",      handleUserDeleted);
    socket.on("member_removed",    handleMemberRemoved);
    socket.on("member_joined",     handleMemberJoined);
    socket.on("subtask_added",     handleSubtaskAdded);
    socket.on("subtask_deleted",   handleSubtaskDeleted);
    socket.on("subtask_toggled",   handleSubtaskToggled);
    socket.on("comment_edited",    handleCommentEdited);
    socket.on("comment_reaction_updated", handleCommentReactionUpdated);
    socket.on('role_upgrade_rejected', handleRoleUpgradeRejected);

    return () => {
      socket.off('member_role_updated', handleMemberRoleUpdated);
      socket.off('task_created', handleTaskCreated);
      socket.off('task_updated', handleTaskUpdated);
      socket.off('task_status_updated', handleTaskStatusUpdated);
      socket.off('task_deleted', handleTaskDeleted);
      socket.off('task_archived', handleTaskArchived);
      socket.off("file_uploaded", handleFileUploaded);
      socket.off("file_replaced", handleFileReplaced);
      socket.off("file_deleted", handleFileDeleted);
      socket.off("project_updated",   handleProjectUpdated);
      socket.off("project_deleted",   handleProjectDeleted);
      socket.off("project_archived",  handleProjectArchived);
      socket.off("comment_added",     handleCommentUpdated);
      socket.off("comment_deleted",   handleCommentUpdated);
      socket.off("user_deleted",      handleUserDeleted);
      socket.off("member_removed",    handleMemberRemoved);
      socket.off("member_joined",     handleMemberJoined);
      socket.off("subtask_added",     handleSubtaskAdded);
      socket.off("subtask_deleted",   handleSubtaskDeleted);
      socket.off("subtask_toggled",   handleSubtaskToggled);
      socket.off("comment_edited",    handleCommentEdited);
      socket.off("comment_reaction_updated", handleCommentReactionUpdated);
      socket.off('role_upgrade_rejected', handleRoleUpgradeRejected);
      leaveProject(projectId);
    };
  }, [
    socket, 
    projectId, 
    currentUser, 
    joinProject, 
    leaveProject, 
    navigate, 
    membersList, 
    projectName, 
    selectedTask?._id, 
    editingTask?._id,
    setTasks
  ]);

  const handleCreateTask = async (taskData: Partial<Task>) => {
    if (!projectId) {
      toast.error("No project ID");
      return;
    }

    try {
      // Panggil API create task
      const createdTask = await projectTaskService.createTask(projectId, taskData);

      // Mapping ke format Task lokal
      const newTask: Task = {
        ...createdTask,
        id: createdTask._id,
        columnId: createdTask.status || 'todo',
        membersCount: (createdTask.assignedTo || []).length,
        commentsCount: 0,
        attachmentsCount: (createdTask.attachments || []).length,
        isArchived: createdTask.isArchived ?? false,
      };

      // Tambahkan ke state tasks (akan trigger useEffect regroup columns)
      setTasks(prev => [newTask, ...prev]);

      toast.success(createdTask.message);
    } catch (error: unknown) {
      console.error("Create task failed:", error);
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || "Failed to create task");
      } else if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("An unexpected error occurred");
      }
    }
  };

  // Handlers
  const handleDeleteProject = async () => {
    setIsDeleting(true);
    try {
      await projectTaskService.deleteProject(projectId!);
      navigate("/projects");
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        toast.error(error.message || "Delete failed");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpdateRole = async (memberId: string, newRole: string) => {
    if (newRole === "owner" || !projectId) return;
    try {
      await projectTaskService.updateMemberRole(projectId, memberId, newRole as "admin" | "editor" | "viewer");
      setMembersList((prev) => prev.map((m) => m.user._id === memberId ? { ...m, role: newRole as Member['role'] } : m));
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        toast.error(error.message || "Update failed");
      }
    }
  };

  const handleCopyLink = () => {
    if (!projectId) return toast.error("No project ID");

    // Jika project private dan BUKAN OWNER, larang copy link dan tendang ke dashboard sesuai request
    // Jika owner, tetap perbolehkan copy link (mungkin untuk keperluan internal) walau link join akan diblok backend
    if (projectDetail?.visibility === 'private' && currentUserRole !== 'owner') {
      toast.error("Sharing is disabled for private projects. Redirecting to dashboard...");
      setTimeout(() => {
        navigate("/dashboard");
      }, 1500);
      return;
    }

    if (!shareUrl) return toast.error("No share link available for this project type");

    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Link copied");
    
    // Track share link copy on backend
    projectTaskService.trackShareLinkCopy(projectId);
    
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenDetail = async (taskId: string) => {
    navigate(`/projects/${projectId}/tasks/${taskId}`);
    try {
      const fullTask = await projectTaskService.getTaskDetail(taskId);
      const totalComments = (fullTask.comments || []).reduce(
        (count: number, comment: { replies?: unknown[] }) => count + 1 + (comment.replies?.length || 0),
        0
      );
      setSelectedTask({
        ...fullTask,
        id: fullTask._id,
        columnId: fullTask.status,
        membersCount: (fullTask.assignedTo || []).length,
        commentsCount: totalComments,
        attachmentsCount: (fullTask.attachments || []).length,
        reminders: fullTask.reminders || [],
        isArchived: fullTask.isArchived ?? false,
      });
    } catch {
      toast.error("Failed to load task details");
    }
  };

  const handleCloseDetail = () => {
    setSelectedTask(null);
    navigate(`/projects/${projectId}`);
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await projectTaskService.deleteTask(taskId);
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
      if (selectedTask?._id === taskId) setSelectedTask(null);
      if (editingTask?._id === taskId) setEditingTask(null);
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        toast.error(error.message || "Delete task failed");
      }
    }
  };


  const handleUnarchive = async (taskId: string) => {
    try {
      await projectTaskService.unarchiveTask(taskId);
      setTasks((prev) => prev.map((t) => t._id === taskId ? { ...t, isArchived: false } : t));
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || "Unarchive failed");
      } else if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Unarchive failed");
      }
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
  const { active, over } = event;

  setOverColumnId(null);

  if (!over || active.id === over.id) return;

  const taskId = active.id as string;
  const potentialNewStatus = over.id as string;

  // Validasi bahwa over.id adalah salah satu status yang valid
  if (!['todo', 'inprogress', 'review', 'done'].includes(potentialNewStatus)) {
    toast.error("Invalid column");
    return;
  }

  // Sekarang aman untuk assert sebagai TaskStatus
  const newStatus = potentialNewStatus as TaskStatus;

  try {
    const res = await api.patch(`/tasks/${taskId}/status`, { status: newStatus });

    setTasks((prev) =>
      prev.map((t) =>
        t._id === taskId
          ? { ...t, status: newStatus, columnId: newStatus }
          : t
      )
    );

    toast.success(res.data.message);
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      toast.error(error.response?.data?.message || "Failed to move task");
    }
  }
};

  // Return value
  return {
    projectId,
    projectDetail,
    projectName,
    projectDescription,
    projectIcon,
    shareUrl,
    membersList,
    currentUserRole,
    copied,
    isDeleting,
    tasks,
    setTasks,
    overColumnId,
    columns,
    selectedTask,
    setSelectedTask,
    handleCloseDetail,
    editingTask,
    setEditingTask,
    view,
    setView: handleSetView,
    isCreateOpen,
    setIsCreateOpen,
    handleDeleteProject,
    handleUpdateRole,
    handleCopyLink,
    handleOpenDetail,
    handleDeleteTask,
    handleUnarchive,
    handleDragEnd,
    handleCreateTask,
    handleProjectUpdatedFromSheet,
    handleInviteMember: async (email: string, role: "admin" | "editor" | "viewer") => {
      try {
        const response = await projectTaskService.inviteMember(projectId!, email, role);
        
        toast.success(response.message || "Invitation sent successfully");
        return true;
      } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
          toast.error(error.response?.data?.message || "Failed to send invitation");
        } else if (error instanceof Error) {
          toast.error(error.message);
        } else {
          toast.error("An unexpected error occurred");
        }
        return false;
      }
    },
    handleRemoveMember: async (memberId: string) => {
      try {
        await projectTaskService.removeMember(projectId!, memberId);
        // State update handled by socket listener
        return true;
      } catch (error: unknown) {
        console.error("Kick member error:", error);
        return false;
      }
    },
    handleToggleFavorite,
  };
}