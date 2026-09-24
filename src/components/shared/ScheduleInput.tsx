import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
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
}

export const ScheduleInput: React.FC<ScheduleInputProps> = ({
  value = [],
  onChange,
  error,
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
            <div className="flex items-center gap-2">
              <div className="w-32">
                <Select
                  options={dayOptions}
                  value={slot.day}
                  onValueChange={(val) => updateSlot(idx, { day: val as ScheduleSlot['day'] })}
                />
              </div>
              <div className="w-28">
                <Input
                  type="time"
                  value={slot.start}
                  onChange={(e) => updateSlot(idx, { start: e.target.value })}
                  error={isTimeInvalid}
                />
              </div>
              <span className="text-neutral-400 text-xs">đến</span>
              <div className="w-28">
                <Input
                  type="time"
                  value={slot.end}
                  onChange={(e) => updateSlot(idx, { end: e.target.value })}
                  error={isTimeInvalid}
                />
              </div>
              <IconButton
                variant="ghost"
                size="sm"
                aria-label="Xóa khung giờ"
                onClick={() => removeSlot(idx)}
                className="text-neutral-400 hover:text-[#dc3c33]"
              >
                <Trash2 size={16} />
              </IconButton>
            </div>
            {isTimeInvalid && (
              <span className="text-[11px] text-[#b3261e]">Giờ bắt đầu phải trước giờ kết thúc</span>
            )}
          </div>
        );
      })}

      <Button
        type="button"
        variant="outline"
        size="sm"
        leftIcon={<Plus size={14} />}
        onClick={addSlot}
      >
        Thêm khung giờ
      </Button>

      {error && <p className="text-[11px] text-[#b3261e]">{error}</p>}
    </div>
  );
};
