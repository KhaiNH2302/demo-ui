import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { FormField } from '@/components/shared/FormField';
import { ScheduleInput } from '@/components/shared/ScheduleInput';
import { Alert } from '@/components/ui/Alert';
import { ArrowLeftRight, Lock, AlertCircle, Info, Sparkles } from 'lucide-react';
import { toast } from '@/components/ui/Toast';
import type { SwapRequest, CourseOffering, ScheduleSlot } from '@/types/entities';

interface SwapRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: 'create' | 'edit';
  initialData?: Partial<SwapRequest>;
  initialOfferingId?: string;
  initialCurrentClass?: string;
  initialTargetClass?: string;
  onSuccess?: (requestId: string) => void;
}

export const SwapRequestDialog: React.FC<SwapRequestDialogProps> = ({
  open,
  onOpenChange,
  mode = 'create',
  initialData,
  initialOfferingId,
  initialCurrentClass,
  initialTargetClass,
  onSuccess,
}) => {
  const queryClient = useQueryClient();

  const [offeringId, setOfferingId] = useState(initialOfferingId || 'off_07');
  const [currentClassCode, setCurrentClassCode] = useState(initialCurrentClass || '');
  const [targetClassCode, setTargetClassCode] = useState(initialTargetClass || '');
  const [schedule, setSchedule] = useState<ScheduleSlot[]>([]);
  const [note, setNote] = useState('');
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Fetch offerings for combobox/select
  const offeringsQuery = useQuery<CourseOffering[]>({
    queryKey: ['course-offerings'],
    queryFn: () => apiClient.get<CourseOffering[]>('/course-offerings'),
    enabled: open,
  });

  const isEdit = mode === 'edit';
  const pendingCount = initialData?.pendingConnectionCount || 0;
  const isHardLocked = isEdit && (initialData?.locked || pendingCount > 0);

  useEffect(() => {
    if (open) {
      setApiError(null);
      if (initialData) {
        setOfferingId(initialData.offeringId || initialOfferingId || 'off_07');
        setCurrentClassCode(initialData.currentClassCode || initialCurrentClass || '');
        setTargetClassCode(initialData.targetClassCode || initialTargetClass || '');
        setSchedule(initialData.schedule || []);
        setNote(initialData.note || '');
        setDisclaimerAccepted(isEdit);
      } else {
        setOfferingId(initialOfferingId || 'off_07');
        setCurrentClassCode(initialCurrentClass || '');
        setTargetClassCode(initialTargetClass || '');
        setSchedule([]);
        setNote('');
        setDisclaimerAccepted(false);
      }
    }
  }, [open, isEdit, initialData, initialOfferingId, initialCurrentClass, initialTargetClass]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (isEdit && initialData) {
        return apiClient.put<SwapRequest>(`/swap-requests/${initialData.id}`, {
          currentClassCode: currentClassCode.trim().toUpperCase(),
          targetClassCode: targetClassCode.trim().toUpperCase(),
          schedule,
          note: note.trim(),
          version: initialData.version,
        });
      }
      return apiClient.post<SwapRequest>('/swap-requests', {
        offeringId,
        currentClassCode: currentClassCode.trim().toUpperCase(),
        targetClassCode: targetClassCode.trim().toUpperCase(),
        schedule,
        note: note.trim(),
      });
    },
    onSuccess: (data: any) => {
      const createdOrUpdatedId = data?.data?.id || data?.id || (initialData && initialData.id) || 'swap_req_new';
      toast.success(isEdit ? 'Đã lưu thay đổi yêu cầu đổi lớp!' : 'Đã tạo yêu cầu đổi lớp thành công!');
      queryClient.invalidateQueries({ queryKey: ['swap'] });
      queryClient.invalidateQueries({ queryKey: ['swap-explore'] });
      onOpenChange(false);
      onSuccess?.(createdOrUpdatedId);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error?.message || err?.message || 'Có lỗi xảy ra khi lưu yêu cầu.';
      setApiError(msg);
      toast.error(msg);
    },
  });

  const handleSwapClassCodes = () => {
    if (isHardLocked) return;
    const temp = currentClassCode;
    setCurrentClassCode(targetClassCode);
    setTargetClassCode(temp);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    const cur = currentClassCode.trim().toUpperCase();
    const tgt = targetClassCode.trim().toUpperCase();

    if (!offeringId || !offeringsQuery.data?.some((offering) => offering.id === offeringId)) {
      setApiError('Vui lòng chọn môn học');
      return;
    }
    if (!cur) {
      setApiError('Vui lòng nhập mã lớp hiện tại');
      return;
    }
    if (!tgt) {
      setApiError('Vui lòng nhập mã lớp muốn đổi');
      return;
    }

    if (cur === tgt) {
      setApiError('Lớp muốn đổi phải khác lớp hiện tại của bạn');
      return;
    }

    if (note.length > 300) {
      setApiError('Ghi chú không được vượt quá 300 ký tự');
      return;
    }

    if (!isEdit && !disclaimerAccepted) {
      setApiError('Vui lòng xác nhận bạn hiểu điều khoản của hệ thống');
      return;
    }

    saveMutation.mutate();
  };

  const offerings = offeringsQuery.data || [];
  const selectedOffering = offerings.find((o) => o.id === offeringId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-brand-600" />
            {isEdit ? 'Chỉnh sửa yêu cầu đổi lớp' : 'Tạo yêu cầu đổi lớp'}
          </DialogTitle>
        </DialogHeader>

        {apiError && (
          <Alert variant="danger" title="Không thể lưu yêu cầu">
            {apiError}
          </Alert>
        )}

        {isHardLocked && (
          <div className="p-3.5 rounded-lg border border-amber-200 bg-amber-50/70 dark:bg-amber-950/30 dark:border-amber-800 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-amber-900 dark:text-amber-200">
              <Lock className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Mã lớp và lịch học đang tạm khóa</span>
            </div>
            <p className="text-amber-800 dark:text-amber-300 leading-relaxed">
              Yêu cầu đang có <strong>{pendingCount} lời mời kết nối chờ phản hồi</strong>. Để đảm bảo tính minh bạch khi đối chiếu, mã lớp và lịch học được tạm khóa. Bạn chỉ có thể chỉnh sửa ghi chú.
            </p>
            <div className="pt-1">
              <Link
                to="/swap/connections"
                onClick={() => onOpenChange(false)}
                className="font-medium text-amber-900 dark:text-amber-200 underline hover:no-underline"
              >
                Quản lý lời mời kết nối →
              </Link>
            </div>
          </div>
        )}

        <form noValidate onSubmit={handleSubmit} className="space-y-4 py-1">
          {/* Môn học */}
          <FormField label="Môn học" required>
            {isEdit ? (
              <div className="p-2.5 rounded-md border border-neutral-200 bg-neutral-50 dark:bg-neutral-900 dark:border-neutral-800 text-xs flex items-center justify-between">
                <div>
                  <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                    {selectedOffering?.courseCode || 'Môn học'}
                  </span>{' '}
                  —{' '}
                  <span className="text-neutral-600 dark:text-neutral-400">
                    {selectedOffering?.courseName}
                  </span>
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] text-neutral-400">
                  <Lock className="w-3.5 h-3.5" /> Không đổi môn khi sửa
                </span>
              </div>
            ) : (
              <Select
                value={offeringId}
                onChange={(e) => setOfferingId(e.target.value)}
                options={offerings.map((o) => ({
                  value: o.id,
                  label: `${o.courseCode} — ${o.courseName} (${o.term})`,
                }))}
              />
            )}
          </FormField>

          {/* Mã lớp ⇄ Mã lớp */}
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] items-end gap-2">
            <FormField label="Lớp hiện tại" required>
              <div className="relative">
                <Input
                  placeholder="Ví dụ: SE1601"
                  value={currentClassCode}
                  disabled={isHardLocked}
                  onChange={(e) => setCurrentClassCode(e.target.value.toUpperCase())}
                  className="font-mono uppercase font-semibold text-sm"
                  required
                />
                {isHardLocked && (
                  <Lock className="w-3.5 h-3.5 text-neutral-400 absolute right-2.5 top-3" />
                )}
              </div>
            </FormField>

            <div className="pb-1 flex justify-center">
              <button
                type="button"
                disabled={isHardLocked}
                onClick={handleSwapClassCodes}
                className="p-2 rounded-md border border-neutral-200 dark:border-neutral-800 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-40 transition-colors"
                title="Đảo hai mã lớp"
              >
                <ArrowLeftRight className="w-4 h-4" />
              </button>
            </div>

            <FormField label="Lớp muốn đổi" required>
              <div className="relative">
                <Input
                  placeholder="Ví dụ: SE1602"
                  value={targetClassCode}
                  disabled={isHardLocked}
                  onChange={(e) => setTargetClassCode(e.target.value.toUpperCase())}
                  className="font-mono uppercase font-semibold text-sm"
                  required
                />
                {isHardLocked && (
                  <Lock className="w-3.5 h-3.5 text-neutral-400 absolute right-2.5 top-3" />
                )}
              </div>
            </FormField>
          </div>

          {/* Lịch học (tự khai) */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                Lịch học lớp hiện tại (tùy chọn, định dạng 24h)
              </label>
              <span className="text-[11px] text-neutral-400">Giúp AI đối chiếu tránh trùng giờ</span>
            </div>
            <div className="p-3 rounded-lg border border-neutral-200 bg-neutral-50/50 dark:bg-neutral-900/30 dark:border-neutral-800">
              <ScheduleInput
                value={schedule}
                disabled={isHardLocked}
                onChange={setSchedule}
              />
            </div>
          </div>

          {/* Ghi chú */}
          <FormField label="Ghi chú thêm (tùy chọn, tối đa 300 ký tự)">
            <Textarea
              rows={2}
              maxLength={300}
              placeholder="Ví dụ: Cần đổi do trùng lịch làm thêm buổi sáng, hoặc ưu tiên giảng viên..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <div className="flex justify-end pt-0.5 text-[11px] text-neutral-400">
              {note.length}/300 ký tự
            </div>
          </FormField>

          {/* Disclaimer Checkbox (chỉ hiện khi tạo mới) */}
          {!isEdit && (
            <label className="flex items-start gap-2.5 p-3 rounded-lg border border-neutral-200 bg-neutral-50/60 dark:bg-neutral-900/40 dark:border-neutral-800 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={disclaimerAccepted}
                onChange={(e) => setDisclaimerAccepted(e.target.checked)}
                className="mt-0.5 rounded border-neutral-300 text-brand-600 focus:ring-brand-500"
                required
              />
              <span className="text-neutral-700 dark:text-neutral-300 leading-snug">
                Tôi hiểu SCS chỉ là nền tảng kết nối sinh viên tự thỏa thuận. Sau khi kết nối thành công, hai bên cần tự thực hiện thủ tục đổi lớp theo quy định của nhà trường.
              </span>
            </label>
          )}

          <DialogFooter className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Hủy
            </Button>
            <Button type="submit" loading={saveMutation.isPending}>
              {isEdit ? 'Lưu thay đổi' : 'Đăng yêu cầu'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
