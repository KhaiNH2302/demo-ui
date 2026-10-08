import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { PageHeader } from '@/components/shared/PageHeader';
import { QueryBoundary } from '@/components/shared/QueryBoundary';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { TagInput } from '@/components/shared/TagInput';
import { BookOpen, Tag } from 'lucide-react';
import type { CourseOffering } from '@/types/entities';

export const MasterDataPage: React.FC = () => {
  const [activeTags, setActiveTags] = useState<string[]>([
    'SWP391',
    'PRN231',
    'EXE101',
    'React',
    'Node.js',
    'Spring Boot',
    'Machine Learning',
    'IELTS 7.0',
    'UI/UX Design',
  ]);

  const coursesQuery = useQuery({
    queryKey: ['admin', 'master-data', 'courses'],
    queryFn: () => apiClient.get<CourseOffering[]>('/admin/master-data/course-offerings'),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dữ liệu danh mục chung (Master Data)"
        description="Quản lý danh sách môn học, lớp học phần, từ khóa tag và danh mục phân loại dùng chung"
        breadcrumbs={[
          { label: 'Admin Portal', href: '/admin' },
          { label: 'Dữ liệu danh mục' },
        ]}
      />

      <Tabs defaultValue="courses" className="w-full">
        <TabsList className="grid grid-cols-2 w-full max-w-xs">
          <TabsTrigger value="courses" className="flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5" /> Môn & Lớp học
          </TabsTrigger>
          <TabsTrigger value="tags" className="flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5" /> Từ khóa (Tags)
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: COURSE OFFERINGS */}
        <TabsContent value="courses" className="mt-6">
          <QueryBoundary queries={[coursesQuery]}>
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-[var(--surface-muted)] text-[var(--text-muted)] text-xs uppercase border-b border-[var(--border-subtle)]">
                    <tr>
                      <th className="px-6 py-3">Mã môn</th>
                      <th className="px-6 py-3">Tên môn học</th>
                      <th className="px-6 py-3">Mã lớp (Class Code)</th>
                      <th className="px-6 py-3">Kỳ học</th>
                      <th className="px-6 py-3">Giảng viên</th>
                      <th className="px-6 py-3">Lịch học</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-subtle)]">
                    {coursesQuery.data?.map((c) => (
                      <tr key={c.id} className="hover:bg-[var(--surface-muted)]/50">
                        <td className="px-6 py-4 font-bold font-mono text-primary">{c.subjectCode || c.courseCode}</td>
                        <td className="px-6 py-4 font-medium">{c.subjectName || c.courseName}</td>
                        <td className="px-6 py-4 font-mono">{c.classCode || '—'}</td>
                        <td className="px-6 py-4">{c.term}</td>
                        <td className="px-6 py-4">{c.lecturer || 'Giảng viên khoa'}</td>
                        <td className="px-6 py-4 text-xs font-mono text-[var(--text-muted)]">
                          {c.schedule
                            ? Array.isArray(c.schedule)
                              ? c.schedule.map((s) => (typeof s === 'string' ? s : `${s.day} ${s.start}-${s.end}`)).join(', ')
                              : String(c.schedule)
                            : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </QueryBoundary>
        </TabsContent>

        {/* TAB 2: TAGS */}
        <TabsContent value="tags" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Hệ thống từ khóa & Tag dùng chung</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-[var(--text-muted)]">
                Các từ khóa này được gợi ý tự động khi người dùng tìm nhóm, đăng bài chia sẻ tài liệu hoặc tạo hồ sơ Mentor.
              </p>
              <TagInput
                tags={activeTags}
                onChange={setActiveTags}
                placeholder="Thêm từ khóa phân loại mới..."
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MasterDataPage;
