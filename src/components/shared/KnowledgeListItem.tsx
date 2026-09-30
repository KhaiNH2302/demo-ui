import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, Bookmark, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { formatRelativeTime } from '@/lib/format';
import { useGuardedAction } from '@/lib/guestGate';
import type { KnowledgePost } from '@/types/entities';

const categoryLabels: Record<string, string> = {
  knowledge: 'Chia sẻ kiến thức',
  study_experience: 'Kinh nghiệm học tập',
  internship: 'Thực tập',
  interview: 'Phỏng vấn',
  document: 'Tài liệu',
  tips: 'Tips & Tricks',
  career: 'Career',
  project: 'Dự án',
  qa: 'Hỏi đáp',
  mentor_senior: 'Mentor/Senior',
  discussion: 'Chia sẻ kiến thức',
  question: 'Hỏi đáp',
  experience: 'Kinh nghiệm',
};

interface KnowledgeListItemProps {
  post: KnowledgePost;
  onLikeToggle?: (id: string, liked: boolean) => void;
  onSaveToggle?: (id: string, saved: boolean) => void;
  showBookmark?: boolean;
}

export const KnowledgeListItem: React.FC<KnowledgeListItemProps> = ({
  post,
  onLikeToggle,
  onSaveToggle,
  showBookmark = true,
}) => {
  const guard = useGuardedAction();
  const categoryKey = post.category || (post.type ? post.type.toLowerCase() : 'knowledge');
  const categoryLabel = categoryLabels[categoryKey] || 'Chia sẻ';
  const subjectCode = post.subject || post.subjectCode || 'Chung';

  // Extract first line as title / bold header if not explicitly provided
  const rawContent = post.contentMd || post.content || '';
  const lines = rawContent.split('\n').filter((l) => l.trim().length > 0);
  const title = post.title || lines[0] || 'Chia sẻ kiến thức';
  const excerpt = post.title ? rawContent : lines.slice(1).join(' ');

  const likes = post.likesCount ?? post.upvotes ?? 0;
  const replies = post.commentCount ?? 0;

  return (
    <div className="group py-4 border-b border-neutral-100 last:border-b-0 flex items-start justify-between gap-4 transition-colors">
      <div className="flex-1 min-w-0 space-y-1.5">
        {/* Badges row: Category + Subject */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge tier="neutral" size="sm">
            {categoryLabel}
          </Badge>
          {subjectCode && subjectCode !== 'all' && (
            <Badge tier="brand" size="sm">
              {subjectCode}
            </Badge>
          )}
          {post.isSolved && (
            <Badge tier="success" size="sm" className="inline-flex items-center gap-1">
              <CheckCircle2 size={12} /> Đã giải đáp
            </Badge>
          )}
        </div>

        {/* Title / First line in bold */}
        <Link
          to={`/knowledge/${post.id}`}
          className="block font-semibold text-base text-neutral-900 hover:text-brand-600 transition-colors leading-snug"
        >
          {title}
        </Link>

        {/* Excerpt */}
        {excerpt && (
          <p className="text-sm text-neutral-600 line-clamp-2 leading-relaxed">
            {excerpt}
          </p>
        )}

        {/* Author & relative time meta */}
        <div className="flex items-center gap-2 text-xs text-neutral-500 pt-0.5">
          <span className="font-medium text-neutral-700">
            {post.authorName || 'Sinh viên'}
          </span>
          <span>·</span>
          <span>{formatRelativeTime(post.createdAt)}</span>
        </div>
      </div>

      {/* Right Stats & Actions */}
      <div className="flex items-center gap-3 text-sm text-neutral-500 shrink-0 pt-1">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            guard('like_post', () => {
              onLikeToggle?.(post.id, !post.likedByMe);
            })();
          }}
          className={`inline-flex items-center gap-1 hover:text-neutral-900 transition-colors cursor-pointer ${
            post.likedByMe ? 'text-tier-danger-dot font-medium' : ''
          }`}
          aria-label={`Thích (${likes})`}
        >
          <Heart
            size={16}
            className={post.likedByMe ? 'fill-current text-tier-danger-dot' : ''}
          />
          <span className="text-xs">{likes}</span>
        </button>

        <Link
          to={`/knowledge/${post.id}`}
          className="inline-flex items-center gap-1 hover:text-neutral-900 transition-colors"
          aria-label={`Trả lời (${replies})`}
        >
          <MessageCircle size={16} />
          <span className="text-xs">{replies}</span>
        </Link>

        {showBookmark && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              guard('bookmark_post', () => {
                onSaveToggle?.(post.id, !post.savedByMe);
              })();
            }}
            className={`transition-opacity md:opacity-0 md:group-hover:opacity-100 hover:text-brand-600 cursor-pointer ${
              post.savedByMe ? 'md:opacity-100 text-brand-600' : ''
            }`}
            aria-label="Lưu bài viết"
          >
            <Bookmark
              size={16}
              className={post.savedByMe ? 'fill-current text-brand-600' : ''}
            />
          </button>
        )}
      </div>
    </div>
  );
};

export default KnowledgeListItem;

