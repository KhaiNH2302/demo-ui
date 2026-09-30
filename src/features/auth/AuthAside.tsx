import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BookOpen,
  UsersRound,
  CalendarDays,
  GraduationCap,
} from 'lucide-react';
import { UpcomingList, type UpcomingItem } from '@/components/shared/UpcomingList';
import { api } from '@/lib/api';

export interface AuthAsideProps {
  variant?: 'login' | 'register';
}

const VALUE_ROWS = [
  {
    icon: BookOpen,
    text: 'Hỏi đáp môn học, tài liệu và kinh nghiệm thi',
  },
  {
    icon: UsersRound,
    text: 'Tìm thành viên nhóm đồ án cùng kỹ năng & lịch rảnh',
  },
  {
    icon: CalendarDays,
    text: 'Đăng ký CLB, tình nguyện và workshop trong trường',
  },
  {
    icon: GraduationCap,
    text: 'Kết nối Mentor và đối tác đổi lớp học phần',
  },
];

export const AuthAside: React.FC<AuthAsideProps> = ({ variant = 'login' }) => {
  const { data: upcomingItems } = useQuery<UpcomingItem[]>({
    queryKey: ['public', 'upcoming', 2],
    queryFn: async () => {
      const res = await api.get('/public/upcoming', { params: { limit: 2 } });
      const raw = res.data?.data ?? res.data;
      return Array.isArray(raw) ? raw : raw?.items ?? [];
    },
  });

  return (
    <div className="hidden lg:flex lg:col-span-5 bg-neutral-50 p-8 flex-col justify-between border-l border-neutral-200 space-y-8">
      <div className="space-y-6">
        <h2 className="text-lg font-semibold text-neutral-900 leading-snug">
          Tìm đúng người trong trường để học và tham gia hoạt động
        </h2>

        <ul className="space-y-3">
          {VALUE_ROWS.map((row) => {
            const Icon = row.icon;
            return (
              <li key={row.text} className="flex items-start gap-2.5 text-sm text-neutral-700">
                <Icon className="h-4 w-4 text-neutral-500 shrink-0 mt-0.5" />
                <span>{row.text}</span>
              </li>
            );
          })}
        </ul>

        {variant === 'register' && (
          <div className="pt-4 border-t border-neutral-200 space-y-2.5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Sau khi đăng ký
            </h3>
            <ol className="space-y-2 text-xs text-neutral-700">
              <li>
                <strong className="font-semibold text-neutral-900">1.</strong> Xác nhận email (bỏ qua nếu dùng Google)
              </li>
              <li>
                <strong className="font-semibold text-neutral-900">2.</strong> Điền kỹ năng, môn học, lịch rảnh và chọn ai được xem hồ sơ
              </li>
              <li>
                <strong className="font-semibold text-neutral-900">3.</strong> Nhận gợi ý nhóm, Mentor, đối tác đổi lớp
              </li>
            </ol>
          </div>
        )}
      </div>

      <div className="pt-2">
        <UpcomingList
          title="Đang diễn ra trong trường"
          items={upcomingItems || []}
          maxItems={2}
        />
      </div>
    </div>
  );
};
