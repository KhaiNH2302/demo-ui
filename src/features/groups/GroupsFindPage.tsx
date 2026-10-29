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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { Textarea } from '@/components/ui/Textarea';
import { toast } from '@/components/ui/Toast';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/cn';
import {
  UsersRound,
  Plus,
  Sparkles,
  SlidersHorizontal,
  ArrowRight,
  Clock,
  CheckCircle2,
  Send,
  UserCheck,
  Check,
  Filter,
} from 'lucide-react';
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

const subjectFilterOptions = [
  { value: 'all', label: 'Tất cả môn học / đề tài' },
  { value: 'SWP391', label: 'SWP391 · Software Project' },
  { value: 'PRJ301', label: 'PRJ301 · Java Web Application' },
  { value: 'CSD201', label: 'CSD201 · Cấu trúc dữ liệu & GT' },
  { value: 'PRN231', label: 'PRN231 · .NET & Web API' },
  { value: 'Capstone', label: 'Đồ án tốt nghiệp / Capstone' },
];

export default function GroupsFindPage() {
  const { user } = useAuthStore();
  const [purpose, setPurpose] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [skills, setSkills] = useState<string[]>(['React', 'TypeScript']);
  const [interests, setInterests] = useState<string[]>(['Lập trình Web']);
  const [availability, setAvailability] = useState<ScheduleSlot[]>([
    { day: 'Tue', start: '19:00', end: '21:00' },
  ]);
  const [useAi, setUseAi] = useState(true);
  const [selectedJoinGroup, setSelectedJoinGroup] = useState<Group | null>(null);
  const [joinMessage, setJoinMessage] = useState('');
  const [appliedGroupIds, setAppliedGroupIds] = useState<Set<string>>(new Set());
  const navigate = useNavigate();

  const allGroupsQuery = useQuery<Group[]>({
    queryKey: queryKeys.groups.list,
    queryFn: () => apiClient.get('/groups'),
  });

  const joinMutation = useMutation({
    mutationFn: ({ groupId, message }: { groupId: string; message: string }) =>
      apiClient.post(`/groups/${groupId}/join-requests`, { message }),
    onSuccess: (_, vars) => {
      toast.success('Đã gửi đơn xin tham gia nhóm kèm hồ sơ kỹ năng của bạn!');
      setAppliedGroupIds((prev) => new Set([...prev, vars.groupId]));
      setSelectedJoinGroup(null);
      setJoinMessage('');
    },
    onError: () => toast.error('Không thể gửi yêu cầu tham gia.'),
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

            <FormField label="Môn học / Đề tài">
              <Select
                options={subjectFilterOptions}
                value={subjectFilter}
                onValueChange={setSubjectFilter}
              />
            </FormField>

            <FormField label="Mục đích tham gia">
              <Select
                options={purposeOptions}
                value={purpose}
                onValueChange={setPurpose}
              />
            </FormField>

            <div className="pt-1">
              <label className="flex items-center gap-2 text-xs font-semibold text-neutral-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={onlyAvailable}
                  onChange={(e) => setOnlyAvailable(e.target.checked)}
                  className="rounded border-neutral-300 text-brand-600 focus:ring-brand-500"
                />
                <span>Chỉ hiện nhóm còn chỗ trống</span>
              </label>
            </div>

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
              const aiResults = useAi && !isAiFailed && searchMutation.variables?.mode === 'ai' && searchMutation.data
                ? (searchMutation.data as AiGroupMatch[]).filter((match) => groupsList.some((group) => group.id === match.groupId)) : null;
              const filteredIds = searchMutation.variables?.mode === 'filter' && searchMutation.data
                ? new Set((searchMutation.data as Group[]).map((group) => group.id)) : null;

              // Filter by purpose, subject filter, and onlyAvailable
              const baseFiltered = groupsList.filter((g) => {
                if (purpose && g.purpose !== purpose) return false;
                if (subjectFilter !== 'all' && !g.topic.toLowerCase().includes(subjectFilter.toLowerCase())) return false;
                if (onlyAvailable && g.memberCount >= g.memberLimit) return false;
                if (filteredIds && !filteredIds.has(g.id)) return false;
                return true;
              });

              const renderGroupCard = (group: Group, matchInfo?: { score?: number; reasons?: string[] }) => {
                const owner = seedUsers.find((u) => u.id === group.ownerId) || {
                  id: group.ownerId,
                  fullName: 'Chủ nhóm',
                  school: 'Đại học FPT',
                  major: 'Kỹ thuật phần mềm',
                };
                const isFull = group.memberCount >= group.memberLimit;
                const emptySlots = Math.max(0, group.memberLimit - group.memberCount);
                const hasApplied = appliedGroupIds.has(group.id);
                const percent = Math.min(100, Math.round((group.memberCount / group.memberLimit) * 100));

                const cardBody = (
                  <Card key={group.id} className="p-4 sm:p-5 hover:border-brand-300 transition-all shadow-xs space-y-3.5 bg-surface">
                    {/* Header: Title + Purpose Badges */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge tier="brand" size="sm" className="font-semibold">
                            {group.purpose}
                          </Badge>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            {group.topic.split(' - ')[0] || group.topic}
                          </span>
                          <Badge tier="neutral" size="sm">
                            {group.joinMode === 'direct' ? 'Vào trực tiếp' : 'Cần trưởng nhóm duyệt'}
                          </Badge>
                        </div>
                        <h3 className="text-base font-bold text-neutral-900 line-clamp-1">{group.name}</h3>
                        <p className="text-xs text-neutral-600 line-clamp-2 leading-relaxed">{group.topic}</p>
                      </div>

                      {/* Quota Progress & Avatars */}
                      <div className="flex flex-col items-start sm:items-end gap-1.5 shrink-0 min-w-[150px] p-2.5 rounded-lg bg-neutral-50 border border-neutral-100">
                        <div className="flex items-center justify-between w-full text-xs gap-2">
                          <span className={cn('font-bold', isFull ? 'text-red-600' : 'text-emerald-700')}>
                            {isFull ? 'Đã đủ thành viên' : `Còn trống ${emptySlots} chỗ`}
                          </span>
                          <span className="text-neutral-500 font-medium">
                            {group.memberCount}/{group.memberLimit}
                          </span>
                        </div>
                        <div className="w-full bg-neutral-200 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={cn('h-full transition-all', isFull ? 'bg-red-500' : 'bg-emerald-500')}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between w-full pt-0.5">
                          <span className="text-[11px] text-neutral-400">Thành viên:</span>
                          <AvatarStack
                            users={[{ name: owner.fullName }, { name: 'Thành viên 1' }, { name: 'Thành viên 2' }]}
                            max={3}
                            size="sm"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Tags: Skills needed & Activity time */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[11px] font-semibold text-neutral-500 mr-0.5">Cần kỹ năng:</span>
                      {group.skills.map((s) => (
                        <span
                          key={s}
                          className="text-[11px] font-medium bg-purple-50 text-purple-700 border border-purple-200 rounded px-2 py-0.5"
                        >
                          {s}
                        </span>
                      ))}
                      {group.activityTime && group.activityTime.length > 0 && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200 rounded px-2 py-0.5 ml-auto">
                          <Clock size={11} /> {group.activityTime[0].day} {group.activityTime[0].start}-{group.activityTime[0].end}
                        </span>
                      )}
                    </div>

                    {/* Footer Row: Owner Mini Card + Action Buttons */}
                    <div className="flex items-center justify-between pt-3 border-t border-neutral-100 text-xs">
                      <UserMiniCard user={owner} size="sm" subtitle="Trưởng nhóm" linkToProfile={false} />

                      <div className="flex items-center gap-2">
                        {isFull ? (
                          <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-neutral-100 text-neutral-500">
                            Đã đủ thành viên
                          </span>
                        ) : hasApplied ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 size={13} className="text-emerald-600" /> Đã gửi yêu cầu
                          </span>
                        ) : (
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => setSelectedJoinGroup(group)}
                            leftIcon={<UserCheck size={14} />}
                          >
                            Xin tham gia
                          </Button>
                        )}

                        <Link to={`/groups/${group.id}`}>
                          <Button size="sm" variant="outline" rightIcon={<ArrowRight size={14} />}>
                            Chi tiết
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </Card>
                );

                if (matchInfo) {
                  return (
                    <AIResultCard
                      key={group.id}
                      score={matchInfo.score ?? 88}
                      reasons={matchInfo.reasons ?? ['Khớp môn học và kỹ năng mong muốn']}
                    >
                      {cardBody}
                    </AIResultCard>
                  );
                }
                return cardBody;
              };

              // 1. AI Results
              if (aiResults && aiResults.length > 0) {
                return (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50/70 border border-blue-200 text-xs text-blue-900">
                      <Sparkles size={16} className="text-blue-600 shrink-0" />
                      <span>
                        <strong>Gợi ý AI thông minh:</strong> Đã tìm thấy {aiResults.length} nhóm khớp với kỹ năng và lịch rảnh của bạn.
                      </span>
                    </div>
                    {aiResults.map((match) => {
                      const group = groupsList.find((g) => g.id === match.groupId);
                      if (!group) return null;
                      return renderGroupCard(group, { score: match.score, reasons: match.reasons });
                    })}
                  </div>
                );
              }

              // 2. Standard Filter List
              if (baseFiltered.length === 0) {
                return (
                  <EmptyState
                    icon={UsersRound}
                    title="Chưa tìm thấy nhóm nào phù hợp"
                    description="Thử thay đổi bộ lọc hoặc tạo nhóm mới để các bạn khác tham gia!"
                    actionLabel="Tạo nhóm mới ngay"
                    onAction={() => navigate('/groups/new')}
                  />
                );
              }

              return (
                <div className="space-y-4">
                  {/* Default AI Matching Recommendation Highlight at top when browsing */}
                  {useAi && baseFiltered.length > 0 && !searchMutation.data && (
                    <div className="p-3.5 rounded-xl bg-gradient-to-r from-brand-50 to-blue-50 border border-brand-200 text-xs space-y-2">
                      <div className="flex items-center gap-2 font-bold text-neutral-900 text-sm">
                        <Sparkles size={16} className="text-brand-600" />
                        <span>Nhóm gợi ý phù hợp nhất cho bạn hôm nay</span>
                      </div>
                      <p className="text-neutral-600 leading-relaxed">
                        Phù hợp: Cùng môn học <strong>{baseFiltered[0]?.topic}</strong>, trùng lịch rảnh và khớp kỹ năng <strong>{baseFiltered[0]?.skills?.slice(0, 2).join(', ')}</strong>.
                      </p>
                    </div>
                  )}

                  <div className="space-y-4">
                    {baseFiltered.map((group) => renderGroupCard(group))}
                  </div>
                </div>
              );
            })()
          )}
        </div>
      </div>

      {/* Quick Join Request Dialog */}
      {selectedJoinGroup && (
        <Dialog open={!!selectedJoinGroup} onOpenChange={(open) => !open && setSelectedJoinGroup(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-brand-600" /> Xin tham gia nhóm
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-2 text-xs">
              <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 space-y-1">
                <div className="font-bold text-neutral-900 text-sm">{selectedJoinGroup.name}</div>
                <div className="text-neutral-500">Môn: {selectedJoinGroup.topic}</div>
                <div className="text-neutral-500">
                  Số chỗ còn trống:{' '}
                  <span className="font-semibold text-emerald-700">
                    {selectedJoinGroup.memberLimit - selectedJoinGroup.memberCount} chỗ
                  </span>
                </div>
              </div>

              {/* Student Skills Profile summary */}
              <div className="p-3 bg-blue-50/60 rounded-lg border border-blue-200 space-y-1.5">
                <div className="font-semibold text-blue-900 flex items-center gap-1.5">
                  <CheckCircle2 size={13} className="text-blue-600" />
                  <span>Hồ sơ gửi kèm cho Nhóm trưởng:</span>
                </div>
                <div className="text-neutral-700">
                  Họ tên: <strong>{user?.fullName || 'Sinh viên FPTU'}</strong> · Ngành: {user?.major || 'Kỹ thuật phần mềm'}
                </div>
                <div className="flex flex-wrap gap-1 pt-1">
                  {skills.map((s) => (
                    <span key={s} className="px-2 py-0.5 rounded bg-white text-blue-800 border border-blue-200 text-[11px] font-medium">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-neutral-800">
                  Lời nhắn gửi Nhóm trưởng:
                </label>
                <Textarea
                  placeholder="Giới thiệu bản thân ngắn gọn, mục tiêu điểm số hoặc kinh nghiệm liên quan..."
                  value={joinMessage}
                  onChange={(e) => setJoinMessage(e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="ghost" size="sm" onClick={() => setSelectedJoinGroup(null)}>
                Hủy
              </Button>
              <Button
                variant="primary"
                size="sm"
                loading={joinMutation.isPending}
                onClick={() =>
                  joinMutation.mutate({
                    groupId: selectedJoinGroup.id,
                    message: joinMessage.trim() || 'Em xin phép tham gia nhóm để cùng làm đồ án ạ!',
                  })
                }
                leftIcon={<Send size={14} />}
              >
                Gửi đơn tham gia
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
