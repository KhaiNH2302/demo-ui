import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/components/ui/Toast';

interface UseActionMutationOptions<TVariables, TData = unknown> {
  mutationFn: (variables: TVariables) => Promise<TData>;
  invalidateKeys?: unknown[][];
  successMessage?: string | ((data: TData, variables: TVariables) => string);
  errorMessage?: string;
  onSuccess?: (data: TData, variables: TVariables) => void;
}

export function useActionMutation<TVariables = void, TData = unknown>({
  mutationFn,
  invalidateKeys = [],
  successMessage,
  errorMessage = 'Thao tác thất bại, vui lòng thử lại.',
  onSuccess,
}: UseActionMutationOptions<TVariables, TData>) {
  const queryClient = useQueryClient();

  return useMutation<TData, Error, TVariables>({
    mutationFn,
    onSuccess: (data, variables) => {
      invalidateKeys.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key });
      });
      if (successMessage) {
        const msg = typeof successMessage === 'function' ? successMessage(data, variables) : successMessage;
        toast.success(msg);
      }
      onSuccess?.(data, variables);
    },
    onError: (err: unknown) => {
      const apiMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(apiMsg || errorMessage);
    },
  });
}
