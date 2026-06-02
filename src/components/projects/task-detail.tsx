'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Plus, Paperclip, UsersRound, CalendarClock, CalendarCheck, Tags, FileText, File,  Send, User as UserIcon, ThumbsUp, SmilePlus, MoreVertical, Reply, SquarePen, Bell, Clock } from 'lucide-react';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '../ui/sheet';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { ScrollArea } from '../ui/scroll-area';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';

import type { Task, Comment } from '../../types/index';
import { columnTitles } from '../../types/index';
import type { User } from '../../types/user';
import { useSocket } from '../../context/SocketContext';
import api from "../../utils/api";

import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../ui/command';
import EmojiPicker from 'emoji-picker-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
// Priority & Status Config
const priorityConfig = {
  low: { label: 'Low Priority', className: 'bg-muted text-muted-foreground' },
  medium: { label: 'Medium Priority', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  high: { label: 'High Priority', className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' },
  urgent: { label: 'Urgent', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
} as const;

const statusConfig: Record<string, { label: string; className: string }> = {
  todo: { label: 'ToDo', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  inprogress: { label: 'In Progress', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  review: { label: 'Review', className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' },
  done: { label: 'Done', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
};


interface TaskDetailSheetProps {
  task: Task | null;
  onClose: () => void;
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
}

export default function TaskDetailSheet({ task, onClose, setTasks }: TaskDetailSheetProps) {
  const { socket } = useSocket();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [subtaskCompletion] = useState<Record<string, boolean>>({});
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [newReply, setNewReply] = useState('');
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [openEmojiPickerFor, setOpenEmojiPickerFor] = useState<string | null>(null);
  const [editText, setEditText] = useState('');



  const [mentionState, setMentionState] = useState<{
    search: string;
    open: boolean;
    range: { start: number; end: number } | null;
    target: 'comment' | 'reply' | 'edit';
  }>({
    search: '',
    open: false,
    range: null,
    target: 'comment',
  });

  const mainTextareaRef = useRef<HTMLTextAreaElement>(null);
  const replyTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Helper functions untuk update state nested
  const updateReactions = (taskObj: Task | null, commentId: string, reactions: any[]) => {
    if (!taskObj) return null;
    const update = (comments: Comment[]): Comment[] => comments.map(c => {
      if (c._id === commentId) return { ...c, reactions };
      if (c.replies) return { ...c, replies: update(c.replies) };
      return c;
    });
    return { ...taskObj, comments: update(taskObj.comments || []) };
  };

  const updateComment = (taskObj: Task | null, commentId: string, updatedComment: any) => {
    if (!taskObj) return null;
    const update = (comments: any[]): any[] => comments.map(c => {
      if (c._id === commentId) return updatedComment;
      if (c.replies) return { ...c, replies: update(c.replies) };
      return c;
    });
    return { ...taskObj, comments: update(taskObj.comments || []) };
  };

  const removeComment = (taskObj: Task | null, commentId: string) => {
    if (!taskObj) return null;
    const remove = (comments: Comment[]): Comment[] => comments.filter(c => {
      if (c._id === commentId) return false;
      if (c.replies) {
        c.replies = remove(c.replies);
      }
      return true;
    });
    return { ...taskObj, comments: remove(taskObj.comments || []) };
  };


  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get('/auth/me');
        setCurrentUser(res.data?.data || res.data);
      } catch {
        console.error('Failed to load user');
        setCurrentUser(null);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (!task) return;

    const loadComments = async () => {
      try {
        const res = await api.get(`/tasks/${task._id}/comments`);
        setSelectedTask(prev => prev ? { ...prev, comments: res.data.data } : null);
      } catch {
        console.error("Failed to load comments");
      }
    };

    loadComments();
    setSelectedTask(task);
  }, [task]);








  useEffect(() => {
    if (!socket || !task || !currentUser) return;

    // --- Ekstrak projectId secara aman ---
    const projectId = typeof task.projectId === 'string' ? task.projectId : (task.projectId as any)?._id;

    if (!projectId) {
      console.warn('No valid projectId found for task:', task);
      return;
    }

    const projectIdStr = String(projectId);
    socket.emit('join_project', projectIdStr);

    // --- Listener: Comment Added ---
    const handleCommentAdded = (data: { taskId: string; comment: any; parentCommentId?: string; addedBy: string }) => {
      if (String(data.taskId) !== String(task._id)) return;

      if (data.addedBy && currentUser && String(data.addedBy) === String(currentUser._id)) {
        return;
      }

      setSelectedTask(prev => {
        if (!prev) return null;

        const exists = (comments: any[], id: string): boolean =>
          comments.some(c => c._id === id || (c.replies && exists(c.replies, id)));

        if (exists(prev.comments || [], data.comment._id)) return prev;

        if (data.parentCommentId) {
          const addReply = (comments: any[]): any[] =>
            comments.map(c => {
              if (c._id === data.parentCommentId) {
                return { ...c, replies: [...(c.replies || []), data.comment] };
              }
              if (c.replies) return { ...c, replies: addReply(c.replies) };
              return c;
            });

          return { ...prev, comments: addReply(prev.comments || []) };
        }

        return { ...prev, comments: [...(prev.comments || []), data.comment] };
      });

      setTasks(prev =>
        prev.map(t =>
          t._id === task._id
            ? { ...t, commentsCount: t.commentsCount + 1 }
            : t
        )
      );
    };

    const handleReactionUpdated = (data: { taskId: string; commentId: string; reactions: any[] }) => {
      if (String(data.taskId) !== String(task._id)) return;
      setSelectedTask(prev => updateReactions(prev, data.commentId, data.reactions));
    };

    const handleCommentEdited = (data: { taskId: string; commentId: string; comment: any }) => {
      if (String(data.taskId) !== String(task._id)) return;
      setSelectedTask(prev => updateComment(prev, data.commentId, data.comment));
    };

    const handleCommentDeleted = (data: { taskId: string; commentId: string }) => {
      if (String(data.taskId) !== String(task._id)) return;
      setSelectedTask(prev => removeComment(prev, data.commentId));
      setTasks(prev =>
        prev.map(t =>
          t._id === task._id
            ? { ...t, commentsCount: Math.max(0, t.commentsCount - 1) }
            : t
        )
      );
    };

    socket.on('comment_added', handleCommentAdded);
    socket.on('comment_reaction_updated', handleReactionUpdated);
    socket.on('comment_edited', handleCommentEdited);
    socket.on('comment_deleted', handleCommentDeleted);

    return () => {
      socket.emit('leave_project', projectIdStr);
      socket.off('comment_added', handleCommentAdded);
      socket.off('comment_reaction_updated', handleReactionUpdated);
      socket.off('comment_edited', handleCommentEdited);
      socket.off('comment_deleted', handleCommentDeleted);
    };
  }, [socket, task, currentUser, setTasks]);
  const mentionableUsers = useMemo(() => {
    const users = new Map<string, any>();
    if (selectedTask?.createdBy) users.set(selectedTask.createdBy._id, selectedTask.createdBy);
    selectedTask?.assignedTo?.forEach((u: any) => u?._id && users.set(String(u._id), u));
    return Array.from(users.values());
  }, [selectedTask]);

  const filteredMentionUsers = useMemo(() => {
  const searchTrimmed = mentionState.search.trim();
  
  if (searchTrimmed === '') {
    // Saat baru ketik @ → tampilkan SEMUA user yang bisa di-mention
    return mentionableUsers;
  }

  return mentionableUsers.filter(user => 
    user.name?.toLowerCase().includes(searchTrimmed.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTrimmed.toLowerCase())
  );
}, [mentionableUsers, mentionState.search]);

  // PINDAHKAN useMemo totalComments KE SINI (sebelum early return)
  const totalComments = useMemo(() => {
    if (!selectedTask?.comments) return 0;
    const count = (comments: any[] = []): number => 
      comments.reduce((acc: number, c: any) => acc + 1 + count(c.replies), 0);
    return count(selectedTask.comments as any[]);
  }, [selectedTask?.comments]);

  // === SETELAH SEMUA HOOK BARU BOLEH ADA EARLY RETURN ===
  if (!task || !selectedTask) return null;

  const handleMentionChange = (
  e: React.ChangeEvent<HTMLTextAreaElement>,
  setter: (v: string) => void,
  target: 'comment' | 'reply' | 'edit'
) => {
  const cursorPos = e.target.selectionStart;
  setter(e.target.value);

  const textBefore = e.target.value.substring(0, cursorPos); // gunakan value terbaru
  const lastAt = textBefore.lastIndexOf('@');

  if (lastAt !== -1) {
    const search = textBefore.substring(lastAt + 1);
    
    // Izinkan popover muncul bahkan saat search kosong (baru ketik @)
    if (!/\s/.test(search)) {
      setMentionState({
        search,
        open: true,
        range: { start: lastAt, end: cursorPos },
        target,
      });
      return;
    }
  }

  // Tutup popover kalau tidak ada @ atau ada spasi setelah @
  setMentionState(prev => ({ ...prev, open: false }));
};

  const insertMention = (user: any) => {
    const { range, target } = mentionState;
    if (!range) return;

    const setter = target === 'comment' ? setNewComment : target === 'reply' ? setNewReply : setEditText;
    const current = target === 'comment' ? newComment : target === 'reply' ? newReply : editText;
    const before = current.substring(0, range.start);
    const after = current.substring(range.end);
    const newText = `${before}@${user.name} ${after}`;
    setter(newText);

    setMentionState(prev => ({ ...prev, open: false }));
  };

  // if (!task || !selectedTask) return null;
  

  const subtasks = selectedTask.subtasks || [];
  const completedCount = subtasks.filter(
    (s) => subtaskCompletion[s._id || s.title] ?? s.completed
  ).length;
  const totalSubtasks = subtasks.length;
  const progress = totalSubtasks === 0 ? 0 : Math.round((completedCount / totalSubtasks) * 100);

  const toggleSubtask = async (subtaskId: string) => {
    try {
      await api.patch(`/tasks/${task._id}/subtasks/${subtaskId}/toggle`);
      setSelectedTask((prev) =>
        prev
          ? {
              ...prev,
              subtasks: (prev.subtasks || []).map((s) =>
                s._id === subtaskId ? { ...s, completed: !s.completed } : s
              ),
            }
          : null
      );
      toast.success("Subtask updated");
    } catch (error: unknown) {
      toast.error("Failed to update subtask");
    }
  };


// Post comment/reply
  const postComment = async (parentCommentId?: string) => {
  const text = parentCommentId ? newReply.trim() : newComment.trim();
  if (!text) return;

  // 1. Buat comment sementara untuk optimistic update
  const tempId = `temp-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const optimisticComment: Comment = {
    _id: tempId,
    comment: text,
    user: currentUser as any, // user yang lagi login
    createdAt: new Date().toISOString(),
    isEdited: false,
    reactions: [],
    replies: [],
  };

  // 2. Update state lokal dulu (langsung muncul!)
  setSelectedTask((prev: Task | null) => {
    if (!prev) return null;

    if (parentCommentId) {
      // Cari parent dan tambah reply
      const updateRecursive = (comments: Comment[]): Comment[] => 
        comments.map(c => {
          if (c._id === parentCommentId) {
            return { ...c, replies: [...(c.replies || []), optimisticComment] };
          }
          if (c.replies) {
            return { ...c, replies: updateRecursive(c.replies) };
          }
          return c;
        });

      return { ...prev, comments: updateRecursive(prev.comments || []) };
    } else {
      // Tambah comment utama
      return { ...prev, comments: [...(prev.comments || []), optimisticComment] };
    }
  });

  try {
    // 3. Kirim ke backend
    const res = await api.post(`/tasks/${task._id}/comments`, {
      comment: text,
      parentCommentId,
    });

    const realComment = res.data.data; // comment asli dari server (dengan _id benar)

    // 4. Ganti comment temporary dengan yang asli
    setSelectedTask(prev => {
      if (!prev) return null;

      const replaceTemp = (comments: Comment[]): Comment[] =>
        comments.map(c => {
          if (c._id === tempId) return realComment;
          if (c.replies) return { ...c, replies: replaceTemp(c.replies) };
          return c;
        });

      return { ...prev, comments: replaceTemp(prev.comments || []) };
    });

    // Reset form
    if (parentCommentId) {
      setNewReply('');
      setReplyingTo(null);
    } else {
      setNewComment('');
    }

    toast.success(parentCommentId ? "Reply sent" : "Comment posted");
    // UPDATE GLOBAL TASKS → realtime comment count
    setTasks(prev => prev.map(t => 
      t._id === task._id 
        ? { ...t, commentsCount: t.commentsCount + 1 }
        : t
    ));
  } catch (err: any) {
    toast.error(err.response?.data?.message || "Failed");

    // 5. Kalau gagal → hapus optimistic comment
    setSelectedTask(prev => {
      if (!prev) return null;

      const removeTemp = (comments: Comment[]): Comment[] =>
        comments.filter(c => c._id !== tempId).map(c => ({
          ...c,
          replies: c.replies ? removeTemp(c.replies) : [],
        }));

      return { ...prev, comments: removeTemp(prev.comments || []) };
    });
  }
};

  // Reaction
  const toggleReaction = async (commentId: string, emoji: string) => {
  // 1. Optimistic: update UI dulu
  setSelectedTask(prev => {
    if (!prev) return null;

    const update = (comments: Comment[]): Comment[] => comments.map(c => {
      if (c._id === commentId) {
        const reactions = c.reactions || [];
        const existingIndex = reactions.findIndex(
          (r) => r.emoji === emoji && r.user?._id === currentUser?._id
        );

        let newReactions;
        if (existingIndex !== -1) {
          // Hapus reaction (toggle off)
          newReactions = reactions.filter((_, i) => i !== existingIndex);
        } else {
          // Tambah reaction (toggle on)
          newReactions = [...reactions, { emoji, user: currentUser as any }];
        }

        return { ...c, reactions: newReactions };
      }
      if (c.replies) return { ...c, replies: update(c.replies) };
      return c;
    });

    return { ...prev, comments: update(prev.comments || []) };
  });

  try {
    // 2. Kirim ke backend
    await api.post(`/tasks/${task._id}/comments/${commentId}/reactions`, { emoji });
    // Backend akan emit comment_reaction_updated → sync ke user lain
  } catch (err) {
    toast.error("Failed to react");
    // 3. Kalau gagal → rollback ke state sebelumnya
    // (opsional: simpan state sebelumnya kalau mau rollback akurat)
  }
};

  // Edit
  const startEdit = (comment: Comment) => {
    setEditingComment(comment._id);
    setEditText(comment.comment);
    // Masukkan ke placeholder mention agar trigger deteksi @
    handleMentionChange({ target: { value: comment.comment } } as any, setEditText, 'edit');
  };

  const saveEdit = async (commentId: string) => {
  if (!editText.trim()) return;

  const newText = editText.trim();

  // 1. Optimistic: langsung ubah teks di UI
  setSelectedTask(prev => {
    if (!prev) return null;

    const update = (comments: Comment[]): Comment[] => comments.map(c => {
      if (c._id === commentId) {
        return { ...c, comment: newText, isEdited: true, editedAt: new Date().toISOString() };
      }
      if (c.replies) return { ...c, replies: update(c.replies) };
      return c;
    });

    return { ...prev, comments: update(prev.comments || []) };
  });

  // Reset form edit
  setEditingComment(null);
  setEditText('');

  try {
    // 2. Kirim ke backend
    await api.put(`/tasks/${task._id}/comments/${commentId}`, { comment: newText });
    toast.success("Comment updated");
    // Backend emit comment_edited → sync ke user lain
  } catch (err) {
    toast.error("Failed to edit");
    // Optional: rollback jika gagal
  }
};

  // Delete
  const deleteComment = async (commentId: string) => {

  // 1. Optimistic: langsung hapus dari UI
  setSelectedTask(prev => {
    if (!prev) return null;

    const remove = (comments: Comment[]): Comment[] => comments.filter(c => {
      if (c._id === commentId) return false;
      if (c.replies) {
        // Correctly handle property assignment in filter
        const updatedReplies = remove(c.replies);
        return { ...c, replies: updatedReplies };
      }
      return true;
    });

    return { ...prev, comments: remove(prev.comments || []) };
  });

  toast.success("Comment deleted");
  // UPDATE GLOBAL TASKS
  setTasks(prev => prev.map(t => 
    t._id === task._id 
      ? { ...t, commentsCount: Math.max(0, t.commentsCount - 1) }
      : t
  ));

  try {
    // 2. Kirim ke backend
    await api.delete(`/tasks/${task._id}/comments/${commentId}`);
    // Backend emit comment_deleted → sync ke user lain
  } catch (err) {
    toast.error("Failed to delete from server");
    // Optional: reload comments kalau gagal
  }
};
  // Render thread
const renderThread = (comment: Comment, depth: number = 0) => {
  const user = comment.user;
  const isAuthor = user?._id === currentUser?._id;
  // Hanya boleh reply ke parent (depth === 0)
  const canReply = depth === 0;
  const isPickerOpen = openEmojiPickerFor === comment._id;

  const togglePicker = () => {
    setOpenEmojiPickerFor(prev => (prev === comment._id ? null : comment._id));
  };

  const hasUserReactedThumbsUp = (comment.reactions || []).some(
    (r) => r.emoji === '👍' && r.user?._id === currentUser?._id
  );

  return (
      <div className={`mt-4 ${depth > 0 ? 'ml-12 pl-4 border-l-2 border-border' : ''}`}>
        <div className="flex gap-3 text-[13px]">
          <Avatar className="h-9 w-9 shrink-0 mt-1">
            <AvatarImage src={user?.profilePicture} />
            <AvatarFallback>{user?.name?.slice(0, 2).toUpperCase() || '??'}</AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-medium text-sm">{user?.name || 'Unknown'}</span>
              <span className="text-xs text-muted-foreground">
                {comment.createdAt && !isNaN(new Date(comment.createdAt).getTime()) 
                  ? format(new Date(comment.createdAt), 'd MMM yyyy ⋅ HH:mm') 
                  : 'Just now'}
              </span>
            </div>

            {/* Teks atau form edit */}
            {editingComment === comment._id ? (
              <div className="mt-3">
                <Textarea
                  value={editText}
                  onChange={(e) => handleMentionChange(e, setEditText, 'edit')}
                  className="min-h-20 resize-none text-sm"
                  autoFocus
                />
                <div className="mt-3 flex gap-2">
                  <Button size="sm" onClick={() => saveEdit(comment._id)}>Save</Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingComment(null)}>Cancel</Button>
                </div>
              </div>
            ) : (
              <p className="mt-1 text-sm whitespace-pre-wrap wrap-break-word">{comment.comment}</p>
            )}

            {/* Baris aksi utama - semua icon-only dengan Tooltip */}
            <div className="mt-4 flex items-center gap-2">
              {/* Reply (icon only) */}
              {canReply && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 hover:bg-muted/80"
                      onClick={() => setReplyingTo(comment._id)}
                    >
                      <Reply className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>Reply</p>
                  </TooltipContent>
                </Tooltip>
              )}

              {/* Existing reactions */}
              {comment.reactions && comment.reactions.length > 0 && (
                (() => {
                  const reactionGroups = (comment.reactions || []).reduce((acc: Record<string, { count: number, users: any[] }>, r) => {
                    if (!acc[r.emoji]) acc[r.emoji] = { count: 0, users: [] };
                    acc[r.emoji].count++;
                    acc[r.emoji].users.push(r.user);
                    return acc;
                  }, {});

                  return Object.entries(reactionGroups).map(([emoji, groupData]: [string, any]) => {
                    const data = groupData as { users: any[]; count: number };
                    const reacted = data.users.some((u: any) => u._id === currentUser?._id);
                    return (
                      <Tooltip key={emoji}>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant={reacted ? "default" : "outline"}
                            className={`h-8 px-3 text-xs font-medium ${
                              reacted
                                ? 'bg-blue-100 text-blue-600 border-blue-600 hover:bg-blue-200 dark:bg-blue-900/50 dark:text-blue-400'
                                : 'hover:bg-muted/80'
                            }`}
                            onClick={() => toggleReaction(comment._id, emoji)}
                          >
                            {emoji} {data.count}
                          </Button>
                        </TooltipTrigger>
                        {/* <TooltipContent side="top">
                          <p>{emoji}</p>
                        </TooltipContent> */}
                      </Tooltip>
                    );
                  });
                })()
              )}

              {/* Thumbs Up */}
              {!hasUserReactedThumbsUp && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 hover:bg-muted/80"
                      onClick={() => toggleReaction(comment._id, '👍')}
                    >
                      <ThumbsUp className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>Thumbs up</p>
                  </TooltipContent>
                </Tooltip>
              )}

              {/* Add reaction */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Popover open={isPickerOpen} onOpenChange={(open) => !open && setOpenEmojiPickerFor(null)}>
                    <PopoverTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 hover:bg-muted/80"
                        onClick={togglePicker}
                      >
                        <SmilePlus className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 border-0 shadow rounded" side="top" align="start">
                      <EmojiPicker
                        onEmojiClick={(emojiData) => {
                          toggleReaction(comment._id, emojiData.emoji);
                          setOpenEmojiPickerFor(null);
                        }}
                        lazyLoadEmojis={true}
                        height={380}
                        width={340}
                        previewConfig={{ showPreview: false }}
                        searchPlaceholder="Search emoji..."
                        skinTonesDisabled={false}
                      />
                    </PopoverContent>
                  </Popover>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Add reaction</p>
                </TooltipContent>
              </Tooltip>

              {/* Edit - hanya untuk author */}
              {isAuthor && editingComment !== comment._id && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 hover:bg-muted/80"
                      onClick={() => startEdit(comment)}
                    >
                      <SquarePen className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>Edit comment</p>
                  </TooltipContent>
                </Tooltip>
              )}

              {/* More actions (Delete) - di sebelah Edit */}
              {isAuthor && editingComment !== comment._id && (
                <DropdownMenu>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 hover:bg-muted/80"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p>More actions</p>
                    </TooltipContent>
                  </Tooltip>

                  <DropdownMenuContent  align="start" className="min-w-24 p-1">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem
                          className="cursor-pointer "
                          onSelect={(e) => e.preventDefault()}
                        >
                          
                          <p>Delete</p>
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete this comment?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. The comment and all its replies will be permanently deleted.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive hover:bg-destructive/90"
                            onClick={() => deleteComment(comment._id)}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {/* Form reply */}
            {replyingTo === comment._id && canReply && (
              <div className="mt-5 flex gap-3">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src={currentUser?.profilePicture} />
                  <AvatarFallback>{currentUser?.name?.slice(0, 2).toUpperCase() || '??'}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <Textarea
                    ref={replyTextareaRef}
                    placeholder="Write a reply... (@ to mention)"
                    value={newReply}
                    onChange={(e) => handleMentionChange(e, setNewReply, 'reply')}
                    className="min-h-20 resize-none text-sm"
                    autoFocus
                  />
                  <div className="mt-3 flex justify-end gap-2">
                    <Button size="sm" onClick={() => postComment(comment._id)}>Send</Button>
                    <Button size="sm" variant="outline" onClick={() => { setNewReply(''); setReplyingTo(null); }}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Nested replies */}
            {comment.replies?.map((reply: any) => (
              <TooltipProvider key={reply._id}>
                {renderThread(reply, depth + 1)}
              </TooltipProvider>
            ))}
          </div>
        </div>
      </div>
  );
};


  return (
    <Sheet open={!!task} onOpenChange={(open) => !open && onClose()}>
      <SheetHeader className="sr-only">
        <SheetTitle>{task.title}</SheetTitle>
      </SheetHeader>
      <SheetContent side="right" className="w-full overflow-y-auto p-6 sm:p-11 sm:max-w-xl shadow border-l">
        <div className="mt-4 space-y-6">
          <h2 className="text-2xl font-bold">{task.title}</h2>

          {/* Status & Priority */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              className={`rounded ${statusConfig[task.columnId]?.className || 'bg-gray-100 text-gray-800'}`}
            >
              {columnTitles[task.columnId] || task.columnId || 'Unknown'}
            </Badge>
            <Badge
              variant="secondary"
              className={`rounded ${priorityConfig[task.priority]?.className || 'bg-gray-100 text-gray-800'}`}
            >
              {priorityConfig[task.priority]?.label || task.priority}
            </Badge>
          </div>

          {/* Creator */}
          <div className="flex items-center gap-2">
            <UserIcon className="h-5 w-5 text-muted-foreground" />
            <Avatar className="h-9 w-9 text-[13px]">
              <AvatarImage src={task.createdBy?.profilePicture} />
              <AvatarFallback>
                {task.createdBy?.name
                  ? task.createdBy.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
                  : '??'}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium capitalize">
              {task.createdBy?.name || 'Unknown User'} (Creator)
            </span>
          </div>

          {/* Assignees */}
          <div className="flex items-center gap-2">
            <UsersRound className="h-5 w-5 text-muted-foreground" />
            {task.assignedTo?.length ? (
              (() => {
                const assigneesWithoutCreator = task.assignedTo.filter(
                  (assignee: any) => assignee._id !== task.createdBy?._id
                );

                return assigneesWithoutCreator.length > 0 ? (
                  <div className="flex -space-x-2">
                    {assigneesWithoutCreator.slice(0, 2).map((assignee: any) => (
                      <Avatar
                        key={assignee._id}
                        className="h-9 w-9 text-[13px] ring-2 ring-background"
                      >
                        <AvatarImage src={assignee.profilePicture} />
                        <AvatarFallback>
                          {assignee.name
                            .split(' ')
                            .map((n: string) => n[0])
                            .join('')
                            .toUpperCase()
                            .slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                    ))}

                    {assigneesWithoutCreator.length > 2 && (
                      <Avatar className="h-9 w-9 ring-2 ring-background">
                        <AvatarFallback className="text-[13px] font-medium bg-muted">
                          +{assigneesWithoutCreator.length - 2}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">No one assigned</span>
                );
              })()
            ) : (
              <span className="text-sm text-muted-foreground">No one assigned</span>
            )}
          </div>

          {/* Dates */}
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-3">
              <CalendarClock className="h-5 w-5 text-muted-foreground" />
              <Badge variant="secondary" className="rounded">
                Start: {task.startDate && !isNaN(new Date(task.startDate).getTime()) 
                  ? format(new Date(task.startDate), 'd MMMM yyyy') 
                  : 'No start date'}
              </Badge>
            </div>
            <div className="flex items-center gap-3">
              <CalendarCheck className="h-5 w-5 text-muted-foreground" />
              <Badge variant="secondary" className="rounded">
                Due: {task.dueDate && !isNaN(new Date(task.dueDate).getTime()) 
                  ? format(new Date(task.dueDate), 'd MMMM yyyy') 
                  : 'No due date'}
              </Badge>
            </div>
          </div>

          {/* Reminders */}
          {task.reminders && task.reminders.length > 0 && (
             <div className="flex flex-col gap-3">
               <div className="flex items-center gap-2 text-muted-foreground">
                  <Bell className="h-5 w-5" />
                  <span className="text-sm font-bold">Active Reminders</span>
               </div>
               <div className="flex flex-wrap gap-2">
                 {task.reminders.map((reminder, i) => (
                   <Badge key={i} variant="outline" className={`rounded flex items-center gap-2 py-1.5 px-3 border-primary/20 bg-primary/5 ${reminder.notified ? 'opacity-50 grayscale' : ''}`}>
                      <Clock className="h-3.5 w-3.5 text-primary" />
                      <span className="text-xs font-medium">
                        {format(new Date(reminder.time), 'MMM d, p')}
                        {reminder.notified && " (Sent)"}
                      </span>
                   </Badge>
                 ))}
               </div>
             </div>
          )}



          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <div className="capitalize flex items-center gap-3">
              <Tags className="h-5 w-5 text-muted-foreground" />
              <div className="flex flex-wrap gap-2">
                {task.tags.map((tag, i) => (
                  <Badge key={i} variant="default" className="rounded">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Description */}
          <div>
            <div className="mb-2 flex items-center gap-2 text-muted-foreground">
              <FileText className="h-5 w-5" />
              <span className="text-sm font-bold">Description</span>
            </div>
            <div className="rounded border bg-muted/30 p-4">
              {task.description ? (
                <div 
                  className="prose prose-sm dark:prose-invert max-w-none text-sm"
                  dangerouslySetInnerHTML={{ __html: task.description }}
                />
              ) : (
                <p className="text-sm text-muted-foreground italic">No description provided.</p>
              )}
            </div>
          </div>

          {/* Attachments */}
          <div>
            <div className="mb-2 flex items-center gap-2 text-muted-foreground">
              <File className="h-5 w-5" />
              <span className="text-sm font-bold">Attachments ({task.attachmentsCount || 0})</span>
            </div>
            {task.attachments && task.attachments.length > 0 ? (
              <div className="space-y-3">
                {task.attachments.map((attachment) => (
                  <div
                    key={attachment._id}
                    className="flex items-center justify-between rounded border bg-muted/30 p-3 hover:bg-muted/50 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded bg-blue-100 p-2">
                        <Paperclip className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{attachment.fileName}</p>
                        <p className="text-xs text-muted-foreground">
                          Uploaded by {attachment.uploadedBy?.name || 'Unknown'}
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" asChild>
                      <a href={attachment.fileUrl} target="_blank" rel="noopener noreferrer">
                        <Paperclip className="h-4 w-4 rotate-45" />
                      </a>
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No attachments</p>
            )}
          </div>

          {/* Tabs – hanya Subtasks dan Comments */}
          <Tabs defaultValue="subtasks" className="mt-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="subtasks" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary dark:data-[state=active]:bg-primary/20 dark:data-[state=active]:text-primary font-semibold">Subtasks</TabsTrigger>
              <TabsTrigger value="comments" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary dark:data-[state=active]:bg-primary/20 dark:data-[state=active]:text-primary font-semibold">
                Comments ({totalComments})
              </TabsTrigger>
            </TabsList>

            {/* Subtasks */}
            <TabsContent value="subtasks" className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">Subtasks</h3>
                  <span className="text-sm text-muted-foreground">
                    {completedCount}/{totalSubtasks}
                  </span>
                </div>
                <div className="h-3 rounded bg-muted">
                  <div
                    className="h-3 rounded bg-primary transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                {subtasks.length > 0 ? (
                  <div className="space-y-3">
                    {subtasks.map((subtask: any) => {
                      const id = subtask._id;
                      const checked = subtaskCompletion[id] ?? subtask.completed;
                      return (
                        <div key={id} className="flex items-center space-x-3">
                          <Checkbox checked={checked} onCheckedChange={() => toggleSubtask(id)} />
                          <Label
                            className={`text-sm cursor-pointer ${checked ? 'line-through text-muted-foreground' : ''}`}
                          >
                            {subtask.title}
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="py-4 text-center text-sm text-muted-foreground">No subtasks assigned.</p>
                )}
              </div>
            </TabsContent>

            {/* Comments */}
            <TabsContent value="comments">
            <ScrollArea className="h-96 pr-4">
              {selectedTask.comments?.length ? (
                selectedTask.comments
                  .sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                  .map((comment: Comment) => (
                    <TooltipProvider key={comment._id}>
                      {renderThread(comment, 0)}
                    </TooltipProvider>
                  ))
              ) : (
                <p className="py-12 text-center text-muted-foreground">No comments yet. Be the first!</p>
              )}
            </ScrollArea>

            <Separator className="my-6" />

            {/* Main comment form */}
            <div className="flex gap-3 text-[13px]">
              <Avatar className="h-9 w-9 shrink-0">
                <AvatarImage src={currentUser?.profilePicture} />
                <AvatarFallback>{currentUser?.name?.slice(0,2).toUpperCase() || '??'}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Textarea
                  ref={mainTextareaRef}
                  placeholder="Write a comment... (@ to mention)"
                  value={newComment}
                  onChange={(e) => handleMentionChange(e, setNewComment, 'comment')}
                  className="min-h-24 resize-none"
                />
                <div className="mt-3 flex justify-end">
                  <Button disabled={!newComment.trim()} onClick={() => postComment()}>
                    <Send className="mr-2 h-4 w-4" /> Post Comment
                  </Button>
                </div>
              </div>
            </div>

            {/* Mention popover */}
            <Popover open={mentionState.open} onOpenChange={open => !open && setMentionState(prev => ({ ...prev, open: false }))}>
              <PopoverTrigger asChild><div className="h-1 opacity-0" /></PopoverTrigger>
              <PopoverContent className="w-72 p-0" side="top">
                <Command>
                  <CommandInput placeholder="Search members..." />
                  <CommandList>
                    <CommandEmpty>No members found.</CommandEmpty>
                    <CommandGroup>
                      {filteredMentionUsers.map(user => (
                        <CommandItem key={user._id} onSelect={() => insertMention(user)}>
                          <Avatar className="h-8 w-8 mr-3">
                            <AvatarImage src={user.profilePicture} />
                            <AvatarFallback>{user.name.slice(0,2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}




