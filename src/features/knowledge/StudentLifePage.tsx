import { LIFE_OWNER_STATUSES } from '@/lib/lifePostLifecycle';
import React, { useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { apiClient } from "@/lib/apiClient";
import { LIFE_TOPICS } from "@/lib/studentLife";
import { CAMPUS_OPTIONS } from "@/lib/campuses";
import { useAuthStore } from "@/store/authStore";
import { useViewer } from "@/lib/viewer";
import { useGuardedAction } from "@/lib/guestGate";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { PostCreateEntry } from "@/components/shared/PostCreateEntry";
import { lifePostCreateHref } from "@/lib/studentLifeNavigation";
import { FeedFilterSelect } from "@/components/shared/FeedFilterSelect";
import { TopicNavigation } from "@/components/shared/TopicNavigation";
import { ThreadFeed } from "@/components/shared/ThreadFeed";
import { useToast } from "@/components/ui/Toast";
import { TopicFeedFilters } from "@/components/shared/TopicFeedFilters";
import { distanceKm, TOPIC_FILTER_KEYS } from "@/lib/studentLifeDetails";
import { useCurrentLocation } from "@/lib/useCurrentLocation";
import { CampusAreaSelect } from "@/components/shared/CampusAreaSelect";
import { LifeSearchWatch } from "@/components/shared/LifeSearchWatch";
import { isCampusArea } from "@/lib/campusAreas";
import type { KnowledgePost } from "@/types/entities";

const control =
  "min-w-0 rounded-lg border border-neutral-200 bg-surface px-3 py-2 text-sm text-neutral-700 outline-hidden focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15";

export default function StudentLifePage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const returnTo = "/knowledge" + (params.size ? "?" + params.toString() : "");
  const user = useAuthStore((state) => state.user);
  const canBrowse = useViewer().can("knowledge.browse");
  const guard = useGuardedAction();
  const client = useQueryClient();
  const { toast } = useToast();
  const [topicsOpen, setTopicsOpen] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const position = useCurrentLocation();
  const [radius, setRadius] = useState("3");
  const tab = params.get("tab") || "discover";
  const topic = params.get("topic") === "campus" ? "conversation" : params.get("topic") || "";
  const campus = params.get("campus") || "";
  const type = params.get("type") || "";
  const sort = params.get("sort") || "new";
  const maxPrice = params.get("maxPrice") || "";
  const search = params.get("q") || "";
  const status = LIFE_OWNER_STATUSES.some(([value]) => value === params.get("status")) ? params.get("status")! : "Published";
  const searchId = params.get("searchId") || "";
  const topicFilters = Object.fromEntries([...TOPIC_FILTER_KEYS, ...(topic === "housing" && params.get("maxRent") && ["room", "person"].includes(params.get("priceUnit") || "") ? ["priceUnit"] : [])].filter((key) => params.get(key) && (key !== "area" || isCampusArea(campus, params.get(key)))).map((key) => [key, params.get(key)!]));
  const topicFilterQuery = new URLSearchParams(topicFilters).toString();
  const activeAdvancedCount =
    Number(Boolean(campus)) +
    Number(sort !== "new") +
    Number(Boolean(maxPrice)) +
    Object.keys(topicFilters).length +
    Number(topic === "food" && Boolean(position.coordinates));
  const setFilter = (key: string, value: string, selectedCampus?: string) => {
    const next = new URLSearchParams(params);
    next.delete("searchId");
    if (key === "sort" || key === "topic") next.delete("unanswered");
    if (value) next.set(key, value);
    else next.delete(key);
    if (key === "campus") next.delete("area");
    if (key === "area" && value && isCampusArea(selectedCampus || campus, value)) next.set("campus", selectedCampus || campus);
    if (key === "type" && value === "review") next.set("topic", "food");
    if (key === "type" && value !== "review") next.delete("maxPrice");
    if (key === "topic") {
      next.delete("type");
      if (value !== "food") next.delete("maxPrice");
      TOPIC_FILTER_KEYS.forEach((filter) => next.delete(filter));
      position.clear();
      if ((["food", "marketplace"].includes(value) && sort === "unanswered") || (!["food", "marketplace"].includes(value) && ["price_low", "price_high"].includes(sort))) next.delete("sort");
    }
    if (key === "topic" || key === "maxRent" && !value) next.delete("priceUnit");
    next.delete("moveBy");
    next.delete("minRating");
    if (key === "housingKind" && value === "experience") ["maxRent", "people", "moveMonth", "amenity", "onlyOpen"].forEach((filter) => next.delete(filter));
    if (key === "experienceCategory" && value !== "materials") next.delete("courseCode");
    setParams(next, { replace: key === "q" });
  };
  const resetFilters = () => {
    const next = new URLSearchParams(params);
    ["topic", "campus", "type", "sort", "maxPrice", "q", "priceUnit", "moveBy", "minRating", "searchId", "unanswered", ...TOPIC_FILTER_KEYS].forEach((key) =>
      next.delete(key),
    );
    setParams(next);
    position.clear();
    setShowAdvancedFilters(false);
  };
  const compose = guard("auth", () =>
    navigate(
      lifePostCreateHref({
        topic,
        campus,
        area: topicFilters.area,
        type:
          type === "review"
            ? "review"
            : type === "question"
              ? "question"
              : undefined,
        returnTo,
      }),
    ),
  );
  const followedQuery = useQuery<string[]>({
    queryKey: ["life-topics", user?.id],
    queryFn: () => apiClient.get("/community/topics/following"),
    enabled: canBrowse,
  });
  const followed = followedQuery.data || [];
  const postsQuery = useQuery<KnowledgePost[]>({
    queryKey: [
      "knowledge",
      "posts",
      user?.id,
      canBrowse,
      tab,
      topic,
      campus,
      type,
      sort,
      search,
      status,
      maxPrice,
      topicFilterQuery,
      searchId,
      params.get("unanswered"),
    ],
    refetchInterval: tab === "mine" ? 30000 : false,
    queryFn: () =>
      apiClient.get(canBrowse ? "/posts" : "/public/posts/preview", {
        params: { tab, topic, campus, type, sort, q: search, status, maxPrice, searchId: searchId || undefined, unanswered: params.get("unanswered") || undefined, ...topicFilters },
      }),
  });
  const followMutation = useMutation({
    mutationFn: ({
      value,
      following,
    }: {
      value: string;
      following: boolean;
    }) =>
      following
        ? apiClient.delete(`/community/topics/${value}/follow`)
        : apiClient.post(`/community/topics/${value}/follow`),
    onSuccess: () =>
      Promise.all([
        client.invalidateQueries({ queryKey: ["life-topics"] }),
        client.invalidateQueries({ queryKey: ["knowledge"] }),
        client.invalidateQueries({ queryKey: ["feed"] }),
      ]),
    onError: () =>
      toast({
        variant: "error",
        title: "Chưa cập nhật được chủ đề, bạn thử lại nhé.",
      }),
  });
  const sourcePosts = Array.isArray(postsQuery.data) ? postsQuery.data : [];
  const point = topic === "food" ? position.coordinates : null;
  const posts = point ? sourcePosts
    .filter((post) => post.foodReview?.coordinates && distanceKm(point, post.foodReview.coordinates) <= Number(radius))
    .map((post) => ({ ...post, distanceKm: distanceKm(point, post.foodReview!.coordinates!) }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    : sourcePosts;
  if (params.get("compose") === "1")
    return (
      <Navigate
        to={lifePostCreateHref({
          topic,
          campus,
          area: topicFilters.area,
          type:
            type === "review"
              ? "review"
              : type === "question"
                ? "question"
                : undefined,
          returnTo,
        })}
        replace
      />
    );

  return (
    <div className="mx-auto max-w-[960px] space-y-6 pb-8">
      <header className="flex min-w-0 items-center justify-between gap-4 border-b border-neutral-200">
        <h1 className="max-w-[120px] shrink-0 text-lg font-semibold leading-tight tracking-tight text-neutral-900 sm:max-w-none sm:text-2xl lg:text-3xl">
          Đời sống sinh viên
        </h1>
        <nav
          aria-label="Bảng tin đời sống"
          className="ml-auto flex min-w-0 items-center gap-3 overflow-x-auto sm:gap-5"
        >
          {[
            ["discover", "Bảng tin"],
            ["following", "Đang theo dõi"],
            ["saved", "Đã lưu"],
            ["mine", "Bài của tôi"],
          ].map(([value, label]) => (
            <button
              key={value}
              onClick={() =>
                value === "discover" || canBrowse
                  ? setFilter("tab", value)
                  : guard("auth", () => {})()
              }
              aria-current={tab === value ? "page" : undefined}
              className={`shrink-0 whitespace-nowrap border-b-2 py-3 text-xs font-medium sm:text-sm transition-colors ${tab === value ? "border-brand-600 text-brand-700" : "border-transparent text-neutral-500 hover:text-neutral-900"}`}
            >
              {label}
            </button>
          ))}
        </nav>
      </header>
      <section aria-label="Danh sách bài viết" className="min-w-0 space-y-4">
        <PostCreateEntry
          topic={topic}
          campus={campus}
          area={topicFilters.area}
          type={
            type === "review"
              ? "review"
              : type === "question"
                ? "question"
                : undefined
          }
        />
        {canBrowse && (
          <>
            <TopicNavigation
              value={topic}
              onChange={(value) => setFilter("topic", value)}
            />
            <div className="flex flex-col gap-2 sm:flex-row">
              <label className="relative min-w-[180px] flex-1 basis-full sm:basis-auto">
                <Search
                  size={16}
                  className="absolute left-3 top-2.5 text-neutral-400"
                />
                <span className="sr-only">Tìm bài viết đời sống</span>
                <input
                  value={search}
                  onChange={(e) => setFilter("q", e.target.value)}
                  placeholder="Tìm chuyện bạn quan tâm…"
                  className={`${control} w-full pl-9`}
                />
              </label>
              <div className="flex flex-wrap items-stretch gap-2 sm:flex-nowrap">
                <button
                  type="button"
                  aria-expanded={showAdvancedFilters}
                  aria-controls="life-advanced-filters"
                  onClick={() => setShowAdvancedFilters((open) => !open)}
                  className={`inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition-colors ${showAdvancedFilters ? "border-brand-600 bg-brand-600 text-white" : "border-neutral-200 bg-surface text-neutral-700 hover:border-neutral-300"}`}
                >
                  <SlidersHorizontal size={15} />
                  <span className="whitespace-nowrap">Bộ lọc nâng cao</span>
                  {activeAdvancedCount > 0 && (
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${showAdvancedFilters ? "bg-brand-700 text-white" : "bg-brand-100 text-brand-800"}`}>
                      {activeAdvancedCount}
                    </span>
                  )}
                  {showAdvancedFilters ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                {(search || topic || type || activeAdvancedCount > 0) && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    title="Đặt lại bộ lọc"
                    className="inline-flex min-h-10 items-center justify-center rounded-lg px-3 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-800"
                  >
                    <RotateCcw size={14} />
                    <span className="sr-only">Đặt lại bộ lọc</span>
                  </button>
                )}
              </div>
            </div>
            {showAdvancedFilters && (
              <div
                id="life-advanced-filters"
                className="animate-in rounded-xl border border-neutral-200 bg-neutral-50/70 p-3 shadow-xs fade-in-50 duration-200 sm:p-4"
              >
                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="min-w-0">
                    <FeedFilterSelect
                      fitContent
                      aria-label="Lọc campus"
                      value={campus}
                      onChange={(e) => setFilter("campus", e.target.value)}
                    >
                      {CAMPUS_OPTIONS.map((item) => (
                        <option
                          key={item.value}
                          value={item.value === "all" ? "" : item.value}
                        >
                          {item.label}
                        </option>
                      ))}
                    </FeedFilterSelect>
                  </div>
                  <CampusAreaSelect
                    fitContent
                    campus={campus}
                    value={topicFilters.area || ""}
                    onChange={(value, selectedCampus) => setFilter("area", value, selectedCampus)}
                  />
                  <div className="min-w-0">
                    <FeedFilterSelect
                      fitContent
                      aria-label="Sắp xếp bài viết"
                      value={point ? "nearby" : sort}
                      disabled={Boolean(point)}
                      onChange={(e) => setFilter("sort", e.target.value)}
                    >
                      {point && <option value="nearby">Gần nhất</option>}
                      <option value="new">Mới nhất</option>
                      <option value="hot">{topic === "food" ? "Quán được yêu thích" : "Nhiều lượt thích"}</option>
                      <option value="discussed">{topic === "food" ? "Quán được bàn luận" : "Nhiều bình luận"}</option>
                      {topic === "food" || topic === "marketplace" ? <>
                        <option value="price_low">Giá thấp đến cao</option>
                        <option value="price_high">Giá cao đến thấp</option>
                      </> : <option value="unanswered">Câu hỏi chưa có lời giải</option>}
                    </FeedFilterSelect>
                  </div>

                </div>
                <TopicFeedFilters
                  topic={topic} params={params} onChange={setFilter}
                  nearby={Boolean(point)} radius={radius} onRadius={setRadius}
                  onLocate={() => position.request(() => setParams((current) => {
                    const next = new URLSearchParams(current);
                    next.delete("type");
                    next.delete("sort");
                    return next;
                  }, { replace: true }))} onClearLocation={position.clear}
                  locating={position.loading} locationError={position.error}
                />
              </div>
            )}
            <LifeSearchWatch key={user?.id} params={params} nearby={Boolean(point)} onEditFilters={() => setShowAdvancedFilters(true)} onApply={(filters, id) => {
              const next = new URLSearchParams({ ...filters, tab: "discover", sort: "new" });
              if (id) next.set("searchId", id);
              setParams(next); position.clear(); setShowAdvancedFilters(true);
            }} />
          </>
        )}
        {canBrowse && tab === "following" && (
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <p className="text-neutral-500">
              Bài viết từ các chủ đề bạn theo dõi
            </p>
            <button
              type="button"
              onClick={() => setTopicsOpen(true)}
              className="font-semibold text-brand-600 hover:text-brand-700"
            >
              Chỉnh sửa chủ đề
            </button>
          </div>
        )}
        {tab === "mine" && canBrowse && (
          <div className="flex flex-wrap gap-2 text-xs">
            {LIFE_OWNER_STATUSES.map(([value, label]) => (
              <button
                key={value}
                onClick={() => setFilter("status", value)}
                className={`rounded-lg px-3 py-2 ${status === value ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-600"}`}
              >
                {label}
              </button>
            ))}
          </div>
        )}
        {!canBrowse && (
          <p className="rounded-lg bg-neutral-50 p-3 text-sm text-neutral-500">
            Bạn đang xem một vài câu chuyện từ cộng đồng. Đăng nhập để trò
            chuyện và xem thêm.
          </p>
        )}
        {canBrowse && !postsQuery.isError && (
          <p role="status" aria-live="polite" className="text-xs text-neutral-500">
            {postsQuery.isFetching ? "Đang tìm bài phù hợp…" : `${posts.length} bài viết phù hợp`}
          </p>
        )}
        {postsQuery.isError ? (
          <div
            role="alert"
            className="space-y-3 rounded-xl border border-neutral-200 p-8 text-center text-sm"
          >
            <p>Chưa tải được bảng tin. Bạn thử lại nhé.</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => postsQuery.refetch()}
            >
              Tải lại
            </Button>
          </div>
        ) : (
          <ThreadFeed
            key={`${tab}-${topic}-${campus}-${search}-${type}-${sort}-${status}-${maxPrice}-${topicFilterQuery}-${point?.latitude}-${point?.longitude}-${radius}`}
            posts={posts}
            showOwnerControls={tab === "mine"}
            isLoading={postsQuery.isLoading}
            paging="infinite"
            pageSize={10}
            onEditPost={(post) =>
              navigate(
                "/knowledge/" +
                  post.id +
                  "/edit?" +
                  new URLSearchParams({ returnTo }),
              )
            }
            emptyTitle={
              tab === "following"
                ? "Chưa có bài viết từ chủ đề bạn theo dõi."
                : tab === "saved"
                  ? "Bạn chưa lưu bài viết nào."
                  : "Chưa có câu chuyện nào ở đây."
            }
            emptyDescription={
              point ? "Chưa có review có vị trí quán phù hợp. Thử tăng bán kính hoặc bỏ lọc Gần tôi."
              : tab === "following"
                ? "Chọn chủ đề bạn quan tâm để bắt đầu."
                : "Thử đổi bộ lọc hoặc mở đầu bằng một câu hỏi của bạn."
            }
            emptyAction={
              <Button
                variant="outline"
                size="sm"
                onClick={
                  tab === "following" ? () => setTopicsOpen(true) : compose
                }
              >
                {tab === "following"
                  ? "Chọn chủ đề theo dõi"
                  : "Bắt đầu câu chuyện"}
              </Button>
            }
          />
        )}
        {!canBrowse && (
          <div className="rounded-xl border border-neutral-200 p-5 text-sm text-neutral-600">
            Còn nhiều chuyện đang được chia sẻ quanh trường.{" "}
            <Link to="/login" className="font-semibold text-brand-600">
              Đăng nhập để xem thêm
            </Link>
          </div>
        )}
      </section>
      <Dialog open={topicsOpen} onOpenChange={setTopicsOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa chủ đề theo dõi</DialogTitle>
            <DialogDescription>
              Chọn những chuyện bạn muốn đọc trong tab “Đang theo dõi”. Thay đổi
              được lưu ngay.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {LIFE_TOPICS.map((item) => (
              <label
                key={item.value}
                className="flex cursor-pointer items-start gap-3 rounded-xl border border-neutral-200 p-3 has-checked:border-brand-200 has-checked:bg-brand-50/50"
              >
                <input
                  type="checkbox"
                  checked={followed.includes(item.value)}
                  disabled={
                    followMutation.isPending ||
                    followedQuery.isLoading ||
                    followedQuery.isError
                  }
                  onChange={() =>
                    followMutation.mutate({
                      value: item.value,
                      following: followed.includes(item.value),
                    })
                  }
                  className="mt-1 h-4 w-4 shrink-0 accent-brand-600"
                  aria-label={item.label}
                />
                <span>
                  <span className="block text-sm font-medium text-neutral-800">
                    {item.label}
                  </span>
                  <span className="mt-1 block text-xs leading-relaxed text-neutral-500">
                    {item.description}
                  </span>
                </span>
              </label>
            ))}
          </div>
          <Button
            onClick={() => setTopicsOpen(false)}
            disabled={followMutation.isPending}
          >
            {followMutation.isPending ? "Đang cập nhật…" : "Xong"}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
