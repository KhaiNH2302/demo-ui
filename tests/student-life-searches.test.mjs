import test, { after } from "node:test";
import assert from "node:assert/strict";
import { http } from "msw";
import { setupServer } from "msw/node";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { knowledgeHandlers } from "../src/mocks/handlers/studentLife.ts";
import { lifeSearchHandlers } from "../src/mocks/handlers/lifeSearches.ts";
import { notificationHandlers } from "../src/mocks/handlers/notifications.ts";
import { seedKnowledgePosts } from "../src/mocks/data/knowledge.ts";
import { seedNotifications } from "../src/mocks/data/notifications.ts";
import { seedUsers } from "../src/mocks/data/users.ts";
import { normalizeLifeSearchFilters, lifeSearchDraft, lifeSearchExpiry, lifeSearchExpired, matchesLifeSearch, lifeSearchSignature } from "../src/lib/lifeSearches.ts";
import { currentLifeDate } from "../src/lib/studentLifeDetails.ts";
import { writeLifeSearch, listLifeSearches, persistLifeSearchDemoPost, reconcileLifeSearchAlerts } from "../src/mocks/lifeSearches.ts";
import { LifeSearchCriteria } from "../src/components/shared/LifeSearchWatch.tsx";

const server = setupServer(...[...knowledgeHandlers, ...lifeSearchHandlers, ...notificationHandlers].map((h) => http[h.info.method.toLowerCase()](`http://localhost${h.info.path}`, h.resolver)));
server.listen({ onUnhandledRequest: "error" });
after(() => server.close());
async function api(path, method = "GET", body, user = "usr_student_01") {
  const response = await fetch(`http://localhost/api/v1${path}`, { method, headers: { "Content-Type": "application/json", ...(user ? { Authorization: `Bearer mock_jwt_token_${user}` } : { "X-Demo-Sample": "1" }) }, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });
  return { status: response.status, ...(await response.json()) };
}
const filters = { topic: "housing", campus: "Hòa Lạc", area: "Xã Hạ Bằng", housingKind: "roommate", maxRent: "1500000", priceUnit: "person", people: "2", amenity: "Điều hòa,Khép kín" };
const payload = { lifeTopic: "housing", campus: filters.campus, area: filters.area, type: "discussion", title: "Tìm bạn cùng phòng", contentMd: "Mình còn một chỗ ở ghép, cần tìm bạn cùng phòng.", tags: [], attachments: [], visibility: "cross_school", housingPost: { kind: "roommate", area: filters.area, price: 1200000, priceUnit: "person", people: 2, amenities: ["Điều hòa", "Khép kín"], closed: false } };
const post = (patch = {}) => ({ ...payload, id: crypto.randomUUID(), authorId: "usr_student_02", status: "Published", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), likesCount: 0, commentCount: 0, ...patch });
const notices = (userId) => seedNotifications.filter((item) => item.userId === userId && item.source === "StudentLifeSearch");

test("search contract validates campus, area, budget units and never stores sorting, GPS or unrelated filters", () => {
  assert.throws(() => normalizeLifeSearchFilters({ ...filters, priceUnit: "" }), /theo phòng hay theo người/);
  assert.throws(() => normalizeLifeSearchFilters({ ...filters, campus: "Đà Nẵng" }), /Khu vực/);
  assert.throws(() => normalizeLifeSearchFilters({ ...filters, housingKind: "rental" }), /không hợp lệ/);
  assert.throws(() => normalizeLifeSearchFilters({ ...filters, maxRent: "NaN" }), /Mức giá/);
  assert.throws(() => normalizeLifeSearchFilters({ ...filters, amenity: "Không có trong danh sách" }), /Tiện ích/);
  const canonical = normalizeLifeSearchFilters({ ...filters, amenity: "Khép kín,Điều hòa,Điều hòa", sort: "hot", latitude: "21", radius: "3", experienceCategory: "ojt", tab: "mine" });
  assert.equal(canonical.sort, undefined);
  assert.equal(canonical.latitude, undefined);
  assert.equal(canonical.experienceCategory, undefined);
  assert.equal(canonical.tab, undefined);
  assert.equal(lifeSearchSignature(canonical), lifeSearchSignature(normalizeLifeSearchFilters(filters)));
  assert.equal(lifeSearchDraft(new URLSearchParams({ topic: "food", campus: "Hòa Lạc", sort: "hot", latitude: "21" })).type, "review");
});

