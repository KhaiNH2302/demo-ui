import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { AttachmentList } from '@/components/shared/AttachmentList';
import { useToast } from '@/components/ui/Toast';
import { useAuthStore } from '@/store/authStore';
import { formatRelativeTime } from '@/lib/format';
import { seedUsers } from '@/mocks/data/users';
import { cn } from '@/lib/cn';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/DropdownMenu';
import {
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  MoreHorizontal,
  CheckCircle2,
  Lock,
  Pencil,
  Trash2,
  Flag,
  FileText,
  HelpCircle,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import type { KnowledgePost, Comment } from '@/types/entities';

export interface ThreadCardProps {
  post: KnowledgePost;
  variant?: 'feed' | 'detail' | 'reply';
  showThreadLine?: boolean;
  onOpen?: () => void;
  onLikeToggle?: (postId: string, liked: boolean) => void;
  onSaveToggle?: (postId: string, saved: boolean) => void;
  onReply?: (post: KnowledgePost) => void;
  onEdit?: (post: KnowledgePost) => void;
  onDelete?: (postId: string) => void;
  onReport?: (postId: string) => void;
  className?: string;
}

export const ThreadCard: React.FC<ThreadCardProps> = ({
  post,
  variant = 'feed',
  showThreadLine = false,
  onOpen,
  onLikeToggle,
  onSaveToggle,
  onReply,
  onEdit,
  onDelete,
  onReport,
  className,
}) => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { toast } = useToast();

  const [liked, setLiked] = useState<boolean>(post.likedByMe || false);
  const [likesCount, setLikesCount] = useState<number>(post.likesCount || 0);
  const [saved, setSaved] = useState<boolean>(post.savedByMe || false);
  const [isExpanded, setIsExpanded] = useState<boolean>(variant === 'detail');

  const author = seedUsers.find((u) => u.id === post.authorId) || {
    id: post.authorId,
    fullName: 'Sinh viên FPTU',
    major: 'Kỹ thuật phần mềm',
    school: 'Đại học FPT',
    avatarUrl: undefined,
  };

  const isMine = user?.id === post.authorId;
  const isQuestion = post.type === 'question';
  const isSolved = post.isSolved;
  const isPending = post.status === 'PendingReview' || post.status === 'pending_review';
  const isRejected = post.status === 'Rejected' || post.status === 'rejected';

  // Split first line for headline styling if not given title
  const rawContent = post.contentMd || post.content || '';
  const lines = rawContent.split('\n');
  const firstLine = post.title || lines[0]?.replace(/^[#*`_\s]+/, '') || '';
  const remainingLines = post.title ? rawContent : lines.slice(1).join('\n').trim();

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikesCount((prev) => (nextLiked ? prev + 1 : Math.max(0, prev - 1)));
    if (onLikeToggle) {
      onLikeToggle(post.id, nextLiked);
    }
  };

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextSaved = !saved;
    setSaved(nextSaved);
    toast({
      variant: 'default',
      title: nextSaved ? 'Đã lưu thread vào bộ sưu tập' : 'Đã bỏ lưu thread',
    });
    if (onSaveToggle) {
      onSaveToggle(post.id, nextSaved);
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/knowledge/${post.id}`;
    navigator.clipboard.writeText(url);
    toast({ variant: 'success', title: 'Đã sao chép liên kết bài viết' });
  };

  const handleReplyClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onReply) {
      onReply(post);
    } else {
      navigate(`/knowledge/${post.id}`);
    }
  };

  const handleSubjectClick = (e: React.MouseEvent, subj: string) => {
    e.stopPropagation();
    navigate(`/knowledge?subject=${subj}`);
  };

  const handleCardClick = () => {
    if (variant === 'feed') {
      if (onOpen) onOpen();
      else navigate(`/knowledge/${post.id}`);
    }
  };

  const isLongContent = remainingLines.length > 280 || lines.length > 6;

  return (
    <div
      onClick={handleCardClick}
      className={cn(
        'group flex gap-3.5 py-4 border-b border-neutral-100 transition-colors',
        variant === 'feed' && 'cursor-pointer hover:bg-neutral-50/60 -mx-3 px-3 rounded-lg',
        className
      )}
    >
      {/* Left Avatar Column with optional vertical connector */}
      <div className="flex flex-col items-center shrink-0">
        <Link
          to={`/users/${author.id}`}
          onClick={(e) => e.stopPropagation()}
          className="focus:outline-hidden"
        >
          <Avatar
            src={author.avatarUrl}
            name={author.fullName}
            size={variant === 'reply' ? 'sm' : 'md'}
            className="ring-1 ring-neutral-200 hover:ring-brand-500 transition-all"
          />
        </Link>
        {showThreadLine && (
          <div className="w-0.5 flex-1 bg-neutral-200 mt-2 rounded-full min-h-[24px]" />
        )}
      </div>

      {/* Right Content Column */}
      <div className="flex-1 min-w-0 space-y-2">
        {/* Moderation Banners */}
        {isPending && (
          <div className="bg-tier-attention-bg border border-tier-attention-border rounded-lg px-3 py-2 text-xs text-tier-attention-text flex items-center justify-between">
            <span>
              <strong>Đang chờ kiểm duyệt</strong> — chỉ bạn nhìn thấy bài này.
            </span>
            <Link
              to="/help#bai-cho-duyet"
              onClick={(e) => e.stopPropagation()}
              className="text-brand-600 hover:underline font-medium"
            >
              Tìm hiểu →
            </Link>
          </div>
        )}

        {isRejected && post.rejectReason && (
          <div className="bg-tier-danger-bg border border-tier-danger-border rounded-lg px-3 py-2 text-xs text-tier-danger-text flex items-center justify-between">
            <span>
              <strong>Bị từ chối:</strong> {post.rejectReason}
            </span>
            {onEdit && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(post);
                }}
                className="font-semibold underline ml-2 hover:opacity-80"
              >
                Sửa & gửi lại
              </button>
            )}
          </div>
        )}

        {/* Author Header & Menu */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
            <Link
              to={`/users/${author.id}`}
              onClick={(e) => e.stopPropagation()}
              className="font-semibold text-neutral-900 hover:text-brand-600 transition-colors truncate"
            >
              {author.fullName}
            </Link>
            {author.major && (
              <>
                <span className="text-neutral-300">·</span>
                <span className="text-neutral-500 truncate">{author.major}</span>
              </>
            )}
            <span className="text-neutral-300">·</span>
            <span className="text-neutral-400 shrink-0">{formatRelativeTime(post.createdAt)}</span>
          </div>

          {/* Menu ⋮ */}
          <div onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
                  aria-label="Tùy chọn bài viết"
                >
                  <MoreHorizontal size={16} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {isMine ? (
                  <>
                    <DropdownMenuItem
                      onClick={() => onEdit ? onEdit(post) : navigate(`/knowledge/${post.id}`)}
                    >
                      <Pencil size={14} /> Chỉnh sửa
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleShare}>
                      <Share2 size={14} /> Sao chép liên kết
                    </DropdownMenuItem>
                    {onDelete && (
                      <DropdownMenuItem danger onClick={() => onDelete(post.id)}>
                        <Trash2 size={14} /> Xóa bài viết
                      </DropdownMenuItem>
                    )}
                  </>
                ) : (
                  <>
                    <DropdownMenuItem onClick={handleSave}>
                      <Bookmark size={14} /> {saved ? 'Bỏ lưu bài viết' : 'Lưu bài viết'}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleShare}>
                      <Share2 size={14} /> Sao chép liên kết
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      danger
                      onClick={() => (onReport ? onReport(post.id) : navigate(`/knowledge/${post.id}`))}
                    >
                      <Flag size={14} /> Báo cáo vi phạm
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Type and Subject Badges */}
        {variant !== 'reply' && (
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            <Badge tier="neutral" size="sm" className="font-medium text-[11px]">
              {post.type === 'question' && 'Hỏi đáp'}
              {post.type === 'document' && 'Tài liệu'}
              {post.type === 'discussion' && 'Chia sẻ'}
              {post.type === 'experience' && 'Kinh nghiệm'}
            </Badge>

            {post.subject && (
              <button
                type="button"
                onClick={(e) => handleSubjectClick(e, post.subject!)}
                className="focus:outline-hidden"
              >
                <Badge
                  tier="brand"
                  size="sm"
                  className="font-medium text-[11px] hover:bg-brand-100 transition-colors cursor-pointer"
                >
                  {post.subject}
                </Badge>
              </button>
            )}

            {isSolved && (
              <Badge tier="success" size="sm" className="gap-1 font-medium text-[11px]">
                <CheckCircle2 size={12} /> Đã giải đáp
              </Badge>
            )}
          </div>
        )}

        {/* Post Content */}
        <div className="space-y-1.5 text-xs sm:text-sm text-neutral-800 leading-relaxed">
          {firstLine && (
            <p className="font-semibold text-neutral-900 text-sm sm:text-base leading-snug">
              {firstLine}
            </p>
          )}

          {remainingLines && (
            <div>
              <p
                className={cn(
                  'whitespace-pre-line leading-relaxed text-neutral-700',
                  !isExpanded && variant === 'feed' && isLongContent && 'line-clamp-4'
                )}
              >
                {remainingLines}
              </p>
              {!isExpanded && variant === 'feed' && isLongContent && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsExpanded(true);
                  }}
                  className="text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline mt-1 cursor-pointer inline-block"
                >
                  Xem thêm
                </button>
              )}
            </div>
          )}
        </div>

        {/* Image Grid */}
        {post.images && post.images.length > 0 && (
          <div
            className={cn(
              'pt-1 gap-2',
              post.images.length === 1 && 'block',
              post.images.length === 2 && 'grid grid-cols-2',
              post.images.length >= 3 && 'grid grid-cols-2'
            )}
          >
            {post.images.slice(0, 4).map((img, idx) => (
              <div
                key={idx}
                className="overflow-hidden rounded-lg border border-neutral-200 bg-neutral-100 max-h-80"
              >
                <img
                  src={img}
                  alt={`attachment-${idx}`}
                  className="w-full h-full object-cover hover:scale-102 transition-transform duration-200"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        )}

        {/* Attachments Preview */}
        {post.attachments && post.attachments.length > 0 && (
          <div className="pt-1">
            <AttachmentList items={post.attachments} />
          </div>
        )}

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="text-[11px] font-medium text-neutral-500 bg-neutral-100 hover:bg-neutral-200 px-2 py-0.5 rounded transition-colors"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Interaction Action Row (Threads Style) */}
        <div className="flex items-center gap-5 pt-2 text-neutral-500">
          {/* Like */}
          <button
            type="button"
            onClick={handleLike}
            aria-label={`Thích (${likesCount})`}
            className={cn(
              'flex items-center gap-1.5 text-xs font-medium transition-colors p-1 -m-1 rounded-md hover:bg-neutral-100',
              liked ? 'text-tier-danger-dot font-semibold' : 'hover:text-neutral-900'
            )}
          >
            <Heart
              size={17}
              className={cn('transition-transform active:scale-125', liked && 'fill-current text-tier-danger-dot')}
            />
            {likesCount > 0 && <span>{likesCount}</span>}
          </button>

          {/* Reply */}
          <button
            type="button"
            onClick={handleReplyClick}
            aria-label={`Trả lời (${post.commentCount})`}
            className="flex items-center gap-1.5 text-xs font-medium hover:text-neutral-900 transition-colors p-1 -m-1 rounded-md hover:bg-neutral-100"
          >
            <MessageCircle size={17} />
            {post.commentCount > 0 && <span>{post.commentCount}</span>}
          </button>

          {/* Save / Bookmark */}
          <button
            type="button"
            onClick={handleSave}
            aria-label="Lưu bài viết"
            className={cn(
              'flex items-center gap-1.5 text-xs font-medium transition-colors p-1 -m-1 rounded-md hover:bg-neutral-100',
              saved ? 'text-brand-600 font-semibold' : 'hover:text-neutral-900'
            )}
          >
            <Bookmark
              size={17}
              className={cn('transition-transform active:scale-125', saved && 'fill-current text-brand-600')}
            />
          </button>

          {/* Share */}
          <button
            type="button"
            onClick={handleShare}
            aria-label="Chia sẻ bài viết"
            className="flex items-center gap-1.5 text-xs font-medium hover:text-neutral-900 transition-colors p-1 -m-1 rounded-md hover:bg-neutral-100"
          >
            <Share2 size={17} />
          </button>
        </div>
      </div>
    </div>
  );
};
