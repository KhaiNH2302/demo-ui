import React, { useState } from 'react';
import { Sliders, X, Check } from 'lucide-react';
import { Switch } from '@/components/ui/Switch';
import { Button } from '@/components/ui/Button';
import { isScenarioActive, setScenarioActive } from '@/mocks/utils';
import { useAuthStore } from '@/store/authStore';
import { seedUsers } from '@/mocks/data/users';
import { seedClubMemberships } from '@/mocks/data/clubs';
import { useGuestBudgetStore } from '@/lib/guestBudget';

const scenarios = [
  { key: 'ai_timeout', label: 'AI Timeout / Lỗi (S4, G1, M2)' },
  { key: 'swap_version_conflict', label: 'Swap Version Conflict (S3, S7)' },
  { key: 'swap_competing_connection', label: 'Swap Cạnh Tranh (S7)' },
  { key: 'recruitment_closed', label: 'Đợt tuyển hết hạn (CL3)' },
  { key: 'recruitment_quota_full', label: 'Đợt tuyển hết chỉ tiêu (CL3)' },
  { key: 'forbidden', label: 'Không đủ quyền (W7, A2, A7)' },
  { key: 'admin_protected', label: 'Bảo vệ Admin duy nhất (A7)' },
  { key: 'post_auto_flagged', label: 'Bài viết auto-flag (K2)' },
];

export const DevScenarioPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeScenarios, setActiveScenarios] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    scenarios.forEach((s) => {
      map[s.key] = isScenarioActive(s.key);
    });
    return map;
  });

  const currentUser = useAuthStore((state) => state.user);
  const login = useAuthStore((state) => state.login);
  const logout = useAuthStore((state) => state.logout);
  const guestViewed = useGuestBudgetStore((s) => s.viewed.length);
  const guestLimits = useGuestBudgetStore((s) => s.limits);
  const setGuestLimits = useGuestBudgetStore((s) => s.setLimits);
  const resetGuestBudget = useGuestBudgetStore((s) => s.reset);

  if (!import.meta.env.DEV) return null;

  const toggleScenario = (key: string, val: boolean) => {
    setScenarioActive(key, val);
    setActiveScenarios((prev) => ({ ...prev, [key]: val }));
  };

  const switchAccount = (user: (typeof seedUsers)[0]) => {
    const { password: _, ...safeUser } = user;
    const userMemberships = seedClubMemberships.filter((m) => m.userId === user.id);
    login(safeUser, `mock_jwt_token_${user.id}`, userMemberships);
  };

  return (
    <div className="fixed bottom-4 right-4 z-[99]">
      {!isOpen ? (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setIsOpen(true)}
          className="shadow-lg border border-neutral-200 dark:border-neutral-700 bg-surface/95 backdrop-blur text-xs gap-1.5 text-neutral-800 dark:text-neutral-200"
          leftIcon={<Sliders size={14} className="text-brand-600" />}
        >
          Dev Scenarios
        </Button>
      ) : (
        <div className="w-80 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-surface/98 backdrop-blur shadow-2xl p-4 animate-in slide-in-from-bottom-5">
          <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-700 pb-2 mb-3">
            <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
              <Sliders size={14} className="text-brand-600" /> Dev Scenarios & Seed Accounts
            </h4>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 p-0.5"
            >
              <X size={14} />
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block mb-1.5">
                Chuyển nhanh tài khoản:
              </span>
              <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1">
                {seedUsers.map((u) => {
                  const isCurrent = currentUser?.id === u.id;
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => switchAccount(u)}
                      className={`text-left p-1.5 rounded-md border text-[11px] transition-colors flex items-center justify-between ${
                        isCurrent
                          ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10 text-brand-800 dark:text-brand-300 font-semibold'
                          : 'border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                      }`}
                    >
                      <span className="truncate">{u.fullName.split(' ').slice(-1)[0]} ({u.roles[0]})</span>
                      {isCurrent && <Check size={12} className="text-brand-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-neutral-100 dark:border-neutral-700 pt-2.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                  Chế độ Khách
                </span>
                <button
                  type="button"
                  onClick={() => logout()}
                  disabled={!currentUser}
                  className="text-[11px] font-semibold text-brand-600 hover:underline disabled:text-neutral-400 disabled:no-underline"
                >
                  {currentUser ? 'Xem như Khách' : 'Đang là Khách'}
                </button>
              </div>
              <div className="flex items-center justify-between gap-2 text-[11px] text-neutral-700 dark:text-neutral-300">
                <span>
                  Đã lướt {guestViewed}/{guestLimits.hard} trang chi tiết
                </span>
                <button
                  type="button"
                  onClick={resetGuestBudget}
                  className="font-semibold text-brand-600 hover:underline"
                >
                  Reset
                </button>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-neutral-700 dark:text-neutral-300">
                {(['soft', 'hard'] as const).map((k) => (
                  <label key={k} className="flex items-center gap-1.5">
                    {k === 'soft' ? 'Nhắc ở' : 'Chặn sau'}
                    <input
                      type="number"
                      min={1}
                      value={guestLimits[k]}
                      onChange={(e) => setGuestLimits({ [k]: Math.max(1, Number(e.target.value) || 1) })}
                      className="w-12 h-6 px-1.5 rounded border border-neutral-200 dark:border-neutral-700 bg-surface"
                    />
                  </label>
                ))}
              </div>
            </div>

            <div className="border-t border-neutral-100 dark:border-neutral-700 pt-2.5">
              <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block mb-2">
                Kịch bản giả lập lỗi/edge case:
              </span>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {scenarios.map((s) => (
                  <div key={s.key} className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-neutral-700 dark:text-neutral-300 truncate">{s.label}</span>
                    <Switch
                      checked={!!activeScenarios[s.key]}
                      onCheckedChange={(checked) => toggleScenario(s.key, checked)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
