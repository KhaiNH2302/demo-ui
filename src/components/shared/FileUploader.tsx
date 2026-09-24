import React, { useRef, useState } from 'react';
import { UploadCloud } from 'lucide-react';
import { AttachmentList, type AttachmentItem } from './AttachmentList';
import { cn } from '@/lib/cn';

export interface FileUploaderProps {
  accept?: string;
  maxSizeMb?: number;
  multiple?: boolean;
  value?: AttachmentItem[] | File[] | any[];
  files?: AttachmentItem[] | File[] | any[];
  onChange?: (files: any[]) => void;
  onFilesChange?: (files: any[]) => void;
  className?: string;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  accept = '.pdf,.docx,.pptx,.png,.jpg',
  maxSizeMb = 10,
  multiple = false,
  value,
  files,
  onChange,
  onFilesChange,
  className,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentFiles = files || value || [];
  const triggerChange = onFilesChange || onChange;

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    const newItems: AttachmentItem[] = [];

    Array.from(fileList).forEach((file) => {
      if (file.size <= maxSizeMb * 1024 * 1024) {
        // DEMO ONLY: Use Blob ObjectURL for client-side preview
        const blobUrl = URL.createObjectURL(file);
        newItems.push({
          name: file.name,
          url: blobUrl,
          size: file.size,
        });
      }
    });

    if (triggerChange) {
      if (multiple) {
        triggerChange([...currentFiles, ...newItems]);
      } else if (newItems.length > 0) {
        triggerChange([newItems[0]]);
      }
    }
  };

  const removeFile = (index: number) => {
    triggerChange?.(currentFiles.filter((_, i) => i !== index));
  };

  const normalizedAttachmentItems: AttachmentItem[] = currentFiles.map((f: any) => {
    if (f && typeof f === 'object') {
      if ('name' in f && 'url' in f) return f as AttachmentItem;
      if (f instanceof File) {
        return {
          name: f.name,
          url: URL.createObjectURL(f),
          size: f.size,
        };
      }
    }
    return { name: String(f), url: '', size: 0 };
  });

  return (
    <div className={cn('space-y-3', className)}>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={cn(
          'flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-neutral-300 bg-neutral-50/50 p-6 text-center cursor-pointer transition-colors hover:bg-neutral-50 hover:border-brand-400',
          isDragOver && 'border-brand-500 bg-brand-50/30'
        )}
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-neutral-500 mb-2">
          <UploadCloud size={20} />
        </div>
        <p className="text-xs font-medium text-neutral-700">
          Kéo thả tệp vào đây hoặc <span className="text-brand-600 font-semibold underline">chọn từ thiết bị</span>
        </p>
        <p className="text-[11px] text-neutral-400 mt-1">
          Hỗ trợ: {accept} (tối đa {maxSizeMb}MB)
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />
      </div>

      <AttachmentList items={normalizedAttachmentItems} onRemove={removeFile} />
    </div>
  );
};
