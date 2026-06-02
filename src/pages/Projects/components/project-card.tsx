import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar';
import { Lock, UsersRound, Globe, Calendar, Star, CheckCircle2, ListTodo } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { useProjectStore } from '../../../store/useProjectStore';
import api from '../../../utils/api';
import { toast } from 'sonner';
import type { Project } from '../../../types/project';
import { Progress } from "../../../components/ui/progress";

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const progress = project.taskCount && project.taskCount > 0 
    ? Math.round(((project.completedTaskCount || 0) / project.taskCount) * 100) 
    : 0;

  return (
    <Link to={`/projects/${project._id}`} className="group block h-full">
      <Card className="h-full flex flex-col border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-xl hover:shadow-primary/5 transition-all duration-500 hover:border-primary/30 group-hover:-translate-y-2 overflow-hidden relative">
        {/* Subtle Decorative Gradient */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-primary/10 transition-colors duration-500" />
        
        <CardHeader className="pb-4 relative px-6 pt-6">
          <div className="flex justify-between items-start w-full gap-2">
            <div className="flex gap-3 min-w-0 flex-1">
              <div className="text-2xl p-2 rounded bg-primary/5 border border-primary/10 group-hover:scale-110 transition-all duration-500 flex-shrink-0">
                {project.icon || '📁'}
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg font-bold tracking-tight group-hover:text-primary transition-colors duration-300 truncate">
                    {project.name}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full hover:bg-yellow-500/10 group/star relative z-10 transition-colors flex-shrink-0"
                    onClick={async (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      try {
                        const res = await api.patch(`/projects/${project._id}/favorite`);
                        if (res.data.success) {
                          useProjectStore.getState().toggleFavorite(project._id, res.data.isFavorite);
                          toast.success(res.data.message);
                        }
                      } catch (err) {
                        toast.error("Failed to update favorite status");
                      }
                    }}
                  >
                    <Star 
                      className={`h-4 w-4 transition-all duration-300 ${
                        project.isFavorite 
                          ? "fill-yellow-500 text-yellow-500 scale-110" 
                          : "text-muted-foreground group-hover/star:text-yellow-500"
                      }`} 
                    />
                  </Button>
                </div>
                <CardDescription className="line-clamp-1 text-xs leading-relaxed mt-0.5">
                  {project.description || 'No description provided.'}
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 pb-6 space-y-5">
          {/* Progress Section */}
          <div className="space-y-2">
            <div className="flex justify-between items-end">
              <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Progress</span>
              <span className="text-xs font-bold text-primary">{progress}%</span>
            </div>
            <Progress value={progress} className="h-1.5 bg-primary/10" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2.5 p-2 rounded-xl bg-muted/30 border border-border/50">
              <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500">
                <ListTodo className="h-3.5 w-3.5" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-medium text-muted-foreground leading-none mb-1 text-nowrap">Tasks</span>
                <span className="text-sm font-bold leading-none">{project.taskCount || 0}</span>
              </div>
            </div>
            <div className="flex items-center gap-2.5 p-2 rounded-xl bg-muted/30 border border-border/50">
              <div className="p-1.5 rounded-lg bg-green-500/10 text-green-500">
                <CheckCircle2 className="h-3.5 w-3.5" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-medium text-muted-foreground leading-none mb-1 text-nowrap">Done</span>
                <span className="text-sm font-bold leading-none">{project.completedTaskCount || 0}</span>
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="py-4 px-6 border-t border-border/40 bg-muted/10 backdrop-blur-md">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <Avatar className="h-7 w-7 border-2 border-background shadow-md ring-1 ring-border/50" title={project.owner?.name}>
                <AvatarImage src={(project.owner as any)?.profilePicture} />
                <AvatarFallback className="text-[9px] font-bold bg-primary/10 text-primary">
                  {project.owner?.name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-[10px] font-medium text-muted-foreground leading-none mb-0.5">Owner</span>
                <span className="text-xs font-bold truncate max-w-[100px]">{project.owner?.name || 'Unknown'}</span>
              </div>
            </div>

            <div className="flex -space-x-2.5 items-center">
              {project.members?.slice(0, 3).map((member, i) => (
                <Avatar key={i} className="h-7 w-7 border-2 border-background shadow-sm hover:translate-y-[-2px] transition-transform duration-300">
                  <AvatarImage src={member.user?.profilePicture} />
                  <AvatarFallback className="text-[9px] font-bold bg-muted text-muted-foreground">
                    {member.user?.name?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              ))}
              {project.members && project.members.length > 3 && (
                <div className="h-7 w-7 rounded-full border-2 border-background bg-muted flex items-center justify-center text-[9px] font-bold text-muted-foreground shadow-sm">
                  +{project.members.length - 3}
                </div>
              )}
            </div>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