test("saved calendar conditions expire in Vietnam time instead of rolling into the next year", () => {
  const now = new Date("2026-10-31T03:00:00Z");
  assert.equal(lifeSearchExpiry({ moveMonth: "11" }, now), "2026-11-30T17:00:00.000Z");
  assert.equal(lifeSearchExpiry({ rideDate: "2026-11-01" }, now), "2026-11-01T17:00:00.000Z");
  assert.equal(lifeSearchExpired({ expiresAt: lifeSearchExpiry({ moveMonth: "11" }, now) }, new Date("2027-01-01T00:00:00Z")), true);
  assert.throws(() => normalizeLifeSearchFilters({ ...filters, moveMonth: "01" }, now), /đã qua/);
  assert.throws(() => normalizeLifeSearchFilters({ topic: "transport", campus: "Hòa Lạc", rideDate: "2026-02-30" }, now));
});

test("matching requires every criterion, excludes wrong housing intents, units, closed, own and pending posts", () => {
  const p = post();
  assert.equal(matchesLifeSearch(p, filters, "usr_student_01"), true);
  for (const patch of [{ kind: "seeking" }, { priceUnit: "room" }, { price: 1600000 }, { people: 3 }, { amenities: ["Điều hòa"] }, { closed: true }]) assert.equal(matchesLifeSearch({ ...p, housingPost: { ...p.housingPost, ...patch } }, filters, "usr_student_01"), false);
  assert.equal(matchesLifeSearch({ ...p, area: "Xã Hòa Lạc" }, filters, "usr_student_01"), false);
  assert.equal(matchesLifeSearch({ ...p, authorId: "usr_student_01" }, filters, "usr_student_01"), false);
  assert.equal(matchesLifeSearch({ ...p, status: "PendingReview" }, filters, "usr_student_01"), false);
  const ride = post({ lifeTopic: "transport", housingPost: undefined, ridePost: { kind: "offering", origin: "A", destination: "B", departure: "2026-10-31T06:00" } });
  assert.equal(matchesLifeSearch(ride, { topic: "transport", campus: "Hòa Lạc" }, "usr_student_01", new Date("2026-10-31T03:00:00Z")), true); // A reminder date does not hide an existing ride.
});

test("CRUD requires actual authentication, isolates owners, rejects duplicates and malformed writes", async () => {
  assert.equal((await api("/community/searches", "POST", { name: "Mẫu", filters }, null)).status, 401);
  assert.equal((await api("/community/searches", "GET", undefined, null)).status, 401);
  const created = await api("/community/searches", "POST", { name: "Ở ghép Hạ Bằng", filters });
  assert.equal(created.status, 200);
  assert.equal((await api("/community/searches", "POST", { name: "Trùng", filters: { ...filters, amenity: "Khép kín,Điều hòa" } })).status, 400);
  assert.equal((await api(`/community/searches/${created.data.id}`, "PATCH", { enabled: false }, "usr_student_02")).status, 404);
  assert.equal((await api(`/community/searches/${created.data.id}`, "DELETE", undefined, "usr_student_02")).status, 404);
  assert.equal((await api("/community/searches", "POST", null)).status, 400);
  assert.equal((await api(`/community/searches/${created.data.id}`, "PATCH", { enabled: "false" })).status, 400);
  assert.equal((await api("/community/searches")).data.length, 1);
  assert.ok(localStorage.getItem("scs_life_searches_v1_usr_student_01").includes("Ở ghép Hạ Bằng"));
});

test("new API publications notify once, old posts and edits do not, and notification links open the actual post", async () => {
  assert.equal(notices("usr_student_01").length, 0);
  const created = await api("/posts", "POST", payload, "usr_student_02");
  assert.equal(created.status, 200);
  assert.equal(notices("usr_student_01").length, 1);
  const notice = notices("usr_student_01")[0];
  assert.equal(notice.linkTo, `/knowledge/${created.data.id}`);
  assert.equal((await api(`/posts/${created.data.id}`)).status, 200);
  await api(`/posts/${created.data.id}`, "PUT", { ...payload, title: "Sửa tiêu đề" }, "usr_student_02");
  await api("/notifications"); await api("/community/searches");
  assert.equal(notices("usr_student_01").length, 1);
  await api("/posts", "POST", payload);
  assert.equal(notices("usr_student_01").length, 1);
  const own = (await api("/community/searches")).data[0];
  const results = await api(`/posts?searchId=${own.id}`);
  assert.ok(results.data.some((p) => p.id === created.data.id));
  assert.ok(results.data.every((p) => p.authorId !== "usr_student_01" && p.housingPost.priceUnit === "person"));
  assert.equal((await api(`/posts?searchId=${own.id}`, "GET", undefined, "usr_student_02")).status, 404);
  await api(`/notifications/${notice.id}/read`, "POST");
  assert.equal((await api("/notifications?source=StudentLifeSearch")).data[0].read, true);
});

