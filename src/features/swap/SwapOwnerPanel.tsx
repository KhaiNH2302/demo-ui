import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useToast } from '@/components/ui/Toast';
import {
  MessageSquare,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  AlertTriangle,
  Send,
  ExternalLink,
} from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { formatDateTime } from '@/lib/format';
import { seedUsers } from '@/mocks/data/users';
import type { SwapRequest, SwapConnection, AiSwapMatch } from '@/types/entities';

interface SwapOwnerPanelProps {
  request: SwapRequest;
  connections: SwapConnection[];
  onReviewConnection: (conn: SwapConnection) => void;
  onCancelConnection?: (connId: string) => void;
}

export const SwapOwnerPanel: React.FC<SwapOwnerPanelProps> = ({
  request,
  connections,
  onReviewConnection,
  onCancelConnection,
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'incoming' | 'outgoing'>('incoming');

  // Query top 3 AI matches for owner
  const matchesQuery = useQuery<{
    aiMatches: AiSwapMatch[];
    requests: SwapRequest[];
  }>({
    queryKey: ['swap', 'matches', 'top3', request.id],
    queryFn: async () => {
      try {
        const [aiRes, allReqsRes] = await Promise.all([
          apiClient.get<AiSwapMatch[]>(`/swap-requests/${request.id}/matches?mode=ai`),
          apiClient.get<SwapRequest[]>('/swap-requests'),
        ]);
        return {
          aiMatches: aiRes || [],
          requests: allReqsRes || [],
        };
      } catch {
        return { aiMatches: [], requests: [] };
      }
    },
    enabled: request.status === 'Open',
  });

  const cancelMutation = useMutation({
    mutationFn: (connId: string) => apiClient.post(`/swap-connections/${connId}/reject`),
    onSuccess: () => {
      toast({ variant: 'default', title: 'Đã thu hồi lời mời kết nối' });
      queryClient.invalidateQueries({ queryKey: queryKeys.swap.connections({ requestId: request.id }) });
      queryClient.invalidateQueries({ queryKey: queryKeys.swap.detail(request.id) });
    },
  });

  // Filter incoming vs outgoing
  const incoming = connections.filter((c) => c.requestBId === request.id);
  const outgoing = connections.filter((c) => c.requestAId === request.id);

  // If status === 'Connected'
  if (request.status === 'Connected') {
    const confirmedConn = connections.find((c) => c.status === 'Confirmed');
    const partnerId = confirmedConn
      ? confirmedConn.initiatorId === request.studentId
        ? confirmedConn.recipientId
        : confirmedConn.initiatorId
      : 'usr_student_02';

    const partnerUser = seedUsers.find((u) => u.id === partnerId) || {
      id: partnerId,
      fullName: 'Đối tác đổi lớp',
      major: 'Kỹ thuật phần mềm',
      cohort: 'K18',
    };

    return (
      <div className="space-y-4">
        <Card className="border-emerald-200 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-950/20">
          <CardHeader className="pb-3 border-b border-emerald-100 dark:border-emerald-900/60">
            <CardTitle className="text-sm font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>Đã kết nối thành công</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="flex items-center gap-3 p-3 bg-surface rounded-lg border border-neutral-200">
              <UserAvatar user={partnerUser} size="md" />
              <div className="min-w-0 flex-1">
                <span className="font-semibold text-sm text-neutral-900 dark:text-neutral-100 block truncate">
                  {partnerUser.fullName}
                </span>
                <span className="text-xs text-neutral-500 block truncate">
                  {partnerUser.major} · {partnerUser.cohort}
                </span>
              </div>
            </div>

            <Button
              className="w-full"
              leftIcon={<MessageSquare className="w-4 h-4" />}
              onClick={() => navigate(`/chats?user=${partnerId}`)}
            >
              Mở hộp chat trao đổi
            </Button>

            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 space-y-1">
              <div className="font-semibold flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Nhắc nhở học vụ quan trọng:</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                SCS không tự động cập nhật lịch học với nhà trường. Hai bạn vui lòng chủ động làm thủ tục chuyển lớp chính thức trên cổng Dịch vụ sinh viên (Academic Portal) trước hạn chót.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If status === 'Cancelled'
  if (request.status === 'Cancelled') {
    return (
      <Card className="border-neutral-200 dark:border-neutral-800">
        <CardContent className="pt-6 text-center space-y-3">
          <Badge variant="neutral" className="px-3 py-1 text-xs">
            Bài đăng đã đóng / Đã hủy
          </Badge>
          <p className="text-xs text-neutral-500">
            Yêu cầu này đã được bạn hủy hoặc chuyển lớp thành công. Bạn không thể thực hiện thêm thao tác kết nối nào.
          </p>
          <Link to="/swap?create=1" className="inline-block pt-2">
            <Button size="sm" variant="outline">
              Tạo yêu cầu đổi lớp mới
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  // Open status: connections & suggestions
  const top3Suggestions = (matchesQuery.data?.aiMatches || []).slice(0, 3).map((match) => {
    const partnerReq = matchesQuery.data?.requests.find((r) => r.id === match.requestId);
    const partnerUser = partnerReq
      ? seedUsers.find((u) => u.id === partnerReq.studentId) || {
          id: partnerReq.studentId,
          fullName: 'Sinh viên FPT',
          cohort: 'K18',
        }
      : null;
    return {
      match,
      partnerReq,
      partnerUser,
    };
  }).filter((s) => s.partnerReq != null);

  return (
    <div className="space-y-5">
      {/* 1. LỜI MỜI KẾT NỐI */}
      <Card className="border-neutral-200 dark:border-neutral-800">
        <CardHeader className="pb-2 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider text-[11px]">
              Lời mời kết nối
            </CardTitle>
            <Link
              to="/swap/connections"
              className="text-[11px] text-brand-600 hover:text-brand-700 dark:text-brand-400 font-medium inline-flex items-center gap-0.5"
            >
              <span>Xem tất cả</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </CardHeader>

        <CardContent className="pt-3 space-y-3">
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as 'incoming' | 'outgoing')}
            className="w-full"
          >
            <TabsList className="w-full grid grid-cols-2 h-8 text-xs">
              <TabsTrigger value="incoming" className="text-xs">
                Nhận được ({incoming.length})
              </TabsTrigger>
              <TabsTrigger value="outgoing" className="text-xs">
                Đã gửi ({outgoing.length})
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {activeTab === 'incoming' && (
            <div className="space-y-2 pt-1">
              {incoming.length === 0 ? (
                <p className="text-xs text-neutral-400 text-center py-4 italic">
                  Chưa nhận được lời mời nào cho bài đăng này
                </p>
              ) : (
                incoming.map((conn) => {
                  const sender = seedUsers.find((u) => u.id === conn.initiatorId) || {
                    id: conn.initiatorId,
                    fullName: 'Sinh viên FPT',
                    avatarUrl: undefined,
                  };
                  return (
                    <div
                      key={conn.id}
                      className="p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/40 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <UserAvatar user={sender} size="sm" />
                          <div className="min-w-0">
                            <span className="font-semibold text-xs text-neutral-900 dark:text-neutral-100 block truncate">
                              {sender.fullName}
                            </span>
                            <span className="text-[10px] text-neutral-400 block">
                              {formatDateTime(conn.createdAt)}
                            </span>
                          </div>
                        </div>
                        <StatusBadge group="swapConnection" value={conn.status} />
                      </div>

                      {conn.message && (
                        <p className="text-[11px] text-neutral-600 dark:text-neutral-300 italic line-clamp-2 bg-neutral-100 p-2 rounded border border-neutral-200">
                          "{conn.message}"
                        </p>
                      )}

                      {conn.status === 'Pending' && (
                        <Button
                          size="sm"
                          className="w-full mt-1 h-7 text-xs"
                          onClick={() => onReviewConnection(conn)}
                        >
                          Xem &amp; Phản hồi
                        </Button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {activeTab === 'outgoing' && (
            <div className="space-y-2 pt-1">
              {outgoing.length === 0 ? (
                <p className="text-xs text-neutral-400 text-center py-4 italic">
                  Bạn chưa gửi lời mời nào từ bài đăng này
                </p>
              ) : (
                outgoing.map((conn) => {
                  const recipient = seedUsers.find((u) => u.id === conn.recipientId) || {
                    id: conn.recipientId,
                    fullName: 'Sinh viên FPT',
                    avatarUrl: undefined,
                  };
                  return (
                    <div
                      key={conn.id}
                      className="p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/40 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <UserAvatar user={recipient} size="sm" />
                          <div className="min-w-0">
                            <span className="font-semibold text-xs text-neutral-900 dark:text-neutral-100 block truncate">
                              {recipient.fullName}
                            </span>
                            <span className="text-[10px] text-neutral-400 block">
                              {formatDateTime(conn.createdAt)}
                            </span>
                          </div>
                        </div>
                        <StatusBadge group="swapConnection" value={conn.status} />
                      </div>

                      {conn.status === 'Pending' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full mt-1 h-7 text-xs text-tier-danger-text border-tier-danger-border hover:bg-tier-danger-bg"
                          onClick={() => {
                            if (onCancelConnection) {
                              onCancelConnection(conn.id);
                            } else {
                              cancelMutation.mutate(conn.id);
                            }
                          }}
                          loading={cancelMutation.isPending}
                        >
                          Thu hồi lời mời
                        </Button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 2. GỢI Ý ĐỐI TÁC (TOP 3) */}
      <Card className="border-neutral-200 dark:border-neutral-800">
        <CardHeader className="pb-2 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Gợi ý đối tác (Top 3)</span>
            </CardTitle>
            <Link
              to={`/swap?for=${request.id}`}
              className="text-[11px] text-brand-600 hover:text-brand-700 dark:text-brand-400 font-medium inline-flex items-center gap-0.5"
            >
              <span>Xem tất cả</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </CardHeader>

        <CardContent className="pt-3 space-y-2.5">
          {top3Suggestions.length === 0 ? (
            <p className="text-xs text-neutral-400 text-center py-4 italic">
              Chưa có gợi ý đối tác phù hợp cho môn này
            </p>
          ) : (
            top3Suggestions.map(({ match, partnerReq, partnerUser }) => {
              if (!partnerReq || !partnerUser) return null;
              const isPerfect =
                partnerReq.currentClassCode === request.targetClassCode &&
                partnerReq.targetClassCode === request.currentClassCode;

              return (
                <div
                  key={partnerReq.id}
                  className="p-3 rounded-lg border border-neutral-200 hover:border-brand-400 transition-all bg-surface flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-neutral-900 dark:text-neutral-100 truncate">
                        {partnerUser.fullName}
                      </span>
                      {isPerfect ? (
                        <Badge variant="success" className="text-[10px] py-0 px-1 font-normal shrink-0">
                          ★ 96%
                        </Badge>
                      ) : (
                        <Badge variant="brand" className="text-[10px] py-0 px-1 font-normal shrink-0">
                          ◐ {match.score}%
                        </Badge>
                      )}
                    </div>
                    <div className="font-mono text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">
                      <span className="text-brand-700 dark:text-brand-300 font-semibold">{partnerReq.currentClassCode}</span>
                      <span className="mx-1 text-neutral-400">→</span>
                      <span className="text-emerald-700 dark:text-emerald-300 font-semibold">{partnerReq.targetClassCode}</span>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs px-2.5 shrink-0"
                    onClick={() => navigate(`/swap/${partnerReq.id}`)}
                  >
                    Xem
                  </Button>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
};
