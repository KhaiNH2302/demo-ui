import React from 'react';
import { createBrowserRouter, Navigate, useParams } from 'react-router-dom';

const MentorDetailRedirect: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={`/users/${id}`} replace />;
};

const SystemAdminOnly: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute requireRoles={['system_admin', 'super_admin', 'SystemAdmin', 'SuperAdmin']}>{children}</ProtectedRoute>
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
import LoginPage from '@/features/auth/LoginPage';
import RegisterPage from '@/features/auth/RegisterPage';
import VerifyEmailPage from '@/features/auth/VerifyEmailPage';
import ForgotPasswordPage from '@/features/auth/ForgotPasswordPage';
import OnboardingPage from '@/features/auth/OnboardingPage';
import HelpPage from '@/features/help/HelpPage';

// Common & Global Navigation Pages
import DashboardPage from '@/features/common/DashboardPage';
import SearchPage from '@/features/search/SearchPage';
import EventsPage from '@/features/events/EventsPage';
import RequestsPage from '@/features/requests/RequestsPage';
import SettingsPage from '@/features/settings/SettingsPage';
import ErrorPage from '@/features/common/ErrorPage';
import PeoplePage from '@/features/people/PeoplePage';

// Profile (Unified C7 + C8)
import ProfilePage from '@/features/profile/ProfilePage';

// Notifications & Chat
import NotificationsPage from '@/features/notifications/NotificationsPage';
import ChatsPage from '@/features/chat/ChatsPage';

// FE-01: Class Swap
import SwapListPage from '@/features/swap/SwapListPage';
import SwapDetailPage from '@/features/swap/SwapDetailPage';
import SwapConnectionsPage from '@/features/swap/SwapConnectionsPage';

// FE-02: Knowledge Sharing
import KnowledgeHubPage from '@/features/knowledge/KnowledgeHubPage';
import KnowledgePostDetailPage from '@/features/knowledge/KnowledgePostDetailPage';
import MyPostsPage from '@/features/knowledge/MyPostsPage';

// FE-03: Group Finding
import GroupsFindPage from '@/features/groups/GroupsFindPage';
import GroupFormPage from '@/features/groups/GroupFormPage';
import GroupDetailPage from '@/features/groups/GroupDetailPage';
import MyGroupsPage from '@/features/groups/MyGroupsPage';
import GroupManagePage from '@/features/groups/GroupManagePage';

// FE-04: Club Connection (CL1–CL12)
import ClubsExplorePage from '@/features/clubs/ClubsExplorePage';
import ClubProfilePage from '@/features/clubs/ClubProfilePage';
import ClubOpportunityDetailPage from '@/features/clubs/ClubOpportunityDetailPage';
import ClubOpportunityRegisterPage from '@/features/clubs/ClubOpportunityRegisterPage';
import ClubRegistrationDetailPage from '@/features/clubs/ClubRegistrationDetailPage';
import ClubOpportunityFormPage from '@/features/clubs/ClubOpportunityFormPage';
import ClubOpportunityManageDetailPage from '@/features/clubs/ClubOpportunityManageDetailPage';
import ClubRepresentRequestPage from '@/features/clubs/ClubRepresentRequestPage';

// FE-06: Community Program Registration (PG1–PG8)
import ProgramsExplorePage from '@/features/programs/ProgramsExplorePage';
import ProgramDetailPage from '@/features/programs/ProgramDetailPage';
import ProgramRegisterPage from '@/features/programs/ProgramRegisterPage';
import ProgramFormPage from '@/features/programs/ProgramFormPage';
import ProgramManagePage from '@/features/programs/ProgramManagePage';

// FE-05: Mentoring — phía Học viên (/mentoring/*): tìm Mentor, gửi & theo dõi yêu cầu đã gửi
import MentorAiSearchPage from '@/features/mentoring/MentorAiSearchPage';
import MentorBrowsePage from '@/features/mentoring/MentorBrowsePage';
import MentoringPostDetailPage from '@/features/mentoring/MentoringPostDetailPage';
import MyMentoringRequestsPage from '@/features/mentoring/MyMentoringRequestsPage';
import MentoringFeedPage from '@/features/mentoring/MentoringFeedPage';

