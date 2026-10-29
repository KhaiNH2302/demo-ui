import { HybridQuotaFields } from './HybridQuotaFields';
import { proposalHybridError } from './rules';
import { ActivityContentField } from './ActivityContentFields';
import React, { useEffect, useState } from 'react';
import { ActivityNavigation } from './ActivityNavigation';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { FormField } from '@/components/shared/FormField';
import { ErrorState } from '@/components/shared/ErrorState';
import { EmptyState } from '@/components/shared/EmptyState';
import { PageHeader } from '@/components/shared/PageHeader';
import { useAuthStore } from '@/store/authStore';
import { apiClient } from '@/lib/apiClient';
import { toast } from '@/components/ui/Toast';
import type { ProgramProposal } from '@/types/entities';

const blank = { type: 'Workshop', title: '', description: '', goal: '', targetAudience: '', expectedParticipants: 30, offlineQuota: 30, onlineQuota: 100, suggestedStartAt: '', location: '', clubId: '', safetyNotes: '', mode: 'Offline', contactInfo: '', acknowledgedTerms: false };
const textLabels = { goal: 'Mục tiêu / giá trị cộng đồng', targetAudience: 'Đối tượng tham gia', location: 'Địa điểm dự kiến', contactInfo: 'Thông tin liên hệ' };
const localDateTime = (value: string) => {
  if (!value || !Number.isFinite(Date.parse(value))) return '';
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

export default function ProgramProposalFormPage() {
  const { id } = useParams<{id: string}>();
  const [params] = useSearchParams();
  const copyId = !id ? params.get('copy') : null;
  const sourceId = id || copyId;
  const navigate = useNavigate();
  const { user, representedClubs } = useAuthStore();
  const client = useQueryClient();
  const editingId = id || null;
  const [form, setForm] = useState({...blank, contactInfo: user?.email || ''});
  const [errors, setErrors] = useState<Record<string,string>>({});
  const allowed = Boolean(user?.roles.some(role => role.toLowerCase() === 'student' || role === 'club_rep'));
  const query = useQuery<ProgramProposal[]>({queryKey: ['program-proposals', user?.id], queryFn: () => apiClient.get('/programs/proposals'), enabled: allowed && Boolean(sourceId)});
  const source = query.data?.find(p => p.id === sourceId);
  useEffect(() => {
    if (!source) return;
    setForm({type: source.type, title: source.title, description: source.description, goal: source.goal, targetAudience: source.targetAudience, expectedParticipants: source.expectedParticipants, offlineQuota: source.offlineQuota || 30, onlineQuota: source.onlineQuota || 100, suggestedStartAt: localDateTime(source.suggestedStartAt), location: source.location, clubId: source.clubId || '', safetyNotes: source.safetyNotes, mode: source.mode || 'Offline', contactInfo: source.contactInfo || user?.email || '', acknowledgedTerms: false});
  }, [source, user?.email]);
  const save = useMutation({
    mutationFn: (status: 'Draft' | 'PendingReview') => {
      const payload = { ...form, offlineQuota: form.mode === 'Hybrid' ? form.offlineQuota : undefined, onlineQuota: form.mode === 'Hybrid' ? form.onlineQuota : undefined, expectedParticipants: form.mode === 'Hybrid' ? form.offlineQuota + form.onlineQuota : form.expectedParticipants, clubId: form.type === 'Event' ? form.clubId : undefined, status, suggestedStartAt: form.suggestedStartAt ? new Date(form.suggestedStartAt).toISOString() : '' };
      return editingId ? apiClient.put(`/programs/proposals/${editingId}`, payload) : apiClient.post('/programs/proposals', payload);
    },
    onSuccess: (_, status) => { client.invalidateQueries({ queryKey: ['program-proposals'] }); navigate('/programs/proposals'); toast.success(status === 'Draft' ? 'Đã lưu bản nháp đề xuất' : 'Đề xuất đang chờ Manager xem xét'); },
    onError: (error: Error) => toast.error(error.message),
  });
  const submit = (status: 'Draft' | 'PendingReview') => {
    const next: Record<string, string> = {};
    if (status === 'PendingReview') {
      for (const field of [...Object.keys(textLabels), 'title', 'description', 'safetyNotes'] as (keyof typeof form)[]) if (!String(form[field]).trim()) next[field] = 'Vui lòng điền thông tin này trước khi gửi.';
      if (!Number.isInteger(form.expectedParticipants) || form.expectedParticipants < 1) next.expectedParticipants = 'Nhập số người dự kiến là số nguyên dương.';
      if (!Number.isFinite(Date.parse(form.suggestedStartAt)) || Date.parse(form.suggestedStartAt) <= Date.now()) next.suggestedStartAt = 'Chọn thời gian dự kiến trong tương lai.';
      if (form.type === 'Event' && !form.clubId) next.clubId = 'Chọn CLB bạn đại diện.';
      if (!form.acknowledgedTerms) next.acknowledgedTerms = 'Vui lòng xác nhận cam kết trước khi gửi.';
    }
    const hybridError = proposalHybridError(form);
    if (hybridError) next.hybrid = hybridError;
    setErrors(next);
    if (!Object.keys(next).length) save.mutate(status);
  };

  if (!allowed) return <ErrorState title="Cần tài khoản Student hoặc Club Rep"/>;
  if (sourceId && query.isPending) return <Card className="h-48 animate-pulse"/>;
  if (sourceId && query.isError) return <ErrorState title="Không tải được đề xuất" onRetry={() => query.refetch()}/>;
  if (sourceId && (!source || (id && source.status !== 'Draft') || (copyId && source.status !== 'Rejected'))) return <div className="space-y-4"><ErrorState title="Không thể chỉnh sửa đề xuất" message="Chỉ sửa bản nháp của bạn. Đề xuất chờ duyệt cần rút về bản nháp; đề xuất đã từ chối có thể tạo bản mới."/><Link to="/programs/proposals" className="text-brand-600">Về danh sách đề xuất</Link></div>;
  return <div className="max-w-3xl mx-auto space-y-5"><ActivityNavigation/><Link to="/programs/proposals" className="text-sm text-brand-600">← Danh sách đề xuất</Link><PageHeader title={id ? 'Chỉnh sửa đề xuất' : 'Tạo đề xuất'} description="Lưu nháp để tiếp tục sau hoặc gửi Manager xem xét. Đề xuất chưa được công bố thành hoạt động."/>
<form noValidate onSubmit={(event) => { event.preventDefault(); submit('PendingReview'); }}><Card className="p-5 space-y-4">
      <h2 className="text-card-title">{editingId ? 'Chỉnh sửa bản nháp' : copyId ? 'Đề xuất lại bằng bản mới' : 'Đề xuất mới'}</h2>
      <div className="grid sm:grid-cols-2 gap-4">
        <FormField label="Loại chương trình"><Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>{user?.roles.includes('club_rep') && <option value="Event">Sự kiện CLB</option>}<option value="Volunteer">Tình nguyện</option><option value="Workshop">Workshop</option></Select></FormField>
        <FormField label="Số người dự kiến" required error={errors.expectedParticipants}><Input type="number" min={1} disabled={form.mode === 'Hybrid'} value={form.mode === 'Hybrid' ? form.offlineQuota + form.onlineQuota : form.expectedParticipants} onChange={(e) => setForm({ ...form, expectedParticipants: Number(e.target.value) })} /></FormField>
      </div>
      {form.type === 'Event' && <FormField label="CLB đại diện" required error={errors.clubId}><Select value={form.clubId} onChange={e => setForm({...form, clubId: e.target.value})}><option value="">Chọn CLB</option>{representedClubs.map(c => <option key={c.clubId} value={c.clubId}>{c.name}</option>)}</Select></FormField>}
      <ActivityContentField label="Tên ý tưởng" value={form.title} onChange={title => setForm({ ...form, title })} error={errors.title}/>
      {(Object.keys(textLabels) as (keyof typeof textLabels)[]).map((key) => <FormField key={key} label={textLabels[key]} required error={errors[key]}><Input value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} /></FormField>)}
      <div className="grid sm:grid-cols-2 gap-4"><FormField label="Thời gian dự kiến" required error={errors.suggestedStartAt}><Input type="datetime-local" value={form.suggestedStartAt} onChange={(e) => setForm({ ...form, suggestedStartAt: e.target.value })} /></FormField><FormField label="Hình thức"><Select value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value })}><option value="Offline">Offline</option><option value="Online">Online</option><option value="Hybrid">Hybrid</option></Select></FormField></div>
      {form.mode === 'Hybrid' && <HybridQuotaFields offline={form.offlineQuota} online={form.onlineQuota} onOffline={offlineQuota => setForm({...form, offlineQuota})} onOnline={onlineQuota => setForm({...form, onlineQuota})} error={errors.hybrid}/>}
      <ActivityContentField label="Nội dung ý tưởng" value={form.description} onChange={description => setForm({ ...form, description })} multiline error={errors.description}/>
      <FormField label="Lưu ý an toàn / nguồn lực cần hỗ trợ" required error={errors.safetyNotes}><Textarea value={form.safetyNotes} onChange={(e) => setForm({ ...form, safetyNotes: e.target.value })} /></FormField>
      <label className="flex gap-2 text-sm"><input type="checkbox" checked={form.acknowledgedTerms} onChange={(e) => setForm({ ...form, acknowledgedTerms: e.target.checked })} />Thông tin đề xuất là thật; không quyên góp tiền, bán hàng hoặc tuyển dụng việc làm.</label>
      {errors.acknowledgedTerms && <p className="text-sm text-tier-danger-text" role="alert">{errors.acknowledgedTerms}</p>}
      <div className="flex flex-wrap gap-2"><Button type="button" variant="secondary" isLoading={save.isPending} onClick={() => submit('Draft')}>Lưu nháp</Button><Button type="submit" isLoading={save.isPending}>Gửi Manager xem xét</Button><Button type="button" variant="ghost" onClick={() => navigate('/programs/proposals')}>Quay lại danh sách</Button></div>
    </Card></form></div>;
}
