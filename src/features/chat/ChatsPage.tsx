import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ContextHeader } from '@/components/shared/ContextHeader';
import { ConversationList } from '@/components/shared/ConversationList';
import { ChatWindow } from '@/components/shared/ChatWindow';
import { NewMessageDialog } from './components/NewMessageDialog';
import { QueryBoundary } from '@/components/shared/QueryBoundary';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/Button';
import { MessageSquare, SquarePen } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import type { Conversation } from '@/types/entities';

export default function ChatsPage() {
  const { conversationId, id } = useParams<{ conversationId?: string; id?: string }>();
  const currentParamId = conversationId || id;
  const navigate = useNavigate();

  const [newMessageDialogOpen, setNewMessageDialogOpen] = useState<boolean>(false);
  const [selectedId, setSelectedId] = useState<string | undefined>(currentParamId);

  const conversationsQuery = useQuery<Conversation[]>({
    queryKey: ['chat', 'conversations'],
    queryFn: () => apiClient.get('/conversations'),
  });

  const handleSelect = (conv: Conversation) => {
    setSelectedId(conv.id);
    navigate(`/chats/${conv.id}`);
  };

  return (
    <div className="h-full w-full flex flex-col bg-surface">
      <QueryBoundary
        query={conversationsQuery}
        isEmpty={(data) => data.length === 0}
        empty={
          <div className="h-full flex flex-col justify-center items-center p-6">
            <EmptyState
              icon={MessageSquare}
              title="Chưa có cuộc trò chuyện nào"
              description="Hãy bắt đầu gửi tin nhắn trao đổi hoặc lời mời trò chuyện với các bạn sinh viên!"
              actionLabel="Tạo tin nhắn mới"
              onAction={() => setNewMessageDialogOpen(true)}
            />
            <NewMessageDialog
              open={newMessageDialogOpen}
              onOpenChange={setNewMessageDialogOpen}
            />
          </div>
        }
      >
        {(conversations) => {
          const activeConvId =
            currentParamId || selectedId || (window.innerWidth >= 768 ? conversations[0]?.id : undefined);
          const activeConv = conversations.find((c) => c.id === activeConvId);

          return (
            <div className="flex flex-col h-full">
              {/* ContextHeader on mobile when viewing a single conversation */}
              {currentParamId && activeConv && (
                <div className="md:hidden">
                  <ContextHeader
                    backHref="/chats"
                    title={activeConv.title || 'Hội thoại'}
                    avatar={{
                      src: activeConv.avatarUrl,
                      name: activeConv.title || 'Chat',
                    }}
                  />
                </div>
              )}

              {/* Full-bleed Messenger Web Layout */}
              <div className="flex flex-1 min-h-0 bg-surface border-none overflow-hidden">
                {/* Left Column: Conversation Directory (width 320px) */}
                <div
                  className={`w-full md:w-80 shrink-0 border-r border-neutral-200 dark:border-neutral-700 flex flex-col h-full bg-surface ${
                    currentParamId ? 'hidden md:flex' : 'flex'
                  }`}
                >
                  <ConversationList
                    items={conversations}
                    activeId={activeConvId}
                    onSelect={handleSelect}
                    onNewMessage={() => setNewMessageDialogOpen(true)}
                    className="flex-1"
                  />
                </div>

                {/* Center + Right Column: Chat Window & Info Sidebar */}
                <div
                  className={`flex-1 h-full flex flex-col min-w-0 ${
                    !currentParamId ? 'hidden md:flex' : 'flex'
                  }`}
                >
                  {activeConv ? (
                    <ChatWindow
                      conversationId={activeConv.id}
                      conversation={activeConv}
                      className="border-0 rounded-none h-full"
                    />
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center p-8 bg-neutral-50/50 dark:bg-neutral-900/50 space-y-3">
                      <div className="w-16 h-16 rounded-full bg-brand-50 dark:bg-brand-500/10 text-brand-600 flex items-center justify-center shadow-xs">
                        <MessageSquare size={32} />
                      </div>
                      <div className="text-center">
                        <h4 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                          Chọn một cuộc trò chuyện
                        </h4>
                        <p className="text-xs text-neutral-500 mt-1 max-w-sm">
                          Chọn từ danh sách bên trái hoặc tạo tin nhắn mới để bắt đầu trao đổi.
                        </p>
                      </div>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setNewMessageDialogOpen(true)}
                        leftIcon={<SquarePen size={15} />}
                      >
                        Soạn tin nhắn mới
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* New Message Dialog */}
              <NewMessageDialog
                open={newMessageDialogOpen}
                onOpenChange={setNewMessageDialogOpen}
              />
            </div>
          );
        }}
      </QueryBoundary>
    </div>
  );
}
