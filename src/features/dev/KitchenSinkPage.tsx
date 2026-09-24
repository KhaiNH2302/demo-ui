import React, { useState } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { StatusTimeline } from '@/components/shared/StatusTimeline';
import { AIResultCard } from '@/components/shared/AIResultCard';
import { AIFallbackBanner } from '@/components/shared/AIFallbackBanner';
import { DisclaimerBanner } from '@/components/shared/DisclaimerBanner';
import { UserMiniCard } from '@/components/shared/UserMiniCard';
import { TagInput } from '@/components/shared/TagInput';
import { ScheduleInput } from '@/components/shared/ScheduleInput';
import { SummaryCard } from '@/components/shared/SummaryCard';
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
import { toast } from '@/components/ui/Toast';
import { Sparkles, Users, CheckCircle, Info, AlertTriangle, XCircle, Shield } from 'lucide-react';
import type { ScheduleSlot } from '@/types/entities';

export const KitchenSinkPage: React.FC = () => {
  const [tags, setTags] = useState(['React', 'TypeScript', 'TailwindCSS']);
  const [schedule, setSchedule] = useState<ScheduleSlot[]>([
    { day: 'Mon', start: '19:00', end: '21:00' },
    { day: 'Sat', start: '14:00', end: '17:00' },
  ]);
  const [switchVal, setSwitchVal] = useState(true);

  return (
    <div className="space-y-10 max-w-5xl mx-auto pb-16">
      <PageHeader
        title="Kitchen Sink — UI Primitives & Design System"
        description="Trang trưng bày và kiểm thử toàn bộ Component Primitives, Shared Business Components và bảng màu Semantic 5 cấp độ"
        breadcrumbs={[
          { label: 'Trang chủ', href: '/' },
          { label: 'Kitchen Sink' },
        ]}
      />

      {/* 1. SEMANTIC COLOR TIERS */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold border-b border-[var(--border-subtle)] pb-2">
          1. Hệ thống 5 Màu Ngữ nghĩa (Semantic Color Tiers)
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
          <div className="p-4 rounded-xl bg-[var(--surface-card)] border border-[var(--border-subtle)] space-y-2">
            <Badge variant="neutral">Tier 1: Neutral</Badge>
            <p className="text-xs text-[var(--text-muted)]">Dùng cho trạng thái Nháp, Khởi tạo, Chung.</p>
          </div>
          <div className="p-4 rounded-xl bg-[var(--status-pending-bg)] border border-[var(--status-pending-border)] space-y-2">
            <Badge variant="pending">Tier 2: Pending</Badge>
            <p className="text-xs text-[var(--status-pending-fg)]">Dùng cho trạng thái Chờ duyệt, Xử lý.</p>
          </div>
          <div className="p-4 rounded-xl bg-[var(--status-attention-bg)] border border-[var(--status-attention-border)] space-y-2">
            <Badge variant="attention">Tier 3: Attention</Badge>
            <p className="text-xs text-[var(--status-attention-fg)]">Cần hành động, Phỏng vấn, Đang diễn ra.</p>
          </div>
          <div className="p-4 rounded-xl bg-[var(--status-success-bg)] border border-[var(--status-success-border)] space-y-2">
            <Badge variant="success">Tier 4: Success</Badge>
            <p className="text-xs text-[var(--status-success-fg)]">Đã khớp, Trúng tuyển, Hoàn thành, Duyệt.</p>
          </div>
          <div className="p-4 rounded-xl bg-[var(--status-danger-bg)] border border-[var(--status-danger-border)] space-y-2">
            <Badge variant="danger">Tier 5: Danger</Badge>
            <p className="text-xs text-[var(--status-danger-fg)]">Hủy, Từ chối, Khóa tài khoản, Vi phạm.</p>
          </div>
        </div>
      </section>

      {/* 2. BUTTONS & TOASTS */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold border-b border-[var(--border-subtle)] pb-2">
          2. Nút bấm & Toast Notifications
        </h2>
        <div className="flex flex-wrap gap-3">
          <Button variant="primary" onClick={() => toast.success('Thao tác thành công!')}>
            Primary Button
          </Button>
          <Button variant="secondary" onClick={() => toast.info('Thông báo thông tin chung')}>
            Secondary Button
          </Button>
          <Button variant="outline" onClick={() => toast.warning('Cảnh báo lưu ý')}>
            Outline Button
          </Button>
          <Button variant="danger" onClick={() => toast.error('Đã xảy ra lỗi!')}>
            Danger Button
          </Button>
          <Button variant="ghost">Ghost Button</Button>
          <Button loading>Loading...</Button>
        </div>
      </section>

      {/* 3. ALERTS & BANNERS */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold border-b border-[var(--border-subtle)] pb-2">
          3. Alerts & Banners
        </h2>
        <div className="space-y-3">
          <DisclaimerBanner />
          <AIFallbackBanner onFallback={() => toast.info('Đã kích hoạt chế độ Fallback')} />
          <Alert variant="neutral" title="Thông tin chung">
            Đây là thông điệp hiển thị mức độ Neutral.
          </Alert>
          <Alert variant="attention" title="Yêu cầu bổ sung thông tin">
            Hồ sơ của bạn cần được cập nhật thêm bảng điểm.
          </Alert>
          <Alert variant="danger" title="Lỗi nghiêm trọng">
            Không thể kết nối đến máy chủ xác thực.
          </Alert>
        </div>
      </section>

      {/* 4. SHARED BUSINESS COMPONENTS */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold border-b border-[var(--border-subtle)] pb-2">
          4. Shared Business Components
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">UserMiniCard & Status Badges</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <UserMiniCard userId="usr_student_01" showMajor />
              <UserMiniCard userId="usr_mentor_02" showMajor />
              <div className="flex flex-wrap gap-2 pt-2">
                <StatusBadge status="Draft" domain="swap" />
                <StatusBadge status="Matching" domain="swap" />
                <StatusBadge status="Matched" domain="swap" />
                <StatusBadge status="Accepted" domain="clubs" />
                <StatusBadge status="PendingApproval" domain="clubs" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">AIResultCard</CardTitle>
            </CardHeader>
            <CardContent>
              <AIResultCard
                score={96}
                reasons={[
                  'Trùng khớp nguyện vọng môn học CSD201',
                  'Lịch rảnh tối Thứ 3 tương thích 100%',
                  'Đã học cùng giảng viên kỳ trước',
                ]}
              >
                <div className="p-2 text-xs text-[var(--text-muted)]">Nội dung chi tiết kết quả ghép đôi</div>
              </AIResultCard>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">StatusTimeline</CardTitle>
            </CardHeader>
            <CardContent>
              <StatusTimeline
                steps={[
                  { label: 'Nộp đơn', status: 'completed' },
                  { label: 'Sàng lọc hồ sơ', status: 'completed' },
                  { label: 'Phỏng vấn', status: 'current' },
                  { label: 'Trúng tuyển', status: 'upcoming' },
                ]}
              />
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 5. FORM CONTROLS & SCHEDULE INPUT */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold border-b border-[var(--border-subtle)] pb-2">
          5. Form Inputs, TagInput & ScheduleInput
        </h2>
        <Card>
          <CardContent className="p-6 space-y-6">
            <div>
              <label className="text-sm font-semibold block mb-2">TagInput:</label>
              <TagInput tags={tags} onChange={setTags} placeholder="Thêm tag..." />
            </div>

            <div>
              <label className="text-sm font-semibold block mb-2">ScheduleInput:</label>
              <ScheduleInput value={schedule} onChange={setSchedule} />
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">Switch toggle:</span>
              <Switch checked={switchVal} onCheckedChange={setSwitchVal} />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs text-[var(--text-muted)]">
                <span>Tiến độ hoàn thành hồ sơ:</span>
                <span className="font-bold">75%</span>
              </div>
              <Progress value={75} />
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default KitchenSinkPage;
