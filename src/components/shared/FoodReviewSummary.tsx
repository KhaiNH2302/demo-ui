import { CalendarDays, MapPin, Star, UtensilsCrossed } from "lucide-react";
import type { FoodReview } from "@/types/entities";
import { formatMealPrice } from "@/lib/studentLife";

export function FoodReviewSummary({
  review,
  location,
  compact = false,
}: {
  review: FoodReview;
  location?: string;
  compact?: boolean;
}) {
  const date = review.visitedOn?.split("-").reverse().join("/");
  return (
    <div
      className={`rounded-xl border border-neutral-200 bg-neutral-50/60 ${compact ? "p-3" : "p-3.5 sm:p-4"}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <span className="rounded-lg bg-white/80 p-2 text-amber-700">
            <UtensilsCrossed size={16} />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-snug text-neutral-900">
              {review.placeName}
            </p>
            {review.dish && (
              <p className="mt-1 text-xs text-neutral-500">{review.dish}</p>
            )}
          </div>
        </div>
        {!review.isDemo && (
          <span
            aria-label={`Người đăng đánh giá ${review.rating} trên 5 sao`}
            className="flex shrink-0 items-center gap-1 rounded-lg bg-white/80 px-2 py-1 text-xs font-bold text-amber-800"
          >
            <Star size={13} className="fill-amber-400 text-amber-500" />
            {review.rating}
            <span className="font-normal text-amber-700/60">/5</span>
          </span>
        )}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-neutral-500">
        <span className="font-semibold text-neutral-800">
          {review.isDemo ? "Giá tham khảo: " : ""}
          {formatMealPrice(review.spentPerPerson)}
          {review.isDemo ? " / món" : " / người"}
        </span>
        {!compact && location && (
          <span className="inline-flex items-center gap-1">
            <MapPin size={12} />
            {location}
          </span>
        )}
        {!review.isDemo && !compact && date && (
          <span className="inline-flex items-center gap-1">
            <CalendarDays size={12} />
            Đã ghé {date}
          </span>
        )}
        {review.isDemo && (
          <span className="rounded border border-amber-200 px-1.5 py-0.5 text-[10px] text-amber-800/70">
            Tên quán có thật · nội dung biên soạn
          </span>
        )}
      </div>
    </div>
  );
}
