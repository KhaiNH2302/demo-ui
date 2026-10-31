import { Bell, BellOff, Bookmark, BookmarkCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
import { useClubPreferences } from './useClubPreferences';

export function ClubSaveButton({ opportunityId }: { opportunityId: string }) {
  const state = useClubPreferences();
  const user = useAuthStore((s) => s.user);
  const saved = state.preferences.savedOpportunityIds.includes(opportunityId);
  return (
    <Button
      type="button"
      size="sm"
      variant={saved ? 'secondary' : 'outline'}
      aria-pressed={saved}
      loading={state.busy}
      disabled={Boolean(user) && state.isPending}
      leftIcon={saved ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
      onClick={() =>
        state.isError ? state.refetch() : state.toggle('save', opportunityId)
      }
    >
      {state.isError ? 'Tải lại mục đã lưu' : saved ? 'Đã lưu' : 'Lưu cơ hội'}
    </Button>
  );
}
export function ClubFollowButton({ clubId }: { clubId: string }) {
  const state = useClubPreferences();
  const user = useAuthStore((s) => s.user);
  const followed = state.preferences.followedClubIds.includes(clubId);
  return (
    <Button
      type="button"
      size="sm"
      variant={followed ? 'secondary' : 'outline'}
      aria-pressed={followed}
      loading={state.busy}
      disabled={Boolean(user) && state.isPending}
      leftIcon={followed ? <BellOff size={15} /> : <Bell size={15} />}
      onClick={() =>
        state.isError ? state.refetch() : state.toggle('follow', clubId)
      }
    >
      {state.isError
        ? 'Tải lại theo dõi'
        : followed
          ? 'Đang theo dõi'
          : 'Theo dõi CLB'}
    </Button>
  );
}
