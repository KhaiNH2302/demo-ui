import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { useAuthStore } from '@/store/authStore';
import { PageHeader } from '@/components/shared/PageHeader';
import { QueryBoundary } from '@/components/shared/QueryBoundary';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { Textarea } from '@/components/ui/Textarea';
import { toast } from '@/components/ui/Toast';
import { SearchInput } from '@/components/shared/SearchInput';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState } from '@/components/shared/EmptyState';
import { UserAvatar } from '@/components/shared/UserAvatar';
import {
  GraduationCap,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RotateCcw,
  Eye,
  Search,
  Building2,
  FileText,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import type { SchoolAffiliationRequest } from '@/types/entities';

export const AdminSchoolAffiliationsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const isSchoolAdmin = user?.roles?.some((r) => ['school_admin', 'SchoolAdmin'].includes(r));
  const isSystemAdmin = user?.roles?.some((r) => ['admin', 'Admin'].includes(r));

  const assignedSchool = user?.school || 'Đại học FPT Hà Nội';

  const [activeTab, setActiveTab] = useState<'all' | 'Pending' | 'NeedsMoreInfo' | 'Verified' | 'Rejected' | 'Revoked'>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Modals state
  const [evidenceModalItem, setEvidenceModalItem] = useState<SchoolAffiliationRequest | null>(null);
  const [actionModal, setActionModal] = useState<{
    type: 'needs_info' | 'reject' | 'revoke' | null;
    item: SchoolAffiliationRequest | null;
  }>({ type: null, item: null });
  const [reasonInput, setReasonInput] = useState('');

  const affiliationsQuery = useQuery({
    queryKey: ['admin', 'school-affiliations', assignedSchool],
    queryFn: () => apiClient.get<SchoolAffiliationRequest[]>('/admin/school-affiliations'),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, reason }: { id: string; status: string; reason?: string }) =>
      apiClient.put(`/admin/school-affiliations/${id}`, {
        status,
        reason,
        reviewedBy: `${user?.fullName || 'School Admin'} (${isSchoolAdmin ? 'School Admin' : 'Admin'})`,
      }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'school-affiliations'] });
      if (vars.status === 'Verified') {
        toast.success(`Đã xác thực sinh viên thành công! Sinh viên đã nhận được huy hiệu xác thực trường.`);
      } else if (vars.status === 'NeedsMoreInfo') {
        toast.info(`Đã yêu cầu sinh viên bổ sung thêm thông tin minh chứng.`);
      } else if (vars.status === 'Rejected') {
        toast.warning(`Đã từ chối yêu cầu xác thực sinh viên.`);
      } else if (vars.status === 'Revoked') {
        toast.error(`Đã thu hồi xác minh trường của sinh viên.`);
      }
      setActionModal({ type: null, item: null });
      setReasonInput('');
    },
    onError: () => {
      toast.error('Có lỗi xảy ra khi cập nhật trạng thái.');
    },
  });

  const allItems = affiliationsQuery.data || [];

  // Scoped to assigned school if School Admin
  const scopedItems = isSchoolAdmin
    ? allItems.filter((item) => !item.school || item.school.toLowerCase() === assignedSchool.toLowerCase())
    : allItems;

  const filteredItems = scopedItems.filter((item) => {
    if (activeTab !== 'all' && item.status !== activeTab) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const match =
        item.fullName.toLowerCase().includes(q) ||
        item.studentCode.toLowerCase().includes(q) ||
        item.email.toLowerCase().includes(q) ||
        item.major.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const pagedItems = filteredItems.slice((page - 1) * pageSize, page * pageSize);

  const pendingCount = scopedItems.filter((i) => i.status === 'Pending').length;
  const verifiedCount = scopedItems.filter((i) => i.status === 'Verified').length;
  const needsInfoCount = scopedItems.filter((i) => i.status === 'NeedsMoreInfo').length;

  const handleApprove = (item: SchoolAffiliationRequest) => {
    updateStatusMutation.mutate({ id: item.id, status: 'Verified' });
  };

  const handleConfirmAction = () => {
    if (!actionModal.item || !actionModal.type) return;
    if (!reasonInput.trim()) {
      toast.error('Vui lòng nhập lý do cụ thể cho sinh viên');
      return;
    }

    const nextStatus =
      actionModal.type === 'needs_info'
        ? 'NeedsMoreInfo'
        : actionModal.type === 'reject'
        ? 'Rejected'
        : 'Revoked';

    updateStatusMutation.mutate({
      id: actionModal.item.id,
      status: nextStatus,
      reason: reasonInput.trim(),
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Xác thực Sinh viên trường (School Affiliation)"
        description="Xét duyệt hồ sơ minh chứng thẻ sinh viên/portal để xác thực sinh viên chính thức thuộc trường đại học phân công"
        breadcrumbs={[
          { label: 'Admin Portal', href: '/admin' },
          { label: 'Xác thực SV trường' },
        ]}
      />

      {/* University Scope Notice */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl bg-gradient-to-r from-blue-50/80 to-neutral-50 border border-blue-200 text-xs">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold shrink-0">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <div className="font-bold text-neutral-900 text-sm">
              Phạm vi quản trị: {assignedSchool}
            </div>
            <div className="text-neutral-500">
              {isSchoolAdmin
                ? 'Bạn đang đăng nhập với vai trò School Admin được phân công quản lý riêng trường này.'
                : 'Bạn đang đăng nhập với vai trò System Admin (toàn quyền truy cập tất cả trường).'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="brand" className="font-semibold text-xs py-1 px-3">
            {pendingCount} hồ sơ chờ duyệt
          </Badge>
          <Badge variant="neutral" className="text-xs py-1 px-3">
            {verifiedCount} đã xác thực
          </Badge>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <Card className="p-4 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all', label: 'Tất cả hồ sơ' },
              { id: 'Pending', label: `Chờ xét duyệt (${pendingCount})`, highlight: pendingCount > 0 },
              { id: 'NeedsMoreInfo', label: `Cần bổ sung (${needsInfoCount})` },
              { id: 'Verified', label: `Đã xác minh (${verifiedCount})` },
              { id: 'Rejected', label: 'Bị từ chối' },
              { id: 'Revoked', label: 'Đã thu hồi' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-neutral-900 text-white shadow-xs'
                    : tab.highlight
                    ? 'bg-amber-100 text-amber-900 hover:bg-amber-200 font-bold'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="w-72">
            <SearchInput
              placeholder="Tìm theo tên, MSSV, email..."
              value={search}
              onChange={(v) => {
                setSearch(v);
                setPage(1);
              }}
            />
          </div>
        </div>

        {/* Table of requests */}
        <QueryBoundary queries={[affiliationsQuery]}>
          {pagedItems.length === 0 ? (
            <EmptyState
              icon={GraduationCap}
              title="Không có hồ sơ xác thực nào"
              description="Hiện tại không có yêu cầu xác thực trường nào trong danh mục lọc này."
            />
          ) : (
            <div className="overflow-x-auto border border-neutral-200 rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 text-neutral-600 font-semibold border-b border-neutral-200 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Sinh viên</th>
                    <th className="py-3 px-4">MSSV / Ngành</th>
                    <th className="py-3 px-4">Minh chứng đính kèm</th>
                    <th className="py-3 px-4">Ngày gửi</th>
                    <th className="py-3 px-4">Trạng thái</th>
                    <th className="py-3 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-neutral-800">
                  {pagedItems.map((item) => (
                    <tr key={item.id} className="hover:bg-neutral-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <UserAvatar
                            user={{ id: item.userId, fullName: item.fullName, avatarUrl: item.avatarUrl }}
                            size="sm"
                          />
                          <div>
                            <div className="font-bold text-neutral-900 text-xs sm:text-sm">
                              {item.fullName}
                            </div>
                            <div className="text-[11px] text-neutral-500 font-mono">
                              {item.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-neutral-900 font-mono">
                          {item.studentCode}
                        </div>
                        <div className="text-[11px] text-neutral-500">
                          {item.major} · {item.cohort}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          {item.evidenceUrl ? (
                            <button
                              type="button"
                              onClick={() => setEvidenceModalItem(item)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 font-semibold text-[11px] cursor-pointer"
                            >
                              <Eye size={13} />
                              <span>
                                {item.evidenceType === 'student_card'
                                  ? 'Thẻ sinh viên'
                                  : item.evidenceType === 'portal_screenshot'
                                  ? 'Ảnh Portal trường'
                                  : 'Giấy chứng nhận SV'}
                              </span>
                            </button>
                          ) : (
                            <span className="text-neutral-400 italic">Không có ảnh đính kèm</span>
                          )}
                        </div>
                        {item.reason && (
                          <div className="text-[10px] text-amber-800 bg-amber-50 p-1 rounded mt-1 max-w-xs truncate" title={item.reason}>
                            <strong>Lý do:</strong> {item.reason}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-neutral-500 whitespace-nowrap">
                        {new Date(item.submittedAt).toLocaleDateString('vi-VN')}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {item.status === 'Verified' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 size={12} className="text-emerald-600" />
                            Đã xác minh
                          </span>
                        )}
                        {item.status === 'Pending' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-300">
                            <Clock size={12} className="text-amber-600" />
                            Chờ xét duyệt
                          </span>
                        )}
                        {item.status === 'NeedsMoreInfo' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                            <AlertTriangle size={12} className="text-blue-600" />
                            Cần bổ sung
                          </span>
                        )}
                        {item.status === 'Rejected' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200">
                            <XCircle size={12} className="text-red-600" />
                            Bị từ chối
                          </span>
                        )}
                        {item.status === 'Revoked' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-neutral-100 text-neutral-600 border border-neutral-300">
                            <RotateCcw size={12} className="text-neutral-500" />
                            Đã thu hồi
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {item.status === 'Pending' || item.status === 'NeedsMoreInfo' ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => handleApprove(item)}
                              leftIcon={<CheckCircle2 size={13} />}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white h-7 text-xs"
                            >
                              Phê duyệt
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setActionModal({ type: 'needs_info', item });
                                setReasonInput('');
                              }}
                              className="h-7 text-xs text-blue-700 border-blue-200 hover:bg-blue-50"
                            >
                              Yêu cầu bổ sung
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setActionModal({ type: 'reject', item });
                                setReasonInput('');
                              }}
                              className="h-7 text-xs text-red-600 hover:bg-red-50"
                            >
                              Từ chối
                            </Button>
                          </div>
                        ) : item.status === 'Verified' ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setActionModal({ type: 'revoke', item });
                              setReasonInput('');
                            }}
                            className="h-7 text-xs text-neutral-600 hover:text-red-700 hover:bg-red-50"
                          >
                            Thu hồi xác minh
                          </Button>
                        ) : (
                          <span className="text-neutral-400 text-xs italic">Đã xử lý</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {filteredItems.length > pageSize && (
            <div className="pt-2">
              <Pagination
                page={page}
                pageSize={pageSize}
                total={filteredItems.length}
                onChange={setPage}
              />
            </div>
          )}
        </QueryBoundary>
      </Card>

      {/* Lightbox Modal: View Evidence */}
      {evidenceModalItem && (
        <Dialog open={!!evidenceModalItem} onOpenChange={(open) => !open && setEvidenceModalItem(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText size={18} className="text-blue-600" />
                Minh chứng sinh viên: {evidenceModalItem.fullName} ({evidenceModalItem.studentCode})
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3 py-2 text-xs">
              <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                <div className="grid grid-cols-2 gap-2 text-neutral-700">
                  <div>Họ tên: <strong>{evidenceModalItem.fullName}</strong></div>
                  <div>MSSV: <strong>{evidenceModalItem.studentCode}</strong></div>
                  <div>Trường: <strong>{evidenceModalItem.school}</strong></div>
                  <div>Ngành/Khóa: <strong>{evidenceModalItem.major} · {evidenceModalItem.cohort}</strong></div>
                </div>
              </div>

              {evidenceModalItem.evidenceUrl && (
                <div className="rounded-lg overflow-hidden border border-neutral-200 bg-neutral-900 flex items-center justify-center max-h-96">
                  <img
                    src={evidenceModalItem.evidenceUrl}
                    alt="Minh chứng sinh viên"
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setEvidenceModalItem(null)}>
                Đóng
              </Button>
              {evidenceModalItem.status === 'Pending' && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    handleApprove(evidenceModalItem);
                    setEvidenceModalItem(null);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Xác nhận phê duyệt ngay
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Action Dialog: Reason Input for NeedsInfo, Reject, Revoke */}
      {actionModal.type && actionModal.item && (
        <Dialog open={!!actionModal.type} onOpenChange={(open) => !open && setActionModal({ type: null, item: null })}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-sm">
                {actionModal.type === 'needs_info' && 'Yêu cầu sinh viên bổ sung thông tin'}
                {actionModal.type === 'reject' && 'Từ chối yêu cầu xác thực sinh viên'}
                {actionModal.type === 'revoke' && 'Thu hồi xác minh trường của sinh viên'}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3 py-2 text-xs">
              <p className="text-neutral-600">
                Sinh viên: <strong>{actionModal.item.fullName}</strong> ({actionModal.item.studentCode})
              </p>

              <div className="space-y-1.5">
                <label className="font-semibold text-neutral-800 block">
                  Lý do chi tiết <span className="text-red-500">*</span>:
                </label>
                <Textarea
                  rows={4}
                  value={reasonInput}
                  onChange={(e) => setReasonInput(e.target.value)}
                  placeholder={
                    actionModal.type === 'needs_info'
                      ? 'Nêu rõ tài liệu/minh chứng cần bổ sung (ví dụ: ảnh thẻ bị mờ, thiếu ảnh mặt sau, thiếu giấy xác nhận)...'
                      : actionModal.type === 'reject'
                      ? 'Nêu rõ lý do từ chối hồ sơ (ví dụ: thông tin không khớp với danh sách sinh viên trường)...'
                      : 'Nêu rõ lý do thu hồi (ví dụ: sinh viên đã tốt nghiệp, chuyển trường hoặc vi phạm quy chế)...'
                  }
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActionModal({ type: null, item: null })}
              >
                Hủy
              </Button>
              <Button
                variant={actionModal.type === 'revoke' || actionModal.type === 'reject' ? 'primary' : 'primary'}
                size="sm"
                onClick={handleConfirmAction}
                loading={updateStatusMutation.isPending}
                className={
                  actionModal.type === 'reject' || actionModal.type === 'revoke'
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }
              >
                Xác nhận gửi phản hồi
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default AdminSchoolAffiliationsPage;
