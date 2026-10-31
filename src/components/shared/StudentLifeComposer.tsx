import { LifePostReminderFields } from './LifePostReminderFields';
import { currentLifeDate } from '@/lib/studentLifeDetails';
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ImagePlus,
  Paperclip,
  X,
  Send,
  House,
  CarFront,
  Package,
  Lightbulb,
  MessagesSquare,
  UtensilsCrossed,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { apiClient } from "@/lib/apiClient";
import {
  LIFE_TOPICS,
  localReviewDate,
} from "@/lib/studentLife";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { useToast } from "@/components/ui/Toast";
import { TagInput } from "./TagInput";
import { FoodReviewFields } from "./FoodReviewFields";
import { HousingExperienceFields } from "./HousingExperienceFields";
import { HousingPostFields, StudentExperienceFields, RidePostFields, PassPostFields } from "./TopicPostFields";
import { HOUSING_KINDS } from "@/lib/studentLifeDetails";
import { hasLifeDraftContent, initialLifeForm, lifeFormErrors, lifePostPayload, normalizeHousingForm, readLifeDraft, type LifeComposerState } from "@/lib/studentLifeForm";
import { CAMPUS_OPTIONS } from "@/lib/campuses";
import { CampusAreaSelect } from "./CampusAreaSelect";
import type {
  FoodReview,
  HousingExperience,
  KnowledgePost,
  PostType,
  HousingPost,
  StudentExperience,
  RidePost,
  PassPost,
} from "@/types/entities";

export interface ThreadComposerProps {
  defaultSubject?: string;
  defaultTopic?: string;
  defaultCampus?: string;
  defaultArea?: string;
  defaultType?: PostType;
  post?: KnowledgePost;
  variant?: "inline" | "sheet" | "page";
  onPosted?: (post: KnowledgePost) => void;
  onCancel?: () => void;
  placeholder?: string;
  className?: string;
}
const field =
  "w-full rounded-lg border border-neutral-200 bg-surface px-3 py-2.5 text-sm text-neutral-900 outline-hidden focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15";
const topicIcons = {
  housing: House,
  food: UtensilsCrossed,
  transport: CarFront,
  marketplace: Package,
  experience: Lightbulb,
  conversation: MessagesSquare,
};

