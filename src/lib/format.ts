import { format, isValid, parseISO, isSameYear } from 'date-fns';
import { vi } from 'date-fns/locale';

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN').format(amount) + ' ₫';
}

export function formatCompactNumber(value: number): string {
  if (value < 1000) return String(value);
  if (value < 1000000) {
    const k = value / 1000;
    const rounded = Math.round(k * 10) / 10;
    return `${String(rounded).replace('.', ',')}K`;
  }
  const m = value / 1000000;
  const rounded = Math.round(m * 10) / 10;
  return `${String(rounded).replace('.', ',')}M`;
}

/**
 * Chuẩn hiển thị thời gian theo 05-social-patterns.md § 1.5:
 * < 1 phút: "Vừa xong"
 * 1–59 phút: "5 phút"
 * 1–23 giờ: "2 giờ"
 * Hôm qua: "Hôm qua"
 * 2–6 ngày: "T2".."CN"
 * Trong cùng năm: "12/09"
 * Khác năm: "12/09/2025"
 */
export function formatRelativeTime(dateInput: string | Date): string {
  try {
    const date = typeof dateInput === 'string' ? parseISO(dateInput) : dateInput;
    if (!isValid(date)) return String(dateInput);

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMinutes < 1) return 'Vừa xong';
    if (diffMinutes < 60) return `${diffMinutes} phút`;
    if (diffHours < 24) return `${diffHours} giờ`;
    if (diffDays === 1) return 'Hôm qua';
    if (diffDays >= 2 && diffDays <= 6) {
      const dayOfWeek = date.getDay(); // 0 = CN, 1 = T2, ...
      return dayOfWeek === 0 ? 'CN' : `T${dayOfWeek + 1}`;
    }
    if (isSameYear(date, now)) {
      return format(date, 'dd/MM', { locale: vi });
    }
    return format(date, 'dd/MM/yyyy', { locale: vi });
  } catch {
    return String(dateInput);
  }
}

export function formatDeadline(dateInput?: string | Date | null): {
  label: string;
  isUrgent: boolean;
  isExpired: boolean;
} {
  if (!dateInput) {
    return { label: 'Chưa đặt hạn', isUrgent: false, isExpired: false };
  }
  try {
    const date = typeof dateInput === 'string' ? parseISO(dateInput) : dateInput;
    if (!isValid(date)) return { label: String(dateInput), isUrgent: false, isExpired: false };
    const diffMs = date.getTime() - Date.now();
    if (diffMs <= 0) {
      return { label: 'Đã đóng đơn', isUrgent: false, isExpired: true };
    }
    const diffDays = Math.ceil(diffMs / 86400000);
    if (diffDays <= 3) {
      return { label: `Hạn chót: còn ${diffDays} ngày`, isUrgent: true, isExpired: false };
    }
    return {
      label: `Hạn: ${format(date, 'dd/MM', { locale: vi })}`,
      isUrgent: false,
      isExpired: false,
    };
  } catch {
    return { label: String(dateInput), isUrgent: false, isExpired: false };
  }
}

export function formatDateRange(startInput?: string | Date | null, endInput?: string | Date | null): string {
  if (!startInput) return '';
  try {
    const start = typeof startInput === 'string' ? parseISO(startInput) : startInput;
    if (!isValid(start)) return String(startInput);
    const dayStr = format(start, 'EEE, dd/MM/yyyy', { locale: vi });
    const startTime = format(start, 'HH:mm', { locale: vi });
    if (!endInput) {
      return `${dayStr} · ${startTime}`;
    }
    const end = typeof endInput === 'string' ? parseISO(endInput) : endInput;
    if (!isValid(end)) return `${dayStr} · ${startTime}`;
    const endTime = format(end, 'HH:mm', { locale: vi });
    return `${dayStr} · ${startTime}–${endTime}`;
  } catch {
    return String(startInput);
  }
}

export function formatDate(dateInput: string | Date, pattern = 'dd/MM/yyyy'): string {
  try {
    const date = typeof dateInput === 'string' ? parseISO(dateInput) : dateInput;
    if (!isValid(date)) return String(dateInput);
    return format(date, pattern, { locale: vi });
  } catch {
    return String(dateInput);
  }
}

export function formatDateTime(dateInput: string | Date): string {
  return formatDate(dateInput, 'dd/MM/yyyy HH:mm');
}

export function maskStudentCode(code?: string): string {
  if (!code || code.length < 5) return code || 'N/A';
  return `${code.slice(0, 2)}***${code.slice(-2)}`;
}

export function maskEmail(email?: string): string {
  if (!email || !email.includes('@')) return email || 'N/A';
  const [local, domain] = email.split('@');
  if (local.length <= 2) return `${local[0]}***@${domain}`;
  return `${local.slice(0, 2)}***${local.slice(-1)}@${domain}`;
}

export function truncate(str: string, maxLength: number): string {
  if (!str) return '';
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + '…';
}

export function getInitials(name?: string): string {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function calculateReliabilityScore(completed: number, cancelled: number): number | null {
  const total = completed + cancelled;
  if (total === 0) return null;
  return Math.round((completed / total) * 100);
}

const DAY_LABELS: Record<string, string> = {
  Mon: 'Thứ 2',
  Tue: 'Thứ 3',
  Wed: 'Thứ 4',
  Thu: 'Thứ 5',
  Fri: 'Thứ 6',
  Sat: 'Thứ 7',
  Sun: 'Chủ nhật',
};

export function formatScheduleSlot(slot: { day: string; start: string; end: string } | string): string {
  if (typeof slot === 'string') return slot;
  const dayLabel = DAY_LABELS[slot.day] || slot.day;
  return `${dayLabel} (${slot.start} – ${slot.end})`;
}
