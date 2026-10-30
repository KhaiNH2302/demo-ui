import { useRef, useState } from "react";
import { UtensilsCrossed, MapPin } from "lucide-react";
import type { FoodReview } from "@/types/entities";
import { localReviewDate } from "@/lib/studentLife";
import { coordinatesFromText } from "@/lib/studentLifeDetails";
import { useCurrentLocation } from "@/lib/useCurrentLocation";
import { Button } from "@/components/ui/Button";

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
  const [mapValue, setMapValue] = useState(value.coordinates ? `${value.coordinates.latitude}, ${value.coordinates.longitude}` : "");
  const position = useCurrentLocation();
  const mapInput = useRef<HTMLInputElement>(null);
  const invalidMap = Boolean(mapValue.trim() && !coordinatesFromText(mapValue));
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
      <div className="space-y-2 border-t border-amber-200/60 pt-3">
        <label className="block space-y-1.5 text-xs font-medium text-neutral-600">
          <span>Vị trí quán (không bắt buộc)</span>
          <input ref={mapInput} value={mapValue} aria-invalid={invalidMap || undefined} aria-describedby="food-map-help" className={field} placeholder="Dán tọa độ hoặc liên kết Google Maps có tọa độ" onChange={(e) => {
            const point = coordinatesFromText(e.target.value);
            setMapValue(e.target.value);
            e.target.setCustomValidity(e.target.value.trim() && !point ? "Nhập tọa độ hợp lệ hoặc liên kết Google Maps có tọa độ." : "");
            update({ coordinates: point });
          }} />
        </label>
        <p id="food-map-help" className={`text-[11px] leading-relaxed ${invalidMap ? "text-red-600" : "text-neutral-500"}`}>{invalidMap ? "Chưa đọc được tọa độ. Mở Google Maps, nhấp vào vị trí quán để sao chép cặp tọa độ; liên kết rút gọn chưa được hỗ trợ." : "Thêm vị trí đúng của quán để bài review xuất hiện trong bộ lọc Gần tôi. Không dùng vị trí nhà của bạn."}</p>
        <Button type="button" size="sm" variant="outline" loading={position.loading} leftIcon={<MapPin size={14} />} onClick={() => position.request((point) => {
          setMapValue(`${point.latitude}, ${point.longitude}`);
          mapInput.current?.setCustomValidity("");
          update({ coordinates: point });
        })}>Tôi đang ở quán — dùng vị trí này</Button>
        {position.error && <p role="alert" className="text-xs text-red-600">{position.error}</p>}
      </div>
      <p className="text-[11px] leading-relaxed text-neutral-500">
        Kể cả món bạn thích và điều chưa ưng. Mức chi là bữa bạn đã ăn, có thể
        khác lần ghé sau.
      </p>
    </section>
  );
}
