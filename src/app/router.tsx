import React from 'react';
import { createBrowserRouter, Navigate, useParams } from 'react-router-dom';

const MentorDetailRedirect: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={`/users/${id}`} replace />;
};

const AdminOnly: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute requireRoles={['admin', 'Admin']}>{children}</ProtectedRoute>
);

const SwapMatchRedirect: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={`/swap/${id}`} replace />;
};

// Layouts
import { AuthLayout } from './layouts/AuthLayout';
import { AppShell } from './layouts/AppShell';
import { AdminShell } from './layouts/AdminShell';
import { ProtectedRoute } from './ProtectedRoute';

// Public & Auth Pages
const LoginPage = React.lazy(() => import('@/features/auth/LoginPage'));
const RegisterPage = React.lazy(() => import('@/features/auth/RegisterPage'));
const VerifyEmailPage = React.lazy(() => import('@/features/auth/VerifyEmailPage'));
const ForgotPasswordPage = React.lazy(() => import('@/features/auth/ForgotPasswordPage'));
const OnboardingPage = React.lazy(() => import('@/features/auth/OnboardingPage'));
const HelpPage = React.lazy(() => import('@/features/help/HelpPage'));

// Common & Global Navigation Pages
const DashboardPage = React.lazy(() => import('@/features/common/DashboardPage'));
const SearchPage = React.lazy(() => import('@/features/search/SearchPage'));
const EventsPage = React.lazy(() => import('@/features/events/EventsPage'));
const RequestsPage = React.lazy(() => import('@/features/requests/RequestsPage'));
const SettingsPage = React.lazy(() => import('@/features/settings/SettingsPage'));
const ErrorPage = React.lazy(() => import('@/features/common/ErrorPage'));
const PeoplePage = React.lazy(() => import('@/features/people/PeoplePage'));

// Profile (Unified C7 + C8)
const ProfilePage = React.lazy(() => import('@/features/profile/ProfilePage'));

// Notifications & Chat
const NotificationsPage = React.lazy(() => import('@/features/notifications/NotificationsPage'));
const ChatsPage = React.lazy(() => import('@/features/chat/ChatsPage'));

// FE-01: Class Swap
const SwapListPage = React.lazy(() => import('@/features/swap/SwapListPage'));
const SwapDetailPage = React.lazy(() => import('@/features/swap/SwapDetailPage'));
const SwapConnectionsPage = React.lazy(() => import('@/features/swap/SwapConnectionsPage'));

// FE-02: Knowledge Sharing
const KnowledgeHubPage = React.lazy(() => import('@/features/knowledge/KnowledgeHubPage'));
const KnowledgePostDetailPage = React.lazy(() => import('@/features/knowledge/KnowledgePostDetailPage'));
const MyPostsPage = React.lazy(() => import('@/features/knowledge/MyPostsPage'));

// FE-03: Group Finding
const GroupsFindPage = React.lazy(() => import('@/features/groups/GroupsFindPage'));
const GroupFormPage = React.lazy(() => import('@/features/groups/GroupFormPage'));
const GroupDetailPage = React.lazy(() => import('@/features/groups/GroupDetailPage'));
const MyGroupsPage = React.lazy(() => import('@/features/groups/MyGroupsPage'));
const GroupManagePage = React.lazy(() => import('@/features/groups/GroupManagePage'));

// FE-04: Club Connection (CL1–CL12)
const ClubsExplorePage = React.lazy(() => import('@/features/clubs/ClubsExplorePage'));
const ClubProfilePage = React.lazy(() => import('@/features/clubs/ClubProfilePage'));
const ClubOpportunityDetailPage = React.lazy(() => import('@/features/clubs/ClubOpportunityDetailPage'));
const ClubOpportunityRegisterPage = React.lazy(() => import('@/features/clubs/ClubOpportunityRegisterPage'));
const ClubRegistrationDetailPage = React.lazy(() => import('@/features/clubs/ClubRegistrationDetailPage'));
const ClubOpportunityFormPage = React.lazy(() => import('@/features/clubs/ClubOpportunityFormPage'));
const ClubOpportunityManageDetailPage = React.lazy(() => import('@/features/clubs/ClubOpportunityManageDetailPage'));
const ClubRepresentRequestPage = React.lazy(() => import('@/features/clubs/ClubRepresentRequestPage'));

