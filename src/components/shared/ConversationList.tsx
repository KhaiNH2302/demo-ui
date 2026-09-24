import React from 'react';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { formatRelativeTime } from '@/lib/format';
import { cn } from '@/lib/cn';
import type { Conversation } from '@/types/entities';

const kindLabels: Record<Conversation['kind'], string> = {
  swap: '🔄 Đổi lớp',
  mentoring: '🎓 Mentoring',
  club: '🏛️ CLB',
  group: '👥 Nhóm',
  direct: '💬 Trực tiếp',
};

export interface ConversationListProps {
  items: Conversation[];
  activeId?: string;
  onSelect: (item: Conversation) => void;
  className?: string;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  items,
  activeId,
  onSelect,
  className,
}) => {
  return (
    <div className={cn('divide-y divide-neutral-100 overflow-y-auto', className)}>
      {items.map((conv) => {
        const isActive = conv.id === activeId;
        return (
          <div
            key={conv.id}
            onClick={() => onSelect(conv)}
            className={cn(
              'flex items-start gap-3 p-3.5 transition-colors cursor-pointer text-left',
              isActive ? 'bg-brand-50/50' : 'hover:bg-neutral-50'
            )}
          >
            <Avatar name={conv.title || 'Chat'} size="md" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <h5 className="text-xs font-semibold text-neutral-900 truncate">
                  {conv.title || 'Hội thoại'}
                </h5>
                {conv.lastMessageAt && (
                  <span className="text-[10px] text-neutral-400 shrink-0">
                    {formatRelativeTime(conv.lastMessageAt)}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between gap-2 mt-1">
                <p className="text-[11px] text-neutral-500 truncate">{conv.lastMessage || 'Chưa có tin nhắn'}</p>
                <Badge tier="neutral" size="sm" className="text-[10px] shrink-0">
                  {kindLabels[conv.kind]}
                </Badge>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
