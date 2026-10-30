import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { CAMPUS_AREAS, isCampusArea } from "../src/lib/campusAreas.ts";
import { LIFE_TOPICS, isValidFoodReview } from "../src/lib/studentLife.ts";
import { currentLifeDate, distanceKm, EXPERIENCE_CATEGORIES, EXPERIENCE_INTENTS, HOUSING_AMENITIES, HOUSING_KINDS, matchesTopicFilters, validTopicDetails } from "../src/lib/studentLifeDetails.ts";
import { createStudentLifeFilterFixtures, DEMO_CAMPUS_LOCATIONS } from "../src/mocks/data/studentLifeFilterFixtures.ts";
import { studentLifeDemoResources } from "../src/mocks/data/studentLifeDemoResources.ts";
import { seedKnowledgePosts, seedComments } from "../src/mocks/data/studentLife.ts";
import { seedUsers } from "../src/mocks/data/users.ts";

const now = new Date("2026-10-30T05:00:00Z");
const data = createStudentLifeFilterFixtures(now);
const groups = new Map();
for (const post of data.posts) {
  const key = `${post.campus}|${post.area}|${post.lifeTopic}`;
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(post);
}
const group = (campus, area, topic) => groups.get(`${campus}|${area}|${topic}`) || [];

test("generated posts have valid topic details, existing authors, unique IDs and real comment references", () => {
  assert.equal(new Set(data.posts.map((post) => post.id)).size, data.posts.length);
  assert.equal(new Set(data.comments.map((comment) => comment.id)).size, data.comments.length);
  const authors = new Set(seedUsers.map((user) => user.id));
  const comments = new Map(data.comments.map((comment) => [comment.id, comment]));
  const counts = new Map();
  const postIds = new Set(data.posts.map((post) => post.id));
  for (const comment of data.comments) {
    assert.ok(postIds.has(comment.postId));
    assert.ok(authors.has(comment.authorId));
    counts.set(comment.postId, (counts.get(comment.postId) || 0) + 1);
  }
  for (const post of data.posts) {
    assert.ok(isCampusArea(post.campus, post.area), post.id);
    assert.ok(authors.has(post.authorId), post.id);
    assert.ok(validTopicDetails(post), post.id);
    if (post.type === "review") assert.ok(isValidFoodReview(post.foodReview), post.id);
    assert.equal(post.commentCount, counts.get(post.id) || 0);
    if (post.acceptedCommentId) {
      const answer = comments.get(post.acceptedCommentId);
      assert.equal(answer.postId, post.id);
      assert.equal(answer.isAcceptedAnswer, true);
    }
    assert.equal(post.demoContent.kind, "synthetic");
  }
});

test("all 35 campus areas have published content in every topic, plus saved examples", () => {
  const saved = new Set(data.savedIds);
  for (const [campus, areas] of Object.entries(CAMPUS_AREAS)) {
    for (const area of areas) {
      for (const { value: topic } of LIFE_TOPICS) {
        const posts = group(campus, area, topic);
        assert.ok(posts.some((post) => post.status === "Published"), `${campus}: ${area}: ${topic}`);
        assert.ok(posts.some((post) => saved.has(post.id)), `saved ${campus}: ${area}: ${topic}`);
      }
    }
  }
});

test("housing covers region × intent × 1–4 people × all 12 months with every amenity and every price cap", () => {
  for (const [campus, areas] of Object.entries(CAMPUS_AREAS)) {
    for (const area of areas) {
      const housing = group(campus, area, "housing");
      const matrix = new Map();
      for (const post of housing) {
        const h = post.housingPost;
        if (h?.closed || !h?.availableFrom || h.price > 1000000 || !HOUSING_AMENITIES.every((amenity) => h.amenities?.includes(amenity))) continue;
        matrix.set(`${h.kind}|${h.people}|${h.availableFrom.slice(5, 7)}`, post);
      }
      for (const { value: kind } of HOUSING_KINDS.filter((item) => item.value !== "experience")) {
        for (let people = 1; people <= 4; people++) {
          for (let month = 1; month <= 12; month++) {
            const monthValue = String(month).padStart(2, "0");
            const sample = matrix.get(`${kind}|${people}|${monthValue}`);
            assert.ok(sample, `${campus}: ${area}: ${kind}: ${people}: ${month}`);
            for (const maxRent of [1000000, 2000000, 3000000, 5000000]) {
              const params = new URLSearchParams({ housingKind: kind, area, people: String(people), moveMonth: monthValue, maxRent: String(maxRent), onlyOpen: "1", amenity: HOUSING_AMENITIES.join(",") });
              assert.ok(matchesTopicFilters(sample, params, now), sample.id);
            }
          }
        }
      }
      const closed = housing.find((post) => post.housingPost?.closed);
      assert.ok(closed);
      assert.equal(matchesTopicFilters(closed, new URLSearchParams({ onlyOpen: "1" }), now), false);
      assert.ok(housing.some((post) => post.housingPost?.kind === "experience"));
    }
  }
});

