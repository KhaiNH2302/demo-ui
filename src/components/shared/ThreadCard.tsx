import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { Badge } from '@/components/ui/Badge';
import { AttachmentList } from '@/components/shared/AttachmentList';
import { ImageGallery } from '@/components/shared/ImageGallery';
import { useToast } from '@/components/ui/Toast';
import { useAuthStore } from '@/store/authStore';
import { useViewer } from '@/lib/viewer';
import { useGuardedAction } from '@/lib/guestGate';
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
  Pencil,
  Trash2,
  Flag,
  Download,
} from 'lucide-react';
import type { KnowledgePost } from '@/types/entities';

export interface ThreadCardProps {
  post: KnowledgePost;
  variant?: 'feed' | 'detail' | 'reply';
  density?: 'default' | 'compact';
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
  density = 'default',
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
  const viewer = useViewer();
  const guard = useGuardedAction();
  const { toast } = useToast();

  const [liked, setLiked] = useState<boolean>(post.likedByMe || false);
  const [likesCount, setLikesCount] = useState<number>(post.likesCount || 0);
  const [saved, setSaved] = useState<boolean>(post.savedByMe || false);
  const [isExpanded, setIsExpanded] = useState<boolean>(variant === 'detail');

  const author = seedUsers.find((u) => u.id === post.authorId) || {
    id: post.authorId,
    fullName: post.authorName || 'Sinh viên FPTU',
    major: 'Kỹ thuật phần mềm',
    school: 'Đại học FPT',
    avatarUrl: undefined,
  };

  const isMine = user?.id === post.authorId;
  const isSolved = post.isSolved;
  const isPending = post.status === 'PendingReview' || post.status === 'pending_review';
  const isRejected = post.status === 'Rejected' || post.status === 'rejected';
  const canOpenProfile = viewer.can('profile.open');

