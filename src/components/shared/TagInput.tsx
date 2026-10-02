import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/cn';

export interface TagInputProps {
  value?: string[];
  tags?: string[];
  onChange: (tags: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
  max?: number;
  className?: string;
}

export const TagInput: React.FC<TagInputProps> = ({
  value,
  tags,
  onChange,
  suggestions = [],
  placeholder = 'Nhập tag và nhấn Enter...',
  max,
  className,
}) => {
  const activeTags = value || tags || [];
  const [inputVal, setInputVal] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(inputVal);
    } else if (e.key === 'Backspace' && !inputVal && activeTags.length > 0) {
      removeTag(activeTags.length - 1);
    }
  };

  const addTag = (tag: string) => {
    const trimmed = tag.trim().replace(/^,+|,+$/g, '');
    if (trimmed && !activeTags.includes(trimmed)) {
      if (!max || activeTags.length < max) {
        onChange([...activeTags, trimmed]);
        setInputVal('');
      }
    }
  };

  const removeTag = (index: number) => {
    onChange(activeTags.filter((_, i) => i !== index));
  };

  const unusedSuggestions = suggestions.filter((s) => !activeTags.includes(s));

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex flex-wrap items-center gap-1.5 min-h-10 w-full rounded-md border border-neutral-300 dark:border-neutral-600 bg-surface px-3 py-1.5 text-sm focus-within:ring-2 focus-within:ring-primary/40 focus-within:border-primary transition-colors">
        {activeTags.map((tag, idx) => (
          <Badge key={idx} tier="neutral" size="sm" className="gap-1 pr-1 bg-neutral-100 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200">
            {tag}
            <button
              type="button"
              onClick={() => removeTag(idx)}
              className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 cursor-pointer"
            >
              <X size={12} />
            </button>
          </Badge>
        ))}
        {(!max || activeTags.length < max) && (
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => inputVal && addTag(inputVal)}
            placeholder={activeTags.length === 0 ? placeholder : ''}
            className="flex-1 min-w-[120px] bg-transparent outline-none text-xs text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400"
          />
        )}
      </div>

      {unusedSuggestions.length > 0 && (
        <div className="flex flex-wrap items-center gap-1 text-[11px] text-neutral-500">
          <span>Gợi ý:</span>
          {unusedSuggestions.slice(0, 6).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => addTag(s)}
              className="rounded bg-neutral-100 dark:bg-neutral-700 px-1.5 py-0.5 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors cursor-pointer"
            >
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
