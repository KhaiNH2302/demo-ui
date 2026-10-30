import { FeedFilterSelect } from "./FeedFilterSelect";
import { Button } from "@/components/ui/Button";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/cn";
import { RideDateFilter } from "./RideDateFilter";
import { currentLifeYear, EXPERIENCE_CATEGORIES, EXPERIENCE_INTENTS, HOUSING_AMENITIES, HOUSING_KINDS, selectedHousingAmenities } from "@/lib/studentLifeDetails";

const field = "min-w-0 w-full rounded-lg border border-neutral-200 bg-surface px-3 py-2 text-sm text-neutral-700 outline-hidden focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15";
export function TopicFeedFilters({ topic, params, onChange, nearby, radius, onRadius, onLocate, onClearLocation, locating, locationError }: {
  topic: string; params: URLSearchParams; onChange: (key: string, value: string) => void;
  nearby: boolean; radius: string; onRadius: (value: string) => void;
  onLocate: () => void; onClearLocation: () => void; locating: boolean; locationError: string;
}) {
  const input = (key: string, label: string) => <input aria-label={label} placeholder={label} value={params.get(key) || ""} onChange={(e) => onChange(key, e.target.value)} className={cn(field, "w-44 max-w-full")} />;
  const select = (key: string, label: string, options: readonly { value: string; label: string }[]) => <FeedFilterSelect fitContent aria-label={label} value={params.get(key) || ""} onChange={(e) => onChange(key, e.target.value)}><option value="">{label}</option>{options.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}</FeedFilterSelect>;
  const check = (key: string, label: string) => <label className="flex min-h-10 items-center gap-2 text-xs text-neutral-700"><input type="checkbox" checked={params.get(key) === "1"} onChange={(e) => onChange(key, e.target.checked ? "1" : "")} className="accent-brand-600" />{label}</label>;
  const amenities = selectedHousingAmenities(params.get("amenity"));
  if (!["housing", "food", "experience", "transport"].includes(topic)) return null;
  return <div className="mt-3 space-y-3 border-t border-neutral-200/80 pt-3">
    {topic === "housing" && <>
      <div className="flex flex-wrap items-center gap-2.5">
        {select("housingKind", "Mọi nhu cầu về trọ", HOUSING_KINDS)}
        {params.get("housingKind") !== "experience" && <>
          {select("maxRent", "Mọi mức giá thuê / ngân sách", [{ value: "1000000", label: "Đến 1 triệu/tháng" }, { value: "2000000", label: "Đến 2 triệu/tháng" }, { value: "3000000", label: "Đến 3 triệu/tháng" }, { value: "5000000", label: "Đến 5 triệu/tháng" }])}
          {select("people", "Mọi số người ở", [{ value: "1", label: "1 người" }, { value: "2", label: "2 người" }, { value: "3", label: "3 người" }, { value: "4", label: "4 người" }])}
          {select("moveMonth", `Tháng chuyển vào · ${currentLifeYear()}`, Array.from({ length: 12 }, (_, index) => ({ value: String(index + 1).padStart(2, "0"), label: `Tháng ${index + 1}` })))}
          <fieldset className="w-full space-y-2">
            <legend className="text-xs font-medium text-neutral-600">Tiện ích cần có</legend>
            <div className="flex flex-wrap gap-2">
              {HOUSING_AMENITIES.map((amenity) => (
                <label key={amenity} className="flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border border-neutral-200 bg-surface px-3 py-2 text-xs text-neutral-700 transition-colors hover:border-brand-300 has-checked:border-brand-300 has-checked:bg-brand-50 has-checked:text-brand-800">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded accent-brand-600"
                    checked={amenities.includes(amenity)}
                    onChange={(event) => onChange("amenity", (event.target.checked
                      ? [...amenities, amenity]
                      : amenities.filter((item) => item !== amenity)).join(","))}
                  />
                  {amenity}
                </label>
              ))}
            </div>
          </fieldset>
        </>}
      </div>
      {params.get("housingKind") !== "experience" && check("onlyOpen", "Chỉ hiện tin còn phòng / còn tìm")}
    </>}
    {topic === "experience" && <>
      <div className="flex flex-wrap items-center gap-2.5">
        {select("experienceCategory", "Mọi phân loại kinh nghiệm", EXPERIENCE_CATEGORIES)}
        {select("experienceIntent", "Mọi nhu cầu", EXPERIENCE_INTENTS)}
        {params.get("experienceCategory") === "materials" && input("courseCode", "Mã môn / tên môn")}
      </div>
      {check("hasAttachments", "Có tài liệu đính kèm")}
    </>}
    {topic === "food" && <>
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <Button type="button" variant={nearby ? "primary" : "outline"} size="sm" loading={locating} leftIcon={<MapPin size={14} />} onClick={onLocate}>Gần tôi</Button>
          {nearby && <><FeedFilterSelect fitContent aria-label="Bán kính tìm quán" value={radius} onChange={(e) => onRadius(e.target.value)}><option value="1">Trong 1 km</option><option value="3">Trong 3 km</option><option value="5">Trong 5 km</option></FeedFilterSelect><button type="button" onClick={onClearLocation} className="shrink-0 text-xs text-neutral-500 hover:text-brand-700">Bỏ vị trí</button></>}
        </div>
      </div>
      {params.get("sort") === "hot" && <p className="text-xs text-neutral-500">Ưu tiên bài review quán có nhiều lượt thích từ cộng đồng.</p>}
      {nearby && <p className="text-xs leading-relaxed text-neutral-500">Chỉ hiện review có vị trí quán, xếp từ gần đến xa. Khoảng cách theo đường thẳng, ước tính. Vị trí của bạn chỉ dùng trong lần xem này.</p>}
      {locationError && <p role="alert" className="text-xs text-red-600">{locationError}</p>}
    </>}
    {topic === "transport" && <div className="flex flex-wrap items-center gap-2.5">
      {select("rideKind", "Mọi nhu cầu ghép xe", [{ value: "seeking", label: "Cần ghép chuyến" }, { value: "offering", label: "Có xe, còn chỗ" }])}
      {input("origin", "Điểm đi")}{input("destination", "Điểm đến")}
      <RideDateFilter value={params.get("rideDate") || ""} onChange={(date) => onChange("rideDate", date)} />
    </div>}
  </div>;
}
