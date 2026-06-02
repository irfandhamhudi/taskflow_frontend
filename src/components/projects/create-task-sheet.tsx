'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
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
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../ui/command';
import { Checkbox } from '../ui/checkbox';
import { format } from 'date-fns';
import { CalendarIcon, ChevronDown, CloudUpload, Paperclip, X, Check, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import api from '../../utils/api';
import { toast } from 'sonner';

interface Member {
  _id: string;
  name: string;
  email: string;
  profilePicture?: string;
}

interface CreateTaskSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  // onTaskCreated?: (newTask: any) => void; // ← SUDAH ADA
  children: React.ReactNode;
}

export default function CreateTaskSheet({
  isOpen,
  onOpenChange,
  // onTaskCreated,
  children,
}: CreateTaskSheetProps) {
  const { projectId } = useParams<{ projectId: string }>();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [status, setStatus] = useState<'todo' | 'inprogress' | 'review' | 'done'>('todo');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [assignedTo, setAssignedTo] = useState<string[]>([]); // array of user _id
  const [members, setMembers] = useState<Member[]>([]);
  const [subtasks, setSubtasks] = useState<{ title: string; completed: boolean }[]>([]);
  const [subtaskInput, setSubtaskInput] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isArchived, setIsArchived] = useState(false);
  const [loading, setLoading] = useState(false);
  const [membersLoading, setMembersLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]); // file dari backend
  const [uploadLoading, setUploadLoading] = useState(false);

  // Fetch members when sheet opens
  // Fetch members
  useEffect(() => {
  if (!isOpen || !projectId) {
    setMembers([]);
    return;
  }

  const fetchMembers = async () => {
    setMembersLoading(true);
    try {
      const res = await api.get(`/projects/${projectId}/members`);
      if (res.data.success) {
        // Ambil semua member, lalu buat unique berdasarkan user._id
        const uniqueMembers = res.data.data.reduce((acc: Member[], m: any) => {
          const user = m.user;
          // Cek apakah _id sudah ada
          if (!acc.some((existing) => existing._id === user._id)) {
            acc.push({
              _id: user._id,
              name: user.name,
              email: user.email,
              profilePicture: user.profilePicture,
            });
          }
          return acc;
        }, [] as Member[]);

        setMembers(uniqueMembers);
      }
    } catch (error) {
      toast.error('Failed to load members');
    } finally {
      setMembersLoading(false);
    }
  };

  fetchMembers();
}, [isOpen, projectId]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPriority('medium');
    setStatus('todo');
    setStartDate(undefined);
    setDueDate(undefined);
    setTags([]);
    setTagInput('');
    setAssignedTo([]);
    setSubtasks([]);
    setSubtaskInput('');
    setAttachments([]);
    setUploadedFiles([]);
    setIsArchived(false);
  };

  const handleCreateTask = async () => {
    if (!title.trim()) {
      toast.error('Task title is required');
      return;
    }

    if (!projectId) {
      toast.error('Project not found');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/tasks', {
        projectId,
        title: title.trim(),
        description: description.trim() || undefined,
        status,
        priority,
        tags: tags.length > 0 ? tags : undefined,
        startDate: startDate ? format(startDate, 'yyyy-MM-dd') : undefined,
        dueDate: dueDate ? format(dueDate, 'yyyy-MM-dd') : undefined,
        assignedTo: assignedTo.length > 0 ? assignedTo : undefined,
        subtasks: subtasks.length > 0 ? subtasks.map(s => ({ title: s.title })) : undefined,
        isArchived, // ← TAMBAHKAN INI!
      });

      const newTask = response.data.data;
      

      // Jika ada attachments → upload setelah task dibuat
      if (attachments.length > 0) {
        await uploadAttachments(newTask._id);
      }

      toast.success(response.data.message);
      resetForm();
      onOpenChange(false);

      // if (onTaskCreated) {
      //   onTaskCreated(newTask);
      // }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to create task';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // Upload attachments setelah task dibuat
  const uploadAttachments = async (taskId: string) => {
    if (attachments.length === 0) return;

    setUploadLoading(true);

    const formData = new FormData();
    attachments.forEach((file) => {
      formData.append('files', file); // nama field harus 'files' karena di controller: req.files
    });
    formData.append('projectId', projectId!);
    formData.append('taskId', taskId);

    try {
      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        setUploadedFiles(res.data.data);
        
      } else {
        toast.error('Some files failed to upload');
      }
    } catch (error: any) {
      toast.error('Failed to upload attachments');
      console.error(error);
    } finally {
      setUploadLoading(false);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const addSubtask = () => {
    if (subtaskInput.trim()) {
      setSubtasks([...subtasks, { title: subtaskInput.trim(), completed: false }]);
      setSubtaskInput('');
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>{children}</SheetTrigger>

      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto p-11">
        <SheetHeader className="border-b pb-4">
          <SheetTitle className="text-2xl font-bold">Create New Task</SheetTitle>
          <SheetDescription>Add a new task to the project.</SheetDescription>
        </SheetHeader>

        <div className="mt-8 space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title..."
              autoFocus
              disabled={loading}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <RichTextEditor
              value={description}
              onChange={setDescription}
              placeholder="Describe the task (optional)... type @ to mention"
              users={members}
              minHeight="100px"
            />
          </div>

          {/* Priority & Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                    <SelectTrigger className="w-full cursor-pointer">
                      <SelectValue placeholder="Select priority" />
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
                  <Label htmlFor="status">Status</Label>
                  <Select value={status} onValueChange={(v) => setStatus(v as any)} disabled={loading}>
                    <SelectTrigger className="w-full cursor-pointer">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent >
                      <SelectItem value="todo">To Do</SelectItem>
                      <SelectItem value="inprogress">In Progress</SelectItem>
                      <SelectItem value="review">Review</SelectItem>
                      <SelectItem value="done">Done</SelectItem>
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
                    {startDate ? format(startDate, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent mode="single" selected={startDate} onSelect={setStartDate} />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal" disabled={loading}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent mode="single" selected={dueDate} onSelect={setDueDate} />
                </PopoverContent>
              </Popover>
            </div>
          </div>


          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag, i) => (
                <Badge 
                  key={i} 
                  variant="secondary" 
                  className="flex items-center gap-1"
                >
                  {tag}
                  <Button
                    variant="ghost"
                    onClick={() => setTags(tags.filter((_, idx) => idx !== i))}
                    className="h-4 w-4"
                    aria-label={`Remove tag ${tag}`}
                    disabled={loading}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Add tag..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && tagInput.trim()) {
                    e.preventDefault(); // cegah form submit
                    addTag();
                  }
                }}
                disabled={loading}
              />
              <Button variant="outline" onClick={addTag} disabled={loading || !tagInput.trim()}>
                Add
              </Button>
            </div>
          </div>

          {/* Assign To */}
          <div className="space-y-2">
          <Label>Assign To</Label>

          {membersLoading ? (
            <p className="text-sm text-muted-foreground">Loading members...</p>
          ) : members.length === 0 ? (
            <p className="text-sm text-muted-foreground">No members in this project</p>
          ) : (
            <>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between" disabled={loading}>
                    {assignedTo.length > 0 ? `${assignedTo.length} selected` : 'Select members'}
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search members..." />
                    <CommandList >
                      <CommandEmpty>No members found.</CommandEmpty>
                      <CommandGroup >
                        {members.map((member) => (
                          <CommandItem
                            className='cursor-pointer'
                            key={member._id}
                            onSelect={() =>
                              setAssignedTo((prev) =>
                                prev.includes(member._id)
                                  ? prev.filter((id) => id !== member._id)
                                  : [...prev, member._id]
                              )
                            }
                          >
                            <Avatar className="h-8 w-8 mr-3">
                              <AvatarImage src={member.profilePicture} />
                              <AvatarFallback>
                                {member.name
                                  .split(' ')
                                  .map((n) => n[0])
                                  .join('')
                                  .toUpperCase()
                                  .slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="text-sm font-medium leading-none">{member.name}</p>
                              <p className="text-xs text-muted-foreground mt-1">{member.email}</p>
                            </div>
                            {assignedTo.includes(member._id) && <Check className="ml-auto h-4 w-4" />}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              {/* Selected assignees - dengan email */}
              <div className="flex flex-wrap gap-2 mt-3">
                {assignedTo.map((id) => {
                  const member = members.find((m) => m._id === id);
                  if (!member) return null;

                  return (
                    <Badge
                      key={id}
                      variant="secondary"
                      className="flex items-center gap-2 pr-2 py-2"
                    >
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={member.profilePicture} />
                        <AvatarFallback className="text-xs">
                          {member.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .toUpperCase()
                            .slice(0, 2)}
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
                        onClick={() => setAssignedTo(assignedTo.filter((aid) => aid !== id))}
                        disabled={loading}
                      >
                        <X className="h-3 w-3 text-destructive" />
                      </Button>
                    </Badge>
                  );
                })}
              </div>
            </>
          )}
        </div>

          {/* Subtasks */}
          <div className="space-y-2">
            <Label>Subtasks</Label>
            <div className="space-y-2">
              {subtasks.map((subtask, index) => (
                <div key={index} className="flex items-center gap-3">
                  <Checkbox
                    checked={subtask.completed}
                    onCheckedChange={(checked) =>
                      setSubtasks(
                        subtasks.map((s, i) =>
                          i === index ? { ...s, completed: !!checked } : s
                        )
                      )
                    }
                  />
                  <span className={subtask.completed ? 'line-through text-muted-foreground' : ''}>
                    {subtask.title}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="ml-auto h-8 w-8"
                    onClick={() => setSubtasks(subtasks.filter((_, i) => i !== index))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Add subtask..."
                value={subtaskInput}
                onChange={(e) => setSubtaskInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSubtask())}
                disabled={loading}
              />
              <Button variant="outline" onClick={addSubtask} disabled={loading}>
                Add
              </Button>
            </div>
          </div>

          {/* Attachments */}
          <div className="space-y-4">
            <Label>Attachments</Label>
            <div
              className="relative flex flex-col items-center justify-center w-full border-2 border-dashed border-muted-foreground/25 rounded bg-muted/5 hover:bg-muted/10 transition-colors cursor-pointer p-6"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const files = Array.from(e.dataTransfer.files);
                setAttachments([...attachments, ...files]);
              }}
            >
              <input
                type="file"
                multiple
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={(e) => {
                  if (e.target.files) {
                    const files = Array.from(e.target.files);
                    setAttachments([...attachments, ...files]);
                  }
                }}
                accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                disabled={loading}
              />
              <div className="flex flex-col items-center justify-center text-center">
                <div className="p-5 bg-muted/20 rounded mb-4">
                  <CloudUpload className="h-10 w-10 text-muted-foreground" />
                </div>
                <p className="mb-2 text-sm font-medium">
                  Drag & drop files here, or <span className="text-primary underline">browse</span>
                </p>
                <p className="text-xs text-muted-foreground">Supports images, PDF, and documents</p>
              </div>
            </div>

            
            {/* Preview selected files (belum diupload) */}
            {attachments.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Selected files ({attachments.length})</p>
                <div className="flex flex-wrap gap-2">
                  {attachments.map((file, index) => (
                    <Badge key={index} variant="outline" className="flex items-center gap-2 py-2 px-3">
                      <Paperclip className="h-4 w-4" />
                      <span className="text-sm">{file.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 hover:bg-destructive/10"
                        onClick={() => setAttachments(attachments.filter((_, i) => i !== index))}
                        disabled={loading}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>

                {/* ← TAMBAHKAN INI DI SINI */}
                {uploadLoading && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-3">
                    <div className="animate-spin rounded h-4 w-4 border-b-2 border-primary" />
                    Uploading attachments... ({attachments.length} {attachments.length === 1 ? 'file' : 'files'})
                  </div>
                )}
              </div>
            )}

            {/* Uploaded files (jika ada) */}
            {uploadedFiles.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-green-600">Uploaded successfully</p>
                <div className="flex flex-wrap gap-2">
                  {uploadedFiles.map((file) => (
                    <Badge key={file._id} variant="secondary" className="flex items-center gap-2">
                      <Paperclip className="h-4 w-4" />
                      {file.fileName}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Archive Checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="archive"
              checked={isArchived}
              onCheckedChange={(checked) => setIsArchived(!!checked)}
            />
            <Label htmlFor="archive" className="cursor-pointer">
              Archive this task after creation
            </Label>
          </div>
        </div>

        <SheetFooter className="mt-8 border-t pt-6">
          <div className="flex w-full justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                resetForm();
                onOpenChange(false);
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/15 shadow-none font-semibold"
              onClick={handleCreateTask} 
              disabled={loading || !title.trim()}
            >
              {loading ? 'Creating...' : 'Create Task'}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}


