import React, { useState } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { GreetingHeader } from '@/components/shared/GreetingHeader';
import { HighlightReel } from '@/components/shared/HighlightReel';
import { DiscoverCarousel } from '@/components/shared/DiscoverCarousel';
import { ActionSummaryBanner } from '@/components/shared/ActionSummaryBanner';
import { FeedCard } from '@/components/shared/FeedCard';
import { CoverHeader } from '@/components/shared/CoverHeader';
import { AvatarStack } from '@/components/shared/AvatarStack';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { StatusTimeline } from '@/components/shared/StatusTimeline';
import { AIResultCard } from '@/components/shared/AIResultCard';
import { AIFallbackBanner } from '@/components/shared/AIFallbackBanner';
import { DisclaimerBanner } from '@/components/shared/DisclaimerBanner';
import { UserMiniCard } from '@/components/shared/UserMiniCard';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { TagInput } from '@/components/shared/TagInput';
import { ScheduleInput } from '@/components/shared/ScheduleInput';
import { ScheduleCompare } from '@/components/shared/ScheduleCompare';
import { SummaryCard } from '@/components/shared/SummaryCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorState } from '@/components/shared/ErrorState';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { AttachmentList } from '@/components/shared/AttachmentList';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { ReasonDialog } from '@/components/shared/ReasonDialog';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Switch } from '@/components/ui/Switch';
import { Progress } from '@/components/ui/Progress';
import { Alert } from '@/components/ui/Alert';
import { Stepper } from '@/components/ui/Stepper';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { toast } from '@/components/ui/Toast';
import {
  Sparkles,
  Users,
  CheckCircle,
  Info,
  AlertTriangle,
  XCircle,
  Shield,
  MessageCircle,
  Repeat2,
  Calendar,
  Building2,
  GraduationCap,
  Inbox,
  ArrowRight,
} from 'lucide-react';
import type { ScheduleSlot } from '@/types/entities';

