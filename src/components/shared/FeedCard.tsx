import React from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/cn';

export type FeedCardKind = 'knowledge' | 'group-suggestion' | 'event' | 'swap-match' | 'mentor-post';
export type FeedCardVariant = 'post' | 'suggestion';

const kindDefaultVariant: Record<FeedCardKind, FeedCardVariant> = {
  knowledge: 'post',
  event: 'post',
  'group-suggestion': 'suggestion',
  'swap-match': 'suggestion',
  'mentor-post': 'suggestion',
};

export interface FeedCardAuthor {
  name: string;
  avatarUrl?: string;
  subtitle?: string;
  time?: string;
}

export interface FeedCardProps {
  kind: FeedCardKind;
  /** 'post' = nội dung cộng đồng thật, header giống bài đăng (avatar+tên+giờ).
   *  'suggestion' = gốc gợi ý AI, chỉ 1 dòng nhỏ "✨ ...", không chiếm header.
   *  Mặc định suy ra từ `kind` nếu không truyền. */
  variant?: FeedCardVariant;
  /** Dùng khi variant='post' — header trông như 1 bài đăng thật, không phải hàng hệ thống. */
  author?: FeedCardAuthor;
  /** Dùng khi variant='suggestion' — dòng nhỏ phía trên, KHÔNG phải badge to. */
  aiTag?: string;
  children?: React.ReactNode;
  actions?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export const FeedCard: React.FC<FeedCardProps> = ({
  kind,
  variant,
  author,
  aiTag,
  children,
  actions,
  onClick,
  className,
}) => {
  const resolvedVariant = variant || kindDefaultVariant[kind] || 'post';

  return (
    <Card
      onClick={onClick}
      className={cn(
        'overflow-hidden rounded-2xl border border-neutral-200 bg-white transition-all shadow-xs hover:border-neutral-300 hover:shadow-md',
        onClick && 'cursor-pointer',
        className
      )}
    >
      <CardContent className="p-5 space-y-3">
        {/* Header: 2 kiểu hoàn toàn khác nhau — không dùng chung 1 "thanh phân loại"
            cho cả nội dung cộng đồng thật lẫn gợi ý hệ thống, đó chính là điều khiến
            feed trước đây đọc như 1 danh sách thông báo thay vì bảng tin. */}
        {resolvedVariant === 'post' && author ? (
          <div className="flex items-center gap-2.5">
            <Avatar src={author.avatarUrl} name={author.name} size="md" />
            <div className="min-w-0">
              <h4 className="text-sm font-bold text-neutral-900 truncate">{author.name}</h4>
              {(author.subtitle || author.time) && (
                <p className="text-[11px] text-neutral-400 truncate">
                  {[author.subtitle, author.time].filter(Boolean).join(' • ')}
                </p>
              )}
            </div>
          </div>
        ) : resolvedVariant === 'suggestion' ? (
          <div className="flex items-center gap-1.5 text-xs font-medium text-accent-700">
            <Sparkles size={13} />
            <span>{aiTag || 'Gợi ý bởi AI'}</span>
          </div>
        ) : null}

        {children}
      </CardContent>

      {actions && (
        <div className="flex items-center justify-between border-t border-neutral-100 bg-neutral-50/40 px-5 py-3 text-xs">
          {actions}
        </div>
      )}
    </Card>
  );
};

export default FeedCard;