test("student experience covers every category and intent both with and without downloadable files", () => {
  for (const [campus, areas] of Object.entries(CAMPUS_AREAS)) {
    for (const area of areas) {
      const posts = group(campus, area, "experience");
      for (const { value: category } of EXPERIENCE_CATEGORIES) {
        for (const { value: intent } of EXPERIENCE_INTENTS) {
          const courses = category === "materials" ? ["PRJ301", "CSD201", "MAS291"] : [""];
          for (const course of courses) {
            for (const withFile of [false, true]) {
              const params = new URLSearchParams({ experienceCategory: category, experienceIntent: intent, ...(course ? { courseCode: course } : {}), ...(withFile ? { hasAttachments: "1" } : {}) });
              assert.ok(posts.some((post) => Boolean(post.attachments.length) === withFile && matchesTopicFilters(post, params, now)), `${campus}: ${area}: ${category}: ${intent}: ${course}: ${withFile}`);
            }
          }
        }
      }
    }
  }
  for (const file of Object.values(studentLifeDemoResources)) {
    const content = readFileSync(new URL(`../public${file.url}`, import.meta.url), "utf8");
    assert.equal(content, file.content);
  }
});

test("food covers every region, all budget caps and the 1/3/5km radii, including outside-radius and missing-pin examples", () => {
  for (const [campus, areas] of Object.entries(CAMPUS_AREAS)) {
    for (const area of areas) {
      const posts = group(campus, area, "food").filter((post) => post.foodReview);
      for (const maxPrice of [30000, 50000, 80000]) {
        for (const radius of [1, 3, 5]) {
          assert.ok(posts.some((post) => post.foodReview.spentPerPerson <= maxPrice && post.foodReview.coordinates && distanceKm(DEMO_CAMPUS_LOCATIONS[campus], post.foodReview.coordinates) <= radius), `${campus}: ${area}: ${maxPrice}: ${radius}`);
        }
      }
      assert.ok(posts.some((post) => !post.foodReview.coordinates));
      assert.ok(posts.some((post) => post.foodReview.coordinates && distanceKm(DEMO_CAMPUS_LOCATIONS[campus], post.foodReview.coordinates) > 5));
      assert.ok(new Set(posts.map((post) => post.likesCount)).size > 1);
      assert.ok(new Set(posts.map((post) => post.commentCount)).size > 1);
      assert.ok(posts.some((post) => post.foodReview.spentPerPerson > 80000));
    }
  }
});

test("ride data follows today/tomorrow and custom days at every area, for both kinds and directions", () => {
  for (const [campus, areas] of Object.entries(CAMPUS_AREAS)) {
    for (const area of areas) {
      const posts = group(campus, area, "transport");
      for (const offset of [0, 1, 2, 7, 14]) {
        for (const kind of ["seeking", "offering"]) {
          const params = new URLSearchParams({ rideDate: currentLifeDate(offset, now), rideKind: kind });
          const matches = posts.filter((post) => matchesTopicFilters(post, params, now));
          assert.ok(matches.some((post) => post.ridePost.origin.startsWith("Cổng FPT")));
          assert.ok(matches.some((post) => post.ridePost.destination.startsWith("Cổng FPT")));
        }
      }
    }
  }
  const nextYear = createStudentLifeFilterFixtures(new Date("2026-12-31T18:00:00Z"));
  assert.ok(nextYear.posts.some((post) => post.ridePost?.departure.startsWith("2027-01-01")));
  assert.ok(nextYear.posts.some((post) => post.housingPost?.availableFrom?.startsWith("2027-")));
});

test("own-post statuses cover all topics at all campuses; merged seeds keep matching comment counts", () => {
  for (const campus of Object.keys(CAMPUS_AREAS)) {
    for (const { value: topic } of LIFE_TOPICS) {
      for (const status of ["Published", "PendingReview", "Rejected"]) {
        assert.ok(data.posts.some((post) => post.authorId === "usr_student_01" && post.campus === campus && post.lifeTopic === topic && post.status === status));
      }
    }
  }
  const counts = new Map();
  seedComments.forEach((comment) => counts.set(comment.postId, (counts.get(comment.postId) || 0) + 1));
  for (const post of seedKnowledgePosts) assert.equal(post.commentCount, counts.get(post.id) || 0, post.id);
});
