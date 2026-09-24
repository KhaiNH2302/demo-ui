export type Role =
  | 'student'
  | 'mentor'
  | 'club_manager'
  | 'treasurer'
  | 'system_admin'
  | 'school_admin'
  | 'admin'
  | 'Student'
  | 'Mentor'
  | 'ClubManager'
  | 'ClubTreasurer'
  | 'SystemAdmin'
  | 'SchoolAdmin'
  | 'Admin';

export type UserAccountStatus = 'active' | 'locked' | 'unverified' | 'Active' | 'Locked' | 'Unverified';

export type SwapRequestStatus = 'Open' | 'Connected' | 'Cancelled' | 'open' | 'connected' | 'cancelled';
export type SwapConnectionStatus = 'Pending' | 'Confirmed' | 'Rejected' | 'Cancelled' | 'pending' | 'confirmed' | 'rejected' | 'cancelled';

export type PostType = 'question' | 'experience' | 'document';
export type PostStatus = 'Published' | 'PendingReview' | 'Rejected' | 'Closed' | 'published' | 'pending_review' | 'rejected' | 'closed';

export type JoinMode = 'direct' | 'approval';
export type JoinRequestStatus = 'Pending' | 'Approved' | 'Rejected' | 'pending' | 'approved' | 'rejected';

export type ClubApprovalStatus = 'PendingApproval' | 'Approved' | 'Rejected' | 'pending_approval' | 'approved' | 'rejected';
export type RecruitmentStatus = 'Draft' | 'Published' | 'Closed' | 'draft' | 'published' | 'closed';
export type ApplicationStatus = 'Submitted' | 'NeedsSupplement' | 'Screening' | 'Interview' | 'Accepted' | 'Rejected' | 'submitted' | 'needs_supplement' | 'screening' | 'interview' | 'accepted' | 'rejected';
export type MembershipRole = 'manager' | 'treasurer' | 'member' | 'lead' | 'vice';
export type MembershipStatus = 'Active' | 'Suspended' | 'Left' | 'active' | 'suspended' | 'left';
export type EventStatus = 'Published' | 'Ongoing' | 'Finished' | 'published' | 'ongoing' | 'finished';
export type TaskStatus = 'Todo' | 'InProgress' | 'Done' | 'todo' | 'in_progress' | 'done';
export type TxType = 'Income' | 'Expense' | 'income' | 'expense';
export type ExpenseStatus = 'PendingApproval' | 'Approved' | 'Rejected' | 'pending_approval' | 'approved' | 'rejected';

export type MentoringRequestStatus = 'PENDING_MENTOR_RESPONSE' | 'ACCEPTED' | 'REJECTED' | 'pending' | 'accepted' | 'rejected';
export type SupportMode = 'online' | 'offline' | 'chat' | 'Online' | 'Offline' | 'Chat';

export type NotificationSource =
  | 'Swap'
  | 'GroupJoin'
  | 'ClubApplication'
  | 'ClubEvent'
  | 'ClubRole'
  | 'ClubFinance'
  | 'Mentoring'
  | 'Moderation'
  | 'swap'
  | 'group_join'
  | 'club_application'
  | 'club_event'
  | 'club_role'
  | 'club_finance'
  | 'mentoring'
  | 'moderation';

export type SemanticTier = 'neutral' | 'pending' | 'attention' | 'success' | 'danger' | 'brand';
