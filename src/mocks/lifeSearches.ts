import { migrateLifePost } from '@/lib/lifePostLifecycle';
import { reconcileLifePostNotices } from './lifePostLifecycle';
import type { KnowledgePost, Notification } from "@/types/entities";
import { lifeSearchExpired, lifeSearchExpiry, lifeSearchLabels, lifeSearchSignature, matchesLifeSearch, normalizeLifeSearchFilters, type LifeSavedSearch } from "@/lib/lifeSearches";
import { seedKnowledgePosts } from "./data/knowledge";
import { seedUsers } from "./data/users";
import { seedNotifications } from "./data/notifications";

interface StoredSearch extends LifeSavedSearch { seen: string[] }
interface SearchState { searches: StoredSearch[]; alerts: Notification[]; delivered: string[] }
const cache = new Map<string, { state: SearchState; raw: string | null | undefined }>();
const prefix = "scs_life_searches_v1_";
const demoKey = "scs_life_search_posts_v1";

function read(key: string) { try { return localStorage.getItem(key); } catch { return undefined; } }
function save(userId: string, state: SearchState) {
  const raw = JSON.stringify(state);
  cache.set(userId, { state, raw });
  try { localStorage.setItem(prefix + userId, raw); } catch { /* Session memory still works. */ }
}
function stateFor(userId: string): SearchState {
  const raw = read(prefix + userId), cached = cache.get(userId);
  if (cached && (cached.raw === raw || raw === undefined)) return cached.state;
  const empty: SearchState = { searches: [], alerts: [], delivered: [] };
  try {
    const parsed = JSON.parse(raw || "null");
    if (parsed && Array.isArray(parsed.searches)) {
      empty.searches = parsed.searches.slice(0, 10).flatMap((item: StoredSearch) => {
        try {
          // Validate at creation time so expired searches remain manageable.
          const created = new Date(item.createdAt);
          if (typeof item.id !== "string" || typeof item.name !== "string" || !item.name.trim() || Number.isNaN(created.getTime()) || !Number.isFinite(Date.parse(item.startedAt))) return [];
          const filters = normalizeLifeSearchFilters(item.filters, created);
          return [{ id: item.id, name: item.name.slice(0, 80), filters, enabled: item.enabled === true, createdAt: item.createdAt, startedAt: item.startedAt, expiresAt: lifeSearchExpiry(filters, created), matchCount: Number.isInteger(item.matchCount) && item.matchCount > 0 ? item.matchCount : 0, seen: Array.isArray(item.seen) ? item.seen.filter((id): id is string => typeof id === "string") : [] }];
        } catch { return []; }
      });
      empty.delivered = Array.isArray(parsed.delivered) ? parsed.delivered.filter((id: unknown) => typeof id === "string").slice(-1000) : [];
      empty.alerts = Array.isArray(parsed.alerts) ? parsed.alerts.filter((n: Notification) => n && n.userId === userId && n.source === "StudentLifeSearch" && typeof n.id === "string" && typeof n.title === "string" && typeof n.body === "string" && /^\/knowledge\/[\w-]+$/.test(n.linkTo) && Number.isFinite(Date.parse(n.createdAt))).slice(0, 100) : [];
    }
  } catch { /* Malformed demo storage starts clean. */ }
  cache.set(userId, { state: empty, raw });
  return empty;
}

