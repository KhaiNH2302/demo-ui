import type { HousingPost, KnowledgePost, PassPost, RidePost, StudentExperience } from "@/types/entities";
import { normalizeLifeSearch } from "./studentLife";
import { isCampusArea } from "./campusAreas";

export const HOUSING_KINDS = [
  { value: "seeking", label: "Tìm phòng" },
  { value: "roommate", label: "Tìm người ở ghép" },
  { value: "transfer", label: "Nhượng phòng" },
  { value: "experience", label: "Chia sẻ kinh nghiệm" },
] as const;
export const EXPERIENCE_CATEGORIES = [
  { value: "ojt", label: "OJT" },
  { value: "graduation", label: "Đồ án tốt nghiệp" },
  { value: "materials", label: "Tài liệu & ôn thi" },
  { value: "career", label: "CV & phỏng vấn" },
  { value: "procedures", label: "Thủ tục sinh viên" },
  { value: "other", label: "Kinh nghiệm khác" },
] as const;
export const EXPERIENCE_INTENTS = [
  { value: "sharing", label: "Chia sẻ kinh nghiệm" },
  { value: "asking", label: "Đặt câu hỏi" },
  { value: "request_materials", label: "Xin tài liệu" },
] as const;
export const HOUSING_AMENITIES = ["Khép kín", "Điều hòa", "Bếp riêng", "Máy giặt", "Không chung chủ", "Giờ giấc tự do"];
export const PASS_CATEGORIES = [
  { value: "electronics", label: "Đồ điện tử" },
  { value: "furniture", label: "Bàn ghế & nội thất" },
  { value: "books", label: "Sách & đồ học tập" },
  { value: "household", label: "Đồ gia dụng" },
  { value: "clothing", label: "Quần áo & phụ kiện" },
  { value: "other", label: "Đồ khác" },
] as const;
export const PASS_CONDITIONS = [
  { value: "like_new", label: "Như mới" },
  { value: "good", label: "Còn tốt" },
  { value: "used", label: "Đã dùng nhiều" },
] as const;
export function selectedHousingAmenities(value: string | null) {
  return [...new Set((value || "").split(",").map((item) => item.trim()).filter(Boolean))];
}
export const TOPIC_FILTER_KEYS = ["housingKind", "area", "maxRent", "people", "moveMonth", "amenity", "onlyOpen", "experienceCategory", "experienceIntent", "courseCode", "hasAttachments", "rideKind", "origin", "destination", "rideDate", "passCategory", "passCondition", "maxPassPrice", "passAvailable"];

export function currentLifeYear(now = new Date()) {
  return Number(new Intl.DateTimeFormat("en", { year: "numeric", timeZone: "Asia/Ho_Chi_Minh" }).format(now));
}

export function currentLifeDate(dayOffset = 0, now = new Date()) {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(now);
  const part = (type: string) => Number(parts.find((item) => item.type === type)!.value);
  return new Date(Date.UTC(part("year"), part("month") - 1, part("day") + dayOffset)).toISOString().slice(0, 10);
}

