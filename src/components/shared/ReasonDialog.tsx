import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { FormField } from './FormField';

export interface ReasonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  label?: string;
  reasonLabel?: string;
  reasonRequired?: boolean;
  placeholder?: string;
  reasonPlaceholder?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  loading?: boolean;
  variant?: 'danger' | 'primary' | 'destructive';
  onConfirm: (reason: string) => void | Promise<void>;
}

export const ReasonDialog: React.FC<ReasonDialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  label,
  reasonLabel,
  reasonRequired = true,
  placeholder,
  reasonPlaceholder,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Hủy',
  danger = false,
  variant,
  loading = false,
  onConfirm,
}) => {
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (open) {
      setReason('');
    }
  }, [open]);

  const isValid = !reasonRequired || reason.trim().length > 0;
  const activeLabel = label || reasonLabel || 'Lý do thực hiện';
  const activePlaceholder = placeholder || reasonPlaceholder || 'Nhập lý do chi tiết...';
  const isDanger = danger || variant === 'danger' || variant === 'destructive';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <div className="py-2">
          <FormField label={activeLabel} required={reasonRequired}>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={activePlaceholder}
              rows={3}
            />
          </FormField>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={isDanger ? 'destructive' : 'primary'}
            disabled={!isValid || loading}
            loading={loading}
            onClick={async () => {
              await onConfirm(reason);
              onOpenChange(false);
            }}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
