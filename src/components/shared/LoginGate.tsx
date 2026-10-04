import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import { useLoginGateStore } from '@/lib/viewer';
import { LoginPromptActions } from './LoginPromptActions';

export const LoginGate: React.FC = () => {
  const { open, actionLabel, redirectTo, options, closeGate } = useLoginGateStore();

  const label = actionLabel || 'tiếp tục thao tác này';

  return (
    <Dialog open={open} onOpenChange={(v) => !v && closeGate()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold text-neutral-900">
            {options.title || `Đăng nhập để ${label}`}
          </DialogTitle>
          <DialogDescription className="text-sm text-neutral-600 mt-1">
            {options.description || 'Bạn sẽ ở lại đúng nội dung đang xem sau khi đăng nhập.'}
          </DialogDescription>
        </DialogHeader>

        <div className="pt-3">
          <LoginPromptActions
            actionLabel={label}
            redirectTo={redirectTo}
            onDone={closeGate}
            extra={
              options.dismissLabel ? (
                <>
                  <span className="text-neutral-300">·</span>
                  <button
                    type="button"
                    onClick={closeGate}
                    className="text-neutral-500 hover:text-neutral-800"
                  >
                    {options.dismissLabel}
                  </button>
                </>
              ) : undefined
            }
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
