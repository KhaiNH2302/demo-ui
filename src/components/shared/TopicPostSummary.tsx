import type { KnowledgePost } from "@/types/entities";
import { EXPERIENCE_CATEGORIES, EXPERIENCE_INTENTS, HOUSING_KINDS } from "@/lib/studentLifeDetails";
import { formatMealPrice } from "@/lib/studentLife";

export function TopicPostSummary({ post }: { post: KnowledgePost }) {
  const h = post.lifeTopic === "housing" ? post.housingPost : undefined;
  const e = post.lifeTopic === "experience" ? post.studentExperience : undefined;
  const r = post.lifeTopic === "transport" ? post.ridePost : undefined;
  if ((!h || h.kind === "experience") && !e && !r && !post.area) return null;
  return <div className="space-y-2 rounded-xl border border-neutral-200 bg-neutral-50/60 p-3 text-xs leading-relaxed text-neutral-600">
    {post.area && (!h || h.kind === "experience") && <p>{post.area}</p>}
    {h && h.kind !== "experience" && <>
      <div className="flex flex-wrap items-center gap-2"><span className="font-semibold text-brand-700">{HOUSING_KINDS.find((k) => k.value === h.kind)?.label}</span><span className={h.closed ? "text-neutral-400" : "text-teal-700"}>{h.closed ? "Đã kết thúc" : h.kind === "seeking" ? "Còn tìm phòng" : "Còn phòng / còn tìm người"}</span></div>
      <p className="font-semibold text-neutral-900">{h.kind === "seeking" ? "Ngân sách tối đa: " : "Giá thuê: "}{h.price === undefined ? "Chưa cung cấp" : formatMealPrice(h.price)} / {h.priceUnit === "person" ? "người" : "phòng"} / tháng</p>
      <p>{h.area}{h.people ? ` · ${h.people} người` : ""}{h.availableFrom ? ` · ${h.kind === "seeking" ? "Chuyển vào" : "Nhận phòng"} tháng ${h.availableFrom.slice(5, 7)}/${h.availableFrom.slice(0, 4)}` : ""}</p>
      {Boolean(h.amenities?.length) && <p>{h.amenities!.join(" · ")}</p>}
      {(h.deposit !== undefined || h.serviceFee !== undefined || h.electricity || h.water) && <p className="border-t border-neutral-200 pt-2">{[h.deposit !== undefined && `Cọc: ${formatMealPrice(h.deposit)}`, h.electricity && `Điện: ${h.electricity}`, h.water && `Nước: ${h.water}`, h.serviceFee !== undefined && `Dịch vụ: ${formatMealPrice(h.serviceFee)}/tháng`].filter(Boolean).join(" · ")}</p>}
    </>}
    {e && <div className="flex flex-wrap gap-2"><span className="font-semibold text-brand-700">{EXPERIENCE_CATEGORIES.find((c) => c.value === e.category)?.label}</span><span>· {EXPERIENCE_INTENTS.find((c) => c.value === e.intent)?.label}</span>{e.courseCode && <span className="rounded bg-white px-2 font-semibold">{e.courseCode}</span>}</div>}
    {r && <><p className="font-semibold text-brand-700">{r.kind === "offering" ? "Có xe, còn chỗ" : "Cần ghép chuyến"}</p><p className="font-semibold text-neutral-900">{r.origin} → {r.destination}</p><p>{r.departure.slice(0, 10).split("-").reverse().join("/")} · {r.departure.slice(11)}{r.seats ? ` · ${r.seats} ${r.kind === "offering" ? "chỗ" : "người"}` : ""}{r.contribution !== undefined ? ` · ${formatMealPrice(r.contribution)}/người` : ""}</p></>}
  </div>;
}
