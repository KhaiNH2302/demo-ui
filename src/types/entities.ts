import type {
  Role,
  UserAccountStatus,
  SwapRequestStatus,
  SwapConnectionStatus,
  PostType,
  PostCategory,
  PostStatus,
  JoinMode,
  JoinRequestStatus,
  ClubApprovalStatus,
  RecruitmentStatus,
  ApplicationStatus,
  MembershipRole,
  MembershipStatus,
  EventStatus,
  TaskStatus,
  TxType,
  ExpenseStatus,
  MentorApplicationStatus,
  MentoringRequestStatus,
  SupportMode,
  NotificationSource,
  FontSizeScale,
  ClubStatus,
  RepresentativeRequestStatus,
  OpportunityType,
  OpportunityStatus,
  OpportunityResponseStatus,
  ConnectionInviteStatus,
  ProgramType,
  ProgramChannelStatus,
  ProgramRegistrationStatus,
  CoOrganizerStatus,
  FollowStatus,
  ProfileVisibility,
  ReportStatus,
  ReportTargetType,
} from "./status";

export type {
  Role,
  UserAccountStatus,
  SwapRequestStatus,
  SwapConnectionStatus,
  PostType,
  PostCategory,
  PostStatus,
  JoinMode,
  JoinRequestStatus,
  ClubApprovalStatus,
  RecruitmentStatus,
  ApplicationStatus,
  MembershipRole,
  MembershipStatus,
  EventStatus,
  TaskStatus,
  TxType,
  ExpenseStatus,
  MentorApplicationStatus,
  MentoringRequestStatus,
  SupportMode,
  NotificationSource,
  FontSizeScale,
  ClubStatus,
  RepresentativeRequestStatus,
  OpportunityType,
  OpportunityStatus,
  OpportunityResponseStatus,
  ConnectionInviteStatus,
  ProgramType,
  ProgramChannelStatus,
  ProgramRegistrationStatus,
  CoOrganizerStatus,
  FollowStatus,
  ProfileVisibility,
  ReportStatus,
  ReportTargetType,
};

export type ClubRole =
  "lead" | "vice" | "treasurer" | "manager" | "member" | MembershipRole;
export type ClubCategory =
  "Academic" | "Art" | "Sports" | "Volunteer" | "Tech" | "Media";

export interface ScheduleSlot {
  day: "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";
  start: string; // "HH:mm"
  end: string; // "HH:mm"
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  avatarUrl?: string;
  coverUrl?: string;
  school: string;
  major?: string;
  cohort?: string;
  campus?: string;
  studentCode?: string;
  bio?: string;
  skills?: string[];
  roles: Role[];
  /** Các khu vực Admin Portal mà Manager được phép xem. Admin duy nhất mặc định toàn quyền. */
  adminPermissions?: string[];
  /** Trường đại học duy nhất mà School Admin được phép xác minh. */
  assignedSchool?: string;
  status: UserAccountStatus;
  accountStatus?: UserAccountStatus;
  isMentorAvailable?: boolean;
  createdAt: string;
}

export type Audience = "public" | "followers" | "only_me";

export type ProfileFieldKey =
  | "intro"
  | "about"
  | "gender"
  | "birthday"
  | "otherNames"
  | "favoriteQuote"
  | "languages"
  | "hobbies"
  | "currentCity"
  | "hometown"
  | "education"
  | "work"
  | "contact"
  | "links"
  | "lifeEvents"
  | "skills"
  | "interests"
  | "goals"
  | "availability";

export interface EducationEntry {
  id: string;
  type: "university" | "highschool" | "other";
  schoolName: string;
  campus?: string;
  major?: string;
  cohort?: string;
  studentCode?: string;
  fromYear?: number;
  toYear?: number;
  isCurrent: boolean;
  audience: Audience;
}

export interface WorkEntry {
  id: string;
  company: string;
  position: string;
  city?: string;
  from?: string;
  to?: string;
  isCurrent: boolean;
  description?: string;
  audience: Audience;
}

export interface LifeEvent {
  id: string;
  kind: "scholarship" | "internship" | "award" | "graduation" | "other";
  title: string;
  date: string;
  description?: string;
  audience: Audience;
}

