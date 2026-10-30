import type { FoodReview, HousingExperience } from "@/types/entities";
export const LIFE_TOPICS = [
  {
    value: "housing",
    label: "Chuyện ở trọ",
    description:
      "Trải nghiệm chỗ ở, chi phí sinh hoạt và chuyện sống cùng nhau.",
  },
  {
    value: "food",
    label: "Hôm nay ăn gì",
    description: "Gợi ý bữa ăn, review quán quen và rủ nhau đi ăn.",
  },
  {
    value: "transport",
    label: "Tìm bạn ghép xe",
    description: "Tìm chuyến cùng đường, rủ bạn đi chung và chia sẻ chi phí.",
  },
  {
    value: "campus",
    label: "Chuyện quanh trường",
    description: "Những điều đang diễn ra ở campus của bạn.",
  },
  {
    value: "experience",
    label: "Kinh nghiệm sinh viên",
    description: "Từ ngày đầu nhập học đến cuộc sống tự lập.",
  },
  {
    value: "conversation",
    label: "Tâm sự & trò chuyện",
    description: "Một câu chuyện, một góc nhìn, một người lắng nghe.",
  },
] as const;

export const LIFE_CAMPUSES = [
  "Hòa Lạc",
  "TP. Hồ Chí Minh",
  "Đà Nẵng",
  "Cần Thơ",
  "Quy Nhơn",
] as const;

export function lifeTopicLabel(value?: string) {
  return (
    LIFE_TOPICS.find((topic) => topic.value === value)?.label ||
    "Chuyện sinh viên"
  );
}

export function normalizeLifeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}

export function localReviewDate(date: Date = new Date()) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

export function formatMealPrice(amount: number) {
  return new Intl.NumberFormat("vi-VN").format(amount) + "đ";
}

export function isValidFoodReview(review?: FoodReview) {
  if (
    !review ||
    typeof review.placeName !== "string" ||
    !review.placeName.trim() ||
    review.placeName.length > 100
  )
    return false;
  if (
    !Number.isInteger(review.rating) ||
    review.rating < 1 ||
    review.rating > 5
  )
    return false;
  if (
    !Number.isInteger(review.spentPerPerson) ||
    review.spentPerPerson < 1000 ||
    review.spentPerPerson > 5000000
  )
    return false;
  if ((review.dish?.length || 0) > 100) return false;
  if (review.visitedOn) {
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(review.visitedOn) ||
      review.visitedOn > localReviewDate()
    )
      return false;
    const date = new Date(review.visitedOn + "T12:00:00");
    if (
      Number.isNaN(date.getTime()) ||
      localReviewDate(date) !== review.visitedOn
    )
      return false;
  }
  return true;
}

export function hasHousingExperience(value?: HousingExperience) {
  return Boolean(
    value &&
    (value.monthlyCost !== undefined ||
      value.duration?.trim() ||
      value.highlights?.trim() ||
      value.considerations?.trim()),
  );
}

export function isValidHousingExperience(value?: HousingExperience) {
  if (!value) return true;
  return (
    (value.monthlyCost === undefined ||
      (Number.isInteger(value.monthlyCost) &&
        value.monthlyCost >= 0 &&
        value.monthlyCost <= 100000000)) &&
    [value.duration, value.highlights, value.considerations].every(
      (item) => item === undefined || typeof item === "string",
    ) &&
    (value.duration?.length || 0) <= 80 &&
    (value.highlights?.length || 0) <= 180 &&
    (value.considerations?.length || 0) <= 180
  );
}
