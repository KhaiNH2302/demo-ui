import { http, HttpResponse } from "msw";
import {
  seedKnowledgePosts,
  seedComments,
  seedReports,
} from "../data/knowledge";
import { seedUsers } from "../data/users";
import { studentLifeDemoSavedIds } from "../data/studentLife";
import { mockDelay, isScenarioActive, getViewerId } from "../utils";
import {
  LIFE_TOPICS,
  LIFE_CAMPUSES,
  normalizeLifeSearch,
  isValidFoodReview,
  hasHousingExperience,
  isValidHousingExperience,
} from "@/lib/studentLife";
import type { KnowledgePost, Comment } from "@/types/entities";
import { matchesTopicFilters, topicDetailsFields, validTopicDetails } from "@/lib/studentLifeDetails";

const following = new Map<string, Set<string>>();
const saved = new Map<string, Set<string>>();
const followedTopics = (id: string) => {
  if (!following.has(id)) following.set(id, new Set(["housing", "experience"]));
  return following.get(id)!;
};
const savedPosts = (id: string) => {
  if (!saved.has(id)) saved.set(id, new Set(["post_01", "post_04", ...studentLifeDemoSavedIds]));
  return saved.get(id)!;
};
const actor = (request: Request) =>
  seedUsers.find(
    (user) =>
      request.headers.get("authorization") ===
        `Bearer mock_jwt_token_${user.id}` && user.status === "active",
  );
const error = (status: number, message: string) =>
  HttpResponse.json(
    {
      error: {
        code: status === 403 ? "FORBIDDEN" : "INVALID_REQUEST",
        message,
      },
    },
    { status },
  );
const visible = (post: KnowledgePost, request: Request) => {
  const user = actor(request);
  if (post.authorId === user?.id) return true;
  if (post.status !== "Published" && post.status !== "Closed") return false;
  return (
    post.visibility === "cross_school" ||
    Boolean(
      user?.school &&
      user.school ===
        seedUsers.find((author) => author.id === post.authorId)?.school,
    )
  );
};
const mapped = (post: KnowledgePost, id: string) => ({
  ...post,
  savedByMe: savedPosts(id).has(post.id),
});
const validBody = (body: Partial<KnowledgePost>) =>
  typeof body.contentMd === "string" &&
  body.contentMd.trim().length > 0 &&
  body.contentMd.length <= 3000 &&
  LIFE_TOPICS.some((topic) => topic.value === body.lifeTopic) &&
  LIFE_CAMPUSES.some((campus) => campus === body.campus) &&
  ["question", "discussion", "experience", "document", "review"].includes(
    body.type || "",
  ) &&
  (body.type !== "question" || Boolean(body.title?.trim())) &&
  (body.type !== "review" ||
    (body.lifeTopic === "food" && isValidFoodReview(body.foodReview))) &&
  (!body.housingExperience ||
    (body.lifeTopic === "housing" &&
      body.type !== "question" &&
      isValidHousingExperience(body.housingExperience))) &&
  (body.title?.length || 0) <= 140 &&
  (body.images?.length || 0) <= 4 &&
  (body.attachments?.length || 0) <= 3 &&
  validTopicDetails(body);
const fields = (body: Partial<KnowledgePost>) => ({
  ...topicDetailsFields(body),
  type: body.type!,
  title: body.title?.trim(),
  contentMd: body.contentMd!.trim(),
  foodReview:
    body.type === "review" && body.foodReview
      ? {
          placeName: body.foodReview.placeName.trim(),
          dish: body.foodReview.dish?.trim(),
          rating: body.foodReview.rating,
          spentPerPerson: body.foodReview.spentPerPerson,
          visitedOn: body.foodReview.visitedOn || undefined,
          isDemo: body.foodReview.isDemo,
          coordinates: body.foodReview.coordinates ? {
            latitude: body.foodReview.coordinates.latitude,
            longitude: body.foodReview.coordinates.longitude,
          } : undefined,
        }
      : undefined,
  housingExperience:
    body.lifeTopic === "housing" &&
    (!body.housingPost || body.housingPost.kind === "experience") &&
    body.type !== "question" &&
    hasHousingExperience(body.housingExperience)
      ? {
          monthlyCost: body.housingExperience!.monthlyCost,
          duration: body.housingExperience!.duration?.trim(),
          highlights: body.housingExperience!.highlights?.trim(),
          considerations: body.housingExperience!.considerations?.trim(),
        }
      : undefined,
  lifeTopic: body.lifeTopic,
  campus: body.campus,
  area: body.area?.trim() || undefined,
  location: body.location?.trim().slice(0, 80),
  tags: (body.tags || []).slice(0, 3),
  visibility:
    body.visibility === "cross_school"
      ? ("cross_school" as const)
      : ("school" as const),
  images: body.images || [],
  attachments: body.attachments || [],
});

