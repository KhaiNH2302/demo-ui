import { useState } from "react";
import { House } from "lucide-react";
import type { HousingExperience } from "@/types/entities";
import { hasHousingExperience } from "@/lib/studentLife";

const field =
  "mt-1.5 w-full rounded-lg border border-neutral-200 bg-surface px-3 py-2.5 text-sm font-normal text-neutral-900 outline-hidden focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15";

export function HousingExperienceFields({
  value,
  onChange,
}: {
  value: HousingExperience;
  onChange: (value: HousingExperience) => void;
}) {
  const [open, setOpen] = useState(hasHousingExperience(value));
  return (
    <details
      open={open}
      onToggle={(event) => setOpen(event.currentTarget.open)}
      className="rounded-xl border border-teal-100 bg-teal-50/30 p-4"
    >
      <summary className="cursor-pointer text-sm font-semibold text-neutral-800">
        <House size={16} className="mr-2 inline text-teal-700" />
        Thêm trải nghiệm chỗ ở{" "}
        <span className="font-normal text-neutral-500">(không bắt buộc)</span>
      </summary>
      <p className="mt-2 text-xs leading-relaxed text-neutral-500">
        Kể từ khoảng thời gian bạn đã ở để người đọc biết có phù hợp với mình
        không.
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="text-xs font-medium text-neutral-600">
          Tổng chi phí / người / tháng
          <input
            type="number"
            min={0}
            max={100000000}
            step={1}
            value={value.monthlyCost ?? ""}
            onChange={(event) =>
              onChange({
                ...value,
                monthlyCost:
                  event.target.value === ""
                    ? undefined
                    : Number(event.target.value),
              })
            }
            placeholder="Ví dụ: 2100000"
            className={field}
          />
        </label>
        <label className="text-xs font-medium text-neutral-600">
          Bạn đã ở bao lâu?
          <input
            value={value.duration || ""}
            maxLength={80}
            onChange={(event) =>
              onChange({ ...value, duration: event.target.value })
            }
            placeholder="Ví dụ: 3 tháng, học kỳ vừa rồi…"
            className={field}
          />
        </label>
        <label className="text-xs font-medium text-neutral-600">
          Điểm phù hợp với bạn
          <textarea
            value={value.highlights || ""}
            maxLength={180}
            rows={2}
            onChange={(event) =>
              onChange({ ...value, highlights: event.target.value })
            }
            placeholder="Ví dụ: Gần trường, có bếp để tự nấu…"
            className={`${field} resize-y`}
          />
        </label>
        <label className="text-xs font-medium text-neutral-600">
          Điều cần cân nhắc
          <textarea
            value={value.considerations || ""}
            maxLength={180}
            rows={2}
            onChange={(event) =>
              onChange({ ...value, considerations: event.target.value })
            }
            placeholder="Ví dụ: Phòng nóng buổi chiều, cần xe đi chợ…"
            className={`${field} resize-y`}
          />
        </label>
      </div>
    </details>
  );
}