/** Preserve explicitly created trial posts, without persisting the large seed matrix. */
function restoreDemoPosts() {
  try {
    const posts = JSON.parse(read(demoKey) || "[]");
    if (!Array.isArray(posts)) return;
    for (const post of posts.slice(0, 20)) {
      if (post && typeof post.id === "string" && post.id.startsWith("life_search_demo_") && post.demoContent?.kind === "synthetic" && typeof post.contentMd === "string" && Array.isArray(post.tags) && Array.isArray(post.attachments) && seedUsers.some((user) => user.id === post.authorId) && !seedKnowledgePosts.some((item) => item.id === post.id)) seedKnowledgePosts.unshift(migrateLifePost(post));
    }
  } catch { /* Optional demo records. */ }
}
export function persistLifeSearchDemoPost(post: KnowledgePost) {
  if (!post.id.startsWith("life_search_demo_")) return;
  restoreDemoPosts();
  const posts = seedKnowledgePosts.filter((item) => item.id.startsWith("life_search_demo_") && item.id !== post.id).slice(0, 19);
  try { localStorage.setItem(demoKey, JSON.stringify([post, ...posts])); } catch { /* Session-only trial. */ }
}
export function removeLifeSearchDemoPost(id: string) {
  if (!id.startsWith("life_search_demo_")) return;
  try {
    const posts = JSON.parse(read(demoKey) || "[]");
    if (Array.isArray(posts)) localStorage.setItem(demoKey, JSON.stringify(posts.filter((post) => post?.id !== id)));
  } catch { /* Session-only demo data. */ }
}

export function listLifeSearches(userId: string) {
  reconcileLifeSearchAlerts();
  return stateFor(userId).searches.map(({ seen: _seen, ...item }) => item);
}
export function getLifeSearch(userId: string, id: string) { return stateFor(userId).searches.find((item) => item.id === id); }
export function writeLifeSearch(userId: string, rawBody: unknown, id?: string, now = new Date()) {
  if (!rawBody || typeof rawBody !== "object" || Array.isArray(rawBody)) throw new Error("Dữ liệu tìm kiếm không hợp lệ.");
  const body = rawBody as { name?: unknown; filters?: unknown; enabled?: unknown };
  const state = stateFor(userId);
  const previous = id ? state.searches.find((item) => item.id === id) : undefined;
  if (id && !previous) throw new Error("Không tìm thấy tìm kiếm của bạn.");
  if (body.enabled !== undefined && typeof body.enabled !== "boolean") throw new Error("Trạng thái theo dõi không hợp lệ.");
  if (!previous || body.filters !== undefined) {
    if (typeof body.name !== "string" || !body.name.trim() || body.name.trim().length > 80) throw new Error("Đặt tên tìm kiếm từ 1 đến 80 ký tự.");
    const filters = normalizeLifeSearchFilters(body.filters, now);
    if (state.searches.some((item) => item.id !== id && lifeSearchSignature(item.filters) === lifeSearchSignature(filters))) throw new Error("Bạn đã lưu tìm kiếm với các điều kiện này.");
    if (!previous && state.searches.length >= 10) throw new Error("Bạn có thể lưu tối đa 10 tìm kiếm. Xóa tìm kiếm không còn cần trước nhé.");
    const item: StoredSearch = {
      id: previous?.id || `life_search_${crypto.randomUUID()}`, name: body.name.trim(), filters,
      enabled: body.enabled !== undefined ? body.enabled : previous?.enabled ?? true,
      createdAt: now.toISOString(), startedAt: now.toISOString(), expiresAt: lifeSearchExpiry(filters, now),
      matchCount: previous?.matchCount || 0,
      seen: seedKnowledgePosts.filter((post) => post.status === "Published" && Date.parse(post.publishedAt || post.createdAt) >= now.getTime()).map((post) => post.id),
    };
    if (previous) Object.assign(previous, item); else state.searches.unshift(item);
    save(userId, state);
    return item;
  }
  if (body.enabled === true && lifeSearchExpired(previous, now)) throw new Error("Tìm kiếm đã qua thời gian. Mở bộ lọc và chọn lại ngày hoặc tháng.");
  if (body.enabled === true && !previous.enabled) {
    // Resuming starts now; posts published during a pause are not replayed.
    previous.startedAt = now.toISOString();
    previous.seen = seedKnowledgePosts.filter((post) => post.status === "Published" && Date.parse(post.publishedAt || post.createdAt) >= now.getTime()).map((post) => post.id);
  }
  if (body.enabled !== undefined) previous.enabled = body.enabled;
  save(userId, state);
  return previous;
}
export function deleteLifeSearch(userId: string, id: string) {
  const state = stateFor(userId), index = state.searches.findIndex((item) => item.id === id);
  if (index < 0) return false;
  state.searches.splice(index, 1);
  save(userId, state);
  return true;
}

