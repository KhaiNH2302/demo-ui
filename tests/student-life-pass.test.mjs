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
import { LIFE_TOPICS } from "../src/lib/studentLife.ts";
import { PASS_CATEGORIES, PASS_CONDITIONS, matchesTopicFilters } from "../src/lib/studentLifeDetails.ts";
import { CAMPUS_AREAS } from "../src/lib/campusAreas.ts";
import { initialLifeForm, lifeFormErrors, lifePostPayload, readLifeDraft } from "../src/lib/studentLifeForm.ts";
import { normalizeLifeSearchFilters } from "../src/lib/lifeSearches.ts";
import { ThreadComposer } from "../src/components/shared/StudentLifeComposer.tsx";
import { TopicNavigation } from "../src/components/shared/TopicNavigation.tsx";
import { TopicPostSummary } from "../src/components/shared/TopicPostSummary.tsx";
import { TopicFeedFilters } from "../src/components/shared/TopicFeedFilters.tsx";
import { ToastProvider } from "../src/components/ui/Toast.tsx";

const server = setupServer(...[...knowledgeHandlers, ...lifeSearchHandlers, ...notificationHandlers].map((h) => http[h.info.method.toLowerCase()](`http://localhost${h.info.path}`, h.resolver)));
server.listen({ onUnhandledRequest: "error" });
after(() => server.close());
async function api(path, method = "GET", body, user = "usr_student_01") {
  const response = await fetch(`http://localhost/api/v1${path}`, { method, headers: { "Content-Type": "application/json", Authorization: `Bearer mock_jwt_token_${user}` }, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });
  return { status: response.status, ...(await response.json()) };
}
const item = { itemName: "Quạt bàn", category: "household", condition: "good", price: 150000, closed: false };
const state = (patch = {}) => ({ ...initialLifeForm({ defaultTopic: "marketplace", defaultCampus: "Hòa Lạc", defaultArea: "Xã Hạ Bằng" }), content: "Mình dọn trọ nên pass quạt, còn chạy tốt. Hẹn nhận ở cổng trường.", passPost: { ...item }, ...patch });

test("Pass đồ replaces the retired topic in navigation and the composer uses its own complete form", () => {
  assert.ok(LIFE_TOPICS.some((topic) => topic.value === "marketplace"));
  assert.ok(!LIFE_TOPICS.some((topic) => topic.value === "campus"));
  assert.ok(!seedKnowledgePosts.some((post) => post.lifeTopic === "campus"));
  const nav = renderToStaticMarkup(React.createElement(TopicNavigation, { value: "marketplace", onChange() {} }));
  assert.ok(nav.includes("Pass đồ"));
  assert.ok(!nav.includes("Chuyện quanh trường"));
  const html = renderToStaticMarkup(React.createElement(ToastProvider, null, React.createElement(ThreadComposer, { variant: "page", post: { ...lifePostPayload(state()), id: "pass-form", authorId: "usr_student_01", status: "Published" } })));
  for (const label of ["Tên món đồ", "Loại đồ", "Tình trạng món đồ", "Giá pass", "Tặng miễn phí", "Điểm hẹn nhận đồ"]) assert.ok(html.includes(label), label);
  assert.ok(!html.includes("Hình thức bài viết"));
  assert.ok(!html.includes("Chuyện quanh trường"));
  assert.doesNotMatch(html.match(/<button\b[^>]*type="submit"[^>]*>/)[0], /\sdisabled(?:=|\s|>)/);
});

test("pass form validates required details, preserves drafts and drops metadata on topic changes", () => {
  assert.deepEqual(lifeFormErrors(state()), []);
  for (const patch of [{ itemName: " " }, { category: undefined }, { condition: undefined }, { price: undefined }, { price: -1 }, { price: 0.5 }]) assert.ok(lifeFormErrors(state({ passPost: { ...item, ...patch } })).length);
  const free = state({ passPost: { ...item, price: 0 }, type: "question", title: "Tiêu đề cũ" });
  assert.deepEqual(lifeFormErrors(free), []);
  assert.equal(lifePostPayload(free).type, "discussion");
  assert.equal(lifePostPayload(free).title, "Tặng Quạt bàn");
  const recovered = initialLifeForm({ draft: readLifeDraft(JSON.stringify(free)) });
  assert.equal(recovered.passPost.price, 0);
  assert.equal(recovered.passPost.itemName, item.itemName);
  assert.equal(lifePostPayload({ ...free, topic: "conversation" }).passPost, undefined);
  assert.equal(readLifeDraft(JSON.stringify({ topic: "campus", content: "Bài nháp cũ" })).topic, "conversation");
});

