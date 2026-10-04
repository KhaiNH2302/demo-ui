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

// Khách xem được mọi nội dung như thành viên; chỉ thao tác ghi bị chặn bởi LoginGate.
const GUEST_CAPS: Record<ViewerCapability, boolean> = {
  'knowledge.read': true,
  'knowledge.browse': true,
  'knowledge.interact': false,
  'program.read': true,
  'club.read': true,
  'profile.open': true,
  'search': true,
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

export interface LoginGateOptions {
  /** Ghi đè tiêu đề mặc định "Đăng nhập để {actionLabel}". */
  title?: string;
  description?: string;
  /** Hiện nút bỏ qua (vd: "Để sau") — dùng cho nhắc nhở mềm. */
  dismissLabel?: string;
}

interface LoginGateState {
  open: boolean;
  actionLabel: string;
  redirectTo: string;
  options: LoginGateOptions;
  openGate: (actionLabel: string, redirectTo?: string, options?: LoginGateOptions) => void;
  closeGate: () => void;
}

export const useLoginGateStore = create<LoginGateState>((set) => ({
  open: false,
  actionLabel: '',
  redirectTo: '/',
  options: {},
  openGate: (actionLabel, redirectTo, options = {}) => {
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
    set({ open: true, actionLabel, redirectTo: target, options });
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

// Một số nơi truyền mã hành động thay cho nhãn hiển thị.
const ACTION_LABELS: Record<string, string> = {
  auth: 'tiếp tục thao tác này',
  like_post: 'thích bài viết',
  bookmark_post: 'lưu bài viết',
  comment: 'bình luận',
  report: 'báo cáo nội dung',
};

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
        openGate(ACTION_LABELS[actionLabel] ?? actionLabel, redirectTo);
        return;
      }
      callback(...args);
    };
  };
}
