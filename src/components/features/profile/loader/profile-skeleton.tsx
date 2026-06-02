import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export function ProfileSkeleton() {
  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-4xl">
      <div className="space-y-6">
        {/* Profile Header Skeleton */}
        <div className="flex flex-col sm:flex-row items-center gap-6 p-6">
          <Skeleton className="h-20 w-20 rounded-full" />
          <div className="flex-1 space-y-3 w-full text-center sm:text-left">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-2">
                <Skeleton className="h-8 w-[200px] mx-auto sm:mx-0" />
                <Skeleton className="h-4 w-[150px] mx-auto sm:mx-0" />
              </div>
              <Skeleton className="h-9 w-[120px] mx-auto sm:mx-0" />
            </div>
          </div>
        </div>

        {/* Profile Details Skeleton */}
        <div className="grid gap-6">
          <Card className="border-border/50">
            <CardHeader>
              <Skeleton className="h-6 w-[150px]" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-border/50 last:border-0">
                  <Skeleton className="h-4 w-[100px]" />
                  <Skeleton className="h-4 w-[200px]" />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader>
              <Skeleton className="h-6 w-[150px]" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-[120px]" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
