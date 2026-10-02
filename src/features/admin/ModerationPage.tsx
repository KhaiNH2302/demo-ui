import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Check,
  X,
  ShieldAlert,
  Eye,
  Trash2,
  Ban,
  AlertTriangle,
} from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { PageHeader } from '@/components/shared/PageHeader';
import { QueryBoundary } from '@/components/shared/QueryBoundary';
import { UserMiniCard } from '@/components/shared/UserMiniCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { EmptyState } from '@/components/shared/EmptyState';
import { ReasonDialog } from '@/components/shared/ReasonDialog';
import { FilterSelect } from '@/components/shared/FilterSelect';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/Dialog';
import { toast } from '@/components/ui/Toast';
import type { KnowledgePost, ViolationReport } from '@/types/entities';
import type { ReportTargetType } from '@/types/status';

const TARGET_TYPE_LABELS: Record<ReportTargetType, string> = {
  post: 'Bài viết',
  comment: 'Bình luận',
  opportunity: 'Cơ hội CLB',
  program: 'Kênh chương trình',
  group: 'Nhóm kết nối',
  mentor_post: 'Bài đăng Mentor',
  user: 'Hồ sơ người dùng',
  announcement: 'Thông báo chương trình',
  message: 'Tin nhắn',
};

export const ModerationPage: React.FC = () => {
  const queryClient = useQueryClient();

  const [tab, setTab] = useState<'reports' | 'posts'>('reports');
  const [targetFilter, setTargetFilter] = useState<string>('all');
  const [selectedPost, setSelectedPost] = useState<KnowledgePost | null>(null);
  const [rejectPostId, setRejectPostId] = useState<string | null>(null);

  const [reportAction, setReportAction] = useState<{
    id: string;
    action: 'remove_content' | 'restrict_user';
  } | null>(null);

  const postsQuery = useQuery({
    queryKey: ['admin', 'moderation', 'posts'],
    queryFn: () => apiClient.get<KnowledgePost[]>('/admin/moderation/posts'),
  });

  const reportsQuery = useQuery({
    queryKey: ['admin', 'moderation', 'reports', targetFilter],
    queryFn: () =>
      apiClient.get<ViolationReport[]>('/admin/moderation/reports', {
        params: { targetType: targetFilter },
      }),
  });

  const reviewPostMutation = useMutation({
    mutationFn: ({
      id,
      status,
      reason,
    }: {
      id: string;
      status: 'Published' | 'Rejected';
      reason?: string;
    }) => apiClient.put(`/admin/moderation/posts/${id}`, { status, reason }),
    onSuccess: (_, vars) => {
      toast.success(
        vars.status === 'Published'
          ? 'Đã phê duyệt / khôi phục bài viết xuất bản!'
          : 'Đã gỡ / từ chối bài viết.'
      );
      setSelectedPost(null);
      setRejectPostId(null);
      queryClient.invalidateQueries({ queryKey: ['admin', 'moderation'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
  });

  const resolveReportMutation = useMutation({
    mutationFn: ({
      id,
      action,
      reason,
    }: {
      id: string;
      action: 'dismiss' | 'remove_content' | 'restrict_user';
      reason?: string;
    }) => apiClient.put(`/admin/moderation/reports/${id}`, { action, reason }),
    onSuccess: () => {
      toast.success('Đã xử lý báo cáo vi phạm thành công!');
      setReportAction(null);
      queryClient.invalidateQueries({ queryKey: ['admin', 'moderation'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
  });

  const targetFilters: { key: string; label: string }[] = [
    { key: 'all', label: 'Tất cả đối tượng' },
    { key: 'post', label: 'Bài viết' },
    { key: 'comment', label: 'Bình luận' },
    { key: 'opportunity', label: 'Cơ hội CLB' },
    { key: 'program', label: 'Kênh chương trình' },
    { key: 'group', label: 'Nhóm kết nối' },
    { key: 'mentor_post', label: 'Bài đăng Mentor' },
    { key: 'user', label: 'Tài khoản' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Trung tâm Kiểm duyệt & Báo cáo Vi phạm"
        description="Xử lý báo cáo gộp theo đối tượng (tự động tạm ẩn khi đạt ngưỡng 5 báo cáo) và phê duyệt nội dung"
        breadcrumbs={[
          { label: 'Admin Portal', href: '/admin' },
          { label: 'Kiểm duyệt nội dung' },
        ]}
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="w-full space-y-6">
        <TabsList>
          <TabsTrigger value="reports">
            Báo cáo vi phạm ({reportsQuery.data?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="posts">
            Bài chờ duyệt / Tạm ẩn ({postsQuery.data?.length || 0})
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: GROUPED VIOLATION REPORTS (A3) */}
        <TabsContent value="reports" className="space-y-4 mt-4">
          <div className="flex items-center gap-2">
            <FilterSelect
              label="Đối tượng"
              value={targetFilter}
              onChange={setTargetFilter}
              options={targetFilters.map((f) => ({
                value: f.key,
                label: f.label,
              }))}
            />
          </div>

          <QueryBoundary queries={[reportsQuery]}>
            {reportsQuery.data && reportsQuery.data.length === 0 ? (
              <EmptyState
                title="Không có báo cáo vi phạm nào"
                description="Hệ thống hiện không có báo cáo vi phạm nào đang chờ xử lý."
              />
            ) : (
              <div className="space-y-4">
                {reportsQuery.data?.map((r) => {
                  const tType = (r.targetType || 'post') as ReportTargetType;
                  return (
                    <Card
                      key={r.id}
                      className={
                        r.autoHidden
                          ? 'border-tier-danger-border bg-tier-danger-bg/10'
                          : 'border-neutral-200'
                      }
                    >
                      <CardContent className="p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                        <div className="space-y-2.5 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge tier="neutral" size="sm">
                              {TARGET_TYPE_LABELS[tType] || 'Nội dung'}
                            </Badge>
                            <Badge tier="danger" size="sm">
                              <ShieldAlert className="w-3.5 h-3.5 mr-1" /> {r.reason}
                            </Badge>
                            <Badge tier="pending" size="sm">
                              {r.reportCount || 1} lượt báo cáo
                            </Badge>
                            {r.autoHidden && (
                              <Badge tier="danger" size="sm">
                                <AlertTriangle className="w-3.5 h-3.5 mr-1" /> Đã tạm ẩn tự động (≥5 báo cáo)
                              </Badge>
                            )}
                          </div>

                          <div>
                            <h4 className="text-sm font-bold text-neutral-900">
                              {r.targetTitle || r.postTitle || `Đối tượng #${r.targetId || r.postId}`}
                            </h4>
                            {r.targetAuthorName && (
                              <p className="text-xs text-neutral-500 mt-0.5">
                                Tác giả nội dung: <strong>{r.targetAuthorName}</strong>
                              </p>
                            )}
                          </div>

                          {(r.contentSnapshot || r.description || r.details) && (
                            <div className="rounded-lg bg-neutral-50 border border-neutral-200 p-3 text-xs text-neutral-700 space-y-1">
                              {r.contentSnapshot && (
                                <p className="line-clamp-2 italic">"{r.contentSnapshot}"</p>
                              )}
                              {(r.description || r.details) && (
                                <p className="text-neutral-600">
                                  <strong>Ghi chú báo cáo:</strong> {r.description || r.details}
                                </p>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 self-end lg:self-center shrink-0 flex-wrap">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              resolveReportMutation.mutate({ id: r.id, action: 'dismiss' })
                            }
                          >
                            Bỏ qua / Khôi phục
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            leftIcon={<Trash2 className="w-3.5 h-3.5 text-tier-danger-text" />}
                            onClick={() =>
                              setReportAction({ id: r.id, action: 'remove_content' })
                            }
                          >
                            Gỡ nội dung
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            leftIcon={<Ban className="w-3.5 h-3.5" />}
                            onClick={() =>
                              setReportAction({ id: r.id, action: 'restrict_user' })
                            }
                          >
                            Hạn chế tài khoản
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </QueryBoundary>
        </TabsContent>

        {/* TAB 2: PENDING & TEMPORARILY HIDDEN POSTS */}
        <TabsContent value="posts" className="mt-4">
          <QueryBoundary queries={[postsQuery]}>
            {postsQuery.data && postsQuery.data.length === 0 ? (
              <EmptyState
                title="Không có bài viết nào chờ duyệt"
                description="Tất cả các bài đăng đã được kiểm duyệt hoàn tất."
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {postsQuery.data?.map((p) => (
                  <Card key={p.id} className="flex flex-col justify-between">
                    <CardHeader className="p-4 pb-2 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <Badge tier="neutral" size="sm">
                          {p.subjectCode || p.subject || 'Chung'}
                        </Badge>
                        <StatusBadge status={p.status} group="post" />
                      </div>
                      <CardTitle className="text-base line-clamp-2">{p.title}</CardTitle>
                      <UserMiniCard userId={p.authorId} showMajor />
                    </CardHeader>
                    <CardContent className="p-4 pt-2 space-y-2">
                      <p className="text-xs text-neutral-600 line-clamp-3 bg-neutral-50 p-3 rounded-lg border border-neutral-200">
                        {p.contentMd || p.content}
                      </p>
                    </CardContent>
                    <CardFooter className="p-4 border-t border-neutral-100 flex items-center justify-between">
                      <Button variant="ghost" size="sm" onClick={() => setSelectedPost(p)}>
                        <Eye className="w-4 h-4 mr-1" /> Xem chi tiết
                      </Button>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setRejectPostId(p.id)}
                        >
                          <X className="w-4 h-4 mr-1" /> Gỡ bài
                        </Button>
                        <Button
                          size="sm"
                          onClick={() =>
                            reviewPostMutation.mutate({ id: p.id, status: 'Published' })
                          }
                          loading={reviewPostMutation.isPending}
                        >
                          <Check className="w-4 h-4 mr-1" /> Duyệt / Khôi phục
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </QueryBoundary>
        </TabsContent>
      </Tabs>

      {/* Post Detail Review Dialog */}
      <Dialog open={!!selectedPost} onOpenChange={() => setSelectedPost(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Kiểm duyệt nội dung bài đăng</DialogTitle>
          </DialogHeader>
          {selectedPost && (
            <div className="space-y-4 py-2">
              <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                <span className="text-xs text-neutral-500 block mb-1">Tác giả:</span>
                <UserMiniCard userId={selectedPost.authorId} showMajor />
              </div>
              <h3 className="font-bold text-base text-neutral-900">{selectedPost.title}</h3>
              <p className="text-xs text-neutral-800 whitespace-pre-line leading-relaxed bg-neutral-50 p-4 rounded-lg border border-neutral-200">
                {selectedPost.contentMd || selectedPost.content}
              </p>
              <DialogFooter className="pt-4 border-t border-neutral-200">
                <Button
                  variant="outline"
                  onClick={() => {
                    setRejectPostId(selectedPost.id);
                    setSelectedPost(null);
                  }}
                >
                  Từ chối / Gỡ bài
                </Button>
                <Button
                  onClick={() =>
                    reviewPostMutation.mutate({ id: selectedPost.id, status: 'Published' })
                  }
                  loading={reviewPostMutation.isPending}
                >
                  <Check className="w-4 h-4 mr-1.5" /> Phê duyệt xuất bản
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Reason Dialog */}
      <ReasonDialog
        open={!!rejectPostId}
        onOpenChange={() => setRejectPostId(null)}
        title="Từ chối / Gỡ bài viết"
        description="Nhập lý do bài viết không đạt tiêu chuẩn cộng đồng."
        label="Lý do xử lý"
        placeholder="Nhập lý do gửi lại tác giả..."
        onConfirm={(reason) => {
          if (!rejectPostId) return;
          reviewPostMutation.mutate({ id: rejectPostId, status: 'Rejected', reason });
        }}
      />

      {/* Report Action Reason Dialog */}
      <ReasonDialog
        open={!!reportAction}
        onOpenChange={() => setReportAction(null)}
        title={
          reportAction?.action === 'remove_content'
            ? 'Xác nhận gỡ nội dung vi phạm'
            : 'Xác nhận hạn chế tài khoản vi phạm'
        }
        description="Hành động này sẽ được ghi nhận vào Nhật ký kiểm toán (Audit Log)."
        label="Căn cứ / Lý do xử lý"
        placeholder="Nhập điều khoản nội quy vi phạm..."
        onConfirm={(reason) => {
          if (!reportAction) return;
          resolveReportMutation.mutate({
            id: reportAction.id,
            action: reportAction.action,
            reason,
          });
        }}
      />
    </div>
  );
};

export default ModerationPage;
