import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { useQuery } from '@tanstack/react-query';
import {
  MessageCircle,
  Search,
  UsersRound,
  ExternalLink,
  Check,
  Clock,
  Sparkles,
  ArrowRight,
  UserCheck,
} from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { formatRelativeTime } from '@/lib/format';
import { conversationKindMeta } from '@/lib/statusMeta';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/cn';
import type { Conversation } from '@/types/entities';

export interface ChatQuickPreviewProps {
  unreadCount?: number;
}

export const ChatQuickPreview: React.FC<ChatQuickPreviewProps> = ({ unreadCount = 0 }) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'groups'>('all');
  const navigate = useNavigate();

  const { data: conversations = [] } = useQuery<Conversation[]>({
    queryKey: ['chat', 'conversations'],
    queryFn: () => apiClient.get('/conversations'),
    refetchInterval: 15000,
  });

  const filteredConversations = useMemo(() => {
    return conversations.filter((conv) => {
      // Filter tab
      if (activeFilter === 'unread' && (!conv.unreadCount || conv.unreadCount <= 0)) {
        return false;
      }
      if (activeFilter === 'groups' && conv.kind !== 'group' && conv.kind !== 'club') {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = conv.title?.toLowerCase().includes(q);
        const matchesLastMsg = conv.lastMessage?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesLastMsg) return false;
      }

      return true;
    });
  }, [conversations, activeFilter, searchQuery]);

  const handleSelectConversation = (conv: Conversation) => {
    setOpen(false);
    navigate(`/chats/${conv.id}`);
  };

  const handleViewAll = () => {
    setOpen(false);
    navigate('/chats');
  };

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <button
          type="button"
          aria-label="Xem nhanh tin nhắn"
          className={cn(
            'relative p-2 rounded-full transition-all cursor-pointer',
            open
              ? 'bg-brand-50 text-brand-600 dark:bg-neutral-800 dark:text-neutral-100'
              : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800'
          )}
          title="Tin nhắn (Xem nhanh như Facebook)"
        >
          <MessageCircle size={20} />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-tier-danger-dot px-1 text-[10px] font-bold text-white shadow-xs pointer-events-none">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </PopoverPrimitive.Trigger>

      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="end"
          sideOffset={8}
          className="z-50 w-[360px] sm:w-[390px] rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-surface shadow-2xl p-0 overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150"
        >
          {/* Header (Messenger FB style) */}
          <div className="p-3.5 pb-2.5 border-b border-neutral-100 dark:border-neutral-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
                  Đoạn chat
                </h3>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    {unreadCount} mới
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={handleViewAll}
                className="p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 hover:text-neutral-900 transition-colors cursor-pointer"
                title="Mở toàn màn hình trong mục Tin nhắn"
              >
                <ExternalLink size={16} />
              </button>
            </div>

            {/* FB-Style Search Input */}
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm trên Messenger..."
                className="w-full pl-8.5 pr-3 py-1.5 text-xs rounded-full bg-neutral-100 dark:bg-neutral-800/80 border border-transparent focus:border-brand-300 focus:bg-white dark:focus:bg-neutral-900 focus:outline-none transition-all placeholder:text-neutral-400 text-neutral-900 dark:text-neutral-100"
              />
            </div>

            {/* Quick Filter Pills */}
            <div className="flex items-center gap-1.5 pt-0.5">
              {[
                { key: 'all', label: 'Hộp thư' },
                { key: 'unread', label: 'Chưa đọc' },
                { key: 'groups', label: 'Nhóm & Đồ án' },
              ].map((pill) => {
                const isActive = activeFilter === pill.key;
                return (
                  <button
                    key={pill.key}
                    type="button"
                    onClick={() => setActiveFilter(pill.key as any)}
                    className={cn(
                      'px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer',
                      isActive
                        ? 'bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 border border-brand-200 dark:border-brand-800'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                    )}
                  >
                    {pill.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Conversation List (Scrollable) */}
          <div className="max-h-[360px] overflow-y-auto divide-y divide-neutral-50 dark:divide-neutral-800/50 p-1">
            {filteredConversations.length === 0 ? (
              <div className="py-10 text-center space-y-1.5">
                <p className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                  Không tìm thấy đoạn chat nào
                </p>
                <p className="text-[11px] text-neutral-400">
                  Thử tìm từ khóa khác hoặc gửi tin nhắn mới
                </p>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isUnread = (conv.unreadCount || 0) > 0;
                const isGroup = conv.kind === 'group' || conv.kind === 'club';
                const meta = conversationKindMeta[conv.kind];

                return (
                  <div
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv)}
                    className={cn(
                      'flex items-center gap-3 p-2.5 rounded-xl transition-all cursor-pointer select-none',
                      isUnread
                        ? 'bg-blue-50/40 dark:bg-blue-950/20 hover:bg-blue-50/70 dark:hover:bg-blue-950/40'
                        : 'hover:bg-neutral-100/80 dark:hover:bg-neutral-800/60'
                    )}
                  >
                    {/* Avatar with relative online/group indicator */}
                    <div className="relative shrink-0">
                      <Avatar
                        src={conv.avatarUrl}
                        name={conv.title || 'Chat'}
                        size="md"
                        className="w-11 h-11"
                      />
                      {!isGroup ? (
                        <span
                          className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-neutral-900"
                          title="Đang hoạt động"
                        />
                      ) : (
                        <span
                          className="absolute -bottom-0.5 -right-0.5 p-0.5 bg-neutral-800 text-white rounded-full border-2 border-white dark:border-neutral-900"
                          title="Nhóm"
                        >
                          <UsersRound size={10} />
                        </span>
                      )}
                    </div>

                    {/* Middle info */}
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="flex items-center justify-between gap-1">
                        <span
                          className={cn(
                            'text-xs truncate',
                            isUnread
                              ? 'font-bold text-neutral-900 dark:text-white'
                              : 'font-semibold text-neutral-800 dark:text-neutral-200'
                          )}
                        >
                          {conv.title || 'Hội thoại'}
                        </span>
                        {meta && (
                          <span
                            className={cn(
                              'text-[10px] px-1.5 py-0.2 rounded font-medium shrink-0',
                              conv.kind === 'group'
                                ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                                : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
                            )}
                          >
                            {meta.label}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 dark:text-neutral-400">
                        <span
                          className={cn(
                            'truncate flex-1',
                            isUnread
                              ? 'font-semibold text-neutral-900 dark:text-neutral-100'
                              : 'text-neutral-500 dark:text-neutral-400'
                          )}
                        >
                          {conv.lastMessage || 'Bắt đầu cuộc trò chuyện'}
                        </span>
                        <span className="shrink-0 text-neutral-400">·</span>
                        <span className="shrink-0 text-[10px] text-neutral-400">
                          {conv.lastMessageAt ? formatRelativeTime(conv.lastMessageAt) : 'Mới'}
                        </span>
                      </div>
                    </div>

                    {/* Blue dot indicator on right if unread (FB signature) */}
                    {isUnread && (
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0 self-center shadow-xs" />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer (FB style "Xem tất cả trong Messenger") */}
          <div className="p-2.5 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 text-center">
            <button
              type="button"
              onClick={handleViewAll}
              className="w-full py-1.5 px-3 rounded-lg text-xs font-semibold text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/50 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Xem tất cả trong mục Tin nhắn</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
};
