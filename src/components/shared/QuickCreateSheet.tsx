import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeftRight,
  BookOpen,
  Building2,
  Camera,
  GraduationCap,
  BadgeCheck,
  HeartHandshake,
  Users,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import { useAuthStore } from '@/store/authStore';

interface QuickCreateSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenStoryComposer?: () => void;
}

export const QuickCreateSheet: React.FC<QuickCreateSheetProps> = ({
  open,
  onOpenChange,
  onOpenStoryComposer,
}) => {
  const navigate = useNavigate();
  const representedClubs = useAuthStore((s) => s.representedClubs);
  const hasRepresentedClub = representedClubs.length > 0;
  const isMentor = useAuthStore((s) => s.user?.roles?.some((r) => r.toLowerCase() === 'mentor'));

  const actions = [
    {
      key: 'story',
      title: 'Đăng tin 24h (Story)',
      description: 'Chia sẻ khoảnh khắc học tập, câu lạc bộ hoặc thông báo ngắn trong ngày',
      icon: Camera,
      onClick: () => {
        onOpenChange(false);
        onOpenStoryComposer?.();
      },
    },
    {
      key: 'knowledge',
      title: 'Đặt câu hỏi / Chia sẻ bài viết',
      description: 'Đăng câu hỏi học thuật, ghi chú môn học hoặc kinh nghiệm thực tập',
      icon: BookOpen,
      onClick: () => {
        onOpenChange(false);
        navigate('/knowledge/new');
      },
    },
    {
      key: 'swap',
      title: 'Tạo yêu cầu đổi lớp',
      description: 'Đăng lớp hiện tại và ca học mong muốn để hệ thống gợi ý ghép đôi',
      icon: ArrowLeftRight,
      onClick: () => {
        onOpenChange(false);
        navigate('/swap/new');
      },
    },
    {
      key: 'group',
      title: 'Tạo nhóm học tập',
      description: 'Tìm thành viên cùng môn học, đồ án hoặc ôn thi cuối kỳ',
      icon: Users,
      onClick: () => {
        onOpenChange(false);
        navigate('/groups/new');
      },
    },
    {
      key: 'program',
      title: 'Mở kênh Tình nguyện / Workshop',
      description: 'Tổ chức chiến dịch tình nguyện hoặc buổi chia sẻ kỹ năng cho sinh viên',
      icon: HeartHandshake,
      onClick: () => {
        onOpenChange(false);
        navigate('/programs/new');
      },
    },
    // FE-05: Mentor tạo nội dung trong Mentor Center; học viên đi tìm Mentor
    isMentor
      ? {
          key: 'mentoring',
          title: 'Đăng bài / mở khóa học Mentor',
          description: 'Chia sẻ kinh nghiệm hoặc mở khóa hỗ trợ để học viên gửi yêu cầu cho bạn',
          icon: BadgeCheck,
          onClick: () => {
            onOpenChange(false);
            navigate('/mentor/posts');
          },
        }
      : {
          key: 'mentoring',
          title: 'Tìm Mentor hỗ trợ',
          description: 'Gửi yêu cầu 1-1 tới sinh viên khóa trên đã hoàn thành tốt môn học',
          icon: GraduationCap,
          onClick: () => {
            onOpenChange(false);
            navigate('/mentoring');
          },
        },
    {
      key: 'club',
      title: hasRepresentedClub ? 'Đăng cơ hội CLB mới' : 'Yêu cầu đại diện CLB',
      description: hasRepresentedClub
        ? 'Mở đăng ký sự kiện, tuyển thành viên hoặc tuyển cộng tác viên cho CLB'
        : 'Xác minh quyền đại diện để quản lý hồ sơ và đăng cơ hội cho CLB của bạn',
      icon: Building2,
      onClick: () => {
        onOpenChange(false);
        navigate(hasRepresentedClub ? '/clubs/manage/new' : '/clubs/represent');
      },
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Tạo mới trên SCS</DialogTitle>
          <DialogDescription>
            Chọn loại nội dung hoặc yêu cầu bạn muốn đăng tải lên cộng đồng
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-2 mt-2">
          {actions.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                type="button"
                onClick={item.onClick}
                className="flex items-start gap-3.5 p-3 rounded-lg border border-neutral-200 bg-surface hover:bg-neutral-100 hover:border-neutral-300 text-left transition-colors cursor-pointer group"
              >
                <div className="p-2 rounded-lg shrink-0 bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-300 group-hover:bg-brand-100 dark:group-hover:bg-brand-900/60 transition-colors">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-neutral-900 group-hover:text-brand-600 transition-colors">
                    {item.title}
                  </div>
                  <p className="text-caption text-neutral-500 mt-0.5 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};
