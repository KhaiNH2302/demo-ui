import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { MessageBubble } from './MessageBubble';
import { ConversationInfoSidebar } from '@/features/chat/components/ConversationInfoSidebar';
import { useToast } from '@/components/ui/Toast';
import { useAuthStore } from '@/store/authStore';
import { apiClient } from '@/lib/apiClient';
import { conversationKindMeta } from '@/lib/statusMeta';
import { seedUsers } from '@/mocks/data/users';
import { cn } from '@/lib/cn';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/DropdownMenu';
import {
  Send,
  Image as ImageIcon,
  Paperclip,
  Smile,
  Phone,
  Video,
  Search,
  MoreVertical,
  ThumbsUp,
  X,
  Sparkles,
  Lock,
  PanelRightOpen,
  PanelRightClose,
  Info,
} from 'lucide-react';
import type { Message, Conversation, MessageAttachment } from '@/types/entities';

export interface ChatWindowProps {
  conversationId: string;
  conversation?: Conversation;
  readOnly?: boolean;
  readOnlyReason?: string;
  className?: string;
}

const EMOJI_LIST = [
  '👍', '❤️', '😂', '🔥', '🎉', '👏', '💡', '🚀',
  '😊', '😍', '🤔', '🥳', '😎', '🙌', '✨', '💯',
  '🤝', '👋', '📚', '💻', '🎯', '⭐', '⚡', '🙏',
];