test("pause skips intervening publications, resume only watches new ones, edits reset the observation start", async () => {
  const watch = (await api("/community/searches")).data[0];
  const before = notices("usr_student_01").length;
  await api(`/community/searches/${watch.id}`, "PATCH", { enabled: false });
  await api("/posts", "POST", payload, "usr_student_02");
  assert.equal(notices("usr_student_01").length, before);
  await api(`/community/searches/${watch.id}`, "PATCH", { enabled: true });
  await api("/notifications");
  assert.equal(notices("usr_student_01").length, before);
  await api("/posts", "POST", payload, "usr_student_02");
  assert.equal(notices("usr_student_01").length, before + 1);
  await api(`/community/searches/${watch.id}`, "PATCH", { name: "Nhượng phòng", filters: { ...filters, housingKind: "transfer" } });
  await api("/posts", "POST", payload, "usr_student_02");
  assert.equal(notices("usr_student_01").length, before + 1);
});

test("overlapping watches produce one notification per post and pending posts only notify after approval", async () => {
  await api("/community/searches", "POST", { name: "Toàn bộ tin trọ", filters: { topic: "housing", campus: "Hòa Lạc" } });
  const before = notices("usr_student_01").length;
  const transfer = { ...payload, housingPost: { ...payload.housingPost, kind: "transfer" } };
  await api("/posts", "POST", transfer, "usr_student_02");
  assert.equal(notices("usr_student_01").length, before + 1);
  localStorage.setItem("scs_mock_scenarios", JSON.stringify({ post_auto_flagged: true }));
  const pending = await api("/posts", "POST", transfer, "usr_student_02");
  localStorage.removeItem("scs_mock_scenarios");
  assert.equal(pending.data.status, "PendingReview");
  assert.equal(notices("usr_student_01").length, before + 1);
  const approved = seedKnowledgePosts.find((p) => p.id === pending.data.id);
  approved.status = "Published"; approved.publishedAt = new Date().toISOString();
  await api("/notifications");
  assert.equal(notices("usr_student_01").length, before + 2);
  await api("/notifications");
  assert.equal(notices("usr_student_01").length, before + 2);
});

test("school-only publications never alert users outside the author's school", () => {
  const user = seedUsers.find((u) => u.roles.some((role) => role.toLowerCase() === "student") && u.status === "active" && u.school !== seedUsers[0].school);
  assert.ok(user);
  const before = notices(user.id).length;
  const now = new Date();
  writeLifeSearch(user.id, { name: "Theo dõi trọ", filters }, undefined, now);
  seedKnowledgePosts.unshift(post({ visibility: "school", publishedAt: new Date(now.getTime() + 100).toISOString() }));
  reconcileLifeSearchAlerts(new Date(now.getTime() + 1000));
  assert.equal(notices(user.id).length, before);
});

test("trial creates a labeled matching post, survives rehydration, and does not repeatedly generate alerts", async () => {
  const watch = (await api("/community/searches")).data.find((s) => s.filters.housingKind === "transfer");
  const before = notices("usr_student_01").length;
  const result = await api(`/community/searches/${watch.id}/demo`, "POST");
  assert.equal(result.status, 200);
  const demo = (await api(`/posts/${result.data.postId}`)).data.post;
  assert.equal(demo.demoContent.kind, "synthetic");
  assert.equal(demo.housingPost.kind, "transfer");
  assert.equal(notices("usr_student_01").length, before + 1);
  // Force a persisted-state reload, as a fresh page would, and restore the demo post.
  const key = "scs_life_searches_v1_usr_student_01";
  localStorage.setItem(key, JSON.stringify(JSON.parse(localStorage.getItem(key)), null, 2));
  seedKnowledgePosts.splice(seedKnowledgePosts.findIndex((p) => p.id === demo.id), 1);
  const notice = notices("usr_student_01").find((n) => n.linkTo.endsWith(demo.id));
  await api(`/notifications/${notice.id}/read`, "POST");
  await api("/notifications");
  assert.ok(seedKnowledgePosts.some((p) => p.id === demo.id));
  assert.equal(notices("usr_student_01").length, before + 1);
  assert.equal(notices("usr_student_01").find((n) => n.id === notice.id).read, true);
  assert.equal((await api(`/community/searches/${watch.id}/demo`, "POST", undefined, "usr_student_02")).status, 404);
});

