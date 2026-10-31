import type { KnowledgePost } from "@/types/entities";
import { currentLifeDate } from "@/lib/studentLifeDetails";
import { lifeDayStart } from "@/lib/lifePostLifecycle";

/** Small, labeled owner examples for reviewing lifecycle states without waiting days. */
export function createLifeLifecycleFixtures(now = new Date()): KnowledgePost[] {
  const base: KnowledgePost = {
    id: "life_lifecycle_active", authorId: "usr_student_01", lifeTopic: "marketplace", type: "discussion",
    title: "[Minh họa] Pass đèn bàn học", contentMd: "Tin giả lập để thử ẩn/hiện và đổi ngày nhắc. Đây không phải món đồ đang giao dịch thực tế.",
    passPost: { itemName: "Đèn bàn học minh họa", category: "household", condition: "good", price: 100000, closed: false },
    campus: "Hòa Lạc", area: "Xã Hạ Bằng", tags: [], attachments: [], images: [], visibility: "cross_school", status: "Published",
    createdAt: now.toISOString(), updatedAt: now.toISOString(), publishedAt: now.toISOString(), likesCount: 0, commentCount: 0,
    expectedCompletionAt: lifeDayStart(currentLifeDate(14, now)), remindOnExpectedDate: true,
    demoContent: { kind: "synthetic", note: "Ví dụ vòng đời bài viết. Không phải nhu cầu hoặc món đồ thực tế." },
  };
  return [
    base,
    { ...structuredClone(base), id: "life_lifecycle_hidden", title: "[Minh họa] Tin đã ẩn — có thể hiện lại", authorHidden: true },
    { ...structuredClone(base), id: "life_lifecycle_expired", title: "[Minh họa] Đã đến ngày dự kiến — vẫn đang hiển thị", expectedCompletionAt: lifeDayStart(currentLifeDate(-1, now)) },
    { ...structuredClone(base), id: "life_lifecycle_completed", title: "[Minh họa] Tin cũ đã xong — chuyển sang ẩn", authorHidden: true },
    { ...structuredClone(base), id: "life_lifecycle_due", title: "[Minh họa] Tin đến ngày dự kiến hôm nay — thử thông báo", expectedCompletionAt: lifeDayStart(currentLifeDate(0, now)) },
  ];
}
