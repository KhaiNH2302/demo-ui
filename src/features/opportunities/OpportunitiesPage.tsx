import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Compass,
  Building2,
  UsersRound,
  GraduationCap,
  HeartHandshake,
  Clock,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { PageHeader } from '@/components/shared/PageHeader';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { EmptyState } from '@/components/shared/EmptyState';

interface AggregatedOpportunity {
  id: string;
  type: 'club' | 'program' | 'group' | 'mentor';
  title: string;
  subtitle: string;
  organizationName: string;
  avatarUrl?: string;
  field: string;
  deadline?: string;
  spotsLeft?: number;
  tags?: string[];
  linkTo: string;
  isUrgent?: boolean;
  isFeatured?: boolean;
  createdAt?: string;
}

export const OpportunitiesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [selectedField, setSelectedField] = useState('all');

  const { data: opportunities, isLoading } = useQuery<AggregatedOpportunity[]>({
    queryKey: ['opportunities', activeTab, selectedField],
    queryFn: () =>
      apiClient.get('/opportunities', {
        params: {
          type: activeTab,
          field: selectedField,
        },
      }),
  });

  const { data: featured } = useQuery<AggregatedOpportunity[]>({
    queryKey: ['opportunities', 'featured'],
    queryFn: () => apiClient.get('/opportunities/featured'),
  });

  const fields = [
    { key: 'all', label: 'Tất cả lĩnh vực' },
    { key: 'Công nghệ thông tin', label: 'CNTT & Lập trình' },
    { key: 'Cộng đồng & Xã hội', label: 'Cộng đồng & Xã hội' },
    { key: 'Hoạt động sinh viên', label: 'Hoạt động sinh viên' },
  ];

  const getIconForType = (type: AggregatedOpportunity['type']) => {
    switch (type) {
      case 'club':
        return <Building2 size={16} />;
      case 'program':
        return <HeartHandshake size={16} />;
      case 'group':
        return <UsersRound size={16} />;
      case 'mentor':
        return <GraduationCap size={16} />;
    }
  };

  const getBadgeLabel = (type: AggregatedOpportunity['type']) => {
    switch (type) {
      case 'club':
        return 'Cơ hội Câu lạc bộ';
      case 'program':
        return 'Tình nguyện & Workshop';
      case 'group':
        return 'Nhóm tìm thành viên';
      case 'mentor':
        return 'Mentor nhận Mentee';
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        variant="band"
        icon={Compass}
        title="Tổng hợp cơ hội"
        description="Khám phá tập trung các đợt tuyển CLB, chiến dịch Tình nguyện & Workshop, nhóm đồ án và Mentor đang mở"
      />

      {/* Featured Spotlight Banner (Clean token surface, no arbitrary gradient) */}
      {featured && featured.length > 0 && (
        <Card className="p-6 border-brand-200 bg-brand-50/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-1.5">
              <Badge tier="brand" size="sm">
                <Sparkles size={12} className="mr-1" /> Tiêu điểm tuần
              </Badge>
            </div>
            <h2 className="text-xl font-bold text-neutral-900 leading-snug">
              {featured[0].title}
            </h2>
            <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
              {featured[0].subtitle}
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-neutral-500">
              <span className="font-semibold text-neutral-800">
                {featured[0].organizationName}
              </span>
              {featured[0].deadline && (
                <span className="flex items-center gap-1">
                  <Clock size={13} /> Hạn đăng ký:{' '}
                  {new Date(featured[0].deadline).toLocaleDateString('vi-VN')}
                </span>
              )}
            </div>
          </div>
          <div className="shrink-0">
            <Link to={featured[0].linkTo}>
              <Button variant="primary" size="md" rightIcon={<ArrowRight size={16} />}>
                Xem chi tiết
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Main Tabs and Category filters */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-neutral-200 pb-3">
          <TabsList className="bg-neutral-100 p-1 rounded-xl flex-wrap h-auto">
            <TabsTrigger value="all" className="rounded-lg text-xs font-semibold">
              Tất cả cơ hội
            </TabsTrigger>
            <TabsTrigger value="club" className="rounded-lg text-xs font-semibold">
              Câu lạc bộ
            </TabsTrigger>
            <TabsTrigger value="program" className="rounded-lg text-xs font-semibold">
              Tình nguyện & Workshop
            </TabsTrigger>
            <TabsTrigger value="group" className="rounded-lg text-xs font-semibold">
              Nhóm tìm người
            </TabsTrigger>
            <TabsTrigger value="mentor" className="rounded-lg text-xs font-semibold">
              Mentor
            </TabsTrigger>
          </TabsList>

          {/* Field Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
            {fields.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setSelectedField(f.key)}
                className={`px-3 py-1 rounded-lg text-xs font-medium shrink-0 transition-colors cursor-pointer ${
                  selectedField === f.key
                    ? 'bg-brand-50 text-brand-700 font-semibold border border-brand-200'
                    : 'text-neutral-600 hover:bg-neutral-100 border border-transparent'
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
              description="Hiện tại chưa có cơ hội kết nối nào phù hợp với bộ lọc của bạn."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {opportunities.map((opp) => (
                <Card
                  key={`${opp.type}_${opp.id}`}
                  className="p-5 hover:border-neutral-300 transition-colors flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        {opp.avatarUrl ? (
                          <img
                            src={opp.avatarUrl}
                            alt={opp.organizationName}
                            className="h-10 w-10 rounded-lg object-cover border border-neutral-200"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center font-bold">
                            {opp.organizationName.charAt(0)}
                          </div>
                        )}
                        <div>
                          <span className="font-bold text-xs text-neutral-900 block truncate">
                            {opp.organizationName}
                          </span>
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-neutral-500">
                            {getIconForType(opp.type)}
                            <span>{getBadgeLabel(opp.type)}</span>
                          </span>
                        </div>
                      </div>

                      {opp.isUrgent && (
                        <Badge tier="pending" size="sm">
                          Sắp hết hạn
                        </Badge>
                      )}
                    </div>

                    <div>
                      <Link to={opp.linkTo}>
                        <h3 className="font-bold text-base text-neutral-900 hover:text-brand-600 transition-colors line-clamp-1">
                          {opp.title}
                        </h3>
                      </Link>
                      <p className="text-xs text-neutral-600 mt-1 line-clamp-2 leading-relaxed">
                        {opp.subtitle}
                      </p>
                    </div>

                    {opp.tags && opp.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {opp.tags.map((t, idx) => (
                          <Badge key={idx} tier="neutral" size="sm">
                            #{t}
                          </Badge>
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
                        <span className="block text-xs text-neutral-500">
                          Hạn: {new Date(opp.deadline).toLocaleDateString('vi-VN')}
                        </span>
                      )}
                    </div>

                    <Link to={opp.linkTo}>
                      <Button variant="secondary" size="sm" rightIcon={<ArrowRight size={14} />}>
                        Xem & Tham gia
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

export default OpportunitiesPage;