test("deleting a watch stops future deliveries, malformed storage is recoverable and search summaries explain the criteria", async () => {
  for (const watch of (await api("/community/searches")).data) await api(`/community/searches/${watch.id}`, "DELETE");
  const before = notices("usr_student_01").length;
  await api("/posts", "POST", payload, "usr_student_02");
  assert.equal(notices("usr_student_01").length, before);
  localStorage.setItem("scs_life_searches_v1_usr_student_03", "{broken");
  assert.deepEqual(listLifeSearches("usr_student_03"), []);
  const html = renderToStaticMarkup(React.createElement(LifeSearchCriteria, { filters }));
  assert.ok(html.includes("Hạ Bằng"));
  assert.ok(html.includes("người/tháng"));
  assert.ok(html.includes("Tìm người ở ghép"));
  assert.equal(currentLifeDate().length, 10);
});

test("unresolved-question searches preserve the actual predicate even though ranking order is not stored", () => {
  const draft = lifeSearchDraft(new URLSearchParams({ topic: "experience", campus: "Hòa Lạc", sort: "unanswered" }));
  const canonical = normalizeLifeSearchFilters(draft);
  const question = post({ lifeTopic: "experience", type: "question", housingPost: undefined, isSolved: false });
  assert.equal(canonical.unanswered, "1");
  assert.equal(matchesLifeSearch(question, canonical, "usr_student_01"), true);
  assert.equal(matchesLifeSearch({ ...question, isSolved: true }, canonical, "usr_student_01"), false);
  assert.equal(matchesLifeSearch({ ...question, type: "discussion" }, canonical, "usr_student_01"), false);
});

test("the watch limit is enforced and paused or expired watches cannot generate trial publications", async () => {
  for (let i = 0; i < 10; i++) writeLifeSearch("usr_student_03", { name: `Tìm kiếm ${i}`, filters: { topic: "experience", campus: "Hòa Lạc", q: `nhu cầu ${i}` } });
  assert.throws(() => writeLifeSearch("usr_student_03", { name: "Tìm kiếm 11", filters: { topic: "experience", campus: "Hòa Lạc", q: "khác" } }), /tối đa 10/);
  const created = await api("/community/searches", "POST", { name: "Thử khi tạm dừng", filters: { topic: "food", campus: "Hòa Lạc", maxPrice: "30000" } });
  await api(`/community/searches/${created.data.id}`, "PATCH", { enabled: false });
  assert.equal((await api(`/community/searches/${created.data.id}/demo`, "POST")).status, 409);
});

test("hidden and deleted trial posts do not reappear after persistence rehydration", async () => {
  const watch = (await api("/community/searches")).data.find((item) => item.filters.topic === "food");
  await api(`/community/searches/${watch.id}`, "PATCH", { enabled: true });
  const created = await api(`/community/searches/${watch.id}/demo`, "POST");
  const p = seedKnowledgePosts.find((item) => item.id === created.data.postId);
  p.status = "Hidden";
  persistLifeSearchDemoPost(p);
  seedKnowledgePosts.splice(seedKnowledgePosts.indexOf(p), 1);
  assert.equal((await api(`/posts/${p.id}`)).status, 404);
  const restored = seedKnowledgePosts.find((item) => item.id === p.id);
  assert.equal(restored.status, "Hidden");
  assert.ok(!notices("usr_student_01").some((notice) => notice.linkTo.endsWith(p.id)));
  assert.equal((await api(`/posts/${p.id}`, "DELETE", undefined, p.authorId)).status, 200);
  await api("/notifications");
  assert.ok(!seedKnowledgePosts.some((item) => item.id === p.id));
  assert.ok(!JSON.parse(localStorage.getItem("scs_life_search_posts_v1")).some((item) => item.id === p.id));
});
