import React, { useState } from 'react';
import { ImageOff } from 'lucide-react';
import { ImageLightbox, type MediaImageItem } from './ImageLightbox';
import { cn } from '@/lib/cn';

export interface ImageGalleryProps {
  images?: MediaImageItem[];
  maxVisible?: 4;
  aspect?: 'video' | 'square' | '4/3';
  onOpen?: (index: number) => void;
  title?: string;
  className?: string;
}

/** Ảnh trong lưới; link hỏng (vd: ảnh mock bị gỡ) hiện ô placeholder thay vì khoảng trống. */
const GalleryImage: React.FC<{ src: string; alt: string; className?: string }> = ({
  src,
  alt,
  className,
}) => {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={cn('flex min-h-40 items-center justify-center text-neutral-400', className)}
      >
        <ImageOff className="h-6 w-6" />
      </div>
    );
  }
  return (
    <img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} className={className} />
  );
};

/**
 * Lưới ảnh kiểu Facebook/LinkedIn (02-shared-components.md § 42):
 * - 1 ảnh: 16:9, max-h-80
 * - 2 ảnh: 2 cột bằng nhau (4:3)
 * - 3 ảnh: 1 ảnh lớn bên trái + 2 ảnh nhỏ bên phải
 * - >= 4 ảnh: lưới 2x2, ô thứ 4 phủ lớp mờ "+N" nếu > 4
 */
export const ImageGallery: React.FC<ImageGalleryProps> = ({
  images = [],
  onOpen,
  title,
  className,
}) => {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (!images || images.length === 0) return null;

  const handleOpen = (idx: number) => {
    setLightboxIndex(idx);
    onOpen?.(idx);
  };

  const visible = images.slice(0, 4);
  const extraCount = Math.max(0, images.length - 4);

  return (
    <div className={cn('space-y-2.5', className)}>
      {title && (
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-neutral-900">
            {title} ({images.length})
          </h3>
        </div>
      )}

      {images.length === 1 && (
        <button
          type="button"
          onClick={() => handleOpen(0)}
          className="block w-full overflow-hidden rounded-md border border-neutral-200 bg-neutral-100 text-left focus:outline-none"
        >
          <GalleryImage
            src={images[0].thumbnailUrl || images[0].url}
            alt={images[0].alt || images[0].caption || 'Ảnh hoạt động'}
            className="w-full max-h-80 object-cover"
          />
          {images[0].caption && (
            <p className="px-3 py-2 text-xs text-neutral-600 bg-white border-t border-neutral-200">
              {images[0].caption}
            </p>
          )}
        </button>
      )}

      {images.length === 2 && (
        <div className="grid grid-cols-2 gap-2">
          {visible.map((img, idx) => (
            <button
              key={img.id || idx}
              type="button"
              onClick={() => handleOpen(idx)}
              className="overflow-hidden rounded-md border border-neutral-200 bg-neutral-100 aspect-[4/3] focus:outline-none"
            >
              <GalleryImage
                src={img.thumbnailUrl || img.url}
                alt={img.alt || img.caption || `Ảnh ${idx + 1}`}
                className="w-full h-full object-cover hover:opacity-95 transition-opacity"
              />
            </button>
          ))}
        </div>
      )}

      {images.length === 3 && (
        <div className="grid grid-cols-3 gap-2 h-60">
          <button
            type="button"
            onClick={() => handleOpen(0)}
            className="col-span-2 h-full overflow-hidden rounded-md border border-neutral-200 bg-neutral-100 focus:outline-none"
          >
            <GalleryImage
              src={images[0].thumbnailUrl || images[0].url}
              alt={images[0].alt || images[0].caption || 'Ảnh 1'}
              className="w-full h-full object-cover"
            />
          </button>
          <div className="grid grid-rows-2 gap-2 h-full">
            {images.slice(1, 3).map((img, idx) => (
              <button
                key={img.id || idx}
                type="button"
                onClick={() => handleOpen(idx + 1)}
                className="h-full overflow-hidden rounded-md border border-neutral-200 bg-neutral-100 focus:outline-none"
              >
                <GalleryImage
                  src={img.thumbnailUrl || img.url}
                  alt={img.alt || img.caption || `Ảnh ${idx + 2}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {images.length >= 4 && (
        <div className="grid grid-cols-2 gap-2">
          {visible.map((img, idx) => {
            const isLastWithExtra = idx === 3 && extraCount > 0;
            return (
              <button
                key={img.id || idx}
                type="button"
                onClick={() => handleOpen(idx)}
                className="relative overflow-hidden rounded-md border border-neutral-200 bg-neutral-100 aspect-[4/3] focus:outline-none"
              >
                <GalleryImage
                  src={img.thumbnailUrl || img.url}
                  alt={img.alt || img.caption || `Ảnh ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
                {isLastWithExtra && (
                  <div className="absolute inset-0 bg-neutral-900/60 flex items-center justify-center text-white font-semibold text-lg">
                    +{extraCount}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      <ImageLightbox
        images={images}
        index={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onChangeIndex={setLightboxIndex}
      />
    </div>
  );
};
