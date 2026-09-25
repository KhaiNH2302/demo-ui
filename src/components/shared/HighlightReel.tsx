import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface HighlightItem {
  id: string;
  label: string;
  /** Icon lucide đơn sắc — KHÔNG dùng emoji (xem 00-tokens.md § 8.1). */
  icon?: LucideIcon;
  /** Ảnh thật (logo CLB, avatar mentor) — luôn ưu tiên hơn icon nếu có. */
  imageUrl?: string;
  isNew?: boolean;
  href: string;
}

export interface HighlightReelProps {
  items: HighlightItem[];
  className?: string;
}

/**
 * Dải "story" cuộn ngang đầu Home Feed.
 *
 * Quy tắc thị giác (specs/ui/design-system/00-tokens.md § 8.1):
 * - Nội dung trong vòng tròn: ảnh thật, hoặc 1 icon lucide đơn sắc màu brand-600
 *   trên nền brand-50 — GIỐNG NHAU cho mọi item, không đổi màu theo từng item.
 * - Vòng viền chỉ có 2 trạng thái: gradient cố định (có nội dung mới) hoặc
 *   neutral-200 (đã xem). Không có vòng màu riêng cho từng item.
 */
export const HighlightReel: React.FC<HighlightReelProps> = ({ items, className }) => {
  const navigate = useNavigate();

  if (!items || items.length === 0) return null;

  return (
    <div className={cn('flex gap-4 overflow-x-auto pb-1 no-scrollbar', className)}>
      {items.map((item) => {
        const Icon = item.icon || Sparkles;
        return (
          <button
            key={item.id}
            onClick={() => navigate(item.href)}
            aria-label={item.label}
            className="flex flex-col items-center gap-1.5 shrink-0 w-16 group focus-visible:outline-none"
          >
            <span
              className={cn(
                'flex h-16 w-16 items-center justify-center rounded-full p-[2px] transition-transform group-hover:scale-105 group-focus-visible:ring-2 group-focus-visible:ring-brand-500/40',
                item.isNew ? 'bg-gradient-to-br from-accent-500 to-brand-500' : 'bg-neutral-200'
              )}
            >
              <span className="flex h-full w-full items-center justify-center rounded-full bg-white p-[2px]">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt="" className="h-full w-full object-cover rounded-full" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center rounded-full bg-brand-50 text-brand-600">
                    <Icon size={22} strokeWidth={1.75} />
                  </span>
                )}
              </span>
            </span>
            <span
              className={cn(
                'text-[11px] text-center leading-tight line-clamp-2 w-16',
                item.isNew ? 'text-neutral-800 font-medium' : 'text-neutral-500'
              )}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default HighlightReel;
