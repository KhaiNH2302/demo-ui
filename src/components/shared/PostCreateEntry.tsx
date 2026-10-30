import { useLocation, useNavigate } from "react-router-dom";
import { PenLine } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { useAuthStore } from "@/store/authStore";
import { useGuardedAction } from "@/lib/guestGate";
import { lifePostCreateHref } from "@/lib/studentLifeNavigation";
import type { PostType } from "@/types/entities";

export function PostCreateEntry({
  topic,
  campus,
  type,
}: {
  topic?: string;
  campus?: string;
  type?: PostType;
}) {
  const user = useAuthStore((state) => state.user);
  const location = useLocation();
  const navigate = useNavigate();
  const guard = useGuardedAction();
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-surface p-4">
      <Avatar
        src={user?.avatarUrl}
        name={user?.fullName || "Sinh viên"}
        size="md"
      />
      <button
        type="button"
        aria-label={type === "review" ? "Viết review" : "Viết bài"}
        onClick={guard("auth", () =>
          navigate(
            lifePostCreateHref({
              topic,
              campus,
              type,
              returnTo: location.pathname + location.search,
            }),
          ),
        )}
        className="group flex min-w-0 flex-1 items-center justify-between gap-3 rounded-xl bg-neutral-50 px-4 py-3 text-left transition-colors hover:bg-brand-50 focus-visible:outline-2 focus-visible:outline-brand-500"
      >
        <span className="min-w-0 text-sm leading-relaxed text-neutral-500 group-hover:text-neutral-700">
          {type === "review"
            ? "Vừa ghé quán nào? Kể mọi người nghe…"
            : topic === "transport"
              ? "Bạn cần ghép chuyến hay đang còn chỗ trống?"
              : topic === "food"
                ? "Hôm nay bạn ăn gì? Có quán nào muốn kể không?"
                : "Bạn muốn chia sẻ chuyện gì hôm nay?"}
        </span>
        <span className="flex shrink-0 items-center gap-2 text-sm font-semibold text-brand-600">
          <PenLine size={18} />
          <span className="hidden sm:inline">
            {type === "review" ? "Viết review" : "Viết bài"}
          </span>
        </span>
      </button>
    </div>
  );
}
