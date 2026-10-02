import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Switch } from '@/components/ui/Switch';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { toast } from '@/components/ui/Toast';
import { apiClient } from '@/lib/apiClient';
import {
  ArrowUp,
  ArrowDown,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  GripVertical,
  ExternalLink,
  Layers,
} from 'lucide-react';
import type { MentorProfileSection } from '@/types/entities';

interface MentorProfileSectionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mentorId: string;
  initialSections: MentorProfileSection[];
  onSaved?: (sections: MentorProfileSection[]) => void;
}

export const MentorProfileSectionSheet: React.FC<MentorProfileSectionSheetProps> = ({
  open,
  onOpenChange,
  mentorId,
  initialSections,
  onSaved,
}) => {
  const queryClient = useQueryClient();
  const [sections, setSections] = useState<MentorProfileSection[]>([]);
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [newSectionType, setNewSectionType] = useState<'text' | 'list' | 'links'>('text');
  const [isAddingNew, setIsAddingNew] = useState(false);

  useEffect(() => {
    if (open) {
      // Sort by order ascending
      const sorted = [...initialSections].sort((a, b) => a.order - b.order);
      setSections(sorted);
      setIsAddingNew(false);
      setNewSectionTitle('');
    }
  }, [open, initialSections]);

  const saveMutation = useMutation({
    mutationFn: (updated: MentorProfileSection[]) =>
      apiClient.put(`/mentors/${mentorId}/profile-sections`, { sections: updated }),
    onSuccess: (data: any) => {
      const savedSections = (data && data.data) || sections;
      toast.success('Đã lưu tùy chỉnh hồ sơ mentor!');
      queryClient.invalidateQueries({ queryKey: ['mentor-profile-sections', mentorId] });
      onSaved?.(savedSections);
      onOpenChange(false);
    },
    onError: () => {
      toast.error('Có lỗi xảy ra khi lưu cấu hình.');
    },
  });

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sections.length) return;

    const copy = [...sections];
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;

    // Reassign orders
    copy.forEach((sec, idx) => {
      sec.order = idx + 1;
    });

    setSections(copy);
  };

  const handleToggleVisible = (index: number) => {
    const copy = [...sections];
    copy[index].visible = !copy[index].visible;
    setSections(copy);
  };

  const handleDeleteSection = (index: number) => {
    const copy = sections.filter((_, idx) => idx !== index);
    copy.forEach((sec, idx) => {
      sec.order = idx + 1;
    });
    setSections(copy);
  };

  const handleAddNewSection = () => {
    if (!newSectionTitle.trim()) {
      toast.error('Vui lòng nhập tiêu đề cho khối thông tin');
      return;
    }

    let defaultContent: any = '';
    if (newSectionType === 'list') {
      defaultContent = ['Mục 1', 'Mục 2'];
    } else if (newSectionType === 'links') {
      defaultContent = [{ label: 'Trang cá nhân', url: 'https://example.com' }];
    }

    const newSec: MentorProfileSection = {
      id: `sec_custom_${Date.now()}`,
      kind: 'custom',
      type: newSectionType,
      title: newSectionTitle.trim(),
      content: defaultContent,
      visible: true,
      order: sections.length + 1,
    };

    setSections([...sections, newSec]);
    setNewSectionTitle('');
    setIsAddingNew(false);
  };

  const handleSaveAll = () => {
    saveMutation.mutate(sections);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto flex flex-col justify-between">
        <div className="space-y-5">
          <SheetHeader className="border-b border-neutral-200 dark:border-neutral-800 pb-4">
            <SheetTitle className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-brand-600" /> Tùy chỉnh hồ sơ Mentor
            </SheetTitle>
            <SheetDescription>
              Bật/tắt các khối nội dung, sắp xếp thứ tự hiển thị hoặc thêm các mục giới thiệu riêng của bạn.
            </SheetDescription>
          </SheetHeader>

          {/* Danh sách các khối */}
          <div className="space-y-3">
            {sections.map((sec, idx) => (
              <div
                key={sec.id}
                className={`p-3.5 rounded-lg border transition-colors ${
                  sec.visible
                    ? 'border-neutral-200 bg-surface'
                    : 'border-neutral-200/50 bg-neutral-50/70 text-neutral-400'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs font-mono text-neutral-400 font-semibold w-4 text-center">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-sm font-semibold truncate ${sec.visible ? 'text-neutral-900 dark:text-neutral-100' : 'text-neutral-500'}`}>
                          {sec.title}
                        </span>
                        <Badge variant={sec.kind === 'builtin' ? 'secondary' : 'outline'} className="text-[10px] py-0 px-1.5">
                          {sec.kind === 'builtin' ? 'Mặc định' : 'Tự tạo'}
                        </Badge>
                      </div>
                      <span className="text-[11px] text-neutral-500 capitalize">
                        Kiểu: {sec.type === 'text' ? 'Văn bản' : sec.type === 'list' ? 'Danh sách' : 'Liên kết'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {/* Reorder buttons */}
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMove(idx, 'up')}
                      className="p-1 rounded text-neutral-500 hover:text-neutral-900 disabled:opacity-30 disabled:hover:text-neutral-500"
                      title="Di chuyển lên"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === sections.length - 1}
                      onClick={() => handleMove(idx, 'down')}
                      className="p-1 rounded text-neutral-500 hover:text-neutral-900 disabled:opacity-30 disabled:hover:text-neutral-500"
                      title="Di chuyển xuống"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>

                    {/* Toggle visibility */}
                    <button
                      type="button"
                      onClick={() => handleToggleVisible(idx)}
                      className={`p-1 rounded ${sec.visible ? 'text-brand-600 hover:text-brand-700' : 'text-neutral-400 hover:text-neutral-600'}`}
                      title={sec.visible ? 'Đang hiển thị' : 'Đang ẩn'}
                    >
                      {sec.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>

                    {/* Delete custom section */}
                    {sec.kind === 'custom' && (
                      <button
                        type="button"
                        onClick={() => handleDeleteSection(idx)}
                        className="p-1 rounded text-neutral-400 hover:text-rose-600"
                        title="Xóa khối này"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Inline Content Preview / Mini-Editor */}
                {sec.visible && (
                  <div className="mt-2.5 pt-2.5 border-t border-neutral-100 dark:border-neutral-800 text-xs text-neutral-600">
                    {sec.type === 'text' && (
                      <Textarea
                        rows={2}
                        value={typeof sec.content === 'string' ? sec.content : ''}
                        onChange={(e) => {
                          const copy = [...sections];
                          copy[idx].content = e.target.value;
                          setSections(copy);
                        }}
                        placeholder="Nội dung mô tả..."
                        className="text-xs"
                      />
                    )}
                    {sec.type === 'list' && (
                      <Textarea
                        rows={3}
                        value={Array.isArray(sec.content) ? (sec.content as string[]).join('\n') : ''}
                        onChange={(e) => {
                          const copy = [...sections];
                          copy[idx].content = e.target.value.split('\n').filter(Boolean);
                          setSections(copy);
                        }}
                        placeholder="Mỗi mục một dòng..."
                        className="text-xs"
                      />
                    )}
                    {sec.type === 'links' && (
                      <div className="space-y-1.5">
                        {Array.isArray(sec.content) &&
                          (sec.content as { label: string; url: string }[]).map((link, lIdx) => (
                            <div key={lIdx} className="flex gap-2">
                              <Input
                                value={link.label}
                                onChange={(e) => {
                                  const copy = [...sections];
                                  const links = [...(copy[idx].content as any[])];
                                  links[lIdx].label = e.target.value;
                                  copy[idx].content = links;
                                  setSections(copy);
                                }}
                                placeholder="Tên nhãn (ví dụ: GitHub)"
                                className="text-xs h-7 flex-1"
                              />
                              <Input
                                value={link.url}
                                onChange={(e) => {
                                  const copy = [...sections];
                                  const links = [...(copy[idx].content as any[])];
                                  links[lIdx].url = e.target.value;
                                  copy[idx].content = links;
                                  setSections(copy);
                                }}
                                placeholder="URL (https://...)"
                                className="text-xs h-7 flex-1"
                              />
                            </div>
                          ))}
                        <button
                          type="button"
                          onClick={() => {
                            const copy = [...sections];
                            const links = Array.isArray(copy[idx].content) ? [...(copy[idx].content as any[])] : [];
                            links.push({ label: 'Liên kết mới', url: 'https://' });
                            copy[idx].content = links;
                            setSections(copy);
                          }}
                          className="text-xs text-brand-600 hover:underline pt-1 inline-block"
                        >
                          + Thêm liên kết
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Form thêm khối mới */}
          {isAddingNew ? (
            <div className="p-4 rounded-lg border border-brand-200 bg-brand-50/50 dark:bg-brand-950/20 space-y-3">
              <h4 className="text-xs font-semibold text-brand-900 dark:text-brand-300">
                Thêm khối thông tin mới
              </h4>
              <div className="space-y-2">
                <Input
                  placeholder="Tiêu đề khối (ví dụ: Dự án tiêu biểu, Chứng chỉ...)"
                  value={newSectionTitle}
                  onChange={(e) => setNewSectionTitle(e.target.value)}
                  className="text-sm"
                />
                <Select
                  value={newSectionType}
                  onChange={(e) => setNewSectionType(e.target.value as any)}
                  options={[
                    { label: 'Đoạn văn bản (Text)', value: 'text' },
                    { label: 'Danh sách mục (List)', value: 'list' },
                    { label: 'Danh sách liên kết (Links)', value: 'links' },
                  ]}
                  className="text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <Button variant="ghost" size="sm" onClick={() => setIsAddingNew(false)}>
                  Hủy
                </Button>
                <Button size="sm" onClick={handleAddNewSection}>
                  Thêm vào hồ sơ
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="w-full border-dashed"
              onClick={() => setIsAddingNew(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Thêm khối thông tin tùy chỉnh
            </Button>
          )}
        </div>

        <SheetFooter className="border-t border-neutral-200 dark:border-neutral-800 pt-4 flex gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
          <Button onClick={handleSaveAll} loading={saveMutation.isPending}>
            Lưu thay đổi
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
