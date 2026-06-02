// src/features/dashboard/components/ActiveProjects.tsx
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { ScrollArea } from '../../ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '../../ui/avatar';
import { Badge } from '../../ui/badge';
import { Link } from 'react-router-dom';
import IMG_Project from '../../../assets/IMG_noProjects.png';
import type { DashboardData } from '../../../types/dashboard';
import type { Project } from '../../../types/project';

type ActiveProjectsProps = {
  projects: Project[];
  projectStats: DashboardData['projectStats'];
};

function AnimatedProjectItem({ project, stats }: { project: Project, stats: any }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Animasi delay
    const timer = setTimeout(() => {
      setProgress(stats.progress ?? 0);
    }, 150);
    return () => clearTimeout(timer);
  }, [stats.progress]);

  // Simulasi logic status (kalau mau diganti dengan logic beneran, bisa pakai data asli)
  const isAtRisk = progress < 50; 
  const statusLabel = isAtRisk && progress > 0 ? "At Risk" : "On Track";
  const statusColor = isAtRisk && progress > 0
    ? "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-500" 
    : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-500";
    
  const barColor = isAtRisk && progress > 0 ? "bg-red-600 dark:bg-red-500" : "bg-emerald-600 dark:bg-emerald-500";
  
  // Hitung jumlah block yang terisi (max 20 blocks, tiap block 5%)
  const filledCount = Math.round(progress / 5);

  return (
    <div className="flex flex-col py-5 px-6 border-b last:border-b-0 border-border/50 hover:bg-muted/20 transition-colors">
      {/* Top Row: Name, Badge, Avatars, Menu */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <span className="text-xl drop-shadow-sm">{project.icon}</span>
          <span className="font-semibold text-foreground/90">{project.name}</span>
          <Badge variant="secondary" className={`text-[10px] px-2 py-0 h-5 rounded font-medium ${statusColor}`}>
            {statusLabel}
          </Badge>
        </div>
        
        <div className="flex items-center gap-3">
           <div className="flex">
             <Avatar className="h-7 w-7 border-2 border-background" title={project.owner?.name}>
               {/* Gunakan any cast untuk profilePicture jaga-jaga jika tipe owner tidak menyertakan profilePicture tapi backend mengembalikannya */}
               <AvatarImage src={(project.owner as any)?.profilePicture} />
               <AvatarFallback className="text-[10px] uppercase">{project.owner?.name?.charAt(0) || 'U'}</AvatarFallback>
             </Avatar>
           </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4">
         <span>{stats.completedTasks} / {stats.totalTasks} tasks</span>
         {project.createdAt && (
            <>
              <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
              <span>Created {new Date(project.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </>
         )}
      </div>

      {/* Progress Label Row */}
      <div className="flex justify-between items-center mb-1.5 text-sm">
         <span className="text-muted-foreground">Progress</span>
         <span className="font-semibold">{Math.round(progress)}%</span>
      </div>
      
      {/* Segmented Bar */}
      <div className="flex gap-[3px] w-full">
         {Array.from({ length: 20 }).map((_, i) => (
           <div
             key={i}
             className={`h-3.5 flex-1 rounded transition-colors duration-300 ${
               i < filledCount ? barColor : "bg-secondary"
             }`}
           />
         ))}
      </div>
    </div>
  );
}

export function ActiveProjects({ projects, projectStats }: ActiveProjectsProps) {
  return (
    <Card className="flex flex-col h-full shadow-sm border-border/50">
      <CardHeader className="shrink-0 flex flex-row items-center justify-between py-4 px-6 border-b border-border/50">
        <CardTitle className="text-base font-bold">Active Projects</CardTitle>
        <Link to="/projects" className="text-sm text-muted-foreground hover:text-foreground font-medium transition-colors">
          View all
        </Link>
      </CardHeader>

      <CardContent className="p-0 flex-1 flex flex-col">
        {projects.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center text-muted-foreground min-h-[350px]">
            <img src={IMG_Project} className="w-48 h-48 object-cover opacity-80" alt="No projects" />
            <p className="text-sm mt-4">You don't have any active projects yet.</p>
          </div>
        ) : (
          <ScrollArea className="max-h-[420px] **:data-radix-scroll-area-viewport:max-h-[420px]">
            <div className="flex flex-col">
              {projects.map((project) => {
                const stats = projectStats.find(
                  (s) => s.projectId === project._id
                ) || {
                  totalTasks: 0,
                  completedTasks: 0,
                  progress: 0,
                };

                return (
                  <AnimatedProjectItem 
                    key={project._id || project.name} 
                    project={project} 
                    stats={stats} 
                  />
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
