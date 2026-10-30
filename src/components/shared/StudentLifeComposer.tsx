import React, { useEffect, useRef, useState } from "react";
import {
  ImagePlus,
  Paperclip,
  X,
  Send,
  MessageCircle,
  HelpCircle,
  UtensilsCrossed,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { apiClient } from "@/lib/apiClient";
import {
  LIFE_CAMPUSES,
  LIFE_TOPICS,
  isValidFoodReview,
  localReviewDate,
  hasHousingExperience,
  isValidHousingExperience,
} from "@/lib/studentLife";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { useToast } from "@/components/ui/Toast";
import { TagInput } from "./TagInput";
import { FoodReviewFields } from "./FoodReviewFields";
import { HousingExperienceFields } from "./HousingExperienceFields";
import type {
  FoodReview,
  HousingExperience,
  KnowledgePost,
  PostType,
} from "@/types/entities";

export interface ThreadComposerProps {
  defaultSubject?: string;
  defaultTopic?: string;
  defaultCampus?: string;
  defaultType?: PostType;
  post?: KnowledgePost;
  variant?: "inline" | "sheet" | "page";
  onPosted?: (post: KnowledgePost) => void;
  onCancel?: () => void;
  placeholder?: string;
  className?: string;
}
type Draft = {
  type?: PostType;
  title?: string;
  content?: string;
  topic?: string;
  campus?: string;
  location?: string;
  tags?: string[];
  foodReview?: FoodReview;
  housingExperience?: HousingExperience;
  visibility?: "school" | "cross_school";
};
const field =
  "w-full rounded-lg border border-neutral-200 bg-surface px-3 py-2.5 text-sm text-neutral-900 outline-hidden focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15";

export function ThreadComposer({
  defaultTopic = "",
  defaultCampus = "",
  defaultType,
  post,
  variant = "inline",
  onPosted,
  onCancel,
  placeholder,
  className,
}: ThreadComposerProps) {
  const user = useAuthStore((state) => state.user);
  const { toast } = useToast();
  const draftKey = `scs_student_life_draft_v1_${user?.id || "guest"}`;
  const [draft] = useState<Draft>(() => {
    try {
      return JSON.parse(localStorage.getItem(draftKey) || "{}");
    } catch {
      return {};
    }
  });
  const [expanded, setExpanded] = useState(
    variant !== "inline" || Boolean(post),
  );
  const [type, setType] = useState<PostType>(
    post?.type || defaultType || draft.type || "discussion",
  );
  const [foodReview, setFoodReview] = useState<FoodReview>(
    (post ? post.foodReview : draft.foodReview) || {
      placeName: "",
      dish: "",
      spentPerPerson: 0,
      rating: 0,
      visitedOn: localReviewDate(),
    },
  );
  const [housingExperience, setHousingExperience] = useState<HousingExperience>(
    post ? post.housingExperience || {} : draft.housingExperience || {},
  );
  const [title, setTitle] = useState(
    post ? post.title || "" : draft.title || "",
  );
  const [content, setContent] = useState(
    post ? post.contentMd || "" : draft.content || "",
  );
  const [topic, setTopic] = useState(
    type === "review"
      ? "food"
      : post?.lifeTopic || defaultTopic || draft.topic || "",
  );
  const [campus, setCampus] = useState(
    post?.campus || defaultCampus || draft.campus || "Hòa Lạc",
  );
  const [location, setLocation] = useState(
    post ? post.location || "" : draft.location || "",
  );
  const [tags, setTags] = useState<string[]>(post?.tags || draft.tags || []);
  const [visibility, setVisibility] = useState<"school" | "cross_school">(
    post?.visibility || draft.visibility || "school",
  );
  const [images, setImages] = useState<string[]>(post?.images || []);
  const [attachments, setAttachments] = useState<KnowledgePost["attachments"]>(
    post?.attachments || [],
  );
  const [submitting, setSubmitting] = useState(false);
  const imageInput = useRef<HTMLInputElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const titleInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (post || !expanded) return;
    try {
      if (
        content.trim() ||
        title.trim() ||
        (type === "review" && foodReview.placeName.trim()) ||
        (topic === "housing" && hasHousingExperience(housingExperience))
      )
        localStorage.setItem(
          draftKey,
          JSON.stringify({
            type,
            title,
            content,
            topic,
            campus,
            location,
            tags,
            visibility,
            foodReview,
            housingExperience,
          }),
        );
      else localStorage.removeItem(draftKey);
    } catch {
      /* A full browser store should not block posting. */
    }
  }, [
    draftKey,
    expanded,
    post,
    type,
    title,
    content,
    topic,
    campus,
    location,
    tags,
    visibility,
    foodReview,
    housingExperience,
  ]);

  const upload = (files: FileList | null, kind: "image" | "file") => {
    if (!files) return;
    const accepted = Array.from(files);
    if (accepted.some((file) => file.size > 10 * 1024 * 1024)) {
      toast({ variant: "error", title: "Mỗi ảnh hoặc tệp tối đa 10 MB." });
      return;
    }
    if (
      (kind === "image" && images.length + accepted.length > 4) ||
      (kind === "file" && attachments.length + accepted.length > 3)
    ) {
      toast({ variant: "error", title: "Mỗi bài tối đa 4 ảnh và 3 tệp." });
      return;
    }
    if (kind === "image")
      setImages((items) => [
        ...items,
        ...accepted.map((file) => URL.createObjectURL(file)),
      ]);
    else
      setAttachments((items) => [
        ...items,
        ...accepted.map((file) => ({
          name: file.name,
          size: file.size,
          url: URL.createObjectURL(file),
        })),
      ]);
  };
  const valid = Boolean(
    content.trim() &&
    topic &&
    campus &&
    (type !== "question" || title.trim()) &&
    (type !== "review" || isValidFoodReview(foodReview)) &&
    (topic !== "housing" ||
      type === "question" ||
      isValidHousingExperience(housingExperience)),
  );
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!valid || submitting) return;
    setSubmitting(true);
    try {
      const payload = {
        type,
        title:
          title.trim() ||
          (type === "review"
            ? `Ăn thử ở ${foodReview.placeName.trim()}`
            : undefined),
        contentMd: content.trim(),
        lifeTopic: topic,
        campus,
        location: location.trim(),
        foodReview: type === "review" ? foodReview : undefined,
        housingExperience:
          topic === "housing" &&
          type !== "question" &&
          hasHousingExperience(housingExperience)
            ? housingExperience
            : undefined,
        tags,
        visibility,
        images,
        attachments,
      };
      const result = post
        ? await apiClient.put<KnowledgePost>(`/posts/${post.id}`, payload)
        : await apiClient.post<KnowledgePost>("/posts", payload);
      toast({
        variant: result.status === "PendingReview" ? "warning" : "success",
        title:
          result.status === "PendingReview"
            ? "Bài viết đang chờ kiểm duyệt — chỉ bạn nhìn thấy."
            : post
              ? "Đã cập nhật bài viết"
              : "Đã chia sẻ với cộng đồng",
      });
      if (!post) {
        localStorage.removeItem(draftKey);
        setContent("");
        setTitle("");
        setFoodReview({
          placeName: "",
          dish: "",
          spentPerPerson: 0,
          rating: 0,
          visitedOn: localReviewDate(),
        });
        setHousingExperience({});
        setImages([]);
        setAttachments([]);
        setTags([]);
        setExpanded(variant !== "inline");
      }
      onPosted?.(result);
    } catch {
      toast({
        variant: "error",
        title: "Chưa đăng được bài. Nội dung của bạn vẫn được giữ lại.",
      });
    } finally {
      setSubmitting(false);
    }
  };
  if (!expanded)
    return (
      <button
        type="button"
        onClick={() => {
          setExpanded(true);
          setTimeout(() => titleInput.current?.focus(), 30);
        }}
        className={cn(
          "flex w-full items-center gap-3 rounded-xl border border-neutral-200 bg-surface p-4 text-left hover:border-brand-300",
          className,
        )}
      >
        <Avatar
          src={user?.avatarUrl}
          name={user?.fullName || "Sinh viên"}
          size="sm"
        />
        <span className="flex-1 text-sm text-neutral-400">
          {placeholder || "Có chuyện gì quanh trường? Kể mọi người nghe…"}
        </span>
        <ImagePlus size={19} className="text-brand-500" />
      </button>
    );

  return (
    <form
      onSubmit={submit}
      className={cn(
        "space-y-4",
        variant === "inline" &&
          "rounded-xl border border-neutral-200 bg-surface p-4",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <Avatar
          src={user?.avatarUrl}
          name={user?.fullName || "Sinh viên"}
          size="sm"
        />
        <div>
          <p className="text-sm font-semibold text-neutral-900">
            {user?.fullName || "Sinh viên SCS"}
          </p>
          <p className="text-xs text-neutral-500">
            Chia sẻ từ trải nghiệm của bạn
          </p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[
          {
            value: "discussion",
            label: "Chia sẻ",
            description: "Kể một chuyện, chia sẻ trải nghiệm",
            icon: MessageCircle,
          },
          {
            value: "question",
            label: "Hỏi kinh nghiệm",
            description: "Nhờ bạn bè góp ý, hỗ trợ",
            icon: HelpCircle,
          },
          {
            value: "review",
            label: "Review quán",
            description: "Kể bữa ăn, chấm điểm của bạn",
            icon: UtensilsCrossed,
          },
        ].map((item) => (
          <button
            type="button"
            key={item.value}
            onClick={() => {
              setType(item.value as PostType);
              if (item.value === "review") setTopic("food");
            }}
            aria-pressed={
              item.value === type ||
              (item.value === "discussion" &&
                !["question", "review"].includes(type))
            }
            className={`rounded-xl border p-3 text-left ${item.value === type || (item.value === "discussion" && !["question", "review"].includes(type)) ? "border-brand-300 bg-brand-50/60" : "border-neutral-200"}`}
          >
            <span className="flex items-center gap-2 text-sm font-semibold">
              <item.icon size={16} />
              {item.label}
            </span>
            <span className="mt-1 hidden text-[11px] text-neutral-500 sm:block">
              {item.description}
            </span>
          </button>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1.5 text-xs font-medium text-neutral-600">
          <span>
            Chủ đề <span className="text-brand-600">*</span>
          </span>
          <select
            required
            value={topic}
            disabled={type === "review"}
            onChange={(e) => setTopic(e.target.value)}
            className={field}
          >
            <option value="">Chọn chủ đề phù hợp</option>
            {LIFE_TOPICS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1.5 text-xs font-medium text-neutral-600">
          <span>Campus liên quan</span>
          <select
            value={campus}
            onChange={(e) => setCampus(e.target.value)}
            className={field}
          >
            {LIFE_CAMPUSES.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
      </div>
      {type === "review" && (
        <FoodReviewFields value={foodReview} onChange={setFoodReview} />
      )}
      {topic === "housing" && type !== "question" && (
        <HousingExperienceFields
          value={housingExperience}
          onChange={setHousingExperience}
        />
      )}
      <label className="block space-y-1.5 text-xs font-medium text-neutral-600">
        <span>
          {type === "question"
            ? "Bạn đang muốn hỏi điều gì? *"
            : "Tiêu đề (không bắt buộc)"}
        </span>
        <input
          ref={titleInput}
          required={type === "question"}
          value={title}
          maxLength={140}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={
            topic === "transport"
              ? "Ví dụ: Mai có ai từ Mỹ Đình lên Hòa Lạc ca 1 không?"
              : type === "question"
                ? "Viết ngắn gọn điều bạn muốn hỏi mọi người…"
                : "Một điều bạn muốn chia sẻ hôm nay…"
          }
          className={field}
        />
      </label>
      <label className="block space-y-1.5 text-xs font-medium text-neutral-600">
        <span>
          Nội dung <span className="text-brand-600">*</span>
        </span>
        <textarea
          required
          value={content}
          maxLength={3000}
          onChange={(e) => setContent(e.target.value)}
          placeholder={
            topic === "transport"
              ? "Bạn cần ghép chuyến hay còn chỗ trống? Ghi tuyến đi, giờ xuất phát, điểm hẹn và cách chia chi phí nhé…"
              : type === "question"
                ? "Kể tình huống của bạn, rồi hỏi điều bạn đang cần mọi người góp ý…"
                : type === "review"
                  ? "Bạn gọi gì, thấy ổn chỗ nào, có điểm nào chưa ưng? Kể như đang rủ bạn đi ăn nhé…"
                  : topic === "housing"
                    ? "Bạn đã ở thế nào, chi phí ra sao, có điều gì muốn nhắn bạn sắp chuyển trọ? Kể trải nghiệm của riêng bạn nhé…"
                    : topic === "food"
                      ? "Hôm nay bạn ăn gì, hết bao nhiêu? Kể món bạn thích hoặc hỏi mọi người một gợi ý nhé…"
                      : "Hôm nay có chuyện gì? Kể mọi người nghe…"
          }
          rows={5}
          className={`${field} resize-y leading-relaxed`}
        />
        <span className="block text-right text-[11px] font-normal text-neutral-400">
          {content.length}/3000
        </span>
      </label>
      <label className="block space-y-1.5 text-xs font-medium text-neutral-600">
        <span>Khu vực / địa điểm (không bắt buộc)</span>
        <input
          value={location}
          maxLength={80}
          onChange={(e) => setLocation(e.target.value)}
          placeholder={
            topic === "transport"
              ? "Ví dụ: Mỹ Đình → campus Hòa Lạc"
              : topic === "housing"
                ? "Ví dụ: Khu gần campus, ký túc xá…"
                : "Ví dụ: Ký túc xá, khu Cổng trường…"
          }
          className={field}
        />
      </label>
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((image, index) => (
            <div
              key={image}
              className="relative h-24 w-24 overflow-hidden rounded-lg"
            >
              <img
                src={image}
                alt={`Ảnh đính kèm ${index + 1}`}
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                aria-label={`Xóa ảnh ${index + 1}`}
                onClick={() =>
                  setImages((items) => items.filter((_, i) => i !== index))
                }
                className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white"
              >
                <X size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
      {attachments.length > 0 && (
        <div className="space-y-1">
          {attachments.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="flex items-center justify-between gap-2 rounded-lg bg-neutral-50 p-2 text-xs"
            >
              <span className="truncate">{file.name}</span>
              <button
                type="button"
                aria-label={`Xóa tệp ${file.name}`}
                onClick={() =>
                  setAttachments((items) => items.filter((_, i) => i !== index))
                }
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
      <TagInput
        value={tags}
        onChange={(items) => setTags(items.slice(0, 3))}
        max={3}
        placeholder="Thêm thẻ để dễ tìm lại (tối đa 3)…"
      />
      <label className="flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-500">
        <span>Ai có thể xem bài?</span>
        <select
          value={visibility}
          onChange={(e) =>
            setVisibility(e.target.value as "school" | "cross_school")
          }
          className={`${field} w-auto py-2 text-xs`}
        >
          <option value="school">Sinh viên cùng trường</option>
          <option value="cross_school">Cộng đồng liên trường</option>
        </select>
      </label>
      <p className="text-[11px] leading-relaxed text-neutral-400">
        Chia sẻ thông tin cá nhân và địa chỉ riêng tư của người khác cần có sự
        đồng ý.
      </p>
      <input
        ref={imageInput}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          upload(e.target.files, "image");
          e.target.value = "";
        }}
      />
      <input
        ref={fileInput}
        type="file"
        accept=".pdf,.docx,.pptx,.txt"
        multiple
        className="hidden"
        onChange={(e) => {
          upload(e.target.files, "file");
          e.target.value = "";
        }}
      />
      <div
        className={cn(
          "sticky -mx-1 flex items-center justify-between gap-2 border-t border-neutral-100 bg-surface/95 px-1 pb-1 pt-3 backdrop-blur-sm",
          variant === "page"
            ? "bottom-16 z-[41] flex-wrap pb-3 md:bottom-0"
            : "bottom-0 z-10",
        )}
      >
        <div className="flex gap-1">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => imageInput.current?.click()}
            leftIcon={<ImagePlus size={16} />}
          >
            Ảnh
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => fileInput.current?.click()}
            leftIcon={<Paperclip size={15} />}
          >
            Tệp
          </Button>
        </div>
        <div
          className={cn(
            "flex gap-1",
            variant === "page" && "max-sm:w-full max-sm:justify-between",
          )}
        >
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => {
              if (variant === "inline") setExpanded(false);
              onCancel?.();
            }}
            disabled={submitting}
          >
            {variant === "page"
              ? post
                ? "Hủy chỉnh sửa"
                : "Lưu nháp & quay lại"
              : "Để sau"}
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={!valid || submitting}
            loading={submitting}
            rightIcon={<Send size={14} />}
          >
            {post ? "Lưu thay đổi" : "Đăng bài"}
          </Button>
        </div>
      </div>
    </form>
  );
}
export default ThreadComposer;
