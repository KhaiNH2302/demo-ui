import type { KnowledgePost, Notification } from "@/types/entities";
import { isLifePublished, lifeExpectedAt, lifeExpectedLabel, lifeReminderDue, migrateLifePost } from "@/lib/lifePostLifecycle";
import { seedKnowledgePosts } from "./data/knowledge";
import { seedNotifications } from "./data/notifications";
import { seedUsers } from "./data/users";

const key = "scs_life_post_lifecycle_v1";
type TimedNotice = Notification & { expectedAt: string; phase: "check" };
type Stored = { posts: KnowledgePost[]; deleted: string[]; notices: TimedNotice[]; delivered: string[] };
let state: Stored = { posts: [], deleted: [], notices: [], delivered: [] };
let lastRaw: string | null | undefined;
function read() { try { return localStorage.getItem(key); } catch { return undefined; } }
function save() {
  try { const raw = JSON.stringify(state); localStorage.setItem(key, raw); lastRaw = raw; } catch { /* Session state remains usable. */ }
}
export function restoreLifePosts() {
  const raw = read();
  if (raw === undefined || raw === lastRaw) return;
  lastRaw = raw;
  try {
    const parsed = JSON.parse(raw || "{}");
    state = {
      posts: Array.isArray(parsed.posts) ? parsed.posts.filter((p: KnowledgePost) => p && typeof p.id === "string" && typeof p.contentMd === "string" && typeof p.status === "string" && Array.isArray(p.tags) && Array.isArray(p.attachments) && (p.expectedCompletionAt === undefined || typeof p.expectedCompletionAt === "string" && Number.isFinite(Date.parse(p.expectedCompletionAt))) && seedUsers.some((u) => u.id === p.authorId)) : [],
      deleted: Array.isArray(parsed.deleted) ? parsed.deleted.filter((id: unknown) => typeof id === "string") : [],
      notices: Array.isArray(parsed.notices) ? parsed.notices.filter((n: Notification) => n?.source === "StudentLifeLifecycle" && typeof n.id === "string" && (n as TimedNotice).phase === "check" && Number.isFinite(Date.parse((n as TimedNotice).expectedAt))) : [],
      delivered: Array.isArray(parsed.delivered) ? parsed.delivered.filter((id: unknown) => typeof id === "string") : [],
    };
  } catch { state = { posts: [], deleted: [], notices: [], delivered: [] }; }
  for (const post of state.posts) {
    migrateLifePost(post);
    const existing = seedKnowledgePosts.find((p) => p.id === post.id);
    if (existing) Object.assign(existing, post); else seedKnowledgePosts.unshift(post);
  }
  for (let i = seedKnowledgePosts.length - 1; i >= 0; i--) if (state.deleted.includes(seedKnowledgePosts[i].id)) seedKnowledgePosts.splice(i, 1);
}
export function persistLifePost(post: KnowledgePost) {
  restoreLifePosts();
  state.posts = [structuredClone(post), ...state.posts.filter((p) => p.id !== post.id)];
  save();
}
export function deleteLifePost(id: string) {
  restoreLifePosts();
  state.posts = state.posts.filter((p) => p.id !== id);
  if (!state.deleted.includes(id)) state.deleted.push(id);
  state.notices = state.notices.filter((n) => n.linkTo !== `/knowledge/${id}`);
  save();
}
export function reconcileLifePostNotices(now = new Date()) {
  restoreLifePosts();
  let changed = false;
  const delivered = new Set(state.delivered);
  const touched = new Set(state.posts.map((p) => p.id));
  for (const post of seedKnowledgePosts) {
    // The bulk filter matrix is not a real publication stream. Only notify for
    // deliberately edited matrix records; dedicated lifecycle examples remain live.
    if (post.id.startsWith("life_demo_") && !touched.has(post.id)) continue;
    const expected = lifeExpectedAt(post);
    if (!expected || !isLifePublished(post) || post.authorHidden || post.remindOnExpectedDate === false || !seedUsers.some((u) => u.id === post.authorId && u.status === "active") || !lifeReminderDue(post, now)) continue;
    const token = post.id + ":" + expected + ":check";
    if (delivered.has(token)) continue;
    delivered.add(token); changed = true;
    state.notices.unshift({
      id: `life_post_notice_${crypto.randomUUID()}`, userId: post.authorId, source: "StudentLifeLifecycle",
      title: "Bạn đã xong nhu cầu trong bài viết chưa?",
      body: [post.title || post.contentMd.slice(0, 70), lifeExpectedLabel(post), "Đã đến thời điểm dự kiến. Nếu đã xong, hãy ẩn bài để người khác không liên hệ nhầm. Nếu còn nhu cầu, giữ bài hoặc đổi ngày nhắc."].join(" · "),
      expectedAt: expected, phase: "check",
      linkTo: `/knowledge/${post.id}`, read: false, createdAt: now.toISOString(),
    });
  }
  state.delivered = [...delivered];
  const posts = new Map(seedKnowledgePosts.map((p) => [p.id, p]));
  const count = state.notices.length;
  state.notices = state.notices.filter((n) => {
    const p = posts.get(n.linkTo.slice("/knowledge/".length));
    return p && isLifePublished(p) && !p.authorHidden && p.remindOnExpectedDate !== false && lifeExpectedAt(p) === n.expectedAt;
  }).slice(0, 300);
  if (count !== state.notices.length) changed = true;
  const allowed = new Set(state.notices.map((n) => n.id));
  for (let i = seedNotifications.length - 1; i >= 0; i--) if (seedNotifications[i].source === "StudentLifeLifecycle" && !allowed.has(seedNotifications[i].id)) seedNotifications.splice(i, 1);
  for (const notice of state.notices) {
    const existing = seedNotifications.find((n) => n.id === notice.id);
    if (existing) Object.assign(existing, notice); else seedNotifications.unshift({ ...notice });
  }
  if (changed) save();
}
export function persistLifePostNoticeRead(notice: Notification) {
  if (notice.source !== "StudentLifeLifecycle") return;
  restoreLifePosts();
  const stored = state.notices.find((n) => n.id === notice.id);
  if (stored) { stored.read = notice.read; save(); }
}
