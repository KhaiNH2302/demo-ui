import { ProgramProposalsPage } from './ProgramProposalsPage';
import { programUnlimited } from './rules';
import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  FileText,
  HeartHandshake,
  Plus,
  Search,
  Settings,
  Users,
  MessageSquare,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { EmptyState } from '@/components/shared/EmptyState';
import { LimitNotice } from '@/components/shared/LimitNotice';
import { ProgramCard, PROGRAM_TYPE_LABELS } from '@/components/shared/ProgramCard';
import { apiClient } from '@/lib/apiClient';
import { useAuthStore } from '@/store/authStore';
import { toast } from '@/components/ui/Toast';
import type { ProgramChannel, ProgramRegistration, ProgramProposal } from '@/types/entities';

export const ProgramsExplorePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedTab = searchParams.get('tab') || 'explore';
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isGuest = !user;
  const isManager = Boolean(user?.roles.includes('event_manager'));
  const canPropose = Boolean(user?.roles.some(r => r.toLowerCase() === 'student' || r === 'club_rep'));
  const activeTab = ['explore','registrations', ...(canPropose && !isManager ? ['proposals'] : [])].includes(selectedTab) ? selectedTab : 'explore';
  const { data: proposals = [] } = useQuery<ProgramProposal[]>({queryKey: ['program-proposals', isManager ? 'review' : user?.id], queryFn: () => apiClient.get(`/programs/proposals${isManager ? '?review=true' : ''}`), enabled: Boolean(user) && (canPropose && !isManager)});

  const [q, setQ] = useState('');
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState('all');
  const [modeFilter, setModeFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const { data: programs = [], isLoading } = useQuery<ProgramChannel[]>({
    queryKey: ['programs', typeFilter, modeFilter, q],
    queryFn: () =>
      apiClient.get(
        `/programs?type=${typeFilter}&mode=${modeFilter}&q=${encodeURIComponent(q)}`
      ),
  });

  const { data: myRegistrations = [] } = useQuery<ProgramRegistration[]>({
    queryKey: ['programs', 'registrations', 'me'],
    queryFn: () => apiClient.get('/programs/registrations/me'),
    enabled: !isGuest,
  });

  const withdrawRegMutation = useMutation({
    mutationFn: (regId: string) =>
      apiClient.put(`/programs/registrations/${regId}`, { action: 'withdraw' }),
    onError: (error: Error) => toast.error(error.message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs', 'registrations', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      queryClient.invalidateQueries({ queryKey: ['program'] });
      toast.success('Đã hủy đăng ký tham gia chương trình');
    },
  });

  const myRegMap = new Map(
    myRegistrations
      .filter((r) => r.status !== 'Withdrawn')
      .map((r) => [r.programId, r])
  );

  const displayedPrograms = programs.filter(p => {
    const from = dateFrom ? new Date(`${dateFrom}T00:00:00`).getTime() : -Infinity;
    const to = dateTo ? new Date(`${dateTo}T23:59:59.999`).getTime() : Infinity;
    const overlapsDates = Date.parse(p.startAt) <= to && Date.parse(p.endAt || p.startAt) >= from;
    const available = p.status === 'Published' && Date.parse(p.registrationDeadline) > Date.now() && (programUnlimited(p) || p.confirmedCount < p.quota);
    return overlapsDates && (!onlyOpen || available);
  });

  return (
    <div className="space-y-6">


      <Tabs
        value={isGuest ? 'explore' : activeTab}
        onValueChange={(val) => setSearchParams({ tab: val })}
      >
        {!isGuest && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200"><TabsList className="w-auto min-w-0 flex-1 border-b-0 overflow-x-auto">
            <TabsTrigger value="explore">
              Khám phá ({programs.length})
            </TabsTrigger>
            <TabsTrigger value="registrations">
              Đăng ký của tôi ({myRegistrations.length})
            </TabsTrigger>
            {(canPropose && !isManager) && <TabsTrigger value="proposals">Đề xuất ({isManager ? proposals.filter(p => p.status === 'PendingReview').length : proposals.length})</TabsTrigger>}
          </TabsList></div>
        )}

        <TabsContent value="explore" className="space-y-5">
          <Card className="p-4 space-y-4" aria-label="Bộ lọc hoạt động">
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
            <div className="relative flex-1">
              <Search className="h-4 w-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Tìm kiếm chiến dịch tình nguyện, chủ đề workshop, người tổ chức..."
                className="pl-9"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <Select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-40"
              >
                <option value="all">Tất cả loại kênh</option>

                        <option value="Event">Sự kiện CLB</option><option value="Volunteer">Tình nguyện</option>
                <option value="Workshop">Workshop</option>
              </Select>

              <Select
                value={modeFilter}
                onChange={(e) => setModeFilter(e.target.value)}
                className="w-40"
              >
                <option value="all">Mọi hình thức</option>
                <option value="Offline">Offline</option>
                <option value="Online">Online</option>
                <option value="Hybrid">Hybrid</option>
              </Select>
            </div>
            </div>

          <div className="flex flex-wrap items-end gap-3 text-sm">
            <span className="self-center font-medium text-neutral-700">Thời gian diễn ra</span>
            <label className="space-y-1"><span className="block text-xs text-neutral-500">Từ ngày</span><Input type="date" aria-label="Thời gian diễn ra từ ngày" value={dateFrom} max={dateTo || undefined} onChange={e => setDateFrom(e.target.value)} /></label>
            <label className="space-y-1"><span className="block text-xs text-neutral-500">Đến ngày</span><Input type="date" aria-label="Thời gian diễn ra đến ngày" value={dateTo} min={dateFrom || undefined} onChange={e => setDateTo(e.target.value)} /></label>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
            <label className="flex items-center gap-2"><input type="checkbox" checked={onlyOpen} onChange={e => setOnlyOpen(e.target.checked)} />Chỉ hiện hoạt động còn chỗ và chưa hết hạn</label>
            <Button type="button" variant="primary" size="sm" onClick={() => { setQ(''); setTypeFilter('all'); setModeFilter('all'); setOnlyOpen(false); setDateFrom(''); setDateTo(''); }}>Xóa bộ lọc</Button>
          </div>
          </Card>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 auto-rows-fr gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="h-56 animate-pulse bg-neutral-100" />
              ))}
            </div>
          ) : displayedPrograms.length === 0 ? (
            <EmptyState
              icon={HeartHandshake}
              title="Không tìm thấy chương trình phù hợp"
              description="Thử thay đổi bộ lọc hoặc gửi ý tưởng chương trình tại tab Đề xuất."
            />
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 auto-rows-fr gap-4">
                {displayedPrograms.map((prog) => {
                  const myReg = myRegMap.get(prog.id);
                  return (
                    <ProgramCard
                      key={prog.id}
                      program={prog}
                      myRegistrationStatus={myReg?.status}
                    />
                  );
                })}
              </div>
              <LimitNotice noun="chương trình" count={displayedPrograms.length} />
            </>
          )}
        </TabsContent>

          <TabsContent value="proposals">{(canPropose && !isManager) && <ProgramProposalsPage review={isManager} embedded />}</TabsContent>

          {/* TAB 2: ĐĂNG KÝ CỦA TÔI (PG4) */}
          <TabsContent value="registrations" className="space-y-3">
            {myRegistrations.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="Bạn chưa đăng ký chương trình nào"
                description="Chọn một hoạt động tình nguyện hoặc buổi workshop ở tab Khám phá để tham gia."
              />
            ) : (
              myRegistrations.map((reg) => {
                const isConfirmed = reg.status === 'Confirmed';
                const isOffered = (reg.status as string) === 'Offered';
                const isWaitlisted = (reg.status as string) === 'Waitlisted';
                const isPending = reg.status === 'Submitted' || (reg.status as string) === 'PendingReview';

                return (
                  <Card
                    key={reg.id}
                    className="p-4 sm:p-5 flex flex-col gap-3.5 hover:border-neutral-300 transition-colors bg-surface shadow-2xs"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-caption font-semibold text-brand-600 bg-brand-50 px-2 py-0.5 rounded">
                            {PROGRAM_TYPE_LABELS[reg.programType]}
                          </span>
                          {reg.slotName && (
                            <span className="text-caption font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                              Ca: {reg.slotName}
                            </span>
                          )}
                          <span className="text-neutral-300">·</span>
                          <span className="text-caption text-neutral-500">
                            Diễn ra: {new Date(reg.programStartAt).toLocaleDateString('vi-VN')}
                          </span>
                        </div>

                        <Link
                          to={`/programs/${reg.programId}`}
                          className="text-base font-bold text-neutral-900 hover:text-brand-600 block truncate"
                        >
                          {reg.programTitle}
                        </Link>

                        <div className="text-caption text-neutral-500 flex items-center gap-3">
                          {reg.organizerName && <span>Người phụ trách: <strong>{reg.organizerName}</strong></span>}
                        </div>
                      </div>

                      {/* Status Badge with Explicit Vietnamese Text */}
                      <div className="shrink-0 flex items-center gap-2">
                        {isPending && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                            <Clock size={13} className="text-amber-600" /> Chờ xét hồ sơ
                          </span>
                        )}
                        {isWaitlisted && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-800 border border-purple-200">
                            <Users size={13} className="text-purple-600" /> Chờ có chỗ (Waitlisted)
                          </span>
                        )}
                        {isOffered && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200 animate-pulse">
                            <AlertCircle size={13} className="text-blue-600" /> Được mời nhận chỗ
                          </span>
                        )}
                        {isConfirmed && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 size={13} className="text-emerald-600" /> Đã xác nhận (Đã giữ chỗ)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Context Specific Policy Box */}
                    {isPending && (
                      <div className="p-2.5 rounded-lg bg-amber-50/60 border border-amber-200 text-xs text-amber-900 flex items-center justify-between gap-2">
                        <span>
                          <strong>Chưa giữ chỗ chính thức:</strong> Đơn đăng ký của bạn đang được Ban tổ chức xem xét duyệt theo tiêu chí của chương trình.
                        </span>
                      </div>
                    )}

                    {isWaitlisted && (
                      <div className="p-2.5 rounded-lg bg-purple-50/60 border border-purple-200 text-xs text-purple-900 flex items-center justify-between gap-2">
                        <span>
                          <strong>Hàng chờ có thứ tự ưu tiên:</strong> Bạn đang ở trong danh sách chờ. Khi có bạn khác rút đơn, hệ thống sẽ tự động gửi lời mời nhận chỗ cho bạn.
                        </span>
                      </div>
                    )}

                    {isOffered && (
                      <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-center justify-between gap-2">
                        <span>
                          🎉 <strong>Suất tham gia bổ sung:</strong> Bạn có 24 giờ để bấm [Nhận chỗ] trước khi suất này được chuyển cho người tiếp theo trong hàng chờ.
                        </span>
                      </div>
                    )}

                    {isConfirmed && (
                      <div className="p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between gap-2">
                        <span>
                          ✅ <strong>Ca đã chốt:</strong> {reg.slotName || 'Toàn thời gian'}. Vui lòng có mặt đúng giờ và làm theo hướng dẫn của Ban tổ chức.
                        </span>
                      </div>
                    )}

                    {/* Action Buttons Row */}
                    <div className="flex items-center justify-between pt-2 border-t border-neutral-100 text-xs gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <Link to={`/programs/${reg.programId}`}>
                          <Button variant="outline" size="sm">
                            Xem chương trình
                          </Button>
                        </Link>
                        {reg.organizerName && (
                          <Link to={isConfirmed ? `/chats/program-group-${reg.programId}` : "/chats"}>
                            <Button variant="ghost" size="sm" leftIcon={<MessageSquare size={13} />}>
                              {isConfirmed ? 'Nhóm hoạt động' : 'Nhắn tin BTC'}
                            </Button>
                          </Link>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {isPending && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:bg-red-50"
                            onClick={() => withdrawRegMutation.mutate(reg.id)}
                          >
                            Rút đơn đăng ký
                          </Button>
                        )}

                        {isWaitlisted && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-neutral-600 hover:bg-neutral-100"
                            onClick={() => withdrawRegMutation.mutate(reg.id)}
                          >
                            Rời hàng chờ
                          </Button>
                        )}

                        {isOffered && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => withdrawRegMutation.mutate(reg.id)}
                            >
                              Từ chối
                            </Button>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => {
                                toast.success('Đã nhận suất tham gia chương trình thành công!');
                                queryClient.invalidateQueries({ queryKey: ['programs', 'registrations', 'me'] });
                              }}
                            >
                              Nhận chỗ ngay
                            </Button>
                          </>
                        )}


                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </TabsContent>

      </Tabs>


    </div>
  );
};

export default ProgramsExplorePage;
