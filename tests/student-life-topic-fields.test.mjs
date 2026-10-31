import test, { after } from "node:test";
import assert from "node:assert/strict";
import { http } from "msw";
import { setupServer } from "msw/node";
import { knowledgeHandlers } from "../src/mocks/handlers/studentLife.ts";
import { coordinatesFromText, currentLifeDate, currentLifeYear, distanceKm, matchesTopicFilters } from "../src/lib/studentLifeDetails.ts";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ThreadComposer } from "../src/components/shared/StudentLifeComposer.tsx";
import { ToastProvider } from "../src/components/ui/Toast.tsx";
import { CampusAreaSelect } from "../src/components/shared/CampusAreaSelect.tsx";
import { CAMPUS_AREAS, isCampusArea } from "../src/lib/campusAreas.ts";
import { FeedFilterSelect } from "../src/components/shared/FeedFilterSelect.tsx";
import { hasLifeDraftContent, initialLifeForm, lifeFormErrors, lifePostPayload, normalizeHousingForm, readLifeDraft } from "../src/lib/studentLifeForm.ts";
import { TopicPostSummary } from "../src/components/shared/TopicPostSummary.tsx";

const server = setupServer(...knowledgeHandlers.map((h) => http[h.info.method.toLowerCase()](`http://localhost${h.info.path}`, h.resolver)));
server.listen({ onUnhandledRequest: "error" });
after(() => server.close());
async function api(path, method = "GET", body) {
  const response = await fetch(`http://localhost/api/v1${path}`, { method, headers: { "Content-Type": "application/json", Authorization: "Bearer mock_jwt_token_usr_student_01" }, ...(body ? { body: JSON.stringify(body) } : {}) });
  return { status: response.status, ...(await response.json()) };
}
const base = { type: "discussion", title: "Bài kiểm tra bộ lọc theo chủ đề", contentMd: "Thông tin bài đăng để kiểm tra lưu và tìm kiếm.", campus: "Hòa Lạc", tags: [], visibility: "cross_school" };

const form = (topic, patch = {}) => ({ ...initialLifeForm({ defaultTopic: topic, defaultCampus: "Hòa Lạc", defaultArea: "Xã Hạ Bằng" }), content: base.contentMd, ...patch });
const housing = (kind) => normalizeHousingForm({ kind, price: 2000000, people: 2, availableFrom: `${currentLifeYear()}-11-01`, amenities: ["Điều hòa"] });

test("all housing listing forms save the displayed price unit and match the move-in month filter", () => {
  for (const kind of ["seeking", "roommate", "transfer"]) {
    const state = form("housing", { housingPost: housing(kind) });
    assert.deepEqual(lifeFormErrors(state), [], kind);
    const payload = lifePostPayload(state);
    assert.equal(payload.housingPost.priceUnit, kind === "roommate" ? "person" : "room");
    assert.equal(payload.housingPost.area, state.area);
    assert.equal(payload.type, "discussion");
    assert.equal(matchesTopicFilters({ ...payload, attachments: [] }, new URLSearchParams({ housingKind: kind, moveMonth: "11", amenity: "Điều hòa", people: "2" })), true);
    assert.ok(lifeFormErrors({ ...state, housingPost: { ...state.housingPost, availableFrom: undefined } }).includes("Chọn tháng chuyển vào."));
    const summary = renderToStaticMarkup(React.createElement(TopicPostSummary, { post: payload }));
    assert.ok(summary.includes(`tháng 11/${currentLifeYear()}`));
    assert.ok(!summary.includes(`01/11/${currentLifeYear()}`));
  }
});

test("switching housing modes preserves entered details and excludes hidden fields from requests", () => {
  const original = { ...housing("transfer"), deposit: 3000000, water: "80.000đ/người", electricity: "3.500đ/kWh", serviceFee: 100000 };
  const experience = normalizeHousingForm({ ...original, kind: "experience" });
  const shared = form("housing", { type: "experience", housingPost: experience, housingExperience: { highlights: "Gần trường" } });
  assert.deepEqual(lifeFormErrors(shared), []);
  assert.deepEqual(lifePostPayload(shared).housingPost, { kind: "experience" });
  assert.deepEqual(lifePostPayload({ ...shared, type: "question", title: "Nên chọn phòng thế nào?" }).housingExperience, undefined);
  const restored = normalizeHousingForm({ ...experience, kind: "transfer" });
  assert.deepEqual(restored, original);
  const seeking = lifePostPayload(form("housing", { housingPost: { ...restored, kind: "seeking" } }));
  assert.equal(seeking.housingPost.deposit, undefined);
  assert.equal(seeking.housingPost.water, undefined);
  assert.equal(seeking.housingExperience, undefined);
  // Invalid data in an inactive panel must not lock an unrelated form.
  assert.deepEqual(lifeFormErrors(form("conversation", { housingPost: { ...original, price: -1 }, foodReview: { placeName: "", spentPerPerson: -1 } })), []);
});

