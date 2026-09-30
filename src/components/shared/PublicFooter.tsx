import React from 'react';
import { Link } from 'react-router-dom';

export const PublicFooter: React.FC = () => {
  return (
    <footer className="border-t border-neutral-200 bg-white py-4 px-4 text-center text-xs text-neutral-500">
      <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
        <span>© 2026 SEP490-G72</span>
        <span>·</span>
        <Link to="/terms" className="hover:text-neutral-900 transition-colors">
          Điều khoản
        </Link>
        <span>·</span>
        <Link to="/privacy" className="hover:text-neutral-900 transition-colors">
          Quyền riêng tư
        </Link>
        <span>·</span>
        <Link to="/help" className="hover:text-neutral-900 transition-colors">
          Trợ giúp &amp; câu hỏi thường gặp
        </Link>
      </div>
    </footer>
  );
};

export default PublicFooter;