test("pass API persists edits and validates category, condition, price, post type and topic", async () => {
  const payload = lifePostPayload(state());
  const created = await api("/posts", "POST", payload);
  assert.equal(created.status, 200);
  assert.deepEqual(created.data.passPost, item);
  for (const patch of [{ itemName: "" }, { price: -1 }, { price: null }, { category: "rental" }, { condition: "unknown" }, { closed: "false" }]) assert.equal((await api("/posts", "POST", { ...payload, passPost: { ...item, ...patch } })).status, 400);
  assert.equal((await api("/posts", "POST", { ...payload, passPost: undefined })).status, 400);
  assert.equal((await api("/posts", "POST", { ...payload, type: "question" })).status, 400);
  assert.equal((await api("/posts", "POST", { ...payload, lifeTopic: "conversation" })).status, 400);
  const edited = await api(`/posts/${created.data.id}`, "PUT", { ...payload, passPost: { ...item, price: 0, closed: false } });
  assert.equal(edited.data.passPost.price, 0);
  assert.equal(edited.data.passPost.closed, false);
  const converted = await api(`/posts/${created.data.id}`, "PUT", { ...payload, lifeTopic: "conversation", passPost: undefined, expectedCompletionAt: undefined, remindOnExpectedDate: undefined });
  assert.equal(converted.data.passPost, undefined);
});

test("free-only, category, condition, availability, keyword and price sorting use actual pass metadata", async () => {
  const payload = lifePostPayload(state({ passPost: { ...item, price: 0 } }));
  const created = await api("/posts", "POST", payload);
  const query = new URLSearchParams({ topic: "marketplace", campus: "Hòa Lạc", area: "Xã Hạ Bằng", passCategory: "household", passCondition: "good", maxPassPrice: "0", passAvailable: "1", q: "quat ban" });
  assert.ok((await api(`/posts?${query}`)).data.some((p) => p.id === created.data.id));
  assert.equal(matchesTopicFilters({ ...created.data, passPost: { ...item, price: 1 } }, query), false);
  await api(`/posts/${created.data.id}/visibility`, "PUT", { hidden: true });
  assert.ok(!(await api(`/posts?${query}`)).data.some((p) => p.id === created.data.id));
  for (const sort of ["price_low", "price_high"]) {
    const posts = (await api(`/posts?topic=marketplace&sort=${sort}`)).data;
    assert.ok(posts.length > 1);
    assert.ok(posts.every((p, index) => index === 0 || (sort === "price_low" ? posts[index - 1].passPost.price <= p.passPost.price : posts[index - 1].passPost.price >= p.passPost.price)));
  }
  const html = renderToStaticMarkup(React.createElement(TopicPostSummary, { post: created.data }));
  assert.ok(html.includes("Tặng miễn phí"));
  assert.ok(html.includes("Quạt bàn"));
  const controls = renderToStaticMarkup(React.createElement(TopicFeedFilters, { topic: "marketplace", params: query, onChange() {}, nearby: false, radius: "3", onRadius() {}, onLocate() {}, onClearLocation() {}, locating: false, locationError: "" }));
  assert.ok(controls.includes("Mọi loại đồ")); assert.ok(!controls.includes("Chỉ hiện đồ còn pass"));
});

test("every campus area has pass examples for each category and condition, plus free and closed items", () => {
  for (const [campus, areas] of Object.entries(CAMPUS_AREAS)) for (const area of areas) {
    const posts = seedKnowledgePosts.filter((p) => p.lifeTopic === "marketplace" && p.campus === campus && p.area === area && p.status === "Published");
    for (const { value: category } of PASS_CATEGORIES) {
      for (const { value: condition } of PASS_CONDITIONS) assert.ok(posts.some((p) => p.passPost?.category === category && p.passPost.condition === condition && !p.passPost.closed), `${campus}/${area}/${category}/${condition}`);
      assert.ok(posts.some((p) => p.passPost.category === category && p.passPost.price === 0 && !p.passPost.closed));
      assert.ok(posts.some((p) => p.passPost.category === category && p.passPost.closed));
    }
  }
});

test("saved searches can follow pass items including free ones and exclude hidden items and retired completion writes from alerts", async () => {
  const filters = normalizeLifeSearchFilters({ topic: "marketplace", campus: "Hòa Lạc", area: "Xã Hạ Bằng", passCategory: "household", passCondition: "good", maxPassPrice: "0", passAvailable: "1" });
  const saved = await api("/community/searches", "POST", { name: "Đồ gia dụng tặng miễn phí", filters });
  assert.equal(saved.status, 200);
  const trial = await api(`/community/searches/${saved.data.id}/demo`, "POST");
  assert.equal(trial.status, 200);
  const notices = (await api("/notifications?source=StudentLifeSearch")).data;
  assert.equal(notices.length, 1);
  assert.equal(notices[0].linkTo, `/knowledge/${trial.data.postId}`);
  const detail = (await api(`/posts/${trial.data.postId}`)).data.post;
  assert.equal(detail.passPost.price, 0);
  assert.equal(detail.passPost.category, "household");
  assert.ok(notices[0].body.includes("Tặng miễn phí"));
  assert.equal((await api("/posts", "POST", { ...lifePostPayload(state({ passPost: { ...item, price: 0 } })), passPost: { ...item, price: 0, closed: true } }, "usr_student_02")).status, 400);
  assert.equal((await api("/notifications?source=StudentLifeSearch")).data.length, 1);
});
