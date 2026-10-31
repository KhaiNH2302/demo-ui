import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { useAuthStore } from '@/store/authStore';
import { useGuardedAction } from '@/lib/guestGate';
import { toast } from '@/components/ui/Toast';

export interface ClubPreferences {
  savedOpportunityIds: string[];
  followedClubIds: string[];
}
export function useClubPreferences() {
  const userId = useAuthStore((s) => s.user?.id);
  const client = useQueryClient();
  const guard = useGuardedAction();
  const key = ['clubs', 'preferences', userId];
  const query = useQuery<ClubPreferences>({
    queryKey: key,
    queryFn: () => apiClient.get('/clubs/preferences'),
    enabled: Boolean(userId),
  });
  const mutation = useMutation({
    mutationFn: (body: {
      kind: 'save' | 'follow';
      id: string;
      active: boolean;
    }) => apiClient.put<ClubPreferences>('/clubs/preferences', body),
    onSuccess: (data, body) => {
      client.setQueryData(key, data);
      toast.success(
        body.kind === 'save'
          ? body.active
            ? 'Đã lưu cơ hội'
            : 'Đã bỏ lưu cơ hội'
          : body.active
            ? 'Đã theo dõi CLB'
            : 'Đã bỏ theo dõi CLB'
      );
    },
    onError: (error: Error) => toast.error(error.message),
  });
  return {
    ...query,
    preferences: query.data || { savedOpportunityIds: [], followedClubIds: [] },
    busy: mutation.isPending,
    toggle: (kind: 'save' | 'follow', id: string) =>
      guard('follow', () => {
        if (query.isPending || query.isError || mutation.isPending) return;
        const current =
          kind === 'save'
            ? query.data?.savedOpportunityIds
            : query.data?.followedClubIds;
        mutation.mutate({ kind, id, active: !current?.includes(id) });
      })(),
  };
}
