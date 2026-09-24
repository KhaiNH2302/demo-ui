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
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { RadioGroup } from '@/components/ui/RadioGroup';
import { toast } from '@/components/ui/Toast';
import { Sparkles, ArrowRight, UserCheck, Clock, Send, Search } from 'lucide-react';
import { SendMentoringRequestDialog } from './SendMentoringRequestDialog';
import type { AiMentorMatch } from '@/types/entities';

export const MentorAiSearchPage: React.FC = () => {
  const navigate = useNavigate();

  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  const [mode, setMode] = useState<'online' | 'offline' | 'chat'>('online');

  const [aiMatches, setAiMatches] = useState<AiMentorMatch[] | null>(null);
  const [isAiError, setIsAiError] = useState(false);

  // Dialog State
  const [selectedMentorId, setSelectedMentorId] = useState<string | null>(null);

  const searchMutation = useMutation({
    mutationFn: () =>
      apiClient.post<AiMentorMatch[]>('/mentoring/ai-search', {
        subject,
        content,
        preferredTime,
        mode,
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !content.trim()) {
      toast.error('Vui lòng nhập môn học/lĩnh vực và nội dung cần hỗ trợ');
      return;
    }
    searchMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tìm Mentor thông minh bằng AI"
        description="Nhập nhu cầu học tập để AI phân tích và kết nối bạn với Mentor phù hợp nhất"
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
              <Sparkles className="w-4 h-4 text-primary" /> Tiêu chí tìm kiếm Mentor
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Môn học / Lĩnh vực cần trợ giúp" required>
                <Input
                  placeholder="Ví dụ: CSD201, PRJ301, Machine Learning..."
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                />
              </FormField>

              <FormField label="Khung giờ rảnh mong muốn">
                <Input
                  placeholder="Ví dụ: Tối Thứ 3, Chiều Thứ 7..."
                  value={preferredTime}
                  onChange={(e) => setPreferredTime(e.target.value)}
                />
              </FormField>
            </div>

            <FormField label="Nội dung chi tiết cần được hỗ trợ" required>
              <Textarea
                rows={3}
                placeholder="Mô tả cụ thể các thắc mắc, bài tập hoặc đồ án bạn đang gặp khó khăn..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
              />
            </FormField>

            <FormField label="Hình thức hỗ trợ mong muốn">
              <RadioGroup
                name="supportMode"
                value={mode}
                onChange={(val) => setMode(val as any)}
                options={[
                  { label: 'Học trực tuyến (Google Meet)', value: 'online' },
                  { label: 'Gặp trực tiếp tại trường', value: 'offline' },
                  { label: 'Trao đổi qua Chat / Q&A', value: 'chat' },
                ]}
              />
            </FormField>
          </CardContent>
          <CardFooter className="flex items-center justify-between border-t border-[var(--border-subtle)] pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSubject('');
                setContent('');
                setAiMatches(null);
              }}
            >
              Đặt lại
            </Button>
            <Button type="submit" loading={searchMutation.isPending}>
              <Sparkles className="w-4 h-4 mr-1.5" /> Phân tích & Tìm Mentor AI
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* AI Matches Results */}
      {aiMatches && (
        <div className="space-y-4 pt-4">
          <h3 className="text-base font-semibold text-[var(--text-main)] flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-primary" /> Kết quả Mentor phù hợp nhất ({aiMatches.length})
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
                  <div className="flex items-center gap-2 pt-2 border-t border-[var(--border-subtle)]">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => navigate(`/mentoring/mentors/${match.mentorId}`)}
                    >
                      Xem hồ sơ
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => setSelectedMentorId(match.mentorId)}
                    >
                      <Send className="w-3.5 h-3.5 mr-1" /> Gửi Request
                    </Button>
                  </div>
                </div>
              </AIResultCard>
            ))}
          </div>

          <div className="p-4 bg-[var(--surface-muted)] rounded-lg flex items-center justify-between mt-6">
            <span className="text-sm text-[var(--text-muted)]">Chưa tìm được Mentor ưng ý?</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                Chỉnh tiêu chí
              </Button>
              <Button size="sm" onClick={() => navigate('/mentoring/browse')}>
                Tự tìm Mentor <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Dialog for sending request */}
      {selectedMentorId && (
        <SendMentoringRequestDialog
          open={!!selectedMentorId}
          onOpenChange={() => setSelectedMentorId(null)}
          mentorId={selectedMentorId}
          initialTopic={subject}
          initialContent={content}
        />
      )}
    </div>
  );
};

export default MentorAiSearchPage;
