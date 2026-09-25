import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/shared/PageHeader';
import { DisclaimerBanner } from '@/components/shared/DisclaimerBanner';
import { AIFallbackBanner } from '@/components/shared/AIFallbackBanner';
import { AIResultCard } from '@/components/shared/AIResultCard';
import { ScheduleCompare } from '@/components/shared/ScheduleCompare';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { SendSwapConnectionDialog } from './SendSwapConnectionDialog';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { Sparkles, Users, Send, Eye, CheckCircle2 } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import type { SwapRequest, AiSwapMatch } from '@/types/entities';

export default function SwapMatchPage() {
  const { id = 'swap_req_01' } = useParams<{ id: string }>();
  const [matchMode, setMatchMode] = useState<'direct' | 'ai'>('ai');
  const [selectedPartnerReq, setSelectedPartnerReq] = useState<SwapRequest | null>(null);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [activeDetailReq, setActiveDetailReq] = useState<SwapRequest | null>(null);

  const myRequestQuery = useQuery<SwapRequest>({
    queryKey: queryKeys.swap.detail(id),
    queryFn: () => apiClient.get(`/swap-requests/${id}`),
  });

  const matchesQuery = useQuery<any>({
    queryKey: queryKeys.swap.matches(id, matchMode),
    queryFn: () => apiClient.get(`/swap-requests/${id}/matches`, { params: { mode: matchMode } }),
  });

  // Always fetch all direct requests so we have full SwapRequest data when mode is AI
  const allDirectQuery = useQuery<SwapRequest[]>({
    queryKey: queryKeys.swap.matches(id, 'direct'),
    queryFn: () => apiClient.get(`/swap-requests/${id}/matches`, { params: { mode: 'direct' } }),
  });

  const myReq = myRequestQuery.data;
  const isAiMode = matchMode === 'ai';
  const isAiFailed = isAiMode && matchesQuery.isError;

  return (
    <div className="space-y-6">
      <DisclaimerBanner />

      <PageHeader
        title={`Tìm đối tác đổi lớp — ${myReq?.offeringId.toUpperCase() || 'Môn học'}`}
        description={`Lớp của bạn: ${myReq?.currentClassCode || ''} → Muốn đổi sang: ${myReq?.targetClassCode || ''}`}
        backHref={`/swap/${id}`}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Tabs value={matchMode} onValueChange={(val) => setMatchMode(val as 'direct' | 'ai')}>
          <TabsList>
            <TabsTrigger value="ai" className="gap-1.5 font-semibold">
              <Sparkles size={14} className="text-brand-600" /> Gợi ý bởi AI
            </TabsTrigger>
            <TabsTrigger value="direct" className="gap-1.5">
              <Users size={14} /> Tìm trực tiếp
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <AIFallbackBanner visible={isAiFailed} />

      {matchesQuery.isLoading ? (
        <LoadingSkeleton variant="card" count={3} />
      ) : (
        (() => {
          const directItems: SwapRequest[] = isAiFailed ? allDirectQuery.data || [] : isAiMode ? [] : matchesQuery.data || [];
          const aiItems: AiSwapMatch[] = isAiMode && !isAiFailed ? matchesQuery.data || [] : [];

          const totalResults = isAiMode && !isAiFailed ? aiItems.length : directItems.length;

          if (totalResults === 0) {
            return (
              <EmptyState
                icon={Users}
                title="Chưa tìm thấy đối tác phù hợp"
                description="Hiện chưa có sinh viên nào có nhu cầu đổi lớp tương ứng với môn học này. Hãy thử lại sau nhé!"
              />
            );
          }

          if (isAiMode && !isAiFailed) {
            return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {aiItems.map((match) => {
                  const partnerReq = allDirectQuery.data?.find((r) => r.id === match.requestId);
                  if (!partnerReq || !myReq) return null;

                  const isPerfect =
                    partnerReq.currentClassCode === myReq.targetClassCode &&
                    partnerReq.targetClassCode === myReq.currentClassCode;

                  return (
                    <AIResultCard key={match.requestId} score={match.score} reasons={match.reasons}>
                      <Card className="border-0 shadow-none bg-transparent">
                        <CardHeader className="p-0 pb-3">
                          <div className="flex items-center justify-between w-full">
                            <div className="font-bold text-sm text-neutral-900">
                              Lớp đối tác: {partnerReq.currentClassCode} → {partnerReq.targetClassCode}
                            </div>
                            {isPerfect && (
                              <Badge tier="success" size="sm" dot>
                                Đối ứng hoàn hảo
                              </Badge>
                            )}
                          </div>
                        </CardHeader>

                        <CardContent className="p-0 pb-3">
                          <ScheduleCompare
                            labelA="Lịch của bạn"
                            slotsA={myReq.schedule || []}
                            labelB="Lịch của đối tác"
                            slotsB={partnerReq.schedule || []}
                          />
                        </CardContent>

                        <CardFooter className="p-0 pt-2 flex justify-between border-0">
                          <Button
                            variant="outline"
                            size="sm"
                            leftIcon={<Eye size={14} />}
                            onClick={() => {
                              setActiveDetailReq(partnerReq);
                              setDetailDialogOpen(true);
                            }}
                          >
                            Xem chi tiết
                          </Button>
                          <Button
                            size="sm"
                            leftIcon={<Send size={14} />}
                            onClick={() => {
                              setSelectedPartnerReq(partnerReq);
                              setSendDialogOpen(true);
                            }}
                          >
                            Gửi lời mời
                          </Button>
                        </CardFooter>
                      </Card>
                    </AIResultCard>
                  );
                })}
              </div>
            );
          }

          // Direct list
          return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {directItems.map((partnerReq) => {
                if (!myReq) return null;
                const isPerfect =
                  partnerReq.currentClassCode === myReq.targetClassCode &&
                  partnerReq.targetClassCode === myReq.currentClassCode;

                return (
                  <Card key={partnerReq.id} className="p-4 space-y-3">
                    <CardHeader className="p-0 pb-2">
                      <div className="flex items-center justify-between w-full">
                        <div className="font-bold text-sm text-neutral-900">
                          Mã lớp: {partnerReq.currentClassCode} → {partnerReq.targetClassCode}
                        </div>
                        {isPerfect && (
                          <Badge tier="success" size="sm" dot>
                            Đối ứng hoàn hảo
                          </Badge>
                        )}
                      </div>
                    </CardHeader>

                    <CardContent className="p-0">
                      <ScheduleCompare
                        labelA="Lịch của bạn"
                        slotsA={myReq.schedule || []}
                        labelB="Lịch của đối tác"
                        slotsB={partnerReq.schedule || []}
                      />
                    </CardContent>

                    <CardFooter className="p-0 pt-3 flex justify-between border-t border-neutral-100">
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<Eye size={14} />}
                        onClick={() => {
                          setActiveDetailReq(partnerReq);
                          setDetailDialogOpen(true);
                        }}
                      >
                        Xem chi tiết
                      </Button>
                      <Button
                        size="sm"
                        leftIcon={<Send size={14} />}
                        onClick={() => {
                          setSelectedPartnerReq(partnerReq);
                          setSendDialogOpen(true);
                        }}
                      >
                        Gửi lời mời
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          );
        })()
      )}

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent size="md">
          <DialogHeader>
            <DialogTitle>Chi tiết đối tác đổi lớp</DialogTitle>
          </DialogHeader>

          {activeDetailReq && myReq && (
            <div className="space-y-4">
              <div className="rounded-lg bg-neutral-50 p-3 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Môn học:</span>
                  <span className="font-bold">{activeDetailReq.offeringId.toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Lớp hiện tại đối tác có:</span>
                  <span className="font-bold">{activeDetailReq.currentClassCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Lớp đối tác muốn đổi sang:</span>
                  <span className="font-bold text-brand-600">{activeDetailReq.targetClassCode}</span>
                </div>
              </div>

              <ScheduleCompare
                labelA="Lịch của bạn"
                slotsA={myReq.schedule || []}
                labelB="Lịch của đối tác"
                slotsB={activeDetailReq.schedule || []}
              />
            </div>
          )}

          <DialogFooter className="justify-between">
            <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>
              Đóng
            </Button>
            {activeDetailReq && (
              <Button
                leftIcon={<Send size={14} />}
                onClick={() => {
                  setDetailDialogOpen(false);
                  setSelectedPartnerReq(activeDetailReq);
                  setSendDialogOpen(true);
                }}
              >
                Gửi lời mời ngay
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send connection dialog */}
      {selectedPartnerReq && myReq && (
        <SendSwapConnectionDialog
          open={sendDialogOpen}
          onOpenChange={setSendDialogOpen}
          myRequest={myReq}
          partnerRequest={selectedPartnerReq}
          onSuccess={() => {
            // refreshed
          }}
        />
      )}
    </div>
  );
}
