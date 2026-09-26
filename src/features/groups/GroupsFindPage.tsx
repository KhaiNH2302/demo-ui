import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { PageHeader } from '@/components/shared/PageHeader';
import { FormField } from '@/components/shared/FormField';
import { TagInput } from '@/components/shared/TagInput';
import { ScheduleInput } from '@/components/shared/ScheduleInput';
import { AIResultCard } from '@/components/shared/AIResultCard';
import { AIFallbackBanner } from '@/components/shared/AIFallbackBanner';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { UserMiniCard } from '@/components/shared/UserMiniCard';
import { AvatarStack } from '@/components/shared/AvatarStack';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { Switch } from '@/components/ui/Switch';
import { UsersRound, Plus, Sparkles, SlidersHorizontal, ArrowRight } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { seedUsers } from '@/mocks/data/users';
import type { Group, AiGroupMatch, ScheduleSlot } from '@/types/entities';

const purposeOptions = [
  { value: '', label: 'Tất cả mục đích' },
  { value: 'Học tập', label: 'Học tập' },
  { value: 'Dự án', label: 'Đồ án / Dự án' },
  { value: 'Kỹ năng', label: 'Rèn luyện kỹ năng' },
  { value: 'Sở thích', label: 'Sở thích & Giao lưu' },
];