// FE-06: Community Program Registration (PG1–PG8)
const ProgramsExplorePage = React.lazy(() => import('@/features/programs/ProgramsExplorePage'));
const ProgramDetailPage = React.lazy(() => import('@/features/programs/ProgramDetailPage'));
const ProgramRegisterPage = React.lazy(() => import('@/features/programs/ProgramRegisterPage'));
const ProgramFormPage = React.lazy(() => import('@/features/programs/ProgramFormPage'));
const ProgramManagePage = React.lazy(() => import('@/features/programs/ProgramManagePage'));
const ProgramProposalsPage = React.lazy(() => import('@/features/programs/ProgramProposalsPage').then(module => ({ default: module.ProgramProposalsPage })));
const ProgramProposalReviewPage = React.lazy(() => import('@/features/programs/ProgramProposalsPage').then(module => ({ default: module.ProgramProposalReviewPage })));

// FE-05: Mentoring — phía Học viên (/mentoring/*): tìm Mentor, gửi & theo dõi yêu cầu đã gửi
const MentorAiSearchPage = React.lazy(() => import('@/features/mentoring/MentorAiSearchPage'));
const MentorBrowsePage = React.lazy(() => import('@/features/mentoring/MentorBrowsePage'));
const MentoringPostDetailPage = React.lazy(() => import('@/features/mentoring/MentoringPostDetailPage'));
const MyMentoringRequestsPage = React.lazy(() => import('@/features/mentoring/MyMentoringRequestsPage'));
const MentoringFeedPage = React.lazy(() => import('@/features/mentoring/MentoringFeedPage'));

// FE-05: Mentoring Application Flow (MR0 - MR3)
const MentorApplyIntroPage = React.lazy(() => import('@/features/mentor/MentorApplyIntroPage'));
const MentorApplyFormPage = React.lazy(() => import('@/features/mentor/MentorApplyFormPage'));
const MentorApplyReviewPage = React.lazy(() => import('@/features/mentor/MentorApplyReviewPage'));

// FE-05: Mentoring — phía Mentor (/mentor/*, Mentor Center): nhận & phản hồi yêu cầu
const MentorCenterShell = React.lazy(() => import('@/features/mentor/MentorCenterShell'));
const MentorProfilePage = React.lazy(() => import('@/features/mentor/MentorProfilePage'));
const MentorPostsPage = React.lazy(() => import('@/features/mentor/MentorPostsPage'));
const MentorRequestsPage = React.lazy(() => import('@/features/mentor/MentorRequestsPage'));

// Admin Portal
const AdminDashboardPage = React.lazy(() => import('@/features/admin/AdminDashboardPage'));
const AdminUsersPage = React.lazy(() => import('@/features/admin/AdminUsersPage'));
const AdminUserDetailPage = React.lazy(() => import('@/features/admin/AdminUserDetailPage'));
const ModerationPage = React.lazy(() => import('@/features/admin/ModerationPage'));
const AdminClubsPage = React.lazy(() => import('@/features/admin/AdminClubsPage'));
const AdminProgramsPage = React.lazy(() => import('@/features/admin/AdminProgramsPage'));
const AdminMentorApplicationsPage = React.lazy(() => import('@/features/admin/AdminMentorApplicationsPage'));
const AdminMentorApplicationDetailPage = React.lazy(() => import('@/features/admin/AdminMentorApplicationDetailPage'));
const MasterDataPage = React.lazy(() => import('@/features/admin/MasterDataPage'));
const SystemSettingsPage = React.lazy(() => import('@/features/admin/SystemSettingsPage'));
const AdminManagementPage = React.lazy(() => import('@/features/admin/AdminManagementPage'));
const AuditLogsPage = React.lazy(() => import('@/features/admin/AuditLogsPage'));

// Dev / Showcase
const KitchenSinkPage = React.lazy(() => import('@/features/dev/KitchenSinkPage'));

