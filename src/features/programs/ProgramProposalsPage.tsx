import React, { useState } from 'react';
import { ActivityNavigation } from './ActivityNavigation';
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
export const ProgramProposalsPage: React.FC<{ review?: boolean }> = ({ review = false }) => {
  const { user } = useAuthStore();
  const client = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const allowed = review ? user?.roles.includes('event_manager') : Boolean(user?.roles.some((role) => (role.toLowerCase() === 'student' || role === 'club_rep')));
  const { data: proposals = [], isLoading, isError, refetch } = useQuery<ProgramProposal[]>({ queryKey: ['program-proposals', review ? 'review' : user?.id], queryFn: () => apiClient.get(`/programs/proposals${review ? '?review=true' : ''}`), enabled: Boolean(allowed) });
  const filteredProposals = proposals.filter(p => (statusFilter === 'all' || p.status === statusFilter) && `${p.title} ${p.studentName}`.toLocaleLowerCase('vi').includes(search.toLocaleLowerCase('vi')));
  const decide = useMutation({
    mutationFn: ({ id, status, action }: { id: string; status?: 'Approved' | 'Rejected'; action?: 'withdraw' }) => apiClient.put(`/programs/proposals/${id}`, { status, action, reviewReason: reasons[id]?.trim() }),
    onSuccess: () => { client.invalidateQueries({ queryKey: ['program-proposals'] }); client.invalidateQueries({ queryKey: ['programs'] }); toast.success('Đã cập nhật đề xuất'); },
    onError: (error: Error) => toast.error(error.message),
  });
  if (!allowed) return <ErrorState title={review ? 'Cần quyền Manager' : 'Đăng nhập Student để gửi đề xuất'} />;
  return <div className="space-y-5"><ActivityNavigation />
    <Link to="/programs" className="text-brand-600 text-sm">← Chương trình cộng đồng</Link>
    <PageHeader title={review ? 'Xét duyệt đề xuất chương trình' : 'Đề xuất của tôi'} description="Student và Club Rep gửi ý tưởng; mọi đề xuất đều cần Manager duyệt. Manager tiếp nhận và tạo chương trình nháp để hoàn thiện trước khi công bố." actions={!review ? <Link to="/programs/proposals/new"><Button>Tạo đề xuất mới</Button></Link> : undefined} />
    <Card className="p-4 space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">{Object.entries(labels).map(([status,label]) => <button key={status} aria-pressed={statusFilter === status} onClick={() => setStatusFilter(statusFilter === status ? 'all' : status)} className={`rounded-xl border p-3 text-left ${statusFilter === status ? 'border-brand-500 bg-brand-50' : 'border-neutral-200'}`}><span className="block text-xs text-neutral-500">{label}</span><strong className="text-xl">{proposals.filter(p => p.status === status).length}</strong></button>)}</div>
      <div className="flex flex-col sm:flex-row gap-3"><Input aria-label="Tìm đề xuất" placeholder="Tìm ý tưởng hoặc người gửi..." value={search} onChange={e => setSearch(e.target.value)} /><Select aria-label="Lọc trạng thái đề xuất" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}><option value="all">Tất cả trạng thái</option>{Object.entries(labels).map(([s,l]) => <option key={s} value={s}>{l}</option>)}</Select></div>
      <p className="text-sm text-neutral-500">Chấp nhận ý tưởng sẽ tạo bản nháp. Hoạt động chỉ nhận đăng ký sau khi được công bố.</p>
    </Card>
    {!isLoading && !isError && proposals.length > 0 && filteredProposals.length === 0 && <EmptyState title="Không có đề xuất phù hợp" description="Thử từ khóa khác hoặc chọn Tất cả trạng thái." />}
    {isLoading ? <Card className="h-48 animate-pulse" /> : isError ? <ErrorState onRetry={() => refetch()} /> : !proposals.length ? <EmptyState title="Chưa có đề xuất" /> : filteredProposals.map((proposal) => <Card className="p-5 space-y-3" key={proposal.id}>
      <div className="flex justify-between gap-3"><h2 className="text-card-title">{proposal.title}</h2><span className="text-sm font-semibold">{labels[proposal.status]}</span></div>
      <p className="text-sm text-neutral-500">{proposal.studentName} · {proposal.type === 'Event' ? 'Sự kiện CLB' : proposal.type === 'Volunteer' ? 'Tình nguyện' : 'Workshop'} · {proposal.onlineUnlimited ? 'Online không giới hạn' : `${proposal.expectedParticipants} người`} · {proposal.suggestedStartAt ? new Date(proposal.suggestedStartAt).toLocaleString('vi-VN') : 'Chưa chọn thời gian'}</p>
      <ol aria-label="Tiến trình đề xuất" className="flex flex-wrap gap-3 border-y border-neutral-100 py-3 text-sm"><li>1 · {proposal.status === 'Draft' ? 'Đang soạn' : 'Đã gửi'}</li><li>→ 2 · {proposal.status === 'PendingReview' ? 'Đang xét ý tưởng' : proposal.status === 'Draft' ? 'Chờ gửi' : labels[proposal.status]}</li><li>→ 3 · {proposal.programId ? 'Đã liên kết chương trình nháp' : 'Chờ tạo chương trình'}</li></ol>
      {proposal.mode === 'Hybrid' && <p className="text-sm font-medium">Trực tiếp: {proposal.offlineQuota ?? 'Chưa cấu hình'} người · Online: {proposal.onlineUnlimited ? 'Không giới hạn' : `${proposal.onlineQuota ?? 'Chưa cấu hình'} người`}</p>}
      <p className="whitespace-pre-line">{proposal.description}</p><p className="text-sm"><strong>Mục tiêu:</strong> {proposal.goal}</p><p className="text-sm">{proposal.targetAudience} · {proposal.location}</p><p className="text-sm">An toàn / nguồn lực: {proposal.safetyNotes}</p><p className="text-sm">Hình thức: {proposal.mode || 'Offline'} · Liên hệ: {proposal.contactInfo || 'Chưa cung cấp'}</p>
      {proposal.reviewReason && <p className="p-3 rounded-lg bg-neutral-50 text-sm"><strong>Lý do quyết định:</strong> {proposal.reviewReason}</p>}
      {proposal.status === 'Approved' && <p className="text-sm text-neutral-600">Manager đã tiếp nhận. Quyền tổ chức thuộc Manager; bạn tiếp tục theo dõi đề xuất tại đây.</p>}
      {review && proposal.status === 'PendingReview' && <div className="space-y-3"><FormField label={`Lý do quyết định cho ${proposal.title}`} required><Textarea placeholder="Lý do chấp thuận hoặc từ chối" value={reasons[proposal.id] || ''} onChange={(e) => setReasons({ ...reasons, [proposal.id]: e.target.value })} /></FormField><div className="flex flex-wrap gap-2"><Button disabled={!reasons[proposal.id]?.trim() || decide.isPending} onClick={() => decide.mutate({ id: proposal.id, status: 'Approved' })}>Chấp thuận & tạo bản nháp</Button><Button variant="secondary" disabled={!reasons[proposal.id]?.trim() || decide.isPending} onClick={() => decide.mutate({ id: proposal.id, status: 'Rejected' })}>Từ chối</Button></div></div>}
      {!review && proposal.status === 'PendingReview' && <Button variant="secondary" disabled={decide.isPending} onClick={() => decide.mutate({ id: proposal.id, action: 'withdraw' })}>Rút về bản nháp</Button>}
      {!review && proposal.status === 'Draft' && <Link to={`/programs/proposals/${proposal.id}/edit`}><Button variant="secondary">Chỉnh sửa / gửi đề xuất</Button></Link>}
      {!review && proposal.status === 'Rejected' && <Link to={`/programs/proposals/new?copy=${encodeURIComponent(proposal.id)}`}><Button variant="secondary">Đề xuất lại bằng bản mới</Button></Link>}
      {review && proposal.status === 'Approved' && proposal.programId && <Link to={`/programs/${proposal.programId}/edit`} className="text-brand-600 text-sm">Hoàn thiện chương trình nháp →</Link>}
    </Card>)}
  </div>;
};
export const ProgramProposalReviewPage: React.FC = () => <ProgramProposalsPage review />;
export default ProgramProposalsPage;
