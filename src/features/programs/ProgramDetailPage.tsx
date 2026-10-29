import { ActivityNavigation } from './ActivityNavigation';
import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  Flag,
  HelpCircle,
  MapPin,
  Megaphone,
  MessageSquare,
  Send,
  Settings,
  ShieldAlert,
  Users,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/cn';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { PROGRAM_TYPE_LABELS } from '@/components/shared/ProgramCard';
import type { CoParticipantItem } from '@/components/shared/CoParticipantsPanel';
import { ImageGallery } from '@/components/shared/ImageGallery';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { ReportDialog } from '@/components/shared/ReportDialog';
import { apiClient } from '@/lib/apiClient';
import { useAuthStore } from '@/store/authStore';
import { useViewer } from '@/lib/viewer';
import { useGuardedAction } from '@/lib/guestGate';
import { toast } from '@/components/ui/Toast';
import { ErrorState } from '@/components/shared/ErrorState';
import { programRegistrationUnavailable } from './rules';
import type {
  ProgramAnnouncement,
  ProgramChannel,
  ProgramRegistration,
} from '@/types/entities';

interface ProgramDetailData extends ProgramChannel {
  myRegistration?: ProgramRegistration | null;
  announcements?: ProgramAnnouncement[];
  coParticipants?: CoParticipantItem[];
}

