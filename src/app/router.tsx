import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';

// Layouts
import { AuthLayout } from './layouts/AuthLayout';
import { AppShell } from './layouts/AppShell';
import { PublicOrAuthRoute } from './layouts/PublicOrAuthRoute';
import { AdminShell } from './layouts/AdminShell';
import { ProtectedRoute } from './ProtectedRoute';

// Public & Auth Pages
import GuestHomePage from '@/features/guest/GuestHomePage';
import LoginPage from '@/features/auth/LoginPage';
import RegisterPage from '@/features/auth/RegisterPage';
import VerifyEmailPage from '@/features/auth/VerifyEmailPage';
import ForgotPasswordPage from '@/features/auth/ForgotPasswordPage';
import OnboardingPage from '@/features/auth/OnboardingPage';
import TermsPage from '@/features/legal/TermsPage';
import PrivacyPage from '@/features/legal/PrivacyPage';
import HelpPage from '@/features/help/HelpPage';

// Common & Global Navigation Pages
import DashboardPage from '@/features/common/DashboardPage';
import SearchPage from '@/features/search/SearchPage';
import OpportunitiesPage from '@/features/opportunities/OpportunitiesPage';
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
import SwapNewPage from '@/features/swap/SwapNewPage';
import SwapDetailPage from '@/features/swap/SwapDetailPage';
import SwapMatchPage from '@/features/swap/SwapMatchPage';
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

// FE-05: Mentoring (Student)
import MentoringHomePage from '@/features/mentoring/MentoringHomePage';
import MentorAiSearchPage from '@/features/mentoring/MentorAiSearchPage';
import MentorBrowsePage from '@/features/mentoring/MentorBrowsePage';
import MentorDetailPage from '@/features/mentoring/MentorDetailPage';
import MentoringPostDetailPage from '@/features/mentoring/MentoringPostDetailPage';
import MyMentoringRequestsPage from '@/features/mentoring/MyMentoringRequestsPage';

// FE-05: Mentoring Application Flow (MR0 - MR3)
import MentorApplyIntroPage from '@/features/mentor/MentorApplyIntroPage';
import MentorApplyFormPage from '@/features/mentor/MentorApplyFormPage';
import MentorApplyReviewPage from '@/features/mentor/MentorApplyReviewPage';

// FE-05: Mentoring (Mentor Center)
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
  // Public Landing & Legal Routes
  { path: '/welcome', element: <GuestHomePage /> },
  { path: '/terms', element: <TermsPage /> },
  { path: '/privacy', element: <PrivacyPage /> },

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

  // Public-Previewable Routes (AppShell variant="guest" when unauthenticated, AppShell variant="member" when logged in)
  {
    element: <PublicOrAuthRoute />,
    children: [
      { path: '/knowledge', element: <KnowledgeHubPage /> },
      { path: '/knowledge/:id', element: <KnowledgePostDetailPage /> },
      { path: '/clubs', element: <ClubsExplorePage /> },
      { path: '/clubs/:id', element: <ClubProfilePage /> },
      { path: '/clubs/opportunities/:oppId', element: <ClubOpportunityDetailPage /> },
      { path: '/opportunities/:oppId', element: <ClubOpportunityDetailPage /> },
      { path: '/programs', element: <ProgramsExplorePage /> },
      { path: '/programs/:id', element: <ProgramDetailPage /> },
      { path: '/help', element: <HelpPage /> },
    ],
  },

  // Main App Routes (AppShell) — Protected (shows AppShell variant="guest" + EmptyState Lock for guests)
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'search', element: <SearchPage /> },
      { path: 'discover', element: <Navigate to="/knowledge" replace /> },
      { path: 'me', element: <Navigate to="/requests" replace /> },
      { path: 'requests', element: <RequestsPage /> },
      { path: 'opportunities', element: <OpportunitiesPage /> },
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
      { path: 'swap/new', element: <SwapNewPage /> },
      { path: 'swap/:id', element: <SwapDetailPage /> },
      { path: 'swap/:id/match', element: <SwapMatchPage /> },
      { path: 'swap/connections', element: <SwapConnectionsPage /> },

      // FE-02: Knowledge (Protected actions & redirects)
      { path: 'knowledge/new', element: <Navigate to="/knowledge" replace /> },
      { path: 'knowledge/:id/edit', element: <Navigate to="/knowledge" replace /> },
      { path: 'knowledge/me', element: <MyPostsPage /> },

      // FE-03: Groups
      { path: 'groups', element: <GroupsFindPage /> },
      { path: 'groups/new', element: <GroupFormPage /> },
      { path: 'groups/:id', element: <GroupDetailPage /> },
      { path: 'groups/me', element: <MyGroupsPage /> },
      { path: 'groups/:id/manage', element: <GroupManagePage /> },

      // FE-04: Club Connection (Protected actions & Representative Manage)
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

      // FE-06: Community Program Registration (Protected actions & Organizer Manage)
      { path: 'programs/new', element: <ProgramFormPage /> },
      { path: 'programs/:id/edit', element: <ProgramFormPage /> },
      { path: 'programs/:id/register', element: <ProgramRegisterPage /> },
      { path: 'programs/manage/:id', element: <ProgramManagePage /> },

      // FE-05: Mentoring (Student)
      { path: 'mentoring', element: <MentoringHomePage /> },
      { path: 'mentoring/ai', element: <MentorAiSearchPage /> },
      { path: 'mentoring/browse', element: <MentorBrowsePage /> },
      { path: 'mentoring/mentors/:id', element: <MentorDetailPage /> },
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
          <ProtectedRoute requireRoles={['mentor', 'Mentor']}>
            <MentorCenterShell />
          </ProtectedRoute>
        ),
        children: [
          { index: true, element: <Navigate to="profile" replace /> },
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
      <ProtectedRoute requireRoles={['system_admin', 'school_admin', 'SystemAdmin', 'SchoolAdmin']}>
        <AdminShell />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <AdminDashboardPage /> },
      { path: 'users', element: <AdminUsersPage /> },
      { path: 'users/:id', element: <AdminUserDetailPage /> },
      { path: 'moderation', element: <ModerationPage /> },
      { path: 'clubs', element: <AdminClubsPage /> },
      { path: 'programs', element: <AdminProgramsPage /> },
      { path: 'mentor-applications', element: <AdminMentorApplicationsPage /> },
      { path: 'mentor-applications/:id', element: <AdminMentorApplicationDetailPage /> },
      { path: 'master-data', element: <MasterDataPage /> },
      { path: 'settings', element: <SystemSettingsPage /> },
      { path: 'admins', element: <AdminManagementPage /> },
      { path: 'audit-logs', element: <AuditLogsPage /> },
    ],
  },

  // Error Routes
  { path: '/403', element: <ErrorPage code={403} /> },
  { path: '/404', element: <ErrorPage code={404} /> },
  { path: '/500', element: <ErrorPage code={500} /> },
  { path: '*', element: <ErrorPage code={404} /> },
]);

export default router;
