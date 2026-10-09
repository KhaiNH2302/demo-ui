import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Clock3, Search, Sparkles } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface MentoringFeedPageProps { embedded?: boolean; roleOverride?: 'student' | 'mentor'; }

export const MentoringFeedPage: React.FC<MentoringFeedPageProps> = () => {
  const navigate = useNavigate();
  return (
    <div className="space-y-6">
      <PageHeader title="Tư vấn & Hướng dẫn học tập (Mentoring)" description="Kết nối với các sinh viên khóa trên và Mentor xuất sắc để nhận trợ giúp học tập và định hướng" breadcrumbs={[{ label: 'Trang chủ', href: '/' }, { label: 'Mentoring' }]} actions={<Button variant="outline" onClick={() => navigate('/mentoring/requests')}>Yêu cầu của tôi (0)</Button>} />
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-brand-100 bg-gradient-to-br from-brand-50/80 to-white"><CardHeader className="space-y-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-100 text-brand-600"><Sparkles className="h-5 w-5" /></div><CardTitle className="text-base">Tìm Mentor bằng AI</CardTitle><p className="text-sm leading-relaxed text-neutral-600">Mô tả môn học, vấn đề bạn đang gặp và thời gian rảnh. AI sẽ phân tích để gợi ý những Mentor phù hợp nhất.</p></CardHeader><CardFooter><Button className="w-full" onClick={() => navigate('/mentoring/ai')}><Sparkles className="mr-1.5 h-4 w-4" /> Khám phá gợi ý AI</Button></CardFooter></Card>
        <Card><CardHeader className="space-y-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-neutral-100 text-neutral-700"><Search className="h-5 w-5" /></div><CardTitle className="text-base">Tự duyệt danh sách Mentor</CardTitle><p className="text-sm leading-relaxed text-neutral-600">Xem toàn bộ hồ sơ Mentor, lọc theo chuyên ngành và chủ động gửi yêu cầu hỗ trợ.</p></CardHeader><CardFooter><Button variant="outline" className="w-full" onClick={() => navigate('/mentoring/browse')}>Duyệt danh sách Mentor <ArrowRight className="ml-1.5 h-4 w-4" /></Button></CardFooter></Card>
      </div>
      <div className="space-y-3"><h2 className="flex items-center gap-2 text-base font-semibold text-neutral-900"><Clock3 className="h-4 w-4 text-brand-600" /> Yêu cầu hỗ trợ gần đây của bạn</h2><Card className="flex min-h-32 items-center justify-center border-dashed bg-neutral-50/60"><p className="text-sm text-neutral-500">Bạn chưa gửi yêu cầu tư vấn Mentoring nào gần đây.</p></Card></div>
    </div>
  );
};

export default MentoringFeedPage;