export const ProgramDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const viewer = useViewer();
  const canOpenProfile = viewer.can('profile.open');
  const guard = useGuardedAction();
  const [reportOpen, setReportOpen] = useState(false);
  const [newFaqQuestion, setNewFaqQuestion] = useState('');
  const [faqs, setFaqs] = useState([
    {
      id: 'faq-1',
      question: 'Chương trình có cấp Giấy chứng nhận (Certificate) hoặc cộng điểm rèn luyện không?',
      answer: 'Có. Tất cả sinh viên tham gia đầy đủ ca đã đăng ký và quét QR check-in sẽ được cấp Certificate điện tử sau 3 ngày làm việc.',
      author: 'Sinh viên K18',
    },
    {
      id: 'faq-2',
      question: 'Nếu đến ngày diễn ra có lịch thi đột xuất thì có được hủy hoặc đổi ca không?',
      answer: 'Bạn có thể rút đơn trước 24 giờ qua trang "Đăng ký của tôi". Nếu đổi ca, hãy liên hệ trực tiếp cho Manager phụ trách qua nút Nhắn tin.',
      author: 'Sinh viên K19',
    },
  ]);

  const handleAskFaq = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFaqQuestion.trim()) return;
    setFaqs((prev) => [
      ...prev,
      {
        id: `faq-${Date.now()}`,
        question: newFaqQuestion.trim(),
        answer: 'Cảm ơn bạn đã đặt câu hỏi. Ban tổ chức đã nhận được và sẽ phản hồi sớm nhất!',
        author: user?.fullName || 'Tôi',
      },
    ]);
    setNewFaqQuestion('');
    toast.success('Đã gửi câu hỏi tới Ban tổ chức chương trình!');
  };

  const { data: prog, isLoading, isError, refetch } = useQuery<ProgramDetailData>({
    queryKey: ['program', id],
    queryFn: () => apiClient.get(`/programs/${id}`),
    enabled: !!id,
  });



  if (isError || (!isLoading && !prog)) return <ErrorState title="Không thể tải chương trình" onRetry={() => refetch()} />;
  if (isLoading || !prog) {
    return <Card className="h-80 animate-pulse bg-neutral-100" />;
  }

  const isOrganizerOrCo = Boolean(user?.roles.includes('event_manager')) && user?.id === prog.organizer.userId;

  const unavailable = programRegistrationUnavailable(prog, prog.myRegistration);
  const pct = Math.min(
    100,
    Math.round((prog.confirmedCount / Math.max(1, prog.quota)) * 100)
  );
  const myReg = prog.myRegistration;

  const handleRegisterClick = guard(
    'register_program',
    () => {
      navigate(`/programs/${prog.id}/register`);
    },
    { redirectTo: `/programs/${prog.id}/register`, targetId: prog.id }
  );

  return (
    <div className="space-y-6">
      <ActivityNavigation />
      {prog.mode === 'Hybrid' && <Card className="p-4 space-y-3"><h2 className="font-semibold">Hai hình thức tham gia</h2><div className="grid sm:grid-cols-2 gap-3">{prog.slots?.map(s => <div key={s.id} className="rounded-lg border border-neutral-200 p-3"><strong>{s.attendanceMode === 'Online' ? 'Online' : 'Trực tiếp'}</strong><p className="text-sm">{s.confirmedCount}/{s.quota} đã xác nhận · Còn {Math.max(0,s.quota-s.confirmedCount)} chỗ</p></div>)}</div>{prog.onlineLink ? <a href={prog.onlineLink} target="_blank" rel="noopener noreferrer" className="text-brand-600 underline">Mở phòng online</a> : <p className="text-sm text-neutral-500">Link online được cung cấp cho người đã xác nhận nhóm Online.</p>}</Card>}

      <div className="flex items-center justify-between gap-3">
        <Link
          to="/programs"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-600 hover:text-neutral-900"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Quay lại Tình nguyện &amp; Workshop</span>
        </Link>

        <div className="flex items-center gap-2">
          {isOrganizerOrCo && (
            <Link to={`/programs/manage/${prog.id}`}>
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<Settings className="h-4 w-4" />}
              >
                Quản lý kênh &amp; người tham gia
              </Button>
            </Link>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={guard('report', () => setReportOpen(true))}
            leftIcon={<Flag className="h-4 w-4" />}
          >
            Báo cáo
          </Button>
        </div>
      </div>

      {/* Cover Banner if available */}
      {(prog.coverImageUrl || prog.coverUrl) && <img src={prog.coverImageUrl || prog.coverUrl || ''} alt={prog.title} className="w-full max-h-96 rounded-xl object-cover"/>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left 2 Columns */}
        <div className="lg:col-span-2 space-y-5">
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="px-2.5 py-1 rounded-md text-caption font-semibold bg-brand-50 text-brand-700">
                {PROGRAM_TYPE_LABELS[prog.type]}
              </span>
              <StatusBadge group="programChannel" status={prog.status} />
            </div>

            <h1 className="text-page-title text-neutral-900">{prog.title}</h1>
            <p className="text-meta text-neutral-600 font-medium">{prog.summary}</p>

            {/* Organizer & Co-Organizers Card */}
            <div className="p-4 rounded-lg bg-neutral-50 border border-neutral-200 space-y-3">
              <div className="text-caption font-semibold text-neutral-500">
                Manager phụ trách
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2.5">
                  <UserAvatar
                    user={{
                      id: prog.organizer.userId,
                      fullName: prog.organizer.fullName,
                      avatarUrl: prog.organizer.avatarUrl,
                    }}
                    linkToProfile
                    size="md"
                  />
                  <div>
                    {canOpenProfile ? (
                      <Link
                        to={`/users/${prog.organizer.userId}`}
                        className="text-sm font-semibold text-neutral-900 hover:text-brand-600"
                      >
                        {prog.organizer.fullName} ({prog.organizer.studentCode})
                      </Link>
                    ) : (
                      <div className="text-sm font-semibold text-neutral-900">
                        {prog.organizer.fullName} ({prog.organizer.studentCode})
                      </div>
                    )}
                    <div className="text-caption text-neutral-500">
                      {prog.organizer.major} · {prog.organizer.cohort} · {prog.organizer.roleNote}
                    </div>
                  </div>
                </div>

                {prog.coOrganizers
                  .filter((c) => c.status === 'Accepted')
                  .map((co) =>
                    canOpenProfile ? (
                      <Link
                        key={co.userId}
                        to={`/users/${co.userId}`}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface border border-neutral-200 text-caption hover:border-brand-300"
                      >
                        <span className="font-semibold text-neutral-800">{co.fullName}</span>
                        <span className="text-neutral-500">Đồng tổ chức</span>
                      </Link>
                    ) : (
                      <div
                        key={co.userId}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface border border-neutral-200 text-caption"
                      >
                        <span className="font-semibold text-neutral-800">{co.fullName}</span>
                        <span className="text-neutral-500">Đồng tổ chức</span>
                      </div>
                    )
                  )}
              </div>
            </div>

            <Tabs defaultValue="info">
              <TabsList>
                <TabsTrigger value="info">Thông tin chương trình</TabsTrigger>
                <TabsTrigger value="announcements">
                  Thông báo từ BTC ({prog.announcements?.length || 0})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="space-y-5 pt-2">
                {/* Key Meta Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-lg bg-neutral-50 border border-neutral-200 text-sm">
                  <div className="flex items-start gap-2.5">
                    <Calendar className="h-4 w-4 text-neutral-500 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-caption text-neutral-500">Thời gian diễn ra</div>
                      <div className="font-medium text-neutral-900">
                        {new Date(prog.startAt).toLocaleString('vi-VN', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <MapPin className="h-4 w-4 text-neutral-500 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-caption text-neutral-500">
                        Địa điểm ({prog.mode})
                      </div>
                      <div className="font-medium text-neutral-900">{prog.locationOrLink}</div>
                    </div>
                  </div>

                  {prog.gatheringPoint && (
                    <div className="sm:col-span-2 flex items-start gap-2.5 pt-1 border-t border-neutral-200/70">
                      <Users className="h-4 w-4 text-neutral-500 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-caption text-neutral-500">Điểm tập trung</div>
                        <div className="font-medium text-neutral-900">{prog.gatheringPoint}</div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <h3 className="text-card-title text-neutral-900">Mô tả chi tiết</h3>
                  <div className="text-sm text-neutral-700 whitespace-pre-line leading-relaxed">
                    {prog.description}
                  </div>
                </div>



                {prog.gallery && prog.gallery.length > 0 && <ImageGallery title="Hình ảnh hoạt động" images={prog.gallery}/>}
                {/* Volunteer Slots Table */}
                {(prog.type === 'Volunteer' || prog.mode === 'Hybrid') && prog.slots && prog.slots.length > 0 && (
                  <div className="space-y-2.5 pt-2">
                    <h3 className="text-card-title text-neutral-900">
                      Các ca / Nhóm công việc tình nguyện
                    </h3>
                    <div className="overflow-x-auto border border-neutral-200 rounded-lg">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-neutral-50 border-b border-neutral-200 text-caption font-semibold text-neutral-600">
                          <tr>
                            <th className="py-2.5 px-3.5">Ca / Nhóm</th>
                            <th className="py-2.5 px-3.5">Nhiệm vụ</th>
                            <th className="py-2.5 px-3.5 text-right">Đã nhận</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                          {prog.slots.map((s) => (
                            <tr key={s.id}>
                              <td className="py-2.5 px-3.5 font-medium text-neutral-900">
                                {s.name}
                              </td>
                              <td className="py-2.5 px-3.5 text-neutral-600">
                                {s.description || s.timeRange}
                              </td>
                              <td className="py-2.5 px-3.5 text-right font-medium text-neutral-800">
                                {s.confirmedCount}/{s.quota}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Workshop Speaker Info */}
                {prog.type === 'Workshop' && prog.speakerInfo && (
                  <div className="p-4 rounded-lg bg-neutral-50 border border-neutral-200 space-y-2">
                    <h3 className="text-card-title text-neutral-900">
                      Người chia sẻ: {prog.speakerInfo.name}
                    </h3>
                    <p className="text-sm text-neutral-600">{prog.speakerInfo.bio}</p>
                    {prog.speakerInfo.topics.length > 0 && (
                      <ul className="list-disc list-inside text-sm text-neutral-700 space-y-1 pt-1">
                        {prog.speakerInfo.topics.map((t, i) => (
                          <li key={i}>{t}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {/* Safety notes */}
                <div className="p-4 rounded-lg bg-tier-attention-bg/50 border border-tier-attention-border space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-tier-attention-text">
                    <ShieldAlert className="h-4 w-4 shrink-0" />
                    <span>Lưu ý an toàn</span>
                  </div>
                  <div className="text-caption text-neutral-700 space-y-1">

                    {prog.safetyNotes && (
                      <p>
                        <strong>An toàn:</strong> {prog.safetyNotes}
                      </p>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="announcements" className="space-y-3 pt-2">
                {!prog.announcements || prog.announcements.length === 0 ? (
                  <p className="text-meta text-neutral-500 py-6 text-center">
                    Ban tổ chức chưa đăng thông báo cập nhật nào cho chương trình này.
                  </p>
                ) : (
                  prog.announcements.map((ann) => (
                    <div
                      key={ann.id}
                      className="p-4 rounded-lg border border-neutral-200 bg-neutral-50 space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-sm font-semibold text-neutral-900">
                          <Megaphone className="h-4 w-4 text-brand-600" />
                          <span>{ann.title}</span>
                        </div>
                        <span className="text-caption text-neutral-500">
                          {new Date(ann.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                      <p className="text-sm text-neutral-700 whitespace-pre-line">
                        {ann.body}
                      </p>
                      <div className="text-caption text-neutral-500">
                        Đăng bởi {ann.authorName} · Đã gửi tới {ann.recipientCount} người tham gia
                      </div>
                    </div>
                  ))
                )}
              </TabsContent>
            </Tabs>
          </Card>

          {/* Cột trái: Mục Hỏi đáp chung trước khi đăng ký */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-brand-600" />
                <h3 className="text-section-title text-neutral-900">
                  Hỏi đáp chung trước khi đăng ký
                </h3>
              </div>
              <span className="text-caption text-neutral-500">
                {faqs.length} câu hỏi
              </span>
            </div>
            <p className="text-caption text-neutral-600">
              Sinh viên có thể đặt câu hỏi để làm rõ yêu cầu công việc, địa điểm hoặc chính sách cấp chứng nhận trước khi nộp đơn.
            </p>

            <div className="space-y-3">
              {faqs.map((faq) => (
                <div key={faq.id} className="p-3.5 rounded-lg border border-neutral-200 bg-neutral-50 space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-semibold text-neutral-900">
                      Q: {faq.question}
                    </span>
                    <span className="text-caption text-neutral-400 shrink-0">{faq.author}</span>
                  </div>
                  <p className="text-body-sm text-neutral-700 bg-white p-2.5 rounded border border-neutral-150">
                    <span className="font-semibold text-brand-600">BTC trả lời: </span>
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>

            {/* Input to ask a question */}
            <form onSubmit={handleAskFaq} className="pt-2 flex gap-2">
              <Input
                placeholder="Đặt câu hỏi của bạn cho Ban tổ chức..."
                value={newFaqQuestion}
                onChange={(e) => setNewFaqQuestion(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" variant="secondary" size="sm" leftIcon={<Send className="h-3.5 w-3.5" />}>
                Gửi câu hỏi
              </Button>
            </form>
          </Card>


        </div>

        {/* Right Sticky Action Card */}
        <div className="lg:sticky lg:top-20 space-y-4">
          <Card className="p-5 space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-600">Số lượng đã xác nhận</span>
                <span className="font-semibold text-neutral-900">
                  {prog.confirmedCount} / {prog.quota} chỗ
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-neutral-100 overflow-hidden">
                <div
                  className="h-full bg-brand-500 rounded-full transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="text-caption text-neutral-500">
                Hạn đăng ký:{' '}
                {new Date(prog.registrationDeadline).toLocaleDateString('vi-VN')} ·{' '}
                {prog.confirmMode === 'Instant' ? 'Xác nhận ngay' : 'Cần người tổ chức duyệt'}
              </div>
            </div>

            {/* Cột phải: Danh sách chọn Ca (Shift) */}
            {prog.slots && prog.slots.length > 0 && (
              <div className="space-y-2.5 pt-2 border-t border-neutral-200">
                <div className="flex items-center justify-between text-caption font-semibold text-neutral-700">
                  <span>Danh sách Ca hoạt động ({prog.slots.length})</span>
                  <span>Chỗ trống</span>
                </div>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {prog.slots.map((s) => {
                    const remaining = Math.max(0, s.quota - s.confirmedCount);
                    const isFull = remaining === 0;
                    return (
                      <div
                        key={s.id}
                        className={cn(
                          'p-2.5 rounded-lg border text-caption flex items-center justify-between transition-colors',
                          isFull
                            ? 'border-neutral-200 bg-neutral-50 text-neutral-400'
                            : 'border-brand-200 bg-brand-50/40 text-neutral-800'
                        )}
                      >
                        <div className="min-w-0 pr-2">
                          <div className="font-semibold truncate">{s.name}</div>
                          {s.description && (
                            <div className="text-neutral-500 text-xs truncate">{s.description}</div>
                          )}
                        </div>
                        <div className="shrink-0 text-right">
                          {isFull ? (
                            <span className="px-1.5 py-0.5 rounded text-xs font-semibold bg-neutral-200 text-neutral-600">
                              Hết chỗ
                            </span>
                          ) : (
                            <span className="font-semibold text-emerald-700">
                              Còn {remaining}/{s.quota}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Trạng thái đơn hiện tại và 1 nút hành động chính duy nhất */}
            {myReg && !['Withdrawn', 'Cancelled'].includes(myReg.status) ? (
              <div className="p-3.5 rounded-lg bg-neutral-50 border border-neutral-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-caption font-semibold text-neutral-600">
                    Trạng thái đơn hiện tại
                  </span>
                  <StatusBadge group="programRegistration" status={myReg.status} />
                </div>
                {myReg.slotName && (
                  <div className="text-caption text-neutral-700">
                    Ca đã chốt: <strong>{myReg.slotName}</strong>
                  </div>
                )}
                {myReg.feedbackNote && (
                  <p className="text-caption text-neutral-700 bg-surface p-2.5 rounded border border-neutral-200">
                    {myReg.feedbackNote}
                  </p>
                )}
                <Link to="/programs?tab=registrations" className="block">
                  <Button variant="primary" size="sm" className="w-full">
                    Xem hồ sơ đăng ký của tôi
                  </Button>
                </Link>
                {myReg.status === 'Confirmed' && (
                  <Link to="/chats" className="block">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="w-full"
                      leftIcon={<MessageSquare className="h-4 w-4" />}
                    >
                      Nhắn tin cho người tổ chức
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-2.5">
                <Button
                  variant="primary"
                  className="w-full"
                  disabled={Boolean(unavailable)}
                  onClick={handleRegisterClick}
                >
                  {unavailable || 'Đăng ký tham gia'}
                </Button>
                <p className="text-caption text-neutral-500 text-center">
                  Thông tin Họ tên, MSSV, Email sẽ được điền tự động từ hồ sơ của bạn.
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>

      <ReportDialog
        open={reportOpen}
        onOpenChange={setReportOpen}
        targetType="program"
        targetId={prog.id}
        targetTitle={prog.title}
        targetAuthorName={prog.organizer.fullName}
      />
    </div>
  );
};

export default ProgramDetailPage;
