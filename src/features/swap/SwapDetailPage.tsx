import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DisclaimerBanner } from '@/components/shared/DisclaimerBanner';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { QueryBoundary } from '@/components/shared/QueryBoundary';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { WeeklyScheduleGrid } from '@/components/shared/WeeklyScheduleGrid';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/DropdownMenu';
import { useToast } from '@/components/ui/Toast';
import {
  Pencil,
  Trash2,
  MessageSquare,
  MoreVertical,
  Flag,
  Calendar,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { formatDateTime } from '@/lib/format';
import { seedCourseOfferings } from '@/mocks/data/courseOfferings';
import { seedUsers } from '@/mocks/data/users';
import type { SwapRequest, SwapConnection, User, CourseOffering } from '@/types/entities';

import { SwapOwnerPanel } from './SwapOwnerPanel';
import { SwapMatchPanel } from './SwapMatchPanel';
import { SwapRequestDialog } from './SwapRequestDialog';
import { SendSwapConnectionDialog } from './SendSwapConnectionDialog';
import { SwapConnectionReviewSheet } from './SwapConnectionReviewSheet';

interface SwapDetailResponse extends SwapRequest {
  owner?: Partial<User>;
  viewerContext?: {
    isOwner: boolean;
    myRequestInSameOffering?: SwapRequest;
    connection?: SwapConnection;
    matchLabel?: string;
    aiScore?: number;
  };
}

export default function SwapDetailPage() {
  const { id = 'swap_req_01' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [sendInviteDialogOpen, setSendInviteDialogOpen] = useState(false);
  const [reverseReqDialogOpen, setReverseReqDialogOpen] = useState(false);
  const [reviewConn, setReviewConn] = useState<SwapConnection | null>(null);

  const requestQuery = useQuery<SwapDetailResponse>({
    queryKey: queryKeys.swap.detail(id),
    queryFn: () => apiClient.get(`/swap-requests/${id}`),
  });

  const connectionsQuery = useQuery<SwapConnection[]>({
    queryKey: queryKeys.swap.connections({ requestId: id }),
    queryFn: () => apiClient.get('/swap-connections', { params: { requestId: id } }),
  });

  const cancelMutation = useMutation({
    mutationFn: () => apiClient.delete(`/swap-requests/${id}`),
    onSuccess: () => {
      toast({ variant: 'default', title: 'Đã hủy yêu cầu đổi lớp' });
      queryClient.invalidateQueries({ queryKey: queryKeys.swap.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.swap.list() });
      navigate('/swap');
    },
  });

  return (
    <div className="space-y-6 max-w-7xl 2xl:max-w-[1600px] 3xl:max-w-[1920px] 4xl:max-w-[2240px] mx-auto pb-12">
      <DisclaimerBanner />

      <QueryBoundary query={requestQuery}>
        {(req) => {
          const offering = seedCourseOfferings.find((o) => o.id === req.offeringId) || {
            id: req.offeringId,
            courseCode: req.offeringId.toUpperCase(),
            courseName: 'Môn học',
            schoolId: 'fu_hn',
            semester: 'FA26',
          };

          const isOwner = Boolean(req.viewerContext?.isOwner);
          const ownerUser = req.owner || seedUsers.find((u) => u.id === req.studentId) || {
            id: req.studentId,
            fullName: 'Sinh viên FPT',
            major: 'Kỹ thuật phần mềm',
            cohort: 'K18',
          };

          const myRequestInSameOffering = req.viewerContext?.myRequestInSameOffering;
          const pendingCount = req.pendingConnectionCount || 0;

          return (
            <div className="space-y-6">
              {/* Back navigation & Header */}
              <div className="bg-surface rounded-xl border border-neutral-200 p-5 shadow-xs">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between gap-3">
                    <Link
                      to="/swap"
                      className="text-xs text-neutral-500 hover:text-brand-600 dark:hover:text-brand-400 font-medium inline-flex items-center gap-1"
                    >
                      ← Quay lại Khám phá đổi lớp
                    </Link>

                    <div className="flex items-center gap-2">
                      <StatusBadge group="swapRequest" value={req.status} />
                      {isOwner && req.status === 'Open' && (
                        <div className="flex items-center gap-2 ml-2">
                          <Button
                            variant="outline"
                            size="sm"
                            leftIcon={<Pencil size={14} />}
                            onClick={() => setEditDialogOpen(true)}
                          >
                            Sửa
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            leftIcon={<Trash2 size={14} />}
                            className="text-tier-danger-text border-tier-danger-border hover:bg-tier-danger-bg"
                            onClick={() => setCancelDialogOpen(true)}
                          >
                            Hủy yêu cầu
                          </Button>
                        </div>
                      )}
                      {!isOwner && (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            leftIcon={<MessageSquare size={14} />}
                            onClick={() => navigate(`/chats?user=${req.studentId}`)}
                          >
                            Nhắn tin
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="px-2" aria-label="Tùy chọn">
                                <MoreVertical size={16} />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() =>
                                  toast({ variant: 'default', title: 'Đã gửi báo cáo bài đăng này' })
                                }
                              >
                                <Flag size={14} className="mr-2 text-neutral-400" />
                                <span>Báo cáo bài đăng</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Title & Swap Route Flow */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                    <div>
                      <div className="flex items-center gap-2">
                        <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
                          {offering.courseCode} · {offering.courseName}
                        </h1>
                      </div>
                      <div className="mt-2 flex items-center gap-3">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-neutral-50 dark:bg-neutral-800/80 rounded-lg border border-neutral-200 dark:border-neutral-700 font-mono text-base font-bold">
                          <span className="text-brand-700 dark:text-brand-300">{req.currentClassCode}</span>
                          <span className="text-neutral-400 font-sans">───────►</span>
                          <span className="text-emerald-700 dark:text-emerald-300">{req.targetClassCode}</span>
                        </div>
                      </div>
                    </div>

                    {/* Author Meta */}
                    <div className="flex items-center gap-3 text-xs bg-neutral-50/60 dark:bg-neutral-800/40 p-3 rounded-lg border border-neutral-100 dark:border-neutral-800">
                      <UserAvatar
                        user={{
                          id: ownerUser.id || req.studentId,
                          fullName: ownerUser.fullName || 'Người dùng',
                          avatarUrl: ownerUser.avatarUrl,
                        }}
                        size="md"
                      />
                      <div>
                        <span className="font-semibold text-neutral-900 dark:text-neutral-100 block">
                          {isOwner ? 'Yêu cầu của bạn' : ownerUser.fullName}
                        </span>
                        <span className="text-neutral-500 block text-[11px]">
                          {ownerUser.major || 'Kỹ thuật phần mềm'} · {ownerUser.cohort || 'K18'}
                        </span>
                        <span className="text-neutral-400 block text-[10px] mt-0.5">
                          Cập nhật: {formatDateTime(req.updatedAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main 2-Column Content */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* On mobile/tablet (<lg), Action Panel sits at top */}
                <div className="block lg:hidden order-1">
                  {isOwner ? (
                    <SwapOwnerPanel
                      request={req}
                      connections={connectionsQuery.data || []}
                      onReviewConnection={(conn) => setReviewConn(conn)}
                    />
                  ) : (
                    <SwapMatchPanel
                      partnerRequest={req}
                      partnerUser={ownerUser}
                      offering={offering as CourseOffering}
                      myRequestInSameOffering={myRequestInSameOffering}
                      connection={req.viewerContext?.connection}
                      onOpenSendInvite={() => setSendInviteDialogOpen(true)}
                      onOpenCreateReverse={() => setReverseReqDialogOpen(true)}
                      onOpenReviewInvite={() => {
                        if (req.viewerContext?.connection) {
                          setReviewConn(req.viewerContext.connection);
                        }
                      }}
                    />
                  )}
                </div>

                {/* Left Column (Desktop 8/12) */}
                <div className="order-2 lg:order-1 lg:col-span-7 xl:col-span-8 space-y-6">
                  {/* Weekly Schedule Grid */}
                  <Card className="border-neutral-200 dark:border-neutral-800">
                    <CardHeader className="pb-3 border-b border-neutral-100 dark:border-neutral-800">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-brand-600" />
                          <span>Lịch học tự khai</span>
                        </CardTitle>
                        <Badge variant="secondary" className="text-[11px] font-normal">
                          Định dạng 24h (07:00 – 22:00)
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                      {isOwner ? (
                        <WeeklyScheduleGrid
                          theirSchedule={req.schedule || []}
                          theirName="của bạn"
                        />
                      ) : (
                        <WeeklyScheduleGrid
                          theirSchedule={req.schedule || []}
                          mySchedule={myRequestInSameOffering?.schedule || []}
                          theirName={`của ${ownerUser.fullName?.split(' ').pop() || 'đối tác'}`}
                          myName="của bạn"
                        />
                      )}
                    </CardContent>
                  </Card>

                  {/* Note Card */}
                  <Card className="border-neutral-200 dark:border-neutral-800">
                    <CardHeader className="pb-3 border-b border-neutral-100 dark:border-neutral-800">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <FileText className="w-4 h-4 text-neutral-500" />
                        <span>Ghi chú của người đăng</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      {req.note ? (
                        <p className="text-xs text-neutral-800 dark:text-neutral-200 leading-relaxed italic whitespace-pre-line bg-neutral-50 dark:bg-neutral-900/60 p-3.5 rounded-lg border border-neutral-100 dark:border-neutral-800">
                          "{req.note}"
                        </p>
                      ) : (
                        <p className="text-xs text-neutral-400 italic">
                          Người đăng không để lại ghi chú thêm nào.
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Clarification Alert */}
                  <div className="flex items-start gap-3 p-3.5 rounded-lg bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500">
                    <AlertCircle className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
                    <p className="leading-relaxed">
                      SCS là nền tảng cộng đồng giúp kết nối nhu cầu giữa các sinh viên có nguyện vọng đổi lớp tương ứng. Nền tảng không thay đổi dữ liệu của nhà trường.
                    </p>
                  </div>
                </div>

                {/* Right Column (Desktop 4/12 or 5/12) */}
                <div className="hidden lg:block lg:order-2 lg:col-span-5 xl:col-span-4 sticky top-6">
                  {isOwner ? (
                    <SwapOwnerPanel
                      request={req}
                      connections={connectionsQuery.data || []}
                      onReviewConnection={(conn) => setReviewConn(conn)}
                    />
                  ) : (
                    <SwapMatchPanel
                      partnerRequest={req}
                      partnerUser={ownerUser}
                      offering={offering as CourseOffering}
                      myRequestInSameOffering={myRequestInSameOffering}
                      connection={req.viewerContext?.connection}
                      onOpenSendInvite={() => setSendInviteDialogOpen(true)}
                      onOpenCreateReverse={() => setReverseReqDialogOpen(true)}
                      onOpenReviewInvite={() => {
                        if (req.viewerContext?.connection) {
                          setReviewConn(req.viewerContext.connection);
                        }
                      }}
                    />
                  )}
                </div>
              </div>

              {/* Dialogs */}
              {/* 1. Sửa yêu cầu (chủ bài đăng) */}
              {editDialogOpen && (
                <SwapRequestDialog
                  open={editDialogOpen}
                  onOpenChange={setEditDialogOpen}
                  mode="edit"
                  initialData={req}
                  onSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: queryKeys.swap.detail(id) });
                    queryClient.invalidateQueries({ queryKey: queryKeys.swap.list() });
                  }}
                />
              )}

              {/* 2. Hủy yêu cầu (chủ bài đăng) */}
              <ConfirmDialog
                open={cancelDialogOpen}
                onOpenChange={setCancelDialogOpen}
                title="Hủy bài đăng đổi lớp"
                description={
                  pendingCount > 0
                    ? `Bạn đang có ${pendingCount} lời mời kết nối chờ phản hồi. Nếu hủy yêu cầu, tất cả lời mời này sẽ tự động bị từ chối/hủy bỏ. Bạn có chắc muốn tiếp tục?`
                    : 'Bạn có chắc chắn muốn hủy yêu cầu này không? Bài đăng sẽ chuyển sang trạng thái Đã hủy và không còn xuất hiện trong kết quả tìm kiếm.'
                }
                confirmLabel="Hủy bài đăng"
                danger={true}
                onConfirm={() => {
                  cancelMutation.mutate();
                }}
              />

              {/* 3. Gửi lời mời kết nối (người xem) */}
              {sendInviteDialogOpen && myRequestInSameOffering && (
                <SendSwapConnectionDialog
                  open={sendInviteDialogOpen}
                  onOpenChange={setSendInviteDialogOpen}
                  myRequest={myRequestInSameOffering}
                  partnerRequest={req}
                  onSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: queryKeys.swap.detail(id) });
                    queryClient.invalidateQueries({ queryKey: queryKeys.swap.connections({ requestId: id }) });
                  }}
                />
              )}

              {/* 4. Tạo yêu cầu ngược (người xem chưa có yêu cầu cùng môn) */}
              {reverseReqDialogOpen && (
                <SwapRequestDialog
                  open={reverseReqDialogOpen}
                  onOpenChange={setReverseReqDialogOpen}
                  mode="create"
                  initialData={{
                    offeringId: req.offeringId,
                    currentClassCode: req.targetClassCode,
                    targetClassCode: req.currentClassCode,
                  }}
                  onSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: queryKeys.swap.detail(id) });
                    queryClient.invalidateQueries({ queryKey: queryKeys.swap.list() });
                  }}
                />
              )}

              {/* 5. Xem & Phản hồi lời mời (Review Sheet) */}
              {reviewConn && (
                <SwapConnectionReviewSheet
                  open={!!reviewConn}
                  onOpenChange={(open) => !open && setReviewConn(null)}
                  connection={reviewConn}
                  requestA={req}
                  requestB={req}
                  onSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: queryKeys.swap.detail(id) });
                    queryClient.invalidateQueries({ queryKey: queryKeys.swap.connections({ requestId: id }) });
                  }}
                />
              )}
            </div>
          );
        }}
      </QueryBoundary>
    </div>
  );
}
