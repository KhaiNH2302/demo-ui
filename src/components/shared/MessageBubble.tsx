import React, { useState } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { formatRelativeTime } from '@/lib/format';
import { cn } from '@/lib/cn';
import {
  FileText,
  Download,
  ExternalLink,
  Check,
  CheckCheck,
  Smile,
  MoreHorizontal,
  Copy,
  Trash2,
} from 'lucide-react';
import type { Message } from '@/types/entities';

export interface MessageBubbleProps {
  message: Message;
  isMe: boolean;
  senderName?: string;
  senderAvatarUrl?: string;
  onReact?: (messageId: string, emoji: string) => void;
  onDelete?: (messageId: string) => void;
  className?: string;
}

const QUICK_EMOJIS = ['❤️', '👍', '😂', '😮', '😢', '🔥'];

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isMe,
  senderName,
  senderAvatarUrl,
  onReact,
  onDelete,
  className,
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const [localReactions, setLocalReactions] = useState<Record<string, number>>(() => {
    if (message.reactions) {
      const counts: Record<string, number> = {};
      Object.entries(message.reactions).forEach(([emoji, userIds]) => {
        counts[emoji] = userIds.length;
      });
      return counts;
    }
    return {};
  });

  const handleReact = (emoji: string) => {
    setLocalReactions((prev) => {
      const current = prev[emoji] || 0;
      return {
        ...prev,
        [emoji]: current > 0 ? current - 1 : current + 1,
      };
    });
    if (onReact) onReact(message.id, emoji);
    setShowPicker(false);
  };

  const isLikeMessage =
    message.type === 'like' || message.content.trim() === '👍' || message.content.trim() === '(like)';

  // Helper to parse content with URLs
  const renderFormattedText = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);

    return parts.map((part, i) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className={cn(
              'underline inline-flex items-center gap-0.5 font-medium break-all',
              isMe ? 'text-white hover:text-white/80' : 'text-brand-600 hover:text-brand-700'
            )}
          >
            <span>{part}</span>
            <ExternalLink size={11} className="inline shrink-0 ml-0.5" />
          </a>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div
      className={cn(
        'group relative flex gap-2.5 max-w-[85%] sm:max-w-[75%]',
        isMe ? 'ml-auto flex-row-reverse' : 'mr-auto flex-row',
        className
      )}
    >
      {/* Sender Avatar for incoming messages */}
      {!isMe && (
        <Avatar
          src={senderAvatarUrl}
          name={senderName || 'Bạn'}
          size="sm"
          className="shrink-0 mt-auto mb-1 ring-1 ring-neutral-200"
        />
      )}

      {/* Main bubble wrapper */}
      <div className={cn('flex flex-col relative', isMe ? 'items-end' : 'items-start')}>
        {!isMe && senderName && (
          <span className="text-[11px] font-semibold text-neutral-500 mb-1 ml-1">
            {senderName}
          </span>
        )}

        {/* Hover action toolbar (Quick Reactions + Menu) */}
        <div
          className={cn(
            'absolute top-0 -translate-y-1/2 z-10 hidden group-hover:flex items-center gap-1 bg-surface border border-neutral-200 dark:border-neutral-700 rounded-full px-2 py-1 shadow-md transition-all',
            isMe ? 'right-full mr-2' : 'left-full ml-2'
          )}
        >
          {QUICK_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => handleReact(emoji)}
              className="text-sm hover:scale-125 transition-transform p-0.5 cursor-pointer"
            >
              {emoji}
            </button>
          ))}
        </div>

        {/* Bubble Content */}
        {isLikeMessage ? (
          /* Big Thumbs Up Emote like Messenger */
          <div className="p-1">
            <span
              className="text-4xl inline-block transition-transform hover:scale-110 active:scale-95 cursor-pointer"
              title="Đã gửi nút thích"
            >
              👍
            </span>
          </div>
        ) : (
          <div
            className={cn(
              'rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed shadow-2xs break-words relative space-y-2',
              isMe
                ? 'bg-brand-500 text-white rounded-br-xs'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-bl-xs'
            )}
          >
            {/* Text */}
            {message.content && (
              <p className="whitespace-pre-line leading-relaxed">
                {renderFormattedText(message.content)}
              </p>
            )}

            {/* Images Gallery */}
            {message.images && message.images.length > 0 && (
              <div
                className={cn(
                  'grid gap-1.5 pt-1 rounded-lg overflow-hidden',
                  message.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
                )}
              >
                {message.images.map((img, idx) => (
                  <img
                    key={idx}
                    src={img}
                    alt="attachment"
                    className="max-h-60 w-full object-cover rounded-md border border-black/10 hover:opacity-90 transition-opacity cursor-pointer"
                  />
                ))}
              </div>
            )}

            {/* Document Attachments */}
            {message.attachments && message.attachments.length > 0 && (
              <div className="space-y-1.5 pt-1">
                {message.attachments.map((file, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      'flex items-center justify-between gap-3 p-2.5 rounded-xl border transition-colors',
                      isMe
                        ? 'bg-white/10 border-white/20 text-white'
                        : 'bg-surface border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100'
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={cn(
                          'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                          isMe ? 'bg-white/20 text-white' : 'bg-brand-50 dark:bg-brand-500/10 text-brand-600'
                        )}
                      >
                        <FileText size={16} />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-semibold block truncate">
                          {file.name}
                        </span>
                        {file.size && (
                          <span
                            className={cn(
                              'text-[10px] block',
                              isMe ? 'text-white/70' : 'text-neutral-400'
                            )}
                          >
                            {(file.size / 1024).toFixed(0)} KB
                          </span>
                        )}
                      </div>
                    </div>
                    <a
                      href={file.url}
                      download={file.name}
                      onClick={(e) => e.stopPropagation()}
                      className={cn(
                        'p-1.5 rounded-lg transition-colors',
                        isMe ? 'hover:bg-white/20 text-white' : 'hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-400'
                      )}
                      title="Tải xuống tệp"
                    >
                      <Download size={14} />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Reaction badges pinned below the bubble */}
        {Object.entries(localReactions).some(([_, count]) => count > 0) && (
          <div
            className={cn(
              'flex flex-wrap gap-1 -mt-2 z-10',
              isMe ? 'justify-end mr-2' : 'justify-start ml-2'
            )}
          >
            {Object.entries(localReactions)
              .filter(([_, count]) => count > 0)
              .map(([emoji, count]) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleReact(emoji)}
                  className="bg-surface border border-neutral-200 dark:border-neutral-700 rounded-full px-1.5 py-0.5 text-[11px] shadow-xs flex items-center gap-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-transform active:scale-95"
                >
                  <span>{emoji}</span>
                  {count > 1 && (
                    <span className="text-[10px] font-bold text-neutral-600">{count}</span>
                  )}
                </button>
              ))}
          </div>
        )}

        {/* Message Status & Timestamp */}
        <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 mt-1 px-1">
          <span>{formatRelativeTime(message.createdAt)}</span>
          {isMe && (
            <span title={message.status === 'read' ? 'Đã xem' : 'Đã gửi'}>
              {message.status === 'read' ? (
                <CheckCheck size={13} className="text-brand-500" />
              ) : (
                <Check size={13} className="text-neutral-400" />
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