export default function GroupsFindPage() {
  const [purpose, setPurpose] = useState('');
  const [skills, setSkills] = useState<string[]>(['React', 'TypeScript']);
  const [interests, setInterests] = useState<string[]>(['Lập trình Web']);
  const [availability, setAvailability] = useState<ScheduleSlot[]>([
    { day: 'Tue', start: '19:00', end: '21:00' },
  ]);
  const [useAi, setUseAi] = useState(true);
  const navigate = useNavigate();

  const allGroupsQuery = useQuery<Group[]>({
    queryKey: queryKeys.groups.list,
    queryFn: () => apiClient.get('/groups'),
  });

  const searchMutation = useMutation({
    mutationFn: (payload: any) => apiClient.post('/groups/search', payload) as Promise<AiGroupMatch[] | Group[]>,
  });

  const handleSearch = () => {
    searchMutation.mutate({
      purpose: purpose || undefined,
      skills,
      interests: interests.join(', '),
      availability,
      mode: useAi ? 'ai' : 'filter',
    });
  };

  const isAiFailed = useAi && searchMutation.isError;
  const groupsList = allGroupsQuery.data || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tìm nhóm kết nối & Đồ án"
        description="Tìm kiếm bạn đồng hành làm đồ án SWP/Capstone hoặc nhóm rèn luyện kỹ năng với thuật toán ghép nối AI"
        actions={
          <div className="flex items-center gap-2">
            <Link to="/groups/me">
              <Button variant="outline" size="sm">
                Nhóm của tôi
              </Button>
            </Link>
            <Link to="/groups/new">
              <Button size="sm" leftIcon={<Plus size={16} />}>
                Tạo nhóm mới
              </Button>
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Criteria Panel */}
        <Card className="lg:col-span-1 h-fit shadow-xs">
          <CardHeader>
            <div className="flex items-center justify-between w-full">
              <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                <SlidersHorizontal size={16} className="text-brand-600" /> Tiêu chí tìm kiếm
              </CardTitle>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-brand-50/50 border border-brand-100">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-800">
                <Sparkles size={14} className="text-brand-600" /> Gợi ý thông minh (AI)
              </div>
              <Switch checked={useAi} onCheckedChange={setUseAi} />
            </div>

            <FormField label="Mục đích tham gia">
              <Select
                options={purposeOptions}
                value={purpose}
                onValueChange={setPurpose}
              />
            </FormField>

            <FormField label="Kỹ năng của bạn">
              <TagInput
                value={skills}
                onChange={setSkills}
                suggestions={['React', 'TypeScript', 'Node.js', 'Java', 'Algorithms', 'UI/UX']}
              />
            </FormField>

            <FormField label="Lĩnh vực quan tâm">
              <TagInput
                value={interests}
                onChange={setInterests}
                suggestions={['Web App', 'Mobile App', 'AI / Data', 'Tiếng Anh', 'Game']}
              />
            </FormField>

            <FormField label="Khung giờ rảnh">
              <ScheduleInput value={availability} onChange={setAvailability} />
            </FormField>

            <Button
              className="w-full mt-2"
              onClick={handleSearch}
              loading={searchMutation.isPending}
              leftIcon={useAi ? <Sparkles size={16} /> : <UsersRound size={16} />}
            >
              {useAi ? 'Tìm & Gợi ý với AI' : 'Lọc danh sách nhóm'}
            </Button>
          </CardContent>
        </Card>

        {/* Right Column: Search Results */}
        <div className="lg:col-span-2 space-y-4">
          <AIFallbackBanner visible={isAiFailed} />

          {searchMutation.isPending ? (
            <LoadingSkeleton variant="card" count={3} />
          ) : (
            (() => {
              const aiResults = useAi && !isAiFailed && searchMutation.data ? (searchMutation.data as AiGroupMatch[]) : null;
              const filterResults = !useAi || isAiFailed ? (searchMutation.data ? (searchMutation.data as Group[]) : groupsList) : null;

              if (aiResults && aiResults.length > 0) {
                return (
                  <div className="space-y-4">
                    {aiResults.map((match) => {
                      const group = groupsList.find((g) => g.id === match.groupId);
                      if (!group) return null;
                      const owner = seedUsers.find((u) => u.id === group.ownerId) || {
                        id: group.ownerId,
                        fullName: 'Chủ nhóm',
                        school: 'Đại học FPT',
                      };

                      return (
                        <AIResultCard key={match.groupId} score={match.score} reasons={match.reasons}>
                          <Card className="border-0 shadow-none bg-transparent">
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                              <div>
                                <div className="flex items-center gap-2">
                                  <Badge tier="brand" size="sm">
                                    {group.purpose}
                                  </Badge>
                                  <Badge tier="neutral" size="sm">
                                    {group.joinMode === 'direct' ? 'Vào trực tiếp' : 'Cần duyệt'}
                                  </Badge>
                                </div>
                                <h3 className="text-base font-bold text-neutral-900 mt-1">{group.name}</h3>
                                <p className="text-xs text-neutral-600 mt-0.5">{group.topic}</p>
                              </div>

                              <div className="flex flex-col items-end gap-1.5 shrink-0">
                                <AvatarStack
                                  users={[{ name: owner.fullName }, { name: 'Thành viên' }]}
                                  max={3}
                                  size="sm"
                                />
                                <div className="text-[11px] text-neutral-500">
                                  <strong>{group.memberCount}/{group.memberLimit}</strong> thành viên
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-1.5 my-3">
                              {group.skills.map((s) => (
                                <span key={s} className="text-[11px] bg-neutral-100 rounded px-2 py-0.5 text-neutral-600">
                                  {s}
                                </span>
                              ))}
                            </div>

                            <div className="flex items-center justify-between pt-3 border-t border-brand-100/60 text-xs">
                              <UserMiniCard user={owner} size="sm" subtitle="Chủ nhóm" linkToProfile={false} />
                              <Link to={`/groups/${group.id}`}>
                                <Button size="sm" rightIcon={<ArrowRight size={14} />}>
                                  Xem chi tiết
                                </Button>
                              </Link>
                            </div>
                          </Card>
                        </AIResultCard>
                      );
                    })}
                  </div>
                );
              }

              // Standard filter list
              const displayList = filterResults || groupsList;
              if (displayList.length === 0) {
                return (
                  <EmptyState
                    icon={UsersRound}
                    title="Chưa tìm thấy nhóm nào phù hợp"
                    description="Thử thay đổi tiêu chí lọc hoặc tạo nhóm mới để mời các bạn tham gia!"
                    actionLabel="Tạo nhóm mới ngay"
                    onAction={() => navigate('/groups/new')}
                  />
                );
              }

              return (
                <div className="space-y-4">
                  {displayList.map((group) => {
                    const owner = seedUsers.find((u) => u.id === group.ownerId) || {
                      id: group.ownerId,
                      fullName: 'Chủ nhóm',
                      school: 'Đại học FPT',
                    };

                    return (
                      <Card key={group.id} className="p-5 hover:border-brand-300 transition-colors shadow-xs">
                        <CardContent className="p-0 space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <Badge tier="brand" size="sm">
                                  {group.purpose}
                                </Badge>
                                <Badge tier="neutral" size="sm">
                                  {group.joinMode === 'direct' ? 'Vào trực tiếp' : 'Cần duyệt'}
                                </Badge>
                              </div>
                              <h3 className="text-base font-bold text-neutral-900 mt-1">{group.name}</h3>
                              <p className="text-xs text-neutral-600 mt-0.5">{group.topic}</p>
                            </div>

                            <div className="flex flex-col items-end gap-1.5 shrink-0">
                              <AvatarStack
                                users={[{ name: owner.fullName }, { name: 'Thành viên' }]}
                                max={3}
                                size="sm"
                              />
                              <div className="text-[11px] text-neutral-500">
                                <strong>{group.memberCount}/{group.memberLimit}</strong> thành viên
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {group.skills.map((s) => (
                              <span key={s} className="text-[11px] bg-neutral-100 rounded px-2 py-0.5 text-neutral-600">
                                {s}
                              </span>
                            ))}
                          </div>

                          <div className="flex items-center justify-between pt-3 border-t border-neutral-100 text-xs">
                            <UserMiniCard user={owner} size="sm" subtitle="Chủ nhóm" linkToProfile={false} />
                            <Link to={`/groups/${group.id}`}>
                              <Button size="sm" variant="outline" rightIcon={<ArrowRight size={14} />}>
                                Xem chi tiết
                              </Button>
                            </Link>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              );
            })()
          )}
        </div>
      </div>
    </div>
  );
}
