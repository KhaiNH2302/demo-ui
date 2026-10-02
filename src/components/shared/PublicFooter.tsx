import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { LegalDialog } from '@/components/shared/LegalDialog';

export const PublicFooter: React.FC = () => {
  const [legalType, setLegalType] = useState<'terms' | 'privacy' | null>(null);

  return (
    <>
      <footer className="border-t border-neutral-200 bg-surface py-4 px-4 text-center text-xs text-neutral-500">
        <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
          <span>© 2026 SEP490-G72</span>
          <span>·</span>
          <button
            type="button"
            onClick={() => setLegalType('terms')}
            className="hover:text-neutral-900 transition-colors cursor-pointer"
          >
            Điều khoản
          </button>
          <span>·</span>
          <button
            type="button"
            onClick={() => setLegalType('privacy')}
            className="hover:text-neutral-900 transition-colors cursor-pointer"
          >
            Quyền riêng tư
          </button>
          <span>·</span>
          <Link to="/help" className="hover:text-neutral-900 transition-colors">
            Trợ giúp &amp; câu hỏi thường gặp
          </Link>
        </div>
      </footer>

      {legalType && (
        <LegalDialog
          open={!!legalType}
          onOpenChange={(open) => !open && setLegalType(null)}
          type={legalType}
        />
      )}
    </>
  );
};

export default PublicFooter;