const money = (v: unknown) => v === undefined || (Number.isInteger(v) && Number(v) >= 0 && Number(v) <= 100_000_000);
const text = (v: unknown, max: number) => v === undefined || (typeof v === "string" && v.length <= max);
const day = (v: unknown) => {
  if (v === undefined || v === "") return true;
  if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const parsed = new Date(v + "T12:00:00Z");
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === v;
};
export const validCoordinates = (v: unknown): v is { latitude: number; longitude: number } => {
  if (!v || typeof v !== "object") return false;
  const p = v as { latitude: number; longitude: number };
  return Number.isFinite(p.latitude) && Math.abs(p.latitude) <= 90 && Number.isFinite(p.longitude) && Math.abs(p.longitude) <= 180;
};
export function validHousingPost(v?: HousingPost) {
  if (!v) return true;
  return (
    HOUSING_KINDS.some((k) => k.value === v.kind) &&
    text(v.area, 80) && money(v.price) && money(v.deposit) && money(v.serviceFee) &&
    text(v.electricity, 80) && text(v.water, 80) && day(v.availableFrom) &&
    (v.people === undefined || (Number.isInteger(v.people) && v.people > 0 && v.people <= 20)) &&
    (v.closed === undefined || typeof v.closed === "boolean") &&
    (v.amenities === undefined || (Array.isArray(v.amenities) && v.amenities.every((a) => HOUSING_AMENITIES.includes(a)))) &&
    (v.kind === "experience" || (Boolean(v.area?.trim()) && v.price !== undefined && ["room", "person"].includes(v.priceUnit || "")))
  );
}
export function validStudentExperience(v?: StudentExperience) {
  return !v || (
    EXPERIENCE_CATEGORIES.some((k) => k.value === v.category) &&
    EXPERIENCE_INTENTS.some((k) => k.value === v.intent) && text(v.courseCode, 30)
  );
}
export function validRidePost(v?: RidePost) {
  return !v || (
    ["seeking", "offering"].includes(v.kind) &&
    typeof v.origin === "string" && Boolean(v.origin.trim()) && v.origin.length <= 80 &&
    typeof v.destination === "string" && Boolean(v.destination.trim()) && v.destination.length <= 80 &&
    typeof v.departure === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v.departure) &&
    day(v.departure.slice(0, 10)) && Number(v.departure.slice(11, 13)) <= 23 && Number(v.departure.slice(14)) <= 59 &&
    (v.closed === undefined || typeof v.closed === "boolean") && money(v.contribution) && (v.seats === undefined || (Number.isInteger(v.seats) && v.seats >= 1 && v.seats <= 20))
  );
}
export function validPassPost(v?: PassPost) {
  return Boolean(v && typeof v.itemName === "string" && v.itemName.trim() && v.itemName.length <= 100 &&
    PASS_CATEGORIES.some((item) => item.value === v.category) && PASS_CONDITIONS.some((item) => item.value === v.condition) &&
    v.price !== undefined && money(v.price) && (v.closed === undefined || typeof v.closed === "boolean"));
}
export function validTopicDetails(post: Partial<KnowledgePost>) {
  return (
    (post.area === undefined || (typeof post.area === "string" && (!post.area || isCampusArea(post.campus || "", post.area)))) &&
    (!post.area || !post.housingPost || post.housingPost.kind === "experience" || post.housingPost.area === post.area) &&
    (!post.housingPost || post.lifeTopic === "housing") && validHousingPost(post.housingPost) &&
    (!post.studentExperience || post.lifeTopic === "experience") && validStudentExperience(post.studentExperience) &&
    (!post.studentExperience || post.studentExperience.intent === "sharing" || post.type === "question") &&
    (!post.ridePost || post.lifeTopic === "transport") && validRidePost(post.ridePost) &&
    (!post.passPost || post.lifeTopic === "marketplace") && (post.lifeTopic !== "marketplace" || post.type === "discussion" && validPassPost(post.passPost)) &&
    (post.foodReview?.coordinates === undefined || validCoordinates(post.foodReview.coordinates))
  );
}

export function topicDetailsFields(post: Partial<KnowledgePost>) {
  const h = post.housingPost, e = post.studentExperience, r = post.ridePost, p = post.passPost;
  return {
    housingPost: post.lifeTopic === "housing" && h ? h.kind === "experience" ? { kind: h.kind } : {
      kind: h.kind, area: h.area?.trim(), price: h.price, priceUnit: h.priceUnit,
      people: h.people, availableFrom: h.availableFrom || undefined,
      amenities: [...new Set(h.amenities || [])], closed: h.closed || false,
      deposit: h.kind !== "seeking" ? h.deposit : undefined,
      electricity: h.kind !== "seeking" ? h.electricity?.trim() : undefined,
      water: h.kind !== "seeking" ? h.water?.trim() : undefined,
      serviceFee: h.kind !== "seeking" ? h.serviceFee : undefined,
    } : undefined,
    studentExperience: post.lifeTopic === "experience" && e ? { category: e.category, intent: e.intent, courseCode: e.category === "materials" ? e.courseCode?.trim() : undefined } : undefined,
    ridePost: post.lifeTopic === "transport" && r ? { kind: r.kind, origin: r.origin.trim(), destination: r.destination.trim(), departure: r.departure, seats: r.seats, contribution: r.contribution, closed: r.closed || false } : undefined,
    passPost: post.lifeTopic === "marketplace" && p ? { itemName: p.itemName?.trim(), category: p.category, condition: p.condition, price: p.price, closed: p.closed || false } : undefined,
  };
}

