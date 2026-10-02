import React, { useState } from 'react';
import { Award, Briefcase, Trophy, GraduationCap, Bookmark, Plus, MoreHorizontal, Pencil, Trash2, Calendar } from 'lucide-react';
import type { LifeEvent, Audience } from '@/types/entities';
import { AudienceSelect } from './AudienceSelect';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/DropdownMenu';
import { LIFE_EVENT_KINDS } from '../profileConstants';

interface LifeEventsSectionProps {
  items: LifeEvent[];
  onChange: (items: LifeEvent[]) => void;
  isOwner: boolean;
  canViewAudience?: (aud: Audience) => boolean;
}

export const LifeEventsSection: React.FC<LifeEventsSectionProps> = ({
  items = [],
  onChange,
  isOwner,
  canViewAudience = () => true,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const [formData, setFormData] = useState<Partial<LifeEvent>>({
    kind: 'award',
    title: '',
    date: new Date().toISOString().slice(0, 10),
    description: '',
    audience: 'public',
  });

  const visibleItems = isOwner ? items : items.filter((it) => canViewAudience(it.audience));

  const startEdit = (item: LifeEvent) => {
    setFormData(item);
    setEditingId(item.id);
    setIsAdding(false);
  };

  const startAdd = (kind: LifeEvent['kind'] = 'award') => {
    setFormData({
      id: `event_${Date.now()}`,
      kind,
      title: '',
      date: new Date().toISOString().slice(0, 10),
      description: '',
      audience: 'public',
    });
    setEditingId(null);
    setIsAdding(true);
  };

  const cancelForm = () => {
    setEditingId(null);
    setIsAdding(false);
  };

  const saveForm = () => {
    if (!formData.title?.trim()) return;

    if (isAdding) {
      const newItem: LifeEvent = {
        id: formData.id || `event_${Date.now()}`,
        kind: formData.kind || 'other',
        title: formData.title.trim(),
        date: formData.date || new Date().toISOString().slice(0, 10),
        description: formData.description?.trim() || undefined,
        audience: formData.audience || 'public',
      };
      onChange([...items, newItem]);
    } else if (editingId) {
      const updated = items.map((it) =>
        it.id === editingId
          ? {
              ...it,
              kind: formData.kind || it.kind,
              title: formData.title!.trim(),
              date: formData.date || it.date,
              description: formData.description?.trim() || undefined,
              audience: formData.audience || it.audience,
            }
          : it
      );
      onChange(updated);
    }
    cancelForm();
  };

  const handleDelete = (id: string) => {
    onChange(items.filter((it) => it.id !== id));
  };

  const getKindIcon = (kind: LifeEvent['kind']) => {
    switch (kind) {
      case 'scholarship':
        return <Award className="w-5 h-5 text-amber-500" />;
      case 'internship':
        return <Briefcase className="w-5 h-5 text-blue-500" />;
      case 'award':
        return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 'graduation':
        return <GraduationCap className="w-5 h-5 text-emerald-500" />;
      default:
        return <Bookmark className="w-5 h-5 text-indigo-500" />;
    }
  };

  const getKindLabel = (kind: LifeEvent['kind']) => {
    const found = LIFE_EVENT_KINDS.find((k) => k.value === kind);
    return found ? found.label : 'Sự kiện';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-700">
        <div>
          <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            Cột mốc & Sự kiện đáng nhớ
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Lưu giữ thành tích, giải thưởng, học bổng và các bước ngoặt phát triển
          </p>
        </div>
        {isOwner && !isAdding && !editingId && (
          <Button
            size="sm"
            variant="outline"
            className="text-xs flex items-center gap-1.5 border-dashed"
            onClick={() => startAdd()}
          >
            <Plus className="w-3.5 h-3.5" />
            Thêm sự kiện
          </Button>
        )}
      </div>

      {/* Add / Edit Form */}
      {(isAdding || editingId) && (
        <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 dark:bg-primary/10 space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm text-neutral-800 dark:text-neutral-200">
              {isAdding ? 'Thêm cột mốc mới' : 'Chỉnh sửa sự kiện'}
            </h4>
            <AudienceSelect
              value={formData.audience || 'public'}
              onChange={(aud) => setFormData((prev) => ({ ...prev, audience: aud }))}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1 block">
                Phân loại cột mốc
              </label>
              <Select
                value={formData.kind}
                onChange={(e) => setFormData((prev) => ({ ...prev, kind: e.target.value as LifeEvent['kind'] }))}
              >
                {LIFE_EVENT_KINDS.map((k) => (
                  <option key={k.value} value={k.value}>
                    {k.label}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1 block">
                Thời gian (Ngày / Tháng / Năm)
              </label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1 block">
              Tiêu đề cột mốc <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="VD: Học bổng khuyến khích học tập 100%, Giải Nhì FPT Edu Hackathon 2025..."
              value={formData.title || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1 block">
              Mô tả chi tiết / Thành tích đạt được (tùy chọn)
            </label>
            <Textarea
              rows={2}
              placeholder="Chi tiết về dự án, giải thưởng hoặc những gì bạn học được..."
              value={formData.description || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-neutral-200 dark:border-neutral-700">
            <Button size="sm" variant="ghost" onClick={cancelForm}>
              Hủy
            </Button>
            <Button size="sm" onClick={saveForm} disabled={!formData.title?.trim()}>
              {isAdding ? 'Thêm cột mốc' : 'Lưu thay đổi'}
            </Button>
          </div>
        </div>
      )}

      {/* Items List */}
      <div className="space-y-3">
        {visibleItems.map((item) => (
          <div
            key={item.id}
            className="flex items-start justify-between p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-700/80 bg-surface hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors"
          >
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shrink-0 border border-neutral-200/60 dark:border-neutral-700">
                {getKindIcon(item.kind)}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">{item.title}</h4>
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                    {getKindLabel(item.kind)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{item.date}</span>
                </div>
                {item.description && (
                  <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-1 whitespace-pre-line leading-relaxed">
                    {item.description}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {isOwner && (
                <AudienceSelect
                  value={item.audience}
                  onChange={(aud) => {
                    const updated = items.map((it) => (it.id === item.id ? { ...it, audience: aud } : it));
                    onChange(updated);
                  }}
                />
              )}
              {isOwner && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                      title="Tùy chọn"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => startEdit(item)} className="cursor-pointer gap-2 text-xs">
                      <Pencil className="w-3.5 h-3.5" />
                      Chỉnh sửa
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDelete(item.id)}
                      className="cursor-pointer gap-2 text-xs text-red-600 dark:text-red-400 focus:text-red-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Xóa cột mốc
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        ))}

        {visibleItems.length === 0 && !isAdding && !editingId && (
          <div className="text-center py-8 px-4 rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/20">
            <Trophy className="w-8 h-8 text-neutral-400 mx-auto mb-2 opacity-50" />
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {isOwner
                ? 'Chưa có cột mốc nào. Thêm học bổng, thực tập hoặc giải thưởng để làm nổi bật hồ sơ!'
                : 'Chưa có thông tin sự kiện hoặc không được chia sẻ công khai.'}
            </p>
            {isOwner && (
              <Button size="sm" variant="outline" className="mt-3 text-xs" onClick={() => startAdd()}>
                <Plus className="w-3.5 h-3.5 mr-1" />
                Thêm cột mốc đầu tiên
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
