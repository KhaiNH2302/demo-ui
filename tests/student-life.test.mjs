import test, { after } from "node:test";
import assert from "node:assert/strict";
import { http } from "msw";
import { setupServer } from "msw/node";
import { knowledgeHandlers } from "../src/mocks/handlers/knowledge.ts";
import {
  seedKnowledgePosts,
  seedComments,
} from "../src/mocks/data/knowledge.ts";

const server = setupServer(
  ...knowledgeHandlers.map((handler) =>
    http[handler.info.method.toLowerCase()](
      `http://localhost${handler.info.path}`,
      handler.resolver,
    ),
  ),
);
server.listen({ onUnhandledRequest: "error" });
after(() => server.close());
async function api(path, user = "usr_student_01", method = "GET", body) {
  const response = await fetch(`http://localhost/api/v1${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(user ? { Authorization: `Bearer mock_jwt_token_${user}` } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  return { status: response.status, ...(await response.json()) };
}

test("life feed combines topic, campus and accent-insensitive search without academic subjects", async () => {
  const result = await api(
    "/posts?topic=housing&campus=H%C3%B2a%20L%E1%BA%A1c&q=xem%20tro",
  );
  assert.equal(result.status, 200);
  assert.ok(result.data.length > 0);
  assert.ok(
    result.data.every(
      (post) => post.lifeTopic === "housing" && post.campus === "Hòa Lạc",
    ),
  );
  assert.ok(result.data.every((post) => post.status === "Published"));
  assert.equal(
    (await api("/posts?sort=unanswered")).data.some(
      (post) => post.isSolved || post.type !== "question",
    ),
    false,
  );
  assert.equal(
    (await api("/posts?type=sharing")).data.some(
      (post) => post.type === "question",
    ),
    false,
  );
});

test("students publish without a subject; missing topics and empty question titles are rejected", async () => {
  const payload = {
    type: "question",
    title: "Ở ghép nên chia tiền mạng ra sao?",
    contentMd: "Hai bạn cùng phòng dùng chung mạng thì thường chia thế nào?",
    lifeTopic: "housing",
    campus: "Hòa Lạc",
    location: "Ký túc xá",
    visibility: "school",
    tags: [],
  };
  assert.equal((await api("/posts", null, "POST", payload)).status, 401);
  assert.equal(
    (await api("/posts", undefined, "POST", { ...payload, lifeTopic: "" }))
      .status,
    400,
  );
  assert.equal(
    (await api("/posts", undefined, "POST", { ...payload, title: "" })).status,
    400,
  );
  const created = await api("/posts", undefined, "POST", payload);
  assert.equal(created.status, 200);
  assert.equal(created.data.subject, undefined);
  assert.equal(created.data.lifeTopic, "housing");
  assert.equal((await api(`/posts/${created.data.id}`, null)).status, 404);
  assert.equal(
    (await api(`/posts/${created.data.id}`, "usr_student_02", "PUT", payload))
      .status,
    403,
  );
  assert.ok(
    (await api("/posts?tab=mine")).data.some(
      (post) => post.id === created.data.id,
    ),
  );
  await api(`/posts/${created.data.id}`, undefined, "DELETE");
});

test("following and saved tabs use the current student and reflect removals", async () => {
  await api("/community/topics/food/follow", "usr_student_01", "POST");
  assert.ok((await api("/community/topics/following")).data.includes("food"));
  assert.equal(
    (await api("/community/topics/following", "usr_student_02")).data.includes(
      "food",
    ),
    false,
  );
  assert.ok(
    (await api("/posts?tab=following")).data.some(
      (post) => post.lifeTopic === "food",
    ),
  );
  await api("/community/topics/food/follow", "usr_student_01", "DELETE");
  await api("/posts/post_03/save", "usr_student_01", "POST");
  assert.ok(
    (await api("/posts?tab=saved")).data.some((post) => post.id === "post_03"),
  );
  assert.equal(
    (await api("/posts?tab=saved", "usr_student_02")).data.some(
      (post) => post.id === "post_03",
    ),
    false,
  );
  await api("/posts/post_03/save", "usr_student_01", "DELETE");
  assert.equal(
    (await api("/posts?tab=saved")).data.some((post) => post.id === "post_03"),
    false,
  );
});

test("helpful reply is specific to a question, owner-controlled and reversible", async () => {
  const post = seedKnowledgePosts.find((item) => item.id === "post_02");
  assert.equal(
    (
      await api("/posts/post_02/accepted-answer", "usr_student_02", "PUT", {
        commentId: "cmt_02",
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await api("/posts/post_02/accepted-answer", undefined, "PUT", {
        commentId: "cmt_01",
      })
    ).status,
    400,
  );
  await api("/posts/post_02/accepted-answer", undefined, "PUT", {
    commentId: "cmt_02",
  });
  assert.equal(post.isSolved, false);
  assert.equal(
    seedComments.find((item) => item.id === "cmt_02").isAcceptedAnswer,
    false,
  );
  await api("/posts/post_02/accepted-answer", undefined, "PUT", {
    commentId: "cmt_02",
  });
  assert.equal(post.isSolved, true);
  assert.equal(
    (
      await api("/posts/post_01/accepted-answer", "usr_student_03", "PUT", {
        commentId: "cmt_01",
      })
    ).status,
    400,
  );
});

test("food reviews support campus, budget and place search while sharing stays separate", async () => {
  const all = await api("/posts?type=review");
  assert.ok(all.data.length >= 4);
  assert.ok(
    all.data.every(
      (post) =>
        post.type === "review" && post.lifeTopic === "food" && post.foodReview,
    ),
  );
  const budget = await api("/posts?type=review&maxPrice=30000");
  assert.ok(budget.data.length > 0);
  assert.ok(
    budget.data.every((post) => post.foodReview.spentPerPerson <= 30000),
  );
  const local = await api(
    "/posts?type=review&campus=H%C3%B2a%20L%E1%BA%A1c&maxPrice=50000",
  );
  assert.ok(local.data.length > 0);
  assert.ok(
    local.data.every(
      (post) =>
        post.campus === "Hòa Lạc" && post.foodReview.spentPerPerson <= 50000,
    ),
  );
  const place = await api("/posts?type=review&q=highlands");
  assert.equal(place.data[0].id, "post_14");
  assert.equal(
    (await api("/posts?type=sharing")).data.some(
      (post) => post.type === "review",
    ),
    false,
  );
});

test("reviews require a real rating, a sensible amount and food topic before publication", async () => {
  const payload = {
    type: "review",
    title: "Ăn trưa sau giờ học",
    contentMd: "Mình gọi một suất cơm, lên món nhanh nhưng rau hơi ít.",
    lifeTopic: "food",
    campus: "Hòa Lạc",
    tags: [],
    visibility: "school",
    foodReview: {
      placeName: "Tiệm thử nghiệm",
      dish: "Cơm phần",
      rating: 4,
      spentPerPerson: 35000,
    },
  };
  const before = seedKnowledgePosts.length;
  for (const invalid of [
    { ...payload, lifeTopic: "housing" },
    { ...payload, foodReview: undefined },
    ...[
      { rating: 0 },
      { rating: 6 },
      { rating: 3.5 },
      { spentPerPerson: -1 },
      { spentPerPerson: 35000.5 },
      { spentPerPerson: null },
      { placeName: "   " },
      { visitedOn: "2999-01-01" },
      { visitedOn: "2026-02-31" },
    ].map((patch) => ({
      ...payload,
      foodReview: { ...payload.foodReview, ...patch },
    })),
  ])
    assert.equal((await api("/posts", undefined, "POST", invalid)).status, 400);
  assert.equal(seedKnowledgePosts.length, before);
  const created = await api("/posts", undefined, "POST", payload);
  assert.equal(created.status, 200);
  assert.deepEqual(created.data.foodReview, payload.foodReview);
  assert.ok(
    (await api("/posts?type=review&tab=mine")).data.some(
      (post) => post.id === created.data.id,
    ),
  );
  assert.equal(
    (
      await api(`/posts/${created.data.id}/accepted-answer`, undefined, "PUT", {
        commentId: "cmt_02",
      })
    ).status,
    400,
  );
  await api(`/posts/${created.data.id}`, undefined, "DELETE");
});

test("editing a review keeps its fields and switching to a sharing post clears the review", async () => {
  const payload = {
    type: "review",
    contentMd: "Món mình gọi khá ổn.",
    lifeTopic: "food",
    campus: "Hòa Lạc",
    tags: [],
    foodReview: {
      placeName: "Quán thử nghiệm",
      rating: 4,
      spentPerPerson: 40000,
    },
  };
  const created = await api("/posts", undefined, "POST", payload);
  const edited = await api(`/posts/${created.data.id}`, undefined, "PUT", {
    ...payload,
    foodReview: { ...payload.foodReview, rating: 3, spentPerPerson: 32000 },
  });
  assert.equal(edited.data.foodReview.rating, 3);
  assert.equal(edited.data.foodReview.spentPerPerson, 32000);
  const sharing = await api(`/posts/${created.data.id}`, undefined, "PUT", {
    ...payload,
    type: "discussion",
  });
  assert.equal(sharing.data.foodReview, undefined);
  assert.equal(
    (await api(`/posts/${created.data.id}`)).data.post.foodReview,
    undefined,
  );
  await api(`/posts/${created.data.id}`, undefined, "DELETE");
});

test("housing experiences retain practical details through posting and editing without a venue score", async () => {
  const payload = {
    type: "discussion",
    title: "Ba tháng ở trọ gần trường",
    contentMd: "Mình đi học tiện, còn phòng hơi nóng buổi chiều.",
    lifeTopic: "housing",
    campus: "Hòa Lạc",
    tags: [],
    housingExperience: {
      monthlyCost: 2100000,
      duration: "3 tháng",
      highlights: "Đi bộ được tới trường",
      considerations: "Phòng nóng buổi chiều",
    },
  };
  const created = await api("/posts", undefined, "POST", payload);
  assert.equal(created.status, 200);
  assert.deepEqual(created.data.housingExperience, payload.housingExperience);
  assert.equal(created.data.foodReview, undefined);
  const fetched = await api(`/posts/${created.data.id}`);
  assert.equal(fetched.data.post.housingExperience.monthlyCost, 2100000);
  const edited = await api(`/posts/${created.data.id}`, undefined, "PUT", {
    ...payload,
    housingExperience: { ...payload.housingExperience, monthlyCost: 2200000 },
  });
  assert.equal(edited.data.housingExperience.monthlyCost, 2200000);
  const changed = await api(`/posts/${created.data.id}`, undefined, "PUT", {
    ...payload,
    lifeTopic: "experience",
    housingExperience: undefined,
  });
  assert.equal(changed.status, 200);
  assert.equal(changed.data.housingExperience, undefined);
  assert.equal(
    (await api(`/posts/${created.data.id}`)).data.post.housingExperience,
    undefined,
  );
  await api(`/posts/${created.data.id}`, undefined, "DELETE");
});

test("housing details are optional but invalid costs and mismatched topics cannot be published", async () => {
  const payload = {
    type: "discussion",
    contentMd: "Chuyện ở trọ của mình.",
    lifeTopic: "housing",
    campus: "Hòa Lạc",
    tags: [],
  };
  const before = seedKnowledgePosts.length;
  for (const housingExperience of [
    { monthlyCost: -1 },
    { monthlyCost: 1.5 },
    { monthlyCost: 100000001 },
    { duration: "a".repeat(81) },
    { highlights: "a".repeat(181) },
    { considerations: 12 },
  ])
    assert.equal(
      (
        await api("/posts", undefined, "POST", {
          ...payload,
          housingExperience,
        })
      ).status,
      400,
    );
  assert.equal(
    (
      await api("/posts", undefined, "POST", {
        ...payload,
        lifeTopic: "food",
        housingExperience: { duration: "3 tháng" },
      })
    ).status,
    400,
  );
  assert.equal(seedKnowledgePosts.length, before);
  const created = await api("/posts", undefined, "POST", payload);
  assert.equal(created.status, 200);
  assert.equal(created.data.housingExperience, undefined);
  await api(`/posts/${created.data.id}`, undefined, "DELETE");
});
