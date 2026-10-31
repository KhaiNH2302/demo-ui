import type { KnowledgePost } from "@/types/entities";
import { currentLifeDate } from "./studentLifeDetails";

type LifecyclePost = Partial<KnowledgePost>;
export const LIFE_OWNER_STATUSES = [
  ["Published", "Đang hiển thị"], ["AuthorHidden", "Đã ẩn"],
  ["PendingReview", "Chờ duyệt"], ["Rejected", "Bị từ chối"], ["all", "Tất cả"],
] as const;

export function lifeReminderKind(post: LifecyclePost) {
  if (post.lifeTopic === "marketplace") return "marketplace";
  if (post.lifeTopic === "housing" && post.housingPost && post.housingPost.kind !== "experience") return "housing";
  if (post.lifeTopic === "transport" && post.ridePost) return "transport";
  return undefined;
}
export function lifeCalendarDay(day: unknown): day is string {
  return typeof day === "string" && /^\d{4}-\d{2}-\d{2}$/.test(day) && Number.isFinite(Date.parse(day)) && new Date(day).toISOString().slice(0, 10) === day;
}
export function lifeDayStart(day: string) {
  return lifeCalendarDay(day) ? new Date(day + "T00:00:00+07:00").toISOString() : undefined;
}
export function defaultLifeExpectedDay(post: LifecyclePost, now = new Date()) {
  const kind = lifeReminderKind(post);
  return kind === "housing" || kind === "marketplace" ? currentLifeDate(kind === "housing" ? 30 : 14, now) : "";
}
export function lifeExpectedAt(post: LifecyclePost) {
  if (lifeReminderKind(post) === "transport") {
    const departure = post.ridePost!.departure;
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(departure) || !Number.isFinite(Date.parse(departure + "+07:00"))) return undefined;
    return new Date(departure + "+07:00").toISOString();
  }
  return lifeReminderKind(post) && typeof post.expectedCompletionAt === "string" && Number.isFinite(Date.parse(post.expectedCompletionAt)) ? post.expectedCompletionAt : undefined;
}
export function lifeReminderDue(post: LifecyclePost, now = new Date()) {
  const expected = lifeExpectedAt(post);
  return Boolean(expected && Date.parse(expected) <= now.getTime());
}
export function lifeReminderFields(post: LifecyclePost, now = new Date()) {
  const kind = lifeReminderKind(post);
  if (!kind) return { expectedCompletionAt: undefined, remindOnExpectedDate: undefined };
  return {
    expectedCompletionAt: kind === "transport" ? lifeExpectedAt(post) : post.expectedCompletionAt || lifeDayStart(defaultLifeExpectedDay(post, now)),
    remindOnExpectedDate: post.remindOnExpectedDate ?? true,
  };
}
export function lifeReminderError(post: LifecyclePost, now = new Date(), previousExpectedAt?: string) {
  const kind = lifeReminderKind(post);
  if (!kind) return post.expectedCompletionAt !== undefined || post.remindOnExpectedDate !== undefined ? "Loại bài này không cần ngày hoàn thành dự kiến." : "";
  if (post.remindOnExpectedDate !== undefined && typeof post.remindOnExpectedDate !== "boolean") return "Lựa chọn nhắc kiểm tra bài không hợp lệ.";
  if (post.expectedCompletionAt !== undefined && (typeof post.expectedCompletionAt !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(post.expectedCompletionAt) || !lifeCalendarDay(post.expectedCompletionAt.slice(0, 10)) || !Number.isFinite(Date.parse(post.expectedCompletionAt)))) return "Ngày hoàn thành dự kiến không hợp lệ.";
  if (kind === "transport" && post.expectedCompletionAt && Date.parse(post.expectedCompletionAt) !== Date.parse(lifeExpectedAt(post) || "")) return "Tin ghép xe nhắc kiểm tra theo giờ xuất phát.";
  const expected = lifeReminderFields(post, now).expectedCompletionAt;
  if (!expected || !Number.isFinite(Date.parse(expected))) return "Chọn đủ ngày và giờ xuất phát.";
  // Editing content keeps the original reminder, even when that date has passed.
  if (previousExpectedAt && Date.parse(expected) === Date.parse(previousExpectedAt)) return "";
  if (kind === "transport" ? Date.parse(expected) <= now.getTime() : currentLifeDate(0, new Date(expected)) < currentLifeDate(0, now)) return kind === "transport" ? "Chọn giờ xuất phát trong tương lai." : "Chọn ngày hoàn thành dự kiến từ hôm nay trở đi.";
  return "";
}
export function isLifePublished(post: LifecyclePost) { return ["Published", "Closed", "published", "closed"].includes(post.status || ""); }
export function lifeDiscoverable(post: LifecyclePost) { return isLifePublished(post) && !post.authorHidden; }
export function lifeCanRespond(post: LifecyclePost) { return ["Published", "published"].includes(post.status || "") && !post.authorHidden; }
export function matchesLifeOwnerStatus(post: LifecyclePost, status: string) {
  if (status === "all") return true;
  if (status === "Published") return lifeDiscoverable(post);
  if (status === "AuthorHidden") return Boolean(post.authorHidden);
  return post.status === status;
}
export function lifeExpectedLabel(post: LifecyclePost) {
  const expected = lifeExpectedAt(post);
  return expected ? new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", ...(lifeReminderKind(post) === "transport" ? { timeStyle: "short" } : {}), timeZone: "Asia/Ho_Chi_Minh" }).format(new Date(expected)) : "";
}
/** Preserve old content and convert retired completion/expiry controls to manual hiding and reminders. */
export function migrateLifePost(post: KnowledgePost) {
  if (post.housingPost?.closed || post.passPost?.closed || post.ridePost?.closed) post.authorHidden = true;
  if (!post.expectedCompletionAt && post.expiresAt && Number.isFinite(Date.parse(post.expiresAt))) post.expectedCompletionAt = lifeReminderKind(post) === "transport" ? lifeExpectedAt(post) : lifeDayStart(currentLifeDate(0, new Date(post.expiresAt)));
  if (post.remindOnExpectedDate === undefined && post.remindBeforeExpiry !== undefined) post.remindOnExpectedDate = post.remindBeforeExpiry;
  delete post.expiresAt; delete post.remindBeforeExpiry;
  return post;
}
