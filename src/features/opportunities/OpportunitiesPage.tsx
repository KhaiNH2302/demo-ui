import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Compass,
  Building2,
  UsersRound,
  GraduationCap,
  Clock,
  Sparkles,
  ArrowRight,
  Flame,
  CheckCircle2,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { PageHeader } from '@/components/shared/PageHeader';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import type { Opportunity } from '@/types/entities';

export const OpportunitiesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [selectedField, setSelectedField] = useState('all');

  const { data: opportunities, isLoading } = useQuery<Opportunity[]>({
    queryKey: ['opportunities', activeTab, selectedField],
    queryFn: () =>
      apiClient.get('/opportunities', {
        params: {
          type: activeTab,
          field: selectedField,
        },
      }),
  });

  const { data: featured } = useQuery<Opportunity[]>({
    queryKey: ['opportunities', 'featured'],
    queryFn: () => apiClient.get('/opportunities/featured'),
  });

  const fields = [
    { key: 'all', label: 'Tất cả lĩnh vực' },
    { key: 'Công nghệ thông tin', label: 'CNTT & Lập trình' },
    { key: 'Toán học & AI', label: 'Toán & Trí tuệ nhân tạo' },
    { key: 'Ngoại ngữ & Truyền thông', label: 'Ngoại ngữ & Truyền thông' },
  ];

  const getIconForType = (type: Opportunity['type']) => {
    switch (type) {
      case 'club':
        return <Building2 size={16} className="text-brand-600" />;
      case 'group':
        return <UsersRound size={16} className="text-accent-600" />;
      case 'mentor':
        return <GraduationCap size={16} className="text-emerald-600" />;
    }
  };

  const getBadgeLabel = (type: Opportunity['type']) => {
    switch (type) {
      case 'club':
        return 'CLB Tuyển thành viên';
      case 'group':
        return 'Nhóm tìm người';
      case 'mentor':
        return 'Mentor nhận Mentee';
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        variant="band"
        icon={Compass}
        title="Cơ hội trong SCS"
        description="Tổng hợp các đợt tuyển thành viên CLB, nhóm học tập tìm người và Mentor nhận mentee trong trường"
      />

      {/* Featured Spotlight Banner */}
      {featured && featured.length > 0 && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-brand-600 to-indigo-700 text-white shadow-md relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="relative z-10 max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-xs font-semibold backdrop-blur-xs">
              <Flame size={14} className="text-amber-300" />
              <span>Tiêu điểm tuần</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight leading-snug">
              {featured[0].title}
            </h2>
            <p className="text-sm text-white/90 leading-relaxed">
              {featured[0].subtitle}
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-white/80">
              <span className="font-semibold text-white">{featured[0].organizationName}</span>
              {featured[0].deadline && (
                <span className="flex items-center gap-1">
                  <Clock size={13} /> Hạn nộp: {new Date(featured[0].deadline).toLocaleDateString('vi-VN')}
                </span>
              )}
            </div>
          </div>
          <div className="relative z-10 shrink-0">
            <Link
              to={featured[0].linkTo}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-brand-700 font-bold text-sm shadow-sm hover:bg-brand-50 hover:shadow transition-all"
            >
              <span>Ứng tuyển ngay</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      )}

      {/* Main Tabs and Category filters */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-3">
          <TabsList className="bg-neutral-100 p-1 rounded-xl">
            <TabsTrigger value="all" className="rounded-lg text-xs font-semibold">
              Tất cả cơ hội
            </TabsTrigger>
            <TabsTrigger value="club" className="rounded-lg text-xs font-semibold">
              CLB đang tuyển
            </TabsTrigger>
            <TabsTrigger value="group" className="rounded-lg text-xs font-semibold">
              Nhóm tìm thành viên
            </TabsTrigger>
            <TabsTrigger value="mentor" className="rounded-lg text-xs font-semibold">
              Mentor nhận mentee
            </TabsTrigger>
          </TabsList>

          {/* Field Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {fields.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setSelectedField(f.key)}
                className={`px-3 py-1 rounded-lg text-xs font-medium shrink-0 transition-colors ${
                  selectedField === f.key
                    ? 'bg-brand-50 text-brand-700 font-semibold'
                    : 'text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <TabsContent value={activeTab} className="mt-0">
          {isLoading ? (
            <LoadingSkeleton count={4} />
          ) : !opportunities || opportunities.length === 0 ? (
            <EmptyState
              title="Chưa có cơ hội nào"
              description="Hiện tại chưa có đợt tuyển hay yêu cầu kết nối phù hợp với tiêu chí lọc của bạn."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {opportunities.map((opp) => (
                <div
                  key={opp.id}
                  className="p-5 rounded-2xl border border-neutral-200 bg-white hover:border-brand-300 hover:shadow-md transition-all flex flex-col justify-between space-y-4 shadow-xs"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        {opp.avatarUrl ? (
                          <img
                            src={opp.avatarUrl}
                            alt={opp.organizationName}
                            className="h-10 w-10 rounded-xl object-cover ring-1 ring-neutral-200"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold">
                            {opp.organizationName.charAt(0)}
                          </div>
                        )}
                        <div>
                          <span className="font-bold text-xs text-neutral-900 block truncate">
                            {opp.organizationName}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-neutral-500">
                            {getIconForType(opp.type)}
                            <span>{getBadgeLabel(opp.type)}</span>
                          </span>
                        </div>
                      </div>

                      {opp.isUrgent && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200">
                          Sắp hết hạn
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="font-bold text-base text-neutral-900 line-clamp-1">
                        {opp.title}
                      </h3>
                      <p className="text-xs text-neutral-600 mt-1 line-clamp-2 leading-relaxed">
                        {opp.subtitle}
                      </p>
                    </div>

                    {opp.tags && opp.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {opp.tags.map((t, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded text-[11px] font-medium bg-neutral-100 text-neutral-700"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
                    <div className="text-xs text-neutral-500">
                      {opp.spotsLeft !== undefined && (
                        <span className="font-medium text-neutral-700">
                          Còn {opp.spotsLeft} chỉ tiêu
                        </span>
                      )}
                      {opp.deadline && (
                        <span className="block text-[11px] text-neutral-400">
                          Hạn: {new Date(opp.deadline).toLocaleDateString('vi-VN')}
                        </span>
                      )}
                    </div>

                    <Link
                      to={opp.linkTo}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-700 font-semibold text-xs transition-colors"
                    >
                      <span>Xem & Tham gia</span>
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

export default OpportunitiesPage;