test("draft recovery respects topic and campus context and editing never falls back to another draft", () => {
  const draft = readLifeDraft(JSON.stringify({ topic: "housing", campus: "Hòa Lạc", content: "Nội dung nháp trọ", housingPost: { ...housing("transfer"), area: "Tân Xã", priceUnit: undefined } }));
  const recovered = initialLifeForm({ draft });
  assert.equal(recovered.housingPost.priceUnit, "room");
  assert.equal(recovered.area, "Tân Xã (khu vực cũ)");
  assert.equal(initialLifeForm({ draft, defaultTopic: "food" }).content, "");
  assert.equal(initialLifeForm({ draft, defaultCampus: "Đà Nẵng" }).content, "");
  const edited = initialLifeForm({ draft, post: { ...base, lifeTopic: "food", type: "review", foodReview: { placeName: "Quán đang sửa", spentPerPerson: 30000 }, attachments: [] } });
  assert.equal(edited.foodReview.placeName, "Quán đang sửa");
  assert.equal(edited.housingPost.price, undefined);
  const legacy = initialLifeForm({ post: { ...base, lifeTopic: "housing", type: "experience", attachments: [] } });
  assert.equal(legacy.housingPost.kind, "experience");
  assert.deepEqual(lifeFormErrors(legacy), []);
});

test("broken or outdated stored drafts cannot crash the forms or force an irrelevant post type", () => {
  for (const raw of [null, "{", "null", "[]", "42", '{"ridePost":{"origin":7},"housingPost":{"amenities":{}}}']) {
    const draft = readLifeDraft(raw);
    for (const topic of ["housing", "food", "transport", "experience", "marketplace", "conversation"]) {
      const state = initialLifeForm({ draft, defaultTopic: topic });
      assert.doesNotThrow(() => lifeFormErrors(state));
    }
  }
  assert.equal(initialLifeForm({ defaultTopic: "marketplace", defaultType: "review" }).type, "discussion");
  for (const topic of ["housing", "food", "transport", "experience", "marketplace", "conversation"]) {
    assert.equal(hasLifeDraftContent(initialLifeForm({ defaultTopic: topic })), false);
  }
});

test("academic intent and attachments determine the saved type and remove inactive course codes", () => {
  const state = form("experience", { studentExperience: { category: "materials", intent: "sharing", courseCode: " PRJ301 " } });
  assert.equal(lifePostPayload(state).type, "experience");
  const attachment = { name: "tai-lieu.txt", size: 20, url: "/demo/student-life/tai-lieu.txt" };
  assert.equal(lifePostPayload({ ...state, attachments: [attachment] }).type, "document");
  for (const intent of ["asking", "request_materials"]) {
    const request = { ...state, studentExperience: { ...state.studentExperience, intent } };
    assert.equal(lifePostPayload(request).type, "question");
    assert.ok(lifeFormErrors(request).includes("Nhập câu hỏi ở phần tiêu đề."));
    assert.deepEqual(lifeFormErrors({ ...request, title: "Xin tài liệu PRJ301?" }), []);
  }
  assert.equal(lifePostPayload({ ...state, studentExperience: { ...state.studentExperience, category: "ojt" } }).studentExperience.courseCode, undefined);
});

test("ride form requires both date and time, rejects identical endpoints and uses the route as location", () => {
  const state = form("transport", { location: "Địa chỉ cũ của quán", ridePost: { kind: "offering", origin: " Mỹ Đình ", destination: " Hòa Lạc ", departure: "" } });
  for (const departure of ["", "2026-11-01T", "T06:30", "2026-02-30T06:30", "2026-11-01T25:00"]) assert.ok(lifeFormErrors({ ...state, ridePost: { ...state.ridePost, departure } }).length);
  const complete = { ...state, ridePost: { ...state.ridePost, departure: "2026-11-01T06:30" } };
  assert.deepEqual(lifeFormErrors(complete), []);
  assert.equal(lifePostPayload(complete).location, "Mỹ Đình → Hòa Lạc");
  assert.ok(lifeFormErrors({ ...complete, ridePost: { ...complete.ridePost, destination: "Mỹ Đình" } }).includes("Điểm đi và điểm đến cần khác nhau."));
});

