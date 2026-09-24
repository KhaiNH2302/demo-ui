import React, { useState } from 'react';
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
import { FormField } from '@/components/shared/FormField';
import { Alert } from '@/components/ui/Alert';
import { useToast } from '@/components/ui/Toast';
import { apiClient, type ApiError } from '@/lib/apiClient';
import type { SwapRequest } from '@/types/entities';

export interface SendSwapConnectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  myRequest: SwapRequest;
  partnerRequest: SwapRequest;
  onSuccess?: () => void;
}

export const SendSwapConnectionDialog: React.FC<SendSwapConnectionDialogProps> = ({
  open,
  onOpenChange,
  myRequest,
  partnerRequest,
  onSuccess,
}) => {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSend = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      await apiClient.post('/swap-connections', {
        requestAId: myRequest.id,
        requestBId: partnerRequest.id,
        message,
      });
      toast({ variant: 'success', title: 'Đã gửi lời mời đổi lớp thành công!' });
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      const apiErr = err as ApiError;
      setErrorMsg(apiErr.message || 'Không thể gửi lời mời. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>Gửi lời mời đổi lớp</DialogTitle>
          <DialogDescription>
            Đối tác sẽ nhận được thông tin yêu cầu đổi lớp của bạn để xem xét và phản hồi.
          </DialogDescription>
        </DialogHeader>

        {errorMsg && <Alert tier="danger">{errorMsg}</Alert>}

        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3.5 space-y-2 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-neutral-500 font-medium">Lớp của bạn:</span>
            <span className="font-bold text-neutral-900">
              {myRequest.currentClassCode} ➔ {myRequest.targetClassCode}
            </span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-neutral-200/60">
            <span className="text-neutral-500 font-medium">Lớp đối tác:</span>
            <span className="font-bold text-brand-700">
              {partnerRequest.currentClassCode} ➔ {partnerRequest.targetClassCode}
            </span>
          </div>
        </div>

        <FormField label="Lời nhắn gửi đến đối tác (Tùy chọn)">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="vd: Mình học cùng slot này, bạn đồng ý đổi với mình nhé..."
            rows={3}
          />
        </FormField>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Hủy
          </Button>
          <Button onClick={handleSend} loading={loading}>
            Gửi lời mời
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
