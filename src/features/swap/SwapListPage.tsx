import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Repeat2,
  Sparkles,
  Search,
  RefreshCw,
  Mail,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Layers,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { DisclaimerBanner } from '@/components/shared/DisclaimerBanner';
import { AIFallbackBanner } from '@/components/shared/AIFallbackBanner';
import { QueryBoundary } from '@/components/shared/QueryBoundary';
import { EmptyState } from '@/components/shared/EmptyState';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Combobox } from '@/components/ui/Combobox';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/components/ui/Toast';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { formatRelativeTime } from '@/lib/format';
import { seedCourseOfferings } from '@/mocks/data/courseOfferings';
import { seedUsers } from '@/mocks/data/users';
import type { SwapRequest, SwapConnection, AiSwapMatch, CourseOffering } from '@/types/entities';

import { MySwapRequestItem } from './MySwapRequestItem';
import { SwapMatchCard } from './SwapMatchCard';
import { SwapRequestCard } from './SwapRequestCard';
import { SwapRequestDialog } from './SwapRequestDialog';
import { SendSwapConnectionDialog } from './SendSwapConnectionDialog';

export default function SwapListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const viewerId = useAuthStore((state) => state.user?.id);

  // URL query params
  const paramCreate = searchParams.get('create') === '1';
  const paramFor = searchParams.get('for');
  const paramMode = searchParams.get('mode') === 'direct' ? 'direct' : 'ai';

  // Local state
  const [statusFilterA, setStatusFilterA] = useState<'Open' | 'Connected' | 'Cancelled'>('Open');
  const [createDialogOpen, setCreateDialogOpen] = useState(paramCreate);
  const [editingRequest, setEditingRequest] = useState<SwapRequest | null>(null);
  const [cancelingRequest, setCancelingRequest] = useState<SwapRequest | null>(null);
  const [sendInviteTarget, setSendInviteTarget] = useState<SwapRequest | null>(null);
  const [mobileAOpen, setMobileAOpen] = useState(false);

  // Block B state
  const [matchMode, setMatchMode] = useState<'ai' | 'direct'>(paramMode);
  const [expandedMatches, setExpandedMatches] = useState(false);
  const [aiError, setAiError] = useState(false);
  const blockBRef = useRef<HTMLDivElement>(null);

  // Block C state
  const [searchQueryC, setSearchQueryC] = useState('');
  const [selectedOfferingC, setSelectedOfferingC] = useState<string>('all');
  const [sortModeC, setSortModeC] = useState<'newest' | 'random'>('newest');
  const [visibleCountC, setVisibleCountC] = useState(12);

  // Sync create param
  useEffect(() => {
    if (paramCreate && !createDialogOpen) {
      setCreateDialogOpen(true);
    }
  }, [paramCreate]);

  // Query: My Requests (All statuses)
  const myRequestsQuery = useQuery<SwapRequest[]>({
    queryKey: queryKeys.swap.list(),
    queryFn: () => apiClient.get('/swap-requests'),
  });

  const myRequests = myRequestsQuery.data || [];
  const myOpenRequests = useMemo(() => myRequests.filter((r) => r.status === 'Open'), [myRequests]);

  // Determine active open request for Block B
  const activeOpenRequest = useMemo(() => {
    if (myOpenRequests.length === 0) return null;
    if (paramFor) {
      const found = myOpenRequests.find((r) => r.id === paramFor);
      if (found) return found;
    }
    return myOpenRequests[0];
  }, [myOpenRequests, paramFor]);

  // Query: Course offerings for Block C Combobox
  const offeringsQuery = useQuery<CourseOffering[]>({
    queryKey: ['course-offerings'],
    queryFn: () => apiClient.get('/course-offerings'),
  });

  // Query: Connections for notifications and "Lời mời gần đây"
  const connectionsQuery = useQuery<SwapConnection[]>({
    queryKey: queryKeys.swap.connections(),
    queryFn: () => apiClient.get('/swap-connections'),
  });

  const incomingPendingCount = useMemo(() => {
    const conns = connectionsQuery.data || [];
    return conns.filter((c) => c.status === 'Pending' && c.recipientId === viewerId).length;
  }, [connectionsQuery.data, viewerId]);

  // Query: Matches for Block B
  const matchesQuery = useQuery<{
    aiMatches: AiSwapMatch[];
    directRequests: SwapRequest[];
    allRequests: SwapRequest[];
  }>({
    queryKey: ['swap', 'matches', activeOpenRequest?.id, matchMode],
    queryFn: async () => {
      if (!activeOpenRequest) return { aiMatches: [], directRequests: [], allRequests: [] };
      try {
        setAiError(false);
        const [directRes, aiRes, allRes] = await Promise.all([
          apiClient.get<SwapRequest[]>(`/swap-requests/${activeOpenRequest.id}/matches?mode=direct`),
          matchMode === 'ai'
            ? apiClient.get<AiSwapMatch[]>(`/swap-requests/${activeOpenRequest.id}/matches?mode=ai`)
            : Promise.resolve([]),
          apiClient.get<SwapRequest[]>('/swap-requests/explore'),
        ]);

        return {
          directRequests: directRes || [],
          aiMatches: aiRes || [],
          allRequests: allRes || [],
        };
      } catch {
        if (matchMode === 'ai') {
          setAiError(true);
          // Fallback to direct
          const directRes = await apiClient.get<SwapRequest[]>(
            `/swap-requests/${activeOpenRequest.id}/matches?mode=direct`
          );
          return {
            directRequests: directRes || [],
            aiMatches: [],
            allRequests: [],
          };
        }
        return { directRequests: [], aiMatches: [], allRequests: [] };
      }
    },
    enabled: !!activeOpenRequest,
  });

  // Resolve match cards data
  const resolvedMatches = useMemo(() => {
    if (!matchesQuery.data || !activeOpenRequest) return [];
    const { aiMatches, directRequests, allRequests } = matchesQuery.data;

    if (matchMode === 'ai' && !aiError && aiMatches.length > 0) {
      return aiMatches.map((m) => {
        const req =
          directRequests.find((r) => r.id === m.requestId) ||
          allRequests.find((r) => r.id === m.requestId);
        return {
          request: req,
          aiScore: m.score,
          aiReasons: m.reasons,
        };
      }).filter((item) => item.request != null) as Array<{
        request: SwapRequest;
        aiScore: number;
        aiReasons: string[];
      }>;
    }

    // Direct mode or fallback
    return directRequests.map((req) => {
      const isPerfect =
        req.currentClassCode === activeOpenRequest.targetClassCode &&
        req.targetClassCode === activeOpenRequest.currentClassCode;
      return {
        request: req,
        aiScore: isPerfect ? 95 : 75,
        aiReasons: isPerfect ? ['Đối ứng hoàn hảo 2 chiều'] : ['Cùng môn học'],
      };
    });
  }, [matchesQuery.data, activeOpenRequest, matchMode, aiError]);

  // Excluded IDs for Block C (my requests + cards in Block B)
  const excludedIdsFromC = useMemo(() => {
    const myIds = myRequests.map((r) => r.id);
    const matchIds = resolvedMatches.map((m) => m.request.id);
    return Array.from(new Set([...myIds, ...matchIds]));
  }, [myRequests, resolvedMatches]);

  // Query: Explore requests for Block C
  const exploreQuery = useQuery<SwapRequest[]>({
    queryKey: [
      'swap-explore',
      selectedOfferingC,
      searchQueryC,
      sortModeC,
      excludedIdsFromC.join(','),
    ],
    queryFn: () =>
      apiClient.get('/swap-requests/explore', {
        params: {
          offeringId: selectedOfferingC !== 'all' ? selectedOfferingC : undefined,
          q: searchQueryC.trim() || undefined,
          sort: sortModeC,
          excludeIds: excludedIdsFromC.join(','),
        },
      }),
  });

  // Cancel mutation
  const cancelMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/swap-requests/${id}`),
    onSuccess: () => {
      toast({ variant: 'default', title: 'Đã hủy yêu cầu đổi lớp' });
      setCancelingRequest(null);
      queryClient.invalidateQueries({ queryKey: ['swap'] });
    },
  });

  // Handlers
  const handleSelectOpenRequest = (reqId: string) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('for', reqId);
    setSearchParams(nextParams);
    setExpandedMatches(false);
  };

  const handleModeChange = (newMode: string) => {
    const mode = newMode as 'ai' | 'direct';
    setMatchMode(mode);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('mode', mode);
    setSearchParams(nextParams);
  };

  const handleCreateSuccess = (newReqId?: string) => {
    setCreateDialogOpen(false);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('create');
    if (newReqId) {
      nextParams.set('for', newReqId);
    }
    setSearchParams(nextParams);
    queryClient.invalidateQueries({ queryKey: ['swap', 'list'] });
    // Scroll to Block B
    setTimeout(() => {
      blockBRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 200);
  };

  // Filtered requests for Block A
  const filteredMyRequests = useMemo(() => {
    return myRequests.filter((r) => r.status === statusFilterA);
  }, [myRequests, statusFilterA]);

  // Combobox options for Block C
  const offeringOptions = useMemo(() => {
    const list = offeringsQuery.data || seedCourseOfferings;
    return [
      { value: 'all', label: 'Tất cả môn học' },
      ...list.map((o) => ({
        value: o.id,
        label: `${o.courseCode} - ${o.courseName}`,
        description: o.subjectCode,
      })),
    ];
  }, [offeringsQuery.data]);

  // Recent connections for Block A
  const recentConnections = useMemo(() => {
    const list = connectionsQuery.data || [];
    return list.slice(0, 3);
  }, [connectionsQuery.data]);

  const displayedMatches = expandedMatches ? resolvedMatches : resolvedMatches.slice(0, 6);
  const exploreItems = exploreQuery.data || [];
  const paginatedExploreItems = exploreItems.slice(0, visibleCountC);

  return (
    <div className="space-y-6 max-w-7xl 2xl:max-w-[1600px] 3xl:max-w-[1920px] 4xl:max-w-[2240px] mx-auto pb-12">
      <DisclaimerBanner />

      {/* Page Header */}
      <PageHeader
        title="Đổi lớp"
        description="Tìm bạn có nhu cầu đổi lớp tương ứng với bạn"
        actions={
          <div className="flex items-center gap-2">
            <Link to="/swap/connections">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Mail className="w-4 h-4" />}
                className="relative"
              >
                <span>Lời mời kết nối</span>
                {incomingPendingCount > 0 && (
                  <Badge
                    variant="brand"
                    className="ml-1.5 px-1.5 py-0 h-4 min-w-[16px] text-[10px] rounded-full"
                  >
                    {incomingPendingCount}
                  </Badge>
                )}
              </Button>
            </Link>

            <Button
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setCreateDialogOpen(true)}
            >
              Tạo yêu cầu
            </Button>
          </div>
        }
      />

      {/* Mobile Drawer / Summary for Block A (<768px) */}
      <div className="md:hidden">
        <Card className="border-neutral-200 dark:border-neutral-800">
          <CardContent className="p-3">
            <button
              type="button"
              onClick={() => setMobileAOpen(!mobileAOpen)}
              className="w-full flex items-center justify-between text-xs font-semibold text-neutral-800 dark:text-neutral-200"
            >
              <span className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-brand-600" />
                <span>Yêu cầu của tôi: {myOpenRequests.length} đang mở</span>
              </span>
              {mobileAOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {mobileAOpen && (
              <div className="pt-3 mt-2 border-t border-neutral-100 dark:border-neutral-800 space-y-2">
                {myOpenRequests.map((req) => (
                  <MySwapRequestItem
                    key={req.id}
                    request={req}
                    isSelected={req.id === activeOpenRequest?.id}
                    onSelect={() => {
                      handleSelectOpenRequest(req.id);
                      setMobileAOpen(false);
                    }}
                    onEdit={() => setEditingRequest(req)}
                    onCancel={() => setCancelingRequest(req)}
                  />
                ))}
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full text-xs"
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                  onClick={() => setCreateDialogOpen(true)}
                >
                  Tạo yêu cầu mới
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Desktop & Tablet 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Column (Khối B & Khối C) - 8/12 on desktop */}
        <div className="order-2 lg:order-1 lg:col-span-8 3xl:col-span-9 space-y-8">
          {/* KHỐI B: PHÙ HỢP VỚI BẠN */}
          <div ref={blockBRef} className="space-y-4">
            {myOpenRequests.length === 0 ? (
              /* CTA Banner when 0 open requests */
              <Card className="border-brand-200 bg-brand-50/50 dark:bg-brand-950/20 dark:border-brand-900 p-6 text-center space-y-3">
                <div className="inline-flex items-center justify-center p-3 bg-brand-100 dark:bg-brand-900/60 rounded-full text-brand-700 dark:text-brand-300">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                  Tạo yêu cầu đổi lớp để nhận gợi ý đối tác phù hợp
                </h3>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 max-w-md mx-auto">
                  SCS sẽ tự động tìm kiếm đối ứng hoàn hảo 2 chiều và phân tích độ tương thích lịch học với hệ thống AI thông minh.
                </p>
                <div>
                  <Button
                    size="sm"
                    leftIcon={<Plus className="w-4 h-4" />}
                    onClick={() => setCreateDialogOpen(true)}
                  >
                    Tạo yêu cầu đổi lớp ngay
                  </Button>
                </div>
              </Card>
            ) : (
              /* Block B Content */
              <div className="space-y-4">
                {/* Header & Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-neutral-200 dark:border-neutral-800">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                    <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100">
                      Phù hợp với bạn
                    </h2>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    {/* Request Switcher */}
                    <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                      <span className="hidden sm:inline">Theo yêu cầu:</span>
                      <Select
                        value={activeOpenRequest?.id}
                        onValueChange={handleSelectOpenRequest}
                        className="w-48 text-xs font-semibold h-8"
                      >
                        {myOpenRequests.map((req) => {
                          const off = seedCourseOfferings.find((o) => o.id === req.offeringId);
                          return (
                            <option key={req.id} value={req.id}>
                              {off?.courseCode || req.offeringId} · {req.currentClassCode} → {req.targetClassCode}
                            </option>
                          );
                        })}
                      </Select>
                    </div>

                    {/* Search Mode Toggle */}
                    <SegmentedControl
                      value={matchMode}
                      onChange={handleModeChange}
                      options={[
                        { label: 'Gợi ý AI', value: 'ai' },
                        { label: 'Trực tiếp', value: 'direct' },
                      ]}
                      size="sm"
                    />
                  </div>
                </div>

                {/* AI Fallback Banner */}
                {aiError && (
                  <AIFallbackBanner
                    visible={true}
                    onFallback={() => handleModeChange('direct')}
                  />
                )}

                {/* Match Cards Query Boundary */}
                <QueryBoundary
                  query={matchesQuery}
                  isEmpty={() => resolvedMatches.length === 0}
                  empty={
                    <EmptyState
                      icon={Repeat2}
                      title="Chưa tìm thấy ai khớp yêu cầu"
                      description={`Chưa có ai khớp với môn ${activeOpenRequest?.offeringId?.toUpperCase()} · ${activeOpenRequest?.currentClassCode} → ${activeOpenRequest?.targetClassCode}. Gợi ý sẽ tự động cập nhật khi có sinh viên khác đăng bài.`}
                    />
                  }
                >
                  {() => (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 3xl:grid-cols-3 4xl:grid-cols-4 gap-4">
                        {displayedMatches.map(({ request: partnerReq, aiScore, aiReasons }) => {
                          // Check if invite already sent
                          const hasSentInvite = (connectionsQuery.data || []).some(
                            (c) =>
                              c.requestAId === activeOpenRequest!.id &&
                              c.requestBId === partnerReq.id &&
                              c.status === 'Pending'
                          );

                          return (
                            <SwapMatchCard
                              key={partnerReq.id}
                              myRequest={activeOpenRequest!}
                              partnerRequest={partnerReq}
                              aiScore={aiScore}
                              aiReasons={aiReasons}
                              hasSentInvite={hasSentInvite}
                              onSendInvite={() => setSendInviteTarget(partnerReq)}
                            />
                          );
                        })}
                      </div>

                      {/* Expand in place button */}
                      {resolvedMatches.length > 6 && !expandedMatches && (
                        <div className="text-center pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setExpandedMatches(true)}
                          >
                            Xem thêm {resolvedMatches.length - 6} kết quả phù hợp
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </QueryBoundary>
              </div>
            )}
          </div>

          {/* KHỐI C: CÁC YÊU CẦU ĐỔI LỚP KHÁC */}
          <div className="space-y-4 pt-4 border-t border-neutral-200 dark:border-neutral-800">
            {/* Header & Filter Toolbar */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100">
                  {myOpenRequests.length === 0
                    ? 'Khám phá yêu cầu đổi lớp'
                    : 'Các yêu cầu đổi lớp khác'}
                </h2>

                {myOpenRequests.length === 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                    onClick={() => {
                      exploreQuery.refetch();
                    }}
                  >
                    Làm mới
                  </Button>
                )}
              </div>

              {/* Toolbar */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                {/* Search class code or course */}
                <div className="sm:col-span-5 relative">
                  <Input
                    value={searchQueryC}
                    onChange={(e) => {
                      setSearchQueryC(e.target.value);
                      setVisibleCountC(12);
                    }}
                    placeholder="Tìm theo mã lớp, mã môn..."
                    leftIcon={<Search className="w-4 h-4 text-neutral-400" />}
                    className="h-9 text-xs"
                  />
                </div>

                {/* Offering Combobox */}
                <div className="sm:col-span-4">
                  <Combobox
                    options={offeringOptions}
                    value={selectedOfferingC}
                    onChange={(v) => {
                      setSelectedOfferingC(v);
                      setVisibleCountC(12);
                    }}
                    placeholder="Môn: Tất cả môn"
                    searchPlaceholder="Tìm mã hoặc tên môn..."
                    className="text-xs"
                  />
                </div>

                {/* Sort Mode */}
                <div className="sm:col-span-3">
                  <Select
                    value={sortModeC}
                    onValueChange={(v) => setSortModeC(v as 'newest' | 'random')}
                    className="h-9 text-xs"
                  >
                    <option value="newest">Sắp xếp: Mới nhất</option>
                    <option value="random">Sắp xếp: Ngẫu nhiên</option>
                  </Select>
                </div>
              </div>
            </div>

            {/* Explore Cards Grid */}
            <QueryBoundary
              query={exploreQuery}
              isEmpty={(data) => data.length === 0}
              empty={
                <EmptyState
                  icon={Repeat2}
                  title="Không có yêu cầu đổi lớp phù hợp"
                  description="Thử thay đổi từ khóa tìm kiếm hoặc chọn môn học khác."
                />
              }
            >
              {(items) => (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 xl:grid-cols-3 3xl:grid-cols-4 4xl:grid-cols-5 gap-4">
                    {paginatedExploreItems.map((req) => (
                      <SwapRequestCard key={req.id} request={req} />
                    ))}
                  </div>

                  {/* Load more button */}
                  {items.length > visibleCountC && (
                    <div className="text-center pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setVisibleCountC((prev) => prev + 12)}
                      >
                        Tải thêm bài đăng ({items.length - visibleCountC} còn lại)
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </QueryBoundary>
          </div>
        </div>

        {/* Right Column (Khối A: Yêu cầu của tôi) - 4/12 sticky on desktop */}
        <div className="hidden lg:block lg:order-2 lg:col-span-4 3xl:col-span-3 sticky top-6 space-y-4">
          <Card className="border-neutral-200 dark:border-neutral-800 shadow-xs">
            <CardHeader className="pb-3 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100">
                  Yêu cầu của tôi
                </CardTitle>

                {/* Status Dropdown */}
                <Select
                  value={statusFilterA}
                  onValueChange={(v) => setStatusFilterA(v as 'Open' | 'Connected' | 'Cancelled')}
                  className="w-32 h-7 text-xs font-medium"
                >
                  <option value="Open">Đang mở</option>
                  <option value="Connected">Đã kết nối</option>
                  <option value="Cancelled">Đã hủy</option>
                </Select>
              </div>
            </CardHeader>

            <CardContent className="pt-3 space-y-3">
              {filteredMyRequests.length === 0 ? (
                <div className="text-center py-6 space-y-2">
                  <p className="text-xs text-neutral-400 italic">
                    Chưa có bài đăng nào ở trạng thái này
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs"
                    leftIcon={<Plus className="w-3.5 h-3.5" />}
                    onClick={() => setCreateDialogOpen(true)}
                  >
                    Tạo yêu cầu
                  </Button>
                </div>
              ) : (
                <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                  {filteredMyRequests.map((req) => (
                    <MySwapRequestItem
                      key={req.id}
                      request={req}
                      isSelected={req.id === activeOpenRequest?.id}
                      onSelect={() => handleSelectOpenRequest(req.id)}
                      onEdit={() => setEditingRequest(req)}
                      onCancel={() => setCancelingRequest(req)}
                    />
                  ))}
                </div>
              )}

              {filteredMyRequests.length > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full text-xs"
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                  onClick={() => setCreateDialogOpen(true)}
                >
                  Tạo yêu cầu đổi lớp
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Lời mời gần đây */}
          <Card className="border-neutral-200 dark:border-neutral-800 shadow-xs">
            <CardHeader className="pb-2 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100">
                  Lời mời gần đây
                </CardTitle>
                <Link
                  to="/swap/connections"
                  className="text-[11px] text-brand-600 hover:text-brand-700 dark:text-brand-400 font-medium inline-flex items-center gap-0.5"
                >
                  <span>Xem tất cả</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </CardHeader>
            <CardContent className="pt-3 space-y-2.5">
              {recentConnections.length === 0 ? (
                <p className="text-xs text-neutral-400 py-3 text-center italic">
                  Chưa có lời mời nào
                </p>
              ) : (
                recentConnections.map((conn) => {
                  const isIncoming = conn.recipientId === viewerId;
                  const otherUserId = isIncoming ? conn.initiatorId : conn.recipientId;
                  const otherUser = seedUsers.find((u) => u.id === otherUserId) || {
                    id: otherUserId,
                    fullName: 'Sinh viên FPT',
                  };

                  return (
                    <div
                      key={conn.id}
                      className="p-2.5 rounded-lg border border-neutral-100 dark:border-neutral-800/80 bg-neutral-50/50 dark:bg-neutral-900/40 text-xs flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <UserAvatar user={otherUser} size="xs" />
                        <div className="min-w-0">
                          <span className="block truncate font-medium text-neutral-900 dark:text-neutral-100">
                            {isIncoming
                              ? `${otherUser.fullName} mời bạn kết nối`
                              : `Bạn đã mời ${otherUser.fullName}`}
                          </span>
                          <span className="text-[10px] text-neutral-400 block">
                            {formatRelativeTime(conn.createdAt)}
                          </span>
                        </div>
                      </div>
                      <StatusBadge group="swapConnection" value={conn.status} className="text-[10px] shrink-0" />
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialogs */}
      {/* 1. Tạo yêu cầu mới */}
      {createDialogOpen && (
        <SwapRequestDialog
          open={createDialogOpen}
          onOpenChange={(open) => {
            setCreateDialogOpen(open);
            if (!open) {
              const nextParams = new URLSearchParams(searchParams);
              nextParams.delete('create');
              setSearchParams(nextParams);
            }
          }}
          mode="create"
          onSuccess={handleCreateSuccess}
        />
      )}

      {/* 2. Sửa yêu cầu */}
      {editingRequest && (
        <SwapRequestDialog
          open={!!editingRequest}
          onOpenChange={(open) => !open && setEditingRequest(null)}
          mode="edit"
          initialData={editingRequest}
          onSuccess={() => {
            setEditingRequest(null);
            queryClient.invalidateQueries({ queryKey: ['swap', 'list'] });
          }}
        />
      )}

      {/* 3. Hủy yêu cầu */}
      <ConfirmDialog
        open={!!cancelingRequest}
        onOpenChange={(open) => !open && setCancelingRequest(null)}
        title="Hủy bài đăng đổi lớp"
        description={
          (cancelingRequest?.pendingConnectionCount || 0) > 0
            ? `Bài đăng này đang có ${cancelingRequest?.pendingConnectionCount} lời mời kết nối chờ phản hồi. Hủy bài đăng sẽ đồng thời từ chối tất cả lời mời. Bạn có chắc muốn tiếp tục?`
            : 'Bạn có chắc muốn hủy bài đăng đổi lớp này không? Trạng thái sẽ chuyển thành Đã hủy.'
        }
        confirmLabel="Hủy bài đăng"
        danger={true}
        onConfirm={() => {
          if (cancelingRequest) {
            cancelMutation.mutate(cancelingRequest.id);
          }
        }}
      />

      {/* 4. Gửi lời mời kết nối từ Khối B */}
      {sendInviteTarget && activeOpenRequest && (
        <SendSwapConnectionDialog
          open={!!sendInviteTarget}
          onOpenChange={(open) => !open && setSendInviteTarget(null)}
          myRequest={activeOpenRequest}
          partnerRequest={sendInviteTarget}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['swap', 'connections'] });
            queryClient.invalidateQueries({ queryKey: ['swap', 'matches'] });
          }}
        />
      )}
    </div>
  );
}