test("complete housing forms can submit legacy price units and show one mode selector with a month picker", () => {
  for (const kind of ["seeking", "roommate", "transfer"]) {
    const html = renderToStaticMarkup(React.createElement(ToastProvider, null, React.createElement(ThreadComposer, { variant: "page", post: { ...base, lifeTopic: "housing", area: "Xã Hạ Bằng", housingPost: { ...housing(kind), priceUnit: undefined }, attachments: [] } })));
    assert.doesNotMatch(html.match(/<button\b[^>]*type="submit"[^>]*>/)[0], /\sdisabled(?:=|\s|>)/);
    assert.equal((html.match(/aria-label="Nhu cầu về chỗ ở"/g) || []).length, 1);
    assert.ok(html.includes("Tháng muốn chuyển vào") || html.includes("Tháng có thể nhận phòng"));
    assert.equal((html.match(/type="date"/g) || []).length, 1); // Expiry only; move-in still selects a month.
    assert.ok(html.includes('aria-label="Ngày hoàn thành dự kiến"'));
    assert.ok(!html.includes("Hình thức bài viết"));
    assert.ok(!html.includes('value="rental"'));
    assert.ok(!html.includes("Cho thuê phòng"));
    if (kind === "seeking") assert.ok(!html.includes("Tiền cọc (đồng)"));
  }
});

test("all six form payloads create and edit successfully without carrying metadata from another topic", async () => {
  const states = [
    form("housing", { housingPost: housing("transfer") }),
    form("food", { foodReview: { placeName: "Quán kiểm tra form", spentPerPerson: 30000, rating: 5 } }),
    form("transport", { ridePost: { kind: "seeking", origin: "Mỹ Đình", destination: "Hòa Lạc", departure: "2026-11-01T06:30" } }),
    form("experience", { studentExperience: { category: "materials", intent: "request_materials", courseCode: "PRJ301" }, title: "Xin tài liệu môn PRJ301?" }),
    form("marketplace", { passPost: { itemName: "Đèn học", category: "household", condition: "good", price: 120000 } }), form("conversation", { type: "question", title: "Có ai tham gia hoạt động cùng mình không?" }),
  ];
  let id;
  for (const state of states) {
    assert.deepEqual(lifeFormErrors(state), [], state.topic);
    const payload = lifePostPayload(state);
    const result = await api(id ? `/posts/${id}` : "/posts", id ? "PUT" : "POST", payload);
    assert.equal(result.status, 200, state.topic);
    id = result.data.id;
    assert.equal(result.data.lifeTopic, state.topic);
    for (const [key, topic] of [["housingPost", "housing"], ["foodReview", "food"], ["ridePost", "transport"], ["studentExperience", "experience"], ["passPost", "marketplace"]]) {
      if (state.topic !== topic) assert.equal(result.data[key], undefined, `${state.topic} must clear ${key}`);
    }
    assert.equal(result.data.foodReview?.rating, undefined);
    const query = new URLSearchParams({ topic: state.topic, campus: state.campus, area: state.area });
    assert.ok((await api(`/posts?${query}`)).data.some((post) => post.id === id));
  }
});

test("ride date shortcuts use Vietnam time and advance across month and year boundaries", () => {
  const newYear = new Date("2026-12-31T18:00:00Z");
  assert.equal(currentLifeDate(0, newYear), "2027-01-01");
  assert.equal(currentLifeDate(1, newYear), "2027-01-02");
  assert.equal(currentLifeDate(1, new Date("2026-10-31T03:00:00Z")), "2026-11-01");
  assert.equal(currentLifeDate(1, new Date("2028-02-28T03:00:00Z")), "2028-02-29");
});

test("move-in filtering uses the selected month of the current Vietnam year", () => {
  const now = new Date("2026-10-30T00:00:00Z");
  const params = new URLSearchParams({ moveMonth: "11" });
  const listing = (availableFrom) => ({ ...base, housingPost: { kind: "transfer", availableFrom }, attachments: [] });
  assert.equal(matchesTopicFilters(listing("2026-11-01"), params, now), true);
  assert.equal(matchesTopicFilters(listing("2026-11-30"), params, now), true);
  assert.equal(matchesTopicFilters(listing("2026-10-31"), params, now), false);
  assert.equal(matchesTopicFilters(listing("2027-11-01"), params, now), false);
  assert.equal(matchesTopicFilters(listing(undefined), params, now), false);
  assert.equal(currentLifeYear(new Date("2026-12-31T18:00:00Z")), 2027);
});

