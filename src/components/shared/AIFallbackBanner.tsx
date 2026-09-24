import React from 'react';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { ArrowRight } from 'lucide-react';

export interface AIFallbackBannerProps {
  visible?: boolean;
  onFallback?: () => void;
  className?: string;
}

export const AIFallbackBanner: React.FC<AIFallbackBannerProps> = ({
  visible = true,
  onFallback,
  className,
}) => {
  if (!visible) return null;

  return (
    <Alert tier="attention" className={className}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 w-full">
        <div>
          <span className="font-medium">AI tạm thời không khả dụng.</span> Đang hiển thị kết quả tìm kiếm thông thường.
        </div>
        {onFallback && (
          <Button variant="outline" size="sm" onClick={onFallback} className="shrink-0 self-start sm:self-auto">
            Chuyển sang tự tìm <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        )}
      </div>
    </Alert>
  );
};
