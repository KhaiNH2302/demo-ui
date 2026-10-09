import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { BriefcaseBusiness, CalendarDays, Link as LinkIcon, MapPin, MessageCircle, MoreHorizontal, Quote, GraduationCap, UserPlus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { SendMentoringRequestDialog } from './SendMentoringRequestDialog';

const avatar = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=240&auto=format&fit=crop&q=80';
const cover = 'https://images.unsplash.com/photo-1500534623283-312aade485b7?w=1400&auto=format&fit=crop&q=85';

export const MentorDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [tab, setTab] = useState<'posts' | 'about' | 'activity'>('posts');
  const [requestOpen, setRequestOpen] = useState(false);
  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <Card className="overflow-hidden"><div className="h-44 bg-cover bg-center" style={{ backgroundImage: `url(${cover})` }} /><div className="relative px-6 pb-5"><img src={avatar} alt="Nguyễn Văn An" className="-mt-14 h-28 w-28 rounded-full border-4 border-white object-cover shadow-md" /><div className="mt-3 flex flex-col gap-4 md:flex-row md:items-start md:justify-between"><div><h1 className="text-2xl font-bold text-neutral-900">Nguyễn Văn An</h1><p className="mt-1 text-sm text-neutral-500">“Thích React và tìm nhóm đồ án AI”</p><div className="mt-3 flex gap-5 text-xs text-neutral-500"><span><strong className="text-neutral-800">42</strong> người theo dõi</span><span><strong className="text-neutral-800">28</strong> đang theo dõi</span></div></div><div className="flex gap-2"><Button onClick={() => setRequestOpen(true)}><UserPlus className="mr-1.5 h-4 w-4" /> Theo dõi</Button><Button variant="outline"><MessageCircle className="mr-1.5 h-4 w-4" /> Nhắn tin</Button><Button variant="ghost" size="sm" aria-label="Thêm"><MoreHorizontal className="h-5 w-5" /></Button></div></div><div className="mt-5 flex gap-6 border-b border-neutral-200 text-sm">{[['posts', 'Bài viết (0)'], ['about', 'Giới thiệu'], ['activity', 'Hoạt động']].map(([value, label]) => <button key={value} type="button" onClick={() => setTab(value as typeof tab)} className={tab === value ? 'border-b-2 border-brand-600 pb-3 font-semibold text-brand-700' : 'pb-3 text-neutral-500'}>{label}</button>)}</div></div></Card>
      {tab === 'posts' ? <div className="grid gap-5 md:grid-cols-[1.2fr_0.8fr]"><Card><CardContent className="space-y-4 p-5"><h2 className="text-base font-semibold">Giới thiệu</h2><p className="flex gap-2 text-sm text-neutral-600"><Quote className="h-4 w-4 shrink-0 text-brand-500" /> Sinh viên K18 chuyên ngành Kỹ thuật Phần mềm, đam mê Web Development, đại diện truyền thông F-Code Club.</p><p className="flex gap-2 text-sm text-neutral-600"><GraduationCap className="h-4 w-4 shrink-0 text-neutral-400" /> Đại học FPT Hà Nội · Kỹ thuật phần mềm (SE)</p><p className="flex gap-2 text-sm text-neutral-600"><BriefcaseBusiness className="h-4 w-4 shrink-0 text-neutral-400" /> Thực tập sinh Frontend tại FPT Software</p><p className="flex gap-2 text-sm text-neutral-600"><MapPin className="h-4 w-4 shrink-0 text-neutral-400" /> Hà Nội</p><div className="flex gap-4 border-t border-neutral-100 pt-3 text-xs text-brand-600"><span><LinkIcon className="mr-1 inline h-4 w-4" /> GitHub</span><span><LinkIcon className="mr-1 inline h-4 w-4" /> LinkedIn</span></div><p className="flex gap-2 text-xs text-neutral-400"><CalendarDays className="h-4 w-4" /> Đã tham gia tháng 01/2026</p></CardContent></Card><Card><CardContent className="space-y-3 p-5"><h2 className="text-base font-semibold">Kỹ năng nổi bật</h2><div className="flex flex-wrap gap-2">{['React', 'TypeScript', 'Node.js', 'TailwindCSS', 'Git'].map((skill) => <Chip key={skill}>{skill}</Chip>)}</div></CardContent></Card><Card className="md:col-span-2"><CardContent className="flex min-h-48 flex-col items-center justify-center text-center"><div className="mb-3 rounded-full bg-neutral-100 p-3 text-neutral-400"><MessageCircle className="h-6 w-6" /></div><h2 className="font-semibold text-neutral-800">Chưa có bài viết nào</h2><p className="mt-1 text-sm text-neutral-500">Nguyễn Văn An chưa có bài viết nào.</p></CardContent></Card></div> : <Card><CardContent className="p-6 text-sm text-neutral-600">{tab === 'about' ? 'Thông tin giới thiệu và năng lực của Mentor.' : 'Hoạt động gần đây của Mentor.'}</CardContent></Card>}
      <SendMentoringRequestDialog open={requestOpen} onOpenChange={setRequestOpen} mentorId={id && id.startsWith('usr_mentor') ? id : 'usr_mentor_02'} />
    </div>
  );
};
export default MentorDetailPage;
