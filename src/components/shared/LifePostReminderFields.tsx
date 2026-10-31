import { Bell, CalendarClock } from "lucide-react";
import type { KnowledgePost } from "@/types/entities";
import { currentLifeDate } from "@/lib/studentLifeDetails";
import { lifeExpectedLabel, lifeReminderKind } from "@/lib/lifePostLifecycle";

export function LifePostReminderFields({ post, expectedOn, onExpectedOn, reminder, onReminder }: {
  post: Partial<KnowledgePost>; expectedOn: string; onExpectedOn: (value: string) => void;
  reminder: boolean; onReminder: (value: boolean) => void;
}) {
  const kind = lifeReminderKind(post);
  if (!kind) return null;
  const ride = kind === "transport", today = currentLifeDate();
  return <fieldset className="rounded-xl border border-neutral-200 bg-neutral-50/70 p-4">
    <legend className="px-1 text-xs font-semibold text-neutral-700">Nhắc kiểm tra nhu cầu</legend>
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
      {ride ? <p className="flex items-center gap-2 text-sm text-neutral-700"><CalendarClock size={16} />Nhắc kiểm tra khi đến giờ đi{lifeExpectedLabel(post) ? `: ${lifeExpectedLabel(post)}` : " đã chọn"}</p>
        : <label className="flex flex-wrap items-center gap-3 text-sm text-neutral-700">Ngày hoàn thành dự kiến
          <input type="date" lang="vi" required aria-label="Ngày hoàn thành dự kiến" min={expectedOn && expectedOn < today ? expectedOn : today} value={expectedOn} onChange={(event) => onExpectedOn(event.target.value)} className="rounded-lg border border-neutral-200 bg-surface px-3 py-2 outline-hidden focus:border-brand-500" />
        </label>}
      <label className="flex cursor-pointer items-center gap-2 text-xs text-neutral-700">
        <input type="checkbox" checked={reminder} onChange={(event) => onReminder(event.target.checked)} className="accent-brand-600" />
        <Bell size={14} /> {ride ? "Nhắc tôi khi đến giờ đi" : "Nhắc tôi vào ngày dự kiến"}
      </label>
    </div>
    <p className="mt-3 text-xs leading-relaxed text-neutral-500">Đến thời điểm này, bạn sẽ được nhắc kiểm tra bài. Nếu đã xong, hãy ẩn bài; nếu còn nhu cầu, giữ bài hoặc đổi ngày nhắc. Bài chỉ ẩn khi bạn chủ động chọn.</p>
  </fieldset>;
}
