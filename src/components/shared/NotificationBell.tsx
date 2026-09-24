import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { IconButton } from '@/components/ui/IconButton';
import { NotificationItem } from './NotificationItem';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { apiClient } from '@/lib/apiClient';
import type { Notification } from '@/types/entities';

export const NotificationBell: React.FC = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data } = useQuery<Notification[]>({
    queryKey: queryKeys.notifications.list(),
    queryFn: () => apiClient.get('/notifications'),
    refetchInterval: 15000,
  });
  // Phòng trường hợp response không đúng shape (API lỗi/transient) — không để
  // cả app crash chỉ vì cái chuông thông báo.
  const notifications = Array.isArray(data) ? data : [];

  const markReadMutation = useMutation({
    mutationFn: (id: string) => apiClient.post(`/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.list() });
    },
  });

  const unreadCount = notifications.filter((n) => !n.read).length;
  const recentNotifications = notifications.slice(0, 5);

  const handleNotificationClick = (item: Notification) => {
    if (!item.read) {
      markReadMutation.mutate(item.id);
    }
    setOpen(false);
    navigate(item.linkTo);
  };

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <div className="relative inline-block">
          <IconButton variant="ghost" size="sm" aria-label="Thông báo" className="text-neutral-600 hover:text-neutral-900">
            <Bell size={20} />
          </IconButton>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#dc3c33] px-1 text-[10px] font-bold text-white shadow-sm pointer-events-none">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </div>
      </PopoverPrimitive.Trigger>

      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="end"
          sideOffset={8}
          className="z-50 w-80 sm:w-96 rounded-lg border border-neutral-200 bg-white p-0 shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
        >
          <div className="flex items-center justify-between border-b border-neutral-100 p-3 px-4">
            <h4 className="text-xs font-semibold text-neutral-900">Thông báo</h4>
            {unreadCount > 0 && (
              <span className="text-[11px] text-neutral-500">{unreadCount} chưa đọc</span>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-neutral-100">
            {recentNotifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-neutral-400">Không có thông báo mới</div>
            ) : (
              recentNotifications.map((notif) => (
                <NotificationItem
                  key={notif.id}
                  notification={notif}
                  onClick={handleNotificationClick}
                />
              ))
            )}
          </div>

          <div className="border-t border-neutral-100 p-2 text-center bg-neutral-50/50 rounded-b-lg">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                navigate('/notifications');
              }}
              className="text-xs font-medium text-brand-600 hover:text-brand-700 py-1"
            >
              Xem tất cả thông báo
            </button>
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
};
