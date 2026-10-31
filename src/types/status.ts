// ============================================================================
// SCS Status Enums & State Unions (Single Source of Truth — 29/09/2026 Plan)
// ============================================================================

export type Role =
  | 'student'
  | 'mentor'
  | 'club_manager'
  | 'club_rep'
  | 'organizer'
  | 'treasurer'
  // Quản lý nghiệp vụ (business admin): kiểm duyệt, duyệt CLB/chương trình/Mentor, danh mục
  | 'manager'
  | 'school_admin'
  | 'event_manager'
  | 'school_admin'
  | 'admin'
  | 'Student'
  | 'Mentor'
  | 'ClubManager'
  | 'ClubTreasurer'
  | 'Manager'
  | 'SchoolAdmin'
  | 'Admin';

export type UserRole = Role;

export type SchoolAffiliationStatus =
  | 'Pending'
  | 'Verified'
  | 'NeedsMoreInfo'
  | 'Rejected'
  | 'Revoked';

export type UserAccountStatus =
  | 'active'
  | 'locked'
  | 'unverified'
  | 'Active'
  | 'Locked'
  | 'Unverified'
  | 'PendingActivation'
  | 'Suspended'
  | 'Banned';

export type AccountStatus = UserAccountStatus;

export type SwapRequestStatus = 'Open' | 'Connected' | 'Cancelled' | 'open' | 'connected' | 'cancelled' | 'Draft' | 'Matched' | 'PendingConfirmation' | 'Completed' | 'Expired';
export type SwapConnectionStatus = 'Pending' | 'Confirmed' | 'Rejected' | 'Cancelled' | 'pending' | 'confirmed' | 'rejected' | 'cancelled';

export type PostType = 'review' | 'discussion' | 'question' | 'document' | 'experience' | 'Question' | 'Note' | 'Experience' | 'Resource';
export type PostCategory =
  | 'knowledge'
  | 'study_experience'
  | 'internship'
  | 'interview'
  | 'document'
  | 'tips'
  | 'career'
  | 'project'
  | 'qa'
  | 'mentor_senior';

export type PostStatus =
  | 'Draft'
  | 'Published'
  | 'PendingReview'
  | 'TemporarilyHidden'
  | 'Hidden'
  | 'Flagged'
  | 'Rejected'
  | 'Closed'
  | 'Deleted'
  | 'published'
  | 'pending_review'
  | 'rejected'
  | 'closed';

export type JoinMode = 'direct' | 'approval';
export type JoinRequestStatus = 'Pending' | 'Approved' | 'Accepted' | 'Rejected' | 'Cancelled' | 'pending' | 'approved' | 'rejected';

// Legacy aliases kept for type compatibility
export type ClubApprovalStatus = 'PendingApproval' | 'Approved' | 'Rejected' | 'pending_approval' | 'approved' | 'rejected';
export type RecruitmentStatus = 'Draft' | 'Published' | 'Closed' | 'draft' | 'published' | 'closed';
export type ApplicationStatus = 'Submitted' | 'NeedsSupplement' | 'Screening' | 'Interview' | 'Accepted' | 'Rejected' | 'submitted' | 'needs_supplement' | 'screening' | 'interview' | 'accepted' | 'rejected';
export type MembershipRole = 'manager' | 'treasurer' | 'member' | 'lead' | 'vice';
export type MembershipStatus = 'Active' | 'Suspended' | 'Left' | 'active' | 'suspended' | 'left';
export type EventStatus = 'Published' | 'Ongoing' | 'Finished' | 'published' | 'ongoing' | 'finished';
export type TaskStatus = 'Todo' | 'InProgress' | 'Done' | 'todo' | 'in_progress' | 'done';
export type TxType = 'Income' | 'Expense' | 'income' | 'expense';
export type ExpenseStatus = 'PendingApproval' | 'Approved' | 'Rejected' | 'pending_approval' | 'approved' | 'rejected';

