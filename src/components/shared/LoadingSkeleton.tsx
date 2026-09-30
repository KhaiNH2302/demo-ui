import React from 'react';
import { Skeleton } from '@/components/ui/Skeleton';
import { Card, CardContent } from '@/components/ui/Card';

export interface LoadingSkeletonProps {
  variant?:
    | 'card'
    | 'card-grid'
    | 'list'
    | 'row-list'
    | 'thread-list'
    | 'table'
    | 'table-rows'
    | 'detail'
    | 'detail-page'
    | 'form';
  count?: number;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  variant = 'card',
  count = 3,
}) => {
  if (variant === 'card' || variant === 'card-grid') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: count }).map((_, i) => (
          <Card key={i} className="p-5 space-y-3">
            <Skeleton className="h-32 w-full rounded-md" />
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <div className="pt-2 border-t border-neutral-100 flex justify-between items-center">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-20 rounded-md" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (variant === 'list' || variant === 'row-list' || variant === 'thread-list') {
    return (
      <div className="space-y-3">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-4 rounded-lg border border-neutral-200 bg-white">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-8 w-16 rounded-md" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'table' || variant === 'table-rows') {
    return (
      <div className="space-y-2 rounded-lg border border-neutral-200 bg-white p-4">
        <Skeleton className="h-8 w-full" />
        {Array.from({ length: count || 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (variant === 'detail' || variant === 'detail-page') {
    return (
      <div className="space-y-6">
        <Card className="p-6 space-y-4">
          <Skeleton className="h-8 w-2/3" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-5 w-24 rounded-full" />
          </div>
          <Skeleton className="h-32 w-full" />
        </Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-6 h-40">
            <Skeleton className="h-full w-full" />
          </Card>
          <Card className="p-6 h-40">
            <Skeleton className="h-full w-full" />
          </Card>
        </div>
      </div>
    );
  }

  if (variant === 'form') {
    return (
      <Card>
        <CardContent className="space-y-4 p-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-10 w-full rounded-sm" />
            </div>
          ))}
          <div className="flex justify-end gap-3 pt-4">
            <Skeleton className="h-10 w-20 rounded-md" />
            <Skeleton className="h-10 w-24 rounded-md" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
};
