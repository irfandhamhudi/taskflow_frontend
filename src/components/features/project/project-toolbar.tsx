// components/projects/ProjectToolbar.tsx

import { Tabs, TabsList, TabsTrigger } from "../../ui/tabs";
import { LayoutGrid, List, Archive, CirclePlus, BarChart3 } from 'lucide-react';
import CreateTaskSheet from '../../projects/create-task-sheet';
import type { Task, ViewType } from "../../../types/index";
import { Button } from "../../ui/button";

interface ProjectToolbarProps {
  view: ViewType;
  onViewChange: (v: ViewType) => void;
  isCreateOpen: boolean;
  onCreateOpenChange: (open: boolean) => void;
  currentUserRole: string;
  onCreateTask: (taskData: Partial<Task>) => Promise<void>;
  projectId: string;
}

export default function ProjectToolbar(props: ProjectToolbarProps) {
  const { view, onViewChange, isCreateOpen, onCreateOpenChange, currentUserRole } = props;

  
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <Tabs value={view} onValueChange={(v) => onViewChange(v as ViewType)} className="w-auto">
        <TabsList className="bg-transparent h-auto p-0 gap-1 border-none w-auto justify-start overflow-x-auto scrollbar-hide [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <TabsTrigger value="board" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary dark:data-[state=active]:bg-primary/20 dark:data-[state=active]:text-primary px-4 py-2 rounded text-sm font-semibold transition-all shrink-0">
            Board
          </TabsTrigger>
          <TabsTrigger value="list" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary dark:data-[state=active]:bg-primary/20 dark:data-[state=active]:text-primary px-4 py-2 rounded text-sm font-semibold transition-all shrink-0">
            List
          </TabsTrigger>
          <TabsTrigger value="timeline" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary dark:data-[state=active]:bg-primary/20 dark:data-[state=active]:text-primary px-4 py-2 rounded text-sm font-semibold transition-all shrink-0">
            Timeline
          </TabsTrigger>

          <TabsTrigger value="files" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary dark:data-[state=active]:bg-primary/20 dark:data-[state=active]:text-primary px-4 py-2 rounded text-sm font-semibold transition-all shrink-0">
            Files
          </TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary dark:data-[state=active]:bg-primary/20 dark:data-[state=active]:text-primary px-4 py-2 rounded text-sm font-semibold transition-all shrink-0">
            Analytics
          </TabsTrigger>
          <TabsTrigger value="activity" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary dark:data-[state=active]:bg-primary/20 dark:data-[state=active]:text-primary px-4 py-2 rounded text-sm font-semibold transition-all shrink-0">
            Activity
          </TabsTrigger>
          <TabsTrigger value="archive" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary dark:data-[state=active]:bg-primary/20 dark:data-[state=active]:text-primary px-4 py-2 rounded text-sm font-semibold transition-all shrink-0">
            Archive
          </TabsTrigger>
        </TabsList>
      </Tabs>
      {view !== 'archive' && !['viewer'].includes(currentUserRole) && (
        <CreateTaskSheet
          isOpen={isCreateOpen}
          onOpenChange={onCreateOpenChange}
          onTaskCreated={(newTaskData) => {
            // Panggil handler create dari hook
            props.onCreateTask(newTaskData); // ← ubah ke nama yang sesuai props
          }}
        >
          <Button size="sm" className="w-full sm:w-auto bg-primary/10 text-primary border-primary/20 hover:bg-primary/15 shadow-none font-semibold">
            <CirclePlus className="mr-2 h-4 w-4" />
            New Task
          </Button>
        </CreateTaskSheet>
      )}
    </div>
  );
}
