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
} from './status';

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
};

export type ClubRole = 'lead' | 'vice' | 'treasurer' | 'manager' | 'member' | MembershipRole;

export interface ScheduleSlot {
  day: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';
  start: string; // "HH:mm"
  end: string;   // "HH:mm"
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  avatarUrl?: string;
  school: string;
  major?: string;
  studentCode?: string;
  roles: Role[];
  status: UserAccountStatus;
  createdAt: string;
}

export interface StudentProfile {
  userId: string;
  bio?: string;
  skills: string[];
  interests: string[];
  goals: string[];
  availability: ScheduleSlot[];
  privacy: {
    swapMatching: boolean;
    groupMatching: boolean;
    mentoringMatching: boolean;
  };
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
  status: SwapRequestStatus;
  version: number;
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
  cancelReason?: string;
  createdAt: string;
  respondedAt?: string;
}

export interface AiSwapMatch {
  requestId: string;
  score: number;
  reasons: string[];
}

// FE-02 Knowledge (Threads model)
export interface KnowledgePost {
  id: string;
  authorId: string;
  type: PostType;
  title?: string;
  contentMd: string;
  content?: string;
  subject?: string;
  subjectCode?: string;
  tags: string[];
  images?: string[];
  attachments: { name: string; url: string; size: number }[];
  visibility: 'school' | 'cross_school';
  status: PostStatus;
  rejectReason?: string;
  likesCount?: number;
  likedByMe?: boolean;
  savedByMe?: boolean;
  isSolved?: boolean;
  acceptedCommentId?: string;
  commentCount: number;
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
  commentId?: string;
  reporterId: string;
  reason: string;
  details?: string;
  note?: string;
  status: 'Open' | 'Resolved';
  createdAt: string;
}

// FE-03 Group
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
}

export interface GroupMember {
  groupId: string;
  userId: string;
  role: 'owner' | 'member';
  joinedAt: string;
}

export interface GroupJoinRequest {
  id: string;
  groupId: string;
  userId: string;
  message?: string;
  status: JoinRequestStatus;
  createdAt: string;
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

// FE-04 Club
export interface Club {
  id: string;
  name: string;
  logoUrl?: string;
  coverUrl?: string;
  description: string;
  field: string;
  managerId: string;
  approvalStatus: ClubApprovalStatus;
  createdAt: string;
}

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
  mode: 'online' | 'offline';
  type?: 'online' | 'offline';
  location: string;
  locationOrLink?: string;
  result?: 'pass' | 'fail';
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

// FE-05 Mentoring
export interface Mentor {
  userId: string;
  fields: string[];
  subjects: string[];
  experience: string;
  availability: ScheduleSlot[];
  supportModes: SupportMode[];
  acceptingRequests: boolean;
}

export interface MentoringPost {
  id: string;
  mentorId: string;
  title: string;
  content: string;
  field: string;
  mode: SupportMode;
  slots: number;
  open: boolean;
}

export interface MentoringRequest {
  id: string;
  studentId: string;
  mentorId: string;
  topic: string;
  content: string;
  preferredTime?: string | string[];
  status: MentoringRequestStatus;
  rejectReason?: string;
  createdAt: string;
}

export interface AiMentorMatch {
  mentorId: string;
  score: number;
  reasons: string[];
  confidence: number;
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
  kind: 'swap' | 'mentoring' | 'club' | 'group' | 'direct';
  refId: string;
  title?: string;
  participantIds: string[];
  avatarUrl?: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount?: number;
  requestStatus?: 'pending' | 'accepted' | 'declined' | 'blocked';
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
  type?: 'text' | 'image' | 'file' | 'link' | 'like';
  images?: string[];
  attachments?: MessageAttachment[];
  reactions?: Record<string, string[]>;
  replyToMessageId?: string;
  status?: 'sending' | 'sent' | 'read';
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
    currentRole: 'student' | 'alumni' | 'lecturer' | 'professional';
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
    type: 'internship' | 'job' | 'project' | 'ta' | 'club';
    title: string;
    org: string;
    role: string;
    from: string;
    to?: string;
    description: string;
  }[];
  skills: { name: string; level?: 'basic' | 'good' | 'expert' }[];
  achievements: { name: string; issuer: string; year: number; url?: string; fileUrl?: string }[];
  focus: {
    areas: string[];
    subjects: string[];
    targetAudience: string[];
    maxMentees: number;
  };
  about: {
    headline: string;
    bio: string;
    motivation: string;
  };
  availability: {
    slots: ScheduleSlot[];
    modes: ('online' | 'offline' | 'chat')[];
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
  history: { status: MentorApplicationStatus; at: string; by?: string; note?: string }[];
  createdAt: string;
  submittedAt?: string;
  decidedAt?: string;
}

// Module Opportunity (O1)
export interface Opportunity {
  id: string;
  type: 'club' | 'group' | 'mentor';
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
  pendingMentoringRequests: number;
  todayRegisteredEvents: number;
  clubsWithNewActivity: string[];
  mentorApplicationStatus?: MentorApplicationStatus;
}

export interface SystemSettings {
  aiEnabledModules: {
    swap: boolean;
    group: boolean;
    mentoring: boolean;
  };
  aiFeatures?: {
    smartSwapMatch: boolean;
    groupMemberSuggestion: boolean;
    mentorAutoMatch: boolean;
  };
  emailNotifications: {
    swap: boolean;
    groups: boolean;
    clubs: boolean;
    mentoring: boolean;
  };
  notifications?: {
    emailOnStatusChange: boolean;
    inAppInstantChat: boolean;
  };
  defaultPrivacy: {
    showProfilePublicly: boolean;
    allowMatching: boolean;
  };
  appearance?: {
    fontScale: 'sm' | 'md' | 'lg' | 'xl';
  };
  autoModerationThreshold: number; // 0 to 100
  moderationThreshold?: number;
}

