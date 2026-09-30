import React, { useState } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { AIFallbackBanner } from '@/components/shared/AIFallbackBanner';
import { DisclaimerBanner } from '@/components/shared/DisclaimerBanner';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { TagInput } from '@/components/shared/TagInput';
import { ScheduleInput } from '@/components/shared/ScheduleInput';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorState } from '@/components/shared/ErrorState';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { ReasonDialog } from '@/components/shared/ReasonDialog';
import { DateBadge } from '@/components/shared/DateBadge';
import { UpcomingList } from '@/components/shared/UpcomingList';
import { EntityRow } from '@/components/shared/EntityRow';
import { StatRow } from '@/components/shared/StatRow';
import { ListToolbar } from '@/components/shared/ListToolbar';
import { ActiveFilterChips } from '@/components/shared/ActiveFilterChips';
import { ActivityCard } from '@/components/shared/ActivityCard';
import { ActionCard } from '@/components/shared/ActionCard';
import { ImageGallery } from '@/components/shared/ImageGallery';
import { CoverImagePicker } from '@/components/shared/CoverImagePicker';
import { ImageUploader } from '@/components/shared/ImageUploader';
import { LimitNotice } from '@/components/shared/LimitNotice';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Chip } from '@/components/ui/Chip';
import { Pagination } from '@/components/ui/Pagination';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Switch } from '@/components/ui/Switch';
import { Alert } from '@/components/ui/Alert';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { toast } from '@/components/ui/Toast';
import { Inbox } from 'lucide-react';
import type { ScheduleSlot, MediaImageItem } from '@/types/entities';

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
  const [page, setPage] = useState(2);
  const [searchQ, setSearchQ] = useState('');
  const [coverImg, setCoverImg] = useState<string | null>(
    'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&auto=format&fit=crop&q=80'
  );
  const [galleryImgs, setGalleryImgs] = useState<MediaImageItem[]>([
    {
      id: 'g1',
      url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&auto=format&fit=crop&q=80',
      caption: 'Thảo luận nhóm đồ án SWP391',
    },
    {
      id: 'g2',
      url: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1200&auto=format&fit=crop&q=80',
      caption: 'Buổi chia sẻ của Mentor F-Code',
    },
    {
      id: 'g3',
      url: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=1200&auto=format&fit=crop&q=80',
      caption: 'Chiến dịch Chủ Nhật Xanh',
    },
  ]);

  return (
    <div className="space-y-12 max-w-5xl mx-auto pb-20">
      <PageHeader
        title="Kitchen Sink — Design System Showcase"
        description="Trưng bày và kiểm thử trực quan toàn bộ UI Primitives, 5 Semantic Tiers và Shared Business Components theo SCS Design System (04-reuse-plan & 05-social-patterns)"
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

      {/* 2. BUTTONS, CHIPS & PAGINATION */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold border-b border-neutral-200 pb-2 text-neutral-900">
          2. Buttons, Chip & Pagination (R1 Primitives)
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
        </div>

        <div className="flex flex-wrap gap-2 items-center pt-2">
          <Chip selected count={24}>Tất cả</Chip>
          <Chip>Hỏi đáp môn học</Chip>
          <Chip>#CSD201</Chip>
          <Chip onRemove={() => toast.info('Đã xóa chip')}>Bộ lọc: Hòa Lạc</Chip>
        </div>

        <Pagination page={page} pageSize={10} total={95} onChange={setPage} />
      </section>

      {/* 3. REUSABLE BLOCKS (R3): DateBadge, UpcomingList, EntityRow, StatRow, ListToolbar */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold border-b border-neutral-200 pb-2 text-neutral-900">
          3. Khối ghép tái sử dụng (R3 Shared Blocks)
        </h2>

        <StatRow
          items={[
            { label: 'Cần bạn phản hồi', value: 4, tone: 'warning', active: true },
            { label: 'Đang chờ người khác', value: 2, tone: 'default' },
            { label: 'Đã xử lý 30 ngày qua', value: 18, tone: 'success' },
          ]}
        />

        <ListToolbar
          search={{
            value: searchQ,
            onChange: setSearchQ,
            placeholder: 'Tìm kiếm hoạt động, nhóm, câu hỏi...',
          }}
        />

        <ActiveFilterChips
          filters={[
            { key: 'type', label: 'Loại', valueLabel: 'Workshop' },
            { key: 'mode', label: 'Hình thức', valueLabel: 'Offline' },
          ]}
          onRemove={(k) => toast.info(`Xóa lọc ${k}`)}
          onClearAll={() => toast.info('Đã xóa tất cả bộ lọc')}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-card-title text-neutral-900">DateBadge & UpcomingList</h3>
              <DateBadge date="2026-10-04T14:00:00Z" size="md" />
            </div>
            <UpcomingList
              items={[
                {
                  id: 'u1',
                  title: 'Code Camp Fall 2026: Git Flow & CI/CD',
                  organizerName: 'F-Code Club · Tòa Gamma',
                  startAt: '2026-10-04T14:00:00Z',
                  href: '/clubs/opportunities/opp_01',
                },
                {
                  id: 'u2',
                  title: 'Chiến dịch Chủ Nhật Xanh: Thu gom pin cũ',
                  organizerName: 'Tình nguyện · Ký túc xá Dom A',
                  startAt: '2026-10-03T07:30:00Z',
                  href: '/programs/prog_01',
                },
              ]}
              viewAllHref="/events"
            />
          </Card>

          <Card className="p-4 space-y-2">
            <h3 className="text-card-title text-neutral-900">EntityRow</h3>
            <div className="divide-y divide-neutral-100">
              <EntityRow
                leading={
                  <UserAvatar
                    user={{ id: 'u1', fullName: 'Trần Minh Cường' }}
                    size="sm"
                    linkToProfile={false}
                  />
                }
                title="Trần Minh Cường"
                subtitle="Kỹ thuật phần mềm · K17 · Chủ nhiệm F-Code"
                badge={<Badge tier="pending">Đại diện CLB</Badge>}
                actions={<Button size="sm" variant="secondary">Nhắn tin</Button>}
              />
              <EntityRow
                leading={
                  <UserAvatar
                    user={{ id: 'u2', fullName: 'Lê Thị Bình' }}
                    size="sm"
                    linkToProfile={false}
                  />
                }
                title="Lê Thị Bình"
                subtitle="Mentor môn CSD201, PRJ301"
                badge={<Badge tier="success">Mentor</Badge>}
                actions={<Button size="sm" variant="primary">Theo dõi</Button>}
              />
            </div>
          </Card>
        </div>
      </section>

      {/* 4. ACTIVITY CORE (R5): ActivityCard & ActionCard */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold border-b border-neutral-200 pb-2 text-neutral-900">
          4. Activity Core (R5 — Dùng chung cho FE-04 CLB & FE-06 Chương trình)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ActivityCard
            id="opp_01"
            href="/clubs/opportunities/opp_01"
            coverImageUrl="https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&auto=format&fit=crop&q=80"
            galleryCount={2}
            typeBadge={{ label: 'Sự kiện CLB', variant: 'info' }}
            organizer={{ name: 'F-Code Club', verified: true }}
            title="Code Camp Fall 2026: Thực chiến Git Flow & CI/CD cho đồ án SWP391"
            startAt="2026-10-04T14:00:00Z"
            locationOrMode="Hội trường Gamma, ĐH FPT"
            registeredCount={54}
            capacity={80}
            actionSlot={
              <Button size="sm" variant="secondary">
                Xem & đăng ký
              </Button>
            }
          />

          <div className="space-y-4">
            <ActionCard
              statusBadge={<Badge tier="success">Sẽ tham gia ✓</Badge>}
              capacityBar={{ current: 32, max: 50, label: 'Tình nguyện viên xác nhận' }}
              metaRows={[{ label: 'Hạn đăng ký', value: '02/10/2026 · 20:00' }]}
              primaryAction={
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => toast.info('Mở hội thoại BTC')}
                >
                  Trao đổi với BTC
                </Button>
              }
              note="Tập trung lúc 07:15 tại Sân chính Tòa Alpha."
            />
            <LimitNotice noun="chương trình" count={6} alwaysShow />
          </div>
        </div>
      </section>

      {/* 5. MEDIA UPLOAD & GALLERY */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold border-b border-neutral-200 pb-2 text-neutral-900">
          5. Media & Hình ảnh (ImageGallery, CoverImagePicker, ImageUploader)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-4 space-y-3">
            <h3 className="text-card-title text-neutral-900">ImageGallery (Bấm để mở Lightbox)</h3>
            <ImageGallery images={galleryImgs} />
          </Card>

          <Card className="p-4 space-y-4">
            <CoverImagePicker
              value={coverImg}
              onChange={setCoverImg}
              aspect="16/9"
            />
            <ImageUploader
              value={galleryImgs}
              onChange={setGalleryImgs}
              maxImages={6}
            />
          </Card>
        </div>
      </section>

      {/* 6. ALERTS & BANNERS */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold border-b border-neutral-200 pb-2 text-neutral-900">
          6. Alerts & Banners
        </h2>
        <div className="space-y-3">
          <DisclaimerBanner />
          <AIFallbackBanner visible onFallback={() => toast.info('Chuyển sang tìm kiếm trực tiếp')} />
          <Alert variant="neutral" title="Thông tin chung">
            Đây là thông điệp hiển thị mức độ Neutral dành cho hướng dẫn sử dụng.
          </Alert>
          <Alert variant="attention" title="Yêu cầu bổ sung hồ sơ">
            Hồ sơ ứng tuyển của bạn cần cập nhật thêm thông tin liên hệ.
          </Alert>
        </div>
      </section>

      {/* 7. FORM & SCHEDULE INPUTS */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold border-b border-neutral-200 pb-2 text-neutral-900">
          7. Form Controls, TagInput & ScheduleInput
        </h2>
        <Card className="p-5 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-700">Họ và tên</label>
              <Input defaultValue="Nguyễn Văn An" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-700">Chuyên ngành</label>
              <Select
                options={[
                  { value: 'SE', label: 'Kỹ thuật phần mềm' },
                  { value: 'AI', label: 'Trí tuệ nhân tạo' },
                ]}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-neutral-700">Kỹ năng chuyên môn</label>
            <TagInput value={tags} onChange={setTags} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-neutral-700">Khung giờ rảnh trong tuần</label>
            <ScheduleInput value={schedule} onChange={setSchedule} />
          </div>
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <Switch checked={switchVal} onCheckedChange={setSwitchVal} />
              <span className="text-xs text-neutral-700">
                Cho phép gợi ý nhóm học tập tự động
              </span>
            </div>
            <SegmentedControl
              value={segmentedVal}
              onValueChange={setSegmentedVal}
              options={[
                { value: 'overview', label: 'Tổng quan' },
                { value: 'details', label: 'Chi tiết' },
              ]}
            />
          </div>
        </Card>
      </section>

      {/* 8. DIALOGS & STATES */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold border-b border-neutral-200 pb-2 text-neutral-900">
          8. Dialogs, EmptyState, ErrorState & Skeletons
        </h2>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setConfirmOpen(true)}>
            Mở ConfirmDialog
          </Button>
          <Button variant="destructive" onClick={() => setReasonOpen(true)}>
            Mở ReasonDialog
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <EmptyState
            icon={Inbox}
            title="Chưa có dữ liệu"
            description="Trạng thái rỗng mẫu chuẩn hóa."
          />
          <ErrorState
            title="Không tải được dữ liệu"
            message="Đã xảy ra lỗi kết nối máy chủ."
            onRetry={() => toast.info('Đang thử lại...')}
          />
        </div>
        <LoadingSkeleton variant="thread-list" count={2} />
      </section>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Xác nhận thao tác"
        description="Bạn có chắc chắn muốn thực hiện hành động này?"
        onConfirm={() => {
          setConfirmOpen(false);
          toast.success('Đã xác nhận!');
        }}
      />

      <ReasonDialog
        open={reasonOpen}
        onOpenChange={setReasonOpen}
        title="Nhập lý do từ chối"
        description="Lý do sẽ được gửi thông báo trực tiếp tới sinh viên."
        onConfirm={(reason) => {
          setReasonOpen(false);
          toast.info(`Đã gửi lý do: ${reason}`);
        }}
      />
    </div>
  );
};

export default KitchenSinkPage;
