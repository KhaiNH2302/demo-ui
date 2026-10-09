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
} from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
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
import type { ProgramChannel, ProgramRegistration } from '@/types/entities';

export const ProgramsExplorePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedTab = searchParams.get('tab') || 'explore';
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isGuest = !user;
  const isManager = Boolean(user?.roles.includes('event_manager'));
  const activeTab = selectedTab === 'organizing' && !isManager ? 'explore' : selectedTab;

  const [q, setQ] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [modeFilter, setModeFilter] = useState('all');
  const [costFilter, setCostFilter] = useState('all');

  const { data: programs = [], isLoading } = useQuery<ProgramChannel[]>({
    queryKey: ['programs', typeFilter, modeFilter, costFilter, q],
    queryFn: () =>
      apiClient.get(
        `/programs?type=${typeFilter}&mode=${modeFilter}&cost=${costFilter}&q=${encodeURIComponent(q)}`
      ),
  });

  const { data: myRegistrations = [] } = useQuery<ProgramRegistration[]>({
    queryKey: ['programs', 'registrations', 'me'],
    queryFn: () => apiClient.get('/programs/registrations/me'),
    enabled: !isGuest,
  });

  const { data: myOrganized = [] } = useQuery<ProgramChannel[]>({
    queryKey: ['programs', 'mine'],
    queryFn: () => apiClient.get('/programs?mine=true'),
    enabled: !isGuest && isManager,
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

  const displayedPrograms = programs;

  return (
    <div className="space-y-6">
      <PageHeader
        variant="band"
        icon={HeartHandshake}
        title="Hoạt động"
        description="Các chiến dịch tình nguyện vì cộng đồng và buổi chia sẻ kỹ năng do chính sinh viên trong trường khởi xướng, đã được Admin xác minh."
        actions={
          <div className="flex gap-2">{!isGuest && <Link to={isManager ? '/programs/new' : '/programs/proposals'}><Button variant="primary" leftIcon={<Plus className="h-4 w-4" />}>{isManager ? 'Tạo chương trình' : 'Đề xuất của tôi'}</Button></Link>}{isManager && <Link to="/programs/proposals/review"><Button variant="secondary">Xét duyệt đề xuất</Button></Link>}</div>
        }
      />

      <Tabs
        value={isGuest ? 'explore' : activeTab}
        onValueChange={(val) => setSearchParams({ tab: val })}
      >
        {!isGuest && (
          <TabsList>
            <TabsTrigger value="explore">
              Khám phá ({programs.length})
            </TabsTrigger>
            <TabsTrigger value="registrations">
              Đăng ký của tôi ({myRegistrations.length})
            </TabsTrigger>
            {isManager && <TabsTrigger value="organizing">Chương trình tôi quản lý ({myOrganized.length})</TabsTrigger>}
          </TabsList>
        )}

        {/* TAB 1: KHÁM PHÁ (PG1) */}
        <TabsContent value="explore" className="space-y-5">
          <Card className="p-4 flex flex-col md:flex-row items-stretch md:items-center gap-3">
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

                        <option value="Volunteer">Tình nguyện</option>
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

              <Select
                value={costFilter}
                onChange={(e) => setCostFilter(e.target.value)}
                className="w-44"
              >
                <option value="all">Tất cả chi phí</option>
                <option value="free">Miễn phí 100%</option>
              </Select>
            </div>
          </Card>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="h-56 animate-pulse bg-neutral-100" />
              ))}
            </div>
          ) : displayedPrograms.length === 0 ? (
            <EmptyState
              icon={HeartHandshake}
              title="Không tìm thấy chương trình phù hợp"
              description="Thử thay đổi bộ lọc hoặc gửi ý tưởng chương trình tại mục Đề xuất của tôi."
            />
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          {/* TAB 2: ĐĂNG KÝ CỦA TÔI (PG4) */}
          <TabsContent value="registrations" className="space-y-3">
            {myRegistrations.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="Bạn chưa đăng ký chương trình nào"
                description="Chọn một hoạt động tình nguyện hoặc buổi workshop ở tab Khám phá để tham gia."
              />
            ) : (
              myRegistrations.map((reg) => (
                <Card
                  key={reg.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-caption font-semibold text-brand-600">
                        {PROGRAM_TYPE_LABELS[reg.programType]}
                      </span>
                      {reg.slotName && (
                        <>
                          <span className="text-neutral-300">·</span>
                          <span className="text-caption font-medium text-neutral-600">
                            {reg.slotName}
                          </span>
                        </>
                      )}
                    </div>
                    <Link
                      to={`/programs/${reg.programId}`}
                      className="text-card-title text-neutral-900 hover:text-brand-600 block truncate"
                    >
                      {reg.programTitle}
                    </Link>
                    <div className="text-caption text-neutral-500 flex items-center gap-3 flex-wrap">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        Diễn ra:{' '}
                        {new Date(reg.programStartAt).toLocaleDateString('vi-VN', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })}
                      </span>
                      {reg.organizerName && <span>Tổ chức bởi: {reg.organizerName}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge group="programRegistration" status={reg.status} />
                    {(reg.status === 'Submitted' || reg.status === 'Confirmed') && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => withdrawRegMutation.mutate(reg.id)}
                      >
                        Hủy đăng ký
                      </Button>
                    )}
                    <Link to={`/programs/${reg.programId}`}>
                      <Button variant="secondary" size="sm">
                        Xem chương trình
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>

          {/* TAB 3: CHƯƠNG TRÌNH EVENT MANAGER QUẢN LÝ */}
          <TabsContent value="organizing" className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-card-title text-neutral-900">
                  Chương trình do bạn phụ trách
                </h3>
                <p className="text-caption text-neutral-500">
                  Event Manager trực tiếp tạo, công bố và quản lý chương trình.
                </p>
              </div>
              <Link to="/programs/new">
                <Button variant="primary" size="sm" leftIcon={<Plus className="h-4 w-4" />}>
                  Tạo chương trình
                </Button>
              </Link>
            </div>

            {myOrganized.length === 0 ? (
              <EmptyState
                icon={Users}
                title="Bạn chưa tổ chức kênh chương trình nào"
                description="Khởi xướng một chiến dịch tình nguyện hoặc buổi workshop chia sẻ kiến thức cho cộng đồng."
              />
            ) : (
              <div className="space-y-3">
                {myOrganized.map((prog) => (
                  <Card
                    key={prog.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-caption font-semibold text-brand-600">
                          {PROGRAM_TYPE_LABELS[prog.type]}
                        </span>
                        <span className="text-neutral-300">·</span>
                        <span className="text-caption text-neutral-500">
                          Event Manager phụ trách
                        </span>
                      </div>
                      <Link
                        to={`/programs/${prog.id}`}
                        className="text-card-title text-neutral-900 hover:text-brand-600 block truncate"
                      >
                        {prog.title}
                      </Link>
                      <div className="text-caption text-neutral-500 flex items-center gap-3">
                        <span>
                          Đã xác nhận: <strong>{prog.confirmedCount}/{prog.quota}</strong>
                        </span>
                        <span>
                          Diễn ra: {new Date(prog.startAt).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                      {prog.status === 'Rejected' && prog.rejectionReason && (
                        <p className="text-caption text-tier-danger-text mt-1">
                          Phản hồi từ Admin: {prog.rejectionReason}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <StatusBadge group="programChannel" status={prog.status} />
                      <Link to={`/programs/${prog.id}/edit`}>
                        <Button variant="ghost" size="sm">
                          Chỉnh sửa
                        </Button>
                      </Link>
                      <Link to={`/programs/manage/${prog.id}`}>
                        <Button
                          variant="primary"
                          size="sm"
                          leftIcon={<Settings className="h-3.5 w-3.5" />}
                        >
                          Quản lý kênh
                        </Button>
                      </Link>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProgramsExplorePage;
