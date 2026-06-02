'use client';

import { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '../ui/sheet';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { RichTextEditor } from '../ui/rich-text-editor';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar as CalendarComponent } from '../ui/calendar';
import { Command, CommandGroup, CommandInput, CommandItem, CommandList } from '../ui/command';
import { Checkbox } from '../ui/checkbox';
import { format } from 'date-fns';
import {
  CalendarIcon,
  ChevronDown,
  CloudUpload,
  Paperclip,
  X,
  Trash2,
  RotateCcw,
  Check,
  Bell,
  Clock,
  Plus,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import type { Task, Priority } from '../../types/index';
import api from '../../utils/api';
import { toast } from 'sonner';

const columnOrder = ['todo', 'inprogress', 'review', 'done'];
const columnTitles = {
  todo: 'To Do',
  inprogress: 'In Progress',
  review: 'Review',
  done: 'Done',
};

interface Member {
  _id: string;
  name: string;
  email: string;
  profilePicture?: string;
}

interface Attachment {
  _id: string;
  fileName: string;
  fileSize: number;
}

// Tambahkan interface untuk subtask lokal
interface LocalSubtask {
  _id?: string;        // ada jika sudah tersimpan di server
  title: string;
  completed: boolean;
  isNew?: boolean;     // flag untuk menandai subtask yang baru ditambahkan di client
}

interface EditTaskSheetProps {
  task: Task | null;
  onClose: () => void;
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  projectId?: string;
  usersRole: 'owner' | 'admin' | 'editor' | 'viewer';
  // columns dan setColumns dihapus jika tidak dipakai
  // columns: Column[];
}

export default function EditTaskSheet({
  task,
  onClose,
  setTasks,
  projectId,
}: EditTaskSheetProps) {
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);

  // Form states
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPriority, setEditPriority] = useState<Priority>('medium');
  const [editStatus, setEditStatus] = useState('');
  const [editStartDate, setEditStartDate] = useState<Date | undefined>(undefined);
  const [editDueDate, setEditDueDate] = useState<Date | undefined>(undefined);
  const [editTags, setEditTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [editAssignedTo, setEditAssignedTo] = useState<string[]>([]);
  const [editSubtasks, setEditSubtasks] = useState<LocalSubtask[]>([]);
  const [subtaskInput, setSubtaskInput] = useState('');
  const [newAttachments, setNewAttachments] = useState<File[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<Attachment[]>([]);
  const [attachmentsToDelete, setAttachmentsToDelete] = useState<string[]>([]);
  const [editIsArchived, setEditIsArchived] = useState(false);
  const [subtasksToDelete, setSubtasksToDelete] = useState<string[]>([]); // array _id subtask yang akan dihapus
  const [initialSubtasks, setInitialSubtasks] = useState<LocalSubtask[]>([]);
  
  // Reminders states
  const [editReminders, setEditReminders] = useState<any[]>([]);
  const [reminderDate, setReminderDate] = useState<Date | undefined>(undefined);
  const [reminderTime, setReminderTime] = useState('09:00');

  // Load task data
  useEffect(() => {
    
    const safeParseDate = (dateValue: any): Date | undefined => {
    if (!dateValue) return undefined;

    const d = new Date(dateValue);
    return isNaN(d.getTime()) ? undefined : d;
  };

    if (!task) return;

    const initial = (task.subtasks || []).map(sub => ({
    _id: sub._id,
    title: sub.title,
    completed: sub.completed || false,
  }));

    setEditTitle(task.title || '');
    setEditDescription(task.description || '');
    setEditPriority((task.priority as Priority) || 'medium');
    setEditStatus(task.columnId || task.status || 'todo');
    setEditStartDate(safeParseDate(task.startDate));
    setEditDueDate(safeParseDate(task.dueDate));
    setEditTags(task.tags || []);
    setEditAssignedTo(task.assignedTo?.map((a: any) => a._id || a) || []);
    setEditSubtasks(task.subtasks || []);
    setExistingAttachments(task.attachments || []);
    setEditIsArchived(!!task.isArchived);
    // Perbaikan utama: mapping subtasks dengan tipe LocalSubtask
    setEditSubtasks([...initial]);           // copy untuk editing
    setInitialSubtasks(initial);
    setNewAttachments([]);
    setAttachmentsToDelete([]);
    setSubtasksToDelete([]); // reset saat task baru dibuka
    setEditReminders(task.reminders || []);
    setReminderDate(undefined);
    setReminderTime('09:00');
  }, [task]);

  

  // Fetch project members
    // Fetch project members (dengan deduplikasi)
  useEffect(() => {
    if (!task || !projectId) {
      setMembers([]);
      return;
    }

    const fetchMembers = async () => {
      setMembersLoading(true);
      try {
        const res = await api.get(`/projects/${projectId}/members`);
        if (res.data.success) {
          // Mapping + deduplikasi berdasarkan _id
          const uniqueMembersMap = new Map<string, Member>();

          res.data.data.forEach((m: any) => {
            const user = m.user;
            if (user?._id && !uniqueMembersMap.has(user._id)) {
              uniqueMembersMap.set(user._id, {
                _id: user._id,
                name: user.name,
                email: user.email,
                profilePicture: user.profilePicture,
              });
            }
          });

          // Konversi Map ke Array
          const uniqueMembers = Array.from(uniqueMembersMap.values());

          setMembers(uniqueMembers);
        }
      } catch {
        toast.error('Failed to load members');
      } finally {
        setMembersLoading(false);
      }
    };

    fetchMembers();
  }, [task, projectId]);

  const addSubtask = () => {
    if (!subtaskInput.trim()) return;

    const newSubtask: LocalSubtask = {
      title: subtaskInput.trim(),
      completed: false,
      isNew: true,
    };

    setEditSubtasks((prev) => [...prev, newSubtask]);
    setSubtaskInput('');
  };

  const handleSubtaskToggle = async (sub: LocalSubtask, index: number) => {
    // Optimistic update
    setEditSubtasks((prev) =>
      prev.map((s, idx) => (idx === index ? { ...s, completed: !s.completed } : s))
    );

    if (!sub._id) return; // subtask baru, tidak perlu API

    try {
      await api.patch(`/tasks/${task!._id}/subtasks/${sub._id}/toggle`);
    } catch {
      toast.error('Failed to update subtask status');
      // Rollback
      setEditSubtasks((prev) =>
        prev.map((s, idx) => (idx === index ? { ...s, completed: s.completed } : s))
      );
    }
  };

  const addReminder = () => {
    if (!reminderDate) {
      toast.error('Please select a date for the reminder');
      return;
    }

    const [hours, minutes] = reminderTime.split(':').map(Number);
    const time = new Date(reminderDate);
    time.setHours(hours, minutes, 0, 0);

    if (time < new Date()) {
      toast.error('Reminder time must be in the future');
      return;
    }

    const newReminder = {
      time: time.toISOString(),
      notified: false,
      type: 'system' as const
    };

    setEditReminders([...editReminders, newReminder]);
    setReminderDate(undefined);
    setReminderTime('09:00');
  };

  const removeReminder = (index: number) => {
    setEditReminders(editReminders.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
  if (!task || !editTitle.trim()) {
    toast.error('Title is required');
    return;
  }

  setLoading(true);

  try {
    let hasChanges = false;
    const payload: any = {};

    // Title
    if (editTitle.trim() !== (task.title || '')) {
      payload.title = editTitle.trim();
      hasChanges = true;
    }

    // Description
    if (editDescription.trim() !== (task.description || '')) {
      payload.description = editDescription.trim() || undefined;
      hasChanges = true;
    }

    // Priority
    if (editPriority !== (task.priority || 'medium')) {
      payload.priority = editPriority;
      hasChanges = true;
    }

    // Status
    const currentStatus = task.status || task.columnId || 'todo';
    if (editStatus !== currentStatus) {
      payload.status = editStatus;
      hasChanges = true;
    }

    // ── Start Date (super aman) ───────────────────────────────────
    let oldStart: string | null = null;
    if (task.startDate) {
      const parsed = new Date(task.startDate);
      if (!isNaN(parsed.getTime())) {
        oldStart = format(parsed, 'yyyy-MM-dd');
      } else {
        console.warn('Invalid startDate in task:', task.startDate);
      }
    }

    const newStart = editStartDate && !isNaN(editStartDate.getTime())
      ? format(editStartDate, 'yyyy-MM-dd')
      : null;

    if (newStart !== oldStart) {
      payload.startDate = newStart ?? undefined;
      hasChanges = true;
    }

    // ── Due Date (super aman) ─────────────────────────────────────
    let oldDue: string | null = null;
    if (task.dueDate) {
      const parsed = new Date(task.dueDate);
      if (!isNaN(parsed.getTime())) {
        oldDue = format(parsed, 'yyyy-MM-dd');
      } else {
        console.warn('Invalid dueDate in task:', task.dueDate);
      }
    }

    const newDue = editDueDate && !isNaN(editDueDate.getTime())
      ? format(editDueDate, 'yyyy-MM-dd')
      : null;

    if (newDue !== oldDue) {
      payload.dueDate = newDue ?? undefined;
      hasChanges = true;
    }

    // Tags
    const oldTagsSorted = [...(task.tags || [])].sort();
    const newTagsSorted = [...editTags].sort();
    if (JSON.stringify(oldTagsSorted) !== JSON.stringify(newTagsSorted)) {
      payload.tags = editTags.length > 0 ? editTags : undefined;
      hasChanges = true;
    }

    // Assigned To
    const oldAssignees = (task.assignedTo || [])
      .map((a: any) => a._id || a)
      .sort();
    const newAssignees = [...editAssignedTo].sort();
    if (JSON.stringify(oldAssignees) !== JSON.stringify(newAssignees)) {
      payload.assignedTo = editAssignedTo;
      hasChanges = true;
    }

    // Archive
    if (editIsArchived !== !!task.isArchived) {
      payload.isArchived = editIsArchived;
      hasChanges = true;
    }

    // Reminders
    if (JSON.stringify(editReminders) !== JSON.stringify(task.reminders || [])) {
      payload.reminders = editReminders;
      hasChanges = true;
    }

    const hasSubtaskChanges =
      subtasksToDelete.length > 0 ||
      editSubtasks.some(sub => sub.isNew) ||                     // subtask baru
      editSubtasks.some(sub => 
        sub._id &&                                               // hanya subtask yang sudah ada di server
        sub.completed !== initialSubtasks.find(i => i._id === sub._id)?.completed
      );

    const hasAttachmentChanges = newAttachments.length > 0 || attachmentsToDelete.length > 0;

    // lalu digunakan di sini:
    if (
      Object.keys(payload).length > 0 ||
      hasAttachmentChanges ||
      hasSubtaskChanges
    ) {
      hasChanges = true;
    }

    // Jika tidak ada perubahan sama sekali
    if (!hasChanges) {
      toast.info('No changes detected');
      onClose();
      return;
    }

    // Update task utama jika ada perubahan field
    if (Object.keys(payload).length > 0) {
      const res = await api.put(`/tasks/${task._id}`, payload);
      toast.success(res.data.message);
    }

    // ── Sisanya tetap sama (attachments, subtasks, refresh, update state) ──
    if (newAttachments.length > 0) {
      const formData = new FormData();
      newAttachments.forEach(f => formData.append('files', f));
      if (projectId) formData.append('projectId', projectId);
      formData.append('taskId', task._id);
      await api.post('/upload', formData, { headers: { 'Content-Type': undefined } });
    }

    if (attachmentsToDelete.length > 0) {
      await Promise.allSettled(
        attachmentsToDelete.map(async fileId => {
          try { await api.delete(`/upload/${fileId}`); } catch (e) { console.error(e); }
        })
      );
    }

    if (subtasksToDelete.length > 0) {
      await Promise.allSettled(
        subtasksToDelete.map(async id => {
          try { await api.delete(`/tasks/${task._id}/subtasks/${id}`); } catch (e) { console.error(e); }
        })
      );
    }

    const newSubtasks = editSubtasks.filter(sub => sub.isNew);
    if (newSubtasks.length > 0) {
      await Promise.allSettled(
        newSubtasks.map(async sub => {
          try { await api.post(`/tasks/${task._id}/subtasks`, { title: sub.title }); } catch (e) { console.error(e); }
        })
      );
    }

    // Refresh task
    const refreshedRes = await api.get(`/tasks/${task._id}`);
    const updatedTask = refreshedRes.data.data;

    

    const mappedUpdatedTask: Task = {
      _id: updatedTask._id,
      id: updatedTask._id,
      title: updatedTask.title,
      description: updatedTask.description,
      status: updatedTask.status || 'todo',
      columnId: updatedTask.status || 'todo',
      priority: updatedTask.priority || 'medium',
      tags: updatedTask.tags || [],
      startDate: updatedTask.startDate,
      dueDate: updatedTask.dueDate,
      assignedTo: updatedTask.assignedTo || [],
      subtasks: updatedTask.subtasks || [],
      comments: updatedTask.comments || [],
      attachments: updatedTask.attachments || [],
      reminders: updatedTask.reminders || [],
      order: updatedTask.order ?? 0,
      isArchived: updatedTask.isArchived ?? false,
      membersCount: (updatedTask.assignedTo || []).length,
      commentsCount: (updatedTask.comments || []).reduce(
        (count: number, comment: any) => count + 1 + (comment.replies?.length || 0),
        0
      ),
      attachmentsCount: (updatedTask.attachments || []).length,
    };

    setTasks(prev => prev.map(t => t._id === task._id ? mappedUpdatedTask : t));

    
    
    onClose();
  } catch (error: any) {
    console.error('Error saving task:', error);
    toast.error(error.response?.data?.message || 'Failed to update task');
  } finally {
    setLoading(false);
  }
};

  

  const addTag = () => {
    if (tagInput.trim() && !editTags.includes(tagInput.trim())) {
      setEditTags([...editTags, tagInput.trim()]);
      setTagInput('');
    }
  };

  if (!task) return null;

  return (
    <Sheet open={!!task} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto p-11">
        <SheetHeader className="border-b pb-4">
          <SheetTitle className="text-2xl font-bold">Update Task</SheetTitle>
        </SheetHeader>

        <div className="mt-8 space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="edit-title">
              Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="edit-title"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="edit-desc">Description</Label>
            <RichTextEditor
              value={editDescription}
              onChange={setEditDescription}
              placeholder="Describe the task (optional)... type @ to mention"
              users={members}
              minHeight="100px"
            />
          </div>

          {/* Priority & Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={editPriority} onValueChange={(v) => setEditPriority(v as Priority)} disabled={loading}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={editStatus} onValueChange={setEditStatus} disabled={loading}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {columnOrder.map((id) => (
                    <SelectItem key={id} value={id}>
                      {columnTitles[id]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal" disabled={loading}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {editStartDate ? format(editStartDate, 'PPP') : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent mode="single" selected={editStartDate} onSelect={setEditStartDate} />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal" disabled={loading}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {editDueDate ? format(editDueDate, 'PPP') : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent mode="single" selected={editDueDate} onSelect={setEditDueDate} />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {editTags.map((tag, i) => (
                <Badge key={i} variant="secondary" className="flex items-center gap-1">
                  {tag}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4"
                    onClick={() => setEditTags(editTags.filter((_, idx) => idx !== i))}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
            <Input
              placeholder="Type tag and press Enter..."
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && tagInput.trim()) {
                  addTag();
                  e.currentTarget.value = '';
                }
              }}
              disabled={loading}
            />
          </div>

          {/* Assign To */}
          <div className="space-y-2">
            <Label>Assign To</Label>
            {membersLoading ? (
              <p className="text-sm text-muted-foreground">Loading members...</p>
            ) : (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between" disabled={loading}>
                    {editAssignedTo.length > 0 ? `${editAssignedTo.length} selected` : 'Select members'}
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search members..." />
                    <CommandList>
                      <CommandGroup>
                        {members.map((member) => (
                          <CommandItem
                            className='cursor-pointer'
                            key={member._id}
                            onSelect={() =>
                              setEditAssignedTo((prev) =>
                                prev.includes(member._id)
                                  ? prev.filter((id) => id !== member._id)
                                  : [...prev, member._id]
                              )
                            }
                          >
                            <Avatar className="h-8 w-8 mr-3">
                              <AvatarImage src={member.profilePicture} />
                              <AvatarFallback>
                                {member.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="text-sm font-medium leading-none">{member.name}</p>
                              <p className="text-xs text-muted-foreground mt-1">{member.email}</p>
                            </div>
                            {editAssignedTo.includes(member._id) && <Check className="ml-auto h-4 w-4" />}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            )}
            <div className="flex flex-wrap gap-2 mt-3">
            {editAssignedTo.map((id) => {
              const member = members.find((m) => m._id === id);
              if (!member) return null;

              return (
                <Badge key={id} variant="secondary" className="flex items-center gap-2 pr-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={member.profilePicture} />
                    <AvatarFallback className="text-xs">
                      {member.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col leading-tight">
                    <span className="text-sm font-medium">{member.name}</span>
                    <span className="text-xs text-muted-foreground">{member.email}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 ml-1 hover:bg-destructive/20"
                    onClick={() => setEditAssignedTo(editAssignedTo.filter((aid) => aid !== id))}
                  >
                    <X className="h-3 w-3 text-destructive"  />
                  </Button>
                </Badge>
              );
            })}
          </div>
          </div>

          {/* Subtasks */}
          <div className="space-y-2">
          <Label>Subtasks</Label>

          {/* List Subtasks */}
          <div className="space-y-2">
            {editSubtasks.map((sub, i) => {
              const isMarkedForDelete = sub._id && subtasksToDelete.includes(sub._id!);
              const isNew = !!sub.isNew;

              return (
                <div
                  key={sub._id || `new-${i}`}
                  className={`flex items-center gap-3 w-full p-2 rounded border transition-all ${
                    isMarkedForDelete
                      ? 'bg-destructive/5 border-destructive/50 opacity-70'
                      : 'bg-muted/30 border-transparent'
                  }`}
                >
                  {/* Checkbox */}
                  <Checkbox
                    checked={sub.completed}
                    onCheckedChange={() => handleSubtaskToggle(sub, i)}
                    disabled={loading || isMarkedForDelete}
                  />

                  {/* Title dengan styling sesuai status */}
                  <span
                    className={`flex-1 text-sm font-medium ${
                      isMarkedForDelete
                        ? 'line-through text-destructive'
                        : sub.completed
                        ? 'line-through text-muted-foreground'
                        : 'text-foreground'
                    }`}
                  >
                    {sub.title}
                  </span>

                  {/* Tombol Hapus / Batal Hapus */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:bg-destructive/10"
                    onClick={() => {
                      if (sub._id) {
                        setSubtasksToDelete((prev) =>
                          prev.includes(sub._id!)
                            ? prev.filter((id) => id !== sub._id)
                            : [...prev, sub._id!]
                        );
                      } else {
                        // Hapus langsung subtask baru yang belum disimpan
                        setEditSubtasks((prev) => prev.filter((s) => s !== sub));
                      }
                    }}
                    disabled={loading}
                  >
                    {isMarkedForDelete ? (
                      <RotateCcw className="h-4 w-4 text-destructive" />
                    ) : (
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              );
            })}
          </div>

          {/* Notifikasi jika ada subtask yang akan dihapus */}
          {subtasksToDelete.length > 0 && (
            <p className="text-sm text-destructive font-medium -mt-1">
              {subtasksToDelete.length} subtask will.
            </p>
          )}

          {/* Input untuk tambah subtask baru */}
          <div className="flex gap-2 mt-4">
            <Input
              placeholder="Add subtask..."
              value={subtaskInput}
              onChange={(e) => setSubtaskInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addSubtask()}
              disabled={loading}
            />
            <Button variant="outline" onClick={addSubtask} disabled={loading || !subtaskInput.trim()}>
              Add
            </Button>
          </div>
          </div>

          {/* Reminders Section */}
          <div className="space-y-4 border-t pt-6">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" />
              <Label className="text-base font-bold">Reminders</Label>
            </div>

            <div className="space-y-3">
              {editReminders.length > 0 ? (
                <div className="grid gap-2">
                  {editReminders.map((reminder, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                      <div className="flex items-center gap-3">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <div className="text-sm">
                          <p className="font-medium">
                            {format(new Date(reminder.time), 'PPP')}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            at {format(new Date(reminder.time), 'p')}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => removeReminder(i)}
                        disabled={loading}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">No reminders set for this task.</p>
              )}
            </div>

            <div className="flex flex-col gap-3 p-4 rounded-xl border border-dashed bg-muted/5">
               <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Add New Reminder</p>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal h-10" disabled={loading}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {reminderDate ? format(reminderDate, 'PPP') : <span>Pick date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent mode="single" selected={reminderDate} onSelect={setReminderDate} />
                    </PopoverContent>
                  </Popover>

                  <Input
                    type="time"
                    className="h-10"
                    value={reminderTime}
                    onChange={(e) => setReminderTime(e.target.value)}
                    disabled={loading}
                  />
               </div>
               <Button 
                variant="secondary" 
                className="w-full h-10 font-bold" 
                onClick={addReminder} 
                disabled={loading || !reminderDate}
               >
                <Plus className="mr-2 h-4 w-4" />
                Add Reminder
               </Button>
            </div>
          </div>

          {/* Attachments */}
          <div className="space-y-6">
            <Label>Attachments</Label>

            {/* Existing */}
            {existingAttachments.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm font-medium">Existing attachments ({existingAttachments.length})</p>
                <div className="space-y-2">
                  {existingAttachments.map((file) => {
                    const isDeleting = attachmentsToDelete.includes(file._id);
                    return (
                      <div
                        key={file._id}
                        className={`flex items-center justify-between p-3 rounded border transition-all ${
                          isDeleting ? 'bg-destructive/10 border-destructive/50 opacity-70' : 'bg-muted/30'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Paperclip className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className={`text-sm font-medium ${isDeleting ? 'line-through text-destructive' : ''}`}>
                              {file.fileName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {(file.fileSize / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <Button
                          variant={isDeleting ? 'destructive' : 'ghost'}
                          size="sm"
                          onClick={() =>
                            setAttachmentsToDelete((prev) =>
                              prev.includes(file._id) ? prev.filter((id) => id !== file._id) : [...prev, file._id]
                            )
                          }
                        >
                          {isDeleting ? <RotateCcw className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
                        </Button>
                      </div>
                    );
                  })}
                </div>
                {attachmentsToDelete.length > 0 && (
                  <p className="text-sm text-destructive font-medium">
                    {attachmentsToDelete.length} file(s) will be permanently deleted upon saving.
                  </p>
                )}
              </div>
            )}

            {/* New Attachments */}
            <div className="space-y-3">
              <p className="text-sm font-medium">Add new attachments</p>
              <div
                className="relative flex flex-col items-center justify-center w-full h-full border-2 border-dashed border-muted-foreground/25 rounded bg-muted/5 hover:bg-muted/10 transition-colors cursor-pointer"
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const files = Array.from(e.dataTransfer.files);
                  setNewAttachments((prev) => [...prev, ...files]);
                }}
              >
                <input
                  type="file"
                  multiple
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={(e) => {
                    if (e.target.files) {
                      setNewAttachments((prev) => [...prev, ...Array.from(e.target.files)]);
                    }
                  }}
                  accept="image/*,.pdf,.doc,.docx"
                  disabled={loading}
                />
                <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                  <div className="p-5 bg-muted/20 rounded mb-4">
                    <CloudUpload className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <p className="mb-2 text-sm text-foreground font-medium">
                    Drag & drop files here, or <span className="text-primary underline">browse</span>
                  </p>
                  <p className="text-xs text-muted-foreground">Supports JPEG, PNG, and PDF files</p>
                </div>
              </div>

              {newAttachments.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">New files ({newAttachments.length})</p>
                  <div className="flex flex-wrap gap-2">
                    {newAttachments.map((file, index) => (
                      <Badge
                          key={index}
                          variant="outline"
                          className="flex items-center gap-2 py-2 px-3 max-w-full sm:max-w-70 md:max-w-90"
                        >
                          <Paperclip className="h-4 w-4 shrink-0" />
                          
                          {/* Bagian nama file yang bisa wrap */}
                          <span 
                            className="text-sm truncate min-w-0 flex-1 break-all whitespace-pre-wrap"
                          >
                            {file.name}
                          </span>

                          <span className="text-xs text-muted-foreground shrink-0">
                            ({(file.size / 1024 / 1024).toFixed(2)} MB)
                          </span>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 hover:bg-destructive/10 shrink-0"
                            onClick={() => setNewAttachments((prev) => prev.filter((_, i) => i !== index))}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Final attachments after save:{' '}
                <strong>
                  {Math.max(0, existingAttachments.length - attachmentsToDelete.length + newAttachments.length)}
                </strong>
              </p>
            </div>

            {/* Archive */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit-archive"
                checked={editIsArchived}
                onCheckedChange={(checked) => setEditIsArchived(!!checked)}
                disabled={loading}
              />
              <Label htmlFor="edit-archive">Archive this task after update</Label>
            </div>
          </div>
        </div>

        <SheetFooter className="mt-8 border-t pt-6">
          <div className="w-full flex justify-end gap-3">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button 
              className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/15 shadow-none font-semibold"
              onClick={handleSave} 
              disabled={loading || !editTitle.trim()}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}


