import React from 'react';
import type { UseQueryResult } from '@tanstack/react-query';
import { LoadingSkeleton } from './LoadingSkeleton';
import { ErrorState } from './ErrorState';
import type { ApiError } from '@/lib/apiClient';

export interface QueryBoundaryProps<T = any> {
  query?: UseQueryResult<T, ApiError | Error>;
  queries?: UseQueryResult<any, any>[];
  loading?: React.ReactNode;
  error?: (err: ApiError, retry: () => void) => React.ReactNode;
  isEmpty?: (data: T) => boolean;
  empty?: React.ReactNode;
  children: React.ReactNode | ((data: T) => React.ReactNode);
}

export function QueryBoundary<T = any>({
  query,
  queries,
  loading = <LoadingSkeleton variant="card" count={3} />,
  error,
  isEmpty,
  empty,
  children,
}: QueryBoundaryProps<T>) {
  const activeQueries = queries || (query ? [query] : []);

  const isLoading = activeQueries.some((q) => q.isLoading || q.isPending);
  if (isLoading) {
    return <>{loading}</>;
  }

  const errorQuery = activeQueries.find((q) => q.isError);
  if (errorQuery) {
    const err = errorQuery.error as ApiError;
    if (error) {
      return <>{error(err, () => errorQuery.refetch())}</>;
    }
    return <ErrorState message={err?.message || 'Đã có lỗi xảy ra'} onRetry={() => errorQuery.refetch()} />;
  }

  const primaryData = query?.data ?? activeQueries[0]?.data;

  if (isEmpty && primaryData !== undefined && isEmpty(primaryData)) {
    return <>{empty}</>;
  }

  if (typeof children === 'function') {
    return <>{(children as (data: T) => React.ReactNode)(primaryData)}</>;
  }

  return <>{children}</>;
}
