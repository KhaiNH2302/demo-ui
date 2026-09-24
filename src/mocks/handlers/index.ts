import { authHandlers } from './auth';
import { profileHandlers } from './profile';
import { dashboardHandlers } from './dashboard';
import { notificationHandlers } from './notifications';
import { chatHandlers } from './chat';
import { swapHandlers } from './swap';
import { knowledgeHandlers } from './knowledge';
import { groupHandlers } from './groups';
import { clubHandlers } from './clubs';
import { mentoringHandlers } from './mentoring';
import { adminHandlers } from './admin';

export const handlers = [
  ...authHandlers,
  ...profileHandlers,
  ...dashboardHandlers,
  ...notificationHandlers,
  ...chatHandlers,
  ...swapHandlers,
  ...knowledgeHandlers,
  ...groupHandlers,
  ...clubHandlers,
  ...mentoringHandlers,
  ...adminHandlers,
];
