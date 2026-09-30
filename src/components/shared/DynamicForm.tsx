import React from 'react';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import type { FormQuestion } from '@/types/entities';

export interface DynamicFormProps {
  questions: FormQuestion[];
  values: Record<string, string | string[]>;
  onChange?: (questionId: string, value: string | string[]) => void;
  errors?: Record<string, string>;
  readOnly?: boolean;
}

export const DynamicForm: React.FC<DynamicFormProps> = ({
  questions,
  values,
  onChange,
  errors = {},
  readOnly = false,
}) => {
  if (!questions || questions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {questions.map((q, index) => {
        const val = values[q.id];
        const err = errors[q.id];

        return (
          <div key={q.id} className="space-y-1.5">
            <label className="block text-sm font-medium text-neutral-800">
              <span>
                {index + 1}. {q.label || 'Câu hỏi'}
              </span>
              {q.required && !readOnly && (
                <span className="text-tier-danger-text ml-1">*</span>
              )}
            </label>

            {readOnly ? (
              <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-200 text-sm text-neutral-800 whitespace-pre-wrap">
                {Array.isArray(val)
                  ? val.length > 0
                    ? val.join(', ')
                    : '—'
                  : val || '—'}
              </div>
            ) : q.kind === 'short' ? (
              <Input
                value={typeof val === 'string' ? val : ''}
                onChange={(e) => onChange?.(q.id, e.target.value)}
                placeholder="Nhập câu trả lời của bạn..."
              />
            ) : q.kind === 'long' ? (
              <Textarea
                rows={3}
                value={typeof val === 'string' ? val : ''}
                onChange={(e) => onChange?.(q.id, e.target.value)}
                placeholder="Nhập câu trả lời chi tiết..."
              />
            ) : q.kind === 'single' ? (
              <div className="space-y-1.5 pt-0.5">
                {(q.options || []).map((opt) => (
                  <label
                    key={opt}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-neutral-200 hover:bg-neutral-50 cursor-pointer text-sm text-neutral-800"
                  >
                    <input
                      type="radio"
                      name={`q-${q.id}`}
                      checked={val === opt}
                      onChange={() => onChange?.(q.id, opt)}
                      className="text-brand-600 focus:ring-brand-500"
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            ) : (
              <div className="space-y-1.5 pt-0.5">
                {(q.options || []).map((opt) => {
                  const arr = Array.isArray(val) ? val : [];
                  const checked = arr.includes(opt);
                  return (
                    <label
                      key={opt}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-neutral-200 hover:bg-neutral-50 cursor-pointer text-sm text-neutral-800"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          const next = e.target.checked
                            ? [...arr, opt]
                            : arr.filter((item) => item !== opt);
                          onChange?.(q.id, next);
                        }}
                        className="rounded border-neutral-300 text-brand-600 focus:ring-brand-500"
                      />
                      <span>{opt}</span>
                    </label>
                  );
                })}
              </div>
            )}

            {err && <p className="text-caption text-tier-danger-text">{err}</p>}
          </div>
        );
      })}
    </div>
  );
};
