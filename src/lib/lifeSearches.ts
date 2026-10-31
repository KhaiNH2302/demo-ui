import { lifeDiscoverable } from './lifePostLifecycle';
import type { KnowledgePost } from "@/types/entities";
import { isCampusArea } from "./campusAreas";
import { LIFE_CAMPUSES, lifeTopicLabel, normalizeLifeSearch } from "./studentLife";
import { currentLifeDate, currentLifeYear, EXPERIENCE_CATEGORIES, EXPERIENCE_INTENTS, HOUSING_AMENITIES, HOUSING_KINDS, PASS_CATEGORIES, PASS_CONDITIONS, matchesTopicFilters, selectedHousingAmenities } from "./studentLifeDetails";

export type LifeSearchFilters = Record<string, string>;
export interface LifeSavedSearch {
  id: string;
  name: string;
  filters: LifeSearchFilters;
  enabled: boolean;
  createdAt: string;
  startedAt: string;
  expiresAt?: string;
  matchCount: number;
}
export const LIFE_SEARCH_TOPICS = ["housing", "food", "transport", "experience", "marketplace"];
const commonKeys = ["topic", "campus", "area", "q", "type", "unanswered"];
const topicKeys: Record<string, string[]> = {
  housing: ["housingKind", "maxRent", "priceUnit", "people", "moveMonth", "amenity"],
  food: ["maxPrice"],
  transport: ["rideKind", "origin", "destination", "rideDate"],
  experience: ["experienceCategory", "experienceIntent", "courseCode", "hasAttachments"],
  marketplace: ["passCategory", "passCondition", "maxPassPrice", "passAvailable"],
};

export function lifeSearchDraft(params: URLSearchParams): LifeSearchFilters {
  const topic = params.get("topic") || "";
  const keys = [...commonKeys, ...(topicKeys[topic] || [])];
  const draft = Object.fromEntries(keys.filter((key) => params.get(key)).map((key) => [key, params.get(key)!]));
  if (topic === "food" && ["hot", "discussed", "price_low", "price_high"].includes(params.get("sort") || "")) draft.type = "review";
  if (params.get("sort") === "unanswered") { draft.type = "question"; draft.unanswered = "1"; }
  return draft;
}

export function lifeSearchExpiry(filters: LifeSearchFilters, now = new Date()) {
  if (filters.rideDate) return new Date(Date.parse(filters.rideDate + "T00:00:00+07:00") + 86400000).toISOString();
  if (filters.moveMonth) return new Date(Date.UTC(currentLifeYear(now), Number(filters.moveMonth), 1) - 7 * 3600000).toISOString();
  return undefined;
}
export const lifeSearchExpired = (search: Pick<LifeSavedSearch, "expiresAt">, now = new Date()) => Boolean(search.expiresAt && Date.parse(search.expiresAt) <= now.getTime());

