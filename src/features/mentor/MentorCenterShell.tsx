import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { cn } from '@/lib/cn';
import { Switch } from '@/components/ui/Switch';
import { toast } from '@/components/ui/Toast';
import type { Mentor, MentoringRequest } from '@/types/entities';
import { getSetupIssues } from './mentorSetup';

/**
 * [MC0] Khung Mentor Center — luồng FE-05 phía Mentor.
 * Trang đầu tiên là Yêu cầu nhận được; Mentoring Feed dùng chung với Student.
 */
export const MentorCenterShell: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const { data: requests } = useQuery({
    queryKey: ['mentor', 'requests'],
    queryFn: async () => {
      try {
        return await apiClient.get<MentoringRequest[]>('/mentor/requests');
      } catch {
        return [];
      }
    },
  });

  const profileQuery = useQuery({
    queryKey: ['mentor', 'profile'],
    queryFn: () => apiClient.get<Mentor | null>('/mentor/profile'),
  });
  const profile = profileQuery.data;

  // Bật/tắt nhận học viên ngay trên header, không phải vào form hồ sơ
  const toggleAccepting = useMutation({
    mutationFn: (acceptingRequests: boolean) => apiClient.put<Mentor>('/mentor/profile', { ...profile, acceptingRequests }),
    onSuccess: (_data, accepting) => {
      toast.success(accepting ? 'Đã mở nhận học viên' : 'Đã tạm ngưng nhận học viên');
      queryClient.invalidateQueries({ queryKey: ['mentor', 'profile'] });
      queryClient.invalidateQueries({ queryKey: ['mentoring', 'mentors'] });
    },
    onError: () => toast.error('Chưa đổi được trạng thái, thử lại sau ít phút.'),
  });

  const pendingCount = (Array.isArray(requests) ? requests : []).filter((r) => r.status === 'PENDING_MENTOR_RESPONSE').length;
  const setupIssues = getSetupIssues(profile);
  const accepting = Boolean(profile?.acceptingRequests);

  const path = location.pathname;
  const currentTab = ['posts', 'profile', 'classes'].find((tab) => path.startsWith(`/mentor/${tab}`)) ?? 'requests';

  const tabs = [
    { value: 'requests', label: 'Yêu cầu', badge: pendingCount },
    { value: 'classes', label: 'Lớp học' },
    { value: 'profile', label: 'Hồ sơ & học phí', badge: setupIssues.length ? '!' : undefined },
    { value: 'posts', label: 'Bảng tin Mentoring' },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Mentor Center</h1>
          <p className="text-sm text-neutral-500">
            {pendingCount > 0 ? `${pendingCount} yêu cầu đang chờ bạn trả lời.` : 'Không có yêu cầu nào đang chờ.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label
            className={cn(
              'flex items-center gap-3 rounded-xl border px-3.5 py-2 text-sm',
              accepting
                ? 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200'
                : 'border-neutral-200 bg-neutral-50 text-neutral-700 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'
            )}
          >
            <span className="font-medium">{accepting ? 'Đang nhận học viên' : 'Tạm ngưng nhận'}</span>
            <Switch
              checked={accepting}
              disabled={!profile || toggleAccepting.isPending}
              onCheckedChange={(checked) => toggleAccepting.mutate(checked)}
              aria-label="Nhận học viên mới"
            />
          </label>
        </div>
      </header>

      {/* Chỉ hiện khi hồ sơ còn thiếu thứ khiến học viên không đặt được */}
      {setupIssues.length > 0 && (
        <div className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm sm:flex-row sm:items-center sm:justify-between dark:border-amber-500/30 dark:bg-amber-500/10">
          <div className="flex gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <p className="font-semibold text-amber-900 dark:text-amber-200">
                Còn {setupIssues.length} việc để học viên đặt được bạn
              </p>
              <p className="text-amber-800 dark:text-amber-300">{setupIssues.map((issue) => issue.label).join(' · ')}</p>
            </div>
          </div>
          {currentTab !== 'profile' && (
            <button
              type="button"
              onClick={() => navigate(`/mentor/profile#${setupIssues[0].section}`)}
              className="shrink-0 rounded-lg bg-amber-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-amber-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60"
            >
              Hoàn thiện hồ sơ
            </button>
          )}
        </div>
      )}

      <nav className="border-b border-neutral-200 dark:border-neutral-800" aria-label="Mentor Center">
        <ul className="-mb-px flex gap-1 overflow-x-auto scrollbar-none">
          {tabs.map((tab) => {
            const active = tab.value === currentTab;
            return (
              <li key={tab.value}>
                <button
                  type="button"
                  onClick={() => navigate(`/mentor/${tab.value}`)}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
                    active
                      ? 'border-brand-600 text-brand-700 dark:text-brand-300'
                      : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100'
                  )}
                >
                  {tab.label}
                  {tab.badge ? (
                    <span
                      className={cn(
                        'min-w-5 rounded-full px-1.5 text-center text-xs font-bold leading-5',
                        tab.badge === '!' ? 'bg-amber-500 text-white' : 'bg-rose-600 text-white'
                      )}
                    >
                      {tab.badge}
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <Outlet />
    </div>
  );
};

export default MentorCenterShell;