test("area choices follow a selected campus and allow choosing from campus groups before selecting one", () => {
  for (const [campus, areas] of Object.entries(CAMPUS_AREAS)) {
    const html = renderToStaticMarkup(React.createElement(CampusAreaSelect, { campus, value: "", onChange() {} }));
    for (const area of areas) assert.ok(html.includes(area));
    const otherAreas = Object.entries(CAMPUS_AREAS).filter(([key]) => key !== campus).flatMap(([, values]) => values);
    for (const area of otherAreas) assert.ok(!html.includes(area));
  }
  const unselected = renderToStaticMarkup(React.createElement(CampusAreaSelect, { campus: "", value: "Xã Hạ Bằng", onChange() {} }));
  assert.doesNotMatch(unselected.match(/<select[^>]*>/)[0], /\sdisabled(?:=|\s|>)/);
  assert.match(unselected, /<optgroup[^>]*label="FPT Hòa Lạc \(Hà Nội\)"/);
  assert.ok(unselected.includes("Xã Hạ Bằng"));
  assert.ok(unselected.includes('data-campus="Hòa Lạc"'));
  assert.equal(isCampusArea("Đà Nẵng", "Xã Hạ Bằng"), false);
  let selection;
  const control = CampusAreaSelect({ campus: "", value: "", onChange: (area, campus) => { selection = { area, campus }; } });
  control.props.onChange({ target: { value: "Xã Hạ Bằng", selectedOptions: [{ dataset: { campus: "Hòa Lạc" } }] } });
  assert.deepEqual(selection, { area: "Xã Hạ Bằng", campus: "Hòa Lạc" });
});

test("compact select sizing follows the selected label even inside campus groups", () => {
  const html = renderToStaticMarkup(React.createElement(FeedFilterSelect, { fitContent: true, value: "short", onChange() {} },
    React.createElement("option", { value: "" }, "Tất cả"),
    React.createElement("optgroup", { label: "Nhóm" },
      React.createElement("option", { value: "short" }, "Mới nhất"),
      React.createElement("option", { value: "long" }, "Lựa chọn có nội dung rất dài để kiểm tra"))));
  const measure = html.match(/<span[^>]*aria-hidden="true"[^>]*>([^<]*)<\/span>/)?.[1];
  assert.equal(measure, "Mới nhất");
});

test("posts persist and filter an area belonging to their campus and reject cross-campus areas", async () => {
  const payload = { ...base, lifeTopic: "housing", area: "Xã Hạ Bằng", housingPost: { kind: "seeking", area: "Xã Hạ Bằng", price: 2000000, priceUnit: "room" } };
  const created = await api("/posts", "POST", payload);
  assert.equal(created.status, 200);
  assert.equal(created.data.area, "Xã Hạ Bằng");
  const query = new URLSearchParams({ campus: "Hòa Lạc", area: "Xã Hạ Bằng" });
  assert.ok((await api(`/posts?${query}`)).data.some((post) => post.id === created.data.id));
  query.set("area", "Xã Hòa Lạc");
  assert.ok(!(await api(`/posts?${query}`)).data.some((post) => post.id === created.data.id));
  assert.equal((await api("/posts", "POST", { ...payload, campus: "Đà Nẵng" })).status, 400);
  assert.equal((await api("/posts", "POST", { ...payload, area: 0 })).status, 400);
  const validOtherCampus = { ...payload, campus: "Đà Nẵng", area: "Phường Ngũ Hành Sơn", housingPost: { ...payload.housingPost, area: "Phường Ngũ Hành Sơn" } };
  assert.equal((await api(`/posts/${created.data.id}`, "PUT", validOtherCampus)).data.area, "Phường Ngũ Hành Sơn");
});

