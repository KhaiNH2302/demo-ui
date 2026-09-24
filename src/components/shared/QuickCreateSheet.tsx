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
  Repeat2,
  BookOpen,
  Users,
  Sparkles,
  Flag,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/cn';

export interface QuickCreateSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const QuickCreateSheet: React.FC<QuickCreateSheetProps> = ({ open, onOpenChange }) => {
  const navigate = useNavigate();

  const options = [
    {
      title: 'Đăng yêu cầu đổi lớp',
      description: 'Tìm đối tác hoán đổi lớp học phần trong kỳ',
      icon: Repeat2,
      path: '/swap/new',
      color: 'bg-blue-50 text-blue-600 border-blue-100',
    },
    {
      title: 'Đăng bài chia sẻ tài liệu',
      description: 'Chia sẻ đề thi, slide môn học hoặc kinh nghiệm',
      icon: BookOpen,
      path: '/knowledge/new',
      color: 'bg-amber-50 text-amber-600 border-amber-100',
    },
    {
      title: 'Tạo nhóm học tập mới',
      description: 'Lập nhóm làm đồ án, ôn thi hoặc rèn luyện kỹ năng',
      icon: Users,
      path: '/groups/new',
      color: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    },
    {
      title: 'Tìm Mentor bằng AI',
      description: 'Phân tích môn học và tự động ghép đôi người hướng dẫn',
      icon: Sparkles,
      path: '/mentoring/ai',
      color: 'bg-purple-50 text-purple-600 border-purple-100',
    },
    {
      title: 'Đăng ký thành lập CLB',
      description: 'Nộp hồ sơ thành lập tổ chức hoặc CLB sinh viên mới',
      icon: Flag,
      path: '/clubs/register',
      color: 'bg-rose-50 text-rose-600 border-rose-100',
    },
  ];

  const handleSelect = (path: string) => {
    onOpenChange(false);
    navigate(path);
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

        <div className="grid gap-2.5 py-2">
          {options.map((opt) => {
            const Icon = opt.icon;
            return (
              <div
                key={opt.path}
                onClick={() => handleSelect(opt.path)}
                className="group flex items-center justify-between p-3.5 rounded-xl border border-neutral-200/80 bg-white hover:border-brand-500 hover:bg-brand-50/20 transition-all cursor-pointer shadow-xs"
              >
                <div className="flex items-center gap-3.5">
                  <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl border shrink-0 transition-transform group-hover:scale-105', opt.color)}>
                    <Icon size={22} />
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
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-50 text-neutral-400 group-hover:bg-brand-500 group-hover:text-white transition-all">
                  <ArrowRight size={14} />
                </div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};
