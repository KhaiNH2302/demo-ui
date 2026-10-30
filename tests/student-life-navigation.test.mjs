import test from "node:test";
import assert from "node:assert/strict";
import {
  lifePostCreateHref,
  lifePostReturnPath,
} from "../src/lib/studentLifeNavigation.ts";

test("opening the full-page composer keeps review context and returns to the original filtered feed", () => {
  const returnTo =
    "/knowledge?type=review&campus=H%C3%B2a+L%E1%BA%A1c&maxPrice=50000";
  const url = new URL(
    lifePostCreateHref({
      topic: "food",
      type: "review",
      campus: "Hòa Lạc",
      returnTo,
    }),
    "https://scs.local",
  );
  assert.equal(url.pathname, "/knowledge/new");
  assert.equal(url.searchParams.get("topic"), "food");
  assert.equal(url.searchParams.get("type"), "review");
  assert.equal(url.searchParams.get("campus"), "Hòa Lạc");
  assert.equal(lifePostReturnPath(url.searchParams.get("returnTo")), returnTo);
  assert.equal(
    lifePostReturnPath("/knowledge?compose=1&topic=housing"),
    "/knowledge?topic=housing",
  );
});

test("composer back links stay on known app pages and never return to the composer itself", () => {
  for (const path of [
    "https://elsewhere.example",
    "//elsewhere.example",
    "/knowledge/new",
    "/knowledge/post_02/edit",
    "/login",
    null,
  ])
    assert.equal(lifePostReturnPath(path), "/knowledge");
  assert.equal(lifePostReturnPath("/"), "/");
  assert.equal(lifePostReturnPath("/knowledge/me"), "/knowledge/me");
  assert.equal(lifePostReturnPath("/knowledge/post_02"), "/knowledge/post_02");
});
