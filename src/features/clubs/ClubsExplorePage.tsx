import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Building2,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  Calendar,
  FileText,
  Bell,
  Bookmark,
  Check,
  Filter,
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
import { OpportunityCard, OPPORTUNITY_TYPE_LABELS } from '@/components/shared/OpportunityCard';
import { apiClient } from '@/lib/apiClient';
import { useAuthStore } from '@/store/authStore';
import { toast } from '@/components/ui/Toast';
import type {
  Club,
  ClubOpportunity,
  OpportunityResponse,
  ClubCategory,
} from '@/types/entities';

const CATEGORY_LABELS: Record<ClubCategory, string> = {
  Tech: 'Công nghệ & Lập trình',
  Academic: 'Học thuật & Ngôn ngữ',
  Media: 'Truyền thông & Nhiếp ảnh',
  Art: 'Nghệ thuật & Âm nhạc',
  Sports: 'Thể thao & Cờ',
  Volunteer: 'Tình nguyện & Xã hội',
};

export const ClubsExplorePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'opportunities';
  const { user, representedClubs } = useAuthStore();
  const isGuest = !user;
  const hasRepClub = representedClubs.length > 0;

  const [q, setQ] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [deptFilter, setDeptFilter] = useState<string>('all');
  const [durationFilter, setDurationFilter] = useState<string>('all');
  const [followedClubs, setFollowedClubs] = useState<Set<string>>(new Set(['club_01']));

  const toggleFollowClub = (clubId: string, clubName: string) => {
    setFollowedClubs((prev) => {
      const next = new Set(prev);
      if (next.has(clubId)) {
        next.delete(clubId);
        toast.info(`Đã hủy theo dõi CLB "${clubName}"`);
      } else {
        next.add(clubId);
        toast.success(`🎉 Đã theo dõi CLB "${clubName}". Bạn sẽ nhận thông báo khi CLB mở đợt tuyển mới!`);
      }
      return next;
    });
  };

  const { data: opportunities = [], isLoading: loadingOpps } = useQuery<ClubOpportunity[]>({
    queryKey: ['clubs', 'opportunities', typeFilter, categoryFilter, q],
    queryFn: () =>
      apiClient.get(
        `/clubs/opportunities?type=${typeFilter}&category=${categoryFilter}&q=${encodeURIComponent(q)}`
      ),
  });

  const { data: clubs = [], isLoading: loadingClubs } = useQuery<Club[]>({
    queryKey: ['clubs', 'directory', categoryFilter, q],
    queryFn: () =>
      apiClient.get(`/clubs?category=${categoryFilter}&q=${encodeURIComponent(q)}`),
  });

  const { data: myRegistrations = [] } = useQuery<OpportunityResponse[]>({
    queryKey: ['clubs', 'registrations', 'me'],
    queryFn: () => apiClient.get('/clubs/registrations/me'),
    enabled: !isGuest,
  });

  const { data: myManagedOpps = [] } = useQuery<ClubOpportunity[]>({
    queryKey: ['clubs', 'opportunities', 'mine'],
    queryFn: () => apiClient.get('/clubs/opportunities?mine=true'),
    enabled: !isGuest && hasRepClub,
  });

  const myResponseMap = new Map(
    myRegistrations
      .filter((r) => r.status !== 'Withdrawn')
      .map((r) => [r.opportunityId, r])
  );

  const filteredOpportunities = opportunities.filter((opp) => {
    if (deptFilter !== 'all') {
      const oppText = (opp.title + ' ' + (opp.summary || '') + ' ' + (opp.description || '')).toLowerCase();
      if (deptFilter === 'media' && !oppText.includes('truyền thông') && !oppText.includes('media') && !oppText.includes('content') && !oppText.includes('ảnh')) return false;
      if (deptFilter === 'tech' && !oppText.includes('kỹ thuật') && !oppText.includes('tech') && !oppText.includes('code') && !oppText.includes('lập trình')) return false;
      if (deptFilter === 'logistics' && !oppText.includes('hậu cần') && !oppText.includes('đối ngoại') && !oppText.includes('logistics')) return false;
      if (deptFilter === 'events' && !oppText.includes('sự kiện') && !oppText.includes('văn nghệ') && !oppText.includes('event')) return false;
    }
    if (durationFilter === 'short') {
      if (opp.type === 'MemberRecruitment') return false;
    } else if (durationFilter === 'long') {
      if (opp.type === 'CollaboratorRecruitment') return false;
    }
    return true;
  });

  const handleTabChange = (val: string) => {
    setSearchParams({ tab: val });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        variant="band"
        icon={Building2}
        title="Kết nối Câu lạc bộ"
        description="Khám phá các sự kiện, đợt tuyển thành viên và cộng tác viên từ các Câu lạc bộ sinh viên trong trường."
        actions={
          !isGuest && hasRepClub ? (
              <Link to="/clubs/manage/new">
                <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />}>
                  Đăng hoạt động CLB
                </Button>
              </Link>
          ) : (
            <Link to="/clubs/represent">
              <Button variant="secondary" leftIcon={<ShieldCheck className="h-4 w-4" />}>
                Yêu cầu đại diện CLB
              </Button>
            </Link>
          )
        }
      />

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="opportunities">
            Khám phá hoạt động ({opportunities.length})
          </TabsTrigger>
          <TabsTrigger value="directory">
            Danh sách CLB ({clubs.length})
          </TabsTrigger>
          {!isGuest && (
            <TabsTrigger value="registrations">
              Đăng ký của tôi ({myRegistrations.length})
            </TabsTrigger>
          )}
          {!isGuest && hasRepClub && (
            <TabsTrigger value="manage">
              Bài đăng của tôi ({myManagedOpps.length})
            </TabsTrigger>
          )}
        </TabsList>

        {/* TAB 1: KHÁM PHÁ CƠ HỘI (CL1) */}
        <TabsContent value="opportunities" className="space-y-5">
          {/* Bộ lọc trực quan trên đầu trang */}
          <Card className="p-4 space-y-3.5">
            {/* Quick Pills: Loại cơ hội [Tuyển Thành viên chính thức] / [Tuyển Cộng tác viên (CTV)] */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-caption font-semibold text-neutral-600">Loại cơ hội ứng tuyển:</span>
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { value: 'all', label: 'Tất cả cơ hội' },
                  { value: 'MemberRecruitment', label: '⭐ Tuyển Thành viên chính thức' },
                  { value: 'CollaboratorRecruitment', label: '🤝 Tuyển Cộng tác viên (CTV)' },
                  { value: 'Event', label: '🎪 Sự kiện CLB' },
                ].map((pill) => (
                  <button
                    key={pill.value}
                    type="button"
                    onClick={() => setTypeFilter(pill.value)}
                    className={`px-3 py-1.5 rounded-full text-caption font-medium transition-all cursor-pointer ${
                      typeFilter === pill.value
                        ? 'bg-brand-600 text-white shadow-xs font-semibold'
                        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                    }`}
                  >
                    {pill.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Row 2: Search + Ban chuyên môn/Kỹ năng + Thời gian tham gia + Lĩnh vực */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-2 border-t border-neutral-150">
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Tìm cơ hội, tên CLB, kỹ năng..."
                leftIcon={<Search className="h-4 w-4" />}
                className="w-full"
              />

              <Select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="w-full text-caption"
              >
                <option value="all">Tất cả Ban / Kỹ năng</option>
                <option value="media">Truyền thông &amp; Content (Media)</option>
                <option value="tech">Kỹ thuật &amp; Lập trình (Tech)</option>
                <option value="logistics">Hậu cần &amp; Đối ngoại (Logistics)</option>
                <option value="events">Sự kiện &amp; Văn nghệ (Events)</option>
              </Select>

              <Select
                value={durationFilter}
                onChange={(e) => setDurationFilter(e.target.value)}
                className="w-full text-caption"
              >
                <option value="all">Tất cả Thời gian tham gia</option>
                <option value="short">Ngắn hạn / CTV (1 - 3 tuần / sự kiện)</option>
                <option value="long">Dài hạn / Thành viên (1 - 2 kỳ học)</option>
              </Select>

              <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full text-caption"
              >
                <option value="all">Tất cả lĩnh vực CLB</option>
                {Object.entries(CATEGORY_LABELS).map(([k, label]) => (
                  <option key={k} value={k}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>
          </Card>

          {/* AI Suggested Opportunities Strip (when logged in) */}
          {!isGuest && opportunities.length > 0 && !q && typeFilter === 'all' && (
            <Card className="p-4 bg-brand-50/40 border-brand-200/80 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-md bg-brand-50 text-brand-600 flex items-center justify-center">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-900">
                      Gợi ý phù hợp với ngành {user?.major || 'Kỹ thuật phần mềm'} của bạn
                    </h3>
                    <p className="text-caption text-neutral-500">
                      Dựa trên môn học và kỹ năng trong hồ sơ sinh viên
                    </p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {opportunities.slice(0, 2).map((opp) => (
                  <Link
                    key={opp.id}
                    to={`/clubs/opportunities/${opp.id}`}
                    className="flex items-start justify-between gap-3 p-3 rounded-lg bg-surface border border-neutral-200 hover:border-brand-300 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="text-caption font-semibold text-brand-600">
                        {opp.clubName} · {OPPORTUNITY_TYPE_LABELS[opp.type]}
                      </div>
                      <div className="text-sm font-semibold text-neutral-900 line-clamp-1 mt-0.5">
                        {opp.title}
                      </div>
                      <div className="text-caption text-neutral-500 mt-1">
                        Chỉ tiêu: {opp.used}/{opp.quota} · Hạn ĐK:{' '}
                        {new Date(opp.registrationDeadline).toLocaleDateString('vi-VN')}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </Card>
          )}

          {loadingOpps ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="h-56 animate-pulse bg-neutral-100" />
              ))}
            </div>
          ) : filteredOpportunities.length === 0 ? (
            <EmptyState
              icon={Building2}
              title="Không tìm thấy hoạt động phù hợp"
              description="Thử thay đổi bộ lọc loại cơ hội, Ban kỹ năng hoặc từ khóa tìm kiếm của bạn."
            />
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredOpportunities.map((opp) => {
                  const myResp = myResponseMap.get(opp.id);
                  return (
                    <OpportunityCard
                      key={opp.id}
                      opportunity={opp}
                      myResponseStatus={myResp?.status}
                      myResponseId={myResp?.id}
                    />
                  );
                })}
              </div>
              <LimitNotice noun="hoạt động" count={Math.min(filteredOpportunities.length, 6)} />
            </>
          )}
        </TabsContent>

        {/* TAB 2: DANH SÁCH CLB (CL1b) */}
        <TabsContent value="directory" className="space-y-4">
          <Card className="p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex-1 min-w-0">
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Tìm theo tên hoặc mã Câu lạc bộ..."
                leftIcon={<Search className="h-4 w-4" />}
              />
            </div>
            <Select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full sm:w-56"
            >
              <option value="all">Tất cả lĩnh vực</option>
              {Object.entries(CATEGORY_LABELS).map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </Select>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loadingClubs ? (
              [1, 2, 3, 4].map((i) => (
                <Card key={i} className="h-44 animate-pulse bg-neutral-100" />
              ))
            ) : clubs.length === 0 ? (
              <div className="col-span-2">
                <EmptyState
                  icon={Building2}
                  title="Chưa có CLB nào trong danh mục này"
                  description="Bạn là Ban chủ nhiệm CLB? Hãy gửi yêu cầu xác minh quyền đại diện."
                />
              </div>
            ) : (
              clubs.map((club) => (
                <Card
                  key={club.id}
                  className="p-5 flex flex-col justify-between gap-4 hover:border-neutral-300 transition-colors"
                >
                  <div className="flex items-start gap-3.5">
                    {club.logoUrl ? (
                      <img
                        src={club.logoUrl}
                        alt={club.name}
                        className="h-14 w-14 rounded-xl object-cover border border-neutral-200 shrink-0"
                      />
                    ) : (
                      <div className="h-14 w-14 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold text-xl shrink-0">
                        {club.name.charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          to={`/clubs/${club.id}`}
                          className="text-card-title text-neutral-900 hover:text-brand-600 transition-colors"
                        >
                          {club.name}
                        </Link>
                      </div>
                      <div className="text-caption font-medium text-neutral-500 mt-0.5">
                        {club.category ? CATEGORY_LABELS[club.category] : club.field}
                        {club.foundedYear ? ` · Thành lập ${club.foundedYear}` : ''}
                      </div>
                      <p className="text-meta text-neutral-600 mt-1.5 line-clamp-2">
                        {club.tagline || club.description}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-neutral-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3 text-caption text-neutral-600">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-neutral-400" />
                        <strong>{club.openOpportunitiesCount ?? 0}</strong> hoạt động đang mở
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Users className="h-3.5 w-3.5 text-neutral-400" />
                        {club.representatives?.length ?? 1} đại diện xác thực
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant={followedClubs.has(club.id) ? 'outline' : 'primary'}
                        size="sm"
                        onClick={() => toggleFollowClub(club.id, club.name)}
                        leftIcon={<Bell className={`h-3.5 w-3.5 ${followedClubs.has(club.id) ? 'fill-brand-600 text-brand-600' : ''}`} />}
                      >
                        {followedClubs.has(club.id) ? 'Đang theo dõi' : 'Theo dõi CLB'}
                      </Button>
                      <Link to={`/clubs/${club.id}`}>
                        <Button variant="secondary" size="sm">
                          Xem hồ sơ CLB
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>

          {(isGuest || !hasRepClub) && (
            <Card className="p-4 bg-neutral-50 border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="h-5 w-5 text-brand-600 shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-semibold text-neutral-900">
                    Bạn là Ban chủ nhiệm CLB nhưng chưa có quyền đăng hoạt động?
                  </div>
                  <p className="text-caption text-neutral-500">
                    Gửi yêu cầu xác minh quyền đại diện hoặc đề xuất bổ sung CLB mới vào danh bạ trường.
                  </p>
                </div>
              </div>
              <Link to="/clubs/represent" className="shrink-0">
                <Button variant="secondary" size="sm">
                  Gửi yêu cầu xác minh →
                </Button>
              </Link>
            </Card>
          )}
        </TabsContent>

        {/* TAB 3: ĐĂNG KÝ CỦA TÔI (CL5) */}
        {!isGuest && (
          <TabsContent value="registrations" className="space-y-3">
            {myRegistrations.length === 0 ? (
              <EmptyState
                icon={FileText}
                        title="Bạn chưa đăng ký hoạt động CLB nào"
                description="Khám phá các sự kiện và đợt tuyển thành viên/CTV đang mở để tham gia."
              />
            ) : (
              myRegistrations.map((resp) => (
                <Card
                  key={resp.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-caption font-semibold text-neutral-600">
                        {resp.clubName}
                      </span>
                      <span className="text-neutral-300">·</span>
                      <span className="text-caption text-neutral-500">
                        {OPPORTUNITY_TYPE_LABELS[resp.opportunityType]}
                      </span>
                      {resp.positionName && (
                        <>
                          <span className="text-neutral-300">·</span>
                          <span className="text-caption font-medium text-brand-600">
                            {resp.positionName}
                          </span>
                        </>
                      )}
                    </div>
                    <Link
                      to={`/clubs/registrations/${resp.id}`}
                      className="text-card-title text-neutral-900 hover:text-brand-600 block truncate"
                    >
                      {resp.opportunityTitle}
                    </Link>
                    {resp.status === 'NeedsMoreInfo' && resp.feedbackNote && (
                      <p className="text-caption text-tier-attention-text font-medium mt-1">
                        Yêu cầu bổ sung: {resp.feedbackNote}
                      </p>
                    )}
                    <div className="text-caption text-neutral-500">
                      Cập nhật lần cuối:{' '}
                      {new Date(resp.updatedAt).toLocaleDateString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })}
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
                    <StatusBadge group="opportunityResponse" status={resp.status} />
                    {resp.status === 'NeedsMoreInfo' ? (
                      <Link to={`/clubs/opportunities/${resp.opportunityId}/register`}>
                        <Button variant="primary" size="sm">
                          Bổ sung ngay
                        </Button>
                      </Link>
                    ) : null}
                    <Link to={`/clubs/registrations/${resp.id}`}>
                      <Button variant="secondary" size="sm">
                        Chi tiết đơn
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>
        )}

        {/* TAB 4: BÀI ĐĂNG CỦA TÔI (CL7 — Dành cho Đại diện CLB) */}
        {!isGuest && hasRepClub && (
          <TabsContent value="manage" className="space-y-4">
            <Card className="p-4 bg-neutral-50 border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-card-title text-neutral-900">
                  Quản lý bài đăng hoạt động của CLB bạn đại diện
                </h3>
                <p className="text-caption text-neutral-500">
                  Đang đại diện: <strong>{representedClubs.map((c) => c.name).join(', ')}</strong> · Xem danh sách sinh viên đăng ký, phản hồi đơn và xuất CSV
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                {representedClubs[0] && (
                  <Link to={`/clubs/${representedClubs[0].clubId}`}>
                    <Button variant="secondary" size="sm">
                      Hồ sơ CLB
                    </Button>
                  </Link>
                )}
                <Link to="/clubs/represent">
                  <Button variant="ghost" size="sm" leftIcon={<ShieldCheck className="h-4 w-4" />}>
                    Đại diện CLB khác
                  </Button>
                </Link>
              </div>
            </Card>

            {myManagedOpps.length === 0 ? (
              <EmptyState
                icon={Building2}
                        title="Chưa có bài đăng hoạt động nào"
                description="Tạo bài đăng sự kiện, tuyển thành viên hoặc tuyển cộng tác viên cho CLB."
              />
            ) : (
              <div className="space-y-3">
                {myManagedOpps.map((opp) => (
                  <Card
                    key={opp.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-caption font-semibold text-neutral-600">
                          {opp.clubName}
                        </span>
                        <span className="text-neutral-300">·</span>
                        <span className="text-caption text-neutral-500">
                          {OPPORTUNITY_TYPE_LABELS[opp.type]}
                        </span>
                      </div>
                      <Link
                        to={`/clubs/manage/${opp.id}`}
                        className="text-card-title text-neutral-900 hover:text-brand-600 block truncate"
                      >
                        {opp.title}
                      </Link>
                      <div className="text-caption text-neutral-500 flex items-center gap-3">
                        <span>
                          Đã duyệt: <strong>{opp.used}/{opp.quota}</strong>
                        </span>
                        <span>
                          Tổng phản hồi: <strong>{opp.submittedCount ?? opp.used}</strong>
                        </span>
                        <span>
                          Hạn ĐK: {new Date(opp.registrationDeadline).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <StatusBadge group="opportunity" status={opp.status} />
                      <Link to={`/clubs/manage/${opp.id}/edit`}>
                        <Button variant="ghost" size="sm">
                          Chỉnh sửa
                        </Button>
                      </Link>
                      <Link to={`/clubs/manage/${opp.id}`}>
                        <Button variant="primary" size="sm">
                          Quản lý phản hồi
                        </Button>
                      </Link>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default ClubsExplorePage;
