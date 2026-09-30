import React from 'react';
import { FileText, Download, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useViewer } from '@/lib/viewer';
import { useGuardedAction } from '@/lib/guestGate';

export interface AttachmentItem {
  name: string;
  url: string;
  size: number;
}

export interface AttachmentListProps {
  items: AttachmentItem[];
  onRemove?: (index: number) => void;
  className?: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const AttachmentList: React.FC<AttachmentListProps> = ({
  items,
  onRemove,
  className,
}) => {
  const viewer = useViewer();
  const guard = useGuardedAction();
  const canDownload = viewer.can('knowledge.interact');

  if (!items || items.length === 0) return null;

  return (
    <div className={cn('space-y-2', className)}>
      {items.map((item, idx) => (
        <div
          key={idx}
          className="flex items-center justify-between p-2.5 rounded-lg border border-neutral-200 bg-neutral-50/50 hover:bg-neutral-50 transition-colors"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-brand-50 text-brand-600 shrink-0">
              <FileText size={16} />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-medium text-neutral-800 truncate">{item.name}</div>
              <div className="text-[11px] text-neutral-400">{formatFileSize(item.size)}</div>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0 ml-2">
            {canDownload ? (
              <a
                href={item.url}
                download={item.name}
                target="_blank"
                rel="noreferrer"
                className="p-1 text-neutral-500 hover:text-brand-600 transition-colors"
                title="Tải xuống"
              >
                <Download size={14} />
              </a>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  guard('tải xuống tài liệu đính kèm', () => {})();
                }}
                className="p-1 text-neutral-500 hover:text-brand-600 transition-colors cursor-pointer"
                title="Tải xuống"
              >
                <Download size={14} />
              </button>
            )}
            {onRemove && (
              <button
                type="button"
                onClick={() => onRemove(idx)}
                className="p-1 text-neutral-400 hover:text-[#dc3c33] transition-colors"
                title="Xóa"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

