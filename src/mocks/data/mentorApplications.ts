import type { MentorApplication } from '@/types/entities';

export const seedMentorApplications: MentorApplication[] = [
  {
    id: 'app_mentor_01',
    userId: 'usr_student_01',
    status: 'NeedsMoreInfo',
    personal: {
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      phone: '0987654321',
      currentRole: 'student',
      yearOrGraduation: 'Năm 3 (K17)',
      workplace: 'Đại học FPT TP.HCM',
      position: 'Sinh viên ngành SE',
    },
    education: {
      major: 'Kỹ thuật phần mềm (Software Engineering)',
      gpa: 3.65,
      gpaScale: 4,
      gpaPublic: true,
      strongSubjects: [
        { code: 'CSD201', grade: '9.2' },
        { code: 'PRJ301', grade: '9.5' },
        { code: 'SWP391', grade: '8.8' },
      ],
    },
    experiences: [
      {
        type: 'internship',
        title: 'Backend Software Engineering Intern',
        org: 'FPT Software HCM',
        role: 'Intern Developer',
        from: '2025-06',
        to: '2025-12',
        description: 'Phát triển RESTful APIs với Java Spring Boot & PostgreSQL, tối ưu query giảm 35% latency.',
      },
      {
        type: 'club',
        title: 'Trưởng ban Chuyên môn',
        org: 'CLB F-Code',
        role: 'Lead Mentor',
        from: '2024-09',
        description: 'Tổ chức các workshop ôn thi CSD201, PRJ301 cho hơn 150 sinh viên K18-K19.',
      },
    ],
    skills: [
      { name: 'Java / Spring Boot', level: 'expert' },
      { name: 'Data Structures & Algorithms', level: 'good' },
      { name: 'React / TypeScript', level: 'good' },
      { name: 'PostgreSQL', level: 'good' },
    ],
    achievements: [
      {
        name: 'Giải Nhì FPT Edu Hackathon 2025',
        issuer: 'Tập đoàn FPT',
        year: 2025,
        url: 'https://fpt.edu.vn/hackathon-2025',
      },
      {
        name: 'Chứng chỉ AWS Certified Developer Associate',
        issuer: 'Amazon Web Services',
        year: 2025,
      },
    ],
    focus: {
      areas: ['Lập trình Backend', 'Cấu trúc dữ liệu & Giải thuật', 'Định hướng thực tập FSOFT'],
      subjects: ['CSD201', 'PRJ301', 'SWP391'],
      targetAudience: ['Sinh viên năm 1-2 cần kèm môn học', 'Sinh viên chuẩn bị làm OJT / phỏng vấn'],
      maxMentees: 4,
    },
    about: {
      headline: 'Full-stack Developer @ F-Code | Chia sẻ lộ trình Java & OJT',
      bio: 'Mình từng đạt điểm A các môn lập trình nền tảng và có kinh nghiệm thực tập tại FSOFT. Sẵn sàng hỗ trợ các bạn vượt qua các môn code "nặng đô" và chuẩn bị CV phỏng vấn!',
      motivation: 'Mong muốn lan tỏa tinh thần học tập nhóm và giúp các bạn khóa dưới định hướng nghề nghiệp sớm.',
    },
    availability: {
      slots: [
        { day: 'Tue', start: '19:30', end: '21:30' },
        { day: 'Thu', start: '19:30', end: '21:30' },
        { day: 'Sat', start: '14:00', end: '17:00' },
      ],
      modes: ['online', 'offline', 'chat'],
      location: 'Thư viện cơ sở FPTU hoặc Discord',
      sessionMinutes: 45,
    },
    evidence: {
      cvUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      portfolioUrls: ['https://github.com/nguyenvana', 'https://nguyenvana.dev'],
      otherFiles: [{ name: 'Bang_Diem_Tam_Thoi.pdf', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' }],
    },
    agreed: true,
    reviewerId: 'usr_admin_05',
    reviewNote: 'Hồ sơ chuyên môn rất tốt. Vui lòng bổ sung link chứng chỉ AWS và cập nhật minh chứng bảng điểm chính thức.',
    flaggedSections: ['achievements', 'evidence'],
    history: [
      { status: 'Submitted', at: '2026-09-20T10:00:00Z', by: 'usr_student_01', note: 'Nộp hồ sơ lần đầu' },
      { status: 'UnderReview', at: '2026-09-21T08:30:00Z', by: 'usr_admin_05', note: 'Admin tiếp nhận hồ sơ' },
      { status: 'NeedsMoreInfo', at: '2026-09-22T14:15:00Z', by: 'usr_admin_05', note: 'Yêu cầu bổ sung link chứng chỉ và bảng điểm' },
    ],
    createdAt: '2026-09-20T10:00:00Z',
    submittedAt: '2026-09-20T10:00:00Z',
  },
  {
    id: 'app_mentor_02',
    userId: 'usr_student_06',
    status: 'Submitted',
    personal: {
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      phone: '0912345678',
      currentRole: 'student',
      yearOrGraduation: 'Năm 4 (K16)',
      workplace: 'Đại học FPT',
      position: 'Sinh viên ngành AI',
    },
    education: {
      major: 'Trí tuệ nhân tạo (Artificial Intelligence)',
      gpa: 3.82,
      gpaScale: 4,
      gpaPublic: true,
      strongSubjects: [
        { code: 'MAS291', grade: '9.8' },
        { code: 'AIL302', grade: '9.0' },
      ],
    },
    experiences: [
      {
        type: 'project',
        title: 'Nghiên cứu mô hình LLM tiếng Việt',
        org: 'FPT AI Lab',
        role: 'Research Assistant',
        from: '2025-01',
        description: 'Huấn luyện fine-tune Llama 3 phục vụ hỗ trợ giải đáp văn bản học vụ.',
      },
    ],
    skills: [
      { name: 'Python / PyTorch', level: 'expert' },
      { name: 'Machine Learning', level: 'expert' },
      { name: 'Toán học & Xác suất thống kê', level: 'expert' },
    ],
    achievements: [
      {
        name: 'Đồng tác giả 1 bài báo hội nghị quốc tế IEEE-RIVF 2025',
        issuer: 'IEEE Vietnam',
        year: 2025,
      },
    ],
    focus: {
      areas: ['Trí tuệ nhân tạo & Machine Learning', 'Xác suất thống kê MAS291', 'Định hướng Nghiên cứu khoa học'],
      subjects: ['MAS291', 'AIL302'],
      targetAudience: ['Sinh viên yêu thích AI/Data', 'Sinh viên muốn tham gia NCKH'],
      maxMentees: 3,
    },
    about: {
      headline: 'AI Researcher | Học bổng 100% FPTU | Hỗ trợ môn Toán & AI',
      bio: 'Mình đam mê nghiên cứu Machine Learning và muốn giúp các bạn tiếp cận môn Toán/AI một cách trực quan, dễ hiểu nhất.',
      motivation: 'Giúp sinh viên không còn sợ các môn Toán và xây dựng nền tảng vững chắc cho ngành AI.',
    },
    availability: {
      slots: [
        { day: 'Wed', start: '18:00', end: '20:00' },
        { day: 'Sun', start: '09:00', end: '11:00' },
      ],
      modes: ['online', 'chat'],
      sessionMinutes: 60,
    },
    evidence: {
      cvUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      portfolioUrls: ['https://scholar.google.com/citations?user=xyz'],
      otherFiles: [],
    },
    agreed: true,
    history: [
      { status: 'Submitted', at: '2026-09-24T16:00:00Z', by: 'usr_student_06', note: 'Đã nộp hồ sơ' },
    ],
    createdAt: '2026-09-24T16:00:00Z',
    submittedAt: '2026-09-24T16:00:00Z',
  },
  {
    id: 'app_mentor_03',
    userId: 'usr_mentor_02',
    status: 'Approved',
    personal: {
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      phone: '0909888999',
      currentRole: 'alumni',
      yearOrGraduation: 'Cựu sinh viên K14',
      workplace: 'Shopee Vietnam',
      position: 'Senior Frontend Engineer',
    },
    education: {
      major: 'Kỹ thuật phần mềm',
      gpa: 3.7,
      gpaScale: 4,
      gpaPublic: true,
      strongSubjects: [
        { code: 'PRJ301', grade: '9.0' },
        { code: 'SWP391', grade: '9.5' },
      ],
    },
    experiences: [
      {
        type: 'job',
        title: 'Senior Frontend Engineer',
        org: 'Shopee Vietnam',
        role: 'Frontend Lead',
        from: '2023-01',
        description: 'Phát triển kiến trúc Micro-frontends phục vụ hàng triệu người dùng.',
      },
    ],
    skills: [
      { name: 'React / Next.js', level: 'expert' },
      { name: 'TypeScript', level: 'expert' },
      { name: 'Frontend Architecture', level: 'expert' },
    ],
    achievements: [
      {
        name: 'Top 10 Sinh viên tiêu biểu tốt nghiệp 2022',
        issuer: 'Đại học FPT',
        year: 2022,
      },
    ],
    focus: {
      areas: ['Frontend Engineering', 'Career Coaching', 'Review CV & Mock Interview'],
      subjects: ['PRJ301', 'SWP391'],
      targetAudience: ['Sinh viên chuẩn bị tốt nghiệp', 'Sinh viên tìm việc Frontend'],
      maxMentees: 5,
    },
    about: {
      headline: 'Senior Frontend Engineer @ Shopee | Cựu SV K14 FPTU',
      bio: 'Sẵn sàng chia sẻ kinh nghiệm thực tế về Frontend, tối ưu hiệu năng web và cách chuẩn bị phỏng vấn vào các tập đoàn công nghệ lớn.',
      motivation: 'Đóng góp lại cho cộng đồng sinh viên FPTU.',
    },
    availability: {
      slots: [
        { day: 'Sat', start: '09:00', end: '11:00' },
        { day: 'Sun', start: '14:00', end: '16:00' },
      ],
      modes: ['online', 'chat'],
      sessionMinutes: 45,
    },
    evidence: {
      cvUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      portfolioUrls: ['https://linkedin.com/in/mentor02'],
      otherFiles: [],
    },
    agreed: true,
    history: [
      { status: 'Submitted', at: '2026-08-01T00:00:00Z', by: 'usr_mentor_02' },
      { status: 'Approved', at: '2026-08-03T10:00:00Z', by: 'usr_admin_05', note: 'Hồ sơ xuất sắc, đã phê duyệt quyền Mentor' },
    ],
    createdAt: '2026-08-01T00:00:00Z',
    submittedAt: '2026-08-01T00:00:00Z',
    decidedAt: '2026-08-03T10:00:00Z',
  },
];
