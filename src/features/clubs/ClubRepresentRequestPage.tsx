import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ShieldCheck, Upload } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { apiClient } from '@/lib/apiClient';
import { toast } from '@/components/ui/Toast';
import type {
  Club,
  ClubCategory,
  ClubRepresentativeRequest,
} from '@/types/entities';

export const ClubRepresentRequestPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<'existing' | 'new'>('existing');
  const [selectedClubId, setSelectedClubId] = useState('club_01');
  const [newClubName, setNewClubName] = useState('');
  const [newClubCode, setNewClubCode] = useState('');
  const [newClubCategory, setNewClubCategory] = useState<ClubCategory>('Tech');
  const [newClubTagline, setNewClubTagline] = useState('');
  const [newClubDescription, setNewClubDescription] = useState('');
  const [roleNote, setRoleNote] = useState('Chủ nhiệm CLB');
  const [evidenceNote, setEvidenceNote] = useState('');
  const [evidenceFileName, setEvidenceFileName] = useState('QuyetDinh_BanChuNhiem_Fall2026.pdf');

  const { data: clubs = [] } = useQuery<Club[]>({
    queryKey: ['clubs', 'directory'],
    queryFn: () => apiClient.get('/clubs'),
  });

  const { data: myRequests = [] } = useQuery<ClubRepresentativeRequest[]>({
    queryKey: ['clubs', 'representative-requests', 'me'],
    queryFn: () => apiClient.get('/clubs/representative-requests/me'),
  });

  const submitMutation = useMutation({
    mutationFn: () => {
      const selectedClub = clubs.find((c) => c.id === selectedClubId);
      const payload: Partial<ClubRepresentativeRequest> =
        mode === 'existing'
          ? {
              clubId: selectedClubId,
              clubName: selectedClub?.name || 'Câu lạc bộ',
              roleNote,
              evidenceNote,
              evidenceFileName,
            }
          : {
              clubName: newClubName,
              proposedClub: {
                name: newClubName,
                code: newClubCode.toUpperCase() || 'CLUB',
                category: newClubCategory,
                tagline: newClubTagline,
                description: newClubDescription,
              },
              roleNote,
              evidenceNote,
              evidenceFileName,
            };
      return apiClient.post('/clubs/representative-requests', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['clubs', 'representative-requests', 'me'],
      });
      setEvidenceNote('');
      toast.success('Đã gửi yêu cầu xác minh quyền đại diện CLB tới Admin');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'new' && !newClubName.trim()) {
      toast.error('Vui lòng nhập tên CLB đề xuất');
      return;
    }
    if (!evidenceNote.trim()) {
      toast.error('Vui lòng nhập mô tả minh chứng đại diện');
      return;
    }
    submitMutation.mutate();
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link
        to="/clubs"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-600 hover:text-neutral-900"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Quay lại Kết nối CLB</span>
      </Link>

      <div>
        <h1 className="text-page-title text-neutral-900 flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-brand-600" />
          <span>Yêu cầu xác minh quyền đại diện Câu lạc bộ</span>
        </h1>
        <p className="text-meta text-neutral-500 mt-1">
          Sau khi được Admin xác minh, bạn có thể cập nhật hồ sơ CLB và đăng các cơ hội sự kiện, tuyển thành viên hoặc cộng tác viên.
        </p>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label
              className={`p-3.5 rounded-lg border cursor-pointer transition-colors ${
                mode === 'existing'
                  ? 'border-brand-500 bg-brand-50/40'
                  : 'border-neutral-200 hover:bg-neutral-50'
              }`}
            >
              <input
                type="radio"
                name="rep-mode"
                checked={mode === 'existing'}
                onChange={() => setMode('existing')}
                className="sr-only"
              />
              <div className="text-sm font-semibold text-neutral-900">
                CLB đã có trên hệ thống
              </div>
              <div className="text-caption text-neutral-500 mt-0.5">
                Xin cấp quyền đại diện cho một CLB đang hoạt động
              </div>
            </label>

            <label
              className={`p-3.5 rounded-lg border cursor-pointer transition-colors ${
                mode === 'new'
                  ? 'border-brand-500 bg-brand-50/40'
                  : 'border-neutral-200 hover:bg-neutral-50'
              }`}
            >
              <input
                type="radio"
                name="rep-mode"
                checked={mode === 'new'}
                onChange={() => setMode('new')}
                className="sr-only"
              />
              <div className="text-sm font-semibold text-neutral-900">
                Đề xuất thêm CLB mới
              </div>
              <div className="text-caption text-neutral-500 mt-0.5">
                Tạo hồ sơ CLB mới và đăng ký làm người đại diện đầu tiên
              </div>
            </label>
          </div>

          {mode === 'existing' ? (
            <div>
              <label className="block text-sm font-medium text-neutral-800 mb-1">
                Chọn Câu lạc bộ <span className="text-tier-danger-text">*</span>
              </label>
              <Select
                value={selectedClubId}
                onChange={(e) => setSelectedClubId(e.target.value)}
              >
                {clubs.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>
          ) : (
            <div className="space-y-3 p-4 rounded-lg bg-neutral-50 border border-neutral-200">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-caption font-semibold text-neutral-700 mb-1">
                    Tên Câu lạc bộ mới *
                  </label>
                  <Input
                    value={newClubName}
                    onChange={(e) => setNewClubName(e.target.value)}
                    placeholder="VD: FPT Robotics Club"
                  />
                </div>
                <div>
                  <label className="block text-caption font-semibold text-neutral-700 mb-1">
                    Mã viết tắt *
                  </label>
                  <Input
                    value={newClubCode}
                    onChange={(e) => setNewClubCode(e.target.value)}
                    placeholder="VD: FROBOT"
                  />
                </div>
              </div>

              <div>
                <label className="block text-caption font-semibold text-neutral-700 mb-1">
                  Lĩnh vực hoạt động
                </label>
                <Select
                  value={newClubCategory}
                  onChange={(e) => setNewClubCategory(e.target.value as ClubCategory)}
                >
                  <option value="Tech">Công nghệ &amp; Lập trình</option>
                  <option value="Academic">Học thuật &amp; Ngôn ngữ</option>
                  <option value="Media">Truyền thông &amp; Nhiếp ảnh</option>
                  <option value="Art">Nghệ thuật &amp; Âm nhạc</option>
                  <option value="Sports">Thể thao &amp; Cờ</option>
                  <option value="Volunteer">Tình nguyện &amp; Xã hội</option>
                </Select>
              </div>

              <div>
                <label className="block text-caption font-semibold text-neutral-700 mb-1">
                  Khẩu hiệu / Mô tả ngắn
                </label>
                <Input
                  value={newClubTagline}
                  onChange={(e) => setNewClubTagline(e.target.value)}
                  placeholder="Mô tả 1 dòng về CLB..."
                />
              </div>

              <div>
                <label className="block text-caption font-semibold text-neutral-700 mb-1">
                  Giới thiệu chi tiết
                </label>
                <Textarea
                  rows={3}
                  value={newClubDescription}
                  onChange={(e) => setNewClubDescription(e.target.value)}
                  placeholder="Mục tiêu hoạt động, lịch sinh hoạt dự kiến..."
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-neutral-800 mb-1">
              Vai trò của bạn trong CLB <span className="text-tier-danger-text">*</span>
            </label>
            <Input
              value={roleNote}
              onChange={(e) => setRoleNote(e.target.value)}
              placeholder="VD: Chủ nhiệm CLB, Trưởng ban Truyền thông & Tuyển dụng"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-800 mb-1">
              Mô tả minh chứng đại diện <span className="text-tier-danger-text">*</span>
            </label>
            <Textarea
              rows={3}
              value={evidenceNote}
              onChange={(e) => setEvidenceNote(e.target.value)}
              placeholder="Ghi rõ số quyết định công nhận BCN của phòng PDP/IC-PDP hoặc email xác nhận của cố vấn..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-800 mb-1">
              Tệp đính kèm minh chứng (PDF / Hình ảnh quyết định)
            </label>
            <div className="flex items-center gap-3 p-3 rounded-lg border border-dashed border-neutral-300 bg-neutral-50">
              <Upload className="h-4 w-4 text-neutral-500 shrink-0" />
              <Input
                value={evidenceFileName}
                onChange={(e) => setEvidenceFileName(e.target.value)}
                placeholder="Tên file minh chứng đính kèm..."
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              variant="primary"
              isLoading={submitMutation.isPending}
            >
              Gửi yêu cầu xác minh
            </Button>
          </div>
        </form>
      </Card>

      {/* Previous requests */}
      {myRequests.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-card-title text-neutral-900">
            Yêu cầu xác minh đã gửi ({myRequests.length})
          </h3>
          {myRequests.map((req) => (
            <Card
              key={req.id}
              className="p-4 flex items-center justify-between gap-4"
            >
              <div>
                <div className="text-sm font-semibold text-neutral-900">
                  {req.clubName} · {req.roleNote}
                </div>
                <div className="text-caption text-neutral-500 mt-0.5">
                  Minh chứng: {req.evidenceNote}
                </div>
                {req.rejectionReason && (
                  <div className="text-caption text-tier-danger-text mt-1">
                    Lý do từ chối: {req.rejectionReason}
                  </div>
                )}
              </div>
              <StatusBadge group="representativeRequest" status={req.status} />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClubRepresentRequestPage;
