import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/Dialog';
import {
  SquarePen,
  MessageCirclePlus,
  Repeat2,
  UsersRound,
  GraduationCap,
  Building2,
  ArrowRight,
} from 'lucide-react';

export interface QuickCreateSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const QuickCreateSheet: React.FC<QuickCreateSheetProps> = ({ open, onOpenChange }) => {
  const navigate = useNavigate();

  const options = [
    {
      title: 'Đăng thread',
      description: 'Chia sẻ kinh nghiệm học tập, tài liệu hoặc đặt câu hỏi',
      icon: SquarePen,
      action: () => navigate('/'),
    },
    {
      title: 'Tin nhắn mới',
      description: 'Gửi lời mời trò chuyện trực tiếp hoặc trao đổi',
      icon: MessageCirclePlus,
      action: () => navigate('/chats'),
    },
    {
      title: 'Đăng đổi lớp',
      description: 'Tìm đối tác hoán đổi lớp học phần trong kỳ',
      icon: Repeat2,
      action: () => navigate('/swap/new'),
    },
    {
      title: 'Tạo nhóm học tập',
      description: 'Lập nhóm làm đồ án SWP391, Capstone hoặc ôn thi',
      icon: UsersRound,
      action: () => navigate('/groups/new'),
    },
    {
      title: 'Tìm Mentor bằng AI',
      description: 'Phân tích môn học và tự động ghép đôi người hướng dẫn',
      icon: GraduationCap,
      action: () => navigate('/mentoring/ai'),
    },
    {
      title: 'Đăng ký CLB mới',
      description: 'Nộp hồ sơ thành lập tổ chức hoặc CLB sinh viên mới',
      icon: Building2,
      action: () => navigate('/clubs/register'),
    },
  ];

  const handleSelect = (action: () => void) => {
    onOpenChange(false);
    action();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-6">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-xl font-bold text-neutral-900">Tạo nội dung mới</DialogTitle>
          <DialogDescription className="text-xs text-neutral-500">
            Chọn loại hoạt động bạn muốn khởi tạo trên hệ thống SCS
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-2 py-2">
          {options.map((opt, idx) => {
            const Icon = opt.icon;
            return (
              <div
                key={idx}
                onClick={() => handleSelect(opt.action)}
                className="group flex items-center justify-between p-3.5 rounded-xl border border-neutral-200/80 bg-white hover:border-brand-500 hover:bg-brand-50/20 transition-all cursor-pointer shadow-xs"
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 text-neutral-600 border border-neutral-200 shrink-0 transition-transform group-hover:scale-105 group-hover:bg-brand-50 group-hover:text-brand-600">
                    <Icon size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-neutral-900 group-hover:text-brand-600 transition-colors">
                      {opt.title}
                    </h4>
                    <p className="text-xs text-neutral-500 line-clamp-1 mt-0.5">
                      {opt.description}
                    </p>
                  </div>
                </div>
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-50 text-neutral-400 group-hover:bg-brand-500 group-hover:text-white transition-all">
                  <ArrowRight size={13} />
                </div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};
