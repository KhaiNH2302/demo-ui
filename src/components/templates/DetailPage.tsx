import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export interface DetailPageProps {
  backHref: string;
  backLabel: string;
  cover?: React.ReactNode;
  header: React.ReactNode;
  main: React.ReactNode;
  actionCard?: React.ReactNode;
  relatedSection?: React.ReactNode;
}

/**
 * Khung trang chi tiết thực thể (K2, G2, M2, S2, CL2, CL3, PG2)
 * Bố cục 2 cột 2/3 nội dung chính + 1/3 cột phải sticky (ActionCard)
 * theo 04-reuse-plan.md § 2.3.2
 */
export const DetailPage: React.FC<DetailPageProps> = ({
  backHref,
  backLabel,
  cover,
  header,
  main,
  actionCard,
  relatedSection,
}) => {
  return (
    <div className="space-y-5">
      <div>
        <Link
          to={backHref}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-600 hover:text-neutral-900"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>{backLabel}</span>
        </Link>
      </div>

      {cover}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className={actionCard ? 'lg:col-span-8 space-y-6' : 'lg:col-span-12 space-y-6'}>
          {header}
          {main}
        </div>

        {actionCard && (
          <aside className="lg:col-span-4 space-y-4 lg:sticky lg:top-20">
            {actionCard}
          </aside>
        )}
      </div>

      {relatedSection && (
        <div className="pt-6 border-t border-neutral-200">{relatedSection}</div>
      )}
    </div>
  );
};
