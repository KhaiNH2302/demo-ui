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
  Bold,
  Italic,
  List,
  Code,
  Quote,
  Download,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { seedKnowledgePosts } from '@/mocks/data/knowledge';
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
  const [type, setType] = useState<PostType>(post?.type || 'question');
  const [title, setTitle] = useState<string>(post?.title || '');
  const [content, setContent] = useState<string>(post?.contentMd || '');
  const [subject, setSubject] = useState<string>(post?.subject || defaultSubject || '');
  const [tags, setTags] = useState<string[]>(post?.tags || []);
  const [visibility, setVisibility] = useState<'school' | 'cross_school'>(post?.visibility || 'school');
  const [images, setImages] = useState<string[]>(post?.images || []);
  const [attachments, setAttachments] = useState<{ name: string; url: string; size: number }[]>(
    post?.attachments || []
  );
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Suggestions for similar questions from previous batches
  const similarPosts = React.useMemo(() => {
    if (!title.trim() || title.trim().length < 3) return [];
    const q = title.toLowerCase();
    return seedKnowledgePosts
      .filter((p) => p.isSolved || (p.commentCount && p.commentCount > 0))
      .filter((p) => {
        const t = (p.title || '').toLowerCase();
        const s = (p.subject || '').toLowerCase();
        return (
          t.includes(q) ||
          (subject && p.subject === subject && t.includes(q)) ||
          q.split(' ').some((w) => w.length > 2 && t.includes(w))
        );
      })
      .slice(0, 2);
  }, [title, subject]);

  const insertFormatting = (prefix: string, suffix: string = '') => {
    if (!textareaRef.current) return;
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const selected = content.substring(start, end);
    const replacement = `${prefix}${selected || 'văn bản'}${suffix}`;
    const newContent = content.substring(0, start) + replacement + content.substring(end);
    setContent(newContent);
    setTimeout(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(
        start + prefix.length,
        start + prefix.length + (selected ? selected.length : 7)
      );
    }, 20);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            e.preventDefault();
            const url = URL.createObjectURL(file);
            setImages((prev) => [...prev.slice(0, 3), url]);
            toast({ variant: 'success', title: 'Đã dán ảnh chụp màn hình vào bài viết' });
            break;
          }
        }
      }
    }
  };

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
        title: title.trim() || content.trim().split('\n')[0],
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
        <div className="space-y-3.5">
          {/* 1. Mandatory Top Controls: Subject Dropdown + Post Type Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg bg-neutral-50/80 border border-neutral-200">
            {/* Subject Selector (Mandatory) */}
            <div className="flex items-center gap-2 min-w-[240px] flex-1">
              <span className="text-xs font-semibold text-neutral-800 shrink-0">
                Môn học <span className="text-red-500">*</span>:
              </span>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className={cn(
                  'text-xs font-semibold rounded-lg px-3 py-1.5 border outline-hidden transition-all flex-1 cursor-pointer',
                  subject
                    ? 'bg-brand-50 text-brand-700 border-brand-300'
                    : 'bg-white text-tier-attention-text border-tier-attention-border ring-1 ring-amber-300'
                )}
              >
                <option value="">-- Chọn Mã môn học (bắt buộc) --</option>
                {SUBJECT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Post Type Selector (Hỏi đáp / Chia sẻ / Tài liệu) */}
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-xs font-semibold text-neutral-800 mr-1">
                Loại bài <span className="text-red-500">*</span>:
              </span>
              {[
                { key: 'question', label: 'Hỏi đáp', icon: HelpCircle },
                { key: 'discussion', label: 'Chia sẻ kinh nghiệm', icon: Sparkles },
                { key: 'document', label: 'Tài liệu', icon: FileText },
              ].map((pt) => {
                const Icon = pt.icon;
                const isSelected = type === pt.key;
                return (
                  <button
                    key={pt.key}
                    type="button"
                    onClick={() => setType(pt.key as PostType)}
                    className={cn(
                      'text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer',
                      isSelected
                        ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                        : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                    )}
                  >
                    <Icon size={13} className={isSelected ? 'text-white' : 'text-neutral-500'} />
                    <span>{pt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Title Input with Real-time Similar Question Suggestions */}
          <div className="space-y-1.5">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                type === 'question'
                  ? 'Tiêu đề câu hỏi (Ví dụ: Làm sao để cài đặt thuật toán Dijkstra trong CSD201?)...'
                  : type === 'document'
                  ? 'Tiêu đề tài liệu (Ví dụ: Tổng hợp đề thi thử PE môn PRJ301 các kỳ trước)...'
                  : 'Tiêu đề chia sẻ (Ví dụ: Review kinh nghiệm làm đồ án SWP391 đạt điểm 9.5)...'
              }
              className="w-full text-sm font-semibold text-neutral-900 placeholder:text-neutral-400 px-3 py-2 rounded-lg border border-neutral-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-hidden bg-white"
            />

            {/* Suggestions Box when typing question */}
            {similarPosts.length > 0 && (
              <div className="p-3 rounded-lg bg-blue-50/80 border border-blue-200 text-xs text-neutral-800 space-y-2">
                <div className="flex items-center gap-1.5 text-blue-900 font-semibold text-xs">
                  <Sparkles size={14} className="text-blue-600" />
                  <span>Gợi ý: Tìm thấy {similarPosts.length} câu hỏi tương tự đã được giải đáp từ các khóa trước:</span>
                </div>
                <div className="space-y-1.5">
                  {similarPosts.map((p) => (
                    <a
                      key={p.id}
                      href={`/knowledge/${p.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between p-2 rounded-md bg-white border border-blue-100 hover:border-blue-300 transition-colors group"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="font-bold text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">
                          {p.subject || 'CSD201'}
                        </span>
                        <span className="truncate font-medium text-neutral-800 group-hover:text-blue-700">
                          {p.title || p.contentMd.split('\n')[0]}
                        </span>
                      </div>
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 shrink-0 ml-3">
                        <CheckCircle2 size={12} className="text-emerald-600" />
                        Đã có lời giải
                        <ExternalLink size={11} className="text-neutral-400 group-hover:text-blue-600 ml-0.5" />
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 3. Simple Editor Formatting Toolbar */}
          <div className="flex items-center gap-1 px-1 py-1 rounded-md bg-neutral-100/70 border border-neutral-200 text-neutral-600 w-fit">
            <button
              type="button"
              onClick={() => insertFormatting('**', '**')}
              title="In đậm (Bold)"
              className="p-1.5 rounded hover:bg-neutral-200 hover:text-neutral-900 transition-colors cursor-pointer"
            >
              <Bold size={14} />
            </button>
            <button
              type="button"
              onClick={() => insertFormatting('*', '*')}
              title="In nghiêng (Italic)"
              className="p-1.5 rounded hover:bg-neutral-200 hover:text-neutral-900 transition-colors cursor-pointer"
            >
              <Italic size={14} />
            </button>
            <span className="w-px h-3.5 bg-neutral-300 mx-0.5" />
            <button
              type="button"
              onClick={() => insertFormatting('\n- ')}
              title="Danh sách gạch đầu dòng"
              className="p-1.5 rounded hover:bg-neutral-200 hover:text-neutral-900 transition-colors cursor-pointer"
            >
              <List size={14} />
            </button>
            <button
              type="button"
              onClick={() => insertFormatting('\n```\n', '\n```\n')}
              title="Đóng hộp đoạn mã (Code block)"
              className="p-1.5 rounded hover:bg-neutral-200 hover:text-neutral-900 transition-colors cursor-pointer"
            >
              <Code size={14} />
            </button>
            <button
              type="button"
              onClick={() => insertFormatting('\n> ')}
              title="Trích dẫn (Quote)"
              className="p-1.5 rounded hover:bg-neutral-200 hover:text-neutral-900 transition-colors cursor-pointer"
            >
              <Quote size={14} />
            </button>
            <span className="text-[11px] text-neutral-400 ml-2 mr-1">
              Hỗ trợ Ctrl+V dán thẳng ảnh chụp màn hình
            </span>
          </div>

          {/* Main Textarea */}
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value.slice(0, 3000))}
              onPaste={handlePaste}
              placeholder="Soạn nội dung chi tiết... Bạn có thể dùng các nút định dạng ở trên hoặc gõ markdown."
              rows={5}
              className="w-full text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-400 resize-none border border-neutral-200 focus:border-brand-500 rounded-lg p-3 outline-hidden bg-white leading-relaxed"
            />
            {showCharCount && (
              <span
                className={cn(
                  'absolute bottom-2 right-2 text-[10px] font-mono px-1.5 py-0.5 rounded',
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

          {/* 4. Attachment Previews with Direct Download Button */}
          {attachments.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <span className="text-xs font-semibold text-neutral-700">Tệp tài liệu đính kèm:</span>
              {attachments.map((file, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-neutral-50 border border-neutral-200 text-xs text-neutral-700 hover:bg-neutral-100/80 transition-colors"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <div className="flex h-7 w-7 items-center justify-center rounded bg-brand-50 text-brand-600 shrink-0">
                      <FileText size={15} />
                    </div>
                    <span className="truncate font-medium">{file.name}</span>
                    <span className="text-[11px] text-neutral-400">
                      ({(file.size / 1024).toFixed(0)} KB)
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    <a
                      href={file.url}
                      download={file.name}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 px-2 py-1 rounded bg-white border border-neutral-200 text-neutral-700 hover:text-brand-600 hover:border-brand-300 font-medium text-[11px] transition-colors"
                    >
                      <Download size={12} /> Tải xuống
                    </a>
                    <button
                      type="button"
                      onClick={() => removeAttachment(idx)}
                      className="p-1 rounded text-neutral-400 hover:text-tier-danger-text transition-colors cursor-pointer"
                      title="Xóa tệp"
                    >
                      <X size={14} />
                    </button>
                  </div>
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
