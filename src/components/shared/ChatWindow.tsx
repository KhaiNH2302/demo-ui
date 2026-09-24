import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { MessageBubble } from './MessageBubble';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { apiClient } from '@/lib/apiClient';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/cn';
import type { Message, Conversation } from '@/types/entities';

export interface ChatWindowProps {
  conversationId: string;
  conversation?: Conversation;
  readOnly?: boolean;
  readOnlyReason?: string;
  className?: string;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  conversationId,
  conversation,
  readOnly = false,
  readOnlyReason = 'Cuộc trò chuyện này đã kết thúc hoặc không còn quyền truy cập.',
  className,
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();

  const { data: messages = [] } = useQuery<Message[]>({
    queryKey: queryKeys.chat.messages(conversationId),
    queryFn: () => apiClient.get(`/conversations/${conversationId}/messages`),
    refetchInterval: 3000,
    enabled: !!conversationId,
  });

  const sendMutation = useMutation({
    mutationFn: (content: string) => apiClient.post(`/conversations/${conversationId}/messages`, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.chat.messages(conversationId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.chat.conversations });
      setInputText('');
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || readOnly) return;
    sendMutation.mutate(inputText.trim());
  };

  return (
    <div className={cn('flex flex-col h-full bg-white rounded-lg border border-neutral-200 overflow-hidden', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-neutral-100 bg-white">
        <div>
          <h4 className="text-sm font-semibold text-neutral-900">
            {conversation?.title || 'Cuộc trò chuyện'}
          </h4>
          <span className="text-[11px] text-neutral-400">
            {conversation ? `${conversation.participantIds.length} người tham gia` : 'Trực tuyến'}
          </span>
        </div>
        {conversation && (
          <Badge tier="neutral" size="sm">
            {conversation.kind.toUpperCase()}
          </Badge>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-neutral-50/30">
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            isMe={msg.senderId === user?.id}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* ReadOnly banner if disabled */}
      {readOnly && (
        <div className="p-3 bg-neutral-50 border-t border-neutral-200">
          <Alert tier="danger">{readOnlyReason}</Alert>
        </div>
      )}

      {/* Input */}
      {!readOnly && (
        <form onSubmit={handleSend} className="p-3 border-t border-neutral-100 flex items-center gap-2 bg-white">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Nhập tin nhắn..."
            disabled={readOnly || sendMutation.isPending}
            className="flex-1 rounded-md border border-neutral-300 px-3.5 py-2 text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500"
          />
          <Button
            type="submit"
            size="sm"
            disabled={!inputText.trim() || readOnly}
            loading={sendMutation.isPending}
            rightIcon={<Send size={14} />}
          >
            Gửi
          </Button>
        </form>
      )}
    </div>
  );
};
