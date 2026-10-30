import { LIFE_TOPICS } from "@/lib/studentLife";
import { cn } from "@/lib/cn";

interface Props {
  followed: string[];
  loading: boolean;
  error: boolean;
  onEdit: () => void;
  onSelect: (topic: string) => void;
  onRetry: () => void;
  className?: string;
}

export function FollowedTopics({
  followed,
  loading,
  error,
  onEdit,
  onSelect,
  onRetry,
  className,
}: Props) {
  const topics = LIFE_TOPICS.filter((item) => followed.includes(item.value));
  return (
    <section
      aria-label="Chủ đề đang theo dõi"
      className={cn(
        "rounded-2xl border border-neutral-200 bg-surface p-4",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-neutral-900">
          Chủ đề đang theo dõi
        </h2>
        <button
          type="button"
          onClick={onEdit}
          disabled={loading || error}
          className="shrink-0 text-xs font-semibold text-brand-600 hover:text-brand-700 disabled:opacity-50"
        >
          Chỉnh sửa
        </button>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-neutral-500">
        Bài từ các chủ đề này nằm trong tab “Đang theo dõi”.
      </p>
      {loading ? (
        <p className="mt-3 text-xs text-neutral-400" role="status">
          Đang tải chủ đề…
        </p>
      ) : error ? (
        <div className="mt-3 text-xs text-neutral-500" role="alert">
          Chưa tải được chủ đề.{" "}
          <button
            type="button"
            onClick={onRetry}
            className="font-semibold text-brand-600"
          >
            Thử lại
          </button>
        </div>
      ) : topics.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {topics.map((item) => (
            <button
              type="button"
              key={item.value}
              onClick={() => onSelect(item.value)}
              className="rounded-full border border-brand-100 bg-brand-50/60 px-3 py-2 text-xs font-medium text-brand-700 hover:bg-brand-100"
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-xs text-neutral-500">
          Bạn chưa theo dõi chủ đề nào. Chọn “Chỉnh sửa” để thêm nhé.
        </p>
      )}
    </section>
  );
}
