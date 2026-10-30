import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CalendarDays, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { MentorApplication } from '@/types/entities';

// Mốc từ lúc mở form đến khi nhận học viên đầu tiên; thời lượng là thông tin người đọc cần nhất
const TIMELINE = [
  { title: 'Điền hồ sơ', duration: 'Khoảng 10 phút', detail: 'Môn bạn nhận kèm kèm điểm, kinh nghiệm, lời giới thiệu và CV.' },
  { title: 'Ban Quản trị xét duyệt', duration: '1–3 ngày làm việc', detail: 'Đối chiếu bảng điểm, có thể nhờ bạn bổ sung một vài mục.' },
  { title: 'Mở Mentor Center', duration: 'Ngay khi được duyệt', detail: 'Đặt học phí (hoặc miễn phí), gói học và lịch rảnh hằng tuần.' },
  { title: 'Nhận yêu cầu đầu tiên', duration: 'Tùy lịch của bạn', detail: 'Học viên chọn giờ trong lịch rảnh, bạn quyết định nhận hay không.' },
];

const CRITERIA = [
  { rule: 'Sinh viên từ năm 3 hoặc cựu sinh viên', check: 'Lấy từ tài khoản đã xác minh với trường.' },
  { rule: 'GPA tích lũy từ 2.8/4 (hoặc 7.0/10)', check: 'Đối chiếu với bảng điểm bạn đính kèm.' },
  { rule: 'Không vi phạm quy chế học vụ', check: 'Ban Quản trị tra cứu hồ sơ kỷ luật của trường.' },
  { rule: 'Có ít nhất 3 bài chia sẻ hoặc câu trả lời hữu ích', check: 'Tính trên mục Kiến thức của SCS.' },
];

// Thẻ minh họa: đúng thứ một Mentor nhận được mỗi tuần
const SampleRequest: React.FC = () => (
  <figure className="space-y-3">
    <div className="rounded-2xl border border-neutral-200 bg-surface p-5 shadow-[0_1px_0_rgba(15,23,42,0.04),0_12px_32px_-12px_rgba(15,23,42,0.18)] dark:border-neutral-700">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium text-neutral-500">Yêu cầu kèm học mới</span>
        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
          Hạn phản hồi 2 ngày
        </span>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700 dark:bg-brand-500/20 dark:text-brand-200">
          MA
        </span>
        <div>
          <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Nguyễn Minh Anh</p>
          <p className="text-xs text-neutral-500">Kỹ thuật phần mềm · K19</p>
        </div>
      </div>

      <p className="mt-4 text-base font-semibold leading-snug text-neutral-900 dark:text-neutral-100">
        CSD201: em chưa hiểu duyệt cây nhị phân và BFS
      </p>
      <p className="mt-1 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
        Tuần sau em thi giữa kỳ, đã xem slide nhưng làm bài tập vẫn sai thứ tự duyệt. Anh/chị kèm em một buổi được không ạ?
      </p>

      <dl className="mt-4 space-y-1.5 text-sm text-neutral-700 dark:text-neutral-300">
        <div className="flex items-center gap-2">
          <Wallet className="h-4 w-4 text-neutral-400" />
          <dt className="sr-only">Hình thức</dt>
          <dd>Học thử 30 phút, miễn phí</dd>
        </div>
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-neutral-400" />
          <dt className="sr-only">Thời gian</dt>
          <dd className="tabular-nums">Thứ 3, 19:00 – 19:30</dd>
        </div>
      </dl>

      <div className="mt-5 grid grid-cols-2 gap-2" aria-hidden>
        <span className="rounded-lg border border-neutral-200 py-2 text-center text-sm font-medium text-neutral-600 dark:border-neutral-700">
          Từ chối
        </span>
        <span className="rounded-lg bg-brand-600 py-2 text-center text-sm font-semibold text-white">Nhận kèm</span>
      </div>
    </div>
    <figcaption className="px-1 text-xs text-neutral-500">
      Ví dụ một yêu cầu Mentor nhận được. Bạn chọn môn, giờ rảnh và học phí; học viên chọn trong đó.
    </figcaption>
  </figure>
);

interface MentorApplyLandingProps {
  draft?: MentorApplication;
}

