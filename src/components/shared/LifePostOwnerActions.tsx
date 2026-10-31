import { Eye, EyeOff, Pencil } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { apiClient } from "@/lib/apiClient";
import { isLifePublished, lifeExpectedLabel, lifeReminderDue } from "@/lib/lifePostLifecycle";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import type { KnowledgePost } from "@/types/entities";

export function LifePostState({ post, showReminder = false }: { post: KnowledgePost; showReminder?: boolean }) {
  const due = lifeReminderDue(post), expected = lifeExpectedLabel(post);
  if (!post.authorHidden && (!showReminder || !expected)) return null;
  return <div className="flex flex-wrap items-center gap-2 text-xs" aria-live="polite">
    {post.authorHidden && <span className="rounded-md bg-neutral-100 px-2 py-1 text-neutral-600">Đã ẩn · chỉ bạn nhìn thấy</span>}
    {showReminder && expected && <span className={due ? "rounded-md bg-amber-50 px-2 py-1 text-amber-800" : "text-neutral-500"}>{due ? "Đến ngày kiểm tra nhu cầu" : post.lifeTopic === "transport" ? "Giờ đi dự kiến" : "Hoàn thành dự kiến"}: {expected}</span>}
  </div>;
}

export function LifePostOwnerActions({ post, onEdit }: { post: KnowledgePost; onEdit?: (post: KnowledgePost) => void }) {
  const client = useQueryClient(), navigate = useNavigate(), { toast } = useToast();
  const published = isLifePublished(post), due = lifeReminderDue(post);
  const mutation = useMutation({
    mutationFn: (hidden: boolean) => apiClient.put(`/posts/${post.id}/visibility`, { hidden }),
    onSuccess: async (_, hidden) => {
      toast({ variant: "success", title: hidden ? "Đã ẩn bài viết" : "Bài viết đã hiển thị trở lại" });
      await Promise.all(["knowledge", "feed", "profile-posts", "life-searches", "notifications", "nav"].map((key) => client.invalidateQueries({ queryKey: [key] })));
    },
    onError: (error: Error) => toast({ variant: "error", title: error.message || "Chưa cập nhật được bài viết" }),
  });
  return <div className="space-y-2 border-t border-neutral-100 pt-3" onClick={(event) => event.stopPropagation()} onKeyDown={(event) => event.stopPropagation()}>
    <div className="flex flex-wrap gap-2">
      <Button type="button" variant="outline" size="sm" disabled={mutation.isPending || !published}
        leftIcon={post.authorHidden ? <Eye size={14} /> : <EyeOff size={14} />}
        onClick={() => mutation.mutate(!post.authorHidden)}>{post.authorHidden ? "Hiện bài" : "Ẩn bài"}</Button>
      <Button type="button" variant="ghost" size="sm" leftIcon={<Pencil size={14} />} onClick={() => onEdit ? onEdit(post) : navigate(`/knowledge/${post.id}/edit?returnTo=${encodeURIComponent('/knowledge?tab=mine&status=all')}`)}>{due ? "Sửa bài / đổi ngày nhắc" : "Sửa bài"}</Button>
    </div>
    {!published ? <p className="text-xs text-neutral-500">Bài cần được duyệt trước khi thay đổi hiển thị.</p>
      : post.authorHidden ? <p className="text-xs text-neutral-500">Bài đã ẩn khỏi bảng tin và liên kết chia sẻ. Bạn có thể hiện lại khi cần.</p>
      : due && <p className="text-xs text-neutral-500">Đã đến ngày dự kiến. Nếu đã xong, hãy ẩn bài; nếu còn nhu cầu, giữ bài hoặc đổi ngày nhắc.</p>}
  </div>;
}
