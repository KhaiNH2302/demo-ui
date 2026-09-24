import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import type { ScheduleSlot } from '@/types/entities';

export function formatDate(iso?: string): string {
  if (!iso) return '';
  try {
    const d = typeof iso === 'string' ? parseISO(iso) : new Date(iso);
    return format(d, 'dd/MM/yyyy');
  } catch {
    return iso;
  }
}

export function formatDateTime(iso?: string): string {
  if (!iso) return '';
  try {
    const d = typeof iso === 'string' ? parseISO(iso) : new Date(iso);
    return format(d, 'dd/MM/yyyy HH:mm');
  } catch {
    return iso;
  }
}

export function formatRelativeTime(iso?: string): string {
  if (!iso) return '';
  try {
    const d = typeof iso === 'string' ? parseISO(iso) : new Date(iso);
    return formatDistanceToNow(d, { addSuffix: true, locale: vi });
  } catch {
    return iso;
  }
}

export function formatCurrencyVnd(amount?: number): string {
  if (amount === undefined || amount === null) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

export const formatVND = formatCurrencyVnd;
export const formatCurrency = formatCurrencyVnd;

const dayMap: Record<ScheduleSlot['day'], string> = {
  Mon: 'Thứ 2',
  Tue: 'Thứ 3',
  Wed: 'Thứ 4',
  Thu: 'Thứ 5',
  Fri: 'Thứ 6',
  Sat: 'Thứ 7',
  Sun: 'Chủ nhật',
};

export function formatScheduleSlot(slot: ScheduleSlot): string {
  const dayName = dayMap[slot.day] || slot.day;
  return `${dayName}, ${slot.start}–${slot.end}`;
}
