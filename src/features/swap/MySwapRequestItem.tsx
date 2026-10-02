import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/Badge';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/DropdownMenu';
import {
  MoreVertical,
  Eye,
  Pencil,
  XCircle,
  Mail,
  Lock,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { seedCourseOfferings } from '@/mocks/data/courseOfferings';
import type { SwapRequest } from '@/types/entities';

interface MySwapRequestItemProps {
  request: SwapRequest;
  isSelected?: boolean;
  onSelect?: () => void;
  onEdit?: () => void;
  onCancel?: () => void;
}

export const MySwapRequestItem: React.FC<MySwapRequestItemProps> = ({
  request,
  isSelected = false,
  onSelect,
  onEdit,
  onCancel,
}) => {
  const navigate = useNavigate();
  const offering = seedCourseOfferings.find((o) => o.id === request.offeringId);
  const pendingCount = request.pendingConnectionCount || 0;
  const isOpen = request.status === 'Open';

  const getStatusBadge = () => {
    switch (request.status) {
      case 'Open':
        return <Badge variant="success" className="text-[10px] py-0 px-1.5 font-normal">● Đang mở</Badge>;
      case 'Connected':
        return <Badge variant="neutral" className="text-[10px] py-0 px-1.5 font-normal">Đã kết nối</Badge>;
      case 'Cancelled':
        return <Badge variant="neutral" className="text-[10px] py-0 px-1.5 font-normal">Đã hủy</Badge>;
      default:
        return null;
    }
  };

  return (
    <div
      onClick={onSelect}
      className={cn(
        'group p-3 rounded-lg border transition-all text-xs cursor-pointer relative',
        isSelected
          ? 'border-brand-500 bg-brand-50/60 dark:bg-brand-950/30 ring-1 ring-brand-500'
          : 'border-neutral-200 bg-surface hover:border-neutral-300'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-neutral-900 dark:text-neutral-100">
              {offering?.courseCode || 'Môn học'}
            </span>
            {getStatusBadge()}
            {request.locked && isOpen && (
              <span title="Mã lớp và lịch học đang khóa do có lời mời chờ">
                <Lock className="w-3 h-3 text-amber-600" />
              </span>
            )}
          </div>

          <div className="font-mono text-sm font-semibold text-brand-700 dark:text-brand-300 mt-1">
            {request.currentClassCode} → {request.targetClassCode}
          </div>

          {pendingCount > 0 && isOpen && (
            <div className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded">
              <Mail className="w-3 h-3" />
              <span>{pendingCount} lời mời mới</span>
            </div>
          )}
        </div>

        {/* Action Menu ⋮ */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="p-1 rounded text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              aria-label="Tùy chọn"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate(`/swap/${request.id}`)}>
              <Eye className="w-3.5 h-3.5 mr-2" />
              <span>Xem chi tiết</span>
            </DropdownMenuItem>
            {isOpen && (
              <>
                <DropdownMenuItem onClick={onEdit}>
                  <Pencil className="w-3.5 h-3.5 mr-2" />
                  <span>Chỉnh sửa</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onCancel} className="text-tier-danger-fg">
                  <XCircle className="w-3.5 h-3.5 mr-2" />
                  <span>Hủy yêu cầu</span>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};
