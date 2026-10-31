import test, { after } from "node:test";
import assert from "node:assert/strict";
import { http } from "msw";
import { setupServer } from "msw/node";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { knowledgeHandlers } from "../src/mocks/handlers/studentLife.ts";
import { notificationHandlers } from "../src/mocks/handlers/notifications.ts";
import { newModulesHandlers } from "../src/mocks/handlers/newModules.ts";
import { profileHandlers } from "../src/mocks/handlers/profile.ts";
import { seedKnowledgePosts } from "../src/mocks/data/knowledge.ts";
import { seedNotifications } from "../src/mocks/data/notifications.ts";
import { defaultLifeExpectedDay, lifeDayStart, lifeExpectedAt, lifeReminderDue, lifeReminderFields, lifeDiscoverable, lifeCanRespond, migrateLifePost, LIFE_OWNER_STATUSES } from "../src/lib/lifePostLifecycle.ts";
import { initialLifeForm, lifeFormErrors, lifePostPayload, readLifeDraft } from "../src/lib/studentLifeForm.ts";
import { persistLifePost, reconcileLifePostNotices, restoreLifePosts } from "../src/mocks/lifePostLifecycle.ts";
import { writeLifeSearch, reconcileLifeSearchAlerts, listLifeSearches } from "../src/mocks/lifeSearches.ts";
import { LifePostReminderFields } from "../src/components/shared/LifePostReminderFields.tsx";
import { PassPostFields, HousingPostFields } from "../src/components/shared/TopicPostFields.tsx";

const server = setupServer(...[...knowledgeHandlers, ...notificationHandlers, ...profileHandlers, ...newModulesHandlers].map((h) => http[h.info.method.toLowerCase()](`http://localhost${h.info.path}`, h.resolver)));
server.listen({ onUnhandledRequest: "error" });
after(() => server.close());
const owner = "usr_student_01", other = "usr_student_02";
async function api(path, method = "GET", body, user = owner) {
  const response = await fetch(`http://localhost/api/v1${path}`, { method, headers: { "Content-Type": "application/json", Authorization: `Bearer mock_jwt_token_${user}` }, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });
  return { status: response.status, ...(await response.json()) };
}
function form(patch = {}) {
  return { ...initialLifeForm({ defaultTopic: "marketplace", defaultCampus: "Hòa Lạc", defaultArea: "Xã Hạ Bằng" }), content: "Tin thử nhắc kiểm tra nhu cầu, hẹn nhận ở trường.", passPost: { itemName: "Đèn kiểm tra nhu cầu", category: "household", condition: "good", price: 100000 }, visibility: "cross_school", ...patch };
}
const payload = (patch = {}) => lifePostPayload(form(patch));
async function create(body = payload()) {
  const result = await api("/posts", "POST", body); assert.equal(result.status, 200, JSON.stringify(result)); return seedKnowledgePosts.find((p) => p.id === result.data.id);
}
const notices = (id) => seedNotifications.filter((n) => n.source === "StudentLifeLifecycle" && n.linkTo === `/knowledge/${id}`);
const rehydrate = () => { const key = "scs_life_post_lifecycle_v1"; localStorage.setItem(key, localStorage.getItem(key) + " "); };

test("expected day starts in Vietnam time; passing it never changes visibility or comments", () => {
  const now = new Date("2026-12-31T18:00:00Z");
  assert.equal(defaultLifeExpectedDay({ lifeTopic: "marketplace" }, now), "2027-01-15");
  assert.equal(defaultLifeExpectedDay({ lifeTopic: "housing", housingPost: { kind: "seeking" } }, now), "2027-01-31");
  assert.equal(lifeDayStart("2027-01-01"), "2026-12-31T17:00:00.000Z"); assert.equal(lifeDayStart("2027-02-30"), undefined);
  const p = { lifeTopic: "marketplace", status: "Published", expectedCompletionAt: lifeDayStart("2027-01-01") };
  assert.equal(lifeReminderDue(p, new Date("2026-12-31T16:59:59.999Z")), false); assert.equal(lifeReminderDue(p, now), true);
  assert.equal(lifeDiscoverable(p), true); assert.equal(lifeCanRespond(p), true);
  assert.ok(!LIFE_OWNER_STATUSES.some(([key]) => ["Completed", "Expired"].includes(key)));
});

