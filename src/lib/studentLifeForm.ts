import type { FoodReview, HousingExperience, HousingPost, KnowledgePost, PostType, RidePost, StudentExperience } from "@/types/entities";
import { getCampusAreas, isCampusArea } from "./campusAreas";
import { LIFE_CAMPUSES, LIFE_TOPICS, hasHousingExperience, isValidFoodReview, isValidHousingExperience, localReviewDate } from "./studentLife";
import { EXPERIENCE_CATEGORIES, EXPERIENCE_INTENTS, HOUSING_AMENITIES, HOUSING_KINDS, topicDetailsFields, validCoordinates, validHousingPost, validRidePost, validStudentExperience } from "./studentLifeDetails";

export interface LifeComposerState {
  topic: string;
  campus: string;
  area: string;
  type: PostType;
  title: string;
  content: string;
  location: string;
  tags: string[];
  visibility: "school" | "cross_school";
  foodReview: FoodReview;
  housingPost: HousingPost;
  housingExperience: HousingExperience;
  studentExperience: StudentExperience;
  ridePost: RidePost;
  images: string[];
  attachments: KnowledgePost["attachments"];
}
type Draft = Partial<Omit<LifeComposerState, "images" | "attachments">>;
const object = (v: unknown): Record<string, unknown> => v && typeof v === "object" && !Array.isArray(v) ? v as Record<string, unknown> : {};
const text = (v: unknown, max = 3000) => typeof v === "string" ? v.slice(0, max) : "";
const number = (v: unknown) => typeof v === "number" && Number.isFinite(v) ? v : undefined;
const strings = (v: unknown) => Array.isArray(v) ? v.filter((item): item is string => typeof item === "string") : [];

export function normalizeHousingForm(value: Partial<HousingPost> = {}): HousingPost {
  const kind = HOUSING_KINDS.some((item) => item.value === value.kind) ? value.kind! : "seeking";
  return {
    ...value, kind,
    priceUnit: value.priceUnit === "person" || value.priceUnit === "room" ? value.priceUnit : kind === "roommate" ? "person" : "room",
    amenities: value.amenities || [], closed: value.closed || false,
  };
}

export function readLifeDraft(raw: string | null): Draft {
  let value: Record<string, unknown>;
  try { value = object(JSON.parse(raw || "{}")); } catch { return {}; }
  const h = object(value.housingPost), f = object(value.foodReview), e = object(value.studentExperience), r = object(value.ridePost), x = object(value.housingExperience);
  return {
    topic: text(value.topic, 30), campus: text(value.campus, 50), area: typeof value.area === "string" ? text(value.area, 80) : undefined,
    type: ["discussion", "experience", "document", "question", "review"].includes(String(value.type)) ? value.type as PostType : undefined,
    title: text(value.title, 140), content: text(value.content), location: text(value.location, 80), tags: strings(value.tags).slice(0, 3),
    visibility: value.visibility === "cross_school" ? "cross_school" : "school",
    foodReview: { placeName: text(f.placeName, 100), dish: text(f.dish, 100), spentPerPerson: number(f.spentPerPerson) ?? 0, visitedOn: text(f.visitedOn, 10) || undefined, coordinates: validCoordinates(f.coordinates) ? f.coordinates : undefined },
    housingPost: Object.keys(h).length ? normalizeHousingForm({
      kind: h.kind as HousingPost["kind"], area: text(h.area, 80), priceUnit: h.priceUnit as HousingPost["priceUnit"],
      price: number(h.price), people: number(h.people), availableFrom: text(h.availableFrom, 10),
      amenities: strings(h.amenities).filter((a) => HOUSING_AMENITIES.includes(a)), closed: h.closed === true,
      deposit: number(h.deposit), serviceFee: number(h.serviceFee), electricity: text(h.electricity, 80), water: text(h.water, 80),
    }) : undefined,
    housingExperience: { monthlyCost: number(x.monthlyCost), duration: text(x.duration, 80), highlights: text(x.highlights, 180), considerations: text(x.considerations, 180) },
    studentExperience: Object.keys(e).length ? {
      category: EXPERIENCE_CATEGORIES.some((c) => c.value === e.category) ? e.category as StudentExperience["category"] : "other",
      intent: EXPERIENCE_INTENTS.some((c) => c.value === e.intent) ? e.intent as StudentExperience["intent"] : "sharing",
      courseCode: text(e.courseCode, 30),
    } : undefined,
    ridePost: { kind: r.kind === "offering" ? "offering" : "seeking", origin: text(r.origin, 80), destination: text(r.destination, 80), departure: text(r.departure, 16), seats: number(r.seats), contribution: number(r.contribution) },
  };
}

