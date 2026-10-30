import { ExternalLink } from "lucide-react";
import type { KnowledgePost } from "@/types/entities";

export function PostDemoSource({
  content,
}: {
  content: NonNullable<KnowledgePost["demoContent"]>;
}) {
  if (!content.sources?.length) return null;
  return (
    <div
      className="space-y-1.5 border-l-2 border-neutral-200 pl-3 text-[11px] leading-relaxed text-neutral-500"
      onClick={(event) => event.stopPropagation()}
    >
      <p>
        {content.note ||
          "Bài được biên soạn lại từ thảo luận công khai; không phải bài đăng gốc."}
      </p>
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {content.sources.map((source) => (
          <a
            key={source.url}
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-medium text-brand-600 hover:underline"
          >
            {source.label}
            <ExternalLink size={11} aria-hidden="true" />
          </a>
        ))}
      </div>
    </div>
  );
}
