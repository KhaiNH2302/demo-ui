import type { Role, MembershipRole } from '@/types/status';
import type { User } from '@/types/entities';

export interface UserContext {
  user: User | null;
  hasRole: (role: Role) => boolean;
  clubRole: (clubId: string) => MembershipRole | null;
}

export function can(
  ctx: UserContext,
  action: string,
  resource?: { clubId?: string; ownerId?: string; school?: string }
): boolean {
  if (!ctx.user) return false;

  // System admin can do system actions
  if (ctx.hasRole('system_admin')) return true;

  if (action.startsWith('admin:')) {
    if (ctx.hasRole('school_admin')) {
      if (resource?.school && resource.school !== ctx.user.school) {
        return false;
      }
      return true;
    }
    return false;
  }

  if (action.startsWith('club:manager:')) {
    if (!resource?.clubId) return false;
    return ctx.clubRole(resource.clubId) === 'manager';
  }

  if (action.startsWith('club:treasurer:')) {
    if (!resource?.clubId) return false;
    const role = ctx.clubRole(resource.clubId);
    return role === 'treasurer' || role === 'manager';
  }

  if (action.startsWith('club:member:')) {
    if (!resource?.clubId) return false;
    const role = ctx.clubRole(resource.clubId);
    return role === 'member' || role === 'manager' || role === 'treasurer';
  }

  if (action === 'group:owner') {
    return resource?.ownerId === ctx.user.id;
  }

  if (action === 'mentor:center') {
    return ctx.hasRole('mentor');
  }

  return true;
}
