import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { useAuthStore } from '@/store/authStore';
import { PageHeader } from '@/components/shared/PageHeader';
import { QueryBoundary } from '@/components/shared/QueryBoundary';
import { EmptyState } from '@/components/shared/EmptyState';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { SearchInput } from '@/components/shared/SearchInput';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import type { ProgramChannel } from '@/types/entities';

export default function AdminProgramsPage() {
  const [search, setSearch] = useState('');
  const user = useAuthStore(state => state.user);
  const isManager = user?.roles.includes('event_manager');
  const programsQuery = useQuery<ProgramChannel[]>({
    queryKey: ['admin', 'programs', 'public'],
    queryFn: () => apiClient.get('/programs'),
  });
  const programs = (programsQuery.data || []).filter(program => (program.title + ' ' + program.organizer.fullName).toLowerCase().includes(search.toLowerCase()));
  return <div className="space-y-6">
    <PageHeader title="Chương trình cộng đồng" description="Theo dõi chương trình công khai. Event Manager xét duyệt đề xuất và trực tiếp tổ chức chương trình."
      actions={isManager ? <div className="flex flex-wrap gap-2"><Link to="/programs/proposals/review"><Button>Xét duyệt đề xuất</Button></Link><Link to="/programs?tab=organizing"><Button variant="secondary">Chương trình tôi quản lý</Button></Link></div> : undefined} />
    <SearchInput placeholder="Tìm tên chương trình hoặc người tổ chức..." value={search} onChange={setSearch} />
    <QueryBoundary queries={[programsQuery]}>
      {!programs.length ? <EmptyState title="Chưa có chương trình phù hợp" /> : <div className="grid gap-4 md:grid-cols-2">
        {programs.map(program => <Card key={program.id} className="p-5 space-y-3">
          <div className="flex justify-between gap-3"><h2 className="text-card-title">{program.title}</h2><StatusBadge status={program.status} group="programChannel" /></div>
          <p className="text-sm text-neutral-500">{program.organizer.fullName} · {program.type === 'Volunteer' ? 'Tình nguyện' : 'Workshop'}</p>
          <p className="text-sm">{program.summary}</p>
          <Link to={'/programs/' + program.id} className="text-sm text-brand-600">Xem chương trình →</Link>
        </Card>)}
      </div>}
    </QueryBoundary>
  </div>;
}
