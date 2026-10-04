import { create } from 'zustand';

/**
 * Giới hạn lướt của khách: đếm số trang chi tiết KHÁC NHAU đã mở trong phiên.
 * - soft: nhắc đăng nhập một lần (có nút "Để sau").
 * - hard: trang chi tiết mới bị làm mờ, phải đăng nhập để xem tiếp.
 * Trang đã xem rồi luôn mở lại được; trang đầu tiên của phiên (link chia sẻ) luôn xem được.
 */
export const GUEST_BUDGET_DEFAULTS = { soft: 5, hard: 10 };

const STORAGE_KEY = 'scs_guest_budget';
const LIMITS_KEY = 'scs_guest_budget_limits';

interface PersistedBudget {
  viewed: string[];
  softShown: boolean;
}

function loadBudget(): PersistedBudget {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as PersistedBudget;
  } catch {
    // ignore
  }
  return { viewed: [], softShown: false };
}

function loadLimits(): typeof GUEST_BUDGET_DEFAULTS {
  try {
    const raw = localStorage.getItem(LIMITS_KEY);
    if (raw) return { ...GUEST_BUDGET_DEFAULTS, ...JSON.parse(raw) };
  } catch {
    // ignore
  }
  return GUEST_BUDGET_DEFAULTS;
}

function persist(state: PersistedBudget) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

export type GuestViewResult = 'allowed' | 'soft' | 'blocked';

interface GuestBudgetState extends PersistedBudget {
  limits: typeof GUEST_BUDGET_DEFAULTS;
  /** Ghi nhận lượt xem; trả về trạng thái cho trang `key`. */
  recordView: (key: string) => GuestViewResult;
  /** Kiểm tra không ghi nhận (dùng khi render). */
  check: (key: string) => 'allowed' | 'blocked';
  markSoftShown: () => void;
  setLimits: (limits: Partial<typeof GUEST_BUDGET_DEFAULTS>) => void;
  reset: () => void;
}

export const useGuestBudgetStore = create<GuestBudgetState>((set, get) => ({
  ...loadBudget(),
  limits: loadLimits(),

  check: (key) => {
    const { viewed, limits } = get();
    if (viewed.includes(key) || viewed.length < limits.hard) return 'allowed';
    return 'blocked';
  },

  recordView: (key) => {
    const { viewed, softShown, limits } = get();
    if (viewed.includes(key)) return 'allowed';
    if (viewed.length >= limits.hard) return 'blocked';

    const next = { viewed: [...viewed, key], softShown };
    persist(next);
    set(next);
    return !softShown && next.viewed.length >= limits.soft ? 'soft' : 'allowed';
  },

  markSoftShown: () => {
    const next = { viewed: get().viewed, softShown: true };
    persist(next);
    set(next);
  },

  setLimits: (partial) => {
    const limits = { ...get().limits, ...partial };
    try {
      localStorage.setItem(LIMITS_KEY, JSON.stringify(limits));
    } catch {
      // ignore
    }
    set({ limits });
  },

  reset: () => {
    const next = { viewed: [], softShown: false };
    persist(next);
    set(next);
  },
}));
