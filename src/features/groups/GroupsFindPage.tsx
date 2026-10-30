import React, { useState, useMemo } from 'react';
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
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Switch } from '@/components/ui/Switch';
import { Input } from '@/components/ui/Input';
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
  Search,
  GraduationCap,
  BookOpen,
  Gamepad2,
  MapPin,
  Target,
  ChevronDown,
  ChevronUp,
  RotateCcw,
} from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { seedUsers } from '@/mocks/data/users';
import type { Group, AiGroupMatch, ScheduleSlot, GroupCategory } from '@/types/entities';

const categoryTabs: { key: 'all' | GroupCategory; label: string; icon: React.ElementType }[] = [
  { key: 'all', label: 'Tất cả nhóm', icon: UsersRound },
  { key: 'project', label: 'Đồ án & Capstone', icon: GraduationCap },
  { key: 'study', label: 'Môn học & Ôn thi', icon: BookOpen },
  { key: 'entertainment', label: 'Nhóm Giải trí', icon: Gamepad2 },
];

const campusOptions = [
  { value: 'all', label: 'Tất cả cơ sở' },
  { value: 'Hòa Lạc', label: 'FPT Hòa Lạc (Hà Nội)' },
  { value: 'TP. Hồ Chí Minh', label: 'FPT TP. Hồ Chí Minh' },
  { value: 'Đà Nẵng', label: 'FPT Đà Nẵng' },
  { value: 'Cần Thơ', label: 'FPT Cần Thơ' },
  { value: 'Quy Nhơn', label: 'FPT Quy Nhơn' },
];

const goalOptions = [
  { value: 'all', label: 'Mọi mức độ mục tiêu' },
  { value: 'Aim 9.0+', label: '🎯 Aim 9.0+ (Săn học bổng)' },
  { value: 'Aim 8.5+', label: '🎯 Aim 8.5+ (Điểm giỏi)' },
  { value: 'qua môn', label: '🛡️ Chắc chắn qua môn' },
  { value: 'Xả stress', label: '🎉 Giao lưu & Thư giãn' },
];