export const router = createBrowserRouter([
  // Legal: mở hộp điều khoản ngay trên Home Feed
  { path: '/terms', element: <Navigate to="/?legal=terms" replace /> },
  { path: '/privacy', element: <Navigate to="/?legal=privacy" replace /> },

  // Auth Routes
  {
    element: <AuthLayout />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
      { path: '/verify-email', element: <VerifyEmailPage /> },
      { path: '/forgot-password', element: <ForgotPasswordPage /> },
      { path: '/onboarding', element: <OnboardingPage /> },
    ],
  },

  // Main App Routes (AppShell) — khách xem như thành viên; GuestAccessBoundary + lib/access.ts
  // quyết định trang nào làm mờ (dữ liệu cá nhân) và giới hạn lướt; thao tác ghi bị chặn ở apiClient.
  {
    path: '/',
    element: (
      <ProtectedRoute allowGuest>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'help', element: <HelpPage /> },
      { path: 'search', element: <SearchPage /> },
      { path: 'discover', element: <Navigate to="/knowledge" replace /> },
      { path: 'me', element: <Navigate to="/requests" replace /> },
      { path: 'requests', element: <RequestsPage /> },
      { path: 'opportunities', element: <Navigate to="/clubs" replace /> },
      { path: 'events', element: <EventsPage /> },
      { path: 'events/:id', element: <Navigate to="/events" replace /> },
      { path: 'people', element: <PeoplePage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: 'profile/me', element: <ProfilePage /> },
      { path: 'users/:id', element: <ProfilePage /> },
      { path: 'notifications', element: <NotificationsPage /> },
      { path: 'chats', element: <ChatsPage /> },
      { path: 'chats/:id', element: <ChatsPage /> },

      // FE-01: Swap
      { path: 'swap', element: <SwapListPage /> },
      { path: 'swap/new', element: <Navigate to="/swap?create=1" replace /> },
      { path: 'swap/:id', element: <SwapDetailPage /> },
      { path: 'swap/:id/match', element: <SwapMatchRedirect /> },
      { path: 'swap/connections', element: <SwapConnectionsPage /> },

      // FE-02: Knowledge
      { path: 'knowledge', element: <KnowledgeHubPage /> },
      { path: 'knowledge/:id', element: <KnowledgePostDetailPage /> },
      { path: 'knowledge/new', element: <Navigate to="/knowledge" replace /> },
      { path: 'knowledge/:id/edit', element: <Navigate to="/knowledge" replace /> },
      { path: 'knowledge/me', element: <MyPostsPage /> },

      // FE-03: Groups
      { path: 'groups', element: <GroupsFindPage /> },
      { path: 'groups/new', element: <GroupFormPage /> },
      { path: 'groups/:id', element: <GroupDetailPage /> },
      { path: 'groups/me', element: <MyGroupsPage /> },
      { path: 'groups/:id/manage', element: <GroupManagePage /> },

      // FE-04: Club Connection
      { path: 'clubs', element: <ClubsExplorePage /> },
      { path: 'clubs/:id', element: <ClubProfilePage /> },
      { path: 'clubs/opportunities/:oppId', element: <ClubOpportunityDetailPage /> },
      { path: 'opportunities/:oppId', element: <ClubOpportunityDetailPage /> },
      { path: 'clubs/opportunities/:oppId/register', element: <ClubOpportunityRegisterPage /> },
      { path: 'clubs/registrations/:respId', element: <ClubRegistrationDetailPage /> },
      { path: 'clubs/manage/new', element: <ClubOpportunityFormPage /> },
      { path: 'clubs/manage/:oppId/edit', element: <ClubOpportunityFormPage /> },
      { path: 'clubs/manage/:oppId', element: <ClubOpportunityManageDetailPage /> },
      { path: 'clubs/represent', element: <ClubRepresentRequestPage /> },

      // Legacy FE-04 Redirects
      { path: 'clubs/register', element: <Navigate to="/clubs/represent" replace /> },
      { path: 'applications', element: <Navigate to="/clubs?tab=registrations" replace /> },
      { path: 'clubs/:id/apply', element: <Navigate to="/clubs" replace /> },
      { path: 'clubs/:clubId/workspace/*', element: <Navigate to="/clubs?tab=manage" replace /> },

      // FE-06: Community Program Registration
      { path: 'programs', element: <ProgramsExplorePage /> },
      { path: 'programs/proposals', element: <ProtectedRoute requireRoles={['student', 'Student']}><ProgramProposalsPage /></ProtectedRoute> },
      { path: 'programs/proposals/review', element: <ProtectedRoute requireRoles={['event_manager']}><ProgramProposalReviewPage /></ProtectedRoute> },
      { path: 'programs/:id', element: <ProgramDetailPage /> },
      { path: 'programs/new', element: <ProtectedRoute requireRoles={['event_manager']}><ProgramFormPage /></ProtectedRoute> },
      { path: 'programs/:id/edit', element: <ProtectedRoute requireRoles={['event_manager']}><ProgramFormPage /></ProtectedRoute> },
      { path: 'programs/:id/register', element: <ProgramRegisterPage /> },
      { path: 'programs/manage/:id', element: <ProtectedRoute requireRoles={['event_manager']}><ProgramManagePage /></ProtectedRoute> },

      // FE-05: Mentoring (Student)
      { path: 'mentoring', element: <MentoringFeedPage /> },
      { path: 'mentoring/ai', element: <MentorAiSearchPage /> },
      { path: 'mentoring/browse', element: <MentorBrowsePage /> },
      { path: 'mentoring/feed', element: <MentoringFeedPage /> },
      { path: 'mentoring/mentors/:id', element: <MentorDetailRedirect /> },
      { path: 'mentoring/posts/:id', element: <MentoringPostDetailPage /> },
      { path: 'mentoring/requests', element: <MyMentoringRequestsPage /> },

      // FE-05: Mentor Application Flow (MR0 - MR3)
      { path: 'mentor/apply', element: <MentorApplyIntroPage /> },
      { path: 'mentor/apply/form', element: <MentorApplyFormPage /> },
      { path: 'mentor/apply/review', element: <MentorApplyReviewPage /> },

      // FE-05: Mentoring (Mentor Center)
      {
        path: 'mentor',
        element: (
          <ProtectedRoute allowGuest requireRoles={['mentor', 'Mentor']}>
            <MentorCenterShell />
          </ProtectedRoute>
        ),
        children: [
          // Trang đầu tiên của luồng Mentor: yêu cầu nhận được
          { index: true, element: <Navigate to="requests" replace /> },
          { path: 'profile', element: <MentorProfilePage /> },
          { path: 'posts', element: <MentorPostsPage /> },
          { path: 'requests', element: <MentorRequestsPage /> },
        ],
      },

      // Dev Showcase
      { path: 'dev/kitchen-sink', element: <KitchenSinkPage /> },
      { path: 'dev/components', element: <KitchenSinkPage /> },
    ],
  },

  // Admin Portal (AdminShell)
  {
    path: '/admin',
    element: (
      <ProtectedRoute requireRoles={['admin', 'manager', 'Admin', 'Manager']}>
        <AdminShell />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <AdminDashboardPage /> },
      // Quản lý người dùng, cấu hình, phân quyền, nhật ký: chỉ Admin duy nhất (Manager → /403)
      { path: 'users', element: <AdminOnly><AdminUsersPage /></AdminOnly> },
      { path: 'users/:id', element: <AdminOnly><AdminUserDetailPage /></AdminOnly> },
      { path: 'moderation', element: <ModerationPage /> },
      { path: 'clubs', element: <AdminClubsPage /> },
      { path: 'programs', element: <AdminProgramsPage /> },
      { path: 'mentor-applications', element: <AdminMentorApplicationsPage /> },
      { path: 'mentor-applications/:id', element: <AdminMentorApplicationDetailPage /> },
      { path: 'master-data', element: <MasterDataPage /> },
      { path: 'settings', element: <AdminOnly><SystemSettingsPage /></AdminOnly> },
      { path: 'admins', element: <AdminOnly><AdminManagementPage /></AdminOnly> },
      { path: 'audit-logs', element: <AdminOnly><AuditLogsPage /></AdminOnly> },
    ],
  },

  // Error Routes
  { path: '/403', element: <ErrorPage code={403} /> },
  { path: '/404', element: <ErrorPage code={404} /> },
  { path: '/500', element: <ErrorPage code={500} /> },
  { path: '*', element: <ErrorPage code={404} /> },
]);

export default router;
