import { House } from "lucide-react";
import type { HousingExperience } from "@/types/entities";
import { formatMealPrice, hasHousingExperience } from "@/lib/studentLife";

export function HousingExperienceSummary({
  value,
}: {
  value: HousingExperience;
}) {
  if (!hasHousingExperience(value)) return null;
  return (
    <section
      aria-label="Trải nghiệm chỗ ở của người đăng"
      className="space-y-3 rounded-xl border border-teal-100 bg-teal-50/30 p-4 text-xs"
    >
      <p className="flex items-center gap-2 font-semibold text-neutral-800">
        <House size={16} className="text-teal-700" />
        Từ trải nghiệm ở trọ
      </p>
      <dl className="grid gap-3 sm:grid-cols-2">
        {value.monthlyCost !== undefined && (
          <div>
            <dt className="text-neutral-500">Chi phí / người / tháng</dt>
            <dd className="mt-1 font-semibold text-neutral-800">
              Khoảng {formatMealPrice(value.monthlyCost)}
            </dd>
          </div>
        )}
        {value.duration && (
          <div>
            <dt className="text-neutral-500">Thời gian đã ở</dt>
            <dd className="mt-1 text-neutral-700">{value.duration}</dd>
          </div>
        )}
        {value.highlights && (
          <div>
            <dt className="font-medium text-teal-700">Điểm phù hợp</dt>
            <dd className="mt-1 whitespace-pre-line leading-relaxed text-neutral-700">
              {value.highlights}
            </dd>
          </div>
        )}
        {value.considerations && (
          <div>
            <dt className="font-medium text-neutral-600">Cần cân nhắc</dt>
            <dd className="mt-1 whitespace-pre-line leading-relaxed text-neutral-700">
              {value.considerations}
            </dd>
          </div>
        )}
      </dl>
    </section>
  );
}
