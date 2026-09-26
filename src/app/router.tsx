import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';

// Layouts
import { AuthLayout } from './layouts/AuthLayout';
import { AppShell } from './layouts/AppShell';
import { ClubWorkspaceShell } from './layouts/ClubWorkspaceShell';
import { AdminShell } from './layouts/AdminShell';
import { ProtectedRoute } from './ProtectedRoute';

// Public & Auth Pages
import LandingPage from '@/features/landing/LandingPage';
import LoginPage from '@/features/auth/LoginPage';
import RegisterPage from '@/features/auth/RegisterPage';
import VerifyEmailPage from '@/features/auth/VerifyEmailPage';
import ForgotPasswordPage from '@/features/auth/ForgotPasswordPage';
import OnboardingPage from '@/features/auth/OnboardingPage';
import TermsPage from '@/features/legal/TermsPage';
import PrivacyPage from '@/features/legal/PrivacyPage';
import HelpPage from '@/features/help/HelpPage';

// Common & Global Navigation Pages (26/09/2026 specs)
import DashboardPage from '@/features/common/DashboardPage';
import SearchPage from '@/features/search/SearchPage';
import OpportunitiesPage from '@/features/opportunities/OpportunitiesPage';
import EventsPage from '@/features/events/EventsPage';
import EventDetailPage from '@/features/events/EventDetailPage';
import PeoplePage from '@/features/people/PeoplePage';
import RequestsPage from '@/features/requests/RequestsPage';
import SettingsPage from '@/features/settings/SettingsPage';
import ErrorPage from '@/features/common/ErrorPage';

// Profile
import ProfilePage from '@/features/profile/ProfilePage';
import PublicProfilePage from '@/features/profile/PublicProfilePage';

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
import KnowledgePostFormPage from '@/features/knowledge/KnowledgePostFormPage';
import KnowledgePostDetailPage from '@/features/knowledge/KnowledgePostDetailPage';
import MyPostsPage from '@/features/knowledge/MyPostsPage';

// FE-03: Group Finding
import GroupsFindPage from '@/features/groups/GroupsFindPage';
import GroupFormPage from '@/features/groups/GroupFormPage';
import GroupDetailPage from '@/features/groups/GroupDetailPage';
import MyGroupsPage from '@/features/groups/MyGroupsPage';
import GroupManagePage from '@/features/groups/GroupManagePage';

// FE-04: Clubs
import ClubsListPage from '@/features/clubs/ClubsListPage';
import ClubProfilePage from '@/features/clubs/ClubProfilePage';
import ClubApplicationFormPage from '@/features/clubs/ClubApplicationFormPage';
import MyApplicationsPage from '@/features/clubs/MyApplicationsPage';
import RegisterClubPage from '@/features/clubs/RegisterClubPage';

// FE-04: Club Workspace
import ClubOverviewPage from '@/features/clubs/workspace/OverviewPage';
import ClubEventsPage from '@/features/clubs/workspace/EventsPage';
import ClubEventDetailPage from '@/features/clubs/workspace/EventDetailPage';
import ClubEventFormPage from '@/features/clubs/workspace/EventFormPage';
import ClubTasksPage from '@/features/clubs/workspace/TasksPage';
import ClubChatPage from '@/features/clubs/workspace/ClubChatPage';
import ClubMembersPage from '@/features/clubs/workspace/MembersPage';
import ClubRecruitmentsPage from '@/features/clubs/workspace/RecruitmentsPage';
import ClubRecruitmentApplicationsPage from '@/features/clubs/workspace/RecruitmentApplicationsPage';
import ClubFinanceOverviewPage from '@/features/clubs/workspace/FinanceOverviewPage';
import ClubTransactionsPage from '@/features/clubs/workspace/TransactionsPage';
import ClubExpensesPage from '@/features/clubs/workspace/ExpensesPage';
import ClubReconciliationPage from '@/features/clubs/workspace/ReconciliationPage';
import ClubSettingsPage from '@/features/clubs/workspace/SettingsPage';

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

