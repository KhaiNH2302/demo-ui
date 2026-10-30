import { Star, UtensilsCrossed } from "lucide-react";
import type { FoodReview } from "@/types/entities";
import { localReviewDate } from "@/lib/studentLife";

const field =
  "w-full rounded-lg border border-neutral-200 bg-surface px-3 py-2.5 text-sm text-neutral-900 outline-hidden focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15";

export function FoodReviewFields({
  value,
  onChange,
}: {
  value: FoodReview;
  onChange: (value: FoodReview) => void;
}) {
  const update = (patch: Partial<FoodReview>) =>
    onChange({ ...value, ...patch });
  return (
    <section
      aria-label="Thông tin review quán"
      className="space-y-4 rounded-xl border border-amber-200/80 bg-amber-50/35 p-4"
    >
      <h3 className="flex items-center gap-2 text-sm font-semibold text-neutral-900">
        <UtensilsCrossed size={16} className="text-amber-700" />
        Bạn vừa ăn ở đâu?
      </h3>
      <label className="block space-y-1.5 text-xs font-medium text-neutral-600">
        <span>Tên quán *</span>
        <input
          required
          maxLength={100}
          value={value.placeName}
          onChange={(e) => update({ placeName: e.target.value })}
          placeholder="Tên quán để mọi người dễ tìm"
          className={field}
        />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1.5 text-xs font-medium text-neutral-600">
          <span>Món đã gọi</span>
          <input
            maxLength={100}
            value={value.dish || ""}
            onChange={(e) => update({ dish: e.target.value })}
            placeholder="Ví dụ: Cơm gà, thêm trứng"
            className={field}
          />
        </label>
        <label className="space-y-1.5 text-xs font-medium text-neutral-600">
          <span>Bạn đã chi bao nhiêu / người? *</span>
          <div className="relative">
            <input
              required
              type="number"
              inputMode="numeric"
              min={1000}
              max={5000000}
              step={1}
              value={value.spentPerPerson || ""}
              onChange={(e) =>
                update({ spentPerPerson: Number(e.target.value) })
              }
              placeholder="35000"
              className={`${field} pr-14`}
            />
            <span className="absolute right-3 top-3 text-xs text-neutral-400">
              đồng
            </span>
          </div>
        </label>
      </div>
      <div className="grid items-start gap-3 sm:grid-cols-2">
        <fieldset className="space-y-2">
          <legend className="text-xs font-medium text-neutral-600">
            Điểm trải nghiệm của bạn *
          </legend>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((rating) => (
              <label
                key={rating}
                className="cursor-pointer rounded p-1 hover:bg-amber-100"
              >
                <input
                  type="radio"
                  name="food-review-rating"
                  value={rating}
                  checked={value.rating === rating}
                  onChange={() => update({ rating })}
                  aria-label={`${rating} sao`}
                  className="peer sr-only"
                />
                <Star
                  size={24}
                  className={`rounded-sm peer-focus-visible:ring-2 peer-focus-visible:ring-brand-500 ${rating <= value.rating ? "fill-amber-400 text-amber-500" : "text-neutral-300"}`}
                />
              </label>
            ))}
            <span className="ml-2 text-xs font-semibold text-amber-800">
              {value.rating ? `${value.rating}/5` : ""}
            </span>
          </div>
        </fieldset>
        <label className="space-y-1.5 text-xs font-medium text-neutral-600">
          <span>Ngày bạn ghé quán</span>
          <input
            type="date"
            value={value.visitedOn || ""}
            max={localReviewDate()}
            onChange={(e) => update({ visitedOn: e.target.value })}
            className={field}
          />
        </label>
      </div>
      <p className="text-[11px] leading-relaxed text-neutral-500">
        Kể cả món bạn thích và điều chưa ưng. Mức chi là bữa bạn đã ăn, có thể
        khác lần ghé sau.
      </p>
    </section>
  );
}
