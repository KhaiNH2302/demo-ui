import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { privacyContent } from '@/content/privacy';

export const PrivacyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-neutral-50 py-10 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link to="/">
            <Button variant="ghost" size="sm" leftIcon={<ArrowLeft size={16} />}>
              Về trang chủ
            </Button>
          </Link>
          <span className="text-xs text-neutral-400">Phiên bản 1.0 (25/09/2026)</span>
        </div>

        <Card className="p-6 md:p-10 space-y-6 bg-white shadow-sm border-neutral-200">
          <div className="flex items-center gap-3 pb-4 border-b border-neutral-100">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <Shield size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-neutral-900">Chính sách quyền riêng tư</h1>
              <p className="text-xs text-neutral-500">Cách SCS thu thập, bảo vệ và sử dụng dữ liệu sinh viên</p>
            </div>
          </div>

          <div className="prose prose-sm text-neutral-700 leading-relaxed space-y-4 whitespace-pre-line text-xs">
            {privacyContent}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default PrivacyPage;
