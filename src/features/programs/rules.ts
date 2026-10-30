import type { ProgramChannel, ProgramRegistration, ClubOpportunity, OpportunityResponse } from '@/types/entities';

export function programRegistrationUnavailable(program: ProgramChannel, existing?: ProgramRegistration | null, slotId?: string, now = Date.now()): string | null {
  if (existing && !['Withdrawn', 'Cancelled'].includes(existing.status)) return 'Bạn đã có đăng ký cho chương trình này.';
  if (program.status !== 'Published') return 'Chương trình không còn mở đăng ký.';
  if (!Number.isFinite(Date.parse(program.registrationDeadline)) || Date.parse(program.registrationDeadline) <= now) return 'Đã hết hạn đăng ký.';
  if (Date.parse(program.startAt) <= now) return 'Chương trình đã bắt đầu.';
  if (!programUnlimited(program) && program.confirmedCount >= program.quota) return 'Chương trình đã hết chỗ.';
  const slots = program.slots || [];
  if (slots.length && slotId !== undefined) {
    const slot = slots.find((item) => item.id === slotId);
    if (!slot) return 'Vui lòng chọn ca tham gia hợp lệ.';
    if (!slot.unlimited && slot.confirmedCount >= slot.quota) return 'Ca đã chọn đã hết chỗ.';
  }
  if (slots.length && slots.every((slot) => !slot.unlimited && slot.confirmedCount >= slot.quota)) return 'Tất cả các ca đã hết chỗ.';
  return null;
}

export function clubRegistrationUnavailable(opportunity: ClubOpportunity, existing?: OpportunityResponse | null, positionId?: string, now = Date.now()): string | null {
  const supplement = existing?.status === 'NeedsMoreInfo';
  if (existing && !['Draft', 'NeedsMoreInfo', 'Withdrawn', 'Cancelled'].includes(existing.status)) return 'Bạn đã có đăng ký cho cơ hội này.';
  if (supplement) {
    if (!['Published', 'Closed'].includes(opportunity.status)) return 'Cơ hội không còn nhận bổ sung.';
    if (Date.parse(opportunity.resultDeadline || opportunity.registrationDeadline) <= now) return 'Đã hết hạn bổ sung và trả kết quả.';
  } else {
    if (opportunity.status !== 'Published') return 'Cơ hội không còn mở đăng ký.';
    if (!Number.isFinite(Date.parse(opportunity.registrationDeadline)) || Date.parse(opportunity.registrationDeadline) <= now) return 'Đã hết hạn đăng ký.';
  }
  if (opportunity.used >= opportunity.quota) return 'Cơ hội đã hết chỉ tiêu.';
  if (opportunity.positions?.length && positionId !== undefined) {
    const position = opportunity.positions.find((item) => item.id === positionId);
    if (!position) return 'Vui lòng chọn vị trí hợp lệ.';
    if (position.registeredCount >= position.quota) return 'Vị trí đã chọn đã hết chỉ tiêu.';
  }
  return null;
}

export function proposalHybridError(p: {mode?: string; offlineQuota?: number; onlineQuota?: number; onlineUnlimited?: boolean}): string | null {
  if (p.mode !== 'Hybrid') return null;
  return !Number.isSafeInteger(p.offlineQuota) || (!p.onlineUnlimited && !Number.isSafeInteger(p.onlineQuota)) || (p.offlineQuota || 0) < 1 || (!p.onlineUnlimited && (p.onlineQuota || 0) < 1) ? 'Nhập số nguyên dương cho cả nhóm trực tiếp và online.' : null;
}

export const programUnlimited = (p: Pick<ProgramChannel, 'mode' | 'onlineUnlimited'>) => p.mode !== 'Offline' && p.onlineUnlimited === true;