test("topic forms enable complete requests and prevent submission of incomplete transfer and ride details", () => {
  const render = (patch) => renderToStaticMarkup(React.createElement(ToastProvider, null, React.createElement(ThreadComposer, { variant: "page", post: { ...base, id: "form-check", status: "Published", authorId: "usr_student_01", attachments: [], ...patch } })));
  const submitButton = (html) => html.match(/<button\b[^>]*type="submit"[^>]*>/)?.[0];
  const request = render({ lifeTopic: "experience", type: "question", studentExperience: { category: "materials", intent: "request_materials", courseCode: "PRJ301" } });
  assert.ok(submitButton(request));
  assert.doesNotMatch(submitButton(request), /\sdisabled(?:=|\s|>)/);
  assert.ok(request.includes("Mã môn / tên môn"));
  const transfer = render({ lifeTopic: "housing", housingPost: { kind: "transfer", priceUnit: "room" } });
  assert.match(submitButton(transfer), /\sdisabled(?:=|\s|>)/);
  assert.ok(transfer.includes("Tiền cọc"));
  assert.ok(!transfer.includes("Thông tin review quán"));
  const ride = render({ lifeTopic: "transport" });
  assert.match(submitButton(ride), /\sdisabled(?:=|\s|>)/);
  assert.ok(ride.includes("Ngày đi *"));
  assert.ok(ride.includes("Giờ đi *"));
  const review = render({ lifeTopic: "food", type: "review", foodReview: { placeName: "Quán kiểm tra", spentPerPerson: 30000 } });
  assert.doesNotMatch(submitButton(review), /\sdisabled(?:=|\s|>)/);
  assert.ok(!review.includes("food-review-rating"));
});

test("food discovery uses price and community likes without requiring star ratings", async () => {
  const payload = { ...base, lifeTopic: "food", type: "review", foodReview: { placeName: "Quán không chấm sao", spentPerPerson: 25000 } };
  const created = await api("/posts", "POST", payload);
  assert.equal(created.status, 200);
  assert.equal(created.data.foodReview.rating, undefined);
  const favorite = (await api("/posts?topic=food&sort=hot")).data;
  assert.ok(favorite.length > 0);
  assert.ok(favorite.every((post) => post.type === "review" && post.foodReview));
  assert.ok(favorite.every((post, index) => index === 0 || (favorite[index - 1].likesCount || 0) >= (post.likesCount || 0)));
  const ascending = (await api("/posts?topic=food&sort=price_low&maxPrice=30000")).data;
  assert.ok(ascending.some((post) => post.id === created.data.id));
  assert.ok(ascending.every((post, index) => post.foodReview.spentPerPerson <= 30000 && (index === 0 || ascending[index - 1].foodReview.spentPerPerson <= post.foodReview.spentPerPerson)));
  const descending = (await api("/posts?topic=food&sort=price_high")).data;
  assert.ok(descending.every((post, index) => index === 0 || descending[index - 1].foodReview.spentPerPerson >= post.foodReview.spentPerPerson));
});

test("transfer posts preserve costs, separate price units and stop appearing in open listings after hiding", async () => {
  const payload = { ...base, lifeTopic: "housing", housingPost: { kind: "transfer", area: "Tân Xã", price: 2000000, priceUnit: "room", people: 2, availableFrom: `${currentLifeYear()}-11-01`, amenities: ["Khép kín", "Điều hòa"], deposit: 2000000, electricity: "3500đ/kWh", water: "80000đ/người", serviceFee: 100000 } };
  const created = await api("/posts", "POST", payload);
  assert.equal(created.status, 200);
  const id = created.data.id;
  assert.equal(created.data.housingPost.deposit, 2000000);
  assert.equal(created.data.housingPost.water, "80000đ/người");
  const filters = new URLSearchParams({ topic: "housing", housingKind: "transfer", area: "tan xa", maxRent: "2500000", priceUnit: "room", people: "2", moveMonth: "11", amenity: "Khép kín", onlyOpen: "1" });
  assert.ok((await api(`/posts?${filters}`)).data.some((p) => p.id === id));
  filters.set("amenity", "Khép kín,Điều hòa");
  assert.ok((await api(`/posts?${filters}`)).data.some((p) => p.id === id));
  filters.set("amenity", "Khép kín,Điều hòa,Máy giặt");
  assert.ok(!(await api(`/posts?${filters}`)).data.some((p) => p.id === id));
  filters.delete("amenity");
  assert.ok((await api(`/posts?${filters}`)).data.some((p) => p.id === id));
  filters.set("priceUnit", "person");
  assert.ok(!(await api(`/posts?${filters}`)).data.some((p) => p.id === id));
  await api(`/posts/${id}/visibility`, "PUT", { hidden: true });
  assert.ok(!(await api("/posts?topic=housing&onlyOpen=1")).data.some((p) => p.id === id));
  assert.equal((await api(`/posts/${id}`, "PUT", { ...base, lifeTopic: "conversation" })).data.housingPost, undefined);
});

