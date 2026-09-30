import React, { useEffect } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

export interface MediaImageItem {
  id: string;
  url: string;
  thumbnailUrl?: string;
  caption?: string;
  alt?: string;
  width?: number;
  height?: number;
}

export interface ImageLightboxProps {
  images: MediaImageItem[];
  index: number | null;
  onClose: () => void;
  onChangeIndex: (nextIndex: number) => void;
}

export const ImageLightbox: React.FC<ImageLightboxProps> = ({
  images,
  index,
  onClose,
  onChangeIndex,
}) => {
  useEffect(() => {
    if (index === null) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') {
        onChangeIndex((index - 1 + images.length) % images.length);
      }
      if (e.key === 'ArrowRight') {
        onChangeIndex((index + 1) % images.length);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [index, images.length, onClose, onChangeIndex]);

  if (index === null || !images[index]) return null;
  const current = images[index];

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-neutral-950/90 flex flex-col items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl flex items-center justify-between text-white mb-3 px-2"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-xs font-medium text-neutral-300 tabular-nums">
          Ảnh {index + 1} / {images.length}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng xem ảnh"
          className="p-1.5 rounded-md text-neutral-300 hover:text-white hover:bg-white/10"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div
        className="relative flex items-center justify-center w-full max-w-5xl max-h-[78vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {images.length > 1 && (
          <button
            type="button"
            onClick={() => onChangeIndex((index - 1 + images.length) % images.length)}
            aria-label="Ảnh trước"
            className="absolute left-2 z-10 p-2 rounded-full bg-neutral-900/70 text-white hover:bg-neutral-900"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}

        <img
          src={current.url}
          alt={current.alt || current.caption || `Ảnh ${index + 1}`}
          className="max-h-[75vh] max-w-full object-contain rounded-md"
        />

        {images.length > 1 && (
          <button
            type="button"
            onClick={() => onChangeIndex((index + 1) % images.length)}
            aria-label="Ảnh tiếp theo"
            className="absolute right-2 z-10 p-2 rounded-full bg-neutral-900/70 text-white hover:bg-neutral-900"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        )}
      </div>

      {current.caption && (
        <p
          className="mt-3 max-w-2xl text-center text-sm text-neutral-200"
          onClick={(e) => e.stopPropagation()}
        >
          {current.caption}
        </p>
      )}
    </div>
  );
};
