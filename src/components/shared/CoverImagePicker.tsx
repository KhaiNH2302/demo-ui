import React, { useRef } from 'react';
import { ImagePlus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export interface CoverImagePickerProps {
  value?: string | null;
  onChange: (url: string | null) => void;
  aspect?: '16/9' | '4/1';
  fallbackTitle?: string;
}

const SAMPLE_COVERS = [
  'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80',
];

export const CoverImagePicker: React.FC<CoverImagePickerProps> = ({
  value,
  onChange,
  aspect = '16/9',
  fallbackTitle = 'Chưa có ảnh bìa (khuyến khích 1200 × 675 px)',
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    onChange(objectUrl);
  };

  return (
    <div className="space-y-2">
      <div
        className={`relative w-full overflow-hidden rounded-lg border border-neutral-200 bg-neutral-100 flex items-center justify-center ${
          aspect === '4/1' ? 'aspect-[4/1]' : 'aspect-video max-h-56'
        }`}
      >
        {value ? (
          <>
            <img src={value} alt="Ảnh bìa" className="w-full h-full object-cover" />
            <div className="absolute bottom-3 right-3 flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => inputRef.current?.click()}
              >
                Đổi ảnh bìa
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => onChange(null)}
                leftIcon={<Trash2 className="h-3.5 w-3.5" />}
              >
                Gỡ ảnh
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center p-6 space-y-2">
            <ImagePlus className="h-7 w-7 text-neutral-400 mx-auto" />
            <p className="text-xs text-neutral-600">{fallbackTitle}</p>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => inputRef.current?.click()}
              >
                Chọn tệp ảnh (JPG/PNG/WebP ≤ 5MB)
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() =>
                  onChange(SAMPLE_COVERS[Math.floor(Math.random() * SAMPLE_COVERS.length)])
                }
              >
                Dùng ảnh mẫu
              </Button>
            </div>
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
};
