import { Card, CardContent, CardHeader, CardFooter } from '../../../components/ui/card';
import { Skeleton } from '../../../components/ui/skeleton';

export function ProjectSkeleton() {
  return (
    <Card className="h-full flex flex-col border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
      <CardHeader className="pb-4 px-6 pt-6">
        <div className="flex gap-3 items-start">
          <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
          <div className="flex flex-col gap-2 flex-1">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 pb-6 space-y-5">
        <div className="space-y-2">
          <div className="flex justify-between items-end">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-8" />
          </div>
          <Skeleton className="h-1.5 w-full rounded-full" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      </CardContent>

      <CardFooter className="py-4 px-6 border-t border-border/40 bg-muted/10 backdrop-blur-md">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <Skeleton className="h-7 w-7 rounded-full" />
            <div className="flex flex-col gap-1">
              <Skeleton className="h-2 w-10" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
          <div className="flex -space-x-2">
            <Skeleton className="h-7 w-7 rounded-full border-2 border-background" />
            <Skeleton className="h-7 w-7 rounded-full border-2 border-background" />
            <Skeleton className="h-7 w-7 rounded-full border-2 border-background" />
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}

export function ProjectListSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <ProjectSkeleton key={i} />
      ))}
    </div>
  );
}