export interface ProfileLink {
  id: string;
  type: "github" | "linkedin" | "facebook" | "portfolio" | "website" | "other";
  url: string;
  label?: string;
}

export interface StudentProfile {
  userId: string;
  intro?: string; // tiểu sử ngắn ≤ 101 ký tự (hiện dưới tên)
  about?: string; // giới thiệu dài ≤ 1000 ký tự (thay cho bio)
  bio?: string; // backwards compatibility
  coverUrl?: string;
  gender?: "male" | "female" | "other" | "undisclosed";
  birthday?: string; // YYYY-MM-DD
  birthdayAudience?: Audience; // quyền cho ngày/tháng sinh
  birthYearAudience?: Audience; // quyền cho năm sinh
  otherNames?: string[];
  favoriteQuote?: string;
  languages?: string[];
  hobbies?: string[];
  currentCity?: string;
  hometown?: string;
  education?: EducationEntry[];
  work?: WorkEntry[];
  contact?: { phone?: string; secondaryEmail?: string };
  links?: ProfileLink[];
  lifeEvents?: LifeEvent[];
  // Backwards compatibility
  major?: string;
  cohort?: string;
  studentCode?: string;
  socialLinks?: {
    github?: string;
    linkedin?: string;
    portfolio?: string;
  };
  // Dữ liệu cho AI matching
  skills: string[];
  interests: string[];
  goals: string[];
  availability: ScheduleSlot[];
  privacy: {
    swapMatching: boolean;
    groupMatching: boolean;
    mentoringMatching: boolean;
    showEmail?: boolean;
    showSchedule?: boolean;
    showClubs?: boolean;
    allowMentorRequests?: boolean;
    whoCanMessage?: "everyone" | "connections" | "nobody";
    profileVisibility?: ProfileVisibility;
  };
  fieldAudience?: Partial<Record<ProfileFieldKey, Audience>>;
  introCardFields?: ProfileFieldKey[]; // trường hiện ở thẻ Giới thiệu (tab Bài viết)
  onboarding?: { completedSteps: number[]; completedAt?: string };
  stats?: {
    postsCount: number;
    helpfulAnswersCount: number;
    mentoringSessionsCount: number;
    clubsCount: number;
    followersCount: number;
    followingCount: number;
  };
}

export interface Follow {
  id: string;
  followerId: string;
  followerName: string;
  followerAvatar?: string;
  followerMeta: string;
  followeeId: string;
  followeeName: string;
  followeeAvatar?: string;
  followeeMeta: string;
  status: FollowStatus;
  createdAt: string;
  respondedAt?: string;
}

export interface CourseOffering {
  id: string;
  courseCode: string;
  courseName: string;
  school: string;
  term: string;
  subjectCode?: string;
  subjectName?: string;
  classCode?: string;
  lecturer?: string;
  schedule?: ScheduleSlot[];
}