export function resolveLifePostType(state: Pick<LifeComposerState, "topic" | "type" | "housingPost" | "studentExperience" | "attachments">): PostType {
  if (state.topic === "housing") return state.housingPost.kind === "experience" ? state.type === "question" ? "question" : "experience" : "discussion";
  if (state.topic === "transport") return "discussion";
  if (state.topic === "experience") return state.studentExperience.intent !== "sharing" ? "question" : state.attachments.length ? "document" : "experience";
  if (state.topic === "food") return state.type === "question" ? "question" : state.type === "review" ? "review" : "discussion";
  return state.type === "question" ? "question" : "discussion";
}

export function initialLifeForm({ post, draft: saved = {}, defaultTopic = "", defaultCampus = "", defaultArea = "", defaultType }: {
  post?: KnowledgePost; draft?: Draft; defaultTopic?: string; defaultCampus?: string; defaultArea?: string; defaultType?: PostType;
} = {}): LifeComposerState {
  // Opening a different topic/campus must not relabel the previous draft's text.
  const draft = !post && (!defaultTopic || !saved.topic || defaultTopic === saved.topic) && (!defaultCampus || !saved.campus || defaultCampus === saved.campus) ? saved : {};
  const topic = post?.lifeTopic || defaultTopic || draft.topic || (defaultType === "review" ? "food" : "");
  const campus = post ? post.campus || "" : defaultCampus || draft.campus || "";
  const h = normalizeHousingForm(post ? post.housingPost || { kind: post.lifeTopic === "housing" ? "experience" : "seeking" } : draft.housingPost);
  const candidateArea = post ? post.area ?? h.area : defaultArea || (draft.area ?? h.area);
  const area = isCampusArea(campus, candidateArea) ? candidateArea : getCampusAreas(campus).find((item) => item.replace(/ \(khu vực cũ\)$/, "") === candidateArea) || "";
  const requestedType = post?.type || defaultType || draft.type || (topic === "food" ? "review" : "discussion");
  const food = post ? post.foodReview : draft.foodReview;
  const state: LifeComposerState = {
    topic, campus, area, type: requestedType,
    title: post ? post.title || "" : draft.title || "", content: post ? post.contentMd || "" : draft.content || "",
    location: post ? post.location || "" : draft.location || "", tags: post ? post.tags || [] : draft.tags || [],
    visibility: post ? post.visibility || "school" : draft.visibility || "school",
    foodReview: { ...(food || { placeName: "", dish: "", spentPerPerson: 0, visitedOn: localReviewDate() }), rating: undefined },
    housingPost: h, housingExperience: (post ? post.housingExperience : draft.housingExperience) || {},
    studentExperience: (post ? post.studentExperience : draft.studentExperience) || { category: post ? "other" : "ojt", intent: requestedType === "question" ? "asking" : "sharing" },
    ridePost: (post ? post.ridePost : draft.ridePost) || { kind: "seeking", origin: "", destination: "", departure: "" },
    images: post?.images || [], attachments: post?.attachments || [],
  };
  return { ...state, type: resolveLifePostType(state) };
}