export const MentorApplyLanding: React.FC<MentorApplyLandingProps> = ({ draft }) => {
  const navigate = useNavigate();
  const hasDraft = Boolean(draft && (draft.status === 'Draft' || draft.status === 'Withdrawn') && draft.about?.headline);
  const startLabel = hasDraft ? 'Tiếp tục bản nháp' : 'Bắt đầu điền hồ sơ';

  return (
    <div className="mx-auto max-w-5xl pb-12">
      <Link
        to="/mentoring"
        className="inline-flex items-center gap-1.5 rounded-md text-sm text-neutral-500 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 dark:hover:text-neutral-100"
      >
        <ArrowLeft className="h-4 w-4" /> Mentoring
      </Link>

      {/* Mở đầu: lời mời + một yêu cầu thật để hình dung công việc */}
      <section className="mt-6 grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <h1 className="max-w-xl text-3xl font-bold leading-[1.15] tracking-tight text-neutral-900 sm:text-[2.5rem] dark:text-neutral-50">
            Kèm các bạn khóa dưới những môn bạn đã vượt qua
          </h1>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-neutral-600 dark:text-neutral-400">
            Bạn chọn môn nhận kèm, đặt lịch rảnh và học phí, hoặc kèm miễn phí. Học viên gửi yêu cầu kèm buổi học thử,
            bạn xem trước rồi mới quyết định nhận.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button size="lg" onClick={() => navigate('/mentor/apply/form')}>
              {startLabel}
            </Button>
            <Button size="lg" variant="ghost" onClick={() => navigate('/mentoring/browse')}>
              Xem các Mentor đang kèm
            </Button>
          </div>
          <p className="mt-3 text-sm text-neutral-500">4 bước, khoảng 10 phút. Bản nháp được lưu mỗi khi bạn chuyển bước.</p>
        </div>
        <div className="lg:col-span-5">
          <SampleRequest />
        </div>
      </section>

      {/* Lộ trình: chuỗi có thứ tự thật, mỗi mốc ghi mất bao lâu */}
      <section className="mt-20" aria-labelledby="timeline-heading">
        <h2 id="timeline-heading" className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
          Từ lúc nộp hồ sơ đến học viên đầu tiên
        </h2>
        <ol className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {TIMELINE.map((item, index) => (
            <li key={item.title} className="relative lg:pt-8">
              {/* đường nối ngang tới mốc kế tiếp (desktop) */}
              {index < TIMELINE.length - 1 && (
                <span aria-hidden className="absolute left-6 -right-6 top-[11px] hidden h-0.5 bg-neutral-200 lg:block dark:bg-neutral-700" />
              )}
              <span
                aria-hidden
                className="absolute left-0 top-0 hidden h-6 w-6 items-center justify-center rounded-full border-2 border-brand-600 bg-surface text-xs font-bold text-brand-700 lg:flex dark:text-brand-300"
              >
                {index + 1}
              </span>
              <p className="text-sm font-semibold tabular-nums text-brand-700 dark:text-brand-300">
                <span className="lg:hidden">{index + 1}. </span>
                {item.duration}
              </p>
              <h3 className="mt-1 text-base font-semibold text-neutral-900 dark:text-neutral-100">{item.title}</h3>
              <p className="mt-1 max-w-[30ch] text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">{item.detail}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Điều kiện: nói rõ được kiểm tra bằng cách nào, không đánh dấu như thể đã đạt */}
      <section className="mt-20" aria-labelledby="criteria-heading">
        <h2 id="criteria-heading" className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
          Ban Quản trị xét những gì
        </h2>
        <dl className="mt-6 divide-y divide-neutral-200 border-y border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
          {CRITERIA.map((item) => (
            <div key={item.rule} className="grid grid-cols-1 gap-1 py-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] sm:gap-8">
              <dt className="text-base font-medium text-neutral-900 dark:text-neutral-100">{item.rule}</dt>
              <dd className="text-sm text-neutral-600 dark:text-neutral-400 sm:pt-0.5">{item.check}</dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="mt-16 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-base text-neutral-700 dark:text-neutral-300">Có thể dừng giữa chừng, hồ sơ giữ nguyên ở bản nháp.</p>
        <Button size="lg" onClick={() => navigate('/mentor/apply/form')}>
          {startLabel}
        </Button>
      </div>
    </div>
  );
};
