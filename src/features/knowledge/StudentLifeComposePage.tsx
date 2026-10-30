import { useEffect } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Save } from "lucide-react";
import { ThreadComposer } from "@/components/shared/ThreadComposer";
import { Button } from "@/components/ui/Button";
import { apiClient } from "@/lib/apiClient";
import { LIFE_CAMPUSES, LIFE_TOPICS } from "@/lib/studentLife";
import { lifePostReturnPath } from "@/lib/studentLifeNavigation";
import { isCampusArea } from "@/lib/campusAreas";
import { useAuthStore } from "@/store/authStore";
import type { KnowledgePost, PostType } from "@/types/entities";

export default function StudentLifeComposePage() {
  const { id } = useParams<{ id: string }>();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const client = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const returnTo = lifePostReturnPath(
    params.get("returnTo") || (id ? `/knowledge/${id}` : null),
  );
  const rawType = params.get("type");
  const defaultType: PostType | undefined = [
    "discussion",
    "question",
    "review",
  ].includes(rawType || "")
    ? (rawType as PostType)
    : undefined;
  const defaultTopic = LIFE_TOPICS.find(
    (item) => item.value === params.get("topic"),
  )?.value;
  const defaultCampus = LIFE_CAMPUSES.find(
    (item) => item === params.get("campus"),
  );
  const defaultArea = isCampusArea(defaultCampus || "", params.get("area"))
    ? params.get("area")! : undefined;
  const detail = useQuery<{ post: KnowledgePost }>({
    queryKey: ["knowledge", "detail", id, user?.id],
    queryFn: () => apiClient.get(`/posts/${id}`),
    enabled: Boolean(id && user),
  });
  const post = detail.data?.post;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  const heading = id ? "Chỉnh sửa bài viết" : "Viết bài";
  return (
    <div className="mx-auto max-w-[800px] space-y-5 pb-6">
      <header className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-surface p-4 sm:gap-4 sm:p-5">
        <Link
          to={returnTo}
          aria-label="Quay lại"
          title="Quay lại"
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-50 text-neutral-500 transition-colors hover:bg-brand-50 hover:text-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
        >
          <ArrowLeft size={18} aria-hidden="true" />
        </Link>
        <div className="min-w-0 space-y-1">
          <h1 className="text-xl font-semibold leading-tight tracking-tight text-neutral-900 sm:text-2xl">
            {heading}
          </h1>
          {!id && (
            <p className="flex items-start gap-1.5 text-xs leading-relaxed text-neutral-500">
              <Save size={13} aria-hidden="true" className="mt-0.5 shrink-0" />
              <span>Nội dung văn bản được tự lưu trên thiết bị này</span>
            </p>
          )}
        </div>
      </header>
      {id && detail.isLoading ? (
        <div
          role="status"
          className="rounded-2xl border border-neutral-200 bg-surface p-8 text-sm text-neutral-500"
        >
          Đang tải bài viết…
        </div>
      ) : id && detail.isError ? (
        <div
          role="alert"
          className="space-y-4 rounded-2xl border border-neutral-200 bg-surface p-6"
        >
          <p className="text-sm text-neutral-600">
            Chưa tải được bài viết. Bạn thử lại nhé.
          </p>
          <Button variant="outline" size="sm" onClick={() => detail.refetch()}>
            Tải lại
          </Button>
        </div>
      ) : id && (!post || post.authorId !== user?.id) ? (
        <div
          role="alert"
          className="rounded-2xl border border-neutral-200 bg-surface p-6 text-sm text-neutral-600"
        >
          Bạn chỉ có thể chỉnh sửa bài viết của mình.
        </div>
      ) : (
        <div className="rounded-2xl border border-neutral-200 bg-surface p-4 sm:p-6">
          <ThreadComposer
            key={id || `new-${defaultTopic || ""}-${defaultCampus || ""}-${defaultArea || ""}-${defaultType || ""}`}
            variant="page"
            post={post}
            defaultType={defaultType}
            defaultTopic={defaultTopic}
            defaultCampus={defaultCampus}
            defaultArea={defaultArea}
            onCancel={() => navigate(returnTo)}
            onPosted={async (result) => {
              await Promise.all([
                client.invalidateQueries({ queryKey: ["knowledge"] }),
                client.invalidateQueries({ queryKey: ["feed"] }),
                client.invalidateQueries({ queryKey: ["profile-posts"] }),
              ]);
              navigate(
                id
                  ? `/knowledge/${result.id}`
                  : `/knowledge?tab=mine&status=${result.status}`,
                { replace: true },
              );
            }}
          />
        </div>
      )}
    </div>
  );
}
