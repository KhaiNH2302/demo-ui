import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { PageHeader } from '@/components/shared/PageHeader';
import { QueryBoundary } from '@/components/shared/QueryBoundary';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { TagInput } from '@/components/shared/TagInput';
import { BookOpen, Tag, Plus, Upload, Building2, Pencil, Ban } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { toast } from '@/components/ui/Toast';
import { Pagination } from '@/components/ui/Pagination';
import type { CourseOffering } from '@/types/entities';

interface MasterSchool { id: string; code: string; name: string; campus: string; status: 'active' | 'inactive'; }

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
  const [addOpen, setAddOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<CourseOffering | null>(null);
  const [newCourse, setNewCourse] = useState({ courseCode: '', courseName: '', classCode: '', term: 'Fall 2026', lecturer: '' });
  const [schools, setSchools] = useState<MasterSchool[]>([
    { id: 'school_fpt_hn', code: 'FPT-HN', name: 'Đại học FPT Hà Nội', campus: 'Hòa Lạc', status: 'active' },
    { id: 'school_fpt_hcm', code: 'FPT-HCM', name: 'Đại học FPT TP. Hồ Chí Minh', campus: 'Quận 9', status: 'active' },
  ]);
  const [schoolOpen, setSchoolOpen] = useState(false);
  const [activeMasterTab, setActiveMasterTab] = useState('schools');
  const [schoolFilter, setSchoolFilter] = useState('');
  const [schoolSearch, setSchoolSearch] = useState('');
  const [courseSearch, setCourseSearch] = useState('');
  const [schoolPage, setSchoolPage] = useState(1);
  const [coursePage, setCoursePage] = useState(1);
  const pageSize = 5;
  const [editingSchool, setEditingSchool] = useState<MasterSchool | null>(null);
  const [subjectSchool, setSubjectSchool] = useState<MasterSchool | null>(null);
  const [schoolSubjects, setSchoolSubjects] = useState<Record<string, string[]>>({
    school_fpt_hn: ['SWP391', 'PRJ301', 'CSD201', 'DBI202', 'SWE201'],
    school_fpt_hcm: ['SWP391', 'DBI202'],
  });
  const [schoolForm, setSchoolForm] = useState({ code: '', name: '', campus: '' });
  const queryClient = useQueryClient();

  const coursesQuery = useQuery({
    queryKey: ['admin', 'master-data', 'courses'],
    queryFn: () => apiClient.get<CourseOffering[]>('/admin/master-data/course-offerings'),
  });
  const visibleCourses = (coursesQuery.data || []).filter((course) =>
    (!schoolFilter || course.school === schoolFilter) &&
    (!courseSearch || `${course.courseCode} ${course.courseName} ${course.school}`.toLowerCase().includes(courseSearch.toLowerCase()))
  );
  const visibleSchools = schools.filter((school) => `${school.code} ${school.name} ${school.campus}`.toLowerCase().includes(schoolSearch.toLowerCase()));
  const pagedCourses = visibleCourses.slice((coursePage - 1) * pageSize, coursePage * pageSize);
  const pagedSchools = visibleSchools.slice((schoolPage - 1) * pageSize, schoolPage * pageSize);
  const saveCoursesMutation = useMutation({
    mutationFn: (courses: CourseOffering[]) => apiClient.put('/admin/master-data/course-offerings', courses),
    onSuccess: () => {
      toast.success('Đã cập nhật dữ liệu môn/lớp học phần.');
      queryClient.invalidateQueries({ queryKey: ['admin', 'master-data', 'courses'] });
      setAddOpen(false);
      setNewCourse({ courseCode: '', courseName: '', classCode: '', term: 'Fall 2026', lecturer: '' });
    },
    onError: () => toast.error('Không thể cập nhật dữ liệu.'),
  });
  const saveTagsMutation = useMutation({
    mutationFn: () => apiClient.put('/admin/master-data/tags', { tags: activeTags }),
    onSuccess: () => toast.success('Đã lưu danh sách từ khóa.'),
    onError: () => toast.error('Không thể lưu danh sách từ khóa.'),
  });
  const handleImport = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const rows = String(reader.result).split(/\r?\n/).filter(Boolean);
      const imported = rows.slice(1).map((row, index) => {
        const [courseCode, courseName, classCode, term, lecturer] = row.split(',').map((v) => v.trim());
        return { id: `import_${Date.now()}_${index}`, courseCode, courseName, school: 'Đại học FPT Hà Nội', term, classCode, lecturer };
      }).filter((row) => row.courseCode && row.courseName && row.term);
      if (imported.length === 0) return toast.error('CSV không có dòng dữ liệu hợp lệ.');
      saveCoursesMutation.mutate([...(coursesQuery.data || []), ...imported]);
    };
    reader.readAsText(file);
  };

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

      <Tabs value={activeMasterTab} onValueChange={setActiveMasterTab} className="w-full">
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="schools" className="flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5" /> Trường/Cơ sở
          </TabsTrigger>
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
              <div className="flex items-center justify-between gap-3 p-4 border-b border-[var(--border-subtle)]">
                <div className="flex items-center gap-3 flex-1">
                  <input className="h-9 max-w-sm w-full rounded-md border border-neutral-300 px-3 text-sm" placeholder="Tìm mã môn, tên môn, trường..." value={courseSearch} onChange={(e) => { setCourseSearch(e.target.value); setCoursePage(1); }} />
                  <div className="text-sm text-[var(--text-muted)]">
                  {schoolFilter ? <span>Danh sách môn học: <strong>{schoolFilter}</strong> <button type="button" className="ml-2 text-brand-600 hover:underline" onClick={() => setSchoolFilter('')}>Xem tất cả</button></span> : 'CSV: courseCode, courseName, school'}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => { setEditingCourse(null); setAddOpen(true); }}><Plus className="w-4 h-4 mr-1" /> Thêm</Button>
                  <label className="inline-flex items-center justify-center rounded-md border border-neutral-300 px-3 py-2 text-xs font-semibold cursor-pointer hover:bg-neutral-50">
                    <Upload className="w-4 h-4 mr-1" /> Import CSV
                    <input type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => handleImport(e.target.files?.[0])} />
                  </label>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-[var(--surface-muted)] text-[var(--text-muted)] text-xs uppercase border-b border-[var(--border-subtle)]">
                    <tr>
                      <th className="px-6 py-3">Mã môn</th>
                      <th className="px-6 py-3">Tên môn học</th>
                      <th className="px-6 py-3">Tên trường</th>
                      <th className="px-6 py-3 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-subtle)]">
                    {pagedCourses.map((c) => (
                      <tr key={c.id} className="hover:bg-[var(--surface-muted)]/50">
                        <td className="px-6 py-4 font-bold font-mono text-primary">{c.subjectCode || c.courseCode}</td>
                        <td className="px-6 py-4 font-medium">{c.subjectName || c.courseName}</td>
                        <td className="px-6 py-4">{c.school || '—'}</td>
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          <Button variant="ghost" size="sm" onClick={() => { setEditingCourse(c); setNewCourse({ courseCode: c.courseCode || c.subjectCode || '', courseName: c.courseName || c.subjectName || '', classCode: c.classCode || '', term: c.term, lecturer: c.lecturer || '' }); setAddOpen(true); }}><Pencil className="w-4 h-4 mr-1" /> Sửa</Button>
                          <Button variant="ghost" size="sm" onClick={() => saveCoursesMutation.mutate((coursesQuery.data || []).filter((item) => item.id !== c.id))}><Ban className="w-4 h-4 mr-1" /> Xóa</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-4"><Pagination page={coursePage} pageSize={pageSize} total={visibleCourses.length} onChange={setCoursePage} /></div>
            </Card>
          </QueryBoundary>
        </TabsContent>

        {/* TAB 2: TAGS */}
        <TabsContent value="tags" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-base">Hệ thống từ khóa & Tag dùng chung</CardTitle>
                <Button size="sm" onClick={() => saveTagsMutation.mutate()} loading={saveTagsMutation.isPending}>Lưu thay đổi</Button>
              </div>
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

        <TabsContent value="schools" className="mt-6">
          <Card>
            <div className="flex items-center justify-between p-4 border-b border-[var(--border-subtle)]">
              <div>
                <h3 className="font-semibold">Danh sách trường và cơ sở</h3>
                <p className="text-xs text-[var(--text-muted)] mt-1">Dùng cho hồ sơ người dùng, môn học và bộ lọc toàn hệ thống.</p>
              </div>
              <Button size="sm" onClick={() => { setEditingSchool(null); setSchoolForm({ code: '', name: '', campus: '' }); setSchoolOpen(true); }}>
                <Plus className="w-4 h-4 mr-1" /> Thêm trường
              </Button>
            </div>
            <div className="px-4 pt-4"><input className="h-9 max-w-sm w-full rounded-md border border-neutral-300 px-3 text-sm" placeholder="Tìm mã trường, tên trường, cơ sở..." value={schoolSearch} onChange={(e) => { setSchoolSearch(e.target.value); setSchoolPage(1); }} /></div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-[var(--surface-muted)] text-xs uppercase text-[var(--text-muted)]"><tr><th className="px-6 py-3">Mã trường</th><th className="px-6 py-3">Tên trường</th><th className="px-6 py-3">Cơ sở</th><th className="px-6 py-3">Trạng thái</th><th className="px-6 py-3 text-right">Thao tác</th></tr></thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {pagedSchools.map((school) => <tr key={school.id}>
                    <td className="px-6 py-4 font-mono">{school.code}</td><td className="px-6 py-4 font-medium">{school.name}</td><td className="px-6 py-4">{school.campus}</td>
                    <td className="px-6 py-4"><span className={school.status === 'active' ? 'text-emerald-600' : 'text-neutral-400'}>{school.status === 'active' ? 'Đang hoạt động' : 'Đã vô hiệu hóa'}</span></td>
                    <td className="px-6 py-4 text-right whitespace-nowrap"><Button variant="ghost" size="sm" onClick={() => { setSchoolFilter(school.name); setActiveMasterTab('courses'); }}>Môn học</Button><Button variant="ghost" size="sm" onClick={() => { setEditingSchool(school); setSchoolForm({ code: school.code, name: school.name, campus: school.campus }); setSchoolOpen(true); }}><Pencil className="w-4 h-4 mr-1" /> Sửa</Button><Button variant="ghost" size="sm" onClick={() => setSchools((current) => current.map((item) => item.id === school.id ? { ...item, status: item.status === 'active' ? 'inactive' : 'active' } : item))}><Ban className="w-4 h-4 mr-1" /> {school.status === 'active' ? 'Vô hiệu hóa' : 'Kích hoạt'}</Button></td>
                  </tr>)}
                </tbody>
              </table>
            </div>
            <div className="p-4"><Pagination page={schoolPage} pageSize={pageSize} total={visibleSchools.length} onChange={setSchoolPage} /></div>
          </Card>
        </TabsContent>
      </Tabs>
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingCourse ? 'Chỉnh sửa môn/lớp học phần' : 'Thêm môn/lớp học phần'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input placeholder="Mã môn" value={newCourse.courseCode} onChange={(e) => setNewCourse({ ...newCourse, courseCode: e.target.value })} />
            <Input placeholder="Tên môn học" value={newCourse.courseName} onChange={(e) => setNewCourse({ ...newCourse, courseName: e.target.value })} />
            <Input placeholder="Mã lớp" value={newCourse.classCode} onChange={(e) => setNewCourse({ ...newCourse, classCode: e.target.value })} />
            <Input placeholder="Kỳ học" value={newCourse.term} onChange={(e) => setNewCourse({ ...newCourse, term: e.target.value })} />
            <Input className="sm:col-span-2" placeholder="Giảng viên" value={newCourse.lecturer} onChange={(e) => setNewCourse({ ...newCourse, lecturer: e.target.value })} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Hủy</Button>
            <Button disabled={!newCourse.courseCode || !newCourse.courseName || !newCourse.term} loading={saveCoursesMutation.isPending} onClick={() => saveCoursesMutation.mutate(editingCourse ? (coursesQuery.data || []).map((item) => item.id === editingCourse.id ? { ...item, ...newCourse } : item) : [...(coursesQuery.data || []), { id: `course_${Date.now()}`, ...newCourse, school: 'Đại học FPT Hà Nội' }])}>Lưu</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={schoolOpen} onOpenChange={setSchoolOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingSchool ? 'Chỉnh sửa trường/cơ sở' : 'Thêm trường/cơ sở'}</DialogTitle></DialogHeader>
          <div className="space-y-3"><Input placeholder="Mã trường" value={schoolForm.code} onChange={(e) => setSchoolForm({ ...schoolForm, code: e.target.value })} /><Input placeholder="Tên trường" value={schoolForm.name} onChange={(e) => setSchoolForm({ ...schoolForm, name: e.target.value })} /><Input placeholder="Tên cơ sở" value={schoolForm.campus} onChange={(e) => setSchoolForm({ ...schoolForm, campus: e.target.value })} /></div>
          <DialogFooter><Button variant="outline" onClick={() => setSchoolOpen(false)}>Hủy</Button><Button disabled={!schoolForm.code || !schoolForm.name || !schoolForm.campus} onClick={() => { setSchools((current) => editingSchool ? current.map((item) => item.id === editingSchool.id ? { ...item, ...schoolForm } : item) : [...current, { id: `school_${Date.now()}`, ...schoolForm, status: 'active' }]); setSchoolOpen(false); toast.success(editingSchool ? 'Đã cập nhật trường/cơ sở.' : 'Đã thêm trường/cơ sở.'); }}>Lưu</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={!!subjectSchool} onOpenChange={(open) => !open && setSubjectSchool(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Môn học tại {subjectSchool?.name}</DialogTitle></DialogHeader>
          <div className="max-h-80 overflow-y-auto space-y-1 rounded-lg border border-[var(--border-subtle)] p-2">
            {(coursesQuery.data || []).map((course) => {
              const code = course.subjectCode || course.courseCode;
              const selected = subjectSchool ? (schoolSubjects[subjectSchool.id] || []).includes(code) : false;
              return <label key={course.id} className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-[var(--surface-muted)] cursor-pointer"><input type="checkbox" checked={selected} onChange={(e) => subjectSchool && setSchoolSubjects((current) => ({ ...current, [subjectSchool.id]: e.target.checked ? [...(current[subjectSchool.id] || []), code] : (current[subjectSchool.id] || []).filter((item) => item !== code) }))} className="rounded border-neutral-300 text-brand-600" /><span><strong>{code}</strong><span className="ml-2 text-sm text-[var(--text-muted)]">{course.subjectName || course.courseName}</span></span></label>;
            })}
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setSubjectSchool(null)}>Hủy</Button><Button onClick={() => { setSubjectSchool(null); toast.success('Đã cập nhật danh sách môn học của trường.'); }}>Lưu danh sách môn</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MasterDataPage;
