import { create } from 'zustand';
import { useAuthStore } from '@/stores/authStore';

export type ViewerCapability =
  | 'knowledge.read'
  | 'knowledge.browse'
  | 'knowledge.interact'
  | 'program.read'
  | 'club.read'
  | 'profile.open'
  | 'search'
  | 'compose';

const GUEST_CAPS: Record<ViewerCapability, boolean> = {
  'knowledge.read': true,
  'knowledge.browse': false,
  'knowledge.interact': false,
  'program.read': true,
  'club.read': true,
  'profile.open': false,
  'search': false,
  'compose': false,
};

export function useViewer() {
  const user = useAuthStore((s) => s.user);
  const isGuest = !user;

  return {
    isGuest,
    user,
    can(cap: ViewerCapability): boolean {
      return isGuest ? GUEST_CAPS[cap] : true;
    },
  };
}

export interface PendingGuestAction {
  actionLabel: string;
  redirectTo: string;
  targetId?: string;
  timestamp: number;
}

const STORAGE_KEY = 'scs_pending_guest_action';
const PREVIEW_POSTS_KEY = 'scs_guest_previewed_posts';

export function recordGuestPreviewPost(postId: string): {
  allowed: boolean;
  viewedCount: number;
  limit: number;
} {
  const limit = 3;
  try {
    const raw = sessionStorage.getItem(PREVIEW_POSTS_KEY);
    const list: string[] = raw ? JSON.parse(raw) : [];
    if (list.includes(postId)) {
      return { allowed: true, viewedCount: list.length, limit };
    }
    if (list.length >= limit) {
      return { allowed: false, viewedCount: list.length, limit };
    }
    list.push(postId);
    sessionStorage.setItem(PREVIEW_POSTS_KEY, JSON.stringify(list));
    return { allowed: true, viewedCount: list.length, limit };
  } catch {
    return { allowed: true, viewedCount: 1, limit };
  }
}

interface LoginGateState {
  open: boolean;
  actionLabel: string;
  redirectTo: string;
  openGate: (actionLabel: string, redirectTo?: string) => void;
  closeGate: () => void;
}

export const useLoginGateStore = create<LoginGateState>((set) => ({
  open: false,
  actionLabel: '',
  redirectTo: '/',
  openGate: (actionLabel, redirectTo) => {
    const target =
      redirectTo ||
      (typeof window !== 'undefined'
        ? window.location.pathname + window.location.search
        : '/');
    savePendingGuestAction({
      actionLabel,
      redirectTo: target,
      timestamp: Date.now(),
    });
    set({ open: true, actionLabel, redirectTo: target });
  },
  closeGate: () => set({ open: false }),
}));

export function savePendingGuestAction(action: PendingGuestAction) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(action));
  } catch {
    // ignore storage errors
  }
}

export function getPendingGuestAction(): PendingGuestAction | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingGuestAction;
    if (Date.now() - parsed.timestamp > 30 * 60 * 1000) {
      sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function consumePendingGuestAction(): PendingGuestAction | null {
  try {
    const action = getPendingGuestAction();
    sessionStorage.removeItem(STORAGE_KEY);
    return action;
  } catch {
    return null;
  }
}

export interface GuardOptions {
  redirectTo?: string;
  targetId?: string;
}

export function useGuardedAction() {
  const user = useAuthStore((s) => s.user);
  const openGate = useLoginGateStore((s) => s.openGate);

  return function guard<TArgs extends any[]>(
    actionLabel: string,
    callback: (...args: TArgs) => void,
    optionsOrRedirect?: string | GuardOptions
  ): (...args: TArgs) => void {
    const redirectTo =
      typeof optionsOrRedirect === 'string'
        ? optionsOrRedirect
        : optionsOrRedirect?.redirectTo;

    return (...args: TArgs) => {
      if (!user) {
        openGate(actionLabel, redirectTo);
        return;
      }
      callback(...args);
    };
  };
}