  // Split first line for headline styling if not given title
  const rawContent = post.contentMd || post.content || '';
  const lines = rawContent.split('\n');
  const firstLine = post.title || lines[0]?.replace(/^[#*`_\s]+/, '') || '';
  const remainingLines = post.title ? rawContent : lines.slice(1).join('\n').trim();

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    guard('like_post', () => {
      const nextLiked = !liked;
      setLiked(nextLiked);
      setLikesCount((prev) => (nextLiked ? prev + 1 : Math.max(0, prev - 1)));
      if (onLikeToggle) {
        onLikeToggle(post.id, nextLiked);
      }
    })();
  };

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    guard('bookmark_post', () => {
      const nextSaved = !saved;
      setSaved(nextSaved);
      toast({
        variant: 'default',
        title: nextSaved ? 'Đã lưu thread vào bộ sưu tập' : 'Đã bỏ lưu thread',
      });
      if (onSaveToggle) {
        onSaveToggle(post.id, nextSaved);
      }
    })();
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
    } else if (variant === 'detail') {
      guard('comment', () => {})();
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

  const isCompact = density === 'compact';
  const isLongContent = remainingLines.length > 280 || lines.length > 6;

  return (
    <div
      onClick={handleCardClick}
      className={cn(
        'group flex gap-3.5 border-b border-neutral-100 transition-colors',
        isCompact ? 'py-3 gap-3' : 'py-4',
        variant === 'feed' && 'cursor-pointer hover:bg-neutral-50/60 -mx-3 px-3 rounded-lg',
        className
      )}
    >
      {/* Left Avatar Column with optional vertical connector */}
      <div className="flex flex-col items-center shrink-0" onClick={(e) => e.stopPropagation()}>
        <UserAvatar
          user={{
            id: author.id,
            fullName: author.fullName,
            avatarUrl: author.avatarUrl,
          }}
          linkToProfile
          size={variant === 'reply' || isCompact ? 'sm' : 'md'}
        />
        {showThreadLine && (
          <div className="w-0.5 flex-1 bg-neutral-200 mt-2 rounded-full min-h-[24px]" />
        )}
      </div>

      {/* Right Content Column */}
      <div className={cn('flex-1 min-w-0', isCompact ? 'space-y-1.5' : 'space-y-2')}>
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
            {canOpenProfile ? (
              <Link
                to={`/users/${author.id}`}
                onClick={(e) => e.stopPropagation()}
                className="font-semibold text-neutral-900 hover:text-brand-600 transition-colors truncate"
              >
                {author.fullName}
              </Link>
            ) : (
              <span className="font-semibold text-neutral-900 truncate">
                {author.fullName}
              </span>
            )}
            <span
              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0"
              title="Sinh viên đã xác minh tài khoản FPT"
            >
              <CheckCircle2 size={10} className="text-emerald-600" />
              Đã xác minh
            </span>
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
          {!isCompact && (
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
                        onClick={() => (onEdit ? onEdit(post) : navigate(`/knowledge/${post.id}`))}
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
                      <DropdownMenuItem onClick={(e) => handleSave(e as unknown as React.MouseEvent)}>
                        <Bookmark size={14} /> {saved ? 'Bỏ lưu bài viết' : 'Lưu bài viết'}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => handleShare(e as unknown as React.MouseEvent)}>
                        <Share2 size={14} /> Sao chép liên kết
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        danger
                        onClick={guard('report', () =>
                          onReport ? onReport(post.id) : navigate(`/knowledge/${post.id}`)
                        )}
                      >
                        <Flag size={14} /> Báo cáo vi phạm
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
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
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer">
                  [{post.subject}]
                </span>
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
        <div className="space-y-1 text-xs sm:text-sm text-neutral-800 leading-relaxed">
          {firstLine && (
            <p
              className={cn(
                'font-semibold text-neutral-900 leading-snug',
                isCompact ? 'text-sm line-clamp-1' : 'text-sm sm:text-base'
              )}
            >
              {firstLine}
            </p>
          )}

          {remainingLines && (
            <div>
              <p
                className={cn(
                  'whitespace-pre-line leading-relaxed text-neutral-700',
                  isCompact
                    ? 'text-xs line-clamp-2'
                    : !isExpanded && variant === 'feed' && isLongContent && 'line-clamp-4'
                )}
              >
                {remainingLines}
              </p>
              {!isCompact && !isExpanded && variant === 'feed' && isLongContent && (
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

        {/* Image Gallery with Lightbox (SCS_UI_Plan.md § 19) */}
        {!isCompact &&
          ((post.gallery && post.gallery.length > 0) ||
            (post.images && post.images.length > 0)) && (
            <div className="pt-1" onClick={(e) => e.stopPropagation()}>
              <ImageGallery
                images={
                  post.gallery && post.gallery.length > 0
                    ? post.gallery
                    : (post.images || []).map((url, idx) => ({
                        id: `${post.id}-img-${idx}`,
                        url,
                      }))
                }
              />
            </div>
          )}

        {/* Attachments Preview */}
        {!isCompact && post.attachments && post.attachments.length > 0 && (
          <div className="pt-1">
            <AttachmentList items={post.attachments} />
          </div>
        )}

        {/* Tags */}
        {!isCompact && post.tags && post.tags.length > 0 && (
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
        <div
          className={cn(
            'flex items-center text-neutral-500',
            isCompact ? 'gap-4 pt-1' : 'gap-5 pt-2'
          )}
        >
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
              size={isCompact ? 15 : 17}
              className={cn(
                'transition-transform active:scale-125',
                liked && 'fill-current text-tier-danger-dot'
              )}
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
            <MessageCircle size={isCompact ? 15 : 17} />
            <span>{post.commentCount > 0 ? `${post.commentCount} câu trả lời` : '0 câu trả lời'}</span>
          </button>

          {/* Download Count when attachments exist */}
          {!isCompact && post.attachments && post.attachments.length > 0 && (
            <span className="flex items-center gap-1.5 text-xs text-neutral-500 font-medium">
              <Download size={15} className="text-neutral-400" />
              <span>{(post as any).downloadCount || (post.attachments.length * 14 + 6)} lượt tải</span>
            </span>
          )}

          {/* Save / Bookmark */}
          {!isCompact && (
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
                className={cn(
                  'transition-transform active:scale-125',
                  saved && 'fill-current text-brand-600'
                )}
              />
            </button>
          )}

          {/* Share */}
          {!isCompact && (
            <button
              type="button"
              onClick={handleShare}
              aria-label="Chia sẻ bài viết"
              className="flex items-center gap-1.5 text-xs font-medium hover:text-neutral-900 transition-colors p-1 -m-1 rounded-md hover:bg-neutral-100"
            >
              <Share2 size={17} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
