import React from 'react';
import { formatRelativeTime } from '@/lib/format';
import { cn } from '@/lib/cn';
import type { Message } from '@/types/entities';

export interface MessageBubbleProps {
  message: Message;
  isMe: boolean;
  senderName?: string;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isMe,
  senderName,
}) => {
  return (
    <div className={cn('flex flex-col', isMe ? 'items-end' : 'items-start')}>
      {!isMe && senderName && (
        <span className="text-[10px] text-neutral-400 mb-0.5 ml-1">{senderName}</span>
      )}
      <div
        className={cn(
          'max-w-[75%] rounded-2xl px-4 py-2 text-xs leading-relaxed break-words',
          isMe
            ? 'bg-brand-500 text-white rounded-tr-xs'
            : 'bg-neutral-100 text-neutral-900 rounded-tl-xs'
        )}
      >
        {message.content}
      </div>
      <span className="text-[10px] text-neutral-400 mt-1 px-1">
        {formatRelativeTime(message.createdAt)}
      </span>
    </div>
  );
};
