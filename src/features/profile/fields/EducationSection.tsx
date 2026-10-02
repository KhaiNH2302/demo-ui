import React, { useState } from 'react';
import { GraduationCap, Plus, MoreHorizontal, Pencil, Trash2, School } from 'lucide-react';
import type { EducationEntry, Audience } from '@/types/entities';
import { AudienceSelect } from './AudienceSelect';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/DropdownMenu';
import { UNIVERSITIES, CAMPUSES, MAJORS, COHORTS } from '../profileConstants';

interface EducationSectionProps {
  items: EducationEntry[];
  onChange: (items: EducationEntry[]) => void;
  isOwner: boolean;
  canViewAudience?: (aud: Audience) => boolean;
}

export const EducationSection: React.FC<EducationSectionProps> = ({
  items = [],
  onChange,
  isOwner,
  canViewAudience = () => true,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // Form state for add/edit
  const [formData, setFormData] = useState<Partial<EducationEntry>>({
    type: 'university',
    schoolName: UNIVERSITIES[0],
    campus: CAMPUSES[0],
    major: MAJORS[0],
    cohort: 'K18',
    studentCode: '',
    fromYear: 2024,
    toYear: 2028,
    isCurrent: true,
    audience: 'public',
  });

  const visibleItems = isOwner ? items : items.filter((it) => canViewAudience(it.audience));

  const startEdit = (entry: EducationEntry) => {
    setFormData(entry);
    setEditingId(entry.id);
    setIsAdding(false);
  };

  const startAdd = (type: 'university' | 'highschool' = 'university') => {
    setFormData({
      id: `edu_${Date.now()}`,
      type,
      schoolName: type === 'university' ? UNIVERSITIES[0] : '',
      campus: type === 'university' ? CAMPUSES[0] : '',
      major: type === 'university' ? MAJORS[0] : '',
      cohort: 'K18',
      studentCode: '',
      fromYear: 2024,
      toYear: 2028,
      isCurrent: true,
      audience: 'public',
    });
    setEditingId(null);
    setIsAdding(true);
  };

  const handleSave = () => {
    if (!formData.schoolName?.trim()) return;

    if (isAdding) {
      const newEntry: EducationEntry = {
        id: formData.id || `edu_${Date.now()}`,
        type: formData.type || 'university',
        schoolName: formData.schoolName,
        campus: formData.campus,
        major: formData.major,
        cohort: formData.cohort,
        studentCode: formData.studentCode,
        fromYear: formData.fromYear,
        toYear: formData.toYear,
        isCurrent: formData.isCurrent ?? true,
        audience: formData.audience || 'public',
      };
      onChange([...items, newEntry]);
      setIsAdding(false);
    } else if (editingId) {
      const updated = items.map((it) =>
        it.id === editingId ? ({ ...it, ...formData } as EducationEntry) : it
      );
      onChange(updated);
      setEditingId(null);
    }
  };

  const handleDelete = (id: string) => {
    onChange(items.filter((it) => it.id !== id));
  };

  const renderForm = () => (
    <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 space-y-3.5 my-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-neutral-900">
          {isAdding ? 'Thêm mục học vấn mới' : 'Chỉnh sửa thông tin học vấn'}
        </span>
        <AudienceSelect
          value={formData.audience || 'public'}
          onChange={(aud) => setFormData((prev) => ({ ...prev, audience: aud }))}
          showLabel
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div>
          <label className="block text-neutral-600 font-semibold mb-1">Loại trường học</label>
          <Select
            value={formData.type || 'university'}
            onValueChange={(val) => setFormData((prev) => ({ ...prev, type: val as any }))}
            options={[
              { value: 'university', label: 'Đại học / Cao đẳng' },
              { value: 'highschool', label: 'Trung học phổ thông' },
              { value: 'other', label: 'Khác' },
            ]}
          />
        </div>

        <div>
          <label className="block text-neutral-600 font-semibold mb-1">Tên trường *</label>
          {formData.type === 'university' ? (
            <Select
              value={formData.schoolName || UNIVERSITIES[0]}
              onValueChange={(val) => setFormData((prev) => ({ ...prev, schoolName: val }))}
              options={UNIVERSITIES.map((u) => ({ value: u, label: u }))}
            />
          ) : (
            <Input
              value={formData.schoolName || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, schoolName: e.target.value }))}
              placeholder="Nhập tên trường THPT..."
            />
          )}
        </div>

        {formData.type === 'university' && (
          <>
            <div>
              <label className="block text-neutral-600 font-semibold mb-1">Cơ sở / Phân hiệu</label>
              <Select
                value={formData.campus || CAMPUSES[0]}
                onValueChange={(val) => setFormData((prev) => ({ ...prev, campus: val }))}
                options={CAMPUSES.map((c) => ({ value: c, label: c }))}
              />
            </div>

            <div>
              <label className="block text-neutral-600 font-semibold mb-1">Chuyên ngành</label>
              <Select
                value={formData.major || MAJORS[0]}
                onValueChange={(val) => setFormData((prev) => ({ ...prev, major: val }))}
                options={MAJORS.map((m) => ({ value: m, label: m }))}
              />
            </div>

            <div>
              <label className="block text-neutral-600 font-semibold mb-1">Khóa học</label>
              <Select
                value={formData.cohort || 'K18'}
                onValueChange={(val) => setFormData((prev) => ({ ...prev, cohort: val }))}
                options={COHORTS.map((c) => ({ value: c, label: c }))}
              />
            </div>

            <div>
              <label className="block text-neutral-600 font-semibold mb-1">Mã số sinh viên (MSSV)</label>
              <Input
                value={formData.studentCode || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, studentCode: e.target.value.toUpperCase() }))}
                placeholder="vd: HE180001"
              />
            </div>
          </>
        )}

        <div>
          <label className="block text-neutral-600 font-semibold mb-1">Năm bắt đầu</label>
          <Input
            type="number"
            value={formData.fromYear || 2024}
            onChange={(e) => setFormData((prev) => ({ ...prev, fromYear: parseInt(e.target.value) || 2024 }))}
          />
        </div>

        <div>
          <label className="block text-neutral-600 font-semibold mb-1">Năm tốt nghiệp (dự kiến)</label>
          <Input
            type="number"
            value={formData.toYear || 2028}
            onChange={(e) => setFormData((prev) => ({ ...prev, toYear: parseInt(e.target.value) || 2028 }))}
          />
        </div>
      </div>

      <label className="flex items-center gap-2 cursor-pointer text-xs text-neutral-700">
        <input
          type="checkbox"
          checked={formData.isCurrent ?? true}
          onChange={(e) => setFormData((prev) => ({ ...prev, isCurrent: e.target.checked }))}
          className="rounded border-neutral-300 text-brand-600"
        />
        <span>Tôi đang học tại đây</span>
      </label>

      <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-200">
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setIsAdding(false);
            setEditingId(null);
          }}
        >
          Hủy
        </Button>
        <Button size="sm" onClick={handleSave}>
          Lưu thông tin
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-neutral-200">
        <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
          Học vấn
        </h3>
        {isOwner && !isAdding && !editingId && (
          <button
            type="button"
            onClick={() => startAdd('university')}
            className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1 cursor-pointer"
          >
            <Plus size={14} /> Thêm trường học
          </button>
        )}
      </div>

      {isAdding && renderForm()}

      <div className="space-y-3">
        {visibleItems.length === 0 && !isAdding && (
          <div className="text-xs text-neutral-400 italic py-2">
            Chưa có thông tin học vấn nào được thêm.
          </div>
        )}

        {visibleItems.map((entry) => {
          if (editingId === entry.id) {
            return <div key={entry.id}>{renderForm()}</div>;
          }

          const maskedCode = entry.studentCode
            ? isOwner
              ? entry.studentCode
              : `${entry.studentCode.slice(0, 4)}••••`
            : null;

          return (
            <div
              key={entry.id}
              className="group flex items-start justify-between gap-3 p-3 rounded-lg border border-neutral-200 bg-surface hover:border-neutral-300 transition-colors"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center text-neutral-600 dark:text-neutral-400 shrink-0 mt-0.5">
                  {entry.type === 'university' ? <GraduationCap size={18} /> : <School size={18} />}
                </div>

                <div className="min-w-0 space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-neutral-900">
                      {entry.type === 'university' ? `Học tại ${entry.schoolName}` : `Từng học tại ${entry.schoolName}`}
                    </span>
                    {entry.isCurrent && (
                      <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-brand-50 text-brand-600">
                        Đang học
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-neutral-600">
                    {[
                      entry.major,
                      entry.cohort,
                      entry.campus,
                      maskedCode ? `MSSV: ${maskedCode}` : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </div>

                  <div className="text-[11px] text-neutral-400">
                    {entry.fromYear} – {entry.isCurrent ? 'hiện tại' : entry.toYear || 'nay'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <AudienceSelect
                  value={entry.audience}
                  onChange={(aud) => {
                    const updated = items.map((it) => (it.id === entry.id ? { ...it, audience: aud } : it));
                    onChange(updated);
                  }}
                  disabled={!isOwner}
                />

                {isOwner && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
                        title="Tùy chọn"
                      >
                        <MoreHorizontal size={15} />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-36 z-50">
                      <DropdownMenuItem onClick={() => startEdit(entry)} className="gap-2 text-xs">
                        <Pencil size={13} /> Sửa
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDelete(entry.id)} className="gap-2 text-xs text-tier-danger-text">
                        <Trash2 size={13} /> Xóa
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
