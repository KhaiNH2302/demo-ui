import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { QueryBoundary } from '@/components/shared/QueryBoundary';
import { EmptyState } from '@/components/shared/EmptyState';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/Tooltip';
import { useToast } from '@/components/ui/Toast';
import { Plus, BookOpen, Pencil, Trash2, Lock, Eye, AlertCircle } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { formatDate } from '@/lib/format';
import type { ColumnDef } from '@tanstack/react-table';
import type { KnowledgePost } from '@/types/entities';

export default function MyPostsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [deletePostId, setDeletePostId] = useState<string | null>(null);
  const [closePostId, setClosePostId] = useState<string | null>(null);

  const myPostsQuery = useQuery<KnowledgePost[]>({
    queryKey: queryKeys.knowledge.myPosts,
    queryFn: () => apiClient.get('/posts/me'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/posts/${id}`),
    onSuccess: () => {
      toast({ variant: 'default', title: 'Đã xóa bài viết' });
      queryClient.invalidateQueries({ queryKey: queryKeys.knowledge.myPosts });
      setDeletePostId(null);
    },
  });

  const closeMutation = useMutation({
    mutationFn: (id: string) => apiClient.put(`/posts/${id}`, { status: 'Closed' }),
    onSuccess: () => {
      toast({ variant: 'default', title: 'Đã đóng bài viết' });
      queryClient.invalidateQueries({ queryKey: queryKeys.knowledge.myPosts });
      setClosePostId(null);
    },
  });

  const columns: any[] = [
    {
      accessorKey: 'title',
      header: 'Tiêu đề bài viết',
      cell: ({ row }: any) => (
        <div className="max-w-md">
          <Link
            to={`/knowledge/${row.original.id}`}
            className="font-semibold text-neutral-900 hover:text-brand-600 line-clamp-1"
          >
            {row.original.title}
          </Link>
          {row.original.subject && (
            <span className="text-[11px] text-neutral-400 mt-0.5 block">
              Môn: {row.original.subject}
            </span>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'type',
      header: 'Phân loại',
      cell: ({ row }: any) => (
        <Badge tier="neutral" size="sm" className="capitalize">
          {row.original.type}
        </Badge>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Trạng thái',
      cell: ({ row }: any) => {
        const post = row.original;
        return (
          <div className="flex items-center gap-1.5">
            <StatusBadge group="post" value={post.status} />
            {post.status === 'Rejected' && post.rejectReason && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <AlertCircle size={14} className="text-[#dc3c33] cursor-pointer" />
                </TooltipTrigger>
                <TooltipContent>Lý do từ chối: {post.rejectReason}</TooltipContent>
              </Tooltip>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'commentCount',
      header: 'Phản hồi',
      cell: ({ row }: any) => <span>{row.original.commentCount}</span>,
    },
    {
      accessorKey: 'createdAt',
      header: 'Ngày tạo',
      cell: ({ row }: any) => <span>{formatDate(row.original.createdAt)}</span>,
    },
    {
      id: 'actions',
      header: 'Hành động',
      cell: ({ row }: any) => {
        const post = row.original;
        return (
          <div className="flex items-center gap-1.5">
            <Link to={`/knowledge/${post.id}`}>
              <Button variant="ghost" size="sm" className="p-1.5 h-auto text-neutral-500 hover:text-neutral-900" title="Xem">
                <Eye size={15} />
              </Button>
            </Link>

            {post.status === 'Published' && (
              <>
                <Link to={`/knowledge/${post.id}/edit`}>
                  <Button variant="ghost" size="sm" className="p-1.5 h-auto text-neutral-500 hover:text-brand-600" title="Sửa">
                    <Pencil size={15} />
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setClosePostId(post.id)}
                  className="p-1.5 h-auto text-neutral-500 hover:text-neutral-800"
                  title="Đóng thảo luận"
                >
                  <Lock size={15} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeletePostId(post.id)}
                  className="p-1.5 h-auto text-neutral-400 hover:text-[#dc3c33]"
                  title="Xóa"
                >
                  <Trash2 size={15} />
                </Button>
              </>
            )}

            {post.status === 'Rejected' && (
              <Link to={`/knowledge/${post.id}/edit`}>
                <Button variant="outline" size="sm">
                  Sửa & Gửi lại
                </Button>
              </Link>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bài viết của tôi"
        description="Quản lý và theo dõi trạng thái các bài chia sẻ kiến thức, tài liệu bạn đã đóng góp"
        backHref="/knowledge"
        actions={
          <Link to="/knowledge/new">
            <Button size="sm" leftIcon={<Plus size={16} />}>
              Soạn bài mới
            </Button>
          </Link>
        }
      />

      <QueryBoundary
        query={myPostsQuery}
        isEmpty={(data) => data.length === 0}
        empty={
          <EmptyState
            icon={BookOpen}
            title="Bạn chưa đăng bài viết nào"
            description="Hãy chia sẻ kinh nghiệm ôn tập hoặc tài liệu học tập với các bạn sinh viên!"
            actionLabel="Đăng bài ngay"
            onAction={() => navigate('/knowledge/new')}
          />
        }
      >
        {(posts) => <DataTable columns={columns} data={posts} />}
      </QueryBoundary>

      <ConfirmDialog
        open={!!deletePostId}
        onOpenChange={(open) => !open && setDeletePostId(null)}
        title="Xóa bài viết"
        description="Bạn có chắc chắn muốn xóa bài viết này không? Dữ liệu bài viết và các bình luận liên quan sẽ bị xóa vĩnh viễn."
        danger={true}
        confirmLabel="Xóa bài viết"
        loading={deleteMutation.isPending}
        onConfirm={() => {
          if (deletePostId) deleteMutation.mutate(deletePostId);
        }}
      />

      <ConfirmDialog
        open={!!closePostId}
        onOpenChange={(open) => !open && setClosePostId(null)}
        title="Đóng thảo luận bài viết"
        description="Khi đóng, sinh viên khác vẫn xem được bài viết nhưng sẽ không thể gửi thêm phản hồi bình luận mới."
        confirmLabel="Đóng bài viết"
        loading={closeMutation.isPending}
        onConfirm={() => {
          if (closePostId) closeMutation.mutate(closePostId);
        }}
      />
    </div>
  );
}
