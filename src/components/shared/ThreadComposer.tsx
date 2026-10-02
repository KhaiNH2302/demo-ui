import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { TagInput } from '@/components/shared/TagInput';
import { useToast } from '@/components/ui/Toast';
import { apiClient } from '@/lib/apiClient';
import { cn } from '@/lib/cn';
import {
  Image as ImageIcon,
  Paperclip,
  X,
  Send,
  HelpCircle,
  MessageSquare,
  FileText,
  Globe,
  School,
  Sparkles,
} from 'lucide-react';
import type { KnowledgePost, PostType } from '@/types/entities';

export interface ThreadComposerProps {
  defaultSubject?: string;
  post?: KnowledgePost;
  variant?: 'inline' | 'sheet';
  onPosted?: (post: KnowledgePost) => void;
  onCancel?: () => void;
  placeholder?: string;
  className?: string;
}

const SUBJECT_OPTIONS = [
  { value: 'CSD201', label: 'CSD201 · Cấu trúc dữ liệu & Giải thuật' },
  { value: 'PRJ301', label: 'PRJ301 · Java Web Application' },
  { value: 'SWP391', label: 'SWP391 · Phần mềm thực tế (Capstone 1)' },
  { value: 'DBI202', label: 'DBI202 · Cơ sở dữ liệu' },
  { value: 'MAS291', label: 'MAS291 · Xác suất thống kê' },
  { value: 'PRN231', label: 'PRN231 · Lập trình .NET & Web API' },
  { value: 'General', label: 'Chung · Đời sống sinh viên & Học tập' },
];

