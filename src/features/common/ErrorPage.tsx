import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { ShieldAlert, FileQuestion, ServerCrash, ArrowLeft, Home } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export interface ErrorPageProps {
  code?: 403 | 404 | 500;
  title?: string;
  message?: string;
}

export default function ErrorPage({ code: propCode, title: propTitle, message: propMessage }: ErrorPageProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const code = propCode || (location.pathname.includes('403') ? 403 : location.pathname.includes('500') ? 500 : 404);
  const locationState = location.state as { message?: string } | undefined;

  const errorConfigs = {
    403: {
      icon: ShieldAlert,
      title: propTitle || 'Không có quyền truy cập (403)',
      desc:
        propMessage ||
        locationState?.message ||
        'Bạn không có đủ quyền hạn để xem trang hoặc thực hiện thao tác này. Vui lòng liên hệ quản trị viên nếu bạn nghĩ đây là sự nhầm lẫn.',
      color: 'text-amber-600 bg-amber-50',
    },
    404: {
      icon: FileQuestion,
      title: propTitle || 'Không tìm thấy trang (404)',
      desc:
        propMessage ||
        locationState?.message ||
        'Đường dẫn bạn yêu cầu không tồn tại, đã bị xóa hoặc bạn không còn quyền truy cập vào nội dung này.',
      color: 'text-brand-600 bg-brand-50',
    },
    500: {
      icon: ServerCrash,
      title: propTitle || 'Lỗi hệ thống (500)',
      desc:
        propMessage ||
        locationState?.message ||
        'Đã xảy ra sự cố không mong muốn trong quá trình xử lý yêu cầu. Vui lòng thử lại sau ít phút.',
      color: 'text-rose-600 bg-rose-50',
    },
  };

  const config = errorConfigs[code] || errorConfigs[404];
  const Icon = config.icon;

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 py-12">
      <div className={`flex h-20 w-20 items-center justify-center rounded-2xl ${config.color} mb-6 shadow-xs`}>
        <Icon size={40} />
      </div>

      <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 tracking-tight">{config.title}</h1>
      <p className="text-meta text-neutral-500 mt-2 max-w-md leading-relaxed">{config.desc}</p>

      <div className="flex items-center gap-3 mt-8">
        <Button variant="outline" size="sm" onClick={() => navigate(-1)} leftIcon={<ArrowLeft size={16} />}>
          Quay lại
        </Button>
        <Link to="/">
          <Button size="sm" leftIcon={<Home size={16} />}>
            Về Trang chủ
          </Button>
        </Link>
      </div>
    </div>
  );
}
