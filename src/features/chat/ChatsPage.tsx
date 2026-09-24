import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/shared/PageHeader';
import { ConversationList } from '@/components/shared/ConversationList';
import { ChatWindow } from '@/components/shared/ChatWindow';
import { QueryBoundary } from '@/components/shared/QueryBoundary';
import { EmptyState } from '@/components/shared/EmptyState';
import { MessageSquare } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import type { Conversation } from '@/types/entities';

export default function ChatsPage() {
  const { conversationId } = useParams<{ conversationId?: string }>();
  const navigate = useNavigate();

  const conversationsQuery = useQuery<Conversation[]>({
    queryKey: queryKeys.chat.conversations,
    queryFn: () => apiClient.get('/conversations'),
  });

  const [selectedId, setSelectedId] = useState<string | undefined>(conversationId);

  const handleSelect = (conv: Conversation) => {
    setSelectedId(conv.id);
    navigate(`/chats/${conv.id}`);
  };

  return (
    <div className="space-y-4 h-[calc(100vh-8.5rem)] flex flex-col">
      <PageHeader
        title="Tin nhắn kết nối"
        description="Trao đổi trực tiếp sau khi kết nối đổi lớp, mentoring hoặc thảo luận CLB"
      />

      <QueryBoundary
        query={conversationsQuery}
        isEmpty={(data) => data.length === 0}
        empty={
          <EmptyState
            icon={MessageSquare}
            title="Chưa có cuộc trò chuyện nào"
            description="Tin nhắn sẽ tự động kích hoạt khi bạn kết nối Đổi lớp thành công, Mentoring được chấp nhận hoặc tham gia CLB."
          />
        }
      >
        {(conversations) => {
          const activeConvId = conversationId || selectedId || conversations[0]?.id;
          const activeConv = conversations.find((c) => c.id === activeConvId);

          return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 min-h-0 bg-white rounded-xl border border-neutral-200 shadow-xs overflow-hidden">
              {/* Left col: List */}
              <div className="md:col-span-1 border-r border-neutral-200 flex flex-col h-full bg-white">
                <div className="p-3 border-b border-neutral-100 bg-neutral-50/60 font-semibold text-xs text-neutral-700">
                  Hộp thoại ({conversations.length})
                </div>
                <ConversationList
                  items={conversations}
                  activeId={activeConvId}
                  onSelect={handleSelect}
                  className="flex-1"
                />
              </div>

              {/* Right col: Window */}
              <div className="md:col-span-2 h-full flex flex-col">
                {activeConv ? (
                  <ChatWindow
                    conversationId={activeConv.id}
                    conversation={activeConv}
                    className="border-0 rounded-none h-full"
                  />
                ) : (
                  <div className="h-full flex items-center justify-center p-8">
                    <EmptyState
                      icon={MessageSquare}
                      title="Chọn một cuộc trò chuyện"
                      description="Chọn từ danh sách bên trái để xem nội dung tin nhắn."
                    />
                  </div>
                )}
              </div>
            </div>
          );
        }}
      </QueryBoundary>
    </div>
  );
}
