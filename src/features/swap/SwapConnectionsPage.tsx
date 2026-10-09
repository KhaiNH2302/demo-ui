import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/shared/PageHeader';
import { DisclaimerBanner } from '@/components/shared/DisclaimerBanner';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { QueryBoundary } from '@/components/shared/QueryBoundary';
import { EmptyState } from '@/components/shared/EmptyState';
import { SwapConnectionReviewSheet } from './SwapConnectionReviewSheet';
import { Card, CardContent } from '@/components/ui/Card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { Repeat2, ArrowRight } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { formatDateTime } from '@/lib/format';
import type { SwapConnectionDetails } from './swapTransactions';

export default function SwapConnectionsPage() {
  const [direction, setDirection] = useState<'incoming' | 'outgoing'>('incoming');
  const [activeReviewConn, setActiveReviewConn] = useState<SwapConnectionDetails | null>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const connectionsQuery = useQuery<SwapConnectionDetails[]>({
    queryKey: queryKeys.swap.connections({ direction }),
    queryFn: () => apiClient.get('/swap-connections', { params: { direction } }),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => apiClient.post(`/swap-connections/${id}/reject`),
    onSuccess: () => {
      toast({ variant: 'default', title: 'Đã thu hồi lời mời kết nối' });
      queryClient.invalidateQueries({ queryKey: ['swap'] });
      queryClient.invalidateQueries({ queryKey: ['swap-explore'] });
    },
    onError: (error) => toast({ variant: 'error', title: 'Không thể thu hồi lời mời', description: error.message }),
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <DisclaimerBanner />

      <PageHeader
        title="Lời mời kết nối đổi lớp"
        description="Theo dõi danh sách các lời mời đổi lớp nhận được và đã gửi"
        backHref="/swap"
      />

      <Tabs value={direction} onValueChange={(v) => setDirection(v as 'incoming' | 'outgoing')}>
        <TabsList>
          <TabsTrigger value="incoming">Lời mời nhận được</TabsTrigger>
          <TabsTrigger value="outgoing">Lời mời đã gửi</TabsTrigger>
        </TabsList>
      </Tabs>

      <QueryBoundary
        query={connectionsQuery}
        isEmpty={(data) => data.length === 0}
        empty={
          <EmptyState
            icon={Repeat2}
            title={direction === 'incoming' ? 'Chưa nhận được lời mời nào' : 'Bạn chưa gửi lời mời nào'}
            description="Hãy vào mục Tìm đối tác của bài đăng để gửi lời mời kết nối."
          />
        }
      >
        {(connections) => (
          <div className="space-y-3">
            {connections.map((conn) => {
              const reqA = conn.requestA;

              return (
                <Card key={conn.id} className="hover:border-neutral-300 transition-colors shadow-xs">
                  <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-neutral-900">
                          {reqA?.offeringId?.toUpperCase() || 'Môn học'}: {reqA?.currentClassCode} → {reqA?.targetClassCode}
                        </span>
                        <StatusBadge group="swapConnection" value={conn.status} />
                      </div>
                      <p className="text-[11px] text-neutral-400">
                        Thời gian: {formatDateTime(conn.createdAt)}
                      </p>
                      {conn.cancelReason && (
                        <p className="text-[11px] text-tier-danger-text">Lý do: {conn.cancelReason}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {direction === 'incoming' && conn.status === 'Pending' && (
                        <Button
                          size="sm"
                          onClick={() => setActiveReviewConn(conn)}
                        >
                          Xem & Phản hồi
                        </Button>
                      )}

                      {direction === 'outgoing' && conn.status === 'Pending' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-[#dc3c33] border-[#f7c9c7]"
                          onClick={() => cancelMutation.mutate(conn.id)}
                          loading={cancelMutation.isPending}
                        >
                          Thu hồi
                        </Button>
                      )}

                      {conn.status === 'Confirmed' && (
                        <Button size="sm" variant="outline" rightIcon={<ArrowRight size={14} />} onClick={() => navigate(conn.conversationId ? '/chats/' + conn.conversationId : '/chats')}>
                          Đến khung Chat
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </QueryBoundary>

      {activeReviewConn && (
        <SwapConnectionReviewSheet
          open={!!activeReviewConn}
          onOpenChange={(open) => !open && setActiveReviewConn(null)}
          connection={activeReviewConn}
          requestA={activeReviewConn.requestA}
          requestB={activeReviewConn.requestB}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['swap'] });
            queryClient.invalidateQueries({ queryKey: ['swap-explore'] });
          }}
        />
      )}
    </div>
  );
}