/** Shared contract for the confirmation dialog, API and matching worker. */
export function normalizeLifeSearchFilters(raw: unknown, now = new Date()): LifeSearchFilters {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new Error("Điều kiện tìm kiếm không hợp lệ.");
  const value = raw as Record<string, unknown>;
  if (typeof value.topic !== "string" || !LIFE_SEARCH_TOPICS.includes(value.topic)) throw new Error("Chọn chủ đề Trọ, Ăn uống, Ghép xe, Pass đồ hoặc Kinh nghiệm để theo dõi.");
  if (typeof value.campus !== "string" || !LIFE_CAMPUSES.some((campus) => campus === value.campus)) throw new Error("Chọn một cơ sở để nhận đúng bài bạn quan tâm.");
  const filters: LifeSearchFilters = {};
  for (const key of [...commonKeys, ...topicKeys[value.topic]]) {
    if (value[key] === undefined || value[key] === "") continue;
    if (typeof value[key] !== "string" || value[key].length > (key === "q" ? 200 : 160)) throw new Error("Điều kiện tìm kiếm không hợp lệ.");
    if (value[key].trim()) filters[key] = value[key].trim();
  }
  if (filters.area && !isCampusArea(filters.campus, filters.area)) throw new Error("Khu vực phải thuộc cơ sở đã chọn.");
  const choice = (key: string, options: readonly string[]) => {
    if (filters[key] && !options.includes(filters[key])) throw new Error("Lựa chọn trong bộ lọc không hợp lệ.");
  };
  choice("type", ["sharing", "discussion", "question", "review", "experience", "document"]);
  if (filters.type === "review" && filters.topic !== "food") throw new Error("Review quán chỉ dùng cho chủ đề ăn uống.");
  choice("housingKind", HOUSING_KINDS.map((item) => item.value));
  choice("experienceCategory", EXPERIENCE_CATEGORIES.map((item) => item.value));
  choice("experienceIntent", EXPERIENCE_INTENTS.map((item) => item.value));
  choice("rideKind", ["seeking", "offering"]);
  choice("people", ["1", "2", "3", "4"]);
  choice("moveMonth", Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0")));
  choice("hasAttachments", ["1"]);
  choice("unanswered", ["1"]);
  choice("passCategory", PASS_CATEGORIES.map((item) => item.value));
  choice("passCondition", PASS_CONDITIONS.map((item) => item.value));
  choice("passAvailable", ["1"]);
  if (filters.topic === "marketplace" && (filters.unanswered || filters.type && !["discussion", "sharing"].includes(filters.type))) throw new Error("Tin Pass đồ không dùng hình thức hỏi đáp hoặc review.");
  const amount = (key: string, min: number, max: number) => {
    if (filters[key] && (!/^\d+$/.test(filters[key]) || Number(filters[key]) < min || Number(filters[key]) > max)) throw new Error("Mức giá theo dõi không hợp lệ.");
    if (filters[key]) filters[key] = String(Number(filters[key]));
  };
  amount("maxRent", 0, 100000000);
  amount("maxPrice", 1000, 5000000);
  amount("maxPassPrice", 0, 100000000);
  if (filters.maxRent) {
    if (!["room", "person"].includes(filters.priceUnit || "")) throw new Error("Chọn mức giá trọ theo phòng hay theo người.");
  } else delete filters.priceUnit;
  if (filters.amenity) {
    const amenities = selectedHousingAmenities(filters.amenity);
    if (!amenities.every((item) => HOUSING_AMENITIES.includes(item))) throw new Error("Tiện ích không hợp lệ.");
    filters.amenity = [...new Set(amenities)].sort().join(",");
  }
  if (filters.housingKind === "experience") ["maxRent", "priceUnit", "people", "moveMonth", "amenity"].forEach((key) => delete filters[key]);
  if (filters.experienceCategory !== "materials") delete filters.courseCode;
  if (filters.rideDate && (!/^\d{4}-\d{2}-\d{2}$/.test(filters.rideDate) || Number.isNaN(Date.parse(filters.rideDate)) || new Date(filters.rideDate).toISOString().slice(0, 10) !== filters.rideDate || filters.rideDate < currentLifeDate(0, now))) throw new Error("Chọn ngày đi hôm nay hoặc một ngày sắp tới.");
  const expiresAt = lifeSearchExpiry(filters, now);
  if (expiresAt && Date.parse(expiresAt) <= now.getTime()) throw new Error("Thời gian tìm kiếm đã qua. Chọn lại tháng chuyển vào hoặc ngày đi.");
  return Object.fromEntries(Object.entries(filters).sort(([a], [b]) => a.localeCompare(b)));
}

export function lifeSearchSignature(filters: LifeSearchFilters) {
  return JSON.stringify(Object.entries(filters).map(([key, value]) => [key, normalizeLifeSearch(value)]).sort(([a], [b]) => a.localeCompare(b)));
}

export function lifePostSearchText(post: KnowledgePost) {
  return normalizeLifeSearch([post.title, post.contentMd, post.location, post.campus, post.area, post.foodReview?.placeName, post.foodReview?.dish, post.housingExperience?.highlights, post.housingExperience?.considerations, post.housingPost?.area, post.studentExperience?.courseCode, post.ridePost?.origin, post.ridePost?.destination, post.passPost?.itemName, ...post.tags].join(" "));
}

export function matchesLifeSearch(post: KnowledgePost, filters: LifeSearchFilters, viewerId: string, now = new Date()) {
  if (!lifeDiscoverable(post) || post.status !== "Published" || post.authorId === viewerId || post.lifeTopic !== filters.topic || post.campus !== filters.campus) return false;
  if (post.housingPost?.closed || post.passPost?.closed || post.ridePost?.closed) return false;
  if (post.lifeTopic === "transport" && (!post.ridePost || !Number.isFinite(Date.parse(post.ridePost.departure + "+07:00")))) return false;
  if (filters.type && (filters.type === "sharing" ? ["question", "review"].includes(post.type) : post.type !== filters.type)) return false;
  if (filters.unanswered && (post.type !== "question" || post.isSolved)) return false;
  if (filters.maxPrice && (post.type !== "review" || !post.foodReview || post.foodReview.spentPerPerson > Number(filters.maxPrice))) return false;
  if (filters.q && !lifePostSearchText(post).includes(normalizeLifeSearch(filters.q))) return false;
  return matchesTopicFilters(post, new URLSearchParams(filters), now);
}

export function lifeSearchLabels(filters: LifeSearchFilters): string[] {
  const money = (value: string) => Number(value).toLocaleString("vi-VN") + "đ";
  const labels: (string | undefined)[] = [lifeTopicLabel(filters.topic), filters.campus, filters.area];
  const label = (key: string, options: readonly { value: string; label: string }[]) => options.find((item) => item.value === filters[key])?.label;
  labels.push(label("housingKind", HOUSING_KINDS), label("experienceCategory", EXPERIENCE_CATEGORIES), label("experienceIntent", EXPERIENCE_INTENTS));
  labels.push(label("passCategory", PASS_CATEGORIES), label("passCondition", PASS_CONDITIONS));
  if (filters.maxPassPrice) labels.push(filters.maxPassPrice === "0" ? "Tặng miễn phí" : `Đến ${money(filters.maxPassPrice)}`);
  if (filters.passAvailable) labels.push("Còn đồ");
  if (filters.maxRent) labels.push(filters.priceUnit ? `Đến ${money(filters.maxRent)}/${filters.priceUnit === "person" ? "người" : "phòng"}/tháng` : `Đến ${money(filters.maxRent)}/tháng · chưa chọn đơn vị`);
  if (filters.people) labels.push(`${filters.people} người`);
  if (filters.moveMonth) labels.push(`Chuyển vào tháng ${Number(filters.moveMonth)}`);
  if (filters.amenity) labels.push(...selectedHousingAmenities(filters.amenity));
  if (filters.maxPrice) labels.push(`Đến ${money(filters.maxPrice)}/người`);
  if (filters.rideKind) labels.push(filters.rideKind === "offering" ? "Có xe, còn chỗ" : "Cần ghép chuyến");
  if (filters.origin) labels.push(`Đi: ${filters.origin}`);
  if (filters.destination) labels.push(`Đến: ${filters.destination}`);
  if (filters.rideDate) labels.push(`Ngày ${filters.rideDate.split("-").reverse().join("/")}`);
  if (filters.courseCode) labels.push(filters.courseCode);
  if (filters.hasAttachments) labels.push("Có tài liệu đính kèm");
  if (filters.unanswered) labels.push("Chưa có lời giải");
  if (filters.q) labels.push(`Từ khóa: ${filters.q}`);
  if (filters.type) labels.push(({ sharing: "Bài chia sẻ", discussion: "Thảo luận", question: "Câu hỏi", review: "Review quán", experience: "Bài kinh nghiệm", document: "Bài tài liệu" })[filters.type]);
  return labels.filter((item): item is string => Boolean(item));
}
