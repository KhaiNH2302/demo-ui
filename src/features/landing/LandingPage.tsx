import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Repeat2,
  BookOpen,
  UsersRound,
  Building2,
  GraduationCap,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  ChevronDown,
  Menu,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { faqList } from '@/content/faq';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<string | null>(faqList[0]?.id || null);

  const features = [
    {
      icon: Repeat2,
      name: 'Đổi lớp học phần',
      desc: 'Tìm kiếm đối tác hoán đổi lớp nhanh chóng với thuật toán đối ứng và so sánh lịch rảnh.',
    },
    {
      icon: BookOpen,
      name: 'Chia sẻ kiến thức',
      desc: 'Hỏi đáp môn học, chia sẻ tài liệu và kinh nghiệm học tập thực tế từ các tiền bối.',
    },
    {
      icon: UsersRound,
      name: 'Tìm nhóm học tập',
      desc: 'Ghép nhóm đồ án, Capstone hoặc luyện thi theo đúng kỹ năng và thời gian rảnh rỗi.',
    },
    {
      icon: Building2,
      name: 'Câu lạc bộ sinh viên',
      desc: 'Khám phá đợt tuyển thành viên, đăng ký sự kiện và tham gia không gian hoạt động CLB.',
    },
    {
      icon: GraduationCap,
      name: 'Kết nối Mentor',
      desc: 'Nhận hướng dẫn 1-1 từ các sinh viên xuất sắc và cựu sinh viên có chuyên môn cao.',
    },
  ];

  const steps = [
    {
      num: '01',
      title: 'Xác minh email trường',
      desc: 'Đăng ký tài khoản bằng email sinh viên chính thức để đảm bảo an toàn tuyệt đối.',
    },
    {
      num: '02',
      title: 'Hoàn thiện hồ sơ & tiêu chí',
      desc: 'Khai báo kỹ năng, môn học quan tâm và thời gian rảnh để hệ thống tối ưu gợi ý.',
    },
    {
      num: '03',
      title: 'Nhận gợi ý và kết nối',
      desc: 'Khám phá đối tác đổi lớp, nhóm học tập và Mentor phù hợp với tỷ lệ ghép nối cao nhất.',
    },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col text-neutral-900 antialiased selection:bg-brand-500 selection:text-white">
      {/* Header */}
      <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-neutral-200/80 bg-white/95 px-4 md:px-8 backdrop-blur-md">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2.5 font-bold text-lg text-neutral-900">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500 text-white font-black text-lg shadow-xs">
              S
            </div>
            <span>SCS</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-neutral-600">
            <a href="#features" className="hover:text-neutral-900 transition-colors">
              Tính năng
            </a>
            <a href="#how-it-works" className="hover:text-neutral-900 transition-colors">
              Cách hoạt động
            </a>
            <a href="#safety" className="hover:text-neutral-900 transition-colors">
              An toàn
            </a>
            <a href="#faq" className="hover:text-neutral-900 transition-colors">
              Câu hỏi thường gặp
            </a>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
            Đăng nhập
          </Button>
          <Button size="sm" onClick={() => navigate('/register')}>
            Đăng ký
          </Button>
          <button
            type="button"
            className="md:hidden p-1 text-neutral-600 hover:text-neutral-900"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      {/* Mobile Nav Sheet */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-16 z-20 border-b border-neutral-200 bg-white p-4 shadow-lg space-y-3">
          <a
            href="#features"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-medium text-neutral-700"
          >
            Tính năng
          </a>
          <a
            href="#how-it-works"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-medium text-neutral-700"
          >
            Cách hoạt động
          </a>
          <a
            href="#safety"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-medium text-neutral-700"
          >
            An toàn
          </a>
          <a
            href="#faq"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-medium text-neutral-700"
          >
            Câu hỏi thường gặp
          </a>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="px-4 py-16 md:py-24 max-w-6xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3.5 py-1 text-xs font-semibold text-brand-700">
            <Sparkles size={14} /> Nền tảng kết nối thông minh dành cho sinh viên
          </div>

          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-neutral-900 max-w-3xl mx-auto leading-tight">
            Kết nối đúng người, đúng lúc trong trường của bạn
          </h1>

          <p className="text-base md:text-lg text-neutral-600 max-w-2xl mx-auto leading-relaxed">
            Đổi lớp học phần phù hợp, tìm nhóm làm đồ án Capstone, tham gia Câu lạc bộ và kết nối với Mentor sinh viên xuất sắc chỉ trong một nền tảng.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button size="lg" onClick={() => navigate('/register')} className="w-full sm:w-auto">
              Đăng ký bằng email trường <ArrowRight size={16} className="ml-1.5" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/login')} className="w-full sm:w-auto">
              Đăng nhập tài khoản
            </Button>
          </div>

          <p className="text-xs text-neutral-500">
            Chỉ dành cho sinh viên đã xác minh qua email trường đại học
          </p>

          {/* Screenshot Preview Card */}
          <div className="pt-8 max-w-4xl mx-auto">
            <div className="rounded-2xl border border-neutral-200 bg-white p-2 md:p-3 shadow-xl">
              <div className="rounded-xl border border-neutral-100 bg-neutral-50/80 p-4 md:p-6 text-left space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-red-400" />
                    <span className="h-3 w-3 rounded-full bg-amber-400" />
                    <span className="h-3 w-3 rounded-full bg-emerald-400" />
                    <span className="text-xs font-medium text-neutral-400 ml-2">app.scs.edu.vn / Bảng tin</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-brand-600 bg-brand-50 px-2.5 py-0.5 rounded-full">
                      Hệ thống hoạt động ổn định
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="rounded-lg border border-neutral-200 bg-white p-3 space-y-1">
                    <span className="text-xs font-bold text-neutral-800">Đổi lớp học phần</span>
                    <p className="text-[11px] text-neutral-500">Có 3 đối tác có lớp SWP391 khớp với lịch của bạn</p>
                  </div>
                  <div className="rounded-lg border border-neutral-200 bg-white p-3 space-y-1">
                    <span className="text-xs font-bold text-neutral-800">Nhóm đồ án Capstone</span>
                    <p className="text-[11px] text-neutral-500">Nhóm Web AI đang tuyển FE React (Độ phù hợp 94%)</p>
                  </div>
                  <div className="rounded-lg border border-neutral-200 bg-white p-3 space-y-1">
                    <span className="text-xs font-bold text-neutral-800">Mentoring CSD201</span>
                    <p className="text-[11px] text-neutral-500">Mentor Hoàng Nam sẵn sàng giải đáp thắc mắc</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 5 Features Grid */}
        <section id="features" className="px-4 py-16 bg-white border-y border-neutral-200">
          <div className="max-w-6xl mx-auto space-y-12">
            <div className="text-center space-y-2">
              <h2 className="text-2xl md:text-3xl font-bold text-neutral-900">
                5 tính năng cốt lõi cho đời sống sinh viên
              </h2>
              <p className="text-sm text-neutral-500 max-w-xl mx-auto">
                Giải quyết trọn vẹn những nhu cầu kết nối phổ biến nhất trong suốt các học kỳ đại học.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {features.map((feat) => {
                const Icon = feat.icon;
                return (
                  <Card key={feat.name} className="p-6 space-y-3 hover:border-brand-300 transition-colors">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                      <Icon size={22} strokeWidth={1.75} />
                    </div>
                    <h3 className="text-base font-bold text-neutral-900">{feat.name}</h3>
                    <p className="text-xs text-neutral-600 leading-relaxed">{feat.desc}</p>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="px-4 py-16 max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-2xl md:text-3xl font-bold text-neutral-900">
              Cách thức hoạt động đơn giản
            </h2>
            <p className="text-sm text-neutral-500">
              Bắt đầu kết nối chỉ với 3 bước cơ bản.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step) => (
              <div key={step.num} className="space-y-3 relative">
                <span className="text-4xl font-black text-brand-300">{step.num}</span>
                <h3 className="text-base font-bold text-neutral-900">{step.title}</h3>
                <p className="text-xs text-neutral-600 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Safety Commitments */}
        <section id="safety" className="px-4 py-16 bg-neutral-100 border-y border-neutral-200">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="flex justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500 text-white shadow-xs">
                <ShieldCheck size={26} />
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl md:text-3xl font-bold text-neutral-900">
                Cam kết môi trường an toàn & minh bạch
              </h2>
              <p className="text-sm text-neutral-600 max-w-xl mx-auto">
                Hệ thống được thiết kế với các nguyên tắc bảo vệ quyền riêng tư và trung thực học thuật.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
              <div className="rounded-xl border border-neutral-200 bg-white p-4 space-y-2">
                <div className="flex items-center gap-2 text-brand-600 font-bold text-xs">
                  <CheckCircle2 size={16} /> 100% Sinh viên xác thực
                </div>
                <p className="text-[11px] text-neutral-500 leading-relaxed">
                  Chỉ sinh viên sở hữu email chính thức của trường mới được tham gia mạng lưới.
                </p>
              </div>

              <div className="rounded-xl border border-neutral-200 bg-white p-4 space-y-2">
                <div className="flex items-center gap-2 text-brand-600 font-bold text-xs">
                  <CheckCircle2 size={16} /> AI chỉ đóng vai trò gợi ý
                </div>
                <p className="text-[11px] text-neutral-500 leading-relaxed">
                  Thuật toán không tự gửi lời mời hay kết nối khi chưa có sự xác nhận của bạn.
                </p>
              </div>

              <div className="rounded-xl border border-neutral-200 bg-white p-4 space-y-2">
                <div className="flex items-center gap-2 text-brand-600 font-bold text-xs">
                  <CheckCircle2 size={16} /> Kết nối thông tin minh bạch
                </div>
                <p className="text-[11px] text-neutral-500 leading-relaxed">
                  Đổi lớp là cầu nối thông tin, hai bạn tự thực hiện thủ tục chính thức với trường.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQs Accordion */}
        <section id="faq" className="px-4 py-16 max-w-3xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl md:text-3xl font-bold text-neutral-900">
              Câu hỏi thường gặp
            </h2>
            <p className="text-sm text-neutral-500">
              Giải đáp các thắc mắc phổ biến về quy tắc và tính năng trên hệ thống.
            </p>
          </div>

          <div className="space-y-3">
            {faqList.slice(0, 5).map((faq) => {
              const isOpen = openFaq === faq.id;
              return (
                <div
                  key={faq.id}
                  className="rounded-xl border border-neutral-200 bg-white transition-all overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : faq.id)}
                    className="flex w-full items-center justify-between p-4 text-left text-sm font-semibold text-neutral-900 hover:text-brand-600 transition-colors"
                  >
                    <span>{faq.question}</span>
                    <ChevronDown
                      size={16}
                      className={`text-neutral-400 transition-transform ${isOpen ? 'rotate-180 text-brand-600' : ''}`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 text-xs text-neutral-600 leading-relaxed border-t border-neutral-100 pt-3">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="text-center pt-2">
            <Link to="/help" className="text-xs font-semibold text-brand-600 hover:underline">
              Xem tất cả câu hỏi tại Trung tâm Trợ giúp →
            </Link>
          </div>
        </section>

        {/* CTA Banner */}
        <section className="px-4 py-16 bg-brand-50 border-t border-brand-100">
          <div className="max-w-4xl mx-auto text-center space-y-5">
            <h2 className="text-2xl md:text-3xl font-bold text-neutral-900">
              Sẵn sàng kết nối với cộng đồng sinh viên trường bạn?
            </h2>
            <p className="text-sm text-neutral-600 max-w-xl mx-auto">
              Đăng ký tài khoản miễn phí chỉ trong vài phút với email sinh viên.
            </p>
            <div>
              <Button size="lg" onClick={() => navigate('/register')}>
                Tạo tài khoản ngay
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Public Footer */}
      <footer className="border-t border-neutral-200 bg-white py-8 px-4 text-center text-xs text-neutral-500 space-y-3">
        <div className="flex flex-wrap justify-center gap-6 font-medium text-neutral-600">
          <Link to="/terms" className="hover:text-neutral-900 transition-colors">
            Điều khoản sử dụng
          </Link>
          <Link to="/privacy" className="hover:text-neutral-900 transition-colors">
            Chính sách quyền riêng tư
          </Link>
          <Link to="/help" className="hover:text-neutral-900 transition-colors">
            Trung tâm trợ giúp
          </Link>
        </div>
        <p>© 2026 SEP490 - G72 (Student Connection System). All rights reserved.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
