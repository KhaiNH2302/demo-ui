import { useState, useCallback } from 'react';
import { toast } from '@/components/ui/Toast';
import { useGuardedAction } from '@/lib/viewer';

interface UseOptimisticToggleOptions {
  initialActive: boolean;
  initialCount?: number;
  guardLabel?: string;
  onToggle: (nextActive: boolean) => Promise<void> | void;
  errorMessage?: string;
}

export function useOptimisticToggle({
  initialActive,
  initialCount = 0,
  guardLabel = 'thực hiện thao tác này',
  onToggle,
  errorMessage = 'Không thể cập nhật trạng thái. Đã hoàn tác.',
}: UseOptimisticToggleOptions) {
  const [active, setActive] = useState(initialActive);
  const [count, setCount] = useState(initialCount);
  const [pending, setPending] = useState(false);
  const guard = useGuardedAction();

  const toggle = useCallback(() => {
    guard(guardLabel, async () => {
      if (pending) return;
      const prevActive = active;
      const prevCount = count;
      const nextActive = !prevActive;

      setActive(nextActive);
      setCount(nextActive ? prevCount + 1 : Math.max(0, prevCount - 1));
      setPending(true);

      try {
        await onToggle(nextActive);
      } catch {
        setActive(prevActive);
        setCount(prevCount);
        toast.error(errorMessage);
      } finally {
        setPending(false);
      }
    });
  }, [active, count, pending, guard, guardLabel, onToggle, errorMessage]);

  return { active, count, pending, toggle, setActive, setCount };
}
