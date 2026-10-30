import React, { useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { apiClient } from "@/lib/apiClient";
import { LIFE_CAMPUSES, LIFE_TOPICS } from "@/lib/studentLife";
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
  const tab = params.get("tab") || "discover";
  const topic = params.get("topic") || "";
  const campus = params.get("campus") || "";
  const type = params.get("type") || "";
  const sort = params.get("sort") || "new";
  const maxPrice = params.get("maxPrice") || "";
  const search = params.get("q") || "";
  const status = params.get("status") || "Published";
  const setFilter = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key === "type" && value === "review") next.set("topic", "food");
    if (key === "type" && value !== "review") next.delete("maxPrice");
    if (key === "topic" && value !== "food" && type === "review") {
      next.delete("type");
      next.delete("maxPrice");
    }
    setParams(next, { replace: key === "q" });
  };
  const compose = guard("auth", () =>
    navigate(
      lifePostCreateHref({
        topic,
        campus,
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
    ],
    queryFn: () =>
      apiClient.get(canBrowse ? "/posts" : "/public/posts/preview", {
        params: { tab, topic, campus, type, sort, q: search, status, maxPrice },
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
  const posts = Array.isArray(postsQuery.data) ? postsQuery.data : [];
  const campusSelect = (label: string) => (
    <FeedFilterSelect
      aria-label={label}
      value={campus}
      onChange={(e) => setFilter("campus", e.target.value)}
      className="flex-1 sm:w-36 sm:flex-none"
    >
      <option value="">Mọi campus</option>
      {LIFE_CAMPUSES.map((item) => (
        <option key={item}>{item}</option>
      ))}
    </FeedFilterSelect>
  );

  if (params.get("compose") === "1")
    return (
      <Navigate
        to={lifePostCreateHref({
          topic,
          campus,
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
            <div className="flex flex-wrap gap-2">
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
              {campusSelect("Lọc campus")}
              <FeedFilterSelect
                aria-label="Sắp xếp bài viết"
                value={sort}
                onChange={(e) => setFilter("sort", e.target.value)}
                className="flex-1 sm:w-40 sm:flex-none"
              >
                <option value="new">Mới nhất</option>
                <option value="hot">Nhiều lượt thích</option>
                <option value="discussed">Nhiều bình luận</option>
              </FeedFilterSelect>
            </div>
            {type === "review" && (
              <FeedFilterSelect
                aria-label="Lọc mức chi"
                value={maxPrice}
                onChange={(e) => setFilter("maxPrice", e.target.value)}
                className="w-full sm:w-48"
              >
                <option value="">Mọi mức chi</option>
                <option value="30000">Đến 30.000đ/người</option>
                <option value="50000">Đến 50.000đ/người</option>
                <option value="80000">Đến 80.000đ/người</option>
              </FeedFilterSelect>
            )}
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
            {[
              ["Published", "Đã đăng"],
              ["PendingReview", "Chờ duyệt"],
              ["Rejected", "Bị từ chối"],
            ].map(([value, label]) => (
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
            key={`${tab}-${topic}-${campus}-${search}-${type}-${sort}-${status}-${maxPrice}`}
            posts={posts}
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
              tab === "following"
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
