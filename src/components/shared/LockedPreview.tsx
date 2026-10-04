import React from 'react';
import { Lock } from 'lucide-react';
import { LoadingSkeleton } from './LoadingSkeleton';
import { LoginPromptActions } from './LoginPromptActions';

class PreviewErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    // Trang cá nhân có thể cần người dùng thật; khi xem trước thì thay bằng khung xương.
  }
  render() {
    return this.state.failed ? <LoadingSkeleton variant="list" count={6} /> : this.props.children;
  }
}

export interface LockedPreviewProps {
  title: string;
  description: string;
  actionLabel?: string;
  children: React.ReactNode;
}

/**
 * Hiển thị nội dung bị làm mờ, không tương tác được, kèm thẻ yêu cầu đăng nhập.
 * Dùng cho trang cá nhân của khách và khi khách vượt giới hạn lướt.
 */
export const LockedPreview: React.FC<LockedPreviewProps> = ({
  title,
  description,
  actionLabel,
  children,
}) => {
  return (
    <div className="relative min-h-[60vh]">
      <div
        aria-hidden
        inert
        className="pointer-events-none select-none blur-[6px] opacity-60 max-h-[80vh] overflow-hidden"
      >
        <PreviewErrorBoundary>{children}</PreviewErrorBoundary>
      </div>

      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-neutral-50/60 to-neutral-50" />

      <div className="absolute inset-x-0 top-16 sm:top-24 flex justify-center px-4">
        <div
          role="dialog"
          aria-labelledby="locked-preview-title"
          className="w-full max-w-sm rounded-xl border border-neutral-200 bg-surface p-6 shadow-lg text-center space-y-4"
        >
          <div className="mx-auto h-11 w-11 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center">
            <Lock size={20} />
          </div>
          <div className="space-y-1.5">
            <h2 id="locked-preview-title" className="text-base font-semibold text-neutral-900">
              {title}
            </h2>
            <p className="text-sm text-neutral-600">{description}</p>
          </div>
          <LoginPromptActions actionLabel={actionLabel || title} />
        </div>
      </div>
    </div>
  );
};

export default LockedPreview;