// FE-05: Mentoring Application Flow (MR0 - MR3)
import MentorApplyIntroPage from '@/features/mentor/MentorApplyIntroPage';
import MentorApplyFormPage from '@/features/mentor/MentorApplyFormPage';
import MentorApplyReviewPage from '@/features/mentor/MentorApplyReviewPage';

// FE-05: Mentoring — phía Mentor (/mentor/*, Mentor Center): nhận & phản hồi yêu cầu
import MentorCenterShell from '@/features/mentor/MentorCenterShell';
import MentorProfilePage from '@/features/mentor/MentorProfilePage';
import MentorPostsPage from '@/features/mentor/MentorPostsPage';
import MentorRequestsPage from '@/features/mentor/MentorRequestsPage';

// Admin Portal
import AdminDashboardPage from '@/features/admin/AdminDashboardPage';
import AdminUsersPage from '@/features/admin/AdminUsersPage';
import AdminUserDetailPage from '@/features/admin/AdminUserDetailPage';
import ModerationPage from '@/features/admin/ModerationPage';
import AdminClubsPage from '@/features/admin/AdminClubsPage';
import AdminProgramsPage from '@/features/admin/AdminProgramsPage';
import AdminMentorApplicationsPage from '@/features/admin/AdminMentorApplicationsPage';
import AdminMentorApplicationDetailPage from '@/features/admin/AdminMentorApplicationDetailPage';
import MasterDataPage from '@/features/admin/MasterDataPage';
import SystemSettingsPage from '@/features/admin/SystemSettingsPage';
import AdminManagementPage from '@/features/admin/AdminManagementPage';
import AuditLogsPage from '@/features/admin/AuditLogsPage';

// Dev / Showcase
import KitchenSinkPage from '@/features/dev/KitchenSinkPage';

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
      { path: 'programs/:id', element: <ProgramDetailPage /> },
      { path: 'programs/new', element: <ProgramFormPage /> },
      { path: 'programs/:id/edit', element: <ProgramFormPage /> },
      { path: 'programs/:id/register', element: <ProgramRegisterPage /> },
      { path: 'programs/manage/:id', element: <ProgramManagePage /> },

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
      <ProtectedRoute requireRoles={['super_admin', 'system_admin', 'manager', 'SuperAdmin', 'SystemAdmin', 'Manager']}>
        <AdminShell />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <AdminDashboardPage /> },
      // Quản lý người dùng, cấu hình, phân quyền, nhật ký: chỉ System Admin (Manager → /403)
      { path: 'users', element: <SystemAdminOnly><AdminUsersPage /></SystemAdminOnly> },
      { path: 'users/:id', element: <SystemAdminOnly><AdminUserDetailPage /></SystemAdminOnly> },
      { path: 'moderation', element: <ModerationPage /> },
      { path: 'clubs', element: <AdminClubsPage /> },
      { path: 'programs', element: <AdminProgramsPage /> },
      { path: 'mentor-applications', element: <AdminMentorApplicationsPage /> },
      { path: 'mentor-applications/:id', element: <AdminMentorApplicationDetailPage /> },
      { path: 'master-data', element: <MasterDataPage /> },
      { path: 'settings', element: <SystemAdminOnly><SystemSettingsPage /></SystemAdminOnly> },
      { path: 'admins', element: <SystemAdminOnly><AdminManagementPage /></SystemAdminOnly> },
      { path: 'audit-logs', element: <SystemAdminOnly><AuditLogsPage /></SystemAdminOnly> },
    ],
  },

  // Error Routes
  { path: '/403', element: <ErrorPage code={403} /> },
  { path: '/404', element: <ErrorPage code={404} /> },
  { path: '/500', element: <ErrorPage code={500} /> },
  { path: '*', element: <ErrorPage code={404} /> },
]);

export default router;