function accessible(post: KnowledgePost, userId: string) {
  const user = seedUsers.find((item) => item.id === userId && item.status === "active");
  const author = seedUsers.find((item) => item.id === post.authorId);
  return Boolean(user && !post.authorHidden && (post.visibility === "cross_school" || user.school && user.school === author?.school));
}

/** Mock publication worker. Called on writes and notification polling, including approvals. */
export function reconcileLifeSearchAlerts(now = new Date()) {
  restoreDemoPosts();
  reconcileLifePostNotices(now);
  const posts = new Map(seedKnowledgePosts.map((post) => [post.id, post]));
  for (const user of seedUsers) {
    if (user.status !== "active" || (!cache.has(user.id) && !read(prefix + user.id))) continue;
    const state = stateFor(user.id);
    const deliverable = new Map<string, StoredSearch[]>();
    let changed = false;
    for (const search of state.searches) {
      if (!search.enabled || lifeSearchExpired(search, now)) continue;
      const seen = new Set(search.seen);
      for (const post of seedKnowledgePosts) {
        const publishedAt = Date.parse(post.publishedAt || post.createdAt);
        if (post.status !== "Published" || !Number.isFinite(publishedAt) || publishedAt > now.getTime() || publishedAt < Date.parse(search.startedAt) || seen.has(post.id)) continue;
        seen.add(post.id); changed = true;
        if (accessible(post, user.id) && matchesLifeSearch(post, search.filters, user.id, now)) {
          search.matchCount += 1;
          deliverable.set(post.id, [...(deliverable.get(post.id) || []), search]);
        }
      }
      search.seen = [...seen];
    }
    for (const [postId, searches] of deliverable) {
      if (state.delivered.includes(postId)) continue;
      const post = posts.get(postId)!;
      const notification: Notification = {
        id: `life_search_notice_${crypto.randomUUID()}`, userId: user.id, source: "StudentLifeSearch",
        title: "Có bài mới phù hợp với tìm kiếm của bạn",
        body: `Khớp: ${lifeSearchLabels(searches[0].filters).slice(1).join(" · ")}. ${post.title || post.contentMd.slice(0, 80)}${searches.length > 1 ? ` · Phù hợp ${searches.length} tìm kiếm đã lưu` : ""}`.slice(0, 550),
        linkTo: `/knowledge/${post.id}`, read: false, createdAt: now.toISOString(),
      };
      state.alerts.unshift(notification);
      state.delivered.push(postId); changed = true;
    }
    const previousAlerts = state.alerts.length;
    state.alerts = state.alerts.filter((notice) => {
      const post = posts.get(notice.linkTo.slice("/knowledge/".length));
      return post && ["Published", "Closed"].includes(post.status) && accessible(post, user.id);
    }).slice(0, 100);
    if (previousAlerts !== state.alerts.length) changed = true;
    // Sync persisted read state without touching other notification sources.
    for (const notice of state.alerts) {
      const existing = seedNotifications.find((item) => item.id === notice.id);
      if (existing) Object.assign(existing, notice); else seedNotifications.unshift({ ...notice });
    }
    const allowed = new Set(state.alerts.map((item) => item.id));
    for (let i = seedNotifications.length - 1; i >= 0; i--) if (seedNotifications[i].source === "StudentLifeSearch" && seedNotifications[i].userId === user.id && !allowed.has(seedNotifications[i].id)) seedNotifications.splice(i, 1);
    if (changed) save(user.id, state);
  }
  seedNotifications.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}
export function persistLifeSearchRead(notice: Notification) {
  if (notice.source !== "StudentLifeSearch") return;
  const state = stateFor(notice.userId), stored = state.alerts.find((item) => item.id === notice.id);
  if (stored) { stored.read = notice.read; save(notice.userId, state); }
}
