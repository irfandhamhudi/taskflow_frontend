import { Card, CardContent } from '../../../components/ui/card';
import { Skeleton } from '../../../components/ui/skeleton';

export function TrashItemSkeleton() {
  return (
    <Card className="overflow-hidden border-l-4 border-l-muted">
      <CardContent className="p-5">
        <div className="flex justify-between items-start">
          <div className="flex gap-4 w-full">
            <Skeleton className="w-12 h-12 rounded-xl shrink-0" />
            <div className="flex flex-col gap-2 w-full">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-6 w-3/4" />
              <div className="flex flex-col gap-1">
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
          </div>
          <Skeleton className="h-8 w-8 rounded-full shrink-0" />
        </div>
      </CardContent>
    </Card>
  );
}

export function TrashSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <TrashItemSkeleton key={i} />
      ))}
    </div>
  );
}
