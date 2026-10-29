import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BadgeCheck, Clock3, GraduationCap, UploadCloud } from 'lucide-react';
import { apiClient, type ApiError } from '@/lib/apiClient';
import { useAuthStore } from '@/store/authStore';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { toast } from '@/components/ui/Toast';
import type { SchoolAffiliationRequest, SchoolAffiliationStatus } from '@/types/schoolAffiliation';

const labels: Record<SchoolAffiliationStatus, string> = {
  Pending: 'Đang chờ duyệt', NeedsMoreInfo: 'Cần bổ sung', Verified: 'Đã xác minh',
  Rejected: 'Đã từ chối', Revoked: 'Đã thu hồi',
};

export default function SchoolVerificationPage() {
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const [schoolEmail, setSchoolEmail] = useState(user?.email || '');
  const [evidenceName, setEvidenceName] = useState('');
  const [evidenceNote, setEvidenceNote] = useState('');
  const query = useQuery({
    queryKey: ['school-affiliations', 'mine', user?.id],
    queryFn: () => apiClient.get<SchoolAffiliationRequest[]>('/school-affiliations/mine'),
  });
  const latest = query.data?.[0];
  const canSubmit = !latest || ['NeedsMoreInfo', 'Rejected', 'Revoked'].includes(latest.status);
  const submit = useMutation({
    mutationFn: () => apiClient.post('/school-affiliations', { schoolEmail, evidenceName, evidenceNote }),
    onSuccess: () => {
      toast.success('Đã gửi yêu cầu xác minh đến School Admin của trường.');
      void queryClient.invalidateQueries({ queryKey: ['school-affiliations'] });
      setEvidenceName('');
      setEvidenceNote('');
    },
    onError: (error: ApiError) => toast.error(error.message || 'Không thể gửi yêu cầu.'),
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="Xác minh trường đại học" description="Gửi minh chứng đang học để School Admin của trường kiểm tra." breadcrumbs={[{ label: 'Hồ sơ', href: '/profile/me' }, { label: 'Xác minh trường' }]} />
      <Card className="p-5 space-y-4">
        <div className="flex items-center gap-3"><GraduationCap className="text-brand-600" /><h2 className="text-base font-semibold">Thông tin đã khai báo</h2></div>
        <dl className="grid gap-3 sm:grid-cols-2 text-sm">
          <div><dt className="text-neutral-500">Trường đại học</dt><dd className="font-medium">{user?.school || 'Chưa khai báo'}</dd></div>
          <div><dt className="text-neutral-500">Mã sinh viên</dt><dd className="font-medium">{user?.studentCode || 'Chưa khai báo'}</dd></div>
        </dl>
        {(!user?.school || !user.studentCode) && <p className="text-sm text-amber-700">Hãy hoàn tất thông tin học vấn trong <Link className="underline" to="/profile/me">hồ sơ</Link> trước khi gửi.</p>}
      </Card>
      {latest && <Card className="p-5 space-y-2 text-sm">
        <div className="flex items-center gap-2 font-semibold">{latest.status === 'Verified' ? <BadgeCheck size={18} className="text-emerald-600" /> : <Clock3 size={18} className="text-amber-600" />} Trạng thái: {labels[latest.status]}</div>
        <p className="text-neutral-600">Gửi lúc {new Date(latest.submittedAt).toLocaleString('vi-VN')} · Minh chứng: {latest.evidenceName}</p>
        {latest.reason && <p className="rounded-lg bg-amber-50 p-3 text-amber-800">Phản hồi từ School Admin: {latest.reason}</p>}
      </Card>}
      {canSubmit && <Card className="p-5 space-y-4">
        <h2 className="text-base font-semibold">{latest?.status === 'NeedsMoreInfo' ? 'Bổ sung minh chứng' : 'Gửi yêu cầu xác minh'}</h2>
        <label className="block text-sm font-medium">Email trường
          <Input className="mt-1" type="email" value={schoolEmail} onChange={(event) => setSchoolEmail(event.target.value)} placeholder="ten@truong.edu.vn" />
        </label>
        <label className="block text-sm font-medium">Minh chứng đang học
          <div className="mt-1 flex items-center gap-2"><UploadCloud size={18} className="text-brand-600" /><input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={(event) => setEvidenceName(event.target.files?.[0]?.name || '')} /></div>
          <span className="mt-1 block text-xs text-neutral-500">Bản demo chỉ lưu tên tệp, không tải nội dung tệp lên máy chủ.</span>
        </label>
        <label className="block text-sm font-medium">Ghi chú (không bắt buộc)
          <Textarea className="mt-1" value={evidenceNote} onChange={(event) => setEvidenceNote(event.target.value)} placeholder="Thông tin giúp đối chiếu minh chứng" rows={3} />
        </label>
        <Button disabled={!user?.school || !user.studentCode || !schoolEmail.trim() || !evidenceName} loading={submit.isPending} onClick={() => submit.mutate()}>{latest?.status === 'NeedsMoreInfo' ? 'Gửi bổ sung' : 'Gửi yêu cầu'}</Button>
      </Card>}
    </div>
  );
}