export function ThreadComposer({
  defaultTopic = "",
  defaultCampus = "",
  defaultArea = "",
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
  const [initial] = useState(() => {
    let raw: string | null = null;
    try { raw = localStorage.getItem(draftKey); } catch { /* Posting works without browser storage. */ }
    return initialLifeForm({ post, draft: readLifeDraft(raw), defaultTopic, defaultCampus, defaultArea, defaultType });
  });
  const [expanded, setExpanded] = useState(variant !== "inline" || Boolean(post));
  const [type, setType] = useState<PostType>(initial.type);
  const [foodReview, setFoodReview] = useState<FoodReview>(initial.foodReview);
  const [housingExperience, setHousingExperience] = useState<HousingExperience>(initial.housingExperience);
  const [housingPost, setHousingPost] = useState<HousingPost>(initial.housingPost);
  const [studentExperience, setStudentExperience] = useState<StudentExperience>(initial.studentExperience);
  const [ridePost, setRidePost] = useState<RidePost>(initial.ridePost);
  const [expectedOn, setExpectedOn] = useState(initial.expectedOn);
  const [remindOnExpectedDate, setRemindOnExpectedDate] = useState(initial.remindOnExpectedDate);
  const [passPost, setPassPost] = useState<Partial<PassPost>>(initial.passPost);
  const [title, setTitle] = useState(initial.title);
  const [content, setContent] = useState(initial.content);
  const [topic, setTopic] = useState(initial.topic);
  const [campus, setCampus] = useState(initial.campus);
  const [area, setArea] = useState(initial.area);
  const [location, setLocation] = useState(initial.location);
  const [tags, setTags] = useState(initial.tags);
  const [visibility, setVisibility] = useState(initial.visibility);
  const [images, setImages] = useState(initial.images);
  const [attachments, setAttachments] = useState(initial.attachments);
  const [submitting, setSubmitting] = useState(false);
  const imageInput = useRef<HTMLInputElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const titleInput = useRef<HTMLInputElement>(null);

  const draftCleared = useRef(false);
  const formState = useMemo<LifeComposerState>(() => ({
    originalExpectedAt: initial.originalExpectedAt, expectedOn, remindOnExpectedDate, type, foodReview, housingExperience, housingPost, studentExperience, ridePost, passPost,
    title, content, topic, campus, area, location, tags, visibility, images, attachments,
  }), [expectedOn, remindOnExpectedDate, type, foodReview, housingExperience, housingPost, studentExperience, ridePost, passPost, title, content, topic, campus, area, location, tags, visibility, images, attachments]);
  const payload = lifePostPayload(formState);
  const effectiveType = payload.type;
  const errors = lifeFormErrors(formState);

  useEffect(() => {
    if (post || !expanded || draftCleared.current) return;
    try {
      if (hasLifeDraftContent(formState))
        localStorage.setItem(
          draftKey,
          JSON.stringify({
            ...formState,
            images: undefined,
            attachments: undefined,
            housingPost: { ...formState.housingPost, area: formState.area || undefined },
          }),
        );
      else if (readLifeDraft(localStorage.getItem(draftKey)).topic === formState.topic) localStorage.removeItem(draftKey);
    } catch {
      /* A full browser store should not block posting. */
    }
  }, [draftKey, expanded, post, formState]);
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
  const valid = errors.length === 0;
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!valid || submitting || !event.currentTarget.reportValidity()) return;
    setSubmitting(true);
    try {
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
        draftCleared.current = true;
        try { localStorage.removeItem(draftKey); } catch { /* Save already succeeded. */ }
        setContent("");
        setExpectedOn(currentLifeDate(topic === "housing" ? 30 : 14));
        setRemindOnExpectedDate(true);
        setTitle("");
        setFoodReview({
          placeName: "",
          dish: "",
          spentPerPerson: 0,
          visitedOn: localReviewDate(),
        });
        setHousingExperience({});
        setPassPost({ itemName: "", closed: false });
        setHousingPost(normalizeHousingForm());
        setStudentExperience({ category: "ojt", intent: "sharing" });
        setRidePost({ kind: "seeking", origin: "", destination: "", departure: "" });
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
          draftCleared.current = false;
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
      onChangeCapture={() => { draftCleared.current = false; }}
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
      <fieldset className="space-y-2">
        <legend className="text-xs font-semibold text-neutral-700">
          Bạn muốn đăng gì? <span className="text-brand-600">*</span>
        </legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {LIFE_TOPICS.map((item) => {
            const selected = item.value === topic;
            const Icon = topicIcons[item.value];
            return (
              <button
                type="button"
                key={item.value}
                onClick={() => {
                  if (item.value === topic) return;
                  draftCleared.current = false;
                  setTopic(item.value);
                  setExpectedOn(currentLifeDate(item.value === "housing" ? 30 : 14));
                  setType(item.value === "food" ? "review"
                    : item.value === "housing" ? housingPost.kind === "experience" ? "experience" : "discussion"
                    : item.value === "experience" ? studentExperience.intent === "sharing" ? "experience" : "question"
                    : "discussion");
                }}
                aria-pressed={selected}
                className={`rounded-xl border p-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-brand-500 ${selected ? "border-brand-300 bg-brand-50/60" : "border-neutral-200 hover:border-neutral-300"}`}
              >
                <span className="flex items-center gap-2 text-sm font-semibold">
                  <Icon size={16} className="shrink-0" />
                  {item.label}
                </span>
                <span className="mt-1 hidden text-[11px] text-neutral-500 sm:block">
                  {item.description}
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>
      <div className={`grid gap-3 ${topic === "experience" || topic === "transport" || topic === "marketplace" ? "sm:grid-cols-2" : "sm:grid-cols-3"}`}>
        {topic === "housing" ? (
          <select aria-label="Nhu cầu về chỗ ở" value={housingPost.kind === "experience" && effectiveType === "question" ? "question" : housingPost.kind} className={field} onChange={(event) => {
            const selected = event.target.value;
            const kind = selected === "question" ? "experience" : selected as HousingPost["kind"];
            setHousingPost((current) => normalizeHousingForm({ ...current, kind }));
            setType(selected === "question" ? "question" : kind === "experience" ? "experience" : "discussion");
          }}>
            {HOUSING_KINDS.map((kind) => <option key={kind.value} value={kind.value}>{kind.label}</option>)}
            <option value="question">Hỏi kinh nghiệm ở trọ</option>
          </select>
        ) : topic !== "experience" && topic !== "transport" && topic !== "marketplace" && (
          <select aria-label="Hình thức bài viết" value={effectiveType} onChange={(event) => setType(event.target.value as PostType)} className={field}>
            <option value="discussion">Chia sẻ</option>
            <option value="question">Đặt câu hỏi</option>
            {topic === "food" && <option value="review">Review quán</option>}
          </select>
        )}
        <div>
          <select
            required
            aria-label="Campus liên quan"
            value={campus}
            onChange={(e) => {
              setCampus(e.target.value);
              setArea("");
              setLocation("");
              setFoodReview((review) => ({ ...review, coordinates: undefined }));
            }}
            className={field}
          >
            <option value="">Chọn cơ sở</option>
            {CAMPUS_OPTIONS.filter((item) => item.value !== "all").map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </select>
        </div>
        <CampusAreaSelect
          campus={campus}
          value={area}
          onChange={(value, selectedCampus) => {
            if (value) setCampus(selectedCampus);
            setArea(value);
            setLocation("");
            setFoodReview((review) => ({ ...review, coordinates: undefined }));
          }}
          required={topic === "housing" && housingPost.kind !== "experience"}
        />
      </div>
      {topic === "housing" && housingPost.kind !== "experience" && <HousingPostFields value={housingPost} onChange={(value) => setHousingPost(normalizeHousingForm(value))} />}
      {topic === "experience" && <StudentExperienceFields value={studentExperience} onChange={(value) => { setStudentExperience(value); setType(value.intent === "sharing" ? "discussion" : "question"); }} />}
      {topic === "transport" && <RidePostFields value={ridePost} onChange={setRidePost} />}
      {topic === "marketplace" && <PassPostFields value={passPost} onChange={setPassPost} />}
      <LifePostReminderFields post={payload} expectedOn={expectedOn} onExpectedOn={setExpectedOn} reminder={remindOnExpectedDate} onReminder={setRemindOnExpectedDate} />
      {payload.foodReview && (
        <FoodReviewFields key={`${campus}-${area}`} value={foodReview} onChange={setFoodReview} />
      )}
      {topic === "housing" && housingPost.kind === "experience" && effectiveType !== "question" && (
        <HousingExperienceFields
          value={housingExperience}
          onChange={setHousingExperience}
        />
      )}
      {topic !== "marketplace" && <label className="block space-y-1.5 text-xs font-medium text-neutral-600">
        <span>
          {effectiveType === "question"
            ? "Bạn đang muốn hỏi điều gì? *"
            : "Tiêu đề (không bắt buộc)"}
        </span>
        <input
          ref={titleInput}
          required={effectiveType === "question"}
          value={title}
          maxLength={140}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={
            topic === "housing" && housingPost.kind !== "experience"
              ? `Ví dụ: ${HOUSING_KINDS.find((item) => item.value === housingPost.kind)?.label} tại ${area || "khu vực gần trường"}`
              : topic === "experience" && studentExperience.intent === "request_materials"
                ? "Ví dụ: Xin tài liệu ôn tập môn PRJ301"
              : topic === "experience" && studentExperience.category === "ojt"
                ? "Ví dụ: Kinh nghiệm chuẩn bị hồ sơ OJT"
              : topic === "experience" && studentExperience.category === "graduation"
                ? "Ví dụ: Cần góp ý cách chuẩn bị bảo vệ đồ án tốt nghiệp"
              : topic === "transport"
              ? ridePost.kind === "offering" ? "Ví dụ: Chuyến về cuối tuần còn 2 chỗ" : "Ví dụ: Cần ghép chuyến đến trường vào sáng mai"
              : effectiveType === "question"
                ? "Viết ngắn gọn điều bạn muốn hỏi mọi người…"
                : "Một điều bạn muốn chia sẻ hôm nay…"
          }
          className={field}
        />
        <span className="block text-right text-[11px] font-normal text-neutral-400">
          {title.length}/140
        </span>
      </label>}
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
            topic === "marketplace" ? "Mô tả thời gian đã dùng, lỗi nếu có, phụ kiện đi kèm, lý do pass và cách hẹn nhận đồ…"
              : topic === "housing" && housingPost.kind !== "experience"
              ? housingPost.kind === "seeking" ? "Mô tả phòng mong muốn, số người, cách liên hệ và yêu cầu thêm…" : housingPost.kind === "roommate" ? "Mô tả phòng, bạn cùng phòng mong muốn, chi phí chia sẻ và cách liên hệ…" : housingPost.kind === "transfer" ? "Nêu lý do nhượng, tình trạng phòng, hợp đồng, đồ để lại và cách liên hệ…" : "Mô tả diện tích, nội thất, hợp đồng, điều kiện thuê và cách liên hệ…"
              : topic === "experience" && studentExperience.intent === "request_materials"
                ? "Bạn cần tài liệu gì, cho môn nào, đang học phần nào? Nêu rõ để mọi người hỗ trợ đúng nhé…"
              : topic === "experience" && studentExperience.category === "ojt"
                ? "Chia sẻ hoặc hỏi về chuẩn bị OJT, ứng tuyển, công việc và báo cáo OJT…"
              : topic === "experience" && studentExperience.category === "graduation"
                ? "Bạn đang ở giai đoạn nào của đồ án tốt nghiệp? Nêu vấn đề, cách đã thử và điều cần góp ý…"
              : topic === "transport"
              ? "Bạn cần ghép chuyến hay còn chỗ trống? Ghi tuyến đi, giờ xuất phát, điểm hẹn và cách chia chi phí nhé…"
              : effectiveType === "question"
                ? "Kể tình huống của bạn, rồi hỏi điều bạn đang cần mọi người góp ý…"
                : effectiveType === "review"
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
      {topic !== "transport" && <label className="block space-y-1.5 text-xs font-medium text-neutral-600">
        <span>{topic === "marketplace" ? "Điểm hẹn nhận đồ (không bắt buộc)" : "Địa chỉ cụ thể (không bắt buộc)"}</span>
        <input
          value={location}
          maxLength={80}
          onChange={(e) => setLocation(e.target.value)}
          placeholder={
            topic === "marketplace" ? "Ví dụ: Sảnh ký túc xá, cổng trường…" : topic === "housing"
                ? "Ví dụ: Khu gần campus, ký túc xá…"
                : "Ví dụ: Ký túc xá, khu Cổng trường…"
          }
          className={field}
        />
      </label>}
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
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-neutral-600">
          Thẻ (không bắt buộc)
        </p>
        <TagInput
          value={tags}
          onChange={(items) => setTags(items.slice(0, 3))}
          max={3}
          placeholder="Thêm thẻ để dễ tìm lại (tối đa 3)…"
        />
      </div>
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
      {!valid && <p role="status" className="text-xs leading-relaxed text-neutral-500">{errors[0]}</p>}
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
