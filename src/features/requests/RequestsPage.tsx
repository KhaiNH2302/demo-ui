import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Inbox,
  Repeat2,
  UsersRound,
  GraduationCap,
  Building2,
  HeartHandshake,
  UserPlus,
  Clock,
  ArrowRight,
  Send,
  CheckCircle2,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { PageHeader } from '@/components/shared/PageHeader';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { FilterSelect } from '@/components/shared/FilterSelect';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import type { NavCounters } from '@/types/entities';

interface RequestItem {
  id: string;
  module: string;
  moduleLabel: string;
  title: string;
  fromUser?: { id: string; fullName: string; avatarUrl?: string };
  to?: string;
  createdAt: string;
  status: string;
  linkTo: string;
}

export const RequestsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'incoming' | 'outgoing' | 'history'>('incoming');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const { data: requests, isLoading } = useQuery<RequestItem[]>({
    queryKey: ['requests', activeTab],
    queryFn: () => apiClient.get('/requests', { params: { box: activeTab } }),
  });

  const { data: counters } = useQuery<NavCounters>({
    queryKey: ['nav', 'counters'],
    queryFn: () => apiClient.get('/nav/counters'),
  });

  // Uniform icon framing (No rainbow icons per 00-tokens.md)
  const getModuleIcon = (module: string) => {
    if (module.startsWith('club')) return <Building2 size={15} />;
    if (module.startsWith('program') || module === 'co_organizer') return <HeartHandshake size={15} />;
    if (module === 'follow' || module === 'connection_invite') return <UserPlus size={15} />;
    if (module === 'swap') return <Repeat2 size={15} />;
    if (module === 'group') return <UsersRound size={15} />;
    if (module === 'mentoring' || module === 'mentor_apply') return <GraduationCap size={15} />;
    return <Inbox size={15} />;
  };

  const categories = [
    { key: 'all', label: 'Tất cả loại yêu cầu' },
    { key: 'club', label: 'Câu lạc bộ' },
    { key: 'program', label: 'Hoạt động' },
    { key: 'social', label: 'Theo dõi & Kết nối' },
    { key: 'swap', label: 'Đổi lớp' },
    { key: 'group', label: 'Nhóm kết nối' },
    { key: 'mentoring', label: 'Mentoring' },
  ];

  const matchesCategory = (mod: string, cat: string) => {
    if (cat === 'all') return true;
    if (cat === 'club') return mod.startsWith('club');
    if (cat === 'program') return mod.startsWith('program') || mod === 'co_organizer';
    if (cat === 'social') return mod === 'follow' || mod === 'connection_invite' || mod === 'chat';
    if (cat === 'mentoring') return mod === 'mentoring' || mod === 'mentor_apply';
    return mod === cat;
  };

  const filteredRequests = (requests || []).filter((req) =>
    matchesCategory(req.module, selectedCategory)
  );

  return (
    <div className="space-y-6">
      <PageHeader
        variant="band"
        icon={Inbox}
        title="Trung tâm Yêu cầu"
        description="Theo dõi tập trung các yêu cầu cần bạn xử lý, đơn đăng ký đã gửi và lịch sử phản hồi trên toàn hệ thống"
      />

      {/* 3 Summary Counter Cards (C13 spec) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card
          className={`p-4 flex items-center justify-between cursor-pointer transition-colors ${
            activeTab === 'incoming' ? 'border-brand-500 bg-brand-50/30' : 'hover:border-neutral-300'
          }`}
          onClick={() => setActiveTab('incoming')}
        >
          <div>
            <p className="text-xs font-medium text-neutral-500">Cần tôi xử lý</p>
            <p className="text-2xl font-bold text-neutral-900 mt-1">
              {counters?.pendingRequestsTotal ?? 8}
            </p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
            <Inbox size={18} />
          </div>
        </Card>

        <Card
          className={`p-4 flex items-center justify-between cursor-pointer transition-colors ${
            activeTab === 'outgoing' ? 'border-brand-500 bg-brand-50/30' : 'hover:border-neutral-300'
          }`}
          onClick={() => setActiveTab('outgoing')}
        >
          <div>
            <p className="text-xs font-medium text-neutral-500">Tôi đã gửi đang chờ</p>
            <p className="text-2xl font-bold text-neutral-900 mt-1">4</p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-neutral-100 text-neutral-600 flex items-center justify-center">
            <Send size={18} />
          </div>
        </Card>

        <Card
          className={`p-4 flex items-center justify-between cursor-pointer transition-colors ${
            activeTab === 'history' ? 'border-brand-500 bg-brand-50/30' : 'hover:border-neutral-300'
          }`}
          onClick={() => setActiveTab('history')}
        >
          <div>
            <p className="text-xs font-medium text-neutral-500">Đã xử lý / Lịch sử</p>
            <p className="text-2xl font-bold text-neutral-900 mt-1">12</p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-neutral-100 text-neutral-600 flex items-center justify-center">
            <CheckCircle2 size={18} />
          </div>
        </Card>
      </div>

      {/* Main Box Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as any)}
        className="w-full space-y-6"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-neutral-200 pb-3">
          <TabsList className="bg-neutral-100 p-1 rounded-xl">
            <TabsTrigger value="incoming" className="rounded-lg text-xs font-semibold">
              <span>Cần tôi xử lý</span>
              {counters && counters.pendingRequestsTotal > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-brand-600 text-white text-xs font-semibold">
                  {counters.pendingRequestsTotal}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="outgoing" className="rounded-lg text-xs font-semibold">
              Tôi đã gửi
            </TabsTrigger>
            <TabsTrigger value="history" className="rounded-lg text-xs font-semibold">
              Lịch sử
            </TabsTrigger>
          </TabsList>

          {/* Module Filter Dropdown */}
          <div className="flex items-center gap-2">
            <FilterSelect
              label="Loại yêu cầu"
              value={selectedCategory}
              onChange={setSelectedCategory}
              options={categories.map((c) => ({
                value: c.key,
                label: c.label,
              }))}
            />
          </div>
        </div>

        <TabsContent value={activeTab} className="mt-0">
          {isLoading ? (
            <LoadingSkeleton count={4} />
          ) : filteredRequests.length === 0 ? (
            <EmptyState
              title={
                activeTab === 'incoming'
                  ? 'Không có yêu cầu nào cần bạn xử lý'
                  : activeTab === 'outgoing'
                  ? 'Bạn chưa gửi yêu cầu nào'
                  : 'Chưa có lịch sử yêu cầu'
              }
              description={
                activeTab === 'incoming'
                  ? 'Các lời mời kết nối, đơn cần bổ sung thông tin hoặc đơn đăng ký chờ bạn xét duyệt sẽ hiển thị tại đây.'
                  : 'Các yêu cầu và đơn đăng ký bạn gửi đi sẽ được lưu trữ và cập nhật trạng thái tại đây.'
              }
            />
          ) : (
            <div className="space-y-3">
              {filteredRequests.map((item) => (
                <Card
                  key={item.id}
                  className="p-4 sm:p-5 hover:border-neutral-300 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    {item.fromUser ? (
                      <UserAvatar user={item.fromUser} size="md" linkToProfile />
                    ) : (
                      <div className="h-10 w-10 rounded-lg bg-neutral-100 text-neutral-600 flex items-center justify-center shrink-0">
                        {getModuleIcon(item.module)}
                      </div>
                    )}

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tier="neutral" size="sm" className="gap-1">
                          {getModuleIcon(item.module)}
                          <span>{item.moduleLabel}</span>
                        </Badge>
                        <StatusBadge status={item.status} />
                      </div>

                      <h3 className="font-bold text-sm sm:text-base text-neutral-900 leading-snug">
                        {item.title}
                      </h3>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-500">
                        {item.fromUser && (
                          <span>
                            Từ: <strong className="text-neutral-700">{item.fromUser.fullName}</strong>
                          </span>
                        )}
                        {item.to && (
                          <span>
                            Tới: <strong className="text-neutral-700">{item.to}</strong>
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action button */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <Link to={item.linkTo}>
                      <Button variant="secondary" size="sm" rightIcon={<ArrowRight size={14} />}>
                        Xem & Xử lý
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

export default RequestsPage;