test("forms and draft recovery use expected-date reminders with no completion selector", () => {
  for (const topic of ["food", "experience", "conversation"]) assert.deepEqual(lifeReminderFields({ lifeTopic: topic }), { expectedCompletionAt: undefined, remindOnExpectedDate: undefined });
  const state = form({ remindOnExpectedDate: false }); assert.deepEqual(lifeFormErrors(state), []);
  assert.ok(lifeFormErrors({ ...state, expectedOn: "" }).some((s) => s.includes("ngày hoàn thành dự kiến")));
  const recovered = initialLifeForm({ draft: readLifeDraft(JSON.stringify(state)) });
  assert.equal(recovered.expectedOn, state.expectedOn); assert.equal(recovered.remindOnExpectedDate, false);
  assert.equal(lifePostPayload({ ...state, topic: "conversation" }).expectedCompletionAt, undefined);
  const html = (post) => renderToStaticMarkup(React.createElement(LifePostReminderFields, { post, expectedOn: state.expectedOn, onExpectedOn() {}, reminder: true, onReminder() {} }));
  assert.equal(html({ lifeTopic: "food" }), ""); assert.ok(html(payload()).includes("Ngày hoàn thành dự kiến"));
  assert.ok(html(payload()).includes("Bài chỉ ẩn khi bạn chủ động chọn"));
  assert.ok(!html({ lifeTopic: "transport", ridePost: { departure: "2027-01-01T06:30" } }).includes('type="date"'));
  const pass = renderToStaticMarkup(React.createElement(PassPostFields, { value: state.passPost, onChange() {} }));
  const housing = renderToStaticMarkup(React.createElement(HousingPostFields, { value: { kind: "roommate", amenities: [] }, onChange() {} }));
  assert.ok(!pass.includes("Đã pass / đã tặng")); assert.ok(!housing.includes("Tình trạng tin"));
});

test("API validates new reminder dates and retires the separate completion operation", async () => {
  const body = payload(), missing = { ...body }; delete missing.expectedCompletionAt; delete missing.remindOnExpectedDate;
  assert.ok((await create(missing)).expectedCompletionAt);
  for (const expectedCompletionAt of ["garbage", "2027-02-30T00:00:00Z", "2020-01-01T00:00:00Z", null]) assert.equal((await api("/posts", "POST", { ...body, expectedCompletionAt })).status, 400);
  assert.equal((await api("/posts", "POST", { ...body, remindOnExpectedDate: "false" })).status, 400);
  assert.equal((await api("/posts", "POST", { ...body, passPost: { ...body.passPost, closed: true } })).status, 400);
  const p = await create(); assert.equal((await api(`/posts/${p.id}/completion`, "PUT", { completed: true })).status, 410);
});

test("manual hide/show protects ownership, direct links, discovery, saved, search and profiles", async () => {
  const p = await create(); await api(`/posts/${p.id}/save`, "POST", undefined, other);
  for (const user of [other, "guest"]) assert.equal((await api(`/posts/${p.id}/visibility`, "PUT", { hidden: true }, user)).status, 403);
  assert.equal((await api(`/posts/${p.id}/visibility`, "PUT", { hidden: "true" })).status, 400);
  await api(`/posts/${p.id}/visibility`, "PUT", { hidden: true });
  assert.equal((await api(`/posts/${p.id}`, "GET", undefined, other)).status, 404); assert.equal((await api(`/posts/${p.id}`)).status, 200);
  for (const route of ["/posts", "/posts?tab=saved", "/posts/saved"]) assert.ok(!(await api(route, "GET", undefined, other)).data.some((item) => item.id === p.id));
  assert.ok((await api("/posts?tab=mine&status=AuthorHidden")).data.some((item) => item.id === p.id));
  assert.ok(!(await api("/search?q=Đèn", "GET", undefined, other)).data.posts.some((item) => item.id === p.id));
  assert.ok(!JSON.stringify((await api(`/users/${owner}`, "GET", undefined, other)).data).includes(p.id));
  const shown = await api(`/posts/${p.id}/visibility`, "PUT", { hidden: false }); assert.equal(shown.data.publishedAt, p.publishedAt);
});

