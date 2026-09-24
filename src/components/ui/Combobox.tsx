import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/cn';
import { Search, ChevronDown, Check } from 'lucide-react';

export interface ComboboxOption {
  value: string;
  label: string;
  description?: string;
}

export interface ComboboxProps {
  options: ComboboxOption[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  error?: boolean;
  disabled?: boolean;
  className?: string;
}

export const Combobox: React.FC<ComboboxProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Chọn một mục...',
  searchPlaceholder = 'Tìm kiếm...',
  emptyText = 'Không tìm thấy kết quả',
  error,
  disabled,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(
    (o) =>
      o.label.toLowerCase().includes(query.toLowerCase()) ||
      (o.description && o.description.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={cn(
          'flex h-10 w-full items-center justify-between rounded-sm border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 focus-visible:border-brand-500 disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:opacity-75 transition-colors text-left',
          !selectedOption && 'text-neutral-400',
          error && 'border-[#dc3c33] focus-visible:ring-[#dc3c33]/30 focus-visible:border-[#dc3c33]'
        )}
      >
        <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown className="text-neutral-400 shrink-0 ml-2" size={16} />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-neutral-200 bg-white p-1 shadow-lg">
          <div className="flex items-center border-b border-neutral-100 px-2 pb-1.5 pt-1">
            <Search size={14} className="text-neutral-400 mr-2 shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              autoFocus
              className="w-full text-xs text-neutral-900 placeholder:text-neutral-400 outline-none bg-transparent"
            />
          </div>
          <div className="max-h-56 overflow-y-auto py-1">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-center text-xs text-neutral-400">{emptyText}</div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                      setQuery('');
                    }}
                    className={cn(
                      'flex w-full items-center justify-between rounded-sm px-2.5 py-1.5 text-xs text-neutral-700 hover:bg-neutral-100 transition-colors text-left',
                      isSelected && 'bg-brand-50 text-brand-700 font-medium'
                    )}
                  >
                    <div>
                      <div>{opt.label}</div>
                      {opt.description && <div className="text-[11px] text-neutral-400">{opt.description}</div>}
                    </div>
                    {isSelected && <Check size={14} className="text-brand-600 shrink-0 ml-2" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
