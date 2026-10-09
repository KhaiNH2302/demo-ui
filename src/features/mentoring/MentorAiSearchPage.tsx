import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { PageHeader } from '@/components/shared/PageHeader';
import { AIResultCard } from '@/components/shared/AIResultCard';
import { AIFallbackBanner } from '@/components/shared/AIFallbackBanner';
import { UserMiniCard } from '@/components/shared/UserMiniCard';
import { FormField } from '@/components/shared/FormField';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Chip } from '@/components/ui/Chip';
import { toast } from '@/components/ui/Toast';
import {
  Sparkles,
  ArrowRight,
  UserCheck,
  Send,
  Search,
  Video,
  MapPin,
  MessageSquare,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { SendMentoringRequestDialog } from './SendMentoringRequestDialog';
import type { AiMentorMatch, SupportMode } from '@/types/entities';

const QUICK_REQUIREMENTS = [
  'Đã qua môn ≥ 8.0',
  'Có kinh nghiệm đồ án thực tế',
  'Hỗ trợ bằng tiếng Anh',
  'Sẵn sàng review code 1-1',
  'Giải thích chi tiết thuật toán',
];

const SUPPORT_MODE_OPTIONS: {
  id: SupportMode;
  title: string;
  desc: string;
  icon: React.ElementType;
}[] = [
  {
    id: 'online',
    title: 'Học trực tuyến',
    desc: 'Google Meet / Zoom, linh hoạt thời gian',
    icon: Video,
  },
  {
    id: 'offline',
    title: 'Gặp trực tiếp',
    desc: 'Tại Campus / Thư viện Gamma',
    icon: MapPin,
  },
  {
    id: 'chat',
    title: 'Hỏi đáp qua Chat',
    desc: 'Trao đổi qua tin nhắn, Q&A liên tục',
    icon: MessageSquare,
  },
];

export const MentorAiSearchPage: React.FC = () => {
  const navigate = useNavigate();

  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [modes, setModes] = useState<SupportMode[]>(['online']);
  const [requirements, setRequirements] = useState('');

  const [aiMatches, setAiMatches] = useState<AiMentorMatch[] | null>(null);
  const [isAiError, setIsAiError] = useState(false);

  // Dialog State
  const [selectedMentorId, setSelectedMentorId] = useState<string | null>(null);

  const searchMutation = useMutation({
    mutationFn: () =>
      apiClient.post<AiMentorMatch[]>('/mentoring/ai-search', {
        subject,
        content,
        modes,
        requirements,
      }),
    onSuccess: (data) => {
      setAiMatches(data);
      setIsAiError(false);
      toast.success('Hệ thống AI đã tìm thấy Mentor phù hợp!');
    },
    onError: () => {
      setIsAiError(true);
      toast.error('Gợi ý AI tạm thời gián đoạn. Bạn có thể tự duyệt danh sách Mentor.');
    },
  });

  const handleToggleMode = (modeId: SupportMode) => {
    if (modes.includes(modeId)) {
      if (modes.length === 1) {
        toast.error('Vui lòng chọn ít nhất 1 hình thức hỗ trợ.');
        return;
      }
      setModes(modes.filter((m) => m !== modeId));
    } else {
      setModes([...modes, modeId]);
    }
  };

  const handleAddRequirementChip = (chip: string) => {
    if (!requirements.includes(chip)) {
      setRequirements((prev) => (prev ? `${prev}, ${chip}` : chip));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !content.trim()) {
      toast.error('Vui lòng nhập môn học/lĩnh vực và nội dung cần hỗ trợ');
      return;
    }
    if (modes.length === 0) {
      toast.error('Vui lòng chọn ít nhất 1 hình thức hỗ trợ');
      return;
    }
    searchMutation.mutate();
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Tìm Mentor thông minh bằng AI"
        description="Nhập mục tiêu, kỹ năng và hình thức mong muốn để AI xếp hạng Mentor; bạn vẫn là người quyết định cuối cùng."
        breadcrumbs={[
          { label: 'Trang chủ', href: '/' },
          { label: 'Mentoring', href: '/mentoring' },
          { label: 'Tìm bằng AI' },
        ]}
        actions={
          <Button variant="outline" onClick={() => navigate('/mentoring/browse')}>
            <Search className="w-4 h-4 mr-1.5" /> Tự duyệt danh sách
          </Button>
        }
      />

      {isAiError && (
        <AIFallbackBanner
          onFallback={() => navigate(`/mentoring/browse?q=${encodeURIComponent(subject)}`)}
        />
      )}

      {/* Input Form */}
      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-600" /> Tiêu chí tìm kiếm Mentor
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <FormField label="Môn học / Kỹ năng cần trợ giúp" required>
              <Input
                placeholder="Ví dụ: CSD201, PRJ301, Machine Learning..."
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
              />
            </FormField>

            <FormField label="Nội dung chi tiết cần được hỗ trợ" required>
              <Textarea
                rows={3}
                placeholder="Mô tả cụ thể các thắc mắc, bài tập hoặc đồ án bạn đang gặp khó khăn..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
              />
            </FormField>

            {/* Checkbox dạng Card cho Hình thức hỗ trợ */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 block">
                Hình thức hỗ trợ mong muốn <span className="text-rose-500">*</span> (chọn 1 hoặc nhiều)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {SUPPORT_MODE_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = modes.includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleToggleMode(opt.id)}
                      className={cn(
                        'p-3.5 rounded-lg border text-left flex items-start gap-3 transition-all relative',
                        isSelected
                          ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/30 text-brand-950 dark:text-brand-100 ring-1 ring-brand-500'
                          : 'border-neutral-200 bg-surface text-neutral-700 hover:border-neutral-300',
                      )}
                    >
                      <div
                        className={cn(
                          'p-2 rounded-md shrink-0 mt-0.5',
                          isSelected
                            ? 'bg-brand-500 text-white'
                            : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400',
                        )}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold block">{opt.title}</span>
                          {isSelected && <Check className="w-4 h-4 text-brand-600 shrink-0" />}
                        </div>
                        <span className="text-xs text-neutral-500 dark:text-neutral-400 block mt-0.5 line-clamp-1">
                          {opt.desc}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Yêu cầu đối với Mentor */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                  Yêu cầu đối với Mentor (tùy chọn)
                </label>
                <span className="text-[11px] text-neutral-500">Bấm gợi ý để điền nhanh</span>
              </div>
              <Textarea
                rows={2}
                placeholder="Ví dụ: Đã qua môn ≥ 8.0, có kinh nghiệm đồ án, hỗ trợ bằng tiếng Anh..."
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
              />
              <div className="flex flex-wrap gap-1.5 pt-1">
                {QUICK_REQUIREMENTS.map((chip) => (
                  <Chip
                    key={chip}
                    size="sm"
                    onClick={() => handleAddRequirementChip(chip)}
                    className="cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs"
                  >
                    + {chip}
                  </Chip>
                ))}
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex items-center justify-between border-t border-neutral-100 dark:border-neutral-800 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSubject('');
                setContent('');
                setRequirements('');
                setModes(['online']);
                setAiMatches(null);
              }}
            >
              Đặt lại
            </Button>
            <Button type="submit" loading={searchMutation.isPending} leftIcon={<Sparkles className="w-4 h-4" />}>
              Phân tích &amp; Tìm Mentor AI
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* AI Matches Results */}
      {aiMatches && (
        <div className="space-y-4 pt-4">
          <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-brand-600" /> Kết quả Mentor phù hợp nhất ({aiMatches.length})
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {aiMatches.map((match) => (
              <AIResultCard
                key={match.mentorId}
                score={match.score}
                reasons={match.reasons}
              >
                <div className="space-y-4 pt-2">
                  <UserMiniCard userId={match.mentorId} showMajor />
                  <div className="flex items-center gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => navigate(`/users/${match.mentorId}`)}
                    >
                      Xem hồ sơ
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => setSelectedMentorId(match.mentorId)}
                      leftIcon={<Send className="w-3.5 h-3.5" />}
                    >
                      Gửi Request
                    </Button>
                  </div>
                </div>
              </AIResultCard>
            ))}
          </div>

          <div className="p-4 bg-neutral-50 dark:bg-neutral-900/60 rounded-lg flex items-center justify-between mt-6 border border-neutral-200 dark:border-neutral-800">
            <span className="text-sm text-neutral-600 dark:text-neutral-400">
              Chưa tìm được Mentor ưng ý?
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              >
                Chỉnh tiêu chí
              </Button>
              <Button size="sm" onClick={() => navigate('/mentoring/browse')} rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                Tự duyệt danh sách
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Dialog for sending request */}
      {selectedMentorId && (
        <SendMentoringRequestDialog
          open={Boolean(selectedMentorId)}
          onOpenChange={(open) => !open && setSelectedMentorId(null)}
          mentorId={selectedMentorId}
          initialTopic={subject}
          initialContent={
            content +
            (requirements ? `\n\n[Yêu cầu đối với Mentor]: ${requirements}` : '')
          }
        />
      )}
    </div>
  );
};

export default MentorAiSearchPage;
