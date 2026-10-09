import React, { useState } from 'react';
import { Link } from 'react-router-dom';
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

const labels = { Draft: 'Bản nháp', PendingReview: 'Đang chờ duyệt', Approved: 'Đã chấp thuận', Rejected: 'Đã từ chối' };
const blank = { type: 'Workshop', title: '', description: '', goal: '', targetAudience: '', expectedParticipants: 30, suggestedStartAt: '', location: '', costInfo: 'Free', safetyNotes: '', mode: 'Offline', contactInfo: '', acknowledgedTerms: false };
const textLabels = { title: 'Tên đề xuất', goal: 'Mục tiêu / giá trị cộng đồng', targetAudience: 'Đối tượng tham gia', location: 'Địa điểm dự kiến', costInfo: 'Chi phí dự kiến', contactInfo: 'Thông tin liên hệ' };
const localDateTime = (value: string) => {
  if (!value || !Number.isFinite(Date.parse(value))) return '';
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

export const ProgramProposalsPage: React.FC<{ review?: boolean }> = ({ review = false }) => {
  const { user } = useAuthStore();
  const client = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...blank, contactInfo: user?.email || '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const allowed = review ? user?.roles.includes('event_manager') : Boolean(user?.roles.some((role) => role.toLowerCase() === 'student'));
  const { data: proposals = [], isLoading, isError, refetch } = useQuery<ProgramProposal[]>({ queryKey: ['program-proposals', review ? 'review' : user?.id], queryFn: () => apiClient.get(`/programs/proposals${review ? '?review=true' : ''}`), enabled: Boolean(allowed) });
  const save = useMutation({
    mutationFn: (status: 'Draft' | 'PendingReview') => {
      const payload = { ...form, status, suggestedStartAt: form.suggestedStartAt ? new Date(form.suggestedStartAt).toISOString() : '' };
      return editingId ? apiClient.put(`/programs/proposals/${editingId}`, payload) : apiClient.post('/programs/proposals', payload);
    },
    onSuccess: (_, status) => { client.invalidateQueries({ queryKey: ['program-proposals'] }); setCreating(false); setEditingId(null); toast.success(status === 'Draft' ? 'Đã lưu bản nháp đề xuất' : 'Đề xuất đang chờ Event Manager xem xét'); },
    onError: (error: Error) => toast.error(error.message),
  });
  const decide = useMutation({
    mutationFn: ({ id, status, action }: { id: string; status?: 'Approved' | 'Rejected'; action?: 'withdraw' }) => apiClient.put(`/programs/proposals/${id}`, { status, action, reviewReason: reasons[id]?.trim() }),
    onSuccess: () => { client.invalidateQueries({ queryKey: ['program-proposals'] }); client.invalidateQueries({ queryKey: ['programs'] }); toast.success('Đã cập nhật đề xuất'); },
    onError: (error: Error) => toast.error(error.message),
  });
  const openForm = (proposal?: ProgramProposal, copy = false) => {
    setEditingId(proposal && !copy ? proposal.id : null);
    setForm(proposal ? { type: proposal.type, title: proposal.title, description: proposal.description, goal: proposal.goal, targetAudience: proposal.targetAudience, expectedParticipants: proposal.expectedParticipants, suggestedStartAt: localDateTime(proposal.suggestedStartAt), location: proposal.location, costInfo: proposal.costInfo, safetyNotes: proposal.safetyNotes, mode: proposal.mode || 'Offline', contactInfo: proposal.contactInfo || user?.email || '', acknowledgedTerms: false } : { ...blank, contactInfo: user?.email || '' });
    setErrors({}); setCreating(true);
  };
  const submit = (status: 'Draft' | 'PendingReview') => {
    const next: Record<string, string> = {};
    if (status === 'PendingReview') {
      for (const field of [...Object.keys(textLabels), 'description', 'safetyNotes'] as (keyof typeof form)[]) if (!String(form[field]).trim()) next[field] = 'Vui lòng điền thông tin này trước khi gửi.';
      if (!Number.isInteger(form.expectedParticipants) || form.expectedParticipants < 1) next.expectedParticipants = 'Nhập số người dự kiến là số nguyên dương.';
      if (!Number.isFinite(Date.parse(form.suggestedStartAt)) || Date.parse(form.suggestedStartAt) <= Date.now()) next.suggestedStartAt = 'Chọn thời gian dự kiến trong tương lai.';
      if (!form.acknowledgedTerms) next.acknowledgedTerms = 'Vui lòng xác nhận cam kết trước khi gửi.';
    }
    setErrors(next);
    if (!Object.keys(next).length) save.mutate(status);
  };
  if (!allowed) return <ErrorState title={review ? 'Cần quyền Event Manager' : 'Đăng nhập Student để gửi đề xuất'} />;
  return <div className="space-y-5">
    <Link to="/programs" className="text-brand-600 text-sm">← Chương trình cộng đồng</Link>
    <PageHeader title={review ? 'Xét duyệt đề xuất chương trình' : 'Đề xuất của tôi'} description="Student gửi ý tưởng. Event Manager tiếp nhận và tạo chương trình nháp để hoàn thiện trước khi công bố." actions={!review ? <Button onClick={() => openForm()}>Tạo đề xuất mới</Button> : undefined} />
    {creating && !review && <form noValidate onSubmit={(event) => { event.preventDefault(); submit('PendingReview'); }}><Card className="p-5 space-y-4">
      <h2 className="text-card-title">{editingId ? 'Chỉnh sửa bản nháp' : 'Đề xuất mới'}</h2>
      <div className="grid sm:grid-cols-2 gap-4">
        <FormField label="Loại chương trình"><Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}><option value="Volunteer">Tình nguyện</option><option value="Workshop">Workshop</option></Select></FormField>
        <FormField label="Số người dự kiến" required error={errors.expectedParticipants}><Input type="number" min={1} value={form.expectedParticipants} onChange={(e) => setForm({ ...form, expectedParticipants: Number(e.target.value) })} /></FormField>
      </div>
      {(Object.keys(textLabels) as (keyof typeof textLabels)[]).map((key) => <FormField key={key} label={textLabels[key]} required error={errors[key]}><Input value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} /></FormField>)}
      <div className="grid sm:grid-cols-2 gap-4"><FormField label="Thời gian dự kiến" required error={errors.suggestedStartAt}><Input type="datetime-local" value={form.suggestedStartAt} onChange={(e) => setForm({ ...form, suggestedStartAt: e.target.value })} /></FormField><FormField label="Hình thức"><Select value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value })}><option value="Offline">Offline</option><option value="Online">Online</option><option value="Hybrid">Hybrid</option></Select></FormField></div>
      <FormField label="Nội dung / hoạt động đề xuất" required error={errors.description}><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></FormField>
      <FormField label="Lưu ý an toàn / nguồn lực cần hỗ trợ" required error={errors.safetyNotes}><Textarea value={form.safetyNotes} onChange={(e) => setForm({ ...form, safetyNotes: e.target.value })} /></FormField>
      <label className="flex gap-2 text-sm"><input type="checkbox" checked={form.acknowledgedTerms} onChange={(e) => setForm({ ...form, acknowledgedTerms: e.target.checked })} />Thông tin đề xuất là thật; không quyên góp tiền, bán hàng hoặc tuyển dụng việc làm.</label>
      {errors.acknowledgedTerms && <p className="text-sm text-tier-danger-text" role="alert">{errors.acknowledgedTerms}</p>}
      <div className="flex flex-wrap gap-2"><Button type="button" variant="secondary" isLoading={save.isPending} onClick={() => submit('Draft')}>Lưu nháp</Button><Button type="submit" isLoading={save.isPending}>Gửi Event Manager xem xét</Button><Button type="button" variant="ghost" onClick={() => setCreating(false)}>Đóng</Button></div>
    </Card></form>}
    {isLoading ? <Card className="h-48 animate-pulse" /> : isError ? <ErrorState onRetry={() => refetch()} /> : !proposals.length ? <EmptyState title="Chưa có đề xuất" /> : proposals.map((proposal) => <Card className="p-5 space-y-3" key={proposal.id}>
      <div className="flex justify-between gap-3"><h2 className="text-card-title">{proposal.title}</h2><span className="text-sm font-semibold">{labels[proposal.status]}</span></div>
      <p className="text-sm text-neutral-500">{proposal.studentName} · {proposal.type === 'Volunteer' ? 'Tình nguyện' : 'Workshop'} · {proposal.expectedParticipants} người · {proposal.suggestedStartAt ? new Date(proposal.suggestedStartAt).toLocaleString('vi-VN') : 'Chưa chọn thời gian'}</p>
      <p className="whitespace-pre-line">{proposal.description}</p><p className="text-sm"><strong>Mục tiêu:</strong> {proposal.goal}</p><p className="text-sm">{proposal.targetAudience} · {proposal.location} · Chi phí: {proposal.costInfo}</p><p className="text-sm">An toàn / nguồn lực: {proposal.safetyNotes}</p><p className="text-sm">Hình thức: {proposal.mode || 'Offline'} · Liên hệ: {proposal.contactInfo || 'Chưa cung cấp'}</p>
      {proposal.reviewReason && <p className="p-3 rounded-lg bg-neutral-50 text-sm"><strong>Lý do quyết định:</strong> {proposal.reviewReason}</p>}
      {proposal.status === 'Approved' && <p className="text-sm text-neutral-600">Event Manager đã tiếp nhận. Quyền tổ chức thuộc Event Manager; bạn tiếp tục theo dõi đề xuất tại đây.</p>}
      {review && proposal.status === 'PendingReview' && <div className="space-y-3"><FormField label={`Lý do quyết định cho ${proposal.title}`} required><Textarea placeholder="Lý do chấp thuận hoặc từ chối" value={reasons[proposal.id] || ''} onChange={(e) => setReasons({ ...reasons, [proposal.id]: e.target.value })} /></FormField><div className="flex flex-wrap gap-2"><Button disabled={!reasons[proposal.id]?.trim() || decide.isPending} onClick={() => decide.mutate({ id: proposal.id, status: 'Approved' })}>Chấp thuận & tạo bản nháp</Button><Button variant="secondary" disabled={!reasons[proposal.id]?.trim() || decide.isPending} onClick={() => decide.mutate({ id: proposal.id, status: 'Rejected' })}>Từ chối</Button></div></div>}
      {!review && proposal.status === 'PendingReview' && <Button variant="secondary" disabled={decide.isPending} onClick={() => decide.mutate({ id: proposal.id, action: 'withdraw' })}>Rút về bản nháp</Button>}
      {!review && proposal.status === 'Draft' && <Button variant="secondary" onClick={() => openForm(proposal)}>Chỉnh sửa / gửi đề xuất</Button>}
      {!review && proposal.status === 'Rejected' && <Button variant="secondary" onClick={() => openForm(proposal, true)}>Đề xuất lại bằng bản mới</Button>}
      {review && proposal.status === 'Approved' && proposal.programId && <Link to={`/programs/${proposal.programId}/edit`} className="text-brand-600 text-sm">Hoàn thiện chương trình nháp →</Link>}
    </Card>)}
  </div>;
};
export const ProgramProposalReviewPage: React.FC = () => <ProgramProposalsPage review />;
export default ProgramProposalsPage;