export function lifePostPayload(state: LifeComposerState) {
  const type = resolveLifePostType(state);
  const housing = normalizeHousingForm(state.housingPost);
  const housingPost = state.topic === "housing" ? housing.kind === "experience" ? { kind: housing.kind } : { ...housing, area: state.area || undefined } : undefined;
  const foodReview = state.topic === "food" && type === "review" ? { ...state.foodReview, rating: undefined } : undefined;
  const studentExperience = state.topic === "experience" ? state.studentExperience : undefined;
  const ridePost = state.topic === "transport" ? state.ridePost : undefined;
  const derivedTitle = foodReview ? `Ăn thử ở ${foodReview.placeName.trim()}` : ridePost ? `${ridePost.origin.trim()} → ${ridePost.destination.trim()}` : housingPost && housingPost.kind !== "experience" ? `${HOUSING_KINDS.find((k) => k.value === housingPost.kind)?.label} tại ${state.area}` : undefined;
  return {
    type, title: state.title.trim() || derivedTitle, contentMd: state.content.trim(), lifeTopic: state.topic,
    campus: state.campus, area: state.area || undefined,
    location: ridePost ? `${ridePost.origin.trim()} → ${ridePost.destination.trim()}` : state.location.trim(),
    foodReview,
    housingExperience: state.topic === "housing" && housing.kind === "experience" && type !== "question" && hasHousingExperience(state.housingExperience) ? state.housingExperience : undefined,
    ...topicDetailsFields({ lifeTopic: state.topic, housingPost, studentExperience, ridePost }),
    tags: state.tags, visibility: state.visibility, images: state.images, attachments: state.attachments,
  };
}

export function lifeFormErrors(state: LifeComposerState) {
  const errors: string[] = [];
  const payload = lifePostPayload(state);
  if (!LIFE_TOPICS.some((topic) => topic.value === state.topic)) errors.push("Chọn chủ đề bài viết.");
  if (!LIFE_CAMPUSES.some((campus) => campus === state.campus)) errors.push("Chọn cơ sở liên quan.");
  if (state.area && !isCampusArea(state.campus, state.area)) errors.push("Chọn khu vực thuộc cơ sở đã chọn.");
  if (!state.content.trim()) errors.push("Nhập nội dung bài viết.");
  if (state.content.length > 3000) errors.push("Nội dung tối đa 3.000 ký tự.");
  if (payload.type === "question" && !state.title.trim()) errors.push("Nhập câu hỏi ở phần tiêu đề.");
  if (state.title.length > 140) errors.push("Tiêu đề tối đa 140 ký tự.");
  if (state.topic === "housing") {
    const h = payload.housingPost!;
    if (h.kind !== "experience") {
      if (!state.area) errors.push("Chọn khu vực cho tin trọ.");
      if (h.price === undefined) errors.push(h.kind === "seeking" ? "Nhập ngân sách tối đa." : "Nhập giá thuê.");
      if (!h.availableFrom) errors.push("Chọn tháng chuyển vào.");
      if (!validHousingPost(h) && state.area && h.price !== undefined) errors.push("Kiểm tra giá thuê, số người và các khoản chi phí.");
    } else if (payload.housingExperience && !isValidHousingExperience(payload.housingExperience)) errors.push("Kiểm tra các thông tin trải nghiệm chỗ ở.");
  }
  if (payload.foodReview && !isValidFoodReview(payload.foodReview)) errors.push("Điền tên quán và mức giá hợp lệ cho mỗi người.");
  if (payload.foodReview?.coordinates && !validCoordinates(payload.foodReview.coordinates)) errors.push("Kiểm tra vị trí quán.");
  if (state.topic === "experience" && !validStudentExperience(payload.studentExperience)) errors.push("Chọn phân loại và nhu cầu chia sẻ kinh nghiệm.");
  if (payload.ridePost) {
    if (!payload.ridePost.origin) errors.push("Nhập điểm đi.");
    if (!payload.ridePost.destination) errors.push("Nhập điểm đến.");
    if (payload.ridePost.origin && payload.ridePost.origin === payload.ridePost.destination) errors.push("Điểm đi và điểm đến cần khác nhau.");
    if (!validRidePost(payload.ridePost)) errors.push("Chọn đủ ngày, giờ đi và kiểm tra số chỗ, chi phí.");
  }
  if (state.images.length > 4 || state.attachments.length > 3) errors.push("Mỗi bài tối đa 4 ảnh và 3 tệp.");
  return errors;
}

export function hasLifeDraftContent(state: LifeComposerState) {
  return Boolean(state.title.trim() || state.content.trim() ||
    (state.topic === "food" && state.foodReview.placeName.trim()) ||
    (state.topic === "housing" && (state.housingPost.price !== undefined || hasHousingExperience(state.housingExperience))) ||
    (state.topic === "transport" && (state.ridePost.origin || state.ridePost.destination)));
}
