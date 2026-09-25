import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { seedUsers } from '@/mocks/data/users';
import { formatRelativeTime } from '@/lib/format';
import { cn } from '@/lib/cn';
import {
  User,
  Bell,
  BellOff,
  Search,
  ChevronDown,
  ChevronRight,
  Lock,
  ShieldCheck,
  Palette,
  Smile,
  FileText,
  Image as ImageIcon,
  Link2,
  Flag,
  UserX,
  LogOut,
  Download,
  ExternalLink,
  Users,
  Pin,
} from 'lucide-react';
import type { Conversation, Message } from '@/types/entities';

export interface ConversationInfoSidebarProps {
  conversation: Conversation;
  messages: Message[];
  onSearchClick?: () => void;
  onThemeChange?: (color: string) => void;
  onEmojiChange?: (emoji: string) => void;
  onReport?: () => void;
  onClose?: () => void;
  className?: string;
}

const THEME_COLORS = [
  { name: 'Xanh Brand (Mặc định)', value: 'bg-brand-500' },
  { name: 'Tím Indigo', value: 'bg-indigo-600' },
  { name: 'Xanh Emerald', value: 'bg-emerald-600' },
  { name: 'Hồng Rose', value: 'bg-rose-500' },
  { name: 'Cam Amber', value: 'bg-amber-500' },
];

const QUICK_EMOJIS = ['👍', '❤️', '🔥', '🎉', '💡', '🚀', '💯', '👏'];