test("polling sends one private reminder when due and keeps the post discoverable and open for replies", async () => {
  const p = await create(); p.expectedCompletionAt = new Date(Date.now() - 1000).toISOString(); persistLifePost(p);
  const notice = (await api("/notifications?source=StudentLifeLifecycle")).data.find((n) => n.linkTo === `/knowledge/${p.id}`);
  assert.ok(notice); assert.ok(notice.title.includes("đã xong nhu cầu")); assert.ok(notice.body.includes("hãy ẩn bài"));
  assert.equal(p.authorHidden, undefined); assert.equal(p.status, "Published"); assert.equal(p.passPost.closed, false);
  assert.ok((await api("/posts", "GET", undefined, other)).data.some((item) => item.id === p.id));
  assert.equal((await api(`/posts/${p.id}/comments`, "POST", { content: "Mình quan tâm" }, other)).status, 200);
  assert.ok(!(await api("/notifications?source=StudentLifeLifecycle", "GET", undefined, other)).data.some((n) => n.id === notice.id));
  await api("/notifications?source=StudentLifeLifecycle"); assert.equal(notices(p.id).length, 1);
  assert.equal((await api(`/notifications/${notice.id}/read`, "POST", undefined, other)).status, 403);
  await api(`/notifications/${notice.id}/read`, "POST"); rehydrate(); reconcileLifePostNotices();
  assert.equal(notices(p.id)[0].read, true); assert.equal(notices(p.id).length, 1);
});

test("no advance or forced expiry notices; muted, hidden and unapproved posts stay quiet", async () => {
  const now = new Date(), active = await create(); active.expectedCompletionAt = new Date(now.getTime() + 1000).toISOString(); persistLifePost(active);
  reconcileLifePostNotices(now); assert.equal(notices(active.id).length, 0);
  reconcileLifePostNotices(new Date(now.getTime() + 1000)); assert.equal(notices(active.id).length, 1);
  for (const patch of [{ remindOnExpectedDate: false }, { authorHidden: true }, { status: "PendingReview" }]) {
    const p = await create(); Object.assign(p, patch, { expectedCompletionAt: new Date(now.getTime() - 1).toISOString() }); persistLifePost(p);
    reconcileLifePostNotices(now); assert.equal(notices(p.id).length, 0);
  }
});

test("a past expected day does not prevent showing, editing content or rescheduling; hiding remains an independent choice", async () => {
  const p = await create(), firstPublished = p.publishedAt; p.expectedCompletionAt = lifeDayStart("2020-01-02"); persistLifePost(p);
  await api("/notifications"); assert.equal(notices(p.id).length, 1);
  const state = initialLifeForm({ post: p }); assert.deepEqual(lifeFormErrors(state), []);
  assert.equal((await api(`/posts/${p.id}`, "PUT", lifePostPayload(state))).status, 200);
  await api(`/posts/${p.id}/visibility`, "PUT", { hidden: true });
  assert.equal((await api(`/posts/${p.id}/comments`, "POST", { content: "Hỏi thêm" })).status, 409);
  assert.equal((await api(`/posts/${p.id}/visibility`, "PUT", { hidden: false })).status, 200);
  await api(`/posts/${p.id}/visibility`, "PUT", { hidden: true });
  const changed = await api(`/posts/${p.id}`, "PUT", payload()); assert.equal(changed.status, 200);
  assert.equal(changed.data.authorHidden, true); assert.equal(changed.data.publishedAt, firstPublished); assert.equal(notices(p.id).length, 0);
  await api(`/posts/${p.id}/visibility`, "PUT", { hidden: false });
  reconcileLifePostNotices(new Date(Date.parse(p.expectedCompletionAt) + 1)); assert.equal(notices(p.id).length, 1);
  reconcileLifePostNotices(new Date(Date.parse(p.expectedCompletionAt) + 1000)); assert.equal(notices(p.id).length, 1);
});