export const ThreadComposer: React.FC<ThreadComposerProps> = ({
  defaultSubject = '',
  post,
  variant = 'inline',
  onPosted,
  onCancel,
  placeholder,
  className,
}) => {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isEditMode = !!post;
  const draftKey = `scs_thread_draft_${user?.id || 'guest'}`;

  const [isExpanded, setIsExpanded] = useState<boolean>(variant === 'sheet' || isEditMode);
  const [type, setType] = useState<PostType>(post?.type || 'discussion');
  const [content, setContent] = useState<string>(post?.contentMd || '');
  const [subject, setSubject] = useState<string>(post?.subject || defaultSubject || '');
  const [tags, setTags] = useState<string[]>(post?.tags || []);
  const [visibility, setVisibility] = useState<'school' | 'cross_school'>(post?.visibility || 'school');
  const [images, setImages] = useState<string[]>(post?.images || []);
  const [attachments, setAttachments] = useState<{ name: string; url: string; size: number }[]>(
    post?.attachments || []
  );
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Load draft if available on mount (only when not editing)
  useEffect(() => {
    if (!isEditMode && variant === 'inline') {
      try {
        const saved = localStorage.getItem(draftKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.content) setContent(parsed.content);
          if (parsed.type) setType(parsed.type);
          if (parsed.subject && !defaultSubject) setSubject(parsed.subject);
          if (parsed.tags) setTags(parsed.tags);
        }
      } catch {
        // Ignore JSON errors
      }
    }
  }, [draftKey, isEditMode, variant, defaultSubject]);

  // Save draft on change
  useEffect(() => {
    if (!isEditMode && isExpanded) {
      try {
        if (content.trim()) {
          localStorage.setItem(draftKey, JSON.stringify({ content, type, subject, tags }));
        } else {
          localStorage.removeItem(draftKey);
        }
      } catch {
        // Ignore localStorage quota
      }
    }
  }, [content, type, subject, tags, draftKey, isEditMode, isExpanded]);

  const handleExpand = () => {
    setIsExpanded(true);
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 50);
  };

  const handleCollapse = () => {
    if (variant !== 'sheet' && !isEditMode) {
      setIsExpanded(false);
    }
    if (onCancel) onCancel();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (images.length + files.length > 4) {
      toast({ variant: 'error', title: 'Tối đa 4 ảnh cho mỗi bài viết' });
      return;
    }
    const newImages = Array.from(files).map((file) => URL.createObjectURL(file));
    setImages((prev) => [...prev, ...newImages]);
    e.target.value = '';
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (attachments.length + files.length > 3) {
      toast({ variant: 'error', title: 'Tối đa 3 tệp đính kèm' });
      return;
    }
    const newFiles = Array.from(files).map((f) => ({
      name: f.name,
      url: URL.createObjectURL(f),
      size: f.size,
    }));
    setAttachments((prev) => [...prev, ...newFiles]);
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const isValid =
    content.trim().length > 0 &&
    subject.trim().length > 0 &&
    (type !== 'document' || attachments.length > 0);

  const handleSubmit = async () => {
    if (!isValid) return;
    setSubmitting(true);
    try {
      const payload = {
        type,
        contentMd: content.trim(),
        subject,
        tags,
        visibility,
        images,
        attachments,
      };

      let result: KnowledgePost;
      if (isEditMode && post) {
        result = await apiClient.put<KnowledgePost>(`/posts/${post.id}`, payload);
        toast({ variant: 'success', title: 'Đã cập nhật bài viết' });
      } else {
        result = await apiClient.post<KnowledgePost>('/posts', payload);
        if (result.status === 'PendingReview') {
          toast({
            variant: 'warning',
            title: 'Bài viết đang chờ kiểm duyệt',
            description: 'Nội dung chứa từ khóa cần duyệt trước khi hiển thị công khai.',
          });
        } else {
          toast({ variant: 'success', title: 'Đã đăng thành công' });
        }
        localStorage.removeItem(draftKey);
        setContent('');
        setImages([]);
        setAttachments([]);
        setTags([]);
        if (!defaultSubject) setSubject('');
        if (variant !== 'sheet') setIsExpanded(false);
      }

      if (onPosted) {
        onPosted(result);
      }
    } catch {
      toast({ variant: 'error', title: 'Không thể đăng bài', description: 'Vui lòng thử lại sau.' });
    } finally {
      setSubmitting(false);
    }
  };

  const remainingChars = 3000 - content.length;
  const showCharCount = remainingChars <= 200;

  const defaultPrompt = placeholder || 'Hôm nay bạn học được gì? Chia sẻ kinh nghiệm hoặc đặt câu hỏi…';

  return (
    <div
      className={cn(
        'bg-surface border border-neutral-200 rounded-xl p-3.5 transition-all shadow-xs',
        isExpanded && 'ring-1 ring-brand-500/20 border-brand-300',
        className
      )}
    >
      <input
        type="file"
        ref={imageInputRef}
        onChange={handleImageUpload}
        accept="image/*"
        multiple
        className="hidden"
      />
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".pdf,.docx,.pptx,.zip,.rar,.txt"
        multiple
        className="hidden"
      />

      {!isExpanded ? (
        /* Collapsed 1-row state */
        <div className="flex items-center gap-3">
          <Avatar
            src={user?.avatarUrl}
            name={user?.fullName || 'Sinh viên'}
            size="sm"
            className="shrink-0"
          />
          <button
            type="button"
            onClick={handleExpand}
            className="flex-1 text-left bg-neutral-50 hover:bg-neutral-100 text-neutral-400 text-xs sm:text-sm rounded-full px-4 py-2 transition-colors cursor-text line-clamp-1 border border-neutral-100"
          >
            {defaultPrompt}
          </button>
          <div className="flex items-center gap-1 shrink-0 text-neutral-500">
            <button
              type="button"
              onClick={() => {
                handleExpand();
                setTimeout(() => imageInputRef.current?.click(), 100);
              }}
              title="Đính kèm ảnh"
              className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-500 hover:text-brand-600 transition-colors"
            >
              <ImageIcon size={18} />
            </button>
            <button
              type="button"
              onClick={() => {
                handleExpand();
                setTimeout(() => fileInputRef.current?.click(), 100);
              }}
              title="Đính kèm tệp"
              className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-500 hover:text-brand-600 transition-colors"
            >
              <Paperclip size={18} />
            </button>
          </div>
        </div>
      ) : (
        /* Expanded full composer */
        <div className="space-y-3">
          {/* Post Type Chips */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setType('discussion')}
              className={cn(
                'text-xs font-medium px-3 py-1.5 rounded-full border transition-all flex items-center gap-1.5',
                type === 'discussion'
                  ? 'bg-brand-50 text-brand-700 border-brand-300 ring-1 ring-brand-400'
                  : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100'
              )}
            >
              <MessageSquare size={13} />
              <span>Chia sẻ</span>
            </button>

            <button
              type="button"
              onClick={() => setType('question')}
              className={cn(
                'text-xs font-medium px-3 py-1.5 rounded-full border transition-all flex items-center gap-1.5',
                type === 'question'
                  ? 'bg-brand-50 text-brand-700 border-brand-300 ring-1 ring-brand-400'
                  : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100'
              )}
            >
              <HelpCircle size={13} />
              <span>Hỏi đáp</span>
            </button>

            <button
              type="button"
              onClick={() => setType('document')}
              className={cn(
                'text-xs font-medium px-3 py-1.5 rounded-full border transition-all flex items-center gap-1.5',
                type === 'document'
                  ? 'bg-brand-50 text-brand-700 border-brand-300 ring-1 ring-brand-400'
                  : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100'
              )}
            >
              <FileText size={13} />
              <span>Tài liệu</span>
            </button>

            {/* Visibility Selector */}
            <div className="ml-auto flex items-center gap-1">
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as any)}
                className="text-[11px] bg-neutral-100 text-neutral-600 rounded-md px-2 py-1 border-none outline-hidden cursor-pointer hover:bg-neutral-200 transition-colors"
              >
                <option value="school">Trong trường</option>
                <option value="cross_school">Liên trường</option>
              </select>
            </div>
          </div>

          {/* Author info + Subject selector row */}
          <div className="flex items-center gap-3 pt-1">
            <Avatar src={user?.avatarUrl} name={user?.fullName || 'Sinh viên'} size="sm" />
            <div className="flex-1 flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-neutral-900">{user?.fullName}</span>
              <span className="text-[11px] text-neutral-400">đăng bài môn</span>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className={cn(
                  'text-xs font-medium rounded-lg px-2.5 py-1 border outline-hidden transition-all',
                  subject
                    ? 'bg-brand-50 text-brand-700 border-brand-200'
                    : 'bg-tier-attention-bg text-tier-attention-text border-tier-attention-border'
                )}
              >
                <option value="">-- Chọn môn học (bắt buộc) --</option>
                {SUBJECT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Main Textarea */}
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value.slice(0, 3000))}
              placeholder={
                type === 'question'
                  ? 'Đặt câu hỏi cụ thể (ví dụ: Làm thế nào để xoay cây AVL trong CSD201?)...\nDòng đầu tiên sẽ được in đậm làm tiêu đề chính.'
                  : type === 'document'
                  ? 'Mô tả tài liệu học tập, nội dung chính, cách sử dụng tài liệu này...\nDòng đầu tiên sẽ được in đậm.'
                  : 'Chia sẻ kinh nghiệm học tập, mẹo qua môn, lưu ý khi làm đồ án...\nDòng đầu tiên sẽ được in đậm làm tiêu đề.'
              }
              rows={4}
              className="w-full text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-400 resize-none border-none outline-hidden bg-transparent leading-relaxed"
            />
            {showCharCount && (
              <span
                className={cn(
                  'absolute bottom-1 right-1 text-[10px] font-mono px-1.5 py-0.5 rounded',
                  remainingChars <= 50 ? 'text-tier-danger-text bg-tier-danger-bg' : 'text-neutral-400 bg-neutral-100'
                )}
              >
                Còn {remainingChars} ký tự
              </span>
            )}
          </div>

          {/* Image Previews */}
          {images.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {images.map((img, idx) => (
                <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-neutral-200 group">
                  <img src={img} alt="preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute top-1 right-1 w-5 h-5 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-black/80"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Attachment Previews */}
          {attachments.length > 0 && (
            <div className="space-y-1.5 pt-1">
              {attachments.map((file, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-lg bg-neutral-50 border border-neutral-200 text-xs text-neutral-700"
                >
                  <div className="flex items-center gap-2 truncate">
                    <Paperclip size={14} className="text-brand-600 shrink-0" />
                    <span className="truncate font-medium">{file.name}</span>
                    <span className="text-[11px] text-neutral-400">
                      ({(file.size / 1024).toFixed(0)} KB)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeAttachment(idx)}
                    className="text-neutral-400 hover:text-tier-danger-text p-1"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Tag Input */}
          <div className="pt-1">
            <TagInput
              value={tags}
              onChange={(newTags) => setTags(newTags.slice(0, 3))}
              placeholder="Thêm hashtag (tối đa 3 thẻ, nhấn Enter)..."
              max={3}
            />
          </div>

          {/* Bottom Action Bar */}
          <div className="flex items-center justify-between pt-2 border-t border-neutral-100">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className="p-2 rounded-lg hover:bg-neutral-100 text-neutral-600 hover:text-brand-600 transition-colors flex items-center gap-1 text-xs"
                title="Thêm ảnh (tối đa 4)"
              >
                <ImageIcon size={16} />
                <span className="hidden sm:inline">Ảnh</span>
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-lg hover:bg-neutral-100 text-neutral-600 hover:text-brand-600 transition-colors flex items-center gap-1 text-xs"
                title="Đính kèm tệp PDF/Word (tối đa 3)"
              >
                <Paperclip size={16} />
                <span className="hidden sm:inline">Tệp</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              {variant !== 'sheet' && !isEditMode && (
                <Button variant="ghost" size="sm" onClick={handleCollapse} disabled={submitting}>
                  Hủy
                </Button>
              )}
              {isEditMode && onCancel && (
                <Button variant="ghost" size="sm" onClick={onCancel} disabled={submitting}>
                  Hủy
                </Button>
              )}
              <Button
                variant="primary"
                size="sm"
                onClick={handleSubmit}
                disabled={!isValid || submitting}
                loading={submitting}
                rightIcon={<Send size={14} />}
              >
                {isEditMode ? 'Lưu thay đổi' : 'Đăng'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
