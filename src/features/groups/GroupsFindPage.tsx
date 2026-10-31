import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { PageHeader } from '@/components/shared/PageHeader';
import { FormField } from '@/components/shared/FormField';
import { TagInput } from '@/components/shared/TagInput';
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
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/Popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { Textarea } from '@/components/ui/Textarea';
import { toast } from '@/components/ui/Toast';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/cn';
import { CAMPUS_OPTIONS as campusOptions } from '@/lib/campuses';
import {
  UsersRound,
  Users,
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
  const [filterPopoverOpen, setFilterPopoverOpen] = useState(false);
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

            <Popover open={filterPopoverOpen} onOpenChange={setFilterPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant={filterPopoverOpen || activeAdvancedCount > 0 ? 'primary' : 'outline'}
                  className={cn(
                    'h-10 px-3.5 flex items-center gap-1.5',
                    filterPopoverOpen || activeAdvancedCount > 0 ? '' : 'text-neutral-700'
                  )}
                >
                  <SlidersHorizontal size={15} />
                  <span>Bộ lọc nâng cao</span>
                  {activeAdvancedCount > 0 && (
                    <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[11px] bg-white text-brand-800 font-bold">
                      {activeAdvancedCount}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>

              <PopoverContent
                align="end"
                sideOffset={8}
                collisionPadding={12}
                className="w-[340px] sm:w-[400px] max-h-[calc(100vh-140px)] p-0 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-surface shadow-2xl z-50 flex flex-col overflow-hidden"
              >
                {/* Header cố định */}
                <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-900/60">
                  <div className="flex items-center gap-1.5 font-semibold text-sm text-neutral-900 dark:text-neutral-100">
                    <SlidersHorizontal size={15} className="text-brand-600" />
                    <span>Bộ lọc nâng cao</span>
                    {activeAdvancedCount > 0 && (
                      <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-brand-100 text-brand-700 font-bold">
                        {activeAdvancedCount}
                      </span>
                    )}
                  </div>
                  {activeAdvancedCount > 0 && (
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="text-xs text-brand-600 hover:text-brand-700 font-medium cursor-pointer"
                    >
                      Đặt lại
                    </button>
                  )}
                </div>

                {/* Body cuộn linh hoạt khi chiều cao màn hình nhỏ */}
                <div className="p-4 space-y-3.5 flex-1 overflow-y-auto overscroll-contain">
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

                  <FormField label="Kỹ năng mong muốn">
                    <TagInput
                      value={skills}
                      onChange={setSkills}
                      suggestions={['React', 'TypeScript', 'Node.js', 'UI/UX']}
                      placeholder="Nhập kỹ năng rồi bấm Enter..."
                    />
                  </FormField>

                  <label className="flex items-center gap-2.5 text-xs font-semibold text-neutral-800 dark:text-neutral-200 cursor-pointer pt-0.5">
                    <input
                      type="checkbox"
                      checked={onlyAvailable}
                      onChange={(e) => setOnlyAvailable(e.target.checked)}
                      className="rounded border-neutral-300 text-brand-600 focus:ring-brand-500 w-4 h-4 cursor-pointer"
                    />
                    <span>Chỉ hiện nhóm còn chỗ trống</span>
                  </label>

                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-neutral-800 dark:text-neutral-200">
                      <Sparkles size={14} className="text-brand-600" /> Ghép nối AI thông minh
                    </div>
                    <Switch checked={useAi} onCheckedChange={setUseAi} />
                  </div>
                </div>

                {/* Footer cố định - Luôn hiển thị nút Áp dụng và Đóng */}
                <div className="shrink-0 px-4 py-3 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-900/60 flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFilterPopoverOpen(false)}
                    className="text-xs"
                  >
                    Đóng
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      setFilterPopoverOpen(false);
                      handleSearch();
                    }}
                    className="text-xs"
                  >
                    Áp dụng
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

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
                <Card key={group.id} className="p-4 hover:border-brand-300 transition-all shadow-xs space-y-3 bg-surface">
                  {/* Top: Badges & Quota */}
                  <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Badge tier={categoryBadgeTier as any} size="sm" className="font-semibold">
                        {categoryLabel}
                      </Badge>
                      {group.targetGoal && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
                          <Target size={11} /> {group.targetGoal}
                        </span>
                      )}
                      {group.campus && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-neutral-100 text-neutral-600">
                          <MapPin size={11} /> {group.campus}
                        </span>
                      )}
                    </div>
                    <span className={cn('text-xs font-semibold px-2.5 py-0.5 rounded-full', isFull ? 'bg-red-50 text-red-600' : 'bg-neutral-100 text-neutral-700')}>
                      <Users size={12} className="inline mr-1" />
                      {group.memberCount}/{group.memberLimit} thành viên
                    </span>
                  </div>

                  {/* Title & Topic */}
                  <div>
                    <h3 className="text-base font-bold text-neutral-900 hover:text-brand-600 transition-colors line-clamp-1">
                      <Link to={`/groups/${group.id}`}>{group.name}</Link>
                    </h3>
                    <p className="text-xs text-neutral-600 line-clamp-1 mt-0.5 leading-relaxed">{group.topic}</p>
                  </div>

                  {/* Key Role needed (chỉ hiển thị vị trí cần tuyển nếu nhóm chưa đầy) */}
                  {group.rolesNeeded && group.rolesNeeded.length > 0 && !isFull && (
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="text-[11px] text-neutral-500 font-medium">Cần tuyển:</span>
                      <div className="flex flex-wrap gap-1">
                        {group.rolesNeeded.slice(0, 2).map((role) => (
                          <span
                            key={role}
                            className="px-2 py-0.5 text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 rounded"
                          >
                            🔍 {role}
                          </span>
                        ))}
                        {group.rolesNeeded.length > 2 && (
                          <span className="text-[11px] text-neutral-400">+{group.rolesNeeded.length - 2}</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Footer: Owner & Actions */}
                  <div className="flex items-center justify-between pt-2.5 border-t border-neutral-100 text-xs">
                    <span className="text-[11px] text-neutral-500 truncate max-w-[200px]">
                      Trưởng nhóm: <strong className="text-neutral-700 font-medium">{owner.fullName}</strong>
                    </span>

                    <div className="flex items-center gap-2 shrink-0">
                      <Link to={`/groups/${group.id}`}>
                        <Button size="sm" variant="outline" className="text-xs">
                          Chi tiết
                        </Button>
                      </Link>

                      {isFull ? (
                        <span className="text-xs text-neutral-400 font-medium px-2 py-1">
                          Đã đủ
                        </span>
                      ) : hasApplied ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 size={13} className="text-emerald-600" /> Đã gửi
                        </span>
                      ) : (
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => {
                            setSelectedJoinGroup(group);
                            setAppliedRole(group.rolesNeeded?.[0] || '');
                          }}
                          className="text-xs"
                          leftIcon={<UserCheck size={14} />}
                        >
                          Xin vào
                        </Button>
                      )}
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
