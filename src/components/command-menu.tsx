'use client';

import * as React from 'react';
import {
  Calculator,
  Calendar,
  CreditCard,
  Settings,
  Smile,
  User,
  Search,
  File,
  CheckCircle2,
  Tag as TagIcon,
  LayoutGrid,
  List,
  Folder
} from 'lucide-react';
import { Button } from './ui/button';

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from './ui/command';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../utils/api';
import { type Task } from '../types/index';
import { type Project } from '../types/project';

export function CommandMenu() {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [projects, setProjects] = React.useState<Project[]>([]);
  const navigate = useNavigate();
  const { projectId } = useParams();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Fetch all tasks and projects globally when menu is opened
  React.useEffect(() => {
    if (open) {
       const fetchData = async () => {
         try {
           const [tasksRes, projectsRes] = await Promise.all([
             api.get('/tasks'),
             api.get('/projects')
           ]);
           setTasks(tasksRes.data.data || []);
           setProjects(projectsRes.data.data || []);
         } catch (err) {
           console.error("Failed to fetch data for command menu", err);
         }
       };
       fetchData();
    }
  }, [open]);

  const filteredTasks = React.useMemo(() => {
    if (!search) return tasks.slice(0, 5);
    return tasks.filter(t => t.title.toLowerCase().includes(search.toLowerCase()))
                .slice(0, 10);
  }, [tasks, search]);

  const filteredProjects = React.useMemo(() => {
    if (!search) return projects.slice(0, 5);
    return projects.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
                   .slice(0, 5);
  }, [projects, search]);

  const runCommand = React.useCallback((command: () => void) => {
    setOpen(false);
    command();
  }, []);

  const getTaskProjectId = (task: any) => {
    return typeof task.projectId === 'string' ? task.projectId : task.projectId?._id;
  };

  return (
    <>
      <Button 
        variant="outline" 
        className="relative h-9 w-9 p-0 xl:h-10 xl:w-60 xl:justify-start xl:px-3 xl:py-2"
        onClick={() => setOpen(true)}
      >
        <Search className="h-4 w-4 xl:mr-2" />
        <span className="hidden xl:inline-flex text-muted-foreground text-sm">Global search...</span>
        <kbd className="pointer-events-none absolute right-1.5 top-2 hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 xl:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen} className="shadow-xs border-border/40">
        <CommandInput 
            placeholder="Type a command or search everywhere..." 
            value={search}
            onValueChange={setSearch}
        />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          
          <CommandGroup heading="Projects">
            {filteredProjects.map((project) => (
              <CommandItem
                key={project._id}
                onSelect={() => runCommand(() => navigate(`/projects/${project._id}`))}
                className="gap-2"
              >
                <Folder className="h-4 w-4 text-muted-foreground" />
                <span>{project.name}</span>
              </CommandItem>
            ))}
            {filteredProjects.length === 0 && <div className="py-2 px-4 text-sm text-muted-foreground">No projects found.</div>}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Tasks">
            {filteredTasks.map((task) => {
              const pId = getTaskProjectId(task);
              const projectName = typeof task.projectId === 'object' ? (task.projectId as any).name : task.projectName;
              return (
                <CommandItem
                  key={task._id}
                  onSelect={() => runCommand(() => pId ? navigate(`/projects/${pId}/tasks/${task._id}`) : navigate(`/tasks/${task._id}`))}
                  className="gap-2"
                >
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                  <div className="flex flex-col">
                    <span>{task.title}</span>
                    {projectName && <span className="text-xs text-muted-foreground">{projectName}</span>}
                  </div>
                </CommandItem>
              );
            })}
            {filteredTasks.length === 0 && <div className="py-2 px-4 text-sm text-muted-foreground">No tasks found.</div>}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Navigation">
             {projectId && (
               <>
                 <CommandItem onSelect={() => runCommand(() => navigate(`/projects/${projectId}?view=board`))}>
                   <LayoutGrid className="mr-2 h-4 w-4" />
                   Current Project Board
                 </CommandItem>
                 <CommandItem onSelect={() => runCommand(() => navigate(`/projects/${projectId}?view=list`))}>
                   <List className="mr-2 h-4 w-4" />
                   Current Project List
                 </CommandItem>
               </>
             )}
             <CommandItem onSelect={() => runCommand(() => navigate(`/dashboard`))}>
               <User className="mr-2 h-4 w-4" />
               Go to Dashboard
             </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
