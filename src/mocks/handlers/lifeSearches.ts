import { lifeReminderFields } from '@/lib/lifePostLifecycle';
import { http, HttpResponse } from "msw";
import type { KnowledgePost } from "@/types/entities";
import { getCampusAreas } from "@/lib/campusAreas";
import { currentLifeDate, currentLifeYear } from "@/lib/studentLifeDetails";
import { isDemoMode } from "@/lib/demoMode";
import { lifeSearchExpired, lifeSearchLabels, matchesLifeSearch } from "@/lib/lifeSearches";
import { seedUsers } from "../data/users";
import { seedKnowledgePosts } from "../data/knowledge";
import { demoAttachment } from "../data/studentLifeDemoResources";
import { getAuthenticatedViewerId, mockDelay } from "../utils";
import { deleteLifeSearch, getLifeSearch, listLifeSearches, persistLifeSearchDemoPost, reconcileLifeSearchAlerts, writeLifeSearch } from "../lifeSearches";

const actor = (request: Request) => seedUsers.find((user) => user.id === getAuthenticatedViewerId(request) && user.status === "active");
const failure = (status: number, message: string) => HttpResponse.json({ error: { code: status === 401 ? "UNAUTHORIZED" : "INVALID_SEARCH", message } }, { status });

export const lifeSearchHandlers = [
  http.get("/api/v1/community/searches", async ({ request }) => {
    await mockDelay(50, 100);
    const user = actor(request);
    return user ? HttpResponse.json({ data: listLifeSearches(user.id) }) : failure(401, "Đăng nhập để quản lý tìm kiếm của bạn.");
  }),
  http.post("/api/v1/community/searches", async ({ request }) => {
    await mockDelay(50, 100);
    const user = actor(request);
    if (!user) return failure(401, "Đăng nhập để theo dõi tìm kiếm.");
    try { return HttpResponse.json({ data: writeLifeSearch(user.id, await request.json()) }); }
    catch (error) { return failure(400, error instanceof Error ? error.message : "Không thể lưu tìm kiếm."); }
  }),
  http.patch("/api/v1/community/searches/:id", async ({ request, params }) => {
    await mockDelay(50, 100);
    const user = actor(request);
    if (!user) return failure(401, "Vui lòng đăng nhập.");
    if (!getLifeSearch(user.id, String(params.id))) return failure(404, "Không tìm thấy tìm kiếm của bạn.");
    try { return HttpResponse.json({ data: writeLifeSearch(user.id, await request.json(), String(params.id)) }); }
    catch (error) { return failure(400, error instanceof Error ? error.message : "Không thể cập nhật tìm kiếm."); }
  }),
  http.delete("/api/v1/community/searches/:id", async ({ request, params }) => {
    await mockDelay(50, 100);
    const user = actor(request);
    if (!user) return failure(401, "Vui lòng đăng nhập.");
    return deleteLifeSearch(user.id, String(params.id)) ? HttpResponse.json({ data: { success: true } }) : failure(404, "Không tìm thấy tìm kiếm của bạn.");
  }),
  http.post("/api/v1/community/searches/:id/demo", async ({ request, params }) => {
    await mockDelay(50, 100);
    if (!isDemoMode) return failure(404, "Không có chức năng này.");
    const user = actor(request);
    if (!user) return failure(401, "Vui lòng đăng nhập.");
    const search = getLifeSearch(user.id, String(params.id));
    if (!search) return failure(404, "Không tìm thấy tìm kiếm của bạn.");
    if (!search.enabled || lifeSearchExpired(search)) return failure(409, "Bật theo dõi tìm kiếm còn hiệu lực để thử.");
    const f = search.filters, now = new Date().toISOString();
    const area = f.area || getCampusAreas(f.campus)[0];
    const author = seedUsers.find((item) => item.id !== user.id && item.status === "active" && item.roles.some((role) => role.toLowerCase() === "student"));
    if (!author) return failure(409, "Chưa có tài khoản sinh viên khác để minh họa.");
    const post: KnowledgePost = {
      id: `life_search_demo_${crypto.randomUUID()}`, authorId: author.id, lifeTopic: f.topic, campus: f.campus, area,
      type: f.type === "sharing" ? "discussion" : f.type as KnowledgePost["type"] || "discussion",
      title: `[Minh họa] Bài mới cho ${search.name}`.slice(0, 140),
      contentMd: `Bài mô phỏng được tạo để thử thông báo tìm kiếm. ${f.q || ""}\nĐiều kiện: ${lifeSearchLabels(f).join(" · ")}. Không phải nhu cầu hay địa điểm thực tế.`,
      tags: [], images: [], attachments: [], status: "Published", visibility: "cross_school",
      likesCount: 0, commentCount: 0, createdAt: now, updatedAt: now, publishedAt: now,
      demoContent: { kind: "synthetic", note: "Bài được tạo bằng nút Thử thông báo để minh họa tìm kiếm đã theo dõi; không phải tin thật." },
    };
    if (f.topic === "housing") post.housingPost = {
      kind: (f.housingKind || "roommate") as "seeking" | "roommate" | "transfer" | "experience", area,
      price: Number(f.maxRent || 1500000), priceUnit: f.priceUnit === "room" ? "room" : "person", people: Number(f.people || 2),
      availableFrom: `${currentLifeYear()}-${f.moveMonth || currentLifeDate().slice(5, 7)}-01`,
      amenities: f.amenity ? f.amenity.split(",") : [], closed: false,
    };
    if (f.topic === "food" && (f.maxPrice || f.type === "review" || !f.type)) {
      post.type = "review";
      post.foodReview = { placeName: "Quán minh họa tìm kiếm", spentPerPerson: Number(f.maxPrice || 30000) };
    }
    if (f.topic === "experience") {
      post.studentExperience = { category: (f.experienceCategory || "materials") as "materials", intent: (f.experienceIntent || "sharing") as "sharing", courseCode: f.courseCode };
      if (post.studentExperience.intent !== "sharing") post.type = "question";
      if (f.hasAttachments) post.attachments = [demoAttachment(post.studentExperience.category)];
    }
    if (f.topic === "transport") post.ridePost = { kind: f.rideKind === "offering" ? "offering" : "seeking", origin: f.origin || "Điểm đón minh họa", destination: f.destination || "Điểm đến minh họa", departure: `${f.rideDate || currentLifeDate(1)}T23:59`, seats: 1 };
    if (f.topic === "marketplace") post.passPost = { itemName: "Món đồ minh họa tìm kiếm", category: (f.passCategory || "household") as "household", condition: (f.passCondition || "good") as "good", price: Number(f.maxPassPrice || 150000), closed: false };
    // A contradictory combination should not manufacture a misleading notification.
    if (!matchesLifeSearch(post, f, user.id)) return failure(409, "Các điều kiện này chưa tạo được ví dụ phù hợp. Bạn thử bỏ điều kiện mâu thuẫn hoặc chọn ngày khác nhé.");
    Object.assign(post, lifeReminderFields(post));
    seedKnowledgePosts.unshift(post);
    persistLifeSearchDemoPost(post);
    reconcileLifeSearchAlerts();
    return HttpResponse.json({ data: { postId: post.id } });
  }),
];
