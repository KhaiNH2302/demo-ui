import React, { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { FilterSelect } from '@/components/shared/FilterSelect';
import { formatRelativeTime } from '@/lib/format';
import { cn } from '@/lib/cn';
import { conversationKindMeta } from '@/lib/statusMeta';
import {
  SquarePen,
  Search,
  MessageSquare,
  Sparkles,
  UsersRound,
  Repeat2,
  GraduationCap,
  Building2,
  X,
} from 'lucide-react';
import type { Conversation } from '@/types/entities';

export interface ConversationListProps {
  items: Conversation[];
  activeId?: string;
  onSelect: (item: Conversation) => void;
  onNewMessage?: () => void;
  className?: string;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  items,
  activeId,
  onSelect,
  onNewMessage,
  className,
}) => {
  const [folder, setFolder] = useState<'inbox' | 'requests'>('inbox');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const invitationsCount = items.filter((c) => c.requestStatus === 'pending').length;

  const filteredConversations = useMemo(() => {
    return items.filter((conv) => {
      // Folder filter
      if (folder === 'requests') {
        if (conv.requestStatus !== 'pending') return false;
      } else {
        if (conv.requestStatus === 'pending') return false;
      }

      // Source filter
      if (sourceFilter !== 'all') {
        if (sourceFilter === 'direct' && conv.kind !== 'direct') return false;
        if (sourceFilter === 'groups_clubs' && conv.kind !== 'group' && conv.kind !== 'club') return false;
        if (sourceFilter === 'swap' && conv.kind !== 'swap') return false;
        if (sourceFilter === 'mentoring' && conv.kind !== 'mentoring') return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          (conv.title && conv.title.toLowerCase().includes(q)) ||
          (conv.lastMessage && conv.lastMessage.toLowerCase().includes(q))
        );
      }

      return true;
    });
  }, [items, folder, sourceFilter, searchQuery]);

  return (
    <div className={cn('flex flex-col h-full bg-surface overflow-hidden', className)}>
      {/* Header with Title and "Tin nhắn mới" SquarePen button */}
      <div className="p-3.5 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between shrink-0">
        <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">Tin nhắn</h3>
        {onNewMessage && (
          <button
            type="button"
            onClick={onNewMessage}
            className="p-2 rounded-lg bg-brand-50 dark:bg-brand-500/10 hover:bg-brand-100 dark:hover:bg-brand-500/20 text-brand-600 transition-colors flex items-center gap-1 text-xs font-semibold cursor-pointer"
            title="Tạo tin nhắn mới"
          >
            <SquarePen size={16} />
            <span className="hidden sm:inline">Soạn tin</span>
          </button>
        )}
      </div>

      {/* Search Input & Filter dropdown */}
      <div className="p-2.5 border-b border-neutral-200 dark:border-neutral-700 shrink-0 flex items-center gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm..."
            className="w-full pl-8 pr-7 py-1.5 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:bg-surface focus:border-brand-500 focus:outline-hidden transition-all text-neutral-900 dark:text-neutral-100"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {folder === 'inbox' && (
          <FilterSelect
            label="Nguồn"
            value={sourceFilter}
            onChange={(v) => setSourceFilter(v as any)}
            options={[
              { value: 'all', label: 'Tất cả' },
              { value: 'direct', label: 'Trực tiếp' },
              { value: 'groups_clubs', label: 'Nhóm & CLB' },
              { value: 'swap', label: 'Đổi lớp' },
              { value: 'mentoring', label: 'Mentoring' },
            ]}
          />
        )}
      </div>

      {/* Tabs: Hộp thư / Lời mời */}
      <div className="p-2 border-b border-neutral-200 dark:border-neutral-700 shrink-0">
        <SegmentedControl
          options={[
            { value: 'inbox', label: 'Hộp thư' },
            {
              value: 'requests',
              label: invitationsCount > 0 ? `Lời mời (${invitationsCount})` : 'Lời mời',
            },
          ]}
          value={folder}
          onValueChange={(v) => setFolder(v as 'inbox' | 'requests')}
          size="sm"
          fullWidth
        />
      </div>

      {/* Conversation list */}
      <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-800">
        {filteredConversations.length === 0 ? (
          <div className="p-8 text-center text-xs text-neutral-400 space-y-1">
            <p>Không có cuộc trò chuyện nào</p>
            {onNewMessage && (
              <button
                type="button"
                onClick={onNewMessage}
                className="text-brand-600 font-semibold hover:underline mt-2 inline-block"
              >
                Bắt đầu nhắn tin ngay →
              </button>
            )}
          </div>
        ) : (
          filteredConversations.map((conv) => {
            const isActive = conv.id === activeId;
            const kind = conversationKindMeta[conv.kind];
            const KindIcon = kind?.icon;
            const isUnread = (conv.unreadCount || 0) > 0;

            return (
              <div
                key={conv.id}
                onClick={() => onSelect(conv)}
                className={cn(
                  'flex items-start gap-3 p-3 transition-colors cursor-pointer text-left relative',
                  isActive
                    ? 'bg-brand-50/70 dark:bg-brand-500/10 border-l-3 border-brand-600'
                    : 'hover:bg-neutral-50 dark:hover:bg-neutral-800'
                )}
              >
                <div className="relative shrink-0">
                  <Avatar
                    src={conv.avatarUrl}
                    name={conv.title || 'Chat'}
                    size="md"
                    className="ring-1 ring-neutral-200"
                  />
                  {conv.kind === 'direct' && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-tier-success-dot border-2 border-white dark:border-neutral-900" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {KindIcon && <KindIcon size={12} className="text-neutral-400 shrink-0" />}
                      <h5
                        className={cn(
                          'text-xs truncate',
                          isUnread ? 'font-bold text-neutral-900 dark:text-neutral-100' : 'font-semibold text-neutral-800 dark:text-neutral-200'
                        )}
                      >
                        {conv.title || 'Hội thoại'}
                      </h5>
                    </div>
                    {conv.lastMessageAt && (
                      <span className="text-[10px] text-neutral-400 shrink-0">
                        {formatRelativeTime(conv.lastMessageAt)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2 mt-1">
                    <p
                      className={cn(
                        'text-[11px] truncate',
                        isUnread ? 'font-semibold text-neutral-900 dark:text-neutral-100' : 'text-neutral-500'
                      )}
                    >
                      {conv.lastMessage || 'Chưa có tin nhắn'}
                    </p>
                    {isUnread && (
                      <span className="w-2 h-2 rounded-full bg-brand-500 shrink-0" />
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