test("housing rejects landlord listings, missing price units, bad dates, negative prices and mismatched topics", async () => {
  const housingPost = { kind: "seeking", area: "Tân Xã", price: 2000000, priceUnit: "person" };
  for (const patch of [{ kind: "rental" }, { priceUnit: undefined }, { price: -1 }, { availableFrom: "2026-02-30" }, { people: 0 }]) {
    assert.equal((await api("/posts", "POST", { ...base, lifeTopic: "housing", housingPost: { ...housingPost, ...patch } })).status, 400);
  }
  assert.equal((await api("/posts", "POST", { ...base, lifeTopic: "food", housingPost })).status, 400);
});

test("OJT and material requests are saved and filtered separately, with optional attachments for requests", async () => {
  const ojt = await api("/posts", "POST", { ...base, lifeTopic: "experience", studentExperience: { category: "ojt", intent: "sharing" } });
  assert.equal(ojt.status, 200);
  const payload = { ...base, lifeTopic: "experience", type: "question", studentExperience: { category: "materials", intent: "request_materials", courseCode: "PRJ301" } };
  const request = await api("/posts", "POST", payload);
  assert.equal(request.status, 200);
  const query = "/posts?topic=experience&experienceCategory=materials&experienceIntent=request_materials&courseCode=prj301";
  assert.ok((await api(query)).data.some((p) => p.id === request.data.id));
  assert.ok(!(await api(query + "&hasAttachments=1")).data.some((p) => p.id === request.data.id));
  assert.ok((await api("/posts?topic=experience&experienceCategory=ojt")).data.some((p) => p.id === ojt.data.id));
  assert.equal((await api("/posts", "POST", { ...payload, studentExperience: { category: "course_project", intent: "sharing" } })).status, 400);
  assert.equal((await api(`/posts/${request.data.id}`, "PUT", { ...base, lifeTopic: "conversation" })).data.studentExperience, undefined);
});

test("review coordinates survive editing, invalid coordinates are rejected, and rating filters exclude unrated demos", async () => {
  const review = { placeName: "Quán kiểm tra", rating: 4, spentPerPerson: 30000, coordinates: { latitude: 21, longitude: 105.5 } };
  const payload = { ...base, lifeTopic: "food", type: "review", foodReview: review };
  const created = await api("/posts", "POST", payload);
  assert.equal(created.status, 200);
  const edited = await api(`/posts/${created.data.id}`, "PUT", { ...payload, foodReview: { ...review, spentPerPerson: 35000 } });
  assert.deepEqual(edited.data.foodReview.coordinates, review.coordinates);
  assert.ok((await api("/posts?topic=food&minRating=4&maxPrice=50000")).data.some((p) => p.id === created.data.id));
  assert.ok(!(await api("/posts?topic=food&minRating=5")).data.some((p) => p.id === created.data.id));
  assert.equal((await api("/posts", "POST", { ...payload, foodReview: { ...review, coordinates: { latitude: 100, longitude: 105 } } })).status, 400);
});

test("nearby calculations and map parsing handle valid coordinates, large distances and unsupported links", () => {
  const origin = { latitude: 21, longitude: 105.5 };
  assert.equal(distanceKm(origin, origin), 0);
  assert.ok(distanceKm(origin, { latitude: 21.01, longitude: 105.5 }) > 1);
  assert.ok(distanceKm(origin, { latitude: 21.01, longitude: 105.5 }) < 1.2);
  assert.deepEqual(coordinatesFromText("21, 105.5"), origin);
  assert.deepEqual(coordinatesFromText("https://www.google.com/maps/place/x/!3d21!4d105.5"), origin);
  assert.equal(coordinatesFromText("91, 180"), undefined);
  assert.equal(coordinatesFromText("https://maps.app.goo.gl/short"), undefined);
});

test("ride forms retain route and departure data and support route/date filtering", async () => {
  const ridePost = { kind: "offering", origin: "Mỹ Đình", destination: "Hòa Lạc", departure: "2026-11-01T06:30", seats: 1, contribution: 20000 };
  const payload = { ...base, lifeTopic: "transport", ridePost };
  const created = await api("/posts", "POST", payload);
  assert.equal(created.status, 200);
  assert.deepEqual(created.data.ridePost, { ...ridePost, closed: false });
  assert.ok((await api("/posts?topic=transport&origin=my%20dinh&destination=hoa%20lac&rideDate=2026-11-01&rideKind=offering")).data.some((p) => p.id === created.data.id));
  assert.equal((await api("/posts", "POST", { ...payload, ridePost: { ...ridePost, departure: "2026-11-01T99:30" } })).status, 400);
});
