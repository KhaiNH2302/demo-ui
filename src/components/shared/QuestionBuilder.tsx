import React from 'react';
import { ArrowDown, ArrowUp, Lock, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import type { FormQuestion } from '@/types/entities';

export interface QuestionBuilderProps {
  questions: FormQuestion[];
  onChange: (questions: FormQuestion[]) => void;
  maxQuestions?: number;
  locked?: boolean;
  lockedNotice?: string;
}

const QUESTION_KIND_LABELS: Record<FormQuestion['kind'], string> = {
  short: 'Câu trả lời ngắn (1 dòng)',
  long: 'Đoạn văn (nhiều dòng)',
  single: 'Trắc nghiệm 1 lựa chọn',
  multi: 'Chọn nhiều đáp án',
};

export const QuestionBuilder: React.FC<QuestionBuilderProps> = ({
  questions,
  onChange,
  maxQuestions = 10,
  locked = false,
  lockedNotice = 'Đã có sinh viên gửi đăng ký nên danh sách câu hỏi được khóa để đảm bảo tính nhất quán dữ liệu.',
}) => {
  const handleAddQuestion = () => {
    if (locked || questions.length >= maxQuestions) return;
    const nextQuestion: FormQuestion = {
      id: `q-${Date.now()}-${questions.length + 1}`,
      label: '',
      kind: 'short',
      required: true,
    };
    onChange([...questions, nextQuestion]);
  };

  const handleUpdate = (idx: number, patch: Partial<FormQuestion>) => {
    if (locked) return;
    const next = questions.map((q, i) => {
      if (i !== idx) return q;
      const updated = { ...q, ...patch };
      if ((updated.kind === 'single' || updated.kind === 'multi') && (!updated.options || updated.options.length === 0)) {
        updated.options = ['Lựa chọn 1', 'Lựa chọn 2'];
      }
      return updated;
    });
    onChange(next);
  };

  const handleRemove = (idx: number) => {
    if (locked) return;
    onChange(questions.filter((_, i) => i !== idx));
  };

  const handleMove = (idx: number, dir: -1 | 1) => {
    if (locked) return;
    const target = idx + dir;
    if (target < 0 || target >= questions.length) return;
    const copy = [...questions];
    const [item] = copy.splice(idx, 1);
    copy.splice(target, 0, item);
    onChange(copy);
  };

  return (
    <div className="space-y-3">
      {locked && (
        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-tier-attention-bg border border-tier-attention-border text-tier-attention-text text-meta">
          <Lock className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{lockedNotice}</span>
        </div>
      )}

      {questions.length === 0 ? (
        <div className="p-6 rounded-lg border border-dashed border-neutral-300 bg-neutral-50 text-center space-y-2">
          <p className="text-sm font-medium text-neutral-700">
            Chưa có câu hỏi bổ sung nào
          </p>
          <p className="text-caption text-neutral-500">
            Thông tin cơ bản của sinh viên (Họ tên, MSSV, Email, Ngành, Khóa) đã được tự động điền sẵn.
          </p>
          {!locked && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleAddQuestion}
              leftIcon={<Plus className="h-4 w-4" />}
            >
              Thêm câu hỏi đầu tiên
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map((q, idx) => (
            <div
              key={q.id}
              className="p-4 rounded-lg border border-neutral-200 bg-surface space-y-3"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-caption font-semibold text-neutral-500">
                  Câu hỏi {idx + 1} / {maxQuestions}
                </span>
                {!locked && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMove(idx, -1)}
                      className="p-1 rounded hover:bg-neutral-100 text-neutral-500 disabled:opacity-30 cursor-pointer"
                      title="Chuyển lên"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === questions.length - 1}
                      onClick={() => handleMove(idx, 1)}
                      className="p-1 rounded hover:bg-neutral-100 text-neutral-500 disabled:opacity-30 cursor-pointer"
                      title="Chuyển xuống"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemove(idx)}
                      className="p-1 rounded hover:bg-tier-danger-bg text-neutral-500 hover:text-tier-danger-text cursor-pointer"
                      title="Xóa câu hỏi"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <Input
                    disabled={locked}
                    value={q.label}
                    onChange={(e) => handleUpdate(idx, { label: e.target.value })}
                    placeholder="Nhập nội dung câu hỏi (VD: Bạn có thể tham gia ca nào?)..."
                  />
                </div>
                <div>
                  <Select
                    disabled={locked}
                    value={q.kind}
                    onChange={(e) =>
                      handleUpdate(idx, { kind: e.target.value as FormQuestion['kind'] })
                    }
                  >
                    {Object.entries(QUESTION_KIND_LABELS).map(([k, label]) => (
                      <option key={k} value={k}>
                        {label}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              {(q.kind === 'single' || q.kind === 'multi') && (
                <div className="pl-3 border-l-2 border-neutral-200 space-y-2">
                  <div className="text-caption font-medium text-neutral-600">
                    Các lựa chọn (mỗi dòng hoặc ô một lựa chọn):
                  </div>
                  {(q.options || []).map((opt, optIdx) => (
                    <div key={optIdx} className="flex items-center gap-2">
                      <Input
                        disabled={locked}
                        value={opt}
                        onChange={(e) => {
                          const nextOpts = [...(q.options || [])];
                          nextOpts[optIdx] = e.target.value;
                          handleUpdate(idx, { options: nextOpts });
                        }}
                        placeholder={`Lựa chọn ${optIdx + 1}`}
                      />
                      {!locked && (q.options?.length || 0) > 2 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const nextOpts = (q.options || []).filter((_, i) => i !== optIdx);
                            handleUpdate(idx, { options: nextOpts });
                          }}
                        >
                          Xóa
                        </Button>
                      )}
                    </div>
                  ))}
                  {!locked && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        handleUpdate(idx, {
                          options: [...(q.options || []), `Lựa chọn ${(q.options?.length || 0) + 1}`],
                        })
                      }
                      leftIcon={<Plus className="h-3.5 w-3.5" />}
                    >
                      Thêm lựa chọn
                    </Button>
                  )}
                </div>
              )}

              <label className="inline-flex items-center gap-2 text-caption text-neutral-700 cursor-pointer">
                <input
                  type="checkbox"
                  disabled={locked}
                  checked={q.required}
                  onChange={(e) => handleUpdate(idx, { required: e.target.checked })}
                  className="rounded border-neutral-300 text-brand-600 focus:ring-brand-500"
                />
                <span>Bắt buộc trả lời</span>
              </label>
            </div>
          ))}
        </div>
      )}

      {!locked && questions.length > 0 && questions.length < maxQuestions && (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={handleAddQuestion}
          leftIcon={<Plus className="h-4 w-4" />}
        >
          Thêm câu hỏi ({questions.length}/{maxQuestions})
        </Button>
      )}
    </div>
  );
};
