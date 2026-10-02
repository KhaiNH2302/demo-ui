import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { Select } from '@/components/ui/Select';
import { TimeInput24 } from './TimeInput24';
import type { ScheduleSlot } from '@/types/entities';

const dayOptions = [
  { value: 'Mon', label: 'Thứ 2' },
  { value: 'Tue', label: 'Thứ 3' },
  { value: 'Wed', label: 'Thứ 4' },
  { value: 'Thu', label: 'Thứ 5' },
  { value: 'Fri', label: 'Thứ 6' },
  { value: 'Sat', label: 'Thứ 7' },
  { value: 'Sun', label: 'Chủ nhật' },
];

export interface ScheduleInputProps {
  value?: ScheduleSlot[];
  onChange: (slots: ScheduleSlot[]) => void;
  error?: string;
  disabled?: boolean;
}

export const ScheduleInput: React.FC<ScheduleInputProps> = ({
  value = [],
  onChange,
  error,
  disabled = false,
}) => {
  const addSlot = () => {
    onChange([...value, { day: 'Mon', start: '07:30', end: '09:50' }]);
  };

  const removeSlot = (index: number) => {
    const updated = value.filter((_, i) => i !== index);
    onChange(updated);
  };

  const updateSlot = (index: number, partial: Partial<ScheduleSlot>) => {
    const updated = value.map((slot, i) => (i === index ? { ...slot, ...partial } : slot));
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      {value.map((slot, idx) => {
        const isTimeInvalid = slot.start >= slot.end;
        return (
          <div key={idx} className="flex flex-col gap-1">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="w-32">
                <Select
                  options={dayOptions}
                  value={slot.day}
                  disabled={disabled}
                  onValueChange={(val) => updateSlot(idx, { day: val as ScheduleSlot['day'] })}
                />
              </div>
              <div className="w-28">
                <TimeInput24
                  value={slot.start}
                  disabled={disabled}
                  onChange={(val) => updateSlot(idx, { start: val })}
                />
              </div>
              <span className="text-neutral-400 text-xs">đến</span>
              <div className="w-28">
                <TimeInput24
                  value={slot.end}
                  disabled={disabled}
                  onChange={(val) => updateSlot(idx, { end: val })}
                />
              </div>
              {!disabled && (
                <IconButton
                  variant="ghost"
                  size="sm"
                  aria-label="Xóa khung giờ"
                  onClick={() => removeSlot(idx)}
                  className="text-neutral-400 hover:text-tier-danger-fg"
                >
                  <Trash2 size={16} />
                </IconButton>
              )}
            </div>
            {isTimeInvalid && (
              <span className="text-[11px] text-tier-danger-fg">
                Giờ bắt đầu phải trước giờ kết thúc
              </span>
            )}
          </div>
        );
      })}

      {!disabled && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          leftIcon={<Plus size={14} />}
          onClick={addSlot}
        >
          Thêm khung giờ
        </Button>
      )}

      {error && <p className="text-[11px] text-[#b3261e]">{error}</p>}
    </div>
  );
};
