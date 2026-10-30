import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Building2, Plus, Search, ShieldCheck } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorState } from '@/components/shared/ErrorState';
import {
  OpportunityCard,
  OPPORTUNITY_TYPE_LABELS,
} from '@/components/shared/OpportunityCard';
import { apiClient } from '@/lib/apiClient';
import { useAuthStore } from '@/store/authStore';
import { ClubFollowButton } from './ClubRecruitmentActions';
import { useClubPreferences } from './useClubPreferences';
import {
  CLUB_CATEGORIES,
  DEPARTMENTS,
  formatClubDate,
  isRecruitment,
  isRecruitmentOpen,
  isResultOverdue,
  matchesDepartment,
} from './recruitment';
import type {
  Club,
  ClubOpportunity,
  OpportunityResponse,
} from '@/types/entities';

const normalize = (value: string) =>
  value
    .toLocaleLowerCase('vi')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');

export function ClubsExplorePage() {
  const [params, setParams] = useSearchParams();
  const { user, representedClubs } = useAuthStore();
  const hasRep = representedClubs.length > 0;
  const allowedTabs = [
    'opportunities',
    'directory',
    ...(user ? ['registrations', 'saved'] : []),
    ...(user && hasRep ? ['manage'] : []),
  ];
  const tab = allowedTabs.includes(params.get('tab') || '')
    ? params.get('tab')!
    : 'opportunities';
  const set = (key: string, value: string) =>
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value && value !== 'all') next.set(key, value);
      else next.delete(key);
      return next;
    });
  const pref = useClubPreferences();
  const opportunities = useQuery<ClubOpportunity[]>({
    queryKey: ['clubs', 'opportunities', 'public'],
    queryFn: () => apiClient.get('/clubs/opportunities'),
  });
  const clubs = useQuery<Club[]>({
    queryKey: ['clubs', 'directory'],
    queryFn: () => apiClient.get('/clubs'),
  });
  const registrations = useQuery<OpportunityResponse[]>({
    queryKey: ['clubs', 'registrations', 'me', user?.id],
    queryFn: () => apiClient.get('/clubs/registrations/me'),
    enabled: Boolean(user),
  });
  const managed = useQuery<ClubOpportunity[]>({
    queryKey: ['clubs', 'opportunities', 'mine', user?.id],
    queryFn: () => apiClient.get('/clubs/opportunities?mine=true'),
    enabled: Boolean(user && hasRep),
  });
  const all = (opportunities.data || []).filter(isRecruitment);
  const responseMap = new Map(
    (registrations.data || [])
      .filter((r) => !['Withdrawn', 'Cancelled'].includes(r.status))
      .map((r) => [r.opportunityId, r])
  );
  const q = normalize(params.get('q') || '');
  const filtered = all.filter((item) => {
    const kind = params.get('type'),
      category = params.get('category'),
      department = params.get('department'),
      duration = params.get('duration');
    return (
      (!kind || item.type === kind) &&
      (!category || item.clubCategory === category) &&
      matchesDepartment(item, department || 'all') &&
      (!duration ||
        (item.commitmentType ||
          (item.type === 'MemberRecruitment' ? 'semester' : 'short')) ===
          duration) &&
      (!q ||
        normalize(
          `${item.title} ${item.clubName} ${item.tags.join(' ')} ${item.positions?.map((p) => p.name).join(' ')}`
        ).includes(q)) &&
      (params.get('open') !== '1' || isRecruitmentOpen(item)) &&
      (params.get('following') !== '1' ||
        pref.preferences.followedClubIds.includes(item.clubId))
    );
  });
  const shown = (
    tab === 'saved'
      ? filtered.filter((o) =>
          pref.preferences.savedOpportunityIds.includes(o.id)
        )
      : filtered
  ).sort(
    (a, b) =>
      Number(isRecruitmentOpen(b)) - Number(isRecruitmentOpen(a)) ||
      Date.parse(a.registrationDeadline) - Date.parse(b.registrationDeadline)
  );
  const directory = (clubs.data || []).filter(
    (club) =>
      (!params.get('category') || club.category === params.get('category')) &&
      (!q || normalize(`${club.name} ${club.code} ${club.field}`).includes(q))
  );
  const categories = (
    <>
      <option value="">Tất cả lĩnh vực</option>
      {Object.entries(CLUB_CATEGORIES).map(([value, label]) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </>
  );

  const filters = (
    <div className="space-y-4 rounded-xl border border-neutral-200 bg-surface p-4 sm:p-5">
      <fieldset className="flex flex-wrap gap-2">
        <legend className="mb-2 text-sm font-medium text-neutral-800">
          Bạn muốn tham gia theo cách nào?
        </legend>
        {[
          { value: '', label: 'Tất cả đợt tuyển' },
          { value: 'MemberRecruitment', label: 'Thành viên chính thức' },
          { value: 'CollaboratorRecruitment', label: 'Cộng tác viên ngắn hạn' },
        ].map((item) => (
          <Button
            key={item.value}
            size="sm"
            variant={
              (params.get('type') || '') === item.value
                ? 'primary'
                : 'secondary'
            }
            aria-pressed={(params.get('type') || '') === item.value}
            onClick={() => set('type', item.value)}
          >
            {item.label}
          </Button>
        ))}
      </fieldset>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <label className="space-y-1.5 text-xs font-medium text-neutral-700">
          Tìm kiếm
          <Input
            leftIcon={<Search size={15} />}
            placeholder="Tên CLB, vị trí, kỹ năng…"
            value={params.get('q') || ''}
            onChange={(e) => set('q', e.target.value)}
          />
        </label>
        <label className="space-y-1.5 text-xs font-medium text-neutral-700">
          Ban chuyên môn
          <Select
            value={params.get('department') || ''}
            onChange={(e) => set('department', e.target.value)}
          >
            <option value="">Tất cả các ban</option>
            {Object.entries(DEPARTMENTS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </label>
        <label className="space-y-1.5 text-xs font-medium text-neutral-700">
          Thời gian cam kết
          <Select
            value={params.get('duration') || ''}
            onChange={(e) => set('duration', e.target.value)}
          >
            <option value="">Mọi thời gian</option>
            <option value="short">Ngắn hạn / theo chiến dịch</option>
            <option value="semester">Dài hạn / theo học kỳ</option>
          </Select>
        </label>
        <label className="space-y-1.5 text-xs font-medium text-neutral-700">
          Lĩnh vực CLB
          <Select
            value={params.get('category') || ''}
            onChange={(e) => set('category', e.target.value)}
          >
            {categories}
          </Select>
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-neutral-700">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={params.get('open') === '1'}
            onChange={(e) => set('open', e.target.checked ? '1' : '')}
          />
          Chỉ đang nhận hồ sơ
        </label>
        {user && (
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={params.get('following') === '1'}
              onChange={(e) => set('following', e.target.checked ? '1' : '')}
            />
            CLB đang theo dõi
          </label>
        )}
        <Button variant="ghost" size="sm" onClick={() => setParams({ tab })}>
          Xóa bộ lọc
        </Button>
      </div>
    </div>
  );
  const results = opportunities.isPending ? (
    <p role="status" className="py-8 text-sm text-neutral-600">
      Đang tải đợt tuyển…
    </p>
  ) : opportunities.isError ? (
    <ErrorState
      title="Không tải được đợt tuyển"
      onRetry={() => opportunities.refetch()}
    />
  ) : !shown.length ? (
    <EmptyState
      title={
        tab === 'saved'
          ? 'Chưa có cơ hội đã lưu phù hợp'
          : 'Chưa có đợt tuyển phù hợp'
      }
      description="Thử bỏ bớt bộ lọc hoặc khám phá danh sách CLB."
    />
  ) : (
    <>
      <p role="status" className="text-sm text-neutral-600">
        {shown.length} đợt tuyển phù hợp
      </p>
      <div className="grid gap-4 xl:grid-cols-2">
        {shown.map((item) => (
          <OpportunityCard
            key={item.id}
            opportunity={item}
            myResponseId={responseMap.get(item.id)?.id}
            myResponseStatus={responseMap.get(item.id)?.status}
          />
        ))}
      </div>
    </>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        variant="band"
        icon={Building2}
        title="Tìm CLB, chọn nơi bạn muốn gắn bó"
        description="Khám phá câu lạc bộ, ứng tuyển thành viên dài hạn hoặc thử sức với vai trò cộng tác viên."
        actions={
          user && hasRep ? (
            <Link to="/clubs/manage/new">
              <Button leftIcon={<Plus size={16} />}>Tạo đợt tuyển</Button>
            </Link>
          ) : (
            <Link to="/clubs/represent">
              <Button variant="secondary" leftIcon={<ShieldCheck size={16} />}>
                Đăng ký đại diện CLB
              </Button>
            </Link>
          )
        }
      />
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200 pb-4 text-sm">
        <p className="text-neutral-600">
          Sự kiện và workshop của CLB nằm trong mục Hoạt động.
        </p>
        <Link
          to="/programs"
          className="inline-flex items-center gap-1.5 font-medium text-brand-700 hover:underline"
        >
          Khám phá hoạt động
          <ArrowRight size={15} />
        </Link>
      </div>
      <Tabs value={tab} onValueChange={(value) => set('tab', value)}>
        <TabsList className="h-auto max-w-full flex-wrap justify-start">
          <TabsTrigger value="opportunities">Cơ hội ứng tuyển</TabsTrigger>
          <TabsTrigger value="directory">Khám phá CLB</TabsTrigger>
          {user && (
            <>
              <TabsTrigger value="registrations">Đơn của tôi</TabsTrigger>
              <TabsTrigger value="saved">Đã lưu</TabsTrigger>
            </>
          )}
          {user && hasRep && (
            <TabsTrigger value="manage">Quản lý tuyển dụng</TabsTrigger>
          )}
        </TabsList>
        <TabsContent value="opportunities" className="space-y-5 pt-4">
          {filters}
          {results}
        </TabsContent>
        <TabsContent value="saved" className="space-y-5 pt-4">
          {filters}
          {pref.isError ? (
            <ErrorState
              title="Không tải được cơ hội đã lưu"
              onRetry={() => pref.refetch()}
            />
          ) : pref.isPending ? (
            <p role="status">Đang tải cơ hội đã lưu…</p>
          ) : (
            results
          )}
        </TabsContent>
        <TabsContent value="directory" className="space-y-5 pt-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              aria-label="Tìm CLB"
              leftIcon={<Search size={15} />}
              placeholder="Tìm tên, mã hoặc lĩnh vực CLB…"
              value={params.get('q') || ''}
              onChange={(e) => set('q', e.target.value)}
            />
            <Select
              aria-label="Lĩnh vực CLB"
              value={params.get('category') || ''}
              onChange={(e) => set('category', e.target.value)}
            >
              {categories}
            </Select>
          </div>
          {clubs.isPending ? (
            <p role="status">Đang tải CLB…</p>
          ) : clubs.isError ? (
            <ErrorState
              title="Không tải được danh sách CLB"
              onRetry={() => clubs.refetch()}
            />
          ) : !directory.length ? (
            <EmptyState title="Không tìm thấy CLB phù hợp" />
          ) : (
            <div className="divide-y divide-neutral-200">
              {directory.map((club) => (
                <article
                  key={club.id}
                  className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center"
                >
                  <Link
                    to={`/clubs/${club.id}`}
                    className="flex min-w-0 flex-1 gap-4"
                  >
                    {club.logoUrl && (
                      <img
                        src={club.logoUrl}
                        alt=""
                        className="h-14 w-14 rounded-xl object-cover"
                        loading="lazy"
                      />
                    )}
                    <div className="min-w-0">
                      <h2 className="font-semibold text-neutral-900 hover:text-brand-700">
                        {club.name}
                      </h2>
                      <p className="mt-1 text-xs text-neutral-600">
                        {club.field} ·{' '}
                        {
                          all.filter(
                            (o) => o.clubId === club.id && isRecruitmentOpen(o)
                          ).length
                        }{' '}
                        đợt đang nhận hồ sơ
                      </p>
                      <p className="mt-1 line-clamp-2 text-sm text-neutral-600">
                        {club.tagline || club.description}
                      </p>
                    </div>
                  </Link>
                  <ClubFollowButton clubId={club.id} />
                </article>
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="registrations" className="space-y-4 pt-4">
          <p className="text-sm text-neutral-600">
            Đơn chờ xét chưa đồng nghĩa với trúng tuyển. Theo dõi hạn trả kết
            quả và yêu cầu bổ sung tại đây.
          </p>
          {registrations.isPending ? (
            <p role="status">Đang tải đơn…</p>
          ) : registrations.isError ? (
            <ErrorState
              title="Không tải được đơn của bạn"
              onRetry={() => registrations.refetch()}
            />
          ) : !(registrations.data || []).filter(
              (r) => r.opportunityType !== 'Event'
            ).length ? (
            <EmptyState
              title="Bạn chưa có đơn ứng tuyển CLB"
              description="Chọn một đợt tuyển phù hợp để bắt đầu."
            />
          ) : (
            (registrations.data || [])
              .filter((r) => r.opportunityType !== 'Event')
              .map((response) => {
                const opportunity = all.find(
                  (o) => o.id === response.opportunityId
                );
                return (
                  <Card key={response.id} className="p-5 space-y-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs text-neutral-600">
                          {response.clubName} ·{' '}
                          {OPPORTUNITY_TYPE_LABELS[response.opportunityType]}
                        </p>
                        <h2 className="mt-1 font-semibold text-neutral-900">
                          {response.opportunityTitle}
                        </h2>
                        {response.positionName && (
                          <p className="text-sm text-neutral-600">
                            {response.positionName}
                          </p>
                        )}
                      </div>
                      <StatusBadge
                        group="opportunityResponse"
                        status={response.status}
                      />
                    </div>
                    <p className="text-sm text-neutral-600">
                      Dự kiến trả kết quả:{' '}
                      {formatClubDate(opportunity?.resultDeadline)}
                    </p>
                    {isResultOverdue(response, opportunity) && (
                      <p className="text-sm font-medium text-amber-800">
                        CLB chưa phản hồi đúng hạn
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      <Link to={`/clubs/registrations/${response.id}`}>
                        <Button size="sm" variant="secondary">
                          Xem đơn & tiến trình
                        </Button>
                      </Link>
                      {['Draft', 'NeedsMoreInfo'].includes(response.status) && (
                        <Link
                          to={`/clubs/opportunities/${response.opportunityId}/register`}
                        >
                          <Button size="sm">
                            {response.status === 'Draft'
                              ? 'Tiếp tục điền đơn'
                              : 'Bổ sung hồ sơ'}
                          </Button>
                        </Link>
                      )}
                    </div>
                  </Card>
                );
              })
          )}
        </TabsContent>
        <TabsContent value="manage" className="space-y-4 pt-4">
          <div className="flex flex-wrap justify-between gap-3">
            <div>
              <h2 className="text-section-title text-neutral-900">
                Các đợt tuyển của CLB bạn đại diện
              </h2>
              <p className="mt-1 text-sm text-neutral-600">
                Xử lý hồ sơ, giải đáp câu hỏi và công bố kết quả đúng hẹn.
              </p>
            </div>
            <Link to="/clubs/manage/new">
              <Button size="sm" leftIcon={<Plus size={15} />}>
                Tạo đợt tuyển
              </Button>
            </Link>
          </div>
          {managed.isPending ? (
            <p role="status">Đang tải đợt tuyển…</p>
          ) : managed.isError ? (
            <ErrorState
              title="Không tải được đợt tuyển quản lý"
              onRetry={() => managed.refetch()}
            />
          ) : !(managed.data || []).filter(isRecruitment).length ? (
            <EmptyState
              title="Chưa có đợt tuyển"
              description="Bắt đầu từ mẫu thành viên hoặc cộng tác viên."
            />
          ) : (
            (managed.data || []).filter(isRecruitment).map((item) => (
              <Card key={item.id} className="p-5 space-y-3">
                <div className="flex flex-wrap justify-between gap-3">
                  <div>
                    <p className="text-xs text-neutral-600">{item.clubName}</p>
                    <h3 className="mt-1 font-semibold text-neutral-900">
                      {item.title}
                    </h3>
                  </div>
                  <StatusBadge group="opportunity" status={item.status} />
                </div>
                <p className="text-sm text-neutral-600">
                  Đã nhận {item.used}/{item.quota} · Dự kiến trả kết quả{' '}
                  {formatClubDate(item.resultDeadline)}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Link to={`/clubs/manage/${item.id}`}>
                    <Button size="sm">Quản lý hồ sơ</Button>
                  </Link>
                  <Link to={`/clubs/opportunities/${item.id}#questions`}>
                    <Button size="sm" variant="secondary">
                      Hỏi đáp
                    </Button>
                  </Link>
                  <Link
                    to={`/clubs/manage/new?reuse=${item.id}&clubId=${item.clubId}`}
                  >
                    <Button size="sm" variant="outline">
                      Tái sử dụng
                    </Button>
                  </Link>
                </div>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
export default ClubsExplorePage;
