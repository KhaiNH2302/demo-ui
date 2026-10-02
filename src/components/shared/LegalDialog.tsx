import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { termsContent } from '@/content/terms';
import { privacyContent } from '@/content/privacy';
import { FileText, Shield } from 'lucide-react';

export interface LegalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'terms' | 'privacy';
}

export const LegalDialog: React.FC<LegalDialogProps> = ({
  open,
  onOpenChange,
  type,
}) => {
  const isTerms = type === 'terms';
  const content = isTerms ? termsContent : privacyContent;
  const title = isTerms ? 'Điều khoản sử dụng dịch vụ' : 'Chính sách quyền riêng tư';
  const Icon = isTerms ? FileText : Shield;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="xl" className="max-h-[85vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b border-neutral-200 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-300">
              <Icon size={20} />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-neutral-900">{title}</DialogTitle>
              <DialogDescription className="text-xs text-neutral-500">
                Phiên bản cập nhật ngày 25/09/2026 áp dụng cho toàn bộ nền tảng SCS
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 text-neutral-700 text-xs">
          <div className="prose-doc whitespace-pre-line">
            {content}
          </div>
        </div>

        <DialogFooter className="p-4 border-t border-neutral-200 bg-neutral-50/50 shrink-0 flex justify-end">
          <Button variant="primary" size="sm" onClick={() => onOpenChange(false)}>
            Đã hiểu và đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
