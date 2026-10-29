import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BadgeCheck, Building2, Clock3, RotateCcw } from 'lucide-react';
import { apiClient, type ApiError } from '@/lib/apiClient';
import { useAuthStore } from '@/store/authStore';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { Textarea } from '@/components/ui/Textarea';
import { toast } from '@/components/ui/Toast';
import type { SchoolAffiliationRequest, SchoolAffiliationStatus } from '@/types/schoolAffiliation';

type Decision = 'Verified' | 'NeedsMoreInfo' | 'Rejected' | 'Revoked';
const labels: Record<SchoolAffiliationStatus, string> = {
  Pending: 'Chờ duyệt', NeedsMoreInfo: 'Cần bổ sung', Verified: 'Đã xác minh',
  Rejected: 'Đã từ chối', Revoked: 'Đã thu hồi',
};
const actions: Record<Decision, string> = {
  Verified: 'Phê duyệt', NeedsMoreInfo: 'Yêu cầu bổ sung', Rejected: 'Từ chối', Revoked: 'Thu hồi xác minh',
};

export default function SchoolAffiliationQueuePage() {
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'all' | SchoolAffiliationStatus>('Pending');
  const [target, setTarget] = useState<{ entry: SchoolAffiliationRequest; decision: Decision } | null>(null);
  const [reason, setReason] = useState('');
  const query = useQuery({
    queryKey: ['admin', 'school-affiliations', user?.assignedSchool],
    queryFn: () => apiClient.get<SchoolAffiliationRequest[]>('/admin/school-affiliations'),
  });
  const decision = useMutation({
    mutationFn: ({ entry, choice, note }: { entry: SchoolAffiliationRequest; choice: Decision; note: string }) =>
      apiClient.post(`/admin/school-affiliations/${entry.id}/decision`, { decision: choice, reason: note }),
    onSuccess: () => {
      toast.success('Đã cập nhật xác minh trường.');
      setTarget(null);
      setReason('');
      void queryClient.invalidateQueries({ queryKey: ['admin', 'school-affiliations'] });
    },
    onError: (error: ApiError) => {
      toast.error(error.message || 'Không thể xử lý yêu cầu.');
      void queryClient.invalidateQueries({ queryKey: ['admin', 'school-affiliations'] });
    },
  });
  const entries = (query.data || []).filter((entry) => filter === 'all' || entry.status === filter);
  const pending = query.data?.filter((entry) => entry.status === 'Pending').length || 0;

  return <div className="space-y-6">
    <PageHeader title="Xác minh sinh viên theo trường" description="Chỉ xử lý hồ sơ thuộc trường đại học được phân công." breadcrumbs={[{ label: 'School Admin' }, { label: 'Xác minh trường' }]} />
    <div className="grid gap-4 sm:grid-cols-2">
      <Card className="flex items-center gap-3 p-5"><Building2 className="text-brand-600" /><div><p className="text-xs text-neutral-500">Phạm vi được gán</p><p className="font-semibold">{user?.assignedSchool || 'Chưa được gán trường'}</p></div></Card>
      <Card className="flex items-center gap-3 p-5"><Clock3 className="text-amber-600" /><div><p className="text-xs text-neutral-500">Hồ sơ chờ duyệt</p><p className="text-xl font-semibold">{pending}</p></div></Card>
    </div>
    <div className="flex flex-wrap gap-2">
      {(['Pending', 'NeedsMoreInfo', 'Verified', 'Rejected', 'Revoked', 'all'] as const).map((status) =>
        <button key={status} type="button" onClick={() => setFilter(status)} className={`rounded-lg border px-3 py-2 text-xs font-medium ${filter === status ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-neutral-200 bg-surface text-neutral-600'}`}>{status === 'all' ? 'Tất cả' : labels[status]}</button>)}
    </div>
    {query.isLoading && <p className="text-sm text-neutral-500">Đang tải hồ sơ...</p>}
    {query.isError && <p className="text-sm text-red-600">Không thể tải hàng đợi xác minh.</p>}
    {!query.isLoading && !query.isError && entries.length === 0 && <Card className="p-8 text-center text-sm text-neutral-500">Không có hồ sơ ở trạng thái này.</Card>}
    <div className="space-y-3">{entries.map((entry) => <Card key={entry.id} className="p-5 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2"><div><h2 className="font-semibold">{entry.studentName}</h2><p className="text-xs text-neutral-500">{entry.schoolEmail} · {entry.studentCode}</p></div><span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium">{labels[entry.status]}</span></div>
      <dl className="grid gap-2 text-sm sm:grid-cols-2"><div><dt className="text-neutral-500">Trường khai báo</dt><dd>{entry.school}</dd></div><div><dt className="text-neutral-500">Minh chứng (demo)</dt><dd>{entry.evidenceName}</dd></div></dl>
      {entry.evidenceNote && <p className="text-sm text-neutral-600">Ghi chú: {entry.evidenceNote}</p>}
      {entry.reason && <p className="rounded-lg bg-amber-50 p-2 text-sm text-amber-800">Lý do trước đó: {entry.reason}</p>}
      <div className="flex flex-wrap gap-2 border-t border-neutral-100 pt-3">
        {entry.status === 'Pending' && <>
          <Button size="sm" leftIcon={<BadgeCheck size={15} />} onClick={() => setTarget({ entry, decision: 'Verified' })}>Phê duyệt</Button>
          <Button size="sm" variant="outline" onClick={() => setTarget({ entry, decision: 'NeedsMoreInfo' })}>Yêu cầu bổ sung</Button>
          <Button size="sm" variant="outline" onClick={() => setTarget({ entry, decision: 'Rejected' })}>Từ chối</Button>
        </>}
        {entry.status === 'Verified' && <Button size="sm" variant="outline" leftIcon={<RotateCcw size={15} />} onClick={() => setTarget({ entry, decision: 'Revoked' })}>Thu hồi xác minh</Button>}
      </div>
    </Card>)}</div>
    <Dialog open={!!target} onOpenChange={(open) => { if (!open) { setTarget(null); setReason(''); } }}>
      <DialogContent><DialogHeader><DialogTitle>{target ? actions[target.decision] : 'Xử lý xác minh'}</DialogTitle></DialogHeader>
        <p className="text-sm">{target?.entry.studentName} · {target?.entry.school}</p>
        <label className="text-sm font-medium">Lý do {target?.decision !== 'Verified' && <span className="text-red-600">*</span>}
          <Textarea className="mt-1" rows={3} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Ghi rõ lý do để sinh viên biết cần làm gì" />
        </label>
        <DialogFooter><Button variant="outline" onClick={() => setTarget(null)}>Hủy</Button><Button disabled={target?.decision !== 'Verified' && !reason.trim()} loading={decision.isPending} onClick={() => target && decision.mutate({ entry: target.entry, choice: target.decision, note: reason })}>Xác nhận</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  </div>;
}
