import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'

interface Props {
  count?: number
}

export function LoadingSkeleton({ count = 4 }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="flex flex-col h-full">
          <CardHeader className="p-4 space-y-2">
            <div className="flex justify-between items-start gap-2">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-5 w-16" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0 flex-1">
            <div className="space-y-2 mt-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          </CardContent>
          <CardFooter className="p-4 flex items-center justify-between gap-2 border-t bg-muted/20">
            <Skeleton className="h-8 w-24" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-8" />
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