export const knowledgeHandlers = [
  http.get("/api/v1/posts", async ({ request }) => {
    await mockDelay();
    const params = new URL(request.url).searchParams;
    const userId = actor(request)?.id || "";
    const tab = params.get("tab");
    let list = seedKnowledgePosts.filter((post) => visible(post, request));
    if (tab === "mine")
      list = list.filter(
        (post) =>
          post.authorId === userId &&
          post.status === (params.get("status") || "Published"),
      );
    else
      list = list.filter(
        (post) => post.status === "Published" || post.status === "Closed",
      );
    if (tab === "following")
      list = list.filter((post) =>
        followedTopics(userId).has(post.lifeTopic || ""),
      );
    if (tab === "saved")
      list = list.filter((post) => savedPosts(userId).has(post.id));
    const topic = params.get("topic"),
      campus = params.get("campus"),
      kind = params.get("type");
    if (topic) list = list.filter((post) => post.lifeTopic === topic);
    if (campus) list = list.filter((post) => post.campus === campus);
    if (kind && kind !== "all")
      list = list.filter((post) =>
        kind === "sharing"
          ? !["question", "review"].includes(post.type)
          : post.type === kind,
      );
    const maxPrice = Number(params.get("maxPrice"));
    if (maxPrice > 0)
      list = list.filter(
        (post) =>
          post.type === "review" &&
          post.foodReview &&
          post.foodReview.spentPerPerson <= maxPrice,
      );
    list = list.filter((post) => matchesTopicFilters(post, params));
    if (params.get("authorId"))
      list = list.filter((post) => post.authorId === params.get("authorId"));
    if (params.get("tag"))
      list = list.filter((post) => post.tags.includes(params.get("tag")!));
    if (params.get("q")) {
      const query = normalizeLifeSearch(params.get("q")!.trim());
      list = list.filter((post) =>
        normalizeLifeSearch(
          [
            post.title,
            post.contentMd,
            post.location,
            post.campus,
            post.area,
            post.foodReview?.placeName,
            post.foodReview?.dish,
            post.housingExperience?.highlights,
            post.housingExperience?.considerations,
            post.housingPost?.area,
            post.studentExperience?.courseCode,
            post.ridePost?.origin,
            post.ridePost?.destination,
            ...post.tags,
          ].join(" "),
        ).includes(query),
      );
    }
    const sort = params.get("sort");
    if (topic === "food" && ["hot", "discussed", "price_low", "price_high"].includes(sort || ""))
      list = list.filter((post) => post.type === "review" && post.foodReview);
    if (sort === "unanswered")
      list = list.filter((post) => post.type === "question" && !post.isSolved);
    list.sort(
      sort === "hot"
        ? (a, b) => (b.likesCount || 0) - (a.likesCount || 0)
        : topic === "food" && sort === "price_low"
          ? (a, b) => a.foodReview!.spentPerPerson - b.foodReview!.spentPerPerson
        : topic === "food" && sort === "price_high"
          ? (a, b) => b.foodReview!.spentPerPerson - a.foodReview!.spentPerPerson
        : sort === "discussed"
          ? (a, b) => b.commentCount - a.commentCount
          : (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
    );
    return HttpResponse.json({
      data: list.map((post) => mapped(post, userId)),
    });
  }),
  http.post("/api/v1/posts", async ({ request }) => {
    await mockDelay();
    const user = actor(request);
    if (!user) return error(401, "Đăng nhập để chia sẻ bài viết.");
    const body = (await request.json()) as Partial<KnowledgePost>;
    if (!validBody(body))
      return error(
        400,
        "Cần nội dung, chủ đề và campus hợp lệ. Bài hỏi kinh nghiệm cần có tiêu đề.",
      );
    const post: KnowledgePost = {
      ...fields(body),
      id: `post_${Date.now()}`,
      authorId: user.id,
      status: isScenarioActive("post_auto_flagged")
        ? "PendingReview"
        : "Published",
      likesCount: 0,
      commentCount: 0,
      isSolved: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    seedKnowledgePosts.unshift(post);
    return HttpResponse.json({ data: post });
  }),
  http.get("/api/v1/posts/me", async ({ request }) => {
    await mockDelay();
    const userId = actor(request)?.id;
    const status = new URL(request.url).searchParams.get("status");
    return HttpResponse.json({
      data: seedKnowledgePosts
        .filter(
          (post) =>
            post.authorId === userId && (!status || status === post.status),
        )
        .map((post) => mapped(post, userId!)),
    });
  }),
  http.get("/api/v1/posts/saved", async ({ request }) => {
    await mockDelay();
    const id = actor(request)?.id || "";
    return HttpResponse.json({
      data: seedKnowledgePosts
        .filter((post) => visible(post, request) && savedPosts(id).has(post.id))
        .map((post) => mapped(post, id)),
    });
  }),
  http.get("/api/v1/posts/:id", async ({ params, request }) => {
    await mockDelay();
    const post = seedKnowledgePosts.find((item) => item.id === params.id);
    if (!post || !visible(post, request))
      return error(
        404,
        "Bài viết không tồn tại hoặc chưa được chia sẻ với bạn.",
      );
    return HttpResponse.json({
      data: {
        post: mapped(post, actor(request)?.id || ""),
        comments: seedComments.filter((comment) => comment.postId === post.id),
      },
    });
  }),
  http.put("/api/v1/posts/:id", async ({ params, request }) => {
    await mockDelay();
    const post = seedKnowledgePosts.find((item) => item.id === params.id);
    if (!post || post.authorId !== actor(request)?.id)
      return error(403, "Bạn chỉ có thể sửa bài của mình.");
    const body = (await request.json()) as Partial<KnowledgePost>;
    if (!validBody(body))
      return error(400, "Kiểm tra nội dung, chủ đề và campus của bài viết.");
    Object.assign(post, fields(body), {
      updatedAt: new Date().toISOString(),
      rejectReason: undefined,
      status: isScenarioActive("post_auto_flagged")
        ? "PendingReview"
        : "Published",
    });
    if (post.type !== "question") {
      post.isSolved = false;
      post.acceptedCommentId = undefined;
      seedComments
        .filter((comment) => comment.postId === post.id)
        .forEach((comment) => {
          comment.isAcceptedAnswer = false;
        });
    }
    return HttpResponse.json({ data: post });
  }),
  http.delete("/api/v1/posts/:id", async ({ params, request }) => {
    await mockDelay();
    const index = seedKnowledgePosts.findIndex((post) => post.id === params.id);
    if (index < 0 || seedKnowledgePosts[index].authorId !== actor(request)?.id)
      return error(403, "Bạn chỉ có thể xóa bài của mình.");
    seedKnowledgePosts.splice(index, 1);
    return HttpResponse.json({ data: { success: true } });
  }),
  ...(["like", "save"] as const).flatMap((action) =>
    [true, false].map((enabled) =>
      http[enabled ? "post" : "delete"](
        `/api/v1/posts/:id/${action}`,
        async ({ params, request }) => {
          await mockDelay();
          const user = actor(request),
            post = seedKnowledgePosts.find((item) => item.id === params.id);
          if (!user || !post || !visible(post, request))
            return error(403, "Bạn chưa có quyền tương tác với bài này.");
          if (action === "save") {
            if (enabled) savedPosts(user.id).add(post.id);
            else savedPosts(user.id).delete(post.id);
          } else {
            if (post.likedByMe !== enabled)
              post.likesCount = Math.max(
                0,
                (post.likesCount || 0) + (enabled ? 1 : -1),
              );
            post.likedByMe = enabled;
          }
          return HttpResponse.json({
            data: {
              success: true,
              likesCount: post.likesCount,
              saved: enabled,
            },
          });
        },
      ),
    ),
  ),
  http.post("/api/v1/posts/:id/comments", async ({ params, request }) => {
    await mockDelay();
    const user = actor(request),
      post = seedKnowledgePosts.find((item) => item.id === params.id);
    if (!user || !post || !visible(post, request))
      return error(403, "Bạn chưa có quyền bình luận tại đây.");
    if (post.status !== "Published")
      return error(409, "Bài viết hiện không nhận bình luận.");
    const body = (await request.json()) as {
      content?: string;
      parentId?: string;
    };
    if (!body.content?.trim())
      return error(400, "Nội dung bình luận không được trống.");
    if (
      body.parentId &&
      !seedComments.some(
        (comment) =>
          comment.id === body.parentId &&
          comment.postId === post.id &&
          !comment.parentId,
      )
    )
      return error(400, "Bình luận gốc không hợp lệ.");
    const comment: Comment = {
      id: `cmt_${Date.now()}`,
      postId: post.id,
      authorId: user.id,
      content: body.content.trim(),
      parentId: body.parentId,
      likesCount: 0,
      isAcceptedAnswer: false,
      createdAt: new Date().toISOString(),
    };
    seedComments.push(comment);
    post.commentCount += 1;
    return HttpResponse.json({ data: comment });
  }),
  http.put("/api/v1/posts/:id/accepted-answer", async ({ params, request }) => {
    await mockDelay();
    const post = seedKnowledgePosts.find((item) => item.id === params.id);
    if (!post || post.authorId !== actor(request)?.id)
      return error(403, "Chỉ người đăng được đánh dấu phản hồi hữu ích.");
    if (post.type !== "question" || post.status !== "Published")
      return error(
        400,
        "Chỉ bài hỏi kinh nghiệm đang mở mới dùng thao tác này.",
      );
    const { commentId } = (await request.json()) as { commentId: string };
    if (
      !seedComments.some(
        (comment) =>
          comment.id === commentId &&
          comment.postId === post.id &&
          !comment.parentId,
      )
    )
      return error(400, "Phản hồi không thuộc bài viết này.");
    const selected =
      post.acceptedCommentId === commentId ? undefined : commentId;
    post.acceptedCommentId = selected;
    post.isSolved = Boolean(selected);
    seedComments
      .filter((comment) => comment.postId === post.id)
      .forEach((comment) => {
        comment.isAcceptedAnswer = comment.id === selected;
      });
    return HttpResponse.json({ data: { success: true } });
  }),
  ...(["posts", "comments"] as const).map((kind) =>
    http.post(`/api/v1/${kind}/:id/report`, async ({ params, request }) => {
      const user = actor(request);
      if (!user) return error(401, "Đăng nhập để báo cáo.");
      const body = (await request.json()) as { reason: string; note?: string };
      const report = {
        id: `rep_${Date.now()}`,
        ...(kind === "posts"
          ? { postId: String(params.id) }
          : { commentId: String(params.id) }),
        reporterId: user.id,
        ...body,
        status: "Open" as const,
        createdAt: new Date().toISOString(),
      };
      seedReports.push(report);
      return HttpResponse.json({ data: report });
    }),
  ),
  http.get("/api/v1/community/topics/following", ({ request }) =>
    HttpResponse.json({ data: [...followedTopics(getViewerId(request))] }),
  ),
  ...[true, false].map((enabled) =>
    http[enabled ? "post" : "delete"](
      "/api/v1/community/topics/:topic/follow",
      ({ params, request }) => {
        const user = actor(request),
          topic = String(params.topic);
        if (!user) return error(401, "Đăng nhập để theo dõi chủ đề.");
        if (!LIFE_TOPICS.some((item) => item.value === topic))
          return error(400, "Chủ đề không tồn tại.");
        if (enabled) followedTopics(user.id).add(topic);
        else followedTopics(user.id).delete(topic);
        return HttpResponse.json({ data: { following: enabled } });
      },
    ),
  ),
];