export const KitchenSinkPage: React.FC = () => {
  const [tags, setTags] = useState(['React', 'TypeScript', 'TailwindCSS', 'Spring Boot']);
  const [schedule, setSchedule] = useState<ScheduleSlot[]>([
    { day: 'Mon', start: '19:00', end: '21:00' },
    { day: 'Sat', start: '14:00', end: '17:00' },
  ]);
  const [switchVal, setSwitchVal] = useState(true);
  const [segmentedVal, setSegmentedVal] = useState('overview');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [reasonOpen, setReasonOpen] = useState(false);

  return (
    <div className="space-y-12 max-w-5xl mx-auto pb-20">
      <PageHeader
        title="Kitchen Sink — Design System Showcase"
        description="Trưng bày và kiểm thử trực quan toàn bộ UI Primitives, 5 Semantic Tiers và Shared Business Components theo SCS Design System specs"
        breadcrumb={[
          { label: 'Trang chủ', href: '/' },
          { label: 'Dev' },
          { label: 'Kitchen Sink' },
        ]}
      />

      {/* 1. SEMANTIC COLOR TIERS */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold border-b border-neutral-200 pb-2 text-neutral-900">
          1. Hệ thống 5 Màu Ngữ nghĩa (Semantic Color Tiers)
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3.5">
          <div className="p-4 rounded-xl bg-neutral-100 border border-neutral-200 space-y-2">
            <Badge tier="neutral" dot>Tier 1: Neutral</Badge>
            <p className="text-xs text-neutral-600">Nháp, khởi tạo, chung, không mang trạng thái ưu tiên.</p>
          </div>
          <div className="p-4 rounded-xl bg-[#e8effe] border border-[#c7d7fb] space-y-2">
            <Badge tier="pending" dot>Tier 2: Pending</Badge>
            <p className="text-xs text-[#2952d9]">Chờ phản hồi, chờ duyệt, đang xử lý, sắp diễn ra.</p>
          </div>
          <div className="p-4 rounded-xl bg-[#fef6e7] border border-[#f9e3b3] space-y-2">
            <Badge tier="attention" dot>Tier 3: Attention</Badge>
            <p className="text-xs text-[#92620a]">Cần bổ sung, phỏng vấn, đang làm, đang diễn ra.</p>
          </div>
          <div className="p-4 rounded-xl bg-[#e7f7ee] border border-[#bfead2] space-y-2">
            <Badge tier="success" dot>Tier 4: Success</Badge>
            <p className="text-xs text-[#16794a]">Đã kết nối, trúng tuyển, hoàn thành, đã duyệt.</p>
          </div>
          <div className="p-4 rounded-xl bg-[#fdecec] border border-[#f7c9c7] space-y-2">
            <Badge tier="danger" dot>Tier 5: Danger</Badge>
            <p className="text-xs text-[#b3261e]">Từ chối, hủy bỏ, tạm ngưng, khóa tài khoản, vi phạm.</p>
          </div>
        </div>
      </section>

      {/* 2. BUTTONS & TOASTS */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold border-b border-neutral-200 pb-2 text-neutral-900">
          2. Nút bấm & Toast Notifications
        </h2>
        <div className="flex flex-wrap gap-3 items-center">
          <Button variant="primary" onClick={() => toast.success('Thao tác thành công!')}>
            Primary (Toast Success)
          </Button>
          <Button variant="secondary" onClick={() => toast.info('Thông báo thông tin chung')}>
            Secondary (Toast Info)
          </Button>
          <Button variant="outline" onClick={() => toast.warning('Cảnh báo lưu ý')}>
            Outline (Toast Warning)
          </Button>
          <Button variant="destructive" onClick={() => toast.error('Đã xảy ra lỗi!')}>
            Destructive (Toast Error)
          </Button>
          <Button variant="ghost">Ghost Button</Button>
          <Button loading>Loading Button</Button>
          <Button variant="primary" size="sm">Small</Button>
          <Button variant="primary" size="lg">Large</Button>
        </div>
      </section>

      {/* 3. ALERTS & BANNERS */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold border-b border-neutral-200 pb-2 text-neutral-900">
          3. Alerts & Banners
        </h2>
        <div className="space-y-3">
          <DisclaimerBanner />
          <AIFallbackBanner visible onFallback={() => toast.info('Chuyển sang tìm kiếm trực tiếp')} />
          <Alert variant="neutral" title="Thông tin chung">
            Đây là thông điệp hiển thị mức độ Neutral dành cho hướng dẫn sử dụng.
          </Alert>
          <Alert variant="attention" title="Yêu cầu bổ sung hồ sơ">
            Hồ sơ ứng tuyển của bạn cần cập nhật thêm CV và thông tin liên hệ.
          </Alert>
          <Alert variant="danger" title="Lỗi kết nối">
            Không thể xác thực phiên làm việc, vui lòng đăng nhập lại.
          </Alert>
        </div>
      </section>

      {/* 4. SOCIAL SURFACE COMPONENTS */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold border-b border-neutral-200 pb-2 text-neutral-900">
          4. Social Surface & Feed Components (C6, C6b)
        </h2>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">GreetingHeader & HighlightReel (Story Tray)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <GreetingHeader fullName="Nguyễn Hoàng Khải" />
              <HighlightReel
                items={[
                  { id: '1', label: 'F-Code Club', icon: Building2, isNew: true, href: '/clubs' },
                  { id: '2', label: 'Mentor Java', icon: GraduationCap, isNew: true, href: '/mentoring/browse' },
                  { id: '3', label: 'Nhóm SWP391', icon: Users, isNew: true, href: '/groups' },
                  { id: '4', label: 'CLB Tiếng Anh', icon: Building2, href: '/clubs' },
                  { id: '5', label: 'Workshop AI', icon: Calendar, href: '/clubs' },
                ]}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">ActionSummaryBanner (Thu gọn 1 dòng)</CardTitle>
            </CardHeader>
            <CardContent>
              <ActionSummaryBanner
                items={[
                  { id: '1', type: 'swap', title: 'Lời mời đổi lớp PRN231 cần xác nhận', count: 2, linkTo: '/swap/connections' },
                  { id: '2', type: 'group', title: 'Yêu cầu gia nhập nhóm SWP391', count: 1, linkTo: '/groups/me' },
                  { id: '3', type: 'club', title: 'Đơn tuyển CLB JS Club có lịch phỏng vấn', count: 1, linkTo: '/applications' },
                ]}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">DiscoverCarousel ("Gợi ý cho bạn" cuộn ngang)</CardTitle>
            </CardHeader>
            <CardContent>
              <DiscoverCarousel
                items={[
                  {
                    id: 'd1',
                    type: 'group',
                    title: 'Nhóm Luyện Thuật Toán CSD201',
                    subtitle: 'Đại học FPT • 3/5 thành viên',
                    score: 94,
                    reason: 'Phù hợp mục tiêu ôn thi Practical Exam và rảnh tối T3/T5',
                    linkTo: '/groups',
                    tags: ['Java', 'CSD201'],
                  },
                  {
                    id: 'd2',
                    type: 'mentor',
                    title: 'Mentor Hoàng Văn Nam',
                    subtitle: 'Kỹ sư Fullstack • Cựu sinh viên FPTU',
                    score: 89,
                    reason: 'Chuyên môn sâu về React, Spring Boot & Capstone SWP391',
                    linkTo: '/mentoring/browse',
                    tags: ['React', 'Spring Boot'],
                  },
                ]}
              />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FeedCard
              variant="post"
              kind="knowledge"
              author={{ name: 'Lê Hoàng Long', subtitle: 'Đại học FPT', time: '2 giờ trước' }}
              actions={
                <>
                  <span className="text-xs text-neutral-400 flex items-center gap-1.5">
                    <MessageCircle size={14} /> 12 thảo luận
                  </span>
                  <Button size="sm" variant="ghost">
                    Đọc chi tiết <ArrowRight size={14} className="ml-1" />
                  </Button>
                </>
              }
            >
              <h4 className="text-sm font-bold text-neutral-900">
                Tổng hợp bộ đề ôn thi Practical Exam CSD201 có lời giải mẫu Tree & Graph
              </h4>
              <p className="text-xs text-neutral-600 line-clamp-2">
                Tài liệu bao gồm 15 bài toán cốt lõi môn Cấu trúc dữ liệu và Giải thuật thường ra trong đề thi Practical Exam.
              </p>
            </FeedCard>

            <FeedCard
              variant="suggestion"
              kind="swap-match"
              aiTag="Gợi ý đổi lớp phù hợp với bạn"
              actions={
                <Button size="sm" variant="outline" className="ml-auto">
                  Xem & gửi lời mời <ArrowRight size={14} className="ml-1" />
                </Button>
              }
            >
              <div className="flex items-center gap-2.5">
                <UserAvatar name="Trần Văn Minh" size="sm" />
                <div className="text-sm">
                  <span className="font-semibold text-neutral-900">Trần Văn Minh</span>{' '}
                  <span className="text-neutral-500">đang có lớp SE1701 khớp đúng lớp bạn muốn đổi</span>
                </div>
              </div>
            </FeedCard>
          </div>
        </div>
      </section>

      {/* 5. COMMUNITY & PROFILE HEADERS */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold border-b border-neutral-200 pb-2 text-neutral-900">
          5. Community Headers & Avatar Components
        </h2>
        <div className="space-y-6">
          <CoverHeader
            title="Câu lạc bộ Kỹ thuật Phần mềm F-Code"
            subtitle="Học thuật & Công nghệ • Thành lập 2014"
            badge={<Badge tier="brand">Đang tuyển thành viên</Badge>}
            actions={
              <div className="flex gap-2">
                <Button variant="outline" size="sm">Chia sẻ</Button>
                <Button variant="primary" size="sm">Ứng tuyển ngay</Button>
              </div>
            }
          >
            <div className="flex items-center gap-4 text-xs text-neutral-600">
              <div className="flex items-center gap-2">
                <AvatarStack
                  users={[
                    { name: 'Khải' },
                    { name: 'Long' },
                    { name: 'Minh' },
                    { name: 'Hà' },
                    { name: 'Nam' },
                  ]}
                />
                <span className="font-medium">128 thành viên</span>
              </div>
              <span>•</span>
              <span>15 sự kiện đã tổ chức</span>
            </div>
          </CoverHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">UserMiniCard & UserAvatar</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <UserMiniCard
                  user={{ id: 'u1', fullName: 'Nguyễn Hoàng Khải', school: 'FPT University Hà Nội' }}
                  subtitle="Sinh viên K16 • CNPM"
                  action={<Button size="sm" variant="outline">Xem hồ sơ</Button>}
                />
                <UserMiniCard
                  user={{ id: 'u2', fullName: 'ThS. Trần Thị Mai', school: 'Khoa CNTT - ĐH FPT' }}
                  subtitle="Mentor môn PRN231, SWP391"
                  action={<Badge tier="success">Mentor</Badge>}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">StatusBadge Bảng Tra Toàn Hệ Thống</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2 pt-1">
                <StatusBadge group="swapRequest" value="Open" />
                <StatusBadge group="swapRequest" value="Connected" />
                <StatusBadge group="swapConnection" value="Pending" />
                <StatusBadge group="post" value="Published" />
                <StatusBadge group="post" value="PendingReview" />
                <StatusBadge group="application" value="Interview" />
                <StatusBadge group="membership" value="Active" />
                <StatusBadge group="expense" value="Approved" />
                <StatusBadge group="task" value="InProgress" />
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* 6. AI & COMPARISON COMPONENTS */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold border-b border-neutral-200 pb-2 text-neutral-900">
          6. AI Matching & Schedule Comparison
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AIResultCard
            score={96}
            confidence={0.92}
            reasons={[
              'Trùng khớp hoàn hảo nguyện vọng môn CSD201',
              'Lịch rảnh tối Thứ 3 và Thứ 5 tương thích 100%',
              'Cùng định hướng tham gia Capstone Project',
            ]}
          >
            <div className="p-3 bg-white rounded-lg border border-brand-100 flex items-center justify-between">
              <UserMiniCard
                user={{ id: 'u_match', fullName: 'Trần Minh Đức', school: 'FPT University' }}
                subtitle="Đang có lớp SE1701 cần đổi sang SE1704"
                linkToProfile={false}
              />
              <Button size="sm">Gửi lời mời</Button>
            </div>
          </AIResultCard>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">ScheduleCompare (So sánh lịch song song)</CardTitle>
            </CardHeader>
            <CardContent>
              <ScheduleCompare
                labelA="Lịch của bạn"
                slotsA={[
                  { day: 'Mon', start: '18:00', end: '20:00' },
                  { day: 'Wed', start: '18:00', end: '20:00' },
                ]}
                labelB="Lịch đối tác"
                slotsB={[
                  { day: 'Mon', start: '18:00', end: '20:00' },
                  { day: 'Thu', start: '19:00', end: '21:00' },
                ]}
              />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">StatusTimeline (Tiến trình Tuyển sinh / Xét đơn)</CardTitle>
          </CardHeader>
          <CardContent>
            <StatusTimeline
              steps={[
                { key: '1', label: 'Đã nộp đơn', state: 'done' },
                { key: '2', label: 'Sàng lọc hồ sơ', state: 'done' },
                { key: '3', label: 'Phỏng vấn chuyên môn', state: 'current' },
                { key: '4', label: 'Công bố kết quả', state: 'upcoming' },
              ]}
            />
          </CardContent>
        </Card>
      </section>

      {/* 7. FORM INPUTS & SCHEDULE */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold border-b border-neutral-200 pb-2 text-neutral-900">
          7. Form Inputs, TagInput & ScheduleInput
        </h2>
        <Card>
          <CardContent className="p-6 space-y-6">
            <div>
              <label className="text-xs font-semibold text-neutral-700 block mb-2">TagInput (Kỹ năng & Lĩnh vực):</label>
              <TagInput value={tags} onChange={setTags} placeholder="Nhập kỹ năng và gõ Enter..." />
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-700 block mb-2">ScheduleInput (Lịch rảnh tự khai):</label>
              <ScheduleInput value={schedule} onChange={setSchedule} />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-neutral-100">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-neutral-700">Cho phép AI gợi ý matching:</span>
                <Switch checked={switchVal} onCheckedChange={setSwitchVal} />
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setConfirmOpen(true)}>
                  Mở ConfirmDialog
                </Button>
                <Button variant="destructive" size="sm" onClick={() => setReasonOpen(true)}>
                  Mở ReasonDialog
                </Button>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-700 block mb-2">SegmentedControl (Pill tabs):</label>
              <SegmentedControl
                options={[
                  { value: 'overview', label: 'Tổng quan' },
                  { value: 'events', label: 'Sự kiện' },
                  { value: 'tasks', label: 'Nhiệm vụ' },
                  { value: 'chat', label: 'Chat chung' },
                ]}
                value={segmentedVal}
                onValueChange={setSegmentedVal}
              />
            </div>
          </CardContent>
        </Card>
      </section>

      {/* 8. SKELETONS & EMPTY STATES */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold border-b border-neutral-200 pb-2 text-neutral-900">
          8. Feedback States (Skeleton, Empty, Error)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <h4 className="text-xs font-bold text-neutral-500 mb-3 uppercase">LoadingSkeleton</h4>
            <LoadingSkeleton variant="card" count={1} />
          </Card>
          <Card>
            <EmptyState
              icon={Inbox}
              title="Chưa có yêu cầu nào"
              description="Hãy tạo yêu cầu mới để bắt đầu ghép đôi"
              actionLabel="Tạo yêu cầu"
              onAction={() => toast.info('Bấm tạo yêu cầu')}
            />
          </Card>
          <Card>
            <ErrorState
              message="Không thể tải danh sách kết nối do mạng gián đoạn"
              onRetry={() => toast.info('Đang tải lại dữ liệu...')}
            />
          </Card>
        </div>
      </section>

      {/* Dialogs */}
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Xác nhận hủy yêu cầu đổi lớp"
        description="Bạn có chắc chắn muốn hủy yêu cầu đổi lớp PRN231 không? Hành động này sẽ thông báo tới các đối tác liên quan."
        onConfirm={() => {
          toast.success('Đã hủy yêu cầu');
          setConfirmOpen(false);
        }}
      />

      <ReasonDialog
        open={reasonOpen}
        onOpenChange={setReasonOpen}
        title="Từ chối đơn ứng tuyển"
        description="Vui lòng nhập lý do từ chối để gửi thông báo giải thích cho ứng viên."
        reasonLabel="Lý do từ chối"
        reasonPlaceholder="Ví dụ: Chưa đạt yêu cầu kinh nghiệm chuyên môn..."
        onConfirm={(reason) => {
          toast.info(`Đã từ chối với lý do: "${reason}"`);
          setReasonOpen(false);
        }}
      />
    </div>
  );
};

export default KitchenSinkPage;
