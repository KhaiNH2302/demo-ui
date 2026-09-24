import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { Input, type InputProps } from '@/components/ui/Input';
import { cn } from '@/lib/cn';

export interface SearchInputProps extends Omit<InputProps, 'onChange'> {
  onSearch?: (value: string) => void;
  onChange?: (value: string) => void;
  debounceMs?: number;
  initialValue?: string;
  value?: string;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  onSearch,
  onChange,
  debounceMs = 300,
  initialValue = '',
  value: controlledValue,
  placeholder = 'Tìm kiếm...',
  className,
  ...props
}) => {
  const isControlled = controlledValue !== undefined;
  const [internalValue, setInternalValue] = useState(initialValue);

  const displayValue = isControlled ? controlledValue : internalValue;

  useEffect(() => {
    const handler = setTimeout(() => {
      onSearch?.(displayValue);
    }, debounceMs);

    return () => clearTimeout(handler);
  }, [displayValue, debounceMs, onSearch]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    if (!isControlled) {
      setInternalValue(newVal);
    }
    onChange?.(newVal);
  };

  const handleClear = () => {
    if (!isControlled) {
      setInternalValue('');
    }
    onChange?.('');
    onSearch?.('');
  };

  return (
    <div className={cn('relative w-full', className)}>
      <Input
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder}
        leftIcon={<Search size={16} />}
        rightIcon={
          displayValue ? (
            <button
              type="button"
              onClick={handleClear}
              className="text-neutral-400 hover:text-neutral-600 cursor-pointer"
            >
              <X size={14} />
            </button>
          ) : undefined
        }
        {...props}
      />
    </div>
  );
};