// FE-06: Admin Portal
import AdminDashboardPage from '@/features/admin/AdminDashboardPage';
import AdminUsersPage from '@/features/admin/AdminUsersPage';
import AdminUserDetailPage from '@/features/admin/AdminUserDetailPage';
import ModerationPage from '@/features/admin/ModerationPage';
import AdminClubsPage from '@/features/admin/AdminClubsPage';
import AdminMentorApplicationsPage from '@/features/admin/AdminMentorApplicationsPage';
import AdminMentorApplicationDetailPage from '@/features/admin/AdminMentorApplicationDetailPage';
import MasterDataPage from '@/features/admin/MasterDataPage';
import SystemSettingsPage from '@/features/admin/SystemSettingsPage';
import AdminManagementPage from '@/features/admin/AdminManagementPage';
import AuditLogsPage from '@/features/admin/AuditLogsPage';

// Dev / Showcase
import KitchenSinkPage from '@/features/dev/KitchenSinkPage';

export const router = createBrowserRouter([
  // Public Landing & Legal Routes (Accessible without login)
  { path: '/welcome', element: <LandingPage /> },
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

  // Main App Routes (AppShell) — Protected
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
      { path: 'events/:id', element: <EventDetailPage /> },
      { path: 'people', element: <PeoplePage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: 'help', element: <HelpPage /> },
      { path: 'profile/me', element: <ProfilePage /> },
      { path: 'users/:id', element: <PublicProfilePage /> },
      { path: 'notifications', element: <NotificationsPage /> },
      { path: 'chats', element: <ChatsPage /> },
      { path: 'chats/:id', element: <ChatsPage /> },

      // FE-01: Swap
      { path: 'swap', element: <SwapListPage /> },
      { path: 'swap/new', element: <SwapNewPage /> },
      { path: 'swap/:id', element: <SwapDetailPage /> },
      { path: 'swap/:id/match', element: <SwapMatchPage /> },
      { path: 'swap/connections', element: <SwapConnectionsPage /> },

      // FE-02: Knowledge
      { path: 'knowledge', element: <KnowledgeHubPage /> },
      { path: 'knowledge/new', element: <KnowledgePostFormPage /> },
      { path: 'knowledge/:id', element: <KnowledgePostDetailPage /> },
      { path: 'knowledge/:id/edit', element: <KnowledgePostFormPage /> },
      { path: 'knowledge/me', element: <MyPostsPage /> },

      // FE-03: Groups
      { path: 'groups', element: <GroupsFindPage /> },
      { path: 'groups/new', element: <GroupFormPage /> },
      { path: 'groups/:id', element: <GroupDetailPage /> },
      { path: 'groups/me', element: <MyGroupsPage /> },
      { path: 'groups/:id/manage', element: <GroupManagePage /> },

      // FE-04: Clubs (Discovery & Applications)
      { path: 'clubs', element: <ClubsListPage /> },
      { path: 'clubs/register', element: <RegisterClubPage /> },
      { path: 'clubs/:id', element: <ClubProfilePage /> },
      { path: 'clubs/:id/apply', element: <ClubApplicationFormPage /> },
      { path: 'applications', element: <MyApplicationsPage /> },

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

      // FE-05: Mentoring (Mentor Center) — Nested in MentorCenterShell (Only for approved mentors)
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

      // FE-04: Club Workspace (ClubWorkspaceShell) — Nested in AppShell
      {
        path: 'clubs/:clubId/workspace',
        element: <ClubWorkspaceShell />,
        children: [
          { index: true, element: <Navigate to="overview" replace /> },
          { path: 'overview', element: <ClubOverviewPage /> },
          { path: 'events', element: <ClubEventsPage /> },
          { path: 'events/new', element: <ClubEventFormPage /> },
          { path: 'events/:eventId', element: <ClubEventDetailPage /> },
          { path: 'events/:eventId/edit', element: <ClubEventFormPage /> },
          { path: 'tasks', element: <ClubTasksPage /> },
          { path: 'chat', element: <ClubChatPage /> },
          { path: 'members', element: <ClubMembersPage /> },
          { path: 'recruitments', element: <ClubRecruitmentsPage /> },
          { path: 'recruitments/:rid/applications', element: <ClubRecruitmentApplicationsPage /> },
          { path: 'finance', element: <ClubFinanceOverviewPage /> },
          { path: 'finance/transactions', element: <ClubTransactionsPage /> },
          { path: 'finance/expenses', element: <ClubExpensesPage /> },
          { path: 'finance/reconciliation', element: <ClubReconciliationPage /> },
          { path: 'settings', element: <ClubSettingsPage /> },
        ],
      },

      // Dev Showcase
      { path: 'dev/kitchen-sink', element: <KitchenSinkPage /> },
    ],
  },

  // FE-06: Admin Portal (AdminShell)
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
