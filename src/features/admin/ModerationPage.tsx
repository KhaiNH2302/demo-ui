import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { PageHeader } from '@/components/shared/PageHeader';
import { QueryBoundary } from '@/components/shared/QueryBoundary';
import { UserMiniCard } from '@/components/shared/UserMiniCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { ReasonDialog } from '@/components/shared/ReasonDialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { toast } from '@/components/ui/Toast';
import { Check, X, ShieldAlert, Eye, FileText, Trash2, Ban } from 'lucide-react';
import type { KnowledgePost, ViolationReport } from '@/types/entities';

export const ModerationPage: React.FC = () => {
  const queryClient = useQueryClient();

  const [tab, setTab] = useState<'posts' | 'reports'>('posts');
  const [selectedPost, setSelectedPost] = useState<KnowledgePost | null>(null);
  const [rejectPostId, setRejectPostId] = useState<string | null>(null);

  const [selectedReport, setSelectedReport] = useState<ViolationReport | null>(null);
  const [reportAction, setReportAction] = useState<{ id: string; action: 'remove_content' | 'restrict_user' } | null>(null);

  const postsQuery = useQuery({
    queryKey: ['admin', 'moderation', 'posts'],
    queryFn: () => apiClient.get<KnowledgePost[]>('/admin/moderation/posts'),
  });

  const reportsQuery = useQuery({
    queryKey: ['admin', 'moderation', 'reports'],
    queryFn: () => apiClient.get<ViolationReport[]>('/admin/moderation/reports'),
  });

  const reviewPostMutation = useMutation({
    mutationFn: ({ id, status, reason }: { id: string; status: 'Published' | 'Rejected'; reason?: string }) =>
      apiClient.put(`/admin/moderation/posts/${id}`, { status, reason }),
    onSuccess: (_, vars) => {
      toast.success(vars.status === 'Published' ? 'Đã phê duyệt bài viết xuất bản!' : 'Đã từ chối duyệt bài viết.');
      setSelectedPost(null);
      setRejectPostId(null);
      queryClient.invalidateQueries({ queryKey: ['admin', 'moderation'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
    onError: () => toast.error('Có lỗi xảy ra.'),
  });

  const resolveReportMutation = useMutation({
    mutationFn: ({ id, action, reason }: { id: string; action: 'dismiss' | 'remove_content' | 'restrict_user'; reason?: string }) =>
      apiClient.put(`/admin/moderation/reports/${id}`, { action, reason }),
    onSuccess: () => {
      toast.success('Đã xử lý báo cáo vi phạm thành công!');
      setSelectedReport(null);
      setReportAction(null);
      queryClient.invalidateQueries({ queryKey: ['admin', 'moderation'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
    onError: () => toast.error('Có lỗi xảy ra.'),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Trung tâm Kiểm duyệt Nội dung"
        description="Phê duyệt bài viết chia sẻ tài liệu và xử lý các báo cáo vi phạm tiêu chuẩn cộng đồng"
        breadcrumbs={[
          { label: 'Admin Portal', href: '/admin' },
          { label: 'Kiểm duyệt' },
        ]}
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-sm">
          <TabsTrigger value="posts">
            Bài chờ duyệt ({postsQuery.data?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="reports">
            Báo cáo vi phạm ({reportsQuery.data?.length || 0})
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: PENDING POSTS */}
        <TabsContent value="posts" className="mt-6">
          <QueryBoundary queries={[postsQuery]}>
            {postsQuery.data && postsQuery.data.length === 0 ? (
              <EmptyState
                title="Không có bài viết nào chờ duyệt"
                description="Tất cả các bài đăng chia sẻ tài liệu đã được kiểm duyệt hoàn tất."
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {postsQuery.data?.map((p) => (
                  <Card key={p.id} className="flex flex-col justify-between">
                    <CardHeader className="p-4 pb-2 space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary">{p.subjectCode || 'Chung'}</Badge>
                        <span className="text-xs text-[var(--text-muted)]">
                          {new Date(p.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                      <CardTitle className="text-base line-clamp-2">{p.title}</CardTitle>
                      <UserMiniCard userId={p.authorId} showMajor />
                    </CardHeader>
                    <CardContent className="p-4 pt-0 space-y-2">
                      <p className="text-xs text-[var(--text-muted)] line-clamp-3 bg-[var(--surface-muted)] p-2.5 rounded">
                        {p.contentMd || p.content}
                      </p>
                    </CardContent>
                    <CardFooter className="p-4 border-t border-[var(--border-subtle)] flex items-center justify-between">
                      <Button variant="ghost" size="sm" onClick={() => setSelectedPost(p)}>
                        <Eye className="w-4 h-4 mr-1" /> Xem chi tiết
                      </Button>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setRejectPostId(p.id)}
                        >
                          <X className="w-4 h-4 text-[var(--status-danger-fg)] mr-1" /> Từ chối
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => reviewPostMutation.mutate({ id: p.id, status: 'Published' })}
                          loading={reviewPostMutation.isPending}
                        >
                          <Check className="w-4 h-4 mr-1" /> Duyệt bài
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </QueryBoundary>
        </TabsContent>

        {/* TAB 2: VIOLATION REPORTS */}
        <TabsContent value="reports" className="mt-6">
          <QueryBoundary queries={[reportsQuery]}>
            {reportsQuery.data && reportsQuery.data.length === 0 ? (
              <EmptyState
                title="Không có báo cáo vi phạm nào"
                description="Hệ thống không ghi nhận nội dung vi phạm nào chưa xử lý."
              />
            ) : (
              <div className="space-y-4">
                {reportsQuery.data?.map((r) => (
                  <Card key={r.id}>
                    <CardContent className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="danger">
                            <ShieldAlert className="w-3.5 h-3.5 mr-1" /> {r.reason}
                          </Badge>
                          <span className="text-xs text-[var(--text-muted)]">
                            Mã bài viết: {r.postId}
                          </span>
                        </div>
                        <p className="text-sm text-[var(--text-main)] font-medium">
                          Nội dung báo cáo: "{r.details || 'Không có mô tả thêm'}"
                        </p>
                        <div className="text-xs text-[var(--text-muted)] flex items-center gap-2">
                          <span>Người báo cáo:</span>
                          <UserMiniCard userId={r.reporterId} />
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end md:self-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => resolveReportMutation.mutate({ id: r.id, action: 'dismiss' })}
                        >
                          Bỏ qua (Hợp lệ)
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setReportAction({ id: r.id, action: 'remove_content' })}
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-1 text-[var(--status-danger-fg)]" /> Gỡ nội dung
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => setReportAction({ id: r.id, action: 'restrict_user' })}
                        >
                          <Ban className="w-3.5 h-3.5 mr-1" /> Khóa tài khoản
                        </Button>
                      </div>
                    </CardContent>
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
              <div className="p-3 bg-[var(--surface-muted)] rounded-lg">
                <span className="text-xs text-[var(--text-muted)] block mb-1">Tác giả:</span>
                <UserMiniCard userId={selectedPost.authorId} showMajor />
              </div>
              <h3 className="font-bold text-lg">{selectedPost.title}</h3>
              <p className="text-sm text-[var(--text-main)] whitespace-pre-line leading-relaxed bg-[var(--surface-sunken)] p-4 rounded-lg border border-[var(--border-subtle)]">
                {selectedPost.contentMd || selectedPost.content}
              </p>
              <DialogFooter className="pt-4 border-t border-[var(--border-subtle)]">
                <Button
                  variant="outline"
                  onClick={() => {
                    setRejectPostId(selectedPost.id);
                    setSelectedPost(null);
                  }}
                >
                  Từ chối duyệt
                </Button>
                <Button
                  onClick={() => reviewPostMutation.mutate({ id: selectedPost.id, status: 'Published' })}
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
        title="Từ chối duyệt bài viết"
        description="Nhập lý do bài viết không đạt tiêu chuẩn xuất bản (sai thông tin, spam, vi phạm nội quy...)."
        label="Lý do từ chối"
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
        title={reportAction?.action === 'remove_content' ? 'Xác nhận gỡ nội dung vi phạm' : 'Xác nhận xử lý kỷ luật tài khoản'}
        description="Hành động này sẽ được lưu trữ vào Audit Log phục vụ đối soát quản trị."
        label="Căn cứ / Lý do xử lý"
        placeholder="Nhập điều khoản nội quy vi phạm..."
        onConfirm={(reason) => {
          if (!reportAction) return;
          resolveReportMutation.mutate({ id: reportAction.id, action: reportAction.action, reason });
        }}
      />
    </div>
  );
};

export default ModerationPage;
