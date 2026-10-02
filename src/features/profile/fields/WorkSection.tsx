import React, { useState } from 'react';
import { Briefcase, Plus, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import type { WorkEntry, Audience } from '@/types/entities';
import { AudienceSelect } from './AudienceSelect';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/DropdownMenu';

interface WorkSectionProps {
  items: WorkEntry[];
  onChange: (items: WorkEntry[]) => void;
  isOwner: boolean;
  canViewAudience?: (aud: Audience) => boolean;
}

export const WorkSection: React.FC<WorkSectionProps> = ({
  items = [],
  onChange,
  isOwner,
  canViewAudience = () => true,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const [formData, setFormData] = useState<Partial<WorkEntry>>({
    company: '',
    position: '',
    city: 'Hà Nội',
    from: '2025',
    to: '',
    isCurrent: true,
    description: '',
    audience: 'public',
  });

  const visibleItems = isOwner ? items : items.filter((it) => canViewAudience(it.audience));

  const startEdit = (entry: WorkEntry) => {
    setFormData(entry);
    setEditingId(entry.id);
    setIsAdding(false);
  };

  const startAdd = () => {
    setFormData({
      id: `work_${Date.now()}`,
      company: '',
      position: '',
      city: 'Hà Nội',
      from: '2025',
      to: '',
      isCurrent: true,
      description: '',
      audience: 'public',
    });
    setEditingId(null);
    setIsAdding(true);
  };

  const handleSave = () => {
    if (!formData.company?.trim() || !formData.position?.trim()) return;

    if (isAdding) {
      const newEntry: WorkEntry = {
        id: formData.id || `work_${Date.now()}`,
        company: formData.company,
        position: formData.position,
        city: formData.city,
        from: formData.from,
        to: formData.to,
        isCurrent: formData.isCurrent ?? true,
        description: formData.description,
        audience: formData.audience || 'public',
      };
      onChange([...items, newEntry]);
      setIsAdding(false);
    } else if (editingId) {
      const updated = items.map((it) =>
        it.id === editingId ? ({ ...it, ...formData } as WorkEntry) : it
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
          {isAdding ? 'Thêm nơi làm việc / thực tập' : 'Chỉnh sửa thông tin công việc'}
        </span>
        <AudienceSelect
          value={formData.audience || 'public'}
          onChange={(aud) => setFormData((prev) => ({ ...prev, audience: aud }))}
          showLabel
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div>
          <label className="block text-neutral-600 font-semibold mb-1">Công ty / Tổ chức *</label>
          <Input
            value={formData.company || ''}
            onChange={(e) => setFormData((prev) => ({ ...prev, company: e.target.value }))}
            placeholder="vd: FPT Software, Viettel..."
          />
        </div>

        <div>
          <label className="block text-neutral-600 font-semibold mb-1">Vị trí / Chức danh *</label>
          <Input
            value={formData.position || ''}
            onChange={(e) => setFormData((prev) => ({ ...prev, position: e.target.value }))}
            placeholder="vd: Thực tập sinh Frontend, CTV..."
          />
        </div>

        <div>
          <label className="block text-neutral-600 font-semibold mb-1">Thành phố / Địa điểm</label>
          <Input
            value={formData.city || ''}
            onChange={(e) => setFormData((prev) => ({ ...prev, city: e.target.value }))}
            placeholder="vd: Hà Nội, TP.HCM..."
          />
        </div>

        <div>
          <label className="block text-neutral-600 font-semibold mb-1">Thời gian (Từ - Đến)</label>
          <div className="flex items-center gap-2">
            <Input
              value={formData.from || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, from: e.target.value }))}
              placeholder="06/2025"
              className="flex-1"
            />
            <span className="text-neutral-400">–</span>
            <Input
              value={formData.isCurrent ? 'Hiện tại' : formData.to || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, to: e.target.value }))}
              placeholder="12/2025"
              disabled={formData.isCurrent}
              className="flex-1"
            />
          </div>
        </div>
      </div>

      <label className="flex items-center gap-2 cursor-pointer text-xs text-neutral-700">
        <input
          type="checkbox"
          checked={formData.isCurrent ?? true}
          onChange={(e) => setFormData((prev) => ({ ...prev, isCurrent: e.target.checked }))}
          className="rounded border-neutral-300 text-brand-600"
        />
        <span>Tôi hiện đang làm việc tại đây</span>
      </label>

      <div>
        <label className="block text-neutral-600 font-semibold mb-1 text-xs">Mô tả công việc</label>
        <Textarea
          value={formData.description || ''}
          onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
          placeholder="Mô tả dự án, công nghệ hoặc trách nhiệm của bạn..."
          rows={2}
          className="text-xs"
        />
      </div>

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
          Công việc & Thực tập
        </h3>
        {isOwner && !isAdding && !editingId && (
          <button
            type="button"
            onClick={startAdd}
            className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1 cursor-pointer"
          >
            <Plus size={14} /> Thêm nơi làm việc
          </button>
        )}
      </div>

      {isAdding && renderForm()}

      <div className="space-y-3">
        {visibleItems.length === 0 && !isAdding && (
          <div className="text-xs text-neutral-400 italic py-2">
            Chưa có thông tin công việc hoặc thực tập.
          </div>
        )}

        {visibleItems.map((entry) => {
          if (editingId === entry.id) {
            return <div key={entry.id}>{renderForm()}</div>;
          }

          return (
            <div
              key={entry.id}
              className="group flex items-start justify-between gap-3 p-3 rounded-lg border border-neutral-200 bg-surface hover:border-neutral-300 transition-colors"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center text-neutral-600 dark:text-neutral-400 shrink-0 mt-0.5">
                  <Briefcase size={18} />
                </div>

                <div className="min-w-0 space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-neutral-900">
                      {entry.position} tại <strong className="text-neutral-900">{entry.company}</strong>
                    </span>
                    {entry.isCurrent && (
                      <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-tier-success-bg text-tier-success-text">
                        Hiện tại
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-neutral-600">
                    {[entry.city, `${entry.from} – ${entry.isCurrent ? 'hiện tại' : entry.to || 'nay'}`]
                      .filter(Boolean)
                      .join(' · ')}
                  </div>

                  {entry.description && (
                    <p className="text-xs text-neutral-500 pt-1 leading-relaxed">
                      {entry.description}
                    </p>
                  )}
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
