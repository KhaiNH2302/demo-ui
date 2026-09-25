import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, Users, GraduationCap } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { cn } from '@/lib/cn';

export interface DiscoverSuggestionItem {
  id: string;
  type: 'group' | 'mentor';
  title: string;
  subtitle?: string;
  avatarUrl?: string;
  score: number;
  reason: string;
  linkTo: string;
  tags?: string[];
}

export interface DiscoverCarouselProps {
  items: DiscoverSuggestionItem[];
  title?: string;
  className?: string;
}

/**
 * [C6] DiscoverCarousel — "Gợi ý cho bạn", cuộn ngang
 * Thay cho việc nhét toàn bộ gợi ý AI thành list dọc chiếm hết Home
 * (đúng pattern "Có thể bạn quan tâm" của mạng xã hội).
 */
export const DiscoverCarousel: React.FC<DiscoverCarouselProps> = ({
  items,
  title = 'Gợi ý AI cho bạn',
  className,
}) => {
  const navigate = useNavigate();

  if (!items || items.length === 0) return null;

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-sm font-bold text-neutral-900">
          <Sparkles size={16} className="text-accent-500" />
          <span>{title}</span>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => navigate('/discover')}
          className="text-xs text-brand-600 hover:text-brand-700 -mr-2"
        >
          Xem tất cả <ArrowRight size={13} className="ml-1" />
        </Button>
      </div>

      <div className="flex gap-3.5 overflow-x-auto pb-2 -mx-1 px-1 no-scrollbar">
        {items.map((item) => (
          <div
            key={item.id}
            onClick={() => navigate(item.linkTo)}
            className="shrink-0 w-60 rounded-xl border border-brand-200/80 bg-gradient-to-b from-brand-50/40 to-white p-3.5 flex flex-col justify-between cursor-pointer hover:border-brand-400 hover:shadow-sm transition-all group"
          >
            <div className="space-y-2.5">
              <div className="flex items-start justify-between gap-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <Avatar src={item.avatarUrl} name={item.title} size="md" />
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-neutral-900 truncate group-hover:text-brand-600 transition-colors">
                      {item.title}
                    </h4>
                    <span className="text-[10px] text-neutral-500 truncate block">
                      {item.subtitle || (item.type === 'group' ? 'Nhóm học tập' : 'Mentor')}
                    </span>
                  </div>
                </div>
                <Badge tier="success" size="sm" className="shrink-0 text-[10px] font-bold px-1.5 py-0">
                  {item.score}%
                </Badge>
              </div>

              <div className="text-[11px] text-neutral-600 bg-white/80 rounded-md p-2 border border-brand-100/60 line-clamp-2 leading-snug">
                <span className="font-medium text-brand-700">Lý do: </span>
                {item.reason}
              </div>

              {item.tags && item.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {item.tags.slice(0, 2).map((t, idx) => (
                    <Badge key={idx} tier="neutral" size="sm" className="text-[10px] py-0">
                      {t}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-2.5 mt-2 border-t border-neutral-100 flex items-center justify-between text-[11px] font-medium text-brand-600">
              <span className="flex items-center gap-1">
                {item.type === 'group' ? <Users size={12} /> : <GraduationCap size={12} />}
                {item.type === 'group' ? 'Xem nhóm' : 'Xem Mentor'}
              </span>
              <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DiscoverCarousel;