test("pending/rejected/moderator-hidden posts cannot self-publish through visibility or edits", async () => {
  for (const status of ["PendingReview", "Rejected", "Hidden", "TemporarilyHidden"]) {
    const p = await create(); p.status = status; persistLifePost(p);
    assert.equal((await api(`/posts/${p.id}/visibility`, "PUT", { hidden: false })).status, 409);
    const result = await api(`/posts/${p.id}`, "PUT", { ...payload(), status: "Published", authorHidden: false });
    assert.equal(result.data.status, "PendingReview"); assert.equal((await api(`/posts/${p.id}`, "GET", undefined, other)).status, 404);
  }
});

test("ride reminders use departure time and never automatically close the ride", async () => {
  const p = await create({ ...payload(), lifeTopic: "transport", passPost: undefined, expectedCompletionAt: undefined, ridePost: { kind: "offering", origin: "Mỹ Đình", destination: "Hòa Lạc", departure: "2027-12-01T06:30" } });
  assert.equal(lifeExpectedAt(p), "2027-11-30T23:30:00.000Z"); const expected = Date.parse(lifeExpectedAt(p));
  reconcileLifePostNotices(new Date(expected - 1)); assert.equal(notices(p.id).length, 0);
  reconcileLifePostNotices(new Date(expected)); assert.equal(notices(p.id).length, 1);
  assert.equal(lifeDiscoverable(p), true); assert.equal(lifeCanRespond(p), true);
});

test("persistence restores hiding; deletion leaves tombstones; retired completed/expiry records migrate without resurfacing", async () => {
  const p = await create(); await api(`/posts/${p.id}/visibility`, "PUT", { hidden: true });
  p.authorHidden = false; rehydrate(); assert.equal((await api(`/posts/${p.id}`, "GET", undefined, other)).status, 404);
  const oldCopy = { ...p }; await api(`/posts/${p.id}`, "DELETE"); seedKnowledgePosts.unshift(oldCopy); rehydrate(); restoreLifePosts();
  assert.ok(!seedKnowledgePosts.some((item) => item.id === p.id));
  const old = migrateLifePost({ ...p, expectedCompletionAt: undefined, remindOnExpectedDate: undefined, expiresAt: "2026-11-14T16:59:59.999Z", remindBeforeExpiry: false, passPost: { ...p.passPost, closed: true } });
  assert.equal(old.authorHidden, true); assert.equal(old.expectedCompletionAt, "2026-11-13T17:00:00.000Z");
  assert.equal(old.remindOnExpectedDate, false); assert.equal(old.expiresAt, undefined);
});

test("reminders, rescheduling and showing old posts never manufacture a saved-search publication", async () => {
  const p = await create(), firstPublished = p.publishedAt, start = new Date(Date.now() + 1000);
  writeLifeSearch(other, { name: "Nhắc nhu cầu đồ gia dụng", filters: { topic: "marketplace", campus: "Hòa Lạc", passCategory: "household" } }, undefined, start);
  p.expectedCompletionAt = "2020-01-01T00:00:00Z"; persistLifePost(p); reconcileLifeSearchAlerts(new Date(start.getTime() + 1000));
  assert.equal(lifeDiscoverable(p), true); assert.equal(listLifeSearches(other)[0].matchCount, 0);
  await api(`/posts/${p.id}/visibility`, "PUT", { hidden: true }); await api(`/posts/${p.id}/visibility`, "PUT", { hidden: false });
  assert.equal(p.publishedAt, firstPublished); assert.equal(listLifeSearches(other)[0].matchCount, 0);
});
