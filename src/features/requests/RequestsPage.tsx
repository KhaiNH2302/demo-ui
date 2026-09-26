import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Inbox,
  Repeat2,
  UsersRound,
  GraduationCap,
  Building2,
  MessageCircle,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { PageHeader } from '@/components/shared/PageHeader';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { useToast } from '@/components/ui/Toast';
import type { NavCounters } from '@/types/entities';

interface RequestItem {
  id: string;
  module: 'swap' | 'group' | 'mentoring' | 'club' | 'chat' | 'mentor_apply';
  moduleLabel: string;
  title: string;
  fromUser?: { id: string; fullName: string; avatarUrl?: string };
  to?: string;
  createdAt: string;
  status: any;
  linkTo: string;
}

export const RequestsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'incoming' | 'outgoing' | 'history'>('incoming');
  const [selectedModule, setSelectedModule] = useState('all');
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query requests
  const { data: requests, isLoading } = useQuery<RequestItem[]>({
    queryKey: ['requests', activeTab, selectedModule],
    queryFn: () => apiClient.get('/requests', { params: { box: activeTab, module: selectedModule } }),
  });

  // Query counters for badges
  const { data: counters } = useQuery<NavCounters>({
    queryKey: ['nav', 'counters'],
    queryFn: () => apiClient.get('/nav/counters'),
  });

  const getModuleIcon = (module: RequestItem['module']) => {
    switch (module) {
      case 'swap':
        return <Repeat2 size={16} className="text-brand-600" />;
      case 'group':
        return <UsersRound size={16} className="text-accent-600" />;
      case 'mentoring':
        return <GraduationCap size={16} className="text-emerald-600" />;
      case 'club':
        return <Building2 size={16} className="text-amber-600" />;
      case 'chat':
        return <MessageCircle size={16} className="text-indigo-600" />;
      default:
        return <Inbox size={16} className="text-neutral-600" />;
    }
  };

  const modules = [
    { key: 'all', label: 'Tất cả loại yêu cầu' },
    { key: 'swap', label: 'Đổi lớp' },
    { key: 'group', label: 'Nhóm kết nối' },
    { key: 'mentoring', label: 'Mentoring' },
    { key: 'club', label: 'Câu lạc bộ' },
    { key: 'chat', label: 'Lời mời trò chuyện' },
  ];

  const filteredRequests = (requests || []).filter(
    (req) => selectedModule === 'all' || req.module === selectedModule
  );

  return (
    <div className="space-y-6">
      <PageHeader
        variant="band"
        icon={Inbox}
        title="Quản lý yêu cầu"
        description="Theo dõi và xử lý các yêu cầu đổi lớp, gia nhập nhóm, ứng tuyển CLB và mentoring của bạn"
      />

      {/* Main Box Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as any)}
        className="w-full space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-3">
          <TabsList className="bg-neutral-100 p-1 rounded-xl">
            <TabsTrigger value="incoming" className="rounded-lg text-xs font-semibold relative">
              <span>Cần tôi xử lý</span>
              {counters && counters.pendingRequestsTotal > 0 && (
                <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-tier-danger-dot text-white text-[10px] font-bold">
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

          {/* Module Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {modules.map((m) => (
              <button
                key={m.key}
                type="button"
                onClick={() => setSelectedModule(m.key)}
                className={`px-3 py-1 rounded-lg text-xs font-medium shrink-0 transition-colors ${
                  selectedModule === m.key
                    ? 'bg-brand-50 text-brand-700 font-semibold ring-1 ring-brand-200'
                    : 'text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                {m.label}
              </button>
            ))}
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
                  ? 'Tất cả các lời mời kết nối, yêu cầu vào nhóm hay mentoring sẽ hiển thị tại đây khi có người gửi đến bạn.'
                  : 'Các yêu cầu bạn gửi đi sẽ được lưu trữ và cập nhật trạng thái liên tục.'
              }
            />
          ) : (
            <div className="space-y-3">
              {filteredRequests.map((item) => (
                <div
                  key={item.id}
                  className="p-4 sm:p-5 rounded-2xl border border-neutral-200 bg-white hover:border-brand-300 hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs"
                >
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    {item.fromUser ? (
                      <UserAvatar user={item.fromUser} size="md" linkToProfile />
                    ) : (
                      <div className="h-10 w-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
                        {getModuleIcon(item.module)}
                      </div>
                    )}

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-neutral-100 text-neutral-700">
                          {getModuleIcon(item.module)}
                          <span>{item.moduleLabel}</span>
                        </span>
                        <StatusBadge status={item.status} />
                      </div>

                      <h3 className="font-bold text-sm sm:text-base text-neutral-900 leading-snug">
                        {item.title}
                      </h3>

                      <div className="flex items-center gap-3 text-xs text-neutral-400">
                        {item.fromUser && (
                          <span>Gửi bởi: <strong className="text-neutral-700">{item.fromUser.fullName}</strong></span>
                        )}
                        {item.to && (
                          <span>Tới: <strong className="text-neutral-700">{item.to}</strong></span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions on the right */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <Link
                      to={item.linkTo}
                      className="px-4 py-2 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-700 font-semibold text-xs transition-colors flex items-center gap-1.5"
                    >
                      <span>Xem & Xử lý</span>
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RequestsPage;