export const ChatWindow: React.FC<ChatWindowProps> = ({
  conversationId,
  conversation,
  readOnly = false,
  readOnlyReason = 'Cuộc trò chuyện này đã kết thúc hoặc không còn quyền truy cập.',
  className,
}) => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [inputText, setInputText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showInfoSidebar, setShowInfoSidebar] = useState(true);
  const [customEmoji, setCustomEmoji] = useState('👍');
  const [searchInChat, setSearchInChat] = useState(false);
  const [chatSearchKeyword, setChatSearchKeyword] = useState('');
  const [attachedImages, setAttachedImages] = useState<string[]>([]);
  const [attachedFiles, setAttachedFiles] = useState<MessageAttachment[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch messages
  const { data: messages = [] } = useQuery<Message[]>({
    queryKey: ['chat', 'messages', conversationId],
    queryFn: () => apiClient.get(`/conversations/${conversationId}/messages`),
    refetchInterval: 3000,
    enabled: !!conversationId,
  });

  // Send message mutation
  const sendMutation = useMutation({
    mutationFn: (payload: {
      content: string;
      type?: 'text' | 'image' | 'file' | 'link' | 'like';
      images?: string[];
      attachments?: MessageAttachment[];
    }) => apiClient.post(`/conversations/${conversationId}/messages`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat', 'messages', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });
      setInputText('');
      setAttachedImages([]);
      setAttachedFiles([]);
      setShowEmojiPicker(false);
    },
  });

  // Accept / Decline invitation mutations (C10.4)
  const acceptInvitationMutation = useMutation({
    mutationFn: () => apiClient.post(`/conversations/${conversationId}/accept`),
    onSuccess: () => {
      toast({ variant: 'success', title: 'Đã chấp nhận lời mời trò chuyện' });
      queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });
    },
  });

  const declineInvitationMutation = useMutation({
    mutationFn: () => apiClient.post(`/conversations/${conversationId}/decline`),
    onSuccess: () => {
      toast({ variant: 'default', title: 'Đã từ chối lời mời trò chuyện' });
      queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle Send action
  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (readOnly) return;

    if (!inputText.trim() && attachedImages.length === 0 && attachedFiles.length === 0) {
      return;
    }

    sendMutation.mutate({
      content: inputText.trim(),
      type: attachedImages.length > 0 ? 'image' : attachedFiles.length > 0 ? 'file' : 'text',
      images: attachedImages,
      attachments: attachedFiles,
    });
  };

  // Quick Like action
  const handleSendQuickLike = () => {
    if (readOnly) return;
    sendMutation.mutate({
      content: customEmoji,
      type: 'like',
    });
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const newImages = Array.from(files).map((f) => URL.createObjectURL(f));
    setAttachedImages((prev) => [...prev, ...newImages]);
    e.target.value = '';
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const newFiles: MessageAttachment[] = Array.from(files).map((f) => ({
      name: f.name,
      url: URL.createObjectURL(f),
      size: f.size,
    }));
    setAttachedFiles((prev) => [...prev, ...newFiles]);
    e.target.value = '';
  };

  const handleEmojiClick = (emoji: string) => {
    setInputText((prev) => prev + emoji);
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Filter messages if search active
  const filteredMessages = chatSearchKeyword.trim()
    ? messages.filter((m) =>
        m.content.toLowerCase().includes(chatSearchKeyword.toLowerCase().trim())
      )
    : messages;

  const isPendingInvitation = conversation?.requestStatus === 'pending';
  const isSenderOfInvitation = conversation?.requestedBy === user?.id;

  const kindMeta = conversation ? conversationKindMeta[conversation.kind] : undefined;
  const KindIcon = kindMeta?.icon;

  return (
    <div className={cn('flex h-full w-full bg-surface overflow-hidden relative', className)}>
      <input
        type="file"
        ref={imageInputRef}
        onChange={handleImageSelect}
        accept="image/*"
        multiple
        className="hidden"
      />
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept=".pdf,.docx,.doc,.zip,.rar,.txt"
        multiple
        className="hidden"
      />

      {/* Main Chat Stream Column */}
      <div className="flex-1 flex flex-col h-full min-w-0 bg-surface">
        {/* Messenger Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 dark:border-neutral-700 bg-surface z-10 shadow-2xs">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative shrink-0">
              <Avatar
                src={conversation?.avatarUrl}
                name={conversation?.title || 'Chat'}
                size="md"
                className="ring-1 ring-neutral-200"
              />
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-tier-success-dot border-2 border-surface" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 truncate">
                  {conversation?.title || 'Cuộc trò chuyện'}
                </h4>
                {kindMeta && KindIcon && (
                  <Badge tier="neutral" size="sm" className="hidden sm:inline-flex gap-1 text-[10px]">
                    <KindIcon size={11} /> {kindMeta.label}
                  </Badge>
                )}
              </div>
              <span className="text-[11px] text-neutral-400 block truncate">
                {conversation?.kind === 'direct'
                  ? 'Đang hoạt động'
                  : `${conversation?.participantIds.length || 2} thành viên trong hội thoại`}
              </span>
            </div>
          </div>

          {/* Header Action Tools */}
          <div className="flex items-center gap-1 text-neutral-500">
            <button
              type="button"
              onClick={() => {
                toast({ variant: 'default', title: 'Đang kết nối cuộc gọi thoại...' });
              }}
              className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-brand-600 transition-colors"
              title="Bắt đầu cuộc gọi thoại"
            >
              <Phone size={18} />
            </button>

            <button
              type="button"
              onClick={() => {
                toast({ variant: 'default', title: 'Đang kết nối cuộc gọi video...' });
              }}
              className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-brand-600 transition-colors"
              title="Bắt đầu cuộc gọi video"
            >
              <Video size={18} />
            </button>

            <button
              type="button"
              onClick={() => setSearchInChat(!searchInChat)}
              className={cn(
                'p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors',
                searchInChat ? 'bg-brand-50 text-brand-600' : 'hover:text-brand-600'
              )}
              title="Tìm kiếm trong cuộc trò chuyện"
            >
              <Search size={18} />
            </button>

            {/* Toggle Conversation Info Sidebar button */}
            <button
              type="button"
              onClick={() => setShowInfoSidebar(!showInfoSidebar)}
              className={cn(
                'p-2 rounded-lg hover:bg-neutral-100 transition-colors hidden md:inline-flex',
                showInfoSidebar ? 'bg-brand-50 text-brand-600' : 'hover:text-brand-600'
              )}
              title={showInfoSidebar ? 'Ẩn thông tin cuộc trò chuyện' : 'Xem thông tin cuộc trò chuyện'}
            >
              <Info size={18} />
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
                >
                  <MoreVertical size={18} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => toast({ variant: 'default', title: 'Đã tắt thông báo' })}>
                  Tắt thông báo cuộc trò chuyện
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toast({ variant: 'default', title: 'Đã lưu trữ cuộc trò chuyện' })}>
                  Lưu trữ hội thoại
                </DropdownMenuItem>
                <DropdownMenuItem danger onClick={() => toast({ variant: 'default', title: 'Đã xóa hội thoại' })}>
                  Xóa cuộc trò chuyện
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Search Bar in Chat (Toggleable) */}
        {searchInChat && (
          <div className="p-2 bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 flex items-center gap-2">
            <Search size={14} className="text-neutral-400 ml-2" />
            <input
              type="text"
              value={chatSearchKeyword}
              onChange={(e) => setChatSearchKeyword(e.target.value)}
              placeholder="Tìm kiếm nội dung tin nhắn trong cuộc trò chuyện này..."
              className="flex-1 bg-surface border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-1.5 text-xs outline-hidden focus:border-brand-500 text-neutral-900 dark:text-neutral-100"
              autoFocus
            />
            {chatSearchKeyword && (
              <button
                type="button"
                onClick={() => setChatSearchKeyword('')}
                className="p-1 text-neutral-400 hover:text-neutral-700"
              >
                <X size={14} />
              </button>
            )}
          </div>
        )}

        {/* Invitation Decision Banner (C10.4) */}
        {isPendingInvitation && (
          <div className="p-3 bg-brand-50/80 border-b border-brand-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            {isSenderOfInvitation ? (
              <div className="flex items-center gap-2 text-brand-800">
                <Sparkles size={16} className="text-brand-600 shrink-0" />
                <span>
                  <strong>Đang chờ chấp nhận:</strong> Bạn có thể gửi thêm tin nhắn sau khi người nhận đồng ý trò chuyện.
                </span>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 text-brand-800">
                  <Sparkles size={16} className="text-brand-600 shrink-0" />
                  <span>
                    <strong>Lời mời trò chuyện mới:</strong> Người gửi muốn kết nối trao đổi với bạn.
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => acceptInvitationMutation.mutate()}
                    loading={acceptInvitationMutation.isPending}
                    className="text-xs h-7"
                  >
                    Chấp nhận
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => declineInvitationMutation.mutate()}
                    loading={declineInvitationMutation.isPending}
                    className="text-xs h-7"
                  >
                    Từ chối
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Message Stream */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-neutral-50/50 dark:bg-[#18191a]">
          {filteredMessages.length === 0 ? (
            <div className="text-center py-12 text-xs text-neutral-400">
              {chatSearchKeyword
                ? `Không tìm thấy tin nhắn nào khớp với "${chatSearchKeyword}"`
                : 'Hãy gửi tin nhắn đầu tiên để bắt đầu cuộc trò chuyện!'}
            </div>
          ) : (
            filteredMessages.map((msg) => {
              const sender = seedUsers.find((u) => u.id === msg.senderId);
              const isMe = msg.senderId === user?.id;

              return (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  isMe={isMe}
                  senderName={conversation?.kind !== 'direct' ? sender?.fullName : undefined}
                  senderAvatarUrl={sender?.avatarUrl}
                />
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* ReadOnly banner */}
        {readOnly && (
          <div className="p-3 bg-neutral-100 dark:bg-neutral-800 border-t border-neutral-200 dark:border-neutral-700 text-xs text-neutral-600 dark:text-neutral-400 text-center flex items-center justify-center gap-1.5">
            <Lock size={14} /> {readOnlyReason}
          </div>
        )}

        {/* Messenger Rich Bottom Bar */}
        {!readOnly && (
          <div className="border-t border-neutral-200 dark:border-neutral-700 bg-surface dark:bg-[#242526] p-3 space-y-2 relative">
            {/* Pre-attached Image & File previews */}
            {(attachedImages.length > 0 || attachedFiles.length > 0) && (
              <div className="flex flex-wrap gap-2 pb-1">
                {attachedImages.map((img, idx) => (
                  <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden border border-neutral-200 group">
                    <img src={img} alt="preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setAttachedImages((prev) => prev.filter((_, i) => i !== idx))}
                      className="absolute top-1 right-1 w-4 h-4 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-black/80"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}

                {attachedFiles.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 p-1.5 pr-2 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs"
                  >
                    <Paperclip size={13} className="text-brand-600 shrink-0" />
                    <span className="font-medium truncate max-w-[120px]">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => setAttachedFiles((prev) => prev.filter((_, i) => i !== idx))}
                      className="text-neutral-400 hover:text-tier-danger-text"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Emoji Picker Popover */}
            {showEmojiPicker && (
              <div className="absolute bottom-full left-4 mb-2 bg-surface dark:bg-[#242526] border border-neutral-200 dark:border-neutral-700 rounded-2xl p-3 shadow-xl z-20 w-72 grid grid-cols-8 gap-2">
                {EMOJI_LIST.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => handleEmojiClick(emoji)}
                    className="text-lg hover:scale-130 transition-transform p-1 rounded-md hover:bg-neutral-100 dark:hover:bg-[#3a3b3c] flex items-center justify-center cursor-pointer"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}

            {/* Input & Action buttons row */}
            <form onSubmit={handleSendMessage} className="flex items-end gap-2">
              {/* Attachment Triggers */}
              <div className="flex items-center gap-0.5 text-neutral-500 pb-1">
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-[#3a3b3c] text-neutral-500 dark:text-[#b0b3b8] hover:text-[#0084ff] dark:hover:text-[#0084ff] transition-colors"
                  title="Đính kèm ảnh"
                >
                  <ImageIcon size={19} />
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-[#3a3b3c] text-neutral-500 dark:text-[#b0b3b8] hover:text-[#0084ff] dark:hover:text-[#0084ff] transition-colors"
                  title="Đính kèm tệp tài liệu"
                >
                  <Paperclip size={19} />
                </button>
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className={cn(
                    'p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-[#3a3b3c] transition-colors',
                    showEmojiPicker ? 'text-[#0084ff] bg-brand-50 dark:bg-[#3a3b3c]' : 'text-neutral-500 dark:text-[#b0b3b8] hover:text-[#0084ff] dark:hover:text-[#0084ff]'
                  )}
                  title="Chọn biểu cảm emoji"
                >
                  <Smile size={19} />
                </button>
              </div>

              {/* Input Box */}
              <div className="flex-1 min-w-0 bg-neutral-100 dark:bg-[#3a3b3c] hover:bg-neutral-200/80 dark:hover:bg-[#4e4f50] focus-within:bg-surface dark:focus-within:bg-[#3a3b3c] focus-within:ring-2 focus-within:ring-[#0084ff]/40 rounded-3xl border border-transparent transition-all px-4 py-2">
                <textarea
                  ref={textareaRef}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Nhập tin nhắn... (Enter gửi, Shift+Enter xuống dòng)"
                  rows={1}
                  disabled={isPendingInvitation && isSenderOfInvitation}
                  className="w-full text-xs sm:text-sm text-neutral-900 dark:text-[#e4e6eb] placeholder:text-neutral-400 dark:placeholder:text-[#b0b3b8] bg-transparent border-none outline-hidden resize-none max-h-24 leading-relaxed"
                />
              </div>

              {/* Send or Quick Like button */}
              <div className="pb-0.5">
                {!inputText.trim() && attachedImages.length === 0 && attachedFiles.length === 0 ? (
                  <button
                    type="button"
                    onClick={handleSendQuickLike}
                    className="p-2.5 rounded-full hover:bg-neutral-100 dark:hover:bg-[#3a3b3c] text-[#0084ff] hover:text-[#0073e6] transition-transform active:scale-125 cursor-pointer text-lg leading-none"
                    title="Gửi nhanh biểu tượng thích"
                  >
                    {customEmoji === '👍' ? (
                      <ThumbsUp size={20} className="fill-current" />
                    ) : (
                      <span>{customEmoji}</span>
                    )}
                  </button>
                ) : (
                  <Button
                    type="submit"
                    size="sm"
                    variant="primary"
                    loading={sendMutation.isPending}
                    className="rounded-full w-9 h-9 p-0 flex items-center justify-center bg-[#0084ff] hover:bg-[#0073e6] text-white shadow-xs"
                  >
                    <Send size={15} />
                  </Button>
                )}
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Right Sidebar: Thông tin đoạn chat (Desktop inline, Mobile overlay drawer) */}
      {showInfoSidebar && conversation && (
        <>
          {/* Desktop inline sidebar */}
          <ConversationInfoSidebar
            conversation={conversation}
            messages={messages}
            onSearchClick={() => setSearchInChat(true)}
            onEmojiChange={(emoji) => setCustomEmoji(emoji)}
            onClose={() => setShowInfoSidebar(false)}
            className="hidden lg:flex w-80 shrink-0"
          />

          {/* Mobile slide-over drawer */}
          <div className="fixed inset-0 z-50 lg:hidden flex justify-end">
            <div
              className="fixed inset-0 bg-neutral-900/40 backdrop-blur-xs"
              onClick={() => setShowInfoSidebar(false)}
            />
            <div className="relative w-80 max-w-full bg-surface h-full shadow-2xl z-10 flex flex-col">
              <div className="p-3 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
                <span className="font-bold text-xs text-neutral-900 dark:text-neutral-100">Chi tiết cuộc trò chuyện</span>
                <button
                  type="button"
                  onClick={() => setShowInfoSidebar(false)}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <ConversationInfoSidebar
                  conversation={conversation}
                  messages={messages}
                  onSearchClick={() => {
                    setShowInfoSidebar(false);
                    setSearchInChat(true);
                  }}
                  onEmojiChange={(emoji) => setCustomEmoji(emoji)}
                  onClose={() => setShowInfoSidebar(false)}
                  className="w-full border-none"
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
