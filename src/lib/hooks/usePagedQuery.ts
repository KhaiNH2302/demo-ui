import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface PagedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export function usePagedQuery<T>(
  queryKey: unknown[],
  endpoint: string,
  params?: Record<string, unknown>,
  options?: Omit<UseQueryOptions<PagedResponse<T>>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<PagedResponse<T>>({
    queryKey: [...queryKey, params],
    queryFn: async () => {
      const res = await api.get(endpoint, { params });
      const data = res.data?.data ?? res.data;
      if (Array.isArray(data)) {
        return {
          items: data,
          total: data.length,
          page: Number(params?.page || 1),
          pageSize: Number(params?.pageSize || 20),
        };
      }
      return {
        items: data?.items ?? [],
        total: data?.total ?? (data?.items?.length || 0),
        page: data?.page ?? Number(params?.page || 1),
        pageSize: data?.pageSize ?? Number(params?.pageSize || 20),
      };
    },
    ...options,
  });
}