// FE-04 — Club Connection (29/09/2026)
export type ClubStatus = 'Active' | 'Hidden';
export type RepresentativeRequestStatus = 'Pending' | 'Verified' | 'Rejected';
export type OpportunityType = 'Event' | 'MemberRecruitment' | 'CollaboratorRecruitment';
export type OpportunityStatus = 'Draft' | 'Published' | 'Closed' | 'Expired' | 'Cancelled';
export type OpportunityResponseStatus =
  | 'Draft'
  | 'Submitted'
  | 'UnderReview'
  | 'NeedsMoreInfo'
  | 'Confirmed'
  | 'Accepted'
  | 'Rejected'
  | 'Withdrawn'
  | 'Expired'
  | 'Cancelled';
export type ConnectionInviteStatus = 'Pending' | 'Accepted' | 'Declined' | 'Withdrawn' | 'Cancelled';

// FE-06 — Community Program Registration (29/09/2026)
export type ProgramType = 'Event' | 'Volunteer' | 'Workshop';
export type ProgramChannelStatus =
  | 'Draft'
  | 'PendingReview'
  | 'Rejected'
  | 'Published'
  | 'Closed'
  | 'Expired'
  | 'Cancelled';
export type ProgramRegistrationStatus =
  | 'Submitted'
  | 'Confirmed'
  | 'Rejected'
  | 'Withdrawn'
  | 'Expired'
  | 'Cancelled';
export type CoOrganizerStatus = 'Pending' | 'Accepted' | 'Declined' | 'Removed';
export type ProgramProposalStatus = 'Draft' | 'PendingReview' | 'Approved' | 'Rejected';

// Social & Moderation (29/09/2026)
export type FollowStatus = 'Pending' | 'Active' | 'Declined' | 'Withdrawn' | 'Cancelled' | 'Ended';
export type ProfileVisibility = 'members' | 'followers' | 'private';
export type ReportStatus = 'Open' | 'UnderReview' | 'Resolved' | 'Rejected';
export type ReportTargetType =
  | 'post'
  | 'comment'
  | 'user'
  | 'opportunity'
  | 'program'
  | 'group'
  | 'mentor_post'
  | 'announcement'
  | 'message';

export type MentorApplicationStatus =
  | 'Draft'
  | 'Submitted'
  | 'UnderReview'
  | 'NeedsMoreInfo'
  | 'Approved'
  | 'Rejected'
  | 'Withdrawn';

export type MentoringRequestStatus =
  | 'PENDING_MENTOR_RESPONSE'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'ENDED'
  | 'EXPIRED'
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'Pending'
  | 'Accepted'
  | 'Declined'
  | 'Cancelled'
  | 'InProgress'
  | 'Completed';

export type SupportMode = 'online' | 'offline' | 'chat' | 'Online' | 'Offline' | 'Chat';

export type NotificationSource =
  | 'StudentLifeSearch'
  | 'StudentLifeLifecycle'
  | 'SchoolAffiliation'
  | 'Swap'
  | 'GroupJoin'
  | 'ClubApplication'
  | 'ClubEvent'
  | 'ClubRole'
  | 'ClubFinance'
  | 'ClubOpportunity'
  | 'Program'
  | 'Mentoring'
  | 'Moderation'
  | 'ThreadReply'
  | 'MessageRequest'
  | 'Follow'
  | 'MentorApplication'
  | 'EventReminder'
  | 'swap'
  | 'group_join'
  | 'club_application'
  | 'club_event'
  | 'club_role'
  | 'club_finance'
  | 'mentoring'
  | 'moderation'
  | 'program'
  | 'follow';

export type SemanticTier = 'neutral' | 'pending' | 'attention' | 'success' | 'danger' | 'brand';
export type StatusTier = SemanticTier;

export type FontSizeScale = 'sm' | 'md' | 'lg' | 'xl';
