import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Đã có lỗi xảy ra',
  message = 'Không thể tải dữ liệu. Vui lòng thử lại sau.',
  onRetry,
  className,
}) => {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-4 text-center', className)}>
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#fdecec] text-[#dc3c33] mb-4">
        <AlertTriangle size={32} />
      </div>
      <h4 className="text-card-title text-neutral-900">{title}</h4>
      <p className="text-meta text-neutral-500 mt-1 max-w-sm">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="mt-5">
          Thử lại
        </Button>
      )}
    </div>
  );
};