export function matchesTopicFilters(post: KnowledgePost, params: URLSearchParams, now = new Date()) {
  const h = post.housingPost, e = post.studentExperience, r = post.ridePost, p = post.passPost;
  const contains = (value: string | undefined, query: string) => normalizeLifeSearch(value || "").includes(normalizeLifeSearch(query.trim()));
  if (params.get("housingKind") && (h?.kind || (post.lifeTopic === "housing" ? "experience" : "")) !== params.get("housingKind")) return false;
  if (params.get("area") && normalizeLifeSearch(post.area || h?.area || "") !== normalizeLifeSearch(params.get("area")!.trim())) return false;
  if (params.get("maxRent") && (h?.price === undefined || h.price > Number(params.get("maxRent")))) return false;
  if (params.get("priceUnit") && h?.priceUnit !== params.get("priceUnit")) return false;
  if (params.get("people") && h?.people !== Number(params.get("people"))) return false;
  if (params.get("moveMonth")) {
    const month = params.get("moveMonth")!;
    if (!/^(0[1-9]|1[0-2])$/.test(month) || !h?.availableFrom?.startsWith(`${currentLifeYear(now)}-${month}-`)) return false;
  }
  if (!selectedHousingAmenities(params.get("amenity")).every((amenity) => h?.amenities?.includes(amenity))) return false;
  if (params.get("onlyOpen") === "1" && (!h || h.kind === "experience" || h.closed)) return false;
  if (params.get("experienceCategory") && e?.category !== params.get("experienceCategory")) return false;
  if (params.get("experienceIntent") && e?.intent !== params.get("experienceIntent")) return false;
  if (params.get("courseCode") && !contains(e?.courseCode, params.get("courseCode")!)) return false;
  if (params.get("hasAttachments") === "1" && !post.attachments.length) return false;
  if (params.get("minRating") && (!post.foodReview || post.foodReview.isDemo || post.foodReview.rating === undefined || post.foodReview.rating < Number(params.get("minRating")))) return false;
  if (params.get("rideKind") && r?.kind !== params.get("rideKind")) return false;
  if (params.get("origin") && !contains(r?.origin, params.get("origin")!)) return false;
  if (params.get("destination") && !contains(r?.destination, params.get("destination")!)) return false;
  if (params.get("rideDate") && r?.departure.slice(0, 10) !== params.get("rideDate")) return false;
  if (params.get("passCategory") && p?.category !== params.get("passCategory")) return false;
  if (params.get("passCondition") && p?.condition !== params.get("passCondition")) return false;
  if (params.get("maxPassPrice") && (p?.price === undefined || p.price > Number(params.get("maxPassPrice")))) return false;
  if (params.get("passAvailable") === "1" && (!p || p.closed)) return false;
  return true;
}
export function distanceKm(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) {
  const rad = (n: number) => n * Math.PI / 180;
  const x = Math.sin(rad(b.latitude - a.latitude) / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(rad(b.longitude - a.longitude) / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(Math.max(0, 1 - x)));
}

export function coordinatesFromText(value: string) {
  const match = value.trim().match(/^(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)$/) || value.match(/!3d(-?[\d.]+)!4d(-?[\d.]+)/) || value.match(/(?:@|[?&](?:q|query)=)(-?[\d.]+),\s*(-?[\d.]+)/);
  if (!match) return undefined;
  const point = { latitude: Number(match[1]), longitude: Number(match[2]) };
  return validCoordinates(point) ? point : undefined;
}