export const ConversationInfoSidebar: React.FC<ConversationInfoSidebarProps> = ({
  conversation,
  messages,
  onSearchClick,
  onThemeChange,
  onEmojiChange,
  onReport,
  onClose,
  className,
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isMuted, setIsMuted] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    info: true,
    customize: false,
    media: true,
    privacy: false,
  });

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const participants = conversation.participantIds.map(
    (id) =>
      seedUsers.find((u) => u.id === id) || {
        id,
        fullName: 'Thành viên SCS',
        avatarUrl: undefined,
        major: 'Sinh viên FPTU',
      }
  );

  // Extract shared images
  const sharedImages: string[] = [];
  messages.forEach((m) => {
    if (m.images && m.images.length > 0) {
      sharedImages.push(...m.images);
    }
  });

  // Extract shared files
  const sharedFiles: { name: string; url: string; size?: number }[] = [];
  messages.forEach((m) => {
    if (m.attachments && m.attachments.length > 0) {
      sharedFiles.push(...m.attachments);
    }
  });

  // Extract shared links
  const sharedLinks: string[] = [];
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  messages.forEach((m) => {
    const matches = m.content.match(urlRegex);
    if (matches) {
      matches.forEach((link) => {
        if (!sharedLinks.includes(link)) sharedLinks.push(link);
      });
    }
  });

  const handleMuteToggle = () => {
    setIsMuted(!isMuted);
    toast({
      variant: 'default',
      title: !isMuted ? 'Đã tắt thông báo cuộc trò chuyện' : 'Đã bật thông báo',
    });
  };

  const isDirect = conversation.kind === 'direct';
  const directPartner = isDirect
    ? participants.find((p) => p.id !== 'usr_student_01') || participants[0]
    : null;

  return (
    <div
      className={cn(
        'w-80 shrink-0 border-l border-neutral-200 bg-white flex flex-col h-full overflow-hidden',
        className
      )}
    >
      {/* 1. Header Profile Box (Fixed at top of sidebar) */}
      <div className="p-5 flex flex-col items-center text-center space-y-2.5 shrink-0 border-b border-neutral-100 bg-white">
        <div className="relative">
          <Avatar
            src={conversation.avatarUrl || directPartner?.avatarUrl}
            name={conversation.title || 'Chat'}
            size="xl"
            className="w-18 h-18 ring-4 ring-neutral-100 shadow-xs"
          />
          <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-tier-success-dot border-2 border-white" />
        </div>

        <div>
          <h3 className="text-sm font-bold text-neutral-900 leading-snug truncate max-w-[240px]">
            {conversation.title || directPartner?.fullName || 'Hội thoại'}
          </h3>
          <div className="pt-1 flex justify-center">
            <span className="inline-flex items-center gap-1.5 text-[11px] text-neutral-600 bg-neutral-100 px-2.5 py-0.5 rounded-full font-medium">
              <ShieldCheck size={12} className="text-brand-600" />
              <span>Được bảo vệ bởi SCS</span>
            </span>
          </div>
        </div>

        {/* Action Circles (Trang cá nhân, Tắt thông báo, Tìm kiếm) */}
        <div className="flex items-center justify-center gap-4 pt-1.5 w-full">
          {/* Profile / Workspace Link */}
          <div className="flex flex-col items-center gap-1 text-center">
            <button
              type="button"
              onClick={() => {
                if (isDirect && directPartner) {
                  navigate(`/users/${directPartner.id}`);
                } else if (conversation.kind === 'club') {
                  navigate('/clubs/club_01/workspace/overview');
                } else if (conversation.kind === 'group') {
                  navigate('/groups/grp_01');
                } else {
                  navigate('/me');
                }
              }}
              className="w-9 h-9 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700 flex items-center justify-center transition-colors cursor-pointer"
              title="Trang cá nhân / Workspace"
            >
              <User size={16} />
            </button>
            <span className="text-[10px] text-neutral-500 font-medium">
              {isDirect ? 'Hồ sơ' : 'Chi tiết'}
            </span>
          </div>

          {/* Mute Notifications */}
          <div className="flex flex-col items-center gap-1 text-center">
            <button
              type="button"
              onClick={handleMuteToggle}
              className={cn(
                'w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer',
                isMuted
                  ? 'bg-tier-danger-bg text-tier-danger-text'
                  : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
              )}
              title={isMuted ? 'Bật lại thông báo' : 'Tắt thông báo'}
            >
              {isMuted ? <BellOff size={16} /> : <Bell size={16} />}
            </button>
            <span className="text-[10px] text-neutral-500 font-medium">
              {isMuted ? 'Đã tắt' : 'Thông báo'}
            </span>
          </div>

          {/* Search in chat */}
          <div className="flex flex-col items-center gap-1 text-center">
            <button
              type="button"
              onClick={onSearchClick}
              className="w-9 h-9 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700 flex items-center justify-center transition-colors cursor-pointer"
              title="Tìm kiếm tin nhắn"
            >
              <Search size={16} />
            </button>
            <span className="text-[10px] text-neutral-500 font-medium">Tìm kiếm</span>
          </div>
        </div>
      </div>

      {/* Scrollable Content Body */}
      <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-neutral-100">
        {/* 2. Accordion: Thông tin về đoạn chat */}
        <div className="py-2">
          <button
            type="button"
            onClick={() => toggleSection('info')}
            className="w-full flex items-center justify-between p-3.5 text-xs font-bold text-neutral-800 hover:bg-neutral-50 transition-colors"
          >
            <span>Thông tin về đoạn chat</span>
            {openSections.info ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>

        {openSections.info && (
          <div className="px-4 pb-3 space-y-3">
            {/* Participants list */}
            <div>
              <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block mb-2">
                Thành viên ({participants.length})
              </span>
              <div className="space-y-2">
                {participants.map((p, idx) => (
                  <div
                    key={p.id}
                    onClick={() => navigate(`/users/${p.id}`)}
                    className="flex items-center justify-between p-1.5 rounded-lg hover:bg-neutral-50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar src={p.avatarUrl} name={p.fullName} size="sm" />
                      <div className="min-w-0">
                        <span className="text-xs font-semibold text-neutral-900 block truncate">
                          {p.fullName}
                        </span>
                        <span className="text-[10px] text-neutral-400 block truncate">
                          {idx === 0 ? 'Trưởng nhóm' : 'Thành viên'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Context note */}
            <div className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-200/80 text-[11px] text-neutral-600 space-y-1">
              <span className="font-semibold text-neutral-800 block">Mục đích kết nối:</span>
              <p>
                {conversation.kind === 'swap'
                  ? 'Trao đổi thủ tục hoán đổi lớp học phần trong kỳ.'
                  : conversation.kind === 'mentoring'
                  ? 'Học tập và hướng dẫn kỹ năng chuyên ngành cùng Mentor.'
                  : conversation.kind === 'club'
                  ? 'Kênh trao đổi hoạt động và sự kiện nội bộ CLB.'
                  : conversation.kind === 'group'
                  ? 'Thảo luận tiến độ đồ án và phân chia công việc nhóm.'
                  : 'Trò chuyện kết nối học tập trực tiếp.'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 3. Accordion: Tùy chỉnh đoạn chat */}
      <div className="py-2">
        <button
          type="button"
          onClick={() => toggleSection('customize')}
          className="w-full flex items-center justify-between p-3.5 text-xs font-bold text-neutral-800 hover:bg-neutral-50 transition-colors"
        >
          <span>Tùy chỉnh đoạn chat</span>
          {openSections.customize ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>

        {openSections.customize && (
          <div className="px-4 pb-3 space-y-3">
            {/* Quick Emoji selection */}
            <div>
              <span className="text-[11px] font-semibold text-neutral-500 block mb-1.5">
                Biểu tượng cảm xúc nhanh:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => {
                      if (onEmojiChange) onEmojiChange(emoji);
                      toast({ variant: 'success', title: `Đã đổi biểu tượng nhanh thành ${emoji}` });
                    }}
                    className="w-8 h-8 rounded-lg bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-sm transition-transform active:scale-95"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Theme colors */}
            <div>
              <span className="text-[11px] font-semibold text-neutral-500 block mb-1.5">
                Màu chủ đề:
              </span>
              <div className="flex gap-2">
                {THEME_COLORS.map((col) => (
                  <button
                    key={col.value}
                    type="button"
                    onClick={() => {
                      if (onThemeChange) onThemeChange(col.value);
                      toast({ variant: 'success', title: `Đã áp dụng chủ đề ${col.name}` });
                    }}
                    className={cn(
                      'w-6 h-6 rounded-full transition-transform hover:scale-115 active:scale-95',
                      col.value
                    )}
                    title={col.name}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. Accordion: File phương tiện và file */}
      <div className="py-2">
        <button
          type="button"
          onClick={() => toggleSection('media')}
          className="w-full flex items-center justify-between p-3.5 text-xs font-bold text-neutral-800 hover:bg-neutral-50 transition-colors"
        >
          <span>File phương tiện và file</span>
          {openSections.media ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>

        {openSections.media && (
          <div className="px-4 pb-3 space-y-4">
            {/* Media Gallery */}
            <div>
              <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block mb-2">
                Ảnh ({sharedImages.length})
              </span>
              {sharedImages.length === 0 ? (
                <p className="text-[11px] text-neutral-400 italic">Chưa có hình ảnh nào được gửi</p>
              ) : (
                <div className="grid grid-cols-3 gap-1.5 rounded-lg overflow-hidden">
                  {sharedImages.slice(0, 6).map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt="shared-media"
                      className="w-full h-16 object-cover rounded-md border border-neutral-100 hover:opacity-85 transition-opacity cursor-pointer"
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Shared Documents */}
            <div>
              <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block mb-2">
                Tài liệu & File ({sharedFiles.length})
              </span>
              {sharedFiles.length === 0 ? (
                <p className="text-[11px] text-neutral-400 italic">Chưa có tệp tài liệu nào</p>
              ) : (
                <div className="space-y-1.5">
                  {sharedFiles.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded-lg bg-neutral-50 border border-neutral-200 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText size={14} className="text-brand-600 shrink-0" />
                        <span className="font-medium text-neutral-800 truncate block">
                          {file.name}
                        </span>
                      </div>
                      <a
                        href={file.url}
                        download={file.name}
                        className="p-1 text-neutral-400 hover:text-neutral-700 transition-colors shrink-0"
                      >
                        <Download size={13} />
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Shared Links */}
            <div>
              <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block mb-2">
                Liên kết ({sharedLinks.length})
              </span>
              {sharedLinks.length === 0 ? (
                <p className="text-[11px] text-neutral-400 italic">Chưa có liên kết nào</p>
              ) : (
                <div className="space-y-1.5">
                  {sharedLinks.map((link, idx) => (
                    <a
                      key={idx}
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2 rounded-lg bg-neutral-50 border border-neutral-200 text-[11px] text-brand-600 hover:underline truncate block"
                    >
                      <Link2 size={13} className="shrink-0 text-neutral-500" />
                      <span className="truncate">{link}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 5. Accordion: Quyền riêng tư và hỗ trợ */}
      <div className="py-2">
        <button
          type="button"
          onClick={() => toggleSection('privacy')}
          className="w-full flex items-center justify-between p-3.5 text-xs font-bold text-neutral-800 hover:bg-neutral-50 transition-colors"
        >
          <span>Quyền riêng tư và hỗ trợ</span>
          {openSections.privacy ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>

        {openSections.privacy && (
          <div className="px-4 pb-3 space-y-1.5 text-xs">
            <button
              type="button"
              onClick={() => {
                if (onReport) onReport();
                else toast({ variant: 'default', title: 'Đã mở báo cáo vi phạm' });
              }}
              className="w-full flex items-center gap-2.5 p-2 rounded-lg text-amber-600 hover:bg-amber-50 transition-colors text-left font-medium"
            >
              <Flag size={15} />
              <span>Báo cáo đoạn chat</span>
            </button>

            {isDirect ? (
              <button
                type="button"
                onClick={() => {
                  toast({ variant: 'default', title: 'Đã chặn người dùng này' });
                }}
                className="w-full flex items-center gap-2.5 p-2 rounded-lg text-tier-danger-text hover:bg-tier-danger-bg transition-colors text-left font-medium"
              >
                <UserX size={15} />
                <span>Chặn người dùng</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  toast({ variant: 'default', title: 'Đã rời khỏi nhóm trò chuyện' });
                }}
                className="w-full flex items-center gap-2.5 p-2 rounded-lg text-tier-danger-text hover:bg-tier-danger-bg transition-colors text-left font-medium"
              >
                <LogOut size={15} />
                <span>Rời khỏi nhóm</span>
              </button>
            )}
          </div>
        )}
      </div>
      </div>
    </div>
  );
};
