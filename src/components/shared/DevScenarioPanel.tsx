import React, { useState } from 'react';
import { Sliders, X, Check } from 'lucide-react';
import { Switch } from '@/components/ui/Switch';
import { Button } from '@/components/ui/Button';
import { isScenarioActive, setScenarioActive } from '@/mocks/utils';
import { useAuthStore } from '@/store/authStore';
import { seedUsers } from '@/mocks/data/users';
import { seedClubMemberships } from '@/mocks/data/clubs';

const scenarios = [
  { key: 'ai_timeout', label: 'AI Timeout / Lỗi (S4, G1, M2)' },
  { key: 'swap_version_conflict', label: 'Swap Version Conflict (S3, S7)' },
  { key: 'swap_competing_connection', label: 'Swap Cạnh Tranh (S7)' },
  { key: 'recruitment_closed', label: 'Đợt tuyển hết hạn (CL3)' },
  { key: 'recruitment_quota_full', label: 'Đợt tuyển hết chỉ tiêu (CL3)' },
  { key: 'forbidden', label: 'Không đủ quyền (W7, A2, A7)' },
  { key: 'last_system_admin', label: 'Chặn xóa Admin cuối (A7)' },
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
    <div className="fixed bottom-4 left-4 z-[99]">
      {!isOpen ? (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setIsOpen(true)}
          className="shadow-lg border border-neutral-300 bg-white/95 backdrop-blur text-xs gap-1.5"
          leftIcon={<Sliders size={14} className="text-brand-600" />}
        >
          Dev Scenarios
        </Button>
      ) : (
        <div className="w-80 rounded-xl border border-neutral-200 bg-white/98 backdrop-blur shadow-2xl p-4 animate-in slide-in-from-bottom-5">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-2 mb-3">
            <h4 className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
              <Sliders size={14} className="text-brand-600" /> Dev Scenarios & Seed Accounts
            </h4>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-neutral-400 hover:text-neutral-700 p-0.5"
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
                          ? 'border-brand-500 bg-brand-50 text-brand-800 font-semibold'
                          : 'border-neutral-200 hover:bg-neutral-50 text-neutral-700'
                      }`}
                    >
                      <span className="truncate">{u.fullName.split(' ').slice(-1)[0]} ({u.roles[0]})</span>
                      {isCurrent && <Check size={12} className="text-brand-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-neutral-100 pt-2.5">
              <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block mb-2">
                Kịch bản giả lập lỗi/edge case:
              </span>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {scenarios.map((s) => (
                  <div key={s.key} className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-neutral-700 truncate">{s.label}</span>
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
