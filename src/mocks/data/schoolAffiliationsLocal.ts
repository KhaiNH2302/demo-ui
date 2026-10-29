import type { SchoolAffiliationRequest } from '@/types/schoolAffiliation';

export const seedSchoolAffiliations: SchoolAffiliationRequest[] = [
  {
    id: 'aff_01', studentId: 'usr_student_01', studentName: 'Nguyễn Văn An',
    school: 'Đại học FPT Hà Nội', schoolEmail: 'an.nv@fpt.edu.vn',
    studentCode: 'HE180001', evidenceName: 'the_sinh_vien_an.pdf',
    evidenceNote: 'Thẻ sinh viên học kỳ Fall 2026', status: 'Pending',
    submittedAt: '2026-10-21T08:30:00Z',
  },
  {
    id: 'aff_02', studentId: 'usr_student_07', studentName: 'Hoàng Trọng Nghĩa',
    school: 'Đại học FPT Hà Nội', schoolEmail: 'nghia.ht@fpt.edu.vn',
    studentCode: 'HE180007', evidenceName: 'giay_xac_nhan_nghia.pdf',
    evidenceNote: 'Giấy xác nhận đang học', status: 'NeedsMoreInfo',
    submittedAt: '2026-10-19T09:00:00Z', reviewedAt: '2026-10-20T10:00:00Z',
    reviewerId: 'usr_schooladmin_10', reason: 'Vui lòng bổ sung trang có dấu xác nhận của trường.',
  },
  {
    id: 'aff_03', studentId: 'usr_mentor_01', studentName: 'Phạm Hoàng Long',
    school: 'Đại học FPT Hà Nội', schoolEmail: 'long.ph@fpt.edu.vn',
    studentCode: 'HE160010', evidenceName: 'the_sinh_vien_long.pdf',
    evidenceNote: 'Thẻ sinh viên', status: 'Verified',
    submittedAt: '2026-10-15T09:00:00Z', reviewedAt: '2026-10-16T14:00:00Z',
    reviewerId: 'usr_schooladmin_10',
  },
];