// FE-01 Swap
export interface SwapRequest {
  id: string;
  studentId: string;
  offeringId: string;
  currentClassCode: string;
  targetClassCode: string;
  schedule?: ScheduleSlot[];
  note?: string;
  status: SwapRequestStatus;
  version: number;
  locked?: boolean;
  pendingConnectionCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface SwapConnection {
  id: string;
  requestAId: string;
  requestBId: string;
  initiatorId: string;
  recipientId: string;
  status: SwapConnectionStatus;
  message?: string;
  cancelReason?: string;
  createdAt: string;
  respondedAt?: string;
}

export interface AiSwapMatch {
  requestId: string;
  score: number;
  reasons: string[];
}

export interface MediaImageItem {
  id: string;
  url: string;
  thumbnailUrl?: string;
  caption?: string;
  alt?: string;
  width?: number;
  height?: number;
}

export interface FoodReview {
  placeName: string;
  dish?: string;
  spentPerPerson: number;
  rating: number;
  visitedOn?: string;
  isDemo?: boolean;
}

export interface HousingExperience {
  monthlyCost?: number;
  duration?: string;
  highlights?: string;
  considerations?: string;
}

// FE-02 Student Life (community posts)
export interface KnowledgePost {
  id: string;
  authorId: string;
  authorName?: string;
  category?: PostCategory;
  type: PostType;
  title?: string;
  contentMd: string;
  content?: string;
  subject?: string;
  subjectCode?: string;
  demoContent?: { note?: string; sources?: { label: string; url: string }[] };
  foodReview?: FoodReview;
  housingExperience?: HousingExperience;
  lifeTopic?: string;
  campus?: string;
  location?: string;
  tags: string[];
  images?: string[];
  gallery?: MediaImageItem[];
  attachments: { name: string; url: string; size: number }[];
  visibility: "school" | "cross_school";
  status: PostStatus;
  rejectReason?: string;
  likesCount?: number;
  upvotes?: number;
  likedByMe?: boolean;
  savedByMe?: boolean;
  isSolved?: boolean;
  acceptedCommentId?: string;
  commentCount: number;
  reportCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  parentId?: string;
  likesCount?: number;
  likedByMe?: boolean;
  isAcceptedAnswer?: boolean;
  createdAt: string;
}

export interface ViolationReport {
  id: string;
  postId?: string;
  postTitle?: string;
  commentId?: string;
  targetType?: ReportTargetType;
  targetId?: string;
  targetTitle?: string;
  targetAuthorName?: string;
  reporterId: string;
  reporterName?: string;
  reason: string;
  details?: string;
  description?: string;
  note?: string;
  contentSnapshot?: string;
  status: ReportStatus;
  reportCount?: number;
  autoHidden?: boolean;
  resolution?: "Dismissed" | "ContentRemoved" | "UserRestricted";
  resolutionNote?: string;
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

// FE-03 Group
export type GroupCategory = 'project' | 'study' | 'entertainment';

export interface Group {
  id: string;
  ownerId: string;
  name: string;
  purpose: string;
  topic: string;
  skills: string[];
  activityTime: ScheduleSlot[];
  interests: string;
  joinMode: JoinMode;
  memberCount: number;
  memberLimit: number;
  createdAt: string;
  category?: GroupCategory;
  targetGoal?: string;
  rolesNeeded?: string[];
  rolesFilled?: string[];
  campus?: string;
  location?: string;
  pendingRequestsCount?: number;
}

export interface GroupMember {
  groupId: string;
  userId: string;
  role: "owner" | "member";
  joinedAt: string;
}

export interface GroupJoinRequest {
  id: string;
  groupId: string;
  userId: string;
  message?: string;
  appliedRole?: string;
  status: JoinRequestStatus;
  createdAt: string;
  groupName?: string;
  groupTopic?: string;
  category?: GroupCategory;
}

export interface AiGroupMatch {
  groupId: string;
  score: number;
  reasons: string[];
}

export interface AiMemberSuggestion {
  userId: string;
  score: number;
  reasons: string[];
}

// ============================================================================
// FE-04 Club Connection (29/09/2026 Plan)
// ============================================================================

export interface ClubRepresentative {
  userId: string;
  fullName: string;
  studentCode: string;
  avatarUrl?: string;
  roleNote: string; // VD: "Chủ nhiệm", "Đại diện truyền thông"
  verifiedAt: string;
}

export interface Club {
  id: string;
  code?: string;
  name: string;
  category?: ClubCategory;
  field: string;
  tagline?: string;
  description: string;
  logoUrl?: string;
  coverUrl?: string;
  coverImageUrl?: string | null;
  gallery?: MediaImageItem[];
  foundedYear?: number;
  contactEmail?: string;
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    website?: string;
  };
  representatives?: ClubRepresentative[];
  openOpportunitiesCount?: number;
  status?: ClubStatus;
  // Legacy compatibility fields
  managerId?: string;
  approvalStatus?: ClubApprovalStatus;
  createdAt: string;
}

export interface ClubRepresentativeRequest {
  id: string;
  userId: string;
  userName: string;
  studentCode: string;
  userEmail?: string;
  clubId?: string;
  proposedClub?: {
    name: string;
    code: string;
    category: ClubCategory;
    tagline: string;
    description: string;
    contactEmail?: string;
  };
  clubName: string;
  roleNote: string;
  evidenceNote: string;
  proofNote?: string;
  evidenceFileName?: string;
  evidenceUrl?: string;
  status: RepresentativeRequestStatus;
  rejectionReason?: string;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface FormQuestion {
  id: string;
  label: string;
  kind: "short" | "long" | "single" | "multi";
  options?: string[];
  required: boolean;
}

export interface OpportunityPosition {
  id: string;
  name: string;
  quota: number;
  registeredCount: number;
  description: string;
}

export interface ClubOpportunity {
  id: string;
  clubId: string;
  clubName: string;
  clubCode?: string;
  clubLogo?: string;
  clubCategory?: ClubCategory;
  createdById: string;
  createdByName: string;
  type: OpportunityType;
  title: string;
  summary: string;
  description: string;
  coverUrl?: string;
  coverImageUrl?: string | null;
  gallery?: MediaImageItem[];
  tags: string[];
  startAt?: string;
  endAt?: string;
  mode?: "Online" | "Offline" | "Hybrid";
  locationOrLink?: string;
  confirmMode?: "Instant" | "Approval";
  expectedCommitment?: string;
  positions?: OpportunityPosition[];
  quota: number;
  used: number;
  submittedCount?: number;
  registrationDeadline: string;
  resultDeadline?: string;
  questions: FormQuestion[];
  status: OpportunityStatus;
  hasResponses: boolean;
  cancelReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OpportunityResponse {
  id: string;
  opportunityId: string;
  opportunityTitle: string;
  opportunityType: OpportunityType;
  clubId: string;
  clubName: string;
  clubLogo?: string;
  studentId: string;
  profileSnapshot: {
    fullName: string;
    studentCode: string;
    email: string;
    major: string;
    cohort: string;
    avatarUrl?: string;
  };
  positionId?: string;
  positionName?: string;
  answers: {
    questionId: string;
    questionLabel: string;
    value: string | string[];
  }[];
  note?: string;
  attachment?: { name: string; size: string; url: string };
  status: OpportunityResponseStatus;
  feedbackNote?: string;
  visibleToCoParticipants: boolean;
  conversationId?: string;
  submittedAt?: string;
  updatedAt: string;
  history: {
    status: OpportunityResponseStatus;
    at: string;
    note?: string;
    actorName?: string;
  }[];
}

export interface ConnectionInvite {
  id: string;
  fromUserId: string;
  fromUserName: string;
  fromUserAvatar?: string;
  fromUserMeta: string;
  toUserId: string;
  toUserName: string;
  toUserAvatar?: string;
  toUserMeta?: string;
  sourceType: "opportunity" | "program";
  sourceId: string;
  sourceTitle: string;
  message: string;
  status: ConnectionInviteStatus;
  conversationId?: string;
  createdAt: string;
}

// Legacy FE-04 types kept only so non-deleted files compile cleanly
export interface RecruitmentQuestion {
  id: string;
  label: string;
  required: boolean;
}
export interface Recruitment {
  id: string;
  clubId: string;
  title: string;
  criteria: string;
  questions: RecruitmentQuestion[];
  deadline: string;
  quota: number;
  acceptedCount: number;
  status: RecruitmentStatus;
}
export interface Interview {
  scheduledAt: string;
  mode: "online" | "offline";
  type?: "online" | "offline";
  location: string;
  locationOrLink?: string;
  result?: "pass" | "fail";
  note?: string;
}
export interface ClubApplication {
  id: string;
  recruitmentId: string;
  clubId: string;
  applicantId: string;
  answers: Record<string, string>;
  status: ApplicationStatus;
  supplementNote?: string;
  interview?: Interview;
  createdAt: string;
}
export interface ClubMembership {
  clubId: string;
  userId: string;
  role: MembershipRole;
  status: MembershipStatus;
  contributionScore: number;
  joinedAt: string;
}
export interface ClubEvent {
  id: string;
  clubId: string;
  title: string;
  description: string;
  startAt: string;
  endAt: string;
  location: string;
  capacity: number;
  status: EventStatus;
}
export interface EventRegistration {
  eventId: string;
  userId: string;
  checkedIn: boolean;
  registeredAt: string;
}
export interface EventTask {
  id: string;
  eventId: string;
  assigneeId: string;
  title: string;
  status: TaskStatus;
  note?: string;
}
export interface Transaction {
  id: string;
  clubId: string;
  type: TxType;
  amount: number;
  description: string;
  proofUrl?: string;
  recordedBy: string;
  createdAt: string;
}
export interface ExpenseRequest {
  id: string;
  clubId: string;
  amount: number;
  purpose: string;
  proofUrl?: string;
  requestedBy: string;
  status: ExpenseStatus;
  approverNote?: string;
  createdAt: string;
}
export interface Reconciliation {
  id: string;
  clubId: string;
  periodFrom: string;
  periodTo: string;
  period?: string;
  openingBalance: number;
  closingBalance: number;
  endingBalance?: number;
  totalIncome?: number;
  totalExpense?: number;
  note: string;
  notes?: string;
  createdAt: string;
}

// ============================================================================
// FE-06 — Community Program Registration (Tình nguyện & Workshop — 29/09/2026)
// ============================================================================

export interface ProgramSlot {
  unlimited?: boolean;
  attendanceMode?: 'Online' | 'Offline';
  id: string;
  name: string;
  timeRange: string;
  quota: number;
  confirmedCount: number;
  description?: string;
}

export interface ProgramChannel {
  onlineUnlimited?: boolean;
  clubId?: string;
  onlineLink?: string;
  sourceType?: 'ManagerCreated' | 'StudentProposal';
  proposalId?: string;
  id: string;
  type: ProgramType;
  title: string;
  summary: string;
  description: string;
  coverUrl?: string;
  coverImageUrl?: string | null;
  gallery?: MediaImageItem[];
  tags: string[];
  organizer: {
    userId: string;
    fullName: string;
    studentCode: string;
    major: string;
    cohort: string;
    avatarUrl?: string;
    roleNote: string;
  };
  coOrganizers: {
    userId: string;
    fullName: string;
    studentCode: string;
    avatarUrl?: string;
    status: CoOrganizerStatus;
  }[];
  startAt: string;
  endAt: string;
  mode: "Online" | "Offline" | "Hybrid";
  locationOrLink: string;
  gatheringPoint?: string;
  beneficiaryAndGoal?: string;
  slots?: ProgramSlot[];
  preparationNotes?: string;
  safetyNotes?: string;
  speakerInfo?: {
    name: string;
    bio: string;
    topics: string[];
  };
  targetAudience?: string;
  prerequisites?: string;
  confirmMode: "Instant" | "Approval";
  quota: number;
  confirmedCount: number;
  submittedCount?: number;
  registrationDeadline: string;
  questions: FormQuestion[];
  status: ProgramChannelStatus;
  rejectionReason?: string;
  cancelReason?: string;
  hasRegistrations: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProgramRegistration {
  id: string;
  programId: string;
  programTitle: string;
  programType: ProgramType;
  programStartAt: string;
  programMode?: "Online" | "Offline" | "Hybrid";
  programLocationOrLink?: string;
  organizerName?: string;
  studentId: string;
  profileSnapshot: {
    fullName: string;
    studentCode: string;
    email: string;
    major: string;
    cohort: string;
    avatarUrl?: string;
  };
  slotId?: string;
  slotName?: string;
  answers: {
    questionId: string;
    questionLabel: string;
    value: string | string[];
  }[];
  note?: string;
  acknowledgedTerms: boolean;
  visibleToCoParticipants: boolean;
  status: ProgramRegistrationStatus;
  feedbackNote?: string;
  conversationId?: string;
  submittedAt: string;
  updatedAt: string;
}

export interface ProgramAnnouncement {
  id: string;
  programId: string;
  authorId: string;
  authorName: string;
  title: string;
  body: string;
  createdAt: string;
  recipientCount: number;
}

/** Student proposes an idea; approval transfers organization to an Manager. */
export interface ProgramProposal {
  onlineUnlimited?: boolean;
  offlineQuota?: number;
  onlineQuota?: number;
  clubId?: string;
  id: string;
  studentId: string;
  studentName: string;
  type: 'Event' | 'Volunteer' | 'Workshop';
  title: string;
  description: string;
  goal: string;
  targetAudience: string;
  expectedParticipants: number;
  suggestedStartAt: string;
  location: string;
  safetyNotes: string;
  mode?: "Offline" | "Online" | "Hybrid";
  contactInfo?: string;
  acknowledgedTerms?: boolean;
  status: import("./status").ProgramProposalStatus;
  reviewReason?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  programId?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// FE-05 Mentoring
// ============================================================================

export interface Mentor {
  userId: string;
  fields: string[];
  subjects: string[];
  experience: string;
  availability: ScheduleSlot[];
  supportModes: SupportMode[];
  acceptingRequests: boolean;
  menteesCount?: number;
  pricing?: MentorPricing;
  rating?: number;
  reviewCount?: number;
  sessionsCompleted?: number;
}

// Gói học Mentor tự đặt: số buổi + học phí trọn gói (0 = miễn phí)
export interface MentorPackage {
  id: string;
  name: string;
  sessions: number;
  price: number;
}

// Học phí hiển thị cho học viên; SCS không thu hộ, học viên trả trực tiếp cho Mentor
export interface MentorPricing {
  pricePerSession: number;
  minutesPerSession: number;
  trial: { enabled: boolean; price: number; minutes: number };
  packages: MentorPackage[];
}

export type MentoringPlanType = 'TRIAL' | 'SINGLE' | 'PACKAGE';

// Đánh giá học viên để lại sau buổi học với Mentor
export interface MentorReview {
  id: string;
  mentorId: string;
  authorName: string;
  authorAvatarUrl?: string;
  authorMajor?: string;
  rating: number;
  topic: string;
  comment: string;
  // Yêu cầu "Đã kết nối" làm căn cứ để được đánh giá; mỗi yêu cầu chỉ đánh giá một lần
  requestId?: string;
  tags?: string[];
  reply?: { content: string; createdAt: string };
  createdAt: string;
}

export interface MentorProfileSection {
  id: string;
  kind: "builtin" | "custom";
  type: "text" | "list" | "links";
  title: string;
  content: string | string[] | { label: string; url: string }[];
  visible: boolean;
  order: number;
}

export interface MentorCourse {
  id: string;
  mentorId: string;
  title: string;
  description: string;
  subjectOrField: string;
  mode: SupportMode;
  schedule: string;
  slots: number;
  enrolled: number;
  open: boolean;
  createdAt: string;
}

export interface MentorPost {
  id: string;
  mentorId: string;
  authorId?: string;
  authorRole?: "student" | "mentor";
  postType?: "NEED_MENTOR" | "OFFER_MENTORING";
  title: string;
  contentMd: string;
  content?: string;
  field?: string;
  mode?: SupportMode | string;
  slots?: number;
  capacity?: number;
  filledCount?: number;
  deadline?: string;
  status?: "PUBLISHED" | "FILLED" | "EXPIRED" | "CLOSED";
  open?: boolean;
  likeCount: number;
  commentCount: number;
  liked?: boolean;
  saved?: boolean;
  createdAt: string;
  tags?: string[];
  // Thông tin lớp / nhu cầu lưu thành trường riêng để thẻ bài hiển thị đúng (không đọc từ nội dung chữ)
  subject?: string;
  modes?: SupportMode[];
  schedule?: string[];
  fee?: number; // đ/buổi; 0 = miễn phí; bỏ trống = thỏa thuận
  sessions?: number;
  trial?: boolean;
}

export type MentoringPost = MentorPost;

export interface MentoringRequest {
  id: string;
  studentId: string;
  mentorId: string;
  requesterId?: string;
  recipientId?: string;
  sourceType?: "DIRECT" | "POST";
  sourcePostId?: string;
  topic: string;
  content: string;
  preferredTime?: string | string[];
  planType?: MentoringPlanType;
  packageId?: string;
  planSummary?: string;
  // Số buổi trong gói đã chọn (học thử/học lẻ = 1); dùng làm mốc cho tiến độ lớp học
  totalSessions?: number;
  // Mentor bấm "Bắt đầu lớp học" sau khi hai bên đã chốt gói và giờ; chưa có thì mới chỉ là "Đã kết nối"
  classStartedAt?: string;
  deadline?: string;
  connectionId?: string;
  status: MentoringRequestStatus;
  rejectReason?: string;
  createdAt: string;
}

// Mentor đánh dấu đã học → chờ học viên xác nhận → mới tính vào tiến độ
export type MentoringSessionStatus = 'PLANNED' | 'PENDING_CONFIRM' | 'DONE' | 'CANCELLED';

export interface MentoringSession {
  id: string;
  requestId: string;
  startsAt: string;
  mode: 'online' | 'offline' | 'chat';
  note?: string;
  status: MentoringSessionStatus;
  // Học viên báo "chưa học" khi Mentor đánh dấu đã học
  disputed?: boolean;
  createdAt: string;
}

// Một lớp học = một yêu cầu đã kết nối giữa Mentor và học viên
export interface MentoringClass {
  request: MentoringRequest;
  // Có giá trị khi Mentor đã bắt đầu lớp; chưa có thì lớp đang "Chờ bắt đầu"
  startedAt?: string;
  mentorId: string;
  studentId: string;
  sessions: MentoringSession[];
}

export interface AiMentorMatch {
  mentorId: string;
  score: number;
  reasons: string[];
  confidence: number;
  // Từng tiêu chí học viên đặt ra và Mentor có đáp ứng không; thay cho một con số khó hiểu
  checks?: AiMentorCheck[];
}

export type AiCriterionKey = 'subject' | 'schedule' | 'mode' | 'budget' | 'trial';

export interface AiMentorCheck {
  key: AiCriterionKey;
  ok: boolean;
  detail: string;
}

export type TimeOfDay = 'morning' | 'afternoon' | 'evening';

// Những gì "AI" hiểu từ câu học viên gõ; học viên sửa lại được trước khi tìm
export interface AiMentorCriteria {
  subjects: string[];
  days: ScheduleSlot['day'][];
  timeOfDay?: TimeOfDay;
  modes: ('online' | 'offline' | 'chat')[];
  maxFee?: number;
  wantTrial: boolean;
}

export interface AiMentorSearchResult {
  criteria: AiMentorCriteria;
  matches: AiMentorMatch[];
}

// Shared / General
export interface Notification {
  id: string;
  userId: string;
  source: NotificationSource;
  title: string;
  body: string;
  linkTo: string;
  read: boolean;
  createdAt: string;
}

export interface Conversation {
  id: string;
  kind:
    | "swap"
    | "mentoring"
    | "club"
    | "opportunity"
    | "program"
    | "group"
    | "direct";
  refId: string;
  title?: string;
  participantIds: string[];
  avatarUrl?: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount?: number;
  requestStatus?: "pending" | "accepted" | "declined" | "blocked";
  requestedBy?: string;
  pinned?: boolean;
  archived?: boolean;
}

export interface MessageAttachment {
  name: string;
  url: string;
  size?: number;
  type?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type?: "text" | "image" | "file" | "link" | "like";
  images?: string[];
  attachments?: MessageAttachment[];
  reactions?: Record<string, string[]>;
  replyToMessageId?: string;
  status?: "sending" | "sent" | "read";
  createdAt: string;
}

export interface AuditLog {
  id: string;
  actorId: string;
  action: string;
  targetType: string;
  targetId: string;
  reason?: string;
  createdAt: string;
}

// FE-05 Mentoring Application (26/09/2026 specs)
export interface MentorApplication {
  id: string;
  userId: string;
  status: MentorApplicationStatus;
  personal: {
    avatarUrl: string;
    phone?: string;
    currentRole: 'student' | 'alumni';
    yearOrGraduation: string;
    workplace?: string;
    position?: string;
  };
  education: {
    major: string;
    gpa?: number;
    gpaScale?: 4 | 10;
    gpaPublic: boolean;
    strongSubjects: { code: string; grade?: string }[];
  };
  experiences: {
    type: "internship" | "job" | "project" | "ta" | "club";
    title: string;
    org: string;
    role: string;
    from: string;
    to?: string;
    description: string;
  }[];
  skills: { name: string; level?: "basic" | "good" | "expert" }[];
  achievements: {
    name: string;
    issuer: string;
    year: number;
    url?: string;
    fileUrl?: string;
  }[];
  focus: {
    areas: string[];
    subjects: string[];
    // Hai trường dưới thuộc hồ sơ cũ; lịch rảnh & số học viên giờ được đặt trong Mentor Center sau khi duyệt
    targetAudience?: string[];
    maxMentees?: number;
  };
  about: {
    headline: string;
    bio: string;
    motivation: string;
  };
  availability?: {
    slots: ScheduleSlot[];
    modes: ("online" | "offline" | "chat")[];
    location?: string;
    sessionMinutes: 30 | 45 | 60 | 90;
  };
  evidence: {
    cvUrl: string;
    portfolioUrls: string[];
    otherFiles: { name: string; url: string }[];
  };
  agreed: boolean;
  reviewerId?: string;
  reviewNote?: string;
  flaggedSections?: string[];
  rejectReasonCode?: string;
  history: {
    status: MentorApplicationStatus;
    at: string;
    by?: string;
    note?: string;
  }[];
  createdAt: string;
  submittedAt?: string;
  decidedAt?: string;
}

// Module Opportunity (O1)
export interface Opportunity {
  id: string;
  type: "club" | "group" | "mentor" | "program";
  title: string;
  subtitle: string;
  organizationName: string;
  avatarUrl?: string;
  coverUrl?: string;
  field: string;
  deadline?: string;
  spotsLeft?: number;
  tags: string[];
  linkTo: string;
  isUrgent?: boolean;
  isFeatured?: boolean;
  createdAt: string;
}

// Global Nav Counters (GET /nav/counters)
export interface NavCounters {
  unreadNotifications: number;
  unreadMessages: number;
  pendingMessageRequests: number;
  pendingGroupJoinRequests: number;
  pendingSwapInvites: number;
  pendingRequestsTotal: number;
  /** Mentor: số yêu cầu mentoring nhận được đang chờ mình phản hồi */
  pendingMentoringRequests: number;
  /** Học viên: số yêu cầu đã gửi vừa được Mentor chấp nhận/từ chối (chưa xem) */
  mentoringRequestUpdates?: number;
  pendingOpportunityResponses?: number;
  pendingProgramRegistrations?: number;
  pendingFollowRequests?: number;
  todayRegisteredEvents: number;
  clubsWithNewActivity?: string[];
  mentorApplicationStatus?: MentorApplicationStatus;
}

export interface SystemSettings {
  aiEnabledModules: {
    swap: boolean;
    group: boolean;
    mentoring: boolean;
    clubs?: boolean;
  };
  aiFeatures?: {
    smartSwapMatch: boolean;
    groupMemberSuggestion: boolean;
    mentorAutoMatch: boolean;
    clubOpportunitySuggestion?: boolean;
  };
  emailNotifications: {
    swap: boolean;
    groups: boolean;
    clubs: boolean;
    mentoring: boolean;
    programs?: boolean;
  };
  notifications?: {
    emailOnStatusChange: boolean;
    inAppInstantChat: boolean;
  };
  defaultPrivacy: {
    showProfilePublicly: boolean;
    allowMatching: boolean;
    defaultProfileVisibility?: ProfileVisibility;
  };
  guestAccess?: {
    allowGuestPreview: boolean;
    knowledgePreviewLimit: number;
    programsPreviewLimit: number;
  };
  programLimits?: {
    maxActiveChannelsPerStudent: number;
    maxAnnouncementsPerDay: number;
  };
  appearance?: {
    fontScale: "sm" | "md" | "lg" | "xl";
  };
  autoModerationThreshold: number;
  moderationThreshold?: number;
  autoHideReportThreshold?: number;
}

export interface SchoolAffiliationRequest {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  avatarUrl?: string;
  studentCode: string;
  school: string;
  major: string;
  cohort: string;
  evidenceUrl?: string;
  evidenceType?: "student_card" | "portal_screenshot" | "enrollment_cert";
  status: import("./status").SchoolAffiliationStatus;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reason?: string;
}