export default function GroupsFindPage() {
  const { user } = useAuthStore();
  const [selectedCategory, setSelectedCategory] = useState<'all' | GroupCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedCampus, setSelectedCampus] = useState('all');
  const [selectedGoal, setSelectedGoal] = useState('all');
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [skills, setSkills] = useState<string[]>(['React', 'TypeScript']);
  const [availability, setAvailability] = useState<ScheduleSlot[]>([
    { day: 'Tue', start: '19:00', end: '21:00' },
  ]);
  const [useAi, setUseAi] = useState(false);
  const [selectedJoinGroup, setSelectedJoinGroup] = useState<Group | null>(null);
  const [appliedRole, setAppliedRole] = useState('');
  const [joinMessage, setJoinMessage] = useState('');
  const [appliedGroupIds, setAppliedGroupIds] = useState<Set<string>>(new Set());
  const navigate = useNavigate();

  const allGroupsQuery = useQuery<Group[]>({
    queryKey: queryKeys.groups.list,
    queryFn: () => apiClient.get('/groups'),
  });

  const joinMutation = useMutation({
    mutationFn: ({ groupId, message, role }: { groupId: string; message: string; role?: string }) =>
      apiClient.post(`/groups/${groupId}/join-requests`, { message, appliedRole: role }),
    onSuccess: (_, vars) => {
      toast.success('Đã gửi đơn xin tham gia nhóm kèm hồ sơ kỹ năng của bạn!');
      setAppliedGroupIds((prev) => new Set([...prev, vars.groupId]));
      setSelectedJoinGroup(null);
      setJoinMessage('');
      setAppliedRole('');
    },
    onError: () => toast.error('Không thể gửi yêu cầu tham gia.'),
  });

  const searchMutation = useMutation({
    mutationFn: (payload: any) => apiClient.post('/groups/search', payload) as Promise<AiGroupMatch[] | Group[]>,
  });

  const handleSearch = () => {
    searchMutation.mutate({
      category: selectedCategory !== 'all' ? selectedCategory : undefined,
      keyword: searchQuery || undefined,
      campus: selectedCampus !== 'all' ? selectedCampus : undefined,
      targetGoal: selectedGoal !== 'all' ? selectedGoal : undefined,
      skills,
      availability,
      mode: useAi ? 'ai' : 'filter',
    });
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCampus('all');
    setSelectedGoal('all');
    setOnlyAvailable(false);
    setUseAi(false);
  };

  const activeAdvancedCount = useMemo(() => {
    let count = 0;
    if (selectedCampus !== 'all') count++;
    if (selectedGoal !== 'all') count++;
    if (onlyAvailable) count++;
    if (useAi) count++;
    return count;
  }, [selectedCampus, selectedGoal, onlyAvailable, useAi]);

  const isAiFailed = useAi && searchMutation.isError;
  const groupsList = allGroupsQuery.data || [];

  // Filter groups locally if not searching via mutation
  const displayedGroups = useMemo(() => {
    return groupsList.filter((g) => {
      // Category filter
      if (selectedCategory !== 'all') {
        const cat = g.category || (g.purpose === 'Dự án' ? 'project' : g.purpose === 'Học tập' ? 'study' : 'entertainment');
        if (cat !== selectedCategory) return false;
      }
      // Campus filter
      if (selectedCampus !== 'all' && g.campus && g.campus !== selectedCampus) {
        return false;
      }
      // Goal filter
      if (selectedGoal !== 'all' && g.targetGoal && !g.targetGoal.toLowerCase().includes(selectedGoal.toLowerCase())) {
        return false;
      }
      // Only available filter
      if (onlyAvailable && g.memberCount >= g.memberLimit) {
        return false;
      }
      // Keyword filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = g.name.toLowerCase().includes(q);
        const matchesTopic = g.topic.toLowerCase().includes(q);
        const matchesSkill = g.skills.some((s) => s.toLowerCase().includes(q));
        const matchesRoles = g.rolesNeeded?.some((r) => r.toLowerCase().includes(q));
        if (!matchesName && !matchesTopic && !matchesSkill && !matchesRoles) return false;
      }
      return true;
    });
  }, [groupsList, selectedCategory, selectedCampus, selectedGoal, onlyAvailable, searchQuery]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader
        title="Tìm nhóm đồ án, môn học & giải trí"
        description="Nền tảng ghép nhóm sinh viên: minh bạch mục tiêu, rõ ràng vị trí còn thiếu và kết nối đồng đội phù hợp."
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

      {/* Category Tabs: 3 Main Categories + All */}
      <div className="flex items-center gap-2 border-b border-neutral-200 pb-2 overflow-x-auto">
        {categoryTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = selectedCategory === tab.key;
          const count = tab.key === 'all'
            ? groupsList.length
            : groupsList.filter((g) => (g.category || (g.purpose === 'Dự án' ? 'project' : g.purpose === 'Học tập' ? 'study' : 'entertainment')) === tab.key).length;

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setSelectedCategory(tab.key)}
              className={cn(
                'flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer',
                isActive
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
              )}
            >
              <Icon size={14} className={isActive ? 'text-white' : 'text-neutral-500'} />
              <span>{tab.label}</span>
              <span
                className={cn(
                  'px-1.5 py-0.2 rounded-full text-[10px]',
                  isActive ? 'bg-brand-700 text-white' : 'bg-neutral-200 text-neutral-600'
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Compact Search & Action Bar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Nhập tên môn (SWP391, PRJ301...), vai trò (Frontend, UI/UX), sở thích (Cầu lông, Game)..."
              className="pl-10 h-10 text-sm bg-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              className="h-10 px-4"
              onClick={handleSearch}
              loading={searchMutation.isPending}
              leftIcon={<Search size={15} />}
            >
              Tìm kiếm
            </Button>

            <Button
              type="button"
              variant={showAdvancedFilters ? 'primary' : 'outline'}
              className={cn('h-10 px-3.5 flex items-center gap-1.5', showAdvancedFilters ? '' : 'text-neutral-700')}
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            >
              <SlidersHorizontal size={15} />
              <span>Bộ lọc nâng cao</span>
              {activeAdvancedCount > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[11px] bg-brand-100 text-brand-800 font-bold">
                  {activeAdvancedCount}
                </span>
              )}
              {showAdvancedFilters ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </Button>

            {(searchQuery || activeAdvancedCount > 0) && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-10 text-neutral-500 hover:text-neutral-800"
                onClick={handleResetFilters}
                title="Đặt lại bộ lọc"
              >
                <RotateCcw size={14} />
              </Button>
            )}
          </div>
        </div>

        {/* Collapsible Advanced Filters Panel */}
        {showAdvancedFilters && (
          <Card className="border border-neutral-200 bg-neutral-50/70 p-4 shadow-xs space-y-4 animate-in fade-in-50 duration-200">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormField label="Cơ sở / Campus">
                <Select
                  options={campusOptions}
                  value={selectedCampus}
                  onValueChange={setSelectedCampus}
                />
              </FormField>

              <FormField label="Mục tiêu cam kết">
                <Select
                  options={goalOptions}
                  value={selectedGoal}
                  onValueChange={setSelectedGoal}
                />
              </FormField>

              <div className="space-y-2 pt-1 sm:pt-6">
                <label className="flex items-center gap-2 text-xs font-semibold text-neutral-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={onlyAvailable}
                    onChange={(e) => setOnlyAvailable(e.target.checked)}
                    className="rounded border-neutral-300 text-brand-600 focus:ring-brand-500"
                  />
                  <span>Chỉ hiện nhóm còn chỗ trống</span>
                </label>

                <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-neutral-200">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-neutral-800">
                    <Sparkles size={14} className="text-brand-600" /> Ghép nối AI thông minh
                  </div>
                  <Switch checked={useAi} onCheckedChange={setUseAi} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-neutral-200/80">
              <FormField label="Kỹ năng của bạn">
                <TagInput
                  value={skills}
                  onChange={setSkills}
                  suggestions={['React', 'TypeScript', 'Node.js', 'Java', 'UI/UX', 'Python', 'Cầu lông', 'Valorant']}
                />
              </FormField>

              <FormField label="Khung giờ rảnh của bạn">
                <ScheduleInput value={availability} onChange={setAvailability} />
              </FormField>
            </div>
          </Card>
        )}
      </div>

      {/* Main Results Container */}
      <div className="space-y-4">
        <AIFallbackBanner visible={isAiFailed} />

        {searchMutation.isPending ? (
          <LoadingSkeleton variant="card" count={3} />
        ) : (
          (() => {
            const aiResults = useAi && !isAiFailed && searchMutation.variables?.mode === 'ai' && searchMutation.data
              ? (searchMutation.data as AiGroupMatch[]).filter((match) => displayedGroups.some((group) => group.id === match.groupId)) : null;

            const renderGroupCard = (group: Group, matchInfo?: { score?: number; reasons?: string[] }) => {
              const owner = seedUsers.find((u) => u.id === group.ownerId) || {
                id: group.ownerId,
                fullName: 'Trưởng nhóm',
                school: 'Đại học FPT',
                major: 'Kỹ thuật phần mềm',
              };
              const isFull = group.memberCount >= group.memberLimit;
              const emptySlots = Math.max(0, group.memberLimit - group.memberCount);
              const hasApplied = appliedGroupIds.has(group.id);
              const percent = Math.min(100, Math.round((group.memberCount / group.memberLimit) * 100));

              const categoryLabel =
                group.category === 'project' || group.purpose === 'Dự án'
                  ? 'Đồ án'
                  : group.category === 'study' || group.purpose === 'Học tập'
                  ? 'Môn học / Ôn thi'
                  : 'Giải trí & Sở thích';

              const categoryBadgeTier =
                categoryLabel === 'Đồ án'
                  ? 'brand'
                  : categoryLabel === 'Môn học / Ôn thi'
                  ? 'success'
                  : 'attention';

              const cardBody = (
                <Card key={group.id} className="p-4 sm:p-5 hover:border-brand-300 transition-all shadow-xs space-y-3.5 bg-surface">
                  {/* Top Row: Category + Goal + Campus Badges */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge tier={categoryBadgeTier as any} size="sm" className="font-semibold">
                          {categoryLabel}
                        </Badge>
                        {group.targetGoal && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            <Target size={11} /> {group.targetGoal}
                          </span>
                        )}
                        {group.campus && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-neutral-100 text-neutral-700">
                            <MapPin size={11} /> {group.campus}
                          </span>
                        )}
                        <Badge tier="neutral" size="sm">
                          {group.joinMode === 'direct' ? 'Vào trực tiếp' : 'Duyệt hồ sơ'}
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
                          users={[{ name: owner.fullName }, { name: 'Thành viên' }]}
                          max={3}
                          size="sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Role Matrix: Roles filled and Roles needed */}
                  {group.rolesNeeded && group.rolesNeeded.length > 0 && (
                    <div className="p-2.5 rounded-lg bg-neutral-50/80 border border-neutral-200 text-xs space-y-1.5">
                      <div className="text-[11px] font-semibold text-neutral-700">Vị trí nhóm đang khuyết:</div>
                      <div className="flex flex-wrap gap-1.5">
                        {group.rolesNeeded.map((role) => (
                          <span
                            key={role}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300 rounded px-2 py-0.5"
                          >
                            🔍 Tuyển: {role}
                          </span>
                        ))}
                        {group.rolesFilled?.map((role) => (
                          <span
                            key={role}
                            className="inline-flex items-center gap-1 text-[11px] font-medium bg-neutral-200/60 text-neutral-600 rounded px-2 py-0.5"
                          >
                            ✓ {role}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tags: Skills needed & Activity time */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    <span className="text-[11px] font-semibold text-neutral-500 mr-0.5">Kỹ năng/Yêu cầu:</span>
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
                          onClick={() => {
                            setSelectedJoinGroup(group);
                            setAppliedRole(group.rolesNeeded?.[0] || '');
                          }}
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

            // 1. AI Search Results
            if (aiResults && aiResults.length > 0) {
              return (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50/70 border border-blue-200 text-xs text-blue-900">
                    <Sparkles size={16} className="text-blue-600 shrink-0" />
                    <span>
                      <strong>Gợi ý AI thông minh:</strong> Tìm thấy {aiResults.length} nhóm có lịch rảnh và kỹ năng tương thích với bạn.
                    </span>
                  </div>
                  {aiResults.map((match) => {
                    const group = displayedGroups.find((g) => g.id === match.groupId);
                    if (!group) return null;
                    return renderGroupCard(group, { score: match.score, reasons: match.reasons });
                  })}
                </div>
              );
            }

            // 2. Filter List
            if (displayedGroups.length === 0) {
              return (
                <EmptyState
                  icon={UsersRound}
                  title="Chưa tìm thấy nhóm nào phù hợp"
                  description="Thử đổi danh mục hoặc tạo nhóm mới để kết nối các bạn sinh viên khác!"
                  actionLabel="Tạo nhóm mới ngay"
                  onAction={() => navigate('/groups/new')}
                />
              );
            }

            return (
              <div className="space-y-4">
                {displayedGroups.map((group) => renderGroupCard(group))}
              </div>
            );
          })()
        )}
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
                <div className="text-neutral-500">Mục tiêu: {selectedJoinGroup.targetGoal || selectedJoinGroup.topic}</div>
                <div className="text-neutral-500">
                  Số chỗ còn trống:{' '}
                  <span className="font-semibold text-emerald-700">
                    {selectedJoinGroup.memberLimit - selectedJoinGroup.memberCount} chỗ
                  </span>
                </div>
              </div>

              {/* Position / Role Selection */}
              {selectedJoinGroup.rolesNeeded && selectedJoinGroup.rolesNeeded.length > 0 && (
                <div className="space-y-1.5">
                  <label className="font-semibold text-neutral-800">
                    Vị trí bạn muốn đảm nhận trong nhóm:
                  </label>
                  <Select
                    options={selectedJoinGroup.rolesNeeded.map((r) => ({ value: r, label: r }))}
                    value={appliedRole}
                    onValueChange={setAppliedRole}
                  />
                </div>
              )}

              {/* Student Skills Profile summary */}
              <div className="p-3 bg-blue-50/60 rounded-lg border border-blue-200 space-y-1.5">
                <div className="font-semibold text-blue-900 flex items-center gap-1.5">
                  <CheckCircle2 size={13} className="text-blue-600" />
                  <span>Hồ sơ tự động gửi kèm cho Trưởng nhóm:</span>
                </div>
                <div className="text-neutral-700">
                  Sinh viên: <strong>{user?.fullName || 'Sinh viên FPT'}</strong> · Ngành: {user?.major || 'Kỹ thuật phần mềm'}
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
                  Lời nhắn gửi Trưởng nhóm:
                </label>
                <Textarea
                  placeholder="Giới thiệu bản thân ngắn gọn, kinh nghiệm liên quan và cam kết tiến độ..."
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
                    role: appliedRole,
                    message: joinMessage.trim() || 'Em xin phép tham gia nhóm để cùng làm việc và đồng hành ạ!',
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
