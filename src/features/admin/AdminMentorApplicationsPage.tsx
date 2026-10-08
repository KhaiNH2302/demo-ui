import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { PageHeader } from '@/components/shared/PageHeader';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import type { MentorApplication } from '@/types/entities';

export const AdminMentorApplicationsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 8;
  const navigate = useNavigate();

  const { data, isLoading } = useQuery<MentorApplication[]>({
    queryKey: ['admin', 'mentor-applications', activeTab],
    queryFn: () => apiClient.get('/admin/mentor-applications', { params: { status: activeTab } }),
  });

  const applications = data || [];

  const filteredApps = applications.filter(
    (app) =>
      !searchQuery ||
      (app.education?.major && app.education.major.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (app.personal?.position && app.personal.position.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  const pagedApps = filteredApps.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Duyệt hồ sơ Mentor"
        description="Xét duyệt điều kiện tiêu chuẩn, hồ sơ năng lực và cấp quyền Mentor cho sinh viên / chuyên gia"
      />

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => { setActiveTab(value); setPage(1); }} className="w-full space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-3">
          <TabsList className="bg-neutral-100 p-1 rounded-xl">
            <TabsTrigger value="pending" className="rounded-lg text-xs font-semibold">
              Chờ xét duyệt
            </TabsTrigger>
            <TabsTrigger value="needsmoreinfo" className="rounded-lg text-xs font-semibold">
              Cần bổ sung
            </TabsTrigger>
            <TabsTrigger value="approved" className="rounded-lg text-xs font-semibold">
              Đã duyệt
            </TabsTrigger>
            <TabsTrigger value="rejected" className="rounded-lg text-xs font-semibold">
              Không duyệt
            </TabsTrigger>
            <TabsTrigger value="all" className="rounded-lg text-xs font-semibold">
              Tất cả
            </TabsTrigger>
          </TabsList>

          <div className="relative max-w-xs w-full">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              placeholder="Tìm theo ngành, MSSV, tên..."
              className="w-full h-9 pl-9 pr-3 rounded-lg border border-neutral-200 bg-surface text-xs focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
        </div>

        <TabsContent value={activeTab} className="mt-0">
          {isLoading ? (
            <LoadingSkeleton count={4} />
          ) : filteredApps.length === 0 ? (
            <EmptyState
              title="Không có hồ sơ nào trong mục này"
              description="Danh sách hồ sơ ứng tuyển Mentor theo trạng thái đã chọn hiện đang trống."
            />
          ) : (
            <div className="bg-surface rounded-2xl border border-neutral-200 overflow-hidden shadow-xs divide-y divide-neutral-100">
              {pagedApps.map((app) => (
                <div
                  key={app.id}
                  className="p-4 sm:p-5 hover:bg-neutral-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    <img
                      src={app.personal?.avatarUrl}
                      alt="Avatar"
                      className="h-11 w-11 rounded-xl object-cover ring-1 ring-neutral-200 shrink-0"
                    />

                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-sm text-neutral-900 truncate">
                          Ứng viên #{app.id.slice(-4)}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-neutral-100 text-neutral-600">
                          {app.personal?.currentRole === 'student' ? 'Sinh viên' : 'Cựu SV / Chuyên gia'}
                        </span>
                        <StatusBadge status={app.status} />
                      </div>

                      <p className="text-xs text-neutral-600 truncate">
                        {app.education?.major} • GPA: <strong>{app.education?.gpa}</strong> • {app.personal?.yearOrGraduation}
                      </p>

                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {(app.focus?.areas || []).slice(0, 2).map((a, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded text-[11px] bg-brand-50 text-brand-700 font-medium">
                            {a}
                          </span>
                        ))}
                        {(app.focus?.areas?.length || 0) > 2 && (
                          <span className="px-1.5 py-0.5 rounded text-[11px] bg-neutral-100 text-neutral-500">
                            +{app.focus.areas.length - 2}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                    <span className="text-xs text-neutral-400 flex items-center gap-1">
                      <Clock size={13} />
                      {app.submittedAt ? new Date(app.submittedAt).toLocaleDateString('vi-VN') : 'Gần đây'}
                    </span>

                    <Link
                      to={`/admin/mentor-applications/${app.id}`}
                      className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition-colors"
                    >
                      <span>Xem & Xét duyệt</span>
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              ))}
              <div className="bg-neutral-50/70 px-4 py-3 sm:px-5 [&>div]:border-t-0 [&>div]:pt-0">
                <Pagination page={page} pageSize={pageSize} total={filteredApps.length} onChange={setPage} />
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminMentorApplicationsPage;
