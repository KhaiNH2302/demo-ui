import React, { useRef } from 'react';
import { ImagePlus, Trash2, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { MediaImageItem } from './ImageLightbox';

export interface ImageUploaderProps {
  value: MediaImageItem[];
  onChange: (next: MediaImageItem[]) => void;
  maxImages?: number;
  allowCaption?: boolean;
}

const DEMO_GALLERY_SAMPLES: MediaImageItem[] = [
  {
    id: 'sample-1',
    url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=80',
    caption: 'Buổi sinh hoạt chuyên đề của câu lạc bộ tại hội trường A',
  },
  {
    id: 'sample-2',
    url: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=900&q=80',
    caption: 'Các nhóm thảo luận phương án triển khai thực tế',
  },
];

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  value = [],
  onChange,
  maxImages = 8,
  allowCaption = true,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const remaining = Math.max(0, maxImages - value.length);
    const selected = files.slice(0, remaining);
    const added: MediaImageItem[] = selected.map((file, idx) => ({
      id: `upload-${Date.now()}-${idx}`,
      url: URL.createObjectURL(file),
      caption: '',
      alt: file.name,
    }));
    onChange([...value, ...added]);
    e.target.value = '';
  };

  const updateCaption = (index: number, caption: string) => {
    const next = [...value];
    next[index] = { ...next[index], caption };
    onChange(next);
  };

  const removeAt = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-neutral-500">
          Đã chọn {value.length}/{maxImages} ảnh · JPG, PNG, WebP (tối đa 5MB/ảnh)
        </span>
        <div className="flex items-center gap-2">
          {value.length < maxImages && (
            <>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => inputRef.current?.click()}
                leftIcon={<ImagePlus className="h-3.5 w-3.5" />}
              >
                Thêm ảnh
              </Button>
              {value.length === 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onChange(DEMO_GALLERY_SAMPLES.slice(0, maxImages))}
                >
                  Chèn 2 ảnh mẫu
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {value.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {value.map((img, idx) => (
            <div
              key={img.id || idx}
              className="rounded-md border border-neutral-200 bg-white p-2.5 space-y-2"
            >
              <div className="relative aspect-[4/3] overflow-hidden rounded bg-neutral-100">
                <img
                  src={img.thumbnailUrl || img.url}
                  alt={img.alt || img.caption || `Ảnh ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-1.5 right-1.5 flex items-center gap-1">
                  {idx > 0 && (
                    <button
                      type="button"
                      onClick={() => move(idx, -1)}
                      className="p-1 rounded bg-neutral-900/70 text-white hover:bg-neutral-900"
                      title="Đưa lên trước"
                    >
                      <ArrowLeft className="h-3 w-3" />
                    </button>
                  )}
                  {idx < value.length - 1 && (
                    <button
                      type="button"
                      onClick={() => move(idx, 1)}
                      className="p-1 rounded bg-neutral-900/70 text-white hover:bg-neutral-900"
                      title="Đưa ra sau"
                    >
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => removeAt(idx)}
                    className="p-1 rounded bg-neutral-900/70 text-white hover:bg-red-600"
                    title="Xóa ảnh"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
              {allowCaption && (
                <input
                  type="text"
                  value={img.caption || ''}
                  onChange={(e) => updateCaption(idx, e.target.value)}
                  maxLength={140}
                  placeholder="Chú thích ngắn (tối đa 140 ký tự)..."
                  className="w-full h-8 px-2.5 text-xs rounded border border-neutral-200 focus:outline-none focus:border-brand-500"
                />
              )}
            </div>
          ))}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFiles}
      />
    </div>
  );
};
