import { Folder } from 'lucide-react';
import { ProjectCard } from './project-card';
import type { Project } from '../../../types/project';
import { CreateProjectSheet } from '../../../components/projects/create-project-sheet';

interface ProjectListProps {
  projects: Project[];
}

export function ProjectList({ projects }: ProjectListProps) {
  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 border rounded-xl bg-card/50 shadow-sm border-dashed text-center">
        <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
          <Folder className="h-10 w-10 text-primary" />
        </div>
        <h3 className="text-xl font-semibold mb-2">No projects found</h3>
        <p className="text-muted-foreground max-w-md mb-6">
          You don't have any projects yet. Click the button below to get started!
        </p>
        <CreateProjectSheet />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {projects.map((project) => (
        <ProjectCard key={project._id} project={project} />
      ))}
    </div>
  );
}
