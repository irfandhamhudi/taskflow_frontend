import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export function CalendarSkeleton() {
  return (
    <div className="flex-1 flex flex-col p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Calendar Header Skeleton */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-[150px] sm:w-[200px]" />
            <Skeleton className="h-4 w-[100px] sm:w-[150px]" />
          </div>
        </div>
        <div className="flex items-center gap-2 bg-background p-1.5 rounded-lg border shadow-sm">
           <Skeleton className="h-8 w-[120px] sm:w-[180px]" />
           <Skeleton className="h-8 w-[100px] sm:w-[140px]" />
        </div>
      </div>

      {/* Calendar Grid Skeleton */}
      <Card className="border-border/50 flex-1 overflow-hidden flex flex-col shadow-sm">
        <CardHeader className="border-b border-border/50 bg-muted/40 p-0">
          <div className="grid grid-cols-7 divide-x divide-border/40 hidden sm:grid">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
              <div key={day} className="py-3 text-center">
                <Skeleton className="h-3 w-8 mx-auto" />
              </div>
            ))}
          </div>
        </CardHeader>
        <CardContent className="p-0 flex-1 overflow-hidden">
          <div className="grid grid-cols-1 sm:grid-cols-7 h-full sm:divide-x divide-y divide-border/40">
            {/* Show 5 cells on mobile (as a list), 35 cells on desktop (as a grid) */}
            {[...Array(35)].map((_, i) => (
              <div key={i} className={cn(
                "p-3 sm:p-2 min-h-[120px] space-y-3",
                i >= 5 && "hidden sm:block"
              )}>
                <div className="flex justify-between items-center mb-1">
                  <Skeleton className="h-7 w-7 rounded-full" />
                  <Skeleton className="h-3 w-12 sm:hidden" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-16 w-full rounded-md shadow-sm" />
                  <Skeleton className="h-16 w-full rounded-md shadow-sm hidden sm:block" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
