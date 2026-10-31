import { useRef, useState, type ReactNode } from "react";
import type { HousingPost, PassPost, StudentExperience, RidePost } from "@/types/entities";
import { currentLifeYear, EXPERIENCE_CATEGORIES, EXPERIENCE_INTENTS, HOUSING_AMENITIES, HOUSING_KINDS, PASS_CATEGORIES, PASS_CONDITIONS } from "@/lib/studentLifeDetails";
import { RideDateFilter } from "./RideDateFilter";

const field = "mt-1.5 w-full rounded-lg border border-neutral-200 bg-surface px-3 py-2.5 text-sm font-normal text-neutral-900 outline-hidden focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15";
function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block text-xs font-medium text-neutral-600">{label}{children}</label>;
}
const number = (value: string) => value === "" ? undefined : Number(value);

export function PassPostFields({ value, onChange }: { value: Partial<PassPost>; onChange: (value: Partial<PassPost>) => void }) {
  const update = (patch: Partial<PassPost>) => onChange({ ...value, ...patch });
  const previousPrice = useRef(value.price && value.price > 0 ? value.price : undefined);
  const free = value.price === 0;
  return <section aria-label="Thông tin pass đồ" className="space-y-3 rounded-xl border border-brand-100 bg-brand-50/30 p-4">
    <h2 className="text-sm font-semibold text-neutral-800">Bạn muốn pass món gì?</h2>
    <Field label="Tên món đồ *"><input required maxLength={100} className={field} value={value.itemName || ""} onChange={(event) => update({ itemName: event.target.value })} placeholder="Ví dụ: Quạt bàn, bàn học gấp, sách tiếng Anh…" /></Field>
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label="Loại đồ *"><select required className={field} value={value.category || ""} onChange={(event) => update({ category: event.target.value as PassPost["category"] })}><option value="">Chọn loại đồ</option>{PASS_CATEGORIES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></Field>
      <Field label="Tình trạng món đồ *"><select required className={field} value={value.condition || ""} onChange={(event) => update({ condition: event.target.value as PassPost["condition"] })}><option value="">Chọn tình trạng</option>{PASS_CONDITIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></Field>
      <div className="space-y-2"><Field label="Giá pass (đồng) *"><input required type="number" min={0} max={100000000} step={1} disabled={free} className={`${field} disabled:bg-neutral-100`} value={value.price ?? ""} onChange={(event) => { const price = number(event.target.value); if (price && price > 0) previousPrice.current = price; update({ price }); }} placeholder="Ví dụ: 150000" /></Field><label className="flex items-center gap-2 text-xs text-neutral-700"><input type="checkbox" checked={free} className="h-4 w-4 accent-brand-600" onChange={(event) => { if (event.target.checked && value.price && value.price > 0) previousPrice.current = value.price; update({ price: event.target.checked ? 0 : previousPrice.current }); }} />Tặng miễn phí</label></div>
    </div>
    <p className="text-xs leading-relaxed text-neutral-500">Ghi rõ lỗi, phụ kiện đi kèm và điểm hẹn nhận đồ. Thêm ảnh thực tế bằng nút Ảnh bên dưới.</p>
  </section>;
}

export function HousingPostFields({ value, onChange }: { value: HousingPost; onChange: (value: HousingPost) => void }) {
  const update = (patch: Partial<HousingPost>) => onChange({ ...value, ...patch });
  const seeking = value.kind === "seeking";
  const year = currentLifeYear();
  const savedMonth = value.availableFrom?.slice(0, 7) || "";
  const [costsOpen, setCostsOpen] = useState(Boolean(value.deposit !== undefined || value.serviceFee !== undefined || value.electricity || value.water));
  if (value.kind === "experience") return null;
  return (
    <section aria-label="Thông tin bài đăng trọ" className="space-y-4 rounded-xl border border-teal-100 bg-teal-50/30 p-4">
      <h2 className="text-sm font-semibold text-neutral-800">{HOUSING_KINDS.find((kind) => kind.value === value.kind)?.label}</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={seeking ? "Ngân sách tối đa (đồng/tháng) *" : "Giá thuê (đồng/tháng) *"}>
          <input required type="number" min={0} max={100000000} step={1} className={field} value={value.price ?? ""} onChange={(event) => update({ price: number(event.target.value) })} placeholder="Ví dụ: 2000000" />
        </Field>
        <Field label="Đơn vị giá *">
          <select required className={field} value={value.priceUnit} onChange={(event) => update({ priceUnit: event.target.value as HousingPost["priceUnit"] })}>
            <option value="room">Đồng / phòng / tháng</option>
            <option value="person">Đồng / người / tháng</option>
          </select>
        </Field>
        <Field label="Tổng số người ở dự kiến">
          <input type="number" min={1} max={20} step={1} className={field} value={value.people ?? ""} onChange={(event) => update({ people: number(event.target.value) })} placeholder="Ví dụ: 2" />
        </Field>
        <Field label={seeking ? "Tháng muốn chuyển vào *" : "Tháng có thể nhận phòng *"}>
          <select required className={field} value={savedMonth} onChange={(event) => update({ availableFrom: event.target.value ? event.target.value + "-01" : undefined })}>
            <option value="">Chọn tháng · {year}</option>
            {savedMonth && !savedMonth.startsWith(String(year) + "-") && <option value={savedMonth}>Tháng {Number(savedMonth.slice(5))}/{savedMonth.slice(0, 4)} (đã lưu)</option>}
            {Array.from({ length: 12 }, (_, index) => <option key={index} value={String(year) + "-" + String(index + 1).padStart(2, "0")}>Tháng {index + 1}</option>)}
          </select>
        </Field>
      </div>
      <fieldset className="space-y-2">
        <legend className="text-xs font-medium text-neutral-600">{seeking ? "Tiện ích mong muốn" : "Tiện ích hiện có"}</legend>
        <div className="flex flex-wrap gap-2">
          {HOUSING_AMENITIES.map((amenity) => (
            <label key={amenity} className="flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border border-neutral-200 bg-surface px-3 py-2 text-xs text-neutral-700 has-checked:border-brand-300 has-checked:bg-brand-50">
              <input type="checkbox" className="h-4 w-4 accent-brand-600" checked={value.amenities?.includes(amenity) || false} onChange={(event) => update({ amenities: event.target.checked ? [...(value.amenities || []), amenity] : value.amenities?.filter((item) => item !== amenity) })} />
              {amenity}
            </label>
          ))}
        </div>
      </fieldset>
      {!seeking && (
        <details open={costsOpen} onToggle={(event) => setCostsOpen(event.currentTarget.open)} className="border-t border-teal-100 pt-3">
          <summary className="cursor-pointer text-xs font-semibold text-teal-800">Tiền cọc, điện nước và phí dịch vụ (không bắt buộc)</summary>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Field label="Tiền cọc (đồng)"><input type="number" min={0} max={100000000} step={1} className={field} value={value.deposit ?? ""} onChange={(event) => update({ deposit: number(event.target.value) })} /></Field>
            <Field label="Phí dịch vụ (đồng/tháng)"><input type="number" min={0} max={100000000} step={1} className={field} value={value.serviceFee ?? ""} onChange={(event) => update({ serviceFee: number(event.target.value) })} /></Field>
            <Field label="Tiền điện"><input maxLength={80} className={field} value={value.electricity || ""} onChange={(event) => update({ electricity: event.target.value })} placeholder="Ví dụ: 3.500đ/kWh" /></Field>
            <Field label="Tiền nước"><input maxLength={80} className={field} value={value.water || ""} onChange={(event) => update({ water: event.target.value })} placeholder="Ví dụ: 80.000đ/người/tháng" /></Field>
          </div>
        </details>
      )}
    </section>
  );
}

export function StudentExperienceFields({ value, onChange }: { value: StudentExperience; onChange: (value: StudentExperience) => void }) {
  return (
    <section aria-label="Phân loại kinh nghiệm sinh viên" className="space-y-3 rounded-xl border border-brand-100 bg-brand-50/30 p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Phân loại *">
          <select required className={field} value={value.category} onChange={(event) => onChange({ ...value, category: event.target.value as StudentExperience["category"] })}>
            {EXPERIENCE_CATEGORIES.map((category) => <option key={category.value} value={category.value}>{category.label}</option>)}
          </select>
        </Field>
        <Field label="Bạn cần gì? *">
          <select required className={field} value={value.intent} onChange={(event) => onChange({ ...value, intent: event.target.value as StudentExperience["intent"] })}>
            {EXPERIENCE_INTENTS.map((intent) => <option key={intent.value} value={intent.value}>{intent.label}</option>)}
          </select>
        </Field>
      </div>
      {value.category === "materials" && <Field label="Mã môn / tên môn (không bắt buộc)"><input maxLength={30} className={field} value={value.courseCode || ""} onChange={(event) => onChange({ ...value, courseCode: event.target.value })} placeholder="Ví dụ: PRJ301" /></Field>}
      <p className="text-xs leading-relaxed text-neutral-500">{value.intent === "request_materials" ? "Nêu rõ tài liệu cần xin. Bạn không bắt buộc đính kèm tệp." : value.category === "ojt" ? "Chia sẻ cách chuẩn bị OJT, ứng tuyển, công việc và báo cáo OJT." : value.category === "graduation" ? "Nêu giai đoạn làm đồ án tốt nghiệp và điều bạn muốn chia sẻ hoặc hỏi." : "Có thể thêm tài liệu bằng nút Tệp ở cuối form."}</p>
    </section>
  );
}

export function RidePostFields({ value, onChange }: { value: RidePost; onChange: (value: RidePost) => void }) {
  const update = (patch: Partial<RidePost>) => onChange({ ...value, ...patch });
  const [date = "", time = ""] = value.departure.split("T");
  return (
    <section aria-label="Thông tin ghép xe" className="space-y-3 rounded-xl border border-blue-100 bg-blue-50/30 p-4">
      <Field label="Nhu cầu *"><select className={field} value={value.kind} onChange={(event) => update({ kind: event.target.value as RidePost["kind"] })}><option value="seeking">Cần ghép chuyến</option><option value="offering">Có xe, còn chỗ</option></select></Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Điểm đi *"><input required maxLength={80} className={field} value={value.origin} onChange={(event) => update({ origin: event.target.value })} placeholder="Nhập điểm đón hoặc khu vực xuất phát" /></Field>
        <Field label="Điểm đến *"><input required maxLength={80} className={field} value={value.destination} onChange={(event) => update({ destination: event.target.value })} placeholder="Nhập điểm đến hoặc tên campus" /></Field>
        <div className="space-y-1.5"><p className="text-xs font-medium text-neutral-600">Ngày đi *</p><RideDateFilter allowAny={false} value={date} onChange={(selected) => update({ departure: selected + "T" + time })} /></div>
        <Field label="Giờ đi *"><input required type="time" className={field} value={time} onChange={(event) => update({ departure: date + "T" + event.target.value })} /></Field>
        <Field label={value.kind === "offering" ? "Số chỗ trống" : "Số người cần đi"}><input type="number" min={1} max={20} step={1} className={field} value={value.seats ?? ""} onChange={(event) => update({ seats: number(event.target.value) })} /></Field>
        <Field label="Góp chi phí / người (đồng, không bắt buộc)"><input type="number" min={0} max={100000000} step={1} className={field} value={value.contribution ?? ""} onChange={(event) => update({ contribution: number(event.target.value) })} /></Field>
      </div>
    </section>
  );
}
