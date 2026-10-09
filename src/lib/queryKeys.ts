export const queryKeys = {
  auth: {
    me: ['auth', 'me'] as const,
  },
  profile: {
    me: ['profile', 'me'] as const,
    user: (id: string) => ['profile', 'user', id] as const,
  },
  dashboard: {
    summary: ['dashboard', 'summary'] as const,
  },
  notifications: {
    list: (params?: { read?: boolean; source?: string }) =>
      params === undefined ? ['notifications', 'list'] as const : ['notifications', 'list', params] as const,
    unreadCount: ['notifications', 'unreadCount'] as const,
  },
  chat: {
    conversations: ['chat', 'conversations'] as const,
    conversation: (id: string) => ['chat', 'conversation', id] as const,
    messages: (conversationId: string) => ['chat', 'messages', conversationId] as const,
  },
  swap: {
    list: (status?: string) => ['swap', 'list', status] as const,
    detail: (id: string) => ['swap', 'detail', id] as const,
    matches: (id: string, mode: 'direct' | 'ai') => ['swap', 'matches', id, mode] as const,
    connections: (params?: { direction?: 'incoming' | 'outgoing'; requestId?: string }) =>
      params === undefined ? ['swap', 'connections'] as const : ['swap', 'connections', params] as const,
  },
  knowledge: {
    feed: (filters?: Record<string, unknown>) => ['knowledge', 'feed', filters] as const,
    detail: (id: string) => ['knowledge', 'detail', id] as const,
    myPosts: ['knowledge', 'myPosts'] as const,
  },
  groups: {
    list: ['groups', 'list'] as const,
    mine: (role?: 'owner' | 'member') => ['groups', 'mine', role] as const,
    myJoinRequests: ['groups', 'myJoinRequests'] as const,
    detail: (id: string) => ['groups', 'detail', id] as const,
    joinRequests: (groupId: string) => ['groups', 'joinRequests', groupId] as const,
    suggestedMembers: (groupId: string) => ['groups', 'suggestedMembers', groupId] as const,
  },
  clubs: {
    list: (filters?: { field?: string; q?: string }) => ['clubs', 'list', filters] as const,
    detail: (id: string) => ['clubs', 'detail', id] as const,
    events: (clubId: string, status?: string) => ['clubs', clubId, 'events', status] as const,
    members: (clubId: string) => ['clubs', clubId, 'members'] as const,
    myApplications: ['clubs', 'myApplications'] as const,
    recruitments: (clubId: string, status?: string) => ['clubs', clubId, 'recruitments', status] as const,
    workspace: {
      summary: (clubId: string) => ['clubs', clubId, 'workspace', 'summary'] as const,
      events: (clubId: string, status?: string) => ['clubs', clubId, 'workspace', 'events', status] as const,
      eventDetail: (clubId: string, eventId: string) => ['clubs', clubId, 'workspace', 'events', eventId] as const,
      tasks: (clubId: string, params?: { eventId?: string; assigneeId?: string }) =>
        ['clubs', clubId, 'workspace', 'tasks', params] as const,
      chatMessages: (clubId: string) => ['clubs', clubId, 'workspace', 'chat', 'messages'] as const,
      members: (clubId: string) => ['clubs', clubId, 'workspace', 'members'] as const,
      applications: (clubId: string, recruitmentId: string) =>
        ['clubs', clubId, 'workspace', 'applications', recruitmentId] as const,
      financeSummary: (clubId: string) => ['clubs', clubId, 'workspace', 'finance', 'summary'] as const,
      transactions: (clubId: string, filters?: Record<string, unknown>) =>
        ['clubs', clubId, 'workspace', 'finance', 'transactions', filters] as const,
      expenses: (clubId: string) => ['clubs', clubId, 'workspace', 'finance', 'expenses'] as const,
      reconciliations: (clubId: string) => ['clubs', clubId, 'workspace', 'finance', 'reconciliations'] as const,
    },
  },
  mentoring: {
    mentors: (filters?: Record<string, unknown>) => ['mentoring', 'mentors', filters] as const,
    posts: (filters?: Record<string, unknown>) => ['mentoring', 'posts', filters] as const,
    mentorDetail: (id: string) => ['mentoring', 'mentor', id] as const,
    postDetail: (id: string) => ['mentoring', 'post', id] as const,
    myRequests: ['mentoring', 'myRequests'] as const,
    mentorCenter: {
      profile: ['mentoring', 'mentorCenter', 'profile'] as const,
      posts: ['mentoring', 'mentorCenter', 'posts'] as const,
      requests: (status?: string) => ['mentoring', 'mentorCenter', 'requests', status] as const,
    },
  },
  admin: {
    dashboard: ['admin', 'dashboard'] as const,
    users: (filters?: Record<string, unknown>) => ['admin', 'users', filters] as const,
    userDetail: (id: string) => ['admin', 'user', id] as const,
    moderationPosts: ['admin', 'moderation', 'posts'] as const,
    moderationReports: ['admin', 'moderation', 'reports'] as const,
    clubs: (status?: string) => ['admin', 'clubs', status] as const,
    masterData: {
      courseOfferings: ['admin', 'masterData', 'courseOfferings'] as const,
      tags: ['admin', 'masterData', 'tags'] as const,
    },
    settings: ['admin', 'settings'] as const,
    admins: ['admin', 'admins'] as const,
    auditLogs: (filters?: Record<string, unknown>) => ['admin', 'auditLogs', filters] as const,
  },
};
